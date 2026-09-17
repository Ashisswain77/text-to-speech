import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import app from '../server.js';
import { query } from '../config/db.js';
import { config } from '../config/env.js';

describe('Authentication & Authorization Integration Tests', () => {
  let server;
  let baseUrl;

  // Generate unique email prefix for clean test isolation
  const testRunId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const createTestEmail = (suffix) => `authtest_${testRunId}_${suffix}@speechengine.test`;

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
    // Clean up test users created during the run
    try {
      await query('DELETE FROM users WHERE email LIKE $1;', [`%${testRunId}%`]);
    } catch (err) {
      console.warn('Test user cleanup warning:', err.message);
    }

    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  // =========================================================================
  // 1. REGISTRATION TESTS
  // =========================================================================
  describe('POST /api/auth/register', () => {
    const validEmail = createTestEmail('reg_success');
    const validPassword = 'SecurePassword123!';

    it('successfully registers a user with valid payload and sets httpOnly cookie', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jane Developer',
          email: validEmail,
          password: validPassword,
        }),
      });

      const setCookie = response.headers.get('set-cookie') || '';
      const data = await response.json();

      assert.strictEqual(response.status, 201);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'User registered successfully.');

      // Check safe user data returned
      assert.ok(data.data);
      assert.strictEqual(typeof data.data.id, 'string');
      assert.strictEqual(data.data.name, 'Jane Developer');
      assert.strictEqual(data.data.email, validEmail.toLowerCase());
      assert.strictEqual(data.data.tier, 'free');
      assert.strictEqual(data.data.charLimit, 5000);
      assert.ok(data.data.createdAt);

      // Security: password_hash and password MUST NOT be returned
      assert.strictEqual(data.data.password, undefined);
      assert.strictEqual(data.data.password_hash, undefined);
      assert.strictEqual(JSON.stringify(data).includes('password_hash'), false);

      // Verify HTTP-only cookie
      assert.match(setCookie, /token=/);
      assert.match(setCookie, /HttpOnly/i);
    });

    it('rejects registration when name is missing', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createTestEmail('missing_name'),
          password: 'Password123!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Name is required/i);
    });

    it('rejects registration when email format is invalid', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'not-an-email',
          password: 'Password123!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Invalid email address/i);
    });

    it('rejects registration when password is missing', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: createTestEmail('missing_pwd'),
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Password is required/i);
    });

    it('rejects registration when password is too short (< 8 chars)', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: createTestEmail('short_pwd'),
          password: '123',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /at least 8 characters/i);
    });

    it('rejects registration when password is too long (> 72 chars)', async () => {
      const longPassword = 'A'.repeat(73);
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: createTestEmail('long_pwd'),
          password: longPassword,
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /not exceed 72 characters/i);
    });

    it('rejects duplicate email registration with 409 Conflict', async () => {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Another User',
          email: validEmail, // Already registered in first test
          password: 'AnotherPassword123!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 409);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /already exists/i);
    });

    it('normalizes email casing and rejects duplicate regardless of casing', async () => {
      const upperCaseEmail = validEmail.toUpperCase();
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Case Test',
          email: upperCaseEmail,
          password: 'AnotherPassword123!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 409);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /already exists/i);
    });
  });

  // =========================================================================
  // 2. LOGIN TESTS
  // =========================================================================
  describe('POST /api/auth/login', () => {
    const loginEmail = createTestEmail('login_target');
    const loginPassword = 'LoginPassword123!';

    before(async () => {
      // Pre-register user for login tests
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Login User',
          email: loginEmail,
          password: loginPassword,
        }),
      });
    });

    it('successfully logs in with valid credentials and returns httpOnly cookie', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const setCookie = response.headers.get('set-cookie') || '';
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Logged in successfully.');
      assert.ok(data.data);
      assert.strictEqual(data.data.email, loginEmail.toLowerCase());
      assert.strictEqual(data.data.password, undefined);
      assert.strictEqual(data.data.password_hash, undefined);

      assert.match(setCookie, /token=/);
      assert.match(setCookie, /HttpOnly/i);
    });

    it('rejects incorrect password with generic 401 error', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: 'WrongPassword999!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Invalid email or password.');
    });

    it('rejects non-existent email with identical generic 401 error', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: createTestEmail('does_not_exist'),
          password: 'AnyPassword123!',
        }),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Invalid email or password.');
    });

    it('rejects malformed request body with 400 Bad Request', async () => {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();
      assert.strictEqual(response.status, 400);
      assert.strictEqual(data.success, false);
      assert.ok(data.message);
    });
  });

  // =========================================================================
  // 3. AUTHENTICATION & /ME TESTS
  // =========================================================================
  describe('GET /api/auth/me & requireAuth Middleware', () => {
    let authCookie = '';
    const userEmail = createTestEmail('me_target');
    const userPassword = 'MePassword123!';

    before(async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Profile User',
          email: userEmail,
          password: userPassword,
        }),
      });
      authCookie = res.headers.get('set-cookie') || '';
    });

    it('rejects unauthenticated request with 401 when no token is provided', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Authentication required/i);
    });

    it('rejects request with 401 when token is forged or invalid', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: 'token=invalid.jwt.token.signature',
        },
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Invalid or expired/i);
    });

    it('rejects request with 401 when token is expired', async () => {
      // Create an expired token manually
      const expiredToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000' },
        config.jwtSecret,
        { expiresIn: '-1s' }
      );

      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: `token=${expiredToken}`,
        },
      });

      const data = await response.json();
      assert.strictEqual(response.status, 401);
      assert.strictEqual(data.success, false);
      assert.match(data.message, /Invalid or expired/i);
    });

    it('returns authenticated user profile when valid cookie is provided', async () => {
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: authCookie,
        },
      });

      const data = await response.json();
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.success, true);
      assert.ok(data.data);
      assert.strictEqual(data.data.name, 'Profile User');
      assert.strictEqual(data.data.email, userEmail.toLowerCase());
      assert.strictEqual(data.data.tier, 'free');
      assert.strictEqual(data.data.charLimit, 5000);

      // Crucial: password_hash must never be present
      assert.strictEqual(data.data.password_hash, undefined);
      assert.strictEqual(JSON.stringify(data).includes('password_hash'), false);
    });
  });

  // =========================================================================
  // 4. LOGOUT TESTS
  // =========================================================================
  describe('POST /api/auth/logout', () => {
    it('successfully clears the authentication cookie', async () => {
      const response = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
      });

      const setCookie = response.headers.get('set-cookie') || '';
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.message, 'Logged out successfully.');

      // Check cookie is cleared (empty value or expired in past)
      assert.match(setCookie, /token=;/);
      assert.match(setCookie, /HttpOnly/i);
    });
  });

  // =========================================================================
  // 5. SECURITY AUDIT CHECKS
  // =========================================================================
  describe('Security Controls & Sensitive Data Leakage', () => {
    it('JWT does not contain password_hash, password, or database credentials', async () => {
      const userEmail = createTestEmail('sec_check');
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Security User',
          email: userEmail,
          password: 'SecPassword123!',
        }),
      });

      const setCookie = res.headers.get('set-cookie') || '';
      const tokenMatch = setCookie.match(/token=([^;]+)/);
      assert.ok(tokenMatch, 'Token cookie must be present');

      const rawToken = tokenMatch[1];
      const decoded = jwt.decode(rawToken);

      assert.ok(decoded.id, 'Decoded token should contain user id');
      assert.strictEqual(decoded.password, undefined);
      assert.strictEqual(decoded.password_hash, undefined);
      assert.strictEqual(decoded.databaseUrl, undefined);
      assert.strictEqual(decoded.jwtSecret, undefined);
    });

    it('rejects attempts to inject foreign user_id in requests', async () => {
      const legitimateEmail = createTestEmail('legit_user');
      const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Legit User',
          email: legitimateEmail,
          password: 'LegitPassword123!',
        }),
      });

      const authCookie = registerRes.headers.get('set-cookie') || '';
      const attackerFakeId = '00000000-0000-0000-0000-000000000000';

      // Attempt to query /api/auth/me with forged user_id headers
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: authCookie,
          'x-user-id': attackerFakeId,
        },
      });

      const meData = await meRes.json();
      assert.strictEqual(meRes.status, 200);
      // Ensure returned id matches the actual token identity, NOT the injected fake id
      assert.notStrictEqual(meData.data.id, attackerFakeId);
      assert.strictEqual(meData.data.email, legitimateEmail.toLowerCase());
    });
  });
});
