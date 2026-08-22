const express = require('express');
const { apply, list } = require('../controllers/applicationController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');

const router = express.Router();
router.use(verifyToken);

router.get('/', list);
router.post('/', requireRole('candidate'), uploadResume, apply);

module.exports = router;
