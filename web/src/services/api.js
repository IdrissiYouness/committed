import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, ROUTES } from '../utils/constants';

/**
 * Axios instance pre-configured for the Committed Gateway API.
 *
 * Request interceptor  — attaches `Authorization: Bearer <token>` from localStorage
 * Response interceptor — unwraps the `{ success, data, message }` envelope so
 *                        callers receive `data` directly (not the full wrapper).
 *                        On 401, clears stored credentials and redirects to /login.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // Gateway wraps every successful response in { success, data, message, timestamp }
    // Unwrap so service callers work with `data` directly.
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data;
    }
    return body;
  },
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Clear all persisted auth state
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Only redirect if not already on the login/register pages to avoid loops
      const currentPath = window.location.pathname;
      if (currentPath !== ROUTES.LOGIN && currentPath !== ROUTES.REGISTER) {
        window.location.href = ROUTES.LOGIN;
      }
    }

    // Normalise the error so callers always read `error.message`
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    const normalised = new Error(serverMessage);
    normalised.status     = status;
    normalised.response   = error.response;
    normalised.fieldErrors = error.response?.data?.fieldErrors || null;

    return Promise.reject(normalised);
  }
);

export default api;