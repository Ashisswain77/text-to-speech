/**
 * Request Validation Middleware
 *
 * Guards against malformed request bodies before they reach controllers:
 *   - Rejects non-JSON Content-Type on POST/PUT/PATCH requests
 *   - Rejects request bodies that are not plain objects (arrays, strings, numbers, null)
 *
 * Returns consistent { success: false, message } JSON errors.
 */

/**
 * Validates that the request body is a plain object (not array, null, string, number).
 * Must be mounted AFTER express.json() so req.body is already parsed.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const validateRequestBody = (req, res, next) => {
  // Only validate methods that carry a body
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const body = req.body;

  // express.json() sets req.body to undefined if Content-Type is missing/wrong
  // and to the parsed JSON value otherwise.
  if (body === undefined || body === null) {
    return res.status(400).json({
      success: false,
      message: 'Request body is required and must be valid JSON.',
    });
  }

  // Reject arrays, strings, numbers, booleans — only plain objects allowed
  if (typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: 'Request body must be a JSON object.',
    });
  }

  next();
};

export default { validateRequestBody };
