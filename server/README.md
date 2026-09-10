# SpeechEngine Backend API

Lightweight, production-ready Node.js & Express backend for **SpeechEngine** AI Text-to-Speech Studio.

---

## Tech Stack

- **Runtime:** Node.js (ES Modules, `"type": "module"`)
- **Web Framework:** Express.js 4.x
- **Environment Management:** `dotenv`
- **CORS:** `cors`
- **Development Tooling:** `nodemon`

---

## Directory Structure

```
server/
├── config/
│   └── env.js                 # Centralized configuration & environment loader
├── controllers/
│   └── health.controller.js   # Health check controller
├── middleware/
│   ├── error.middleware.js    # Centralized global error handling
│   └── notFound.middleware.js # 404 handler for unknown routes
├── routes/
│   ├── health.routes.js       # Health endpoint routing
│   └── index.js               # Central API router
├── services/                  # Business logic services (Day 9+)
├── utils/                     # Utility functions (Day 9+)
├── server.js                  # Express bootstrap & HTTP server entrypoint
├── package.json               # Backend dependencies & npm scripts
├── .env                       # Local environment variables
├── .env.example               # Environment variables template
└── README.md                  # Backend documentation
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP Port for the Express server | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Allowed CORS origin (SpeechEngine frontend) | `http://localhost:5173` |

### 3. Run the Server

- **Development Mode (with auto-reload):**
  ```bash
  npm run dev
  ```

- **Production Mode:**
  ```bash
  npm start
  ```

---

## Endpoints

### 1. Health Check
- **Route:** `GET /api/health`
- **Description:** Verifies service uptime and health status.
- **Sample Response:**
  ```json
  {
    "status": "ok",
    "service": "SpeechEngine Backend API",
    "timestamp": "2026-09-09T22:50:00.000Z",
    "uptime": 12
  }
  ```

### 2. Root Status Probe
- **Route:** `GET /`
- **Description:** Welcome probe returning basic service metadata.
- **Sample Response:**
  ```json
  {
    "service": "SpeechEngine Backend API",
    "status": "running",
    "version": "1.0.0",
    "documentation": "/api/health"
  }
  ```

### 3. Error Handling
- **404 Not Found:**
  ```json
  {
    "success": false,
    "error": "Endpoint not found: GET /api/unknown"
  }
  ```
