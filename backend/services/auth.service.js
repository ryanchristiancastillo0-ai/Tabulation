const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { sendPasswordResetEmail } = require('../utils/email');
const sessionService = require('./session.service');
const { JWT_SECRET, ACCESS_TOKEN_EXPIRES } = require('../config/jwt');

const RESET_CODE_LIFETIME_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_LIFETIME = '10m';
const RESET_MAX_ATTEMPTS = 5;

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  // Fetch admin + join school to make sure school is active
  const [rows] = await pool.execute(
    `SELECT a.id AS admin_id, a.name, a.email, a.password, a.school_id,
            s.school_name, s.school_logo, s.subscription_plan, s.status AS school_status
     FROM   admins  a
     JOIN   schools s ON s.id = a.school_id
     WHERE  a.email = ?
     LIMIT  1`,
    [email]
  );

  if (rows.length === 0) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const admin = rows[0];

  if (admin.school_status !== 'active') {
    throw new HttpError(403, 'Your school account is inactive. Contact support.');
  }

  const passwordMatch = await bcrypt.compare(password, admin.password);
  if (!passwordMatch) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  // Sign a SHORT-LIVED access JWT for this device. The device_id binds the
  // token to the session row created below, so a logged-out device is rejected
  // immediately even while its old access token is unexpired.
  const { deviceId, refreshToken } = await sessionService.createSession({
    school_id:  admin.school_id,
    actor_type: 'admin',
    actor_id:   admin.admin_id,
  });

  const token = jwt.sign(
    {
      admin_id:    admin.admin_id,
      admin_email: admin.email,
      school_id:   admin.school_id,
      device_id:   deviceId,
      token_type:  'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );

  return {
    success: true,
    token,
    refreshToken,
    admin: {
      id:          admin.admin_id,
      name:        admin.name,
      email:       admin.email,
      school_id:   admin.school_id,
      school_name: admin.school_name,
      school_logo: admin.school_logo,
      plan:        admin.subscription_plan,
    },
  };
}

async function judgeLogin({ email, password }) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required.');
  }

  const [rows] = await pool.execute(
    `SELECT id, school_name, school_logo, school_email, judge_password, subscription_plan, status
     FROM   schools
     WHERE  school_email = ?
     LIMIT  1`,
    [email]
  );

  if (rows.length === 0) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const school = rows[0];

  if (school.status !== 'active') {
    throw new HttpError(403, 'This school account is inactive. Contact support.');
  }

  if (!school.judge_password) {
    throw new HttpError(403, 'No judge password has been set for this school. Contact the admin.');
  }

  const passwordMatch = await bcrypt.compare(password, school.judge_password);
  if (!passwordMatch) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  const { deviceId, refreshToken } = await sessionService.createSession({
    school_id:  school.id,
    actor_type: 'judge',
    actor_id:   school.id,
  });

  const token = jwt.sign(
    {
      school_id: school.id,
      role:      'judge',
      device_id: deviceId,
      token_type: 'access',
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );

  return {
    success: true,
    token,
    refreshToken,
    school: {
      id:          school.id,
      school_name: school.school_name,
      school_logo: school.school_logo,
      school_email: school.school_email,
      plan:        school.subscription_plan,
    },
  };
}

async function requestPasswordReset({ email }) {
  if (!email) {
    throw new HttpError(400, 'Email is required.');
  }

  const [rows] = await pool.execute(
    `SELECT a.id AS admin_id, a.email, s.status AS school_status
     FROM   admins  a
     JOIN   schools s ON s.id = a.school_id
     WHERE  a.email = ?
     LIMIT  1`,
    [email]
  );

  // Stay vague — never reveal whether an email is registered.
  const genericMessage = 'If this email is registered, a verification code has been sent to it.';

  if (rows.length === 0 || rows[0].school_status !== 'active') {
    return { success: true, message: genericMessage, accountExists: false };
  }

  const admin = rows[0];
  const code = generateResetCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Invalidate any previous codes for this email
  await pool.execute('DELETE FROM password_resets WHERE email = ?', [admin.email]);

  await pool.execute(
    `INSERT INTO password_resets (admin_id, email, code_hash, attempts, expires_at)
     VALUES (?, ?, ?, 0, ?)`,
    [admin.admin_id, admin.email, codeHash, new Date(Date.now() + RESET_CODE_LIFETIME_MS)]
  );

  try {
    await sendPasswordResetEmail(admin.email, code);
  } catch (err) {
    console.error('💥 Failed to send reset email:', err);
    await pool.execute('DELETE FROM password_resets WHERE email = ?', [admin.email]);
    throw new HttpError(500, 'Failed to send the verification code. Please try again.');
  }

  return { success: true, message: genericMessage, accountExists: true };
}

async function verifyResetCode({ email, code }) {
  if (!email || !code) {
    throw new HttpError(400, 'Email and verification code are required.');
  }

  code = String(code).trim();

  const [rows] = await pool.execute(
    `SELECT id, email, code_hash, attempts, expires_at
     FROM   password_resets
     WHERE  email = ?
     ORDER  BY id DESC
     LIMIT  1`,
    [email]
  );

  if (rows.length === 0) {
    throw new HttpError(400, 'Invalid or expired verification code.');
  }

  const record = rows[0];

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [record.id]);
    throw new HttpError(400, 'This verification code has expired. Request a new one.');
  }

  if (record.attempts >= RESET_MAX_ATTEMPTS) {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [record.id]);
    throw new HttpError(400, 'Too many failed attempts. Request a new code.');
  }

  const matches = await bcrypt.compare(code, record.code_hash);
  if (!matches) {
    await pool.execute(
      'UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?',
      [record.id]
    );
    throw new HttpError(400, 'Invalid verification code.');
  }

  // Issue a short-lived token bound to this reset record
  const resetToken = jwt.sign(
    {
      purpose:  'password-reset',
      admin_id: record.id,
      email:    record.email,
    },
    JWT_SECRET,
    { expiresIn: RESET_TOKEN_LIFETIME }
  );

  return { success: true, message: 'Verification code accepted.', resetToken };
}

async function resetPassword({ resetToken, newPassword }) {
  if (!resetToken) {
    throw new HttpError(400, 'Verification is required before resetting the password.');
  }

  if (!newPassword) {
    throw new HttpError(400, 'New password is required.');
  }

  if (newPassword.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters.');
  }

  let payload;
  try {
    payload = jwt.verify(resetToken, JWT_SECRET);
  } catch (err) {
    throw new HttpError(400, 'Your verification has expired. Start over.');
  }

  if (payload.purpose !== 'password-reset' || !payload.admin_id) {
    throw new HttpError(400, 'Invalid verification token.');
  }

  const [resets] = await pool.execute(
    `SELECT id, email, expires_at
     FROM   password_resets
     WHERE  id = ?
     LIMIT  1`,
    [payload.admin_id]
  );

  if (resets.length === 0) {
    throw new HttpError(400, 'This verification was already used or is no longer valid.');
  }

  const resetRecord = resets[0];

  if (resetRecord.email !== payload.email) {
    throw new HttpError(400, 'Invalid verification token.');
  }

  if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
    await pool.execute('DELETE FROM password_resets WHERE id = ?', [resetRecord.id]);
    throw new HttpError(400, 'This verification has expired. Request a new code.');
  }

  const [admins] = await pool.execute('SELECT id FROM admins WHERE email = ? LIMIT 1', [resetRecord.email]);

  if (admins.length === 0) {
    throw new HttpError(404, 'No account found with that email.');
  }

  const admin = admins[0];
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id]);
  await pool.execute('DELETE FROM password_resets WHERE email = ?', [resetRecord.email]);

  return { success: true, message: 'Password updated successfully.' };
}

// ── SESSION / PRESENCE ENDPOINTS ─────────────────────────────────────────────

// Exchange the opaque refresh token for a fresh short-lived access token.
// Deliberately does NOT touch last_seen — a valid authentication alone never
// counts as presence. A session whose last heartbeat is ≥24h old is treated as
// logged out: the refresh is refused and the client signs out.
async function refreshSession({ refresh_token }) {
  if (!refresh_token) {
    throw new HttpError(400, 'Refresh token is required.');
  }

  const session = await sessionService.findSessionByRefresh(refresh_token);

  if (!sessionService.sessionRefreshValid(session)) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  if (!sessionService.presenceActive(session.last_seen)) {
    const err = new HttpError(401, 'Your session has been inactive too long. Please sign in again.');
    err.code = 'presence_expired';
    throw err;
  }

  const [schools] = await pool.execute('SELECT status FROM schools WHERE id = ? LIMIT 1', [session.school_id]);
  if (schools.length === 0 || schools[0].status !== 'active') {
    const err = new HttpError(403, 'This school account is inactive. Contact support.');
    err.code = 'school_inactive';
    throw err;
  }

  let payload;
  if (session.actor_type === 'admin') {
    const [admins] = await pool.execute(
      'SELECT id, email, school_id FROM admins WHERE id = ? LIMIT 1',
      [session.actor_id]
    );
    if (admins.length === 0) {
      throw new HttpError(401, 'This admin account no longer exists. Please sign in again.');
    }
    payload = {
      admin_id:    admins[0].id,
      admin_email: admins[0].email,
      school_id:   admins[0].school_id,
      device_id:   session.device_id,
      token_type:  'access',
    };
  } else {
    payload = {
      school_id:  session.school_id,
      role:       'judge',
      device_id:  session.device_id,
      token_type: 'access',
    };
  }

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });

  return { success: true, token };
}

// Presence heartbeat. Rejects (without touching rows) when the session is
// already outside the 24-hour window — an expired presence can only be brought
// back by a fresh sign-in, never by an idle page pinging the server.
async function touchPresence({ refresh_token }) {
  if (!refresh_token) {
    throw new HttpError(400, 'Refresh token is required.');
  }

  const session = await sessionService.findSessionByRefresh(refresh_token);

  if (!sessionService.sessionRefreshValid(session)) {
    throw new HttpError(401, 'Your session has expired. Please sign in again.');
  }

  if (!sessionService.presenceActive(session.last_seen)) {
    const err = new HttpError(401, 'Your session has been inactive too long. Please sign in again.');
    err.code = 'presence_expired';
    throw err;
  }

  await sessionService.touchPresence(session);

  return { success: true };
}

// Per-device logout: burns the refresh token and flags the session as logged
// out. Idempotent, best-effort — the frontend still clears local state either
// way, and only THIS device is signed out (other login devices stay online).
async function logout({ refresh_token }) {
  if (!refresh_token) return { success: true };
  await sessionService.revokeSession(refresh_token);
  return { success: true };
}

module.exports = {
  login,
  judgeLogin,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  refreshSession,
  touchPresence,
  logout,
};