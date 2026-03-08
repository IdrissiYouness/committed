/**
 * StatCard
 *
 * A single metric tile in the dashboard stats row.
 *
 * Props:
 *   label      — metric description, e.g. "Enrolled Courses"
 *   value      — display value (number or string); null/undefined renders "—"
 *   icon       — Lucide icon component
 *   colorClasses — Tailwind classes for the icon bubble  (bg + text + border)
 *   isLoading  — renders an animated pulse skeleton instead of real content
 *   className  — extra classes for the <li> wrapper
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  colorClasses = 'bg-primary-50 text-primary-600 border-primary-100',
  isLoading = false,
  className = '',
}) {
  if (isLoading) {
    return (
      <li
        className={[
          'flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-elegant',
          className,
        ].join(' ')}
        aria-hidden="true"
      >
        {/* Icon placeholder */}
        <div className="h-11 w-11 shrink-0 rounded-xl bg-neutral-100 animate-pulse" />

        {/* Text placeholders */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-7 w-10 rounded-lg bg-neutral-100 animate-pulse" />
          <div className="h-3 w-28 rounded-lg bg-neutral-100 animate-pulse" />
        </div>
      </li>
    );
  }

  const displayValue = value !== null && value !== undefined ? value : '—';

  return (
    <li
      className={[
        'flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-elegant',
        className,
      ].join(' ')}
    >
      {/* Icon bubble */}
      <div
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
          colorClasses,
        ].join(' ')}
      >
        {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
      </div>

      {/* Metric */}
      <div>
        <p className="font-display text-2xl font-bold text-neutral-900 tabular-nums leading-none">
          {displayValue}
        </p>
        <p className="mt-1 font-body text-xs text-neutral-500">{label}</p>
      </div>
    </li>
  );
}