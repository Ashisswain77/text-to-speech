/**
 * API Service Layer for Vocalis Frontend
 * 
 * Provides a centralized, lightweight fetch wrapper using native browser fetch().
 * Prepared for future backend integration (Day 8).
 */

// Base URL configured from Vite environment variables without hardcoded endpoints
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Standardized API Error class providing distinct error categorization
 */
export class ApiError extends Error {
  constructor(message, { status = null, statusText = '', data = null, isNetworkError = false } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Core fetch wrapper
 * 
 * Handles:
 * - Base URL resolution (absolute vs relative endpoints)
 * - Automatic headers (Accept, Content-Type)
 * - Network failure detection
 * - HTTP status validation (4xx, 5xx)
 * - JSON and text response parsing
 * 
 * @param {string} endpoint - Relative path (e.g. '/api/tts') or absolute URL
 * @param {RequestInit} [options={}] - Standard fetch RequestInit options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiFetch(endpoint, options = {}) {
  // 1. Resolve full URL
  const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
  const url = isAbsolute
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  // 2. Configure default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config = {
    ...options,
    headers,
  };

  // 3. Execute network request
  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // Distinguish network / connection / offline / CORS errors
    throw new ApiError(
      `Network error: Unable to reach the server. Please check your network connection. (${err.message})`,
      { isNetworkError: true }
    );
  }

  // 4. Parse response safely
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  // 5. Handle HTTP error status codes (e.g., 400, 404, 500)
  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `HTTP Error ${response.status}: ${response.statusText || 'Request failed'}`;
    throw new ApiError(errorMsg, {
      status: response.status,
      statusText: response.statusText,
      data,
      isNetworkError: false,
    });
  }

  return data;
}

/**
 * Standardized HTTP convenience methods
 */
export const api = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }),

  put: (endpoint, body, options = {}) => apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }),

  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * FUTURE BACKEND SERVICE LAYER STUBS (Scheduled for Day 7 / Day 8)
 * 
 * These define future endpoint contracts without implementing them or connecting real TTS.
 */
export const ttsService = {
  // GET /api/voices
  getVoices: async () => {
    const res = await api.get('/api/voices');
    return res?.data || res;
  },

  // POST /api/tts
  generateSpeech: async (payload) => {
    return await api.post('/api/tts', payload);
  },

  // GET /api/history
  getHistory: async () => {
    throw new Error('Endpoint GET /api/history is not implemented yet. Scheduled for Day 8 backend creation.');
  },

  // GET /api/favorites
  getFavorites: async () => {
    throw new Error('Endpoint GET /api/favorites is not implemented yet. Scheduled for Day 8 backend creation.');
  },

  // POST /api/favorites
  addFavorite: async (_item) => {
    throw new Error('Endpoint POST /api/favorites is not implemented yet. Scheduled for Day 8 backend creation.');
  },

  // DELETE /api/history/:id
  deleteHistoryItem: async (_id) => {
    throw new Error('Endpoint DELETE /api/history/:id is not implemented yet. Scheduled for Day 8 backend creation.');
  },
};

/**
 * SAFE REST COMMUNICATION DEMONSTRATION HELPERS (Day 6 Only)
 * 
 * Uses standard public test APIs (JSONPlaceholder) to verify:
 * - GET request execution and JSON parsing
 * - POST request execution with Content-Type: application/json
 * - HTTP 4xx/5xx error handling
 * - Network failure handling
 */
export const restTestApi = {
  // Demonstration GET request (JSONPlaceholder post #1)
  demonstrateGet: (id = 1) => 
    api.get(`https://jsonplaceholder.typicode.com/posts/${id}`),

  // Demonstration POST request with application/json body
  demonstratePost: (payload) => 
    api.post('https://jsonplaceholder.typicode.com/posts', payload),

  // Demonstration HTTP 404 error
  demonstrateHttpError: () => 
    api.get('https://jsonplaceholder.typicode.com/posts/99999999'),

  // Demonstration Network error (unreachable domain)
  demonstrateNetworkError: () => 
    api.get('https://invalid-nonexistent-domain-rest-test-xyz.example/api'),
};
