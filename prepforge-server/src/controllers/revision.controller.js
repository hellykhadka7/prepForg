const Revision = require('../models/Revision.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const {
  getDueRevisions,
  getUpcomingRevisions,
  completeRevisionSlot,
  scheduleRevision,
} = require('../services/revision.service');
const { calculateXP, awardXP } = require('../services/xp.service');
const { updateStreak, recordActivity } = require('../services/streak.service');
const { checkAchievements } = require('../services/achievement.service');
const Problem = require('../models/Problem.model');

/**
 * GET /api/v1/revisions/due
 */
const getDue = asyncHandler(async (req, res) => {
  const dueItems = await getDueRevisions(req.user._id);
  const due = dueItems.filter((r) => !r.overdue);
  const overdue = dueItems.filter((r) => r.overdue);

  return ApiResponse.success(res, { due, overdue });
});

/**
 * GET /api/v1/revisions/upcoming
 */
const getUpcoming = asyncHandler(async (req, res) => {
  const upcoming = await getUpcomingRevisions(req.user._id);
  const mappedUpcoming = upcoming.map(r => ({ ...r.toObject(), problem: r.problemId }));
  return ApiResponse.success(res, { upcoming: mappedUpcoming });
});

/**
 * GET /api/v1/revisions/queue
 * Smart priority queue sorted by priorityScore.
 */
const getQueue = asyncHandler(async (req, res) => {
  const dueItems = await getDueRevisions(req.user._id);
  const upcoming = await getUpcomingRevisions(req.user._id, 14);
  const mappedUpcoming = upcoming.map(r => ({ ...r.toObject(), problem: r.problemId }));

  return ApiResponse.success(res, {
    due: dueItems.filter((r) => !r.overdue),
    overdue: dueItems.filter((r) => r.overdue),
    upcoming: mappedUpcoming,
  });
});

/**
 * GET /api/v1/revisions/problem/:problemId
 */
const getRevisionForProblem = asyncHandler(async (req, res) => {
  const revision = await Revision.findOne({
    userId: req.user._id,
    problemId: req.params.problemId,
  }).populate('problemId', 'title difficulty topic');

  if (!revision) {
    return ApiResponse.success(res, { revision: null });
  }

  return ApiResponse.success(res, { revision });
});

/**
 * PATCH /api/v1/revisions/:revisionId/complete
 * Body: { slotNumber: 1 | 2 | 3 }
 * Awards revision XP for the problem.
 */
const completeSlot = asyncHandler(async (req, res) => {
  const { slotNumber } = req.body;
  if (![1, 2, 3].includes(slotNumber)) {
    return ApiResponse.badRequest(res, 'slotNumber must be 1, 2, or 3.');
  }

  const revision = await Revision.findOne({
    _id: req.params.revisionId,
    userId: req.user._id,
  });

  if (!revision) return ApiResponse.notFound(res, 'Revision not found.');

  // Check if already done
  if (revision[`revision${slotNumber}Done`]) {
    return ApiResponse.badRequest(res, `Revision slot ${slotNumber} is already completed.`);
  }

  // Complete the slot
  const updated = await completeRevisionSlot(revision._id, slotNumber);

  // Award revision XP
  const problem = await Problem.findById(revision.problemId);
  if (problem) {
    const { xpToAward } = await calculateXP(req.user._id, revision.problemId, problem.difficulty);
    await awardXP(req.user._id, xpToAward);
    await recordActivity(req.user._id, revision.problemId, xpToAward);
    await updateStreak(req.user._id);
    await checkAchievements(req.user._id, {});
  }

  return ApiResponse.success(res, { revision: updated }, `Revision slot ${slotNumber} completed.`);
});

/**
 * POST /api/v1/revisions/problem/:problemId/reset
 * Reschedule all 3 revision slots from today.
 */
const resetRevision = asyncHandler(async (req, res) => {
  const revision = await scheduleRevision(req.user._id, req.params.problemId);
  return ApiResponse.success(res, { revision }, 'Revision schedule reset.');
});

module.exports = { getDue, getUpcoming, getQueue, getRevisionForProblem, completeSlot, resetRevision };
