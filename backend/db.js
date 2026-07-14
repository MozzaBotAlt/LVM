/**
 * Neon Postgres connection.
 *
 * Uses @neondatabase/serverless so it works in both traditional Node servers
 * (Render / Railway / a VPS) and serverless/edge environments.
 *
 * Requires a DATABASE_URL env var, e.g.
 *   DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
 *
 * Install once in your backend:
 *   npm install @neondatabase/serverless
 */

const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "[backend] DATABASE_URL is not set. Add your Neon connection string to the environment.",
  );
}

// `sql` is a tagged-template function. Values are automatically parameterized,
// which prevents SQL injection. Example:
//   const rows = await sql`SELECT * FROM paid_users WHERE email = ${email}`;
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
