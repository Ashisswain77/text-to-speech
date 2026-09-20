import { config } from '../config/env.js';
import { getStorageClient } from '../config/storage.js';

/**
 * Storage Service — Phase 1: Connectivity & Bucket Verification
 *
 * Exposes safe verification and health-check methods for Supabase Storage.
 *
 * NOTE: Upload, download, signed URLs, and deletion are deferred to subsequent phases.
 */

/**
 * Safely sanitizes an error message to prevent accidental key or credential exposure.
 *
 * @param {Error|object|string} err
 * @returns {string}
 */
function sanitizeErrorMessage(err) {
  if (!err) return 'Unknown storage error';
  const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  
  // Strip out any potential key occurrences if present
  const serviceKey = config.supabase.serviceRoleKey;
  if (serviceKey && serviceKey.length > 5) {
    return msg.replaceAll(serviceKey, '[REDACTED_SERVICE_KEY]');
  }
  return msg;
}

/**
 * Checks whether a designated Supabase Storage bucket exists.
 *
 * @param {string} [bucketName] - Defaults to config.supabase.bucket ('speech-audio')
 * @param {object} [clientOverride] - Optional injected client for testing
 * @returns {Promise<{ exists: boolean, bucket: object|null, error: string|null }>}
 */
export async function checkBucketExists(bucketName = config.supabase.bucket, clientOverride = null) {
  try {
    const client = clientOverride || getStorageClient();
    const targetBucket = bucketName || config.supabase.bucket;

    const { data, error } = await client.storage.getBucket(targetBucket);

    if (error) {
      // Check if it's a standard "not found" response
      const isNotFound = 
        error.statusCode === 404 || 
        error.status === 404 ||
        /not found/i.test(error.message || '');

      if (isNotFound) {
        return {
          exists: false,
          bucket: null,
          error: null,
        };
      }

      return {
        exists: false,
        bucket: null,
        error: sanitizeErrorMessage(error),
      };
    }

    if (!data) {
      return {
        exists: false,
        bucket: null,
        error: null,
      };
    }

    return {
      exists: true,
      bucket: {
        id: data.id,
        name: data.name,
        isPublic: Boolean(data.public),
        fileSizeLimit: data.file_size_limit ?? null,
        allowedMimeTypes: Array.isArray(data.allowed_mime_types) ? data.allowed_mime_types : [],
        createdAt: data.created_at || null,
        updatedAt: data.updated_at || null,
      },
      error: null,
    };
  } catch (err) {
    return {
      exists: false,
      bucket: null,
      error: sanitizeErrorMessage(err),
    };
  }
}

/**
 * Performs a safe health check on Supabase Storage connectivity without exposing secrets.
 *
 * @param {string} [bucketName] - Defaults to config.supabase.bucket ('speech-audio')
 * @param {object} [clientOverride] - Optional injected client for testing
 * @returns {Promise<{ ok: boolean, bucket: string, exists: boolean, latencyMs: number, metadata?: object, error?: string }>}
 */
export async function verifyStorageHealth(bucketName = config.supabase.bucket, clientOverride = null) {
  const targetBucket = bucketName || config.supabase.bucket;
  const start = Date.now();

  try {
    const result = await checkBucketExists(targetBucket, clientOverride);
    const latencyMs = Date.now() - start;

    if (result.error) {
      return {
        ok: false,
        bucket: targetBucket,
        exists: false,
        latencyMs,
        error: result.error,
      };
    }

    return {
      ok: true,
      bucket: targetBucket,
      exists: result.exists,
      latencyMs,
      metadata: result.bucket,
    };
  } catch (err) {
    return {
      ok: false,
      bucket: targetBucket,
      exists: false,
      latencyMs: Date.now() - start,
      error: sanitizeErrorMessage(err),
    };
  }
}

/**
 * Constructs the deterministic storage object path for a speech audio file.
 *
 * Format: users/<userId>/speeches/<speechId>.mp3
 *
 * @param {string} userId - Authenticated user UUID
 * @param {string} speechId - Persisted speech record UUID
 * @returns {string} Deterministic storage object path
 */
export function buildSpeechAudioPath(userId, speechId) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !UUID_REGEX.test(userId)) {
    throw new Error('[StorageService] Invalid or missing userId for storage path.');
  }
  if (!speechId || !UUID_REGEX.test(speechId)) {
    throw new Error('[StorageService] Invalid or missing speechId for storage path.');
  }
  return `users/${userId}/speeches/${speechId}.mp3`;
}

/**
 * Uploads synthesized audio buffer directly to private Supabase Storage.
 *
 * @param {object} params
 * @param {string} params.userId - Authoritative authenticated user UUID
 * @param {string} params.speechId - Persisted speech record UUID
 * @param {Buffer} params.audioBuffer - Raw MP3 binary buffer
 * @param {string} [params.bucketName] - Target bucket (defaults to speech-audio)
 * @param {object} [params.clientOverride] - Optional client for testing/mocking
 * @returns {Promise<{ success: boolean, storagePath: string|null, error: string|null }>}
 */
export async function uploadSpeechAudio({
  userId,
  speechId,
  audioBuffer,
  bucketName = config.supabase.bucket,
  clientOverride = null,
}) {
  if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
    return {
      success: false,
      storagePath: null,
      error: 'Invalid or empty audio buffer provided for storage upload.',
    };
  }

  // Maximum file size check (10 MB = 10 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (audioBuffer.length > MAX_FILE_SIZE) {
    return {
      success: false,
      storagePath: null,
      error: 'Audio buffer exceeds maximum allowable limit of 10 MB.',
    };
  }

  let storagePath;
  try {
    storagePath = buildSpeechAudioPath(userId, speechId);
  } catch (pathErr) {
    return {
      success: false,
      storagePath: null,
      error: sanitizeErrorMessage(pathErr),
    };
  }

  try {
    const client = clientOverride || getStorageClient();
    const targetBucket = bucketName || config.supabase.bucket;

    const { error } = await client.storage
      .from(targetBucket)
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false, // Prevent accidental overwrite
      });

    if (error) {
      return {
        success: false,
        storagePath: null,
        error: sanitizeErrorMessage(error),
      };
    }

    return {
      success: true,
      storagePath,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      storagePath: null,
      error: sanitizeErrorMessage(err),
    };
  }
}

/**
 * Deletes a speech audio object from Supabase Storage (e.g. for compensation/cleanup).
 *
 * @param {object} params
 * @param {string} params.storagePath - Object path to delete
 * @param {string} [params.bucketName] - Target bucket
 * @param {object} [params.clientOverride] - Optional client for testing/mocking
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function deleteSpeechAudio({
  storagePath,
  bucketName = config.supabase.bucket,
  clientOverride = null,
}) {
  if (!storagePath || typeof storagePath !== 'string') {
    return { success: false, error: 'Invalid storage path.' };
  }

  try {
    const client = clientOverride || getStorageClient();
    const targetBucket = bucketName || config.supabase.bucket;

    const { error } = await client.storage
      .from(targetBucket)
      .remove([storagePath]);

    if (error) {
      return {
        success: false,
        error: sanitizeErrorMessage(error),
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      error: sanitizeErrorMessage(err),
    };
  }
}

/**
 * Downloads a speech audio file from private Supabase Storage as a binary Buffer.
 *
 * @param {object} params
 * @param {string} params.storagePath - Validated storage object path from DB record
 * @param {string} [params.bucketName] - Target bucket (defaults to speech-audio)
 * @param {object} [params.clientOverride] - Optional client for testing/mocking
 * @returns {Promise<{ success: boolean, audioBuffer: Buffer|null, isNotFound?: boolean, error: string|null }>}
 */
export async function downloadSpeechAudio({
  storagePath,
  bucketName = config.supabase.bucket,
  clientOverride = null,
}) {
  if (!storagePath || typeof storagePath !== 'string') {
    return {
      success: false,
      audioBuffer: null,
      isNotFound: true,
      error: 'Invalid or missing storage path provided for download.',
    };
  }

  try {
    const client = clientOverride || getStorageClient();
    const targetBucket = bucketName || config.supabase.bucket;

    const { data, error } = await client.storage
      .from(targetBucket)
      .download(storagePath);

    if (error) {
      const isNotFound =
        error.statusCode === 404 ||
        error.status === 404 ||
        error.statusCode === '404' ||
        /not found/i.test(error.message || '');

      return {
        success: false,
        audioBuffer: null,
        isNotFound: Boolean(isNotFound),
        error: sanitizeErrorMessage(error),
      };
    }

    if (!data) {
      return {
        success: false,
        audioBuffer: null,
        isNotFound: true,
        error: 'Storage object not found.',
      };
    }

    let buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data.arrayBuffer === 'function') {
      const arrayBuffer = await data.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = Buffer.from(data);
    }

    return {
      success: true,
      audioBuffer: buffer,
      error: null,
    };
  } catch (err) {
    return {
      success: false,
      audioBuffer: null,
      error: sanitizeErrorMessage(err),
    };
  }
}

export default {
  checkBucketExists,
  verifyStorageHealth,
  buildSpeechAudioPath,
  uploadSpeechAudio,
  deleteSpeechAudio,
  downloadSpeechAudio,
};
