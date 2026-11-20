const express = require('express');
const { apply, list, updateStatus, resumeUrl, rerank, statusHistory } = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(verifyToken);

router.get('/', list);
router.post('/', requireRole('candidate'), uploadResume, apply);
router.post('/rerank', requireRole('recruiter'), rerank);
router.get('/:id/resume-url', resumeUrl);
router.get('/:id/history', requireRole('recruiter'), statusHistory);
router.patch('/:id/status', requireRole('recruiter'), updateStatus);

module.exports = router;
