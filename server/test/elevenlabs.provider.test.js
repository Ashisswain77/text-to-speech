import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ElevenLabsProvider,
  resolveProviderVoiceId,
  mapProviderSpeed,
  mapProviderPitch,
  applyAudioPitch,
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
    it('preserves valid speed factors within bounds [0.7, 1.2]', () => {
      assert.strictEqual(mapProviderSpeed(0.7), 0.7);
      assert.strictEqual(mapProviderSpeed(0.8), 0.8);
      assert.strictEqual(mapProviderSpeed(0.9), 0.9);
      assert.strictEqual(mapProviderSpeed(1.0), 1.0);
      assert.strictEqual(mapProviderSpeed(1.1), 1.1);
      assert.strictEqual(mapProviderSpeed(1.2), 1.2);
    });

    it('clamps extreme speed values within [0.7, 1.2]', () => {
      assert.strictEqual(mapProviderSpeed(0.5), 0.7);
      assert.strictEqual(mapProviderSpeed(0.1), 0.7);
      assert.strictEqual(mapProviderSpeed(1.5), 1.2);
      assert.strictEqual(mapProviderSpeed(2.0), 1.2);
      assert.strictEqual(mapProviderSpeed(5.0), 1.2);
    });

    it('falls back to 1.0 for non-numeric speeds', () => {
      assert.strictEqual(mapProviderSpeed(null), 1.0);
      assert.strictEqual(mapProviderSpeed(undefined), 1.0);
      assert.strictEqual(mapProviderSpeed(NaN), 1.0);
      assert.strictEqual(mapProviderSpeed('fast'), 1.0);
    });
  });

  describe('Pitch Parameter Mapping', () => {
    it('preserves valid pitch values within [-10, 10]', () => {
      assert.strictEqual(mapProviderPitch(-10), -10);
      assert.strictEqual(mapProviderPitch(-5), -5);
      assert.strictEqual(mapProviderPitch(0), 0);
      assert.strictEqual(mapProviderPitch(5), 5);
      assert.strictEqual(mapProviderPitch(10), 10);
    });

    it('clamps extreme pitch values within [-10, 10]', () => {
      assert.strictEqual(mapProviderPitch(-15), -10);
      assert.strictEqual(mapProviderPitch(25), 10);
    });

    it('falls back to 0 for non-numeric or missing pitch', () => {
      assert.strictEqual(mapProviderPitch(null), 0);
      assert.strictEqual(mapProviderPitch(undefined), 0);
      assert.strictEqual(mapProviderPitch(NaN), 0);
      assert.strictEqual(mapProviderPitch('high'), 0);
    });

    it('applies audio pitch processing without mutating audio integrity on empty/zero', () => {
      const buffer = Buffer.from([0x01, 0x02]);
      assert.strictEqual(applyAudioPitch(buffer, 0), buffer);
      assert.strictEqual(applyAudioPitch(null, 5), null);
    });
  });

  describe('Missing API Key Handling', () => {
    it('returns statusCode 500 when API key is missing or empty', async () => {
      const provider = new ElevenLabsProvider();
      const result = await provider.synthesize(
        { text: 'Test phrase', voice: 'sarah', speed: 1.0, pitch: 0 },
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
        { text: 'Hello, this is a test speech.', voice: 'david', speed: 1.1, pitch: 3 },
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
      assert.strictEqual(capturedBody.voice_settings.speed, 1.1);
      assert.strictEqual(capturedBody.voice_settings.stability, 0.5);
      // Verify pitch and volume are NOT sent in ElevenLabs voice_settings
      assert.strictEqual(capturedBody.voice_settings.pitch, undefined);
      assert.strictEqual(capturedBody.voice_settings.volume, undefined);

      // Verify returned result
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(result.data.provider, 'elevenlabs');
      assert.strictEqual(result.data.format, 'mp3');
      assert.strictEqual(result.data.characterCount, 29);
      assert.strictEqual(result.data.audioSizeBytes, 4);
      assert.strictEqual(result.data.pitch, 3);
      assert.strictEqual(result.data.speed, 1.1);
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

  describe('Voice Discovery Flow (getVoices)', () => {
    it('queries official ElevenLabs v2/voices endpoint with xi-api-key', async () => {
      let capturedUrl = '';
      let capturedHeaders = {};

      const mockFetch = async (url, init = {}) => {
        capturedUrl = url;
        capturedHeaders = init.headers || {};
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            voices: [
              {
                voice_id: 'v2_voice_abc',
                name: 'Sarah - Mature, Reassuring',
                category: 'premade',
                labels: { language: 'en', gender: 'female', accent: 'american', use_case: 'conversational' },
                verified_languages: [{ locale: 'en-US' }, { locale: 'hi-IN' }],
              },
            ],
          }),
        };
      };

      const provider = new ElevenLabsProvider();
      const result = await provider.getVoices({
        apiKey: 'secret_key_v2_test',
        fetchFn: mockFetch,
      });

      assert.strictEqual(capturedUrl, 'https://api.elevenlabs.io/v2/voices');
      assert.strictEqual(capturedHeaders['xi-api-key'], 'secret_key_v2_test');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(result.data.voices.length, 1);

      const voice = result.data.voices[0];
      assert.strictEqual(voice.id, 'sarah');
      assert.strictEqual(voice.name, 'Sarah');
      assert.strictEqual(voice.language, 'en-US');
      assert.strictEqual(voice.gender, 'Female');
      assert.strictEqual(voice.accent, 'American');
      assert.strictEqual(voice.style, 'Conversational');
      assert.ok(!('voice_id' in voice), 'Must not expose provider internal voice_id');
      assert.ok(result.data.languages.length > 0);
    });

    it('falls back to v1/voices when v2 endpoint returns 401 or 404', async () => {
      const urlsCalled = [];

      const mockFetch = async (url) => {
        urlsCalled.push(url);
        if (url === 'https://api.elevenlabs.io/v2/voices') {
          return {
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
          };
        }
        if (url === 'https://api.elevenlabs.io/v1/voices') {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({
              voices: [
                {
                  voice_id: 'v1_voice_xyz',
                  name: 'Roger - Laid-Back, Casual',
                  category: 'premade',
                  labels: { language: 'en', gender: 'male', accent: 'american' },
                },
              ],
            }),
          };
        }
        throw new Error(`Unexpected URL: ${url}`);
      };

      const provider = new ElevenLabsProvider();
      const result = await provider.getVoices({
        apiKey: 'key_without_voices_read',
        fetchFn: mockFetch,
      });

      assert.deepStrictEqual(urlsCalled, [
        'https://api.elevenlabs.io/v2/voices',
        'https://api.elevenlabs.io/v1/voices',
      ]);
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(result.data.voices[0].id, 'roger');
    });
  });
});

