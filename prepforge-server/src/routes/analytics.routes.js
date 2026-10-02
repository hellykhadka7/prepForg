const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getSummary, getWeekly, getDifficulty, getTopics, getPatterns,
  getRevisions, getMistakes, getXPGrowth, getConfidence, getSolveTime,
  getDailyChallenge,
} = require('../controllers/analytics.controller');

router.use(protect);

router.get('/summary', getSummary);
router.get('/weekly', getWeekly);
router.get('/difficulty', getDifficulty);
router.get('/topics', getTopics);
router.get('/patterns', getPatterns);
router.get('/revisions', getRevisions);
router.get('/mistakes', getMistakes);
router.get('/xp-growth', getXPGrowth);
router.get('/confidence', getConfidence);
router.get('/solve-time', getSolveTime);
router.get('/daily-challenge', getDailyChallenge);

module.exports = router;
