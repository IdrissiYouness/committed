import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

import { ROUTES } from '../../../utils/constants';

/**
 * HeroSection
 *
 * Improvements over v1:
 *   - Gradient text on "learn" and "teach" keywords
 *   - Staggered entrance animations (each element delayed 120ms after previous)
 *   - AI analysis code snippet visual — reinforces the product identity
 *   - Micro-copy trust line under the CTA buttons (Free · No credit card · 2 min setup)
 *   - Animated scroll hint arrow
 */
export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-800 px-4 pt-24 pb-16 sm:px-6 lg:px-8"
      aria-labelledby="hero-heading"
    >
      {/* ── Background decorations ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary-700 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-secondary-700 opacity-25 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600 opacity-10 blur-2xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Two-column layout on large screens ──────────────────────────── */}
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* ── Left: copy ────────────────────────────────────────────── */}
          <div className="flex-1 text-center lg:text-left">

            {/* AI badge — delay 0 */}
            <div
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-sm opacity-0 animate-fade-in"
              style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
            >
              <Sparkles className="h-3.5 w-3.5 text-secondary-300" aria-hidden="true" />
              <span className="font-body text-xs font-semibold uppercase tracking-widest text-secondary-200">
                AI-Powered Code Education
              </span>
            </div>

            {/* Headline — delay 120ms */}
            <h1
              id="hero-heading"
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight opacity-0 animate-slide-up"
              style={{ animationDelay: '120ms', animationFillMode: 'forwards' }}
            >
              The smarter way to{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #8dd4c6 0%, #5ab8a8 50%, #349e8e 100%)',
                }}
              >
                learn
              </span>
              {' '}and{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #8dd4c6 0%, #5ab8a8 50%, #349e8e 100%)',
                }}
              >
                teach
              </span>
              {' '}code
            </h1>

            {/* Sub-headline — delay 240ms */}
            <p
              className="mt-6 font-body text-base sm:text-lg text-primary-200 leading-relaxed max-w-xl mx-auto lg:mx-0 opacity-0 animate-slide-up"
              style={{ animationDelay: '240ms', animationFillMode: 'forwards' }}
            >
              Committed brings together course management, GitHub-based submissions,
              and AI-generated code feedback — all in one platform built for
              software engineering education.
            </p>

            {/* CTA buttons — delay 360ms */}
            <div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 opacity-0 animate-slide-up"
              style={{ animationDelay: '360ms', animationFillMode: 'forwards' }}
            >
              <Link
                to={ROUTES.REGISTER}
                className="group inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-7 py-3.5 font-body text-sm font-bold text-white shadow-floating hover:bg-secondary-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
              >
                Get Started for Free
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>

              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 font-body text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                Sign In
              </Link>
            </div>

            {/* Micro-copy trust signals — delay 480ms */}
            <ul
              className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 opacity-0 animate-fade-in"
              style={{ animationDelay: '480ms', animationFillMode: 'forwards' }}
              aria-label="Trust signals"
            >
              {[
                'Free forever',
                'No credit card required',
                'Ready in 2 minutes',
              ].map((text) => (
                <li key={text} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary-400 shrink-0" aria-hidden="true" />
                  <span className="font-body text-xs text-primary-300">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: AI code snippet mockup ─────────────────────────── */}
          <div
            className="flex-1 w-full max-w-md lg:max-w-none opacity-0 animate-slide-up"
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
            aria-hidden="true"
          >
            <div className="relative mx-auto max-w-md lg:max-w-full">

              {/* Glow behind the card */}
              <div className="absolute inset-0 rounded-2xl bg-secondary-500 opacity-10 blur-2xl scale-105" />

              {/* Terminal card */}
              <div className="relative rounded-2xl border border-white/10 bg-primary-900/80 backdrop-blur-sm shadow-dramatic overflow-hidden">

                {/* Title bar */}
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 bg-white/5">
                  <span className="h-3 w-3 rounded-full bg-red-400/70" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                  <span className="h-3 w-3 rounded-full bg-green-400/70" />
                  <span className="ml-3 font-mono text-xs text-primary-400">
                    analysis-report.json
                  </span>
                </div>

                {/* Code content */}
                <div className="px-5 py-5 font-mono text-xs sm:text-sm leading-relaxed space-y-1">
                  <p className="text-neutral-500">{'// AI Analysis Report — hw-03'}</p>
                  <p className="text-neutral-500">{'// repo: github.com/alice/sorting-algo'}</p>
                  <p>&nbsp;</p>
                  <p>
                    <span className="text-secondary-400">✓</span>
                    <span className="text-neutral-300"> Quality Score   </span>
                    <span className="text-secondary-300 font-bold">87 / 100</span>
                  </p>
                  <p>
                    <span className="text-secondary-400">✓</span>
                    <span className="text-neutral-300"> Tests passing   </span>
                    <span className="text-secondary-300 font-bold">12 / 12</span>
                  </p>
                  <p>
                    <span className="text-secondary-400">✓</span>
                    <span className="text-neutral-300"> Code structure  </span>
                    <span className="text-secondary-300 font-bold">Clean</span>
                  </p>
                  <p>
                    <span className="text-yellow-400">⚠</span>
                    <span className="text-neutral-300"> Time complexity </span>
                    <span className="text-yellow-300 font-bold">O(n²)</span>
                  </p>
                  <p>&nbsp;</p>
                  <p className="text-neutral-500">{'// Suggestions'}</p>
                  <p>
                    <span className="text-primary-400">→</span>
                    <span className="text-neutral-400"> Replace nested loop in </span>
                    <span className="text-secondary-300">sort()</span>
                  </p>
                  <p>
                    <span className="text-primary-400">→</span>
                    <span className="text-neutral-400"> Consider </span>
                    <span className="text-secondary-300">Array.prototype.sort</span>
                    <span className="text-neutral-400"> for O(n log n)</span>
                  </p>
                  <p>&nbsp;</p>
                  {/* Blinking cursor */}
                  <p>
                    <span className="text-secondary-400">$</span>
                    <span className="text-neutral-300"> </span>
                    <span
                      className="inline-block w-2 h-4 bg-secondary-400 align-middle"
                      style={{ animation: 'blink 1.2s step-end infinite' }}
                    />
                  </p>
                </div>
              </div>

              {/* Floating badge — "Analyzed in 3s" */}
              <div className="absolute -bottom-4 -right-4 flex items-center gap-2 rounded-xl border border-white/10 bg-primary-800 px-3 py-2 shadow-floating">
                <span className="flex h-2 w-2 rounded-full bg-secondary-400">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-secondary-400 opacity-75" />
                </span>
                <span className="font-body text-xs font-semibold text-white">
                  Analyzed in 3s
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Scroll hint ───────────────────────────────────────────────── */}
        <div
          className="mt-16 flex flex-col items-center gap-2 opacity-0 animate-fade-in"
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
          aria-hidden="true"
        >
          <span className="font-body text-xs text-primary-400 tracking-widest uppercase">
            Scroll to explore
          </span>
          {/* Animated bouncing arrow */}
          <div style={{ animation: 'bounce-arrow 1.6s ease-in-out infinite' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-primary-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>

      {/* ── Keyframe styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes bounce-arrow {
          0%, 100% { transform: translateY(0);    opacity: 0.6; }
          50%       { transform: translateY(6px);  opacity: 1;   }
        }
      `}</style>
    </section>
  );
}