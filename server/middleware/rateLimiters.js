const rateLimit = require('express-rate-limit');

const message = { error: { message: 'too many requests, please try again later' } };

const loginLimiter = rateLimit({
  // only failed attempts count, so legitimate users behind one NAT don't lock each other out
  skipSuccessfulRequests: true,
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: Number(process.env.REGISTER_RATE_LIMIT || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

module.exports = { loginLimiter, registerLimiter, apiLimiter };
