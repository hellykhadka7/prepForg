const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization header or cookies.
 * Attaches req.user with the full user document.
 */
const protect = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Fallback: check cookies
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Not authenticated. Please log in.');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user (exclude passwordHash)
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Invalid token.');
    }
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired. Please log in again.');
    }
    return ApiResponse.error(res, 'Authentication error', 500);
  }
};

module.exports = { protect };
