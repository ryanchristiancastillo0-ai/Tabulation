const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/location.controller');

router.get('/regions', ctrl.regions);
router.get('/provinces/:regionCode', ctrl.provinces);
router.get('/cities/:provinceCode', ctrl.cities);
router.get('/barangays/:cityCode', ctrl.barangays);

module.exports = router;