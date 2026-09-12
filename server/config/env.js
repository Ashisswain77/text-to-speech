import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Resolve explicit path to server/.env relative to this configuration module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '../.env');

// Load environment variables: check process.cwd() .env first, then explicitly load server/.env
dotenv.config();
dotenv.config({ path: serverEnvPath, override: true });


/**
 * Validates and normalizes the server port
 * @param {string|undefined} portVal
 * @returns {number}
 */
const parsePort = (portVal) => {
  const parsed = parseInt(portVal || '5000', 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`[EnvConfig] Invalid PORT specified: "${portVal}". Port must be a number between 1 and 65535.`);
  }
  return parsed;
};

/**
 * Validates client URL format
 * @param {string|undefined} url
 * @returns {string}
 */
const parseClientUrl = (url) => {
  const clientUrl = (url || 'http://localhost:5173').trim();
  try {
    new URL(clientUrl);
    return clientUrl;
  } catch {
    throw new Error(`[EnvConfig] Invalid CLIENT_URL specified: "${url}". Must be a valid URL string.`);
  }
};

/**
 * Parses CLIENT_URL into an array of validated origins for CORS.
 * Supports comma-separated values for multi-origin production deployments.
 * Falls back to single-origin string for backwards compatibility.
 *
 * @param {string|undefined} raw - Raw CLIENT_URL environment variable
 * @returns {string|string[]} Single origin string or array of origins
 */
const parseCorsOrigins = (raw) => {
  const value = (raw || 'http://localhost:5173').trim();
  if (!value.includes(',')) {
    // Single origin — return string for backwards compatibility
    return parseClientUrl(raw);
  }
  // Multiple origins — validate each one
  const origins = value.split(',').map((u) => u.trim()).filter(Boolean);
  for (const origin of origins) {
    try {
      new URL(origin);
    } catch {
      throw new Error(`[EnvConfig] Invalid CLIENT_URL origin: "${origin}". Each origin must be a valid URL.`);
    }
  }
  return origins;
};

/**
 * Parses a positive integer from an environment variable with a default.
 * @param {string|undefined} val
 * @param {number} fallback
 * @returns {number}
 */
const parsePositiveInt = (val, fallback) => {
  if (val === undefined || val === null || val === '') return fallback;
  const parsed = parseInt(val, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const port = parsePort(process.env.PORT);
const nodeEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const clientUrl = parseClientUrl(process.env.CLIENT_URL);
const corsOrigins = parseCorsOrigins(process.env.CLIENT_URL);

/**
 * Centralized Application Configuration
 * All other modules import environment configuration from here.
 * Direct access to process.env throughout the app is avoided.
 */
export const config = Object.freeze({
  port,
  nodeEnv,
  clientUrl,
  corsOrigins,
  isProduction: nodeEnv === 'production',
  isDevelopment: nodeEnv === 'development',
  isTest: nodeEnv === 'test',
  
  // ElevenLabs TTS Provider Configuration (Day 10)
  elevenlabs: Object.freeze({
    apiKey: (process.env.ELEVENLABS_API_KEY || process.env.TTS_API_KEY || '').trim(),
    modelId: (process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2').trim(),
  }),

  // Reserved for future TTS integration
  tts: Object.freeze({
    apiKey: process.env.TTS_API_KEY || '',
    region: process.env.TTS_REGION || '',
    endpoint: process.env.TTS_ENDPOINT || '',
  }),

  // Rate limiting configuration (environment-overridable with secure defaults)
  rateLimit: Object.freeze({
    global: Object.freeze({
      windowMs: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
      max: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_MAX, 100),                        // 100 requests per window
    }),
    tts: Object.freeze({
      windowMs: parsePositiveInt(process.env.RATE_LIMIT_TTS_WINDOW_MS, 60 * 1000),          // 1 minute
      max: parsePositiveInt(process.env.RATE_LIMIT_TTS_MAX, 10),                             // 10 requests per window
    }),
  }),
});

export default config;
