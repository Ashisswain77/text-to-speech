import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
  
  // Reserved for future TTS integration (Day 9+)
  // NOTE: TTS variables are intentionally optional and NOT required for Day 8
  tts: Object.freeze({
    apiKey: process.env.TTS_API_KEY || '',
    region: process.env.TTS_REGION || '',
    endpoint: process.env.TTS_ENDPOINT || '',
  }),
});

export default config;
