const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { processBatch } = require('../controllers/sync.controller');

router.use(protect);

router.post('/batch', processBatch);

module.exports = router;
