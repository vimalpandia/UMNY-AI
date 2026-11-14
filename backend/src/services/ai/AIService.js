const GeminiProvider = require('./GeminiProvider');
const OpenAIProvider = require('./OpenAIProvider');
const AnthropicProvider = require('./AnthropicProvider');
const GroqProvider = require('./GroqProvider');
const memoryService = require('../memory/MemoryService');
const agentService = require('../agents/AgentService');
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const UsageLog = require('../../models/UsageLog');
const { isConnected } = require('../../config/db');
const env = require('../../config/env');
const { DEFAULT_MODEL, DEPRECATED_MODELS } = require('../../config/constants');

class AIService {
  constructor() {
    this.providers = [
      new GroqProvider(),
      new GeminiProvider(),
      new OpenAIProvider(),
      new AnthropicProvider(),
    ];
  }

  isModelDeprecated(model) {
    if (!model) return false;
    const clean = model.toLowerCase().replace('groq/', '').trim();
    return (DEPRECATED_MODELS || []).some((dep) => dep.replace('groq/', '').trim() === clean);
  }

  getDefaultModel() {
    const configured = process.env.GROQ_MODEL || env.GROQ_MODEL;
    if (configured && !this.isModelDeprecated(configured)) {
      return configured;
    }
    return DEFAULT_MODEL || 'llama-3.1-8b-instant';
  }

  getProviderForModel(model) {
    if (!model || model === 'default') {
      return this.providers[0]; // GroqProvider
    }
    if (this.isModelDeprecated(model)) {
      throw new Error(
        `Model "${model}" has been decommissioned by Groq as of August 16, 2026. Please select an active model such as "${this.getDefaultModel()}".`
      );
    }
    const provider = this.providers.find((p) => p.supportsModel(model));
    if (!provider) {
      throw new Error(
        `Unsupported model identifier: "${model}". Please select a supported model from Groq, OpenAI, Anthropic, or Google.`
      );
    }
    return provider;
  }

  /**
   * Return dynamic list of supported models across all providers
   */
  async getAvailableModels() {
    const groqProvider = this.providers.find((p) => p.name === 'groq');
    let dynamicGroqModels = [];
    if (groqProvider && typeof groqProvider.discoverModels === 'function') {
      try {
        dynamicGroqModels = await groqProvider.discoverModels();
      } catch (err) {
        console.warn('[AIService] Failed to discover Groq models dynamically:', err.message);
      }
    }

    const defaultModelId = this.getDefaultModel();

    const groqList = (dynamicGroqModels.length > 0 ? dynamicGroqModels : [
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'Groq',
        badge: 'Ultra-Fast',
        description: 'High-speed 128k context reasoning optimized on Groq LPU hardware.',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B (32k)',
        provider: 'Groq',
        badge: 'High Context',
        description: 'Mixture-of-Experts architecture with 32,768 token window on Groq.',
      },
    ]).map((m) => ({
      ...m,
      isDefault: m.id === defaultModelId,
      badge: m.id === defaultModelId ? `Default • ${m.badge}` : m.badge,
    }));

    const otherModels = [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        badge: 'Flagship',
        description: 'Omni-model reasoning with versatile text and multimodal fluency.',
        isDefault: 'gpt-4o' === defaultModelId,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        badge: 'Lightweight',
        description: 'Affordable, low-latency conversational powerhouse.',
        isDefault: 'gpt-4o-mini' === defaultModelId,
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        badge: 'Expert Code & Logic',
        description: 'Premier coding, architectural planning, and articulate prose.',
        isDefault: 'claude-3-5-sonnet' === defaultModelId,
      },
      {
        id: 'claude-3-5-haiku',
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        badge: 'Rapid',
        description: 'Super-fast lightweight intelligence for instant workflows.',
        isDefault: 'claude-3-5-haiku' === defaultModelId,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        badge: 'Optional',
        description: 'High-speed multimodal intelligence (requires active Gemini API key).',
        isDefault: 'gemini-2.5-flash' === defaultModelId,
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        badge: 'Optional Reasoning',
        description: 'Deep mathematical analysis (requires active Gemini API key).',
        isDefault: 'gemini-2.5-pro' === defaultModelId,
      },
    ];

    return [...groqList, ...otherModels];
  }

  buildSystemInstruction(user, memories = [], toolResults = []) {
    let instruction =
      `You are UMNY AI, an advanced, modern, independent multi-model AI assistant.\n` +
      `Tagline: "Your Intelligence. Your Assistant. Your World."\n\n` +
      `Core Principles:\n` +
      `- Provide clear, accurate, high-quality, and nuanced answers.\n` +
      `- Be concise yet thorough. Format responses using clean GitHub Markdown with syntax-highlighted code blocks where appropriate.\n` +
      `- Never fabricate facts or claim to have unlimited intelligence or abilities.\n` +
      `- Do not run or propose dangerous commands, malware, or unvetted scripts.\n`;

    if (user?.name) {
      instruction += `\nUser's Name: ${user.name}`;
    }

    if (user?.preferences?.customInstructions) {
      instruction += `\n\n[USER CUSTOM INSTRUCTIONS]:\n${user.preferences.customInstructions}\n`;
    }

    if (memories.length > 0) {
      instruction += memoryService.formatMemoriesForPrompt(memories);
    }

    if (toolResults.length > 0) {
      instruction += agentService.formatToolOutputsForContext(toolResults);
    }

    return instruction;
  }

  /**
   * Main streaming chat orchestrator
   */
  async streamChat({
    userId,
    user,
    conversationId,
    content,
    model,
    attachments = [],
    agentMode = false,
    onChunk,
    onToolProgress,
  }) {
    const resolvedModel = (!model || model === 'default') ? this.getDefaultModel() : model;
    const provider = this.getProviderForModel(resolvedModel);

    // 1. Fetch relevant long-term memories if enabled
    let memories = [];
    if (user?.preferences?.memoryEnabled !== false) {
      memories = await memoryService.getRelevantMemories(userId, content);
    }

    // 2. If agent mode is enabled or requested, detect and run tools
    let executedTools = [];
    if (agentMode) {
      const plannedTools = agentService.detectToolsNeeded(content, attachments);
      if (plannedTools.length > 0) {
        executedTools = await agentService.executePlan(plannedTools, onToolProgress);
      }
    }

    // 3. Retrieve prior messages from conversation history
    let historyMessages = [];
    if (isConnected() && conversationId) {
      try {
        const past = await Message.find({ conversationId })
          .sort({ createdAt: 1 })
          .limit(20);
        historyMessages = past.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      } catch (err) {
        console.warn('Could not load history from db:', err.message);
      }
    }

    // Add current user message with attached document context if any
    let fullUserPrompt = content;
    if (attachments && attachments.length > 0) {
      const attachmentSummaries = attachments
        .map(
          (a) =>
            `[Attached Document: ${a.name || a.filename}]\n${a.textExtract || ''}`
        )
        .join('\n\n');
      fullUserPrompt += `\n\n${attachmentSummaries}`;
    }

    historyMessages.push({ role: 'user', content: fullUserPrompt });

    // 4. Build system instruction with memory context & tool results
    const systemInstruction = this.buildSystemInstruction(user, memories, executedTools);

    // 5. Call Provider streamChat
    let result;
    try {
      result = await provider.streamChat({
        model: resolvedModel,
        messages: historyMessages,
        systemInstruction,
        temperature: user?.preferences?.temperature ?? 0.7,
        onChunk,
      });

      // 6. Log usage
      if (isConnected() && userId) {
        try {
          await UsageLog.create({
            userId,
            provider: provider.name,
            model: resolvedModel,
            tokenUsage: result.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            requestStatus: 'success',
          });
        } catch (logErr) {
          console.warn('UsageLog write error:', logErr.message);
        }
      }

      // 7. Save messages to DB
      let savedUserMsg = null;
      let savedAssistantMsg = null;

      if (isConnected() && conversationId) {
        try {
          savedUserMsg = await Message.create({
            conversationId,
            userId,
            role: 'user',
            content,
            attachments,
            model: resolvedModel,
          });

          savedAssistantMsg = await Message.create({
            conversationId,
            userId,
            role: 'assistant',
            content: result.content,
            model: resolvedModel,
            toolCalls: executedTools,
            tokenUsage: result.tokenUsage,
          });

          // Auto-update conversation title if it's the first message
          const msgCount = await Message.countDocuments({ conversationId });
          if (msgCount <= 2) {
            const shortTitle = content.slice(0, 36) + (content.length > 36 ? '...' : '');
            await Conversation.findByIdAndUpdate(conversationId, { title: shortTitle });
          }
        } catch (dbErr) {
          console.warn('Failed to persist messages to MongoDB:', dbErr.message);
        }
      }

      return {
        content: result.content,
        model: resolvedModel,
        toolCalls: executedTools,
        tokenUsage: result.tokenUsage,
        message: savedAssistantMsg || {
          _id: 'msg_' + Date.now(),
          conversationId,
          role: 'assistant',
          content: result.content,
          model: resolvedModel,
          toolCalls: executedTools,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      if (isConnected() && userId) {
        try {
          await UsageLog.create({
            userId,
            provider: provider.name,
            model: resolvedModel,
            requestStatus: 'error',
            errorMessage: err.message,
          });
        } catch (logErr) {}
      }
      throw err;
    }
  }
}

module.exports = new AIService();

