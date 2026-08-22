const express = require('express');
const { register, login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, (req, res) => {
  res.json({ data: { id: req.user.id, role: req.user.role } });
});

module.exports = router;
