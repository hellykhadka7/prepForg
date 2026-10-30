const mongoose = require('mongoose');
const { DIFFICULTIES, PATTERNS } = require('../config/constants');

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: DIFFICULTIES,
      required: [true, 'Difficulty is required'],
    },
    topic: {
      type: String,
      trim: true,
      default: '',
    },
    week: {
      type: Number,
      min: 0,
      default: 0,
    },
    orderIndex: {
      type: Number,
      default: 0,
    },
    leetcodeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    patterns: {
      type: [String],
      enum: PATTERNS,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Custom problem fields
    isCustom: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
  }
);

// Primary display ordering — preserves insertion order
problemSchema.index({ week: 1, orderIndex: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ topic: 1 });
problemSchema.index({ patterns: 1 });
problemSchema.index({ title: 'text', topic: 'text' });

module.exports = mongoose.model('Problem', problemSchema);
