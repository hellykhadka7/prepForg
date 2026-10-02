const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievementName: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: { versionKey: false },
  }
);

achievementSchema.index({ userId: 1 });
achievementSchema.index({ userId: 1, achievementName: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
