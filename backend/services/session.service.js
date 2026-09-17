// Per-device presence + refresh-token sessions.
//
// Responsibilities:
//   • Issue/verify opaque refresh tokens (stored as a sha256 hash, never shown)
//   • Track per-device presence (last_seen) — THIS is what "online" means now
//   • Enforce the 24-hour inactivity window and per-device logout
//
// Authentication (JWTs) and presence are deliberately separate: exchanging a
// refresh token for a new access token does NOT update last_seen, and a school
// can be offline while its users still hold technically-valid tokens.

const crypto = require('crypto');
const pool = require('../config/db');
const { REFRESH_TOKEN_TTL_MS } = require('../config/jwt');

const PRESENCE_WINDOW_HOURS = 24;
const PRESENCE_WINDOW_MS    = PRESENCE_WINDOW_HOURS * 60 * 60 * 1000;
const HEARTBEAT_THROTTLE_S  = 60;

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateDeviceId() {
  return crypto.randomUUID();
}

function presenceActive(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < PRESENCE_WINDOW_MS;
}

// Registers a new device session and returns the credentials to hand the
// client once: device_id goes inside the access JWT, refreshToken goes to the
// client storage and is only ever looked up again via its hash.
async function createSession({ school_id, actor_type, actor_id }) {
  const deviceId     = generateDeviceId();
  const refreshToken = generateRefreshToken();
  const expiresAt    = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await pool.execute(
    `INSERT INTO sessions
        (school_id, actor_type, actor_id, device_id, refresh_hash, last_seen, expires_at)
     VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
    [school_id, actor_type, actor_id, deviceId, hashRefreshToken(refreshToken), expiresAt]
  );

  return { deviceId, refreshToken, expiresAt };
}

async function findSessionByRefresh(refreshToken) {
  if (!refreshToken) return null;
  const [rows] = await pool.execute(
    `SELECT id, school_id, actor_type, actor_id, refresh_hash, last_seen, expires_at, logged_out_at
       FROM sessions
      WHERE refresh_hash = ?
      LIMIT 1`,
    [hashRefreshToken(refreshToken)]
  );
  return rows[0] || null;
}

// Refresh-token validity: session exists, not logged out, refresh not expired.
// Presence is NOT part of this check (a different, stricter gate).
function sessionRefreshValid(session) {
  return !!session &&
    !session.logged_out_at &&
    new Date(session.expires_at).getTime() > Date.now();
}

// Middleware gate for protected routes. A valid session must be alive, its
// refresh must still be valid, and its last heartbeat must be inside the
// 24-hour window. Tokens without a device_id are legacy 7-day tokens — they
// are accepted without a presence check during the rollout.
async function isSessionActive({ device_id, school_id }) {
  if (!device_id) return true;
  if (!school_id) return false;
  const [rows] = await pool.execute(
    `SELECT id FROM sessions
      WHERE device_id = ? AND school_id = ? AND logged_out_at IS NULL
        AND expires_at > NOW()
        AND last_seen >= NOW() - INTERVAL 24 HOUR
      LIMIT 1`,
    [device_id, school_id]
  );
  return rows.length > 0;
}

// Throttled heartbeat: an active user writes at most one row per minute.
// Also bumps the legacy schools.last_active_at so external readers still see a
// meaningful value. Returns true only when presence was actually renewed.
async function touchPresence(session) {
  const [res] = await pool.execute(
    `UPDATE sessions
        SET last_seen = NOW()
      WHERE id = ?
        AND logged_out_at IS NULL
        AND last_seen < NOW() - INTERVAL ${HEARTBEAT_THROTTLE_S} SECOND`,
    [session.id]
  );
  if (res.affectedRows === 0) return false;

  await pool.execute(
    'UPDATE schools SET last_active_at = NOW() WHERE id = ?',
    [session.school_id]
  );
  return true;
}

// Per-device logout: invalidate this session and burn the refresh token.
async function revokeSession(refreshToken) {
  if (!refreshToken) return false;
  const [res] = await pool.execute(
    `UPDATE sessions
        SET refresh_hash = NULL, logged_out_at = NOW()
      WHERE refresh_hash = ? AND logged_out_at IS NULL`,
    [hashRefreshToken(refreshToken)]
  );
  return res.affectedRows > 0;
}

module.exports = {
  PRESENCE_WINDOW_HOURS,
  PRESENCE_WINDOW_MS,
  HEARTBEAT_THROTTLE_S,
  hashRefreshToken,
  generateRefreshToken,
  generateDeviceId,
  presenceActive,
  createSession,
  findSessionByRefresh,
  sessionRefreshValid,
  isSessionActive,
  touchPresence,
  revokeSession,
};