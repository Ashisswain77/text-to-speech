import { Router } from 'express';
import { validateRequestBody } from '../middleware/validateRequest.middleware.js';
import { validateRegister, validateLogin } from '../middleware/validateAuth.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, sets HTTP-only cookie, and returns safe user data
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validateRequestBody,
  validateRegister,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user, sets HTTP-only cookie, and returns safe user data
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validateRequestBody,
  validateLogin,
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Private (Requires valid JWT session)
 */
router.get(
  '/me',
  requireAuth,
  authController.me
);

/**
 * @route   POST /api/auth/logout
 * @desc    Clear authentication cookie
 * @access  Public (Idempotent)
 */
router.post(
  '/logout',
  authController.logout
);

export default router;
