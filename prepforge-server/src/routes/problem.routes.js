const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getProblems,
  getProblem,
  getProblemStatus,
  toggleBookmark,
} = require('../controllers/problem.controller');

router.use(protect);

router.get('/', getProblems);
router.get('/:id', getProblem);
router.get('/:id/status', getProblemStatus);
router.patch('/:id/bookmark', toggleBookmark);

module.exports = router;
