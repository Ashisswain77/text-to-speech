import { Router } from 'express';
import { generateSpeech } from '../controllers/tts.controller.js';
import { ttsRateLimiter } from '../middleware/rateLimit.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateRequestBody } from '../middleware/validateRequest.middleware.js';

const router = Router();

// POST /api/tts
// Pipeline: TTS rate limit → authentication check → validate request body → controller
router.post('/', ttsRateLimiter, requireAuth, validateRequestBody, generateSpeech);

export default router;
