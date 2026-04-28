const categoryDao = require('../dao/category.dao');
const asyncHandler = require('../utils/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const categories = await categoryDao.getAll();
  res.json(categories);
});

module.exports = { getAll };
