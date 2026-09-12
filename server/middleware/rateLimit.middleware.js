import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

/**
 * Rate Limiting Middleware
 *
 * Two tiers of protection:
 *   1. Global API limiter   — broad protection for all /api/* routes
 *   2. TTS-specific limiter — tight protection for POST /api/tts to prevent
 *      ElevenLabs quota drain and TTS abuse
 *
 * Limits are configurable via environment variables with secure defaults.
 * Returns consistent { success: false, message } JSON on limit exceeded.
 */

// ---------------------------------------------------------------------------
// 1. Global API Rate Limiter
//    Applies to all /api/* routes
// ---------------------------------------------------------------------------

export const globalApiLimiter = rateLimit({
  windowMs: config.rateLimit.global.windowMs,
  max: config.rateLimit.global.max,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,    // Disable `X-RateLimit-*` headers

  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },

  // Skip rate limiting in test environment to avoid flaky tests
  skip: () => config.isTest,
});

// ---------------------------------------------------------------------------
// 2. TTS-Specific Rate Limiter
//    Applies only to POST /api/tts — much tighter to protect paid API quota
// ---------------------------------------------------------------------------

export const ttsRateLimiter = rateLimit({
  windowMs: config.rateLimit.tts.windowMs,
  max: config.rateLimit.tts.max,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: 'TTS rate limit exceeded. Please wait before generating more speech.',
  },

  // Skip rate limiting in test environment
  skip: () => config.isTest,
});

export default { globalApiLimiter, ttsRateLimiter };
