const User = require('../models/User');
const { isConnected } = require('../config/db');

const userController = {
  async updateProfile(req, res, next) {
    try {
      const { name, preferences } = req.body;
      const userId = req.user._id || req.user.id;

      if (isConnected()) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        if (name) user.name = name.trim();
        if (preferences) {
          user.preferences = { ...user.preferences, ...preferences };
        }

        await user.save();
        return res.json({ message: 'Profile updated', user: user.toJSON() });
      }

      // Memory dev fallback
      const updatedUser = {
        _id: userId,
        id: userId,
        email: req.user.email,
        name: name || req.user.name,
        role: req.user.role,
        preferences: { ...(req.user.preferences || {}), ...(preferences || {}) },
      };

      return res.json({ message: 'Profile updated', user: updatedUser });
    } catch (err) {
      next(err);
    }
  },

  async updatePreferences(req, res, next) {
    try {
      const preferences = req.body;
      const userId = req.user._id || req.user.id;

      if (isConnected()) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.preferences = { ...user.preferences, ...preferences };
        await user.save();
        return res.json({ message: 'Preferences updated', preferences: user.preferences });
      }

      return res.json({ message: 'Preferences updated', preferences });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
