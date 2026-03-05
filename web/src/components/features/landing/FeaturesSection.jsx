import { Brain, GitBranch, MessageSquare, BookOpen, Github, ClipboardList, Star } from 'lucide-react';

/**
 * FeaturesSection
 *
 * Two sub-sections:
 *   1. Feature cards  — what the platform offers
 *   2. How it Works   — 3-step flow for students and professors
 */

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <Brain className="h-6 w-6" aria-hidden="true" />,
    title: 'AI Code Analysis',
    description:
      'Every submission is automatically analyzed by AI. Get detailed feedback on code quality, structure, and logic — not just a grade.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <Github className="h-6 w-6" aria-hidden="true" />,
    title: 'GitHub Integration',
    description:
      'Students submit a GitHub repository link. Committed clones it, reads the code, and runs the full analysis pipeline automatically.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <MessageSquare className="h-6 w-6" aria-hidden="true" />,
    title: 'Instant Feedback',
    description:
      'No more waiting days for manual review. Students receive AI-generated, human-readable reports moments after submission.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
    title: 'Course Management',
    description:
      'Professors create courses, publish assignments with deadlines, and manage enrollments — all from a single dashboard.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <ClipboardList className="h-6 w-6" aria-hidden="true" />,
    title: 'Manual Grading',
    description:
      'AI does the heavy lifting, but professors stay in control. Review AI reports and override grades whenever needed.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <Star className="h-6 w-6" aria-hidden="true" />,
    title: 'Progress Tracking',
    description:
      'Students and professors can track assignment completion, grades, and feedback history across all courses in one place.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
];

const STEPS = [
  {
    number: '01',
    icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
    title: 'Create or Join a Course',
    description:
      'Professors set up a course in minutes. Students enroll with a single click. Assignments and deadlines are visible immediately.',
  },
  {
    number: '02',
    icon: <GitBranch className="h-6 w-6" aria-hidden="true" />,
    title: 'Submit Your GitHub Repo',
    description:
      'When an assignment is due, students paste their GitHub repository URL. No zip files, no manual uploads — just real code.',
  },
  {
    number: '03',
    icon: <Brain className="h-6 w-6" aria-hidden="true" />,
    title: 'Get AI-Powered Feedback',
    description:
      'Committed clones the repo, runs AI analysis, and delivers a written feedback report with quality scores and improvement suggestions.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  return (
    <>
      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-14 text-center">
            <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-secondary-600 mb-3">
              What we offer
            </span>
            <h2
              id="features-heading"
              className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight"
            >
              Everything you need in one place
            </h2>
            <p className="mt-4 font-body text-base text-neutral-500 max-w-xl mx-auto">
              Committed replaces scattered tools with a single, focused platform
              built specifically for software engineering courses.
            </p>
          </div>

          {/* Cards grid */}
          <ul
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
            aria-label="Platform features"
          >
            {FEATURES.map(({ icon, title, description, accent }) => (
              <li
                key={title}
                className="group rounded-2xl bg-white border border-neutral-200 p-6 shadow-elegant hover:shadow-elevated transition-shadow duration-200"
              >
                {/* Icon badge */}
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}
                >
                  {icon}
                </div>

                <h3 className="font-display text-base font-bold text-neutral-900 mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-neutral-500 leading-relaxed">
                  {description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="bg-white px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl">

          {/* Header */}
          <div className="mb-14 text-center">
            <span className="inline-block font-body text-xs font-bold uppercase tracking-widest text-secondary-600 mb-3">
              How it works
            </span>
            <h2
              id="how-heading"
              className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight"
            >
              From enrollment to feedback in 3 steps
            </h2>
            <p className="mt-4 font-body text-base text-neutral-500 max-w-xl mx-auto">
              No complicated setup. No manual processes. Just a clean workflow
              that mirrors how real software teams work.
            </p>
          </div>

          {/* Steps */}
          <ol
            className="relative flex flex-col gap-10 lg:flex-row lg:gap-0"
            aria-label="How it works steps"
          >
            {STEPS.map(({ number, icon, title, description }, index) => (
              <li
                key={number}
                className="relative flex flex-1 flex-col items-center text-center px-4"
              >
                {/* Connector line between steps (desktop only) */}
                {index < STEPS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 left-[calc(50%+2.75rem)] right-0 h-px bg-gradient-to-r from-neutral-300 to-transparent"
                    aria-hidden="true"
                  />
                )}

                {/* Step number + icon */}
                <div className="relative mb-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-800 text-white shadow-floating">
                    {icon}
                  </div>
                  <span
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-500 font-mono text-xs font-bold text-white shadow-elegant"
                    aria-label={`Step ${number}`}
                  >
                    {index + 1}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-neutral-900 mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-neutral-500 leading-relaxed max-w-xs">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}