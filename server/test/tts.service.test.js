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

    it('correctly applies defaults during normalization', () => {
      const normalized = normalize({ text: '  Hello world  ' });
      assert.strictEqual(normalized.text, 'Hello world');
      assert.strictEqual(normalized.language, 'en-US');
      assert.strictEqual(normalized.voice, 'sarah');
      assert.strictEqual(normalized.speed, undefined);
      assert.strictEqual(normalized.pitch, undefined);
      assert.strictEqual(normalized.volume, undefined);
    });
  });

  describe('Provider Delegation', () => {
    it('delegates simplified normalized request ({ text, language, voice }) to provider adapter', async () => {
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
        { text: 'Sample text to synthesize', voice: 'david', language: 'en-US' },
        { provider: mockProvider }
      );

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.statusCode, 200);
      assert.deepStrictEqual(passedPayload, {
        text: 'Sample text to synthesize',
        language: 'en-US',
        voice: 'david',
      });
      assert.strictEqual(passedPayload.speed, undefined);
      assert.strictEqual(passedPayload.pitch, undefined);
      assert.strictEqual(passedPayload.volume, undefined);
    });
  });
});
