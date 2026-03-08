import { useState, useEffect, useCallback } from 'react';

import { useAuthStore } from '../store/authStore';
import dashboardService from '../services/dashboardService';

/**
 * useDashboard
 *
 * Fetches all data needed for the home dashboard in a single call.
 * Runs all requests in parallel via Promise.all for maximum performance.
 *
 * ─── Role awareness ────────────────────────────────────────────────────────────
 * - Admin  : skips course/assignment/grade fetches entirely (not relevant).
 * - User   : fetches enrolled courses, teaching courses, upcoming assignments,
 *            recent announcements, and recent grades in parallel.
 *
 * ─── Extensibility ─────────────────────────────────────────────────────────────
 * When a backend task lands, update dashboardService.js only.
 * This hook and every dashboard component need zero changes.
 *
 * @returns {{
 *   isLoading:           boolean,
 *   error:               string | null,
 *   enrolledCourses:     Array,
 *   teachingCourses:     Array,
 *   upcomingAssignments: Array,
 *   recentAnnouncements: Array,
 *   recentGrades:        Array,
 *   stats: {
 *     enrolledCourses:    number,
 *     teachingCourses:    number,
 *     pendingAssignments: number,
 *     avgGrade:           number | null,
 *   },
 *   refresh: () => void,
 * }}
 */
export function useDashboard() {
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.systemRole?.toLowerCase() === 'admin';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState(null);

  const [enrolledCourses,     setEnrolledCourses]     = useState([]);
  const [teachingCourses,     setTeachingCourses]     = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [recentGrades,        setRecentGrades]        = useState([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isAdmin) {
        // Admin dashboard only needs admin-specific data (AUTH-005).
        // Clear user-specific arrays so derived stats read zero.
        setEnrolledCourses([]);
        setTeachingCourses([]);
        setUpcomingAssignments([]);
        setRecentAnnouncements([]);
        setRecentGrades([]);
      } else {
        // Fetch all sections in parallel — one round trip.
        const [
          enrolled,
          teaching,
          assignments,
          announcements,
          grades,
        ] = await Promise.all([
          dashboardService.getEnrolledCourses(),
          dashboardService.getTeachingCourses(),
          dashboardService.getUpcomingAssignments(),
          dashboardService.getRecentAnnouncements(),
          dashboardService.getRecentGrades(),
        ]);

        setEnrolledCourses(enrolled);
        setTeachingCourses(teaching);
        setUpcomingAssignments(assignments);
        setRecentAnnouncements(announcements);
        setRecentGrades(grades);
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

  // ─── Derived stats ──────────────────────────────────────────────────────────
  // Computed from the loaded arrays so the dashboard page stays declarative.

  const pendingAssignments = upcomingAssignments.filter(
    (a) => !a.status || a.status === 'pending'
  );

  const avgGrade =
    recentGrades.length > 0
      ? Math.round(
          recentGrades.reduce((sum, g) => sum + (g.percentage ?? 0), 0) /
            recentGrades.length
        )
      : null;

  const stats = {
    enrolledCourses:    enrolledCourses.length,
    teachingCourses:    teachingCourses.length,
    pendingAssignments: pendingAssignments.length,
    avgGrade,
  };

  return {
    isLoading,
    error,
    enrolledCourses,
    teachingCourses,
    upcomingAssignments,
    recentAnnouncements,
    recentGrades,
    stats,
    refresh: fetchData,
  };
}

export default useDashboard;