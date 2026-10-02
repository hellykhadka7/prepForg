const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    solvedCount: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    problemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  },
  {
    timestamps: false,
    toJSON: { versionKey: false },
  }
);

// One document per user per day
activitySchema.index({ userId: 1, date: 1 }, { unique: true });
// Heatmap query: last 365 days
activitySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Activity', activitySchema);
