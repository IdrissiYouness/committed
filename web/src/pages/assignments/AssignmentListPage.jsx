import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  ClipboardList,
  BookOpen,
  CircleDashed,
} from 'lucide-react';

import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';
import AssignmentStatusBadge from '../../components/features/assignments/AssignmentStatusBadge';
import AssignmentCardSkeleton from '../../components/features/assignments/AssignmentCardSkeleton';

const STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },

  // Student-context statuses
  { value: 'pending', label: 'Pending' },
  { value: 'due_soon', label: 'Due soon' },
  { value: 'missing', label: 'Missing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'graded', label: 'Graded' },
  { value: 'late', label: 'Late' },

  // Teacher-context statuses
  { value: 'open', label: 'Open' },
  { value: 'awaiting_submissions', label: 'Awaiting submissions' },
  { value: 'needs_grading', label: 'Needs grading' },
];

function toList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function getDueState(dueDate) {
  if (!dueDate) return 'no_due_date';

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'no_due_date';

  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 2) return 'due_soon';
  return 'active';
}

function getLatestSubmission(submissions) {
  if (!Array.isArray(submissions) || submissions.length === 0) return null;
  return [...submissions].sort((a, b) => {
    const aTime = new Date(a?.submittedAt || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.submittedAt || b?.updatedAt || 0).getTime();
    return bTime - aTime;
  })[0];
}

function computeStudentStatus({ submissions, dueState }) {
  const latestSubmission = getLatestSubmission(submissions);
  const submissionStatus = (latestSubmission?.status || '').toLowerCase();

  if (submissionStatus === 'graded') return 'graded';
  if (submissionStatus === 'submitted') return 'submitted';
  if (submissionStatus === 'late') return 'late';

  if (dueState === 'overdue') return 'missing';
  if (dueState === 'due_soon') return 'due_soon';
  return 'pending';
}

function computeTeacherStatus({ submissions, dueState }) {
  const gradedCount = submissions.filter(
    (submission) => (submission?.status || '').toLowerCase() === 'graded'
  ).length;
  const submissionsCount = submissions.length;
  const ungradedCount = Math.max(submissionsCount - gradedCount, 0);

  let status = 'open';
  if (submissionsCount === 0) status = 'awaiting_submissions';
  else if (ungradedCount > 0) status = 'needs_grading';

  if (dueState === 'overdue' && status === 'awaiting_submissions') {
    status = 'open';
  }

  return { status, submissionsCount, gradedCount, ungradedCount };
}

function sortAssignments(items, sortBy) {
  const clone = [...items];

  const getDueTime = (item) =>
    item?.dueDate ? new Date(item.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const getTitle = (item) => (item?.title || '').toLowerCase();
  const getCourse = (item) => (item?.courseName || '').toLowerCase();
  const getPoints = (item) => Number(item?.maxPoints || 0);

  switch (sortBy) {
    case 'dueDesc':
      clone.sort((a, b) => getDueTime(b) - getDueTime(a));
      break;
    case 'titleAsc':
      clone.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
      break;
    case 'titleDesc':
      clone.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
      break;
    case 'pointsAsc':
      clone.sort((a, b) => getPoints(a) - getPoints(b));
      break;
    case 'pointsDesc':
      clone.sort((a, b) => getPoints(b) - getPoints(a));
      break;
    case 'courseAsc':
      clone.sort((a, b) => getCourse(a).localeCompare(getCourse(b)));
      break;
    case 'dueAsc':
    default:
      clone.sort((a, b) => getDueTime(a) - getDueTime(b));
      break;
  }

  return clone;
}

function SummaryTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold text-neutral-900 tabular-nums">{value}</p>
    </div>
  );
}

export default function AssignmentListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [assignments, setAssignments] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);

  const [query, setQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all'); // all | teacher | student
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueAsc');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentUserId = Number(user?.userId);
      const courses = await courseService.getAll();

      setCourseOptions(
        (courses || []).map((course) => ({
          value: String(course.courseId),
          label: `${course.courseCode} - ${course.courseName}`,
        }))
      );

      if (!courses || courses.length === 0) {
        setAssignments([]);
        setIsLoading(false);
        return;
      }

      const assignmentGroups = await Promise.all(
        courses.map(async (course) => {
          const isTeacherInCourse = Number(course?.teacher?.userId) === currentUserId;
          const assignmentPayload = await assignmentService
            .getAllByCourse(course.courseId)
            .catch(() => ({ content: [] }));
          const assignmentItems = toList(assignmentPayload);

          const mappedItems = await Promise.all(
            assignmentItems.map(async (assignment) => {
              const assignmentId = assignment.id || assignment.assignmentId;
              const dueState = getDueState(assignment?.dueDate);

              const submissionPayload = await submissionService
                .getAllByAssignment(assignmentId)
                .catch(() => ({ content: [] }));
              const submissions = toList(submissionPayload);

              if (isTeacherInCourse) {
                const teacherSummary = computeTeacherStatus({ submissions, dueState });

                return {
                  ...assignment,
                  id: assignmentId,
                  courseId: course.courseId,
                  courseName: course.courseName,
                  courseCode: course.courseCode,
                  roleContext: 'teacher',
                  status: teacherSummary.status,
                  dueState,
                  submissionsCount: teacherSummary.submissionsCount,
                  gradedCount: teacherSummary.gradedCount,
                  ungradedCount: teacherSummary.ungradedCount,
                };
              }

              const studentStatus = computeStudentStatus({ submissions, dueState });

              return {
                ...assignment,
                id: assignmentId,
                courseId: course.courseId,
                courseName: course.courseName,
                courseCode: course.courseCode,
                roleContext: 'student',
                status: studentStatus,
                dueState,
              };
            })
          );

          return mappedItems;
        })
      );

      setAssignments(sortAssignments(assignmentGroups.flat(), 'dueAsc'));
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filteredAndSortedAssignments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = assignments.filter((assignment) => {
      const matchesQuery =
        !normalizedQuery ||
        (assignment.title || '').toLowerCase().includes(normalizedQuery) ||
        (assignment.courseName || '').toLowerCase().includes(normalizedQuery) ||
        (assignment.courseCode || '').toLowerCase().includes(normalizedQuery);

      const matchesCourse =
        selectedCourse === 'all' || String(assignment.courseId) === selectedCourse;

      const matchesRole = selectedRole === 'all' || assignment.roleContext === selectedRole;
      const matchesStatus = selectedStatus === 'all' || assignment.status === selectedStatus;

      return matchesQuery && matchesCourse && matchesRole && matchesStatus;
    });

    return sortAssignments(filtered, sortBy);
  }, [assignments, query, selectedCourse, selectedRole, selectedStatus, sortBy]);

  const summary = useMemo(() => {
    const teacherAssignments = assignments.filter((assignment) => assignment.roleContext === 'teacher');
    const studentAssignments = assignments.filter((assignment) => assignment.roleContext === 'student');

    return {
      teacherCourses: new Set(teacherAssignments.map((assignment) => assignment.courseId)).size,
      awaitingSubmissions: teacherAssignments.filter(
        (assignment) => assignment.status === 'awaiting_submissions'
      ).length,
      ungradedSubmissions: teacherAssignments.reduce(
        (sum, assignment) => sum + Number(assignment.ungradedCount || 0),
        0
      ),

      studentCourses: new Set(studentAssignments.map((assignment) => assignment.courseId)).size,
      pendingStudentAssignments: studentAssignments.filter((assignment) =>
        ['pending', 'due_soon', 'missing', 'late'].includes(assignment.status)
      ).length,
      gradedStudentAssignments: studentAssignments.filter(
        (assignment) => assignment.status === 'graded'
      ).length,
    };
  }, [assignments]);

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-neutral-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Assignments
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Role-context list with teacher summaries and student progress statuses.
          </p>
        </div>
      </div>

      {/* Role-context Summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SummaryTile icon={BookOpen} label="Courses Teaching" value={summary.teacherCourses} />
        <SummaryTile
          icon={CircleDashed}
          label="Awaiting Submissions"
          value={summary.awaitingSubmissions}
        />
        <SummaryTile
          icon={ClipboardList}
          label="Ungraded Submissions"
          value={summary.ungradedSubmissions}
        />

        <SummaryTile
          icon={BookOpen}
          label="Courses Enrolled"
          value={summary.studentCourses}
        />
        <SummaryTile
          icon={Clock}
          label="Pending Assignments"
          value={summary.pendingStudentAssignments}
        />
        <SummaryTile
          icon={CheckCircle2}
          label="Graded Assignments"
          value={summary.gradedStudentAssignments}
        />
      </section>

      {/* Filters / Sorting */}
      <section className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-900/5">
        <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-4">
          <SlidersHorizontal className="h-4 w-4" />
          Filters & Sorting
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <label className="relative xl:col-span-2">
            <Search className="h-4 w-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search assignment/course..."
              className="w-full rounded-md border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </label>

          <select
            value={selectedCourse}
            onChange={(event) => setSelectedCourse(event.target.value)}
            className="rounded-md border-neutral-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Courses</option>
            {courseOptions.map((course) => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className="rounded-md border-neutral-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Contexts</option>
            <option value="teacher">Teacher Context</option>
            <option value="student">Student Context</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="rounded-md border-neutral-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border-neutral-300 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="dueAsc">Due Date ↑</option>
              <option value="dueDesc">Due Date ↓</option>
              <option value="titleAsc">Title A-Z</option>
              <option value="titleDesc">Title Z-A</option>
              <option value="pointsAsc">Points ↑</option>
              <option value="pointsDesc">Points ↓</option>
              <option value="courseAsc">Course A-Z</option>
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Showing{' '}
          <span className="font-medium text-neutral-700">{filteredAndSortedAssignments.length}</span>{' '}
          of <span className="font-medium text-neutral-700">{assignments.length}</span> assignments.
        </p>
      </section>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={fetchAssignments}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {!error && (
        <div className="flex flex-col gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <AssignmentCardSkeleton key={index} />)
          ) : filteredAndSortedAssignments.length > 0 ? (
            filteredAndSortedAssignments.map((assignment) => {
              const isTeacherContext = assignment.roleContext === 'teacher';

              return (
                <div
                  key={assignment.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5 hover:shadow-md hover:ring-primary-500/20 transition-all"
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <p className="text-xs font-medium text-primary-600 truncate">
                        {assignment.courseName || assignment.courseCode || 'Course'}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          isTeacherContext
                            ? 'bg-secondary-50 text-secondary-700'
                            : 'bg-primary-50 text-primary-700'
                        }`}
                      >
                        {isTeacherContext ? 'Teacher' : 'Student'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-neutral-900 truncate">
                      <Link
                        to={`${ROUTES.ASSIGNMENTS}/${assignment.id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {assignment.title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-5 text-sm text-neutral-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        {assignment.dueDate
                          ? new Date(assignment.dueDate).toLocaleString([], {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : 'No due date'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-neutral-400" />
                        {assignment.maxPoints} pts
                      </span>

                      {isTeacherContext && (
                        <>
                          <span className="text-xs text-neutral-600">
                            Submissions: <strong>{assignment.submissionsCount || 0}</strong>
                          </span>
                          <span className="text-xs text-neutral-600">
                            Graded:{' '}
                            <strong>
                              {assignment.gradedCount || 0}/{assignment.submissionsCount || 0}
                            </strong>
                          </span>
                          <span className="text-xs text-neutral-600">
                            Ungraded: <strong>{assignment.ungradedCount || 0}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 mt-4 sm:mt-0 shrink-0">
                    <AssignmentStatusBadge
                      status={assignment.status}
                      roleContext={assignment.roleContext}
                      dueState={assignment.dueState}
                      submissionsCount={assignment.submissionsCount}
                      gradedCount={assignment.gradedCount}
                      ungradedCount={assignment.ungradedCount}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${assignment.id}`)}
                    >
                      {isTeacherContext ? 'Manage Assignment' : 'View / Submit'}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50">
              <FileText className="h-12 w-12 text-neutral-400 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900">No assignments found</h3>
              <p className="mt-1 text-sm text-neutral-500 max-w-sm text-center">
                Try adjusting filters or search terms.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}