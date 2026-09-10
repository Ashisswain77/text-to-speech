import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Enable Cross-Origin Resource Sharing for SpeechEngine Frontend
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Standard JSON and URL-encoded body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome probe
app.get('/', (_req, res) => {
  res.json({
    service: 'SpeechEngine Backend API',
    status: 'running',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Mount Central API Routes under /api
app.use('/api', apiRouter);

// 404 handler for unknown endpoints
app.use(notFoundHandler);

// Global centralized error handler
app.use(errorHandler);

// Start HTTP server
const server = app.listen(config.port, () => {
  console.log(
    `[SpeechEngine Server] Listening on http://localhost:${config.port} (${config.nodeEnv})`
  );
});

// Handle graceful shutdown
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
