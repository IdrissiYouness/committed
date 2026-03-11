import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

import UserTableRow from './UserTableRow';

/**
 * UserTable
 *
 * Responsive table shell for the admin user list.
 *
 * Columns: # · Name / Email · Role · Status · Joined · Actions
 *
 * Sort behaviour:
 *   Clicking a sortable column header cycles: default → asc → desc → default.
 *   "default" means neither asc nor desc arrow is highlighted.
 *   The current sort state is read from `filters.sortBy` / `filters.sortDir`.
 *   Clicking a new column resets direction to 'asc'.
 *
 * Loading state:
 *   Renders SKELETON_ROWS animated placeholder rows when isLoading=true.
 *
 * Empty state:
 *   Renders a centred message when users=[] and isLoading=false.
 *
 * Props:
 *   users         — AdminUserResponse[]
 *   isLoading     — show skeletons while fetching
 *   filters       — { sortBy, sortDir, … } from useAdminUsers
 *   onSortChange  — (sortBy, sortDir) => void
 *   currentUserId — userId of the logged-in admin (for self-row guard)
 *   mutatingIds   — Set<userId> of rows currently being mutated
 *   pagination    — { page, size } for the row index offset
 *   onEdit        — (user) => void
 *   onDeactivate  — (user) => void
 */

const SKELETON_ROWS = 5;

const SORTABLE_COLUMNS = [
  { key: 'fullName',   label: 'Name / Email',  thClass: 'w-auto'   },
  { key: 'email',      label: 'Email',          thClass: 'hidden sm:table-cell w-auto' },
  { key: 'systemRole', label: 'Role',           thClass: 'hidden sm:table-cell w-24'  },
  { key: null,         label: 'Status',         thClass: 'w-28'     },
  { key: 'createdAt',  label: 'Joined',         thClass: 'hidden md:table-cell w-32'  },
];

export default function UserTable({
  users         = [],
  isLoading     = false,
  filters       = {},
  onSortChange,
  currentUserId,
  mutatingIds   = new Set(),
  pagination    = {},
  onEdit,
  onDeactivate,
}) {
  const { sortBy, sortDir } = filters;
  const pageOffset = (pagination.page ?? 0) * (pagination.size ?? 10);

  // ── Sort toggle logic ───────────────────────────────────────────────────────
  const handleSortClick = (colKey) => {
    if (!colKey) return; // non-sortable column

    if (sortBy === colKey) {
      if (sortDir === 'asc') {
        onSortChange?.(colKey, 'desc');
      } else if (sortDir === 'desc') {
        // Third click resets to default (createdAt desc)
        onSortChange?.('createdAt', 'desc');
      } else {
        onSortChange?.(colKey, 'asc');
      }
    } else {
      // New column → start with asc
      onSortChange?.(colKey, 'asc');
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-elegant">
      <table className="w-full min-w-[560px] border-collapse text-left" role="table">

        {/* ── Head ──────────────────────────────────────────────────────────── */}
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">

            {/* # */}
            <th
              scope="col"
              className="pl-5 pr-3 py-3 font-body text-xs font-semibold uppercase tracking-wider text-neutral-500 w-10"
            >
              #
            </th>

            {/* Sortable columns */}
            {SORTABLE_COLUMNS.map(({ key, label, thClass }) => (
              <th
                key={label}
                scope="col"
                className={[
                  'px-3 py-3 font-body text-xs font-semibold uppercase tracking-wider text-neutral-500',
                  thClass,
                  key ? 'cursor-pointer select-none hover:text-neutral-800 hover:bg-neutral-100 transition-colors duration-100' : '',
                ].join(' ')}
                onClick={() => handleSortClick(key)}
                aria-sort={
                  key && sortBy === key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  {key && <SortIcon colKey={key} sortBy={sortBy} sortDir={sortDir} />}
                </span>
              </th>
            ))}

            {/* Actions */}
            <th
              scope="col"
              className="pl-3 pr-5 py-3 font-body text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right w-40"
            >
              Actions
            </th>
          </tr>
        </thead>

        {/* ── Body ──────────────────────────────────────────────────────────── */}
        <tbody>
          {isLoading ? (
            // ── Skeletons ────────────────────────────────────────────────────
            Array.from({ length: SKELETON_ROWS }).map((_, i) => (
              <SkeletonRow key={i} />
            ))
          ) : users.length === 0 ? (
            // ── Empty state ──────────────────────────────────────────────────
            <tr>
              <td colSpan={7} className="px-5 py-16 text-center">
                <p className="font-display text-base font-bold text-neutral-400">
                  No users found
                </p>
                <p className="mt-1 font-body text-sm text-neutral-400">
                  Try adjusting your search or filters.
                </p>
              </td>
            </tr>
          ) : (
            // ── Real rows ────────────────────────────────────────────────────
            users.map((user, i) => (
              <UserTableRow
                key={user.userId}
                user={user}
                index={pageOffset + i + 1}
                currentUserId={currentUserId}
                isMutating={mutatingIds.has(user.userId)}
                onEdit={onEdit}
                onDeactivate={onDeactivate}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ colKey, sortBy, sortDir }) {
  if (sortBy !== colKey) {
    return <ChevronsUpDown className="h-3 w-3 text-neutral-300 shrink-0" aria-hidden="true" />;
  }
  if (sortDir === 'asc') {
    return <ChevronUp className="h-3 w-3 text-primary-600 shrink-0" aria-hidden="true" />;
  }
  return <ChevronDown className="h-3 w-3 text-primary-600 shrink-0" aria-hidden="true" />;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-100" aria-hidden="true">
      <td className="pl-5 pr-3 py-3">
        <div className="h-4 w-6 rounded-md bg-neutral-100 animate-pulse" />
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-neutral-100 animate-pulse shrink-0" />
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-28 rounded-md bg-neutral-100 animate-pulse" />
            <div className="h-3 w-20 rounded-md bg-neutral-100 animate-pulse sm:hidden" />
          </div>
        </div>
      </td>
      <td className="hidden sm:table-cell px-3 py-3">
        <div className="h-3.5 w-36 rounded-md bg-neutral-100 animate-pulse" />
      </td>
      <td className="hidden sm:table-cell px-3 py-3">
        <div className="h-5 w-14 rounded-full bg-neutral-100 animate-pulse" />
      </td>
      <td className="px-3 py-3">
        <div className="h-5 w-16 rounded-full bg-neutral-100 animate-pulse" />
      </td>
      <td className="hidden md:table-cell px-3 py-3">
        <div className="h-3.5 w-24 rounded-md bg-neutral-100 animate-pulse" />
      </td>
      <td className="pl-3 pr-5 py-3">
        <div className="flex items-center gap-2 justify-end">
          <div className="h-8 w-14 rounded-md bg-neutral-100 animate-pulse" />
          <div className="h-8 w-24 rounded-md bg-neutral-100 animate-pulse" />
        </div>
      </td>
    </tr>
  );
}