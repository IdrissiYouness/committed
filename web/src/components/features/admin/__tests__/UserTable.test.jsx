import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import UserTable from '../UserTable';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USERS = [
  {
    userId:     2,
    email:      'alice@example.com',
    fullName:   'Alice Dupont',
    systemRole: 'user',
    isActive:   true,
    createdAt:  '2024-01-15T10:00:00Z',
  },
  {
    userId:     3,
    email:      'bob@example.com',
    fullName:   'Bob Smith',
    systemRole: 'admin',
    isActive:   false,
    createdAt:  '2024-02-20T08:00:00Z',
  },
  {
    userId:     4,
    email:      'carol@example.com',
    fullName:   'Carol Jones',
    systemRole: 'user',
    isActive:   true,
    createdAt:  '2024-03-10T12:00:00Z',
  },
];

const DEFAULT_FILTERS = {
  search:  '',
  role:    '',
  isActive: '',
  sortBy:  'createdAt',
  sortDir: 'desc',
};

const DEFAULT_PAGINATION = { page: 0, size: 10 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderTable(props = {}) {
  return render(
    <MemoryRouter>
      <UserTable
        users={USERS}
        isLoading={false}
        filters={DEFAULT_FILTERS}
        onSortChange={vi.fn()}
        currentUserId={1}           // admin's own userId — NOT in USERS list
        mutatingIds={new Set()}
        pagination={DEFAULT_PAGINATION}
        onEdit={vi.fn()}
        onDeactivate={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserTable', () => {
  // ── Renders correct number of rows ────────────────────────────────────────

  describe('row count', () => {
    it('renders one <tr> per user (plus the header row)', () => {
      renderTable();
      // getAllByRole('row') includes the header row
      const rows = screen.getAllByRole('row');
      // 1 header + 3 data rows
      expect(rows).toHaveLength(4);
    });

    it('renders user full names in the table', () => {
      renderTable();
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol Jones')).toBeInTheDocument();
    });

    it('renders row indices offset by page * size', () => {
      // Page 1 (0-based), size 10 → first row should be #11
      renderTable({ pagination: { page: 1, size: 10 } });
      expect(screen.getByText('11')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
    });

    it('renders row index 1 on the first page', () => {
      renderTable({ pagination: { page: 0, size: 10 } });
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  // ── Loading skeleton ──────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders skeleton rows when isLoading=true', () => {
      const { container } = renderTable({ users: [], isLoading: true });
      const pulseEls = container.querySelectorAll('.animate-pulse');
      expect(pulseEls.length).toBeGreaterThan(0);
    });

    it('does NOT render real user names when isLoading=true', () => {
      renderTable({ isLoading: true });
      expect(screen.queryByText('Alice Dupont')).not.toBeInTheDocument();
    });

    it('does NOT render the empty-state message when isLoading=true', () => {
      renderTable({ users: [], isLoading: true });
      expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
    });
  });

  // ── Empty state ───────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows "No users found" when users=[] and not loading', () => {
      renderTable({ users: [], isLoading: false });
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });

    it('shows a hint message in the empty state', () => {
      renderTable({ users: [], isLoading: false });
      expect(
        screen.getByText(/try adjusting your search or filters/i),
      ).toBeInTheDocument();
    });

    it('does NOT show the empty state when users are present', () => {
      renderTable();
      expect(screen.queryByText(/no users found/i)).not.toBeInTheDocument();
    });
  });

  // ── Column headers ────────────────────────────────────────────────────────

  describe('column headers', () => {
    it('renders the # column header', () => {
      renderTable();
      expect(screen.getByRole('columnheader', { name: '#' })).toBeInTheDocument();
    });

    it('renders the Actions column header', () => {
      renderTable();
      expect(screen.getByRole('columnheader', { name: /actions/i })).toBeInTheDocument();
    });

    it('renders the Status column header', () => {
      renderTable();
      expect(
        screen.getByRole('columnheader', { name: /status/i }),
      ).toBeInTheDocument();
    });
  });

  // ── Sort behaviour ────────────────────────────────────────────────────────

  describe('sort interaction', () => {
    it('calls onSortChange when a sortable column header is clicked', async () => {
      const onSortChange = vi.fn();
      renderTable({ onSortChange });

      // "Name / Email" column header is sortable (key=fullName)
      const nameHeader = screen.getByRole('columnheader', { name: /name \/ email/i });
      await userEvent.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledTimes(1);
      // First click on a new column → asc
      expect(onSortChange).toHaveBeenCalledWith('fullName', 'asc');
    });

    it('cycles asc → desc when the same column is clicked twice', async () => {
      const onSortChange = vi.fn();
      renderTable({
        onSortChange,
        filters: { ...DEFAULT_FILTERS, sortBy: 'fullName', sortDir: 'asc' },
      });

      const nameHeader = screen.getByRole('columnheader', { name: /name \/ email/i });
      await userEvent.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledWith('fullName', 'desc');
    });

    it('resets to default sort (createdAt desc) on third click of same column', async () => {
      const onSortChange = vi.fn();
      renderTable({
        onSortChange,
        filters: { ...DEFAULT_FILTERS, sortBy: 'fullName', sortDir: 'desc' },
      });

      const nameHeader = screen.getByRole('columnheader', { name: /name \/ email/i });
      await userEvent.click(nameHeader);

      expect(onSortChange).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('does NOT call onSortChange when the Status (non-sortable) header is clicked', async () => {
      const onSortChange = vi.fn();
      renderTable({ onSortChange });

      const statusHeader = screen.getByRole('columnheader', { name: /status/i });
      await userEvent.click(statusHeader);

      expect(onSortChange).not.toHaveBeenCalled();
    });
  });

  // ── Action buttons ────────────────────────────────────────────────────────

  describe('action buttons', () => {
    it('calls onEdit with the user when the Edit button is clicked', async () => {
      const onEdit = vi.fn();
      renderTable({ onEdit });

      // Alice's edit button
      const editBtn = screen.getByRole('button', { name: /edit alice dupont/i });
      await userEvent.click(editBtn);

      expect(onEdit).toHaveBeenCalledWith(USERS[0]);
    });

    it('calls onDeactivate with the user when Deactivate is clicked', async () => {
      const onDeactivate = vi.fn();
      renderTable({ onDeactivate });

      // Alice is active → button label is "Deactivate"
      const deactivateBtn = screen.getByRole('button', { name: /deactivate alice dupont/i });
      await userEvent.click(deactivateBtn);

      expect(onDeactivate).toHaveBeenCalledWith(USERS[0]);
    });

    it('shows a Reactivate button for inactive users', () => {
      renderTable();
      // Bob is inactive
      expect(
        screen.getByRole('button', { name: /reactivate bob smith/i }),
      ).toBeInTheDocument();
    });

    it('shows a Deactivate button for active users', () => {
      renderTable();
      expect(
        screen.getByRole('button', { name: /deactivate alice dupont/i }),
      ).toBeInTheDocument();
    });
  });

  // ── Self-row guard ────────────────────────────────────────────────────────

  describe('self-row guard', () => {
    it('disables Edit for the logged-in admin own row', () => {
      // currentUserId=2 → Alice is the logged-in admin
      renderTable({ currentUserId: 2 });

      const editBtn = screen.getByRole('button', { name: /edit alice dupont/i });
      expect(editBtn).toBeDisabled();
    });

    it('disables Deactivate for the logged-in admin own row', () => {
      renderTable({ currentUserId: 2 });

      const deactivateBtn = screen.getByRole('button', { name: /deactivate alice dupont/i });
      expect(deactivateBtn).toBeDisabled();
    });

    it('does NOT disable Edit buttons for other rows', () => {
      renderTable({ currentUserId: 2 });

      // Carol is NOT the logged-in admin
      const editCarol = screen.getByRole('button', { name: /edit carol jones/i });
      expect(editCarol).not.toBeDisabled();
    });

    it('does not disable any row when currentUserId does not match any user', () => {
      renderTable({ currentUserId: 999 });

      const aliceEdit = screen.getByRole('button', { name: /edit alice dupont/i });
      expect(aliceEdit).not.toBeDisabled();
    });
  });

  // ── Mutating rows ─────────────────────────────────────────────────────────

  describe('mutating rows', () => {
    it('disables Edit and Deactivate buttons for a row that is mutating', () => {
      renderTable({ mutatingIds: new Set([2]) });

      const editBtn       = screen.getByRole('button', { name: /edit alice dupont/i });
      const deactivateBtn = screen.getByRole('button', { name: /deactivate alice dupont/i });

      expect(editBtn).toBeDisabled();
      expect(deactivateBtn).toBeDisabled();
    });

    it('does NOT disable buttons on rows that are not mutating', () => {
      renderTable({ mutatingIds: new Set([2]) });

      // Carol's row is unaffected
      const editCarol = screen.getByRole('button', { name: /edit carol jones/i });
      expect(editCarol).not.toBeDisabled();
    });
  });

  // ── Status badges ─────────────────────────────────────────────────────────

  describe('status badges', () => {
    it('shows "Active" badge for active users', () => {
      renderTable();
      const activeBadges = screen.getAllByText('Active');
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it('shows "Inactive" badge for inactive users', () => {
      renderTable();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });
});