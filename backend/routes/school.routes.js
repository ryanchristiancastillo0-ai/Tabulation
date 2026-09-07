const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/school.controller');

// ── CREATE SCHOOL + ADMIN (atomic) ──
router.post('/create', ctrl.create);

// ── GET ALL SCHOOLS ──
router.get('/', ctrl.list);

// ── GET SINGLE SCHOOL ──
router.get('/:id', ctrl.getById);

// ── UPDATE SCHOOL ──
router.put('/:id', ctrl.update);

// ── UPDATE JUDGE PASSWORD ──
router.patch('/:id/judge-password', ctrl.updateJudgePassword);

// ── DELETE SCHOOL ──
router.delete('/:id', ctrl.remove);

module.exports = router;