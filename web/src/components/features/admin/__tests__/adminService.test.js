import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock api.js ──────────────────────────────────────────────────────────────
// We mock the axios wrapper so adminService tests never hit the network.
vi.mock('../../../../services/api', () => ({
  default: {
    get:    vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

// Import AFTER mocking so the module receives the mock
import api from '../../../../services/api';
import {
  listUsers,
  updateUser,
  deactivateUser,
} from '../../../../services/adminService';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PAGE_RESPONSE = {
  content:       [],
  page:          0,
  size:          10,
  totalElements: 0,
  totalPages:    0,
  hasNext:       false,
  hasPrev:       false,
};

const USER_RESPONSE = {
  userId:     42,
  email:      'alice@example.com',
  fullName:   'Alice Dupont',
  systemRole: 'user',
  isActive:   true,
  createdAt:  '2024-01-15T10:00:00Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Capture the URL that api.get was called with */
function capturedGetUrl() {
  return api.get.mock.calls[0]?.[0] ?? '';
}

/** Parse the query string from a full URL string like "/api/admin/users?foo=bar" */
function parseQS(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(idx + 1));
}

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // listUsers — query string construction
  // ══════════════════════════════════════════════════════════════════════════

  describe('listUsers', () => {
    beforeEach(() => {
      api.get.mockResolvedValue(PAGE_RESPONSE);
    });

    it('calls GET /api/admin/users', async () => {
      await listUsers();
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(capturedGetUrl()).toMatch(/^\/api\/admin\/users/);
    });

    it('appends page and size to the query string', async () => {
      await listUsers({ page: 2, size: 5 });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('page')).toBe('2');
      expect(qs.get('size')).toBe('5');
    });

    it('appends sortBy and sortDir', async () => {
      await listUsers({ sortBy: 'fullName', sortDir: 'asc' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('sortBy')).toBe('fullName');
      expect(qs.get('sortDir')).toBe('asc');
    });

    it('appends role filter when provided', async () => {
      await listUsers({ role: 'admin' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('role')).toBe('admin');
    });

    it('does NOT append role when it is an empty string', async () => {
      await listUsers({ role: '' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.has('role')).toBe(false);
    });

    it('appends isActive=true when boolean true is passed', async () => {
      await listUsers({ isActive: true });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('isActive')).toBe('true');
    });

    it('appends isActive=false when boolean false is passed', async () => {
      await listUsers({ isActive: false });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('isActive')).toBe('false');
    });

    it('does NOT append isActive when it is an empty string', async () => {
      await listUsers({ isActive: '' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.has('isActive')).toBe(false);
    });

    it('appends search when provided', async () => {
      await listUsers({ search: 'alice' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('search')).toBe('alice');
    });

    it('does NOT append search when it is an empty string', async () => {
      await listUsers({ search: '' });
      const qs = parseQS(capturedGetUrl());
      expect(qs.has('search')).toBe(false);
    });

    it('builds a combined query string with all parameters', async () => {
      await listUsers({
        page:     1,
        size:     20,
        sortBy:   'email',
        sortDir:  'desc',
        role:     'user',
        isActive: true,
        search:   'bob',
      });
      const qs = parseQS(capturedGetUrl());
      expect(qs.get('page')).toBe('1');
      expect(qs.get('size')).toBe('20');
      expect(qs.get('sortBy')).toBe('email');
      expect(qs.get('sortDir')).toBe('desc');
      expect(qs.get('role')).toBe('user');
      expect(qs.get('isActive')).toBe('true');
      expect(qs.get('search')).toBe('bob');
    });

    it('calls GET without a "?" when no parameters are passed', async () => {
      await listUsers();
      const url = capturedGetUrl();
      // No query string — bare endpoint
      expect(url).toBe('/api/admin/users');
    });

    it('returns the API response directly', async () => {
      const result = await listUsers();
      expect(result).toEqual(PAGE_RESPONSE);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // updateUser — PUT with only non-undefined fields
  // ══════════════════════════════════════════════════════════════════════════

  describe('updateUser', () => {
    beforeEach(() => {
      api.put.mockResolvedValue(USER_RESPONSE);
    });

    it('calls PUT /api/admin/users/:id', async () => {
      await updateUser(42, { fullName: 'Alice B.' });
      expect(api.put).toHaveBeenCalledTimes(1);
      expect(api.put.mock.calls[0][0]).toBe('/api/admin/users/42');
    });

    it('sends only the provided patch fields in the body', async () => {
      await updateUser(42, { fullName: 'Alice B.' });
      const body = api.put.mock.calls[0][1];
      expect(body).toEqual({ fullName: 'Alice B.' });
    });

    it('sends multiple patch fields when provided', async () => {
      await updateUser(42, { fullName: 'Alice B.', email: 'alice2@example.com' });
      const body = api.put.mock.calls[0][1];
      expect(body).toEqual({ fullName: 'Alice B.', email: 'alice2@example.com' });
    });

    it('strips undefined values from the body', async () => {
      await updateUser(42, { fullName: 'Alice B.', email: undefined });
      const body = api.put.mock.calls[0][1];
      expect(body).toEqual({ fullName: 'Alice B.' });
      expect('email' in body).toBe(false);
    });

    it('can send systemRole and isActive', async () => {
      await updateUser(42, { systemRole: 'admin', isActive: false });
      const body = api.put.mock.calls[0][1];
      expect(body).toEqual({ systemRole: 'admin', isActive: false });
    });

    it('sends isActive=false (falsy values are preserved)', async () => {
      await updateUser(42, { isActive: false });
      const body = api.put.mock.calls[0][1];
      expect(body.isActive).toBe(false);
    });

    it('returns the updated user from the API response', async () => {
      const result = await updateUser(42, { fullName: 'Alice B.' });
      expect(result).toEqual(USER_RESPONSE);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // deactivateUser — DELETE
  // ══════════════════════════════════════════════════════════════════════════

  describe('deactivateUser', () => {
    beforeEach(() => {
      api.delete.mockResolvedValue({ ...USER_RESPONSE, isActive: false });
    });

    it('calls DELETE /api/admin/users/:id', async () => {
      await deactivateUser(42);
      expect(api.delete).toHaveBeenCalledTimes(1);
      expect(api.delete.mock.calls[0][0]).toBe('/api/admin/users/42');
    });

    it('calls DELETE with the correct userId in the URL', async () => {
      await deactivateUser(99);
      expect(api.delete.mock.calls[0][0]).toBe('/api/admin/users/99');
    });

    it('returns the deactivated user from the API response', async () => {
      const result = await deactivateUser(42);
      expect(result.isActive).toBe(false);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Error propagation
  // ══════════════════════════════════════════════════════════════════════════

  describe('error propagation', () => {
    it('listUsers re-throws API errors', async () => {
      const err = new Error('Network error');
      api.get.mockRejectedValue(err);
      await expect(listUsers()).rejects.toThrow('Network error');
    });

    it('updateUser re-throws API errors', async () => {
      const err = new Error('Validation failed');
      err.status = 400;
      api.put.mockRejectedValue(err);
      await expect(updateUser(42, { fullName: 'x' })).rejects.toThrow('Validation failed');
    });

    it('deactivateUser re-throws API errors', async () => {
      const err = new Error('User not found');
      err.status = 404;
      api.delete.mockRejectedValue(err);
      await expect(deactivateUser(999)).rejects.toThrow('User not found');
    });

    it('listUsers propagates the error status code', async () => {
      const err = new Error('Forbidden');
      err.status = 403;
      api.get.mockRejectedValue(err);
      try {
        await listUsers();
      } catch (e) {
        expect(e.status).toBe(403);
      }
    });
  });
});