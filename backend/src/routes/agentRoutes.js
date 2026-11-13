const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/tools', agentController.getTools);
router.get('/config', agentController.getConfiguration);
router.put('/config', agentController.updateConfiguration);

module.exports = router;
