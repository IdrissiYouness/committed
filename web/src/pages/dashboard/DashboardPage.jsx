import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, GraduationCap, BookOpen, ClipboardList, BarChart2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

/**
 * DashboardPage
 *
 * The home page for authenticated users.
 * Replaces the DashboardPlaceholder from App.jsx.
 *
 * Sections:
 *   1. Welcome banner — greets the user by first name + role badge
 *   2. Quick stats row — placeholder counters (will be real data in WEB-003+)
 *   3. Quick actions — cards linking to main sections (dimmed if not ready)
 */

// ─── Quick stats data ─────────────────────────────────────────────────────────

const STATS = [
  { label: 'Courses Enrolled',      value: '—', icon: BookOpen,     color: 'bg-primary-50 text-primary-600 border-primary-100'   },
  { label: 'Assignments Pending',   value: '—', icon: ClipboardList, color: 'bg-secondary-50 text-secondary-600 border-secondary-100' },
  { label: 'Submissions Made',      value: '—', icon: BarChart2,     color: 'bg-primary-50 text-primary-600 border-primary-100'   },
];

// ─── Quick actions ────────────────────────────────────────────────────────────

const ACTIONS = [
  {
    title:       'Browse Courses',
    description: 'View all available courses and manage your enrollments.',
    icon:        BookOpen,
    to:          ROUTES.COURSES,
    ready:       false,
    badge:       'WEB-003',
    accent:      'hover:border-primary-300 hover:shadow-elevated',
    iconColor:   'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    title:       'My Assignments',
    description: 'Check upcoming deadlines and submit your work.',
    icon:        ClipboardList,
    to:          ROUTES.ASSIGNMENTS,
    ready:       false,
    badge:       'WEB-004',
    accent:      'hover:border-secondary-300 hover:shadow-elevated',
    iconColor:   'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    title:       'My Grades',
    description: 'Review your AI-generated feedback and final grades.',
    icon:        BarChart2,
    to:          ROUTES.GRADES,
    ready:       false,
    badge:       'WEB-005',
    accent:      'hover:border-primary-300 hover:shadow-elevated',
    iconColor:   'bg-primary-50 text-primary-600 border-primary-100',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* ── 1. Welcome banner ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 to-secondary-800 px-6 py-8 shadow-floating"
        aria-labelledby="welcome-heading"
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary-700 opacity-40 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-secondary-700 opacity-20 blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              id="welcome-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1.5 font-body text-sm text-primary-200">
              {user?.email}
            </p>

            {/* Role badge */}
            <span className={[
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1',
              'font-body text-xs font-semibold border',
              isAdmin
                ? 'bg-primary-700/60 text-primary-100 border-primary-600'
                : 'bg-secondary-700/60 text-secondary-100 border-secondary-600',
            ].join(' ')}>
              {isAdmin
                ? <><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Admin</>
                : <><GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Student</>
              }
            </span>
          </div>

          {/* Member since */}
          {user?.createdAt && (
            <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm text-center">
              <p className="font-body text-xs text-primary-300 mb-0.5">Member since</p>
              <p className="font-display text-sm font-bold text-white">
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  month: 'short',
                  year:  'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Quick stats ─────────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Your statistics</h2>
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
          role="list"
        >
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <li
              key={label}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-elegant"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-neutral-900 tabular-nums">
                  {value}
                </p>
                <p className="font-body text-xs text-neutral-500">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 3. Quick actions ───────────────────────────────────────────────── */}
      <section aria-labelledby="actions-heading">
        <div className="mb-5 flex items-center justify-between">
          <h2
            id="actions-heading"
            className="font-display text-lg font-bold text-neutral-900"
          >
            Quick Actions
          </h2>
          <span className="font-body text-xs text-neutral-400">
            More features coming soon
          </span>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {ACTIONS.map(({ title, description, icon: Icon, to, ready, badge, accent, iconColor }) => (
            <li key={title}>
              {ready ? (
                <Link
                  to={to}
                  className={[
                    'group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5',
                    'shadow-elegant transition-all duration-200',
                    accent,
                  ].join(' ')}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconColor}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-bold text-neutral-900">{title}</h3>
                    <p className="mt-1 font-body text-sm text-neutral-500 leading-relaxed">{description}</p>
                  </div>
                  <div className="flex items-center gap-1 font-body text-sm font-semibold text-primary-600">
                    Go
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </div>
                </Link>
              ) : (
                <div
                  className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-elegant opacity-50 cursor-not-allowed"
                  aria-label={`${title} — coming soon`}
                  title={`Coming soon — ${badge}`}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconColor}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-base font-bold text-neutral-900">{title}</h3>
                      <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                        soon
                      </span>
                    </div>
                    <p className="mt-1 font-body text-sm text-neutral-500 leading-relaxed">{description}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}