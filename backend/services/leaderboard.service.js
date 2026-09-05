const pool = require('../config/db');
const HttpError = require('../utils/http-error');

// ── GET FULLSCREEN CONFIG ──
async function getFullscreenConfig(schoolId) {
  if (!schoolId) throw new HttpError(400, 'school_id is required.');

  const [rows] = await pool.execute(
    'SELECT * FROM fullscreen_config WHERE school_id = ? LIMIT 1',
    [schoolId]
  );

  return rows[0] || {};
}

// ── SAVE FULLSCREEN CONFIG ──
async function saveFullscreenConfig({ school_id, bg_color, accent_color, text_color, title_text, subtitle_text }) {
  if (!school_id) throw new HttpError(400, 'school_id is required.');

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

  return { success: true };
}

module.exports = { getFullscreenConfig, saveFullscreenConfig };