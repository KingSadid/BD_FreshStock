/**
 * Async handler to eliminate repetitive try/catch blocks in controllers.
 * Following DRY principle.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
