import { config } from '../config/env.js';

/**
 * Global Error Handling Middleware for SpeechEngine Backend
 */
export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
