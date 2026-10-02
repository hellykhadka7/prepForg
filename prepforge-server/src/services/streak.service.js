const User = require('../models/User.model');
const Activity = require('../models/Activity.model');
const { getUTCToday, toUTCMidnight, isSameDay, isYesterday } = require('../utils/dateUtils');

/**
 * Streak Service
 * Handles timezone-safe streak tracking.
 * A streak is maintained if at least one problem is solved per day.
 */

/**
 * Update a user's streak after solving a problem.
 * Called after every solution submission.
 *
 * Returns { currentStreak, longestStreak, extended }.
 */
const updateStreak = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const today = getUTCToday();
  const lastActivity = user.lastActivityDate
    ? toUTCMidnight(user.lastActivityDate)
    : null;

  let extended = false;

  if (!lastActivity) {
    // First ever activity
    user.currentStreak = 1;
    user.longestStreak = 1;
    extended = true;
  } else if (isSameDay(lastActivity, today)) {
    // Already solved today — streak unchanged
    extended = false;
  } else if (isYesterday(lastActivity)) {
    // Consecutive day — extend streak
    user.currentStreak += 1;
    extended = true;
  } else {
    // Gap in activity — streak resets to 1
    user.currentStreak = 1;
    extended = true;
  }

  // Update longest streak
  if (user.currentStreak > user.longestStreak) {
    user.longestStreak = user.currentStreak;
  }

  user.lastActivityDate = today;
  await user.save();

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    extended,
  };
};

/**
 * Upsert today's activity record.
 * Called after every solution submission.
 */
const recordActivity = async (userId, problemId, xpEarned) => {
  const today = getUTCToday();

  const activity = await Activity.findOneAndUpdate(
    { userId, date: today },
    {
      $inc: { solvedCount: 1, xpEarned },
      $addToSet: { problemIds: problemId },
      $setOnInsert: { userId, date: today },
    },
    { upsert: true, new: true }
  );

  return activity;
};

module.exports = { updateStreak, recordActivity };
