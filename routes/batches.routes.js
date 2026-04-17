const express = require('express');
const router = express.Router();
const batchDao = require('../dao/batch.dao');

router.get('/', batchDao.getAll);
router.get('/expiring', batchDao.getExpiringBatches);
router.get('/product/:sku', batchDao.getByProduct);
router.post('/', batchDao.create);
router.patch('/:batch_id/quantity', batchDao.updateQuantity);
router.delete('/:batch_id', batchDao.remove);

module.exports = router;