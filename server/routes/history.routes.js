import { Router } from 'express';
import { getHistory, deleteSpeech } from '../controllers/history.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/history
 * @desc    Retrieve authenticated user's speech history (newest first)
 * @access  Private (Requires valid JWT session)
 */
router.get('/', requireAuth, getHistory);

/**
 * @route   DELETE /api/history/:id
 * @desc    Permanently delete a speech record owned by the authenticated user
 * @access  Private (Requires valid JWT session)
 */
router.delete('/:id', requireAuth, deleteSpeech);

export default router;
