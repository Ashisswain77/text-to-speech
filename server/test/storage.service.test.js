import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../config/env.js';
import {
  validateStorageConfig,
  getStorageClient,
  resetStorageClient,
} from '../config/storage.js';
import {
  checkBucketExists,
  verifyStorageHealth,
} from '../services/storage.service.js';

describe('Supabase Storage Backend Integration Tests (Phase 1)', () => {
  const originalSupabaseUrl = process.env.SUPABASE_URL;
  const originalServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    resetStorageClient();
  });

  afterEach(() => {
    // Restore environment
    if (originalSupabaseUrl !== undefined) {
      process.env.SUPABASE_URL = originalSupabaseUrl;
    } else {
      delete process.env.SUPABASE_URL;
    }

    if (originalServiceKey !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceKey;
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    resetStorageClient();
  });

  describe('Configuration & Security Controls', () => {
    it('does not serialize serviceRoleKey in JSON.stringify(config.supabase)', () => {
      process.env.SUPABASE_URL = 'https://test-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'super_secret_service_role_key_value_12345';

      const serialized = JSON.stringify(config.supabase);
      assert.strictEqual(
        serialized.includes('super_secret_service_role_key_value_12345'),
        false,
        'config.supabase serialized JSON must not expose the raw serviceRoleKey'
      );
    });

    it('throws a descriptive error when SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      assert.throws(
        () => validateStorageConfig(),
        (err) => {
          assert.match(err.message, /Missing required Supabase Storage environment variable/);
          assert.match(err.message, /SUPABASE_URL/);
          assert.match(err.message, /SUPABASE_SERVICE_ROLE_KEY/);
          return true;
        }
      );
    });

    it('throws an error when SUPABASE_URL has invalid URL format', () => {
      process.env.SUPABASE_URL = 'not-a-valid-url';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_key';

      assert.throws(
        () => validateStorageConfig(),
        (err) => {
          assert.match(err.message, /Invalid SUPABASE_URL format/);
          return true;
        }
      );
    });

    it('successfully validates when valid URL and key are provided', () => {
      process.env.SUPABASE_URL = 'https://valid-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_service_role_key';

      const validated = validateStorageConfig();
      assert.strictEqual(validated.url, 'https://valid-project.supabase.co');
      assert.strictEqual(validated.serviceRoleKey, 'valid_service_role_key');
      assert.strictEqual(validated.bucket, 'speech-audio');
    });

    it('initializes Supabase client without session persistence (auth disabled)', () => {
      process.env.SUPABASE_URL = 'https://test-project.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';

      const client = getStorageClient({ forceNew: true });
      assert.ok(client, 'Storage client should be instantiated');
      assert.ok(client.storage, 'Client must have storage namespace');
    });
  });

  describe('Storage Service Connectivity & Bucket Verification', () => {
    it('returns exists: true with metadata when target bucket exists', async () => {
      const mockBucketData = {
        id: 'speech-audio',
        name: 'speech-audio',
        public: false,
        file_size_limit: 10485760,
        allowed_mime_types: ['audio/mpeg'],
        created_at: '2026-09-20T10:00:00Z',
        updated_at: '2026-09-20T10:00:00Z',
      };

      const mockClient = {
        storage: {
          getBucket: async (name) => {
            assert.strictEqual(name, 'speech-audio');
            return { data: mockBucketData, error: null };
          },
        },
      };

      const result = await checkBucketExists('speech-audio', mockClient);
      assert.strictEqual(result.exists, true);
      assert.strictEqual(result.error, null);
      assert.deepStrictEqual(result.bucket, {
        id: 'speech-audio',
        name: 'speech-audio',
        isPublic: false,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['audio/mpeg'],
        createdAt: '2026-09-20T10:00:00Z',
        updatedAt: '2026-09-20T10:00:00Z',
      });
    });

    it('returns exists: false when bucket is not found (404)', async () => {
      const mockClient = {
        storage: {
          getBucket: async () => ({
            data: null,
            error: { message: 'Bucket not found', statusCode: 404 },
          }),
        },
      };

      const result = await checkBucketExists('speech-audio', mockClient);
      assert.strictEqual(result.exists, false);
      assert.strictEqual(result.bucket, null);
      assert.strictEqual(result.error, null);
    });

    it('sanitizes and redacts any service-role key from error messages', async () => {
      const testSecretKey = 'super_secret_service_key_to_redact';
      process.env.SUPABASE_SERVICE_ROLE_KEY = testSecretKey;

      const mockClient = {
        storage: {
          getBucket: async () => {
            throw new Error(`Failed network request with key: ${testSecretKey}`);
          },
        },
      };

      const result = await checkBucketExists('speech-audio', mockClient);
      assert.strictEqual(result.exists, false);
      assert.ok(result.error);
      assert.strictEqual(
        result.error.includes(testSecretKey),
        false,
        'Error message must never contain the raw service-role key'
      );
      assert.ok(result.error.includes('[REDACTED_SERVICE_KEY]'));
    });

    it('verifyStorageHealth accurately reports latency and ok status', async () => {
      const mockClient = {
        storage: {
          getBucket: async () => ({
            data: {
              id: 'speech-audio',
              name: 'speech-audio',
              public: false,
              file_size_limit: 10485760,
              allowed_mime_types: ['audio/mpeg'],
            },
            error: null,
          }),
        },
      };

      const health = await verifyStorageHealth('speech-audio', mockClient);
      assert.strictEqual(health.ok, true);
      assert.strictEqual(health.bucket, 'speech-audio');
      assert.strictEqual(health.exists, true);
      assert.strictEqual(typeof health.latencyMs, 'number');
      assert.ok(health.latencyMs >= 0);
      assert.strictEqual(health.metadata?.isPublic, false);
    });
  });

  describe('Storage Path Generation (buildSpeechAudioPath)', () => {
    const validUserId = '11111111-1111-4111-8111-111111111111';
    const validSpeechId = '22222222-2222-4222-8222-222222222222';

    it('generates the exact deterministic storage path format', async () => {
      const { buildSpeechAudioPath } = await import('../services/storage.service.js');
      const path = buildSpeechAudioPath(validUserId, validSpeechId);
      assert.strictEqual(path, `users/${validUserId}/speeches/${validSpeechId}.mp3`);
    });

    it('rejects path traversal attempts or non-UUID userId', async () => {
      const { buildSpeechAudioPath } = await import('../services/storage.service.js');
      assert.throws(
        () => buildSpeechAudioPath('../../etc/passwd', validSpeechId),
        /Invalid or missing userId/
      );
      assert.throws(
        () => buildSpeechAudioPath('', validSpeechId),
        /Invalid or missing userId/
      );
    });

    it('rejects invalid or path-traversal speechId', async () => {
      const { buildSpeechAudioPath } = await import('../services/storage.service.js');
      assert.throws(
        () => buildSpeechAudioPath(validUserId, '../malicious'),
        /Invalid or missing speechId/
      );
      assert.throws(
        () => buildSpeechAudioPath(validUserId, null),
        /Invalid or missing speechId/
      );
    });
  });

  describe('Audio Upload & Cleanup Operations (uploadSpeechAudio & deleteSpeechAudio)', () => {
    const validUserId = '11111111-1111-4111-8111-111111111111';
    const validSpeechId = '22222222-2222-4222-8222-222222222222';

    it('successfully uploads audio buffer and returns storagePath', async () => {
      const { uploadSpeechAudio } = await import('../services/storage.service.js');
      const sampleAudio = Buffer.from('RIFF mock audio buffer content');

      let capturedPath = null;
      let capturedBuffer = null;
      let capturedOptions = null;

      const mockClient = {
        storage: {
          from: (bucket) => {
            assert.strictEqual(bucket, 'speech-audio');
            return {
              upload: async (path, buffer, options) => {
                capturedPath = path;
                capturedBuffer = buffer;
                capturedOptions = options;
                return { data: { path }, error: null };
              },
            };
          },
        },
      };

      const result = await uploadSpeechAudio({
        userId: validUserId,
        speechId: validSpeechId,
        audioBuffer: sampleAudio,
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.storagePath, `users/${validUserId}/speeches/${validSpeechId}.mp3`);
      assert.strictEqual(capturedPath, `users/${validUserId}/speeches/${validSpeechId}.mp3`);
      assert.strictEqual(capturedBuffer, sampleAudio);
      assert.strictEqual(capturedOptions.contentType, 'audio/mpeg');
      assert.strictEqual(capturedOptions.upsert, false);
    });

    it('rejects invalid or empty audio buffers', async () => {
      const { uploadSpeechAudio } = await import('../services/storage.service.js');

      const emptyResult = await uploadSpeechAudio({
        userId: validUserId,
        speechId: validSpeechId,
        audioBuffer: Buffer.alloc(0),
      });
      assert.strictEqual(emptyResult.success, false);
      assert.match(emptyResult.error, /Invalid or empty audio buffer/);

      const nonBufferResult = await uploadSpeechAudio({
        userId: validUserId,
        speechId: validSpeechId,
        audioBuffer: 'string-not-buffer',
      });
      assert.strictEqual(nonBufferResult.success, false);
      assert.match(nonBufferResult.error, /Invalid or empty audio buffer/);
    });

    it('rejects audio buffers exceeding 10 MB limit', async () => {
      const { uploadSpeechAudio } = await import('../services/storage.service.js');
      const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1);

      const result = await uploadSpeechAudio({
        userId: validUserId,
        speechId: validSpeechId,
        audioBuffer: oversizedBuffer,
      });
      assert.strictEqual(result.success, false);
      assert.match(result.error, /exceeds maximum allowable limit of 10 MB/);
    });

    it('handles storage upload errors gracefully without leaking keys', async () => {
      const { uploadSpeechAudio } = await import('../services/storage.service.js');
      const secretKey = 'upload_secret_role_key_value';
      process.env.SUPABASE_SERVICE_ROLE_KEY = secretKey;

      const mockClient = {
        storage: {
          from: () => ({
            upload: async () => ({
              data: null,
              error: { message: `Upload rejected for key ${secretKey}` },
            }),
          }),
        },
      };

      const result = await uploadSpeechAudio({
        userId: validUserId,
        speechId: validSpeechId,
        audioBuffer: Buffer.from('mock audio'),
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.storagePath, null);
      assert.strictEqual(result.error.includes(secretKey), false);
      assert.ok(result.error.includes('[REDACTED_SERVICE_KEY]'));
    });

    it('successfully deletes a storage object for rollback compensation', async () => {
      const { deleteSpeechAudio } = await import('../services/storage.service.js');
      let removedPaths = null;

      const mockClient = {
        storage: {
          from: (bucket) => {
            assert.strictEqual(bucket, 'speech-audio');
            return {
              remove: async (paths) => {
                removedPaths = paths;
                return { data: paths, error: null };
              },
            };
          },
        },
      };

      const pathToDelete = `users/${validUserId}/speeches/${validSpeechId}.mp3`;
      const result = await deleteSpeechAudio({
        storagePath: pathToDelete,
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, true);
      assert.deepStrictEqual(removedPaths, [pathToDelete]);
    });
  });

  describe('Audio Download Operations (downloadSpeechAudio)', () => {
    const validPath = 'users/11111111-1111-4111-8111-111111111111/speeches/22222222-2222-4222-8222-222222222222.mp3';

    it('successfully downloads object and returns a binary Buffer', async () => {
      const { downloadSpeechAudio } = await import('../services/storage.service.js');
      const rawAudio = Buffer.from('RIFF mock downloaded mp3 stream bytes');

      const mockClient = {
        storage: {
          from: (bucket) => {
            assert.strictEqual(bucket, 'speech-audio');
            return {
              download: async (path) => {
                assert.strictEqual(path, validPath);
                // Return Blob-like object with arrayBuffer method
                return {
                  data: {
                    arrayBuffer: async () => rawAudio.buffer.slice(rawAudio.byteOffset, rawAudio.byteOffset + rawAudio.byteLength),
                  },
                  error: null,
                };
              },
            };
          },
        },
      };

      const result = await downloadSpeechAudio({
        storagePath: validPath,
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, true);
      assert.ok(Buffer.isBuffer(result.audioBuffer));
      assert.strictEqual(result.audioBuffer.toString(), rawAudio.toString());
      assert.strictEqual(result.error, null);
    });

    it('identifies 404 / not found error and sets isNotFound: true', async () => {
      const { downloadSpeechAudio } = await import('../services/storage.service.js');

      const mockClient = {
        storage: {
          from: () => ({
            download: async () => ({
              data: null,
              error: { message: 'Object not found', statusCode: 404 },
            }),
          }),
        },
      };

      const result = await downloadSpeechAudio({
        storagePath: validPath,
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.audioBuffer, null);
      assert.strictEqual(result.isNotFound, true);
    });

    it('sanitizes unexpected download errors without leaking service-role keys', async () => {
      const { downloadSpeechAudio } = await import('../services/storage.service.js');
      const secretKey = 'download_secret_service_key_val';
      process.env.SUPABASE_SERVICE_ROLE_KEY = secretKey;

      const mockClient = {
        storage: {
          from: () => ({
            download: async () => ({
              data: null,
              error: { message: `Storage network connection aborted with key: ${secretKey}` },
            }),
          }),
        },
      };

      const result = await downloadSpeechAudio({
        storagePath: validPath,
        clientOverride: mockClient,
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.audioBuffer, null);
      assert.strictEqual(result.error.includes(secretKey), false);
      assert.ok(result.error.includes('[REDACTED_SERVICE_KEY]'));
    });

    it('rejects invalid or missing storage path parameter', async () => {
      const { downloadSpeechAudio } = await import('../services/storage.service.js');

      const nullResult = await downloadSpeechAudio({ storagePath: null });
      assert.strictEqual(nullResult.success, false);
      assert.strictEqual(nullResult.isNotFound, true);

      const emptyResult = await downloadSpeechAudio({ storagePath: '' });
      assert.strictEqual(emptyResult.success, false);
      assert.strictEqual(emptyResult.isNotFound, true);
    });
  });
});
