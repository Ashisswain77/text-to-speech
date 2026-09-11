import { Router } from 'express';
import { getVoices } from '../controllers/voices.controller.js';

const router = Router();

// GET /api/voices
router.get('/', getVoices);

export default router;
