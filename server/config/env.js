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

const port = parsePort(process.env.PORT);
const nodeEnv = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const clientUrl = parseClientUrl(process.env.CLIENT_URL);

/**
 * Centralized Application Configuration
 * All other modules import environment configuration from here.
 * Direct access to process.env throughout the app is avoided.
 */
export const config = Object.freeze({
  port,
  nodeEnv,
  clientUrl,
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
});

export default config;
