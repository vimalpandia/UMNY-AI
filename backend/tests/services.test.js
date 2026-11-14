const memoryService = require('../src/services/memory/MemoryService');
const agentService = require('../src/services/agents/AgentService');
const aiService = require('../src/services/ai/AIService');
const calculatorTool = require('../src/services/agents/tools/calculatorTool');
const summarizerTool = require('../src/services/agents/tools/summarizerTool');

describe('UMNY AI Services & Autonomous Engine Unit Tests', () => {
  describe('Calculator Tool', () => {
    it('should correctly evaluate standard mathematical operations', async () => {
      const result = await calculatorTool.execute({ expression: '4 * (5 + 10)' });
      expect(result).toContain('60');
    });

    it('should calculate square roots and powers safely', async () => {
      const result = await calculatorTool.execute({ expression: 'sqrt(144) + 8' });
      expect(result).toContain('20');
    });

    it('should reject potentially hazardous expressions', async () => {
      const result = await calculatorTool.execute({ expression: 'process.exit(1)' });
      expect(result).toContain('Error');
    });
  });

  describe('Document Summarizer Tool', () => {
    it('should extract highlights and key points from text', async () => {
      const sampleText =
        'UMNY AI represents a next generation architecture. It integrates multi-model foundational reasoning. Long-term memory enables deep user personalization. Tool execution allows autonomous research.';
      const output = await summarizerTool.execute({ text: sampleText });
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('highlights');
      expect(parsed.highlights.length).toBeGreaterThan(0);
    });
  });

  describe('Long-Term Memory Engine', () => {
    it('should format memories into structured prompt block', () => {
      const mockMemories = [
        { category: 'preference', content: 'Always answer in concise bullet points' },
        { category: 'coding', content: 'Use TypeScript and React 18' },
      ];
      const formatted = memoryService.formatMemoriesForPrompt(mockMemories);
      expect(formatted).toContain('[USER APPROVED LONG-TERM MEMORIES & PREFERENCES]');
      expect(formatted).toContain('PREFERENCE');
      expect(formatted).toContain('bullet points');
    });
  });

  describe('AI Service Multi-Provider Routing', () => {
    it('should route gemini models to GeminiProvider', () => {
      const provider = aiService.getProviderForModel('gemini-2.5-flash');
      expect(provider.name).toEqual('google');
    });

    it('should route gpt models to OpenAIProvider', () => {
      const provider = aiService.getProviderForModel('gpt-4o');
      expect(provider.name).toEqual('openai');
    });

    it('should route claude models to AnthropicProvider', () => {
      const provider = aiService.getProviderForModel('claude-3-5-sonnet');
      expect(provider.name).toEqual('anthropic');
    });

    it('should route groq llama models to GroqProvider', () => {
      const provider = aiService.getProviderForModel('llama-3.3-70b-versatile');
      expect(provider.name).toEqual('groq');
    });

    it('should route groq mixtral models to GroqProvider', () => {
      const provider = aiService.getProviderForModel('mixtral-8x7b-32768');
      expect(provider.name).toEqual('groq');
    });

    it('should route null or omitted model to GroqProvider by default', () => {
      const provider = aiService.getProviderForModel(null);
      expect(provider.name).toEqual('groq');
      expect(aiService.getDefaultModel()).toEqual('llama-3.3-70b-versatile');
    });

    it('should throw an error and never silently switch on unsupported models', () => {
      expect(() => {
        aiService.getProviderForModel('unsupported-custom-ai-v99');
      }).toThrow('Unsupported model identifier');
    });
  });
});

