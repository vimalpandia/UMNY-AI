const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/status', authMiddleware, voiceController.getVoiceStatus);

module.exports = router;
