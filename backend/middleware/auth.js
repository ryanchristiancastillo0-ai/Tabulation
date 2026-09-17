const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { isSessionActive } = require('../services/session.service');

// ── requireAuth ────────────────────────────────────────────────────────────
// Verifies JWT from Authorization header and injects req.school_id + req.admin
// into every protected route. Then gates the request on a live device session:
// not logged out, refresh still valid, and a presence heartbeat within the
// last 24 hours (legacy tokens without a device_id still pass during rollout).
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  if (!decoded.school_id) {
    return res.status(401).json({ error: 'Token missing school_id.' });
  }

  req.school_id = decoded.school_id;   // ← every route can use req.school_id
  req.admin     = decoded;             // { admin_id, admin_email, school_id, device_id, iat, exp }

  isSessionActive({ device_id: decoded.device_id, school_id: decoded.school_id })
    .then((active) => {
      if (!active) {
        return res.status(401).json({
          error: 'Your session has been inactive too long. Please sign in again.',
          code:  'presence_expired',
        });
      }
      next();
    })
    .catch((err) => {
      console.error('💥 Session validation failed:', err);
      res.status(500).json({ error: 'Session validation failed. Please try again.' });
    });
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

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  if (decoded.role !== 'judge' || !decoded.school_id) {
    return res.status(401).json({ error: 'Invalid judge token.' });
  }

  req.school_id = decoded.school_id;
  req.judge     = decoded; // { school_id, role: 'judge', device_id, iat, exp }

  isSessionActive({ device_id: decoded.device_id, school_id: decoded.school_id })
    .then((active) => {
      if (!active) {
        return res.status(401).json({
          error: 'Your session has been inactive too long. Please sign in again.',
          code:  'presence_expired',
        });
      }
      next();
    })
    .catch((err) => {
      console.error('💥 Session validation failed:', err);
      res.status(500).json({ error: 'Session validation failed. Please try again.' });
    });
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