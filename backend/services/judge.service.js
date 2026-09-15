const crypto = require('crypto');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { rankValues, numeric } = require('../utils/ranks');
const { generateWithFallback } = require('../config/ai');

// ONLY selects whose id matches a real criterion get normalised.
const SCORE_SELECT_RE = /<select([^>]*?\bid=['"]score[\w-]*['"])([\s\S]*?)<\/select>/gi;

function buildOptions(max) {
  let opts = '<option value="">-</option>';
  for (let i = 0; i <= max; i++) opts += `<option value="${i}">${i}</option>`;
  return opts;
}

// ── Deterministic dropdown repair ────────────────────────────────────────────
// LLMs routinely emit dropdowns with a hard-coded 0-100 (or 1-100) range no
// matter what the prompt says. After every cached / generated read we rebuild
// every .score-dropdown so the options ALWAYS run 0..criterion.percentage
// (e.g. a 25% criterion gets 0-25, never 0-100). This guarantees the judge UI
// is correct even when the AI output is garbage, and is what the frontend's
// hydrator already does on top.
function normalizeDropdownRanges(html, criteria) {
  if (!html || !Array.isArray(criteria) || !html.includes('select')) return html;
  const maxByCriterion = {};
  criteria.forEach((c) => {
    if (c && c.id !== undefined && c.id !== null) {
      maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
    }
  });
  return html.replace(SCORE_SELECT_RE, (match, attrs, inner) => {
    const attrsCs = String(attrs);
    const idMatch = attrsCs.match(/\bid=['"]score([\w-]*)['"]/);
    if (!idMatch) return match;
    const critId = `score${idMatch[1]}`.split('-')[2] || null;
    const max = critId && maxByCriterion[critId] !== undefined ? maxByCriterion[critId] : null;
    if (max === null) return match;
    return `<select${attrsCs}>${buildOptions(max)}</select>`;
  });
}

// ── Deterministic fallback table (no AI required) ───────────────────────────
// Plain, self-styled scoring table that is ALWAYS available. Used whenever
// the AI pipeline is unavailable / slow so the judge can start scoring right
// away instead of sitting on a spinner forever. Dropdowns are 0..percentage.
function buildScoreTableHtml({ contestants, criteria }) {
  if (!Array.isArray(contestants) || !Array.isArray(criteria)) return '';
  if (!contestants.length || !criteria.length) return '';

  const maxByCriterion = {};
  criteria.forEach((c) => {
    if (c.id !== undefined && c.id !== null) {
      maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
    }
  });

  const head = criteria
    .map((c) => `<th class="px-3 py-2 text-xs sm:text-sm font-semibold">${String(c.name || '')}<br/><span class="text-[10px] opacity-70">${Number(c.percentage) || 0}%</span></th>`)
    .join('');
  const rows = contestants
    .map((c) => {
      const cells = criteria
        .map((cr) => {
          const max = maxByCriterion[String(cr.id)] ?? 100;
          return `<td class="px-2 py-1.5 text-center"><select class="score-dropdown w-20 rounded border border-slate-300 bg-slate-50 px-1 py-1 text-center text-xs text-slate-800" id="score-${c.id}-${cr.id}">${buildOptions(max)}</select></td>`;
        })
        .join('');
      return `<tr class="border-b border-slate-100"><td class="px-2 py-1.5 text-center text-sm text-slate-500">${Number(c.entry_number) || ''}</td><td class="px-3 py-1.5 text-sm font-medium text-slate-800">${String(c.name || '')}</td>${cells}<td class="px-3 py-1.5 text-center font-semibold text-slate-800" id="total-${c.id}">0.00</td><td class="px-3 py-1.5 text-center font-semibold text-slate-800" id="rank-${c.id}">-</td></tr>`;
    })
    .join('');

  return `<div class="overflow-x-auto"><table class="w-full border-collapse bg-white text-left"><thead><tr class="bg-slate-100 text-slate-700">${head}<th class="px-3 py-2 text-xs sm:text-sm font-semibold">Total</th><th class="px-3 py-2 text-xs sm:text-sm font-semibold">Rank</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── Strip anything that is not part of the scoring grid ─────────────────────
// Judges already have their own Submit button + status UI, so any <form>,
// <button>, or <input> an LLM sneaks into the table is removed (balanced
// open/close removal so rows containing them aren't mangled). It also forces
// the number cell to show the literal entry number: if the LLM writes
// "Candidate 1" / "#1 / name" etc., it is rewritten to exactly "1".
function purgeNonScoringElements(html, contestants) {
  if (!html) return html;
  const str = String(html);
  const hasForm    = str.includes('<form');
  const hasButton  = str.includes('<button');
  const hasInput   = str.includes('<input');
  const hasCand    = /[Cc]andidate/.test(str);
  if (!hasForm && !hasButton && !hasInput && !hasCand) return str;
  let out = str;

  // Remove forms/inputs/buttons. A button's label is ALWAYS dropped (the judge
  // page already has its own submit button); inner content is kept only when it
  // carries real structure (e.g. a table element wrapped in a stray <button>).
  out = out.replace(/<form\b[^>]*>/gi, '');
  out = out.replace(/<\/form>/gi, '');
  out = out.replace(/<input\b[^>]*\/?>/gi, '');
  const buttonRe = /<button\b([^>]*)>([\s\S]*?)(?:<\/button>|$)/gi;
  out = out.replace(buttonRe, (m, attrs, inner) => {
    if (/<table\b|<select|<\/button/i.test(inner)) return inner;
    return '';
  });

  // Fix placeholder number cells rendered beyond the entry number.
  out = out.replace(
    />Candidate\s+#?(\d+)</gi,
    (m, num) => `>${num}<`
  );
  out = out.replace(
    />#(\d+)\s*<\/t[dh]>/gi,
    (m, num) => `>${num}</t${m.includes('/td') ? 'd' : 'h'}>`
  );

  // If a "No."-style cell contains "Candidate <n>" as text, exact the number.
  const candidateCell = /(No[.,]?\s*[:|-]?\s*Candidates?\s*)(#?\d+)/gi;
  out = out.replace(candidateCell, (m, prefixVal, num) => num.replace('#', ''));

  return out;
}

// ── Prepare: validate input + check ui_cache, one source of hash logic ──────
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

  // Deterministic, EXACTLY the same "id:percentage" signature the frontend
  // sends to /judge/render-ui-cached and getCachedUI() hashes with. Keeping
  // this identical is what lets the background cache refresh actually hit the
  // rows renderUI() saved — otherwise every load misses the cache and
  // re-triggers an expensive AI generation.
  const criteriaSignature = criteria
    .map((c) => `${c.id}:${c.percentage || 0}`)
    .join(',');

  const configHash = crypto.createHash('md5')
    .update(finalDesignGoal + criteriaSignature + String(school_id))
    .digest('hex');

  const [cache] = await pool.execute(
    'SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?',
    [configHash, school_id]
  );

  return {
    settings,
    finalDesignGoal,
    configHash,
    html: cache.length > 0
      ? normalizeDropdownRanges(purgeNonScoringElements(cache[0].html_content, contestants), criteria)
      : null,
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
    - The No. column MUST show ONLY the literal entry number (1, 2, 3, …). Never prefix it with "Candidate", "#", "No." etc. If the contestant is number 1, that cell must contain exactly "1".
    - Each criteria column header MUST show name AND percentage: "Performance (60%)"
    - Dropdowns must have options from the criterion's percentage down to 0 in DESCENDING order (e.g. a 25% criterion gets exactly 25, 24, 23, ... 1, 0; a 100% criterion gets 100, 99, ... 1, 0). NEVER use a hard-coded 0-100 or 1-100 range. class="score-dropdown" id="score-{cId}-{crId}"
    - Every <option> MUST have a numeric value attribute matching its text: <option value="25">25</option>. No empty or duplicate values.
    - Totals: id="total-{cId}"
    - Ranks: id="rank-{cId}"

    [OUTPUT]: Return ONLY a <div> with a Tailwind <table>. No markdown. Do NOT include any <button>, <form>, or <input> elements — the scoring page already provides its own Submit button.
  `;

  const tableHTML = await generateWithFallback(aiInstruction);
  const cleanTable = tableHTML.replace(/```html/g, '').replace(/```/g, '').trim();

  // Never trust the LLM's option ranges or stray elements — repair every
  // dropdown to 0..percentage, drop buttons/forms/inputs, and pin the No.
  // column to the exact entry number before the result is cached and shown.
  const finalTable = normalizeDropdownRanges(
    purgeNonScoringElements(cleanTable, contestants),
    criteria
  );

  await pool.execute(
    `INSERT INTO ui_cache (prompt_hash, school_id, html_content)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       html_content = VALUES(html_content)`,
    [prep.configHash, school_id, finalTable]
  );

  return { html: finalTable, promptHash: prep.configHash };
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

  const [settings] = await pool.execute(
    'SELECT computation_type, tie_break_method FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );
  const tieBreak = settings[0]?.computation_type === 'custom'
    ? (settings[0].tie_break_method || 'midrank')
    : 'midrank';

  const [rankings] = await pool.execute(
    `SELECT c.id, c.name, SUM(s.score_value) as total
     FROM   scores      s
     JOIN   contestants c ON s.contestant_id = c.id AND c.school_id = ?
     WHERE  s.judge_id  = ? AND s.school_id = ?
     GROUP  BY c.id, c.name`,
    [schoolId, judgeId, schoolId]
  );

  const ranked = rankValues(
    rankings.map(r => ({ ...r, total: numeric(r.total), value: numeric(r.total) })),
    { method: tieBreak, ascending: false }
  );

  return ranked.map(r => ({
    id:    r.id,
    name:  r.name,
    total: r.total,
    rank:  r.rank,
  }));
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
// Returns a deterministic table when nothing is cached so the judge UI is
// never blocked waiting for AI — the config just has to exist in the DB.
async function getCachedUI(schoolId, criteriaSignature) {
  if (!schoolId) throw new HttpError(400, 'school_id is required.');

  const [settings] = await pool.execute(
    'SELECT ai_prompt FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );
  const aiPrompt = settings[0]?.ai_prompt || 'Modern and Professional';

  const configHash = crypto.createHash('md5')
    .update(aiPrompt + criteriaSignature + String(schoolId))
    .digest('hex');

  const [cache] = await pool.execute(
    'SELECT html_content FROM ui_cache WHERE prompt_hash = ? AND school_id = ?',
    [configHash, schoolId]
  );

  if (cache.length > 0) {
    const [criteriaRows] = await pool.execute(
      'SELECT * FROM criteria WHERE school_id = ?',
      [schoolId]
    );
    const [contestants] = await pool.execute(
      'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC',
      [schoolId]
    );
    return {
      html: normalizeDropdownRanges(
        purgeNonScoringElements(cache[0].html_content, contestants),
        criteriaRows
      ),
      fromCache: true,
    };
  }

  const [contestants] = await pool.execute(
    'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC',
    [schoolId]
  );
  const [criteria] = await pool.execute(
    'SELECT * FROM criteria WHERE school_id = ?',
    [schoolId]
  );

  return {
    html:      buildScoreTableHtml({ contestants, criteria }) || '',
    fromCache: false,
  };
}

module.exports = {
  prepareRender,
  renderUI,
  submitScores,
  getMyScores,
  getMyScoresRaw,
  getCachedUI,
  buildScoreTableHtml,
  normalizeDropdownRanges,
  purgeNonScoringElements,
};