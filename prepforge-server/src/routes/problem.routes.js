const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getProblems,
  getProblem,
  getProblemStatus,
  setMyStatus,
  toggleBookmark,
  createCustomProblem,
  updateCustomProblem,
  deleteCustomProblem,
} = require('../controllers/problem.controller');

router.use(protect);

// List + create
router.get('/', getProblems);
router.post('/', createCustomProblem);

// Single problem
router.get('/:id', getProblem);
router.get('/:id/status', getProblemStatus);

// User-specific actions
router.patch('/:id/mystatus', setMyStatus);
router.patch('/:id/bookmark', toggleBookmark);

// Custom problem management (ownership-checked in controller)
router.patch('/:id', updateCustomProblem);
router.delete('/:id', deleteCustomProblem);

module.exports = router;
