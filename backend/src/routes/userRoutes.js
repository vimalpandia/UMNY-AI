const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.put('/profile', userController.updateProfile);
router.put('/preferences', userController.updatePreferences);

module.exports = router;

