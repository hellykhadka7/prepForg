const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  getDue,
  getUpcoming,
  getQueue,
  getRevisionForProblem,
  completeSlot,
  resetRevision,
} = require('../controllers/revision.controller');

router.use(protect);

router.get('/due', getDue);
router.get('/upcoming', getUpcoming);
router.get('/queue', getQueue);
router.get('/problem/:problemId', getRevisionForProblem);
router.patch('/:revisionId/complete', completeSlot);
router.post('/problem/:problemId/reset', resetRevision);

module.exports = router;
