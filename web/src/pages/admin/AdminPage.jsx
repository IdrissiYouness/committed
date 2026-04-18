import { useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import useAdminUsers          from '../../hooks/useAdminUsers';
import AdminStatCards         from '../../components/features/admin/AdminStatCards';
import UserFilters            from '../../components/features/admin/UserFilters';
import UserTable              from '../../components/features/admin/UserTable';
import UserEditModal          from '../../components/features/admin/UserEditModal';
import UserDeactivateConfirm  from '../../components/features/admin/UserDeactivateConfirm';
import Pagination             from '../../components/common/Pagination';

/**
 * AdminPage  — /admin
 *
 * The admin user-management page.  All state lives in useAdminUsers(); this
 * component is purely a composition layer that wires the hook's data and
 * actions into the feature components.
 *
 * Layout:
 *   ┌─ page heading + refresh button
 *   ├─ AdminStatCards   (4 live-count tiles)
 *   ├─ UserFilters      (search / role / status)
 *   ├─ error banner     (when hook.error is set)
 *   ├─ UserTable        (sortable, paginated, with action buttons)
 *   └─ Pagination
 *
 * Modals (rendered at the bottom, outside the flow):
 *   UserEditModal          — opens when the user clicks "Edit" on a row
 *   UserDeactivateConfirm  — opens when the user clicks "Deactivate / Reactivate"
 */
export default function AdminPage() {
  // ── Hook ────────────────────────────────────────────────────────────────────
  const {
    users,
    pagination,
    stats,
    isLoading,
    isFetching,
    isLoadingStats,
    mutatingIds,
    error,
    filters,
    setFilters,
    setPage,
    currentUserId,
    updateUser,
    deactivateUser,
    refresh,
  } = useAdminUsers();

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [editTarget,       setEditTarget]       = useState(null); // user | null
  const [deactivateTarget, setDeactivateTarget] = useState(null); // user | null
  const [isConfirming,     setIsConfirming]     = useState(false);

  // ── Sort handler (maps to setFilters) ────────────────────────────────────────
  const handleSortChange = (sortBy, sortDir) => {
    setFilters({ sortBy, sortDir });
  };

  // ── Edit modal handlers ───────────────────────────────────────────────────────
  const openEdit  = (user) => setEditTarget(user);
  const closeEdit = ()     => setEditTarget(null);

  const handleSave = async (userId, patch) => {
    try {
      await updateUser(userId, patch);
      toast.success('User updated successfully.');
      closeEdit();
    } catch (err) {
      // Re-throw so the modal can display the server error inline
      throw err;
    }
  };

  // ── Deactivate/reactivate modal handlers ──────────────────────────────────────
  const openDeactivate  = (user) => setDeactivateTarget(user);
  const closeDeactivate = ()     => setDeactivateTarget(null);

  const handleConfirmDeactivate = async (userId) => {
    const isActive = deactivateTarget?.isActive ?? true;
    const action   = isActive ? 'deactivated' : 'reactivated';
    setIsConfirming(true);
    try {
      await deactivateUser(userId, deactivateTarget?.isActive ?? true);
      toast.success(`User ${action} successfully.`);
      closeDeactivate();
    } catch (err) {
      toast.error(err?.message ?? `Failed to ${isActive ? 'deactivate' : 'reactivate'} user.`);
    } finally {
      setIsConfirming(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">

      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 border border-primary-100">
            <ShieldCheck className="h-5 w-5 text-primary-600" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold text-neutral-900 tracking-tight">
                User Management
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-lg bg-primary-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-primary-700 border border-primary-200">
                Admin Panel
              </span>
            </div>
            <p className="mt-0.5 font-body text-sm text-neutral-500">
              View, edit, and manage all platform users.
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className={[
            'flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2',
            'font-body text-sm font-semibold text-neutral-600',
            'hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
            'shadow-elegant',
          ].join(' ')}
          aria-label="Refresh user list"
        >
          <RefreshCw
            className={['h-4 w-4', isLoading ? 'animate-spin' : ''].join(' ')}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* ── Platform stat tiles ───────────────────────────────────────────── */}
      <section aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="sr-only">Platform statistics</h2>
        <AdminStatCards stats={stats} isLoading={isLoadingStats} />
      </section>

      {/* ── Filters + table ───────────────────────────────────────────────── */}
      <section aria-labelledby="user-list-heading">
        <h2 id="user-list-heading" className="sr-only">User list</h2>

        {/* Filters */}
        <UserFilters
          filters={filters}
          onChange={setFilters}
          isLoading={isLoading}
        />

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span className="font-body">{error}</span>
            <button
              type="button"
              onClick={refresh}
              className="ml-auto shrink-0 font-body text-sm font-semibold text-red-700 underline hover:no-underline focus:outline-none"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="mt-4">
          <UserTable
            users={users}
            isLoading={isLoading}
            isFetching={isFetching}
            filters={filters}
            onSortChange={handleSortChange}
            currentUserId={currentUserId}
            mutatingIds={mutatingIds}
            pagination={pagination}
            onEdit={openEdit}
            onDeactivate={openDeactivate}
          />
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <UserEditModal
        user={editTarget}
        open={editTarget !== null}
        onClose={closeEdit}
        onSave={handleSave}
      />

      <UserDeactivateConfirm
        user={deactivateTarget}
        open={deactivateTarget !== null}
        onClose={closeDeactivate}
        onConfirm={handleConfirmDeactivate}
        isLoading={isConfirming}
      />
    </div>
  );
}