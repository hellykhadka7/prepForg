const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

bookmarkSchema.index({ userId: 1, problemId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
