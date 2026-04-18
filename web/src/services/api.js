import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, REMEMBER_ME_KEY, ROUTES } from '../utils/constants';

/**
 * Axios instance pre-configured for the Committed Gateway API.
 *
 * Request interceptor  — attaches `Authorization: Bearer <token>` from the correct
 *                        storage (localStorage when rememberMe=true, sessionStorage
 *                        when rememberMe=false).
 * Response interceptor — unwraps the `{ success, data, message }` envelope so
 *                        callers receive `data` directly (not the full wrapper).
 *                        On 401, clears stored credentials and redirects to /login.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Tokens live in localStorage when rememberMe=true, sessionStorage otherwise.
    // Always read from the same storage that was used during login so that
    // requests made inside a non-remembered session carry the correct token.
    const rememberMe = JSON.parse(localStorage.getItem(REMEMBER_ME_KEY) ?? 'false');
    const storage    = rememberMe ? localStorage : sessionStorage;
    const token      = storage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => {
    // If the request was for a blob (e.g., file download), return the full response
    // so callers can access headers like Content-Disposition.
    if (response.config?.responseType === 'blob') {
      return response;
    }

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
      // Clear tokens from BOTH storages — the token may be in either one
      // depending on the rememberMe preference, and we must not leave a
      // stale token behind.  If we only clear localStorage (the old behaviour)
      // but the token is in sessionStorage, the page reloads after the
      // redirect, rehydrates the store from sessionStorage, finds a token,
      // sets isAuthenticated=true, and LoginPage immediately bounces the user
      // back to /dashboard — creating an infinite redirect loop.
      [localStorage, sessionStorage].forEach((s) => {
        s.removeItem(TOKEN_KEY);
        s.removeItem(REFRESH_TOKEN_KEY);
        s.removeItem(USER_KEY);
      });
      localStorage.removeItem(REMEMBER_ME_KEY);

      // Only redirect if not already on the login/register pages to avoid loops
      const currentPath = window.location.pathname;
      if (currentPath !== ROUTES.LOGIN && currentPath !== ROUTES.REGISTER) {
        window.location.href = ROUTES.LOGIN;
      }
    }

    // Normalise the error so callers always read `error.message`.
    // When responseType='blob', error.response.data is a Blob — we can't read
    // .message on it directly, so leave message extraction to fileService which
    // already handles JSON-wrapped blob errors. For all other requests extract
    // the message from the response body as usual.
    const isBlobResponse = error.config?.responseType === 'blob';
    const serverMessage = isBlobResponse
      ? (error.message || 'File download failed.')
      : (error.response?.data?.message ||
         error.response?.data?.error ||
         error.message ||
         'An unexpected error occurred');

    const normalised = new Error(serverMessage);
    normalised.status     = status;
    normalised.response   = error.response;
    normalised.fieldErrors = error.response?.data?.fieldErrors || null;

    return Promise.reject(normalised);
  }
);

export default api;