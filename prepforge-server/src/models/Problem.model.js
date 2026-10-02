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
      required: [true, 'Topic is required'],
      trim: true,
    },
    week: {
      type: Number,
      required: [true, 'Week number is required'],
      min: 1,
    },
    orderIndex: {
      type: Number,
      required: [true, 'Order index is required'],
    },
    leetcodeUrl: {
      type: String,
      trim: true,
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
