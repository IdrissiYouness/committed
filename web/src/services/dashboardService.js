import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Dashboard Service
 *
 * Provides all data needed by the home dashboard.
 *
 * ─── Current state ────────────────────────────────────────────────────────────
 * All functions return empty arrays / zero objects while the corresponding
 * backend tasks are not yet implemented.  When a backend task lands, replace
 * the stub body with the real `api.get(...)` call — the hook and components
 * need no changes at all.
 *
 * ─── Wiring guide ─────────────────────────────────────────────────────────────
 * | Function               | Unblock when   | Endpoint                        |
 * |------------------------|----------------|---------------------------------|
 * | getEnrolledCourses     | COURSE-002     | GET /api/courses/enrolled       |
 * | getTeachingCourses     | COURSE-001     | GET /api/courses/teaching       |
 * | getUpcomingAssignments | ASSIGN-001     | GET /api/assignments/upcoming   |
 * | getRecentAnnouncements | COURSE-004     | GET /api/announcements/recent   |
 * | getRecentGrades        | GRADE-001      | GET /api/grades/recent          |
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
    // TODO: COURSE-002 — replace stub when enrollment API is ready
    // return api.get(API_ENDPOINTS.COURSES.ENROLLED);
    void api; void API_ENDPOINTS; // suppress unused-import warnings until wired
    return [];
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
    // TODO: COURSE-001 — replace stub when course API is ready
    // return api.get(API_ENDPOINTS.COURSES.TEACHING);
    return [];
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
    // TODO: ASSIGN-001 — replace stub when assignment API is ready
    // return api.get(API_ENDPOINTS.ASSIGNMENTS.UPCOMING);
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
    // TODO: COURSE-004 — replace stub when announcements API is ready
    // return api.get(API_ENDPOINTS.ANNOUNCEMENTS.RECENT);
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
    // TODO: GRADE-001 — replace stub when grades API is ready
    // return api.get(API_ENDPOINTS.GRADES.RECENT);
    return [];
  },
};

export default dashboardService;