const express = require('express');
const router = express.Router();
const categoryDao = require('../dao/category.dao');

router.get('/', categoryDao.getAll);

module.exports = router;