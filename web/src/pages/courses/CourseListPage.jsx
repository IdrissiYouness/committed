import { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen } from 'lucide-react';

import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';

import CourseCard from '../../components/features/courses/CourseCard';
import CourseCardSkeleton from '../../components/features/courses/CourseCardSkeleton';
import EnrollmentModal from '../../components/features/courses/EnrollmentModal';
import Button from '../../components/common/Button';

export default function CourseListPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getAll();
      setCourses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Courses
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Browse and manage your active and past courses.
          </p>
        </div>
        {!isAdmin && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Button onClick={() => setIsEnrollModalOpen(true)}>
              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
              Enroll in Course
            </Button>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error loading courses</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchCourses}
                  className="rounded-md bg-error-50 px-3 py-2 text-sm font-medium text-error-800 hover:bg-error-100 focus:outline-none focus:ring-2 focus:ring-error-600 focus:ring-offset-2 focus:ring-offset-error-50 ring-1 ring-error-600/20"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
          ) : courses.length > 0 ? (
            courses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50">
              <BookOpen className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900">No courses found</h3>
              <p className="mt-1 text-sm text-neutral-500 max-w-sm text-center">
                You are not currently enrolled in or teaching any courses.
              </p>
              {!isAdmin && (
                <div className="mt-6">
                  <Button onClick={() => setIsEnrollModalOpen(true)}>
                    <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                    Enroll Now
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
}