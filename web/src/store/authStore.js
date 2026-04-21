import { create } from 'zustand';
import {
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  REMEMBER_ME_KEY,
} from '../utils/constants';

/**
 * Auth Store (Zustand)
 *
 * Holds authentication state for the entire app.
 * On login, persists tokens/user to localStorage (or sessionStorage when
 * "Remember Me" is off) so state survives page refreshes.
 * On logout, wipes all persisted auth data.
 *
 * Usage:
 *   const { isAuthenticated, user, accessToken } = useAuthStore();
 *   const { login, logout, updateUser } = useAuthStore();
 */

// ─── Persistence Helpers ──────────────────────────────────────────────────────

/**
 * Pick the right storage based on the "Remember Me" flag.
 * rememberMe = true  → localStorage  (persists across sessions)
 * rememberMe = false → sessionStorage (cleared when tab closes)
 */
const pickStorage = (rememberMe) =>
  rememberMe ? localStorage : sessionStorage;

const persistAuth = (accessToken, refreshToken, user, rememberMe) => {
  const storage = pickStorage(rememberMe);
  storage.setItem(TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(USER_KEY, JSON.stringify(user));

  // Always write the remember-me preference to localStorage so we know
  // which storage to clear on logout even after a page refresh.
  localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(rememberMe));
};

const clearPersistedAuth = () => {
  // Clear both storages — covers the case where the preference changed
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
    s.removeItem(USER_KEY);
  });
  localStorage.removeItem(REMEMBER_ME_KEY);
};

// ─── Re-hydration ─────────────────────────────────────────────────────────────

/**
 * Attempt to restore auth state from storage on app start.
 * Checks localStorage first (rememberMe = true), then sessionStorage.
 */
const rehydrate = () => {
  const rememberMe = JSON.parse(
    localStorage.getItem(REMEMBER_ME_KEY) ?? 'false'
  );
  const storage = pickStorage(rememberMe);

  const accessToken  = storage.getItem(TOKEN_KEY);
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
  const userRaw      = storage.getItem(USER_KEY);

  if (!accessToken || !userRaw) {
    return { isAuthenticated: false, user: null, accessToken: null, refreshToken: null };
  }

  try {
    const user = JSON.parse(userRaw);
    return { isAuthenticated: true, user, accessToken, refreshToken };
  } catch {
    clearPersistedAuth();
    return { isAuthenticated: false, user: null, accessToken: null, refreshToken: null };
  }
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create((set, get) => ({
  // Initial state — re-hydrated from storage
  ...rehydrate(),

  /**
   * Called after a successful login or registration.
   *
   * @param {object} user          - { userId, email, fullName, systemRole, isActive, createdAt }
   * @param {string} accessToken   - JWT access token
   * @param {string} refreshToken  - JWT refresh token
   * @param {boolean} rememberMe   - whether to persist across browser sessions
   */
  login: (user, accessToken, refreshToken, rememberMe = false) => {
    persistAuth(accessToken, refreshToken, user, rememberMe);
    set({ isAuthenticated: true, user, accessToken, refreshToken });
  },

  /**
   * Clear all auth state and remove persisted credentials.
   * Best-effort server logout (blacklists tokens in Redis); clears client state regardless.
   */
  logout: async () => {
    const state = get();
    if (state.accessToken) {
      try {
        // Lazy import avoids circular dependency with api.js
        const { default: api } = await import('../services/api');
        await api.post('/api/auth/logout', { refreshToken: state.refreshToken });
      } catch {
        // Server logout is best-effort — clear client state regardless
      }
    }
    clearPersistedAuth();
    set({ isAuthenticated: false, user: null, accessToken: null, refreshToken: null });
  },

  /**
   * Update the stored user object (e.g. after a profile update).
   * Also refreshes the serialised copy in storage.
   *
   * @param {object} updatedUser
   */
  updateUser: (updatedUser) => {
    const rememberMe = JSON.parse(
      localStorage.getItem(REMEMBER_ME_KEY) ?? 'false'
    );
    const storage = pickStorage(rememberMe);
    storage.setItem(USER_KEY, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  /**
   * Replace both tokens after a token refresh or profile change.
   *
   * @param {string} accessToken
   * @param {string} refreshToken
   */
  updateTokens: (accessToken, refreshToken) => {
    const rememberMe = JSON.parse(
      localStorage.getItem(REMEMBER_ME_KEY) ?? 'false'
    );
    const storage = pickStorage(rememberMe);
    storage.setItem(TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },
}));