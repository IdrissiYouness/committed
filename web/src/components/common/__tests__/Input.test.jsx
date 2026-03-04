import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import Input from '../Input';

describe('Input', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders with the correct default type (text)', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('renders label when label prop is provided', () => {
    render(<Input label="Email address" />);
    expect(screen.getByText('Email address')).toBeInTheDocument();
  });

  it('does NOT render a label element when label prop is omitted', () => {
    render(<Input />);
    expect(screen.queryByRole('label')).toBeNull();
  });

  it('associates label with input via htmlFor/id', () => {
    render(<Input label="Email address" />);
    const label = screen.getByText('Email address');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders required asterisk when required=true', () => {
    render(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('does NOT render required asterisk when required is not set', () => {
    render(<Input label="Email" />);
    expect(screen.queryByText('*')).toBeNull();
  });

  // ── Value & onChange ──────────────────────────────────────────────────────

  it('reflects value changes via onChange', () => {
    render(<Input label="Name" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(input.value).toBe('Alice');
  });

  it('calls onChange handler when user types', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  // ── Error state ───────────────────────────────────────────────────────────

  it('renders error message when error prop is provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('does NOT render error message when error prop is absent', () => {
    render(<Input />);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders error message inside a role="alert" element', () => {
    render(<Input error="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
  });

  it('sets aria-invalid="true" on the input when error is provided', () => {
    render(<Input error="Required" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does NOT set aria-invalid when there is no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });

  it('applies error border colour class when error is present', () => {
    render(<Input error="Bad input" />);
    expect(screen.getByRole('textbox').className).toMatch(/border-error/);
  });

  it('applies primary focus ring class when there is no error', () => {
    render(<Input />);
    expect(screen.getByRole('textbox').className).toMatch(/focus:ring-primary-500/);
  });

  // ── Helper text ───────────────────────────────────────────────────────────

  it('renders helperText when provided and no error is set', () => {
    render(<Input helperText="We will never share your email" />);
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });

  it('does NOT render helperText when an error is also set', () => {
    render(<Input error="Required" helperText="Some hint" />);
    expect(screen.queryByText('Some hint')).toBeNull();
  });

  // ── Disabled state ────────────────────────────────────────────────────────

  it('disables the input when disabled=true', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies disabled cursor class when disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox').className).toMatch(/disabled:cursor-not-allowed/);
  });

  // ── Password visibility toggle ────────────────────────────────────────────

  it('renders a password input when type="password"', () => {
    render(<Input type="password" label="Password" />);
    // password inputs don't have role="textbox" — query by label instead
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('renders the visibility toggle button for password fields', () => {
    render(<Input type="password" label="Password" />);
    expect(
      screen.getByRole('button', { name: /show password/i })
    ).toBeInTheDocument();
  });

  it('does NOT render the visibility toggle for non-password fields', () => {
    render(<Input type="text" label="Email" />);
    expect(screen.queryByRole('button', { name: /show password/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /hide password/i })).toBeNull();
  });

  it('toggles input type from password to text when eye button is clicked', () => {
    render(<Input type="password" label="Password" />);
    const input = screen.getByLabelText('Password');
    const toggleBtn = screen.getByRole('button', { name: /show password/i });

    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('toggles input type back to password on second click', () => {
    render(<Input type="password" label="Password" />);
    const input = screen.getByLabelText('Password');
    const toggleBtn = screen.getByRole('button', { name: /show password/i });

    fireEvent.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');

    // After toggling back the aria-label changes to "Hide password"
    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    fireEvent.click(hideBtn);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('updates the toggle button aria-label to "Hide password" after revealing', () => {
    render(<Input type="password" label="Password" />);
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleBtn);
    expect(
      screen.getByRole('button', { name: /hide password/i })
    ).toBeInTheDocument();
  });

  it('does NOT submit the form when the visibility toggle is clicked (type="button")', () => {
    render(<Input type="password" label="Password" />);
    const toggleBtn = screen.getByRole('button', { name: /show password/i });
    expect(toggleBtn).toHaveAttribute('type', 'button');
  });

  // ── Placeholder ───────────────────────────────────────────────────────────

  it('forwards placeholder prop to the input', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'placeholder',
      'Enter your email'
    );
  });

  // ── Forwarded ref ─────────────────────────────────────────────────────────

  it('forwards ref to the underlying <input> element', () => {
    const ref = createRef();
    render(<Input ref={ref} label="Ref test" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('INPUT');
  });

  it('allows programmatic focus via forwarded ref', () => {
    const ref = createRef();
    render(<Input ref={ref} label="Focus test" />);
    ref.current?.focus();
    expect(document.activeElement).toBe(ref.current);
  });

  // ── Extra props ───────────────────────────────────────────────────────────

  it('forwards arbitrary props (data-testid) to the input', () => {
    render(<Input data-testid="my-input" />);
    expect(screen.getByTestId('my-input')).toBeInTheDocument();
  });

  it('forwards autoComplete prop to the input', () => {
    render(<Input autoComplete="email" label="Email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
  });

  // ── Custom className ──────────────────────────────────────────────────────

  it('merges custom className onto the wrapper div', () => {
    const { container } = render(<Input className="mt-6" />);
    // The wrapper is the outermost div
    expect(container.firstChild?.className).toMatch(/mt-6/);
  });
});