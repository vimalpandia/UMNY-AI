class AIProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Stream chat completion
   * @param {Object} options
   * @param {string} options.model
   * @param {Array} options.messages - [{ role: 'user'|'assistant'|'system', content: string }]
   * @param {string} [options.systemInstruction]
   * @param {number} [options.temperature]
   * @param {Function} options.onChunk - (textChunk: string) => void
   * @returns {Promise<{ content: string, tokenUsage: Object }>}
   */
  async streamChat({ model, messages, systemInstruction, temperature, onChunk }) {
    throw new Error(`streamChat must be implemented by ${this.name} provider`);
  }

  /**
   * Non-streaming chat completion
   */
  async generateChat({ model, messages, systemInstruction, temperature }) {
    let fullContent = '';
    const result = await this.streamChat({
      model,
      messages,
      systemInstruction,
      temperature,
      onChunk: (chunk) => {
        fullContent += chunk;
      },
    });
    return { ...result, content: fullContent };
  }

  supportsModel(model) {
    throw new Error(`supportsModel must be implemented by ${this.name} provider`);
  }
}

module.exports = AIProvider;
