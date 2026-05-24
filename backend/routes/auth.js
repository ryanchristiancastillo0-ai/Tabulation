// routes/auth.js
// POST /api/auth/login  →  returns JWT containing school_id
//
// Mount in server.js as:
//   app.use('/api/auth', require('./routes/auth'));
//
// AdminLogin.jsx was previously calling /api/admin/login — update that one line
// in AdminLogin.jsx to /api/auth/login, or mount this router at both paths:
//   app.use('/api/admin', require('./routes/auth'));   // backward compat alias

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');

const JWT_SECRET  = process.env.JWT_SECRET  || 'change_this_secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// ── LOGIN ──────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
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
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = rows[0];

    if (admin.school_status !== 'active') {
      return res.status(403).json({ error: 'Your school account is inactive. Contact support.' });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT — school_id lives in the payload
    const token = jwt.sign(
      {
        admin_id:  admin.admin_id,
        admin_email: admin.email,
        school_id: admin.school_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
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
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
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
      return res.status(404).json({ error: 'No account found with that email.' });
    }

    const admin = rows[0];

    if (admin.school_status !== 'active') {
      return res.status(403).json({ error: 'Your school account is inactive. Contact support.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      `UPDATE admins SET password = ? WHERE id = ?`,
      [hashedPassword, admin.admin_id]
    );

    res.json({ success: true, message: 'Password updated successfully.' });

  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;