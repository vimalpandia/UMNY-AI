const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../validators/authValidator');
const { authLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authLimiter, validateRegister, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

