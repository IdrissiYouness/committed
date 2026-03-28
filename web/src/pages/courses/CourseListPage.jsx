import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, BookOpen, GraduationCap, UserPlus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

import CourseCard from '../../components/features/courses/CourseCard';
import CourseCardSkeleton from '../../components/features/courses/CourseCardSkeleton';
import EnrollmentModal from '../../components/features/courses/EnrollmentModal';
import Button from '../../components/common/Button';

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-neutral-500">{description}</p> : null}
      </div>
    </div>
  );
}

function EmptyStateCard({ icon: Icon, title, description, actions }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/60 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
        <Icon className="h-6 w-6 text-neutral-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-neutral-500">{description}</p>
      {actions?.length ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export default function CourseListPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';
  const currentUserId = Number(user?.userId);

  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getAll();
      setCourses(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load courses. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const teachingCourses = useMemo(
    () =>
      courses.filter(
        (course) => Number(course?.teacher?.userId) === currentUserId
      ),
    [courses, currentUserId]
  );

  const enrolledCourses = useMemo(
    () =>
      courses.filter(
        (course) => Number(course?.teacher?.userId) !== currentUserId
      ),
    [courses, currentUserId]
  );

  const hasTeachingContext = teachingCourses.length > 0;
  const hasStudentContext = enrolledCourses.length > 0;

  const headerCopy = useMemo(() => {
    if (isAdmin) {
      return 'Create and oversee all courses across the platform.';
    }
    if (hasTeachingContext && hasStudentContext) {
      return `You’re teaching ${teachingCourses.length} course(s) and enrolled in ${enrolledCourses.length} course(s).`;
    }
    if (hasTeachingContext) {
      return `Manage your ${teachingCourses.length} teaching course(s).`;
    }
    if (hasStudentContext) {
      return `You’re enrolled in ${enrolledCourses.length} course(s).`;
    }
    return 'Get started by enrolling with a course code or creating your first course.';
  }, [
    isAdmin,
    hasTeachingContext,
    hasStudentContext,
    teachingCourses.length,
    enrolledCourses.length,
  ]);

  const primaryAction =
    isAdmin || hasTeachingContext ? 'create' : 'enroll';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      {/* Header */}
      <div className="border-b border-neutral-200 pb-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:text-3xl sm:tracking-tight">
            Courses
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{headerCopy}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
          {primaryAction === 'create' ? (
            <>
              <Button onClick={() => navigate(`${ROUTES.COURSES}/new`)}>
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Create Course
              </Button>
              {!isAdmin && (
                <Button variant="ghost" onClick={() => setIsEnrollModalOpen(true)}>
                  <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                  Enroll in Course
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={() => setIsEnrollModalOpen(true)}>
                <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Enroll in Course
              </Button>
              <Button variant="ghost" onClick={() => navigate(`${ROUTES.COURSES}/new`)}>
                <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                Create Course
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error loading courses</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={fetchCourses}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!error && (
        <>
          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <CourseCardSkeleton key={idx} />
              ))}
            </div>
          )}

          {/* Empty (all) */}
          {!isLoading && courses.length === 0 && (
            <div className="grid grid-cols-1 gap-6">
              {isAdmin ? (
                <EmptyStateCard
                  icon={BookOpen}
                  title="No courses yet"
                  description="There are no courses on the platform. Create the first course to get things started."
                  actions={[
                    <Button key="create" onClick={() => navigate(`${ROUTES.COURSES}/new`)}>
                      <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Create Course
                    </Button>,
                  ]}
                />
              ) : (
                <EmptyStateCard
                  icon={GraduationCap}
                  title="No courses enrolled"
                  description="You’re not in any courses yet. Enroll with a course code, or create a course if you’re teaching."
                  actions={[
                    <Button key="enroll" onClick={() => setIsEnrollModalOpen(true)}>
                      <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Enroll in Course
                    </Button>,
                    <Button
                      key="create"
                      variant="ghost"
                      onClick={() => navigate(`${ROUTES.COURSES}/new`)}
                    >
                      <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                      Create Course
                    </Button>,
                  ]}
                />
              )}
            </div>
          )}

          {/* Non-empty */}
          {!isLoading && courses.length > 0 && (
            <div className="flex flex-col gap-8">
              {isAdmin ? (
                <section className="space-y-4">
                  <SectionHeader
                    icon={BookOpen}
                    title="All Courses"
                    description={`${courses.length} course(s) found.`}
                  />
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <CourseCard key={course.courseId} course={course} />
                    ))}
                  </div>
                </section>
              ) : (
                <>
                  <section className="space-y-4">
                    <SectionHeader
                      icon={GraduationCap}
                      title="Teaching"
                      description="Courses where you are the instructor."
                    />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {teachingCourses.length > 0 ? (
                        teachingCourses.map((course) => (
                          <CourseCard key={course.courseId} course={course} />
                        ))
                      ) : (
                        <EmptyStateCard
                          icon={BookOpen}
                          title="You’re not teaching any courses yet"
                          description="Create your first course to start posting assignments and announcements."
                          actions={[
                            <Button
                              key="create-teaching"
                              onClick={() => navigate(`${ROUTES.COURSES}/new`)}
                            >
                              <Plus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                              Create Course
                            </Button>,
                          ]}
                        />
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <SectionHeader
                      icon={UserPlus}
                      title="Enrolled"
                      description="Courses where you participate as a student."
                    />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {enrolledCourses.length > 0 ? (
                        enrolledCourses.map((course) => (
                          <CourseCard key={course.courseId} course={course} />
                        ))
                      ) : (
                        <EmptyStateCard
                          icon={GraduationCap}
                          title="No enrolled courses yet"
                          description="Join a course with a course code to see assignments and updates here."
                          actions={[
                            <Button
                              key="enroll-student"
                              onClick={() => setIsEnrollModalOpen(true)}
                            >
                              <UserPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                              Enroll in Course
                            </Button>,
                          ]}
                        />
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}
        </>
      )}

      <EnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
}