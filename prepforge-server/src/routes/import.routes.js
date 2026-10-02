const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/adminOnly.middleware');
const { importJSON, importCSV, importPaste, restoreData } = require('../controllers/import.controller');

router.use(protect);

// Admin-only problem imports
router.post('/problems/json', adminOnly, importJSON);
router.post('/problems/csv', adminOnly, importCSV);
router.post('/problems/paste', adminOnly, importPaste);

// User data restore
router.post('/data/restore', restoreData);

module.exports = router;
