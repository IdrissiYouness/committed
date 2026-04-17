import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  UploadCloud,
  Github,
  AlertCircle,
  CheckCircle2,
  Award,
  Users,
  Edit2,
  Trash2,
  BarChart3,
  ClipboardCheck,
  MessageSquareText,
} from 'lucide-react';

import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import gradeService from '../../services/gradeService';
import courseService from '../../services/courseService';
import { ROUTES } from '../../utils/constants';
import { useAuthStore } from '../../store/authStore';
import useBreadcrumbStore from '../../store/breadcrumbStore';
import fileService from '../../services/fileService';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import AssignmentStatusBadge from '../../components/features/assignments/AssignmentStatusBadge';

const getSubmissionSchema = (requireGithubRepo) => z
  .object({
    githubRepoUrl: requireGithubRepo
      ? z.string().url('Please enter a valid URL').min(1, 'GitHub Repository URL is required')
      : z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    submissionText: z.string().max(5000, 'Submission notes are too long').optional().or(z.literal('')),
    file: z.any().optional(),
  })
  .refine(
    (data) => {
      const hasUrl = data.githubRepoUrl && data.githubRepoUrl.trim().length > 0;
      const hasText = data.submissionText && data.submissionText.trim().length > 0;
      const hasFile = data.file && data.file.length > 0;
      return hasUrl || hasText || hasFile;
    },
    {
      message: 'Add a GitHub URL, submission notes, or a file before submitting.',
      path: ['githubRepoUrl'],
    }
  );

const gradeSchema = z.object({
  pointsEarned: z.coerce
    .number({ invalid_type_error: 'Please enter a numeric score.' })
    .min(0, 'Score must be 0 or greater.'),
  feedback: z.string().max(5000, 'Feedback is too long').optional().or(z.literal('')),
});

function toList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function formatDate(dateValue) {
  if (!dateValue) return 'No due date';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'No due date';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateTime(dateValue) {
  if (!dateValue) return 'N/A';
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString();
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

function getStudentDisplayStatus({ dueState, submission, grade }) {
  const submissionStatus = String(submission?.status || '').toLowerCase();

  if (grade || submissionStatus === 'graded') return 'graded';
  if (submissionStatus === 'submitted') return 'submitted';
  if (submissionStatus === 'late') return 'late';
  if (dueState === 'overdue') return 'missing';
  if (dueState === 'due_soon') return 'due_soon';
  return 'pending';
}

function hasSubmissionGrade(submission) {
  if (!submission) return false;

  const pointsEarned = submission?.grade?.pointsEarned;
  const hasGradePoints = pointsEarned !== undefined && pointsEarned !== null;
  const hasGradeId = submission?.grade?.gradeId !== undefined && submission?.grade?.gradeId !== null;
  const isMarkedGraded = String(submission?.status || '').toLowerCase() === 'graded';

  return hasGradePoints || hasGradeId || isMarkedGraded;
}

function getTeacherSummary(submissions) {
  const total = submissions.length;
  const graded = submissions.filter((s) => hasSubmissionGrade(s)).length;
  const ungraded = Math.max(total - graded, 0);

  return {
    total,
    graded,
    ungraded,
    awaiting: total === 0 ? 1 : 0,
    completionPct: total > 0 ? Math.round((graded / total) * 100) : 0,
  };
}

function SummaryCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
      {subtitle ? <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p> : null}
    </div>
  );
}

export default function AssignmentDetailPage() {
  const { id, courseId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setBreadcrumbLabel = useBreadcrumbStore(state => state.setLabel);

  const currentUserId = Number(user?.userId);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [assignment, setAssignment] = useState(null);

  useEffect(() => {
    if (assignment?.title) {
      setBreadcrumbLabel(id, assignment.title);
    }
  }, [assignment, id, setBreadcrumbLabel]);

  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (course?.courseName && courseId) {
      setBreadcrumbLabel(courseId, course.courseName);
    }
  }, [course, courseId, setBreadcrumbLabel]);

  const [submissions, setSubmissions] = useState([]);
  const [studentSubmission, setStudentSubmission] = useState(null);
  const [grade, setGrade] = useState(null);

  const [isCourseTeacher, setIsCourseTeacher] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);
  const [error, setError] = useState(null);

  const [activeSubmissionId, setActiveSubmissionId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: async (data, context, options) => {
      return zodResolver(getSubmissionSchema(assignment?.requireGithubRepo))(data, context, options);
    },
    defaultValues: { githubRepoUrl: '', submissionText: '' },
  });

  const {
    register: registerGrade,
    handleSubmit: handleGradeFormSubmit,
    reset: resetGradeForm,
    formState: { errors: gradeErrors },
  } = useForm({
    resolver: zodResolver(gradeSchema),
    defaultValues: { pointsEarned: '', feedback: '' },
  });

  const canManageAssignment = useMemo(
    () => isAdmin || isCourseTeacher,
    [isAdmin, isCourseTeacher]
  );

  const dueState = useMemo(() => getDueState(assignment?.dueDate), [assignment?.dueDate]);
  const teacherSummary = useMemo(() => getTeacherSummary(submissions), [submissions]);

  const teacherStatus = useMemo(() => {
    if (teacherSummary.total === 0) return 'awaiting_submissions';
    if (teacherSummary.ungraded > 0) return 'open';
    return 'active';
  }, [teacherSummary]);

  const studentStatus = useMemo(
    () => getStudentDisplayStatus({ dueState, submission: studentSubmission, grade }),
    [dueState, studentSubmission, grade]
  );

  const activeSubmission = useMemo(() => {
    if (!activeSubmissionId) return null;
    return submissions.find((submission) => submission.submissionId === activeSubmissionId) || null;
  }, [submissions, activeSubmissionId]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const assignmentData = await assignmentService.getById(id);
      setAssignment(assignmentData);

      const courseData = await courseService.getById(assignmentData.courseId).catch(() => null);
      setCourse(courseData);

      const teacherId = Number(courseData?.teacher?.userId);
      const createdBy = Number(assignmentData?.createdBy);
      const teacherForThisCourse =
        Number.isFinite(currentUserId) && (teacherId === currentUserId || createdBy === currentUserId);

      setIsCourseTeacher(teacherForThisCourse);

      const fetchedSubmissions = await submissionService
        .getAllByAssignment(id)
        .then((payload) => toList(payload))
        .catch((requestError) => {
          if (requestError?.status === 403) return [];
          throw requestError;
        });

      if (isAdmin || teacherForThisCourse) {
        const submissionsWithGrades = await Promise.all(
          fetchedSubmissions.map(async (submission) => {
            if (!submission?.submissionId || submission?.grade) return submission;

            const submissionGrade = await gradeService
              .getBySubmission(submission.submissionId)
              .catch((gradeError) => {
                if (gradeError?.status === 404 || gradeError?.status === 403) return null;
                throw gradeError;
              });

            if (!submissionGrade) return submission;
            return { ...submission, grade: submissionGrade };
          })
        );

        setSubmissions(submissionsWithGrades);
        setStudentSubmission(null);
        setGrade(null);
      } else {
        const latestOwnSubmission = getLatestSubmission(fetchedSubmissions);
        setStudentSubmission(latestOwnSubmission || null);
        setSubmissions([]);

        if (latestOwnSubmission?.submissionId) {
          const gradePayload = await gradeService
            .getBySubmission(latestOwnSubmission.submissionId)
            .catch(() => null);
          setGrade(gradePayload || null);
        } else {
          setGrade(null);
        }

        reset({
          githubRepoUrl: latestOwnSubmission?.githubRepoUrl || '',
          submissionText: latestOwnSubmission?.submissionText || '',
        });
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load assignment details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUserId, isAdmin, reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!activeSubmissionId) return;
    const stillExists = submissions.some((submission) => submission.submissionId === activeSubmissionId);
    if (!stillExists) {
      setActiveSubmissionId(null);
      resetGradeForm({ pointsEarned: '', feedback: '' });
    }
  }, [submissions, activeSubmissionId, resetGradeForm]);

  const handleDeleteAssignment = async () => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;

    setIsDeletingAssignment(true);
    try {
      await assignmentService.delete(id);
      toast.success('Assignment deleted successfully.');
      navigate(ROUTES.ASSIGNMENTS);
    } catch (requestError) {
      toast.error(requestError?.message || 'Failed to delete assignment.');
      setIsDeletingAssignment(false);
    }
  };

  const handleDownloadAssignmentAttachment = async (file, index = 0) => {
    const attachmentId = file?.attachmentId || file?.id;
    if (!attachmentId) {
      toast.error('Attachment ID is missing.');
      return;
    }

    try {
      await fileService.download(
        `/api/assignments/${id}/attachments/${attachmentId}`,
        { fileName: file?.fileName || `assignment-attachment-${index + 1}` }
      );
    } catch (requestError) {
      toast.error(requestError?.message || 'Failed to download assignment attachment.');
    }
  };

  const handleDownloadSubmissionAttachment = async (submissionId, file, index = 0) => {
    const attachmentId = file?.attachmentId || file?.id;
    if (!attachmentId) {
      toast.error('Attachment ID is missing.');
      return;
    }

    try {
      await fileService.download(
        `/api/submissions/${submissionId}/attachments/${attachmentId}`,
        { fileName: file?.fileName || `submission-attachment-${index + 1}` }
      );
    } catch (requestError) {
      toast.error(requestError?.message || 'Failed to download submission attachment.');
    }
  };

  const onSubmit = async (data) => {
    if (isLateSubmissionBlocked) {
      toast.error(lateSubmissionBlockedMessage);
      return;
    }

    if (assignment?.requireGithubRepo && !data.githubRepoUrl?.trim()) {
      toast.error('This assignment requires a GitHub repository URL.');
      return;
    }

    setIsSavingSubmission(true);
    try {
      const cleanedGithubUrl = data.githubRepoUrl?.trim() || '';
      const cleanedSubmissionText = data.submissionText?.trim() || '';
      const hasFile = data.file && data.file.length > 0;

      const formData = new FormData();
      if (cleanedGithubUrl) formData.append('githubRepoUrl', cleanedGithubUrl);
      if (cleanedSubmissionText) formData.append('submissionText', cleanedSubmissionText);
      if (hasFile) {
        formData.append('file', data.file[0]);
        formData.append('files', data.file[0]);
      }

      const payload = formData;

      if (isEditingSubmission && studentSubmission?.submissionId) {
        try {
          await submissionService.update(studentSubmission.submissionId, payload);
          toast.success('Submission updated successfully.');
        } catch (updateError) {
          if (updateError?.status === 404 || updateError?.status === 405) {
            await submissionService.create(id, payload);
            toast.success('Submission resubmitted successfully.');
          } else {
            throw updateError;
          }
        }
      } else {
        await submissionService.create(id, payload);
        toast.success('Assignment submitted successfully.');
      }

      setIsEditingSubmission(false);
      reset({ githubRepoUrl: '', submissionText: '' });
      await fetchData();
    } catch (requestError) {
      if (requestError?.status === 409) {
        toast.error('A submission already exists. Open your current submission and resubmit.');
      } else {
        toast.error(requestError?.message || 'Failed to submit assignment.');
      }
    } finally {
      setIsSavingSubmission(false);
    }
  };

  const openGradingPanel = (submission) => {
    setActiveSubmissionId(submission?.submissionId || null);
    resetGradeForm({
      pointsEarned: submission?.grade?.pointsEarned ?? '',
      feedback: submission?.grade?.feedback || '',
    });
  };

  const closeGradingPanel = () => {
    setActiveSubmissionId(null);
    resetGradeForm({ pointsEarned: '', feedback: '' });
  };

  const handleSaveGrade = async (data) => {
    if (!activeSubmission?.submissionId) return;

    const points = Number(data.pointsEarned);
    const assignmentMax = Number(assignment?.maxPoints || 0);

    if (Number.isNaN(points)) {
      toast.error('Please enter a valid numeric score.');
      return;
    }

    if (points < 0) {
      toast.error('Score cannot be negative.');
      return;
    }

    if (assignmentMax > 0 && points > assignmentMax) {
      toast.error(`Score cannot exceed ${assignmentMax} points.`);
      return;
    }

    setIsSavingGrade(true);
    try {
      const payload = {
        pointsEarned: points,
        feedback: data.feedback?.trim() || null,
      };

      try {
        await gradeService.create(activeSubmission.submissionId, payload);
      } catch (gradeError) {
        if (gradeError?.status === 409) {
          await gradeService.update(activeSubmission.submissionId, payload);
        } else {
          throw gradeError;
        }
      }

      toast.success('Grade saved successfully.');
      await fetchData();

      // Keep panel open and in-sync after refresh
      setActiveSubmissionId(activeSubmission.submissionId);
      resetGradeForm({
        pointsEarned: points,
        feedback: data.feedback?.trim() || '',
      });
    } catch (requestError) {
      toast.error(requestError?.message || 'Failed to save grade.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  if (isLoading) {
    return <AssignmentDetailSkeleton />;
  }

  if (error || !assignment) {
    return (
      <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full mt-8">
        <Button variant="ghost" onClick={() => navigate(ROUTES.ASSIGNMENTS)} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
        </Button>

        <div className="rounded-md bg-error-50 p-4 ring-1 ring-inset ring-error-600/20">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-error-400" aria-hidden="true" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-error-800">Error</h3>
              <div className="mt-2 text-sm text-error-700">
                <p>{error || 'Assignment not found.'}</p>
              </div>
              <div className="mt-4">
                <Button variant="secondary" onClick={fetchData}>
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isStudentGraded = !!grade || String(studentSubmission?.status || '').toLowerCase() === 'graded';
  const dueTimestamp = assignment?.dueDate ? new Date(assignment.dueDate).getTime() : null;
  const isPastDue = Number.isFinite(dueTimestamp) && Date.now() > dueTimestamp;
  const isLateSubmissionBlocked = isPastDue && !assignment?.allowLateSubmission;
  const lateSubmissionBlockedMessage =
    'The due date has passed and late submissions are disabled for this assignment.';
  const canResubmit = !isStudentGraded && !!studentSubmission && !isLateSubmissionBlocked;
  const latePolicyText = assignment?.allowLateSubmission
    ? 'Late submission is allowed.'
    : 'Late submission is not allowed.';

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12">
      <div className="flex flex-col gap-4">
        <Link
          to={ROUTES.ASSIGNMENTS}
          className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-700 transition-colors self-start focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assignments
        </Link>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-primary-600 truncate">
              {course?.courseName || assignment?.courseName || 'Course'}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{assignment.title}</h1>
              <AssignmentStatusBadge
                status={canManageAssignment ? teacherStatus : studentStatus}
                roleContext={canManageAssignment ? 'teacher' : 'student'}
                dueState={dueState}
                submissionsCount={teacherSummary.total}
                gradedCount={teacherSummary.graded}
                ungradedCount={teacherSummary.ungraded}
              />
            </div>

            <div className="flex items-center gap-6 text-sm text-neutral-500 pt-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                Due: {formatDate(assignment.dueDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {assignment.maxPoints} Points
              </span>
            </div>
          </div>

          {canManageAssignment && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    `${ROUTES.ASSIGNMENTS}/${assignment.id || assignment.assignmentId}/submissions`
                  )
                }
              >
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Open Grading Workspace
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(
                    `/courses/${assignment.courseId}/assignments/${assignment.id || assignment.assignmentId}/edit`
                  )
                }
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Assignment
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAssignment}
                isLoading={isDeletingAssignment}
                disabled={isDeletingAssignment}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-neutral-400" />
              Instructions
            </h2>

            <div className="prose prose-neutral max-w-none text-neutral-600">
              {assignment.description ? (
                <p className="whitespace-pre-wrap">{assignment.description}</p>
              ) : (
                <p className="italic text-neutral-400">No additional instructions provided.</p>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-sm text-neutral-700">
                <strong>Submission requirements:</strong>{' '}
                {assignment.requireGithubRepo
                  ? 'GitHub repository URL is required.'
                  : 'GitHub repository URL is optional.'}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                <strong>Late policy:</strong> {latePolicyText}
              </p>
            </div>

            {assignment.attachments?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-neutral-100">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-neutral-400" />
                  Attached Materials
                </h3>
                <ul className="space-y-2">
                  {assignment.attachments.map((file, idx) => (
                    <li key={file.attachmentId || file.id || idx}>
                      <button
                        type="button"
                        onClick={() => handleDownloadAssignmentAttachment(file, idx)}
                        className="w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-neutral-200 text-sm hover:bg-neutral-50 transition-colors"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
                          <span className="text-neutral-700 truncate">
                            {file.fileName || `Attachment #${idx + 1}`}
                          </span>
                        </span>
                        <span className="text-xs font-medium text-primary-600">Download</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {canManageAssignment ? (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <SummaryCard
                  icon={Users}
                  title="Submissions"
                  value={teacherSummary.total}
                  subtitle="Total received"
                />
                <SummaryCard
                  icon={BarChart3}
                  title="Ungraded"
                  value={teacherSummary.ungraded}
                  subtitle={`${teacherSummary.graded}/${teacherSummary.total} graded`}
                />
                <SummaryCard
                  icon={CheckCircle2}
                  title="Completion"
                  value={`${teacherSummary.completionPct}%`}
                  subtitle="Grading progress"
                />
              </section>

              <section id="submission-panel" className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-neutral-400" />
                    Submission Review
                  </h2>
                  <span className="text-xs font-medium rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">
                    {teacherSummary.ungraded} awaiting grading
                  </span>
                </div>

                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    <ul id="submissions-list" className="space-y-3 max-h-[360px] overflow-auto pr-1">
                      {submissions.map((submission) => {
                        const maxPoints = Number(assignment?.maxPoints ?? 100);
                        const gradePoints = submission?.grade?.pointsEarned;
                        const hasGrade = hasSubmissionGrade(submission);
                        const isActive = activeSubmissionId === submission.submissionId;

                        return (
                          <li
                            key={submission.submissionId}
                            className={[
                              'rounded-xl border p-3 transition-colors',
                              isActive
                                ? 'border-primary-300 bg-primary-50/40'
                                : 'border-neutral-200 bg-white hover:border-neutral-300',
                            ].join(' ')}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-neutral-900 truncate">
                                  {submission?.student?.fullName || `Student #${submission.studentId}`}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  Submitted {formatDateTime(submission.submittedAt || submission.updatedAt)}
                                </p>

                                {submission.githubRepoUrl && (
                                  <a
                                    href={submission.githubRepoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 break-all"
                                  >
                                    <Github className="h-3.5 w-3.5" />
                                    Repository
                                  </a>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <AssignmentStatusBadge
                                  status={hasGrade ? 'graded' : submission.status || 'submitted'}
                                  roleContext="student"
                                />
                                <Button
                                  variant={isActive ? 'ghost' : hasGrade ? 'ghost' : 'secondary'}
                                  size="sm"
                                  onClick={() => openGradingPanel(submission)}
                                  disabled={isSavingGrade}
                                >
                                  {hasGrade ? 'Review Grade' : 'Grade'}
                                </Button>
                              </div>
                            </div>

                            {hasGrade ? (
                              <p className="mt-2 text-xs text-success-700 font-medium">
                                Score: {gradePoints} / {maxPoints}
                              </p>
                            ) : (
                              <p className="mt-2 text-xs text-neutral-500 italic">Not graded yet.</p>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {activeSubmission ? (
                      <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-neutral-900">
                              Grading {activeSubmission?.student?.fullName || `Student #${activeSubmission?.studentId}`}
                            </h3>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              Submitted {formatDateTime(activeSubmission.submittedAt || activeSubmission.updatedAt)}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={closeGradingPanel} disabled={isSavingGrade}>
                            Close
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2 text-sm">
                          {activeSubmission.githubRepoUrl && (
                            <a
                              href={activeSubmission.githubRepoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-primary-700 hover:text-primary-800 break-all"
                            >
                              <Github className="h-4 w-4" />
                              Open repository
                            </a>
                          )}

                          {activeSubmission.submissionText && (
                            <div className="rounded-lg border border-neutral-200 bg-white p-3">
                              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1 inline-flex items-center gap-1">
                                <MessageSquareText className="h-3.5 w-3.5" />
                                Submission Notes
                              </p>
                              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                                {activeSubmission.submissionText}
                              </p>
                            </div>
                          )}

                          {activeSubmission.attachments?.length > 0 && (
                            <div className="rounded-lg border border-neutral-200 bg-white p-3">
                              <p className="text-xs uppercase tracking-wide text-neutral-500 font-semibold mb-1">
                                Attachments
                              </p>
                              <ul className="space-y-1">
                                {activeSubmission.attachments.map((file, idx) => (
                                  <li key={file.attachmentId || file.id || idx}>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDownloadSubmissionAttachment(
                                          activeSubmission.submissionId,
                                          file,
                                          idx
                                        )
                                      }
                                      className="text-sm text-neutral-700 inline-flex items-center gap-1.5 hover:text-primary-700 transition-colors"
                                    >
                                      <FileText className="h-3.5 w-3.5 text-neutral-400" />
                                      {file.fileName || `File ${idx + 1}`}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleGradeFormSubmit(handleSaveGrade)} className="mt-4 space-y-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max={assignment?.maxPoints}
                            label={`Score (max ${assignment?.maxPoints || 0})`}
                            placeholder="e.g. 87.5"
                            error={gradeErrors.pointsEarned?.message}
                            {...registerGrade('pointsEarned')}
                          />

                          <div>
                            <label htmlFor="grade-feedback" className="block text-sm font-medium text-neutral-700 mb-1">
                              Instructor Feedback (Optional)
                            </label>
                            <textarea
                              id="grade-feedback"
                              rows={4}
                              placeholder="Share strengths, issues, and next steps..."
                              className="block w-full rounded-lg border-neutral-300 text-sm text-neutral-700 focus:border-primary-500 focus:ring-primary-500"
                              {...registerGrade('feedback')}
                            />
                            {gradeErrors.feedback && (
                              <p className="mt-1 text-sm text-error-600">{gradeErrors.feedback.message}</p>
                            )}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="flex-1 justify-center"
                              onClick={closeGradingPanel}
                              disabled={isSavingGrade}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="secondary"
                              className="flex-1 justify-center"
                              isLoading={isSavingGrade}
                              disabled={isSavingGrade}
                            >
                              Save Grade
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500 italic">
                        Select a submission above to open the grading panel.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 italic">No submissions yet.</p>
                )}
              </section>
            </>
          ) : (
            <>
              {isStudentGraded && (
                <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-success-500/20 border-t-4 border-success-500">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Award className="h-5 w-5 text-success-500" />
                    Grade & Feedback
                  </h2>

                  <div className="bg-neutral-50 rounded-xl p-4 mb-4 text-center">
                    <span className="block text-sm text-neutral-500 mb-1">Score</span>
                    <span className="text-3xl font-bold text-neutral-900">
                      {grade?.pointsEarned ?? '-'}
                      <span className="text-lg text-neutral-400 font-normal">
                        {' '}
                        / {grade?.maxPoints || assignment.maxPoints}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-neutral-700 mb-2">Instructor feedback</h3>
                    <p className="text-sm text-neutral-600 bg-white p-3 rounded-lg ring-1 ring-neutral-200 whitespace-pre-wrap">
                      {grade?.feedback || (
                        <span className="italic text-neutral-400">No text feedback provided.</span>
                      )}
                    </p>
                  </div>
                </section>
              )}

              <section className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-neutral-900/5">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <UploadCloud className="h-5 w-5 text-neutral-400" />
                  {studentSubmission ? 'Your Submission' : 'Submit Work'}
                </h2>

                <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600">
                  <p>
                    <strong>Due date:</strong> {formatDate(assignment.dueDate)}
                  </p>
                  <p className="mt-1">
                    <strong>Late policy:</strong> {latePolicyText}
                  </p>
                </div>

                {isLateSubmissionBlocked && (
                  <div className="mb-4 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">
                    {lateSubmissionBlockedMessage}
                  </div>
                )}

                {studentSubmission && !isEditingSubmission ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 p-3 rounded-lg ring-1 ring-success-600/20">
                      <CheckCircle2 className="h-4 w-4" />
                      Submitted on {formatDateTime(studentSubmission.submittedAt || studentSubmission.updatedAt)}
                    </div>

                    {studentSubmission.githubRepoUrl && (
                      <div className="text-sm">
                        <span className="block text-neutral-500 mb-1">GitHub Repository:</span>
                        <a
                          href={studentSubmission.githubRepoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 break-all"
                        >
                          <Github className="h-4 w-4 shrink-0" />
                          {studentSubmission.githubRepoUrl}
                        </a>
                      </div>
                    )}

                    {studentSubmission.submissionText && (
                      <div className="text-sm">
                        <span className="block text-neutral-500 mb-1">Submission Notes:</span>
                        <p className="text-neutral-700 whitespace-pre-wrap">{studentSubmission.submissionText}</p>
                      </div>
                    )}

                    {studentSubmission.attachments?.length > 0 && (
                      <div className="text-sm">
                        <span className="block text-neutral-500 mb-1">Files:</span>
                        <ul className="space-y-2">
                          {studentSubmission.attachments.map((file, idx) => (
                            <li key={file.attachmentId || file.id || idx}>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadSubmissionAttachment(
                                    studentSubmission.submissionId,
                                    file,
                                    idx
                                  )
                                }
                                className="flex items-center gap-2 text-neutral-700 hover:text-primary-700 transition-colors"
                              >
                                <FileText className="h-4 w-4 text-neutral-400" />
                                <span className="truncate">{file.fileName || 'Attached file'}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {canResubmit && (
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditingSubmission(true)}
                        className="w-full justify-center"
                      >
                        Resubmit Work
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <Input
                      label={assignment?.requireGithubRepo ? 'GitHub Repository URL (Required)' : 'GitHub Repository URL'}
                      id="githubRepoUrl"
                      placeholder="https://github.com/username/repo"
                      error={errors.githubRepoUrl?.message}
                      {...register('githubRepoUrl')}
                    />

                    <div>
                      <label htmlFor="submissionText" className="block text-sm font-medium text-neutral-700 mb-1">
                        Submission Notes (Optional)
                      </label>
                      <textarea
                        id="submissionText"
                        rows={4}
                        placeholder="Add a short note for your instructor..."
                        className="block w-full rounded-lg border-neutral-300 text-sm text-neutral-700 focus:border-primary-500 focus:ring-primary-500"
                        {...register('submissionText')}
                      />
                    </div>

                    <div>
                      <label htmlFor="file" className="block text-sm font-medium text-neutral-700 mb-1">
                        Upload File (Optional)
                      </label>
                      <input
                        id="file"
                        type="file"
                        className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                        {...register('file')}
                      />
                      {errors.file && <p className="mt-1 text-sm text-error-600">{errors.file.message}</p>}
                    </div>

                    <div className="flex gap-2">
                      {isEditingSubmission && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1 justify-center"
                          onClick={() => {
                            setIsEditingSubmission(false);
                            reset({
                              githubRepoUrl: studentSubmission?.githubRepoUrl || '',
                              submissionText: studentSubmission?.submissionText || '',
                            });
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        className="flex-1 justify-center"
                        isLoading={isSavingSubmission}
                        disabled={isSavingSubmission || isLateSubmissionBlocked}
                      >
                        {studentSubmission ? 'Update Submission' : 'Submit Assignment'}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignmentDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-12 animate-pulse">
      <div className="h-4 w-32 bg-neutral-200 rounded mb-4" />
      <div className="border-b border-neutral-200 pb-6 flex flex-col gap-4">
        <div className="h-4 w-24 bg-neutral-100 rounded" />
        <div className="h-8 w-72 bg-neutral-200 rounded" />
        <div className="h-4 w-48 bg-neutral-100 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
            <div className="h-6 w-40 bg-neutral-200 rounded mb-6" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-100 rounded" />
              <div className="h-4 w-full bg-neutral-100 rounded" />
              <div className="h-4 w-2/3 bg-neutral-100 rounded" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 ring-1 ring-neutral-900/5">
            <div className="h-6 w-32 bg-neutral-200 rounded mb-6" />
            <div className="space-y-4">
              <div className="h-10 w-full bg-neutral-100 rounded" />
              <div className="h-10 w-full bg-neutral-100 rounded" />
              <div className="h-10 w-full bg-neutral-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}