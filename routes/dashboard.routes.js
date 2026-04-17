const express = require('express');
const router = express.Router();
const dashboardDao = require('../dao/dashboard.dao');

router.get('/kpis', dashboardDao.getKPIs);
router.get('/movement-stats', dashboardDao.getMovementStats);
router.get('/category-stats', dashboardDao.getCategoryStats);

module.exports = router;