-- ============================================================================
-- Committed Database Cleanup Script (PostgreSQL)
-- File: 03_cleanup.sql
-- Run this to completely reset the database to a clean state
-- ============================================================================

-- ============================================================================
-- DROP ALL DATA (Truncate tables with CASCADE)
-- ============================================================================

-- PostgreSQL TRUNCATE CASCADE handles foreign key dependencies automatically,
-- so we don't need to worry about ordering. We can truncate all tables at once.
TRUNCATE TABLE
    assignment_attachment,
    submission_attachment,
    announcement_attachment,
    code_analysis,
    grade,
    submission,
    assignment,
    comment,
    announcement,
    enrollment,
    course,
    users
CASCADE;

-- ============================================================================
-- RESET IDENTITY SEQUENCES
-- ============================================================================

-- Reset all identity columns to start from 1
ALTER TABLE users ALTER COLUMN user_id RESTART WITH 1;
ALTER TABLE course ALTER COLUMN course_id RESTART WITH 1;
ALTER TABLE announcement ALTER COLUMN announcement_id RESTART WITH 1;
ALTER TABLE comment ALTER COLUMN comment_id RESTART WITH 1;
ALTER TABLE assignment ALTER COLUMN assignment_id RESTART WITH 1;
ALTER TABLE submission ALTER COLUMN submission_id RESTART WITH 1;
ALTER TABLE grade ALTER COLUMN grade_id RESTART WITH 1;
ALTER TABLE code_analysis ALTER COLUMN analysis_id RESTART WITH 1;
ALTER TABLE announcement_attachment ALTER COLUMN attachment_id RESTART WITH 1;
ALTER TABLE submission_attachment ALTER COLUMN attachment_id RESTART WITH 1;
ALTER TABLE assignment_attachment ALTER COLUMN attachment_id RESTART WITH 1;

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
UNION ALL SELECT 'code_analysis', COUNT(*) FROM code_analysis
UNION ALL SELECT 'announcement_attachment', COUNT(*) FROM announcement_attachment
UNION ALL SELECT 'submission_attachment', COUNT(*) FROM submission_attachment
UNION ALL SELECT 'assignment_attachment', COUNT(*) FROM assignment_attachment;

-- ============================================================================
-- USAGE INSTRUCTIONS
-- ============================================================================
/*
To run this script:

1. Connect to PostgreSQL:
   docker exec -it committed-postgres psql -U core_user -d committed_core

2. Run the script:
   \i /path/to/03_cleanup.sql

Or from command line:
   docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/03_cleanup.sql

After cleanup, run 02_seed_data.sql to repopulate with test data.
*/
