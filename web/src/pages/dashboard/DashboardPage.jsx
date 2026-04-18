import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
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
import { useAdminUsers }     from '../../hooks/useAdminUsers';
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

const CONTEXT_STATS = {
  teacher: (metrics = {}) => [
    {
      label:       'Courses Teaching',
      value:       metrics.coursesTeaching ?? 0,
      icon:        GraduationCap,
      colorClasses:'bg-secondary-50 text-secondary-600 border-secondary-100',
    },
    {
      label:       'Ungraded Submissions',
      value:       metrics.ungradedSubmissions ?? 0,
      icon:        ClipboardList,
      colorClasses:'bg-warning-50 text-warning-700 border-warning-100',
    },
    {
      label:       'Announcements Posted',
      value:       metrics.announcementsPosted ?? 0,
      icon:        Megaphone,
      colorClasses:'bg-primary-50 text-primary-600 border-primary-100',
    },
  ],
  student: (metrics = {}) => [
    {
      label:       'Courses Enrolled',
      value:       metrics.coursesEnrolled ?? 0,
      icon:        BookOpen,
      colorClasses:'bg-primary-50 text-primary-600 border-primary-100',
    },
    {
      label:       'Pending Assignments',
      value:       metrics.pendingAssignments ?? 0,
      icon:        ClipboardList,
      colorClasses:'bg-warning-50 text-warning-700 border-warning-100',
    },
    {
      label:       'Recent Grades',
      value:       metrics.recentGrades ?? 0,
      icon:        BarChart2,
      colorClasses:'bg-secondary-50 text-secondary-600 border-secondary-100',
    },
  ],
};

function UserDashboard({ user, dashboardData }) {
  const {
    isLoading,
    error,
    enrolledCourses,
    teachingCourses,
    upcomingAssignments,
    recentAnnouncements,
    recentGrades,
    roleContext,
    roleMetrics,
    view,
    refresh,
  } = dashboardData;

  const allCourses      = [...enrolledCourses, ...teachingCourses];
  const previewCourses  = allCourses.slice(0, PREVIEW_LIMIT);
  const previewAnnounce = recentAnnouncements.slice(0, PREVIEW_LIMIT);

  const isMixedContext = !!roleContext?.isMixed;
  const [mixedContextView, setMixedContextView] = useState('teacher');

  const effectiveContext = isMixedContext
    ? mixedContextView
    : roleContext?.primaryRole === 'teacher'
      ? 'teacher'
      : 'student';

  const scopedAssignments = upcomingAssignments.filter((assignment) => {
    const assignmentContext = (assignment?.roleContext || '').toLowerCase();
    if (effectiveContext === 'teacher') return assignmentContext === 'teacher';
    return assignmentContext !== 'teacher';
  });

  const previewAssign = scopedAssignments.slice(0, PREVIEW_LIMIT);

  const statItems = CONTEXT_STATS[effectiveContext](
    roleMetrics?.[effectiveContext] ?? {}
  );

  const assignmentsSectionTitle =
    effectiveContext === 'teacher'
      ? 'Active Assignments'
      : view?.assignmentsSectionTitle || 'Upcoming Assignments';

  const assignmentsEmptyTitle =
    effectiveContext === 'teacher'
      ? 'No active assignments'
      : view?.assignmentsEmptyTitle || 'All caught up!';

  const assignmentsEmptyDescription =
    effectiveContext === 'teacher'
      ? 'Assignments waiting for submissions or grading will appear here.'
      : view?.assignmentsEmptyDescription ||
        'You have no pending assignments. New assignments will appear here once your professors post them.';

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-8">

      {/* ── Welcome banner ───────────────────────────────────────────────── */}
      <WelcomeBanner user={user} isAdmin={false} />

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      {/* ── Context toggle (when mixed role across courses) ─────────────── */}
      {isMixedContext && (
        <section aria-label="Dashboard context selector">
          <div className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-elegant">
            <button
              type="button"
              onClick={() => setMixedContextView('teacher')}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                mixedContextView === 'teacher'
                  ? 'bg-secondary-50 text-secondary-700'
                  : 'text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
            >
              Teacher view
            </button>
            <button
              type="button"
              onClick={() => setMixedContextView('student')}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                mixedContextView === 'student'
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-100',
              ].join(' ')}
            >
              Student view
            </button>
          </div>
        </section>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Your statistics</h2>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3" role="list">
          {statItems.map(({ label, value, icon, colorClasses }) => (
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
              description="You don’t have any teaching or enrolled courses yet."
              actionLabel="Browse courses"
              actionTo={ROUTES.COURSES}
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
          title={assignmentsSectionTitle}
          icon={ClipboardList}
          viewAllTo={ROUTES.ASSIGNMENTS}
          isLoading={isLoading}
          isEmpty={!isLoading && scopedAssignments.length === 0}
          emptyNode={
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
              <EmptyState
                icon={ClipboardList}
                title={assignmentsEmptyTitle}
                description={assignmentsEmptyDescription}
                actionLabel="Open assignments"
                actionTo={ROUTES.ASSIGNMENTS}
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
                description="Course updates will show up here when instructors post in the class thread."
                actionLabel="Open courses"
                actionTo={ROUTES.COURSES}
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

      {/* ── Needs Grading (Teacher) ──────────────────────────────────────── */}
      {effectiveContext === 'teacher' && (
        <DashboardSection
          id="needs-grading-heading"
          title="Needs Grading"
          icon={ClipboardList}
          viewAllTo={ROUTES.COURSES}
          isLoading={isLoading}
          isEmpty={!isLoading && scopedAssignments.filter(a => a.ungradedCount > 0).length === 0}
          emptyNode={
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-elegant">
              <EmptyState
                icon={ClipboardList}
                title="All caught up!"
                description="You have no ungraded submissions waiting for your review."
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

          {/* Needs Grading List */}
          {!isLoading && scopedAssignments.filter(a => a.ungradedCount > 0).length > 0 && (
            <ul className="flex flex-col gap-2">
              {scopedAssignments
                .filter(a => a.ungradedCount > 0)
                .slice(0, PREVIEW_LIMIT)
                .map((assignment) => (
                  <li key={assignment.assignmentId}>
                    <Link
                      to={`${ROUTES.ASSIGNMENTS}/${assignment.assignmentId}/submissions`}
                      className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3 hover:border-secondary-200 hover:bg-secondary-50/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-secondary-100 bg-secondary-50">
                        <ClipboardList className="h-4 w-4 text-secondary-600" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-semibold text-neutral-800 truncate">
                          {assignment.title}
                        </p>
                        <p className="font-body text-xs text-neutral-400 truncate">
                          {assignment.courseName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-bold text-secondary-800">
                        {assignment.ungradedCount} to grade
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </DashboardSection>
      )}

      {/* ── Recent Grades ────────────────────────────────────────────────── */}
      {effectiveContext !== 'teacher' && (
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

        {/* Real items — each grade navigates to assignment detail */}
        {!isLoading && recentGrades.length > 0 && (
          <ul className="flex flex-col gap-2">
            {recentGrades.slice(0, PREVIEW_LIMIT).map((grade) => (
              <li key={grade.gradeId}>
                <Link
                  to={`${ROUTES.ASSIGNMENTS}/${grade.assignmentId}`}
                  className="flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3 hover:border-primary-200 hover:bg-primary-50/30 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
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
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
      )}

    </div>
  );
}

// ─── Admin dashboard ──────────────────────────────────────────────────────────

const ADMIN_STATS_CONFIG = [
  { label: 'Total Users',    icon: Users,      colorClasses: 'bg-primary-50   text-primary-600   border-primary-100',   statKey: 'total'      },
  { label: 'Active Users',   icon: UserCheck,  colorClasses: 'bg-secondary-50 text-secondary-600 border-secondary-100', statKey: 'active'     },
  { label: 'Admins',         icon: ShieldCheck,colorClasses: 'bg-primary-50   text-primary-700   border-primary-100',   statKey: 'adminCount' },
  { label: 'Inactive Users', icon: UserX,      colorClasses: 'bg-neutral-50   text-neutral-500   border-neutral-200',   statKey: 'inactive'   },
];

const ADMIN_TOOLS = [
  {
    title:       'User Management',
    description: 'View, activate, deactivate and assign roles to platform users.',
    icon:        UserCog,
    to:          ROUTES.ADMIN,
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
  const { stats, isLoadingStats } = useAdminUsers();

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

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {ADMIN_STATS_CONFIG.map(({ label, icon, colorClasses, statKey }) => (
            <StatCard
              key={label}
              label={label}
              value={stats[statKey] ?? null}
              icon={icon}
              colorClasses={colorClasses}
              isLoading={isLoadingStats}
            />
          ))}
        </ul>
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
          {ADMIN_TOOLS.map(({ title, description, icon: Icon, badge, accent, iconColor, to }) => (
            <li key={title}>
              {to ? (
                /* ── Live tool card: renders as a navigable Link ── */
                <Link
                  to={to}
                  className={[
                    'group flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-5',
                    'shadow-elegant transition-all duration-200',
                    accent,
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  ].join(' ')}
                  aria-label={title}
                >
                  <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${iconColor}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-sm font-bold text-neutral-900 group-hover:text-primary-700 transition-colors duration-150">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-1 font-body text-xs text-neutral-500 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 text-primary-400 self-end transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                /* ── Coming-soon tool card: non-interactive ── */
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
              )}
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