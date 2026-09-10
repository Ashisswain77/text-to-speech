/**
 * 404 Not Found Middleware
 * Returns a standardized JSON response for unknown routes instead of Express default HTML.
 */
export const notFound = (_req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

export const notFoundHandler = notFound;
export default notFound;
