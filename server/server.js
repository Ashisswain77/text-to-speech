import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import notFound from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';
import { globalApiLimiter } from './middleware/rateLimit.middleware.js';

const app = express();

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
app.use(helmet());

// Configure CORS restricted to allowed origins (no wildcard)
// Supports single origin string or array of origins for production
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// JSON body parsing middleware with size limit to prevent memory exhaustion
// 5000 chars of UTF-8 text ≈ 15KB; 16kb provides comfortable headroom
app.use(express.json({ limit: '16kb' }));

// Global API rate limiter — broad protection for all /api/* routes
app.use('/api', globalApiLimiter);

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
