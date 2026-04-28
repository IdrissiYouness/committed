import api from './api';
import { API_ENDPOINTS, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '../utils/constants';

/**
 * Authentication Service
 *
 * Wraps the Gateway /api/auth/* endpoints.
 * The axios instance in api.js unwraps the { success, data, message } envelope,
 * so every function here receives the inner `data` object directly.
 *
 * Gateway response shape for login/register:
 * {
 *   accessToken:  string,
 *   refreshToken: string,
 *   tokenType:    "Bearer",
 *   user: {
 *     userId:     number,
 *     email:      string,
 *     fullName:   string,
 *     systemRole: string,
 *     isActive:   boolean,
 *     createdAt:  string,
 *   }
 * }
 */

/**
 * Log in with email + password.
 * Returns the unwrapped auth payload on success.
 * Throws a normalised Error (with `.message` and optionally `.fieldErrors`) on failure.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
export const login = async (email, password) => {
  const data = await api.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  return data;
};

/**
 * Register a new account.
 * Gateway creates the user in Core, hashes the password, and returns JWT tokens
 * immediately — no separate login step required.
 *
 * @param {string} email
 * @param {string} fullName
 * @param {string} password
 * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
 */
export const register = async (email, fullName, password) => {
  const data = await api.post(API_ENDPOINTS.AUTH.REGISTER, { email, fullName, password });
  return data;
};

/**
 * Log out the current user.
 * JWTs are stateless so there is no server-side revocation call.
 * This simply removes persisted credentials from storage.
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const authService = { login, register, logout };
export default authService;