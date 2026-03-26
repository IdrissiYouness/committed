import api from './api';
import { API_ENDPOINTS, REMEMBER_ME_KEY, USER_KEY } from '../utils/constants';

/**
 * Dashboard Service
 *
 * Provides all data needed by the home dashboard.
 *
 */

const dashboardService = {
  // ─── Courses ───────────────────────────────────────────────────────────────

  /**
   * Returns courses the authenticated user is enrolled in as a student.
   *
   * Expected response shape (each item):
   * {
   *   courseId:    number,
   *   courseCode:  string,
   *   courseName:  string,
   *   subject:     string | null,
   *   section:     string | null,
   *   teacherName: string,
   *   isOpen:      boolean,
   * }
   *
   * @returns {Promise<Array>}
   */
  getEnrolledCourses: async () => {
    const courses = await api.get(API_ENDPOINTS.COURSES.LIST);
    const rememberMe = JSON.parse(localStorage.getItem(REMEMBER_ME_KEY) ?? 'false');
    const storage = rememberMe ? localStorage : sessionStorage;
    const user = JSON.parse(storage.getItem(USER_KEY) ?? '{}');
    return courses.filter((c) => c.teacher?.userId != user.userId);
  },

  /**
   * Returns courses the authenticated user owns as a professor (teacher_id).
   *
   * Expected response shape (each item):
   * {
   *   courseId:        number,
   *   courseCode:      string,
   *   courseName:      string,
   *   subject:         string | null,
   *   section:         string | null,
   *   enrollmentCount: number,
   *   isOpen:          boolean,
   * }
   *
   * @returns {Promise<Array>}
   */
  getTeachingCourses: async () => {
    const courses = await api.get(API_ENDPOINTS.COURSES.LIST);
    const rememberMe = JSON.parse(localStorage.getItem(REMEMBER_ME_KEY) ?? 'false');
    const storage = rememberMe ? localStorage : sessionStorage;
    const user = JSON.parse(storage.getItem(USER_KEY) ?? '{}');
    return courses.filter((c) => c.teacher?.userId == user.userId);
  },

  // ─── Assignments ───────────────────────────────────────────────────────────

  /**
   * Returns upcoming (not-yet-submitted) assignments across all enrolled courses.
   *
   * Expected response shape (each item):
   * {
   *   assignmentId: number,
   *   title:        string,
   *   courseName:   string,
   *   courseCode:   string,
   *   dueDate:      string | null,   // ISO-8601
   *   maxPoints:    number,
   *   status:       'pending' | 'submitted' | 'graded' | 'late',
   * }
   *
   * @returns {Promise<Array>}
   */
  getUpcomingAssignments: async () => {
    return [];
  },

  // ─── Announcements ─────────────────────────────────────────────────────────

  /**
   * Returns the most recent announcements from all enrolled/teaching courses.
   *
   * Expected response shape (each item):
   * {
   *   announcementId: number,
   *   title:          string,
   *   courseName:     string,
   *   courseCode:     string,
   *   postedBy:       string,   // full name of the poster
   *   postedAt:       string,   // ISO-8601
   * }
   *
   * @returns {Promise<Array>}
   */
  getRecentAnnouncements: async () => {
    return [];
  },

  // ─── Grades ────────────────────────────────────────────────────────────────

  /**
   * Returns the user's most recently received grades.
   *
   * Expected response shape (each item):
   * {
   *   gradeId:      number,
   *   assignmentId: number,
   *   title:        string,
   *   courseName:   string,
   *   pointsEarned: number,
   *   maxPoints:    number,
   *   percentage:   number,   // 0–100
   *   gradedAt:     string,   // ISO-8601
   * }
   *
   * @returns {Promise<Array>}
   */
  getRecentGrades: async () => {
    return [];
  },
};

export default dashboardService;