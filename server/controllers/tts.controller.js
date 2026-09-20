import { synthesize } from '../services/tts.service.js';
import {
  createSpeech,
  deleteSpeechByIdAndUserId,
  updateSpeechAudioUrlByIdAndUserId,
} from '../repositories/speech.repository.js';
import {
  uploadSpeechAudio,
  deleteSpeechAudio,
} from '../services/storage.service.js';

/**
 * TTS Controller
 * POST /api/tts
 *
 * Pipeline:
 * 1. Authenticate (handled by requireAuth)
 * 2. Synthesize speech via tts.service.js ({ text, language, voice })
 * 3. On synthesis failure, return JSON error
 * 4. On synthesis success, persist initial record in PostgreSQL (speeches table)
 *    using authoritative req.user.id
 * 5. Upload synthesized audio buffer to private Supabase Storage
 *    (path: users/<userId>/speeches/<speechId>.mp3)
 *    On upload failure -> delete created DB record (rollback) and return 500 JSON
 * 6. Update DB record's audio_url with the storage object path
 *    On update failure -> delete uploaded storage object & delete created DB record and return 500 JSON
 * 7. On complete success, return raw audio/mpeg binary stream + X-Speech-Id header
 */
export const generateSpeech = async (req, res, next) => {
  try {
    // 1. Authoritative user ownership strictly from authenticated session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No user session identified.',
      });
    }

    // 2. Synthesize audio via service layer
    const result = await synthesize(req.body);

    // On synthesis failure, return provider/validation error
    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // 3. Persist initial speech metadata to PostgreSQL
    let speech;
    try {
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      const language = req.body.language ? String(req.body.language).trim() : 'en-US';
      const voice = req.body.voice ? String(req.body.voice).trim().toLowerCase() : 'sarah';

      speech = await createSpeech({
        userId,
        text,
        language,
        voice,
        audioUrl: null, // Initial record; will be updated with storage object path
        duration: null,
        isFavorite: false,
      });
    } catch (dbErr) {
      // Safe diagnostic logging without exposing credentials or internal details
      console.error('[TTS Controller] Failed to persist speech record:', dbErr.message);

      return res.status(500).json({
        success: false,
        message: 'Failed to record speech history.',
      });
    }

    // 4. Upload synthesized audio buffer to private Supabase Storage
    const uploadResult = await uploadSpeechAudio({
      userId,
      speechId: speech.id,
      audioBuffer: result.audioBuffer,
    });

    if (!uploadResult.success) {
      console.error('[TTS Controller] Storage upload failed:', uploadResult.error);

      // Rollback: delete newly created DB record
      try {
        await deleteSpeechByIdAndUserId(speech.id, userId);
      } catch (cleanupErr) {
        console.error('[TTS Controller] Failed to rollback speech record after upload failure:', cleanupErr.message);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to store generated audio.',
      });
    }

    // 5. Update DB record's audio_url with the deterministic storage object path
    try {
      const updatedSpeech = await updateSpeechAudioUrlByIdAndUserId(
        speech.id,
        userId,
        uploadResult.storagePath
      );

      if (!updatedSpeech) {
        throw new Error('Speech record not found or ownership mismatch during audio_url update');
      }
    } catch (updateErr) {
      console.error('[TTS Controller] Failed to update audio_url:', updateErr.message);

      // Rollback: delete uploaded storage object AND delete newly created DB record
      try {
        await deleteSpeechAudio({ storagePath: uploadResult.storagePath });
      } catch (storageCleanupErr) {
        console.error('[TTS Controller] Failed to delete orphaned storage object:', storageCleanupErr.message);
      }

      try {
        await deleteSpeechByIdAndUserId(speech.id, userId);
      } catch (dbCleanupErr) {
        console.error('[TTS Controller] Failed to delete speech record during rollback:', dbCleanupErr.message);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to record speech audio reference.',
      });
    }

    // 6. Return raw audio/mpeg response with persisted speech ID header
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': result.audioBuffer.length,
      'Cache-Control': 'no-store',
      'X-Speech-Id': speech.id,
      'Access-Control-Expose-Headers': 'X-Speech-Id',
    });

    return res.status(200).send(result.audioBuffer);
  } catch (err) {
    next(err);
  }
};

export default { generateSpeech };
