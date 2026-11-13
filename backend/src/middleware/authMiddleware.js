const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid or expired session token.' });
    }

    // Attempt to fetch fresh user from database
    try {
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (dbErr) {
      // Fallback if db is in memory/dev
    }

    // Attach decoded user info if user found in token payload
    req.user = {
      _id: decoded.userId,
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name || 'User',
      role: decoded.role || 'user',
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Authentication failure.' });
  }
}

module.exports = authMiddleware;

