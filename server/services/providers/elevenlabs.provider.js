import { config } from '../../config/env.js';

/**
 * ElevenLabs TTS Provider Adapter
 *
 * Encapsulates all ElevenLabs-specific communication, voice mapping,
 * parameter translation, and error handling.
 *
 * Keeps SpeechEngine and the frontend strictly provider-independent.
 * Never exposes the API key or raw ElevenLabs voice IDs to the client.
 */

// ---------------------------------------------------------------------------
// SpeechEngine Voice ID -> ElevenLabs Voice ID Mapping
// (Internal provider mapping only - never exposed outside this adapter)
// ---------------------------------------------------------------------------
export const ELEVENLABS_VOICE_MAP = Object.freeze({
  // English (US)
  sarah: 'EXAVITQu4vr4xnSDxMaL',   // Bella / Sarah conversational
  david: 'pNInz6obpgDQGcFmaJgB',   // Adam studio authoritative
  sonia: '21m00Tcm4TlvDq8ikWAM',   // Rachel expressive
  marcus: 'TxGEqnHWrfWFTfGW9XjX',  // Josh warm & deep

  // Hindi (IN) - utilizing ElevenLabs multilingual v2
  priya: 'ThT5KcBeYPX3keUQqHPh',   // Dorothy clear & natural
  aarav: 'pNInz6obpgDQGcFmaJgB',   // Adam multilingual studio

  // Gujarati (IN)
  diya: 'MF3mGyEYCl7XYWbV9V6O',    // Elli natural
  karan: 'VR6AewLTigWG4xSOukaG',   // Arnold clear

  // Marathi (IN)
  ananya: 'LcfcDJNUP1GQjkzn1xUU',  // Emily expressive
  rohan: 'N2lVS1w4EtoT3dr4eOWO',   // Callum studio

  // Spanish (ES)
  elena: 'AZnzlk1XvdvUeBnXmlld',   // Domi conversational
  carlos: 'ErXwobaYiN019PkySvjV',  // Antoni studio

  // French (FR)
  chloe: 'XB0fDUnXU5powFXDhCwa',   // Charlotte warm & soft
  lucas: 'yoZ06aMxZJJ28mfd3POQ',   // Sam narrative

  // German (DE)
  hannah: 'Xb7hH8MSUJpSbSDYk0k2',  // Alice crisp
  felix: 'bVMeCyTHy58xNoL34h3p',   // Jeremy professional
});

// Default fallback voice ID (Sarah - verified usable core voice on Free tier)
export const DEFAULT_ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// Base API endpoint
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

/**
 * Resolves an internal ElevenLabs voice ID from a SpeechEngine voice identifier.
 * @param {string} voiceKey - SpeechEngine voice key (e.g. 'sarah')
 * @returns {string} ElevenLabs voice ID
 */
export function resolveProviderVoiceId(voiceKey) {
  if (!voiceKey || typeof voiceKey !== 'string') {
    return DEFAULT_ELEVENLABS_VOICE_ID;
  }
  const normalizedKey = voiceKey.trim().toLowerCase();
  return ELEVENLABS_VOICE_MAP[normalizedKey] || DEFAULT_ELEVENLABS_VOICE_ID;
}

/**
 * Maps SpeechEngine speed into ElevenLabs voice_settings speed.
 * Normalizes and clamps speed between 0.5 and 2.0.
 * @param {number|undefined} speed - SpeechEngine speed setting
 * @returns {number} ElevenLabs speed value
 */
export function mapProviderSpeed(speed) {
  if (typeof speed !== 'number' || Number.isNaN(speed)) {
    return 1.0;
  }
  return Math.max(0.5, Math.min(2.0, speed));
}

/**
 * ElevenLabs Provider Adapter Class
 */
export class ElevenLabsProvider {
  /**
   * Synthesizes speech using the official ElevenLabs REST API.
   *
   * @param {object} normalized - Validated & normalized SpeechEngine request:
   *   { text, language, voice, speed, pitch, volume }
   * @param {object} [options={}] - Optional injection for testing (fetchFn, apiKey, modelId)
   * @returns {Promise<{
   *   success: boolean,
   *   statusCode: number,
   *   message: string,
   *   data?: object,
   *   audioBuffer?: Buffer
   * }>}
   */
  async synthesize(normalized, options = {}) {
    const apiKey = options.apiKey !== undefined ? options.apiKey : config.elevenlabs.apiKey;
    const modelId = options.modelId || config.elevenlabs.modelId || 'eleven_multilingual_v2';
    const fetchFn = options.fetchFn || globalThis.fetch;

    // 1. Guard against missing or empty API key
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        success: false,
        statusCode: 500,
        message: 'ElevenLabs API key is not configured. Please set ELEVENLABS_API_KEY in server/.env.',
      };
    }

    // 2. Map SpeechEngine parameters to ElevenLabs parameters
    const providerVoiceId = resolveProviderVoiceId(normalized.voice);
    const providerSpeed = mapProviderSpeed(normalized.speed);

    // 3. Construct API request payload
    const endpoint = `${ELEVENLABS_API_URL}/text-to-speech/${providerVoiceId}?output_format=mp3_44100_128`;
    const requestBody = {
      text: normalized.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        speed: providerSpeed,
      },
    };

    // 4. Execute HTTP request to ElevenLabs API
    let response;
    try {
      response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      return {
        success: false,
        statusCode: 503,
        message: `Failed to reach ElevenLabs API: ${err.message || 'Network error'}`,
      };
    }

    // 5. Handle HTTP error responses from provider
    if (!response.ok) {
      let providerErrorDetail = '';
      try {
        const errorJson = await response.json();
        if (typeof errorJson?.detail === 'string') {
          providerErrorDetail = errorJson.detail;
        } else if (errorJson?.detail?.message) {
          providerErrorDetail = errorJson.detail.message;
        } else if (errorJson?.message) {
          providerErrorDetail = errorJson.message;
        }
      } catch {
        providerErrorDetail = response.statusText || 'Unknown provider error';
      }

      // Map specific HTTP statuses safely without leaking credentials
      if (response.status === 401) {
        return {
          success: false,
          statusCode: 502,
          message: 'ElevenLabs authentication failed: Invalid API key.',
        };
      }

      if (response.status === 402) {
        return {
          success: false,
          statusCode: 402,
          message: providerErrorDetail || 'ElevenLabs subscription plan required: Free accounts cannot use library voices via the API.',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          statusCode: 429,
          message: 'ElevenLabs rate limit or quota exceeded.',
        };
      }

      if (response.status === 400) {
        return {
          success: false,
          statusCode: 400,
          message: providerErrorDetail || 'Invalid request sent to ElevenLabs.',
        };
      }

      return {
        success: false,
        statusCode: 502,
        message: `ElevenLabs provider error (${response.status}): ${providerErrorDetail}`,
      };
    }

    // 6. Parse audio data from response
    try {
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      return {
        success: true,
        statusCode: 200,
        message: 'Speech synthesized successfully via ElevenLabs.',
        data: {
          provider: 'elevenlabs',
          modelId,
          format: 'mp3',
          characterCount: normalized.text.length,
          audioSizeBytes: audioBuffer.length,
        },
        audioBuffer,
      };
    } catch (err) {
      return {
        success: false,
        statusCode: 502,
        message: `Failed to process audio response from ElevenLabs: ${err.message}`,
      };
    }
  }
}

export const elevenlabsProvider = new ElevenLabsProvider();
export default elevenlabsProvider;
