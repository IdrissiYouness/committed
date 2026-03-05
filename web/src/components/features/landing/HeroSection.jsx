import { Link } from 'react-router-dom';
import { ArrowRight, GitCommit, Sparkles } from 'lucide-react';

import { ROUTES } from '../../../utils/constants';

/**
 * HeroSection
 *
 * The first thing a guest sees on the landing page.
 * Large headline, sub-headline, two CTA buttons, and a subtle
 * visual badge indicating AI-powered analysis.
 */
export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-800 px-4 pt-20 pb-16 sm:px-6 lg:px-8"
      aria-labelledby="hero-heading"
    >
      {/* ── Background decorations ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Large blurred circles */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary-700 opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-secondary-700 opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600 opacity-10 blur-2xl" />

        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-3xl text-center">

        {/* AI badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 backdrop-blur-sm animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-secondary-300" aria-hidden="true" />
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-secondary-200">
            AI-Powered Code Education
          </span>
        </div>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight animate-slide-up"
        >
          The smarter way to{' '}
          <span className="text-secondary-300">learn</span>{' '}
          and{' '}
          <span className="text-secondary-300">teach</span>{' '}
          code
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 font-body text-base sm:text-lg text-primary-200 leading-relaxed max-w-xl mx-auto animate-slide-up">
          Committed brings together course management, GitHub-based submissions,
          and AI-generated code feedback — all in one platform built for
          software engineering education.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
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

        {/* Social proof / trust line */}
        <p className="mt-10 font-body text-xs text-primary-300 animate-fade-in">
          Built for students and educators · Powered by AI · Free to join
        </p>

        {/* Scroll hint */}
        <div className="mt-14 flex flex-col items-center gap-2 animate-fade-in" aria-hidden="true">
          <span className="font-body text-xs text-primary-400 tracking-widest uppercase">
            Scroll to explore
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-primary-400 to-transparent" />
        </div>

      </div>
    </section>
  );
}