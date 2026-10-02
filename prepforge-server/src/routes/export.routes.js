const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { exportJSON, exportZIP, exportPDF } = require('../controllers/export.controller');

router.use(protect);

router.get('/json', exportJSON);
router.get('/zip', exportZIP);
router.get('/pdf', exportPDF);

module.exports = router;
