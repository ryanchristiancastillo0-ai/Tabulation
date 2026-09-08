const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ai.controller');

// ── AI UI GENERATION (ASYNC JOB QUEUE) ──
// Public + school-scoped (same tenancy model as the existing judge endpoints).
router.post('/generate', ctrl.generate);
router.get('/generations/:id', ctrl.generationStatus);

module.exports = router;