const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const UsageLog = require('../models/UsageLog');
const { isConnected } = require('../config/db');
const mongoose = require('mongoose');

const adminController = {
  async getDashboardStats(req, res, next) {
    try {
      if (isConnected()) {
        const [totalUsers, totalConversations, totalMessages, logs] = await Promise.all([
          User.countDocuments(),
          Conversation.countDocuments(),
          Message.countDocuments(),
          UsageLog.find().sort({ createdAt: -1 }).limit(500),
        ]);

        const totalTokens = logs.reduce(
          (sum, l) => sum + (l.tokenUsage?.totalTokens || 0),
          0
        );

        const providerStats = {
          google: logs.filter((l) => l.provider === 'google').length,
          openai: logs.filter((l) => l.provider === 'openai').length,
          anthropic: logs.filter((l) => l.provider === 'anthropic').length,
        };

        return res.json({
          totalUsers,
          totalConversations,
          totalMessages,
          totalTokens,
          providerStats,
        });
      }

      // Memory fallback stats
      return res.json({
        totalUsers: 1,
        totalConversations: 0,
        totalMessages: 0,
        totalTokens: 0,
        providerStats: { google: 0, openai: 0, anthropic: 0 },
      });
    } catch (err) {
      next(err);
    }
  },

  async getUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (isConnected()) {
        const users = await User.find()
          .select('-passwordHash')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit);

        const total = await User.countDocuments();

        return res.json({ users, total, page, pages: Math.ceil(total / limit) });
      }

      return res.json({
        users: [
          {
            _id: 'admin_root_id',
            name: req.user.name || 'UMNY Administrator',
            email: req.user.email || 'admin@umny.ai',
            role: 'admin',
            createdAt: new Date().toISOString(),
          },
        ],
        total: 1,
        page: 1,
        pages: 1,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role value.' });
      }

      if (isConnected()) {
        const updated = await User.findByIdAndUpdate(
          userId,
          { role },
          { new: true }
        ).select('-passwordHash');

        if (!updated) {
          return res.status(404).json({ message: 'User not found.' });
        }

        return res.json({ message: 'Role updated', user: updated });
      }

      return res.json({ message: 'Role updated in session', role });
    } catch (err) {
      next(err);
    }
  },

  async getLogs(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;

      if (isConnected()) {
        const logs = await UsageLog.find().sort({ createdAt: -1 }).limit(limit);
        return res.json(logs);
      }

      return res.json([]);
    } catch (err) {
      next(err);
    }
  },

  getHealth(req, res) {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      database: states[dbState] || 'Operating',
      memoryUsage: process.memoryUsage(),
    });
  },
};

module.exports = adminController;

