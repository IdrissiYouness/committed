import api from './api';
import { API_ENDPOINTS, REMEMBER_ME_KEY, USER_KEY } from '../utils/constants';

/**
 * Dashboard Service
 *
 * Provides role-aware dashboard data from real backend endpoints:
 * - Courses
 * - Assignments
 * - Submissions
 * - Announcements
 * - Grades
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function parseJSON(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getCurrentUserFromStorage() {
  const rememberMe = parseJSON(localStorage.getItem(REMEMBER_ME_KEY), false);
  const preferredStorage = rememberMe ? localStorage : sessionStorage;

  const preferredUser = parseJSON(preferredStorage.getItem(USER_KEY), null);
  if (preferredUser?.userId) return preferredUser;

  const localUser = parseJSON(localStorage.getItem(USER_KEY), null);
  if (localUser?.userId) return localUser;

  const sessionUser = parseJSON(sessionStorage.getItem(USER_KEY), null);
  if (sessionUser?.userId) return sessionUser;

  return null;
}

function normalizeList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.content)) return payload.content;
  if (Array.isArray(payload.items)) return payload.items;
  return [];
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function daysUntil(dateString) {
  if (!dateString) return null;
  const due = new Date(dateString);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return Math.round((dueDay - today) / DAY_MS);
}

function summarizeDueState(dueDate) {
  const diffDays = daysUntil(dueDate);
  if (diffDays == null) return 'no_due_date';
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

function mapCourse(course) {
  return {
    ...course,
    courseId: course?.courseId,
    courseCode: course?.courseCode,
    courseName: course?.courseName,
    subject: course?.subject ?? null,
    section: course?.section ?? null,
    isOpen: course?.isOpen ?? true,
  };
}

function mapAnnouncement(course, announcement) {
  const title = announcement?.title || 'Untitled Announcement';
  const content = announcement?.content || '';
  const preview = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
    .slice(0, 180);

  const posterName =
    announcement?.author?.fullName ||
    announcement?.postedBy?.fullName ||
    announcement?.postedByName ||
    (announcement?.postedBy ? `User #${announcement.postedBy}` : 'Instructor');

  return {
    announcementId: announcement?.announcementId ?? announcement?.id,
    title,
    content,
    preview,
    courseId: course?.courseId,
    courseName: course?.courseName,
    courseCode: course?.courseCode,
    postedBy: posterName,
    postedAt: announcement?.postedAt || announcement?.createdAt || null,
    commentCount: toNumber(announcement?.commentCount, 0),
  };
}

function mapGrade(grade) {
  const pointsEarned = toNumber(grade?.pointsEarned, 0);
  const maxPoints = toNumber(grade?.maxPoints, 0);
  const percentage =
    grade?.percentage != null
      ? Math.round(Number(grade.percentage))
      : maxPoints > 0
        ? Math.round((pointsEarned / maxPoints) * 100)
        : 0;

  return {
    gradeId: grade?.gradeId ?? grade?.id,
    assignmentId: grade?.assignmentId ?? null,
    submissionId: grade?.submissionId ?? null,
    title: grade?.assignmentTitle || grade?.title || `Assignment #${grade?.assignmentId ?? ''}`.trim(),
    courseName: grade?.courseName || 'Course',
    pointsEarned,
    maxPoints,
    percentage,
    gradedAt: grade?.gradedAt || grade?.updatedAt || grade?.createdAt || null,
    feedback: grade?.feedback ?? null,
  };
}

async function safeGet(url, config = {}) {
  try {
    return await api.get(url, config);
  } catch (error) {
    if (error?.status === 401) throw error;
    return null;
  }
}

async function getAllCoursesRaw() {
  const payload = await safeGet(API_ENDPOINTS.COURSES.LIST);
  return normalizeList(payload).map(mapCourse);
}

async function getAssignmentsByCourse(courseId) {
  const payload = await safeGet(`/api/courses/${courseId}/assignments`);
  return normalizeList(payload);
}

async function getSubmissionsByAssignment(assignmentId) {
  const payload = await safeGet(API_ENDPOINTS.ASSIGNMENTS.SUBMISSIONS(assignmentId));
  return normalizeList(payload);
}

async function getAnnouncementsByCourse(courseId) {
  const payload = await safeGet(`/api/courses/${courseId}/announcements`, {
    params: { page: 0, size: 50 },
  });
  return normalizeList(payload);
}

const dashboardService = {
  getEnrolledCourses: async () => {
    const user = getCurrentUserFromStorage();
    const userId = Number(user?.userId);

    const courses = await getAllCoursesRaw();
    return courses.filter((course) => Number(course?.teacher?.userId) !== userId);
  },

  getTeachingCourses: async () => {
    const user = getCurrentUserFromStorage();
    const userId = Number(user?.userId);

    const courses = await getAllCoursesRaw();
    return courses.filter((course) => Number(course?.teacher?.userId) === userId);
  },

  getUpcomingAssignments: async () => {
    const user = getCurrentUserFromStorage();
    const userId = Number(user?.userId);

    const courses = await getAllCoursesRaw();
    if (courses.length === 0) return [];

    const assignmentsPerCourse = await Promise.all(
      courses.map(async (course) => {
        const isTeacherContext = Number(course?.teacher?.userId) === userId;
        const assignments = await getAssignmentsByCourse(course.courseId);

        const mapped = await Promise.all(
          assignments.map(async (assignment) => {
            const assignmentId = assignment?.assignmentId ?? assignment?.id;
            const submissions = await getSubmissionsByAssignment(assignmentId);

            if (isTeacherContext) {
              const gradedCount = submissions.filter(
                (s) => (s?.status || '').toLowerCase() === 'graded'
              ).length;

              const dueState = summarizeDueState(assignment?.dueDate);
              const status =
                dueState === 'overdue'
                  ? 'closed'
                  : submissions.length === 0
                    ? 'awaiting_submissions'
                    : 'open';

              return {
                assignmentId,
                title: assignment?.title,
                courseId: course?.courseId,
                courseName: course?.courseName,
                courseCode: course?.courseCode,
                dueDate: assignment?.dueDate ?? null,
                maxPoints: assignment?.maxPoints ?? null,
                roleContext: 'teacher',
                status,
                dueState,
                submissionsCount: submissions.length,
                gradedCount,
                ungradedCount: Math.max(submissions.length - gradedCount, 0),
              };
            }

            const latestSubmission = getLatestSubmission(submissions);
            const submissionStatus = (latestSubmission?.status || '').toLowerCase();
            const dueState = summarizeDueState(assignment?.dueDate);

            let status = 'pending';
            if (submissionStatus === 'graded') status = 'graded';
            else if (submissionStatus === 'submitted') status = 'submitted';
            else if (submissionStatus === 'late') status = 'late';
            else if (dueState === 'overdue') status = 'missing';

            return {
              assignmentId,
              title: assignment?.title,
              courseId: course?.courseId,
              courseName: course?.courseName,
              courseCode: course?.courseCode,
              dueDate: assignment?.dueDate ?? null,
              maxPoints: assignment?.maxPoints ?? null,
              roleContext: 'student',
              status,
              dueState,
              submissionId: latestSubmission?.submissionId ?? null,
              submittedAt: latestSubmission?.submittedAt ?? null,
            };
          })
        );

        return mapped;
      })
    );

    const flat = assignmentsPerCourse.flat();

    return flat.sort((a, b) => {
      const aDue = a?.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDue = b?.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDue - bDue;
    });
  },

  getRecentAnnouncements: async () => {
    const courses = await getAllCoursesRaw();
    if (courses.length === 0) return [];

    const all = await Promise.all(
      courses.map(async (course) => {
        const announcements = await getAnnouncementsByCourse(course.courseId);
        return announcements.map((announcement) => mapAnnouncement(course, announcement));
      })
    );

    return all
      .flat()
      .sort((a, b) => {
        const aTime = new Date(a?.postedAt || 0).getTime();
        const bTime = new Date(b?.postedAt || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 20);
  },

  getRecentGrades: async () => {
    const payload = await safeGet(API_ENDPOINTS.GRADES.RECENT);
    const grades = normalizeList(payload).map(mapGrade);

    return grades.sort((a, b) => {
      const aTime = new Date(a?.gradedAt || 0).getTime();
      const bTime = new Date(b?.gradedAt || 0).getTime();
      return bTime - aTime;
    });
  },

  /**
   * Optional role-aware metrics provider for pages that want contextual cards:
   * - Teacher: coursesTeaching, ungradedSubmissions, announcementsPosted
   * - Student: coursesEnrolled, pendingAssignments, recentGrades
   */
  getRoleAwareMetrics: async () => {
    const user = getCurrentUserFromStorage();
    const userId = Number(user?.userId);

    const [courses, upcomingAssignments, recentAnnouncements, recentGrades] = await Promise.all([
      getAllCoursesRaw(),
      dashboardService.getUpcomingAssignments(),
      dashboardService.getRecentAnnouncements(),
      dashboardService.getRecentGrades(),
    ]);

    const teachingCourses = courses.filter((c) => Number(c?.teacher?.userId) === userId);
    const enrolledCourses = courses.filter((c) => Number(c?.teacher?.userId) !== userId);

    const teacherAssignments = upcomingAssignments.filter((a) => a.roleContext === 'teacher');
    const studentAssignments = upcomingAssignments.filter((a) => a.roleContext === 'student');

    const ungradedSubmissions = teacherAssignments.reduce(
      (sum, a) => sum + toNumber(a?.ungradedCount, 0),
      0
    );

    const announcementsPosted = recentAnnouncements.filter((a) => {
      const poster = (a?.postedBy || '').toLowerCase();
      return poster.includes(String(user?.fullName || '').toLowerCase());
    }).length;

    const pendingAssignments = studentAssignments.filter((a) =>
      ['pending', 'missing', 'overdue', 'late'].includes((a?.status || '').toLowerCase())
    ).length;

    return {
      teacher: {
        coursesTeaching: teachingCourses.length,
        ungradedSubmissions,
        announcementsPosted,
      },
      student: {
        coursesEnrolled: enrolledCourses.length,
        pendingAssignments,
        recentGrades: recentGrades.length,
      },
    };
  },
};

export default dashboardService;