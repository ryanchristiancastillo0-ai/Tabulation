const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/leaderboard.controller');

// GET /api/leaderboard/fullscreen-config?school_id=1
router.get('/fullscreen-config', ctrl.get);

// POST /api/leaderboard/fullscreen-config
router.post('/fullscreen-config', ctrl.save);

module.exports = router;