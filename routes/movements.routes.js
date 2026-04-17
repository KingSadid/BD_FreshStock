const express = require('express');
const router = express.Router();
const movementDao = require('../dao/movement.dao');

router.get('/recent', movementDao.getRecent);
router.get('/stats', movementDao.getStats);

module.exports = router;