const { z } = require('zod');
const Problem = require('../models/Problem.model');
const Solution = require('../models/Solution.model');
const Bookmark = require('../models/Bookmark.model');
const Revision = require('../models/Revision.model');
const UserProblemStatus = require('../models/UserProblemStatus.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { XP_VALUES, PATTERNS, DIFFICULTIES } = require('../config/constants');
const { getUTCToday } = require('../utils/dateUtils');

// ──────────────────────────────────────────────────────────
//  Validation
// ──────────────────────────────────────────────────────────

const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required').trim(),
  difficulty: z.enum(DIFFICULTIES),
  topic: z.string().trim().default(''),
  patterns: z.array(z.string()).default([]),
  sourceUrl: z.string().trim().default(''),
  description: z.string().default(''),
});

const updateProblemSchema = createProblemSchema.partial();

// ──────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────

/**
 * Build a map of problemId → user status from UserProblemStatus.
 * Absence of a record means 'not_started'.
 */
const buildStatusMap = async (userId, problemIds) => {
  const statuses = await UserProblemStatus.find({
    userId,
    problemId: { $in: problemIds },
  }).lean();

  const map = {};
  for (const s of statuses) {
    map[s.problemId.toString()] = s.status;
  }
  return map;
};

// ──────────────────────────────────────────────────────────
//  Controllers
// ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/problems
 * List all problems (seeded + user's custom) with per-user
 * solve/bookmark/revision/status data.
 * Filters: week, topic, pattern, difficulty, status, bookmarked, revisionDue, q
 */
const getProblems = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { week, topic, pattern, difficulty, status, bookmarked, revisionDue, q } = req.query;

  // Build problem filter — include seeded (isCustom not true) + user's own custom
  const filter = {
    isActive: true,
    $or: [
      { isCustom: { $ne: true } },
      { isCustom: true, createdBy: userId },
    ],
  };

  if (week) filter.week = parseInt(week, 10);
  if (topic) filter.topic = topic;
  if (pattern) filter.patterns = pattern;
  if (difficulty) filter.difficulty = difficulty;
  if (q) {
    filter.$and = [
      {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { topic: { $regex: q, $options: 'i' } },
          { patterns: { $regex: q, $options: 'i' } },
        ],
      },
    ];
    // Remove the top-level $or if $and is being used to avoid conflicts
    if (filter.$or) {
      filter.$and.push({ $or: filter.$or });
      delete filter.$or;
    }
  }

  // Fetch problems ordered: seeded first (week→orderIndex), then custom by createdAt
  const problems = await Problem.find(filter)
    .sort({ isCustom: 1, week: 1, orderIndex: 1, createdAt: -1 })
    .lean();

  const problemIds = problems.map((p) => p._id);

  // Parallel data fetches
  const [solvedProblemIds, bookmarkedIds, dueRevisionIds, statusMap] = await Promise.all([
    Solution.distinct('problemId', { userId, isAccepted: true }).then(
      (ids) => new Set(ids.map((id) => id.toString()))
    ),
    Bookmark.distinct('problemId', { userId }).then(
      (ids) => new Set(ids.map((id) => id.toString()))
    ),
    (async () => {
      const today = getUTCToday();
      const ids = await Revision.distinct('problemId', {
        userId,
        $or: [
          { revision1Done: false, revision1Date: { $lte: today } },
          { revision2Done: false, revision2Date: { $lte: today } },
          { revision3Done: false, revision3Date: { $lte: today } },
        ],
      });
      return new Set(ids.map((id) => id.toString()));
    })(),
    buildStatusMap(userId, problemIds),
  ]);

  // Latest confidence per solved problem
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
      status: statusMap[pid] || 'not_started',
    };
  });

  // Apply user-specific filters (status, bookmarked, revisionDue)
  if (status === 'solved') {
    enriched = enriched.filter((p) => p.solved);
  } else if (status === 'unsolved') {
    enriched = enriched.filter((p) => !p.solved);
  } else if (['not_started', 'completed', 'on_hold', 'skipped'].includes(status)) {
    enriched = enriched.filter((p) => p.status === status);
  }

  if (bookmarked === 'true') {
    enriched = enriched.filter((p) => p.bookmarked);
  }

  if (revisionDue === 'true') {
    enriched = enriched.filter((p) => p.revisionDue);
  }

  return ApiResponse.success(res, {
    problems: enriched,
    total: await Problem.countDocuments({
      isActive: true,
      $or: [{ isCustom: { $ne: true } }, { isCustom: true, createdBy: userId }],
    }),
    filtered: enriched.length,
  });
});

/**
 * GET /api/v1/problems/:id
 */
const getProblem = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Allow access to seeded problems OR own custom problems
  const problem = await Problem.findOne({
    _id: req.params.id,
    isActive: true,
    $or: [{ isCustom: { $ne: true } }, { isCustom: true, createdBy: userId }],
  }).lean();

  if (!problem) return ApiResponse.notFound(res, 'Problem not found.');

  const pid = problem._id;
  const [solvedCount, bookmark, statusDoc] = await Promise.all([
    Solution.countDocuments({ userId, problemId: pid, isAccepted: true }),
    Bookmark.findOne({ userId, problemId: pid }),
    UserProblemStatus.findOne({ userId, problemId: pid }),
  ]);

  return ApiResponse.success(res, {
    ...problem,
    xpReward: XP_VALUES[problem.difficulty]?.firstSolve || 0,
    solved: solvedCount > 0,
    bookmarked: !!bookmark,
    status: statusDoc?.status || 'not_started',
  });
});

/**
 * GET /api/v1/problems/:id/status
 */
const getProblemStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const problemId = req.params.id;

  const [solvedCount, bookmark, revision, statusDoc] = await Promise.all([
    Solution.countDocuments({ userId, problemId, isAccepted: true }),
    Bookmark.findOne({ userId, problemId }),
    Revision.findOne({ userId, problemId }),
    UserProblemStatus.findOne({ userId, problemId }),
  ]);

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
    status: statusDoc?.status || 'not_started',
  });
});

/**
 * PATCH /api/v1/problems/:id/mystatus
 * Set the user's personal tracking status for a problem.
 * Valid values: not_started | completed | on_hold | skipped
 * Does NOT touch Solution, Revision, or Activity records.
 */
const setMyStatus = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const problemId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['not_started', 'completed', 'on_hold', 'skipped'];
  if (!validStatuses.includes(status)) {
    return ApiResponse.badRequest(
      res,
      `Invalid status. Must be one of: ${validStatuses.join(', ')}`
    );
  }

  // Verify problem is accessible to this user
  const problem = await Problem.findOne({
    _id: problemId,
    isActive: true,
    $or: [{ isCustom: { $ne: true } }, { isCustom: true, createdBy: userId }],
  });
  if (!problem) return ApiResponse.notFound(res, 'Problem not found.');

  const statusDoc = await UserProblemStatus.findOneAndUpdate(
    { userId, problemId },
    { status },
    { upsert: true, new: true }
  );

  return ApiResponse.success(res, { status: statusDoc.status }, 'Status updated.');
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

// ──────────────────────────────────────────────────────────
//  Custom Problem CRUD
// ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/problems
 * Create a custom (user-owned) problem.
 */
const createCustomProblem = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const parsed = createProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  const { title, difficulty, topic, patterns, sourceUrl, description } = parsed.data;

  // Prevent duplicate title within user's custom problems
  const duplicate = await Problem.findOne({
    title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    isCustom: true,
    createdBy: userId,
    isActive: true,
  });
  if (duplicate) {
    return ApiResponse.badRequest(res, 'You already have a custom problem with this title.');
  }

  const problem = await Problem.create({
    title,
    difficulty,
    topic,
    patterns,
    sourceUrl,
    description,
    isCustom: true,
    createdBy: userId,
    week: 0,
    orderIndex: 0,
    isActive: true,
  });

  return ApiResponse.created(res, { problem }, 'Custom problem created.');
});

/**
 * PATCH /api/v1/problems/:id
 * Update a user-owned custom problem (ownership-checked).
 */
const updateCustomProblem = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only owner can edit their custom problems
  const problem = await Problem.findOne({
    _id: req.params.id,
    isCustom: true,
    createdBy: userId,
    isActive: true,
  });
  if (!problem) {
    return ApiResponse.notFound(
      res,
      'Custom problem not found or you are not the owner.'
    );
  }

  const parsed = updateProblemSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  const { title, difficulty, topic, patterns, sourceUrl, description } = parsed.data;

  if (title !== undefined) problem.title = title;
  if (difficulty !== undefined) problem.difficulty = difficulty;
  if (topic !== undefined) problem.topic = topic;
  if (patterns !== undefined) problem.patterns = patterns;
  if (sourceUrl !== undefined) problem.sourceUrl = sourceUrl;
  if (description !== undefined) problem.description = description;

  await problem.save();

  return ApiResponse.success(res, { problem }, 'Custom problem updated.');
});

/**
 * DELETE /api/v1/problems/:id
 * Soft-delete a user-owned custom problem (ownership-checked).
 *
 * SAFETY: Sets isActive=false only. Does NOT delete Solution, Note,
 * Bookmark, Revision, or Activity records associated with this problem.
 * Historical data is preserved; the problem simply disappears from listings.
 */
const deleteCustomProblem = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const problem = await Problem.findOne({
    _id: req.params.id,
    isCustom: true,
    createdBy: userId,
    isActive: true,
  });

  if (!problem) {
    return ApiResponse.notFound(
      res,
      'Custom problem not found or you are not the owner.'
    );
  }

  // Soft delete — preserve all associated Solution/Note/Revision/Bookmark records
  problem.isActive = false;
  await problem.save();

  return ApiResponse.success(
    res,
    { deleted: true, problemId: problem._id },
    'Custom problem removed. Associated solutions, notes, and revisions are preserved.'
  );
});

module.exports = {
  getProblems,
  getProblem,
  getProblemStatus,
  setMyStatus,
  toggleBookmark,
  createCustomProblem,
  updateCustomProblem,
  deleteCustomProblem,
};
