import { Router } from 'express';
import healthRoutes from './health.routes.js';
import ttsRoutes from './tts.routes.js';
import voicesRoutes from './voices.routes.js';

const router = Router();

// Mount feature routes
router.use('/health', healthRoutes);
router.use('/tts', ttsRoutes);
router.use('/voices', voicesRoutes);

export default router;
