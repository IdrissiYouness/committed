import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import CourseCard from '../CourseCard';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_COURSE = {
  courseId:        1,
  courseCode:      'CS101',
  courseName:      'Introduction to Computer Science',
  subject:         'Computer Science',
  section:         'A',
  teacherName:     'Dr. Jane Smith',
  enrollmentCount: null,
  isOpen:          true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderCourseCard(props = {}) {
  return render(
    <MemoryRouter>
      <ul>
        <CourseCard course={BASE_COURSE} {...props} />
      </ul>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CourseCard', () => {
  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders the course name', () => {
    renderCourseCard();
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
  });

  it('renders the course code', () => {
    renderCourseCard();
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });

  it('renders the subject when provided', () => {
    renderCourseCard();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('does NOT render a subject element when subject is null', () => {
    renderCourseCard({ course: { ...BASE_COURSE, subject: null } });
    expect(screen.queryByText('Computer Science')).not.toBeInTheDocument();
  });

  it('renders the teacher name for student role', () => {
    renderCourseCard({ role: 'student' });
    expect(screen.getByText('Dr. Jane Smith')).toBeInTheDocument();
  });

  it('does NOT render teacherName for professor role', () => {
    renderCourseCard({
      role: 'professor',
      course: { ...BASE_COURSE, enrollmentCount: 12 },
    });
    expect(screen.queryByText('Dr. Jane Smith')).not.toBeInTheDocument();
  });

  it('renders enrollment count for professor role', () => {
    renderCourseCard({
      role: 'professor',
      course: { ...BASE_COURSE, enrollmentCount: 15 },
    });
    expect(screen.getByText(/15\s*students/i)).toBeInTheDocument();
  });

  it('renders singular "student" when enrollmentCount is 1', () => {
    renderCourseCard({
      role: 'professor',
      course: { ...BASE_COURSE, enrollmentCount: 1 },
    });
    expect(screen.getByText(/1\s*student$/i)).toBeInTheDocument();
  });

  it('renders the section when provided', () => {
    renderCourseCard();
    expect(screen.getByText(/§A/)).toBeInTheDocument();
  });

  it('does NOT render section element when section is null', () => {
    renderCourseCard({ course: { ...BASE_COURSE, section: null } });
    expect(screen.queryByText(/§/)).not.toBeInTheDocument();
  });

  // ── Role badges ────────────────────────────────────────────────────────────

  it('renders "Student" role badge by default', () => {
    renderCourseCard();
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('renders "Student" role badge when role="student"', () => {
    renderCourseCard({ role: 'student' });
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('renders "Professor" role badge when role="professor"', () => {
    renderCourseCard({ role: 'professor' });
    expect(screen.getByText('Professor')).toBeInTheDocument();
  });

  it('does NOT render "Professor" badge for student role', () => {
    renderCourseCard({ role: 'student' });
    expect(screen.queryByText('Professor')).not.toBeInTheDocument();
  });

  it('does NOT render "Student" badge for professor role', () => {
    renderCourseCard({ role: 'professor' });
    expect(screen.queryByText('Student')).not.toBeInTheDocument();
  });

  // ── Closed course ──────────────────────────────────────────────────────────

  it('renders "Closed" badge when course.isOpen is false', () => {
    renderCourseCard({ course: { ...BASE_COURSE, isOpen: false } });
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('does NOT render "Closed" badge when course.isOpen is true', () => {
    renderCourseCard({ course: { ...BASE_COURSE, isOpen: true } });
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  // ── Link ───────────────────────────────────────────────────────────────────

  it('renders as a link element', () => {
    renderCourseCard();
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('links to the correct course URL', () => {
    renderCourseCard({ course: { ...BASE_COURSE, courseId: 42 } });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/courses/42');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('does NOT render course name when isLoading=true', () => {
    renderCourseCard({ isLoading: true });
    expect(screen.queryByText('Introduction to Computer Science')).not.toBeInTheDocument();
  });

  it('does NOT render a link when isLoading=true', () => {
    renderCourseCard({ isLoading: true });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders animated pulse elements when isLoading=true', () => {
    const { container } = renderCourseCard({ isLoading: true });
    const pulseEls = container.querySelectorAll('.animate-pulse');
    expect(pulseEls.length).toBeGreaterThan(0);
  });

  // ── Accessibility ──────────────────────────────────────────────────────────

  it('has an aria-label containing the course name and role', () => {
    renderCourseCard({ role: 'student' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'aria-label',
      'Introduction to Computer Science — Student'
    );
  });

  it('has an aria-label with Professor for professor role', () => {
    renderCourseCard({ role: 'professor' });
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'aria-label',
      'Introduction to Computer Science — Professor'
    );
  });
});