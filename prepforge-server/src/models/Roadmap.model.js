const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Roadmap name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { versionKey: false },
  }
);

roadmapSchema.index({ isSystem: 1 });
roadmapSchema.index({ createdBy: 1 });
roadmapSchema.index({ isSystem: 1, isPublic: 1 });

module.exports = mongoose.model('Roadmap', roadmapSchema);
