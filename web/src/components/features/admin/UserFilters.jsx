import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

import Input from '../../common/Input';

/**
 * UserFilters
 *
 * Three filter controls rendered in a flex row (collapses to column on mobile).
 *
 * Controls:
 *   Search    — text input with 300 ms debounce → sets filters.search
 *   Role      — select: All / User / Admin       → sets filters.role
 *   Status    — select: All / Active / Inactive  → sets filters.isActive
 *
 * Any change resets the page to 0 (handled inside useAdminUsers.setFilters).
 *
 * Props:
 *   filters   — current filter state from useAdminUsers
 *   onChange  — setFilters from useAdminUsers (merges partial patch)
 *   isLoading — dims the controls while a fetch is in flight
 */
export default function UserFilters({ filters = {}, onChange, isLoading = false }) {
  // Keep a local copy of the search string so we can debounce it without
  // triggering a list re-fetch on every keystroke.
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');

  // Sync localSearch if parent resets filters externally (e.g. "Clear all")
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (filters.search !== localSearch) {
      setLocalSearch(filters.search ?? '');
    }
    // Only sync when the parent value changes; intentionally omit localSearch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  // Debounce: fire onChange 300 ms after the user stops typing
  useEffect(() => {
    if (isFirstRender.current) return;
    const timer = setTimeout(() => {
      onChange?.({ search: localSearch });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const handleRoleChange = (e) => {
    onChange?.({ role: e.target.value });
  };

  const handleStatusChange = (e) => {
    // Convert string 'true'/'false' back to boolean, or '' for "All"
    const raw = e.target.value;
    const value = raw === '' ? '' : raw === 'true';
    onChange?.({ isActive: value });
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onChange?.({ search: '' });
  };

  // ── Select shared classes ───────────────────────────────────────────────────
  const selectClass = [
    'block w-full rounded-lg px-3 py-2.5 pr-9',
    'font-body text-base text-neutral-900',
    'bg-white border border-neutral-300',
    'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500 focus:border-primary-500',
    'transition-colors duration-150',
    isLoading ? 'opacity-60 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Convert the current isActive filter value to the select's string value
  const statusValue =
    filters.isActive === true  ? 'true'  :
    filters.isActive === false ? 'false' : '';

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4"
      role="search"
      aria-label="Filter users"
    >
      {/* ── Search ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 relative">
        {/* Magnifier icon — positioned inside the input */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 mt-[1.625rem]" aria-hidden="true">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>

        <Input
          label="Search users"
          placeholder="Name or email…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          disabled={isLoading}
          inputClass="pl-9 pr-9"
          aria-label="Search by name or email"
        />

        {/* Clear button — only shown when there is a value */}
        {localSearch && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={[
              'absolute inset-y-0 right-0 flex items-center px-3 mt-[1.625rem]',
              'text-neutral-400 hover:text-neutral-600',
              'focus:outline-none focus-visible:text-primary-500',
              'transition-colors duration-150',
            ].join(' ')}
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Role filter ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 sm:w-40">
        <label className="font-body text-sm font-semibold text-neutral-700">
          Role
        </label>
        <select
          value={filters.role ?? ''}
          onChange={handleRoleChange}
          disabled={isLoading}
          className={selectClass}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* ── Status filter ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1.5 sm:w-44">
        <label className="font-body text-sm font-semibold text-neutral-700">
          Status
        </label>
        <select
          value={statusValue}
          onChange={handleStatusChange}
          disabled={isLoading}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>
    </div>
  );
}