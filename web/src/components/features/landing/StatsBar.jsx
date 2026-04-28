import { useInView, useCountUp } from '../../../hooks/useInView';

/**
 * StatsBar
 *
 * A horizontal strip of key platform statistics.
 * Each number counts up from 0 when the section scrolls into view.
 * Sits between the Hero and the Features section.
 */

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: 500,    suffix: '+',  label: 'Students Enrolled'    },
  { value: 50,     suffix: '+',  label: 'Courses Created'       },
  { value: 10000,  suffix: '+',  label: 'Submissions Analyzed'  },
  { value: 98,     suffix: '%',  label: 'Satisfaction Rate'     },
];

// ─── Single stat item ─────────────────────────────────────────────────────────

function StatItem({ value, suffix, label, inView }) {
  const count = useCountUp(value, 2000, inView);

  return (
    <li className="flex flex-col items-center gap-1 px-6 py-2">
      <span className="font-display text-3xl sm:text-4xl font-bold text-primary-800 tracking-tight tabular-nums">
        {count.toLocaleString()}
        <span className="text-secondary-500">{suffix}</span>
      </span>
      <span className="font-body text-sm text-neutral-500 text-center">
        {label}
      </span>
    </li>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatsBar() {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      className="bg-white border-y border-neutral-200 px-4 py-10 sm:px-6 lg:px-8"
      aria-label="Platform statistics"
    >
      <ul
        className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-200"
        role="list"
      >
        {STATS.map(({ value, suffix, label }) => (
          <StatItem
            key={label}
            value={value}
            suffix={suffix}
            label={label}
            inView={inView}
          />
        ))}
      </ul>
    </section>
  );
}