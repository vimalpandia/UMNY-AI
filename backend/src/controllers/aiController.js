const aiService = require('../services/ai/AIService');
const { MODELS } = require('../config/constants');

const aiController = {
  async chat(req, res, next) {
    const { conversationId, content, model, attachments, agentMode } = req.body;
    const userId = req.user._id || req.user.id;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Content or attachment is required.' });
    }

    try {
      const result = await aiService.streamChat({
        userId,
        user: req.user,
        conversationId,
        content: content || '',
        model: model || 'llama-3.3-70b-versatile',
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
        model: model || 'gemini-2.5-flash',
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

  getAvailableModels(req, res) {
    const models = [
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        badge: 'Fast & Smart',
        description: 'High-speed multimodal intelligence with large context support.',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        badge: 'Deep Reasoning',
        description: 'Deep mathematical analysis and multifaceted problem solving.',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        badge: 'Flagship',
        description: 'Omni-model reasoning with versatile text and multimodal fluency.',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        badge: 'Lightweight',
        description: 'Affordable, low-latency conversational powerhouse.',
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        badge: 'Expert Code & Logic',
        description: 'Premier coding, architectural planning, and articulate prose.',
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        badge: 'Rapid',
        description: 'Super-fast lightweight intelligence for instant workflows.',
      },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'Groq',
        badge: 'Ultra-Fast & Free',
        description: 'State-of-the-art open reasoning on Groq LPU hardware with 128k context.',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'Groq',
        badge: 'Instant Speed',
        description: 'Ultra-low-latency real-time responses on Groq free developer tier.',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B (32k)',
        provider: 'Groq',
        badge: 'High Context',
        description: 'Mixture-of-Experts architecture with 32,768 token window on Groq.',
      },
    ];

    res.json(models);
  },
};

module.exports = aiController;

