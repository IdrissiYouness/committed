-- ============================================================================
-- Committed Database Cleanup Script
-- File: 03_cleanup.sql
-- Run this to completely reset the database to a clean state
-- ============================================================================

-- ============================================================================
-- DROP ALL DATA (Truncate tables - faster than DELETE)
-- ============================================================================

-- Disable foreign key checks by truncating in correct order
-- (child tables first, then parent tables)

-- Attachment tables (no dependencies)
TRUNCATE TABLE assignment_attachment;
TRUNCATE TABLE submission_attachment;
TRUNCATE TABLE announcement_attachment;

-- Code analysis (depends on submission)
TRUNCATE TABLE code_analysis;

-- Grades (depends on submission)
TRUNCATE TABLE grade;

-- Submissions (depends on assignment, users)
TRUNCATE TABLE submission;

-- Assignments (depends on course, users)
TRUNCATE TABLE assignment;

-- Comments (depends on announcement, users, self)
TRUNCATE TABLE comment;

-- Announcements (depends on course, users)
TRUNCATE TABLE announcement;

-- Enrollments (depends on users, course)
TRUNCATE TABLE enrollment;

-- Courses (depends on users)
TRUNCATE TABLE course;

-- Users (base table)
TRUNCATE TABLE users;

-- ============================================================================
-- RESET SEQUENCES
-- ============================================================================

-- Reset all sequences to start from 1
ALTER SEQUENCE seq_user_id RESTART START WITH 1;
ALTER SEQUENCE seq_course_id RESTART START WITH 1;
ALTER SEQUENCE seq_enrollment_id RESTART START WITH 1;
ALTER SEQUENCE seq_announcement_id RESTART START WITH 1;
ALTER SEQUENCE seq_comment_id RESTART START WITH 1;
ALTER SEQUENCE seq_assignment_id RESTART START WITH 1;
ALTER SEQUENCE seq_submission_id RESTART START WITH 1;
ALTER SEQUENCE seq_grade_id RESTART START WITH 1;
ALTER SEQUENCE seq_analysis_id RESTART START WITH 1;
ALTER SEQUENCE seq_attachment_id RESTART START WITH 1;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables are empty
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'course', COUNT(*) FROM course
UNION ALL SELECT 'enrollment', COUNT(*) FROM enrollment
UNION ALL SELECT 'announcement', COUNT(*) FROM announcement
UNION ALL SELECT 'comment', COUNT(*) FROM comment
UNION ALL SELECT 'assignment', COUNT(*) FROM assignment
UNION ALL SELECT 'submission', COUNT(*) FROM submission
UNION ALL SELECT 'grade', COUNT(*) FROM grade
UNION ALL SELECT 'code_analysis', COUNT(*) FROM code_analysis;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
/*
To run this script:

1. Connect to Oracle as the application user:
   docker exec -it committed-oracle sqlplus committed_user/SecurePassword123!@XEPDB1

2. Run the script:
   @/path/to/03_cleanup.sql

Or from command line:
   docker exec -i committed-oracle sqlplus committed_user/SecurePassword123!@XEPDB1 < docker/db/03_cleanup.sql

After cleanup, run 02_seed_data.sql to repopulate with test data.
*/
