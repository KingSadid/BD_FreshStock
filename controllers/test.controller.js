const testDao = require('../dao/test.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const items = await testDao.getAll();
  res.json(items);
});

const getById = asyncHandler(async (req, res) => {
  const item = await testDao.getById(req.params.id);
  if (!item) return res.status(404).json({ error: 'No encontrado' });
  res.json(item);
});

const create = asyncHandler(async (req, res) => {
  const result = await testDao.create(req.body);
  res.status(201).json(result);
});

module.exports = { getAll, getById, create };
