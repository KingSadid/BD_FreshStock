const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

router.get('/kpis', verifyToken, dashboardController.getDashboardKPIs);

module.exports = router;
