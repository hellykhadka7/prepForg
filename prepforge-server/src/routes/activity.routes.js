const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getHeatmap, getRecentActivity, getStreak } = require('../controllers/activity.controller');

router.use(protect);

router.get('/heatmap', getHeatmap);
router.get('/recent', getRecentActivity);
router.get('/streak', getStreak);

module.exports = router;
