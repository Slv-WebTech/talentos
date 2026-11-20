// Creates (or promotes) an admin account. Usage:
//   ADMIN_EMAIL=you@company.com ADMIN_PASSWORD='at-least-12-chars' [ADMIN_NAME='Name'] npm run create-admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || 'Admin').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL is missing or invalid');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');

  const hash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET role = 'admin', password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [name, email, hash]
  );
  console.log(`admin ready: user id ${result.rows[0].id}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
