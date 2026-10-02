const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getNote, upsertNote } = require('../controllers/note.controller');

router.use(protect);

router.get('/problem/:problemId', getNote);
router.put('/problem/:problemId', upsertNote);

module.exports = router;
