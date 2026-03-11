import { Edit2, UserX, UserCheck } from 'lucide-react';

import UserAvatar from '../../common/UserAvatar';
import Button    from '../../common/Button';

/**
 * UserTableRow
 *
 * Renders a single row inside the admin UserTable.
 *
 * Columns: # · Name/Email · Role badge · Status badge · Joined · Actions
 *
 * Self-row guard:
 *   If the row's userId matches currentUserId (the logged-in admin), both
 *   action buttons are disabled with the tooltip "Cannot modify your own account".
 *
 * Responsive:
 *   - Email column hidden on xs (< sm)
 *   - Joined column hidden on xs/sm (< md)
 *   - Role column hidden on xs (< sm)
 *
 * Props:
 *   user          — AdminUserResponse object
 *   index         — 1-based row number (for the "#" column)
 *   currentUserId — userId of the currently logged-in admin
 *   isMutating    — true when this specific row is being mutated
 *   onEdit        — (user) => void — called when Edit button is clicked
 *   onDeactivate  — (user) => void — called when Deactivate / Reactivate is clicked
 */
export default function UserTableRow({
  user,
  index,
  currentUserId,
  isMutating = false,
  onEdit,
  onDeactivate,
}) {
  const isSelf = user.userId === currentUserId;
  const selfTitle = 'Cannot modify your own account';

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
      })
    : '—';

  return (
    <tr className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors duration-100">

      {/* ── # ───────────────────────────────────────────────────────────── */}
      <td className="pl-5 pr-3 py-3 tabular-nums">
        <span className="font-body text-sm text-neutral-400">{index}</span>
      </td>

      {/* ── Name / Email ─────────────────────────────────────────────────── */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar
            fullName={user.fullName}
            systemRole={user.systemRole}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-body text-sm font-semibold text-neutral-900 truncate max-w-[160px] sm:max-w-[200px]">
              {user.fullName || '—'}
            </p>
            {/* Email shown inline on xs when the email column is hidden */}
            <p className="font-body text-xs text-neutral-500 truncate max-w-[160px] sm:hidden">
              {user.email}
            </p>
          </div>
        </div>
      </td>

      {/* ── Email (hidden on xs) ─────────────────────────────────────────── */}
      <td className="hidden sm:table-cell px-3 py-3">
        <span className="font-body text-sm text-neutral-600 truncate block max-w-[200px]">
          {user.email}
        </span>
      </td>

      {/* ── Role badge (hidden on xs) ────────────────────────────────────── */}
      <td className="hidden sm:table-cell px-3 py-3">
        <RoleBadge role={user.systemRole} />
      </td>

      {/* ── Status badge ────────────────────────────────────────────────── */}
      <td className="px-3 py-3">
        <StatusBadge isActive={user.isActive} />
      </td>

      {/* ── Joined (hidden on xs/sm) ─────────────────────────────────────── */}
      <td className="hidden md:table-cell px-3 py-3">
        <span className="font-body text-sm text-neutral-500 whitespace-nowrap">
          {formattedDate}
        </span>
      </td>

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <td className="pl-3 pr-5 py-3">
        <div className="flex items-center gap-2 justify-end">

          {/* Edit */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(user)}
            disabled={isSelf || isMutating}
            isLoading={isMutating && !isSelf}
            title={isSelf ? selfTitle : 'Edit user'}
            aria-label={`Edit ${user.fullName}`}
            className="gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Edit</span>
          </Button>

          {/* Deactivate / Reactivate */}
          {user.isActive ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDeactivate?.(user)}
              disabled={isSelf || isMutating}
              title={isSelf ? selfTitle : 'Deactivate user'}
              aria-label={`Deactivate ${user.fullName}`}
              className="gap-1.5"
            >
              <UserX className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Deactivate</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDeactivate?.(user)}
              disabled={isSelf || isMutating}
              title={isSelf ? selfTitle : 'Reactivate user'}
              aria-label={`Reactivate ${user.fullName}`}
              className="gap-1.5"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden lg:inline">Reactivate</span>
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }) {
  const lower = role?.toLowerCase();
  const isAdmin = lower === 'admin';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'font-body text-xs font-semibold capitalize',
        isAdmin
          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-200'
          : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200',
      ].join(' ')}
    >
      {lower ?? '—'}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ isActive }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'font-body text-xs font-semibold',
        isActive
          ? 'bg-secondary-50 text-secondary-700 ring-1 ring-secondary-200'
          : 'bg-neutral-100 text-neutral-500 ring-1 ring-neutral-200',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full shrink-0',
          isActive ? 'bg-secondary-500' : 'bg-neutral-400',
        ].join(' ')}
        aria-hidden="true"
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}