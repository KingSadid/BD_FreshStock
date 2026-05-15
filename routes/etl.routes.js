const express = require('express');
const router = express.Router();
const etlController = require('../controllers/etl.controller');
const { authenticate } = require('../utils/auth.middleware');

router.post('/run', authenticate, etlController.run);

module.exports = router;
