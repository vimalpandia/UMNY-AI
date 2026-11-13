const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        id: String,
        name: String,
        mimeType: String,
        size: Number,
        storageKey: String,
        textExtract: String,
      },
    ],
    model: {
      type: String,
    },
    toolCalls: [
      {
        tool: String,
        name: String,
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        status: String,
        executedAt: { type: Date, default: Date.now },
      },
    ],
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
