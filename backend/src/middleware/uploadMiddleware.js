const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FILE_LIMITS } = require('../config/constants');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safeExt = path.extname(file.originalname).toLowerCase();
    cb(null, `umny-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (FILE_LIMITS.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Allowed types: PDF, TXT, DOCX, CSV, PNG, JPEG, WEBP.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.MAX_FILE_SIZE_BYTES, // 15MB
  },
  fileFilter,
});

module.exports = upload;
