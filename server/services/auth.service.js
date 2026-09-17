import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/token.js';
import {
  createUser,
  findUserByEmail,
  findUserById,
  formatSafeUser,
} from '../repositories/user.repository.js';

/**
 * Register a new user.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ success: boolean, statusCode?: number, message?: string, user?: object, token?: string }>}
 */
export async function register({ name, email, password }) {
  // Check if account already exists with normalized email
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return {
      success: false,
      statusCode: 409,
      message: 'An account with this email already exists.',
    };
  }

  // Hash password with bcryptjs
  const passwordHash = await hashPassword(password);

  try {
    const user = await createUser({
      name,
      email,
      passwordHash,
    });

    const token = generateToken({ id: user.id });

    return {
      success: true,
      statusCode: 201,
      user,
      token,
    };
  } catch (err) {
    // Handle concurrent duplicate insertion gracefully (Postgres unique constraint violation)
    if (err.code === '23505') {
      return {
        success: false,
        statusCode: 409,
        message: 'An account with this email already exists.',
      };
    }
    throw err;
  }
}

/**
 * Authenticate user with email and password.
 * Uses generic failure response to prevent account enumeration.
 *
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.password
 * @returns {Promise<{ success: boolean, statusCode?: number, message?: string, user?: object, token?: string }>}
 */
export async function login({ email, password }) {
  const userRecord = await findUserByEmail(email);

  if (!userRecord) {
    return {
      success: false,
      statusCode: 401,
      message: 'Invalid email or password.',
    };
  }

  const isPasswordValid = await comparePassword(password, userRecord.password_hash);
  if (!isPasswordValid) {
    return {
      success: false,
      statusCode: 401,
      message: 'Invalid email or password.',
    };
  }

  const user = formatSafeUser(userRecord);
  const token = generateToken({ id: user.id });

  return {
    success: true,
    statusCode: 200,
    user,
    token,
  };
}

/**
 * Retrieve the current authenticated user's profile.
 *
 * @param {string} userId - User UUID
 * @returns {Promise<{ success: boolean, statusCode?: number, message?: string, user?: object }>}
 */
export async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    return {
      success: false,
      statusCode: 401,
      message: 'User not found or session has expired.',
    };
  }

  return {
    success: true,
    statusCode: 200,
    user,
  };
}

export default {
  register,
  login,
  getCurrentUser,
};
