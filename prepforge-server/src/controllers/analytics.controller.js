const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const analyticsService = require('../services/analytics.service');
const { generateDailyChallenge } = require('../services/dailyChallenge.service');

const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [difficulty, topics, patterns, revisions, mistakes] = await Promise.all([
    analyticsService.getDifficultyDistribution(userId),
    analyticsService.getTopicStats(userId),
    analyticsService.getPatternStats(userId),
    analyticsService.getRevisionStats(userId),
    analyticsService.getMistakeDistribution(userId),
  ]);
  return ApiResponse.success(res, { difficulty, topics, patterns, revisions, mistakes });
});

const getWeekly = asyncHandler(async (req, res) => {
  const weeks = await analyticsService.getWeeklyStats(req.user._id);
  return ApiResponse.success(res, { weeks });
});

const getDifficulty = asyncHandler(async (req, res) => {
  const distribution = await analyticsService.getDifficultyDistribution(req.user._id);
  return ApiResponse.success(res, { distribution });
});

const getTopics = asyncHandler(async (req, res) => {
  const topics = await analyticsService.getTopicStats(req.user._id);
  return ApiResponse.success(res, { topics });
});

const getPatterns = asyncHandler(async (req, res) => {
  const patterns = await analyticsService.getPatternStats(req.user._id);
  return ApiResponse.success(res, { patterns });
});

const getRevisions = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getRevisionStats(req.user._id);
  return ApiResponse.success(res, { stats });
});

const getMistakes = asyncHandler(async (req, res) => {
  const mistakes = await analyticsService.getMistakeDistribution(req.user._id);
  return ApiResponse.success(res, { mistakes });
});

const getXPGrowth = asyncHandler(async (req, res) => {
  const growth = await analyticsService.getXPGrowth(req.user._id);
  return ApiResponse.success(res, { growth });
});

const getConfidence = asyncHandler(async (req, res) => {
  const confidence = await analyticsService.getConfidenceStats(req.user._id);
  return ApiResponse.success(res, { confidence });
});

const getSolveTime = asyncHandler(async (req, res) => {
  const solveTime = await analyticsService.getSolveTimeStats(req.user._id);
  return ApiResponse.success(res, { solveTime });
});

const getDailyChallenge = asyncHandler(async (req, res) => {
  const challenge = await generateDailyChallenge(req.user._id);
  return ApiResponse.success(res, { challenge });
});

module.exports = {
  getSummary, getWeekly, getDifficulty, getTopics, getPatterns,
  getRevisions, getMistakes, getXPGrowth, getConfidence, getSolveTime,
  getDailyChallenge,
};
