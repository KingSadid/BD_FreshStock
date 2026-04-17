const express = require('express');
const router = express.Router();
const productDao = require('../dao/product.dao');

router.get('/', productDao.getAll);
router.get('/:sku', productDao.getBySku);
router.get('/:sku/stock', productDao.getStockSummary);
router.post('/', productDao.create);

module.exports = router;