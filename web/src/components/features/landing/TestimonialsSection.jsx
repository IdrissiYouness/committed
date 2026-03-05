import { useInView } from '../../../hooks/useInView';

/**
 * TestimonialsSection
 *
 * Three quote cards from fictional students and professors.
 * Each card animates in with a staggered delay when scrolled into view.
 */

// ─── Data ─────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote:
      "Committed completely changed how I approach assignments. Getting AI feedback within seconds of pushing my code means I can fix issues before the deadline — not after.",
    name: 'Amira Bensalem',
    role: 'Computer Science Student, 3rd Year',
    initial: 'A',
    accent: 'bg-secondary-100 text-secondary-700',
  },
  {
    quote:
      "I used to spend entire weekends grading code submissions. Now the AI handles the first pass and I just review and confirm. It has saved me at least 6 hours every week.",
    name: 'Prof. Karim Meziane',
    role: 'Software Engineering, ESI Algiers',
    initial: 'K',
    accent: 'bg-primary-100 text-primary-700',
  },
  {
    quote:
      "The feedback is surprisingly detailed — it caught a complexity issue in my sorting algorithm that I completely missed. It feels like having a senior dev review your code every time.",
    name: 'Youcef Hamdani',
    role: 'Computer Science Student, 2nd Year',
    initial: 'Y',
    accent: 'bg-secondary-100 text-secondary-700',
  },
];

// ─── Single card ─────────────────────────────────────────────────────────────

function TestimonialCard({ quote, name, role, initial, accent, index }) {
  const [ref, inView] = useInView({ threshold: 0.15 });

  return (
    <li
      ref={ref}
      className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-7 shadow-elegant hover:shadow-elevated transition-shadow duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${index * 120}ms, transform 0.6s ease ${index * 120}ms, box-shadow 0.3s ease`,
      }}
    >
      {/* Quote mark */}
      <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-neutral-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
        </svg>
      </div>

      {/* Quote text */}
      <blockquote className="flex-1 font-body text-sm text-neutral-700 leading-relaxed mb-6">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-5 border-t border-neutral-100">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-base font-bold ${accent}`}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div>
          <p className="font-body text-sm font-bold text-neutral-900">{name}</p>
          <p className="font-body text-xs text-neutral-500">{role}</p>
        </div>
      </div>
    </li>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TestimonialsSection() {
  const [headerRef, headerInView] = useInView({ threshold: 0.2 });

  return (
    <section
      className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div
          ref={headerRef}
          className="mb-14 text-center"
          style={{
            opacity: headerInView ? 1 : 0,
            transform: headerInView ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
          }}
        >
          <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-secondary-600 mb-3">
            Testimonials
          </span>
          <h2
            id="testimonials-heading"
            className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight"
          >
            Loved by students and educators
          </h2>
          <p className="mt-4 font-body text-base text-neutral-500 max-w-xl mx-auto">
            Here is what people using Committed have to say about their experience.
          </p>
        </div>

        {/* Cards */}
        <ul
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Testimonials"
        >
          {TESTIMONIALS.map(({ quote, name, role, initial, accent }, index) => (
            <TestimonialCard
              key={name}
              quote={quote}
              name={name}
              role={role}
              initial={initial}
              accent={accent}
              index={index}
            />
          ))}
        </ul>

      </div>
    </section>
  );
}