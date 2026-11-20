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

const SIGNATURES = {
  '.pdf': [Buffer.from('%PDF')],
  '.docx': [Buffer.from([0x50, 0x4b, 0x03, 0x04])],
  '.doc': [Buffer.from([0xd0, 0xcf, 0x11, 0xe0])],
};

// Extension alone is spoofable; confirm the file's leading bytes match its claimed type.
function hasValidSignature(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  return SIGNATURES[ext].some((sig) => file.buffer.subarray(0, sig.length).equals(sig));
}

function uploadResume(req, res, next) {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: { message: 'resume file must be 5MB or smaller' } });
    }
    if (err) {
      return res.status(400).json({ error: { message: err.message } });
    }
    if (req.file && req.file.size > 0 && !hasValidSignature(req.file)) {
      return res.status(400).json({ error: { message: 'file content does not match its extension' } });
    }
    next();
  });
}

module.exports = { uploadResume, hasValidSignature };
