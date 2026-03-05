import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GitCommit } from 'lucide-react';

import { ROUTES, APP_NAME } from '../../utils/constants';

/**
 * Footer
 *
 * Simple, clean footer for the landing page.
 * Reusable across future public pages.
 */
export default function Footer() {
  const handleSmoothScroll = useCallback((e, href) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">

          {/* Logo + name */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            aria-label={`${APP_NAME} home`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-800">
              <GitCommit className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-display text-base font-bold text-primary-900 tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          {/* Links */}
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6" role="list">
              <li>
                <a
                    href="#features"
                    onClick={(e) => handleSmoothScroll(e, '#features')}
                    className="font-body text-sm text-neutral-500 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
                  >
                    Features
                  </a>
              </li>
              <li>
                <a
                    href="#how-it-works"
                    onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
                    className="font-body text-sm text-neutral-500 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
                  >
                    How it Works
                  </a>
              </li>
              <li>
                <Link
                  to={ROUTES.REGISTER}
                  className="font-body text-sm text-neutral-500 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.LOGIN}
                  className="font-body text-sm text-neutral-500 hover:text-primary-700 transition-colors duration-150 focus:outline-none focus-visible:underline"
                >
                  Login
                </Link>
              </li>
            </ul>
          </nav>

          {/* Copyright */}
          <p className="font-body text-sm text-neutral-400">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>

        </div>
      </div>
    </footer>
  );
}