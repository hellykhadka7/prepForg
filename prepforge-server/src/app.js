const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { CLIENT_URL, NODE_ENV } = require('./config/env');
const { generalLimiter } = require('./middleware/rateLimit.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const problemRoutes = require('./routes/problem.routes');
const solutionRoutes = require('./routes/solution.routes');
const noteRoutes = require('./routes/note.routes');
const revisionRoutes = require('./routes/revision.routes');
const goalRoutes = require('./routes/goal.routes');
const activityRoutes = require('./routes/activity.routes');
const achievementRoutes = require('./routes/achievement.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const searchRoutes = require('./routes/search.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const importRoutes = require('./routes/import.routes');
const exportRoutes = require('./routes/export.routes');
const syncRoutes = require('./routes/sync.routes');

const app = express();

// ──────────────────────────────────────────────────────────
//  Global Middleware
// ──────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(generalLimiter);

// ──────────────────────────────────────────────────────────
//  Routes
// ──────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/solutions', solutionRoutes);
app.use('/api/v1/notes', noteRoutes);
app.use('/api/v1/revisions', revisionRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/import', importRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/sync', syncRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'PrepForge API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
