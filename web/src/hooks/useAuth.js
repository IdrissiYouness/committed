import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import { ROUTES } from '../utils/constants';

/**
 * useAuth — primary authentication hook for components.
 *
 * Composes the Zustand authStore (state) and authService (API calls)
 * into a single clean interface. Components never import the store or
 * service directly — they go through this hook.
 *
 * Returned shape:
 * {
 *   user:            object | null,
 *   accessToken:     string | null,
 *   isAuthenticated: boolean,
 *   login:           (email, password, rememberMe?) => Promise<{ success, error? }>
 *   register:        (email, fullName, password)   => Promise<{ success, error? }>
 *   logout:          ()                            => void
 * }
 */
export function useAuth() {
  const navigate = useNavigate();

  const {
    user,
    accessToken,
    isAuthenticated,
    login:       storeLogin,
    logout:      storeLogout,
    updateUser,
    updateTokens,
  } = useAuthStore();

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * Authenticate with email + password.
   *
   * On success — stores credentials via the Zustand store (which also persists
   * to localStorage/sessionStorage based on rememberMe) and navigates to the
   * dashboard.
   *
   * On failure — returns `{ success: false, error: <message string> }` so the
   * calling form can display the error without throwing.
   *
   * @param {string}  email
   * @param {string}  password
   * @param {boolean} [rememberMe=false]
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const handleLogin = async (email, password, rememberMe = false) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(email, password);
      storeLogin(user, accessToken, refreshToken, rememberMe);
      navigate(ROUTES.DASHBOARD, { replace: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ─── Register ─────────────────────────────────────────────────────────────

  /**
   * Register a new account.
   *
   * Gateway returns JWT tokens immediately on registration (no separate login
   * step). On success, the user is logged in and redirected to the dashboard.
   *
   * @param {string} email
   * @param {string} fullName
   * @param {string} password
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const handleRegister = async (email, fullName, password) => {
    try {
      const { accessToken, refreshToken, user } = await authService.register(
        email,
        fullName,
        password
      );
      // Registration always starts a remembered session (tokens in localStorage)
      storeLogin(user, accessToken, refreshToken, true);
      navigate(ROUTES.DASHBOARD, { replace: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ─── Logout ───────────────────────────────────────────────────────────────

  /**
   * Log out the current user.
   * Calls the server to blacklist tokens, clears all persisted credentials,
   * then redirects to /login.
   */
  const handleLogout = async () => {
    await storeLogout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  // ─── Expose ───────────────────────────────────────────────────────────────

  return {
    user,
    accessToken,
    isAuthenticated,
    login:       handleLogin,
    register:    handleRegister,
    logout:      handleLogout,
    updateUser,
    updateTokens,
  };
}