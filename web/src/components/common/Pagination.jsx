import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination
 *
 * Generic pagination control used by any paged list (Admin, Courses, Assignments…).
 *
 * Props:
 *   pagination   — { page, totalPages, hasNext, hasPrev, totalElements, size }
 *   onPageChange — (newPage: number) => void
 *   isLoading    — disables buttons while a fetch is in flight
 *   className    — extra classes on the wrapper
 *
 * The component is intentionally dumb: it renders Prev / Next buttons plus a
 * "Page X of Y  ·  N total" summary and leaves all data-fetching to the parent.
 */
export default function Pagination({
  pagination = {},
  onPageChange,
  isLoading = false,
  className = '',
}) {
  const {
    page          = 0,
    totalPages    = 0,
    hasNext       = false,
    hasPrev       = false,
    totalElements,
    size,
  } = pagination;

  // Nothing to paginate
  if (totalPages <= 1 && !hasPrev && !hasNext) return null;

  const humanPage  = page + 1;          // 0-based → 1-based for display
  const isDisabled = isLoading;

  const handlePrev = () => {
    if (!hasPrev || isDisabled) return;
    onPageChange?.(page - 1);
  };

  const handleNext = () => {
    if (!hasNext || isDisabled) return;
    onPageChange?.(page + 1);
  };

  // "Showing 11 – 20 of 47" helper text
  const showingText = (() => {
    if (totalElements == null || size == null) return null;
    const from = page * size + 1;
    const to   = Math.min(page * size + size, totalElements);
    return `${from}–${to} of ${totalElements}`;
  })();

  return (
    <nav
      className={['flex items-center justify-between gap-3 select-none', className].join(' ')}
      aria-label="Pagination"
    >
      {/* ── Left: showing summary ──────────────────────────────────────────── */}
      <p className="font-body text-xs text-neutral-500 tabular-nums hidden sm:block">
        {showingText ? (
          <>Showing <span className="font-semibold text-neutral-700">{showingText}</span></>
        ) : (
          <>Page <span className="font-semibold text-neutral-700">{humanPage}</span> of{' '}
          <span className="font-semibold text-neutral-700">{totalPages}</span></>
        )}
      </p>

      {/* ── Center (mobile): page indicator ───────────────────────────────── */}
      <p className="font-body text-xs text-neutral-500 tabular-nums sm:hidden">
        {humanPage} / {totalPages}
      </p>

      {/* ── Right: Prev / Page chips / Next ───────────────────────────────── */}
      <div className="flex items-center gap-2 ml-auto sm:ml-0">

        {/* Previous */}
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasPrev || isDisabled}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'font-body text-sm font-semibold',
            'border transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            (!hasPrev || isDisabled)
              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-white'
              : 'border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 bg-white',
          ].join(' ')}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page chips — show a small window around the current page */}
        <PageChips
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          isDisabled={isDisabled}
        />

        {/* Next */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext || isDisabled}
          className={[
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'font-body text-sm font-semibold',
            'border transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            (!hasNext || isDisabled)
              ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-white'
              : 'border-neutral-300 text-neutral-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 bg-white',
          ].join(' ')}
          aria-label="Go to next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

// ─── Page chips sub-component ─────────────────────────────────────────────────

/**
 * Renders a small sliding window of page number buttons.
 * Shows at most 5 chips (or fewer when close to boundaries).
 * Hidden on mobile to keep the nav compact.
 */
function PageChips({ page, totalPages, onPageChange, isDisabled }) {
  if (totalPages <= 1) return null;

  const WINDOW = 2; // pages on each side of current
  const chips  = [];

  // Build the window of page numbers to show
  const start = Math.max(0, page - WINDOW);
  const end   = Math.min(totalPages - 1, page + WINDOW);

  // Leading ellipsis
  if (start > 0) {
    chips.push({ type: 'page', value: 0 });
    if (start > 1) chips.push({ type: 'ellipsis', value: 'start' });
  }

  for (let i = start; i <= end; i++) {
    chips.push({ type: 'page', value: i });
  }

  // Trailing ellipsis
  if (end < totalPages - 1) {
    if (end < totalPages - 2) chips.push({ type: 'ellipsis', value: 'end' });
    chips.push({ type: 'page', value: totalPages - 1 });
  }

  return (
    <ol className="hidden sm:flex items-center gap-1" role="list" aria-label="Page numbers">
      {chips.map(({ type, value }) => {
        if (type === 'ellipsis') {
          return (
            <li key={`ellipsis-${value}`} aria-hidden="true">
              <span className="px-1.5 font-body text-sm text-neutral-400">…</span>
            </li>
          );
        }

        const isCurrent = value === page;
        return (
          <li key={value}>
            <button
              type="button"
              onClick={() => !isDisabled && onPageChange?.(value)}
              disabled={isDisabled}
              aria-label={`Go to page ${value + 1}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={[
                'h-8 w-8 rounded-lg font-body text-sm font-semibold',
                'border transition-all duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                isCurrent
                  ? 'bg-primary-700 border-primary-700 text-white shadow-elegant'
                  : isDisabled
                    ? 'border-neutral-200 text-neutral-300 cursor-not-allowed bg-white'
                    : 'border-neutral-200 text-neutral-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 bg-white',
              ].join(' ')}
            >
              {value + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );
}