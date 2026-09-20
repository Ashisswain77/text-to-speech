import { Router } from 'express';
import {
  getHistory,
  deleteSpeech,
  favoriteSpeech,
  unfavoriteSpeech,
} from '../controllers/history.controller.js';
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

/**
 * @route   POST /api/history/:id/favorite
 * @desc    Mark the authenticated user's speech record as favorite
 * @access  Private (Requires valid JWT session)
 */
router.post('/:id/favorite', requireAuth, favoriteSpeech);

/**
 * @route   DELETE /api/history/:id/favorite
 * @desc    Remove the authenticated user's speech record from favorites
 * @access  Private (Requires valid JWT session)
 */
router.delete('/:id/favorite', requireAuth, unfavoriteSpeech);

export default router;
