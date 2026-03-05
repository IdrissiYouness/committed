import { Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ArrowRight, GitCommit } from 'lucide-react';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/features/landing/HeroSection';
import FeaturesSection from '../components/features/landing/FeaturesSection';
import { ROUTES, APP_NAME } from '../utils/constants';

/**
 * LandingPage
 *
 * Public entry point for guests visiting the platform.
 * Sections: Navbar → Hero → Features → How it Works → CTA Banner → Footer
 *
 * No auth required. Unauthenticated users see Login / Get Started CTAs.
 * Authenticated users see "Go to Dashboard" in the Navbar instead.
 */
export default function LandingPage() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Nunito, system-ui, sans-serif',
            fontSize: '0.9rem',
            borderRadius: '0.75rem',
            boxShadow: '0 8px 32px rgba(99, 132, 173, 0.16)',
          },
        }}
      />

      {/* Sticky top navigation */}
      <Navbar />

      <main id="main-content">

        {/* 1 — Hero */}
        <HeroSection />

        {/* 2 — Features + How it Works */}
        <FeaturesSection />

        {/* 3 — CTA Banner */}
        <CtaBanner />

      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

/**
 * Full-width call-to-action banner.
 * Sits between the Features section and the Footer.
 * Drives guests toward registration.
 */
function CtaBanner() {
  return (
    <section
      className="relative overflow-hidden bg-primary-800 px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="cta-heading"
    >
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-24 -left-24 h-[400px] w-[400px] rounded-full bg-primary-700 opacity-40 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[400px] w-[400px] rounded-full bg-secondary-700 opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">

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
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-3.5 font-body text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            I already have an account
          </Link>
        </div>

      </div>
    </section>
  );
}