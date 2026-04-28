const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

router.get('/', productController.getAll);
router.get('/:sku', productController.getBySku);
router.get('/:sku/stock', productController.getStockSummary);
router.post('/', productController.create);
router.put('/:sku', productController.update);
router.delete('/:sku', productController.remove);

module.exports = router;
