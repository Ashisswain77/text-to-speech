import { config } from '../config/env.js';

/**
 * Centralized Global Error Handling Middleware
 * Ensures consistent JSON response structure and protects sensitive details in production.
 */
export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDev = config.isDevelopment;

  const response = {
    success: false,
    message: isDev 
      ? (err.message || 'Internal server error')
      : (statusCode < 500 && err.message ? err.message : 'Internal server error'),
  };

  // In development, provide non-sensitive debugging information
  if (isDev && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
