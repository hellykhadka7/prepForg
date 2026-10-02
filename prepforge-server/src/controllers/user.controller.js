const User = require('../models/User.model');
const Solution = require('../models/Solution.model');
const Problem = require('../models/Problem.model');
const Activity = require('../models/Activity.model');
const Achievement = require('../models/Achievement.model');
const Revision = require('../models/Revision.model');
const Goal = require('../models/Goal.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { getNextLevelXP, getLevelProgress } = require('../utils/levelUtils');
const { getUTCToday, isWeekend } = require('../utils/dateUtils');
const { getDueRevisions, getUpcomingRevisions } = require('../services/revision.service');
const { generateDailyChallenge } = require('../services/dailyChallenge.service');
const mongoose = require('mongoose');

/**
 * GET /api/v1/users/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-passwordHash');
  return ApiResponse.success(res, { user });
});

/**
 * PATCH /api/v1/users/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const updates = {};

  if (name) updates.name = name.trim();
  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (existing) return ApiResponse.conflict(res, 'Email already in use.');
    updates.email = email.toLowerCase().trim();
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  return ApiResponse.success(res, { user });
});

/**
 * GET /api/v1/users/dashboard
 * Single optimized call that returns ALL dashboard widget data.
 * Every metric is derived from real MongoDB data.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const oid = new mongoose.Types.ObjectId(userId);
  const today = getUTCToday();

  // ── User stats ──
  const user = await User.findById(userId).lean();
  const nextLevelXP = getNextLevelXP(user.currentLevel);
  const levelProgress = getLevelProgress(user.totalXP, user.currentLevel);

  // ── Solved counts ──
  const solvedAgg = await Solution.aggregate([
    { $match: { userId: oid, isAccepted: true } },
    { $group: { _id: '$problemId' } },
    {
      $lookup: {
        from: 'problems',
        localField: '_id',
        foreignField: '_id',
        as: 'problem',
      },
    },
    { $unwind: '$problem' },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        easy: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$problem.difficulty', 'Hard'] }, 1, 0] } },
      },
    },
  ]);

  const solved = solvedAgg.length > 0
    ? solvedAgg[0]
    : { total: 0, easy: 0, medium: 0, hard: 0 };
  delete solved._id;

  const totalProblems = await Problem.countDocuments({ isActive: true });
  solved.remaining = totalProblems - solved.total;

  // ── Daily Goal Progress ──
  const goals = await Goal.findOne({ userId }).lean();
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

  const weekendExtra = goals && goals.weekendBonusEnabled && isWeekend() ? goals.weekendBonus : 0;

  const dailyGoal = {
    easyTarget: (goals?.easyTarget || 3) + weekendExtra,
    mediumTarget: (goals?.mediumTarget || 2) + weekendExtra,
    hardTarget: (goals?.hardTarget || 1) + weekendExtra,
    easyDone: todaySolved.Easy,
    mediumDone: todaySolved.Medium,
    hardDone: todaySolved.Hard,
  };

  // ── Revisions ──
  const dueRevisions = await getDueRevisions(userId);
  const upcoming = await getUpcomingRevisions(userId);

  const revisionSummary = {
    dueToday: dueRevisions.filter((r) => !r.overdue).length,
    overdue: dueRevisions.filter((r) => r.overdue).length,
    upcoming: upcoming.length,
  };

  // ── Recent Activity ──
  const recentActivity = await Activity.find({ userId })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  // ── Achievements ──
  const achievements = await Achievement.find({ userId })
    .sort({ unlockedAt: -1 })
    .lean();

  // ── Topic strength analysis ──
  const topicConfidence = await Solution.aggregate([
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
        solved: { $sum: 1 },
      },
    },
    { $sort: { avgConfidence: 1 } },
  ]);

  const weakestTopics = topicConfidence.slice(0, 3).map((t) => ({
    topic: t._id,
    avgConfidence: Math.round(t.avgConfidence * 10) / 10,
    solved: t.solved,
  }));

  const strongestTopics = [...topicConfidence]
    .sort((a, b) => b.avgConfidence - a.avgConfidence)
    .slice(0, 3)
    .map((t) => ({
      topic: t._id,
      avgConfidence: Math.round(t.avgConfidence * 10) / 10,
      solved: t.solved,
    }));

  // ── Daily Challenge ──
  const dailyChallenge = await generateDailyChallenge(userId);

  return ApiResponse.success(res, {
    streak: {
      current: user.currentStreak,
      longest: user.longestStreak,
    },
    xp: {
      total: user.totalXP,
      level: user.currentLevel,
      nextLevelXP,
      progress: Math.round(levelProgress * 1000) / 1000,
    },
    solved,
    dailyGoal,
    revisions: revisionSummary,
    recentActivity,
    achievements,
    weakestTopics,
    strongestTopics,
    dailyChallenge,
  });
});

/**
 * PATCH /api/v1/users/layout
 */
const updateLayout = asyncHandler(async (req, res) => {
  const { layout } = req.body;
  if (!Array.isArray(layout)) {
    return ApiResponse.badRequest(res, 'Layout must be an array.');
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { dashboardLayout: layout },
    { new: true }
  );

  return ApiResponse.success(res, { dashboardLayout: user.dashboardLayout });
});

/**
 * PATCH /api/v1/users/theme
 */
const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  const validThemes = ['vscode-dark', 'github-dark', 'github-light', 'dracula'];
  if (!validThemes.includes(theme)) {
    return ApiResponse.badRequest(res, `Theme must be one of: ${validThemes.join(', ')}`);
  }

  const user = await User.findByIdAndUpdate(req.user._id, { theme }, { new: true });
  return ApiResponse.success(res, { theme: user.theme });
});

module.exports = { getProfile, updateProfile, getDashboard, updateLayout, updateTheme };
