import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import notFound from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// Configure CORS restricted to frontend client URL (no wildcard)
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// JSON body parsing middleware
app.use(express.json());

// Mount modular API routes under /api
app.use('/api', apiRouter);

// Catch-all 404 handler for unknown routes
app.use(notFound);

// Centralized error handling middleware
app.use(errorHandler);

// Start HTTP server
const server = app.listen(config.port, () => {
  console.log(
    `[SpeechEngine Server] Listening on http://localhost:${config.port} (${config.nodeEnv})`
  );
});

// Handle graceful termination
const handleShutdown = (signal) => {
  console.log(`\n[SpeechEngine Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[SpeechEngine Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default app;
