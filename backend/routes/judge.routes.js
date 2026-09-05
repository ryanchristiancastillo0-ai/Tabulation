const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/judge.controller');

// ── 1. GENERATE AI JUDGE UI (PUBLIC - no auth) ──
router.post('/render-ui', ctrl.renderUI);

// ── 2. SUBMIT JUDGE SCORES (PUBLIC - judges have no JWT) ──
router.post('/submit', ctrl.submit);

// ── 3. GET SCORE SUMMARY (PUBLIC) ──
router.get('/my-scores', ctrl.myScores);

// ── 4. GET RAW SCORES FOR UI PERSISTENCE (PUBLIC) ──
router.get('/my-scores-raw/:judgeId', ctrl.myScoresRaw);

// ── 5. GET CACHED UI ONLY — no AI, safe for background refresh ──
router.get('/render-ui-cached', ctrl.renderUICached);

module.exports = router;