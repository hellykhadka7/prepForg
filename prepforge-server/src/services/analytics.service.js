const Solution = require('../models/Solution.model');
const Problem = require('../models/Problem.model');
const Revision = require('../models/Revision.model');
const Activity = require('../models/Activity.model');
const { getUTCToday, addDays, getISOWeek } = require('../utils/dateUtils');
const { getCompletedProblemIds } = require('./completion.service');
const mongoose = require('mongoose');

/**
 * Analytics Service
 * MongoDB aggregation pipelines for all chart data.
 * Every metric is derived from real persisted data.
 */

/**
 * Problems solved per calendar week.
 */
const getWeeklyStats = async (userId) => {
  const solutions = await Solution.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isAccepted: true, isFirstSolve: true } },
    {
      $lookup: {
        from: 'problems',
        localField: 'problemId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: '$problem' },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: '$submittedAt' },
          week: { $isoWeek: '$submittedAt' },
        },
        easy: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Hard'] }, 1, 0] } },
        total: { $sum: 1 },
        xp: { $sum: '$xpAwarded' },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1 } },
  ]);

  return solutions.map((s) => ({
    week: `${s._id.year}-W${String(s._id.week).padStart(2, '0')}`,
    easy: s.easy,
    medium: s.medium,
    hard: s.hard,
    total: s.total,
    xp: s.xp,
  }));
};

/**
 * Difficulty distribution: Easy / Medium / Hard counts.
 * Uses the union of accepted solutions + manual completions.
 */
const getDifficultyDistribution = async (userId) => {
  const completedIds = await getCompletedProblemIds(userId);

  if (completedIds.length === 0) {
    return { Easy: 0, Medium: 0, Hard: 0 };
  }

  const result = await Problem.aggregate([
    { $match: { _id: { $in: completedIds }, isActive: true } },
    { $group: { _id: '$difficulty', count: { $sum: 1 } } },
  ]);

  const distribution = { Easy: 0, Medium: 0, Hard: 0 };
  for (const r of result) {
    distribution[r._id] = r.count;
  }
  return distribution;
};

/**
 * Topic distribution + average confidence.
 * 'solved' count uses the completion union (submitted + manual).
 * 'avgConfidence' is based only on actual Solution records (genuine data).
 */
const getTopicStats = async (userId) => {
  const oid = new mongoose.Types.ObjectId(userId);
  const completedIds = await getCompletedProblemIds(userId);

  // Completed count per topic (union-based)
  const topicCounts = {};
  if (completedIds.length > 0) {
    const countResult = await Problem.aggregate([
      { $match: { _id: { $in: completedIds }, isActive: true } },
      { $group: { _id: '$topic', solved: { $sum: 1 } } },
    ]);
    for (const r of countResult) {
      topicCounts[r._id] = r.solved;
    }
  }

  // Average confidence per topic from actual submissions only
  const confidenceResult = await Solution.aggregate([
    { $match: { userId: oid, isAccepted: true } },
    {
      $lookup: {
        from: 'problems',
        localField: 'problemId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: '$problem' },
    {
      $group: {
        _id: { topic: '$problem.topic', problemId: '$problemId' },
        latestConfidence: { $last: '$confidence' },
      },
    },
    {
      $group: {
        _id: '$_id.topic',
        avgConfidence: { $avg: '$latestConfidence' },
      },
    },
  ]);

  const confidenceMap = {};
  for (const r of confidenceResult) {
    confidenceMap[r._id] = r.avgConfidence;
  }

  // Merge: all topics from completedIds get a row; avgConfidence from submissions
  const allTopics = new Set([...Object.keys(topicCounts), ...Object.keys(confidenceMap)]);
  const merged = [];
  for (const topic of allTopics) {
    merged.push({
      _id: topic,
      solved: topicCounts[topic] || 0,
      avgConfidence: confidenceMap[topic] || null,
    });
  }

  merged.sort((a, b) => b.solved - a.solved);
  return merged;
};

/**
 * Pattern distribution.
 * Uses the completion union (submitted + manual) for problem counts.
 */
const getPatternStats = async (userId) => {
  const completedIds = await getCompletedProblemIds(userId);

  if (completedIds.length === 0) return [];

  return Problem.aggregate([
    { $match: { _id: { $in: completedIds }, isActive: true } },
    { $unwind: '$patterns' },
    {
      $group: {
        _id: '$patterns',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

/**
 * Revision completion rate per slot.
 */
const getRevisionStats = async (userId) => {
  const revisions = await Revision.find({ userId }).lean();

  const stats = { total: revisions.length, r1Done: 0, r2Done: 0, r3Done: 0 };
  for (const r of revisions) {
    if (r.revision1Done) stats.r1Done++;
    if (r.revision2Done) stats.r2Done++;
    if (r.revision3Done) stats.r3Done++;
  }

  return {
    total: stats.total,
    revision1Rate: stats.total > 0 ? Math.round((stats.r1Done / stats.total) * 100) : 0,
    revision2Rate: stats.total > 0 ? Math.round((stats.r2Done / stats.total) * 100) : 0,
    revision3Rate: stats.total > 0 ? Math.round((stats.r3Done / stats.total) * 100) : 0,
  };
};

/**
 * Mistake type frequency.
 */
const getMistakeDistribution = async (userId) => {
  return Solution.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isAccepted: true } },
    { $unwind: '$mistakes' },
    { $group: { _id: '$mistakes', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
};

/**
 * XP growth over time (cumulative).
 */
const getXPGrowth = async (userId) => {
  return Activity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { date: 1 } },
    {
      $group: {
        _id: null,
        entries: {
          $push: { date: '$date', xp: '$xpEarned' },
        },
      },
    },
  ]).then((result) => {
    if (!result.length || !result[0].entries.length) return [];
    let cumulative = 0;
    return result[0].entries.map((e) => {
      cumulative += e.xp;
      return { date: e.date, xp: e.xp, cumulativeXP: cumulative };
    });
  });
};

/**
 * Confidence distribution by difficulty.
 */
const getConfidenceStats = async (userId) => {
  return Solution.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), isAccepted: true } },
    {
      $lookup: {
        from: 'problems',
        localField: 'problemId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: '$problem' },
    {
      $group: {
        _id: '$problem.difficulty',
        avgConfidence: { $avg: '$confidence' },
        count: { $sum: 1 },
      },
    },
  ]);
};

/**
 * Average solve time by difficulty.
 */
const getSolveTimeStats = async (userId) => {
  return Solution.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        isAccepted: true,
        solveDuration: { $gt: 0 },
      },
    },
    {
      $lookup: {
        from: 'problems',
        localField: 'problemId',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: '$problem' },
    {
      $group: {
        _id: '$problem.difficulty',
        avgTime: { $avg: '$solveDuration' },
        minTime: { $min: '$solveDuration' },
        maxTime: { $max: '$solveDuration' },
      },
    },
  ]);
};

module.exports = {
  getWeeklyStats,
  getDifficultyDistribution,
  getTopicStats,
  getPatternStats,
  getRevisionStats,
  getMistakeDistribution,
  getXPGrowth,
  getConfidenceStats,
  getSolveTimeStats,
};
