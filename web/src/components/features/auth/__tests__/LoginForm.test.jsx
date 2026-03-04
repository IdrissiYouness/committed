import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

import LoginForm from '../LoginForm';

// ─── Mock useAuth ─────────────────────────────────────────────────────────────
// We only want to test the form behaviour — not the hook internals or routing.
const mockLogin = vi.fn();

vi.mock('../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// ─── Mock react-hot-toast ────────────────────────────────────────────────────
vi.mock('react-hot-toast', () => ({
  default: {
    error:   vi.fn(),
    success: vi.fn(),
  },
  __esModule: true,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

function getEmailInput()    { return screen.getByLabelText(/email address/i); }
function getPasswordInput() { return screen.getByLabelText(/^password/i); }
function getSubmitButton()  { return screen.getByRole('button', { name: /sign in/i }); }

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the email field', () => {
    renderLoginForm();
    expect(getEmailInput()).toBeInTheDocument();
  });

  it('renders the password field', () => {
    renderLoginForm();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderLoginForm();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it('renders the Remember Me checkbox', () => {
    renderLoginForm();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders a link to the registration page', () => {
    renderLoginForm();
    expect(screen.getByRole('link', { name: /create one/i })).toBeInTheDocument();
  });

  it('renders the Forgot password button', () => {
    renderLoginForm();
    expect(screen.getByRole('button', { name: /forgot password/i })).toBeInTheDocument();
  });

  it('does NOT show a server error banner on initial render', () => {
    renderLoginForm();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ── Client-side validation — empty fields ──────────────────────────────────

  it('shows "Email is required" when submitted with empty email', async () => {
    renderLoginForm();
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows "Password is required" when submitted with empty password', async () => {
    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.click(getSubmitButton());
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  // ── Client-side validation — format ───────────────────────────────────────

  it('shows email validation error for invalid email format', async () => {
    renderLoginForm();
    await userEvent.type(getEmailInput(), 'not-an-email');
    await userEvent.click(getSubmitButton());
    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it('shows password length error when password is fewer than 8 characters', async () => {
    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'short');
    await userEvent.click(getSubmitButton());
    expect(
      await screen.findByText(/at least 8 characters/i)
    ).toBeInTheDocument();
  });

  it('does NOT call login when validation fails', async () => {
    renderLoginForm();
    await userEvent.click(getSubmitButton());
    await screen.findByText(/email is required/i);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  // ── Successful submission ──────────────────────────────────────────────────

  it('calls login with correct email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'alice@example.com',
        'Password123!',
        false // rememberMe defaults to false
      );
    });
  });

  it('passes rememberMe=true when Remember Me checkbox is checked', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'alice@example.com',
        'Password123!',
        true
      );
    });
  });

  it('does NOT show a server error banner after a successful submit', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  // ── Failed submission — server errors ──────────────────────────────────────

  it('shows server error banner when login returns { success: false }', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid email or password',
    });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'WrongPass1!');
    await userEvent.click(getSubmitButton());

    expect(
      await screen.findByText(/invalid email or password/i)
    ).toBeInTheDocument();
  });

  it('shows the server error message inside a role="alert" element', async () => {
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid email or password',
    });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'WrongPass1!');
    await userEvent.click(getSubmitButton());

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/invalid email or password/i);
  });

  it('shows a fallback error message when error field is absent', async () => {
    mockLogin.mockResolvedValueOnce({ success: false });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());

    expect(
      await screen.findByText(/login failed. please try again/i)
    ).toBeInTheDocument();
  });

  it('clears the server error banner when re-submitting after a failure', async () => {
    // First call fails
    mockLogin.mockResolvedValueOnce({
      success: false,
      error: 'Invalid email or password',
    });

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'WrongPass1!');
    await userEvent.click(getSubmitButton());
    await screen.findByRole('alert');

    // Second call succeeds
    mockLogin.mockResolvedValueOnce({ success: true });
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('disables the submit button while the request is in flight', async () => {
    // Never resolves — keeps the button in loading state
    mockLogin.mockImplementation(() => new Promise(() => {}));

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());

    // Button text changes to "Signing in…" during submission — query by type
    await waitFor(() => {
      const btn = document.querySelector('button[type="submit"]');
      expect(btn).toBeDisabled();
    });
  });

  it('changes button text to "Signing in…" during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(() => {}));

    renderLoginForm();
    await userEvent.type(getEmailInput(), 'alice@example.com');
    await userEvent.type(getPasswordInput(), 'Password123!');
    await userEvent.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });
  });

  // ── Password visibility toggle (integration) ───────────────────────────────

  it('exposes password input with a show/hide toggle', () => {
    renderLoginForm();
    const passwordField = getPasswordInput();
    expect(passwordField).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(passwordField).toHaveAttribute('type', 'text');
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it('has an accessible form label', () => {
    renderLoginForm();
    expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument();
  });

  it('email input has correct autocomplete attribute', () => {
    renderLoginForm();
    expect(getEmailInput()).toHaveAttribute('autocomplete', 'email');
  });

  it('password input has autocomplete="current-password"', () => {
    renderLoginForm();
    expect(getPasswordInput()).toHaveAttribute('autocomplete', 'current-password');
  });
});