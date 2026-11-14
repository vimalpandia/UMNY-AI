const AIProvider = require('./AIProvider');
const OpenAI = require('openai');
const env = require('../../config/env');

class GroqProvider extends AIProvider {
  constructor() {
    super('groq');
    this.apiKey = null;
    this.baseURL = null;
    this.client = null;
  }

  getClient() {
    const currentKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
    const currentBaseUrl =
      process.env.GROQ_BASE_URL || env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';

    if (!currentKey) return null;

    if (!this.client || this.apiKey !== currentKey || this.baseURL !== currentBaseUrl) {
      this.apiKey = currentKey;
      this.baseURL = currentBaseUrl;
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
    }

    return this.client;
  }

  supportsModel(model) {
    if (!model) return false;
    const m = model.toLowerCase();
    return (
      m.startsWith('groq/') ||
      m.includes('llama') ||
      m.includes('mixtral') ||
      m.includes('gemma') ||
      m === 'llama-3.3-70b-versatile' ||
      m === 'llama-3.1-8b-instant' ||
      m === 'llama-3.1-70b-versatile' ||
      m === 'mixtral-8x7b-32768' ||
      m === 'gemma2-9b-it' ||
      m === (env.GROQ_MODEL || '').toLowerCase()
    );
  }

  resolveModelName(model) {
    if (!model || model === 'groq') {
      return process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    }
    if (model.startsWith('groq/')) {
      return model.replace('groq/', '');
    }
    return model;
  }

  /**
   * Format friendly, specific error message based on API failure
   */
  handleError(err, modelName) {
    console.error('[GroqProvider Error]:', err.message);

    const status = err.status || err.statusCode;
    if (status === 401 || err.message?.includes('401') || err.message?.includes('Invalid API Key')) {
      return new Error('Groq Authentication Error: Invalid or inactive API key. Please verify GROQ_API_KEY in your Render dashboard or .env file.');
    }
    if (status === 429 || err.message?.includes('429') || err.message?.includes('Rate limit')) {
      return new Error('Groq Rate Limit Exceeded: Free developer tier quota limit reached. Please wait a few moments before sending another request.');
    }
    if (status === 404 || err.message?.includes('model_not_found') || err.message?.includes('does not exist')) {
      return new Error(`Groq Model Error: Model "${modelName}" is not available or decommissioned on Groq. Please select an active model such as llama-3.3-70b-versatile.`);
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.message?.includes('fetch failed')) {
      return new Error('Groq Network Error: Unable to reach Groq API endpoint. Please verify your network connection and GROQ_BASE_URL.');
    }

    return new Error(`Groq Error: ${err.message}`);
  }

  async generateChat({ model, messages, systemInstruction, temperature = 0.7 }) {
    const client = this.getClient();
    const modelName = this.resolveModelName(model);

    if (!client) {
      const guidance =
        `[UMNY AI Notice]: Groq API key is not currently configured in GROQ_API_KEY.\n\n` +
        `To activate ultra-fast Groq LPU inference on the free developer tier:\n` +
        `1. Create a free API key at https://console.groq.com/keys\n` +
        `2. Add GROQ_API_KEY to your Render environment variables or .env file\n` +
        `3. Set GROQ_MODEL=llama-3.3-70b-versatile (optional, default is llama-3.3-70b-versatile)\n\n` +
        `Once configured, Groq models will respond with near-instant streaming!`;
      return {
        content: guidance,
        tokenUsage: { promptTokens: 25, completionTokens: 60, totalTokens: 85 },
      };
    }

    try {
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

      const response = await client.chat.completions.create({
        model: modelName,
        messages: formattedMessages,
        temperature: Math.min(Math.max(temperature, 0), 2),
        stream: false,
      });

      const content = response.choices[0]?.message?.content || '';
      return {
        content,
        tokenUsage: {
          promptTokens:
            response.usage?.prompt_tokens ||
            Math.ceil(messages.reduce((acc, m) => acc + (m.content || '').length, 0) / 4),
          completionTokens:
            response.usage?.completion_tokens || Math.ceil(content.length / 4),
          totalTokens:
            response.usage?.total_tokens ||
            Math.ceil(
              (messages.reduce((acc, m) => acc + (m.content || '').length, 0) + content.length) / 4
            ),
        },
      };
    } catch (err) {
      throw this.handleError(err, modelName);
    }
  }

  async streamChat({ model, messages, systemInstruction, temperature = 0.7, onChunk }) {
    const client = this.getClient();
    const modelName = this.resolveModelName(model);

    if (!client) {
      const guidance =
        `[UMNY AI Notice]: Groq API key is not currently configured in GROQ_API_KEY.\n\n` +
        `To activate ultra-fast Groq LPU inference on the free developer tier:\n` +
        `1. Create a free API key at https://console.groq.com/keys\n` +
        `2. Add GROQ_API_KEY to your Render environment variables or .env file\n` +
        `3. Set GROQ_MODEL=llama-3.3-70b-versatile (optional, default is llama-3.3-70b-versatile)\n\n` +
        `Once configured, Groq models will respond with near-instant streaming!`;
      if (onChunk) onChunk(guidance);
      return {
        content: guidance,
        tokenUsage: { promptTokens: 25, completionTokens: 60, totalTokens: 85 },
      };
    }

    try {
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

      const stream = await client.chat.completions.create({
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
      throw this.handleError(err, modelName);
    }
  }
}

module.exports = GroqProvider;
