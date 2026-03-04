import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import RegisterForm from '../RegisterForm';

// ─── Mock useAuth ─────────────────────────────────────────────────────────────
const mockRegister = vi.fn();

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

// ─── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: {
    error:   vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => 'toast-id'),
    dismiss: vi.fn(),
  },
  __esModule: true,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderRegisterForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>
  );
}

function getFullNameInput()        { return screen.getByLabelText(/full name/i); }
function getEmailInput()           { return screen.getByLabelText(/email address/i); }
function getPasswordInput()        { return screen.getByLabelText(/^password/i); }
function getConfirmPasswordInput() { return screen.getByLabelText(/confirm password/i); }
function getSubmitButton()         {
  // During loading the button text changes — fall back to type="submit"
  return screen.queryByRole('button', { name: /create account/i })
    || document.querySelector('button[type="submit"]');
}

async function fillValidForm({
  fullName        = 'Alice Dupont',
  email           = 'alice@example.com',
  password        = 'Password123!',
  confirmPassword = 'Password123!',
} = {}) {
  await userEvent.type(getFullNameInput(),        fullName);
  await userEvent.type(getEmailInput(),           email);
  await userEvent.type(getPasswordInput(),        password);
  await userEvent.type(getConfirmPasswordInput(), confirmPassword);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders all form fields', () => {
    renderRegisterForm();
    expect(getFullNameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderRegisterForm();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it('renders a link back to the login page', () => {
    renderRegisterForm();
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('does NOT show a server error banner on initial render', () => {
    renderRegisterForm();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does NOT show the password strength indicator on initial render', () => {
    renderRegisterForm();
    // The helper hint text is visible, but the strength LABEL (Weak/Fair/Good/Strong)
    // is only rendered once the user starts typing — check none of them appear yet.
    expect(screen.queryByText(/weak password/i)).toBeNull();
    expect(screen.queryByText(/fair password/i)).toBeNull();
    expect(screen.queryByText(/good password/i)).toBeNull();
    // "Strong password" could appear as part of the hint text, so check with
    // the word boundary — the strength label always ends with " password"
    const allText = document.body.textContent || '';
    expect(allText).not.toMatch(/\bStrong password\b/);
  });

  // ── Client-side validation — empty fields ──────────────────────────────────

  it('shows "Full name is required" when submitted with empty fullName', async () => {
    renderRegisterForm();
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
  });

  it('shows "Email is required" when submitted with empty email', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows "Password is required" when submitted with empty password', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows "Please confirm your password" when confirmPassword is empty', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/please confirm your password/i)).toBeInTheDocument();
  });

  it('does NOT call register when validation fails', async () => {
    renderRegisterForm();
    await userEvent.click(getSubmitButton());
    await screen.findByText(/full name is required/i);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  // ── Client-side validation — format ───────────────────────────────────────

  it('shows fullName length error when name is only 1 character', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'A');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument();
  });

  it('shows email format error for invalid email', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'not-an-email');
    await userEvent.click(getSubmitButton());
    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it('shows password length error when password is fewer than 8 characters', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'short');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  // ── Password mismatch ──────────────────────────────────────────────────────

  it('shows "Passwords do not match" when password and confirmPassword differ', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.type(getConfirmPasswordInput(), 'Different456!');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('does NOT call register when passwords do not match', async () => {
    renderRegisterForm();
    await userEvent.type(getFullNameInput(), 'Alice Dupont');
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.type(getConfirmPasswordInput(), 'Mismatch789!');
    await userEvent.click(getSubmitButton());
    await screen.findByText(/passwords do not match/i);
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('does NOT show mismatch error when passwords match', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());
    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(screen.queryByText(/passwords do not match/i)).toBeNull();
  });

  // ── Successful submission ──────────────────────────────────────────────────

  it('calls register with correct email, fullName, and password', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        'alice@example.com',
        'Alice Dupont',
        'Password123!'
      );
    });
  });

  it('does NOT pass confirmPassword to the register call', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());

    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    const args = mockRegister.mock.calls[0];
    // Only 3 arguments: email, fullName, password — no confirmPassword
    expect(args.length).toBe(3);
  });

  it('does NOT show a server error banner after a successful submit', async () => {
    mockRegister.mockResolvedValueOnce({ success: true });
    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());
    await waitFor(() => expect(mockRegister).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ── Failed submission — duplicate email (409) ──────────────────────────────

  it('shows a friendly message when the email is already registered', async () => {
    mockRegister.mockResolvedValueOnce({
      success: false,
      error: 'Email already registered: alice@example.com',
    });

    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());

    expect(
      await screen.findByText(/account with this email already exists/i)
    ).toBeInTheDocument();
  });

  it('shows the server error inside a role="alert" element for 409', async () => {
    mockRegister.mockResolvedValueOnce({
      success: false,
      error: 'Email already registered: alice@example.com',
    });

    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('shows a generic error message for non-duplicate-email failures', async () => {
    mockRegister.mockResolvedValueOnce({
      success: false,
      error: 'Internal server error',
    });

    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());

    expect(
      await screen.findByText(/internal server error/i)
    ).toBeInTheDocument();
  });

  it('shows a fallback message when error field is absent', async () => {
    mockRegister.mockResolvedValueOnce({ success: false });
    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());
    expect(
      await screen.findByText(/registration failed. please try again/i)
    ).toBeInTheDocument();
  });

  it('clears the server error banner when re-submitting after a failure', async () => {
    mockRegister.mockResolvedValueOnce({
      success: false,
      error: 'Email already registered: alice@example.com',
    });

    renderRegisterForm();
    await fillValidForm();
    await userEvent.click(getSubmitButton());
    await screen.findByRole('alert');

    mockRegister.mockResolvedValueOnce({ success: true });
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('disables the submit button while the request is in flight', async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));

    renderRegisterForm();
    await fillValidForm();
    // Click the submit button while it still has its default label
    const btn = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(btn);

    await waitFor(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      expect(submitBtn).toBeDisabled();
    });
  });

  it('changes button text to "Creating account…" during submission', async () => {
    mockRegister.mockImplementation(() => new Promise(() => {}));

    renderRegisterForm();
    await fillValidForm();
    const btn = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });
  });

  // ── Password strength indicator ────────────────────────────────────────────

  it('shows "Weak password" for a short simple password', async () => {
    renderRegisterForm();
    await userEvent.type(getPasswordInput(), 'abc');
    expect(await screen.findByText(/weak password/i)).toBeInTheDocument();
  });

  it('shows "Strong password" for a complex long password', async () => {
    renderRegisterForm();
    await userEvent.type(getPasswordInput(), 'MyStr0ng!Pass#2024');
    // Use getAllByText in case aria-live duplicates the text node
    const matches = await screen.findAllByText(/strong password/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('updates strength indicator as the user types', async () => {
    renderRegisterForm();
    const passwordField = getPasswordInput();

    await userEvent.type(passwordField, 'weak');
    const weakMatches = await screen.findAllByText(/weak password/i);
    expect(weakMatches.length).toBeGreaterThan(0);

    await userEvent.type(passwordField, 'erButLonger123!');
    const strongMatches = await screen.findAllByText(/strong password/i);
    expect(strongMatches.length).toBeGreaterThan(0);
  });

  // ── Password visibility toggle ─────────────────────────────────────────────

  it('shows the password visibility toggle for the password field', () => {
    renderRegisterForm();
    expect(
      screen.getAllByRole('button', { name: /show password/i })[0]
    ).toBeInTheDocument();
  });

  it('reveals the password when the toggle is clicked', async () => {
    renderRegisterForm();
    const passwordField = getPasswordInput();
    expect(passwordField).toHaveAttribute('type', 'password');

    await userEvent.click(
      screen.getAllByRole('button', { name: /show password/i })[0]
    );
    expect(passwordField).toHaveAttribute('type', 'text');
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('has an accessible form label', () => {
    renderRegisterForm();
    expect(
      screen.getByRole('form', { name: /registration form/i })
    ).toBeInTheDocument();
  });

  it('email input has correct autocomplete attribute', () => {
    renderRegisterForm();
    expect(getEmailInput()).toHaveAttribute('autocomplete', 'email');
  });

  it('password input has autocomplete="new-password"', () => {
    renderRegisterForm();
    expect(getPasswordInput()).toHaveAttribute('autocomplete', 'new-password');
  });
});