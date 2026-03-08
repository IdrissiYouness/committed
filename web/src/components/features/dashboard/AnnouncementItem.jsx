import { Megaphone } from 'lucide-react';

/**
 * AnnouncementItem
 *
 * A single row in the "Recent Announcements" dashboard section.
 * Shows the announcement title, the course it belongs to, the poster's
 * name and a human-readable "time ago" timestamp.
 *
 * Props:
 *   announcement — announcement object (see shape below)
 *   className    — extra Tailwind classes for the <li> wrapper
 *
 * Announcement shape:
 * {
 *   announcementId: number,
 *   title:          string,
 *   courseName:     string,
 *   courseCode:     string,
 *   postedBy:       string,   // full name of the poster
 *   postedAt:       string,   // ISO-8601
 * }
 */

// ─── Time helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a concise human-readable "time ago" string for a date string.
 *
 * Examples:
 *   < 1 min   → "Just now"
 *   < 60 min  → "42m ago"
 *   < 24 h    → "3h ago"
 *   < 7 days  → "5d ago"
 *   otherwise → "14 Jan" (localised short date)
 */
function timeAgo(dateString) {
  if (!dateString) return '';

  const date    = new Date(dateString);
  const now     = new Date();
  const diffMs  = now - date;

  if (isNaN(diffMs) || diffMs < 0) return '';

  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins  / 60);
  const diffDays  = Math.floor(diffHours / 24);

  if (diffMins  < 1)  return 'Just now';
  if (diffMins  < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays  < 7)  return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnnouncementItem({ announcement, className = '' }) {
  const ago = timeAgo(announcement.postedAt);

  return (
    <li
      className={[
        'flex items-start gap-4 rounded-xl border border-neutral-100 bg-white',
        'px-4 py-3 hover:border-neutral-200 transition-colors duration-150',
        className,
      ].join(' ')}
    >
      {/* ── Icon ───────────────────────────────────────────────────────────── */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-100 bg-primary-50">
        <Megaphone className="h-4 w-4 text-primary-600" aria-hidden="true" />
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-neutral-800 truncate">
          {announcement.title}
        </p>

        <p className="mt-0.5 font-body text-xs text-neutral-400 truncate">
          {announcement.courseName}
          {announcement.courseCode && (
            <span className="ml-1 font-mono">({announcement.courseCode})</span>
          )}
        </p>

        {/* Posted by + time */}
        <p className="mt-0.5 font-body text-xs text-neutral-300">
          {announcement.postedBy && (
            <span className="text-neutral-400">{announcement.postedBy}</span>
          )}
          {announcement.postedBy && ago && (
            <span aria-hidden="true"> · </span>
          )}
          {ago && <span>{ago}</span>}
        </p>
      </div>
    </li>
  );
}