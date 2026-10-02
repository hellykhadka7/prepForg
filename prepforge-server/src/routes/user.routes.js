const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getDashboard,
  updateLayout,
  updateTheme,
} = require('../controllers/user.controller');

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.patch('/layout', updateLayout);
router.patch('/theme', updateTheme);

module.exports = router;
