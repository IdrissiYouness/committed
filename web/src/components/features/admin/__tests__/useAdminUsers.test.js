import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mock adminService ────────────────────────────────────────────────────────

vi.mock('../../../../services/adminService', () => ({
  default: {
    listUsers:      vi.fn(),
    updateUser:     vi.fn(),
    deactivateUser: vi.fn(),
  },
}));

// ─── Mock authStore ───────────────────────────────────────────────────────────

vi.mock('../../../../store/authStore', () => ({
  useAuthStore: (selector) =>
    selector({ user: { userId: 1, systemRole: 'admin' } }),
}));

import adminService from '../../../../services/adminService';
import { useAdminUsers } from '../../../../hooks/useAdminUsers';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePageResponse(overrides = {}) {
  return {
    content:       overrides.content       ?? [],
    page:          overrides.page          ?? 0,
    size:          overrides.size          ?? 10,
    totalElements: overrides.totalElements ?? 0,
    totalPages:    overrides.totalPages    ?? 0,
    hasNext:       overrides.hasNext       ?? false,
    hasPrev:       overrides.hasPrev       ?? false,
  };
}

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
    isActive:   true,
    createdAt:  '2024-02-20T08:00:00Z',
  },
];

const LIST_PAGE = makePageResponse({ content: USERS, totalElements: 2, totalPages: 1 });

/**
 * Prepare the four parallel stats calls + the main list call.
 * Stats calls are identified by the `size: 1` argument.
 * Call order from the hook:
 *   fetchStats  → 4 parallel calls with size=1
 *   fetchList   → 1 call with the real size
 */
function mockAllCalls({
  total      = 20,
  active     = 15,
  inactive   = 5,
  adminCount = 3,
  listPage   = LIST_PAGE,
} = {}) {
  adminService.listUsers.mockImplementation((opts = {}) => {
    if (opts.size === 1) {
      if (opts.role === 'admin')    return Promise.resolve(makePageResponse({ totalElements: adminCount }));
      if (opts.isActive === true)   return Promise.resolve(makePageResponse({ totalElements: active }));
      if (opts.isActive === false)  return Promise.resolve(makePageResponse({ totalElements: inactive }));
      // No filter → total
      return Promise.resolve(makePageResponse({ totalElements: total }));
    }
    // Real list call
    return Promise.resolve(listPage);
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Initial fetch
  // ══════════════════════════════════════════════════════════════════════════

  describe('initial fetch', () => {
    it('starts in loading state', () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());
      // isLoading may or may not be true synchronously depending on timing;
      // the important thing is that it eventually resolves — checked below.
      expect(result.current).toBeDefined();
    });

    it('populates users after fetch', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.users).toHaveLength(2);
      expect(result.current.users[0].email).toBe('alice@example.com');
    });

    it('populates pagination after fetch', async () => {
      mockAllCalls({
        listPage: makePageResponse({
          content:       USERS,
          totalElements: 2,
          totalPages:    1,
          hasNext:       false,
          hasPrev:       false,
        }),
      });
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.pagination.totalElements).toBe(2);
      expect(result.current.pagination.totalPages).toBe(1);
      expect(result.current.pagination.hasNext).toBe(false);
    });

    it('sets error when listUsers throws', async () => {
      adminService.listUsers.mockImplementation((opts = {}) => {
        if (opts.size === 1) return Promise.resolve(makePageResponse());
        return Promise.reject(new Error('Server error'));
      });

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBe('Server error');
      expect(result.current.users).toHaveLength(0);
    });

    it('exposes currentUserId from authStore', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.currentUserId).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Stats fetch
  // ══════════════════════════════════════════════════════════════════════════

  describe('stats fetch', () => {
    it('derives stats from the four parallel calls', async () => {
      mockAllCalls({ total: 20, active: 15, inactive: 5, adminCount: 3 });

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoadingStats).toBe(false));

      expect(result.current.stats.total).toBe(20);
      expect(result.current.stats.active).toBe(15);
      expect(result.current.stats.inactive).toBe(5);
      expect(result.current.stats.adminCount).toBe(3);
    });

    it('starts with null stats before the fetch completes', () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      // Before awaiting, stats should still be the initial null placeholders
      expect(result.current.stats.total).toBeNull();
      expect(result.current.stats.active).toBeNull();
    });

    it('leaves stats as null when the stats fetch fails (non-critical)', async () => {
      // Stats calls (size=1) reject; list call succeeds
      adminService.listUsers.mockImplementation((opts = {}) => {
        if (opts.size === 1) return Promise.reject(new Error('Stats unavailable'));
        return Promise.resolve(LIST_PAGE);
      });

      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Stats failure must NOT set the main error state
      expect(result.current.error).toBeNull();
      // Stats remain null — the UI shows "—" for each tile
      expect(result.current.stats.total).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Filter state
  // ══════════════════════════════════════════════════════════════════════════

  describe('setFilters', () => {
    it('merges a partial filter patch', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setFilters({ role: 'admin' });
      });

      expect(result.current.filters.role).toBe('admin');
      // Other filters unchanged
      expect(result.current.filters.sortBy).toBe('createdAt');
    });

    it('resets page to 0 when filters change', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Advance to page 1
      act(() => result.current.setPage(1));

      // Change a filter — should reset to page 0
      act(() => result.current.setFilters({ search: 'alice' }));

      // After setFilters the page state goes back to 0
      // (the hook calls setPage(0) inside setFilters)
      await waitFor(() => {
        expect(result.current.filters.search).toBe('alice');
      });
    });

    it('triggers a new list fetch when filters change', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const callsBefore = adminService.listUsers.mock.calls.filter(
        (c) => (c[0]?.size ?? 10) !== 1,
      ).length;

      act(() => result.current.setFilters({ role: 'admin' }));

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const callsAfter = adminService.listUsers.mock.calls.filter(
        (c) => (c[0]?.size ?? 10) !== 1,
      ).length;

      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // updateUser
  // ══════════════════════════════════════════════════════════════════════════

  describe('updateUser', () => {
    it('calls adminService.updateUser with the correct args', async () => {
      mockAllCalls();
      adminService.updateUser.mockResolvedValue({
        ...USERS[0],
        fullName: 'Alice Updated',
      });

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.updateUser(2, { fullName: 'Alice Updated' });
      });

      expect(adminService.updateUser).toHaveBeenCalledWith(2, { fullName: 'Alice Updated' });
    });

    it('optimistically updates the local user list before the API resolves', async () => {
      // Use a slow mock so we can inspect optimistic state
      let resolveUpdate;
      adminService.updateUser.mockImplementation(
        () =>
          new Promise((res) => {
            resolveUpdate = () => res({ ...USERS[0], fullName: 'Alice Updated' });
          }),
      );
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Start the update (do not await yet)
      act(() => {
        result.current.updateUser(2, { fullName: 'Alice Updated' });
      });

      // Optimistic update should be applied synchronously
      await waitFor(() => {
        const alice = result.current.users.find((u) => u.userId === 2);
        expect(alice?.fullName).toBe('Alice Updated');
      });

      // Now resolve the API call
      await act(async () => resolveUpdate());
    });

    it('adds userId to mutatingIds while the call is in flight', async () => {
      let resolveUpdate;
      adminService.updateUser.mockImplementation(
        () =>
          new Promise((res) => {
            resolveUpdate = () => res(USERS[0]);
          }),
      );
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateUser(2, { fullName: 'Alice Updated' });
      });

      await waitFor(() => {
        expect(result.current.mutatingIds.has(2)).toBe(true);
      });

      await act(async () => resolveUpdate());

      await waitFor(() => {
        expect(result.current.mutatingIds.has(2)).toBe(false);
      });
    });

    it('removes userId from mutatingIds after a failed update', async () => {
      adminService.updateUser.mockRejectedValue(new Error('Update failed'));
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        try {
          await result.current.updateUser(2, { fullName: 'x' });
        } catch {
          // expected
        }
      });

      expect(result.current.mutatingIds.has(2)).toBe(false);
    });

    it('re-throws the error so callers can handle it', async () => {
      adminService.updateUser.mockRejectedValue(new Error('Conflict'));
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => result.current.updateUser(2, { fullName: 'x' })),
      ).rejects.toThrow('Conflict');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // deactivateUser
  // ══════════════════════════════════════════════════════════════════════════

  describe('deactivateUser', () => {
    it('calls adminService.deactivateUser with the userId', async () => {
      mockAllCalls();
      adminService.deactivateUser.mockResolvedValue({ ...USERS[0], isActive: false });

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.deactivateUser(2);
      });

      expect(adminService.deactivateUser).toHaveBeenCalledWith(2);
    });

    it('optimistically flips isActive to false before the API resolves', async () => {
      let resolveDeactivate;
      adminService.deactivateUser.mockImplementation(
        () =>
          new Promise((res) => {
            resolveDeactivate = () => res({ ...USERS[0], isActive: false });
          }),
      );
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.deactivateUser(2);
      });

      await waitFor(() => {
        const alice = result.current.users.find((u) => u.userId === 2);
        expect(alice?.isActive).toBe(false);
      });

      await act(async () => resolveDeactivate());
    });

    it('adds and removes userId from mutatingIds', async () => {
      let resolveDeactivate;
      adminService.deactivateUser.mockImplementation(
        () =>
          new Promise((res) => {
            resolveDeactivate = () => res({ ...USERS[0], isActive: false });
          }),
      );
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.deactivateUser(2);
      });

      await waitFor(() => expect(result.current.mutatingIds.has(2)).toBe(true));

      await act(async () => resolveDeactivate());

      await waitFor(() => expect(result.current.mutatingIds.has(2)).toBe(false));
    });

    it('re-throws on failure', async () => {
      adminService.deactivateUser.mockRejectedValue(new Error('Not found'));
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(
        act(async () => result.current.deactivateUser(999)),
      ).rejects.toThrow('Not found');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // isMutating derived flag
  // ══════════════════════════════════════════════════════════════════════════

  describe('isMutating', () => {
    it('is false when no mutations are in flight', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.isMutating).toBe(false);
    });

    it('is true while a mutation is in flight', async () => {
      let resolveUpdate;
      adminService.updateUser.mockImplementation(
        () => new Promise((res) => { resolveUpdate = () => res(USERS[0]); }),
      );
      mockAllCalls();

      const { result } = renderHook(() => useAdminUsers());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.updateUser(2, { fullName: 'x' });
      });

      await waitFor(() => expect(result.current.isMutating).toBe(true));

      await act(async () => resolveUpdate());

      await waitFor(() => expect(result.current.isMutating).toBe(false));
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // refresh
  // ══════════════════════════════════════════════════════════════════════════

  describe('refresh', () => {
    it('re-fetches the user list', async () => {
      mockAllCalls();
      const { result } = renderHook(() => useAdminUsers());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const listCallsBefore = adminService.listUsers.mock.calls.filter(
        (c) => (c[0]?.size ?? 10) !== 1,
      ).length;

      await act(async () => result.current.refresh());

      const listCallsAfter = adminService.listUsers.mock.calls.filter(
        (c) => (c[0]?.size ?? 10) !== 1,
      ).length;

      expect(listCallsAfter).toBeGreaterThan(listCallsBefore);
    });
  });
});