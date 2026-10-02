const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getUnlocked, getAllWithStatus } = require('../controllers/achievement.controller');

router.use(protect);

router.get('/', getUnlocked);
router.get('/all', getAllWithStatus);

module.exports = router;
