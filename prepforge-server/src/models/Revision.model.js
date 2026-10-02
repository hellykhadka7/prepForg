const mongoose = require('mongoose');

const revisionSchema = new mongoose.Schema(
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
    revision1Date: { type: Date, required: true },
    revision2Date: { type: Date, required: true },
    revision3Date: { type: Date, required: true },
    revision1Done: { type: Boolean, default: false },
    revision2Done: { type: Boolean, default: false },
    revision3Done: { type: Boolean, default: false },
    priorityScore: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

revisionSchema.index({ userId: 1, problemId: 1 }, { unique: true });
revisionSchema.index({ userId: 1, revision1Date: 1 });
revisionSchema.index({ userId: 1, revision2Date: 1 });
revisionSchema.index({ userId: 1, revision3Date: 1 });

module.exports = mongoose.model('Revision', revisionSchema);
