import { useState, useEffect, useCallback, useMemo } from 'react';

import { useAuthStore } from '../store/authStore';
import dashboardService from '../services/dashboardService';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isStudentPendingStatus(status) {
  const normalized = (status || '').toLowerCase();
  return ['pending', 'missing', 'overdue', 'late'].includes(normalized);
}

function inferPrimaryRole({ hasTeachingContext, hasStudentContext }) {
  if (hasTeachingContext && hasStudentContext) return 'mixed';
  if (hasTeachingContext) return 'teacher';
  return 'student';
}

function buildViewMetadata(primaryRole) {
  const shared = {
    coursesSectionTitle: 'My Courses',
    announcementsSectionTitle: 'Recent Announcements',
    gradesSectionTitle: 'Recent Grades',
  };

  if (primaryRole === 'teacher') {
    return {
      ...shared,
      role: 'teacher',
      assignmentsSectionTitle: 'Active Assignments',
      assignmentsEmptyTitle: 'No active assignments',
      assignmentsEmptyDescription:
        'Assignments waiting for submissions or grading will appear here.',
      metricLabels: ['Courses Teaching', 'Ungraded Submissions', 'Announcements Posted'],
    };
  }

  if (primaryRole === 'mixed') {
    return {
      ...shared,
      role: 'mixed',
      assignmentsSectionTitle: 'Assignments Across Courses',
      assignmentsEmptyTitle: 'No assignments yet',
      assignmentsEmptyDescription:
        'Assignments from your teaching and enrolled courses will appear here.',
      metricLabels: ['Teaching Courses', 'Pending Student Work', 'Courses Enrolled'],
    };
  }

  return {
    ...shared,
    role: 'student',
    assignmentsSectionTitle: 'Upcoming Assignments',
    assignmentsEmptyTitle: 'All caught up!',
    assignmentsEmptyDescription:
      'You have no pending assignments. New work will appear here.',
    metricLabels: ['Courses Enrolled', 'Pending Assignments', 'Recent Grades'],
  };
}

/**
 * useDashboard
 *
 * Fetches all dashboard data for authenticated non-admin users.
 * Adds role-context metrics + dashboard view metadata while preserving legacy
 * fields used by existing UI.
 */
export function useDashboard() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [teachingCourses, setTeachingCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAdmin) {
        setEnrolledCourses([]);
        setTeachingCourses([]);
        setUpcomingAssignments([]);
        setRecentAnnouncements([]);
        setRecentGrades([]);
      } else {
        const [enrolled, teaching, assignments, announcements, grades] =
          await Promise.all([
            dashboardService.getEnrolledCourses(),
            dashboardService.getTeachingCourses(),
            dashboardService.getUpcomingAssignments(),
            dashboardService.getRecentAnnouncements(),
            dashboardService.getRecentGrades(),
          ]);

        setEnrolledCourses(Array.isArray(enrolled) ? enrolled : []);
        setTeachingCourses(Array.isArray(teaching) ? teaching : []);
        setUpcomingAssignments(Array.isArray(assignments) ? assignments : []);
        setRecentAnnouncements(Array.isArray(announcements) ? announcements : []);
        setRecentGrades(Array.isArray(grades) ? grades : []);
      }
    } catch (err) {
      setError(err?.message ?? 'Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const roleContext = useMemo(() => {
    const hasTeachingContext =
      teachingCourses.length > 0 ||
      upcomingAssignments.some(
        (a) => (a?.roleContext || '').toLowerCase() === 'teacher'
      );

    const hasStudentContext =
      enrolledCourses.length > 0 ||
      upcomingAssignments.some(
        (a) => (a?.roleContext || '').toLowerCase() === 'student'
      ) ||
      recentGrades.length > 0;

    const primaryRole = inferPrimaryRole({
      hasTeachingContext,
      hasStudentContext,
    });

    return {
      hasTeachingContext,
      hasStudentContext,
      primaryRole,
      isMixed: primaryRole === 'mixed',
    };
  }, [teachingCourses, enrolledCourses, upcomingAssignments, recentGrades]);

  const roleMetrics = useMemo(() => {
    const teacherAssignments = upcomingAssignments.filter(
      (a) => (a?.roleContext || '').toLowerCase() === 'teacher'
    );
    const studentAssignments = upcomingAssignments.filter(
      (a) => (a?.roleContext || '').toLowerCase() === 'student'
    );

    const ungradedSubmissions = teacherAssignments.reduce(
      (sum, assignment) => sum + toNumber(assignment?.ungradedCount, 0),
      0
    );

    const announcementsPosted = recentAnnouncements.filter((announcement) => {
      const poster = String(announcement?.postedBy || '').toLowerCase();
      const fullName = String(user?.fullName || '').toLowerCase();
      return fullName && poster.includes(fullName);
    }).length;

    const pendingAssignments = studentAssignments.filter((a) =>
      isStudentPendingStatus(a?.status)
    ).length;

    const teacher = {
      coursesTeaching: teachingCourses.length,
      ungradedSubmissions,
      announcementsPosted,
    };

    const student = {
      coursesEnrolled: enrolledCourses.length,
      pendingAssignments,
      recentGrades: recentGrades.length,
    };

    const active =
      roleContext.primaryRole === 'teacher'
        ? teacher
        : roleContext.primaryRole === 'mixed'
          ? {
              coursesTeaching: teacher.coursesTeaching,
              pendingStudentWork: teacher.ungradedSubmissions,
              coursesEnrolled: student.coursesEnrolled,
            }
          : student;

    return { teacher, student, active };
  }, [
    upcomingAssignments,
    recentAnnouncements,
    teachingCourses,
    enrolledCourses,
    recentGrades,
    roleContext.primaryRole,
    user?.fullName,
  ]);

  const view = useMemo(
    () => buildViewMetadata(roleContext.primaryRole),
    [roleContext.primaryRole]
  );

  // Backward-compatible stats currently used by existing dashboard cards.
  const pendingAssignmentsLegacy = upcomingAssignments.filter(
    (a) => !a?.status || (a?.status || '').toLowerCase() === 'pending'
  );

  const avgGrade =
    recentGrades.length > 0
      ? Math.round(
          recentGrades.reduce((sum, grade) => sum + toNumber(grade?.percentage, 0), 0) /
            recentGrades.length
        )
      : null;

  const stats = {
    enrolledCourses: enrolledCourses.length,
    teachingCourses: teachingCourses.length,
    pendingAssignments: pendingAssignmentsLegacy.length,
    avgGrade,
  };

  return {
    isLoading,
    error,

    // Raw dashboard collections
    enrolledCourses,
    teachingCourses,
    upcomingAssignments,
    recentAnnouncements,
    recentGrades,

    // Legacy summary (kept for current UI compatibility)
    stats,

    // New role-context payloads for contextual UX upgrades
    roleContext,
    roleMetrics,
    view,

    refresh: fetchData,
  };
}

export default useDashboard;