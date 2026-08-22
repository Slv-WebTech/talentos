const express = require('express');
const { create, update, list, getOne } = require('../controllers/jobController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/', list);
router.get('/:id', getOne);
router.post('/', requireRole('recruiter'), create);
router.put('/:id', requireRole('recruiter'), update);

module.exports = router;
