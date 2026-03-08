import { Link } from 'react-router-dom';
import { BookOpen, Users, Tag, Lock } from 'lucide-react';

import SkeletonCard from './SkeletonCard';
import { ROUTES } from '../../../utils/constants';

/**
 * CourseCard
 *
 * Displays a single course inside the dashboard "My Courses" section.
 * Adapts its role badge and accent colour based on whether the user is
 * enrolled as a student or is the teaching professor.
 *
 * Props:
 *   course   — course object (see shape below)
 *   role     — 'student' | 'professor'  (default: 'student')
 *   isLoading — renders a SkeletonCard instead of real content
 *   className — extra Tailwind classes for the card wrapper
 *
 * Course shape:
 * {
 *   courseId:        number,
 *   courseCode:      string,
 *   courseName:      string,
 *   subject:         string | null,
 *   section:         string | null,
 *   teacherName:     string | null,   // student view
 *   enrollmentCount: number  | null,  // professor view
 *   isOpen:          boolean,
 * }
 */
export default function CourseCard({ course, role = 'student', isLoading = false, className = '' }) {
  if (isLoading) {
    return <SkeletonCard lines={2} className={className} />;
  }

  const isProfessor = role === 'professor';

  const roleBadge = isProfessor
    ? { label: 'Professor', classes: 'bg-secondary-50 text-secondary-700 border-secondary-100' }
    : { label: 'Student',   classes: 'bg-primary-50  text-primary-700  border-primary-100'    };

  const iconClasses = isProfessor
    ? 'bg-secondary-50 text-secondary-600 border-secondary-100'
    : 'bg-primary-50  text-primary-600  border-primary-100';

  const hoverClasses = isProfessor
    ? 'hover:border-secondary-300 hover:shadow-elevated'
    : 'hover:border-primary-300  hover:shadow-elevated';

  return (
    <Link
      to={`${ROUTES.COURSES}/${course.courseId}`}
      className={[
        'group flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5',
        'shadow-elegant transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        hoverClasses,
        className,
      ].join(' ')}
      aria-label={`${course.courseName} — ${roleBadge.label}`}
    >
      {/* ── Header row: icon + role badge ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div
          className={[
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
            iconClasses,
          ].join(' ')}
        >
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Closed course indicator */}
          {!course.isOpen && (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-body text-xs text-neutral-400"
              title="Enrollment closed"
            >
              <Lock className="h-2.5 w-2.5" aria-hidden="true" />
              Closed
            </span>
          )}

          {/* Role badge */}
          <span
            className={[
              'inline-flex items-center rounded-full border px-2 py-0.5',
              'font-body text-xs font-semibold',
              roleBadge.classes,
            ].join(' ')}
          >
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* ── Course name + code ──────────────────────────────────────────────── */}
      <div>
        <h3
          className={[
            'font-display text-sm font-bold text-neutral-900 leading-snug',
            'group-hover:text-primary-700 transition-colors duration-150',
            isProfessor && 'group-hover:text-secondary-700',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {course.courseName}
        </h3>
        <p className="mt-0.5 font-mono text-xs text-neutral-400">
          {course.courseCode}
        </p>
      </div>

      {/* ── Meta row: subject / section / teacher / enrollment count ───────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {course.subject && (
          <span className="inline-flex items-center gap-1 font-body text-xs text-neutral-500">
            <Tag className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden="true" />
            {course.subject}
          </span>
        )}

        {isProfessor && course.enrollmentCount != null && (
          <span className="inline-flex items-center gap-1 font-body text-xs text-neutral-500">
            <Users className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden="true" />
            {course.enrollmentCount}{' '}
            {course.enrollmentCount === 1 ? 'student' : 'students'}
          </span>
        )}

        {!isProfessor && course.teacherName && (
          <span className="font-body text-xs text-neutral-400 truncate">
            {course.teacherName}
          </span>
        )}

        {course.section && (
          <span className="font-body text-xs text-neutral-400">
            §{course.section}
          </span>
        )}
      </div>
    </Link>
  );
}