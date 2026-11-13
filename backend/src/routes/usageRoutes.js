const express = require('express');
const router = express.Router();
const usageController = require('../controllers/usageController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/my-stats', usageController.getMyStats);

module.exports = router;

