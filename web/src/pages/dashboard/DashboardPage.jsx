import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart2,
  Megaphone,
  RefreshCw,
  ArrowRight,
  Settings,
  UserCog,
  Activity,
} from 'lucide-react';

import { useAuthStore }      from '../../store/authStore';
import { useDashboard }      from '../../hooks/useDashboard';
import StatCard              from '../../components/features/dashboard/StatCard';
import CourseCard            from '../../components/features/dashboard/CourseCard';
import AssignmentItem        from '../../components/features/dashboard/AssignmentItem';
import AnnouncementItem      from '../../components/features/dashboard/AnnouncementItem';
import EmptyState            from '../../components/features/dashboard/EmptyState';
import SkeletonCard, { SkeletonListItem } from '../../components/features/dashboard/SkeletonCard';
import { ROUTES }            from '../../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max items to preview in each section before "View all" link kicks in */
const PREVIEW_LIMIT = 4;

// ─── Shared sub-components ────────────────────────────────────────────────────

/**
 * WelcomeBanner
 * Gradient hero card at the top of every dashboard variant.
 */
function WelcomeBanner({ user, isAdmin }) {
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 to-secondary-800 px-6 py-8 shadow-floating"
      aria-labelledby="welcome-heading"
    >
      {/* Decorative blobs */}
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

          {/* System role badge */}
          <span
            className={[
              'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1',
              'font-body text-xs font-semibold border',
              isAdmin
                ? 'bg-primary-700/60 text-primary-100 border-primary-600'
                : 'bg-secondary-700/60 text-secondary-100 border-secondary-600',
            ].join(' ')}
          >
            {isAdmin
              ? <><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Admin</>
              : <><Users className="h-3.5 w-3.5" aria-hidden="true" /> Member</>
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
  );
}

/**
 * DashboardSection
 * Section wrapper: heading row + "view all" link + children.
 * Handles loading and empty states declaratively.
 */
function DashboardSection({
  id,
  title,
  icon: Icon,
  viewAllTo,
  isLoading,
  isEmpty,
  emptyNode,
  children,
}) {
  return (
    <section aria-labelledby={id}>
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
              <Icon className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            </div>
          )}
          <h2
            id={id}
            className="font-display text-base font-bold text-neutral-900"
          >
            {title}
          </h2>
        </div>

        {viewAllTo && !isLoading && !isEmpty && (
          <Link
            to={viewAllTo}
            className="flex items-center gap-1 font-body text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
          >
            View all
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Content */}
      {isLoading
        ? null          /* skeleton rendered by caller for layout flexibility */
        : isEmpty
          ? emptyNode
          : children
      }
    </section>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3"
    >
      <p className="font-body text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-body text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}

// ─── User dashboard ───────────────────────────────────────────────────────────

const USER_STATS = (stats) => [
  {
    label:       'Enrolled Courses',
    value:       stats.enrolledCourses,
    icon:        BookOpen,
    colorClasses:'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    label:       'Teaching Courses',
    value:       stats.teachingCourses,
    icon:        GraduationCap,
    colorClasses:'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    label:       'Pending Assignments',
    value:       stats.pendingAssignments,
    icon:        ClipboardList,
    colorClasses:'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    label:       'Average Grade',
    value:       stats.avgGrade != null ? `${stats.avgGrade}%` : null,
    icon:        BarChart2,
    colorClasses:'bg-primary-50 text-primary-600 border-primary-100',
  },
];

function UserDashboard({ user, dashboardData }) {
  const {
    isLoading,
    error,
    enrolledCourses,
    teachingCourses,
    upcomingAssignments,
    recentAnnouncements,
    recentGrades,
    stats,
    refresh,
  } = dashboardData;

  const allCourses       = [...enrolledCourses, ...teachingCourses];
  const previewCourses   = allCourses.slice(0, PREVIEW_LIMIT);
  const previewAssign    = upcomingAssignments.slice(0, PREVIEW_LIMIT);
  const previewAnnounce  = recentAnnouncements.slice(0, PREVIEW_LIMIT);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      <WelcomeBanner user={user} isAdmin={false} />

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Your statistics</h2>
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="list">
          {USER_STATS(stats).map(({ label, value, icon, colorClasses }) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              icon={icon}
              colorClasses={colorClasses}
              isLoading={isLoading}
            />
          ))}
        </ul>
      </section>

      {/* ── My Courses ───────────────────────────────────────────────────── */}
      <DashboardSection
        id="courses-heading"
        title="My Courses"
        icon={BookOpen}
        viewAllTo={ROUTES.COURSES}
        isLoading={isLoading}
        isEmpty={!isLoading && allCourses.length === 0}
        emptyNode={
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Enrolled and teaching courses will appear here. Course enrollment is launching soon — check back shortly!"
            />
          </div>
        }
      >
        {/* Skeleton */}
        {isLoading && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Loading courses">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}><SkeletonCard lines={2} /></li>
            ))}
          </ul>
        )}

        {/* Real cards */}
        {!isLoading && previewCourses.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
            {previewCourses.map((course) => {
              const isTeaching = teachingCourses.some((c) => c.courseId === course.courseId);
              return (
                <li key={course.courseId}>
                  <CourseCard
                    course={course}
                    role={isTeaching ? 'professor' : 'student'}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      {/* ── Two-column layout: Assignments + Announcements ───────────────── */}
      <div className="grid gap-8 lg:grid-cols-2">

        {/* ── Upcoming Assignments ───────────────────────────────────────── */}
        <DashboardSection
          id="assignments-heading"
          title="Upcoming Assignments"
          icon={ClipboardList}
          viewAllTo={ROUTES.ASSIGNMENTS}
          isLoading={isLoading}
          isEmpty={!isLoading && upcomingAssignments.length === 0}
          emptyNode={
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
              <EmptyState
                icon={ClipboardList}
                title="All caught up!"
                description="You have no pending assignments. New assignments will appear here once your professors post them."
              />
            </div>
          }
        >
          {/* Skeleton */}
          {isLoading && (
            <ul className="flex flex-col gap-2" aria-label="Loading assignments">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </ul>
          )}

          {/* Real items */}
          {!isLoading && previewAssign.length > 0 && (
            <ul className="flex flex-col gap-2">
              {previewAssign.map((assignment) => (
                <AssignmentItem
                  key={assignment.assignmentId}
                  assignment={assignment}
                />
              ))}
            </ul>
          )}
        </DashboardSection>

        {/* ── Recent Announcements ──────────────────────────────────────── */}
        <DashboardSection
          id="announcements-heading"
          title="Recent Announcements"
          icon={Megaphone}
          isLoading={isLoading}
          isEmpty={!isLoading && recentAnnouncements.length === 0}
          emptyNode={
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
              <EmptyState
                icon={Megaphone}
                title="No announcements yet"
                description="Announcements from your courses will appear here as soon as professors post them."
              />
            </div>
          }
        >
          {/* Skeleton */}
          {isLoading && (
            <ul className="flex flex-col gap-2" aria-label="Loading announcements">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonListItem key={i} />
              ))}
            </ul>
          )}

          {/* Real items */}
          {!isLoading && previewAnnounce.length > 0 && (
            <ul className="flex flex-col gap-2">
              {previewAnnounce.map((announcement) => (
                <AnnouncementItem
                  key={announcement.announcementId}
                  announcement={announcement}
                />
              ))}
            </ul>
          )}
        </DashboardSection>
      </div>

      {/* ── Recent Grades ────────────────────────────────────────────────── */}
      <DashboardSection
        id="grades-heading"
        title="Recent Grades"
        icon={BarChart2}
        viewAllTo={ROUTES.GRADES}
        isLoading={isLoading}
        isEmpty={!isLoading && recentGrades.length === 0}
        emptyNode={
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
            <EmptyState
              icon={BarChart2}
              title="No grades yet"
              description="Your grades and AI-generated feedback will appear here once your professors review your submissions."
            />
          </div>
        }
      >
        {/* Skeleton */}
        {isLoading && (
          <ul className="flex flex-col gap-2" aria-label="Loading grades">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </ul>
        )}

        {/* Real items — grade rows rendered inline (GradeItem in WEB-005+) */}
        {!isLoading && recentGrades.length > 0 && (
          <ul className="flex flex-col gap-2">
            {recentGrades.slice(0, PREVIEW_LIMIT).map((grade) => (
              <li
                key={grade.gradeId}
                className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-100 bg-primary-50">
                  <BarChart2 className="h-4 w-4 text-primary-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm font-semibold text-neutral-800 truncate">
                    {grade.title}
                  </p>
                  <p className="font-body text-xs text-neutral-400 truncate">
                    {grade.courseName}
                  </p>
                </div>
                <span className="shrink-0 font-display text-base font-bold text-neutral-900 tabular-nums">
                  {grade.percentage}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

    </div>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────

const ADMIN_STATS = [
  { label: 'Total Users',        icon: Users,        colorClasses: 'bg-primary-50   text-primary-600   border-primary-100'   },
  { label: 'Active Courses',     icon: BookOpen,     colorClasses: 'bg-secondary-50 text-secondary-600 border-secondary-100' },
  { label: 'Total Assignments',  icon: ClipboardList, colorClasses: 'bg-primary-50   text-primary-600   border-primary-100'  },
];

const ADMIN_TOOLS = [
  {
    title:       'User Management',
    description: 'View, activate, deactivate and assign roles to platform users.',
    icon:        UserCog,
    badge:       'AUTH-005',
    accent:      'hover:border-primary-300 hover:shadow-elevated',
    iconColor:   'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    title:       'Course Management',
    description: 'Oversee all courses, manage enrollments and resolve disputes.',
    icon:        BookOpen,
    badge:       'COURSE-001',
    accent:      'hover:border-secondary-300 hover:shadow-elevated',
    iconColor:   'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    title:       'System Monitoring',
    description: 'Track platform health, service statuses and activity logs.',
    icon:        Activity,
    badge:       'WEB-007',
    accent:      'hover:border-primary-300 hover:shadow-elevated',
    iconColor:   'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    title:       'Platform Settings',
    description: 'Configure global platform settings and feature flags.',
    icon:        Settings,
    badge:       'WEB-007',
    accent:      'hover:border-secondary-300 hover:shadow-elevated',
    iconColor:   'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
];

function AdminDashboard({ user }) {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      <WelcomeBanner user={user} isAdmin />

      {/* ── Platform stats ───────────────────────────────────────────────── */}
      <section aria-labelledby="admin-stats-heading">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
            <BarChart2 className="h-4 w-4 text-neutral-500" aria-hidden="true" />
          </div>
          <h2
            id="admin-stats-heading"
            className="font-display text-base font-bold text-neutral-900"
          >
            Platform Overview
          </h2>
        </div>

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
          {ADMIN_STATS.map(({ label, icon, colorClasses }) => (
            <StatCard
              key={label}
              label={label}
              value={null}   /* will be real data once AUTH-005 / COURSE-003 lands */
              icon={icon}
              colorClasses={colorClasses}
            />
          ))}
        </ul>

        <p className="mt-3 font-body text-xs text-neutral-400 text-center">
          Live platform statistics will be available when admin APIs are implemented (AUTH-005).
        </p>
      </section>

      {/* ── Admin tools ──────────────────────────────────────────────────── */}
      <section aria-labelledby="admin-tools-heading">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100">
              <ShieldCheck className="h-4 w-4 text-neutral-500" aria-hidden="true" />
            </div>
            <h2
              id="admin-tools-heading"
              className="font-display text-base font-bold text-neutral-900"
            >
              Administration Tools
            </h2>
          </div>
          <span className="font-body text-xs text-neutral-400">
            More tools coming soon
          </span>
        </div>

        <ul className="grid gap-4 sm:grid-cols-2" role="list">
          {ADMIN_TOOLS.map(({ title, description, icon: Icon, badge, accent, iconColor }) => (
            <li key={title}>
              <div
                className={[
                  'flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5',
                  'shadow-elegant opacity-50 cursor-not-allowed',
                ].join(' ')}
                aria-label={`${title} — coming soon`}
                title={`Coming soon — ${badge}`}
              >
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconColor}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-neutral-900">
                      {title}
                    </h3>
                    <span className="font-mono text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                      soon
                    </span>
                  </div>
                  <p className="mt-1 font-body text-xs text-neutral-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Profile quick link (the one thing that IS ready) ─────────────── */}
      <section aria-labelledby="admin-profile-heading" className="pb-2">
        <h2 id="admin-profile-heading" className="sr-only">Quick access</h2>
        <Link
          to={ROUTES.PROFILE}
          className={[
            'group flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5',
            'shadow-elegant hover:border-primary-300 hover:shadow-elevated transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          ].join(' ')}
        >
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary-100 bg-primary-50">
            <Settings className="h-5 w-5 text-primary-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors duration-150">
              My Profile
            </h3>
            <p className="mt-0.5 font-body text-xs text-neutral-500">
              Update your name, email and password.
            </p>
          </div>
          <ArrowRight
            className="h-4 w-4 text-primary-400 transition-transform duration-200 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </section>

    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * DashboardPage
 *
 * The home page for all authenticated users.
 * Renders one of two views based on system_role:
 *
 *   admin → AdminDashboard — platform overview + admin tool stubs
 *   user  → UserDashboard  — personal courses / assignments / grades / announcements
 *
 * Data is provided by useDashboard() which calls dashboardService.js.
 * All sections degrade gracefully: skeleton while loading, empty-state when
 * no data, real content when APIs return results.
 */
export default function DashboardPage() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const dashboardData = useDashboard();

  if (isAdmin) {
    return <AdminDashboard user={user} />;
  }

  return <UserDashboard user={user} dashboardData={dashboardData} />;
}