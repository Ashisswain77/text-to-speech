# SpeechEngine Security Policy

This document defines the security requirements and controls enforced across the SpeechEngine codebase. All contributors must follow these rules in every change.

## Core Security Rules

### 1. Secrets Management
- **Never expose API keys or secrets in React/client-side code.** All secrets stay in `server/.env` (gitignored).
- **Never commit `.env` files.** Only `.env.example` templates (with empty values) are tracked.
- **Keep secrets only in environment variables.** Access them exclusively via `config/env.js`.

### 2. Input Validation (Server-Side)
- **Never trust frontend data.** All inputs are validated server-side in `tts.service.js`.
- **Enforce max text length: 5,000 characters** on the backend (trimmed).
- **Validate language** against the supported language catalog.
- **Validate voice** against the language-specific voice catalog and dynamic registry.
- **Validate request format:** body must be a plain JSON object (not array, string, number, null).
- **Strip unexpected fields:** `normalize()` only passes `text`, `language`, `voice` to the provider.

### 3. Rate Limiting
- **Global API limiter:** 100 requests per 15-minute window per IP (all `/api/*` routes).
- **TTS-specific limiter:** 10 requests per 1-minute window per IP (`POST /api/tts`).
- Limits are configurable via environment variables (`RATE_LIMIT_*`).
- Prevents TTS abuse and excessive ElevenLabs API consumption.

### 4. CORS
- **CORS is restricted to allowed origins only** — never use wildcard (`*`).
- Origins configured via `CLIENT_URL` in `.env` (supports comma-separated values for production).

### 5. Security Headers
- **Helmet middleware** enforces `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and other security headers.

### 6. Transport Security
- **Use HTTPS in production.** TLS termination should be handled at the reverse proxy / load balancer layer.

### 7. Audio Data
- **No permanent audio storage.** Audio is returned as in-memory buffers and never written to disk.
- **`Cache-Control: no-store`** is set on all audio responses.
- Client blob URLs are revoked on component unmount to prevent memory leaks.

### 8. Error Handling
- **Stack traces are hidden in production.** Only generic error messages are returned for 5xx errors.
- **API keys are never included in error messages.** Provider errors are mapped to safe messages.

### 9. Body Size Limits
- **JSON body limit: 16KB.** Prevents memory exhaustion from oversized payloads.

## Security Review Checklist

Use this checklist when reviewing any PR or code change:

- [ ] No API keys, tokens, or secrets in client-side code
- [ ] No new `.env` values committed (only `.env.example` updated)
- [ ] All user inputs validated server-side before processing
- [ ] Text length enforced ≤ 5,000 characters on backend
- [ ] Request body validated as plain JSON object
- [ ] No unexpected fields passed to external APIs
- [ ] Rate limiting not weakened or bypassed
- [ ] CORS not opened to wildcard
- [ ] Error messages don't leak secrets or stack traces in production
- [ ] No permanent audio file storage introduced
- [ ] HTTPS enforced for any production URLs

## Environment Variables (Security-Related)

| Variable | Purpose | Default |
|---|---|---|
| `ELEVENLABS_API_KEY` | ElevenLabs TTS provider key (server-only) | _(empty)_ |
| `CLIENT_URL` | Allowed CORS origin(s), comma-separated | `http://localhost:5173` |
| `RATE_LIMIT_GLOBAL_MAX` | Max global API requests per window | `100` |
| `RATE_LIMIT_GLOBAL_WINDOW_MS` | Global rate limit window (ms) | `900000` (15 min) |
| `RATE_LIMIT_TTS_MAX` | Max TTS requests per window | `10` |
| `RATE_LIMIT_TTS_WINDOW_MS` | TTS rate limit window (ms) | `60000` (1 min) |
