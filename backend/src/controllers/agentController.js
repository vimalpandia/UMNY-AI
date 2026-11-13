const agentService = require('../services/agents/AgentService');
const AgentConfiguration = require('../models/AgentConfiguration');
const { isConnected } = require('../config/db');

const localAgentConfigs = new Map();

const agentController = {
  getTools(req, res) {
    const tools = agentService.getAvailableTools();
    res.json(tools);
  },

  async getConfiguration(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;

      if (isConnected()) {
        let config = await AgentConfiguration.findOne({ userId });
        if (!config) {
          config = await AgentConfiguration.create({
            userId,
            name: 'UMNY Autonomous Agent',
            enabledTools: ['web_search', 'file_analysis', 'calculator', 'document_summarizer'],
          });
        }
        return res.json(config);
      }

      const existing = localAgentConfigs.get(userId.toString()) || {
        userId: userId.toString(),
        name: 'UMNY Autonomous Agent',
        enabledTools: ['web_search', 'file_analysis', 'calculator', 'document_summarizer'],
      };
      return res.json(existing);
    } catch (err) {
      next(err);
    }
  },

  async updateConfiguration(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { name, enabledTools, instructions, model } = req.body;

      if (isConnected()) {
        const config = await AgentConfiguration.findOneAndUpdate(
          { userId },
          {
            ...(name && { name }),
            ...(enabledTools && { enabledTools }),
            ...(instructions !== undefined && { instructions }),
            ...(model && { model }),
          },
          { new: true, upsert: true }
        );
        return res.json(config);
      }

      const existing = localAgentConfigs.get(userId.toString()) || {};
      const updated = {
        ...existing,
        userId: userId.toString(),
        ...(name && { name }),
        ...(enabledTools && { enabledTools }),
        ...(instructions !== undefined && { instructions }),
        ...(model && { model }),
      };
      localAgentConfigs.set(userId.toString(), updated);
      return res.json(updated);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = agentController;

