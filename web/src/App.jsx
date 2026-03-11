import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/auth/LoginPage';
import RegisterPage   from './pages/auth/RegisterPage';
import DashboardPage  from './pages/dashboard/DashboardPage';
import ProfilePage    from './pages/profile/ProfilePage';
import AdminPage      from './pages/admin/AdminPage';
import AppLayout      from './components/layout/AppLayout';
import { useAuthStore } from './store/authStore';
import { ROUTES } from './utils/constants';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated
    ? children
    : <Navigate to={ROUTES.LOGIN} replace />;
}

function AdminRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user.systemRole?.toLowerCase() !== 'admin')
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  return children;
}

// Combines ProtectedRoute + AppLayout so every authenticated page
// gets the header, sidebar and breadcrumbs without repeating the wrapper.

function AuthLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </ProtectedRoute>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public routes ──────────────────────────────────────────────── */}
        <Route path={ROUTES.HOME}     element={<LandingPage />} />
        <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

        {/* ── Authenticated routes (AppLayout shell) ─────────────────────── */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <AuthLayout>
              <DashboardPage />
            </AuthLayout>
          }
        />

        <Route
          path={ROUTES.PROFILE}
          element={
            <AuthLayout>
              <ProfilePage />
            </AuthLayout>
          }
        />

        {/* ── Admin route (admin role required) ──────────────────────────── */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <AdminRoute>
              <AppLayout>
                <AdminPage />
              </AppLayout>
            </AdminRoute>
          }
        />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />

      </Routes>
    </BrowserRouter>
  );
}