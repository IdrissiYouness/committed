import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

import EmptyState from '../EmptyState';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderEmptyState(props = {}) {
  return render(
    <MemoryRouter>
      <EmptyState {...props} />
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmptyState', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the title', () => {
    renderEmptyState({ title: 'No courses yet' });
    expect(screen.getByText('No courses yet')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    renderEmptyState({
      title: 'No courses yet',
      description: 'Enroll in a course to get started.',
    });
    expect(screen.getByText('Enroll in a course to get started.')).toBeInTheDocument();
  });

  it('does NOT render a description element when description is omitted', () => {
    renderEmptyState({ title: 'No courses yet' });
    // Only the title paragraph should be present — no second text node
    expect(screen.queryByText(/enroll/i)).not.toBeInTheDocument();
  });

  it('renders the wrapper with data-testid="empty-state"', () => {
    renderEmptyState({ title: 'Empty' });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  // ── Icon ───────────────────────────────────────────────────────────────────

  it('renders an icon bubble when icon prop is provided', () => {
    renderEmptyState({ title: 'No courses', icon: BookOpen });
    // The icon is wrapped in an aria-hidden div; the SVG will be in the DOM
    const wrapper = screen.getByTestId('empty-state');
    const svgs = wrapper.querySelectorAll('svg');
    // At least 1 SVG: the BookOpen icon
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render an icon bubble when icon prop is omitted', () => {
    renderEmptyState({ title: 'No courses' });
    const wrapper = screen.getByTestId('empty-state');
    // The icon bubble div has a specific class; check no svg from icon present
    const svgs = wrapper.querySelectorAll('svg');
    // ArrowRight is only rendered with action, so no SVGs at all here
    expect(svgs.length).toBe(0);
  });

  // ── Link action ────────────────────────────────────────────────────────────

  it('renders a Link when actionLabel and actionTo are provided', () => {
    renderEmptyState({
      title: 'No courses',
      actionLabel: 'Browse courses',
      actionTo: '/courses',
    });
    const link = screen.getByRole('link', { name: /browse courses/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/courses');
  });

  it('does NOT render a link when only actionLabel is provided (no actionTo or actionOnClick)', () => {
    renderEmptyState({ title: 'No courses', actionLabel: 'Browse courses' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ── Button action ──────────────────────────────────────────────────────────

  it('renders a button when actionLabel and actionOnClick are provided', () => {
    const handleClick = vi.fn();
    renderEmptyState({
      title: 'No courses',
      actionLabel: 'Refresh',
      actionOnClick: handleClick,
    });
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('calls actionOnClick when the button is clicked', () => {
    const handleClick = vi.fn();
    renderEmptyState({
      title: 'No courses',
      actionLabel: 'Refresh',
      actionOnClick: handleClick,
    });
    fireEvent.click(screen.getByRole('button', { name: /refresh/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('prefers Link over button when both actionTo and actionOnClick are provided', () => {
    const handleClick = vi.fn();
    renderEmptyState({
      title: 'No courses',
      actionLabel: 'Go',
      actionTo: '/courses',
      actionOnClick: handleClick,
    });
    expect(screen.getByRole('link', { name: /go/i })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ── No action ──────────────────────────────────────────────────────────────

  it('renders no interactive element when no action props are given', () => {
    renderEmptyState({ title: 'No courses', description: 'Nothing here.' });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // ── Custom className ───────────────────────────────────────────────────────

  it('applies a custom className to the wrapper', () => {
    renderEmptyState({ title: 'Empty', className: 'my-custom-class' });
    expect(screen.getByTestId('empty-state').className).toMatch(/my-custom-class/);
  });
});