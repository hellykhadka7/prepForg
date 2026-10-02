const mongoose = require('mongoose');
const { LANGUAGES, MISTAKE_TYPES } = require('../config/constants');

const solutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
    },
    language: {
      type: String,
      enum: LANGUAGES,
      required: [true, 'Language is required'],
    },
    code: {
      type: String,
      required: [true, 'Code is required'],
    },
    notes: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Confidence rating is required'],
    },
    mistakes: {
      type: [String],
      enum: MISTAKE_TYPES,
      default: [],
    },
    solveDuration: {
      type: Number, // seconds
      default: 0,
    },
    isAccepted: {
      type: Boolean,
      default: true,
    },
    isFirstSolve: {
      type: Boolean,
      default: false,
    },
    xpAwarded: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: { versionKey: false },
  }
);

solutionSchema.index({ userId: 1, problemId: 1 });
solutionSchema.index({ userId: 1, submittedAt: -1 });
solutionSchema.index({ userId: 1, isAccepted: 1 });
solutionSchema.index({ userId: 1, problemId: 1, isAccepted: 1 });

module.exports = mongoose.model('Solution', solutionSchema);
