const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', memoryController.getMemories);
router.post('/', memoryController.addMemory);
router.delete('/:id', memoryController.deleteMemory);

module.exports = router;

