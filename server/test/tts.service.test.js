import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, validate, normalize } from '../services/tts.service.js';

describe('SpeechEngine TTS Service Tests', () => {
  describe('Validation & Normalization', () => {
    it('rejects empty or whitespace-only text with 400', async () => {
      const emptyResult = await synthesize({ text: '   ' });
      assert.strictEqual(emptyResult.success, false);
      assert.strictEqual(emptyResult.statusCode, 400);
      assert.match(emptyResult.message, /Text must not be empty/);

      const nullResult = await synthesize({});
      assert.strictEqual(nullResult.success, false);
      assert.strictEqual(nullResult.statusCode, 400);
      assert.match(nullResult.message, /Text is required/);
    });

    it('rejects unsupported languages and voices', async () => {
      const invalidLang = await synthesize({ text: 'Hello', language: 'xx-YY' });
      assert.strictEqual(invalidLang.success, false);
      assert.strictEqual(invalidLang.statusCode, 400);
      assert.match(invalidLang.message, /Unsupported language/);

      const mismatchVoice = await synthesize({ text: 'Hello', language: 'en-US', voice: 'priya' });
      assert.strictEqual(mismatchVoice.success, false);
      assert.strictEqual(mismatchVoice.statusCode, 400);
      assert.match(mismatchVoice.message, /Unsupported voice/);
    });

    it('rejects invalid speed factors', async () => {
      const invalidSpeed = await synthesize({ text: 'Hello', speed: 3.5 });
      assert.strictEqual(invalidSpeed.success, false);
      assert.strictEqual(invalidSpeed.statusCode, 400);
      assert.match(invalidSpeed.message, /Speed must be between 0.7 and 1.2/);

      // Verify old speed contract values (0.5, 1.5, 2.0) are rejected
      const oldSpeedLow = await synthesize({ text: 'Hello', speed: 0.5 });
      assert.strictEqual(oldSpeedLow.success, false);
      assert.strictEqual(oldSpeedLow.statusCode, 400);

      const oldSpeedHigh = await synthesize({ text: 'Hello', speed: 1.5 });
      assert.strictEqual(oldSpeedHigh.success, false);
      assert.strictEqual(oldSpeedHigh.statusCode, 400);

      const oldSpeedMax = await synthesize({ text: 'Hello', speed: 2.0 });
      assert.strictEqual(oldSpeedMax.success, false);
      assert.strictEqual(oldSpeedMax.statusCode, 400);
    });

    it('correctly applies defaults during normalization', () => {
      const normalized = normalize({ text: '  Hello world  ' });
      assert.strictEqual(normalized.text, 'Hello world');
      assert.strictEqual(normalized.language, 'en-US');
      assert.strictEqual(normalized.voice, 'sarah');
      assert.strictEqual(normalized.speed, 1.0);
      assert.strictEqual(normalized.pitch, 0);
      assert.strictEqual(normalized.volume, 100);
    });
  });

  describe('Provider Delegation', () => {
    it('delegates normalized request to provider adapter', async () => {
      let passedPayload = null;

      const mockProvider = {
        synthesize: async (normalized) => {
          passedPayload = normalized;
          return {
            success: true,
            statusCode: 200,
            message: 'Mock synthesized',
            data: { provider: 'mock' },
          };
        },
      };

      const result = await synthesize(
        { text: 'Sample text to synthesize', voice: 'david', speed: 1.1 },
        { provider: mockProvider }
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.strictEqual(passedPayload.text, 'Sample text to synthesize');
      assert.strictEqual(passedPayload.voice, 'david');
      assert.strictEqual(passedPayload.speed, 1.1);
    });
  });
});
