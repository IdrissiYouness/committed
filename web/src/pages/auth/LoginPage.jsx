import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitCommit, BookOpen, ClipboardCheck, BarChart2 } from 'lucide-react';

import LoginForm from '../../components/features/auth/LoginForm';
import { useAuthStore } from '../../store/authStore';
import { ROUTES, APP_NAME } from '../../utils/constants';

/**
 * LoginPage
 *
 * Full-page layout for authentication.
 * Layout: two-column on md+ (brand panel left, form right), single column on mobile.
 *
 * Design tokens used:
 *   - primary-500/600/700   — brand colour (deep navy)
 *   - secondary-500/600     — teal accent (links, highlights)
 *   - neutral-*             — backgrounds, text
 *   - shadow-floating       — card elevation
 *   - animate-scale-in      — card entrance animation
 *   - font-display          — Quicksand for headings
 *   - font-body             — Nunito for body text
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      {/* Page shell */}
      <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-primary-50 to-secondary-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">

        {/* Card container */}
        <div className="w-full max-w-4xl animate-scale-in">
          <div className="overflow-hidden rounded-3xl shadow-floating bg-white flex flex-col md:flex-row">

            {/* ── Left: Brand panel ───────────────────────────────────────── */}
            <div className="relative flex flex-col justify-between bg-primary-800 p-8 md:p-10 md:w-[42%] overflow-hidden">

              {/* Background decoration */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-primary-700 opacity-40" />
                <div className="absolute -bottom-20 -right-12 h-80 w-80 rounded-full bg-secondary-700 opacity-20" />
                <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600 opacity-10" />
              </div>

              {/* Logo + name */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm shadow-elegant">
                  <CommittedLogo />
                </div>
                <span className="font-display text-xl font-bold text-white tracking-tight">
                  {APP_NAME}
                </span>
              </div>

              {/* Hero copy */}
              <div className="relative z-10 my-8 md:my-0">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
                  Welcome<br />back
                </h1>
                <p className="font-body text-primary-200 text-base leading-relaxed">
                  Your learning journey continues here. Sign in to access your courses, assignments, and progress.
                </p>

                {/* Feature list */}
                <ul className="mt-7 flex flex-col gap-3" aria-label="Platform features">
                  {FEATURES.map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-secondary-300 text-sm">
                        {icon}
                      </span>
                      <span className="font-body text-sm text-primary-100">{text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer note */}
              <p className="relative z-10 font-body text-xs text-primary-300 mt-4 md:mt-0">
                © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
              </p>
            </div>

            {/* ── Right: Form panel ───────────────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:py-14">

              {/* Heading */}
              <div className="mb-8">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                  Sign in to your account
                </h2>
                <p className="mt-2 font-body text-sm text-neutral-500">
                  Don&apos;t have an account?{' '}
                  <Link
                    to={ROUTES.REGISTER}
                    className="font-semibold text-secondary-600 hover:text-secondary-700 hover:underline transition-colors duration-150 focus:outline-none focus:underline"
                  >
                    Create one for free
                  </Link>
                </p>
              </div>

              {/* Form */}
              <LoginForm />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <BookOpen className="h-4 w-4" />, text: 'Access all your courses in one place' },
  { icon: <ClipboardCheck className="h-4 w-4" />, text: 'Track assignments and deadlines' },
  { icon: <BarChart2 className="h-4 w-4" />, text: 'Monitor your progress over time' },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

function CommittedLogo() {
  return <GitCommit className="h-6 w-6 text-white" aria-hidden="true" />;
}