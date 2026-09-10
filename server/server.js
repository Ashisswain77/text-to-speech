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

// Start HTTP server when executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const server = app.listen(config.port, () => {
    console.log(`SpeechEngine API running on port ${config.port}`);
  });

  // Handle graceful termination
  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

export default app;
