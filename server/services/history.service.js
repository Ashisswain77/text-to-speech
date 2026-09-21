import {
  findSpeechesByUserId,
  deleteSpeechByIdAndUserId,
  updateSpeechFavoriteByIdAndUserId,
  getSpeechAudioReferenceByIdAndUserId,
} from '../repositories/speech.repository.js';
import { deleteSpeechAudio } from './storage.service.js';

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
 * Before removing the PostgreSQL row, this function deletes the corresponding
 * audio object from Supabase Storage (if an audio_url exists on the record).
 *
 * Partial-failure behaviour:
 *   - Storage deletion fails → DB row is preserved, 500 returned.
 *   - Storage deletion succeeds but DB deletion fails → audio is orphaned,
 *     500 returned with an explanatory message. No unsafe rollback attempted.
 *   - Storage object already missing → Supabase remove() is idempotent and
 *     returns success, so DB deletion proceeds normally.
 *
 * The storage path is always derived from the owned DB record (audio_url).
 * Client-supplied audio_url values are never trusted.
 *
 * @param {string} speechId - Speech UUID to delete
 * @param {string} userId - Authoritative authenticated user UUID from req.user.id
 * @returns {Promise<object>} Service result indicating success or failure
 */
export async function deleteUserSpeech(speechId, userId) {
  // 1. Retrieve the owned speech's audio reference (ownership-scoped lookup)
  const speechRef = await getSpeechAudioReferenceByIdAndUserId(speechId, userId);

  if (!speechRef) {
    return {
      success: false,
      statusCode: 404,
      message: 'Speech not found',
    };
  }

  // 2. If audio_url exists, delete the storage object first
  if (speechRef.audioUrl) {
    const storageResult = await deleteSpeechAudio({ storagePath: speechRef.audioUrl });

    if (!storageResult.success) {
      // Storage deletion failed — preserve the DB row so the audio reference is not lost
      console.error('[HistoryService] Storage deletion failed for speech %s: %s', speechId, storageResult.error);
      return {
        success: false,
        statusCode: 500,
        message: 'Failed to delete speech audio from storage.',
      };
    }
  }

  // 3. Delete the PostgreSQL record
  const deleted = await deleteSpeechByIdAndUserId(speechId, userId);

  if (!deleted) {
    // DB deletion failed after storage was already deleted (if audio existed).
    // This is a partial-failure edge case. The audio file may now be orphaned,
    // but we cannot safely re-upload it. Report the failure honestly.
    console.error('[HistoryService] DB deletion failed for speech %s after storage cleanup.', speechId);
    return {
      success: false,
      statusCode: 500,
      message: 'Speech audio was removed from storage, but the database record could not be deleted. Please contact support.',
    };
  }

  return {
    success: true,
    message: 'Speech deleted successfully',
  };
}

/**
 * Set the favorite status for a speech record owned by the authenticated user.
 *
 * @param {string} speechId - Speech UUID
 * @param {string} userId - Authoritative authenticated user UUID from req.user.id
 * @param {boolean} isFavorite - Target boolean favorite status
 * @returns {Promise<object>} Service result with response data or 404
 */
export async function setUserSpeechFavorite(speechId, userId, isFavorite) {
  const updated = await updateSpeechFavoriteByIdAndUserId(speechId, userId, isFavorite);

  if (!updated) {
    return {
      success: false,
      statusCode: 404,
      message: 'Speech not found',
    };
  }

  return {
    success: true,
    data: {
      id: updated.id,
      isFavorite: updated.isFavorite,
    },
  };
}

export default { getUserHistory, deleteUserSpeech, setUserSpeechFavorite };
