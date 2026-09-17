import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { findUserById } from '../repositories/user.repository.js';

/**
 * Reusable Authentication Middleware.
 *
 * Reads JWT from HTTP-only cookie (primary) or Authorization Bearer header (client fallback).
 * Verifies JWT signature and expiry using JWT_SECRET.
 * Verifies user presence in PostgreSQL database.
 * Attaches authoritative user object to req.user.
 * Rejects unauthenticated requests with HTTP 401.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Primary: Extract token from HTTP-only cookie
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }

    // 2. Secondary/API client fallback: Extract from Authorization Bearer header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
        token = parts[1].trim();
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    // 3. Verify JWT token signature and expiration
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token payload.',
      });
    }

    // 4. Retrieve and validate user identity against PostgreSQL
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.',
      });
    }

    // 5. Attach authoritative identity to req.user
    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
}

export default {
  requireAuth,
};
