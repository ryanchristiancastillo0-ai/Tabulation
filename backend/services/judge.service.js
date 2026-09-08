const crypto = require('crypto');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { generateWithFallback } = require('../config/ai');

// ── Prepare: validate input + check ui_cache, one source of hash logic ──────
// Returns the settings, resolved design goal, config hash, and the cached html
// (or null). Shared by the real-time path (renderUI) and the async queue path.
async function prepareRender({ contestants, criteria, aiPrompt, school_id }) {
  if (!school_id) throw new HttpError(400, 'school_id is required.');
  if (!contestants?.length || !criteria?.length) {
    throw new HttpError(400, 'contestants and criteria are required.');
  }

  const [rows] = await pool.execute(
    'SELECT contest_name, ai_prompt FROM settings WHERE school_id = ? LIMIT 1',
    [school_id]
  );
  const settings = rows[0] || { contest_name: 'Event', ai_prompt: 'Modern and Professional' };
  const finalDesignGoal = aiPrompt || settings.ai_prompt || 'Modern and Professional';

  const configHash = crypto.createHash('md5')
    .update(finalDesignGoal + JSON.stringify(criteria) + String(school_id))
    .digest('hex');

  const [cache] = await pool.execute(
    'SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?',
    [configHash, school_id]
  );

  return {
    settings,
    finalDesignGoal,
    configHash,
    html: cache.length > 0 ? cache[0].html_content : null,
  };
}

// ── RENDER JUDGE SCORING TABLE (AI-generated) ──
async function renderUI({ contestants, criteria, aiPrompt, school_id }) {
  const prep = await prepareRender({ contestants, criteria, aiPrompt, school_id });

  if (prep.html) {
    return { html: prep.html, promptHash: prep.configHash };
  }

  const aiInstruction = `
    Act as a Senior Tailwind Developer.
    [THEME]: "${prep.finalDesignGoal}"

    [COLOR SCHEME]:
    - Derive a Tailwind color palette from the theme name.
    - Dark themes (navy, charcoal, dark): use bg-gray-900 or bg-slate-900 for surfaces.
    - Gold accent = use yellow-400 or amber-400 for text and borders.
    - Light themes: use bg-gray-50 surfaces with gray-900 text.

    [FORM ELEMENT RULES — CRITICAL]:
    - Every <select> must use Tailwind classes only — NO inline styles.
    - The bg class on <select> MUST match the table/surface bg (e.g. bg-slate-900).
    - The text class must contrast strongly (e.g. text-yellow-400 on bg-slate-900).
    - Example for dark navy + gold:
        <select class="score-dropdown bg-slate-900 text-yellow-400 border border-yellow-400 rounded px-2 py-1" id="score-{cId}-{crId}">
          <option class="bg-slate-900 text-yellow-400">95</option>
        </select>
    - Example for light theme:
        <select class="score-dropdown bg-gray-50 text-gray-900 border border-gray-300 rounded px-2 py-1">
          <option class="bg-gray-50 text-gray-900">95</option>
        </select>
    - ALWAYS add the same bg and text classes to every <option> — browsers ignore parent styles on options.

    [CONTEXT]:
    - Contest: ${prep.settings.contest_name}
    - Data: ${JSON.stringify(contestants.map(c => ({ id: c.id, n: c.name, num: c.entry_number })))}
    - Criteria: ${JSON.stringify(criteria.map(cr => ({ id: cr.id, name: cr.name, percentage: cr.percentage })))}

    [MANDATORY]:
    - Render EXACTLY ${contestants.length} rows.
    - Columns: No., Name, ${criteria.map(c => `${c.name} (${c.percentage}%)`).join(', ')}, Total, Rank.
    - Each criteria column header MUST show name AND percentage: "Performance (60%)"
    - Dropdowns must have options from 0 to the criterion's percentage (e.g. a 25% criterion gets 0–25; 100% gets 0–100). class="score-dropdown" id="score-{cId}-{crId}"
    - Totals: id="total-{cId}"
    - Ranks: id="rank-{cId}"

    [OUTPUT]: Return ONLY a <div> with a Tailwind <table>. No markdown.
  `;

  const tableHTML = await generateWithFallback(aiInstruction);
  const cleanTable = tableHTML.replace(/```html/g, '').replace(/```/g, '').trim();

  await pool.execute(
    `INSERT INTO ui_cache (prompt_hash, school_id, html_content)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       html_content = VALUES(html_content)`,
    [prep.configHash, school_id, cleanTable]
  );

  return { html: cleanTable, promptHash: prep.configHash };
}

// ── SUBMIT SCORES (transaction) ──
async function submitScores({ judgeId, scores, school_id }) {
  if (!judgeId || !scores) throw new HttpError(400, 'Missing Judge ID or Scores');
  if (!school_id) throw new HttpError(400, 'Missing school_id');
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new HttpError(400, 'Scores array is empty');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const sql = `
      INSERT INTO scores (school_id, judge_id, contestant_id, criterion_id, score_value)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)
    `;
    for (const s of scores) {
      await connection.execute(sql, [school_id, judgeId, s.contestantId, s.criterionId, s.value]);
    }
    await connection.commit();
    return { success: true, message: 'Scores successfully saved' };
  } catch (dbErr) {
    await connection.rollback();
    throw dbErr;
  } finally {
    connection.release();
  }
}

// ── MY SCORES (contestant totals for a judge) ──
async function getMyScores(schoolId, judgeId) {
  if (!judgeId) throw new HttpError(400, 'Judge ID is required');
  if (!schoolId) throw new HttpError(400, 'school_id is required');

  const [rankings] = await pool.execute(
    `SELECT c.name, SUM(s.score_value) as total
     FROM   scores      s
     JOIN   contestants c ON s.contestant_id = c.id AND c.school_id = ?
     WHERE  s.judge_id  = ? AND s.school_id = ?
     GROUP  BY c.id, c.name
     ORDER  BY total DESC`,
    [schoolId, judgeId, schoolId]
  );
  return rankings;
}

// ── MY RAW SCORES (for UI persistence) ──
async function getMyScoresRaw(schoolId, judgeId) {
  if (!schoolId) throw new HttpError(400, 'school_id is required');

  const [scores] = await pool.execute(
    `SELECT contestant_id, criterion_id, score_value
     FROM   scores
     WHERE  judge_id   = ? AND school_id = ?`,
    [judgeId, schoolId]
  );
  return scores;
}

// ── CACHED UI (no AI, safe for background refresh) ──
async function getCachedUI(schoolId, criteriaSignature) {
  if (!schoolId) throw new HttpError(400, 'school_id is required.');

  const [rows] = await pool.execute(
    'SELECT ai_prompt FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );
  const aiPrompt = rows[0]?.ai_prompt || 'Modern and Professional';

  const configHash = crypto.createHash('md5')
    .update(aiPrompt + criteriaSignature + String(schoolId))
    .digest('hex');

  const [cache] = await pool.execute(
    'SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?',
    [configHash, schoolId]
  );

  if (cache.length > 0) {
    return { html: cache[0].html_content, fromCache: true };
  }

  // Nothing in DB — tell the client to do a full POST instead
  return { fromCache: false };
}

module.exports = {
  prepareRender,
  renderUI,
  submitScores,
  getMyScores,
  getMyScoresRaw,
  getCachedUI,
};