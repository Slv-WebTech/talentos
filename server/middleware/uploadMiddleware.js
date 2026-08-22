const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('resume must be a PDF, DOC, or DOCX file'));
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: { message: 'resume file must be 5MB or smaller' } });
    }
    if (err) {
      return res.status(400).json({ error: { message: err.message } });
    }
    next();
  });
}

module.exports = { uploadResume };
