const aiService = require('../services/ai/AIService');
const { MODELS } = require('../config/constants');

const aiController = {
  async chat(req, res, next) {
    const { conversationId, content, model, attachments, agentMode } = req.body;
    const userId = req.user._id || req.user.id;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Content or attachment is required.' });
    }

    if (model && aiService.isModelDeprecated(model)) {
      return res.status(400).json({
        message: `Model "${model}" has been decommissioned by Groq as of August 16, 2026. Please select an active model such as "${aiService.getDefaultModel()}".`,
      });
    }

    try {
      const result = await aiService.streamChat({
        userId,
        user: req.user,
        conversationId,
        content: content || '',
        model: model || aiService.getDefaultModel(),
        attachments: attachments || [],
        agentMode: !!agentMode,
      });

      return res.json(result);
    } catch (err) {
      console.error('[AI Chat Controller Error]:', err.message);
      next(err);
    }
  },

  async streamChat(req, res, next) {
    const { conversationId, content, model, attachments, agentMode } = req.body;
    const userId = req.user._id || req.user.id;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Content or attachment is required.' });
    }

    if (model && aiService.isModelDeprecated(model)) {
      return res.status(400).json({
        message: `Model "${model}" has been decommissioned by Groq as of August 16, 2026. Please select an active model such as "${aiService.getDefaultModel()}".`,
      });
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendEvent = (data) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const result = await aiService.streamChat({
        userId,
        user: req.user,
        conversationId,
        content: content || '',
        model: model || aiService.getDefaultModel(),
        attachments: attachments || [],
        agentMode: !!agentMode,
        onChunk: (textChunk) => {
          sendEvent({ type: 'chunk', text: textChunk });
        },
        onToolProgress: (toolData) => {
          sendEvent(toolData);
        },
      });

      sendEvent({ type: 'complete', message: result.message });
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err) {
      console.error('[AI Stream Controller Error]:', err.message);
      sendEvent({ type: 'error', message: err.message });
      res.write('data: [DONE]\n\n');
      res.end();
    }
  },

  async getAvailableModels(req, res, next) {
    try {
      const models = await aiService.getAvailableModels();
      res.json(models);
    } catch (err) {
      console.error('[AI Controller] Error discovering available models:', err.message);
      next(err);
    }
  },
};

module.exports = aiController;

