const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { ACTIVE_WINDOW_MINUTES } = require('../utils/activity');
const { cacheGetJson, cacheSetJson, cacheDel, cacheDelPattern, CACHE_TTL_SECONDS } = require('../utils/redis-cache');

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
async function computeLeaderboard(schoolId) {
  const [settings] = await pool.execute(
    'SELECT computation_type, judge_count FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );

  if (!settings[0]) return null;

  const { computation_type: type } = settings[0];

  // ── AVERAGE MODE ─────────────────────────────────────────────────────────
  // FIX: divide by COUNT(DISTINCT judge_id) instead of the settings judge_count
  // value. This ensures the average is always correct regardless of how many
  // judges have actually submitted, and works correctly across all schools.
  if (type === 'average') {
    const [results] = await pool.execute(
      `SELECT c.name,
              SUM(s.score_value) / COUNT(DISTINCT s.judge_id) AS final_score
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.school_id = ?
       GROUP  BY c.id
       ORDER  BY final_score DESC`,
      [schoolId, schoolId]
    );
    return results;
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

  const judgeRanks = {};
  rawScores.forEach(s => {
    if (!judgeRanks[s.judge_id]) judgeRanks[s.judge_id] = [];
    judgeRanks[s.judge_id].push(s);
  });

  const finalTallies = {};
  Object.values(judgeRanks).forEach(scores => {
    scores.sort((a, b) => b.judge_total - a.judge_total);
    scores.forEach((s, index) => {
      if (!finalTallies[s.contestant_id]) {
        finalTallies[s.contestant_id] = { name: s.name, total_rank: 0 };
      }
      finalTallies[s.contestant_id].total_rank += index + 1;
    });
  });

  return Object.values(finalTallies).sort((a, b) => a.total_rank - b.total_rank);
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
  const [scores] = await pool.execute(
    `SELECT c.name, SUM(s.score_value) AS total
     FROM   scores      s
     JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
     WHERE  s.judge_id  = ? AND s.school_id = ?
     GROUP  BY c.id
     ORDER  BY total DESC`,
    [schoolId, judgeId, schoolId]
  );
  return scores;
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
    await connection.execute(
      `UPDATE settings SET contest_name = '', judge_count = 3, ai_prompt = 'Modern and Professional',
       computation_type = 'average', contest_type = 'pageant', is_judge_locked = 0
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
  } = body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Use explicit UPDATE instead of INSERT ... ON DUPLICATE KEY UPDATE VALUES()
    // VALUES() is deprecated in MySQL 8+ and causes unpredictable multi-row updates
    const [existing] = await connection.execute(
      'SELECT id FROM settings WHERE school_id = ? LIMIT 1',
      [schoolId]
    );

    if (existing.length > 0) {
      // Row exists — UPDATE only this school's row
      await connection.execute(
        `UPDATE settings SET
           contest_name     = ?,
           contest_type     = ?,
           judge_count      = ?,
           ai_prompt        = ?,
           computation_type = ?,
           is_judge_locked  = ?
         WHERE school_id = ?`,
        [
          contest_name     ?? '',
          contest_type     ?? 'pageant',
          judge_count      ?? 3,
          ai_prompt        ?? '',
          computation_type ?? 'average',
          is_judge_locked  ?? 0,
          schoolId,
        ]
      );
    } else {
      // No row yet — INSERT a fresh one
      await connection.execute(
        `INSERT INTO settings
           (school_id, contest_name, contest_type, judge_count, ai_prompt, computation_type, is_judge_locked)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          schoolId,
          contest_name     ?? '',
          contest_type     ?? 'pageant',
          judge_count      ?? 3,
          ai_prompt        ?? '',
          computation_type ?? 'average',
          is_judge_locked  ?? 0,
        ]
      );
    }

    if (contestants !== undefined) {
      await connection.execute('DELETE FROM contestants WHERE school_id = ?', [schoolId]);
      if (contestants.length > 0) {
        for (const c of contestants) {
          await connection.execute(
            'INSERT INTO contestants (school_id, name, entry_number) VALUES (?, ?, ?)',
            [schoolId, c.name || 'Unnamed', c.entry_number || 0]
          );
        }
      }
    }

    if (criteria !== undefined) {
      await connection.execute('DELETE FROM criteria WHERE school_id = ?', [schoolId]);
      if (criteria.length > 0) {
        for (const cr of criteria) {
          await connection.execute(
            'INSERT INTO criteria (school_id, name, percentage) VALUES (?, ?, ?)',
            [schoolId, cr.name || 'New Criteria', cr.percentage || 0]
          );
        }
      }
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