const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { touchSchoolActivity } = require('../utils/activity');

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

    // Track that this school is actively in use (throttled, non-blocking).
    touchSchoolActivity(decoded.school_id);

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ── requireJudge ────────────────────────────────────────────────────────────
// Verifies a JUDGE JWT (role === 'judge') and injects req.school_id from the
// token itself. Judge data endpoints NEVER trust a school_id supplied in the
// query string / body – the token is the only source of truth, so a judge can
// not read or submit another school's scores by changing ?school_id.
function requireJudge(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'judge' || !decoded.school_id) {
      return res.status(401).json({ error: 'Invalid judge token.' });
    }

    req.school_id = decoded.school_id;
    req.judge     = decoded; // { school_id, role: 'judge', iat, exp }

    // Track that this school is actively in use (throttled, non-blocking).
    touchSchoolActivity(decoded.school_id);

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

module.exports = { requireAuth, requireJudge, protect };