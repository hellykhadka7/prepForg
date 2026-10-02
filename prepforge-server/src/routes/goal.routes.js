const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getGoals, upsertGoals, getProgress } = require('../controllers/goal.controller');

router.use(protect);

router.get('/', getGoals);
router.put('/', upsertGoals);
router.get('/progress', getProgress);

module.exports = router;
