const productDao = require('../dao/product.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const products = await productDao.getAll();
  res.json(products);
});

const getBySku = asyncHandler(async (req, res) => {
  const product = await productDao.getBySku(req.params.sku);
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(product);
});

const getStockSummary = asyncHandler(async (req, res) => {
  const summary = await productDao.getStockSummary(req.params.sku);
  res.json(summary);
});

const create = asyncHandler(async (req, res) => {
  const result = await productDao.create(req.body);
  res.status(201).json(result);
});

const update = asyncHandler(async (req, res) => {
  const result = await productDao.update(req.params.sku, req.body);
  res.json(result);
});

const remove = asyncHandler(async (req, res) => {
  const result = await productDao.deleteProduct(req.params.sku);
  res.json(result);
});

module.exports = { getAll, getBySku, getStockSummary, create, update, remove };
