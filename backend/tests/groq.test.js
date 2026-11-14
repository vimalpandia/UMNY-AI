const GroqProvider = require('../src/services/ai/GroqProvider');
const aiService = require('../src/services/ai/AIService');

describe('Groq AI Provider & Streaming Integration Tests', () => {
  let groqProvider;
  const originalEnvKey = process.env.GROQ_API_KEY;
  const originalEnvBase = process.env.GROQ_BASE_URL;

  beforeEach(() => {
    groqProvider = new GroqProvider();
  });

  afterEach(() => {
    process.env.GROQ_API_KEY = originalEnvKey;
    process.env.GROQ_BASE_URL = originalEnvBase;
  });

  describe('Model Support & Name Resolution', () => {
    it('should support standard Groq models', () => {
      expect(groqProvider.supportsModel('llama-3.3-70b-versatile')).toBe(true);
      expect(groqProvider.supportsModel('llama-3.1-8b-instant')).toBe(true);
      expect(groqProvider.supportsModel('mixtral-8x7b-32768')).toBe(true);
      expect(groqProvider.supportsModel('groq/custom-model')).toBe(true);
      expect(groqProvider.supportsModel('gemma2-9b-it')).toBe(true);
      expect(groqProvider.supportsModel('default')).toBe(true);
    });

    it('should reject non-groq models', () => {
      expect(groqProvider.supportsModel('gpt-4o')).toBe(false);
      expect(groqProvider.supportsModel('gemini-2.5-flash')).toBe(false);
      expect(groqProvider.supportsModel('claude-3-5-sonnet')).toBe(false);
      expect(groqProvider.supportsModel(null)).toBe(false);
    });

    it('should strip groq/ prefix when resolving model names', () => {
      expect(groqProvider.resolveModelName('groq/llama-3.3-70b-versatile')).toBe('llama-3.3-70b-versatile');
      expect(groqProvider.resolveModelName('llama-3.1-8b-instant')).toBe('llama-3.1-8b-instant');
      expect(groqProvider.resolveModelName('default')).toBe('llama-3.3-70b-versatile');
    });

    it('should fallback to default model if none specified', () => {
      expect(groqProvider.resolveModelName(null)).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('Missing API Key Graceful Notice', () => {
    it('should return helpful onboarding notice when GROQ_API_KEY is not set', async () => {
      delete process.env.GROQ_API_KEY;
      const chunks = [];
      const result = await groqProvider.streamChat({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hello Groq!' }],
        onChunk: (chunk) => chunks.push(chunk),
      });

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('Groq API key is not currently configured');
      expect(result.content).toContain('console.groq.com');
      expect(result).toHaveProperty('tokenUsage');
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('GROQ_API_KEY');
    });

    it('should return onboarding notice in non-streaming mode when GROQ_API_KEY is missing', async () => {
      delete process.env.GROQ_API_KEY;
      const result = await groqProvider.generateChat({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Hello Groq!' }],
      });

      expect(result).toHaveProperty('content');
      expect(result.content).toContain('Groq API key is not currently configured');
      expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Streaming Responses', () => {
    it('should stream chunks sequentially when client is mocked', async () => {
      // Mock client directly on the provider instance
      const mockStream = (async function* () {
        yield { choices: [{ delta: { content: 'Hello' } }] };
        yield { choices: [{ delta: { content: ' from' } }] };
        yield { choices: [{ delta: { content: ' Groq' } }] };
        yield { choices: [{ delta: { content: ' LPU!' } }] };
      })();

      groqProvider.getClient = () => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockStream),
          },
        },
      });

      const collectedChunks = [];
      const result = await groqProvider.streamChat({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Say hello' }],
        systemInstruction: 'You are UMNY AI assistant.',
        onChunk: (chunk) => collectedChunks.push(chunk),
      });

      expect(collectedChunks).toEqual(['Hello', ' from', ' Groq', ' LPU!']);
      expect(result.content).toEqual('Hello from Groq LPU!');
      expect(result.tokenUsage.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Normal (Non-Streaming) Chat Completions', () => {
    it('should complete non-streaming chat requests with usage tokens', async () => {
      groqProvider.getClient = () => ({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'Groq is powered by LPU Inference Engine.',
                  },
                },
              ],
              usage: {
                prompt_tokens: 15,
                completion_tokens: 10,
                total_tokens: 25,
              },
            }),
          },
        },
      });

      const result = await groqProvider.generateChat({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'What is Groq?' }],
      });

      expect(result.content).toBe('Groq is powered by LPU Inference Engine.');
      expect(result.tokenUsage.promptTokens).toBe(15);
      expect(result.tokenUsage.completionTokens).toBe(10);
      expect(result.tokenUsage.totalTokens).toBe(25);
    });
  });

  describe('Error Handling', () => {
    it('should format 401 authentication errors clearly', () => {
      const err = new Error('Invalid API Key provided');
      err.status = 401;
      const formatted = groqProvider.handleError(err, 'llama-3.3-70b-versatile');
      expect(formatted.message).toContain('Groq Authentication Error');
      expect(formatted.message).toContain('GROQ_API_KEY');
    });

    it('should format 429 rate limit exceeded errors clearly', () => {
      const err = new Error('Rate limit reached for model');
      err.status = 429;
      const formatted = groqProvider.handleError(err, 'llama-3.3-70b-versatile');
      expect(formatted.message).toContain('Groq Rate Limit Exceeded');
      expect(formatted.message).toContain('Free developer tier');
    });

    it('should format 404 model unavailable or decommissioned errors clearly', () => {
      const err = new Error('The model `old-model` does not exist');
      err.status = 404;
      const formatted = groqProvider.handleError(err, 'old-model');
      expect(formatted.message).toContain('Groq Model Error');
      expect(formatted.message).toContain('old-model');
    });

    it('should format network connection errors clearly', () => {
      const err = new Error('fetch failed');
      err.code = 'ECONNREFUSED';
      const formatted = groqProvider.handleError(err, 'llama-3.3-70b-versatile');
      expect(formatted.message).toContain('Groq Network Error');
      expect(formatted.message).toContain('GROQ_BASE_URL');
    });
  });

  describe('AIService Provider Routing Integration', () => {
    it('should route Groq models via AIService', () => {
      const provider = aiService.getProviderForModel('llama-3.3-70b-versatile');
      expect(provider).toBeDefined();
      expect(provider.name).toBe('groq');
    });

    it('should route null/undefined and default to Groq by default', () => {
      const defaultProvider = aiService.getProviderForModel(null);
      expect(defaultProvider).toBeDefined();
      expect(defaultProvider.name).toBe('groq');

      const namedDefaultProvider = aiService.getProviderForModel('default');
      expect(namedDefaultProvider).toBeDefined();
      expect(namedDefaultProvider.name).toBe('groq');
    });

    it('should return Groq model as the system default model', () => {
      expect(aiService.getDefaultModel()).toBe('llama-3.3-70b-versatile');
    });

    it('should treat placeholder API keys as unconfigured', () => {
      process.env.GROQ_API_KEY = 'your_groq_api_key_here';
      const provider = new GroqProvider();
      expect(provider.getClient()).toBeNull();

      process.env.GROQ_API_KEY = '   ';
      const provider2 = new GroqProvider();
      expect(provider2.getClient()).toBeNull();
    });

    it('should never silently fallback on unsupported model', () => {
      expect(() => {
        aiService.getProviderForModel('fake-unsupported-model-x');
      }).toThrow('Unsupported model identifier');
    });
  });
});

