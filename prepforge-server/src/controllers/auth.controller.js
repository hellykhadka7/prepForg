const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User.model');
const Goal = require('../models/Goal.model');
const { signToken } = require('../utils/tokenUtils');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

// ──────────────────────────────────────────────────────────
//  Validation Schemas
// ──────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

// ──────────────────────────────────────────────────────────
//  Controllers
// ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Create a new user account.
 */
const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  const { name, email, password } = parsed.data;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return ApiResponse.conflict(res, 'Email already in use.');
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({ name, email, passwordHash });

  // Create default goals for the user
  await Goal.create({ userId: user._id });

  // Generate JWT
  const token = signToken(user._id);

  return ApiResponse.created(res, {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      currentLevel: user.currentLevel,
      totalXP: user.totalXP,
      currentStreak: user.currentStreak,
      theme: user.theme,
    },
  });
});

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return JWT.
 */
const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  const { email, password } = parsed.data;

  // Find user (include passwordHash for comparison)
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return ApiResponse.unauthorized(res, 'Invalid email or password.');
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return ApiResponse.unauthorized(res, 'Invalid email or password.');
  }

  // Generate JWT
  const token = signToken(user._id);

  return ApiResponse.success(res, {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      currentLevel: user.currentLevel,
      totalXP: user.totalXP,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      theme: user.theme,
    },
  });
});

/**
 * POST /api/v1/auth/logout
 * Client-side token invalidation (clear cookie if used).
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  return ApiResponse.success(res, null, 'Logged out successfully.');
});

/**
 * GET /api/v1/auth/me
 * Get the currently authenticated user's profile.
 */
const getMe = asyncHandler(async (req, res) => {
  return ApiResponse.success(res, { user: req.user });
});

module.exports = { register, login, logout, getMe };
