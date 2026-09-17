import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const COOKIE_NAME = 'token';
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Sign a JWT token containing minimal authoritative identity information.
 *
 * @param {object} payload - Identity payload (contains only user id)
 * @param {string} payload.id - User UUID
 * @returns {string} Signed JWT string
 */
export function generateToken(payload) {
  if (!payload || !payload.id) {
    throw new Error('Token payload must contain user id');
  }

  // Only store minimum required identity: id
  const minimalPayload = { id: payload.id };

  return jwt.sign(minimalPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Synchronously or asynchronously verify a JWT token.
 *
 * @param {string} token - Raw JWT string
 * @returns {object} Decoded token payload
 */
export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('No token provided');
  }
  return jwt.verify(token, config.jwtSecret);
}

/**
 * Standard HTTP-only cookie configuration.
 *
 * - httpOnly: true (prevents client-side JS access)
 * - secure: true in production (requires HTTPS)
 * - sameSite: 'strict' in production / 'lax' in development
 * - maxAge: 7 days
 * - path: '/'
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  };
}

/**
 * Attach the JWT authentication cookie to an HTTP response.
 *
 * @param {import('express').Response} res
 * @param {string} token
 */
export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
}

/**
 * Clear the authentication cookie from an HTTP response.
 *
 * @param {import('express').Response} res
 */
export function clearAuthCookie(res) {
  const options = getCookieOptions();
  delete options.maxAge; // clearCookie uses expires in the past
  res.clearCookie(COOKIE_NAME, options);
}

export default {
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  COOKIE_NAME,
  COOKIE_MAX_AGE,
};
