const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  submitSolution,
  getSolutionsForProblem,
  getSolution,
  deleteSolution,
  restoreSolution,
  compareSolutions,
  toggleAccepted,
} = require('../controllers/solution.controller');

router.use(protect);

router.post('/', submitSolution);
router.get('/compare', compareSolutions);
router.get('/problem/:problemId', getSolutionsForProblem);
router.get('/:solutionId', getSolution);
router.delete('/:solutionId', deleteSolution);
router.post('/:solutionId/restore', restoreSolution);
router.patch('/:solutionId/accept', toggleAccepted);

module.exports = router;
