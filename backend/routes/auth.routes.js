const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

// ── LOGIN ──
router.post('/login', ctrl.login);

// ── RESET PASSWORD ──
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;