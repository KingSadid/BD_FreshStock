const supplierDao = require('../dao/supplier.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const suppliers = await supplierDao.getAll();
  res.json(suppliers);
});

const create = asyncHandler(async (req, res) => {
  const result = await supplierDao.create(req.body);
  res.status(201).json(result);
});

module.exports = { getAll, create };
