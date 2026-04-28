const dashboardDao = require('../dao/dashboard.dao');
const asyncHandler = require('../utils/asyncHandler');

const getKPIs = asyncHandler(async (req, res) => {
  const kpis = await dashboardDao.getKPIs();
  res.json(kpis);
});

const getMovementStats = asyncHandler(async (req, res) => {
  const stats = await dashboardDao.getMovementStats();
  res.json(stats);
});

const getCategoryStats = asyncHandler(async (req, res) => {
  const stats = await dashboardDao.getCategoryStats();
  res.json(stats);
});

module.exports = { getKPIs, getMovementStats, getCategoryStats };
