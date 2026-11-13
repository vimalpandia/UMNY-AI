const AIProvider = require('./AIProvider');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../config/env');

class GeminiProvider extends AIProvider {
  constructor() {
    super('google');
    this.apiKey = env.GEMINI_API_KEY;
    this.client = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;
  }

  supportsModel(model) {
    return (
      model.startsWith('gemini') ||
      model === 'gemini-2.5-flash' ||
      model === 'gemini-2.5-pro' ||
      model === 'gemini-1.5-flash' ||
      model === 'gemini-1.5-pro'
    );
  }

  resolveModelName(model) {
    // Map alias to Gemini API model identifiers
    if (model === 'gemini-2.5-flash') return 'gemini-2.5-flash';
    if (model === 'gemini-2.5-pro') return 'gemini-2.5-pro';
    return model || 'gemini-2.5-flash';
  }

  async streamChat({ model, messages, systemInstruction, temperature = 0.7, onChunk }) {
    if (!this.client) {
      const guidance =
        `[UMNY AI Notice]: Google Gemini API key is not currently set in GEMINI_API_KEY.\n\n` +
        `To activate live Gemini generation, configure your Google Gemini API key in your .env or Render dashboard.\n\n` +
        `Here is a simulated response to your inquiry: I received your request and am ready to assist once the provider key is configured!`;
      onChunk(guidance);
      return {
        content: guidance,
        tokenUsage: { promptTokens: 20, completionTokens: 40, totalTokens: 60 },
      };
    }

    try {
      const modelName = this.resolveModelName(model);
      const generativeModel = this.client.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          temperature: Math.min(Math.max(temperature, 0), 1),
        },
      });

      // Format conversation history for Gemini: role must be 'user' or 'model'
      const contents = [];
      for (const msg of messages) {
        const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role: geminiRole,
          parts: [{ text: msg.content || '' }],
        });
      }

      // Stream generation
      const result = await generativeModel.generateContentStream({ contents });
      let fullText = '';

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullText += chunkText;
          if (onChunk) onChunk(chunkText);
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
      console.error('[GeminiProvider Error]:', err.message);
      throw new Error(`Google Gemini Error: ${err.message}`);
    }
  }
}

module.exports = GeminiProvider;
