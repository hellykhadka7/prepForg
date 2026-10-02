const Revision = require('../models/Revision.model');
const Solution = require('../models/Solution.model');
const { REVISION_INTERVALS, PRIORITY_WEIGHTS } = require('../config/constants');
const { addDays, getUTCToday, daysBetween } = require('../utils/dateUtils');

/**
 * Revision Service
 * Manages spaced repetition scheduling and smart priority scoring.
 */

/**
 * Create a revision schedule for a first-solve.
 * Spaced repetition: +1 day, +7 days, +30 days from today.
 */
const scheduleRevision = async (userId, problemId) => {
  const today = getUTCToday();

  // Use upsert to handle re-scheduling (e.g., after reset)
  const revision = await Revision.findOneAndUpdate(
    { userId, problemId },
    {
      revision1Date: addDays(today, REVISION_INTERVALS.revision1),
      revision2Date: addDays(today, REVISION_INTERVALS.revision2),
      revision3Date: addDays(today, REVISION_INTERVALS.revision3),
      revision1Done: false,
      revision2Done: false,
      revision3Done: false,
      priorityScore: 0,
    },
    { upsert: true, new: true }
  );

  return revision;
};

/**
 * Mark a revision slot as completed and recompute priority.
 * slotNumber: 1, 2, or 3
 */
const completeRevisionSlot = async (revisionId, slotNumber) => {
  const field = `revision${slotNumber}Done`;
  const update = { [field]: true };

  const revision = await Revision.findByIdAndUpdate(
    revisionId,
    update,
    { new: true }
  );

  if (!revision) throw new Error('Revision not found');

  // Recompute priority score
  await recomputePriority(revision);

  return revision;
};

/**
 * Compute priority score for a revision based on:
 * - Confidence score from latest solution
 * - Number of mistakes from latest solution
 * - Days since last revision or solve
 */
const recomputePriority = async (revision) => {
  const today = getUTCToday();

  // Get the latest solution for confidence and mistake data
  const latestSolution = await Solution.findOne({
    userId: revision.userId,
    problemId: revision.problemId,
    isAccepted: true,
  }).sort({ submittedAt: -1 });

  if (!latestSolution) {
    revision.priorityScore = 0;
    await revision.save();
    return;
  }

  const confidence = latestSolution.confidence || 3;
  const mistakeCount = latestSolution.mistakes ? latestSolution.mistakes.length : 0;
  const daysSinceSolve = daysBetween(latestSolution.submittedAt, today);

  const score =
    (6 - confidence) * PRIORITY_WEIGHTS.confidenceWeight +
    mistakeCount * PRIORITY_WEIGHTS.mistakeWeight +
    daysSinceSolve * PRIORITY_WEIGHTS.dayElapsedWeight;

  revision.priorityScore = Math.round(score * 10) / 10;
  await revision.save();
};

/**
 * Get all revisions due today or overdue for a user.
 */
const getDueRevisions = async (userId) => {
  const today = getUTCToday();

  const revisions = await Revision.find({
    userId,
    $or: [
      { revision1Done: false, revision1Date: { $lte: today } },
      { revision2Done: false, revision2Date: { $lte: today } },
      { revision3Done: false, revision3Date: { $lte: today } },
    ],
  })
    .populate('problemId', 'title difficulty topic week')
    .sort({ priorityScore: -1 });

  // Build a flat list of due revision slots
  const dueItems = [];
  for (const rev of revisions) {
    if (!rev.revision1Done && rev.revision1Date <= today) {
      dueItems.push({
        _id: rev._id,
        problem: rev.problemId,
        revisionSlot: 1,
        dueDate: rev.revision1Date,
        priorityScore: rev.priorityScore,
        overdue: rev.revision1Date < today,
      });
    }
    if (!rev.revision2Done && rev.revision2Date <= today) {
      dueItems.push({
        _id: rev._id,
        problem: rev.problemId,
        revisionSlot: 2,
        dueDate: rev.revision2Date,
        priorityScore: rev.priorityScore,
        overdue: rev.revision2Date < today,
      });
    }
    if (!rev.revision3Done && rev.revision3Date <= today) {
      dueItems.push({
        _id: rev._id,
        problem: rev.problemId,
        revisionSlot: 3,
        dueDate: rev.revision3Date,
        priorityScore: rev.priorityScore,
        overdue: rev.revision3Date < today,
      });
    }
  }

  // Sort by priority descending
  dueItems.sort((a, b) => b.priorityScore - a.priorityScore);

  return dueItems;
};

/**
 * Get upcoming revisions for the next N days.
 */
const getUpcomingRevisions = async (userId, days = 14) => {
  const today = getUTCToday();
  const futureDate = addDays(today, days);

  const revisions = await Revision.find({
    userId,
    $or: [
      { revision1Done: false, revision1Date: { $gt: today, $lte: futureDate } },
      { revision2Done: false, revision2Date: { $gt: today, $lte: futureDate } },
      { revision3Done: false, revision3Date: { $gt: today, $lte: futureDate } },
    ],
  })
    .populate('problemId', 'title difficulty topic week')
    .sort({ revision1Date: 1 });

  return revisions;
};

module.exports = {
  scheduleRevision,
  completeRevisionSlot,
  recomputePriority,
  getDueRevisions,
  getUpcomingRevisions,
};
