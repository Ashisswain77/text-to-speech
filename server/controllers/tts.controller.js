import { synthesize } from '../services/tts.service.js';

/**
 * TTS Controller
 * POST /api/tts
 *
 * Day 11: On success, returns the generated audio as raw binary (audio/mpeg).
 * On failure, returns JSON with the existing { success, message } contract.
 *
 * Thin controller — delegates business logic to tts.service.js
 * and forwards unexpected errors to the centralized error middleware.
 */
export const generateSpeech = async (req, res, next) => {
  try {
    const result = await synthesize(req.body);

    // On failure, return JSON error response (existing contract)
    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.message,
      });
    }

    // On success, stream the raw MP3 audio buffer (Day 11)
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
