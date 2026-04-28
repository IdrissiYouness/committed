import Badge from '../../common/Badge';

/**
 * AssignmentStatusBadge
 *
 * Role-aware assignment badge used across student + teacher contexts.
 *
 * Props:
 * - status: string
 * - roleContext: 'student' | 'teacher' | 'professor'
 * - submissionsCount?: number
 * - gradedCount?: number
 * - ungradedCount?: number
 * - dueState?: 'overdue' | 'due_soon' | 'active' | 'no_due_date'
 * - className?: string
 */
export default function AssignmentStatusBadge({
  status,
  roleContext = 'student',
  submissionsCount,
  gradedCount,
  ungradedCount,
  dueState,
  className = '',
}) {
  const normalizedRole =
    String(roleContext || 'student').toLowerCase() === 'professor'
      ? 'teacher'
      : String(roleContext || 'student').toLowerCase();

  const normalizedStatus = String(status || '').toLowerCase();

  const config =
    normalizedRole === 'teacher'
      ? getTeacherConfig({
          status: normalizedStatus,
          submissionsCount,
          gradedCount,
          ungradedCount,
          dueState,
        })
      : getStudentConfig({
          status: normalizedStatus,
          dueState,
        });

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

function getStudentConfig({ status, dueState }) {
  if ((status === 'pending' || !status) && dueState === 'due_soon') {
    return { variant: 'warning', label: 'Due soon' };
  }

  switch (status) {
    case 'submitted':
      return { variant: 'info', label: 'Submitted' };
    case 'graded':
      return { variant: 'success', label: 'Graded' };
    case 'late':
      return { variant: 'warning', label: 'Late' };
    case 'missing':
    case 'overdue':
      return { variant: 'error', label: 'Missing' };
    case 'pending':
    default:
      return { variant: 'neutral', label: 'Pending' };
  }
}

function getTeacherConfig({
  status,
  submissionsCount,
  gradedCount,
  ungradedCount,
  dueState,
}) {
  const totalSubmissions = toNumber(submissionsCount);
  const totalGraded = toNumber(gradedCount);
  const totalUngraded = toNumber(ungradedCount);

  if (totalSubmissions > 0 && totalGraded === totalSubmissions) {
    return {
      variant: 'success',
      label: `Graded ${totalGraded}/${totalSubmissions}`,
    };
  }

  if (totalUngraded > 0) {
    return {
      variant: 'warning',
      label: `Ungraded ${totalUngraded}`,
    };
  }

  if (status === 'submissions' && totalSubmissions > 0) {
    return {
      variant: 'info',
      label: `Submissions: ${totalSubmissions}`,
    };
  }

  if ((status === 'open' || status === 'active' || !status) && dueState === 'due_soon') {
    return { variant: 'warning', label: 'Due soon' };
  }

  switch (status) {
    case 'awaiting_submissions':
      return { variant: 'neutral', label: 'Awaiting submissions' };
    case 'open':
    case 'active':
      return { variant: 'neutral', label: 'Open' };
    case 'closed':
      return { variant: 'neutral', label: 'Closed' };
    default:
      return totalSubmissions > 0
        ? { variant: 'info', label: `Submissions: ${totalSubmissions}` }
        : { variant: 'neutral', label: 'Open' };
  }
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}