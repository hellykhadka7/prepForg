const { XP_VALUES } = require('../config/constants');
const { xpToLevel } = require('../utils/levelUtils');
const User = require('../models/User.model');
const Solution = require('../models/Solution.model');

/**
 * XP Service
 * Handles XP calculation, first-solve detection, and level-up logic.
 */

/**
 * Determine if this is the user's first accepted solve of a problem.
 * Returns { isFirstSolve, xpToAward }.
 */
const calculateXP = async (userId, problemId, difficulty) => {
  const existingAccepted = await Solution.countDocuments({
    userId,
    problemId,
    isAccepted: true,
  });

  const isFirstSolve = existingAccepted === 0;
  const xpConfig = XP_VALUES[difficulty];

  if (!xpConfig) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const xpToAward = isFirstSolve ? xpConfig.firstSolve : xpConfig.revision;

  return { isFirstSolve, xpToAward };
};

/**
 * Award XP to a user and recompute their level.
 * Returns the updated user, whether they leveled up, and the new level.
 */
const awardXP = async (userId, xpAmount) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const oldLevel = user.currentLevel;
  user.totalXP += xpAmount;
  user.currentLevel = xpToLevel(user.totalXP);
  await user.save();

  return {
    totalXP: user.totalXP,
    currentLevel: user.currentLevel,
    leveledUp: user.currentLevel > oldLevel,
  };
};

/**
 * Reverse XP when the last accepted solution is deleted.
 * Only reverses the first-solve XP (not revision XP that was already earned).
 */
const reverseFirstSolveXP = async (userId, difficulty) => {
  const xpConfig = XP_VALUES[difficulty];
  if (!xpConfig) return { xpDeducted: 0 };

  const xpToDeduct = xpConfig.firstSolve;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  user.totalXP = Math.max(0, user.totalXP - xpToDeduct);
  user.currentLevel = xpToLevel(user.totalXP);
  await user.save();

  return { xpDeducted: xpToDeduct, totalXP: user.totalXP, currentLevel: user.currentLevel };
};

module.exports = { calculateXP, awardXP, reverseFirstSolveXP };
