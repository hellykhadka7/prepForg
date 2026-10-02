const Solution = require('../models/Solution.model');
const Note = require('../models/Note.model');
const Bookmark = require('../models/Bookmark.model');
const Revision = require('../models/Revision.model');
const Goal = require('../models/Goal.model');
const Problem = require('../models/Problem.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { calculateXP, awardXP } = require('../services/xp.service');
const { updateStreak, recordActivity } = require('../services/streak.service');
const { scheduleRevision, completeRevisionSlot } = require('../services/revision.service');
const { checkAchievements } = require('../services/achievement.service');

/**
 * POST /api/v1/sync/batch
 * Process queued offline actions in one call.
 * Each action is processed independently — failures don't block subsequent actions.
 */
const processBatch = asyncHandler(async (req, res) => {
  const { actions } = req.body;
  const userId = req.user._id;

  if (!Array.isArray(actions) || actions.length === 0) {
    return ApiResponse.badRequest(res, 'Actions array is required.');
  }

  const results = [];

  for (const action of actions) {
    try {
      switch (action.action) {
        case 'SUBMIT_SOLUTION': {
          const { problemId, language, code, notes, confidence, mistakes, solveDuration, isAccepted } = action.payload;
          const problem = await Problem.findById(problemId);
          if (!problem) { results.push({ action: 'SUBMIT_SOLUTION', success: false, error: 'Problem not found' }); break; }

          const { isFirstSolve, xpToAward } = await calculateXP(userId, problemId, problem.difficulty);

          await Solution.create({
            userId, problemId, language, code,
            notes: notes || '', confidence: confidence || 3,
            mistakes: mistakes || [], solveDuration: solveDuration || 0,
            isAccepted: isAccepted !== false, isFirstSolve,
            xpAwarded: isAccepted !== false ? xpToAward : 0,
            submittedAt: new Date(),
          });

          if (isAccepted !== false) {
            await awardXP(userId, xpToAward);
            await updateStreak(userId);
            await recordActivity(userId, problemId, xpToAward);
            if (isFirstSolve) await scheduleRevision(userId, problemId);
            await checkAchievements(userId, { difficulty: problem.difficulty, isFirstSolve, solveDuration });
          }

          results.push({ action: 'SUBMIT_SOLUTION', success: true, xpAwarded: xpToAward });
          break;
        }

        case 'UPSERT_NOTE': {
          const { problemId, learning, mistakes, optimization, revisionNotes, interviewNotes } = action.payload;
          await Note.findOneAndUpdate(
            { userId, problemId },
            { learning, mistakes, optimization, revisionNotes, interviewNotes },
            { upsert: true, new: true }
          );
          results.push({ action: 'UPSERT_NOTE', success: true });
          break;
        }

        case 'TOGGLE_BOOKMARK': {
          const { problemId } = action.payload;
          const existing = await Bookmark.findOne({ userId, problemId });
          if (existing) {
            await Bookmark.deleteOne({ _id: existing._id });
          } else {
            await Bookmark.create({ userId, problemId });
          }
          results.push({ action: 'TOGGLE_BOOKMARK', success: true });
          break;
        }

        case 'COMPLETE_REVISION': {
          const { revisionId, slotNumber } = action.payload;
          await completeRevisionSlot(revisionId, slotNumber);
          results.push({ action: 'COMPLETE_REVISION', success: true });
          break;
        }

        case 'UPSERT_GOAL': {
          const { easyTarget, mediumTarget, hardTarget, weekendBonus, weekendBonusEnabled } = action.payload;
          await Goal.findOneAndUpdate(
            { userId },
            { easyTarget, mediumTarget, hardTarget, weekendBonus, weekendBonusEnabled },
            { upsert: true, new: true }
          );
          results.push({ action: 'UPSERT_GOAL', success: true });
          break;
        }

        default:
          results.push({ action: action.action, success: false, error: `Unknown action: ${action.action}` });
      }
    } catch (error) {
      results.push({ action: action.action, success: false, error: error.message });
    }
  }

  const processed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return ApiResponse.success(res, { processed, failed, results });
});

module.exports = { processBatch };
