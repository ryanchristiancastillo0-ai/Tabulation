const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedback.controller');

// POST /api/feedback
router.post('/', ctrl.send);

module.exports = router;