const mongoose = require('mongoose');

const fileRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      index: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

fileRecordSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FileRecord', fileRecordSchema);

