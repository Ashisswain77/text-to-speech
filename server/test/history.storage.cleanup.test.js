import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import { query } from '../config/db.js';
import { createUser } from '../repositories/user.repository.js';
import { createSpeech, findSpeechById } from '../repositories/speech.repository.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, COOKIE_NAME } from '../utils/token.js';
import {
  setStorageClientOverride,
  resetStorageClientOverride,
} from '../config/storage.js';

/**
 * STOR-01 — Storage Cleanup on Speech Deletion
 *
 * Tests that DELETE /api/history/:id cleans up both the PostgreSQL record
 * and the corresponding Supabase Storage audio object.
 *
 * These are integration tests that use a real database but a mocked storage
 * client, so we can verify the full request path through controller → service
 * → repository while controlling storage outcomes.
 */
describe('STOR-01: Storage Cleanup on Speech Deletion', () => {
  let server;
  let baseUrl;

  let userOwner;
  let userOwnerCookie;

  let userOther;
  let userOtherCookie;

  const testRunId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createTestEmail = (suffix) => `stor01_${testRunId}_${suffix}@speechengine.test`;

  // Track storage mock calls
  let storageRemoveCalls;
  let storageRemoveBehavior;

  /**
   * Sets up a mock Supabase client that records storage.remove() calls
   * and returns configurable results.
   */
  function installStorageMock(behavior = 'success') {
    storageRemoveCalls = [];
    storageRemoveBehavior = behavior;

    setStorageClientOverride({
      storage: {
        from: (bucket) => ({
          remove: async (paths) => {
            storageRemoveCalls.push({ bucket, paths });
            if (storageRemoveBehavior === 'success') {
              return { data: paths, error: null };
            }
            if (storageRemoveBehavior === 'fail') {
              return { data: null, error: { message: 'Storage service unavailable' } };
            }
            // 'idempotent-missing' — same as success (Supabase behavior)
            return { data: [], error: null };
          },
        }),
      },
    });
  }

  function clearStorageMock() {
    resetStorageClientOverride();
    storageRemoveCalls = [];
  }

  before(async () => {
    // Start server on dynamic port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create test users
    const passwordHash = await hashPassword('TestPassword123!');

    userOwner = await createUser({
      name: 'STOR01 Owner',
      email: createTestEmail('owner'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userOther = await createUser({
      name: 'STOR01 Other User',
      email: createTestEmail('other'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userOwnerCookie = `${COOKIE_NAME}=${generateToken(userOwner)}`;
    userOtherCookie = `${COOKIE_NAME}=${generateToken(userOther)}`;
  });

  after(async () => {
    clearStorageMock();

    try {
      for (const user of [userOwner, userOther]) {
        if (user?.id) {
          await query('DELETE FROM speeches WHERE user_id = $1;', [user.id]);
          await query('DELETE FROM users WHERE id = $1;', [user.id]);
        }
      }
    } catch (err) {
      console.warn('STOR-01 test cleanup warning:', err.message);
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  // =========================================================================
  // 1. Owner deletes speech WITH audio_url → storage + DB cleanup → 200
  // =========================================================================
  describe('1. Owner deletes speech with audio_url', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech with audio',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/test-speech-with-audio.mp3`,
        duration: 5.0,
        isFavorite: false,
      });
    });

    it('calls storage delete with the DB-derived audio_url and returns 200', async () => {
      installStorageMock('success');

      const response = await fetch(`${baseUrl}/api/history/${speech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Speech deleted successfully');

      // Verify storage was called with the correct path
      assert.strictEqual(storageRemoveCalls.length, 1, 'Storage remove must be called exactly once');
      assert.deepStrictEqual(
        storageRemoveCalls[0].paths,
        [`users/${userOwner.id}/speeches/test-speech-with-audio.mp3`]
      );

      // Verify DB record is permanently deleted
      const afterCheck = await findSpeechById(speech.id);
      assert.strictEqual(afterCheck, null, 'DB record must be deleted');

      clearStorageMock();
    });
  });

  // =========================================================================
  // 2. Owner deletes speech with audio_url = NULL → no storage call → 200
  // =========================================================================
  describe('2. Owner deletes speech with null audio_url', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech without audio',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });
    });

    it('skips storage deletion and successfully deletes DB record', async () => {
      installStorageMock('success');

      const response = await fetch(`${baseUrl}/api/history/${speech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Speech deleted successfully');

      // Verify storage was NOT called
      assert.strictEqual(storageRemoveCalls.length, 0, 'Storage remove must NOT be called when audio_url is null');

      // Verify DB record is permanently deleted
      const afterCheck = await findSpeechById(speech.id);
      assert.strictEqual(afterCheck, null, 'DB record must be deleted');

      clearStorageMock();
    });
  });

  // =========================================================================
  // 3. Storage object already missing → idempotent success → DB delete → 200
  // =========================================================================
  describe('3. Storage object already missing (idempotent)', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech with missing storage object',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/already-gone.mp3`,
        duration: 3.0,
        isFavorite: false,
      });
    });

    it('proceeds with DB deletion when storage reports success for missing object', async () => {
      installStorageMock('idempotent-missing');

      const response = await fetch(`${baseUrl}/api/history/${speech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);

      // Storage was called (object path was attempted)
      assert.strictEqual(storageRemoveCalls.length, 1);

      // DB record is gone
      const afterCheck = await findSpeechById(speech.id);
      assert.strictEqual(afterCheck, null);

      clearStorageMock();
    });
  });

  // =========================================================================
  // 4. Storage deletion fails → DB NOT deleted → 500
  // =========================================================================
  describe('4. Storage deletion fails', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech with storage failure',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/storage-will-fail.mp3`,
        duration: 2.0,
        isFavorite: false,
      });
    });

    it('preserves the DB record and returns 500 when storage delete fails', async () => {
      installStorageMock('fail');

      const response = await fetch(`${baseUrl}/api/history/${speech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 500);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Failed to delete speech/i);

      // DB record must still exist
      const afterCheck = await findSpeechById(speech.id);
      assert.ok(afterCheck, 'DB record must be preserved when storage deletion fails');
      assert.strictEqual(afterCheck.id, speech.id);

      // No credentials or internals leaked
      const rawJson = JSON.stringify(data);
      assert.strictEqual(rawJson.includes('supabase'), false, 'Must not leak Supabase details');
      assert.strictEqual(rawJson.includes('service_role'), false, 'Must not leak service role info');

      clearStorageMock();
    });
  });

  // =========================================================================
  // 5. Another user's speech → 404, storage NOT called, DB unchanged
  // =========================================================================
  describe("5. Another user's speech", () => {
    let ownerSpeech;

    before(async () => {
      ownerSpeech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 owner-only speech for cross-user test',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/cross-user-test.mp3`,
        duration: 4.0,
        isFavorite: false,
      });
    });

    it('returns 404 without calling storage or modifying DB', async () => {
      installStorageMock('success');

      // userOther attempts to delete userOwner's speech
      const response = await fetch(`${baseUrl}/api/history/${ownerSpeech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOtherCookie },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');

      // Storage must NOT be called
      assert.strictEqual(storageRemoveCalls.length, 0, 'Storage must not be called for unowned speech');

      // DB record must be untouched
      const afterCheck = await findSpeechById(ownerSpeech.id);
      assert.ok(afterCheck, 'Record must still exist in DB');
      assert.strictEqual(afterCheck.userId, userOwner.id);

      clearStorageMock();
    });
  });

  // =========================================================================
  // 6. Nonexistent speech → 404, storage NOT called
  // =========================================================================
  describe('6. Nonexistent speech', () => {
    it('returns 404 without calling storage for a valid but nonexistent UUID', async () => {
      installStorageMock('success');

      const nonExistentUuid = '00000000-0000-0000-0000-000000000099';
      const response = await fetch(`${baseUrl}/api/history/${nonExistentUuid}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Speech not found');

      // Storage must NOT be called
      assert.strictEqual(storageRemoveCalls.length, 0, 'Storage must not be called for nonexistent speech');

      clearStorageMock();
    });

    it('returns 404 without calling storage for a non-UUID ID', async () => {
      installStorageMock('success');

      const response = await fetch(`${baseUrl}/api/history/not-a-valid-uuid`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 404);
      const data = await response.json();
      assert.strictEqual(data.success, false);

      assert.strictEqual(storageRemoveCalls.length, 0);

      clearStorageMock();
    });
  });

  // =========================================================================
  // 7. Client-supplied fake audio_url → ignored, DB value authoritative
  // =========================================================================
  describe('7. Client-supplied fake audio_url is ignored', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech for fake audio_url test',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/real-audio-path.mp3`,
        duration: 1.5,
        isFavorite: false,
      });
    });

    it('uses DB-stored audio_url ignoring client body and query injections', async () => {
      installStorageMock('success');

      const fakeAudioUrl = 'users/attacker-id/speeches/evil.mp3';

      const response = await fetch(
        `${baseUrl}/api/history/${speech.id}?audio_url=${encodeURIComponent(fakeAudioUrl)}&audioUrl=${encodeURIComponent(fakeAudioUrl)}`,
        {
          method: 'DELETE',
          headers: {
            Cookie: userOwnerCookie,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: fakeAudioUrl,
            audioUrl: fakeAudioUrl,
          }),
        }
      );

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);

      // Storage must have been called with the REAL DB audio_url, not the fake one
      assert.strictEqual(storageRemoveCalls.length, 1);
      assert.deepStrictEqual(
        storageRemoveCalls[0].paths,
        [`users/${userOwner.id}/speeches/real-audio-path.mp3`],
        'Storage must use the DB-stored audio_url, not the client-supplied fake'
      );

      // Verify the fake path was never sent to storage
      const allPaths = storageRemoveCalls.flatMap((c) => c.paths);
      assert.strictEqual(
        allPaths.includes(fakeAudioUrl),
        false,
        'Client-supplied audio_url must never reach storage'
      );

      clearStorageMock();
    });
  });

  // =========================================================================
  // 8. Security: no credentials, no internals leaked in error responses
  // =========================================================================
  describe('8. Security - no leaks in error responses', () => {
    let speech;

    before(async () => {
      speech = await createSpeech({
        userId: userOwner.id,
        text: 'STOR-01 speech for security leak test',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: `users/${userOwner.id}/speeches/security-test.mp3`,
        duration: 1.0,
        isFavorite: false,
      });
    });

    it('does not expose storage internals, credentials, or stack traces in 500 responses', async () => {
      installStorageMock('fail');

      const response = await fetch(`${baseUrl}/api/history/${speech.id}`, {
        method: 'DELETE',
        headers: { Cookie: userOwnerCookie },
      });

      assert.strictEqual(response.status, 500);
      const data = await response.json();
      const rawJson = JSON.stringify(data);

      assert.strictEqual(rawJson.includes('SUPABASE_URL'), false, 'Must not leak env var names');
      assert.strictEqual(rawJson.includes('SUPABASE_SERVICE_ROLE_KEY'), false, 'Must not leak env var names');
      assert.strictEqual(rawJson.includes('postgres://'), false, 'Must not leak connection strings');
      assert.strictEqual(rawJson.includes('service_role'), false, 'Must not leak key names');
      assert.strictEqual(rawJson.includes('stack'), false, 'Must not leak stack traces');
      assert.strictEqual(rawJson.includes('Storage service unavailable'), false, 'Must not leak raw storage errors');

      clearStorageMock();
    });
  });
});
