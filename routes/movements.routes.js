const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movement.controller');

router.get('/recent', movementController.getRecent);
router.get('/stats', movementController.getStats);

module.exports = router;
