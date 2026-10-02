const mongoose = require('mongoose');
const { THEMES, DEFAULT_DASHBOARD_LAYOUT } = require('../config/constants');

const dashboardWidgetSchema = new mongoose.Schema(
  {
    widgetId: { type: String, required: true },
    visible: { type: Boolean, default: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    currentLevel: { type: Number, default: 1 },
    lastActivityDate: { type: Date, default: null },
    dashboardLayout: {
      type: [dashboardWidgetSchema],
      default: DEFAULT_DASHBOARD_LAYOUT,
    },
    theme: {
      type: String,
      enum: THEMES,
      default: 'vscode-dark',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
