import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { ROUTES } from '../../../utils/constants';

/**
 * Renders a single course as a clickable card.
 */
export default function CourseCard({ course }) {
  const {
    courseId,
    courseName,
    courseCode,
    subject,
    teacher,
    isOpen,
  } = course;

  return (
    <Link
      to={`${ROUTES.COURSES}/${courseId}`}
      className="group relative flex flex-col items-start justify-between rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5 transition-all hover:shadow-md hover:ring-primary-500/20"
    >
      <div className="flex w-full items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
              {courseName}
            </h3>
            {!isOpen && (
              <span className="inline-flex items-center rounded-md bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-500/10">
                Closed
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 font-mono">
            {courseCode} {subject ? `• ${subject}` : ''}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-6 flex w-full items-center justify-between border-t border-neutral-100 pt-4 text-sm text-neutral-500">
        <div className="flex items-center gap-2 truncate">
          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{teacher?.fullName || 'No instructor'}</span>
        </div>
        <span className="font-medium text-primary-600 group-hover:text-primary-700 transition-colors ml-4 shrink-0">
          View Details →
        </span>
      </div>
    </Link>
  );
}