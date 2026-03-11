import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import UserEditModal from '../UserEditModal';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALICE = {
  userId:     2,
  email:      'alice@example.com',
  fullName:   'Alice Dupont',
  systemRole: 'user',
  isActive:   true,
  createdAt:  '2024-01-15T10:00:00Z',
};

const ADMIN_USER = {
  userId:     3,
  email:      'bob@example.com',
  fullName:   'Bob Admin',
  systemRole: 'admin',
  isActive:   true,
  createdAt:  '2024-02-20T08:00:00Z',
};

const INACTIVE_USER = {
  userId:     4,
  email:      'carol@example.com',
  fullName:   'Carol Jones',
  systemRole: 'user',
  isActive:   false,
  createdAt:  '2024-03-10T12:00:00Z',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * jsdom does not implement HTMLDialogElement.showModal / close.
 * We polyfill them on the prototype so useEffect calls don't throw.
 */
function polyfillDialog() {
  if (!window.HTMLDialogElement) {
    // Minimal polyfill: just add the methods
    Object.defineProperty(window, 'HTMLDialogElement', {
      value: class HTMLDialogElement extends HTMLElement {},
      writable: true,
    });
  }
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
    };
  }
}

function renderModal(props = {}) {
  polyfillDialog();

  const onClose = props.onClose ?? vi.fn();
  const onSave  = props.onSave  ?? vi.fn().mockResolvedValue(undefined);

  const utils = render(
    <UserEditModal
      user={ALICE}
      open={true}
      onClose={onClose}
      onSave={onSave}
      {...props}
    />,
  );

  return { ...utils, onClose, onSave };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('UserEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering & pre-population ─────────────────────────────────────────────

  describe('pre-population', () => {
    it('renders the modal heading', () => {
      renderModal();
      expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument();
    });

    it("pre-fills the fullName input with the user's full name", () => {
      renderModal();
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Alice Dupont');
    });

    it("pre-fills the email input with the user's email", () => {
      renderModal();
      expect(screen.getByLabelText(/email address/i)).toHaveValue('alice@example.com');
    });

    it("pre-selects the 'user' radio for a user-role account", () => {
      renderModal();
      const userRadio  = screen.getByRole('radio', { name: /^user$/i });
      const adminRadio = screen.getByRole('radio', { name: /^admin$/i });
      expect(userRadio).toBeChecked();
      expect(adminRadio).not.toBeChecked();
    });

    it("pre-selects the 'admin' radio for an admin-role account", () => {
      renderModal({ user: ADMIN_USER });
      const adminRadio = screen.getByRole('radio', { name: /^admin$/i });
      expect(adminRadio).toBeChecked();
    });

    it('shows the user email as a subtitle in the header', () => {
      renderModal();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    });

    it('resets the form when the user prop changes', async () => {
      const { rerender } = renderModal({ user: ALICE });
      expect(screen.getByLabelText(/full name/i)).toHaveValue('Alice Dupont');

      rerender(
        <UserEditModal
          user={ADMIN_USER}
          open={true}
          onClose={vi.fn()}
          onSave={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toHaveValue('Bob Admin');
      });
    });
  });

  // ── Close behaviour ────────────────────────────────────────────────────────

  describe('close behaviour', () => {
    it('calls onClose when the X button is clicked', async () => {
      const { onClose } = renderModal();
      await userEvent.click(screen.getByRole('button', { name: /close modal/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the Cancel button is clicked', async () => {
      const { onClose } = renderModal();
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose (without calling onSave) when no fields are changed and Save is clicked', async () => {
      const { onClose, onSave } = renderModal();

      // Click Save without making any changes
      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ── Dirty-only submit ──────────────────────────────────────────────────────

  describe('dirty-only submit payload', () => {
    it('sends only the changed fullName when only that field is modified', async () => {
      const { onSave, onClose } = renderModal();

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Alice B.');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(onSave).toHaveBeenCalled());

      const [userId, patch] = onSave.mock.calls[0];
      expect(userId).toBe(ALICE.userId);
      expect(patch).toHaveProperty('fullName', 'Alice B.');
      expect(patch).not.toHaveProperty('email');
      expect(patch).not.toHaveProperty('systemRole');
    });

    it('sends only the changed email when only that field is modified', async () => {
      const { onSave } = renderModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'alice2@example.com');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(onSave).toHaveBeenCalled());

      const [, patch] = onSave.mock.calls[0];
      expect(patch).toHaveProperty('email', 'alice2@example.com');
      expect(patch).not.toHaveProperty('fullName');
    });

    it('sends systemRole when the role radio is changed', async () => {
      const { onSave } = renderModal();

      // Alice starts as 'user' — switch to 'admin'
      const adminRadio = screen.getByRole('radio', { name: /^admin$/i });
      await userEvent.click(adminRadio);

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(onSave).toHaveBeenCalled());

      const [, patch] = onSave.mock.calls[0];
      expect(patch).toHaveProperty('systemRole', 'admin');
    });

    it('calls onClose after a successful save', async () => {
      const { onClose } = renderModal();

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Alice B.');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    });

    it('can send multiple changed fields at once', async () => {
      const { onSave } = renderModal();

      const nameInput  = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Alice B.');
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'alice2@example.com');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(onSave).toHaveBeenCalled());

      const [, patch] = onSave.mock.calls[0];
      expect(patch).toHaveProperty('fullName',  'Alice B.');
      expect(patch).toHaveProperty('email',     'alice2@example.com');
      expect(patch).not.toHaveProperty('systemRole');
    });
  });

  // ── Validation errors ──────────────────────────────────────────────────────

  describe('validation errors', () => {
    it('shows an error when fullName is cleared (too short)', async () => {
      renderModal();

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'A'); // 1 char — below min of 2

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/full name must be at least 2 characters/i),
        ).toBeInTheDocument();
      });
    });

    it('does NOT call onSave when validation fails', async () => {
      const { onSave } = renderModal();

      const nameInput = screen.getByLabelText(/full name/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'A');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/full name must be at least 2 characters/i),
        ).toBeInTheDocument();
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('shows an error for an invalid email', async () => {
      renderModal();

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'not-an-email');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please enter a valid email address/i),
        ).toBeInTheDocument();
      });
    });

    it('shows a server error banner when onSave rejects', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Email already in use'));
      renderModal({ onSave });

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'taken@example.com');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
      });
    });

    it('does NOT call onClose when onSave rejects', async () => {
      const onSave  = vi.fn().mockRejectedValue(new Error('Server error'));
      const { onClose } = renderModal({ onSave });

      const emailInput = screen.getByLabelText(/email address/i);
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'new@example.com');

      await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Form fields presence ───────────────────────────────────────────────────

  describe('form fields', () => {
    it('renders the Full name input', () => {
      renderModal();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    });

    it('renders the Email address input', () => {
      renderModal();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('renders the User and Admin role radio buttons', () => {
      renderModal();
      expect(screen.getByRole('radio', { name: /^user$/i  })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /^admin$/i })).toBeInTheDocument();
    });

    it('renders the Account active toggle', () => {
      renderModal();
      // The toggle is a checkbox with sr-only class; query by its container text
      expect(screen.getByText(/account active/i)).toBeInTheDocument();
    });

    it('renders the Save changes button', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    it('renders the Cancel button', () => {
      renderModal();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  // ── isActive pre-population ────────────────────────────────────────────────

  describe('isActive toggle pre-population', () => {
    it('the isActive checkbox is checked when user.isActive=true', () => {
      renderModal({ user: ALICE }); // isActive: true
      // react-hook-form registers the checkbox
      const checkbox = document.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeChecked();
    });

    it('the isActive checkbox is unchecked when user.isActive=false', () => {
      renderModal({ user: INACTIVE_USER }); // isActive: false
      const checkbox = document.querySelector('input[type="checkbox"]');
      expect(checkbox).not.toBeChecked();
    });
  });
});