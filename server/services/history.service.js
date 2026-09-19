import { findSpeechesByUserId, deleteSpeechByIdAndUserId } from '../repositories/speech.repository.js';

/**
 * History Service
 *
 * Retrieves speech history for a specific authenticated user.
 * Enforces ownership by accepting only the server-verified user ID.
 *
 * @param {string} userId - Authoritative authenticated user UUID from req.user.id
 * @returns {Promise<object>} Service result with items array
 */
export async function getUserHistory(userId) {
  const items = await findSpeechesByUserId(userId);

  // Strip internal userId from each item before returning to the client
  const sanitized = items.map(({ userId: _uid, ...rest }) => rest);

  return {
    success: true,
    data: {
      items: sanitized,
    },
  };
}

/**
 * Delete a specific speech record owned by the authenticated user.
 *
 * @param {string} speechId - Speech UUID to delete
 * @param {string} userId - Authoritative authenticated user UUID from req.user.id
 * @returns {Promise<object>} Service result indicating success or not found
 */
export async function deleteUserSpeech(speechId, userId) {
  const deleted = await deleteSpeechByIdAndUserId(speechId, userId);

  if (!deleted) {
    return {
      success: false,
      statusCode: 404,
      message: 'Speech not found',
    };
  }

  return {
    success: true,
    message: 'Speech deleted successfully',
  };
}

export default { getUserHistory, deleteUserSpeech };
