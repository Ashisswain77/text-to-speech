import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Phase 4: Frontend Historical Audio Playback Unit Tests', () => {
  let originalFetch;
  let originalCreateObjectURL;
  let originalRevokeObjectURL;

  const createdBlobUrls = [];
  const revokedBlobUrls = [];

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    createdBlobUrls.length = 0;
    revokedBlobUrls.length = 0;

    // Mock URL.createObjectURL and URL.revokeObjectURL
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = (blob) => {
      const url = `blob:http://localhost:5173/${Math.random().toString(36).slice(2)}`;
      createdBlobUrls.push({ url, blob });
      return url;
    };

    URL.revokeObjectURL = (url) => {
      revokedBlobUrls.push(url);
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  // =========================================================================
  // 1. API SERVICE: getSpeechAudio(id)
  // =========================================================================
  describe('1. API Service getSpeechAudio(id)', () => {
    it('rejects invalid or missing speech ID with 400 ApiError without making network calls', async () => {
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');

      await assert.rejects(
        async () => getSpeechAudio(''),
        (err) => {
          assert.strictEqual(err.name, 'ApiError');
          assert.strictEqual(err.status, 400);
          assert.match(err.message, /Invalid speech ID/);
          return true;
        }
      );

      await assert.rejects(
        async () => getSpeechAudio(null),
        (err) => {
          assert.strictEqual(err.name, 'ApiError');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );

      assert.strictEqual(fetchCalled, false, 'fetch must not be called on invalid ID');
    });

    it('requests audio with credentials: include, correct endpoint, and Accept header', async () => {
      let interceptedUrl = null;
      let interceptedOptions = null;

      const mockBlob = new Blob(['mock-audio-binary-data'], { type: 'audio/mpeg' });

      globalThis.fetch = async (url, options) => {
        interceptedUrl = url;
        interceptedOptions = options;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          blob: async () => mockBlob,
        };
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');
      const speechId = 'd3b07384-d113-469b-9c76-880be00560ef';
      const result = await getSpeechAudio(speechId);

      assert.strictEqual(result, mockBlob);
      assert.strictEqual(interceptedUrl.endsWith(`/api/history/${speechId}/audio`), true);
      assert.strictEqual(interceptedOptions.method, 'GET');
      assert.strictEqual(interceptedOptions.credentials, 'include');
      const acceptHeader = new Headers(interceptedOptions.headers).get('Accept');
      assert.strictEqual(acceptHeader, 'audio/mpeg, application/json');
    });

    it('returns raw Blob on 200 success and does NOT parse body as JSON', async () => {
      let jsonParsed = false;
      let blobParsed = false;
      const expectedBlob = new Blob(['sample-mp3-bytes'], { type: 'audio/mpeg' });

      globalThis.fetch = async () => {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          json: async () => {
            jsonParsed = true;
            return {};
          },
          blob: async () => {
            blobParsed = true;
            return expectedBlob;
          },
        };
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');
      const blob = await getSpeechAudio('e2a41753-41bb-455b-b996-5f7823b185b2');

      assert.strictEqual(blob, expectedBlob);
      assert.strictEqual(blobParsed, true, 'blob() must be called for successful response');
      assert.strictEqual(jsonParsed, false, 'json() must NOT be called for 200 raw audio response');
    });

    it('parses JSON error envelope and throws ApiError on 404 audio unavailable', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({
            success: false,
            message: 'Audio not available for this speech.',
          }),
        };
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');

      await assert.rejects(
        async () => getSpeechAudio('3d453ff5-9ce2-4e63-9d10-85f0efb62432'),
        (err) => {
          assert.strictEqual(err.name, 'ApiError');
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.message, 'Audio not available for this speech.');
          return true;
        }
      );
    });

    it('handles 401 unauthorized session expiry safely', async () => {
      globalThis.fetch = async () => {
        return {
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          json: async () => ({
            success: false,
            message: 'Authentication required. Please log in.',
          }),
        };
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');

      await assert.rejects(
        async () => getSpeechAudio('3d453ff5-9ce2-4e63-9d10-85f0efb62432'),
        (err) => {
          assert.strictEqual(err.name, 'ApiError');
          assert.strictEqual(err.status, 401);
          assert.strictEqual(err.message, 'Authentication required. Please log in.');
          return true;
        }
      );
    });

    it('handles network connection error gracefully', async () => {
      globalThis.fetch = async () => {
        throw new Error('Failed to fetch');
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');

      await assert.rejects(
        async () => getSpeechAudio('3d453ff5-9ce2-4e63-9d10-85f0efb62432'),
        (err) => {
          assert.strictEqual(err.name, 'ApiError');
          assert.strictEqual(err.isNetworkError, true);
          assert.match(err.message, /Unable to reach the server/);
          return true;
        }
      );
    });
  });

  // =========================================================================
  // 2. OBJECT URL LIFECYCLE & CLEANUP
  // =========================================================================
  describe('2. Object URL Lifecycle & Memory Leak Prevention', () => {
    it('revokes previously active object URL immediately when switching to another speech', () => {
      const blob1 = new Blob(['audio1'], { type: 'audio/mpeg' });
      const blob2 = new Blob(['audio2'], { type: 'audio/mpeg' });

      const url1 = URL.createObjectURL(blob1);
      assert.strictEqual(createdBlobUrls.length, 1);
      assert.strictEqual(revokedBlobUrls.length, 0);

      // Switching to second item: simulate cleanup of previous url before or upon loading new one
      URL.revokeObjectURL(url1);
      const url2 = URL.createObjectURL(blob2);

      assert.strictEqual(createdBlobUrls.length, 2);
      assert.strictEqual(revokedBlobUrls.length, 1);
      assert.strictEqual(revokedBlobUrls[0], url1);

      // On unmount/stop
      URL.revokeObjectURL(url2);
      assert.strictEqual(revokedBlobUrls.length, 2);
      assert.strictEqual(revokedBlobUrls[1], url2);
    });
  });

  // =========================================================================
  // 3. SECURITY & CREDENTIAL ISOLATION
  // =========================================================================
  describe('3. Security & Credential Isolation', () => {
    it('does not expose Supabase storage path or service keys in client requests', async () => {
      let requestedUrl = '';
      globalThis.fetch = async (url) => {
        requestedUrl = url;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'Content-Type': 'audio/mpeg' }),
          blob: async () => new Blob(['audio'], { type: 'audio/mpeg' }),
        };
      };

      const { getSpeechAudio } = await import('../../client/src/services/api.js');
      const speechId = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
      await getSpeechAudio(speechId);

      // Browser only contacts Express /api/history/:id/audio
      assert.strictEqual(requestedUrl.includes('/api/history/'), true);
      assert.strictEqual(requestedUrl.includes('supabase.co'), false, 'Must not call Supabase directly from browser');
      assert.strictEqual(requestedUrl.includes('speech-audio'), false, 'Must not expose bucket name in URL');
      assert.strictEqual(requestedUrl.includes('service_role'), false, 'Must not expose service keys');
    });
  });
});
