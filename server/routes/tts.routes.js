import { Router } from 'express';
import { generateSpeech } from '../controllers/tts.controller.js';

const router = Router();

// POST /api/tts
router.post('/', generateSpeech);

export default router;
