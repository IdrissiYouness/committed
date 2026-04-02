import { Link } from 'react-router-dom';
import { Megaphone, MessageCircle, ArrowUpRight, Clock3 } from 'lucide-react';
import { ROUTES } from '../../../utils/constants';

/**
 * AnnouncementItem
 *
 * Dashboard list item for recent announcements.
 * Includes:
 * - course context
 * - 2-line-like preview text (trimmed)
 * - comment count
 * - open-thread action
 *
 * Expected shape:
 * {
 *   announcementId: number|string,
 *   courseId: number|string,
 *   title: string,
 *   courseName: string,
 *   courseCode: string,
 *   postedBy: string,
 *   postedAt: string,
 *   content?: string,
 *   preview?: string,
 *   commentCount?: number
 * }
 */
export default function AnnouncementItem({ announcement, className = '' }) {
  const announcementId = announcement?.announcementId ?? announcement?.id;
  const courseId = announcement?.courseId;
  const threadHref =
    courseId && announcementId
      ? `${ROUTES.COURSES}/${courseId}/announcements/${announcementId}`
      : ROUTES.COURSES;

  const previewText = buildPreview(announcement);
  const ago = timeAgo(announcement?.postedAt);
  const comments = Number(announcement?.commentCount || 0);

  return (
    <li
      className={[
        'rounded-xl border border-neutral-100 bg-white p-4',
        'transition-colors duration-150 hover:border-neutral-200',
        className,
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary-100 bg-primary-50">
          <Megaphone className="h-4 w-4 text-primary-600" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-body text-sm font-semibold text-neutral-900">
            {announcement?.title || 'Untitled announcement'}
          </p>

          <p className="mt-0.5 truncate font-body text-xs text-neutral-500">
            {announcement?.courseName || 'Course'}
            {announcement?.courseCode ? (
              <span className="ml-1 font-mono text-neutral-400">({announcement.courseCode})</span>
            ) : null}
          </p>

          <p className="mt-1 font-body text-xs leading-relaxed text-neutral-600">
            {previewText}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {ago || 'Recently'}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              {comments} {comments === 1 ? 'comment' : 'comments'}
            </span>
            {announcement?.postedBy ? <span className="truncate">by {announcement.postedBy}</span> : null}
          </div>
        </div>

        <Link
          to={threadHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Open announcement thread"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

function buildPreview(announcement) {
  const raw =
    announcement?.preview ||
    announcement?.content ||
    '';

  if (!raw.trim()) return 'No preview available.';

  const compact = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');

  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

function timeAgo(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;

  if (Number.isNaN(diffMs) || diffMs < 0) return '';

  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}