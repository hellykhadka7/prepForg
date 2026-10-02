const ApiResponse = require('../utils/apiResponse');

/**
 * Restrict access to admin users only.
 * Must be used AFTER the protect middleware.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return ApiResponse.forbidden(res, 'Admin access required.');
  }
  next();
};

module.exports = { adminOnly };
