const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['google', 'openai', 'anthropic', 'groq', 'system'],
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    requestStatus: {
      type: String,
      enum: ['success', 'error'],
      default: 'success',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

usageLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('UsageLog', usageLogSchema);

