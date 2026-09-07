const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/school.controller');
const { requireAuth } = require('../middleware/auth');

// ── AUTHENTICATED SCHOOL PROFILE ROUTES ──
// Placed before /:id so Express does not match them as an id parameter.
router.get('/profile',   requireAuth, ctrl.getProfile);
router.put('/profile',   requireAuth, ctrl.updateProfile);
router.post('/profile/change-password', requireAuth, ctrl.updateAdminPassword);
router.post('/profile/judge-password',  requireAuth, ctrl.updateProfileJudgePassword);

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