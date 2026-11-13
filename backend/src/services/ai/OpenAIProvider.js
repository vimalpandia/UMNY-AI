const AIProvider = require('./AIProvider');
const OpenAI = require('openai');
const env = require('../../config/env');

class OpenAIProvider extends AIProvider {
  constructor() {
    super('openai');
    this.apiKey = env.OPENAI_API_KEY;
    this.client = this.apiKey ? new OpenAI({ apiKey: this.apiKey }) : null;
  }

  supportsModel(model) {
    return (
      model.startsWith('gpt') ||
      model.startsWith('o1') ||
      model.startsWith('o3') ||
      model === 'gpt-4o' ||
      model === 'gpt-4o-mini'
    );
  }

  resolveModelName(model) {
    if (model === 'gpt-4o-mini') return 'gpt-4o-mini';
    return model || 'gpt-4o';
  }

  async streamChat({ model, messages, systemInstruction, temperature = 0.7, onChunk }) {
    if (!this.client) {
      const guidance =
        `[UMNY AI Notice]: OpenAI API key is not currently set in OPENAI_API_KEY.\n\n` +
        `To activate live OpenAI GPT-4o generation, configure your OPENAI_API_KEY in your .env or Render dashboard.`;
      onChunk(guidance);
      return {
        content: guidance,
        tokenUsage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }

    try {
      const modelName = this.resolveModelName(model);

      const formattedMessages = [];
      if (systemInstruction) {
        formattedMessages.push({ role: 'system', content: systemInstruction });
      }

      for (const msg of messages) {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || '',
        });
      }

      const stream = await this.client.chat.completions.create({
        model: modelName,
        messages: formattedMessages,
        temperature: Math.min(Math.max(temperature, 0), 2),
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
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
      console.error('[OpenAIProvider Error]:', err.message);
      throw new Error(`OpenAI Error: ${err.message}`);
    }
  }
}

module.exports = OpenAIProvider;
