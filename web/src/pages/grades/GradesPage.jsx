import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Filter,
  Sparkles,
} from 'lucide-react';

import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import gradeService from '../../services/gradeService';
import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AssignmentStatusBadge from '../../components/features/assignments/AssignmentStatusBadge';

function toList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
}

function computeWorkspaceStatus(summary) {
  if (!summary) return 'awaiting_submissions';
  if (summary.totalSubmissions === 0) return 'awaiting_submissions';
  if (summary.ungradedCount > 0) return 'open';
  return 'active';
}

function SummaryTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
    </div>
  );
}

export default function GradesPage() {
  const user = useAuthStore((s) => s.user);
  const currentUserId = toNumber(user?.userId, -1);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [workspaceRows, setWorkspaceRows] = useState([]);
  const [studentRecentGrades, setStudentRecentGrades] = useState([]);

  const [isLikelyTeacher, setIsLikelyTeacher] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const courses = await courseService.getAll();
      const courseList = Array.isArray(courses) ? courses : [];

      // Determine teacher context from course ownership (admins can always grade)
      const hasTeachingCourse =
        isAdmin ||
        courseList.some((course) => toNumber(course?.teacher?.userId, -2) === currentUserId);

      setIsLikelyTeacher(hasTeachingCourse);

      if (hasTeachingCourse) {
        const scopedCourses = isAdmin
          ? courseList
          : courseList.filter((course) => toNumber(course?.teacher?.userId, -2) === currentUserId);

        const assignmentGroups = await Promise.all(
          scopedCourses.map(async (course) => {
            const assignmentPayload = await assignmentService
              .getAllByCourse(course.courseId)
              .catch(() => ({ content: [] }));
            const assignments = toList(assignmentPayload);

            const rows = await Promise.all(
              assignments.map(async (assignment) => {
                const assignmentId = assignment.id || assignment.assignmentId;
                const submissionsPayload = await submissionService
                  .getAllByAssignment(assignmentId)
                  .catch(() => ({ content: [] }));
                const submissions = toList(submissionsPayload);

                const totalSubmissions = submissions.length;
                const gradedCount = submissions.filter((s) => {
                  const status = String(s?.status || '').toLowerCase();
                  return status === 'graded';
                }).length;
                const ungradedCount = Math.max(totalSubmissions - gradedCount, 0);

                return {
                  assignmentId,
                  assignmentTitle: assignment.title || `Assignment #${assignmentId}`,
                  courseName: course.courseName || 'Course',
                  courseCode: course.courseCode || '',
                  dueDate: assignment.dueDate || null,
                  maxPoints: toNumber(assignment.maxPoints, 0),
                  totalSubmissions,
                  gradedCount,
                  ungradedCount,
                  workspaceStatus: computeWorkspaceStatus({
                    totalSubmissions,
                    gradedCount,
                    ungradedCount,
                  }),
                };
              })
            );

            return rows;
          })
        );

        setWorkspaceRows(assignmentGroups.flat());
      } else {
        const recentGradesPayload = await gradeService.getRecent().catch(() => []);
        const recentGrades = toList(recentGradesPayload);
        setStudentRecentGrades(recentGrades);
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load grades.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspaceRows
      .filter((row) => {
        const matchesQuery =
          !q ||
          row.assignmentTitle.toLowerCase().includes(q) ||
          row.courseName.toLowerCase().includes(q) ||
          row.courseCode.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all' || row.workspaceStatus === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        // Prioritize assignments with ungraded submissions
        if (a.ungradedCount !== b.ungradedCount) return b.ungradedCount - a.ungradedCount;
        const aDue = new Date(a.dueDate || 0).getTime();
        const bDue = new Date(b.dueDate || 0).getTime();
        return aDue - bDue;
      });
  }, [workspaceRows, query, statusFilter]);

  const teacherSummary = useMemo(() => {
    const totalAssignments = workspaceRows.length;
    const totalSubmissions = workspaceRows.reduce((sum, row) => sum + row.totalSubmissions, 0);
    const ungraded = workspaceRows.reduce((sum, row) => sum + row.ungradedCount, 0);
    const completed = workspaceRows.filter((row) => row.workspaceStatus === 'active').length;

    return { totalAssignments, totalSubmissions, ungraded, completed };
  }, [workspaceRows]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto w-full py-6 space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-neutral-200 rounded" />
        <div className="h-4 w-96 bg-neutral-100 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="h-24 rounded-xl bg-white ring-1 ring-neutral-200" />
          <div className="h-24 rounded-xl bg-white ring-1 ring-neutral-200" />
          <div className="h-24 rounded-xl bg-white ring-1 ring-neutral-200" />
          <div className="h-24 rounded-xl bg-white ring-1 ring-neutral-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto w-full py-6">
        <div className="rounded-xl border border-error-200 bg-error-50 p-4">
          <p className="text-sm font-medium text-error-700">{error}</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={fetchData}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLikelyTeacher) {
    return (
      <div className="max-w-5xl mx-auto w-full pb-12 space-y-6">
        <section className="border-b border-neutral-200 pb-4">
          <h1 className="text-2xl font-bold text-neutral-900">Grades</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Your recent grading results from instructors.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-900/5">
          <h2 className="text-sm font-semibold text-neutral-800 mb-4">Recent Grades</h2>
          {studentRecentGrades.length === 0 ? (
            <p className="text-sm text-neutral-500 italic">No grades available yet.</p>
          ) : (
            <ul className="space-y-3">
              {studentRecentGrades.map((grade) => (
                <li
                  key={grade.gradeId || `${grade.submissionId}-${grade.gradedAt || 'recent'}`}
                  className="rounded-xl border border-neutral-200 p-3"
                >
                  <p className="text-sm font-medium text-neutral-900">
                    Submission #{grade.submissionId}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    Score: {grade.pointsEarned} / {grade.maxPoints}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Graded: {formatDateTime(grade.gradedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
          <p className="text-sm text-primary-800 inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Grading workspace is available for course teachers and admins.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full pb-12 space-y-6">
      <section className="border-b border-neutral-200 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Grading Hub</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Open any assignment’s grading workspace directly from here.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryTile label="Assignments" value={teacherSummary.totalAssignments} icon={ClipboardCheck} />
        <SummaryTile label="Submissions" value={teacherSummary.totalSubmissions} icon={Clock3} />
        <SummaryTile label="Ungraded" value={teacherSummary.ungraded} icon={Filter} />
        <SummaryTile label="Completed" value={teacherSummary.completed} icon={CheckCircle2} />
      </section>

      <section className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-900/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assignment or course"
          />

          <label className="text-sm">
            <span className="mb-1 block text-neutral-600">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="block w-full rounded-lg border-neutral-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">All</option>
              <option value="open">Needs grading</option>
              <option value="active">Completed</option>
              <option value="awaiting_submissions">Awaiting submissions</option>
            </select>
          </label>

          <div className="flex items-end">
            <Link to={ROUTES.ASSIGNMENTS} className="w-full">
              <Button variant="ghost" className="w-full justify-center">
                Browse Assignments
              </Button>
            </Link>
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            No assignments match your current filters.
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredRows.map((row) => (
              <li
                key={row.assignmentId}
                className="rounded-xl border border-neutral-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">{row.assignmentTitle}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {row.courseCode ? `${row.courseCode} · ` : ''}
                    {row.courseName}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Due: {row.dueDate ? formatDateTime(row.dueDate) : 'No due date'} · Max: {row.maxPoints} pts
                  </p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {row.gradedCount}/{row.totalSubmissions} graded · {row.ungradedCount} ungraded
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <AssignmentStatusBadge
                    status={row.workspaceStatus}
                    roleContext="teacher"
                    submissionsCount={row.totalSubmissions}
                    gradedCount={row.gradedCount}
                    ungradedCount={row.ungradedCount}
                  />
                  <Link to={`${ROUTES.ASSIGNMENTS}/${row.assignmentId}/submissions`}>
                    <Button variant="secondary" size="sm">
                      Open Workspace
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}