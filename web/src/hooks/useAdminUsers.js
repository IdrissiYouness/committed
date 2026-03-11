import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuthStore }  from '../store/authStore';
import adminService      from '../services/adminService';

/**
 * useAdminUsers
 *
 * Central state manager for the Admin User Management page (WEB-007).
 *
 * ─── Data fetching ─────────────────────────────────────────────────────────────
 * Two independent fetch cycles:
 *
 *   1. Stats fetch  — runs once on mount (4 parallel size=1 calls to cheaply
 *                     read totalElements for: total, active, inactive, admin).
 *
 *   2. List fetch   — runs on mount and whenever `filters`, `page`, or `size`
 *                     change. Fetches the current page of users.
 *
 * ─── Mutations ─────────────────────────────────────────────────────────────────
 * updateUser    — PUT /api/admin/users/:id (only dirty fields).
 *                 Optimistically updates the local row, then re-fetches.
 * deactivateUser — DELETE /api/admin/users/:id.
 *                  Optimistically flips isActive, then re-fetches.
 *
 * @returns {{
 *   users:          object[],
 *   pagination:     { page, size, totalElements, totalPages, hasNext, hasPrev },
 *   stats:          { total, active, inactive, adminCount },
 *
 *   isLoading:      boolean,
 *   isLoadingStats: boolean,
 *   isMutating:     boolean,
 *   mutatingIds:    Set<number>,
 *   error:          string | null,
 *
 *   filters:        { search, role, isActive, sortBy, sortDir },
 *   setFilters:     (patch: object) => void,
 *   setPage:        (n: number)     => void,
 *   setSize:        (n: number)     => void,
 *
 *   updateUser:     (userId, patch) => Promise<void>,
 *   deactivateUser: (userId)        => Promise<void>,
 *   refresh:        ()              => void,
 * }}
 */
export function useAdminUsers() {
  const currentUser = useAuthStore((s) => s.user);

  // ── List state ─────────────────────────────────────────────────────────────
  const [users,      setUsers]      = useState([]);
  const [pagination, setPagination] = useState({
    page:          0,
    size:          10,
    totalElements: 0,
    totalPages:    0,
    hasNext:       false,
    hasPrev:       false,
  });

  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats,          setStats]          = useState({ total: null, active: null, inactive: null, adminCount: null });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [isLoading,   setIsLoading]   = useState(false);
  const [mutatingIds, setMutatingIds] = useState(new Set());
  const [error,       setError]       = useState(null);

  // ── Filter / pagination controls ───────────────────────────────────────────
  const [filters, setFiltersRaw] = useState({
    search:  '',
    role:    '',
    isActive: '',
    sortBy:  'createdAt',
    sortDir: 'desc',
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Ref to track the latest fetch so stale responses don't overwrite fresh ones
  const fetchIdRef = useRef(0);

  // ── setFilters helper ──────────────────────────────────────────────────────
  // Merges a partial update and resets to page 0 so the user sees results
  // immediately after changing a filter.
  const setFilters = useCallback((patch) => {
    setFiltersRaw((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  // ── Stats fetch (mount only) ───────────────────────────────────────────────
  // Four parallel size=1 calls — cheap because we only read totalElements.
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const [totalRes, activeRes, inactiveRes, adminRes] = await Promise.all([
        adminService.listUsers({ size: 1 }),
        adminService.listUsers({ size: 1, isActive: true  }),
        adminService.listUsers({ size: 1, isActive: false }),
        adminService.listUsers({ size: 1, role: 'admin'   }),
      ]);
      setStats({
        total:      totalRes.totalElements,
        active:     activeRes.totalElements,
        inactive:   inactiveRes.totalElements,
        adminCount: adminRes.totalElements,
      });
    } catch {
      // Stats are non-critical — failures show "—" via null values; no hard error.
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── List fetch ─────────────────────────────────────────────────────────────
  const fetchList = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.listUsers({
        page,
        size,
        sortBy:   filters.sortBy   || undefined,
        sortDir:  filters.sortDir  || undefined,
        role:     filters.role     || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
        search:   filters.search   || undefined,
      });

      // Discard if a newer fetch has already started
      if (fetchId !== fetchIdRef.current) return;

      setUsers(result.content ?? []);
      setPagination({
        page:          result.page,
        size:          result.size,
        totalElements: result.totalElements,
        totalPages:    result.totalPages,
        hasNext:       result.hasNext,
        hasPrev:       result.hasPrev,
      });
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      setError(err?.message ?? 'Failed to load users. Please try again.');
    } finally {
      if (fetchId === fetchIdRef.current) setIsLoading(false);
    }
  }, [page, size, filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // ── Mutation helpers ───────────────────────────────────────────────────────

  const addMutating    = (id) => setMutatingIds((prev) => new Set([...prev, id]));
  const removeMutating = (id) => setMutatingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });

  /**
   * Update a user's profile/role/status.
   * Optimistically patches the local row, then re-fetches to stay consistent.
   *
   * @param {number} userId
   * @param {object} patch   — subset of { fullName, email, systemRole, isActive }
   */
  const updateUser = useCallback(async (userId, patch) => {
    addMutating(userId);

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, ...patch } : u)),
    );

    try {
      await adminService.updateUser(userId, patch);
      // Re-fetch to get the authoritative server state
      await fetchList();
      // Refresh stats too (role/isActive may have changed)
      await fetchStats();
    } catch (err) {
      // Roll back the optimistic update
      await fetchList();
      throw err;
    } finally {
      removeMutating(userId);
    }
  }, [fetchList, fetchStats]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Deactivate (soft-delete) a user.
   * Optimistically flips isActive=false, then re-fetches.
   *
   * @param {number} userId
   */
  const deactivateUser = useCallback(async (userId) => {
    addMutating(userId);

    // Optimistic flip
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, isActive: false } : u)),
    );

    try {
      await adminService.deactivateUser(userId);
      await fetchList();
      await fetchStats();
    } catch (err) {
      await fetchList();
      throw err;
    } finally {
      removeMutating(userId);
    }
  }, [fetchList, fetchStats]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ────────────────────────────────────────────────────────────────
  const isMutating = mutatingIds.size > 0;

  return {
    // Data
    users,
    pagination,
    stats,

    // Loading / error
    isLoading,
    isLoadingStats,
    isMutating,
    mutatingIds,
    error,

    // Filter controls
    filters,
    setFilters,
    setPage,
    setSize,

    // Actions
    updateUser,
    deactivateUser,
    refresh: fetchList,

    // Expose current user ID so rows can detect self
    currentUserId: currentUser?.userId,
  };
}

export default useAdminUsers;