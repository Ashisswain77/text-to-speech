import { getVoices as fetchVoices } from '../services/tts.service.js';

/**
 * Voices Controller
 * GET /api/voices
 *
 * Thin controller — delegates voice discovery and normalization to the
 * TTS service layer, keeping provider credentials and internal voice IDs private.
 */
export const getVoices = async (req, res, next) => {
  try {
    const result = await fetchVoices();

    const responsePayload = {
      success: result.success,
      data: result.data || null,
    };

    if (result.message) {
      responsePayload.message = result.message;
    }

    return res.status(result.statusCode).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

export default { getVoices };
