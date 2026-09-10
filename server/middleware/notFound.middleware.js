/**
 * 404 Not Found Middleware for unmatched routes
 */
export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFoundHandler;
