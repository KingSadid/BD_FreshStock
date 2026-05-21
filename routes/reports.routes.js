const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../utils/auth.middleware');

router.get('/inventory-valuation', authenticate, reportsController.inventoryValuation);
router.get('/movement-history', authenticate, reportsController.movementHistory);
router.get('/waste', authenticate, reportsController.wasteReport);
router.get('/movement-types', authenticate, reportsController.movementTypes);
router.get('/firebase', authenticate, reportsController.firebaseReport);
router.get('/mysql-verification', authenticate, reportsController.mysqlVerification);

module.exports = router;
