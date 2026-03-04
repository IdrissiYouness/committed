import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  // ── Rendering ────────────────────────────────────────────────────────────

  it('renders with text content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders as a <button> element', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('defaults to type="button" to prevent unintended form submissions', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders with type="submit" when specified', () => {
    render(<Button type="submit">Submit form</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // ── Variants ─────────────────────────────────────────────────────────────

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-primary-500/);
  });

  it('applies secondary variant classes when variant="secondary"', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-secondary-500/);
  });

  it('applies ghost variant classes when variant="ghost"', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-transparent/);
  });

  it('applies danger variant classes when variant="danger"', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/bg-error/);
  });

  // ── Sizes ─────────────────────────────────────────────────────────────────

  it('applies medium size classes by default', () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/px-5/);
  });

  it('applies small size classes when size="sm"', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/px-3\.5/);
  });

  it('applies large size classes when size="lg"', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toMatch(/px-7/);
  });

  // ── Full width ────────────────────────────────────────────────────────────

  it('does NOT have w-full class by default', () => {
    render(<Button>Normal</Button>);
    expect(screen.getByRole('button').className).not.toMatch(/\bw-full\b/);
  });

  it('adds w-full class when fullWidth=true', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button').className).toMatch(/\bw-full\b/);
  });

  // ── Click handling ────────────────────────────────────────────────────────

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onClick only once per click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  // ── Disabled state ────────────────────────────────────────────────────────

  it('is disabled when disabled=true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does NOT call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  it('shows spinner SVG when isLoading=true', () => {
    render(<Button isLoading>Loading</Button>);
    // The spinner is an SVG with animate-spin class
    // svg.className is an SVGAnimatedString object, not a plain string,
    // so we use classList.contains instead of .toMatch()
    const btn = screen.getByRole('button');
    const svg = btn.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.classList.contains('animate-spin')).toBe(true);
  });

  it('is disabled when isLoading=true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy="true" when isLoading=true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('does NOT call onClick when isLoading=true', () => {
    const handleClick = vi.fn();
    render(
      <Button isLoading onClick={handleClick}>
        Loading
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does NOT show spinner when isLoading=false', () => {
    render(<Button isLoading={false}>Not loading</Button>);
    const btn = screen.getByRole('button');
    const svg = btn.querySelector('svg.animate-spin');
    expect(svg).toBeNull();
  });

  // ── Custom className ──────────────────────────────────────────────────────

  it('merges custom className with base classes', () => {
    render(<Button className="mt-4">Custom</Button>);
    expect(screen.getByRole('button').className).toMatch(/mt-4/);
  });

  // ── Forwarded ref ─────────────────────────────────────────────────────────

  it('forwards ref to the underlying <button> element', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref test</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe('BUTTON');
  });

  // ── Extra props ───────────────────────────────────────────────────────────

  it('forwards arbitrary props (e.g. data-testid) to the button', () => {
    render(<Button data-testid="my-btn">Extra props</Button>);
    expect(screen.getByTestId('my-btn')).toBeInTheDocument();
  });

  it('forwards aria-label to the button', () => {
    render(<Button aria-label="Close dialog">×</Button>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });
});