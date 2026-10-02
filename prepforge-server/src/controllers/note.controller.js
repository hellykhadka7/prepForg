const Note = require('../models/Note.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/v1/notes/problem/:problemId
 */
const getNote = asyncHandler(async (req, res) => {
  const note = await Note.findOne({
    userId: req.user._id,
    problemId: req.params.problemId,
  });

  if (!note) {
    // Return empty note structure (not created yet)
    return ApiResponse.success(res, {
      note: {
        problemId: req.params.problemId,
        learning: '',
        mistakes: '',
        optimization: '',
        revisionNotes: '',
        interviewNotes: '',
      },
    });
  }

  return ApiResponse.success(res, { note });
});

/**
 * PUT /api/v1/notes/problem/:problemId
 * Upsert: create if not exists, update if exists.
 */
const upsertNote = asyncHandler(async (req, res) => {
  const { learning, mistakes, optimization, revisionNotes, interviewNotes } = req.body;

  const note = await Note.findOneAndUpdate(
    { userId: req.user._id, problemId: req.params.problemId },
    {
      learning: learning ?? '',
      mistakes: mistakes ?? '',
      optimization: optimization ?? '',
      revisionNotes: revisionNotes ?? '',
      interviewNotes: interviewNotes ?? '',
    },
    { upsert: true, new: true, runValidators: true }
  );

  return ApiResponse.success(res, { note }, 'Note saved.');
});

module.exports = { getNote, upsertNote };
