const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { parseJSONImport, parseCSVImport, bulkInsertProblems } = require('../services/import.service');

/**
 * POST /api/v1/import/problems/json
 * Bulk import problems from JSON array.
 */
const importJSON = asyncHandler(async (req, res) => {
  const { problems } = req.body;

  if (!problems || !Array.isArray(problems)) {
    return ApiResponse.badRequest(res, 'Request body must contain a "problems" array.');
  }

  const { valid, errors } = parseJSONImport(problems);

  if (errors.length > 0 && valid.length === 0) {
    return ApiResponse.badRequest(res, 'All items failed validation.', errors);
  }

  const insertedCount = await bulkInsertProblems(valid);

  return ApiResponse.created(res, {
    inserted: insertedCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * POST /api/v1/import/problems/csv
 * Bulk import problems from CSV string.
 */
const importCSV = asyncHandler(async (req, res) => {
  const { csv } = req.body;

  if (!csv || typeof csv !== 'string') {
    return ApiResponse.badRequest(res, 'Request body must contain a "csv" string.');
  }

  const { valid, errors } = parseCSVImport(csv);

  if (errors.length > 0 && valid.length === 0) {
    return ApiResponse.badRequest(res, 'All items failed validation.', errors);
  }

  const insertedCount = await bulkInsertProblems(valid);

  return ApiResponse.created(res, {
    inserted: insertedCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * POST /api/v1/import/problems/paste
 * Bulk import from raw pasted JSON in body.
 */
const importPaste = asyncHandler(async (req, res) => {
  // Body IS the array directly
  let data = req.body;
  if (!Array.isArray(data)) {
    // Try to extract from a wrapper
    if (data.problems && Array.isArray(data.problems)) {
      data = data.problems;
    } else {
      return ApiResponse.badRequest(res, 'Body must be a JSON array of problems.');
    }
  }

  const { valid, errors } = parseJSONImport(data);

  if (errors.length > 0 && valid.length === 0) {
    return ApiResponse.badRequest(res, 'All items failed validation.', errors);
  }

  const insertedCount = await bulkInsertProblems(valid);

  return ApiResponse.created(res, {
    inserted: insertedCount,
    failed: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * POST /api/v1/import/data/restore
 * Restore full user data from backup JSON.
 */
const restoreData = asyncHandler(async (req, res) => {
  // Placeholder for full data restore (Phase 6 implementation)
  return ApiResponse.success(res, null, 'Data restore endpoint. Full implementation in Phase 6.');
});

module.exports = { importJSON, importCSV, importPaste, restoreData };
