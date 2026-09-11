import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';
import {
  normalizeElevenLabsVoice,
  deriveLanguagesFromVoices,
} from '../services/providers/elevenlabs.provider.js';

describe('GET /api/voices & Voice Normalization Tests', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  describe('Voice Normalization Unit Logic', () => {
    it('normalizes a raw ElevenLabs voice correctly without leaking provider voice_id', () => {
      const raw = {
        voice_id: 'secret_elevenlabs_internal_id_123',
        name: 'George - Warm, Captivating Storyteller',
        category: 'premade',
        labels: {
          accent: 'british',
          gender: 'male',
          language: 'en',
          use_case: 'narrative_story',
        },
        verified_languages: [
          { locale: 'en-GB' },
          { locale: 'fr-FR' },
          { locale: 'es-ES' },
        ],
      };

      const normalized = normalizeElevenLabsVoice(raw);

      assert.strictEqual(normalized.id, 'george');
      assert.strictEqual(normalized.name, 'George');
      assert.strictEqual(normalized.language, 'en-GB');
      assert.strictEqual(normalized.gender, 'Male');
      assert.strictEqual(normalized.accent, 'British');
      assert.strictEqual(normalized.style, 'Narrative');
      assert.ok(!('voice_id' in normalized), 'Provider internal voice_id must not be exposed in normalized object');
      assert.ok(normalized.supportedLanguages.includes('en-GB'));
      assert.ok(normalized.supportedLanguages.includes('fr-FR'));
      assert.ok(normalized.supportedLanguages.includes('es-ES'));
    });

    it('derives sorted language list from voices catalog', () => {
      const voices = [
        { language: 'en-US', supportedLanguages: ['en-US', 'es-ES'] },
        { language: 'en-GB', supportedLanguages: ['en-GB', 'fr-FR'] },
      ];

      const languages = deriveLanguagesFromVoices(voices);
      assert.ok(Array.isArray(languages));
      assert.strictEqual(languages[0].id, 'en-US'); // en-US pinned first
      assert.ok(languages.some((l) => l.id === 'es-ES'));
      assert.ok(languages.some((l) => l.id === 'fr-FR'));
      assert.ok(languages.every((l) => l.id && l.name && l.flag));
    });
  });

  describe('GET /api/voices HTTP Endpoint', () => {
    it('successfully returns normalized voices and derived languages', async () => {
      const response = await fetch(`${baseUrl}/api/voices`);
      const json = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(json.success, true);
      assert.ok(json.data, 'Response must contain data object');
      assert.ok(Array.isArray(json.data.voices), 'data.voices must be an array');
      assert.ok(Array.isArray(json.data.languages), 'data.languages must be an array');
      assert.ok(json.data.voices.length > 0, 'Must return at least one voice');
      assert.ok(json.data.languages.length > 0, 'Must return at least one language');

      // Verify each voice has the required frontend fields: id, name, language, gender, accent, style
      for (const voice of json.data.voices) {
        assert.ok(voice.id, 'Voice must have id');
        assert.ok(voice.name, 'Voice must have name');
        assert.ok(voice.language, 'Voice must have language');
        assert.ok(voice.gender, 'Voice must have gender');
        assert.ok(voice.accent, 'Voice must have accent');
        assert.ok(voice.style, 'Voice must have style');
        assert.ok(!('voice_id' in voice), 'voice_id must NOT be exposed in voice objects');
      }

      // Verify no API keys or secret voice IDs are leaked in JSON payload
      const serialized = JSON.stringify(json);
      assert.strictEqual(serialized.includes('xi-api-key'), false);
      assert.strictEqual(serialized.includes('sk_'), false);
    });
  });
});
