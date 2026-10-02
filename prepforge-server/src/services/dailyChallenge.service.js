const Solution = require('../models/Solution.model');
const Problem = require('../models/Problem.model');
const Revision = require('../models/Revision.model');
const mongoose = require('mongoose');
const { getUTCToday } = require('../utils/dateUtils');

/**
 * Daily Challenge Service
 * Generates recommended problems based on weak topics, unsolved problems,
 * and overdue revisions. All data-driven.
 */

/**
 * Generate today's recommended challenge for a user.
 * Returns 2-3 problems the user should focus on.
 */
const generateDailyChallenge = async (userId) => {
  const oid = new mongoose.Types.ObjectId(userId);
  const today = getUTCToday();

  // 1. Get user's weakest topics (by avg confidence)
  const topicStats = await Solution.aggregate([
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
    { $sort: { avgConfidence: 1 } },
    { $limit: 3 },
  ]);

  const weakTopics = topicStats.map((t) => t._id);

  // 2. Get IDs of all solved problems
  const solvedProblemIds = await Solution.distinct('problemId', {
    userId: oid,
    isAccepted: true,
  });

  // 3. Get overdue revision problem IDs
  const overdueRevisions = await Revision.find({
    userId: oid,
    $or: [
      { revision1Done: false, revision1Date: { $lte: today } },
      { revision2Done: false, revision2Date: { $lte: today } },
      { revision3Done: false, revision3Date: { $lte: today } },
    ],
  })
    .sort({ priorityScore: -1 })
    .limit(1)
    .lean();

  const challengeProblems = [];

  // Add one overdue revision problem
  if (overdueRevisions.length > 0) {
    const revProblem = await Problem.findById(overdueRevisions[0].problemId).lean();
    if (revProblem) {
      challengeProblems.push({
        ...revProblem,
        reason: 'Overdue revision',
      });
    }
  }

  // Add unsolved problems from weak topics
  for (const topic of weakTopics) {
    if (challengeProblems.length >= 3) break;

    const unsolved = await Problem.findOne({
      topic,
      isActive: true,
      _id: { $nin: solvedProblemIds },
    }).lean();

    if (unsolved && !challengeProblems.find((p) => p._id.toString() === unsolved._id.toString())) {
      challengeProblems.push({
        ...unsolved,
        reason: `Weak topic: ${topic}`,
      });
    }
  }

  // If we still don't have 3, add any unsolved problem
  if (challengeProblems.length < 3) {
    const remaining = await Problem.find({
      isActive: true,
      _id: {
        $nin: [
          ...solvedProblemIds,
          ...challengeProblems.map((p) => p._id),
        ],
      },
    })
      .limit(3 - challengeProblems.length)
      .lean();

    for (const p of remaining) {
      challengeProblems.push({ ...p, reason: 'Unsolved' });
    }
  }

  return challengeProblems;
};

module.exports = { generateDailyChallenge };
