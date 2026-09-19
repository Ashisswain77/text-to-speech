import { synthesize } from '../services/tts.service.js';
import { createSpeech } from '../repositories/speech.repository.js';

/**
 * TTS Controller
 * POST /api/tts
 *
 * Pipeline:
 * 1. Authenticate (handled by requireAuth)
 * 2. Synthesize speech via tts.service.js ({ text, language, voice })
 * 3. On synthesis failure, return JSON error
 * 4. On synthesis success, persist record in PostgreSQL (speeches table)
 *    using authoritative req.user.id
 * 5. On persistence failure, return HTTP 500 JSON error (do NOT return audio)
 * 6. On complete success, return raw audio/mpeg binary stream
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

    // 3. Persist speech metadata to PostgreSQL before streaming audio
    try {
      const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      const language = req.body.language ? String(req.body.language).trim() : 'en-US';
      const voice = req.body.voice ? String(req.body.voice).trim().toLowerCase() : 'sarah';

      await createSpeech({
        userId,
        text,
        language,
        voice,
        audioUrl: null, // Audio binary is streamed; no permanent cloud storage exists yet
        duration: null, // Provider does not supply duration; no fabrication
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

    // 4. Return raw audio/mpeg response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': result.audioBuffer.length,
      'Cache-Control': 'no-store',
    });

    return res.status(200).send(result.audioBuffer);
  } catch (err) {
    next(err);
  }
};

export default { generateSpeech };
