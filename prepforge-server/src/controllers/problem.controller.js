const Problem = require('../models/Problem.model');
const Solution = require('../models/Solution.model');
const Bookmark = require('../models/Bookmark.model');
const Revision = require('../models/Revision.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { XP_VALUES } = require('../config/constants');
const { getUTCToday } = require('../utils/dateUtils');

/**
 * GET /api/v1/problems
 * List all problems with per-user solve/bookmark/revision status.
 * Preserves Week → Difficulty → orderIndex display order.
 * Supports filters: week, topic, pattern, difficulty, status, bookmarked, revisionDue, q
 */
const getProblems = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { week, topic, pattern, difficulty, status, bookmarked, revisionDue, q } = req.query;

  // Build problem filter
  const filter = { isActive: true };
  if (week) filter.week = parseInt(week, 10);
  if (topic) filter.topic = topic;
  if (pattern) filter.patterns = pattern;
  if (difficulty) filter.difficulty = difficulty;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { topic: { $regex: q, $options: 'i' } },
      { patterns: { $regex: q, $options: 'i' } },
    ];
  }

  // Fetch problems in correct display order
  const problems = await Problem.find(filter)
    .sort({ week: 1, orderIndex: 1 })
    .lean();

  // Get user's solved problem IDs
  const solvedProblemIds = new Set(
    (
      await Solution.distinct('problemId', { userId, isAccepted: true })
    ).map((id) => id.toString())
  );

  // Get user's bookmarked problem IDs
  const bookmarkedIds = new Set(
    (await Bookmark.distinct('problemId', { userId })).map((id) => id.toString())
  );

  // Get due revision problem IDs
  const today = getUTCToday();
  const dueRevisionIds = new Set(
    (
      await Revision.distinct('problemId', {
        userId,
        $or: [
          { revision1Done: false, revision1Date: { $lte: today } },
          { revision2Done: false, revision2Date: { $lte: today } },
          { revision3Done: false, revision3Date: { $lte: today } },
        ],
      })
    ).map((id) => id.toString())
  );

  // Get latest confidence for solved problems
  const latestConfidences = await Solution.aggregate([
    { $match: { userId: req.user._id, isAccepted: true } },
    { $sort: { submittedAt: -1 } },
    { $group: { _id: '$problemId', latestConfidence: { $first: '$confidence' } } },
  ]);
  const confidenceMap = {};
  for (const c of latestConfidences) {
    confidenceMap[c._id.toString()] = c.latestConfidence;
  }

  // Enrich problems with user-specific data
  let enriched = problems.map((p) => {
    const pid = p._id.toString();
    return {
      ...p,
      xpReward: XP_VALUES[p.difficulty]?.firstSolve || 0,
      solved: solvedProblemIds.has(pid),
      bookmarked: bookmarkedIds.has(pid),
      revisionDue: dueRevisionIds.has(pid),
      latestConfidence: confidenceMap[pid] || null,
    };
  });

  // Apply user-specific filters
  if (status === 'solved') {
    enriched = enriched.filter((p) => p.solved);
  } else if (status === 'unsolved') {
    enriched = enriched.filter((p) => !p.solved);
  }

  if (bookmarked === 'true') {
    enriched = enriched.filter((p) => p.bookmarked);
  }

  if (revisionDue === 'true') {
    enriched = enriched.filter((p) => p.revisionDue);
  }

  return ApiResponse.success(res, {
    problems: enriched,
    total: await Problem.countDocuments({ isActive: true }),
    filtered: enriched.length,
  });
});

/**
 * GET /api/v1/problems/:id
 */
const getProblem = asyncHandler(async (req, res) => {
  const problem = await Problem.findById(req.params.id).lean();
  if (!problem) return ApiResponse.notFound(res, 'Problem not found.');

  // Attach user-specific status
  const userId = req.user._id;
  const pid = problem._id.toString();

  const solvedCount = await Solution.countDocuments({ userId, problemId: problem._id, isAccepted: true });
  const bookmark = await Bookmark.findOne({ userId, problemId: problem._id });

  return ApiResponse.success(res, {
    ...problem,
    xpReward: XP_VALUES[problem.difficulty]?.firstSolve || 0,
    solved: solvedCount > 0,
    bookmarked: !!bookmark,
  });
});

/**
 * GET /api/v1/problems/:id/status
 */
const getProblemStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const problemId = req.params.id;

  const solvedCount = await Solution.countDocuments({ userId, problemId, isAccepted: true });
  const bookmark = await Bookmark.findOne({ userId, problemId });
  const revision = await Revision.findOne({ userId, problemId });
  const today = getUTCToday();

  let revisionDue = false;
  if (revision) {
    revisionDue =
      (!revision.revision1Done && revision.revision1Date <= today) ||
      (!revision.revision2Done && revision.revision2Date <= today) ||
      (!revision.revision3Done && revision.revision3Date <= today);
  }

  return ApiResponse.success(res, {
    solved: solvedCount > 0,
    bookmarked: !!bookmark,
    revisionDue,
  });
});

/**
 * PATCH /api/v1/problems/:id/bookmark
 * Toggle bookmark on/off.
 */
const toggleBookmark = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const problemId = req.params.id;

  const existing = await Bookmark.findOne({ userId, problemId });
  if (existing) {
    await Bookmark.deleteOne({ _id: existing._id });
    return ApiResponse.success(res, { bookmarked: false }, 'Bookmark removed.');
  } else {
    await Bookmark.create({ userId, problemId });
    return ApiResponse.success(res, { bookmarked: true }, 'Bookmark added.');
  }
});

module.exports = { getProblems, getProblem, getProblemStatus, toggleBookmark };
