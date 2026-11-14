const AIProvider = require('./AIProvider');
const OpenAI = require('openai');
const env = require('../../config/env');

const DEPRECATED_MODELS = [
  'llama-3.3-70b-versatile',
  'groq/llama-3.3-70b-versatile',
  'groq/compound',
  'groq/compound-mini',
  'gemma-7b-it',
  'llama-3-70b-8192',
  'llama-3-8b-8192',
];

const FALLBACK_GROQ_MODELS = [
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B Instant',
    provider: 'Groq',
    badge: 'Ultra-Fast',
    description: 'High-speed 128k context reasoning optimized on Groq LPU hardware.',
    contextWindow: 131072,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B (32k)',
    provider: 'Groq',
    badge: 'High Context',
    description: 'Mixture-of-Experts architecture with 32,768 token context window.',
    contextWindow: 32768,
  },
];

class GroqProvider extends AIProvider {
  constructor() {
    super('groq');
    this.apiKey = null;
    this.baseURL = null;
    this.client = null;
    this.cachedModels = null;
    this.cacheTimestamp = 0;
    this.CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
  }

  getClient() {
    const rawKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
    const currentKey = rawKey.trim();
    const currentBaseUrl = (
      process.env.GROQ_BASE_URL ||
      env.GROQ_BASE_URL ||
      'https://api.groq.com/openai/v1'
    ).trim();

    if (
      !currentKey ||
      currentKey === 'your_groq_api_key_here' ||
      currentKey.startsWith('your_') ||
      currentKey === 'undefined' ||
      currentKey === 'null'
    ) {
      return null;
    }

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

  isModelDeprecated(model) {
    if (!model) return false;
    const clean = model.toLowerCase().replace('groq/', '').trim();
    return DEPRECATED_MODELS.some((dep) => dep.replace('groq/', '').trim() === clean);
  }

  formatModelDisplayName(modelId) {
    if (!modelId) return 'Groq Model';
    return modelId
      .replace('groq/', '')
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getFallbackModels() {
    const configuredModel = process.env.GROQ_MODEL || env.GROQ_MODEL;
    const models = [...FALLBACK_GROQ_MODELS];

    if (
      configuredModel &&
      !this.isModelDeprecated(configuredModel) &&
      !models.some((m) => m.id === configuredModel)
    ) {
      models.unshift({
        id: configuredModel,
        name: this.formatModelDisplayName(configuredModel),
        provider: 'Groq',
        badge: 'Configured Default',
        description: 'Active model specified via GROQ_MODEL environment variable.',
      });
    }

    return models;
  }

  /**
   * Dynamic model discovery via GET https://api.groq.com/openai/v1/models
   * Securely runs backend-only using GROQ_API_KEY.
   */
  async discoverModels() {
    const now = Date.now();
    if (this.cachedModels && now - this.cacheTimestamp < this.CACHE_TTL_MS) {
      return this.cachedModels;
    }

    const client = this.getClient();
    if (!client) {
      return this.getFallbackModels();
    }

    try {
      const response = await client.models.list();
      const rawList = response.data || [];

      // Filter out non-chat models (audio, moderation guards, and decommissioned models)
      const chatModels = rawList
        .filter((m) => {
          const id = (m.id || '').toLowerCase();
          if (this.isModelDeprecated(id)) return false;
          if (id.includes('whisper') || id.includes('audio') || id.includes('tts')) return false;
          if (id.includes('guard') || id.includes('safeguard')) return false;
          if (m.active === false) return false;
          return true;
        })
        .map((m) => {
          const id = m.id;
          const isMixtral = id.includes('mixtral');
          const isGptOss = id.includes('gpt-oss');

          let badge = 'Production Model';
          if (id.includes('instant') || id.includes('8b')) badge = 'Ultra-Fast';
          else if (isMixtral) badge = 'High Context';
          else if (isGptOss) badge = 'Open Architecture';
          else if (id.includes('70b') || id.includes('120b')) badge = 'High Capacity';

          return {
            id,
            name: this.formatModelDisplayName(id),
            provider: 'Groq',
            badge,
            description: `Active Groq LPU model (${m.owned_by || 'Open Weights'}).`,
          };
        });

      if (chatModels.length > 0) {
        this.cachedModels = chatModels;
        this.cacheTimestamp = now;
        return chatModels;
      }
      return this.getFallbackModels();
    } catch (err) {
      console.warn('[GroqProvider] Dynamic model discovery failed, using fallback models:', err.message);
      return this.getFallbackModels();
    }
  }

  supportsModel(model) {
    if (!model) return false;
    const m = model.toLowerCase();
    if (this.isModelDeprecated(m)) return false;

    return (
      m === 'default' ||
      m.startsWith('groq/') ||
      m.includes('llama') ||
      m.includes('mixtral') ||
      m.includes('gemma') ||
      m.includes('gpt-oss') ||
      m === 'llama-3.1-8b-instant' ||
      m === 'llama-3.1-70b-versatile' ||
      m === 'mixtral-8x7b-32768' ||
      m === 'gemma2-9b-it' ||
      (this.cachedModels && this.cachedModels.some((cm) => cm.id.toLowerCase() === m)) ||
      m === (process.env.GROQ_MODEL || env.GROQ_MODEL || '').toLowerCase()
    );
  }

  resolveModelName(model) {
    if (!model || model === 'groq' || model === 'default') {
      const defaultMod = process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.1-8b-instant';
      if (this.isModelDeprecated(defaultMod)) {
        return 'llama-3.1-8b-instant';
      }
      return defaultMod;
    }

    const cleanModel = model.startsWith('groq/') ? model.replace('groq/', '') : model;

    if (this.isModelDeprecated(cleanModel)) {
      throw new Error(
        `Groq Model Error: Model "${model}" is not available or decommissioned on Groq as of August 16, 2026. Please select an active model such as "${this.resolveModelName('default')}".`
      );
    }

    return cleanModel;
  }

  /**
   * Format friendly, specific error message based on API failure
   */
  handleError(err, modelName) {
    console.error('[GroqProvider Error]:', err.message);

    const status = err.status || err.statusCode;
    const msg = (err.message || '').toLowerCase();

    if (
      status === 401 ||
      msg.includes('401') ||
      msg.includes('invalid api key') ||
      msg.includes('invalid_api_key') ||
      msg.includes('unauthorized') ||
      msg.includes('authentication')
    ) {
      return new Error(
        'Groq Authentication Error: Invalid or inactive API key. Please check GROQ_API_KEY in your Render dashboard or .env file. Generate a key at https://console.groq.com/keys'
      );
    }
    if (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('rate limit') ||
      msg.includes('quota')
    ) {
      return new Error(
        'Groq Rate Limit Exceeded: Free developer tier rate limit reached. Please wait a few moments before sending another request.'
      );
    }
    if (
      status === 404 ||
      msg.includes('model_not_found') ||
      msg.includes('model_decommissioned') ||
      msg.includes('does not exist') ||
      msg.includes('decommissioned')
    ) {
      const activeFallback = process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.1-8b-instant';
      return new Error(
        `Groq Model Error: Model "${modelName}" is not available or decommissioned on Groq. Please select an active model such as "${activeFallback}".`
      );
    }
    if (
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      msg.includes('fetch failed') ||
      msg.includes('network')
    ) {
      return new Error(
        'Groq Network Error: Unable to reach Groq API endpoint. Please verify your network connection and GROQ_BASE_URL.'
      );
    }

    return new Error(`Groq Error: ${err.message}`);
  }

  async generateChat({ model, messages, systemInstruction, temperature = 0.7 }) {
    const client = this.getClient();
    const modelName = this.resolveModelName(model);

    if (!client) {
      const defaultMod = process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.1-8b-instant';
      const guidance =
        `[UMNY AI Notice]: Groq API key is not currently configured in GROQ_API_KEY.\n\n` +
        `To activate ultra-fast Groq LPU inference:\n` +
        `1. Create an API key at https://console.groq.com/keys\n` +
        `2. Add GROQ_API_KEY to your Render environment variables or .env file\n` +
        `3. Set GROQ_MODEL=${defaultMod} (optional, default is ${defaultMod})\n\n` +
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
      const defaultMod = process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.1-8b-instant';
      const guidance =
        `[UMNY AI Notice]: Groq API key is not currently configured in GROQ_API_KEY.\n\n` +
        `To activate ultra-fast Groq LPU inference:\n` +
        `1. Create an API key at https://console.groq.com/keys\n` +
        `2. Add GROQ_API_KEY to your Render environment variables or .env file\n` +
        `3. Set GROQ_MODEL=${defaultMod} (optional, default is ${defaultMod})\n\n` +
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
