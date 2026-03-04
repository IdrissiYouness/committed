// ─── Storage Keys ────────────────────────────────────────────────────────────
export const TOKEN_KEY         = 'committed_access_token';
export const REFRESH_TOKEN_KEY = 'committed_refresh_token';
export const USER_KEY          = 'committed_user';
export const REMEMBER_ME_KEY   = 'committed_remember_me';

// ─── Routes ──────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME:      '/',
  LOGIN:     '/login',
  REGISTER:  '/register',
  DASHBOARD: '/dashboard',
};

// ─── API ─────────────────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:    '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  USERS: {
    PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/profile/change-password',
  },
};

// ─── App ─────────────────────────────────────────────────────────────────────
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Committed';

// ─── Validation ──────────────────────────────────────────────────────────────
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 255,
  EMAIL_MAX_LENGTH: 255,
};

// ─── Toast Durations (ms) ────────────────────────────────────────────────────
export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR:   5000,
  LOADING: Infinity,
};