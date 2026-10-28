const mongoose = require('mongoose');

const STATUS_VALUES = ['not_started', 'completed', 'on_hold', 'skipped'];

const userProblemStatusSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'not_started',
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

// One status record per user per problem
userProblemStatusSchema.index({ userId: 1, problemId: 1 }, { unique: true });
userProblemStatusSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('UserProblemStatus', userProblemStatusSchema);
module.exports.STATUS_VALUES = STATUS_VALUES;
