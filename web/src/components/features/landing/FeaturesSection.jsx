import { useState } from 'react';
import { Brain, GitBranch, MessageSquare, BookOpen, Github, ClipboardList, Star, GraduationCap, LayoutDashboard, Bell, BarChart2, Users } from 'lucide-react';
import { useInView } from '../../../hooks/useInView';

/**
 * FeaturesSection
 *
 * Improvements over v1:
 *   - Role switcher: Student / Professor tabs filter feature cards
 *   - Scroll-triggered animations: cards fade+slide in when entering viewport
 *   - How it Works steps also animate in on scroll
 */

// ─── Data ─────────────────────────────────────────────────────────────────────

const STUDENT_FEATURES = [
  {
    icon: <Github className="h-6 w-6" aria-hidden="true" />,
    title: 'GitHub Submission',
    description:
      'Submit your assignments by pasting a GitHub repo link. No zip files, no manual uploads — just your real code.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <Brain className="h-6 w-6" aria-hidden="true" />,
    title: 'AI Code Feedback',
    description:
      'Receive a detailed AI-generated report on your code quality, structure, and logic moments after submission.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <MessageSquare className="h-6 w-6" aria-hidden="true" />,
    title: 'Instant Results',
    description:
      'No more waiting days for a grade. Get actionable feedback immediately so you can learn and improve fast.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
    title: 'Course Enrollment',
    description:
      'Join courses with a single click. All assignments, deadlines, and feedback are visible in one clean dashboard.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <Star className="h-6 w-6" aria-hidden="true" />,
    title: 'Progress Tracking',
    description:
      'Track your grades and feedback history across all courses. See exactly where you stand at any point.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <Bell className="h-6 w-6" aria-hidden="true" />,
    title: 'Deadline Notifications',
    description:
      'Get notified before assignments are due so you never miss a submission deadline again.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
];

const PROFESSOR_FEATURES = [
  {
    icon: <LayoutDashboard className="h-6 w-6" aria-hidden="true" />,
    title: 'Course Management',
    description:
      'Create and manage courses, publish assignments with deadlines, and handle student enrollments — all from one dashboard.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <Brain className="h-6 w-6" aria-hidden="true" />,
    title: 'AI-Assisted Grading',
    description:
      'AI analyzes every submission automatically. Review the report and approve or override the grade — saving you hours every week.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <ClipboardList className="h-6 w-6" aria-hidden="true" />,
    title: 'Manual Grade Override',
    description:
      'Stay fully in control. Review AI reports and override grades whenever you need to apply your own judgment.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <Users className="h-6 w-6" aria-hidden="true" />,
    title: 'Student Management',
    description:
      'View all enrolled students, their submission history, grades, and AI feedback reports in one place.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
  {
    icon: <BarChart2 className="h-6 w-6" aria-hidden="true" />,
    title: 'Class Analytics',
    description:
      'Understand class-wide trends. See which concepts students struggle with most based on AI analysis patterns.',
    accent: 'bg-primary-50 text-primary-600 border-primary-100',
  },
  {
    icon: <Bell className="h-6 w-6" aria-hidden="true" />,
    title: 'Submission Alerts',
    description:
      'Get notified when students submit assignments so you can review AI reports and finalize grades on time.',
    accent: 'bg-secondary-50 text-secondary-600 border-secondary-100',
  },
];

const STEPS = [
  {
    icon: <BookOpen className="h-6 w-6" aria-hidden="true" />,
    title: 'Create or Join a Course',
    description:
      'Professors set up a course in minutes. Students enroll with a single click. Assignments and deadlines are visible immediately.',
  },
  {
    icon: <GitBranch className="h-6 w-6" aria-hidden="true" />,
    title: 'Submit Your GitHub Repo',
    description:
      'When an assignment is due, students paste their GitHub repository URL. No zip files, no manual uploads — just real code.',
  },
  {
    icon: <Brain className="h-6 w-6" aria-hidden="true" />,
    title: 'Get AI-Powered Feedback',
    description:
      'Committed clones the repo, runs AI analysis, and delivers a written feedback report with quality scores and improvement suggestions.',
  },
];

// ─── Animated card ────────────────────────────────────────────────────────────

function FeatureCard({ icon, title, description, accent, index }) {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <li
      ref={ref}
      className="group rounded-2xl bg-white border border-neutral-200 p-6 shadow-elegant hover:shadow-elevated hover:-translate-y-1 transition-all duration-300"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.5s ease ${index * 80}ms, transform 0.5s ease ${index * 80}ms, box-shadow 0.3s ease, translate 0.3s ease`,
      }}
    >
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}>
        {icon}
      </div>
      <h3 className="font-display text-base font-bold text-neutral-900 mb-2">
        {title}
      </h3>
      <p className="font-body text-sm text-neutral-500 leading-relaxed">
        {description}
      </p>
    </li>
  );
}

// ─── Animated step ────────────────────────────────────────────────────────────

function StepItem({ icon, title, description, index, isLast }) {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <li
      ref={ref}
      className="relative flex flex-1 flex-col items-center text-center px-4"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.6s ease ${index * 150}ms, transform 0.6s ease ${index * 150}ms`,
      }}
    >
      {/* Connector line between steps (desktop only) */}
      {!isLast && (
        <div
          className="hidden lg:block absolute top-10 left-[calc(50%+2.75rem)] right-0 h-px bg-gradient-to-r from-neutral-300 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Icon circle */}
      <div className="relative mb-5">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-800 text-white shadow-floating">
          {icon}
        </div>
        <span
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-secondary-500 font-mono text-xs font-bold text-white shadow-elegant"
          aria-label={`Step ${index + 1}`}
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
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FeaturesSection() {
  const [activeRole, setActiveRole] = useState('student');
  const features = activeRole === 'student' ? STUDENT_FEATURES : PROFESSOR_FEATURES;

  const [headerRef, headerInView] = useInView({ threshold: 0.2 });
  const [stepsHeaderRef, stepsHeaderInView] = useInView({ threshold: 0.2 });

  return (
    <>
      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section
        id="features"
        className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 scroll-mt-16"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-6xl">

          {/* Section header */}
          <div
            ref={headerRef}
            className="mb-10 text-center"
            style={{
              opacity: headerInView ? 1 : 0,
              transform: headerInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
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

          {/* ── Role switcher ──────────────────────────────────────────────── */}
          <div
            className="mb-12 flex justify-center"
            style={{
              opacity: headerInView ? 1 : 0,
              transition: 'opacity 0.6s ease 150ms',
            }}
          >
            <div
              className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 shadow-elegant"
              role="tablist"
              aria-label="View features by role"
            >
              <button
                role="tab"
                aria-selected={activeRole === 'student'}
                onClick={() => setActiveRole('student')}
                className={[
                  'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-body text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  activeRole === 'student'
                    ? 'bg-primary-800 text-white shadow-elegant'
                    : 'text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                I&apos;m a Student
              </button>

              <button
                role="tab"
                aria-selected={activeRole === 'professor'}
                onClick={() => setActiveRole('professor')}
                className={[
                  'inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-body text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                  activeRole === 'professor'
                    ? 'bg-primary-800 text-white shadow-elegant'
                    : 'text-neutral-500 hover:text-neutral-800',
                ].join(' ')}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                I&apos;m a Professor
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <ul
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            role="tabpanel"
            aria-label={`${activeRole === 'student' ? 'Student' : 'Professor'} features`}
          >
            {features.map(({ icon, title, description, accent }, index) => (
              <FeatureCard
                key={`${activeRole}-${title}`}
                icon={icon}
                title={title}
                description={description}
                accent={accent}
                index={index}
              />
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

          {/* Section header */}
          <div
            ref={stepsHeaderRef}
            className="mb-14 text-center"
            style={{
              opacity: stepsHeaderInView ? 1 : 0,
              transform: stepsHeaderInView ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
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
            {STEPS.map(({ icon, title, description }, index) => (
              <StepItem
                key={title}
                icon={icon}
                title={title}
                description={description}
                index={index}
                isLast={index === STEPS.length - 1}
              />
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}