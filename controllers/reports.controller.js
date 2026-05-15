const reportsDao = require('../dao/reports.dao');
const asyncHandler = require('../utils/asyncHandler');

const inventoryValuation = asyncHandler(async (req, res) => {
  const data = await reportsDao.getInventoryValuation(req.query.category_id);
  res.json(data);
});

const movementHistory = asyncHandler(async (req, res) => {
  const data = await reportsDao.getMovementHistory(req.query);
  res.json(data);
});

const wasteReport = asyncHandler(async (req, res) => {
  const data = await reportsDao.getWasteReport(req.query);
  res.json(data);
});

const movementTypes = asyncHandler(async (req, res) => {
  const data = await reportsDao.getMovementTypes();
  res.json(data);
});

module.exports = { inventoryValuation, movementHistory, wasteReport, movementTypes };
