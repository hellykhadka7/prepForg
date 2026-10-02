const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { addDays, getUTCToday } = require('../utils/dateUtils');

/**
 * GET /api/v1/activities/heatmap
 * Last 365 days of daily activity for GitHub-style heatmap.
 */
const getHeatmap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const today = getUTCToday();
  const yearAgo = addDays(today, -365);

  const activities = await Activity.find({
    userId,
    date: { $gte: yearAgo, $lte: today },
  })
    .sort({ date: 1 })
    .lean();

  // Build a full 365-day array (fill gaps with zeros)
  const heatmap = [];
  const activityMap = {};
  for (const a of activities) {
    activityMap[a.date.toISOString().split('T')[0]] = {
      solvedCount: a.solvedCount,
      xpEarned: a.xpEarned,
    };
  }

  for (let i = 0; i <= 365; i++) {
    const date = addDays(yearAgo, i);
    const dateStr = date.toISOString().split('T')[0];
    const data = activityMap[dateStr] || { solvedCount: 0, xpEarned: 0 };
    heatmap.push({ date: dateStr, ...data });
  }

  return ApiResponse.success(res, { heatmap, totalDays: 365 });
});

/**
 * GET /api/v1/activities/recent
 * Last 10 activity entries.
 */
const getRecentActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ userId: req.user._id })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  return ApiResponse.success(res, { activities });
});

/**
 * GET /api/v1/activities/streak
 */
const getStreak = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('currentStreak longestStreak lastActivityDate');
  return ApiResponse.success(res, {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastActivityDate: user.lastActivityDate,
  });
});

module.exports = { getHeatmap, getRecentActivity, getStreak };
