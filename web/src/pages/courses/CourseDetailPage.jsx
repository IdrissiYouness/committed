import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Users, Calendar, AlertCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const fetchCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch course details and assignments in parallel
      const [courseData, assignmentsData] = await Promise.all([
        courseService.getById(id),
        assignmentService.getAllByCourse(id).catch(() => []), // gracefully handle missing assignments API
      ]);
      setCourse(courseData);
      setAssignments(assignmentsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load course details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleUnenroll = async () => {
    if (!window.confirm('Are you sure you want to unenroll from this course?')) return;
    
    setIsUnenrolling(true);
    try {
      await courseService.unenroll(id);
      toast.success('Successfully unenrolled from the course.');
      navigate(ROUTES.COURSES);
    } catch (err) {
      toast.error(err.message || 'Failed to unenroll.');
      setIsUnenrolling(false);
    }
  };

  if (isLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full mt-8">
        <Button variant="ghost" onClick={() => navigate(ROUTES.COURSES)} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Courses
        </Button>
        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error || 'Course not found.'}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={fetchCourseData}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isTeacher = course.teacher?.userId === Number(user?.userId);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          to={ROUTES.COURSES}
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                {course.courseName}
              </h1>
              {!course.isOpen && (
                <span className="inline-flex items-center rounded-md bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700 ring-1 ring-inset ring-warning-600/20">
                  Closed
                </span>
              )}
            </div>
            <p className="text-base text-neutral-500 font-mono">
              {course.courseCode} {course.subject ? `• ${course.subject}` : ''}
              {course.section ? ` • Section ${course.section}` : ''}
            </p>
          </div>
          <div className="flex gap-3">
            {isTeacher ? (
              <Button onClick={() => toast('Edit course coming soon!')}>
                Edit Course
              </Button>
            ) : (
              <Button 
                variant="danger" 
                onClick={handleUnenroll} 
                disabled={isUnenrolling}
                isLoading={isUnenrolling}
              >
                Unenroll
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Details & Assignments) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Description */}
          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neutral-400" />
              Course Description
            </h2>
            <div className="prose prose-neutral max-w-none text-neutral-600">
              {course.description ? (
                <p className="whitespace-pre-wrap">{course.description}</p>
              ) : (
                <p className="italic text-neutral-400">No description provided for this course.</p>
              )}
            </div>
          </section>

          {/* Assignments */}
          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-neutral-400" />
                Assignments
              </h2>
              {isTeacher && (
                <Button variant="secondary" size="sm" onClick={() => toast('Create assignment coming soon!')}>
                  Create Assignment
                </Button>
              )}
            </div>

            {assignments.length > 0 ? (
              <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                {assignments.map((assignment) => (
                  <div key={assignment.assignmentId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50 -mx-6 px-6 transition-colors">
                    <div>
                      <h3 className="text-sm font-medium text-neutral-900">
                        <Link to={`${ROUTES.ASSIGNMENTS}/${assignment.assignmentId}`} className="hover:text-primary-600 transition-colors">
                          {assignment.title}
                        </Link>
                      </h3>
                      <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {assignment.maxPoints} pts
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${assignment.assignmentId}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="mx-auto h-8 w-8 text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">No assignments posted yet.</p>
              </div>
            )}
          </section>

        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Instructor Info */}
          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Users className="h-4 w-4 text-neutral-400" />
              Instructor
            </h2>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                {course.teacher?.fullName?.charAt(0).toUpperCase() || 'I'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {course.teacher?.fullName || 'Unknown Instructor'}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {course.teacher?.email || 'No email available'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12 animate-pulse">
      <div className="h-4 w-24 bg-neutral-200 rounded mb-4"></div>
      <div className="border-b border-neutral-200 pb-6 flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-neutral-200 rounded"></div>
          <div className="h-4 w-48 bg-neutral-100 rounded"></div>
        </div>
        <div className="h-10 w-28 bg-neutral-200 rounded"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
            <div className="h-6 w-40 bg-neutral-200 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-100 rounded"></div>
              <div className="h-4 w-full bg-neutral-100 rounded"></div>
              <div className="h-4 w-3/4 bg-neutral-100 rounded"></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
            <div className="h-6 w-32 bg-neutral-200 rounded mb-6"></div>
            <div className="space-y-4">
              <div className="h-16 w-full bg-neutral-50 rounded"></div>
              <div className="h-16 w-full bg-neutral-50 rounded"></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
            <div className="h-5 w-24 bg-neutral-200 rounded mb-4"></div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-neutral-200"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-neutral-200 rounded"></div>
                <div className="h-3 w-1/2 bg-neutral-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}