const Achievement = require('../models/Achievement.model');
const { ACHIEVEMENT_DEFINITIONS } = require('../config/constants');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/v1/achievements
 * All unlocked achievements for the current user.
 */
const getUnlocked = asyncHandler(async (req, res) => {
  const achievements = await Achievement.find({ userId: req.user._id })
    .sort({ unlockedAt: -1 })
    .lean();

  return ApiResponse.success(res, { achievements });
});

/**
 * GET /api/v1/achievements/all
 * All possible achievements with unlock status.
 */
const getAllWithStatus = asyncHandler(async (req, res) => {
  const unlocked = await Achievement.find({ userId: req.user._id }).lean();
  const unlockedNames = new Set(unlocked.map((a) => a.achievementName));

  const all = ACHIEVEMENT_DEFINITIONS.map((def) => ({
    name: def.name,
    description: def.description,
    icon: def.icon,
    unlocked: unlockedNames.has(def.name),
    unlockedAt: unlocked.find((a) => a.achievementName === def.name)?.unlockedAt || null,
  }));

  return ApiResponse.success(res, { achievements: all });
});

module.exports = { getUnlocked, getAllWithStatus };
