const Achievement = require('../models/Achievement.model');
const Solution = require('../models/Solution.model');
const Revision = require('../models/Revision.model');
const Problem = require('../models/Problem.model');
const User = require('../models/User.model');

/**
 * Achievement Service
 * Dynamically checks and unlocks achievements after each solution submit.
 * Returns an array of newly unlocked achievement names.
 */

/**
 * Run all achievement checks for a user after a solution submission.
 * Returns array of newly unlocked achievements.
 */
const checkAchievements = async (userId, solutionData = {}) => {
  const newlyUnlocked = [];
  const existing = await Achievement.find({ userId }).lean();
  const existingNames = new Set(existing.map((a) => a.achievementName));

  // Helper: unlock if not already unlocked
  const unlock = async (name) => {
    if (!existingNames.has(name)) {
      await Achievement.create({ userId, achievementName: name });
      newlyUnlocked.push(name);
    }
  };

  // Count unique accepted problems
  const uniqueSolved = await Solution.distinct('problemId', {
    userId,
    isAccepted: true,
  });
  const solvedCount = uniqueSolved.length;

  // ─── First Problem Solved ───
  if (solvedCount >= 1) {
    await unlock('First Problem Solved');
  }

  // ─── 50 Problems Solved ───
  if (solvedCount >= 50) {
    await unlock('50 Problems Solved');
  }

  // ─── 100 Problems Solved ───
  if (solvedCount >= 100) {
    await unlock('100 Problems Solved');
  }

  // ─── Streak achievements ───
  const user = await User.findById(userId).lean();
  if (user) {
    if (user.currentStreak >= 7) {
      await unlock('7 Day Streak');
    }
    if (user.currentStreak >= 30) {
      await unlock('30 Day Streak');
    }
  }

  // ─── First Hard Problem ───
  if (solutionData.difficulty === 'Hard' && solutionData.isFirstSolve) {
    const hardSolvedCount = await Solution.countDocuments({
      userId,
      isAccepted: true,
      isFirstSolve: true,
    });
    // Check if this is the first hard problem by looking at the problem
    const hardProblems = await Solution.find({ userId, isAccepted: true, isFirstSolve: true })
      .populate('problemId', 'difficulty');
    const hardFirst = hardProblems.filter(
      (s) => s.problemId && s.problemId.difficulty === 'Hard'
    );
    if (hardFirst.length === 1) {
      await unlock('First Hard Problem');
    }
  }

  // ─── Topic Masters (Graph Master, DP Master) ───
  const topicMasters = [
    { name: 'Graph Master', topic: 'Graph' },
    { name: 'DP Master', topic: 'DP' },
  ];
  for (const tm of topicMasters) {
    if (!existingNames.has(tm.name)) {
      const totalInTopic = await Problem.countDocuments({ topic: tm.topic, isActive: true });
      if (totalInTopic > 0) {
        const solvedInTopic = await Solution.aggregate([
          { $match: { userId: user._id, isAccepted: true } },
          { $lookup: { from: 'problems', localField: 'problemId', foreignField: '_id', as: 'problem' } },
          { $unwind: '$problem' },
          { $match: { 'problem.topic': tm.topic } },
          { $group: { _id: '$problemId' } },
        ]);
        if (solvedInTopic.length >= totalInTopic) {
          await unlock(tm.name);
        }
      }
    }
  }

  // ─── Revision Warrior (25 revisions completed) ───
  const completedRevisions = await Revision.countDocuments({
    userId,
    $or: [
      { revision1Done: true },
      { revision2Done: true },
      { revision3Done: true },
    ],
  });
  // Count total completed slots
  const allRevisions = await Revision.find({ userId }).lean();
  let totalSlotsDone = 0;
  for (const r of allRevisions) {
    if (r.revision1Done) totalSlotsDone++;
    if (r.revision2Done) totalSlotsDone++;
    if (r.revision3Done) totalSlotsDone++;
  }
  if (totalSlotsDone >= 25) {
    await unlock('Revision Warrior');
  }

  // ─── Perfectionist (10 problems with confidence 5) ───
  const highConfidence = await Solution.aggregate([
    { $match: { userId: user._id, isAccepted: true, confidence: 5 } },
    { $group: { _id: '$problemId' } },
  ]);
  if (highConfidence.length >= 10) {
    await unlock('Perfectionist');
  }

  // ─── Speed Demon (solve in under 5 minutes) ───
  if (solutionData.solveDuration && solutionData.solveDuration > 0 && solutionData.solveDuration < 300) {
    await unlock('Speed Demon');
  }

  // ─── No Mistakes (10 solutions with zero mistakes) ───
  const cleanSolves = await Solution.countDocuments({
    userId,
    isAccepted: true,
    mistakes: { $size: 0 },
  });
  if (cleanSolves >= 10) {
    await unlock('No Mistakes');
  }

  return newlyUnlocked;
};

module.exports = { checkAchievements };
