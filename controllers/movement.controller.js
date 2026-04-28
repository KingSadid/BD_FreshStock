const movementDao = require('../dao/movement.dao');
const asyncHandler = require('../utils/asyncHandler');

const getRecent = asyncHandler(async (req, res) => {
  const movements = await movementDao.getRecent();
  res.json(movements);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await movementDao.getStats();
  res.json(stats);
});

module.exports = { getRecent, getStats };
