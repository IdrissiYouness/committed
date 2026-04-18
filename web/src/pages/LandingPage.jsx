import { Link } from 'react-router-dom';
import { ArrowRight, GitCommit, CheckCircle2 } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/features/landing/HeroSection';
import StatsBar from '../components/features/landing/StatsBar';
import FeaturesSection from '../components/features/landing/FeaturesSection';
import TestimonialsSection from '../components/features/landing/TestimonialsSection';
import { useInView } from '../hooks/useInView';
import { ROUTES, APP_NAME } from '../utils/constants';

/**
 * LandingPage
 *
 * Public entry point for guests visiting the platform.
 *
 * Section order:
 *   Navbar → Hero → Stats Bar → Features → How it Works
 *   → Testimonials → CTA Banner → Footer
 *
 * No auth required. Unauthenticated users see Login / Get Started CTAs.
 * Authenticated users see "Go to Dashboard" in the Navbar instead.
 */
export default function LandingPage() {
  return (
    <>
      {/* Sticky top navigation */}
      <Navbar />

      <main id="main-content">

        {/* 1 — Hero: headline, code snippet, CTAs */}
        <HeroSection />

        {/* 2 — Stats bar: animated counters */}
        <StatsBar />

        {/* 3 — Features (role switcher) + How it Works */}
        <FeaturesSection />

        {/* 4 — Testimonials */}
        <TestimonialsSection />

        {/* 5 — Final CTA banner */}
        <CtaBanner />

      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

/**
 * Full-width animated call-to-action banner.
 * Animates in on scroll. Drives guests toward registration.
 */
function CtaBanner() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section
      className="relative overflow-hidden bg-primary-800 px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="cta-heading"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-primary-700 opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-secondary-700 opacity-20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-3xl text-center"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(28px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Logo mark */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 shadow-elegant">
          <GitCommit className="h-7 w-7 text-white" aria-hidden="true" />
        </div>

        <h2
          id="cta-heading"
          className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight"
        >
          Ready to start your journey?
        </h2>

        <p className="mt-4 font-body text-base text-primary-200 max-w-lg mx-auto leading-relaxed">
          Join {APP_NAME} today — it&apos;s free to get started. Create your account
          and experience AI-powered code education from day one.
        </p>

        {/* CTA buttons */}
        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={ROUTES.REGISTER}
            className="group inline-flex items-center gap-2 rounded-xl bg-secondary-500 px-8 py-3.5 font-body text-sm font-bold text-white shadow-floating hover:bg-secondary-400 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-800"
          >
            Create Free Account
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>

          <Link
            to={ROUTES.LOGIN}
            className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-body text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            I already have an account
          </Link>
        </div>

        {/* Micro-copy */}
        <ul
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          aria-label="Trust signals"
        >
          {['Free forever', 'No credit card required', 'Ready in 2 minutes'].map((text) => (
            <li key={text} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-secondary-400 shrink-0" aria-hidden="true" />
              <span className="font-body text-xs text-primary-300">{text}</span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
}