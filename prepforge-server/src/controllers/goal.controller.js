const Goal = require('../models/Goal.model');
const Solution = require('../models/Solution.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { getUTCToday, isWeekend } = require('../utils/dateUtils');
const mongoose = require('mongoose');

/**
 * GET /api/v1/goals
 */
const getGoals = asyncHandler(async (req, res) => {
  let goals = await Goal.findOne({ userId: req.user._id });
  if (!goals) {
    goals = await Goal.create({ userId: req.user._id });
  }
  return ApiResponse.success(res, { goals });
});

/**
 * PUT /api/v1/goals
 */
const upsertGoals = asyncHandler(async (req, res) => {
  const { easyTarget, mediumTarget, hardTarget, weekendBonus, weekendBonusEnabled } = req.body;

  const goals = await Goal.findOneAndUpdate(
    { userId: req.user._id },
    {
      easyTarget: easyTarget ?? 3,
      mediumTarget: mediumTarget ?? 2,
      hardTarget: hardTarget ?? 1,
      weekendBonus: weekendBonus ?? 0,
      weekendBonusEnabled: weekendBonusEnabled ?? false,
    },
    { upsert: true, new: true, runValidators: true }
  );

  return ApiResponse.success(res, { goals }, 'Goals updated.');
});

/**
 * GET /api/v1/goals/progress
 * Today's progress vs targets.
 */
const getProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = getUTCToday();
  const oid = new mongoose.Types.ObjectId(userId);

  const goals = await Goal.findOne({ userId }).lean();
  if (!goals) {
    return ApiResponse.success(res, {
      easyTarget: 3, mediumTarget: 2, hardTarget: 1,
      easyDone: 0, mediumDone: 0, hardDone: 0,
    });
  }

  // Count today's first-solves by difficulty
  const todaysSolutions = await Solution.aggregate([
    {
      $match: {
        userId: oid,
        isAccepted: true,
        isFirstSolve: true,
        submittedAt: { $gte: today },
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
        count: { $sum: 1 },
      },
    },
  ]);

  const todaySolved = { Easy: 0, Medium: 0, Hard: 0 };
  for (const s of todaysSolutions) {
    todaySolved[s._id] = s.count;
  }

  const weekendExtra = goals.weekendBonusEnabled && isWeekend() ? goals.weekendBonus : 0;

  return ApiResponse.success(res, {
    easyTarget: goals.easyTarget + weekendExtra,
    mediumTarget: goals.mediumTarget + weekendExtra,
    hardTarget: goals.hardTarget + weekendExtra,
    easyDone: todaySolved.Easy,
    mediumDone: todaySolved.Medium,
    hardDone: todaySolved.Hard,
  });
});

module.exports = { getGoals, upsertGoals, getProgress };
