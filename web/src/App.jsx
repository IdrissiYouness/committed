import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck, GraduationCap } from 'lucide-react';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useAuthStore } from './store/authStore';
import { ROUTES } from './utils/constants';

// ─── Dashboard placeholder ────────────────────────────────────────────────────
// Minimal stand-in until WEB-002 implements the real dashboard.
function DashboardPlaceholder() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-elevated p-8 flex flex-col items-center gap-4 animate-scale-in">
        {/* Avatar */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 text-2xl font-display font-bold shadow-elegant">
          {user?.fullName?.[0]?.toUpperCase() ?? '?'}
        </div>

        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome back, {user?.fullName?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="mt-1 font-body text-sm text-neutral-500">
            {user?.email}
          </p>
          <span className="mt-3 inline-flex items-center rounded-full bg-secondary-50 px-3 py-1 text-xs font-semibold text-secondary-700 border border-secondary-200">
            {user?.systemRole?.toLowerCase() === 'admin'
              ? <><ShieldCheck className="inline h-3.5 w-3.5 mr-1" />Admin</>
              : <><GraduationCap className="inline h-3.5 w-3.5 mr-1" />User</>}
          </span>
        </div>

        <div className="w-full rounded-xl bg-primary-50 border border-primary-100 p-4 text-center">
          <p className="font-body text-sm text-primary-700">
            Dashboard UI is coming in <strong>WEB-002</strong>. Auth is working! 
          </p>
        </div>

        <button
          onClick={() => {
            logout();
            window.location.href = ROUTES.LOGIN;
          }}
          className="mt-2 font-body text-sm text-neutral-500 hover:text-error transition-colors duration-150 focus:outline-none focus:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
// Redirects unauthenticated users to /login.
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root → redirect to login */}
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* Public auth pages */}
        <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* Protected */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardPlaceholder />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </BrowserRouter>
  );
}