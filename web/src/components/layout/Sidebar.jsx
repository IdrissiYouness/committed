import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  BarChart2,
  ShieldCheck,
  X,
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

/**
 * Sidebar
 *
 * Left navigation panel for authenticated pages.
 * Shown inside AppLayout.
 *
 * - Role-aware: Admin link only visible to admins
 * - Coming-soon stubs: future routes are dimmed + non-clickable
 * - Active link: highlighted with primary accent
 * - Mobile overlay: closable via the X button or backdrop click
 *
 * Props:
 *   open          — whether the sidebar is visible (mobile)
 *   onClose       — called when user closes the sidebar on mobile
 */

// ─── Nav link definitions ─────────────────────────────────────────────────────

const NAV_LINKS = [
  {
    label:     'Dashboard',
    icon:      LayoutDashboard,
    to:        ROUTES.DASHBOARD,
    ready:     true,
    adminOnly: false,
  },
  {
    label:     'Courses',
    icon:      BookOpen,
    to:        ROUTES.COURSES,
    ready:     false,
    adminOnly: false,
    badge:     'WEB-003',
  },
  {
    label:     'Assignments',
    icon:      ClipboardList,
    to:        ROUTES.ASSIGNMENTS,
    ready:     false,
    adminOnly: false,
    badge:     'WEB-004',
  },
  {
    label:     'Grades',
    icon:      BarChart2,
    to:        ROUTES.GRADES,
    ready:     false,
    adminOnly: false,
    badge:     'WEB-005',
  },
];

const ADMIN_LINK = {
  label:     'Admin',
  icon:      ShieldCheck,
  to:        ROUTES.ADMIN,
  ready:     true,
  adminOnly: true,
};

// ─── Single nav item ──────────────────────────────────────────────────────────

function NavItem({ label, icon: Icon, to, ready, badge, onClose }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (!ready) {
    return (
      <li>
        <span
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-not-allowed opacity-40 select-none"
          title={`Coming soon — ${badge}`}
          aria-disabled="true"
        >
          <span
            className={[
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              'bg-neutral-100 text-neutral-400',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="font-body text-sm font-semibold text-neutral-400">
            {label}
          </span>
          <span className="ml-auto font-mono text-[10px] text-neutral-300 bg-neutral-100 px-1.5 py-0.5 rounded-md">
            soon
          </span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={to}
        onClick={onClose}
        className={[
          'flex items-center gap-3 rounded-xl px-3 py-2.5',
          'font-body text-sm font-semibold',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          isActive
            ? 'bg-primary-800 text-white shadow-elegant'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        ].join(' ')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span
          className={[
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150',
            isActive
              ? 'bg-white/15 text-white'
              : 'bg-neutral-100 text-neutral-500 group-hover:bg-primary-50',
          ].join(' ')}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {label}
      </NavLink>
    </li>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ open, onClose }) {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const visibleLinks = isAdmin
    ? [...NAV_LINKS, ADMIN_LINK]
    : NAV_LINKS;

  return (
    <>
      {/* ── Mobile backdrop ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ────────────────────────────────────────────────── */}
      <aside
        id="sidebar"
        className={[
          // Layout
          'fixed top-16 bottom-0 left-0 z-40 w-64',
          'flex flex-col',
          // Background
          'border-r border-neutral-200 bg-white',
          // Mobile: slide in/out
          'transition-transform duration-300 ease-smooth',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible
          'lg:translate-x-0',
        ].join(' ')}
        aria-label="Main navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-neutral-100">
          <span className="font-body text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Navigation
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
          <ul className="flex flex-col gap-1" role="list">
            {visibleLinks.map((link) => (
              <NavItem
                key={link.to}
                {...link}
                onClose={onClose}
              />
            ))}
          </ul>
        </nav>

        {/* Bottom: app version */}
        <div className="border-t border-neutral-100 px-4 py-3">
          <p className="font-body text-xs text-neutral-300 text-center">
            Committed · v0.1.0
          </p>
        </div>
      </aside>
    </>
  );
}