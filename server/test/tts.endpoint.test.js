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
import { setStorageClientOverride, resetStorageClientOverride } from '../config/storage.js';
import { setTtsProviderOverride, resetTtsProviderOverride } from '../services/tts.service.js';
import { ElevenLabsProvider } from '../services/providers/elevenlabs.provider.js';

describe('POST /api/tts HTTP Integration & Persistence Tests', () => {
  let server;
  let baseUrl;
  let testUser;
  let authCookie;
  let authToken;

  const testRunId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const testEmail = `ttstest_${testRunId}@speechengine.test`;

  before(async () => {
    // 0. Set mock storage client for isolated automated tests
    setStorageClientOverride({
      storage: {
        from: (bucket) => ({
          upload: async (path, buffer, options) => ({
            data: { path },
            error: null,
          }),
          remove: async (paths) => ({
            data: paths,
            error: null,
          }),
          getBucket: async (name) => ({
            data: { id: name, name, public: false },
            error: null,
          }),
        }),
      },
    });

    // 1. Start server on dynamic port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // 2. Create test user directly in PostgreSQL
    const passwordHash = await hashPassword('TestPassword123!');
    testUser = await createUser({
      name: 'TTS Test User',
      email: testEmail,
      passwordHash,
      tier: 'free',
      charLimit: 5000,
    });

    // 3. Issue authentication token & cookie
    authToken = generateToken(testUser);
    authCookie = `${COOKIE_NAME}=${authToken}`;
  });

  after(async () => {
    // Clean up test records (speeches first due to ON DELETE RESTRICT foreign key)
    try {
      if (testUser?.id) {
        await query('DELETE FROM speeches WHERE user_id = $1;', [testUser.id]);
        await query('DELETE FROM users WHERE id = $1;', [testUser.id]);
      }
    } catch (err) {
      console.warn('Test cleanup warning:', err.message);
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });

    resetStorageClientOverride();
    resetTtsProviderOverride();
  });

  // =========================================================================
  // 1. AUTHENTICATION & AUTHORIZATION TESTS
  // =========================================================================
  describe('Authentication Enforcement', () => {
    it('rejects unauthenticated request with 401 when no token is provided', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          language: 'en-US',
          voice: 'sarah',
        }),
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Authentication required/);
    });

    it('rejects request with 401 when token is invalid or forged', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${COOKIE_NAME}=invalid.jwt.token`,
        },
        body: JSON.stringify({
          text: 'Hello world',
        }),
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Invalid or expired authentication token/);
    });

    it('rejects request with 401 when token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: testUser.id, email: testUser.email },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );

      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${COOKIE_NAME}=${expiredToken}`,
        },
        body: JSON.stringify({
          text: 'Hello world',
        }),
      });

      assert.strictEqual(response.status, 401);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Invalid or expired authentication token/);
    });
  });

  // =========================================================================
  // 2. REQUEST VALIDATION TESTS
  // =========================================================================
  describe('Input Validation & Constraints', () => {
    it('returns 400 Bad Request when request body is empty', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({}),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Text is required/);
    });

    it('returns 400 when text is empty or whitespace only', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({ text: '   ' }),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Text must not be empty/);
    });

    it('returns 400 when text exceeds 5000 characters', async () => {
      const longText = 'a'.repeat(5001);
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({ text: longText }),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Text must not exceed 5000 characters/);
    });

    it('returns 400 when language is unsupported', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: 'Hello world',
          language: 'unsupported-lang',
        }),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Unsupported language/);
    });

    it('returns 400 when voice does not match selected language', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: 'Hello world',
          language: 'en-US',
          voice: 'priya', // Hindi voice
        }),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Unsupported voice/);
    });

    it('returns 400 when voice is completely unknown or invalid', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: 'Hello world',
          language: 'en-US',
          voice: 'completely-invalid-voice',
        }),
      });

      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Unsupported voice/);
    });

    it('accepts valid payload with only core fields (text, language, voice) and without speed, pitch, or volume', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: 'Core contract test text',
          language: 'en-US',
          voice: 'sarah',
        }),
      });

      // Core contract accepted -> reaches synthesis stage (not 400 Bad Request)
      assert.notStrictEqual(response.status, 400, 'Core payload must not fail validation');
    });

    it('ignores deprecated speed, pitch, or volume fields in request body without failing validation', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: 'Deprecated fields test text',
          language: 'en-US',
          voice: 'sarah',
          speed: 1.5,
          pitch: 2,
          volume: 80,
        }),
      });

      // Deprecated fields ignored -> must pass validation (not 400 Bad Request)
      assert.notStrictEqual(response.status, 400, 'Deprecated fields must be ignored and not trigger validation errors');
    });
  });

  // =========================================================================
  // 3. DATABASE PERSISTENCE & USER OWNERSHIP
  // =========================================================================
  describe('Persistence Repository & Strict Ownership', () => {
    it('creates speech record directly bound to user_id', async () => {
      const sampleText = `Direct persistence test for user ${testRunId}`;
      const record = await createSpeech({
        userId: testUser.id,
        text: sampleText,
        language: 'en-US',
        voice: 'sarah',
        audioUrl: null,
        duration: null,
        isFavorite: false,
      });

      assert.ok(record.id, 'Record must have generated UUID');
      assert.strictEqual(record.userId, testUser.id);
      assert.strictEqual(record.text, sampleText);
      assert.strictEqual(record.language, 'en-US');
      assert.strictEqual(record.voice, 'sarah');
      assert.strictEqual(record.speed, undefined, 'speed property must be undefined on record');
      assert.strictEqual(record.pitch, undefined, 'pitch property must be undefined on record');
      assert.strictEqual(record.volume, undefined, 'volume property must be undefined on record');
      assert.strictEqual(record.audioUrl, null);
      assert.strictEqual(record.duration, null);
      assert.strictEqual(record.isFavorite, false);
      assert.ok(record.createdAt);

      // Verify row actually exists in PostgreSQL
      const verified = await findSpeechById(record.id);
      assert.ok(verified);
      assert.strictEqual(verified.userId, testUser.id);
    });

    it('verifies that speed, pitch, and volume columns have been removed from speeches schema', async () => {
      const colResult = await query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'speeches' AND column_name IN ('speed', 'pitch', 'volume');
      `);
      assert.strictEqual(colResult.rows.length, 0, 'Speeches table must not contain speed, pitch, or volume columns');
    });

    it('prohibits storing binary audio buffer or base64 in PostgreSQL columns', async () => {
      // Speeches table does not have a binary/bytea or audio blob column
      const colResult = await query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'speeches' AND column_name IN ('audio_bytes', 'audio_blob', 'buffer');
      `);
      assert.strictEqual(colResult.rows.length, 0, 'Speeches table must not store audio binaries');
    });
  });

  // =========================================================================
  // 4. SYNTHESIS PIPELINE EXECUTION (AUTHENTICATED)
  // =========================================================================
  describe('Authenticated POST /api/tts Flow & Contract', () => {
    it('handles authenticated synthesis: returns audio/mpeg on success or provider error without leaking secrets', async () => {
      const spoofedForeignUserId = '00000000-0000-0000-0000-000000000000';
      const synthesisText = `SpeechEngine authenticated test ${Date.now()}`;

      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: synthesisText,
          language: 'en-US',
          voice: 'sarah',
          // Attempted client ownership injection: MUST BE COMPLETELY IGNORED
          user_id: spoofedForeignUserId,
          userId: spoofedForeignUserId,
          ownerId: spoofedForeignUserId,
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.status === 200) {
        // Contract: Success returns raw audio/mpeg binary
        assert.ok(contentType.includes('audio/mpeg'), `Expected audio/mpeg, got ${contentType}`);
        const buffer = await response.arrayBuffer();
        assert.ok(buffer.byteLength > 0, 'Audio response must contain bytes');

        // Verify that the record was persisted with req.user.id and NOT spoofed user_id
        const checkResult = await query(
          'SELECT * FROM speeches WHERE text = $1 ORDER BY created_at DESC LIMIT 1;',
          [synthesisText]
        );
        assert.strictEqual(checkResult.rows.length, 1, 'Exactly one speech record must be persisted');
        const persisted = checkResult.rows[0];
        assert.strictEqual(persisted.user_id, testUser.id, 'Speech must be owned by authenticated user');
        assert.notStrictEqual(persisted.user_id, spoofedForeignUserId, 'Spoofed user_id must be ignored');
        assert.strictEqual(
          persisted.audio_url,
          `users/${testUser.id}/speeches/${persisted.id}.mp3`,
          'audio_url must match deterministic storage path users/<userId>/speeches/<speechId>.mp3'
        );
        assert.strictEqual(persisted.duration, null, 'duration must be null');
        assert.strictEqual(persisted.is_favorite, false, 'is_favorite must default to false');
        assert.strictEqual(persisted.speed, undefined, 'speed column must not exist in row');
        assert.strictEqual(persisted.pitch, undefined, 'pitch column must not exist in row');
        assert.strictEqual(persisted.volume, undefined, 'volume column must not exist in row');

        // Contract: Success returns X-Speech-Id header matching persisted record UUID
        const speechIdHeader = response.headers.get('x-speech-id');
        assert.ok(speechIdHeader, 'Response must contain X-Speech-Id header');
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        assert.ok(UUID_REGEX.test(speechIdHeader), `X-Speech-Id must be a valid UUID, got: ${speechIdHeader}`);
        assert.strictEqual(speechIdHeader, persisted.id, 'X-Speech-Id must match the persisted speech record ID');

        // Verify CORS expose header
        const exposeHeaders = response.headers.get('access-control-expose-headers') || '';
        assert.ok(exposeHeaders.toLowerCase().includes('x-speech-id'), 'Access-Control-Expose-Headers must include X-Speech-Id');
      } else {
        // Contract: Provider error returns JSON error envelope
        assert.ok(contentType.includes('application/json'), `Expected application/json, got ${contentType}`);
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(typeof data.message, 'string');
        // Ensure no provider secrets leak in error JSON
        const rawJson = JSON.stringify(data);
        assert.strictEqual(rawJson.includes('xi-api-key'), false);
        assert.strictEqual(rawJson.includes('sk_'), false);
      }
    });

    it('accepts authorization via Bearer header as secondary fallback', async () => {
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          text: '', // Validation test with bearer
        }),
      });

      // Bearer token accepted -> reached validation layer -> 400
      assert.strictEqual(response.status, 400);
      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Text (is required|must not be empty)/);
    });

    it('handles database persistence failure: returns HTTP 500 JSON error and does not return audio', async () => {
      // Valid JWT token signed with secret for a non-existent user UUID
      // This will cause the foreign key constraint (speeches.user_id -> users.id) to fail during createSpeech()
      const nonExistentUserId = '00000000-0000-0000-0000-000000000099';
      const orphanedToken = jwt.sign(
        { id: nonExistentUserId, email: 'orphaned@speechengine.test' },
        config.jwtSecret,
        { expiresIn: '1h' }
      );

      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `${COOKIE_NAME}=${orphanedToken}`,
        },
        body: JSON.stringify({
          text: 'Database failure test invocation',
          language: 'en-US',
          voice: 'sarah',
        }),
      });

      const contentType = response.headers.get('content-type') || '';

      // Under either DB persistence failure or provider failure, the contract is:
      // Must NEVER return audio/mpeg binary
      // Must return application/json error envelope with success: false
      assert.ok(contentType.includes('application/json'), `Expected application/json error envelope, got ${contentType}`);
      assert.notStrictEqual(response.status, 200, 'Database failure must never return 200 OK');

      const data = await response.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(typeof data.message, 'string');
      // Verify no sensitive database credentials or SQL syntax leaks
      const rawJson = JSON.stringify(data);
      assert.strictEqual(rawJson.includes('postgres://'), false);
      assert.strictEqual(rawJson.includes('DATABASE_URL'), false);
    });

    it('handles storage upload failure: rolls back newly created DB speech and returns HTTP 500 JSON error', async () => {
      // Configure mock storage client to simulate upload failure
      setStorageClientOverride({
        storage: {
          from: () => ({
            upload: async () => ({
              data: null,
              error: { message: 'Simulated storage bucket outage' },
            }),
            remove: async () => ({ data: [], error: null }),
            getBucket: async () => ({ data: { id: 'speech-audio' }, error: null }),
          }),
        },
      });

      const uniqueFailureText = `Storage failure test text ${Date.now()}`;
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie,
        },
        body: JSON.stringify({
          text: uniqueFailureText,
          language: 'en-US',
          voice: 'sarah',
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      assert.ok(contentType.includes('application/json'), `Expected application/json, got ${contentType}`);

      if (response.status === 500) {
        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Failed to store generated audio.');

        // Compensation verification: DB speech row must have been rolled back / deleted
        const checkResult = await query(
          'SELECT * FROM speeches WHERE text = $1;',
          [uniqueFailureText]
        );
        assert.strictEqual(checkResult.rows.length, 0, 'Speech row must be deleted upon storage upload failure');
      }

      // Restore default mock storage client
      setStorageClientOverride({
        storage: {
          from: () => ({
            upload: async (path) => ({ data: { path }, error: null }),
            remove: async (paths) => ({ data: paths, error: null }),
            getBucket: async (name) => ({ data: { id: name, name, public: false }, error: null }),
          }),
        },
      });
    });

    it('handles TTS provider timeout: returns HTTP 504 JSON error, does not return audio, and persists no DB/storage data', async () => {
      const timeoutText = `Simulated provider timeout ${Date.now()}`;
      setTtsProviderOverride({
        synthesize: async () => ({
          success: false,
          statusCode: 504,
          message: 'Speech generation timed out. Please try again.',
        }),
      });

      try {
        const response = await fetch(`${baseUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
            'Cookie': authCookie,
          },
          body: JSON.stringify({
            text: timeoutText,
            language: 'en-US',
            voice: 'sarah',
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        assert.ok(contentType.includes('application/json'), `Expected application/json, got ${contentType}`);
        assert.strictEqual(response.status, 504);

        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech generation timed out. Please try again.');

        // Verify zero orphaned database rows
        const checkResult = await query(
          'SELECT * FROM speeches WHERE text = $1;',
          [timeoutText]
        );
        assert.strictEqual(checkResult.rows.length, 0, 'No DB row must be created when provider times out');
      } finally {
        resetTtsProviderOverride();
      }
    });

    it('handles real ElevenLabs provider timeout with hanging fetch: returns HTTP 504 JSON error and prevents orphaned records', async () => {
      const hangingText = `Hanging provider timeout ${Date.now()}`;
      const mockHangingFetch = () => new Promise((resolve) => setTimeout(resolve, 300));
      const testProvider = new ElevenLabsProvider();

      // Configure provider override to use ElevenLabsProvider with hanging fetch and fast timeout
      setTtsProviderOverride({
        synthesize: async (normalized) => {
          return await testProvider.synthesize(normalized, {
            apiKey: 'mock_test_key',
            fetchFn: mockHangingFetch,
            timeoutMs: 30,
          });
        },
      });

      try {
        const response = await fetch(`${baseUrl}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg',
            'Cookie': authCookie,
          },
          body: JSON.stringify({
            text: hangingText,
            language: 'en-US',
            voice: 'sarah',
          }),
        });

        const contentType = response.headers.get('content-type') || '';
        assert.ok(contentType.includes('application/json'), `Expected application/json, got ${contentType}`);
        assert.strictEqual(response.status, 504);

        const data = await response.json();
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'Speech generation timed out. Please try again.');

        // Verify zero orphaned database rows
        const checkResult = await query(
          'SELECT * FROM speeches WHERE text = $1;',
          [hangingText]
        );
        assert.strictEqual(checkResult.rows.length, 0, 'No DB row must be created when provider times out');
      } finally {
        resetTtsProviderOverride();
      }
    });
  });
});

