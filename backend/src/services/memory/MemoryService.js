const Memory = require('../../models/Memory');
const { isConnected } = require('../../config/db');

// In-memory memory cache for testing/fallback
const localMemories = new Map();

class MemoryService {
  /**
   * Retrieve relevant memories for a user given the prompt query
   */
  async getRelevantMemories(userId, promptText = '', limit = 5) {
    if (!userId) return [];

    try {
      if (isConnected()) {
        const queryTerms = promptText
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 3);

        const memories = await Memory.find({ userId })
          .sort({ importance: -1, createdAt: -1 })
          .limit(25);

        if (!queryTerms.length) {
          return memories.slice(0, limit);
        }

        // Score based on term overlap and importance
        const scored = memories.map((m) => {
          const contentLower = m.content.toLowerCase();
          const matches = queryTerms.filter((term) => contentLower.includes(term)).length;
          return {
            memory: m,
            score: matches * 2 + (m.importance || 1),
          };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit).map((s) => s.memory);
      } else {
        const userMems = localMemories.get(userId.toString()) || [];
        return userMems.slice(0, limit);
      }
    } catch (err) {
      console.error('[MemoryService Error]:', err.message);
      return [];
    }
  }

  async addMemory(userId, { content, category = 'general', importance = 3 }) {
    if (!userId || !content) throw new Error('userId and content are required');

    if (isConnected()) {
      return await Memory.create({
        userId,
        content: content.trim(),
        category,
        importance,
      });
    }

    const mockMem = {
      _id: 'mem_' + Date.now(),
      userId: userId.toString(),
      content: content.trim(),
      category,
      importance,
      createdAt: new Date().toISOString(),
    };

    const userMems = localMemories.get(userId.toString()) || [];
    userMems.unshift(mockMem);
    localMemories.set(userId.toString(), userMems);
    return mockMem;
  }

  async getMemoriesByUser(userId) {
    if (isConnected()) {
      return await Memory.find({ userId }).sort({ createdAt: -1 });
    }
    return localMemories.get(userId.toString()) || [];
  }

  async deleteMemory(userId, memoryId) {
    if (isConnected()) {
      return await Memory.findOneAndDelete({ _id: memoryId, userId });
    }
    const userMems = localMemories.get(userId.toString()) || [];
    const filtered = userMems.filter((m) => m._id !== memoryId);
    localMemories.set(userId.toString(), filtered);
    return { deleted: true };
  }

  /**
   * Format memories into a clean prompt context block for the LLM
   */
  formatMemoriesForPrompt(memories = []) {
    if (!memories.length) return '';

    const lines = memories.map(
      (m, i) => `${i + 1}. [${m.category.toUpperCase()}]: ${m.content}`
    );

    return `\n\n[USER APPROVED LONG-TERM MEMORIES & PREFERENCES]:\n${lines.join('\n')}\n(Apply these preferences seamlessly to personalize your response.)\n`;
  }
}

module.exports = new MemoryService();

