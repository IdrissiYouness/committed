/**
 * SkeletonCard & SkeletonLine
 *
 * Animated pulse placeholders rendered while dashboard data is loading.
 *
 * SkeletonLine — a single shimmering bar, used inside cards or lists.
 *   Props:
 *     width     — Tailwind width class  (default: 'w-full')
 *     height    — Tailwind height class (default: 'h-4')
 *     className — extra classes
 *
 * SkeletonCard — a card-shaped block with several SkeletonLines.
 *   Props:
 *     lines     — number of lines to render (default: 3)
 *     className — extra classes for the card wrapper
 *
 * SkeletonListItem — a row-shaped block mimicking AssignmentItem /
 *                    AnnouncementItem layout.
 *   Props:
 *     className — extra classes
 */

// ─── SkeletonLine ─────────────────────────────────────────────────────────────

export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div
      className={[
        'rounded-lg bg-neutral-100 animate-pulse',
        width,
        height,
        className,
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export default function SkeletonCard({ lines = 3, className = '' }) {
  // Stagger widths so adjacent skeletons don't look identical.
  const lineWidths = ['w-3/4', 'w-full', 'w-1/2', 'w-5/6', 'w-2/3'];

  return (
    <div
      className={[
        'flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-elegant',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      {/* Icon placeholder */}
      <div className="h-10 w-10 rounded-xl bg-neutral-100 animate-pulse" />

      {/* Line placeholders */}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={lineWidths[i % lineWidths.length]}
          height={i === 0 ? 'h-4' : 'h-3'}
        />
      ))}
    </div>
  );
}

// ─── SkeletonListItem ─────────────────────────────────────────────────────────

export function SkeletonListItem({ className = '' }) {
  return (
    <li
      className={[
        'flex items-center gap-4 rounded-xl border border-neutral-100 bg-white px-4 py-3',
        className,
      ].join(' ')}
      aria-hidden="true"
    >
      {/* Icon placeholder */}
      <div className="h-9 w-9 shrink-0 rounded-lg bg-neutral-100 animate-pulse" />

      {/* Text lines */}
      <div className="flex flex-1 flex-col gap-2">
        <SkeletonLine width="w-2/3" height="h-3" />
        <SkeletonLine width="w-1/3" height="h-3" />
      </div>

      {/* Badge placeholder */}
      <div className="h-5 w-16 shrink-0 rounded-full bg-neutral-100 animate-pulse" />
    </li>
  );
}