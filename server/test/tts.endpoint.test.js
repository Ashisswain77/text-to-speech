import { test, describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../server.js';

describe('POST /api/tts HTTP Integration Tests', () => {
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

  it('returns 400 Bad Request when request body is empty', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /Text is required/);
  });

  it('returns 400 Bad Request when speed is invalid', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        speed: 99,
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /Speed must be between 0.7 and 1.2/);
  });

  it('rejects old speed contract values (0.5, 1.5, 2.0) with 400', async () => {
    for (const oldSpeed of [0.5, 1.5, 2.0]) {
      const res = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Hello world',
          speed: oldSpeed,
        }),
      });
      const data = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Speed must be between 0.7 and 1.2/);
    }
  });

  it('rejects unsupported language with 400', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello world',
        language: 'invalid-lang',
      }),
    });

    const data = await response.json();
    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.match(data.message, /Unsupported language/);
  });

  it('returns JSON error with success:false for validation failures', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '   ' }),
    });

    const contentType = response.headers.get('content-type') || '';
    assert.ok(contentType.includes('application/json'), 'Error responses must be application/json');
    const data = await response.json();
    assert.strictEqual(response.status, 400);
    assert.strictEqual(data.success, false);
    assert.ok(data.message, 'Error response must contain message');
  });

  it('handles valid request gracefully — returns audio/mpeg on success or JSON on provider error', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: 'Testing SpeechEngine integration with ElevenLabs',
        language: 'en-US',
        voice: 'sarah',
        speed: 1.0,
      }),
    });

    const contentType = response.headers.get('content-type') || '';

    if (response.status === 200) {
      // Day 11: Successful synthesis returns raw audio/mpeg binary
      assert.ok(contentType.includes('audio/mpeg'), `Expected audio/mpeg but got ${contentType}`);
      const buffer = await response.arrayBuffer();
      assert.ok(buffer.byteLength > 0, 'Audio buffer must not be empty');
    } else {
      // Provider errors (500 no key, 502 invalid key) return JSON
      assert.ok(contentType.includes('application/json'), `Expected application/json error but got ${contentType}`);
      const data = await response.json();
      assert.ok([400, 402, 429, 500, 502, 503].includes(response.status));
      assert.strictEqual(data.success, false);
      assert.strictEqual(typeof data.message, 'string');
      // Ensure API key is NEVER exposed in the JSON response
      const jsonString = JSON.stringify(data);
      assert.strictEqual(jsonString.includes('xi-api-key'), false);
      assert.strictEqual(jsonString.includes('sk_'), false);
    }
  });
});

