const Problem = require('../models/Problem.model');
const Note = require('../models/Note.model');
const Bookmark = require('../models/Bookmark.model');
const Revision = require('../models/Revision.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { getUTCToday } = require('../utils/dateUtils');

/**
 * GET /api/v1/search?q=&type=
 * Global search across problems, notes, bookmarks, revisions.
 */
const globalSearch = asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  const userId = req.user._id;

  if (!q || q.trim().length === 0) {
    return ApiResponse.badRequest(res, 'Search query (q) is required.');
  }

  const query = q.trim();
  const regex = new RegExp(query, 'i');
  const results = { problems: [], notes: [], bookmarks: [], revisions: [] };

  // Search problems
  if (!type || type === 'problems') {
    results.problems = await Problem.find({
      isActive: true,
      $or: [
        { title: regex },
        { topic: regex },
        { patterns: regex },
      ],
    })
      .sort({ week: 1, orderIndex: 1 })
      .limit(20)
      .lean();
  }

  // Search notes
  if (!type || type === 'notes') {
    const noteResults = await Note.find({
      userId,
      $or: [
        { learning: regex },
        { mistakes: regex },
        { optimization: regex },
        { revisionNotes: regex },
        { interviewNotes: regex },
      ],
    })
      .populate('problemId', 'title difficulty topic')
      .limit(20)
      .lean();

    results.notes = noteResults;
  }

  // Search bookmarks
  if (!type || type === 'bookmarks') {
    const bookmarks = await Bookmark.find({ userId })
      .populate({
        path: 'problemId',
        match: { $or: [{ title: regex }, { topic: regex }] },
        select: 'title difficulty topic week',
      })
      .lean();

    results.bookmarks = bookmarks.filter((b) => b.problemId !== null);
  }

  // Search revisions (by problem title)
  if (!type || type === 'revisions') {
    const today = getUTCToday();
    const revisions = await Revision.find({
      userId,
      $or: [
        { revision1Done: false, revision1Date: { $lte: today } },
        { revision2Done: false, revision2Date: { $lte: today } },
        { revision3Done: false, revision3Date: { $lte: today } },
      ],
    })
      .populate({
        path: 'problemId',
        match: { title: regex },
        select: 'title difficulty topic',
      })
      .lean();

    results.revisions = revisions.filter((r) => r.problemId !== null);
  }

  return ApiResponse.success(res, results);
});

module.exports = { globalSearch };
