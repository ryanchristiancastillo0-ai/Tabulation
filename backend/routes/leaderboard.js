const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// GET /api/leaderboard/fullscreen-config?school_id=1
router.get('/fullscreen-config', async (req, res) => {
  try {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id is required.' });

    const [rows] = await pool.execute(
      'SELECT * FROM fullscreen_config WHERE school_id = ? LIMIT 1',
      [school_id]
    );

    if (rows.length === 0) return res.json({});
    res.json(rows[0]);
  } catch (err) {
    console.error('fullscreen-config GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leaderboard/fullscreen-config
router.post('/fullscreen-config', async (req, res) => {
  try {
    const { school_id, bg_color, accent_color, text_color, title_text, subtitle_text } = req.body;
    if (!school_id) return res.status(400).json({ error: 'school_id is required.' });

    await pool.execute(
      `INSERT INTO fullscreen_config (school_id, bg_color, accent_color, text_color, title_text, subtitle_text)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         bg_color      = VALUES(bg_color),
         accent_color  = VALUES(accent_color),
         text_color    = VALUES(text_color),
         title_text    = VALUES(title_text),
         subtitle_text = VALUES(subtitle_text)`,
      [school_id, bg_color, accent_color, text_color, title_text, subtitle_text]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('fullscreen-config POST error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;