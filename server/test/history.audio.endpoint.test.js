import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import { query } from '../config/db.js';
import { createUser } from '../repositories/user.repository.js';
import { createSpeech, updateSpeechAudioUrlByIdAndUserId } from '../repositories/speech.repository.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, COOKIE_NAME } from '../utils/token.js';
import { setStorageClientOverride, resetStorageClientOverride } from '../config/storage.js';

describe('GET /api/history/:id/audio Integration Tests (Phase 3)', () => {
  let server;
  let baseUrl;

  let userA;
  let userACookie;

  let userB;
  let userBCookie;

  let userASpeechWithAudio;
  let userASpeechWithoutAudio;
  let userBSpeechWithAudio;

  const mockAudioBytes = Buffer.from('RIFF mock audio binary payload 1234567890');
  const uploadedStorage = new Map();
  let requestedDownloadPaths = [];

  const testRunId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createEmail = (suffix) => `historyaudio_${testRunId}_${suffix}@speechengine.test`;

  before(async () => {
    // 0. Set mock storage client for isolated automated testing
    setStorageClientOverride({
      storage: {
        from: (bucket) => ({
          upload: async (path, buffer) => {
            uploadedStorage.set(path, buffer);
            return { data: { path }, error: null };
          },
          download: async (path) => {
            requestedDownloadPaths.push(path);
            if (uploadedStorage.has(path)) {
              const buffer = uploadedStorage.get(path);
              return {
                data: {
                  arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                },
                error: null,
              };
            }
            return {
              data: null,
              error: { message: 'Object not found', statusCode: 404 },
            };
          },
          remove: async (paths) => {
            paths.forEach((p) => uploadedStorage.delete(p));
            return { data: paths, error: null };
          },
          getBucket: async (name) => ({
            data: { id: name, name, public: false },
            error: null,
          }),
        }),
      },
    });

    // 1. Start dynamic HTTP server
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // 2. Create test users
    const passwordHash = await hashPassword('TestPassword123!');

    userA = await createUser({
      name: 'Audio User A',
      email: createEmail('user_a'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userB = await createUser({
      name: 'Audio User B',
      email: createEmail('user_b'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userACookie = `${COOKIE_NAME}=${generateToken(userA)}`;
    userBCookie = `${COOKIE_NAME}=${generateToken(userB)}`;

    // 3. Create speech records
    // User A: Speech with audio_url
    userASpeechWithAudio = await createSpeech({
      userId: userA.id,
      text: 'Speech with audio for User A',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
    });
    const userAPath = `users/${userA.id}/speeches/${userASpeechWithAudio.id}.mp3`;
    uploadedStorage.set(userAPath, mockAudioBytes);
    userASpeechWithAudio = await updateSpeechAudioUrlByIdAndUserId(
      userASpeechWithAudio.id,
      userA.id,
      userAPath
    );

    // User A: Speech with NULL audio_url (e.g. historical record before storage was added)
    userASpeechWithoutAudio = await createSpeech({
      userId: userA.id,
      text: 'Speech without audio for User A',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
    });

    // User B: Speech with audio_url
    userBSpeechWithAudio = await createSpeech({
      userId: userB.id,
      text: 'Speech with audio for User B',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
    });
    const userBPath = `users/${userB.id}/speeches/${userBSpeechWithAudio.id}.mp3`;
    uploadedStorage.set(userBPath, mockAudioBytes);
    userBSpeechWithAudio = await updateSpeechAudioUrlByIdAndUserId(
      userBSpeechWithAudio.id,
      userB.id,
      userBPath
    );
  });

  after(async () => {
    try {
      if (userA?.id) {
        await query('DELETE FROM speeches WHERE user_id = $1;', [userA.id]);
        await query('DELETE FROM users WHERE id = $1;', [userA.id]);
      }
      if (userB?.id) {
        await query('DELETE FROM speeches WHERE user_id = $1;', [userB.id]);
        await query('DELETE FROM users WHERE id = $1;', [userB.id]);
      }
    } catch (err) {
      console.warn('[Test Cleanup Warning]', err.message);
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });

    resetStorageClientOverride();
  });

  describe('A. Authenticated Owner Playback Success', () => {
    it('returns HTTP 200 raw audio/mpeg binary with accurate headers and correct storage path', async () => {
      requestedDownloadPaths = [];

      const response = await fetch(`${baseUrl}/api/history/${userASpeechWithAudio.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get('content-type'), 'audio/mpeg');
      assert.strictEqual(response.headers.get('cache-control'), 'private, no-store');
      assert.strictEqual(
        Number(response.headers.get('content-length')),
        mockAudioBytes.length
      );

      const buffer = Buffer.from(await response.arrayBuffer());
      assert.strictEqual(buffer.toString(), mockAudioBytes.toString());

      // Verify correct storage path was requested
      const expectedPath = `users/${userA.id}/speeches/${userASpeechWithAudio.id}.mp3`;
      assert.ok(requestedDownloadPaths.includes(expectedPath));
    });
  });

  describe('B. Unauthenticated Access Protection', () => {
    it('returns HTTP 401 Unauthorized when auth cookie is absent', async () => {
      const response = await fetch(`${baseUrl}/api/history/${userASpeechWithAudio.id}/audio`, {
        method: 'GET',
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Authentication required/);
    });

    it('returns HTTP 401 Unauthorized when invalid token is provided', async () => {
      const response = await fetch(`${baseUrl}/api/history/${userASpeechWithAudio.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: `${COOKIE_NAME}=invalid_tampered_token`,
        },
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
    });
  });

  describe('C. Nonexistent Valid UUID', () => {
    it('returns HTTP 404 with safe JSON envelope for non-existent record', async () => {
      const randomUuid = '99999999-9999-4999-8999-999999999999';
      const response = await fetch(`${baseUrl}/api/history/${randomUuid}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');
    });
  });

  describe('D. Invalid UUID Defense', () => {
    it('returns HTTP 404 without database exception or storage calls for invalid UUID format', async () => {
      requestedDownloadPaths = [];

      const response = await fetch(`${baseUrl}/api/history/invalid-non-uuid/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');

      // Must never have queried storage
      assert.strictEqual(requestedDownloadPaths.length, 0);
    });

    it('rejects path traversal in ID parameter without exception leakage', async () => {
      requestedDownloadPaths = [];

      const response = await fetch(`${baseUrl}/api/history/..%2F..%2Fetc%2Fpasswd/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(requestedDownloadPaths.length, 0);
    });
  });

  describe('E. Ownership Isolation', () => {
    it('returns HTTP 404 when User A requests User B speech audio and does not call storage', async () => {
      requestedDownloadPaths = [];

      const response = await fetch(`${baseUrl}/api/history/${userBSpeechWithAudio.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie, // User A requesting User B's speech
        },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');

      // Storage must not be accessed
      assert.strictEqual(requestedDownloadPaths.length, 0);
    });
  });

  describe('F. Speech with audio_url NULL', () => {
    it('returns HTTP 404 "Audio not available for this speech." when audio_url is null', async () => {
      requestedDownloadPaths = [];

      const response = await fetch(`${baseUrl}/api/history/${userASpeechWithoutAudio.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Audio not available for this speech.');

      assert.strictEqual(requestedDownloadPaths.length, 0);
    });
  });

  describe('G. Missing Storage Object', () => {
    it('returns safe HTTP 404 when database has audio_url but object is missing from storage', async () => {
      // Create speech record pointing to non-existent storage path
      const missingStoragePath = `users/${userA.id}/speeches/00000000-0000-4000-8000-000000000001.mp3`;
      let speechWithMissingFile = await createSpeech({
        userId: userA.id,
        text: 'Speech pointing to missing audio file',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: missingStoragePath,
      });

      const response = await fetch(`${baseUrl}/api/history/${speechWithMissingFile.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Audio not available for this speech.');

      // Clean up test record
      await query('DELETE FROM speeches WHERE id = $1;', [speechWithMissingFile.id]);
    });
  });

  describe('H. Storage Unexpected Failure', () => {
    it('returns safe HTTP 500 JSON without leaking secrets or internals on unexpected storage failure', async () => {
      // Temporarily inject error in download
      const secretKey = 'service_role_secret_must_not_leak_in_500';
      setStorageClientOverride({
        storage: {
          from: () => ({
            download: async () => ({
              data: null,
              error: { message: `Internal server failure with key ${secretKey}`, statusCode: 500 },
            }),
          }),
        },
      });

      const response = await fetch(`${baseUrl}/api/history/${userASpeechWithAudio.id}/audio`, {
        method: 'GET',
        headers: {
          Cookie: userACookie,
        },
      });

      assert.strictEqual(response.status, 500);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Failed to retrieve audio.');

      const rawJson = JSON.stringify(data);
      assert.strictEqual(rawJson.includes(secretKey), false);
      assert.strictEqual(rawJson.includes('speech-audio'), false);

      // Restore default mock storage client
      setStorageClientOverride({
        storage: {
          from: () => ({
            download: async (path) => {
              if (uploadedStorage.has(path)) {
                const buffer = uploadedStorage.get(path);
                return {
                  data: {
                    arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
                  },
                  error: null,
                };
              }
              return { data: null, error: { message: 'Object not found', statusCode: 404 } };
            },
          }),
        },
      });
    });
  });

  describe('I. Client Spoofing Resistance', () => {
    it('ignores client-supplied userId/user_id/ownerId in query string or body', async () => {
      // User A attempts to claim User B's speech via query params
      const response = await fetch(
        `${baseUrl}/api/history/${userBSpeechWithAudio.id}/audio?user_id=${userB.id}&userId=${userB.id}&ownerId=${userB.id}`,
        {
          method: 'GET',
          headers: {
            Cookie: userACookie,
          },
        }
      );

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');
    });
  });
});
