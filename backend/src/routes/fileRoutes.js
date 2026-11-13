const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(authMiddleware);

router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/', fileController.getMyFiles);
router.delete('/:id', fileController.deleteFile);

module.exports = router;

