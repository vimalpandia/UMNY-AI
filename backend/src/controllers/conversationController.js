const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { isConnected } = require('../config/db');
const { DEFAULT_MODEL } = require('../config/constants');

// In-memory fallback conversations cache
const localConversations = new Map();

const conversationController = {
  async getConversations(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const search = req.query.search || '';

      if (isConnected()) {
        const query = { userId };
        if (search) {
          query.title = { $regex: search, $options: 'i' };
        }
        const conversations = await Conversation.find(query).sort({ updatedAt: -1 });
        return res.json(conversations);
      }

      // Memory fallback
      const userConvs = localConversations.get(userId.toString()) || [];
      const filtered = search
        ? userConvs.filter((c) => (c.title || '').toLowerCase().includes(search.toLowerCase()))
        : userConvs;
      return res.json(filtered);
    } catch (err) {
      next(err);
    }
  },

  async createConversation(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { title = 'New Chat', selectedModel = DEFAULT_MODEL } = req.body;

      if (isConnected()) {
        const conv = await Conversation.create({
          userId,
          title: title.trim(),
          selectedModel,
        });
        return res.status(201).json(conv);
      }

      const mockConv = {
        _id: 'conv_' + Date.now(),
        userId: userId.toString(),
        title: title.trim(),
        selectedModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const userConvs = localConversations.get(userId.toString()) || [];
      userConvs.unshift(mockConv);
      localConversations.set(userId.toString(), userConvs);

      return res.status(201).json(mockConv);
    } catch (err) {
      next(err);
    }
  },

  async getConversationById(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { id } = req.params;

      if (isConnected()) {
        const conv = await Conversation.findOne({ _id: id, userId });
        if (!conv) {
          return res.status(404).json({ message: 'Conversation not found or access denied.' });
        }
        return res.json(conv);
      }

      const userConvs = localConversations.get(userId.toString()) || [];
      const conv = userConvs.find((c) => c._id === id);
      if (!conv) {
        return res.status(404).json({ message: 'Conversation not found.' });
      }
      return res.json(conv);
    } catch (err) {
      next(err);
    }
  },

  async updateConversation(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { id } = req.params;
      const { title, selectedModel, isPinned } = req.body;

      if (isConnected()) {
        const conv = await Conversation.findOneAndUpdate(
          { _id: id, userId },
          { ...(title && { title }), ...(selectedModel && { selectedModel }), ...(isPinned !== undefined && { isPinned }) },
          { new: true }
        );
        if (!conv) {
          return res.status(404).json({ message: 'Conversation not found or access denied.' });
        }
        return res.json(conv);
      }

      const userConvs = localConversations.get(userId.toString()) || [];
      const conv = userConvs.find((c) => c._id === id);
      if (conv) {
        if (title) conv.title = title;
        if (selectedModel) conv.selectedModel = selectedModel;
        conv.updatedAt = new Date().toISOString();
        return res.json(conv);
      }
      return res.status(404).json({ message: 'Conversation not found' });
    } catch (err) {
      next(err);
    }
  },

  async deleteConversation(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { id } = req.params;

      if (isConnected()) {
        const deleted = await Conversation.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
          return res.status(404).json({ message: 'Conversation not found or access denied.' });
        }
        // Also delete related messages
        await Message.deleteMany({ conversationId: id, userId });
        return res.json({ message: 'Conversation deleted successfully' });
      }

      const userConvs = localConversations.get(userId.toString()) || [];
      const filtered = userConvs.filter((c) => c._id !== id);
      localConversations.set(userId.toString(), filtered);
      return res.json({ message: 'Conversation deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = conversationController;

