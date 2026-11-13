const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/chat/stream', authMiddleware, aiLimiter, aiController.streamChat);

module.exports = router;

