const MIN_SECRET_LENGTH = 32;
const WEAK_SECRETS = new Set(['change-me', 'secret', 'changeme']);

// Fails fast on a missing or weak JWT secret (relaxed in tests via NODE_ENV=test).
function assertEnv() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  if (process.env.NODE_ENV === 'test') return;
  if (WEAK_SECRETS.has(secret) || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters and not a placeholder`);
  }
}

module.exports = { assertEnv };
