const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batch.controller');

router.get('/', batchController.getAll);
router.get('/expiring', batchController.getExpiringBatches);
router.get('/product/:sku', batchController.getByProduct);
router.post('/', batchController.create);
router.patch('/:batch_id/quantity', batchController.updateQuantity);
router.delete('/:batch_id', batchController.remove);

module.exports = router;
