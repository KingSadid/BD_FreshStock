const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batch.controller');
const { authenticate } = require('../utils/auth.middleware');

router.get('/', batchController.getAll);
router.get('/expiring', batchController.getExpiringBatches);
router.get('/product/:sku', batchController.getByProduct);
router.post('/', authenticate, batchController.create);
router.patch('/:batch_id/quantity', batchController.updateQuantity);
router.delete('/:batch_id', batchController.remove);

module.exports = router;
