import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

import { ROUTES } from '../../utils/constants';
import useBreadcrumbStore from '../../store/breadcrumbStore';

/**
 * Breadcrumbs
 *
 * Auto-generates a breadcrumb trail from the current URL path.
 * Each path segment is capitalised and linked except the last one
 * (current page) which is rendered as plain text.
 *
 * Examples:
 *   /dashboard              → Home
 *   /profile                → Home › Profile
 *   /courses/123/edit       → Home › Courses › 123 › Edit
 *
 * Route label overrides map known path segments to friendly labels.
 */

// ─── Friendly label map ───────────────────────────────────────────────────────

const SEGMENT_LABELS = {
  dashboard:   'Dashboard',
  profile:     'Profile',
  courses:     'Courses',
  assignments: 'Assignments',
  grades:      'Grades',
  admin:       'Admin',
  settings:    'Settings',
  new:         'New',
  edit:        'Edit',
};

/**
 * Capitalise first letter of a string.
 * Used as fallback for unknown segments (e.g. IDs).
 */
function toLabel(segment, dynamicLabels = {}) {
  return dynamicLabels[segment] ?? SEGMENT_LABELS[segment.toLowerCase()] ?? (
    segment.charAt(0).toUpperCase() + segment.slice(1)
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const dynamicLabels = useBreadcrumbStore((state) => state.labels);

  // Split path into non-empty segments
  // e.g. "/courses/123/edit" → ["courses", "123", "edit"]
  const segments = pathname.split('/').filter(Boolean);

  // Dashboard root — no breadcrumbs needed
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null;
  }

  // Build crumb array: each crumb has a label and a cumulative path
  const crumbs = segments.map((segment, index) => ({
    label: toLabel(segment, dynamicLabels),
    to:    '/' + segments.slice(0, index + 1).join('/'),
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 font-body text-sm text-neutral-500"
    >
      {/* Home icon always first */}
      <Link
        to={ROUTES.DASHBOARD}
        className="flex items-center text-neutral-400 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
        aria-label="Dashboard home"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
      </Link>

      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {/* Separator */}
            <ChevronRight
              className="h-3.5 w-3.5 text-neutral-300 shrink-0"
              aria-hidden="true"
            />

            {isLast ? (
              // Current page — not a link
              <span
                className="font-semibold text-neutral-700 truncate max-w-[160px]"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              // Ancestor page — clickable link
              <Link
                to={crumb.to}
                className="truncate max-w-[120px] hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}