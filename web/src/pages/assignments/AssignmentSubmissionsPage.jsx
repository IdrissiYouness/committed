import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FileText,
  Filter,
  Github,
  ListFilter,
  Paperclip,
  User,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import assignmentService from '../../services/assignmentService';
import submissionService from '../../services/submissionService';
import gradeService from '../../services/gradeService';
import courseService from '../../services/courseService';
import { useAuthStore } from '../../store/authStore';
import useBreadcrumbStore from '../../store/breadcrumbStore';
import { ROUTES } from '../../utils/constants';

import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import AttachmentButton from '../../components/common/AttachmentButton';
import AssignmentStatusBadge from '../../components/features/assignments/AssignmentStatusBadge';

const PAGE_SIZE_OPTIONS = [10, 20, 30];

const DEFAULT_RUBRIC = [
  { id: 'correctness', title: 'Correctness', weight: 40, description: 'Meets functional requirements' },
  { id: 'code_quality', title: 'Code Quality', weight: 25, description: 'Readable, maintainable structure' },
  { id: 'testing', title: 'Testing & Validation', weight: 20, description: 'Tests, edge cases, reliability' },
  { id: 'documentation', title: 'Documentation', weight: 15, description: 'Clarity of notes and explanation' },
];

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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeStatus(status) {
  return String(status || 'pending').toLowerCase();
}

function buildRubricTemplate(maxPoints) {
  const safeMax = Math.max(1, toNumber(maxPoints, 100));
  return DEFAULT_RUBRIC.map((criterion) => {
    const criterionMax = Number(((safeMax * criterion.weight) / 100).toFixed(2));
    return {
      ...criterion,
      maxPoints: criterionMax,
      score: '',
      comment: '',
    };
  });
}

function computeRubricTotal(criteria) {
  const total = (criteria || []).reduce((sum, c) => {
    const maxPoints = toNumber(c.maxPoints, 0);
    const score = toNumber(c.score, 0);
    return sum + clamp(score, 0, maxPoints);
  }, 0);

  return Number(total.toFixed(2));
}

function getLocalStorageKey(assignmentId, key) {
  return `grading_workspace_${assignmentId}_${key}`;
}

function getSubmissionScore(submission) {
  if (!submission) return null;
  const score = submission?.grade?.pointsEarned;
  if (score === null || score === undefined || score === '') return null;
  const numeric = Number(score);
  return Number.isFinite(numeric) ? numeric : null;
}

function createSystemEvents(submission) {
  const events = [];

  if (submission?.submittedAt) {
    events.push({
      id: `submitted-${submission.submissionId}`,
      type: 'submitted',
      message: 'Submission created',
      timestamp: submission.submittedAt,
      actor: 'Student',
      source: 'system',
    });
  }

  if (submission?.grade?.gradedAt) {
    events.push({
      id: `graded-${submission.submissionId}`,
      type: 'graded',
      message: `Grade recorded: ${submission.grade.pointsEarned}/${submission.grade.maxPoints}`,
      timestamp: submission.grade.gradedAt,
      actor: submission?.grade?.gradedBy?.fullName || 'Instructor',
      source: 'system',
    });
  }

  return events;
}

function buildAiSuggestion({ submission, assignmentMax, rubricTotal }) {
  const max = Math.max(1, toNumber(assignmentMax, 100));
  const hasRepo = !!submission?.githubRepoUrl;
  const hasNotes = !!submission?.submissionText;
  const analysisStatus = normalizeStatus(submission?.codeAnalysis?.status);
  const baseline = rubricTotal > 0 ? rubricTotal : max * 0.72;

  let modifier = 0;
  if (hasRepo) modifier += max * 0.05;
  if (hasNotes) modifier += max * 0.03;
  if (analysisStatus === 'completed') modifier += max * 0.04;
  if (analysisStatus === 'failed') modifier -= max * 0.05;

  const suggestedScore = Number(clamp(baseline + modifier, 0, max).toFixed(2));

  const flags = [];
  if (!hasRepo) flags.push('Missing GitHub repository link');
  if (!hasNotes) flags.push('No submission notes provided');
  if (analysisStatus === 'failed') flags.push('Code analysis failed');
  if (analysisStatus === 'pending' || analysisStatus === 'analyzing') {
    flags.push('Code analysis is still in progress');
  }

  const draftFeedback = [
    'Strong effort on this submission.',
    hasRepo
      ? 'Repository is provided and ready for review.'
      : 'Please include a repository link in future submissions.',
    hasNotes
      ? 'Notes were useful for understanding your implementation.'
      : 'Add concise notes next time to explain architecture choices.',
    analysisStatus === 'completed'
      ? 'Automated analysis completed successfully.'
      : 'Manual review recommended while analysis is pending/incomplete.',
  ].join(' ');

  return { suggestedScore, draftFeedback, flags };
}

export default function AssignmentSubmissionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setBreadcrumbLabel = useBreadcrumbStore(state => state.setLabel);

  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';
  const currentUserId = toNumber(user?.userId, -1);

  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    if (assignment?.title) {
      setBreadcrumbLabel(id, assignment.title);
    }
  }, [assignment, id, setBreadcrumbLabel]);

  useEffect(() => {
    const courseId = course?.id || course?.courseId || assignment?.courseId;
    if (course?.courseName && courseId) {
      setBreadcrumbLabel(String(courseId), course.courseName);
    }
  }, [course, assignment, setBreadcrumbLabel]);

  const [studentsById, setStudentsById] = useState({});
  const [submissions, setSubmissions] = useState([]);

  const [isCourseTeacher, setIsCourseTeacher] = useState(false);
  const [canManageWorkspace, setCanManageWorkspace] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSubmissionId, setSelectedSubmissionId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [sortKey, setSortKey] = useState('submittedAt');
  const [sortDir, setSortDir] = useState('desc');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [manualScore, setManualScore] = useState('');
  const [manualFeedback, setManualFeedback] = useState('');
  const [returnComment, setReturnComment] = useState('');

  const [rubricDrafts, setRubricDrafts] = useState({});
  const [workflowHistory, setWorkflowHistory] = useState({});
  const [workflowState, setWorkflowState] = useState({});
  const [aiDrafts, setAiDrafts] = useState({});

  const assignmentMaxPoints = toNumber(assignment?.maxPoints, 100);

  const selectedSubmission = useMemo(
    () => submissions.find((submission) => submission.submissionId === selectedSubmissionId) || null,
    [submissions, selectedSubmissionId]
  );

  const selectedRubric = useMemo(() => {
    if (!selectedSubmissionId) return buildRubricTemplate(assignmentMaxPoints);
    return rubricDrafts[selectedSubmissionId] || buildRubricTemplate(assignmentMaxPoints);
  }, [selectedSubmissionId, rubricDrafts, assignmentMaxPoints]);

  const rubricTotal = useMemo(() => computeRubricTotal(selectedRubric), [selectedRubric]);

  const selectedStudentName = useMemo(() => {
    if (!selectedSubmission) return 'Student';
    return (
      selectedSubmission?.student?.fullName ||
      studentsById[selectedSubmission.studentId]?.fullName ||
      `Student #${selectedSubmission.studentId}`
    );
  }, [selectedSubmission, studentsById]);

  const selectedWorkflowState = selectedSubmissionId ? workflowState[selectedSubmissionId] : null;
  const selectedAiDraft = selectedSubmissionId ? aiDrafts[selectedSubmissionId] : null;

  const hydrateLocalWorkspaceState = useCallback(() => {
    try {
      const historyRaw = localStorage.getItem(getLocalStorageKey(id, 'history'));
      const stateRaw = localStorage.getItem(getLocalStorageKey(id, 'state'));
      const rubricRaw = localStorage.getItem(getLocalStorageKey(id, 'rubric'));
      const aiRaw = localStorage.getItem(getLocalStorageKey(id, 'ai'));

      if (historyRaw) setWorkflowHistory(JSON.parse(historyRaw));
      if (stateRaw) setWorkflowState(JSON.parse(stateRaw));
      if (rubricRaw) setRubricDrafts(JSON.parse(rubricRaw));
      if (aiRaw) setAiDrafts(JSON.parse(aiRaw));
    } catch {
      setWorkflowHistory({});
      setWorkflowState({});
      setRubricDrafts({});
      setAiDrafts({});
    }
  }, [id]);

  useEffect(() => {
    hydrateLocalWorkspaceState();
  }, [hydrateLocalWorkspaceState]);

  useEffect(() => {
    localStorage.setItem(getLocalStorageKey(id, 'history'), JSON.stringify(workflowHistory));
  }, [id, workflowHistory]);

  useEffect(() => {
    localStorage.setItem(getLocalStorageKey(id, 'state'), JSON.stringify(workflowState));
  }, [id, workflowState]);

  useEffect(() => {
    localStorage.setItem(getLocalStorageKey(id, 'rubric'), JSON.stringify(rubricDrafts));
  }, [id, rubricDrafts]);

  useEffect(() => {
    localStorage.setItem(getLocalStorageKey(id, 'ai'), JSON.stringify(aiDrafts));
  }, [id, aiDrafts]);

  const appendHistory = useCallback(
    (submissionId, event) => {
      setWorkflowHistory((prev) => {
        const current = prev[submissionId] || [];
        return {
          ...prev,
          [submissionId]: [
            ...current,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: new Date().toISOString(),
              actor: user?.fullName || 'Instructor',
              source: 'workspace',
              ...event,
            },
          ],
        };
      });
    },
    [user?.fullName]
  );

  const fetchWorkspaceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const assignmentPayload = await assignmentService.getById(id);
      setAssignment(assignmentPayload);

      const coursePayload = await courseService.getById(assignmentPayload.courseId).catch(() => null);
      setCourse(coursePayload);

      const teacherId = toNumber(coursePayload?.teacher?.userId, -1);
      const createdBy = toNumber(assignmentPayload?.createdBy, -1);
      const teacherForCourse = currentUserId === teacherId || currentUserId === createdBy;
      const canManage = isAdmin || teacherForCourse;

      setIsCourseTeacher(teacherForCourse);
      setCanManageWorkspace(canManage);

      if (!canManage) {
        setError('Only course teachers or admins can access the grading workspace.');
        setSubmissions([]);
        setIsLoading(false);
        return;
      }

      const [studentsPayload, submissionsPayload] = await Promise.all([
        courseService.getStudents(assignmentPayload.courseId).catch(() => []),
        submissionService.getAllByAssignment(id).catch(() => ({ content: [] })),
      ]);

      const studentMap = (studentsPayload || []).reduce((acc, student) => {
        acc[student.userId] = student;
        return acc;
      }, {});
      setStudentsById(studentMap);

      const submissionItems = toList(submissionsPayload);

      const withGrades = await Promise.all(
        submissionItems.map(async (submission) => {
          const grade = await gradeService.getBySubmission(submission.submissionId).catch((requestError) => {
            if (requestError?.status === 404 || requestError?.status === 403) return null;
            throw requestError;
          });

          return {
            ...submission,
            grade,
          };
        })
      );

      setSubmissions(withGrades);

      if (withGrades.length > 0) {
        const firstUngraded =
          withGrades.find((submission) => getSubmissionScore(submission) === null) || withGrades[0];
        setSelectedSubmissionId((prev) => prev ?? firstUngraded.submissionId);
      }
    } catch (requestError) {
      setError(requestError?.message || 'Failed to load grading workspace.');
    } finally {
      setIsLoading(false);
    }
  }, [id, currentUserId, isAdmin]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  useEffect(() => {
    if (!selectedSubmission) return;

    const score = getSubmissionScore(selectedSubmission);
    setManualScore(score === null ? '' : String(score));
    setManualFeedback(selectedSubmission?.grade?.feedback || '');

    setRubricDrafts((prev) => {
      if (prev[selectedSubmission.submissionId]) return prev;
      return {
        ...prev,
        [selectedSubmission.submissionId]: buildRubricTemplate(assignmentMaxPoints),
      };
    });
  }, [selectedSubmission, assignmentMaxPoints]);

  const enrichedSubmissions = useMemo(() => {
    return submissions.map((submission) => {
      const studentName =
        submission?.student?.fullName ||
        studentsById[submission.studentId]?.fullName ||
        `Student #${submission.studentId}`;

      const backendStatus = normalizeStatus(submission.status);
      const score = getSubmissionScore(submission);
      const visualStatus = score !== null ? 'graded' : backendStatus;

      return {
        ...submission,
        studentName,
        visualStatus,
        score,
      };
    });
  }, [submissions, studentsById, workflowState]);

  const filteredSubmissions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let items = enrichedSubmissions.filter((submission) => {
      const matchesQuery =
        !query ||
        submission.studentName.toLowerCase().includes(query) ||
        String(submission.studentId).includes(query);

      const matchesStatus = statusFilter === 'all' || submission.visualStatus === statusFilter;

      const matchesScore =
        scoreFilter === 'all' ||
        (scoreFilter === 'graded' && submission.score !== null) ||
        (scoreFilter === 'ungraded' && submission.score === null);

      return matchesQuery && matchesStatus && matchesScore;
    });

    items = [...items].sort((a, b) => {
      const direction = sortDir === 'asc' ? 1 : -1;

      if (sortKey === 'student') {
        return a.studentName.localeCompare(b.studentName) * direction;
      }

      if (sortKey === 'status') {
        return a.visualStatus.localeCompare(b.visualStatus) * direction;
      }

      if (sortKey === 'score') {
        const aScore = a.score === null ? -1 : a.score;
        const bScore = b.score === null ? -1 : b.score;
        return (aScore - bScore) * direction;
      }

      const aTime = new Date(a.submittedAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.submittedAt || b.updatedAt || 0).getTime();
      return (aTime - bTime) * direction;
    });

    return items;
  }, [enrichedSubmissions, searchQuery, statusFilter, scoreFilter, sortKey, sortDir]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
    if (page > totalPages - 1) {
      setPage(totalPages - 1);
    }
  }, [filteredSubmissions.length, page, pageSize]);

  useEffect(() => {
    if (!filteredSubmissions.length) {
      setSelectedSubmissionId(null);
      return;
    }

    const stillVisible = filteredSubmissions.some((submission) => submission.submissionId === selectedSubmissionId);
    if (!stillVisible) {
      setSelectedSubmissionId(filteredSubmissions[0].submissionId);
    }
  }, [filteredSubmissions, selectedSubmissionId]);

  const pagedSubmissions = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filteredSubmissions.slice(start, end);
  }, [filteredSubmissions, page, pageSize]);

  const tablePagination = useMemo(() => {
    const totalElements = filteredSubmissions.length;
    const totalPages = Math.ceil(totalElements / pageSize);

    return {
      page,
      size: pageSize,
      totalElements,
      totalPages,
      hasPrev: page > 0,
      hasNext: totalPages > 0 && page < totalPages - 1,
    };
  }, [filteredSubmissions.length, page, pageSize]);

  const selectedIndex = useMemo(
    () => filteredSubmissions.findIndex((submission) => submission.submissionId === selectedSubmissionId),
    [filteredSubmissions, selectedSubmissionId]
  );

  const hasPrevSubmission = selectedIndex > 0;
  const hasNextSubmission = selectedIndex >= 0 && selectedIndex < filteredSubmissions.length - 1;

  const gotoPrevSubmission = () => {
    if (!hasPrevSubmission) return;
    setSelectedSubmissionId(filteredSubmissions[selectedIndex - 1].submissionId);
  };

  const gotoNextSubmission = () => {
    if (!hasNextSubmission) return;
    setSelectedSubmissionId(filteredSubmissions[selectedIndex + 1].submissionId);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir(key === 'student' ? 'asc' : 'desc');
  };

  const updateRubricScore = (criterionId, value) => {
    if (!selectedSubmissionId) return;

    setRubricDrafts((prev) => {
      const current = prev[selectedSubmissionId] || buildRubricTemplate(assignmentMaxPoints);
      const updated = current.map((criterion) => {
        if (criterion.id !== criterionId) return criterion;
        return { ...criterion, score: value };
      });

      return {
        ...prev,
        [selectedSubmissionId]: updated,
      };
    });
  };

  const updateRubricComment = (criterionId, comment) => {
    if (!selectedSubmissionId) return;

    setRubricDrafts((prev) => {
      const current = prev[selectedSubmissionId] || buildRubricTemplate(assignmentMaxPoints);
      const updated = current.map((criterion) => {
        if (criterion.id !== criterionId) return criterion;
        return { ...criterion, comment };
      });

      return {
        ...prev,
        [selectedSubmissionId]: updated,
      };
    });
  };

  const applyRubricToManualScore = () => {
    setManualScore(String(rubricTotal));
    toast.success('Rubric total applied to manual score.');
  };

  const runAiSuggestScore = () => {
    if (!selectedSubmission) return;

    const suggestion = buildAiSuggestion({
      submission: selectedSubmission,
      assignmentMax: assignmentMaxPoints,
      rubricTotal,
    });

    setAiDrafts((prev) => ({
      ...prev,
      [selectedSubmission.submissionId]: {
        ...(prev[selectedSubmission.submissionId] || {}),
        suggestedScore: suggestion.suggestedScore,
        draftFeedback: suggestion.draftFeedback,
        flags: suggestion.flags,
        generatedAt: new Date().toISOString(),
      },
    }));

    appendHistory(selectedSubmission.submissionId, {
      type: 'ai_suggest_score',
      message: `AI suggested score ${suggestion.suggestedScore}/${assignmentMaxPoints}`,
    });

    toast.success('AI score suggestion generated.');
  };

  const runAiDraftFeedback = () => {
    if (!selectedSubmission) return;

    const suggestion = buildAiSuggestion({
      submission: selectedSubmission,
      assignmentMax: assignmentMaxPoints,
      rubricTotal,
    });

    setAiDrafts((prev) => ({
      ...prev,
      [selectedSubmission.submissionId]: {
        ...(prev[selectedSubmission.submissionId] || {}),
        suggestedScore: suggestion.suggestedScore,
        draftFeedback: suggestion.draftFeedback,
        flags: suggestion.flags,
        generatedAt: new Date().toISOString(),
      },
    }));

    setManualFeedback((current) => (current?.trim() ? current : suggestion.draftFeedback));

    appendHistory(selectedSubmission.submissionId, {
      type: 'ai_draft_feedback',
      message: 'AI drafted feedback text',
    });

    toast.success('AI feedback draft generated.');
  };

  const runAiFlagIssues = () => {
    if (!selectedSubmission) return;

    const suggestion = buildAiSuggestion({
      submission: selectedSubmission,
      assignmentMax: assignmentMaxPoints,
      rubricTotal,
    });

    setAiDrafts((prev) => ({
      ...prev,
      [selectedSubmission.submissionId]: {
        ...(prev[selectedSubmission.submissionId] || {}),
        suggestedScore: suggestion.suggestedScore,
        draftFeedback: suggestion.draftFeedback,
        flags: suggestion.flags,
        generatedAt: new Date().toISOString(),
      },
    }));

    appendHistory(selectedSubmission.submissionId, {
      type: 'ai_flag_issues',
      message: suggestion.flags.length
        ? `AI flagged ${suggestion.flags.length} potential issue(s)`
        : 'AI found no major issues',
    });

    toast.success('AI issue scan completed.');
  };

  const applyAiSuggestionToForm = () => {
    if (!selectedSubmissionId || !selectedAiDraft) return;
    if (selectedAiDraft.suggestedScore !== undefined) {
      setManualScore(String(selectedAiDraft.suggestedScore));
    }
    if (selectedAiDraft.draftFeedback) {
      setManualFeedback(selectedAiDraft.draftFeedback);
    }
    toast.success('AI suggestions applied to grading form.');
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;

    const scoreValue = Number(manualScore);
    if (!Number.isFinite(scoreValue)) {
      toast.error('Please enter a valid numeric score.');
      return;
    }

    if (scoreValue < 0) {
      toast.error('Score cannot be negative.');
      return;
    }

    if (scoreValue > assignmentMaxPoints) {
      toast.error(`Score cannot exceed ${assignmentMaxPoints}.`);
      return;
    }

    setIsSavingGrade(true);

    try {
      const payload = {
        pointsEarned: scoreValue,
        feedback: manualFeedback?.trim() || null,
      };

      const existingGradeId = selectedSubmission?.grade?.gradeId;

      if (existingGradeId) {
        await gradeService.update(existingGradeId, payload);
      } else {
        try {
          await gradeService.create(selectedSubmission.submissionId, payload);
        } catch (gradeError) {
          if (gradeError?.status === 409) {
            const existingGrade = await gradeService.getBySubmission(selectedSubmission.submissionId);
            const recoveredGradeId = existingGrade?.gradeId;

            if (!recoveredGradeId) {
              throw new Error('Existing grade ID not found for update.');
            }

            await gradeService.update(recoveredGradeId, payload);
          } else {
            throw gradeError;
          }
        }
      }

      const refreshedGrade = await gradeService
        .getBySubmission(selectedSubmission.submissionId)
        .catch(() => ({ ...payload, maxPoints: assignmentMaxPoints, gradedAt: new Date().toISOString() }));

      setSubmissions((prev) =>
        prev.map((submission) =>
          submission.submissionId === selectedSubmission.submissionId
            ? { ...submission, status: 'graded', grade: refreshedGrade }
            : submission
        )
      );

      setWorkflowState((prev) => ({
        ...prev,
        [selectedSubmission.submissionId]: {
          ...(prev[selectedSubmission.submissionId] || {}),
          returned: false,
          returnedAt: null,
          returnComment: null,
        },
      }));

      appendHistory(selectedSubmission.submissionId, {
        type: 'grade_saved',
        message: `Grade saved: ${scoreValue}/${assignmentMaxPoints}`,
        metadata: {
          rubricTotal,
        },
      });

      toast.success('Grade saved successfully.');
    } catch (requestError) {
      toast.error(requestError?.message || 'Failed to save grade.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleReturnToStudent = () => {
    if (!selectedSubmission) return;

    setWorkflowState((prev) => ({
      ...prev,
      [selectedSubmission.submissionId]: {
        ...(prev[selectedSubmission.submissionId] || {}),
        returned: true,
        returnedAt: new Date().toISOString(),
        returnComment: returnComment?.trim() || null,
      },
    }));

    appendHistory(selectedSubmission.submissionId, {
      type: 'returned',
      message: returnComment?.trim()
        ? `Returned to student: ${returnComment.trim()}`
        : 'Returned to student for revision',
    });

    toast.success('Marked as returned in workflow timeline.');
    setReturnComment('');
  };

  const timelineEvents = useMemo(() => {
    if (!selectedSubmission) return [];
    const systemEvents = createSystemEvents(selectedSubmission);
    const workspaceEvents = workflowHistory[selectedSubmission.submissionId] || [];

    const all = [...systemEvents, ...workspaceEvents];
    return all.sort((a, b) => {
      const aTime = new Date(a.timestamp || 0).getTime();
      const bTime = new Date(b.timestamp || 0).getTime();
      return bTime - aTime;
    });
  }, [selectedSubmission, workflowHistory]);

  const summary = useMemo(() => {
    const total = enrichedSubmissions.length;
    const graded = enrichedSubmissions.filter((submission) => submission.score !== null).length;
    const late = enrichedSubmissions.filter((submission) => submission.visualStatus === 'late').length;
    const ungraded = Math.max(total - graded, 0);

    return { total, graded, ungraded, late };
  }, [enrichedSubmissions]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto w-full py-6 space-y-4 animate-pulse">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-8 w-80 bg-neutral-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl ring-1 ring-neutral-900/5" />
          <div className="h-96 bg-white rounded-2xl ring-1 ring-neutral-900/5" />
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-5xl mx-auto w-full py-8 space-y-4">
        <Button variant="ghost" onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignment
        </Button>
        <div className="rounded-xl border border-error-200 bg-error-50 p-5">
          <p className="text-sm font-medium text-error-700">{error || 'Unable to load workspace.'}</p>
        </div>
      </div>
    );
  }

  if (!canManageWorkspace) {
    return (
      <div className="max-w-5xl mx-auto w-full py-8 space-y-4">
        <Button variant="ghost" onClick={() => navigate(`${ROUTES.ASSIGNMENTS}/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignment
        </Button>
        <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
          <p className="text-sm font-medium text-warning-700">
            You do not have permission to access this grading workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full pb-12 space-y-6">
      {/* Header */}
      <section className="border-b border-neutral-200 pb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <Link
              to={`${ROUTES.ASSIGNMENTS}/${id}`}
              className="inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Assignment
            </Link>

            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-neutral-900">
              Grading Workspace
            </h1>

            <p className="mt-1 text-sm text-neutral-600">
              {course?.courseName || assignment?.courseName || 'Course'} • {assignment.title}
            </p>

            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" />
                Due: {assignment?.dueDate ? formatDateTime(assignment.dueDate) : 'No due date'}
              </span>
              <span>Max points: {assignmentMaxPoints}</span>
              <Badge variant={isCourseTeacher ? 'info' : 'neutral'}>
                {isCourseTeacher ? 'Teacher workspace' : 'Admin workspace'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`${ROUTES.ASSIGNMENTS}/${id}`}>
              <Button variant="ghost" size="sm">
                Open Assignment Detail
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryTile label="Total Submissions" value={summary.total} />
        <SummaryTile label="Ungraded" value={summary.ungraded} />
        <SummaryTile label="Graded" value={summary.graded} />
        <SummaryTile label="Late" value={summary.late} />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left column: filters + table */}
        <section className="xl:col-span-3 rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-900/5">
          <div className="flex items-center gap-2 mb-4">
            <ListFilter className="h-4 w-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-800">Submissions</h2>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-2">
              <Input
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                placeholder="Search by student name or ID"
              />
            </div>

            <label className="text-sm">
              <span className="mb-1 block text-neutral-600">Status</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(0);
                }}
                className="block w-full rounded-lg border-neutral-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All statuses</option>
                <option value="submitted">Submitted</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
                <option value="pending">Pending</option>
                <option value="returned">Returned</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block text-neutral-600">Score</span>
              <select
                value={scoreFilter}
                onChange={(event) => {
                  setScoreFilter(event.target.value);
                  setPage(0);
                }}
                className="block w-full rounded-lg border-neutral-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="all">All</option>
                <option value="graded">Graded only</option>
                <option value="ungraded">Ungraded only</option>
              </select>
            </label>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <SortableTh label="Student" active={sortKey === 'student'} dir={sortDir} onClick={() => handleSort('student')} />
                  <SortableTh label="Submitted" active={sortKey === 'submittedAt'} dir={sortDir} onClick={() => handleSort('submittedAt')} />
                  <SortableTh label="Status" active={sortKey === 'status'} dir={sortDir} onClick={() => handleSort('status')} />
                  <SortableTh label="Score" active={sortKey === 'score'} dir={sortDir} onClick={() => handleSort('score')} />
                  <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 bg-white">
                {pagedSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                      No submissions match your filters.
                    </td>
                  </tr>
                ) : (
                  pagedSubmissions.map((submission) => {
                    const isSelected = submission.submissionId === selectedSubmissionId;
                    return (
                      <tr
                        key={submission.submissionId}
                        className={isSelected ? 'bg-primary-50/50' : 'hover:bg-neutral-50'}
                      >
                        <td className="px-3 py-3 text-sm">
                          <div className="font-medium text-neutral-900">{submission.studentName}</div>
                          <div className="text-xs text-neutral-500">ID: {submission.studentId}</div>
                        </td>

                        <td className="px-3 py-3 text-sm text-neutral-700">
                          {formatDateTime(submission.submittedAt || submission.updatedAt)}
                        </td>

                        <td className="px-3 py-3 text-sm">
                          <AssignmentStatusBadge status={submission.visualStatus} roleContext="student" />
                        </td>

                        <td className="px-3 py-3 text-sm text-neutral-800 font-medium tabular-nums">
                          {submission.score === null ? '—' : `${submission.score}/${assignmentMaxPoints}`}
                        </td>

                        <td className="px-3 py-3 text-sm">
                          <Button
                            variant={isSelected ? 'ghost' : 'secondary'}
                            size="sm"
                            onClick={() => setSelectedSubmissionId(submission.submissionId)}
                          >
                            {isSelected ? 'Open' : 'Review'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-neutral-600">
              <Filter className="h-3.5 w-3.5" />
              Page size
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(0);
                }}
                className="rounded-md border-neutral-300 text-xs"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <Pagination
              pagination={tablePagination}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Right column: review panel */}
        <section className="xl:col-span-2 rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-neutral-900/5 space-y-5">
          {!selectedSubmission ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
              Select a submission from the table to open the review panel.
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">Review Panel</h2>
                  <p className="text-sm text-neutral-600">
                    {selectedStudentName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={gotoPrevSubmission} disabled={!hasPrevSubmission}>
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Button>
                  <Button variant="ghost" size="sm" onClick={gotoNextSubmission} disabled={!hasNextSubmission}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-neutral-700">
                  <User className="h-4 w-4 text-neutral-500" />
                  {selectedStudentName}
                </div>

                <div className="text-xs text-neutral-500">
                  Submitted: {formatDateTime(selectedSubmission.submittedAt || selectedSubmission.updatedAt)}
                </div>

                <div>
                  <AssignmentStatusBadge
                    status={
                      getSubmissionScore(selectedSubmission) !== null
                        ? 'graded'
                        : (selectedSubmission.status || 'submitted')
                    }
                    roleContext="student"
                  />
                </div>

                {selectedSubmission.githubRepoUrl ? (
                  <a
                    href={selectedSubmission.githubRepoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 break-all"
                  >
                    <Github className="h-4 w-4" />
                    Open repository
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-neutral-500 italic">No repository link provided.</p>
                )}

                {selectedSubmission.submissionText ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1 inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Submission Notes
                    </p>
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                      {selectedSubmission.submissionText}
                    </p>
                  </div>
                ) : null}

                {/* ── Submitted files ──────────────────────────────────── */}
                {selectedSubmission.attachments?.length > 0 ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2 inline-flex items-center gap-1">
                      <Paperclip className="h-3.5 w-3.5" />
                      Submitted Files ({selectedSubmission.attachments.length})
                    </p>
                    <ul className="space-y-1.5">
                      {selectedSubmission.attachments.map((file, idx) => (
                        <li key={file.attachmentId || file.id || idx}>
                          <AttachmentButton
                            url={`/api/submissions/${selectedSubmission.submissionId}/attachments/${file.attachmentId || file.id}`}
                            fileName={file.fileName || `submission-attachment-${idx + 1}`}
                            fileSize={file.fileSize}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400 italic">No files attached to this submission.</p>
                )}
              </div>

              {/* Grading form */}
              <div className="rounded-xl border border-neutral-200 p-3 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-800 inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-neutral-500" />
                  Grading
                </h3>

                <Input
                  label={`Score (0 - ${assignmentMaxPoints})`}
                  type="number"
                  step="0.01"
                  min="0"
                  max={assignmentMaxPoints}
                  value={manualScore}
                  onChange={(event) => setManualScore(event.target.value)}
                  placeholder="Enter score"
                />

                <div>
                  <label htmlFor="manual-feedback" className="block text-sm font-medium text-neutral-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    id="manual-feedback"
                    rows={4}
                    value={manualFeedback}
                    onChange={(event) => setManualFeedback(event.target.value)}
                    placeholder="Share strengths, issues, and next steps..."
                    className="block w-full rounded-lg border-neutral-300 text-sm text-neutral-700 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleSaveGrade}
                    isLoading={isSavingGrade}
                    disabled={isSavingGrade}
                    className="justify-center"
                  >
                    Save Grade
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      const score = getSubmissionScore(selectedSubmission);
                      setManualScore(score === null ? '' : String(score));
                      setManualFeedback(selectedSubmission?.grade?.feedback || '');
                    }}
                    disabled={isSavingGrade}
                    className="justify-center"
                  >
                    Reset Form
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-neutral-500 font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-neutral-900 tabular-nums">{value}</p>
    </div>
  );
}

function SortableTh({ label, active, dir, onClick }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-neutral-800 transition-colors"
      >
        {label}
        {active ? (
          dir === 'asc' ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-neutral-300" />
        )}
      </button>
    </th>
  );
}