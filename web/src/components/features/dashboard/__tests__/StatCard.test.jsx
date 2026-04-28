import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookOpen } from 'lucide-react';

import StatCard from '../StatCard';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderStatCard(props = {}) {
  return render(
    <ul>
      <StatCard icon={BookOpen} label="Enrolled Courses" value={3} {...props} />
    </ul>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StatCard', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the label', () => {
    renderStatCard();
    expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();
  });

  it('renders the value', () => {
    renderStatCard({ value: 7 });
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders a string value', () => {
    renderStatCard({ value: '92%' });
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('renders "—" when value is null', () => {
    renderStatCard({ value: null });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders "—" when value is undefined', () => {
    renderStatCard({ value: undefined });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders 0 as a valid value (not "—")', () => {
    renderStatCard({ value: 0 });
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('renders as a <li> element', () => {
    renderStatCard();
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  // ── Icon ───────────────────────────────────────────────────────────────────

  it('renders the icon SVG when icon prop is provided', () => {
    renderStatCard();
    const li = screen.getByRole('listitem');
    const svg = li.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not crash when icon prop is omitted', () => {
    render(
      <ul>
        <StatCard label="Courses" value={3} />
      </ul>
    );
    expect(screen.getByText('Courses')).toBeInTheDocument();
  });

  // ── Color classes ──────────────────────────────────────────────────────────

  it('applies default colorClasses to the icon bubble', () => {
    renderStatCard();
    const li = screen.getByRole('listitem');
    // The icon bubble div contains the SVG; check it carries a primary class
    expect(li.innerHTML).toMatch(/bg-primary-50/);
  });

  it('applies custom colorClasses when provided', () => {
    renderStatCard({
      colorClasses: 'bg-secondary-50 text-secondary-600 border-secondary-100',
    });
    const li = screen.getByRole('listitem');
    expect(li.innerHTML).toMatch(/bg-secondary-50/);
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('does not render the value text when isLoading=true', () => {
    renderStatCard({ isLoading: true, value: 5 });
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('does not render the label text when isLoading=true', () => {
    renderStatCard({ isLoading: true });
    expect(screen.queryByText('Enrolled Courses')).not.toBeInTheDocument();
  });

  it('sets aria-hidden="true" on the skeleton listitem', () => {
    renderStatCard({ isLoading: true });
    const li = screen.getByRole('listitem', { hidden: true });
    expect(li).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders animated pulse elements when isLoading=true', () => {
    renderStatCard({ isLoading: true });
    const li = screen.getByRole('listitem', { hidden: true });
    const pulseEls = li.querySelectorAll('.animate-pulse');
    expect(pulseEls.length).toBeGreaterThan(0);
  });

  it('does NOT render skeleton when isLoading=false', () => {
    renderStatCard({ isLoading: false, value: 3 });
    const li = screen.getByRole('listitem');
    // Should not be aria-hidden
    expect(li).not.toHaveAttribute('aria-hidden', 'true');
  });

  // ── Custom className ───────────────────────────────────────────────────────

  it('applies a custom className to the listitem', () => {
    renderStatCard({ className: 'mt-4' });
    expect(screen.getByRole('listitem').className).toMatch(/mt-4/);
  });
});