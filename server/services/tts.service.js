/**
 * SpeechEngine TTS Service
 *
 * Provider-independent business logic layer.
 * Clearly separates:
 *   1. SpeechEngine request validation
 *   2. SpeechEngine normalization
 *   3. Provider interaction (Day 10)
 *
 * Day 9: No provider is configured — valid requests
 *         return an honest 501 (Not Implemented).
 * Day 10: A real provider adapter will be plugged in
 *         via the synthesizeWithProvider() path below.
 */

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
  speed: 1.0,
  pitch: 0,
  volume: 100,
};

const CONSTRAINTS = {
  text: { minLength: 1, maxLength: 5000 },
  speed: { allowed: new Set([0.5, 1, 1.5, 2]) },
  pitch: { min: -5, max: 5 },
  volume: { min: 0, max: 100 },
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

  if (!SUPPORTED_LANGUAGES.has(language)) {
    errors.push(`Unsupported language: "${language}". Supported: ${[...SUPPORTED_LANGUAGES].join(', ')}.`);
  }

  // --- voice (optional, must match language) ---
  const voice = resolveOptionalString(body.voice, DEFAULTS.voice).toLowerCase();

  const languageVoices = VOICES_BY_LANGUAGE[language];
  if (languageVoices && !languageVoices.has(voice)) {
    errors.push(`Unsupported voice "${voice}" for language "${language}". Available: ${[...languageVoices].join(', ')}.`);
  }

  // --- speed (optional, must be one of 0.5, 1, 1.5, 2) ---
  if (body.speed !== undefined && body.speed !== null) {
    if (typeof body.speed !== 'number' || !CONSTRAINTS.speed.allowed.has(body.speed)) {
      errors.push('Speed must be one of: 0.5, 1, 1.5, 2.');
    }
  }

  // --- pitch (optional, integer, -5–5) ---
  if (body.pitch !== undefined && body.pitch !== null) {
    const pitch = Number(body.pitch);
    if (typeof body.pitch !== 'number' || Number.isNaN(pitch) || !Number.isInteger(pitch) || pitch < CONSTRAINTS.pitch.min || pitch > CONSTRAINTS.pitch.max) {
      errors.push(`Pitch must be an integer between ${CONSTRAINTS.pitch.min} and ${CONSTRAINTS.pitch.max}.`);
    }
  }

  // --- volume (optional, integer, 0–100) ---
  if (body.volume !== undefined && body.volume !== null) {
    const volume = Number(body.volume);
    if (typeof body.volume !== 'number' || Number.isNaN(volume) || !Number.isInteger(volume) || volume < CONSTRAINTS.volume.min || volume > CONSTRAINTS.volume.max) {
      errors.push(`Volume must be an integer between ${CONSTRAINTS.volume.min} and ${CONSTRAINTS.volume.max}.`);
    }
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
    speed: (body.speed !== undefined && body.speed !== null) ? body.speed : DEFAULTS.speed,
    pitch: (body.pitch !== undefined && body.pitch !== null) ? body.pitch : DEFAULTS.pitch,
    volume: (body.volume !== undefined && body.volume !== null) ? body.volume : DEFAULTS.volume,
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
//   - Map speed/pitch/volume → provider parameters
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
 * Day 9: Validates and normalizes the request, then returns 501
 *         because no TTS provider is configured yet.
 *
 * @param {object} payload - Raw request body
 * @returns {{ success: boolean, statusCode: number, message: string }}
 */
export async function synthesize(payload) {
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
  // const normalized = normalize(payload);
  // normalized is ready for provider dispatch on Day 10
  normalize(payload); // validate normalization works; result used by provider on Day 10

  // 3. Provider interaction — not implemented yet
  return {
    success: false,
    statusCode: 501,
    message: 'TTS provider integration is not configured yet.',
  };
}

export default { synthesize };
