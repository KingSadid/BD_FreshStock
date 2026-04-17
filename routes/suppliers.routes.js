const express = require('express');
const router = express.Router();
const supplierDao = require('../dao/supplier.dao');

router.get('/', supplierDao.getAll);
router.post('/', supplierDao.create);

module.exports = router;