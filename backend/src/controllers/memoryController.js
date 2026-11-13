const memoryService = require('../services/memory/MemoryService');

const memoryController = {
  async getMemories(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const memories = await memoryService.getMemoriesByUser(userId);
      res.json(memories);
    } catch (err) {
      next(err);
    }
  },

  async addMemory(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { content, category = 'general', importance = 3 } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ message: 'Memory content cannot be empty.' });
      }

      const memory = await memoryService.addMemory(userId, {
        content: content.trim(),
        category,
        importance,
      });

      res.status(201).json(memory);
    } catch (err) {
      next(err);
    }
  },

  async deleteMemory(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { id } = req.params;

      await memoryService.deleteMemory(userId, id);
      res.json({ message: 'Memory deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = memoryController;
