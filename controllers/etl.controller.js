const etlService = require('../services/etl.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const run = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new AppError('Solo administradores pueden ejecutar el ETL', 403);
  }

  const results = await etlService.runETL();

  res.json({
    message: 'ETL completado',
    events_processed: results.events_processed,
    results
  });
});

module.exports = { run };
