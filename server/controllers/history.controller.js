import { getUserHistory, deleteUserSpeech } from '../services/history.service.js';

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

export default { getHistory, deleteSpeech };
