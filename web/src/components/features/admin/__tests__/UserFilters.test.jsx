import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import UserFilters from '../UserFilters';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  search:   '',
  role:     '',
  isActive: '',
  sortBy:   'createdAt',
  sortDir:  'desc',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a userEvent instance wired to vitest's fake timers so that
 * userEvent's internal delays (pointer events, keyboard delays) advance
 * alongside vi.advanceTimersByTime() instead of hanging on real timers.
 */
function setup() {
  return userEvent.setup({
    advanceTimers: (ms) => vi.advanceTimersByTime(ms),
  });
}

function renderFilters(props = {}) {
  const onChange = props.onChange ?? vi.fn();
  const utils = render(
    <UserFilters
      filters={DEFAULT_FILTERS}
      onChange={onChange}
      isLoading={false}
      {...props}
    />,
  );
  return { ...utils, onChange };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the search input', () => {
      renderFilters();
      expect(
        screen.getByRole('textbox', { name: /search by name or email/i }),
      ).toBeInTheDocument();
    });

    it('renders the role select', () => {
      renderFilters();
      expect(screen.getByRole('combobox', { name: /filter by role/i })).toBeInTheDocument();
    });

    it('renders the status select', () => {
      renderFilters();
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
    });

    it('renders the role options: All roles, User, Admin', () => {
      renderFilters();
      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      const options = within(roleSelect).getAllByRole('option');
      const labels = options.map((o) => o.textContent);
      expect(labels).toContain('All roles');
      expect(labels).toContain('User');
      expect(labels).toContain('Admin');
    });

    it('renders the status options: All statuses, Active, Inactive', () => {
      renderFilters();
      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      const options = within(statusSelect).getAllByRole('option');
      const labels = options.map((o) => o.textContent);
      expect(labels).toContain('All statuses');
      expect(labels).toContain('Active');
      expect(labels).toContain('Inactive');
    });

    it('does NOT render the clear button when search is empty', () => {
      renderFilters();
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });
  });

  // ── Search debounce ────────────────────────────────────────────────────────

  describe('search input — debounce', () => {
    it('does NOT call onChange immediately when typing', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input = screen.getByRole('textbox', { name: /search by name or email/i });
      await user.type(input, 'a');

      // Debounce timer has NOT elapsed yet — onChange must not have fired
      expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onChange with { search } after 300 ms', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input = screen.getByRole('textbox', { name: /search by name or email/i });
      await user.type(input, 'alice');

      // Advance past the debounce window
      vi.advanceTimersByTime(300);

      expect(onChange).toHaveBeenCalledWith({ search: 'alice' });
    });

    it('only fires onChange once for rapid typing (debounce coalescing)', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input = screen.getByRole('textbox', { name: /search by name or email/i });

      // Type 5 characters quickly — each keystroke resets the debounce timer
      await user.type(input, 'alice');

      // Advance past the debounce — only the final coalesced value fires
      vi.advanceTimersByTime(300);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ search: 'alice' });
    });

    it('fires again after subsequent typing past debounce', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input = screen.getByRole('textbox', { name: /search by name or email/i });

      await user.type(input, 'ali');
      vi.advanceTimersByTime(300);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenNthCalledWith(1, { search: 'ali' });

      await user.type(input, 'ce');
      vi.advanceTimersByTime(300);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(2, { search: 'alice' });
    });
  });

  // ── Clear button ───────────────────────────────────────────────────────────

  describe('clear search button', () => {
    it('appears when the search input has a value', async () => {
      const user = setup();
      renderFilters();

      const input = screen.getByRole('textbox', { name: /search by name or email/i });
      await user.type(input, 'a');

      expect(
        screen.getByRole('button', { name: /clear search/i }),
      ).toBeInTheDocument();
    });

    it('calls onChange with { search: "" } when clicked', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input = screen.getByRole('textbox', { name: /search by name or email/i });
      await user.type(input, 'alice');

      vi.advanceTimersByTime(300);
      onChange.mockClear(); // reset so we can isolate the clear click

      const clearBtn = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearBtn);

      expect(onChange).toHaveBeenCalledWith({ search: '' });
    });

    it('hides the clear button after clearing the search', async () => {
      const user = setup();
      renderFilters();

      const input = screen.getByRole('textbox', { name: /search by name or email/i });
      await user.type(input, 'alice');
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /clear search/i }));
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
    });
  });

  // ── Role select ────────────────────────────────────────────────────────────

  describe('role select', () => {
    it('calls onChange with { role: "admin" } when Admin is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      await user.selectOptions(roleSelect, 'admin');

      expect(onChange).toHaveBeenCalledWith({ role: 'admin' });
    });

    it('calls onChange with { role: "user" } when User is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      await user.selectOptions(roleSelect, 'user');

      expect(onChange).toHaveBeenCalledWith({ role: 'user' });
    });

    it('calls onChange with { role: "" } when "All roles" is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      // Start with admin selected
      renderFilters({
        onChange,
        filters: { ...DEFAULT_FILTERS, role: 'admin' },
      });

      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      await user.selectOptions(roleSelect, '');

      expect(onChange).toHaveBeenCalledWith({ role: '' });
    });

    it('reflects the current role filter value', () => {
      renderFilters({ filters: { ...DEFAULT_FILTERS, role: 'admin' } });
      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });
      expect(roleSelect).toHaveValue('admin');
    });
  });

  // ── Status select ──────────────────────────────────────────────────────────

  describe('status select', () => {
    it('calls onChange with { isActive: true } when Active is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusSelect, 'true');

      expect(onChange).toHaveBeenCalledWith({ isActive: true });
    });

    it('calls onChange with { isActive: false } when Inactive is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusSelect, 'false');

      expect(onChange).toHaveBeenCalledWith({ isActive: false });
    });

    it('calls onChange with { isActive: "" } when "All statuses" is selected', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({
        onChange,
        filters: { ...DEFAULT_FILTERS, isActive: true },
      });

      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      await user.selectOptions(statusSelect, '');

      expect(onChange).toHaveBeenCalledWith({ isActive: '' });
    });

    it('reflects isActive=true as the "true" option being selected', () => {
      renderFilters({ filters: { ...DEFAULT_FILTERS, isActive: true } });
      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      expect(statusSelect).toHaveValue('true');
    });

    it('reflects isActive=false as the "false" option being selected', () => {
      renderFilters({ filters: { ...DEFAULT_FILTERS, isActive: false } });
      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      expect(statusSelect).toHaveValue('false');
    });

    it('reflects isActive="" as the empty "All statuses" option', () => {
      renderFilters({ filters: { ...DEFAULT_FILTERS, isActive: '' } });
      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      expect(statusSelect).toHaveValue('');
    });
  });

  // ── Combined filters ───────────────────────────────────────────────────────

  describe('combined filter interaction', () => {
    it('role and status changes fire onChange independently and immediately', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const roleSelect   = screen.getByRole('combobox', { name: /filter by role/i });
      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });

      await user.selectOptions(roleSelect,   'admin');
      await user.selectOptions(statusSelect, 'true');

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, { role: 'admin' });
      expect(onChange).toHaveBeenNthCalledWith(2, { isActive: true });
    });

    it('search debounce does not block role/status from firing immediately', async () => {
      const user = setup();
      const onChange = vi.fn();
      renderFilters({ onChange });

      const input      = screen.getByRole('textbox', { name: /search by name or email/i });
      const roleSelect = screen.getByRole('combobox', { name: /filter by role/i });

      await user.type(input, 'ali');           // pending debounce
      await user.selectOptions(roleSelect, 'user'); // fires immediately

      expect(onChange).toHaveBeenCalledWith({ role: 'user' });
      // Search hasn't fired yet (timer not advanced)
      expect(onChange).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'ali' }));

      vi.advanceTimersByTime(300);
      expect(onChange).toHaveBeenCalledWith({ search: 'ali' });
    });
  });

  // ── Disabled / loading state ───────────────────────────────────────────────

  describe('loading / disabled state', () => {
    it('disables the role select when isLoading=true', () => {
      renderFilters({ isLoading: true });
      expect(screen.getByRole('combobox', { name: /filter by role/i })).toBeDisabled();
    });

    it('disables the status select when isLoading=true', () => {
      renderFilters({ isLoading: true });
      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeDisabled();
    });

    it('disables the search input when isLoading=true', () => {
      renderFilters({ isLoading: true });
      expect(
        screen.getByRole('textbox', { name: /search by name or email/i }),
      ).toBeDisabled();
    });
  });
});