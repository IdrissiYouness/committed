import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * EmptyState
 *
 * Generic empty / zero-data placeholder rendered inside dashboard sections
 * when there is no content to show.
 *
 * Props:
 *   icon        — Lucide icon component (optional)
 *   title       — short heading, e.g. "No courses yet"
 *   description — supporting text (optional)
 *   actionLabel — label for the CTA link or button (optional)
 *   actionTo    — react-router path; renders a <Link> when provided
 *   actionOnClick — callback; renders a <button> when actionTo is absent
 *   className   — additional Tailwind classes for the wrapper
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  actionOnClick,
  className = '',
}) {
  const hasAction = actionLabel && (actionTo || actionOnClick);

  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
        className,
      ].join(' ')}
      data-testid="empty-state"
    >
      {/* Icon bubble */}
      {Icon && (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100"
          aria-hidden="true"
        >
          <Icon className="h-7 w-7 text-neutral-400" />
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col gap-1">
        <p className="font-display text-sm font-bold text-neutral-700">
          {title}
        </p>
        {description && (
          <p className="font-body text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {hasAction && (
        actionTo ? (
          <Link
            to={actionTo}
            className="mt-1 inline-flex items-center gap-1 font-body text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={actionOnClick}
            className="mt-1 inline-flex items-center gap-1 font-body text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        )
      )}
    </div>
  );
}