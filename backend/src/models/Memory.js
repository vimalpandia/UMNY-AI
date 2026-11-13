const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['preference', 'fact', 'coding', 'project', 'general'],
      default: 'general',
      index: true,
    },
    importance: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

memorySchema.index({ userId: 1, importance: -1, createdAt: -1 });

module.exports = mongoose.model('Memory', memorySchema);
