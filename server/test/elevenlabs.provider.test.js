import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ElevenLabsProvider,
  resolveProviderVoiceId,
  mapProviderSpeed,
  ELEVENLABS_VOICE_MAP,
  DEFAULT_ELEVENLABS_VOICE_ID,
} from '../services/providers/elevenlabs.provider.js';

describe('ElevenLabs Provider Unit Tests', () => {
  describe('Voice ID Mapping', () => {
    it('maps all defined SpeechEngine voice IDs to valid ElevenLabs voice ID strings', () => {
      const expectedVoices = [
        'sarah', 'david', 'sonia', 'marcus',
        'priya', 'aarav', 'diya', 'karan',
        'ananya', 'rohan', 'elena', 'carlos',
        'chloe', 'lucas', 'hannah', 'felix',
      ];

      for (const voiceId of expectedVoices) {
        const resolved = resolveProviderVoiceId(voiceId);
        assert.ok(resolved, `Voice ${voiceId} must resolve to a valid string`);
        assert.strictEqual(typeof resolved, 'string');
        assert.ok(resolved.length > 5, `Voice ${voiceId} should resolve to a non-trivial ID`);
      }
    });

    it('falls back to default verified usable voice ID (Sarah) for unknown or empty voices', () => {
      assert.strictEqual(DEFAULT_ELEVENLABS_VOICE_ID, 'EXAVITQu4vr4xnSDxMaL');
      assert.strictEqual(resolveProviderVoiceId('unknown_voice'), 'EXAVITQu4vr4xnSDxMaL');
      assert.strictEqual(resolveProviderVoiceId(''), 'EXAVITQu4vr4xnSDxMaL');
      assert.strictEqual(resolveProviderVoiceId(null), 'EXAVITQu4vr4xnSDxMaL');
      assert.strictEqual(resolveProviderVoiceId(undefined), 'EXAVITQu4vr4xnSDxMaL');
    });

    it('handles voice case-insensitively and trims whitespace', () => {
      assert.strictEqual(resolveProviderVoiceId('  SARAH  '), ELEVENLABS_VOICE_MAP['sarah']);
      assert.strictEqual(resolveProviderVoiceId('David'), ELEVENLABS_VOICE_MAP['david']);
    });
  });

  describe('Speed Parameter Mapping', () => {
    it('preserves valid speed factors within bounds', () => {
      assert.strictEqual(mapProviderSpeed(0.5), 0.5);
      assert.strictEqual(mapProviderSpeed(1.0), 1.0);
      assert.strictEqual(mapProviderSpeed(1.5), 1.5);
      assert.strictEqual(mapProviderSpeed(2.0), 2.0);
    });

    it('clamps extreme speed values within [0.5, 2.0]', () => {
      assert.strictEqual(mapProviderSpeed(0.1), 0.5);
      assert.strictEqual(mapProviderSpeed(5.0), 2.0);
    });

    it('falls back to 1.0 for non-numeric speeds', () => {
      assert.strictEqual(mapProviderSpeed(null), 1.0);
      assert.strictEqual(mapProviderSpeed(undefined), 1.0);
      assert.strictEqual(mapProviderSpeed(NaN), 1.0);
      assert.strictEqual(mapProviderSpeed('fast'), 1.0);
    });
  });

  describe('Missing API Key Handling', () => {
    it('returns statusCode 500 when API key is missing or empty', async () => {
      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Test phrase', voice: 'sarah', speed: 1.0 },
        { apiKey: '' }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 500);
      assert.match(result.message, /ElevenLabs API key is not configured/);
    });
  });

  describe('API Synthesis Flow (Mocked Network)', () => {
    it('successfully calls ElevenLabs API and parses MP3 binary response', async () => {
      let capturedUrl = '';
      let capturedHeaders = {};
      let capturedBody = null;

      const dummyAudioBytes = new Uint8Array([0xFF, 0xFB, 0x90, 0x64]); // Mock MP3 bytes

      const mockFetch = async (url, init) => {
        capturedUrl = url;
        capturedHeaders = init.headers;
        capturedBody = JSON.parse(init.body);

        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'audio/mpeg' }),
          arrayBuffer: async () => dummyAudioBytes.buffer.slice(0, 4),
        };
      };

      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Hello, this is a test speech.', voice: 'david', speed: 1.5 },
        {
          apiKey: 'test_elevenlabs_key_123',
          modelId: 'eleven_multilingual_v2',
          fetchFn: mockFetch,
        }
      );

      // Verify request to ElevenLabs
      assert.ok(capturedUrl.includes('/v1/text-to-speech/pNInz6obpgDQGcFmaJgB'));
      assert.ok(capturedUrl.includes('output_format=mp3_44100_128'));
      assert.strictEqual(capturedHeaders['xi-api-key'], 'test_elevenlabs_key_123');
      assert.strictEqual(capturedHeaders['Content-Type'], 'application/json');
      assert.strictEqual(capturedHeaders['Accept'], 'audio/mpeg');

      assert.strictEqual(capturedBody.text, 'Hello, this is a test speech.');
      assert.strictEqual(capturedBody.model_id, 'eleven_multilingual_v2');
      assert.strictEqual(capturedBody.voice_settings.speed, 1.5);
      assert.strictEqual(capturedBody.voice_settings.stability, 0.5);

      // Verify returned result
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(result.data.provider, 'elevenlabs');
      assert.strictEqual(result.data.format, 'mp3');
      assert.strictEqual(result.data.characterCount, 29);
      assert.strictEqual(result.data.audioSizeBytes, 4);
      assert.ok(Buffer.isBuffer(result.audioBuffer));
      assert.strictEqual(result.audioBuffer.length, 4);
    });

    it('safely handles 401 Unauthorized from ElevenLabs without leaking secrets', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ detail: { status: 'invalid_api_key', message: 'Invalid API key' } }),
      });

      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Valid test text', voice: 'sarah', speed: 1.0 },
        { apiKey: 'secret_invalid_key', fetchFn: mockFetch }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 502);
      assert.match(result.message, /ElevenLabs authentication failed/);
      assert.doesNotMatch(result.message, /secret_invalid_key/);
    });

    it('safely handles 402 Payment Required for Voice Library voices on Free plan', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 402,
        statusText: 'Payment Required',
        json: async () => ({ detail: { status: 'voice_not_available', message: 'Free users cannot use library voices via the API. Please upgrade your subscription to use this voice.' } }),
      });

      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Valid test text', voice: 'priya', speed: 1.0 },
        { apiKey: 'valid_key', fetchFn: mockFetch }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 402);
      assert.match(result.message, /Free users cannot use library voices via the API/);
    });

    it('safely handles 429 Rate Limit from ElevenLabs', async () => {
      const mockFetch = async () => ({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ detail: { status: 'quota_exceeded', message: 'Quota exceeded' } }),
      });

      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Valid test text', voice: 'sarah', speed: 1.0 },
        { apiKey: 'valid_key', fetchFn: mockFetch }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 429);
      assert.match(result.message, /rate limit or quota exceeded/);
    });

    it('safely handles network connectivity failures', async () => {
      const mockFetch = async () => {
        throw new Error('getaddrinfo ENOTFOUND api.elevenlabs.io');
      };

      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Valid test text', voice: 'sarah', speed: 1.0 },
        { apiKey: 'valid_key', fetchFn: mockFetch }
      );

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.statusCode, 503);
      assert.match(result.message, /Failed to reach ElevenLabs API/);
    });
  });
});
