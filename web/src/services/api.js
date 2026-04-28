import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY, REMEMBER_ME_KEY, ROUTES } from '../utils/constants';

/**
 * Axios instance pre-configured for the Committed Gateway API.
 *
 * Request interceptor  — attaches `Authorization: Bearer <token>` from the correct
 *                        storage (localStorage when rememberMe=true, sessionStorage
 *                        when rememberMe=false).
 * Response interceptor — unwraps the `{ success, data, message }` envelope.
 *                        On 401, attempts a silent token refresh before clearing
 *                        credentials. Concurrent 401 responses are queued and
 *                        resolved with the same new token to avoid duplicate refreshes.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

// ─── Request Interceptor ─────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
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

// Tracks an in-flight refresh so concurrent 401s share one refresh call.
let isRefreshing      = false;
let refreshSubscribers = [];

const onRefreshed    = (token) => { refreshSubscribers.forEach(cb => cb(token)); refreshSubscribers = []; };
const addSubscriber  = (cb)    => refreshSubscribers.push(cb);

const getStorage = () => {
  const rememberMe = JSON.parse(localStorage.getItem(REMEMBER_ME_KEY) ?? 'false');
  return rememberMe ? localStorage : sessionStorage;
};

const clearAndRedirect = () => {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
    s.removeItem(USER_KEY);
  });
  localStorage.removeItem(REMEMBER_ME_KEY);

  const currentPath = window.location.pathname;
  if (currentPath !== ROUTES.LOGIN && currentPath !== ROUTES.REGISTER) {
    window.location.href = ROUTES.LOGIN;
  }
};

const normalizeError = (error) => {
  const status = error.response?.status;
  const isBlobResponse = error.config?.responseType === 'blob';
  const serverMessage = isBlobResponse
    ? (error.message || 'File download failed.')
    : (error.response?.data?.message ||
       error.response?.data?.error ||
       error.message ||
       'An unexpected error occurred');

  const normalised       = new Error(serverMessage);
  normalised.status      = status;
  normalised.response    = error.response;
  normalised.fieldErrors = error.response?.data?.fieldErrors || null;
  return normalised;
};

api.interceptors.response.use(
  (response) => {
    if (response.config?.responseType === 'blob') {
      return response;
    }
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data;
    }
    return body;
  },
  async (error) => {
    const status   = error.response?.status;
    const original = error.config;

    // Only attempt refresh on 401, and only once per request
    if (status !== 401 || original._retry) {
      if (status === 401) clearAndRedirect();
      return Promise.reject(normalizeError(error));
    }

    original._retry = true;

    // If a refresh is already in flight, queue this request until it resolves
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addSubscriber((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    isRefreshing = true;

    try {
      const storage      = getStorage();
      const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) throw new Error('no refresh token');

      // Use plain axios to avoid the interceptor loop
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/api/token/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const newAccessToken  = refreshResponse.data.accessToken;
      const newRefreshToken = refreshResponse.data.refreshToken;

      // Update storage and Zustand store
      storage.setItem(TOKEN_KEY,         newAccessToken);
      storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

      // Lazy import to avoid circular dependency
      const { useAuthStore } = await import('../store/authStore');
      useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);

      onRefreshed(newAccessToken);

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);

    } catch {
      clearAndRedirect();
      return Promise.reject(normalizeError(error));
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
