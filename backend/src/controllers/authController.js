const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { isConnected } = require('../config/db');

// In-memory fallback user cache for local development/testing if database is temporarily connecting
const localUsers = new Map();

const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      if (isConnected()) {
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'user',
          preferences: {
            theme: 'dark',
            defaultModel: 'gemini-2.5-flash',
            memoryEnabled: true,
            temperature: 0.7,
          },
        });

        const token = generateToken({
          userId: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          name: newUser.name,
        });

        return res.status(201).json({
          message: 'Account created successfully',
          token,
          user: newUser.toJSON(),
        });
      } else {
        // In-memory mode
        if (localUsers.has(normalizedEmail)) {
          return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const mockId = 'usr_' + Date.now();

        const userObj = {
          _id: mockId,
          id: mockId,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: normalizedEmail.includes('admin') ? 'admin' : 'user',
          preferences: {
            theme: 'dark',
            defaultModel: 'gemini-2.5-flash',
            memoryEnabled: true,
            temperature: 0.7,
          },
          createdAt: new Date().toISOString(),
        };

        localUsers.set(normalizedEmail, userObj);

        const token = generateToken({
          userId: userObj._id,
          email: userObj.email,
          role: userObj.role,
          name: userObj.name,
        });

        const safeUser = { ...userObj };
        delete safeUser.passwordHash;

        return res.status(201).json({
          message: 'Account created successfully',
          token,
          user: safeUser,
        });
      }
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      if (isConnected()) {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          name: user.name,
        });

        return res.json({
          message: 'Signed in successfully',
          token,
          user: user.toJSON(),
        });
      } else {
        // Fallback for demo/dev admin or cached memory user
        if (normalizedEmail === 'admin@umny.ai' && password === 'Admin@123456') {
          const token = generateToken({
            userId: 'admin_root_id',
            email: 'admin@umny.ai',
            role: 'admin',
            name: 'UMNY Administrator',
          });

          return res.json({
            message: 'Signed in successfully',
            token,
            user: {
              _id: 'admin_root_id',
              id: 'admin_root_id',
              email: 'admin@umny.ai',
              name: 'UMNY Administrator',
              role: 'admin',
              preferences: {
                theme: 'dark',
                defaultModel: 'gemini-2.5-flash',
                memoryEnabled: true,
                temperature: 0.7,
              },
            },
          });
        }

        const userObj = localUsers.get(normalizedEmail);
        if (!userObj) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const isMatch = await bcrypt.compare(password, userObj.passwordHash);
        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = generateToken({
          userId: userObj._id,
          email: userObj.email,
          role: userObj.role,
          name: userObj.name,
        });

        const safeUser = { ...userObj };
        delete safeUser.passwordHash;

        return res.json({
          message: 'Signed in successfully',
          token,
          user: safeUser,
        });
      }
    } catch (err) {
      next(err);
    }
  },

  async getMe(req, res, next) {
    try {
      if (isConnected()) {
        const user = await User.findById(req.user._id || req.user.id);
        if (user) {
          return res.json({ user: user.toJSON() });
        }
      }

      return res.json({
        user: {
          _id: req.user._id || req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          preferences: req.user.preferences || {
            theme: 'dark',
            defaultModel: 'gemini-2.5-flash',
            memoryEnabled: true,
            temperature: 0.7,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
