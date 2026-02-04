-- ============================================================================
-- Committed Database Schema
-- Learning Management System
-- File: 01_schema.sql
-- Run this FIRST to create the database structure
-- ============================================================================

-- ============================================================================
-- CREATE SEQUENCES
-- ============================================================================

CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_course_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_enrollment_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_announcement_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_comment_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_assignment_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_submission_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_grade_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_analysis_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_attachment_id START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- USER TABLE
-- ============================================================================

CREATE TABLE users (
    user_id NUMBER PRIMARY KEY,
    email VARCHAR2(255) UNIQUE NOT NULL,
    full_name VARCHAR2(255) NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    system_role VARCHAR2(20) DEFAULT 'user' NOT NULL 
        CHECK (system_role IN ('user', 'admin')),
    is_active NUMBER(1) DEFAULT 1 NOT NULL 
        CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_system_role ON users(system_role);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE OR REPLACE TRIGGER trg_users_bi
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    IF :NEW.user_id IS NULL THEN
        SELECT seq_user_id.NEXTVAL INTO :NEW.user_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_users_bu
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- COURSE TABLE
-- ============================================================================

CREATE TABLE course (
    course_id NUMBER PRIMARY KEY,
    course_code VARCHAR2(50) UNIQUE NOT NULL,
    course_name VARCHAR2(255) NOT NULL,
    description CLOB,
    section VARCHAR2(50),
    subject VARCHAR2(100),
    is_open NUMBER(1) DEFAULT 1 NOT NULL 
        CHECK (is_open IN (0, 1)),
    is_active NUMBER(1) DEFAULT 1 NOT NULL 
        CHECK (is_active IN (0, 1)),
    teacher_id NUMBER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_course_teacher FOREIGN KEY (teacher_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_course_code ON course(course_code);
CREATE INDEX idx_course_teacher ON course(teacher_id);
CREATE INDEX idx_course_is_active ON course(is_active);

CREATE OR REPLACE TRIGGER trg_course_bi
BEFORE INSERT ON course
FOR EACH ROW
BEGIN
    IF :NEW.course_id IS NULL THEN
        SELECT seq_course_id.NEXTVAL INTO :NEW.course_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_course_bu
BEFORE UPDATE ON course
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- ENROLLMENT TABLE
-- ============================================================================

CREATE TABLE enrollment (
    user_id NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    course_role VARCHAR2(20) DEFAULT 'student' NOT NULL 
        CHECK (course_role IN ('student', 'professor')),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT pk_enrollment PRIMARY KEY (user_id, course_id),
    CONSTRAINT fk_enrollment_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_enrollment_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON DELETE CASCADE
);

CREATE INDEX idx_enrollment_user ON enrollment(user_id);
CREATE INDEX idx_enrollment_course ON enrollment(course_id);
CREATE INDEX idx_enrollment_role ON enrollment(course_role);

-- ============================================================================
-- ANNOUNCEMENT TABLE
-- ============================================================================

CREATE TABLE announcement (
    announcement_id NUMBER PRIMARY KEY,
    posted_by NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    title VARCHAR2(500) NOT NULL,
    content CLOB NOT NULL,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_announcement_user FOREIGN KEY (posted_by) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_announcement_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON DELETE CASCADE
);

CREATE INDEX idx_announcement_posted_by ON announcement(posted_by);
CREATE INDEX idx_announcement_course ON announcement(course_id);
CREATE INDEX idx_announcement_posted_at ON announcement(posted_at);

CREATE OR REPLACE TRIGGER trg_announcement_bi
BEFORE INSERT ON announcement
FOR EACH ROW
BEGIN
    IF :NEW.announcement_id IS NULL THEN
        SELECT seq_announcement_id.NEXTVAL INTO :NEW.announcement_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_announcement_bu
BEFORE UPDATE ON announcement
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- COMMENT TABLE
-- ============================================================================

CREATE TABLE comment (
    comment_id NUMBER PRIMARY KEY,
    announcement_id NUMBER NOT NULL,
    user_id NUMBER NOT NULL,
    parent_comment_id NUMBER,
    content CLOB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_comment_announcement FOREIGN KEY (announcement_id) 
        REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parent_comment_id) 
        REFERENCES comment(comment_id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_announcement ON comment(announcement_id);
CREATE INDEX idx_comment_user ON comment(user_id);
CREATE INDEX idx_comment_parent ON comment(parent_comment_id);
CREATE INDEX idx_comment_created_at ON comment(created_at);

CREATE OR REPLACE TRIGGER trg_comment_bi
BEFORE INSERT ON comment
FOR EACH ROW
BEGIN
    IF :NEW.comment_id IS NULL THEN
        SELECT seq_comment_id.NEXTVAL INTO :NEW.comment_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_comment_bu
BEFORE UPDATE ON comment
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- ASSIGNMENT TABLE
-- ============================================================================

CREATE TABLE assignment (
    assignment_id NUMBER PRIMARY KEY,
    created_by NUMBER NOT NULL,
    course_id NUMBER NOT NULL,
    title VARCHAR2(500) NOT NULL,
    description CLOB,
    max_points NUMBER(6,2) DEFAULT 100.00 NOT NULL,
    due_date TIMESTAMP,
    allow_late_submission NUMBER(1) DEFAULT 0 NOT NULL 
        CHECK (allow_late_submission IN (0, 1)),
    require_github_repo NUMBER(1) DEFAULT 0 NOT NULL 
        CHECK (require_github_repo IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_assignment_user FOREIGN KEY (created_by) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignment_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON DELETE CASCADE
);

CREATE INDEX idx_assignment_created_by ON assignment(created_by);
CREATE INDEX idx_assignment_course ON assignment(course_id);
CREATE INDEX idx_assignment_due_date ON assignment(due_date);

CREATE OR REPLACE TRIGGER trg_assignment_bi
BEFORE INSERT ON assignment
FOR EACH ROW
BEGIN
    IF :NEW.assignment_id IS NULL THEN
        SELECT seq_assignment_id.NEXTVAL INTO :NEW.assignment_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_assignment_bu
BEFORE UPDATE ON assignment
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- SUBMISSION TABLE
-- ============================================================================

CREATE TABLE submission (
    submission_id NUMBER PRIMARY KEY,
    assignment_id NUMBER NOT NULL,
    student_id NUMBER NOT NULL,
    submission_text CLOB,
    github_repo_url VARCHAR2(500),
    status VARCHAR2(50) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'submitted', 'graded', 'late', 'returned')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_submission_assignment FOREIGN KEY (assignment_id) 
        REFERENCES assignment(assignment_id) ON DELETE CASCADE,
    CONSTRAINT fk_submission_student FOREIGN KEY (student_id) 
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_submission_assignment ON submission(assignment_id);
CREATE INDEX idx_submission_student ON submission(student_id);
CREATE INDEX idx_submission_status ON submission(status);
CREATE INDEX idx_submission_submitted_at ON submission(submitted_at);

CREATE OR REPLACE TRIGGER trg_submission_bi
BEFORE INSERT ON submission
FOR EACH ROW
BEGIN
    IF :NEW.submission_id IS NULL THEN
        SELECT seq_submission_id.NEXTVAL INTO :NEW.submission_id FROM dual;
    END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_submission_bu
BEFORE UPDATE ON submission
FOR EACH ROW
BEGIN
    :NEW.updated_at := CURRENT_TIMESTAMP;
END;
/

-- ============================================================================
-- GRADE TABLE
-- ============================================================================

CREATE TABLE grade (
    grade_id NUMBER PRIMARY KEY,
    submission_id NUMBER UNIQUE NOT NULL,
    graded_by NUMBER NOT NULL,
    points_earned NUMBER(6,2) NOT NULL,
    max_points NUMBER(6,2) NOT NULL,
    feedback CLOB,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_grade_submission FOREIGN KEY (submission_id) 
        REFERENCES submission(submission_id) ON DELETE CASCADE,
    CONSTRAINT fk_grade_grader FOREIGN KEY (graded_by) 
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_grade_points CHECK (points_earned <= max_points)
);

CREATE INDEX idx_grade_submission ON grade(submission_id);
CREATE INDEX idx_grade_graded_by ON grade(graded_by);
CREATE INDEX idx_grade_graded_at ON grade(graded_at);

CREATE OR REPLACE TRIGGER trg_grade_bi
BEFORE INSERT ON grade
FOR EACH ROW
BEGIN
    IF :NEW.grade_id IS NULL THEN
        SELECT seq_grade_id.NEXTVAL INTO :NEW.grade_id FROM dual;
    END IF;
END;
/

-- ============================================================================
-- CODE_ANALYSIS TABLE
-- ============================================================================

CREATE TABLE code_analysis (
    analysis_id NUMBER PRIMARY KEY,
    submission_id NUMBER UNIQUE NOT NULL,
    status VARCHAR2(50) DEFAULT 'pending' NOT NULL 
        CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    metrics_data CLOB,
    report_pdf_url VARCHAR2(500),
    error_message CLOB,
    analyzed_at TIMESTAMP,
    CONSTRAINT fk_code_analysis_submission FOREIGN KEY (submission_id) 
        REFERENCES submission(submission_id) ON DELETE CASCADE
);

CREATE INDEX idx_code_analysis_submission ON code_analysis(submission_id);
CREATE INDEX idx_code_analysis_status ON code_analysis(status);

CREATE OR REPLACE TRIGGER trg_code_analysis_bi
BEFORE INSERT ON code_analysis
FOR EACH ROW
BEGIN
    IF :NEW.analysis_id IS NULL THEN
        SELECT seq_analysis_id.NEXTVAL INTO :NEW.analysis_id FROM dual;
    END IF;
END;
/

-- ============================================================================
-- ANNOUNCEMENT_ATTACHMENT TABLE
-- ============================================================================

CREATE TABLE announcement_attachment (
    attachment_id NUMBER PRIMARY KEY,
    announcement_id NUMBER NOT NULL,
    file_name VARCHAR2(500) NOT NULL,
    file_path VARCHAR2(1000) NOT NULL,
    file_type VARCHAR2(100),
    file_size NUMBER,
    uploaded_by NUMBER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_ann_attach_announcement FOREIGN KEY (announcement_id) 
        REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    CONSTRAINT fk_ann_attach_user FOREIGN KEY (uploaded_by) 
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_ann_attach_announcement ON announcement_attachment(announcement_id);
CREATE INDEX idx_ann_attach_uploaded_by ON announcement_attachment(uploaded_by);

CREATE OR REPLACE TRIGGER trg_ann_attach_bi
BEFORE INSERT ON announcement_attachment
FOR EACH ROW
BEGIN
    IF :NEW.attachment_id IS NULL THEN
        SELECT seq_attachment_id.NEXTVAL INTO :NEW.attachment_id FROM dual;
    END IF;
END;
/

-- ============================================================================
-- SUBMISSION_ATTACHMENT TABLE
-- ============================================================================

CREATE TABLE submission_attachment (
    attachment_id NUMBER PRIMARY KEY,
    submission_id NUMBER NOT NULL,
    file_name VARCHAR2(500) NOT NULL,
    file_path VARCHAR2(1000) NOT NULL,
    file_type VARCHAR2(100),
    file_size NUMBER,
    uploaded_by NUMBER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_sub_attach_submission FOREIGN KEY (submission_id) 
        REFERENCES submission(submission_id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_attach_user FOREIGN KEY (uploaded_by) 
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_sub_attach_submission ON submission_attachment(submission_id);
CREATE INDEX idx_sub_attach_uploaded_by ON submission_attachment(uploaded_by);

CREATE OR REPLACE TRIGGER trg_sub_attach_bi
BEFORE INSERT ON submission_attachment
FOR EACH ROW
BEGIN
    IF :NEW.attachment_id IS NULL THEN
        SELECT seq_attachment_id.NEXTVAL INTO :NEW.attachment_id FROM dual;
    END IF;
END;
/

-- ============================================================================
-- ASSIGNMENT_ATTACHMENT TABLE
-- ============================================================================

CREATE TABLE assignment_attachment (
    attachment_id NUMBER PRIMARY KEY,
    assignment_id NUMBER NOT NULL,
    file_name VARCHAR2(500) NOT NULL,
    file_path VARCHAR2(1000) NOT NULL,
    file_type VARCHAR2(100),
    file_size NUMBER,
    uploaded_by NUMBER NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_assign_attach_assignment FOREIGN KEY (assignment_id) 
        REFERENCES assignment(assignment_id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_attach_user FOREIGN KEY (uploaded_by) 
        REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_assign_attach_assignment ON assignment_attachment(assignment_id);
CREATE INDEX idx_assign_attach_uploaded_by ON assignment_attachment(uploaded_by);

CREATE OR REPLACE TRIGGER trg_assign_attach_bi
BEFORE INSERT ON assignment_attachment
FOR EACH ROW
BEGIN
    IF :NEW.attachment_id IS NULL THEN
        SELECT seq_attachment_id.NEXTVAL INTO :NEW.attachment_id FROM dual;
    END IF;
END;
/

COMMIT;

-- Schema creation complete!
-- Run 02_seed_data.sql next to populate with test data
