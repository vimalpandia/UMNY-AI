const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parser');
const FileRecord = require('../../models/FileRecord');
const { isConnected } = require('../../config/db');

class FileService {
  /**
   * Safely parse text from uploaded file buffer based on MIME type
   */
  async extractText(filePath, mimeType) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found on server disk.');
      }

      // PDF document
      if (mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text ? data.text.trim().slice(0, 50000) : '';
      }

      // Word DOCX
      if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value ? result.value.trim().slice(0, 50000) : '';
      }

      // CSV file
      if (mimeType === 'text/csv') {
        return new Promise((resolve, reject) => {
          const rows = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
              if (rows.length < 150) rows.push(row);
            })
            .on('end', () => {
              const textSummary = `[CSV Tabular Dataset Sample - ${rows.length} rows loaded]:\n` +
                JSON.stringify(rows, null, 2);
              resolve(textSummary);
            })
            .on('error', (err) => reject(err));
        });
      }

      // Plain text
      if (mimeType === 'text/plain') {
        const text = fs.readFileSync(filePath, 'utf-8');
        return text.trim().slice(0, 50000);
      }

      // Image
      if (mimeType.startsWith('image/')) {
        return `[Attached Image: ${path.basename(filePath)} (${mimeType}) - multimodal visual asset ready for query.]`;
      }

      return '';
    } catch (err) {
      console.error('[FileService Extraction Error]:', err.message);
      return `[Text extraction note: ${err.message}]`;
    }
  }

  async saveFileRecord(userId, { originalName, storageKey, mimeType, size, extractedText, conversationId }) {
    if (isConnected()) {
      return await FileRecord.create({
        userId,
        conversationId,
        originalName,
        storageKey,
        mimeType,
        size,
        extractedText,
      });
    }

    // Dev/fallback record
    return {
      _id: 'file_' + Date.now(),
      userId,
      originalName,
      storageKey,
      mimeType,
      size,
      extractedText,
      createdAt: new Date().toISOString(),
    };
  }

  async getFilesByUser(userId) {
    if (isConnected()) {
      return await FileRecord.find({ userId }).sort({ createdAt: -1 });
    }
    return [];
  }

  async deleteFile(userId, fileId) {
    if (isConnected()) {
      const record = await FileRecord.findOne({ _id: fileId, userId });
      if (record) {
        const fullPath = path.join(__dirname, '../../../uploads', record.storageKey);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
        await FileRecord.findByIdAndDelete(fileId);
        return true;
      }
    }
    return false;
  }
}

module.exports = new FileService();

