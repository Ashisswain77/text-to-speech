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
    assert.match(data.message, /Speed must be one of/);
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

  it('handles valid request gracefully without leaking secrets', async () => {
    const response = await fetch(`${baseUrl}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Testing SpeechEngine integration with ElevenLabs',
        language: 'en-US',
        voice: 'sarah',
        speed: 1.0,
      }),
    });

    const data = await response.json();
    // In test environment, if no key or dummy key is set, returns either 500 (no key), 502 (invalid key/auth failed), or 200 (live success)
    assert.ok([200, 500, 502].includes(response.status));
    assert.strictEqual(typeof data.message, 'string');
    // Ensure API key is NEVER exposed in the JSON response
    const jsonString = JSON.stringify(data);
    assert.strictEqual(jsonString.includes('xi-api-key'), false);
    assert.strictEqual(jsonString.includes('sk_'), false);
  });
});
