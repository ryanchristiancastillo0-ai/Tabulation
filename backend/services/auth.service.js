const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { JWT_SECRET, JWT_EXPIRES } = require('../config/jwt');

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

async function resetPassword({ email, newPassword }) {
  if (!email || !newPassword) {
    throw new HttpError(400, 'Email and new password are required.');
  }

  if (newPassword.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters.');
  }

  // Check if admin with that email exists
  const [rows] = await pool.execute(
    `SELECT a.id AS admin_id, s.status AS school_status
     FROM   admins  a
     JOIN   schools s ON s.id = a.school_id
     WHERE  a.email = ?
     LIMIT  1`,
    [email]
  );

  if (rows.length === 0) {
    // Vague on purpose — don't reveal whether email exists
    throw new HttpError(404, 'No account found with that email.');
  }

  const admin = rows[0];

  if (admin.school_status !== 'active') {
    throw new HttpError(403, 'Your school account is inactive. Contact support.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.admin_id]);

  return { success: true, message: 'Password updated successfully.' };
}

module.exports = { login, resetPassword };