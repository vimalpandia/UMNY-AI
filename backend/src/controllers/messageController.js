const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { isConnected } = require('../config/db');

const messageController = {
  async getMessagesByConversation(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { conversationId } = req.params;

      if (isConnected()) {
        // Verify conversation belongs to user
        const conversation = await Conversation.findOne({ _id: conversationId, userId });
        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found or access denied.' });
        }

        const messages = await Message.find({ conversationId, userId }).sort({ createdAt: 1 });
        return res.json(messages);
      }

      return res.json([]);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = messageController;

