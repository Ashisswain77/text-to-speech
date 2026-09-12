import { Router } from 'express';
import { generateSpeech } from '../controllers/tts.controller.js';
import { ttsRateLimiter } from '../middleware/rateLimit.middleware.js';
import { validateRequestBody } from '../middleware/validateRequest.middleware.js';

const router = Router();

// POST /api/tts
// Pipeline: TTS rate limit → validate request body → controller
router.post('/', ttsRateLimiter, validateRequestBody, generateSpeech);

export default router;
