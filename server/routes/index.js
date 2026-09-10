import { Router } from 'express';
import healthRoutes from './health.routes.js';
import ttsRoutes from './tts.routes.js';

const router = Router();

// Mount feature routes
router.use('/health', healthRoutes);
router.use('/tts', ttsRoutes);

export default router;
