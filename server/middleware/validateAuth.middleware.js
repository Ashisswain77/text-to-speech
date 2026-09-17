import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required.' })
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must not exceed 100 characters.'),
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format.')
    .max(255, 'Email must not exceed 255 characters.'),
  password: z
    .string({ error: 'Password is required.' })
    .min(8, 'Password must be at least 8 characters long.')
    .max(72, 'Password must not exceed 72 characters.'),
});

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format.')
    .max(255, 'Email must not exceed 255 characters.'),
  password: z
    .string({ error: 'Password is required.' })
    .min(1, 'Password is required.')
    .max(72, 'Password must not exceed 72 characters.'),
});

/**
 * Higher-order middleware function to validate request body with a Zod schema.
 *
 * @param {z.ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    // Defense-in-depth against undefined or non-object bodies
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object.',
      });
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Pick first error message for clear client communication
      const firstIssue = result.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Invalid request payload.';

      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Attach sanitized and normalized data to req.body
    req.body = result.data;
    next();
  };
}

export const validateRegister = validateBody(registerSchema);
export const validateLogin = validateBody(loginSchema);

export default {
  registerSchema,
  loginSchema,
  validateRegister,
  validateLogin,
};
