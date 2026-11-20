const MAX_INT32 = 2147483647;

// Returns a positive integer id that fits a Postgres INTEGER column, or null.
function parseId(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !/^\d{1,10}$/.test(value)) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= MAX_INT32 ? n : null;
}

module.exports = { parseId, MAX_INT32 };
