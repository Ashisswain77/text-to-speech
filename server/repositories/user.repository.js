import { query } from '../config/db.js';

/**
 * Maps database user record into a safe, client-facing format.
 * Strips password_hash and maps snake_case to camelCase.
 *
 * @param {object} row - Raw PostgreSQL row
 * @returns {object} Safe user object
 */
export function formatSafeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    tier: row.tier,
    charLimit: row.char_limit,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

/**
 * Insert a new user into the database.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email - normalized lowercase email
 * @param {string} params.passwordHash
 * @param {string} [params.tier='free']
 * @param {number} [params.charLimit=5000]
 * @returns {Promise<object>} Newly created safe user
 */
export async function createUser({ name, email, passwordHash, tier = 'free', charLimit = 5000 }) {
  const sql = `
    INSERT INTO users (name, email, password_hash, tier, char_limit)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, name, email, tier, char_limit, created_at, updated_at;
  `;
  const result = await query(sql, [name, email, passwordHash, tier, charLimit]);
  return formatSafeUser(result.rows[0]);
}

/**
 * Find user by email (case-insensitive).
 * Returns internal record including password_hash for authentication comparison.
 *
 * @param {string} email
 * @returns {Promise<object|null>} Internal user record with password_hash or null
 */
export async function findUserByEmail(email) {
  const sql = `
    SELECT id, name, email, password_hash, tier, char_limit, created_at, updated_at
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1;
  `;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

/**
 * Find user by UUID id.
 * Returns safe user without password_hash.
 *
 * @param {string} id - UUID
 * @returns {Promise<object|null>} Safe user object or null
 */
export async function findUserById(id) {
  const sql = `
    SELECT id, name, email, tier, char_limit, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await query(sql, [id]);
  return formatSafeUser(result.rows[0]);
}

export default {
  formatSafeUser,
  createUser,
  findUserByEmail,
  findUserById,
};
