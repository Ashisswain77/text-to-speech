import { getUserHistory, deleteUserSpeech, setUserSpeechFavorite } from '../services/history.service.js';
import { getSpeechAudioReferenceByIdAndUserId } from '../repositories/speech.repository.js';
import { downloadSpeechAudio } from '../services/storage.service.js';

/**
 * History Controller
 * GET /api/history
 *
 * Returns the authenticated user's speech history.
 * User identity comes exclusively from the authenticated JWT (req.user.id).
 * Never trusts client-provided user ID parameters.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getHistory = async (req, res, next) => {
  try {
    // Authoritative user identity strictly from authenticated session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    const result = await getUserHistory(userId);

    return res.status(200).json(result);
  } catch (err) {
    // Controlled error: do not expose SQL, credentials, or stack traces
    console.error('[History Controller] Failed to fetch speech history:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch speech history.',
    });
  }
};

/**
 * History Controller
 * DELETE /api/history/:id
 *
 * Permanently deletes a speech record owned by the authenticated user.
 * User identity comes exclusively from the authenticated JWT (req.user.id).
 * Never trusts client-provided user ID parameters.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const deleteSpeech = async (req, res, next) => {
  try {
    // Authoritative user identity strictly from authenticated session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    const speechId = req.params.id;
    if (!speechId) {
      return res.status(400).json({
        success: false,
        message: 'Speech ID is required.',
      });
    }

    const result = await deleteUserSpeech(speechId, userId);

    if (!result.success) {
      return res.status(result.statusCode || 404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    // Controlled error: do not expose SQL, credentials, or stack traces
    console.error('[History Controller] Failed to delete speech:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete speech.',
    });
  }
};

/**
 * History Controller
 * POST /api/history/:id/favorite
 *
 * Marks the authenticated user's speech as favorite.
 * User identity comes exclusively from req.user.id.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const favoriteSpeech = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    const speechId = req.params.id;
    if (!speechId) {
      return res.status(400).json({
        success: false,
        message: 'Speech ID is required.',
      });
    }

    const result = await setUserSpeechFavorite(speechId, userId, true);

    if (!result.success) {
      return res.status(result.statusCode || 404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('[History Controller] Failed to favorite speech:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update favorite status.',
    });
  }
};

/**
 * History Controller
 * DELETE /api/history/:id/favorite
 *
 * Removes the authenticated user's speech from favorites.
 * User identity comes exclusively from req.user.id.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const unfavoriteSpeech = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    const speechId = req.params.id;
    if (!speechId) {
      return res.status(400).json({
        success: false,
        message: 'Speech ID is required.',
      });
    }

    const result = await setUserSpeechFavorite(speechId, userId, false);

    if (!result.success) {
      return res.status(result.statusCode || 404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('[History Controller] Failed to unfavorite speech:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update favorite status.',
    });
  }
};

/**
 * History Controller
 * GET /api/history/:id/audio
 *
 * Streams raw MP3 binary audio for a speech record owned by the authenticated user.
 * Ownership is enforced using req.user.id.
 * Storage path is retrieved strictly from the owned database record.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const getSpeechAudio = async (req, res, next) => {
  try {
    // 1. Authoritative user identity strictly from authenticated session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    const speechId = req.params.id;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!speechId || !UUID_REGEX.test(speechId)) {
      return res.status(404).json({
        success: false,
        message: 'Speech not found',
      });
    }

    // 2. Locate speech audio reference scoped to authenticated user
    const speechRef = await getSpeechAudioReferenceByIdAndUserId(speechId, userId);
    if (!speechRef) {
      return res.status(404).json({
        success: false,
        message: 'Speech not found',
      });
    }

    // 3. Check if audio_url exists
    if (!speechRef.audioUrl) {
      return res.status(404).json({
        success: false,
        message: 'Audio not available for this speech.',
      });
    }

    // 4. Retrieve audio binary directly from private Supabase Storage
    const downloadResult = await downloadSpeechAudio({
      storagePath: speechRef.audioUrl,
    });

    if (!downloadResult.success) {
      if (downloadResult.isNotFound) {
        return res.status(404).json({
          success: false,
          message: 'Audio not available for this speech.',
        });
      }

      console.error('[History Controller] Failed to download speech audio from storage:', downloadResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve audio.',
      });
    }

    // 5. Return raw audio/mpeg binary response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': downloadResult.audioBuffer.length,
      'Cache-Control': 'private, no-store',
    });

    return res.status(200).send(downloadResult.audioBuffer);
  } catch (err) {
    next(err);
  }
};

export default {
  getHistory,
  deleteSpeech,
  favoriteSpeech,
  unfavoriteSpeech,
  getSpeechAudio,
};
