const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/judge.controller');
const aiCtrl = require('../controllers/ai.controller');
const { requireJudge } = require('../middleware/auth');

// ── ALL JUDGE ROUTES REQUIRE A VALID JUDGE JWT ──
// The judge's school comes from the token (req.school_id), never from the
// query string or body. This closes the "change ?school_id to see another
// school" hole at the API level.
router.use(requireJudge);

// ── 1. GENERATE AI JUDGE UI (JUDGE-ONLY — school-scoped) ──
// Delegates to the Redis-backed asynchronous AI flow (returns 202 + job).
router.post('/render-ui', aiCtrl.generate);

// ── 2. SUBMIT JUDGE SCORES (JUDGE-ONLY — school comes from the JWT) ──
router.post('/submit', ctrl.submit);

// ── 3. GET SCORE SUMMARY (JUDGE-ONLY) ──
router.get('/my-scores', ctrl.myScores);

// ── 4. GET RAW SCORES FOR UI PERSISTENCE (JUDGE-ONLY) ──
router.get('/my-scores-raw/:judgeId', ctrl.myScoresRaw);

// ── 5. GET CACHED UI ONLY — no AI, safe for background refresh ──
router.get('/render-ui-cached', ctrl.renderUICached);

// ── 6. CHECK AI UI GENERATION JOB STATUS (JUDGE-ONLY — school-scoped alias) ──
router.get('/render-ui/status/:jobId', aiCtrl.generationStatus);

module.exports = router;