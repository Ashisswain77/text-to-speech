# SpeechEngine Backend API

Lightweight backend API service providing the server foundation for the **SpeechEngine** AI Text-to-Speech Studio.

---

## 1. Overview

The SpeechEngine server is an Express-based Node.js backend providing foundational API routing, environment configuration, standardized JSON error and 404 responses, and health monitoring.

---

## 2. Backend Technology

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Web Framework:** Express.js 4.x
- **CORS:** `cors` (restricted to frontend origin)
- **Configuration:** `dotenv` with centralized parsing and validation
- **Development Tooling:** `nodemon` for auto-reloading

---

## 3. Installation

From the root repository directory, navigate to the `server` folder and install dependencies:

```bash
cd server
npm install
```

---

## 4. Environment Configuration

Create a `.env` file in the `server/` directory using `.env.example` as a template:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Required | Default |
|---|---|---|---|
| `PORT` | HTTP port on which the Express server listens | Yes | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | Yes | `development` |
| `CLIENT_URL` | Frontend origin allowed by CORS | Yes | `http://localhost:5173` |
| `TTS_API_KEY` | Reserved for future TTS provider integration | No | _(empty)_ |
| `TTS_REGION` | Reserved for future TTS provider integration | No | _(empty)_ |
| `TTS_ENDPOINT` | Reserved for future TTS provider integration | No | _(empty)_ |

> **Security Note:** Never commit `.env` or store real secrets in source control. TTS variables are optional and not required for Day 8.

---

## 5. Development Command

Run the server with nodemon auto-reload:

```bash
npm run dev
```

The server outputs:
```
SpeechEngine API running on port 5000
```

---

## 6. Start Command (Production)

Run the server using standard Node.js:

```bash
npm start
```

---

## 7. Health Endpoint

Verify server uptime and connectivity:

- **Method:** `GET`
- **Path:** `/api/health`
- **HTTP Status:** `200 OK`

### Expected Health Response

```json
{
  "success": true,
  "message": "SpeechEngine API is running"
}
```

---

## 8. Current Day 8 Scope & Limitations

The Day 8 milestone covers **only** the backend foundation:
- Express server initialization and modular routing (`/api`)
- Centralized environment configuration (`config/env.js`)
- Single active endpoint: `GET /api/health`
- Consistent JSON 404 handler (`middleware/notFound.middleware.js`)
- Centralized error handler (`middleware/error.middleware.js`)
- CORS configured specifically for `http://localhost:5173`

### NOT Implemented Yet (Scheduled for Future Stages)

The following capabilities are deliberately **not** implemented in Day 8:
- **TTS Generation:** `POST /api/tts` or external TTS cloud provider integration
- **Voice Catalog:** `GET /api/voices`
- **Authentication:** User registration, login, tokens, or sessions
- **Database:** PostgreSQL, MongoDB, Supabase, SQLite, or any ORM/database connection
- **Audio Storage:** File system storage, AWS S3, or audio streaming
- **Persistence:** Speech history (`/api/history`) and favorites (`/api/favorites`)
