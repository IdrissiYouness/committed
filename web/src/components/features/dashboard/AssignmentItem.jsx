import { useEffect, useState } from 'react';
import { ClipboardList, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * AssignmentItem
 *
 * A single row in the "Upcoming Assignments" dashboard section.
 * Displays the assignment title, course name, and a colour-coded
 * due-date badge that conveys urgency at a glance.
 *
 * Props:
 *   assignment — assignment object (see shape below)
 *   className  — extra Tailwind classes for the <li> wrapper
 *
 * Assignment shape:
 * {
 *   assignmentId: number,
 *   title:        string,
 *   courseName:   string,
 *   courseCode:   string,
 *   dueDate:      string | null,   // ISO-8601
 *   maxPoints:    number,
 *   status:       'pending' | 'submitted' | 'graded' | 'late' | undefined,
 * }
 */

// ─── Due-date helpers ─────────────────────────────────────────────────────────

/**
 * Returns a human-readable due label and urgency tier for a date string.
 *
 * Tiers:
 *   'overdue'  — past due
 *   'urgent'   — due today or tomorrow
 *   'soon'     — due within 7 days
 *   'normal'   — due in 8+ days
 *   null       — no due date
 */
function parseDue(dateString, nowInput = new Date()) {
  if (!dateString) return null;

  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) return null;

  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) {
    return { label: 'Overdue', tier: 'overdue' };
  }

  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const totalMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours >= 1) {
      return {
        label: `Due in ${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`,
        tier: 'urgent',
      };
    }

    return { label: `Due in ${minutes}m`, tier: 'urgent' };
  }

  if (diffDays === 1) return { label: 'Due tomorrow', tier: 'urgent' };
  if (diffDays <= 7) return { label: `Due in ${diffDays} days`, tier: 'soon' };

  return {
    label: due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    tier: 'normal',
  };
}

const TIER_CLASSES = {
  overdue: 'bg-red-50   text-red-600    border border-red-100',
  urgent:  'bg-red-50   text-red-500    border border-red-100',
  soon:    'bg-warning/10 text-warning  border border-amber-100',
  normal:  'bg-neutral-100 text-neutral-500',
};

const TIER_ICON = {
  overdue: AlertCircle,
  urgent:  AlertCircle,
  soon:    Clock,
  normal:  Clock,
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CLASSES = {
  submitted: 'bg-secondary-50 text-secondary-600 border border-secondary-100',
  graded:    'bg-success/10   text-success        border border-teal-100',
  late:      'bg-red-50       text-red-500        border border-red-100',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  graded:    'Graded',
  late:      'Late',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignmentItem({ assignment, className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  const due = parseDue(assignment.dueDate, now);
  const status = assignment.status;

  // If already submitted/graded, show status badge instead of due-date badge
  const showStatusBadge = status && status !== 'pending' && STATUS_LABELS[status];

  return (
    <li
      className={[
        'flex items-center gap-4 rounded-xl border border-neutral-100 bg-white',
        'px-4 py-3 hover:border-neutral-200 transition-colors duration-150',
        className,
      ].join(' ')}
    >
      {/* ── Icon ───────────────────────────────────────────────────────────── */}
      <div
        className={[
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
          status === 'submitted' || status === 'graded'
            ? 'bg-secondary-50 border-secondary-100'
            : 'bg-secondary-50 border-secondary-100',
        ].join(' ')}
      >
        {status === 'graded' ? (
          <CheckCircle2 className="h-4 w-4 text-secondary-600" aria-hidden="true" />
        ) : (
          <ClipboardList className="h-4 w-4 text-secondary-600" aria-hidden="true" />
        )}
      </div>

      {/* ── Title + course ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-neutral-800 truncate">
          {assignment.title}
        </p>
        <p className="font-body text-xs text-neutral-400 truncate">
          {assignment.courseName}
          {assignment.courseCode && (
            <span className="ml-1 font-mono">({assignment.courseCode})</span>
          )}
        </p>
      </div>

      {/* ── Right badge: status OR due date ────────────────────────────────── */}
      {showStatusBadge ? (
        <span
          className={[
            'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5',
            'font-body text-xs font-semibold',
            STATUS_CLASSES[status] ?? 'bg-neutral-100 text-neutral-500',
          ].join(' ')}
        >
          {STATUS_LABELS[status]}
        </span>
      ) : due ? (
        <span
          className={[
            'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5',
            'font-body text-xs font-semibold',
            TIER_CLASSES[due.tier],
          ].join(' ')}
        >
          {(() => {
            const DueIcon = TIER_ICON[due.tier];
            return <DueIcon className="h-3 w-3" aria-hidden="true" />;
          })()}
          {due.label}
        </span>
      ) : (
        <span className="font-body text-xs text-neutral-300 shrink-0">
          No due date
        </span>
      )}

      {/* ── Max points ─────────────────────────────────────────────────────── */}
      {assignment.maxPoints != null && (
        <span className="hidden sm:block font-mono text-xs text-neutral-300 shrink-0">
          {assignment.maxPoints}pt
        </span>
      )}
    </li>
  );
}