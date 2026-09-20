import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import { query } from '../config/db.js';
import { config } from '../config/env.js';
import { createUser } from '../repositories/user.repository.js';
import { createSpeech, findSpeechById } from '../repositories/speech.repository.js';
import { hashPassword } from '../utils/password.js';
import { generateToken, COOKIE_NAME } from '../utils/token.js';

describe('GET /api/history Integration Tests', () => {
  let server;
  let baseUrl;

  // --- User A: has speech records ---
  let userA;
  let userACookie;

  // --- User B: has speech records (for ownership isolation) ---
  let userB;
  let userBCookie;

  // --- User C: has NO speech records ---
  let userC;
  let userCCookie;

  const testRunId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createTestEmail = (suffix) => `historytest_${testRunId}_${suffix}@speechengine.test`;

  before(async () => {
    // 1. Start server on dynamic port
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
      name: 'History User A',
      email: createTestEmail('user_a'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userB = await createUser({
      name: 'History User B',
      email: createTestEmail('user_b'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    userC = await createUser({
      name: 'History User C (Empty)',
      email: createTestEmail('user_c'),
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    // 3. Issue authentication cookies
    userACookie = `${COOKIE_NAME}=${generateToken(userA)}`;
    userBCookie = `${COOKIE_NAME}=${generateToken(userB)}`;
    userCCookie = `${COOKIE_NAME}=${generateToken(userC)}`;

    // 4. Create speech records for User A
    await createSpeech({
      userId: userA.id,
      text: 'User A speech one',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
      duration: null,
      isFavorite: false,
    });

    // Small delay to ensure distinct created_at timestamps for ordering
    await new Promise((r) => setTimeout(r, 50));

    await createSpeech({
      userId: userA.id,
      text: 'User A speech two (newest)',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
      duration: null,
      isFavorite: false,
    });

    // 5. Create speech records for User B
    await createSpeech({
      userId: userB.id,
      text: 'User B private speech',
      language: 'en-US',
      voice: 'sarah',
      audioUrl: null,
      duration: null,
      isFavorite: false,
    });
  });

  after(async () => {
    // Clean up test records (speeches first due to foreign key)
    try {
      for (const user of [userA, userB, userC]) {
        if (user?.id) {
          await query('DELETE FROM speeches WHERE user_id = $1;', [user.id]);
          await query('DELETE FROM users WHERE id = $1;', [user.id]);
        }
      }
    } catch (err) {
      console.warn('Test cleanup warning:', err.message);
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  // =========================================================================
  // 1. AUTHENTICATION ENFORCEMENT
  // =========================================================================
  describe('Authentication Enforcement', () => {
    it('rejects unauthenticated request with 401 when no token is provided', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Authentication required/);
    });

    it('rejects request with 401 when token is invalid or forged', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': `${COOKIE_NAME}=invalid.jwt.token`,
        },
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
    });

    it('rejects request with 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: userA.id, email: userA.email },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );

      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': `${COOKIE_NAME}=${expiredToken}`,
        },
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
    });
  });

  // =========================================================================
  // 2. AUTHENTICATED USER WITH SPEECH RECORDS
  // =========================================================================
  describe('Authenticated User With Speech Records', () => {
    it('returns 200 with items array containing only the user\'s records', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userACookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data, 'Response must contain data object');
      assert.ok(Array.isArray(data.data.items), 'data.items must be an array');
      assert.strictEqual(data.data.items.length, 2, 'User A has exactly 2 records');

      // Verify all records belong to User A (userId should be stripped from response,
      // but if present, must match)
      for (const item of data.data.items) {
        assert.ok(item.id, 'Item must have id');
        assert.ok(item.text, 'Item must have text');
        assert.ok(item.language, 'Item must have language');
        assert.ok(item.voice, 'Item must have voice');
        assert.ok(item.createdAt, 'Item must have createdAt');
        assert.ok(item.updatedAt, 'Item must have updatedAt');
        assert.strictEqual(item.isFavorite, false);
        // Ensure no database-internal fields leak
        assert.strictEqual(item.user_id, undefined, 'Raw user_id must not be exposed');
      }
    });

    it('returns records ordered by created_at DESC (newest first)', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userACookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      const items = data.data.items;

      assert.strictEqual(items.length, 2);
      // Newest record first
      assert.ok(items[0].text.includes('newest'), 'First item should be the newest');

      // Verify chronological ordering
      const firstDate = new Date(items[0].createdAt);
      const secondDate = new Date(items[1].createdAt);
      assert.ok(firstDate >= secondDate, 'Items must be ordered newest first');
    });

    it('returns correct response shape with all expected fields', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userACookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();

      // Top-level shape
      assert.strictEqual(typeof data.success, 'boolean');
      assert.strictEqual(typeof data.data, 'object');
      assert.ok(Array.isArray(data.data.items));

      // Item shape
      const item = data.data.items[0];
      const expectedFields = ['id', 'text', 'language', 'voice', 'audioUrl', 'duration', 'isFavorite', 'createdAt', 'updatedAt'];
      for (const field of expectedFields) {
        assert.ok(field in item, `Item must contain field: ${field}`);
      }

      // Deprecated fields must not appear
      assert.strictEqual(item.speed, undefined, 'speed must not appear');
      assert.strictEqual(item.pitch, undefined, 'pitch must not appear');
      assert.strictEqual(item.volume, undefined, 'volume must not appear');
    });
  });

  // =========================================================================
  // 3. AUTHENTICATED USER WITH NO SPEECH RECORDS
  // =========================================================================
  describe('Authenticated User With No Speech Records', () => {
    it('returns 200 with empty items array', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userCCookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data, 'Response must contain data object');
      assert.ok(Array.isArray(data.data.items), 'data.items must be an array');
      assert.strictEqual(data.data.items.length, 0, 'Empty user has zero records');
    });
  });

  // =========================================================================
  // 4. OWNERSHIP ISOLATION
  // =========================================================================
  describe('Ownership Isolation', () => {
    it('User A cannot see User B\'s speech records', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userACookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      const items = data.data.items;

      // None of User A's results should contain User B's text
      for (const item of items) {
        assert.ok(
          !item.text.includes('User B'),
          'User A must not see User B\'s speech records'
        );
      }
    });

    it('User B cannot see User A\'s speech records', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': userBCookie,
        },
      });

      assert.strictEqual(response.status, 200);
      const data = await response.json();
      const items = data.data.items;

      assert.strictEqual(items.length, 1, 'User B has exactly 1 record');
      assert.ok(
        items[0].text.includes('User B'),
        'User B should only see their own records'
      );

      // None of User B's results should contain User A's text
      for (const item of items) {
        assert.ok(
          !item.text.includes('User A'),
          'User B must not see User A\'s speech records'
        );
      }
    });

    it('ignores client-provided userId query parameters', async () => {
      // Attempt to inject User B's ID via query string
      const response = await fetch(
        `${baseUrl}/api/history?userId=${userB.id}&user_id=${userB.id}`,
        {
          method: 'GET',
          headers: {
            'Cookie': userACookie,
          },
        }
      );

      assert.strictEqual(response.status, 200);
      const data = await response.json();

      // Must still return User A's records only
      for (const item of data.data.items) {
        assert.ok(
          !item.text.includes('User B'),
          'Query param injection must be ignored'
        );
      }
    });
  });

  // =========================================================================
  // 5. ERROR HANDLING
  // =========================================================================
  describe('Error Handling', () => {
    it('returns controlled JSON error when database query fails', async () => {
      // Use a valid JWT for a non-existent user (deleted from DB but valid token)
      const nonExistentUserId = '00000000-0000-0000-0000-000000000099';
      const orphanedToken = jwt.sign(
        { id: nonExistentUserId, email: 'orphaned@speechengine.test' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
        headers: {
          'Cookie': `${COOKIE_NAME}=${orphanedToken}`,
        },
      });

      // requireAuth should reject this because findUserById returns null
      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);

      // Ensure no internal details leak
      const rawJson = JSON.stringify(data);
      assert.strictEqual(rawJson.includes('postgres://'), false, 'Must not leak connection strings');
      assert.strictEqual(rawJson.includes('DATABASE_URL'), false, 'Must not leak env var names');
    });

    it('does not expose SQL errors or stack traces in error responses', async () => {
      const response = await fetch(`${baseUrl}/api/history`, {
        method: 'GET',
      });

      const data = await response.json();
      const rawJson = JSON.stringify(data);
      assert.strictEqual(rawJson.includes('SELECT'), false, 'Must not leak SQL');
      assert.strictEqual(rawJson.includes('FROM speeches'), false, 'Must not leak table names');
    });
  });

  // =========================================================================
  // 6. DELETE /api/history/:id TESTS
  // =========================================================================
  describe('DELETE /api/history/:id Tests', () => {
    let speechToDelete;
    let foreignSpeech;

    before(async () => {
      // Create a speech owned by User A to delete
      speechToDelete = await createSpeech({
        userId: userA.id,
        text: 'Speech specifically created to be deleted by User A',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });

      // Create a speech owned by User B for cross-user tests
      foreignSpeech = await createSpeech({
        userId: userB.id,
        text: 'User B private speech that User A cannot delete',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });
    });

    // A. Unauthenticated DELETE -> 401
    describe('A. Unauthenticated DELETE', () => {
      it('rejects unauthenticated request with 401 when no token is provided', async () => {
        const response = await fetch(`${baseUrl}/api/history/${speechToDelete.id}`, {
          method: 'DELETE',
        });

        assert.strictEqual(response.status, 401);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.match(data.message, /Authentication required/);
      });

      it('rejects DELETE request with 401 when token is invalid', async () => {
        const response = await fetch(`${baseUrl}/api/history/${speechToDelete.id}`, {
          method: 'DELETE',
          headers: {
            Cookie: `${COOKIE_NAME}=invalid.jwt.token`,
          },
        });

        assert.strictEqual(response.status, 401);
        const data = await response.json();
        assert.strictEqual(data.success, false);
      });

      it('rejects DELETE request with 401 when token is expired', async () => {
        const expiredToken = jwt.sign(
          { id: userA.id, email: userA.email },
          config.jwtSecret,
          { expiresIn: '-1s' }
        );

        const response = await fetch(`${baseUrl}/api/history/${speechToDelete.id}`, {
          method: 'DELETE',
          headers: {
            Cookie: `${COOKIE_NAME}=${expiredToken}`,
          },
        });

        assert.strictEqual(response.status, 401);
        const data = await response.json();
        assert.strictEqual(data.success, false);
      });
    });

    // B. Authenticated delete of own speech -> 200 -> record is actually deleted
    describe('B. Authenticated delete of own speech', () => {
      it('deletes own speech record returning 200 and permanently removes from database', async () => {
        // Verify record exists before deletion
        const beforeCheck = await findSpeechById(speechToDelete.id);
        assert.ok(beforeCheck, 'Record must exist in DB before deletion');

        const response = await fetch(`${baseUrl}/api/history/${speechToDelete.id}`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 200);
        const data = await response.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.message, 'Speech deleted successfully');

        // Verify record is permanently gone from DB
        const afterCheck = await findSpeechById(speechToDelete.id);
        assert.strictEqual(afterCheck, null, 'Record must be null after deletion');
      });
    });

    // C. Authenticated delete of nonexistent speech -> 404
    describe('C. Authenticated delete of nonexistent speech', () => {
      it('returns 404 when attempting to delete nonexistent speech with valid UUID', async () => {
        const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
        const response = await fetch(`${baseUrl}/api/history/${nonExistentUuid}`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');
      });

      it('returns 404 when attempting to delete with a non-UUID ID string without database crash', async () => {
        const response = await fetch(`${baseUrl}/api/history/non-existent-speech-id-123`, {
          method: 'DELETE',
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

    // D. Authenticated user attempting to delete another user's speech -> 404 -> untouched
    describe("D. Cross-user deletion isolation", () => {
      it("returns 404 when user attempts to delete another user's speech, leaving record untouched", async () => {
        // User A attempts to delete User B's speech record
        const response = await fetch(`${baseUrl}/api/history/${foreignSpeech.id}`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');

        // Verify User B's record is completely untouched in database
        const checkForeign = await findSpeechById(foreignSpeech.id);
        assert.ok(checkForeign, "Other user's record must remain intact in DB");
        assert.strictEqual(checkForeign.userId, userB.id);
        assert.strictEqual(checkForeign.text, foreignSpeech.text);
      });
    });

    // E. Client-supplied user_id/userId/ownerId cannot bypass ownership
    describe('E. Client-supplied identity parameters cannot bypass ownership', () => {
      it("ignores client-provided user_id, userId, and ownerId in request body and query params", async () => {
        // User A attempts to delete User B's speech while spoofing User B's identity
        const response = await fetch(
          `${baseUrl}/api/history/${foreignSpeech.id}?userId=${userB.id}&user_id=${userB.id}&ownerId=${userB.id}`,
          {
            method: 'DELETE',
            headers: {
              Cookie: userACookie,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userB.id,
              user_id: userB.id,
              ownerId: userB.id,
            }),
          }
        );

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');

        // User B's record still untouched
        const checkForeign = await findSpeechById(foreignSpeech.id);
        assert.ok(checkForeign, "Record must remain untouched despite injected parameters");
      });
    });

    // F. Database/error handling does not leak SQL details
    describe('F. Information Leakage Prevention', () => {
      it('does not leak SQL details, table names, or credentials in error responses', async () => {
        const response = await fetch(`${baseUrl}/api/history/' OR '1'='1`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        const data = await response.json();
        const rawJson = JSON.stringify(data);
        assert.strictEqual(rawJson.includes('DELETE FROM'), false, 'Must not leak SQL');
        assert.strictEqual(rawJson.includes('speeches'), false, 'Must not leak table name');
        assert.strictEqual(rawJson.includes('postgres://'), false, 'Must not leak DB URI');
        assert.strictEqual(rawJson.includes('DATABASE_URL'), false, 'Must not leak env vars');
      });
    });
  });

  // =========================================================================
  // 7. FAVORITES BACKEND API TESTS (POST/DELETE /api/history/:id/favorite)
  // =========================================================================
  describe('Favorites API Tests (POST/DELETE /api/history/:id/favorite)', () => {
    let speechFav;
    let foreignSpeechFav;

    before(async () => {
      // User A's speech for favorite tests (initially is_favorite = false)
      speechFav = await createSpeech({
        userId: userA.id,
        text: 'Speech clip for User A favorite testing',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });

      // User B's speech for isolation testing
      foreignSpeechFav = await createSpeech({
        userId: userB.id,
        text: 'Speech clip for User B private favorite isolation',
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });
    });

    // A. Unauthenticated favorite: POST without auth -> 401
    describe('A. Unauthenticated favorite', () => {
      it('rejects POST /api/history/:id/favorite with 401 when no token is provided', async () => {
        const response = await fetch(`${baseUrl}/api/history/${speechFav.id}/favorite`, {
          method: 'POST',
        });

        assert.strictEqual(response.status, 401);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.match(data.message, /Authentication required/);
      });
    });

    // B. Unauthenticated unfavorite: DELETE without auth -> 401
    describe('B. Unauthenticated unfavorite', () => {
      it('rejects DELETE /api/history/:id/favorite with 401 when no token is provided', async () => {
        const response = await fetch(`${baseUrl}/api/history/${speechFav.id}/favorite`, {
          method: 'DELETE',
        });

        assert.strictEqual(response.status, 401);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.match(data.message, /Authentication required/);
      });
    });

    // C. Authenticated user favorites own speech -> 200 -> is_favorite becomes true
    describe('C. Authenticated user favorites own speech', () => {
      it('marks speech as favorite returning 200 with isFavorite: true and updates updated_at', async () => {
        const beforeRecord = await findSpeechById(speechFav.id);
        assert.strictEqual(beforeRecord.isFavorite, false);
        const initialUpdatedAt = new Date(beforeRecord.updatedAt).getTime();

        // Brief pause to ensure timestamp advancement if sub-millisecond
        await new Promise((r) => setTimeout(r, 20));

        const response = await fetch(`${baseUrl}/api/history/${speechFav.id}/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 200);
        const data = await response.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.id, speechFav.id);
        assert.strictEqual(data.data.isFavorite, true);

        // Verify persistence in PostgreSQL
        const afterRecord = await findSpeechById(speechFav.id);
        assert.strictEqual(afterRecord.isFavorite, true);

        // Verify automatic updated_at timestamp trigger executed
        const newUpdatedAt = new Date(afterRecord.updatedAt).getTime();
        assert.ok(newUpdatedAt >= initialUpdatedAt, 'updated_at must be updated by trigger');
      });
    });

    // D. Authenticated user unfavorites own speech -> 200 -> is_favorite becomes false
    describe('D. Authenticated user unfavorites own speech', () => {
      it('removes speech from favorites returning 200 with isFavorite: false', async () => {
        const response = await fetch(`${baseUrl}/api/history/${speechFav.id}/favorite`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 200);
        const data = await response.json();
        assert.strictEqual(data.success, true);
        assert.strictEqual(data.data.id, speechFav.id);
        assert.strictEqual(data.data.isFavorite, false);

        // Verify persistence in PostgreSQL
        const afterRecord = await findSpeechById(speechFav.id);
        assert.strictEqual(afterRecord.isFavorite, false);
      });
    });

    // E. User A cannot favorite User B's speech -> 404 -> User B record remains unchanged
    describe("E. User A cannot favorite User B's speech", () => {
      it("returns 404 when User A attempts to favorite User B's speech, leaving record unchanged", async () => {
        const response = await fetch(`${baseUrl}/api/history/${foreignSpeechFav.id}/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');

        // Verify User B's record in PostgreSQL is unchanged
        const record = await findSpeechById(foreignSpeechFav.id);
        assert.strictEqual(record.isFavorite, false);
        assert.strictEqual(record.userId, userB.id);
      });
    });

    // F. User A cannot unfavorite User B's speech -> 404 -> User B record remains unchanged
    describe("F. User A cannot unfavorite User B's speech", () => {
      it("returns 404 when User A attempts to unfavorite User B's speech, leaving record unchanged", async () => {
        // First, User B marks their own speech as favorite
        await fetch(`${baseUrl}/api/history/${foreignSpeechFav.id}/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userBCookie,
          },
        });
        const foreignBefore = await findSpeechById(foreignSpeechFav.id);
        assert.strictEqual(foreignBefore.isFavorite, true);

        // User A attempts to unfavorite User B's speech
        const response = await fetch(`${baseUrl}/api/history/${foreignSpeechFav.id}/favorite`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');

        // Verify User B's record remains favorite
        const foreignAfter = await findSpeechById(foreignSpeechFav.id);
        assert.strictEqual(foreignAfter.isFavorite, true);
      });
    });

    // G. Client-supplied user_id/userId/ownerId cannot bypass ownership
    describe('G. Client-supplied identity parameters cannot bypass ownership', () => {
      it('ignores client-supplied user_id, userId, ownerId in body and query params', async () => {
        // User A tries to favorite User B's speech while spoofing User B's ID
        const response = await fetch(
          `${baseUrl}/api/history/${foreignSpeechFav.id}/favorite?userId=${userB.id}&user_id=${userB.id}&ownerId=${userB.id}`,
          {
            method: 'POST',
            headers: {
              Cookie: userACookie,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userB.id,
              user_id: userB.id,
              ownerId: userB.id,
            }),
          }
        );

        assert.strictEqual(response.status, 404);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech not found');
      });
    });

    // H. Nonexistent speech ID -> 404
    describe('H. Nonexistent speech ID', () => {
      it('returns 404 for valid nonexistent UUID on POST and DELETE', async () => {
        const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

        const postRes = await fetch(`${baseUrl}/api/history/${nonExistentUuid}/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userACookie,
          },
        });
        assert.strictEqual(postRes.status, 404);
        const postData = await postRes.json();
        assert.strictEqual(postData.success, false);
        assert.strictEqual(postData.message, 'Speech not found');

        const delRes = await fetch(`${baseUrl}/api/history/${nonExistentUuid}/favorite`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });
        assert.strictEqual(delRes.status, 404);
        const delData = await delRes.json();
        assert.strictEqual(delData.success, false);
        assert.strictEqual(delData.message, 'Speech not found');
      });

      it('returns 404 for non-UUID string on POST and DELETE without database crash', async () => {
        const postRes = await fetch(`${baseUrl}/api/history/invalid-uuid-id/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userACookie,
          },
        });
        assert.strictEqual(postRes.status, 404);
        const postData = await postRes.json();
        assert.strictEqual(postData.success, false);
        assert.strictEqual(postData.message, 'Speech not found');

        const delRes = await fetch(`${baseUrl}/api/history/invalid-uuid-id/favorite`, {
          method: 'DELETE',
          headers: {
            Cookie: userACookie,
          },
        });
        assert.strictEqual(delRes.status, 404);
        const delData = await delRes.json();
        assert.strictEqual(delData.success, false);
        assert.strictEqual(delData.message, 'Speech not found');
      });
    });

    // I. Database/error handling does not expose SQL details
    describe('I. Database error handling does not expose SQL details', () => {
      it('does not leak SQL details, table names, or connection strings', async () => {
        const response = await fetch(`${baseUrl}/api/history/' OR 1=1 --/favorite`, {
          method: 'POST',
          headers: {
            Cookie: userACookie,
          },
        });

        const data = await response.json();
        const rawJson = JSON.stringify(data);
        assert.strictEqual(rawJson.includes('UPDATE speeches'), false, 'Must not leak SQL');
        assert.strictEqual(rawJson.includes('is_favorite'), false, 'Must not leak column names');
        assert.strictEqual(rawJson.includes('postgres://'), false, 'Must not leak DB URI');
        assert.strictEqual(rawJson.includes('DATABASE_URL'), false, 'Must not leak env vars');
      });
    });
  });
});
