const AIProvider = require('./AIProvider');
const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');

class AnthropicProvider extends AIProvider {
  constructor() {
    super('anthropic');
    this.apiKey = env.ANTHROPIC_API_KEY;
    this.client = this.apiKey ? new Anthropic({ apiKey: this.apiKey }) : null;
  }

  supportsModel(model) {
    return (
      model.startsWith('claude') ||
      model === 'claude-3-5-sonnet' ||
      model === 'claude-3-5-haiku'
    );
  }

  resolveModelName(model) {
    if (model === 'claude-3-5-haiku') return 'claude-3-5-haiku-20241022';
    return 'claude-3-5-sonnet-20241022';
  }

  async streamChat({ model, messages, systemInstruction, temperature = 0.7, onChunk }) {
    if (!this.client) {
      const guidance =
        `[UMNY AI Notice]: Anthropic API key is not currently set in ANTHROPIC_API_KEY.\n\n` +
        `To activate live Claude generation, configure your ANTHROPIC_API_KEY in your .env or Render dashboard.`;
      onChunk(guidance);
      return {
        content: guidance,
        tokenUsage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }

    try {
      const modelName = this.resolveModelName(model);

      // Anthropic messages format (roles must alternate user / assistant)
      const formattedMessages = [];
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          formattedMessages.push({
            role: msg.role,
            content: msg.content || '',
          });
        }
      }

      const stream = await this.client.messages.stream({
        model: modelName,
        max_tokens: 4096,
        temperature: Math.min(Math.max(temperature, 0), 1),
        system: systemInstruction || undefined,
        messages: formattedMessages,
      });

      let fullText = '';
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
          const text = chunk.delta.text;
          fullText += text;
          if (onChunk) onChunk(text);
        }
      }

      return {
        content: fullText,
        tokenUsage: {
          promptTokens: Math.ceil(messages.reduce((acc, m) => acc + (m.content || '').length, 0) / 4),
          completionTokens: Math.ceil(fullText.length / 4),
          totalTokens: Math.ceil((messages.reduce((acc, m) => acc + (m.content || '').length, 0) + fullText.length) / 4),
        },
      };
    } catch (err) {
      console.error('[AnthropicProvider Error]:', err.message);
      throw new Error(`Anthropic Error: ${err.message}`);
    }
  }
}

module.exports = AnthropicProvider;
