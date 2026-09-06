const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

// ── LOGIN ──
router.post('/login', ctrl.login);

// ── FORGOT PASSWORD ──
router.post('/request-password-reset', ctrl.requestPasswordReset);
router.post('/verify-reset-code', ctrl.verifyResetCode);
router.post('/reset-password', ctrl.resetPassword);

module.exports = router;