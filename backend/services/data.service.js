const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const aiModels = require('../ai/ai-models');
const { rankValues, numeric } = require('../utils/ranks');
const { ACTIVE_WINDOW_MINUTES } = require('../utils/activity');
const { cacheGetJson, cacheSetJson, cacheDel, cacheDelPattern, CACHE_TTL_SECONDS } = require('../utils/mem-cache');

const allDataKey      = (schoolId) => `public:get-all-data:${schoolId}`;
const systemConfigKey = (schoolId) => `public:system-config:${schoolId}`;
const schoolUiKey     = (schoolId) => `ui:html:${schoolId}:*`;

// ── ACTIVE SCHOOLS (real-time) ──
// Schools that have had authenticated activity within the last ACTIVE_WINDOW_MINUTES.
async function getActiveSchools() {
  const [rows] = await pool.execute(
    `SELECT id, school_name, school_logo, last_active_at
       FROM schools
      WHERE status = 'active'
        AND last_active_at >= NOW() - INTERVAL 5 MINUTE
      ORDER BY last_active_at DESC, id DESC
      LIMIT 100`
  );

  return {
    count:           rows.length,
    windowMinutes:   ACTIVE_WINDOW_MINUTES,
    schools:         rows.map((s) => ({
      id:             s.id,
      school_name:    s.school_name,
      school_logo:    s.school_logo || null,
      last_active_at: s.last_active_at,
    })),
  };
}

// ── SYSTEM CONFIG ──
async function getSystemConfig(schoolId) {
  const key = systemConfigKey(schoolId);
  const cached = await cacheGetJson(key);
  if (cached) return cached;

  const [config] = await pool.execute(
    'SELECT * FROM system_config WHERE school_id = ? ORDER BY id DESC LIMIT 1',
    [schoolId]
  );
  const result = config[0] || {};
  await cacheSetJson(key, result, CACHE_TTL_SECONDS.PUBLIC_SYSTEM_CONFIG);
  return result;
}

// ── ALL CONTEST DATA (settings + contestants + criteria) ──
async function getAllData(schoolId) {
  const key = allDataKey(schoolId);
  const cached = await cacheGetJson(key);
  if (cached) return cached;

  const [settings] = await pool.execute('SELECT * FROM settings WHERE school_id = ? LIMIT 1', [schoolId]);
  const [contestants] = await pool.execute('SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC', [schoolId]);
  const [criteria] = await pool.execute('SELECT * FROM criteria WHERE school_id = ?', [schoolId]);

  const result = {
    settings:    settings[0] || { contest_name: 'Event', judge_count: 3 },
    contestants,
    criteria,
  };
  await cacheSetJson(key, result, CACHE_TTL_SECONDS.PUBLIC_ALL_DATA);
  return result;
}

// Invalidates the Redis entries that mirror data written by the writes below.
async function invalidateSchoolCaches(schoolId, { system = false, ui = true } = {}) {
  await cacheDel(allDataKey(schoolId));
  if (system) await cacheDel(systemConfigKey(schoolId));
  if (ui)     await cacheDelPattern(schoolUiKey(schoolId));
}

// ── LEADERBOARD (average or rank-sum) ──
// Returns null when the school has no settings row yet, so callers decide
// how to respond (public route → empty array, protected route → 404).
//
// Rank modes:
//   computation_type = 'average' → rank each contestant's final average
//                                  (midrank ties).
//   computation_type = 'rank'    → per-judge ranks are summed; tied totals
//                                  share a midrank per judge and tied rank-sums
//                                  share a midrank in the final standings.
//   computation_type = 'custom'  → base calc = custom_base ('average' or
//                                  'rank'), ties ranked with
//                                  tie_break_method ('midrank' | 'shared' |
//                                  'sequential').
async function computeLeaderboard(schoolId) {
  const [settings] = await pool.execute(
    `SELECT computation_type, custom_base, tie_break_method, judge_count
       FROM settings
      WHERE school_id = ? LIMIT 1`,
    [schoolId]
  );

  if (!settings[0]) return null;

  const s        = settings[0];
  const base     = s.computation_type === 'custom' ? (s.custom_base || 'average') : s.computation_type;
  const tieBreak = s.computation_type === 'custom' ? (s.tie_break_method || 'midrank') : 'midrank';

  // ── AVERAGE MODE ─────────────────────────────────────────────────────────
  // FIX: divide by COUNT(DISTINCT judge_id) instead of the settings judge_count
  // value. This ensures the average is always correct regardless of how many
  // judges have actually submitted, and works correctly across all schools.
  if (base === 'average') {
    const [results] = await pool.execute(
      `SELECT c.id, c.name, c.entry_number,
              SUM(s.score_value) / COUNT(DISTINCT s.judge_id) AS final_score
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.school_id = ?
       GROUP  BY c.id`,
      [schoolId, schoolId]
    );

    const ranked = rankValues(
      results.map(r => ({ ...r, final_score: numeric(r.final_score), value: numeric(r.final_score) })),
      { method: tieBreak, ascending: false }
    );

    return ranked.map(r => ({
      id:            r.id,
      name:          r.name,
      entry_number:  r.entry_number,
      final_score:   r.final_score,
      rank:          r.rank,
    }));
  }

  // ── RANK-SUM MODE ─────────────────────────────────────────────────────────
  const [rawScores] = await pool.execute(
    `SELECT s.judge_id, s.contestant_id, c.name,
            SUM(s.score_value) AS judge_total
     FROM   scores      s
     JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
     WHERE  s.school_id = ?
     GROUP  BY s.judge_id, s.contestant_id`,
    [schoolId, schoolId]
  );

  const judgeScores = {};
  rawScores.forEach(s => {
    if (!judgeScores[s.judge_id]) judgeScores[s.judge_id] = [];
    judgeScores[s.judge_id].push(s);
  });

  const finalTallies = {};
  Object.values(judgeScores).forEach(scores => {
    // Per judge: rank contestants by total with the active tie-break method,
    // so tied totals share a midrank instead of getting sequential positions.
    const ranked = rankValues(
      scores.map(s => ({ ...s, value: numeric(s.judge_total) })),
      { method: tieBreak, ascending: false }
    );
    ranked.forEach(s => {
      if (!finalTallies[s.contestant_id]) {
        finalTallies[s.contestant_id] = { id: s.contestant_id, name: s.name, total_rank: 0 };
      }
      finalTallies[s.contestant_id].total_rank += s.rank;
    });
  });

  // Final standings: lowest rank-sum wins; equal rank-sums share the next
  // available midrank so e.g. two tied sums of 3.5 become 1.5 / 1.5 / 3.
  const final = rankValues(
    Object.values(finalTallies).map(t => ({ ...t, value: numeric(t.total_rank) })),
    { method: tieBreak, ascending: true }
  );

  return final.map(t => ({
    id:           t.id,
    name:         t.name,
    total_rank:   t.total_rank,
    rank:         t.rank,
  }));
}

// ── JUDGE IDS ──
async function getJudgeIds(schoolId) {
  const [rows] = await pool.execute(
    `SELECT DISTINCT judge_id
     FROM   scores
     WHERE  school_id = ?
     ORDER  BY judge_id ASC`,
    [schoolId]
  );
  return rows.map(r => r.judge_id);
}

// ── CONTESTANT TOTALS FOR A SINGLE JUDGE ──
async function getJudgeScores(schoolId, judgeId) {
  const [settings] = await pool.execute(
    `SELECT computation_type, tie_break_method FROM settings WHERE school_id = ? LIMIT 1`,
    [schoolId]
  );
  const tieBreak = settings[0]?.computation_type === 'custom'
    ? (settings[0].tie_break_method || 'midrank')
    : 'midrank';

  const [scores] = await pool.execute(
    `SELECT c.id, c.name, c.entry_number, SUM(s.score_value) AS total
     FROM   scores      s
     JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
     WHERE  s.judge_id  = ? AND s.school_id = ?
     GROUP  BY c.id`,
    [schoolId, judgeId, schoolId]
  );

  const ranked = rankValues(
    scores.map(r => ({ ...r, total: numeric(r.total), value: numeric(r.total) })),
    { method: tieBreak, ascending: false }
  );

  return ranked.map(r => ({
    id:           r.id,
    name:         r.name,
    entry_number: r.entry_number,
    total:        r.total,
    rank:         r.rank,
  }));
}

// ── RESET ALL DATA FOR A SCHOOL (transaction) ──
async function resetData(schoolId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM scores       WHERE school_id = ?', [schoolId]);
    await connection.execute('DELETE FROM ui_cache     WHERE school_id = ?', [schoolId]);
    await connection.execute('DELETE FROM contestants  WHERE school_id = ?', [schoolId]);
    await connection.execute('DELETE FROM criteria     WHERE school_id = ?', [schoolId]);
    await connection.execute('DELETE FROM generations  WHERE school_id = ?', [schoolId]);
    await connection.execute(
      `UPDATE settings SET contest_name = '', judge_count = 3, ai_prompt = 'Modern and Professional',
       ai_model = 'codestral-latest', ai_provider = 'unorouter',
       computation_type = 'average', custom_base = 'average', tie_break_method = 'midrank',
       contest_type = 'pageant', is_judge_locked = 0, ui_mode = 'ai'
       WHERE school_id = ?`,
      [schoolId]
    );
    await connection.commit();
    await invalidateSchoolCaches(schoolId);
    return { success: true, message: 'All data for your school has been cleared.' };
  } catch (err) {
    await connection.rollback();
    throw new HttpError(500, 'Failed to reset database: ' + err.message);
  } finally {
    connection.release();
  }
}

// ── SAVE CONTEST CONFIG (transaction) ──
async function saveConfig(schoolId, body) {
  const {
    contest_name, judge_count, ai_prompt, contestants,
    criteria, computation_type, contest_type, is_judge_locked,
    custom_base, tie_break_method, ai_model, ai_provider, ui_mode,
  } = body;

  console.log(`💾 [saveConfig] school=${schoolId} provider=${ai_provider} prompt="${ai_prompt?.slice(0,60)}..." model=${ai_model} ui_mode=${ui_mode} contestants=${contestants?.length} criteria=${criteria?.length}`);

  // Diff helpers — skip delete/re-insert (and the score wipe + judge UI
  // refresh that follows) when the incoming row set already matches the DB
  // exactly. Saving the same config repeatedly must be a true no-op.
  const rowsEqual = (dbRows, incoming) => {
    if (incoming.length !== dbRows.length) return false;
    return incoming.every((row, i) => {
      const db = dbRows[i];
      const a = String(row.name || '').trim();
      const b = String(db.name || '').trim();
      if (a !== b) return false;
      const av = row.entry_number !== undefined ? Number(row.entry_number) : 0;
      const bv = db.entry_number !== undefined ? Number(db.entry_number) : db.entry_number;
      return av === Number(bv) || Number.isNaN(bv);
    });
  };
  const criteriaEqual = (dbRows, incoming) => {
    if (incoming.length !== dbRows.length) return false;
    return incoming.every((row, i) => {
      const db = dbRows[i];
      const a = String(row.name || '').trim();
      const b = String(db.name || '').trim();
      if (a !== b) return false;
      const av = row.percentage !== undefined ? Number(row.percentage) : 0;
      const bv = Number(db.percentage) || 0;
      return av === bv;
    });
  };

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Track whether anything the judge table renders on actually changed, so we
    // can reset the persisted AI UI cache (ui_cache) on exactly those saves.
    let promptChanged = false;
    let modelChanged = false;
    let providerChanged = false;
    let modeChanged = false;

    // Use explicit UPDATE instead of INSERT ... ON DUPLICATE KEY UPDATE VALUES()
    // VALUES() is deprecated in MySQL 8+ and causes unpredictable multi-row updates
    const [existing] = await connection.execute(
      'SELECT id, ai_prompt, ai_model, ai_provider, ui_mode FROM settings WHERE school_id = ? LIMIT 1',
      [schoolId]
    );

    // Partial updates (e.g. lock/unlock sends ONLY is_judge_locked) must not
    // wipe the other stored settings, so only include fields the client
    // actually supplied in the UPDATE.
    const scalarFields = {
      contest_name:     () => contest_name ?? '',
      contest_type:     () => contest_type ?? 'pageant',
      judge_count:      () => judge_count ?? 3,
      ai_prompt:        () => ai_prompt ?? '',
      ai_model:         () => ai_model ?? 'codestral-latest',
      ai_provider:      () => ai_provider ?? 'unorouter',
      ui_mode:          () => ui_mode ?? 'ai',
      computation_type: () => computation_type ?? 'average',
      custom_base:      () => custom_base ?? 'average',
      tie_break_method: () => tie_break_method ?? 'midrank',
      is_judge_locked:  () => is_judge_locked ?? 0,
    };

    // Backend validation — never trust frontend values. When the admin saves an
    // AI provider and/or model, the resulting combination MUST be one of the
    // allowed ones from the centralized config (UnoRouter/Gemini + their
    // configured model ids). Invalid pairs are rejected outright.
    if (Object.prototype.hasOwnProperty.call(body, 'ai_provider') ||
        Object.prototype.hasOwnProperty.call(body, 'ai_model')) {
      const currentProvider = ai_provider || existing[0]?.ai_provider || 'unorouter';
      const currentModel = ai_model || existing[0]?.ai_model || 'codestral-latest';
      try {
        aiModels.assertValidProviderModel(currentProvider, currentModel);
      } catch (err) {
        throw new HttpError(400, err.message);
      }
    }

    if (existing.length > 0) {
      // Row exists — UPDATE only this school's row, and only the columns
      // present in the request body so sparse saves can't wipe other settings.
      const updates = Object.keys(scalarFields)
        .filter((field) => Object.prototype.hasOwnProperty.call(body, field));
      const assignments = updates.map((field) => `${field} = ?`).join(', ');

      if (updates.length === 0) {
        throw new HttpError(400, 'No settings fields provided.');
      }

      if (updates.includes('ai_prompt')) {
        promptChanged = (ai_prompt ?? '') !== (existing[0]?.ai_prompt ?? '');
      }
      if (updates.includes('ai_model')) {
        modelChanged = (ai_model ?? 'codestral-latest') !== (existing[0]?.ai_model || 'codestral-latest');
      }
      if (updates.includes('ai_provider')) {
        providerChanged = (ai_provider ?? 'unorouter') !== (existing[0]?.ai_provider || 'unorouter');
      }
      if (updates.includes('ui_mode')) {
        modeChanged = (ui_mode ?? 'ai') !== (existing[0]?.ui_mode || 'ai');
      }

      console.log(`📝 [saveConfig] UPDATE fields=${updates.join(',')} promptChanged=${promptChanged} modelChanged=${modelChanged} providerChanged=${providerChanged} modeChanged=${modeChanged}`);

      await connection.execute(
        `UPDATE settings SET ${assignments} WHERE school_id = ?`,
        [...updates.map((field) => scalarFields[field]()), schoolId]
      );
    } else {
      // No row yet — INSERT a fresh one
      if (ai_prompt)   promptChanged = true;
      if (ai_model)    modelChanged = true;
      if (ai_provider) providerChanged = true;
      if (ui_mode)     modeChanged = true;
      console.log(`📝 [saveConfig] INSERT new row promptChanged=${promptChanged} modelChanged=${modelChanged} providerChanged=${providerChanged} modeChanged=${modeChanged}`);
      await connection.execute(
        `INSERT INTO settings
           (school_id, contest_name, contest_type, judge_count, ai_prompt, ai_model, ai_provider, ui_mode,
            computation_type, custom_base, tie_break_method, is_judge_locked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          contest_name     ?? '',
          contest_type     ?? 'pageant',
          judge_count      ?? 3,
          ai_prompt        ?? '',
          ai_model         ?? 'codestral-latest',
          ai_provider      ?? 'unorouter',
          ui_mode          ?? 'ai',
          computation_type ?? 'average',
          custom_base      ?? 'average',
          tie_break_method ?? 'midrank',
          is_judge_locked  ?? 0,
        ]
      );
    }

    const waiting = [];
    let renderDataChanged = false;

    if (contestants !== undefined && criteria !== undefined) {
      const [existingContestants] = await connection.execute(
        'SELECT id, name, entry_number FROM contestants WHERE school_id = ? ORDER BY entry_number ASC, id ASC',
        [schoolId]
      );
      const [existingCriteria] = await connection.execute(
        'SELECT id, name, percentage FROM criteria WHERE school_id = ? ORDER BY id ASC',
        [schoolId]
      );
      const contestantsChanged = !rowsEqual(existingContestants, contestants);
      const criteriaChanged    = !criteriaEqual(existingCriteria, criteria);

      if (contestantsChanged || criteriaChanged || promptChanged || modelChanged || providerChanged || modeChanged) {
        // Contestants/criteria are deleted and re-inserted below with NEW ids,
        // so any existing scores (which reference the old ids) must be wiped
        // first or the foreign keys fk_scores_contestant / fk_scores_criteria
        // will reject fresh submissions with "Cannot add or update a child row".
        await connection.execute('DELETE FROM scores WHERE school_id = ?', [schoolId]);
      }

      if (contestantsChanged || criteriaChanged || promptChanged || modelChanged || providerChanged || modeChanged) {
        // The judge's rendered table depends on the prompt, the criteria and
        // the contestant list — when any of those change, the persisted AI UI
        // is stale (old layout, missing/reordered rows, old percentages).
        // Wipe it here so the next judge load builds fresh instead of serving
        // the previous generation.
        renderDataChanged = true;
        await connection.execute('DELETE FROM ui_cache WHERE school_id = ?', [schoolId]);
      }

      if (contestantsChanged) {
        await connection.execute('DELETE FROM contestants WHERE school_id = ?', [schoolId]);
        for (const c of contestants) {
          waiting.push([
            'INSERT INTO contestants (school_id, name, entry_number) VALUES (?, ?, ?)',
            [schoolId, c.name || 'Unnamed', c.entry_number || 0],
          ]);
        }
      }

      if (criteriaChanged) {
        await connection.execute('DELETE FROM criteria WHERE school_id = ?', [schoolId]);
        for (const cr of criteria) {
          waiting.push([
            'INSERT INTO criteria (school_id, name, percentage) VALUES (?, ?, ?)',
            [schoolId, cr.name || 'New Criteria', cr.percentage || 0],
          ]);
        }
      }
    } else {
      // Single-list saves (e.g. partial payloads) — keep legacy behavior:
      // clear scores and rebuild whichever list was supplied.
      if (contestants !== undefined || criteria !== undefined) {
        await connection.execute('DELETE FROM scores WHERE school_id = ?', [schoolId]);
        renderDataChanged = true;
      }

      if (contestants !== undefined) {
        await connection.execute('DELETE FROM contestants WHERE school_id = ?', [schoolId]);
        for (const c of contestants) {
          waiting.push([
            'INSERT INTO contestants (school_id, name, entry_number) VALUES (?, ?, ?)',
            [schoolId, c.name || 'Unnamed', c.entry_number || 0],
          ]);
        }
      }

      if (criteria !== undefined) {
        await connection.execute('DELETE FROM criteria WHERE school_id = ?', [schoolId]);
        for (const cr of criteria) {
          waiting.push([
            'INSERT INTO criteria (school_id, name, percentage) VALUES (?, ?, ?)',
            [schoolId, cr.name || 'New Criteria', cr.percentage || 0],
          ]);
        }
      }
    }

    // Clear ui_cache on EVERY save so judges never see stale AI designs
    // after any config change (mode switch, prompt tweak, model swap, etc.)
    await connection.execute('DELETE FROM ui_cache WHERE school_id = ?', [schoolId]);

    for (const [sql, vals] of waiting) {
      await connection.execute(sql, vals);
    }

    await connection.commit();
    await invalidateSchoolCaches(schoolId);

    return { success: true, message: 'Configuration saved!' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ── SAVE SYSTEM CONFIG ──
async function saveSystemConfig(schoolId, body) {
  const {
    school_name, portal_name, school_logo, background_logo,
    primary_color, secondary_color, footer_text, logo_radius,
    header_template,
  } = body;

  await pool.execute(
    `INSERT INTO system_config
       (school_id, school_name, portal_name, school_logo, background_logo,
        primary_color, secondary_color, footer_text, logo_radius, header_template)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       school_name     = VALUES(school_name),
       portal_name     = VALUES(portal_name),
       school_logo     = VALUES(school_logo),
       background_logo = VALUES(background_logo),
       primary_color   = VALUES(primary_color),
       secondary_color = VALUES(secondary_color),
       footer_text     = VALUES(footer_text),
       logo_radius     = VALUES(logo_radius),
       header_template = VALUES(header_template)`,
    [
      schoolId,
      school_name     || null,
      portal_name     || null,
      school_logo     || null,
      background_logo || null,
      primary_color   || '#22c55e',
      secondary_color || '#0f172a',
      footer_text     || null,
      logo_radius     != null ? Number(logo_radius) : 12,
      header_template || 'structured',
    ]
  );

  await invalidateSchoolCaches(schoolId, { system: true, ui: false });

  return { success: true, message: 'System configuration updated.' };
}

module.exports = {
  getSystemConfig,
  getAllData,
  getActiveSchools,
  computeLeaderboard,
  getJudgeIds,
  getJudgeScores,
  resetData,
  saveConfig,
  saveSystemConfig,
};