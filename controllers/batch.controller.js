const batchDao = require('../dao/batch.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const batches = await batchDao.getAll(req.query.status);
  res.json(batches);
});

const getByProduct = asyncHandler(async (req, res) => {
  const batches = await batchDao.getByProduct(req.params.sku);
  res.json(batches);
});

const getExpiringBatches = asyncHandler(async (req, res) => {
  const batches = await batchDao.getExpiringBatches(req.query.days);
  res.json(batches);
});

const create = asyncHandler(async (req, res) => {
  const result = await batchDao.create(req.body);
  res.status(201).json(result);
});

const updateQuantity = asyncHandler(async (req, res) => {
  const result = await batchDao.updateQuantity(req.params.batch_id, req.body);
  res.json(result);
});

const remove = asyncHandler(async (req, res) => {
  await batchDao.remove(req.params.batch_id);
  res.json({ message: 'Lote eliminado permanentemente' });
});

module.exports = { getAll, getByProduct, getExpiringBatches, create, updateQuantity, remove };
