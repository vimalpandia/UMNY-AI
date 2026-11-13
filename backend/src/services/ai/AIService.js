const GeminiProvider = require('./GeminiProvider');
const OpenAIProvider = require('./OpenAIProvider');
const AnthropicProvider = require('./AnthropicProvider');
const memoryService = require('../memory/MemoryService');
const agentService = require('../agents/AgentService');
const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const UsageLog = require('../../models/UsageLog');
const { isConnected } = require('../../config/db');

class AIService {
  constructor() {
    this.providers = [
      new GeminiProvider(),
      new OpenAIProvider(),
      new AnthropicProvider(),
    ];
  }

  getProviderForModel(model) {
    const provider = this.providers.find((p) => p.supportsModel(model));
    if (!provider) {
      // Default to Google Gemini provider
      return this.providers[0];
    }
    return provider;
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
    model = 'gemini-2.5-flash',
    attachments = [],
    agentMode = false,
    onChunk,
    onToolProgress,
  }) {
    const provider = this.getProviderForModel(model);

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
        model,
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
            model,
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
            model,
          });

          savedAssistantMsg = await Message.create({
            conversationId,
            userId,
            role: 'assistant',
            content: result.content,
            model,
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
        model,
        toolCalls: executedTools,
        tokenUsage: result.tokenUsage,
        message: savedAssistantMsg || {
          _id: 'msg_' + Date.now(),
          conversationId,
          role: 'assistant',
          content: result.content,
          model,
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
            model,
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
