import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitCommit, Zap, GraduationCap, Users, ShieldCheck } from 'lucide-react';

import RegisterForm from '../../components/features/auth/RegisterForm';
import { useAuthStore } from '../../store/authStore';
import { ROUTES, APP_NAME } from '../../utils/constants';

/**
 * RegisterPage
 *
 * Full-page registration layout — mirrors LoginPage's two-column design.
 * Brand panel is on the RIGHT on md+ (form left, brand right) to provide
 * visual variety when navigating between the two auth pages.
 *
 * Design tokens used:
 *   - primary-800/700/600   — brand panel background (deep navy)
 *   - secondary-500/600     — teal accent (links, highlights)
 *   - neutral-*             — backgrounds, text
 *   - shadow-floating       — card elevation
 *   - animate-scale-in      — card entrance animation
 *   - font-display          — Quicksand for headings
 *   - font-body             — Nunito for body text
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Redirect already-authenticated users away from the register page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      {/* Page shell */}
      <div className="min-h-screen bg-gradient-to-bl from-neutral-100 via-secondary-50 to-primary-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">

        {/* Card container */}
        <div className="w-full max-w-4xl animate-scale-in">
          <div className="overflow-hidden rounded-3xl shadow-floating bg-white flex flex-col md:flex-row-reverse">

            {/* ── Right (visually): Brand panel ───────────────────────────── */}
            <div className="relative flex flex-col justify-between bg-primary-800 p-8 md:p-10 md:w-[42%] overflow-hidden">

              {/* Background decoration */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-secondary-700 opacity-20" />
                <div className="absolute -bottom-20 -left-12 h-80 w-80 rounded-full bg-primary-700 opacity-40" />
                <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-secondary-600 opacity-10" />
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
                <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
                  Start your<br />journey
                </h2>
                <p className="font-body text-primary-200 text-base leading-relaxed">
                  Join thousands of students and educators on Committed — the platform built for serious learning.
                </p>

                {/* Benefits list */}
                <ul className="mt-7 flex flex-col gap-3" aria-label="Registration benefits">
                  {BENEFITS.map(({ icon, text }) => (
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

            {/* ── Left (visually): Form panel ─────────────────────────────── */}
            <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 md:py-12">

              {/* Heading */}
              <div className="mb-7">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                  Create your account
                </h1>
                <p className="mt-2 font-body text-sm text-neutral-500">
                  Already have an account?{' '}
                  <Link
                    to={ROUTES.LOGIN}
                    className="font-semibold text-secondary-600 hover:text-secondary-700 hover:underline transition-colors duration-150 focus:outline-none focus:underline"
                  >
                    Sign in instead
                  </Link>
                </p>
              </div>

              {/* Form */}
              <RegisterForm />
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

// ─── Static data ─────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: <Zap className="h-4 w-4" />, text: 'Get started in under 2 minutes' },
  { icon: <GraduationCap className="h-4 w-4" />, text: 'Access structured learning paths' },
  { icon: <Users className="h-4 w-4" />, text: 'Collaborate with peers and instructors' },
  { icon: <ShieldCheck className="h-4 w-4" />, text: 'Your data is always secure' },
];

// ─── Inline logo SVG ─────────────────────────────────────────────────────────

function CommittedLogo() {
  return <GitCommit className="h-6 w-6 text-white" aria-hidden="true" />;
}