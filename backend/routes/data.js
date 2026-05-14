// routes/data.js
const express     = require('express');
const router      = express.Router();
const pool        = require('../config/db');
const requireAuth = require('./middleware');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth required
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/public/system-config?school_id=20
router.get('/public/system-config', async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) return res.status(400).json({ error: 'school_id query param required.' });

  try {
    const [config] = await pool.execute(
      'SELECT * FROM system_config WHERE school_id = ? ORDER BY id DESC LIMIT 1',
      [school_id]
    );
    res.json(config[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/get-all-data?school_id=20
router.get('/public/get-all-data', async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) return res.status(400).json({ error: 'school_id query param required.' });

  try {
    const [settings]    = await pool.execute(
      'SELECT * FROM settings WHERE school_id = ? LIMIT 1', [school_id]
    );
    const [contestants] = await pool.execute(
      'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC', [school_id]
    );
    const [criteria]    = await pool.execute(
      'SELECT * FROM criteria WHERE school_id = ?', [school_id]
    );

    res.json({
      settings:    settings[0] || { contest_name: 'Event', judge_count: 3 },
      contestants,
      criteria,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/leaderboard?school_id=20
router.get('/public/leaderboard', async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) return res.status(400).json({ error: 'school_id query param required.' });

  try {
    const [settings] = await pool.execute(
      'SELECT computation_type, judge_count FROM settings WHERE school_id = ? LIMIT 1',
      [school_id]
    );
    if (!settings[0]) return res.status(404).json({ error: 'No settings found.' });

    const { computation_type: type, judge_count } = settings[0];

    const [rawScores] = await pool.execute(
      `SELECT s.judge_id, s.contestant_id, c.name,
              SUM(s.score_value) AS judge_total
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.school_id = ?
       GROUP  BY s.judge_id, s.contestant_id`,
      [school_id, school_id]
    );

    if (type === 'average') {
      const [results] = await pool.execute(
        `SELECT c.name,
                SUM(s.score_value) / ? AS final_score
         FROM   scores      s
         JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
         WHERE  s.school_id = ?
         GROUP  BY c.id
         ORDER  BY final_score DESC`,
        [judge_count, school_id, school_id]
      );
      return res.json(results);
    }

    // Rank-sum mode
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

    res.json(Object.values(finalTallies).sort((a, b) => a.total_rank - b.total_rank));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/judge/ids?school_id=20
router.get('/public/judge/ids', async (req, res) => {
  const school_id = req.query.school_id;
  if (!school_id) return res.status(400).json({ error: 'school_id query param required.' });

  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT judge_id
       FROM   scores
       WHERE  school_id = ?
       ORDER  BY judge_id ASC`,
      [school_id]
    );
    res.json(rows.map(r => r.judge_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/judge/scores?school_id=20&judgeId=1
router.get('/public/judge/scores', async (req, res) => {
  const { school_id, judgeId } = req.query;
  if (!school_id) return res.status(400).json({ error: 'school_id query param required.' });
  if (!judgeId)   return res.status(400).json({ error: 'judgeId query param required.' });

  try {
    const [scores] = await pool.execute(
      `SELECT c.name, SUM(s.score_value) AS total
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.judge_id  = ? AND s.school_id = ?
       GROUP  BY c.id
       ORDER  BY total DESC`,
      [school_id, judgeId, school_id]
    );
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — auth required from here down
// ─────────────────────────────────────────────────────────────────────────────
router.use(requireAuth);

// GET /api/get-all-data
router.get('/get-all-data', async (req, res) => {
  const school_id = req.school_id;

  try {
    const [settings]    = await pool.execute(
      'SELECT * FROM settings    WHERE school_id = ? LIMIT 1', [school_id]
    );
    const [contestants] = await pool.execute(
      'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC', [school_id]
    );
    const [criteria]    = await pool.execute(
      'SELECT * FROM criteria    WHERE school_id = ?', [school_id]
    );

    res.json({
      settings:    settings[0] || { contest_name: 'Event', judge_count: 3 },
      contestants,
      criteria,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leaderboard
router.get('/leaderboard', async (req, res) => {
  const school_id = req.school_id;

  try {
    const [settings] = await pool.execute(
      'SELECT computation_type, judge_count FROM settings WHERE school_id = ? LIMIT 1',
      [school_id]
    );
    if (!settings[0]) return res.status(404).json({ error: 'No settings found for this school.' });

    const { computation_type: type, judge_count } = settings[0];

    const [rawScores] = await pool.execute(
      `SELECT s.judge_id, s.contestant_id, c.name,
              SUM(s.score_value) AS judge_total
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.school_id = ?
       GROUP  BY s.judge_id, s.contestant_id`,
      [school_id, school_id]
    );

    if (type === 'average') {
      const [results] = await pool.execute(
        `SELECT c.name,
                SUM(s.score_value) / ? AS final_score
         FROM   scores      s
         JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
         WHERE  s.school_id = ?
         GROUP  BY c.id
         ORDER  BY final_score DESC`,
        [judge_count, school_id, school_id]
      );
      return res.json(results);
    }

    // Rank-sum mode
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

    return res.json(Object.values(finalTallies).sort((a, b) => a.total_rank - b.total_rank));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/judge/ids
router.get('/judge/ids', async (req, res) => {
  const school_id = req.school_id;

  try {
    const [rows] = await pool.execute(
      `SELECT DISTINCT judge_id
       FROM   scores
       WHERE  school_id = ?
       ORDER  BY judge_id ASC`,
      [school_id]
    );
    res.json(rows.map(r => r.judge_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/judge/my-scores?judgeId=1
router.get('/judge/my-scores', async (req, res) => {
  const school_id = req.school_id;
  const judgeId   = req.query.judgeId;

  if (!judgeId) return res.status(400).json({ error: 'judgeId query param required.' });

  try {
    const [scores] = await pool.execute(
      `SELECT c.name, SUM(s.score_value) AS total
       FROM   scores      s
       JOIN   contestants c ON c.id = s.contestant_id AND c.school_id = ?
       WHERE  s.judge_id  = ? AND s.school_id = ?
       GROUP  BY c.id
       ORDER  BY total DESC`,
      [school_id, judgeId, school_id]
    );
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reset-data
router.delete('/reset-data', async (req, res) => {
  const school_id  = req.school_id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM scores       WHERE school_id = ?', [school_id]);
    await connection.execute('DELETE FROM ui_cache     WHERE school_id = ?', [school_id]);
    await connection.execute('DELETE FROM contestants  WHERE school_id = ?', [school_id]);
    await connection.execute('DELETE FROM criteria     WHERE school_id = ?', [school_id]);
    await connection.execute(
      `UPDATE settings SET contest_name = '', judge_count = 3, ai_prompt = 'Modern and Professional'
       WHERE school_id = ?`,
      [school_id]
    );
    await connection.commit();
    res.json({ success: true, message: 'All data for your school has been cleared.' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  } finally {
    connection.release();
  }
});

// POST /api/save-config
router.post('/save-config', async (req, res) => {
  const school_id  = req.school_id;
  const connection = await pool.getConnection();

  try {
    const {
      contest_name, judge_count, ai_prompt, contestants,
      criteria, computation_type, contest_type, is_judge_locked,
    } = req.body;

    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO settings
         (school_id, contest_name, contest_type, judge_count, ai_prompt, computation_type, is_judge_locked)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         contest_name     = VALUES(contest_name),
         contest_type     = VALUES(contest_type),
         judge_count      = VALUES(judge_count),
         ai_prompt        = VALUES(ai_prompt),
         computation_type = VALUES(computation_type),
         is_judge_locked  = VALUES(is_judge_locked)`,
      [
        school_id,
        contest_name     || '',
        contest_type     || 'pageant',
        judge_count      || 3,
        ai_prompt        || '',
        computation_type || 'average',
        is_judge_locked  || 0,
      ]
    );

    await connection.execute('DELETE FROM contestants WHERE school_id = ?', [school_id]);
    if (contestants && contestants.length > 0) {
      for (const c of contestants) {
        await connection.execute(
          'INSERT INTO contestants (school_id, name, entry_number) VALUES (?, ?, ?)',
          [school_id, c.name || 'Unnamed', c.entry_number || 0]
        );
      }
    }

    await connection.execute('DELETE FROM criteria WHERE school_id = ?', [school_id]);
    if (criteria && criteria.length > 0) {
      for (const cr of criteria) {
        await connection.execute(
          'INSERT INTO criteria (school_id, name, percentage) VALUES (?, ?, ?)',
          [school_id, cr.name || 'New Criteria', cr.percentage || 0]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Configuration saved!' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// GET /api/system-config
router.get('/system-config', async (req, res) => {
  const school_id = req.school_id;

  try {
    const [config] = await pool.execute(
      'SELECT * FROM system_config WHERE school_id = ? ORDER BY id DESC LIMIT 1',
      [school_id]
    );
    res.json(config[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/save-system-config
router.post('/save-system-config', async (req, res) => {
  const school_id = req.school_id;

  try {
    const {
      school_name, portal_name, school_logo, background_logo,
      primary_color, secondary_color, footer_text, logo_radius,
    } = req.body;

    await pool.execute(
      `INSERT INTO system_config
         (school_id, school_name, portal_name, school_logo, background_logo,
          primary_color, secondary_color, footer_text, logo_radius)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         school_name     = VALUES(school_name),
         portal_name     = VALUES(portal_name),
         school_logo     = VALUES(school_logo),
         background_logo = VALUES(background_logo),
         primary_color   = VALUES(primary_color),
         secondary_color = VALUES(secondary_color),
         footer_text     = VALUES(footer_text),
         logo_radius     = VALUES(logo_radius)`,
      [
        school_id,
        school_name     || null,
        portal_name     || null,
        school_logo     || null,
        background_logo || null,
        primary_color   || '#22c55e',
        secondary_color || '#0f172a',
        footer_text     || null,
        logo_radius     != null ? Number(logo_radius) : 12,
      ]
    );

    res.json({ success: true, message: 'System configuration updated.' });
  } catch (err) {
    console.error('save-system-config error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;