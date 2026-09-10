import { synthesize } from '../services/tts.service.js';

/**
 * TTS Controller
 * POST /api/tts
 *
 * Thin controller — delegates business logic to tts.service.js
 * and forwards unexpected errors to the centralized error middleware.
 */
export const generateSpeech = async (req, res, next) => {
  try {
    const result = await synthesize(req.body);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

export default { generateSpeech };
