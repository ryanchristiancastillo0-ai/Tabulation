const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/judge.controller');
const aiCtrl = require('../controllers/ai.controller');

// ── 1. GENERATE AI JUDGE UI (PUBLIC — school-scoped) ──
// Delegates to the Redis-backed asynchronous AI flow (returns 202 + job).
router.post('/render-ui', aiCtrl.generate);

// ── 2. SUBMIT JUDGE SCORES (PUBLIC - judges have no JWT) ──
router.post('/submit', ctrl.submit);

// ── 3. GET SCORE SUMMARY (PUBLIC) ──
router.get('/my-scores', ctrl.myScores);

// ── 4. GET RAW SCORES FOR UI PERSISTENCE (PUBLIC) ──
router.get('/my-scores-raw/:judgeId', ctrl.myScoresRaw);

// ── 5. GET CACHED UI ONLY — no AI, safe for background refresh ──
router.get('/render-ui-cached', ctrl.renderUICached);

// ── 6. CHECK AI UI GENERATION JOB STATUS (PUBLIC — school-scoped alias) ──
router.get('/render-ui/status/:jobId', aiCtrl.generationStatus);

module.exports = router;