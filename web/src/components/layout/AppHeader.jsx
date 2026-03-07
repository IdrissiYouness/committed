import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitCommit, LogOut, User, ChevronDown, Menu } from 'lucide-react';

import UserAvatar from '../common/UserAvatar';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES, APP_NAME } from '../../utils/constants';

/**
 * AppHeader
 *
 * Top navigation bar for authenticated pages.
 * Shown inside AppLayout — not on public pages.
 *
 * Left  : Hamburger (mobile) + Logo + App name
 * Right : User avatar + name + dropdown (Profile, Sign out)
 *
 * Props:
 *   onMenuToggle — called when the hamburger is clicked (opens Sidebar on mobile)
 */
export default function AppHeader({ onMenuToggle }) {
  const user                   = useAuthStore((s) => s.user);
  const { logout }             = useAuth();
  const navigate               = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef            = useRef(null);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Close dropdown on Escape ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleProfile = () => {
    setDropdownOpen(false);
    navigate(ROUTES.PROFILE);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 shadow-elegant sm:px-6">

      {/* ── Left: hamburger + logo ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Hamburger — mobile only, toggles the Sidebar */}
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Logo */}
        <Link
          to={ROUTES.DASHBOARD}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
          aria-label={`${APP_NAME} dashboard`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-800 shadow-elegant">
            <GitCommit className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="hidden font-display text-lg font-bold text-primary-900 tracking-tight sm:block">
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* ── Right: user dropdown ─────────────────────────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 hover:bg-neutral-100 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-haspopup="true"
          aria-expanded={dropdownOpen}
          aria-label="User menu"
        >
          <UserAvatar
            fullName={user?.fullName}
            systemRole={user?.systemRole}
            size="sm"
          />

          {/* Name + role — hidden on very small screens */}
          <div className="hidden text-left sm:block">
            <p className="font-body text-sm font-semibold text-neutral-800 leading-tight">
              {user?.fullName ?? 'User'}
            </p>
            <p className="font-body text-xs text-neutral-400 capitalize leading-tight">
              {user?.systemRole?.toLowerCase() ?? 'user'}
            </p>
          </div>

          <ChevronDown
            className={[
              'hidden sm:block h-4 w-4 text-neutral-400 transition-transform duration-200',
              dropdownOpen ? 'rotate-180' : '',
            ].join(' ')}
            aria-hidden="true"
          />
        </button>

        {/* ── Dropdown menu ──────────────────────────────────────────────── */}
        {dropdownOpen && (
          <div
            role="menu"
            aria-label="User options"
            className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white shadow-floating animate-scale-in overflow-hidden"
          >
            {/* User info header */}
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="font-body text-sm font-bold text-neutral-900 truncate">
                {user?.fullName ?? 'User'}
              </p>
              <p className="font-body text-xs text-neutral-400 truncate">
                {user?.email ?? ''}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              <button
                role="menuitem"
                onClick={handleProfile}
                className="flex w-full items-center gap-3 px-4 py-2.5 font-body text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 focus:outline-none focus-visible:bg-neutral-100"
              >
                <User className="h-4 w-4 text-neutral-400 shrink-0" aria-hidden="true" />
                View Profile
              </button>
            </div>

            {/* Divider + sign out */}
            <div className="border-t border-neutral-100 py-1.5">
              <button
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 font-body text-sm text-error hover:bg-red-50 transition-colors duration-150 focus:outline-none focus-visible:bg-red-50"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}