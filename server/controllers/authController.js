const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userModel');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PUBLIC_ROLES = ['recruiter', 'candidate'];

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: { message: 'name, email, password, and role are required' } });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: { message: 'invalid email format' } });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: { message: 'password must be at least 8 characters' } });
    }
    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({ error: { message: `role must be one of: ${PUBLIC_ROLES.join(', ')}` } });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: { message: 'an account with this email already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, passwordHash, role });
    const token = signToken(user);

    res.status(201).json({ data: { token, user } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'email and password are required' } });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: { message: 'invalid email or password' } });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: { message: 'invalid email or password' } });
    }

    const token = signToken(user);
    const { password_hash, ...safeUser } = user;

    res.json({ data: { token, user: safeUser } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
