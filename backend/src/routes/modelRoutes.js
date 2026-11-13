const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.get('/', aiController.getAvailableModels);

module.exports = router;
