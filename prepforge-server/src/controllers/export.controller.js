const Solution = require('../models/Solution.model');
const Note = require('../models/Note.model');
const Revision = require('../models/Revision.model');
const Bookmark = require('../models/Bookmark.model');
const Activity = require('../models/Activity.model');
const Achievement = require('../models/Achievement.model');
const Goal = require('../models/Goal.model');
const User = require('../models/User.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const archiver = require('archiver');

/**
 * GET /api/v1/export/json
 * Export all user data as JSON.
 */
const exportJSON = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, solutions, notes, revisions, bookmarks, activities, achievements, goals] =
    await Promise.all([
      User.findById(userId).select('-passwordHash').lean(),
      Solution.find({ userId }).populate('problemId', 'title difficulty topic').lean(),
      Note.find({ userId }).populate('problemId', 'title').lean(),
      Revision.find({ userId }).populate('problemId', 'title difficulty').lean(),
      Bookmark.find({ userId }).populate('problemId', 'title difficulty topic').lean(),
      Activity.find({ userId }).sort({ date: -1 }).lean(),
      Achievement.find({ userId }).lean(),
      Goal.findOne({ userId }).lean(),
    ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    user,
    solutions,
    notes,
    revisions,
    bookmarks,
    activities,
    achievements,
    goals,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=prepforge-export.json');
  return res.json(exportData);
});

/**
 * GET /api/v1/export/zip
 * Export all user data as ZIP archive.
 */
const exportZIP = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [user, solutions, notes, revisions, bookmarks, activities, achievements, goals] =
    await Promise.all([
      User.findById(userId).select('-passwordHash').lean(),
      Solution.find({ userId }).populate('problemId', 'title difficulty topic').lean(),
      Note.find({ userId }).populate('problemId', 'title').lean(),
      Revision.find({ userId }).populate('problemId', 'title difficulty').lean(),
      Bookmark.find({ userId }).populate('problemId', 'title difficulty topic').lean(),
      Activity.find({ userId }).sort({ date: -1 }).lean(),
      Achievement.find({ userId }).lean(),
      Goal.findOne({ userId }).lean(),
    ]);

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename=prepforge-export.zip');

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.pipe(res);

  archive.append(JSON.stringify(user, null, 2), { name: 'user.json' });
  archive.append(JSON.stringify(solutions, null, 2), { name: 'solutions.json' });
  archive.append(JSON.stringify(notes, null, 2), { name: 'notes.json' });
  archive.append(JSON.stringify(revisions, null, 2), { name: 'revisions.json' });
  archive.append(JSON.stringify(bookmarks, null, 2), { name: 'bookmarks.json' });
  archive.append(JSON.stringify(activities, null, 2), { name: 'activities.json' });
  archive.append(JSON.stringify(achievements, null, 2), { name: 'achievements.json' });
  archive.append(JSON.stringify(goals, null, 2), { name: 'goals.json' });

  await archive.finalize();
});

/**
 * GET /api/v1/export/pdf
 * Puppeteer-rendered PDF progress report.
 */
const exportPDF = asyncHandler(async (req, res) => {
  // Full Puppeteer implementation in Phase 6
  return ApiResponse.error(
    res,
    'PDF export requires Puppeteer. This feature will be fully implemented in Phase 6.',
    501
  );
});

module.exports = { exportJSON, exportZIP, exportPDF };
