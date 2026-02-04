-- ============================================================================
-- Committed Example SQL Queries
-- File: 04_example_queries.sql
-- Reference file with useful queries for development
-- ============================================================================

-- ============================================================================
-- USER QUERIES
-- ============================================================================

-- Get all users
SELECT user_id, email, full_name, system_role, is_active, created_at
FROM users
ORDER BY user_id;

-- Get user by email (for login)
SELECT user_id, email, full_name, password_hash, system_role, is_active
FROM users
WHERE email = 'alice.martin@student.committed.com';

-- Get user by ID
SELECT user_id, email, full_name, system_role, is_active, created_at
FROM users
WHERE user_id = 5;

-- Get all professors
SELECT u.user_id, u.email, u.full_name
FROM users u
WHERE EXISTS (
    SELECT 1 FROM enrollment e 
    WHERE e.user_id = u.user_id AND e.course_role = 'professor'
);

-- Get all students
SELECT DISTINCT u.user_id, u.email, u.full_name
FROM users u
JOIN enrollment e ON u.user_id = e.user_id
WHERE e.course_role = 'student';

-- ============================================================================
-- COURSE QUERIES
-- ============================================================================

-- Get all active courses
SELECT course_id, course_code, course_name, section, subject, teacher_id
FROM course
WHERE is_active = 1
ORDER BY course_code;

-- Get course with teacher info
SELECT c.course_id, c.course_code, c.course_name, c.description,
       u.full_name AS teacher_name, u.email AS teacher_email
FROM course c
JOIN users u ON c.teacher_id = u.user_id
WHERE c.is_active = 1;

-- Get course by ID with full details
SELECT c.*, u.full_name AS teacher_name
FROM course c
JOIN users u ON c.teacher_id = u.user_id
WHERE c.course_id = 1;

-- Get courses by subject
SELECT course_id, course_code, course_name
FROM course
WHERE subject = 'Computer Science' AND is_active = 1;

-- ============================================================================
-- ENROLLMENT QUERIES
-- ============================================================================

-- Get all courses a student is enrolled in
SELECT c.course_id, c.course_code, c.course_name, c.section,
       u.full_name AS teacher_name, e.enrolled_at
FROM enrollment e
JOIN course c ON e.course_id = c.course_id
JOIN users u ON c.teacher_id = u.user_id
WHERE e.user_id = 5  -- Alice's user_id
  AND e.course_role = 'student'
  AND c.is_active = 1
ORDER BY c.course_name;

-- Get all students in a course
SELECT u.user_id, u.email, u.full_name, e.enrolled_at
FROM enrollment e
JOIN users u ON e.user_id = u.user_id
WHERE e.course_id = 1  -- CS101
  AND e.course_role = 'student'
ORDER BY u.full_name;

-- Count students per course
SELECT c.course_code, c.course_name, COUNT(e.user_id) AS student_count
FROM course c
LEFT JOIN enrollment e ON c.course_id = e.course_id AND e.course_role = 'student'
GROUP BY c.course_id, c.course_code, c.course_name
ORDER BY student_count DESC;

-- Check if user is enrolled in a course
SELECT CASE WHEN COUNT(*) > 0 THEN 'YES' ELSE 'NO' END AS is_enrolled
FROM enrollment
WHERE user_id = 5 AND course_id = 1;

-- Get user's role in a course
SELECT course_role
FROM enrollment
WHERE user_id = 2 AND course_id = 1;

-- ============================================================================
-- ANNOUNCEMENT QUERIES
-- ============================================================================

-- Get all announcements for a course (newest first)
SELECT a.announcement_id, a.title, a.content, a.posted_at,
       u.full_name AS posted_by_name
FROM announcement a
JOIN users u ON a.posted_by = u.user_id
WHERE a.course_id = 1  -- CS101
ORDER BY a.posted_at DESC;

-- Get announcements for all courses a student is enrolled in
SELECT a.announcement_id, a.title, a.posted_at,
       c.course_code, c.course_name,
       u.full_name AS posted_by_name
FROM announcement a
JOIN course c ON a.course_id = c.course_id
JOIN users u ON a.posted_by = u.user_id
WHERE a.course_id IN (
    SELECT course_id FROM enrollment WHERE user_id = 5
)
ORDER BY a.posted_at DESC;

-- Get recent announcements (last 7 days)
SELECT a.announcement_id, a.title, c.course_code, a.posted_at
FROM announcement a
JOIN course c ON a.course_id = c.course_id
WHERE a.posted_at >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
ORDER BY a.posted_at DESC;

-- ============================================================================
-- COMMENT QUERIES
-- ============================================================================

-- Get all comments for an announcement (with user info)
SELECT cm.comment_id, cm.content, cm.created_at,
       u.full_name AS commenter_name,
       cm.parent_comment_id
FROM comment cm
JOIN users u ON cm.user_id = u.user_id
WHERE cm.announcement_id = 1
ORDER BY cm.created_at;

-- Get top-level comments only (no replies)
SELECT cm.comment_id, cm.content, cm.created_at,
       u.full_name AS commenter_name
FROM comment cm
JOIN users u ON cm.user_id = u.user_id
WHERE cm.announcement_id = 1
  AND cm.parent_comment_id IS NULL
ORDER BY cm.created_at;

-- Get replies to a specific comment
SELECT cm.comment_id, cm.content, cm.created_at,
       u.full_name AS commenter_name
FROM comment cm
JOIN users u ON cm.user_id = u.user_id
WHERE cm.parent_comment_id = 1
ORDER BY cm.created_at;

-- Count comments per announcement
SELECT a.announcement_id, a.title, COUNT(cm.comment_id) AS comment_count
FROM announcement a
LEFT JOIN comment cm ON a.announcement_id = cm.announcement_id
WHERE a.course_id = 1
GROUP BY a.announcement_id, a.title
ORDER BY comment_count DESC;

-- ============================================================================
-- ASSIGNMENT QUERIES
-- ============================================================================

-- Get all assignments for a course
SELECT assignment_id, title, description, max_points, due_date,
       allow_late_submission, require_github_repo
FROM assignment
WHERE course_id = 1
ORDER BY due_date;

-- Get upcoming assignments for a student (all enrolled courses)
SELECT a.assignment_id, a.title, a.due_date, a.max_points,
       c.course_code, c.course_name
FROM assignment a
JOIN course c ON a.course_id = c.course_id
WHERE a.course_id IN (
    SELECT course_id FROM enrollment WHERE user_id = 5 AND course_role = 'student'
)
AND a.due_date > CURRENT_TIMESTAMP
ORDER BY a.due_date;

-- Get overdue assignments for a student
SELECT a.assignment_id, a.title, a.due_date, c.course_code
FROM assignment a
JOIN course c ON a.course_id = c.course_id
WHERE a.course_id IN (
    SELECT course_id FROM enrollment WHERE user_id = 5 AND course_role = 'student'
)
AND a.due_date < CURRENT_TIMESTAMP
AND NOT EXISTS (
    SELECT 1 FROM submission s 
    WHERE s.assignment_id = a.assignment_id AND s.student_id = 5
)
ORDER BY a.due_date;

-- ============================================================================
-- SUBMISSION QUERIES
-- ============================================================================

-- Get all submissions for an assignment
SELECT s.submission_id, s.status, s.submitted_at, s.github_repo_url,
       u.full_name AS student_name
FROM submission s
JOIN users u ON s.student_id = u.user_id
WHERE s.assignment_id = 1
ORDER BY s.submitted_at;

-- Get a student's submissions for a course
SELECT s.submission_id, a.title AS assignment_title, s.status, s.submitted_at
FROM submission s
JOIN assignment a ON s.assignment_id = a.assignment_id
WHERE s.student_id = 5
  AND a.course_id = 1
ORDER BY s.submitted_at DESC;

-- Get submission with grade
SELECT s.submission_id, s.status, s.submitted_at,
       g.points_earned, g.max_points, g.feedback, g.graded_at
FROM submission s
LEFT JOIN grade g ON s.submission_id = g.submission_id
WHERE s.submission_id = 3;

-- Count submissions by status for an assignment
SELECT status, COUNT(*) AS count
FROM submission
WHERE assignment_id = 1
GROUP BY status;

-- ============================================================================
-- GRADE QUERIES
-- ============================================================================

-- Get all grades for a student
SELECT a.title AS assignment_title, c.course_code,
       g.points_earned, g.max_points, 
       ROUND(g.points_earned / g.max_points * 100, 2) AS percentage,
       g.feedback
FROM grade g
JOIN submission s ON g.submission_id = s.submission_id
JOIN assignment a ON s.assignment_id = a.assignment_id
JOIN course c ON a.course_id = c.course_id
WHERE s.student_id = 8  -- Diana
ORDER BY g.graded_at DESC;

-- Calculate average grade for a course
SELECT c.course_code, c.course_name,
       ROUND(AVG(g.points_earned / g.max_points * 100), 2) AS avg_percentage
FROM grade g
JOIN submission s ON g.submission_id = s.submission_id
JOIN assignment a ON s.assignment_id = a.assignment_id
JOIN course c ON a.course_id = c.course_id
WHERE c.course_id = 1
GROUP BY c.course_id, c.course_code, c.course_name;

-- Get ungraded submissions for a professor
SELECT s.submission_id, a.title AS assignment_title, 
       u.full_name AS student_name, s.submitted_at
FROM submission s
JOIN assignment a ON s.assignment_id = a.assignment_id
JOIN users u ON s.student_id = u.user_id
WHERE a.created_by = 2  -- Prof. Smith
  AND s.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM grade g WHERE g.submission_id = s.submission_id)
ORDER BY s.submitted_at;

-- ============================================================================
-- DASHBOARD QUERIES
-- ============================================================================

-- Student dashboard: courses, upcoming assignments, recent grades
-- Courses count
SELECT COUNT(*) AS enrolled_courses
FROM enrollment
WHERE user_id = 5 AND course_role = 'student';

-- Upcoming assignments count
SELECT COUNT(*) AS upcoming_assignments
FROM assignment a
JOIN enrollment e ON a.course_id = e.course_id
WHERE e.user_id = 5 
  AND e.course_role = 'student'
  AND a.due_date > CURRENT_TIMESTAMP;

-- Professor dashboard: courses taught, pending submissions
-- Courses taught
SELECT COUNT(*) AS courses_taught
FROM enrollment
WHERE user_id = 2 AND course_role = 'professor';

-- Pending submissions to grade
SELECT COUNT(*) AS pending_submissions
FROM submission s
JOIN assignment a ON s.assignment_id = a.assignment_id
WHERE a.created_by = 2
  AND s.status = 'submitted'
  AND NOT EXISTS (SELECT 1 FROM grade g WHERE g.submission_id = s.submission_id);

-- ============================================================================
-- SEARCH QUERIES
-- ============================================================================

-- Search courses by name or code
SELECT course_id, course_code, course_name, description
FROM course
WHERE UPPER(course_name) LIKE UPPER('%programming%')
   OR UPPER(course_code) LIKE UPPER('%CS%');

-- Search users by name or email
SELECT user_id, email, full_name
FROM users
WHERE UPPER(full_name) LIKE UPPER('%smith%')
   OR UPPER(email) LIKE UPPER('%smith%');

-- Search announcements by content
SELECT a.announcement_id, a.title, c.course_code
FROM announcement a
JOIN course c ON a.course_id = c.course_id
WHERE UPPER(a.title) LIKE UPPER('%welcome%')
   OR UPPER(a.content) LIKE UPPER('%welcome%');

-- ============================================================================
-- PAGINATION EXAMPLE
-- ============================================================================

-- Get announcements with pagination (page 1, 10 per page)
SELECT * FROM (
    SELECT a.*, ROWNUM AS rn
    FROM (
        SELECT announcement_id, title, posted_at
        FROM announcement
        WHERE course_id = 1
        ORDER BY posted_at DESC
    ) a
    WHERE ROWNUM <= 10  -- page_size * page_number
)
WHERE rn > 0;  -- page_size * (page_number - 1)

-- ============================================================================
-- USEFUL AGGREGATIONS
-- ============================================================================

-- Course statistics
SELECT 
    c.course_code,
    c.course_name,
    (SELECT COUNT(*) FROM enrollment e WHERE e.course_id = c.course_id AND e.course_role = 'student') AS student_count,
    (SELECT COUNT(*) FROM announcement a WHERE a.course_id = c.course_id) AS announcement_count,
    (SELECT COUNT(*) FROM assignment a WHERE a.course_id = c.course_id) AS assignment_count
FROM course c
WHERE c.is_active = 1;

-- Student progress in a course
SELECT 
    u.full_name,
    (SELECT COUNT(*) FROM assignment a WHERE a.course_id = 1) AS total_assignments,
    (SELECT COUNT(*) FROM submission s 
     JOIN assignment a ON s.assignment_id = a.assignment_id 
     WHERE a.course_id = 1 AND s.student_id = u.user_id) AS submitted,
    (SELECT COUNT(*) FROM grade g 
     JOIN submission s ON g.submission_id = s.submission_id
     JOIN assignment a ON s.assignment_id = a.assignment_id
     WHERE a.course_id = 1 AND s.student_id = u.user_id) AS graded
FROM users u
JOIN enrollment e ON u.user_id = e.user_id
WHERE e.course_id = 1 AND e.course_role = 'student';
