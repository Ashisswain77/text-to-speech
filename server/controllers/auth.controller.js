import { setAuthCookie, clearAuthCookie } from '../utils/token.js';
import * as authService from '../services/auth.service.js';

/**
 * Handles user registration.
 * POST /api/auth/register
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);

    if (!result.success) {
      return res.status(result.statusCode || 400).json({
        success: false,
        message: result.message,
      });
    }

    // Set HTTP-only JWT authentication cookie
    setAuthCookie(res, result.token);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result.user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Handles user authentication.
 * POST /api/auth/login
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    if (!result.success) {
      return res.status(result.statusCode || 401).json({
        success: false,
        message: result.message,
      });
    }

    // Set HTTP-only JWT authentication cookie
    setAuthCookie(res, result.token);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      data: result.user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns current authenticated user information.
 * GET /api/auth/me
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function me(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Clears authentication session cookie.
 * POST /api/auth/logout
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function logout(req, res, next) {
  try {
    clearAuthCookie(res);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  login,
  me,
  logout,
};
