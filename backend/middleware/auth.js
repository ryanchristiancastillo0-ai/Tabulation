const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// ── requireAuth ────────────────────────────────────────────────────────────
// Verifies JWT from Authorization header and injects req.school_id + req.admin
// into every protected route.
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.school_id) {
      return res.status(401).json({ error: 'Token missing school_id.' });
    }

    req.school_id = decoded.school_id;   // ← every route can use req.school_id
    req.admin     = decoded;             // { admin_id, admin_email, school_id, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ── protect (legacy alias) ─────────────────────────────────────────────────
function protect(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { requireAuth, protect };