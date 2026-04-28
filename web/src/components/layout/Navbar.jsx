import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitCommit, Menu, X } from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { ROUTES, APP_NAME } from '../../utils/constants';

/**
 * Navbar
 *
 * Auth-aware top navigation bar for the landing page.
 *
 * Guest  → "Login" (ghost) + "Get Started" (primary)
 * Authed → "Go to Dashboard" (primary)
 *
 * Scroll-aware:
 *   - Background becomes fully opaque + adds shadow after scrolling past hero
 *   - Active section link is highlighted as user scrolls through sections
 *
 * Responsive: hamburger menu on mobile, inline buttons on md+.
 */
export default function Navbar() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Features',     href: '#features'     },
    { label: 'How it Works', href: '#how-it-works'  },
  ];

  // ── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const SECTIONS = ['features', 'how-it-works'];
    const SCROLL_THRESHOLD = 80; // px before navbar solidifies

    const handleScroll = () => {
      const y = window.scrollY;

      // Solidify navbar background once past the threshold
      setScrolled(y > SCROLL_THRESHOLD);

      // Determine which section is currently in view (bottom-up scan)
      let current = '';
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && y >= el.offsetTop - 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount in case page reloads mid-scroll
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Smooth scroll ──────────────────────────────────────────────────────────
  const handleSmoothScroll = useCallback((e, href) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMenuOpen(false);
  }, []);

  // ── Nav link class helper ──────────────────────────────────────────────────
  const linkClass = (href) => {
    const id = href.replace('#', '');
    const isActive = activeSection === id;
    return [
      'font-body text-sm font-semibold transition-colors duration-150',
      'focus:outline-none focus-visible:underline',
      isActive
        ? 'text-secondary-500'
        : 'text-neutral-600 hover:text-primary-700',
    ].join(' ');
  };

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white border-b border-neutral-200 shadow-elevated'
          : 'bg-white/80 backdrop-blur-md border-b border-neutral-200/60 shadow-elegant',
      ].join(' ')}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          aria-label={`${APP_NAME} home`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-800 shadow-elegant">
            <GitCommit className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold text-primary-900 tracking-tight">
            {APP_NAME}
          </span>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────────────── */}
        <ul className="hidden md:flex items-center gap-7" role="list">
          {navLinks.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                onClick={(e) => handleSmoothScroll(e, href)}
                className={linkClass(href)}
                aria-current={activeSection === href.replace('#', '') ? 'true' : undefined}
              >
                {label}
                {/* Active underline indicator */}
                {activeSection === href.replace('#', '') && (
                  <span className="block h-0.5 mt-0.5 rounded-full bg-secondary-500" aria-hidden="true" />
                )}
              </a>
            </li>
          ))}
        </ul>

        {/* ── Desktop CTA buttons ───────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <button
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="font-body text-sm font-semibold px-5 py-2 rounded-xl bg-primary-800 text-white hover:bg-primary-700 transition-colors duration-150 shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <Link
                to={ROUTES.LOGIN}
                className="font-body text-sm font-semibold px-5 py-2 rounded-xl text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Login
              </Link>
              <Link
                to={ROUTES.REGISTER}
                className="font-body text-sm font-semibold px-5 py-2 rounded-xl bg-primary-800 text-white hover:bg-primary-700 transition-colors duration-150 shadow-elegant focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile hamburger ─────────────────────────────────────────── */}
        <button
          className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen
            ? <X    className="h-5 w-5" aria-hidden="true" />
            : <Menu className="h-5 w-5" aria-hidden="true" />
          }
        </button>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-neutral-200/60 bg-white px-4 pb-5 pt-3 flex flex-col gap-3 animate-slide-up"
        >
          {navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => handleSmoothScroll(e, href)}
              className={[
                'font-body text-sm font-semibold py-2 transition-colors duration-150',
                activeSection === href.replace('#', '')
                  ? 'text-secondary-500'
                  : 'text-neutral-700 hover:text-primary-700',
              ].join(' ')}
              aria-current={activeSection === href.replace('#', '') ? 'true' : undefined}
            >
              {label}
            </a>
          ))}

          <div className="mt-1 flex flex-col gap-2">
            {isAuthenticated ? (
              <button
                onClick={() => { setMenuOpen(false); navigate(ROUTES.DASHBOARD); }}
                className="w-full font-body text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary-800 text-white hover:bg-primary-700 transition-colors duration-150"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center font-body text-sm font-semibold px-5 py-2.5 rounded-xl text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors duration-150"
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-center font-body text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary-800 text-white hover:bg-primary-700 transition-colors duration-150"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}