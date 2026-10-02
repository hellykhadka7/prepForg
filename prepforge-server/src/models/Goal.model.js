const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    easyTarget: { type: Number, default: 3, min: 0 },
    mediumTarget: { type: Number, default: 2, min: 0 },
    hardTarget: { type: Number, default: 1, min: 0 },
    weekendBonus: { type: Number, default: 0, min: 0 },
    weekendBonusEnabled: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

goalSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Goal', goalSchema);
