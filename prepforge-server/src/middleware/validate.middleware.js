const ApiResponse = require('../utils/apiResponse');

/**
 * Creates a validation middleware from a Zod schema.
 * Validates req.body by default, but can validate req.query or req.params.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }
    // Replace with parsed/transformed data
    req[source] = result.data;
    next();
  };
};

module.exports = { validate };
