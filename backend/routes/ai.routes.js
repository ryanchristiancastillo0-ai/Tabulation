const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/ai.controller');
const { requireJudge } = require('../middleware/auth');

// ── AI UI GENERATION (ASYNC JOB QUEUE) ──
// Authenticated: requires the judge JWT, and the school_id always comes from
// the token (req.school_id) instead of the request body / query string.
router.use(requireJudge);

router.post('/generate', ctrl.generate);
router.get('/generations/:id', ctrl.generationStatus);

module.exports = router;