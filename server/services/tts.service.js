/**
 * SpeechEngine TTS Service
 *
 * Provider-independent business logic layer.
 * Clearly separates:
 *   1. SpeechEngine request validation
 *   2. SpeechEngine normalization
 *   3. Provider interaction (Day 10)
 *
 * Day 10: ElevenLabs provider adapter is plugged in
 *         via elevenlabsProvider.synthesize(normalized).
 */

import {
  elevenlabsProvider,
  LOCALE_METADATA,
  dynamicVoiceRegistry,
} from './providers/elevenlabs.provider.js';

// ---------------------------------------------------------------------------
// Supported voice catalog (provider-independent SpeechEngine identifiers)
//
// Centralized here so Day 10 can replace this with a provider-backed
// authoritative catalog without touching routes or controllers.
// ---------------------------------------------------------------------------

const SUPPORTED_LANGUAGES = new Set([
  'en-US', 'hi-IN', 'gu-IN', 'mr-IN', 'es-ES', 'fr-FR', 'de-DE',
]);

const VOICES_BY_LANGUAGE = {
  'en-US': new Set(['sarah', 'david', 'sonia', 'marcus']),
  'hi-IN': new Set(['priya', 'aarav']),
  'gu-IN': new Set(['diya', 'karan']),
  'mr-IN': new Set(['ananya', 'rohan']),
  'es-ES': new Set(['elena', 'carlos']),
  'fr-FR': new Set(['chloe', 'lucas']),
  'de-DE': new Set(['hannah', 'felix']),
};

// ---------------------------------------------------------------------------
// Defaults & constraints
// ---------------------------------------------------------------------------

const DEFAULTS = {
  language: 'en-US',
  voice: 'sarah',
};

const CONSTRAINTS = {
  text: { minLength: 1, maxLength: 5000 },
};

// ---------------------------------------------------------------------------
// 1. SpeechEngine Request Validation
// ---------------------------------------------------------------------------

/**
 * Validates the raw incoming TTS payload.
 * Returns an array of error message strings (empty if valid).
 *
 * @param {object} body - Raw request body from the client
 * @returns {string[]} Array of validation error messages
 */
function validate(body) {
  const errors = [];

  // --- text (required, string, non-empty, max 5000 after trim) ---
  if (body.text === undefined || body.text === null) {
    errors.push('Text is required.');
  } else if (typeof body.text !== 'string') {
    errors.push('Text must be a string.');
  } else {
    const trimmed = body.text.trim();
    if (trimmed.length < CONSTRAINTS.text.minLength) {
      errors.push('Text must not be empty.');
    }
    if (trimmed.length > CONSTRAINTS.text.maxLength) {
      errors.push(`Text must not exceed ${CONSTRAINTS.text.maxLength} characters.`);
    }
  }

  // --- language (optional) ---
  const language = resolveOptionalString(body.language, DEFAULTS.language);

  const isKnownLanguage = SUPPORTED_LANGUAGES.has(language) || Boolean(LOCALE_METADATA[language]);
  if (!isKnownLanguage) {
    errors.push(`Unsupported language: "${language}". Supported: ${[...SUPPORTED_LANGUAGES].join(', ')}.`);
  }

  // --- voice (optional, must match language) ---
  const voice = resolveOptionalString(body.voice, DEFAULTS.voice).toLowerCase();

  const languageVoices = VOICES_BY_LANGUAGE[language];
  const isCatalogVoice = languageVoices && languageVoices.has(voice);
  const isDynamicVoice = dynamicVoiceRegistry.has(voice);

  // Check if voice belongs to a different static language catalog
  const isDifferentLanguageVoice = Object.entries(VOICES_BY_LANGUAGE).some(
    ([lang, voices]) => lang !== language && voices.has(voice)
  );

  if (languageVoices && (!isCatalogVoice && (!isDynamicVoice || isDifferentLanguageVoice))) {
    errors.push(`Unsupported voice "${voice}" for language "${language}". Available: ${[...languageVoices].join(', ')}.`);
  } else if (!languageVoices && !isDynamicVoice) {
    errors.push(`Unsupported voice "${voice}".`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 2. SpeechEngine Normalization
// ---------------------------------------------------------------------------

/**
 * Normalizes a validated payload by trimming text and applying defaults.
 * Only call this after validate() returns no errors.
 *
 * @param {object} body - Raw request body (already validated)
 * @returns {object} Normalized TTS request object
 */
function normalize(body) {
  return {
    text: body.text.trim(),
    language: resolveOptionalString(body.language, DEFAULTS.language),
    voice: resolveOptionalString(body.voice, DEFAULTS.voice).toLowerCase(),
  };
}

// ---------------------------------------------------------------------------
// 3. Provider Interaction (Day 10)
// ---------------------------------------------------------------------------

// Day 10: Import and call the configured provider adapter here.
// Example future structure:
//
//   import provider from './providers/elevenlabs.provider.js';
//   const result = await provider.synthesize(normalized);
//
// The provider adapter will:
//   - Map SpeechEngine voice ID → provider voice ID
//   - Return audio data and metadata

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve an optional string field, falling back to a default.
 */
function resolveOptionalString(value, fallback) {
  if (value !== undefined && value !== null && value !== '') {
    return String(value).trim();
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process a TTS synthesis request.
 *
 * Validates and normalizes the request, then delegates synthesis
 * to the configured cloud provider adapter (ElevenLabs).
 *
 * @param {object} payload - Raw request body
 * @param {object} [options={}] - Optional overrides (e.g. mock provider for testing)
 * @returns {Promise<{ success: boolean, statusCode: number, message: string, data?: object, audioBuffer?: Buffer }>}
 */
export async function synthesize(payload, options = {}) {
  // 1. Validate
  const errors = validate(payload);

  if (errors.length > 0) {
    return {
      success: false,
      statusCode: 400,
      message: errors.join(' '),
    };
  }

  // 2. Normalize (defaults applied, text trimmed)
  const normalized = normalize(payload);

  // 3. Provider interaction (ElevenLabs adapter)
  const provider = options.provider || elevenlabsProvider;
  return await provider.synthesize(normalized);
}

/**
 * Retrieves the available voice catalog and derived languages
 * directly from the configured cloud provider (ElevenLabs).
 *
 * @param {object} [options={}] - Optional injection for testing
 * @returns {Promise<{ success: boolean, statusCode: number, data?: { voices: Array, languages: Array }, message?: string }>}
 */
export async function getVoices(options = {}) {
  const provider = options.provider || elevenlabsProvider;
  return await provider.getVoices(options);
}

export { validate, normalize };
export default { synthesize, validate, normalize, getVoices };

