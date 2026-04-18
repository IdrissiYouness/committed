import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  BookOpen,
  MessageSquare,
  Users,
  BarChart3,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  FileText,
  Plus,
  Megaphone,
  UserPlus,
  UserRound,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

import courseService from '../../services/courseService';
import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import announcementService from '../../services/announcementService';
import { useAuthStore } from '../../store/authStore';
import useBreadcrumbStore from '../../store/breadcrumbStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AssignmentStatusBadge from '../../components/features/assignments/AssignmentStatusBadge';

const toList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  return [];
};

const getId = (entity, preferredKey = 'id') =>
  entity?.[preferredKey] ?? entity?.id ?? entity?.assignmentId ?? entity?.announcementId ?? entity?.userId;

const getDueState = (dueDate) => {
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
};

const getLatestSubmission = (submissions) => {
  if (!Array.isArray(submissions) || submissions.length === 0) return null;
  return [...submissions].sort((a, b) => {
    const aTime = new Date(a?.submittedAt || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.submittedAt || b?.updatedAt || 0).getTime();
    return bTime - aTime;
  })[0];
};

const formatDate = (value, withTime = false) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'N/A';

  if (withTime) {
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return d.toLocaleDateString();
};

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  if (Number.isNaN(diffMs) || diffMs < 0) return '';

  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateString);
};

const announcementPreview = (content) => {
  if (!content) return '';
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .slice(0, 220);
};

function EmptyState({ icon: Icon, title, description, actions }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/70 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
        <Icon className="h-6 w-6 text-neutral-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">{description}</p>
      {actions?.length ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
        active
          ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800',
      ].join(' ')}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}

function StatTile({ label, value, icon: Icon, subtitle }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
    </div>
  );
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState('thread');

  const [course, setCourse] = useState(null);
  const setBreadcrumbLabel = useBreadcrumbStore(state => state.setLabel);

  useEffect(() => {
    if (course?.courseName) {
      setBreadcrumbLabel(id, course.courseName);
    }
  }, [course, id, setBreadcrumbLabel]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);

  const [submissionsByAssignment, setSubmissionsByAssignment] = useState({});
  const [commentCountsByAnnouncement, setCommentCountsByAnnouncement] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Single confirm-dialog state — stores config + the async action to run
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const openConfirm = (cfg) => setConfirmDialog(cfg);
  const closeConfirm = () => { if (!isConfirming) setConfirmDialog(null); };

  const handleConfirmAction = async () => {
    if (!confirmDialog?.action) return;
    setIsConfirming(true);
    try {
      await confirmDialog.action();
    } catch (err) {
      toast.error(confirmDialog.errorMessage || err?.message || 'Something went wrong.');
    } finally {
      setIsConfirming(false);
      setConfirmDialog(null);
    }
  };

  const currentUserId = Number(user?.userId);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';
  const isTeacher = Number(course?.teacher?.userId) === currentUserId;
  const canManageCourse = isAdmin || isTeacher;

  const fetchCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const courseData = await courseService.getById(id);
      setCourse(courseData);

      const teacherForThisCourse = Number(courseData?.teacher?.userId) === currentUserId;
      const canManageThisCourse = isAdmin || teacherForThisCourse;

      const [assignmentPayload, announcementPayload, studentsPayload, statsPayload] = await Promise.all([
        assignmentService.getAllByCourse(id).catch(() => ({ content: [] })),
        announcementService.getAll(id).catch(() => ({ content: [] })),
        canManageThisCourse ? courseService.getStudents(id).catch(() => []) : Promise.resolve([]),
        canManageThisCourse ? courseService.getStats(id).catch(() => null) : Promise.resolve(null),
      ]);

      const assignmentList = toList(assignmentPayload);
      const announcementList = toList(announcementPayload);

      setAssignments(assignmentList);
      setAnnouncements(announcementList);
      setStudents(toList(studentsPayload));
      setStats(statsPayload || null);

      if (announcementList.length > 0) {
        const commentCountPairs = await Promise.all(
          announcementList.map(async (announcement) => {
            const announcementId = getId(announcement, 'announcementId');
            if (!announcementId) return [announcementId, 0];

            const commentPayload = await announcementService
              .getComments(id, announcementId, { page: 0, size: 1 })
              .catch(() => null);

            const totalFromMeta = Number(
              commentPayload?.meta?.total ??
              commentPayload?.totalElements ??
              commentPayload?.total ??
              0
            );

            return [announcementId, Number.isFinite(totalFromMeta) ? totalFromMeta : 0];
          })
        );

        const commentCountMap = commentCountPairs.reduce((acc, [announcementId, count]) => {
          if (announcementId) acc[announcementId] = count;
          return acc;
        }, {});
        setCommentCountsByAnnouncement(commentCountMap);
      } else {
        setCommentCountsByAnnouncement({});
      }

      const assignmentIds = assignmentList.map((a) => getId(a, 'assignmentId')).filter(Boolean);
      if (assignmentIds.length > 0) {
        const submissionPairs = await Promise.all(
          assignmentIds.map(async (assignmentId) => {
            const submissions = await submissionService
              .getAllByAssignment(assignmentId)
              .then((payload) => toList(payload))
              .catch(() => []);
            return [assignmentId, submissions];
          })
        );

        const mapped = submissionPairs.reduce((acc, [assignmentId, submissions]) => {
          acc[assignmentId] = submissions;
          return acc;
        }, {});
        setSubmissionsByAssignment(mapped);
      } else {
        setSubmissionsByAssignment({});
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load course details. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUserId, isAdmin]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const assignmentMeta = useMemo(() => {
    return assignments.reduce((acc, assignment) => {
      const assignmentId = getId(assignment, 'assignmentId');
      const submissions = submissionsByAssignment[assignmentId] || [];
      const gradedCount = submissions.filter((s) => String(s?.status || '').toLowerCase() === 'graded').length;
      const ungradedCount = Math.max(submissions.length - gradedCount, 0);
      const dueState = getDueState(assignment?.dueDate);
      const latestSubmission = getLatestSubmission(submissions);

      let studentStatus = 'pending';
      const studentSubmissionStatus = String(latestSubmission?.status || '').toLowerCase();
      if (studentSubmissionStatus === 'graded') studentStatus = 'graded';
      else if (studentSubmissionStatus === 'submitted') studentStatus = 'submitted';
      else if (studentSubmissionStatus === 'late') studentStatus = 'late';
      else if (dueState === 'overdue') studentStatus = 'missing';
      else if (dueState === 'due_soon') studentStatus = 'due_soon';

      let teacherStatus = 'open';
      if (submissions.length === 0) teacherStatus = 'awaiting_submissions';
      else if (ungradedCount > 0) teacherStatus = 'open';
      else teacherStatus = 'active';

      acc[assignmentId] = {
        submissionsCount: submissions.length,
        gradedCount,
        ungradedCount,
        dueState,
        latestSubmission,
        studentStatus,
        teacherStatus,
      };
      return acc;
    }, {});
  }, [assignments, submissionsByAssignment]);

  const gradeOverview = useMemo(() => {
    const assignmentCount = assignments.length;
    const totalSubmissions = Object.values(assignmentMeta).reduce(
      (sum, meta) => sum + (meta?.submissionsCount || 0),
      0
    );
    const totalUngraded = Object.values(assignmentMeta).reduce(
      (sum, meta) => sum + (meta?.ungradedCount || 0),
      0
    );
    const totalGraded = Math.max(totalSubmissions - totalUngraded, 0);
    const completion = totalSubmissions > 0 ? Math.round((totalGraded / totalSubmissions) * 100) : 0;

    return {
      assignmentCount,
      totalSubmissions,
      totalUngraded,
      totalGraded,
      completion,
    };
  }, [assignments.length, assignmentMeta]);

  const handleDeleteCourse = () => openConfirm({
    title: 'Delete this course?',
    description: 'All assignments, submissions, announcements, and student data will be permanently removed. This cannot be undone.',
    confirmLabel: 'Delete',
    variant: 'danger',
    errorMessage: 'Failed to delete course.',
    action: async () => {
      await courseService.delete(id);
      toast.success('Course deleted successfully.');
      navigate(ROUTES.COURSES);
    },
  });

  const handleDeleteAnnouncement = (announcementId) => openConfirm({
    title: 'Delete announcement?',
    description: 'This announcement and all its replies will be permanently removed.',
    confirmLabel: 'Delete',
    variant: 'danger',
    errorMessage: 'Failed to delete announcement.',
    action: async () => {
      await announcementService.delete(id, announcementId);
      toast.success('Announcement deleted.');
      fetchCourseData();
    },
  });

  const handleDeleteAssignment = (assignmentId) => openConfirm({
    title: 'Delete assignment?',
    description: 'All submissions and grades for this assignment will be permanently removed.',
    confirmLabel: 'Delete',
    variant: 'danger',
    errorMessage: 'Failed to delete assignment.',
    action: async () => {
      await assignmentService.delete(assignmentId);
      toast.success('Assignment deleted.');
      fetchCourseData();
    },
  });

  const handleUnenroll = () => openConfirm({
    title: 'Unenroll from course?',
    description: 'You will lose access to all course materials, assignments, and your submission history.',
    confirmLabel: 'Unenroll',
    variant: 'warning',
    errorMessage: 'Failed to unenroll.',
    action: async () => {
      await courseService.unenroll(id);
      toast.success('Successfully unenrolled from this course.');
      navigate(ROUTES.COURSES);
    },
  });

  if (isLoading) return <CourseDetailSkeleton />;

  if (error || !course) {
    return (
      <div className="mx-auto mt-8 flex w-full max-w-4xl flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate(ROUTES.COURSES)} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
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

  const tabs = [
    { key: 'thread', label: 'Thread', icon: MessageSquare },
    { key: 'assignments', label: 'Assignments', icon: BookOpen },
    { key: 'collaborators', label: 'Collaborators', icon: Users },
    { key: 'grades', label: 'Grades', icon: BarChart3 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          to={ROUTES.COURSES}
          className="inline-flex items-center self-start rounded text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>

        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="truncate text-3xl font-bold tracking-tight text-neutral-900">{course.courseName}</h1>
              {!course.isOpen && (
                <span className="inline-flex items-center rounded-md bg-warning-50 px-2 py-1 text-xs font-medium text-warning-700 ring-1 ring-inset ring-warning-600/20">
                  Closed
                </span>
              )}
              <span
                className={[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  canManageCourse ? 'bg-secondary-50 text-secondary-700' : 'bg-primary-50 text-primary-700',
                ].join(' ')}
              >
                {canManageCourse ? 'Teacher Context' : 'Student Context'}
              </span>
            </div>

            <p className="text-base font-mono text-neutral-500">
              {course.courseCode}
              {course.subject ? ` • ${course.subject}` : ''}
              {course.section ? ` • Section ${course.section}` : ''}
            </p>

            <p className="text-sm text-neutral-500">
              Instructor: <span className="font-medium text-neutral-700">{course.teacher?.fullName || 'Unknown'}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManageCourse ? (
              <>
                <Button variant="ghost" onClick={() => navigate(`${ROUTES.COURSES}/${id}/edit`)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Course
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteCourse}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Course
                </Button>
              </>
            ) : (
              <Button
                variant="danger"
                onClick={handleUnenroll}
              >
                Unenroll
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-900/5 sm:p-5">
        <nav className="flex flex-wrap items-center gap-2" aria-label="Course sections">
          {tabs.map((tab) => (
            <TabButton
              key={tab.key}
              icon={tab.icon}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </nav>
      </section>

      {/* Thread Tab */}
      {activeTab === 'thread' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-neutral-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-neutral-900">Class Thread</h2>
            </div>
            {canManageCourse && (
              <Button
                onClick={() => navigate(`${ROUTES.COURSES}/${id}/announcements/new`)}
                size="sm"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Create Announcement
              </Button>
            )}
          </div>

          {announcements.length > 0 ? (
            <ul className="space-y-3">
              {announcements.map((announcement) => {
                const announcementId = getId(announcement, 'announcementId');
                const authorName =
                  announcement?.author?.fullName ||
                  announcement?.postedBy?.fullName ||
                  (announcement?.postedBy ? `User #${announcement.postedBy}` : 'Instructor');
                const commentCount = Number(
                  commentCountsByAnnouncement[announcementId] ?? announcement?.commentCount ?? 0
                );

                return (
                  <li
                    key={announcementId}
                    className="group rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{announcement.title}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {authorName} • {timeAgo(announcement.postedAt || announcement.createdAt)}
                        </p>
                      </div>

                      {canManageCourse && (
                        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`${ROUTES.COURSES}/${id}/announcements/${announcementId}/edit`)
                            }
                            className="rounded p-1 text-neutral-400 hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                            aria-label="Edit announcement"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncement(announcementId)}
                            className="rounded p-1 text-neutral-400 hover:text-error-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
                            aria-label="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-neutral-600">{announcementPreview(announcement.content)}</p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span>{commentCount} comments</span>
                        <span>{announcement?.attachments?.length || 0} attachments</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`${ROUTES.COURSES}/${id}/announcements/${announcementId}`)
                        }
                      >
                        Open thread
                        <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description={
                canManageCourse
                  ? 'Start the class thread by posting the first announcement.'
                  : 'Announcements from your instructor will appear here.'
              }
              actions={
                canManageCourse
                  ? [
                      <Button
                        key="create-announcement"
                        onClick={() => navigate(`${ROUTES.COURSES}/${id}/announcements/new`)}
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Create Announcement
                      </Button>,
                    ]
                  : null
              }
            />
          )}
        </section>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-neutral-400" />
              <h2 className="text-lg font-semibold text-neutral-900">Assignments</h2>
            </div>
            {canManageCourse && (
              <Button onClick={() => navigate(`${ROUTES.COURSES}/${id}/assignments/new`)} size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Create Assignment
              </Button>
            )}
          </div>

          {assignments.length > 0 ? (
            <ul className="space-y-3">
              {assignments.map((assignment) => {
                const assignmentId = getId(assignment, 'assignmentId');
                const meta = assignmentMeta[assignmentId] || {};

                return (
                  <li
                    key={assignmentId}
                    className="group rounded-xl border border-neutral-200 p-4 transition-colors hover:border-neutral-300"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{assignment.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Due: {formatDate(assignment.dueDate, true)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {assignment.maxPoints} pts
                          </span>
                          {canManageCourse && (
                            <>
                              <span>Submissions: {meta.submissionsCount || 0}</span>
                              <span>
                                Graded: {meta.gradedCount || 0}/{meta.submissionsCount || 0}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <AssignmentStatusBadge
                          status={canManageCourse ? meta.teacherStatus : meta.studentStatus}
                          roleContext={canManageCourse ? 'teacher' : 'student'}
                          dueState={meta.dueState}
                          submissionsCount={meta.submissionsCount}
                          gradedCount={meta.gradedCount}
                          ungradedCount={meta.ungradedCount}
                        />

                        {canManageCourse && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`${ROUTES.COURSES}/${id}/assignments/${assignmentId}/edit`)
                              }
                              className="rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:text-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 group-hover:opacity-100"
                              aria-label="Edit assignment"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssignment(assignmentId)}
                              className="rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:text-error-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-error-500 group-hover:opacity-100"
                              aria-label="Delete assignment"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${assignmentId}`)}
                        >
                          {canManageCourse ? 'Manage Assignment' : 'View / Submit'}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments posted"
              description={
                canManageCourse
                  ? 'Create your first assignment so students can start submitting work.'
                  : 'Assignments posted by your instructor will appear here.'
              }
              actions={
                canManageCourse
                  ? [
                      <Button
                        key="create-assignment"
                        onClick={() => navigate(`${ROUTES.COURSES}/${id}/assignments/new`)}
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Create Assignment
                      </Button>,
                    ]
                  : null
              }
            />
          )}
        </section>
      )}

      {/* Collaborators Tab */}
      {activeTab === 'collaborators' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5">
          <div className="mb-6 flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">Collaborators</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-xl border border-neutral-200 p-4 lg:col-span-1">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">{course.teacher?.fullName || 'Unknown'}</p>
                  <p className="truncate text-xs text-neutral-500">{course.teacher?.email || 'No email available'}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-200 p-4 lg:col-span-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Classmates ({canManageCourse ? students.length : 'hidden'})
              </h3>

              {canManageCourse ? (
                students.length > 0 ? (
                  <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {students.map((student) => (
                      <li key={student.userId} className="rounded-lg border border-neutral-200 p-3">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {student.fullName || `Student #${student.userId}`}
                        </p>
                        <p className="truncate text-xs text-neutral-500">{student.email || 'No email'}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500 italic">No collaborators enrolled yet.</p>
                )
              ) : (
                <p className="text-sm text-neutral-500">
                  Collaborator roster is visible to instructors in this version.
                </p>
              )}
            </section>
          </div>
        </section>
      )}

      {/* Confirm Dialog (shared for all destructive actions on this page) */}
      <ConfirmDialog
        open={confirmDialog !== null}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel ?? 'Confirm'}
        variant={confirmDialog?.variant ?? 'danger'}
        isLoading={isConfirming}
        onConfirm={handleConfirmAction}
        onClose={closeConfirm}
      />

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-900/5">
          <div className="mb-6 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-neutral-400" />
            <h2 className="text-lg font-semibold text-neutral-900">Grades</h2>
          </div>

          {canManageCourse ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  icon={BookOpen}
                  label="Assignments"
                  value={gradeOverview.assignmentCount}
                />
                <StatTile
                  icon={Users}
                  label="Submissions"
                  value={gradeOverview.totalSubmissions}
                />
                <StatTile
                  icon={CircleDashed}
                  label="Ungraded"
                  value={gradeOverview.totalUngraded}
                />
                <StatTile
                  icon={CheckCircle2}
                  label="Completion"
                  value={`${gradeOverview.completion}%`}
                  subtitle={`${gradeOverview.totalGraded}/${gradeOverview.totalSubmissions} graded`}
                />
              </div>

              <div className="mt-6 space-y-3">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const assignmentId = getId(assignment, 'assignmentId');
                    const meta = assignmentMeta[assignmentId] || {};
                    const completionPct =
                      (meta.submissionsCount || 0) > 0
                        ? Math.round(((meta.gradedCount || 0) / (meta.submissionsCount || 0)) * 100)
                        : 0;

                    return (
                      <div key={assignmentId} className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{assignment.title}</p>
                            <p className="mt-1 text-xs text-neutral-500">
                              Submissions: {meta.submissionsCount || 0} • Ungraded: {meta.ungradedCount || 0}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${assignmentId}`)}
                          >
                            Manage Assignment
                          </Button>
                        </div>
                        <div className="mt-3 h-2 w-full rounded-full bg-neutral-100">
                          <div
                            className="h-2 rounded-full bg-secondary-500"
                            style={{ width: `${completionPct}%` }}
                            aria-label={`Grading completion ${completionPct}%`}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No grading data yet"
                    description="Create assignments first to start receiving and grading submissions."
                    actions={[
                      <Button
                        key="create-assignment-grades"
                        onClick={() => navigate(`${ROUTES.COURSES}/${id}/assignments/new`)}
                      >
                        <Plus className="-ml-0.5 mr-1.5 h-5 w-5" />
                        Create Assignment
                      </Button>,
                    ]}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Your grade progress is tied to your assignment submissions in this course.
              </p>
              <ul className="space-y-3">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => {
                    const assignmentId = getId(assignment, 'assignmentId');
                    const meta = assignmentMeta[assignmentId] || {};
                    return (
                      <li key={assignmentId} className="rounded-xl border border-neutral-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-neutral-900">{assignment.title}</p>
                            <p className="mt-1 text-xs text-neutral-500">Due: {formatDate(assignment.dueDate, true)}</p>
                          </div>
                          <AssignmentStatusBadge
                            status={meta.studentStatus || 'pending'}
                            roleContext="student"
                            dueState={meta.dueState}
                          />
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="No grades available"
                    description="Grades will appear after assignments are posted and reviewed."
                  />
                )}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl animate-pulse flex-col gap-8 pb-12">
      <div className="h-4 w-28 rounded bg-neutral-200" />
      <div className="border-b border-neutral-200 pb-6">
        <div className="h-8 w-72 rounded bg-neutral-200" />
        <div className="mt-2 h-4 w-56 rounded bg-neutral-100" />
      </div>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-neutral-900/5">
        <div className="h-8 w-80 rounded bg-neutral-100" />
      </div>
      <div className="rounded-2xl bg-white p-6 ring-1 ring-neutral-900/5">
        <div className="mb-4 h-6 w-48 rounded bg-neutral-200" />
        <div className="space-y-3">
          <div className="h-16 w-full rounded bg-neutral-50" />
          <div className="h-16 w-full rounded bg-neutral-50" />
          <div className="h-16 w-full rounded bg-neutral-50" />
        </div>
      </div>
    </div>
  );
}