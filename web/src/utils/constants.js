// ─── Storage Keys ────────────────────────────────────────────────────────────
export const TOKEN_KEY         = 'committed_access_token';
export const REFRESH_TOKEN_KEY = 'committed_refresh_token';
export const USER_KEY          = 'committed_user';
export const REMEMBER_ME_KEY   = 'committed_remember_me';

// ─── Routes ──────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME:       '/',
  LOGIN:      '/login',
  REGISTER:   '/register',
  DASHBOARD:  '/dashboard',
  PROFILE:    '/profile',
  COURSES:    '/courses',
  ASSIGNMENTS:'/assignments',
  GRADES:     '/grades',
  ADMIN:      '/admin',
};

// ─── API ─────────────────────────────────────────────────────────────────────
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:           '/api/auth/login',
    REGISTER:        '/api/auth/register',
    REFRESH:         '/api/token/refresh',
  },
  USERS: {
    PROFILE:         '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/profile/change-password',
  },

  // ── Future endpoints (not yet implemented in backend) ──────────────────────
  // Uncomment each call site in dashboardService.js as the backend task lands.

  COURSES: {
    LIST:     '/api/courses',
    ENROLLED: '/api/courses/enrolled',   // COURSE-002
    TEACHING: '/api/courses/teaching',   // COURSE-001
    DETAIL:   (id) => `/api/courses/${id}`,
    ENROLL:   '/api/courses/enroll',
  },

  ASSIGNMENTS: {
    LIST:     '/api/assignments',
    UPCOMING: '/api/assignments/upcoming', // ASSIGN-001
    DETAIL:   (id) => `/api/assignments/${id}`,
    SUBMISSIONS: (id) => `/api/assignments/${id}/submissions`,
  },

  SUBMISSIONS: {
    DETAIL:           (id) => `/api/submissions/${id}`,
    GRADE:            (id) => `/api/submissions/${id}/grade`,
    ANALYSIS:         (id) => `/api/submissions/${id}/analysis`,
    TRIGGER_ANALYSIS: (id) => `/api/submissions/${id}/analyze`,
  },

  ANNOUNCEMENTS: {
    LIST:   '/api/announcements',
    RECENT: '/api/announcements/recent',  // COURSE-004
  },

  GRADES: {
    LIST:   '/api/grades',
    RECENT: '/api/grades/recent',         // GRADE-001
    DETAIL:   (id) => `/api/grades/${id}`,
  },

  ADMIN: {
    USERS: '/api/admin/users',            // AUTH-005
    USER:  (id) => `/api/admin/users/${id}`, // AUTH-005 (single user)
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