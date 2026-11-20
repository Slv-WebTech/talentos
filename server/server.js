require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { assertEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const errorHandler = require('./middleware/errorHandler');
const { loginLimiter, registerLimiter, apiLimiter } = require('./middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', Number(process.env.TRUST_PROXY || 0));
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'server' });
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ error: { message: 'route not found' } });
});

app.use(errorHandler);

if (require.main === module) {
  assertEnv();
  app.listen(PORT, () => {
    console.log(`TalentOS server listening on port ${PORT}`);
  });
}

module.exports = app;
