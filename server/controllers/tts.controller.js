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

    const responsePayload = {
      success: result.success,
      message: result.message,
    };

    if (result.data) {
      responsePayload.data = result.data;
    }

    return res.status(result.statusCode).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

export default { generateSpeech };
