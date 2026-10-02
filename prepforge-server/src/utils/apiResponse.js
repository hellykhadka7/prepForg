/**
 * Standardized API response helper.
 * All API responses use this shape for consistency.
 */
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      error: null,
    });
  }

  static created(res, data, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res, message = 'Something went wrong', statusCode = 500, error = null) {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message,
      error: error || message,
    });
  }

  static badRequest(res, message = 'Bad request', error = null) {
    return ApiResponse.error(res, message, 400, error);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res, message = 'Resource not found') {
    return ApiResponse.error(res, message, 404);
  }

  static conflict(res, message = 'Conflict') {
    return ApiResponse.error(res, message, 409);
  }
}

module.exports = ApiResponse;
