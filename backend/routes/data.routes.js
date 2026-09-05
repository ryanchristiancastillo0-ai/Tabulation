const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/data.controller');
const { requireAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES — no auth required
// ─────────────────────────────────────────────────────────────────────────────
router.get('/public/system-config', ctrl.publicSystemConfig);
router.get('/public/get-all-data', ctrl.publicGetAllData);
router.get('/public/leaderboard', ctrl.publicLeaderboard);
router.get('/public/judge/ids', ctrl.publicJudgeIds);
router.get('/public/judge/scores', ctrl.publicJudgeScores);

// ─────────────────────────────────────────────────────────────────────────────
// PROTECTED ROUTES — auth required from here down
// ─────────────────────────────────────────────────────────────────────────────
router.use(requireAuth);

router.get('/get-all-data', ctrl.getAllData);
router.get('/leaderboard', ctrl.leaderboard);
router.get('/judge/ids', ctrl.judgeIds);
router.get('/judge/my-scores', ctrl.judgeMyScores);
router.delete('/reset-data', ctrl.resetData);
router.post('/save-config', ctrl.saveConfig);
router.get('/system-config', ctrl.systemConfig);
router.post('/save-system-config', ctrl.saveSystemConfig);

module.exports = router;