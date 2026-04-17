const express = require('express');
const router = express.Router();
const dashboardDao = require('../dao/dashboard.dao');

router.get('/kpis', dashboardDao.getKPIs);

module.exports = router;