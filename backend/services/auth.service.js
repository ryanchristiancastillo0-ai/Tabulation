const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { sendPasswordResetEmail } = require('../utils/email');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/jwt');

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

  // Sign JWT — school_id lives in the payload
  const token = jwt.sign(
    {
      admin_id:    admin.admin_id,
      admin_email: admin.email,
      school_id:   admin.school_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

  return {
    success: true,
    token,
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
    return { success: true, message: genericMessage };
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

  return { success: true, message: genericMessage };
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

module.exports = { login, requestPasswordReset, verifyResetCode, resetPassword };