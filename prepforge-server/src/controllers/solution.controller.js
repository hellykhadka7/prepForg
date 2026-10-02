const { z } = require('zod');
const Solution = require('../models/Solution.model');
const Problem = require('../models/Problem.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { calculateXP, awardXP, reverseFirstSolveXP } = require('../services/xp.service');
const { updateStreak, recordActivity } = require('../services/streak.service');
const { scheduleRevision } = require('../services/revision.service');
const { checkAchievements } = require('../services/achievement.service');
const { LANGUAGES, MISTAKE_TYPES } = require('../config/constants');

// ──────────────────────────────────────────────────────────
//  Validation Schema
// ──────────────────────────────────────────────────────────

const submitSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum(LANGUAGES),
  code: z.string().min(1, 'Code is required'),
  notes: z.string().optional().default(''),
  confidence: z.number().int().min(1).max(5),
  mistakes: z.array(z.enum(MISTAKE_TYPES)).optional().default([]),
  solveDuration: z.number().int().min(0).optional().default(0),
  isAccepted: z.boolean().optional().default(true),
});

// ──────────────────────────────────────────────────────────
//  Controllers
// ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/solutions
 * Submit a new solution. Triggers XP, streak, revision, achievement checks.
 */
const submitSolution = asyncHandler(async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  const { problemId, language, code, notes, confidence, mistakes, solveDuration, isAccepted } = parsed.data;
  const userId = req.user._id;

  // Verify problem exists
  const problem = await Problem.findById(problemId);
  if (!problem) return ApiResponse.notFound(res, 'Problem not found.');

  // Calculate XP (first solve vs revision)
  const { isFirstSolve, xpToAward } = await calculateXP(userId, problemId, problem.difficulty);

  // Create solution document
  const solution = await Solution.create({
    userId,
    problemId,
    language,
    code,
    notes,
    confidence,
    mistakes,
    solveDuration,
    isAccepted,
    isFirstSolve,
    xpAwarded: isAccepted ? xpToAward : 0,
    submittedAt: new Date(),
  });

  let xpResult = { totalXP: req.user.totalXP, currentLevel: req.user.currentLevel, leveledUp: false };
  let streakResult = { currentStreak: req.user.currentStreak, extended: false };
  let revisionSchedule = null;
  let newAchievements = [];

  if (isAccepted) {
    // Award XP
    xpResult = await awardXP(userId, xpToAward);

    // Update streak + activity
    streakResult = await updateStreak(userId);
    await recordActivity(userId, problemId, xpToAward);

    // Schedule revision on first solve
    if (isFirstSolve) {
      const revision = await scheduleRevision(userId, problemId);
      revisionSchedule = {
        revision1Date: revision.revision1Date,
        revision2Date: revision.revision2Date,
        revision3Date: revision.revision3Date,
      };
    }

    // Check achievements
    newAchievements = await checkAchievements(userId, {
      difficulty: problem.difficulty,
      isFirstSolve,
      solveDuration,
    });
  }

  return ApiResponse.created(res, {
    solution: { _id: solution._id, submittedAt: solution.submittedAt },
    xpAwarded: isAccepted ? xpToAward : 0,
    isFirstSolve,
    totalXP: xpResult.totalXP,
    leveledUp: xpResult.leveledUp,
    currentLevel: xpResult.currentLevel,
    newAchievements,
    streak: {
      current: streakResult.currentStreak,
      extended: streakResult.extended,
    },
    revisionSchedule,
  });
});

/**
 * GET /api/v1/solutions/problem/:problemId
 * All solutions for a problem by the current user.
 */
const getSolutionsForProblem = asyncHandler(async (req, res) => {
  const solutions = await Solution.find({
    userId: req.user._id,
    problemId: req.params.problemId,
  }).sort({ submittedAt: -1 });

  return ApiResponse.success(res, { solutions });
});

/**
 * GET /api/v1/solutions/:solutionId
 */
const getSolution = asyncHandler(async (req, res) => {
  const solution = await Solution.findOne({
    _id: req.params.solutionId,
    userId: req.user._id,
  });

  if (!solution) return ApiResponse.notFound(res, 'Solution not found.');
  return ApiResponse.success(res, { solution });
});

/**
 * DELETE /api/v1/solutions/:solutionId
 * Delete-safe: checks if other accepted solutions exist before unmarking the problem.
 */
const deleteSolution = asyncHandler(async (req, res) => {
  const solution = await Solution.findOne({
    _id: req.params.solutionId,
    userId: req.user._id,
  });

  if (!solution) return ApiResponse.notFound(res, 'Solution not found.');

  const { userId, problemId, isFirstSolve, xpAwarded, isAccepted } = solution;

  // Delete the solution
  await Solution.deleteOne({ _id: solution._id });

  let problemStillSolved = false;
  let xpReversed = false;
  let xpDeducted = 0;

  if (isAccepted) {
    // Check if other accepted solutions exist
    const remainingAccepted = await Solution.countDocuments({
      userId,
      problemId,
      isAccepted: true,
    });

    problemStillSolved = remainingAccepted > 0;

    // If this was the first solve and no other accepted solutions remain, reverse XP
    if (isFirstSolve && !problemStillSolved) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        const result = await reverseFirstSolveXP(userId, problem.difficulty);
        xpReversed = true;
        xpDeducted = result.xpDeducted;
      }
    }
  }

  return ApiResponse.success(res, {
    deleted: true,
    problemStillSolved,
    xpReversed,
    xpDeducted,
    message: problemStillSolved
      ? 'Solution deleted. Problem remains solved (other accepted solutions exist).'
      : xpReversed
        ? `Solution deleted. Problem marked unsolved. ${xpDeducted} XP reversed.`
        : 'Solution deleted.',
  });
});

/**
 * POST /api/v1/solutions/:solutionId/restore
 * Restore a past solution as a new submission.
 */
const restoreSolution = asyncHandler(async (req, res) => {
  const original = await Solution.findOne({
    _id: req.params.solutionId,
    userId: req.user._id,
  });

  if (!original) return ApiResponse.notFound(res, 'Solution not found.');

  // Re-submit via the same logic as submitSolution
  req.body = {
    problemId: original.problemId.toString(),
    language: original.language,
    code: original.code,
    notes: original.notes,
    confidence: original.confidence,
    mistakes: original.mistakes,
    solveDuration: 0,
    isAccepted: original.isAccepted,
  };

  return submitSolution(req, res);
});

/**
 * GET /api/v1/solutions/compare?a=id1&b=id2
 * Return two solutions for side-by-side diff.
 */
const compareSolutions = asyncHandler(async (req, res) => {
  const { a, b } = req.query;
  if (!a || !b) return ApiResponse.badRequest(res, 'Both solution IDs (a and b) are required.');

  const [solutionA, solutionB] = await Promise.all([
    Solution.findOne({ _id: a, userId: req.user._id }),
    Solution.findOne({ _id: b, userId: req.user._id }),
  ]);

  if (!solutionA || !solutionB) {
    return ApiResponse.notFound(res, 'One or both solutions not found.');
  }

  return ApiResponse.success(res, { solutionA, solutionB });
});

/**
 * PATCH /api/v1/solutions/:solutionId/accept
 * Toggle isAccepted on a solution.
 */
const toggleAccepted = asyncHandler(async (req, res) => {
  const solution = await Solution.findOne({
    _id: req.params.solutionId,
    userId: req.user._id,
  });

  if (!solution) return ApiResponse.notFound(res, 'Solution not found.');

  solution.isAccepted = !solution.isAccepted;
  await solution.save();

  return ApiResponse.success(res, {
    solutionId: solution._id,
    isAccepted: solution.isAccepted,
  });
});

module.exports = {
  submitSolution,
  getSolutionsForProblem,
  getSolution,
  deleteSolution,
  restoreSolution,
  compareSolutions,
  toggleAccepted,
};
