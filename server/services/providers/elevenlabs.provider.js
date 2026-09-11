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
  sarah: 'EXAVITQu4vr4xnSDxMaL',   // Sarah / Bella conversational
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

// Known display metadata for derived locales
export const LOCALE_METADATA = Object.freeze({
  'en-US': { name: 'English (US)', flag: '🇺🇸', native: 'English' },
  'en-GB': { name: 'English (UK)', flag: '🇬🇧', native: 'English' },
  'en-AU': { name: 'English (Australia)', flag: '🇦🇺', native: 'English' },
  'hi-IN': { name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
  'gu-IN': { name: 'Gujarati', flag: '🇮🇳', native: 'ગુજરાતી' },
  'mr-IN': { name: 'Marathi', flag: '🇮🇳', native: 'मराठी' },
  'es-ES': { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  'fr-FR': { name: 'French', flag: '🇫🇷', native: 'Français' },
  'de-DE': { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  'ja-JP': { name: 'Japanese', flag: '🇯🇵', native: '日本語' },
  'pt-BR': { name: 'Portuguese (Brazil)', flag: '🇧🇷', native: 'Português' },
  'it-IT': { name: 'Italian', flag: '🇮🇹', native: 'Italiano' },
  'nl-NL': { name: 'Dutch', flag: '🇳🇱', native: 'Nederlands' },
  'ar': { name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
  'cmn-CN': { name: 'Mandarin Chinese', flag: '🇨🇳', native: '中文' },
  'fil-PH': { name: 'Filipino', flag: '🇵🇭', native: 'Filipino' },
  'cs-CZ': { name: 'Czech', flag: '🇨🇿', native: 'Čeština' },
  'pl-PL': { name: 'Polish', flag: '🇵🇱', native: 'Polski' },
  'tr-TR': { name: 'Turkish', flag: '🇹🇷', native: 'Türkçe' },
  'sk-SK': { name: 'Slovak', flag: '🇸🇰', native: 'Slovenčina' },
  'sv-SE': { name: 'Swedish', flag: '🇸🇪', native: 'Svenska' },
  'ro-RO': { name: 'Romanian', flag: '🇷🇴', native: 'Română' },
});

// Verified usable premade voices available in ElevenLabs core catalog
export const ELEVENLABS_PREMADE_VOICES = Object.freeze({
  roger: 'CwhRBWXzGAHq8TQ4Fs17',
  sarah: 'EXAVITQu4vr4xnSDxMaL',
  laura: 'FGY2WhTYpPnrIDTdsKH5',
  charlie: 'IKne3meq5aSn9XLyUdCD',
  george: 'JBFqnCBsd6RMkjVDRZzb',
  callum: 'N2lVS1w4EtoT3dr4eOWO',
  river: 'SAz9YHcvj6GT2YYXdXww',
  harry: 'SOYHLrjzK2X1ezoPC6cr',
  liam: 'TX3LPaxmHKxFdv7VOQHJ',
  alice: 'Xb7hH8MSUJpSbSDYk0k2',
  matilda: 'XrExE9yKIg1WjnnlVkGX',
  will: 'bIHbv24MWmeRgasZH58o',
  jessica: 'cgSgspJ2msm6clMCkdW9',
  eric: 'cjVigY5qzO86Huf0OWal',
  bella: 'hpp4J3VqNfWAUOO0d1Us',
  chris: 'iP95p4xoKVk53GoZ742B',
  brian: 'nPczCjzI2devNBz1zQrb',
  daniel: 'onwK4e9ZLuTAKqWW03F9',
  lily: 'pFZP5JQG7iQjIQuC4Bku',
  adam: 'pNInz6obpgDQGcFmaJgB',
  bill: 'pqHfZKP75CvOlQylNhV4',
});

// Dynamic internal registry: normalized ID -> ElevenLabs provider voice ID
export const dynamicVoiceRegistry = new Map();

// 1. Seed registry with pre-known voice IDs
for (const [key, voiceId] of Object.entries(ELEVENLABS_VOICE_MAP)) {
  dynamicVoiceRegistry.set(key, voiceId);
}

// 2. Seed registry with all premade voices
for (const [key, voiceId] of Object.entries(ELEVENLABS_PREMADE_VOICES)) {
  dynamicVoiceRegistry.set(key, voiceId);
}

// 3. Seed default voice
dynamicVoiceRegistry.set('sarah', DEFAULT_ELEVENLABS_VOICE_ID);

/**
 * Normalizes a raw ElevenLabs voice object into the SpeechEngine frontend format.
 * Encapsulates and removes the provider's voice_id.
 *
 * @param {object} raw - Raw voice object from ElevenLabs API
 * @returns {object} Normalized voice: { id, name, language, gender, accent, style, description, supportedLanguages }
 */
export function normalizeElevenLabsVoice(raw) {
  const parts = (raw.name || '').split('-');
  const cleanName = parts[0].trim();
  const slugId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Determine primary language/locale
  let primaryLang = 'en-US';
  const langLabel = (raw.labels?.language || 'en').toLowerCase();
  const accentLabel = (raw.labels?.accent || '').toLowerCase();

  if (langLabel === 'en') {
    if (accentLabel.includes('british') || accentLabel.includes('uk')) {
      primaryLang = 'en-GB';
    } else if (accentLabel.includes('australian') || accentLabel.includes('au')) {
      primaryLang = 'en-AU';
    } else {
      primaryLang = 'en-US';
    }
  } else if (langLabel === 'fr') {
    primaryLang = 'fr-FR';
  } else if (langLabel === 'es') {
    primaryLang = 'es-ES';
  } else if (langLabel === 'de') {
    primaryLang = 'de-DE';
  } else if (langLabel === 'hi') {
    primaryLang = 'hi-IN';
  } else {
    primaryLang = langLabel;
  }

  // Determine gender
  let gender = 'Neutral';
  const rawGender = (raw.labels?.gender || '').toLowerCase();
  if (rawGender.includes('female')) gender = 'Female';
  else if (rawGender.includes('male')) gender = 'Male';

  // Determine accent
  let accent = 'Standard';
  if (raw.labels?.accent) {
    accent = raw.labels.accent.charAt(0).toUpperCase() + raw.labels.accent.slice(1).toLowerCase();
  }

  // Determine style
  let style = 'Conversational';
  const useCase = (raw.labels?.use_case || '').toLowerCase();
  const descriptive = (raw.labels?.descriptive || '').toLowerCase();
  if (useCase.includes('narrative')) style = 'Narrative';
  else if (useCase.includes('social')) style = 'Dynamic';
  else if (useCase.includes('educational') || useCase.includes('informative')) style = 'Educational';
  else if (useCase.includes('character') || useCase.includes('animation')) style = 'Character';
  else if (useCase.includes('entertainment')) style = 'Expressive';
  else if (descriptive.includes('classy') || descriptive.includes('professional')) style = 'Professional';
  else if (descriptive.includes('calm') || descriptive.includes('warm')) style = 'Warm';

  // Collect verified multilingual locales
  const supportedLanguagesSet = new Set([primaryLang]);
  if (Array.isArray(raw.verified_languages)) {
    for (const item of raw.verified_languages) {
      if (item.locale) supportedLanguagesSet.add(item.locale);
      else if (item.language) supportedLanguagesSet.add(item.language);
    }
  }

  // Register in dynamic internal registry so POST /api/tts resolves this slug
  if (raw.voice_id) {
    dynamicVoiceRegistry.set(slugId, raw.voice_id);
    dynamicVoiceRegistry.set(cleanName.toLowerCase(), raw.voice_id);
  }

  return {
    id: slugId,
    name: cleanName,
    language: primaryLang,
    gender,
    accent,
    style,
    description: parts.length > 1 ? parts.slice(1).join('-').trim() : (raw.description || ''),
    supportedLanguages: Array.from(supportedLanguagesSet),
  };
}

/**
 * Derives the language list from the normalized voice catalog.
 * @param {Array<object>} voices - Normalized voices array
 * @returns {Array<object>} Array of language descriptors: { id, name, flag, native }
 */
export function deriveLanguagesFromVoices(voices) {
  const languageSet = new Set();

  for (const voice of voices) {
    if (voice.language) languageSet.add(voice.language);
    if (Array.isArray(voice.supportedLanguages)) {
      for (const lang of voice.supportedLanguages) {
        languageSet.add(lang);
      }
    }
  }

  const languages = [];
  for (const langId of languageSet) {
    const meta = LOCALE_METADATA[langId] || {
      name: langId,
      flag: '🌐',
      native: langId,
    };
    languages.push({
      id: langId,
      name: meta.name,
      flag: meta.flag,
      native: meta.native || meta.name,
    });
  }

  // Sort en-US first, then alphabetically
  languages.sort((a, b) => {
    if (a.id === 'en-US') return -1;
    if (b.id === 'en-US') return 1;
    return a.name.localeCompare(b.name);
  });

  return languages;
}

/**
 * Resolves an internal ElevenLabs voice ID from a SpeechEngine voice identifier.
 * Checks dynamic registry, then static map, then defaults to Sarah.
 * @param {string} voiceKey - SpeechEngine voice key (e.g. 'sarah', 'george', 'adam')
 * @returns {string} ElevenLabs voice ID
 */
export function resolveProviderVoiceId(voiceKey) {
  if (!voiceKey || typeof voiceKey !== 'string') {
    return DEFAULT_ELEVENLABS_VOICE_ID;
  }
  const normalizedKey = voiceKey.trim().toLowerCase();

  // 1. Check dynamic registry populated from ElevenLabs API
  if (dynamicVoiceRegistry.has(normalizedKey)) {
    return dynamicVoiceRegistry.get(normalizedKey);
  }

  // 2. Check static fallback map
  if (ELEVENLABS_VOICE_MAP[normalizedKey]) {
    return ELEVENLABS_VOICE_MAP[normalizedKey];
  }

  // 3. Fallback to verified usable core voice (Sarah)
  return DEFAULT_ELEVENLABS_VOICE_ID;
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
   * Fetches available voices from ElevenLabs, filters for account availability,
   * normalizes them to the frontend format, and derives the language list.
   *
   * @param {object} [options={}] - Optional overrides for testing
   * @returns {Promise<{ success: boolean, statusCode: number, message?: string, data?: { voices: Array, languages: Array } }>}
   */
  async getVoices(options = {}) {
    const apiKey = options.apiKey !== undefined ? options.apiKey : config.elevenlabs.apiKey;
    const fetchFn = options.fetchFn || globalThis.fetch;

    let response;
    try {
      // 1. Primary: Official ElevenLabs v2/voices endpoint
      const v2Endpoint = 'https://api.elevenlabs.io/v2/voices';
      const headers = {};
      if (apiKey && apiKey.trim().length > 0) {
        headers['xi-api-key'] = apiKey;
      }

      response = await fetchFn(v2Endpoint, { headers });

      // 2. If v2 returns unauthorized or missing permission, fall back to core voices
      if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 404)) {
        response = await fetchFn('https://api.elevenlabs.io/v1/voices');
      }
    } catch (err) {
      return {
        success: false,
        statusCode: 503,
        message: `Failed to connect to ElevenLabs API: ${err.message}`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        statusCode: 502,
        message: `ElevenLabs returned an error (${response.status}): ${response.statusText}`,
      };
    }

    try {
      const data = await response.json();
      const rawVoices = Array.isArray(data?.voices) ? data.voices : [];

      // Filter for voices actually usable on the account (premade core voices to prevent 402 errors)
      const availableVoices = rawVoices.filter((v) => v.category === 'premade' || !v.category);

      // Normalize voices to frontend format (id, name, language, gender, accent, style)
      const voices = availableVoices.map(normalizeElevenLabsVoice);

      // Derive language list dynamically from the returned voices
      const languages = deriveLanguagesFromVoices(voices);

      return {
        success: true,
        statusCode: 200,
        data: {
          voices,
          languages,
        },
      };
    } catch (err) {
      return {
        success: false,
        statusCode: 502,
        message: `Failed to parse ElevenLabs voices response: ${err.message}`,
      };
    }
  }

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
