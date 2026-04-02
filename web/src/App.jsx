import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/auth/LoginPage';
import RegisterPage   from './pages/auth/RegisterPage';
import DashboardPage  from './pages/dashboard/DashboardPage';
import ProfilePage    from './pages/profile/ProfilePage';
import AdminPage      from './pages/admin/AdminPage';
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CourseFormPage from './pages/courses/CourseFormPage';
import AnnouncementFormPage from './pages/courses/AnnouncementFormPage';
import AnnouncementDetailPage from './pages/courses/AnnouncementDetailPage';
import AssignmentListPage from './pages/assignments/AssignmentListPage';
import AssignmentDetailPage from './pages/assignments/AssignmentDetailPage';
import AssignmentFormPage from './pages/assignments/AssignmentFormPage';
import AssignmentSubmissionsPage from './pages/assignments/AssignmentSubmissionsPage';
import GradesPage from './pages/grades/GradesPage';
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

        <Route
          path={ROUTES.COURSES}
          element={
            <AuthLayout>
              <CourseListPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/new`}
          element={
            <AuthLayout>
              <CourseFormPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/:id`}
          element={
            <AuthLayout>
              <CourseDetailPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/:id/edit`}
          element={
            <AuthLayout>
              <CourseFormPage />
            </AuthLayout>
          }
        />

        {/* Assignments Routes inside Course (Creation) */}
        <Route
          path={`${ROUTES.COURSES}/:courseId/assignments/new`}
          element={
            <AuthLayout>
              <AssignmentFormPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/:courseId/assignments/:id/edit`}
          element={
            <AuthLayout>
              <AssignmentFormPage />
            </AuthLayout>
          }
        />
        
        {/* Announcements Routes inside Course (Creation) */}
        <Route
          path={`${ROUTES.COURSES}/:courseId/announcements/new`}
          element={
            <AuthLayout>
              <AnnouncementFormPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/:courseId/announcements/:id/edit`}
          element={
            <AuthLayout>
              <AnnouncementFormPage />
            </AuthLayout>
          }
        />
        <Route
          path={`${ROUTES.COURSES}/:courseId/announcements/:announcementId`}
          element={
            <AuthLayout>
              <AnnouncementDetailPage />
            </AuthLayout>
          }
        />

        <Route
          path={ROUTES.ASSIGNMENTS}
          element={
            <AuthLayout>
              <AssignmentListPage />
            </AuthLayout>
          }
        />

        <Route
          path={`${ROUTES.ASSIGNMENTS}/:id`}
          element={
            <AuthLayout>
              <AssignmentDetailPage />
            </AuthLayout>
          }
        />

        <Route
          path={`${ROUTES.ASSIGNMENTS}/:id/submissions`}
          element={
            <AuthLayout>
              <AssignmentSubmissionsPage />
            </AuthLayout>
          }
        />

        <Route
          path={ROUTES.GRADES}
          element={
            <AuthLayout>
              <GradesPage />
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
