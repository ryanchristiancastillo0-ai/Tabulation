const pool = require('../config/db');

// How often one school can write last_active_at (seconds). This throttles
// DB writes so busy requests don't hit the DB on every single call.
const TOUCH_INTERVAL_SECONDS = 60;

// Live "active" window used by the public active-schools listing.
const ACTIVE_WINDOW_MINUTES = 5;

// Marks a school as active right now. Throttled: only writes when the stored
// timestamp is older than TOUCH_INTERVAL_SECONDS, so each school updates at
// most once per minute. Fire-and-forget — errors are swallowed.
async function touchSchoolActivity(schoolId) {
  if (!schoolId) return;
  try {
    await pool.execute(
      `UPDATE schools
          SET last_active_at = NOW()
        WHERE id = ? AND (last_active_at IS NULL OR last_active_at < NOW() - INTERVAL 60 SECOND)`,
      [schoolId]
    );
  } catch (err) {
    console.error('touchSchoolActivity error:', err.message);
  }
}

module.exports = { touchSchoolActivity, TOUCH_INTERVAL_SECONDS, ACTIVE_WINDOW_MINUTES };