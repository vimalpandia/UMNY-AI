const fileService = require('../services/files/FileService');
const path = require('path');

const fileController = {
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }

      const userId = req.user._id || req.user.id;
      const { conversationId } = req.body;
      const filePath = req.file.path;
      const mimeType = req.file.mimetype;

      // Extract text content from the file
      const extractedText = await fileService.extractText(filePath, mimeType);

      // Save file record
      const record = await fileService.saveFileRecord(userId, {
        originalName: req.file.originalname,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        extractedText,
        conversationId,
      });

      return res.status(201).json({
        _id: record._id,
        originalName: record.originalName,
        mimeType: record.mimeType,
        size: record.size,
        storageKey: record.storageKey,
        extractedText,
        message: 'File processed and analyzed successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  async getMyFiles(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const files = await fileService.getFilesByUser(userId);
      res.json(files);
    } catch (err) {
      next(err);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const userId = req.user._id || req.user.id;
      const { id } = req.params;
      const success = await fileService.deleteFile(userId, id);
      if (!success) {
        return res.status(404).json({ message: 'File not found or access denied.' });
      }
      res.json({ message: 'File deleted successfully.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = fileController;
