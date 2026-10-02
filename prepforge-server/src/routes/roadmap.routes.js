const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/adminOnly.middleware');
const {
  getAllRoadmaps,
  getSystemRoadmaps,
  getMyRoadmaps,
  getRoadmap,
  createPersonalRoadmap,
  updatePersonalRoadmap,
  deletePersonalRoadmap,
  createSystemRoadmap,
  updateSystemRoadmap,
  deleteSystemRoadmap,
} = require('../controllers/roadmap.controller');

router.use(protect);

// User routes
router.get('/', getAllRoadmaps);
router.get('/system', getSystemRoadmaps);
router.get('/mine', getMyRoadmaps);
router.get('/:id', getRoadmap);
router.post('/', createPersonalRoadmap);
router.patch('/:id', updatePersonalRoadmap);
router.delete('/:id', deletePersonalRoadmap);

// Admin routes
router.post('/admin', adminOnly, createSystemRoadmap);
router.patch('/admin/:id', adminOnly, updateSystemRoadmap);
router.delete('/admin/:id', adminOnly, deleteSystemRoadmap);

module.exports = router;
