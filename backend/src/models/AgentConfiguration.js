const mongoose = require('mongoose');

const agentConfigurationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      default: 'UMNY Autonomous Agent',
    },
    instructions: {
      type: String,
      default: '',
    },
    enabledTools: {
      type: [String],
      default: ['web_search', 'file_analysis', 'calculator', 'document_summarizer'],
    },
    model: {
      type: String,
      default: 'llama-3.3-70b-versatile',
    },
    maxSteps: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AgentConfiguration', agentConfigurationSchema);

