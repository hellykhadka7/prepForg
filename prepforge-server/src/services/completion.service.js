/**
 * Completion Service
 *
 * Provides the canonical set of "completed" problem IDs for a user.
 * A problem is considered completed if EITHER:
 *   1. The user has at least one accepted Solution record, OR
 *   2. The user has set UserProblemStatus.status = 'completed'.
 *
 * IMPORTANT: This service does NOT create fake Solution, Activity, Revision,
 * or Achievement records. It is purely a read-only query utility.
 *
 * Metrics that depend on genuine code submissions (XP, streaks, solve duration,
 * confidence, mistakes, weekly submission charts) must continue querying the
 * Solution collection directly.
 */

const Solution = require('../models/Solution.model');
const UserProblemStatus = require('../models/UserProblemStatus.model');
const { getUTCToday } = require('../utils/dateUtils');

/**
 * Return an array of unique problem ObjectIds that the user has completed
 * through either accepted submissions or manual status tracking.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const getCompletedProblemIds = async (userId) => {
  const [solutionIds, statusIds] = await Promise.all([
    Solution.distinct('problemId', { userId, isAccepted: true }),
    UserProblemStatus.distinct('problemId', { userId, status: 'completed' }),
  ]);

  // Merge into a unique set (ObjectId → string → deduplicate → back to ObjectId)
  const seen = new Set();
  const merged = [];

  for (const id of solutionIds) {
    const key = id.toString();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(id);
    }
  }
  for (const id of statusIds) {
    const key = id.toString();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(id);
    }
  }

  return merged;
};

/**
 * Return an array of unique problem ObjectIds that the user completed TODAY
 * (either first accepted submission today, or manually marked 'completed' today).
 * Deduplicates problems so solving both ways today counts exactly once.
 * Excludes problems that were already completed prior to today.
 *
 * @param {import('mongoose').Types.ObjectId|string} userId
 * @param {Date} [today] - UTC midnight date boundary (defaults to getUTCToday())
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
const getCompletedTodayProblemIds = async (userId, today = getUTCToday()) => {
  // 1. Problems solved before today via accepted solution (to prevent re-counting prior solves)
  const priorSolvedIds = new Set(
    (
      await Solution.distinct('problemId', {
        userId,
        isAccepted: true,
        submittedAt: { $lt: today },
      })
    ).map((id) => id.toString())
  );

  // 2. Today's accepted solutions
  const todaysSolutions = await Solution.distinct('problemId', {
    userId,
    isAccepted: true,
    submittedAt: { $gte: today },
  });

  // 3. Today's manual completions
  const todaysStatuses = await UserProblemStatus.distinct('problemId', {
    userId,
    status: 'completed',
    updatedAt: { $gte: today },
  });

  // Merge into unique set, excluding anything solved before today
  const seen = new Set();
  const merged = [];

  for (const id of todaysSolutions) {
    const key = id.toString();
    if (!priorSolvedIds.has(key) && !seen.has(key)) {
      seen.add(key);
      merged.push(id);
    }
  }

  for (const id of todaysStatuses) {
    const key = id.toString();
    if (!priorSolvedIds.has(key) && !seen.has(key)) {
      seen.add(key);
      merged.push(id);
    }
  }

  return merged;
};

module.exports = { getCompletedProblemIds, getCompletedTodayProblemIds };
