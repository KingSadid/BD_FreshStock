const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');

router.get('/kpis', dashboardController.getKPIs);
router.get('/movement-stats', dashboardController.getMovementStats);
router.get('/category-stats', dashboardController.getCategoryStats);

module.exports = router;
