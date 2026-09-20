import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

/**
 * Validates that Supabase storage credentials exist.
 *
 * Throws a sanitized Error if missing, without ever logging or leaking secret values.
 *
 * @returns {{ url: string, serviceRoleKey: string, bucket: string }}
 */
export function validateStorageConfig() {
  const url = config.supabase.url;
  const serviceRoleKey = config.supabase.serviceRoleKey;
  const bucket = config.supabase.bucket;

  const missing = [];
  if (!url) missing.push('SUPABASE_URL');
  if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    throw new Error(
      `[StorageConfig] Missing required Supabase Storage environment variable(s): ${missing.join(', ')}. ` +
      `Please configure them in server/.env.`
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    throw new Error(
      `[StorageConfig] Invalid SUPABASE_URL format. Must be a valid HTTPS URL (e.g. https://your-project-id.supabase.co).`
    );
  }

  return { url, serviceRoleKey, bucket };
}

let cachedClient = null;
let clientOverride = null;

/**
 * Sets an override client for testing or mocking without contacting Supabase.
 * @param {object|null} mockClient
 */
export function setStorageClientOverride(mockClient) {
  clientOverride = mockClient;
}

/**
 * Clears any test client override.
 */
export function resetStorageClientOverride() {
  clientOverride = null;
}

/**
 * Initializes and returns a singleton Supabase admin client for Storage operations.
 *
 * Configured strictly for backend Storage:
 * - Uses the privileged service-role key (bypasses RLS for secure server operations)
 * - Disables Supabase Auth session persistence and token auto-refresh to guarantee
 *   no interference with SpeechEngine's custom JWT authentication.
 *
 * @param {object} [options]
 * @param {boolean} [options.forceNew=false] - Force creating a new instance (useful for testing)
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getStorageClient({ forceNew = false } = {}) {
  if (clientOverride) {
    return clientOverride;
  }

  if (cachedClient && !forceNew) {
    return cachedClient;
  }

  const { url, serviceRoleKey } = validateStorageConfig();

  const client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  if (!forceNew) {
    cachedClient = client;
  }

  return client;
}

/**
 * Resets the cached storage client singleton (useful for testing or config reloads).
 */
export function resetStorageClient() {
  cachedClient = null;
  clientOverride = null;
}

export default {
  validateStorageConfig,
  getStorageClient,
  resetStorageClient,
  setStorageClientOverride,
  resetStorageClientOverride,
};

