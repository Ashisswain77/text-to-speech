import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

/**
 * Hash a plaintext password with bcryptjs.
 *
 * @param {string} password - Raw password string
 * @returns {Promise<string>} Salted bcrypt hash
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a stored bcrypt hash.
 *
 * @param {string} password - Plaintext password candidate
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function comparePassword(password, hash) {
  if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export default {
  hashPassword,
  comparePassword,
};
