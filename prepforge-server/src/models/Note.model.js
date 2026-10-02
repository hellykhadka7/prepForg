const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
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
    learning: { type: String, default: '' },
    mistakes: { type: String, default: '' },
    optimization: { type: String, default: '' },
    revisionNotes: { type: String, default: '' },
    interviewNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

noteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
