-- ============================================================================
-- Committed Test Data
-- File: 02_seed_data.sql
-- Run this AFTER 01_schema.sql to populate with test data
-- ============================================================================

-- ============================================================================
-- USERS (Passwords are 'password123' hashed with bcrypt)
-- In real app, use proper password hashing
-- ============================================================================

-- Admin user
INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('admin@committed.com', 'System Administrator', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'admin');

-- Professors
INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('prof.smith@committed.com', 'Dr. John Smith', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('prof.johnson@committed.com', 'Dr. Emily Johnson', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('prof.williams@committed.com', 'Dr. Michael Williams', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

-- Students
INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('alice.martin@student.committed.com', 'Alice Martin', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('bob.wilson@student.committed.com', 'Bob Wilson', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('charlie.brown@student.committed.com', 'Charlie Brown', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('diana.ross@student.committed.com', 'Diana Ross', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('edward.lee@student.committed.com', 'Edward Lee', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('fiona.chen@student.committed.com', 'Fiona Chen', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

INSERT INTO users (email, full_name, password_hash, system_role) VALUES
('george.kim@student.committed.com', 'George Kim', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQlBNe8Y5JqKQl9XqKQl9XqKQl9X', 'user');

-- ============================================================================
-- COURSES
-- ============================================================================

-- Prof. Smith's courses
INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('CS101', 'Introduction to Programming', 'Learn the fundamentals of programming using Python. This course covers variables, loops, functions, and basic data structures.', 'Section A', 'Computer Science', 2);

INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('CS201', 'Data Structures and Algorithms', 'Advanced course covering arrays, linked lists, trees, graphs, sorting, and searching algorithms.', 'Section A', 'Computer Science', 2);

-- Prof. Johnson's courses
INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('WEB101', 'Web Development Fundamentals', 'Introduction to HTML, CSS, and JavaScript. Build your first responsive website.', 'Section B', 'Web Development', 3);

INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('WEB201', 'Full Stack Development', 'Learn React, Node.js, and database integration. Build complete web applications.', 'Section B', 'Web Development', 3);

-- Prof. Williams' courses
INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('DB101', 'Database Systems', 'Introduction to relational databases, SQL, and database design principles.', 'Section C', 'Database', 4);

INSERT INTO course (course_code, course_name, description, section, subject, teacher_id) VALUES
('JAVA101', 'Java Programming', 'Object-oriented programming with Java. Covers classes, inheritance, interfaces, and collections.', 'Section C', 'Programming', 4);

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================

-- Enroll professors in their own courses (as professor role)
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (2, 1, 'professor');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (2, 2, 'professor');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (3, 3, 'professor');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (3, 4, 'professor');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (4, 5, 'professor');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (4, 6, 'professor');

-- Alice (user_id=5) enrolled in CS101, WEB101, DB101
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (5, 1, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (5, 3, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (5, 5, 'student');

-- Bob (user_id=6) enrolled in CS101, CS201, JAVA101
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (6, 1, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (6, 2, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (6, 6, 'student');

-- Charlie (user_id=7) enrolled in WEB101, WEB201
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (7, 3, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (7, 4, 'student');

-- Diana (user_id=8) enrolled in CS101, WEB101, WEB201, DB101
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (8, 1, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (8, 3, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (8, 4, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (8, 5, 'student');

-- Edward (user_id=9) enrolled in CS201, DB101, JAVA101
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (9, 2, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (9, 5, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (9, 6, 'student');

-- Fiona (user_id=10) enrolled in all courses
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 1, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 2, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 3, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 4, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 5, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (10, 6, 'student');

-- George (user_id=11) enrolled in CS101, JAVA101
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (11, 1, 'student');
INSERT INTO enrollment (user_id, course_id, course_role) VALUES (11, 6, 'student');

-- ============================================================================
-- ANNOUNCEMENTS
-- ============================================================================

-- CS101 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(2, 1, 'Welcome to CS101!', 'Welcome to Introduction to Programming! In this course, you will learn the fundamentals of programming using Python. Please make sure to install Python 3.11 on your computer before the first lab session. Looking forward to a great semester!');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(2, 1, 'Lab Session Schedule', 'Lab sessions will be held every Wednesday from 2:00 PM to 4:00 PM in Room 301. Attendance is mandatory. Please bring your laptop with Python installed.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(2, 1, 'First Assignment Posted', 'The first assignment "Hello World and Variables" has been posted. Due date is next Friday. Please start early and ask questions if you get stuck!');

-- WEB101 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(3, 3, 'Welcome to Web Development!', 'Hello everyone! Welcome to Web Development Fundamentals. We will be building real websites from scratch. By the end of this course, you will have a portfolio of projects to show employers.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(3, 3, 'Required Tools', 'Please install VS Code and the Live Server extension before our next class. We will also be using Chrome DevTools extensively.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(3, 3, 'Project Teams', 'For the final project, you will work in teams of 2-3. Please form your teams by next week and let me know your team members.');

-- DB101 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(4, 5, 'Database Course Introduction', 'Welcome to Database Systems! This course will teach you how to design, implement, and query relational databases. We will be using Oracle Database for our labs.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(4, 5, 'SQL Practice Resources', 'I have uploaded some SQL practice exercises to help you prepare for the midterm. Practice makes perfect when it comes to writing queries!');

-- CS201 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(2, 2, 'Data Structures Course Start', 'Welcome to Data Structures and Algorithms! This is an advanced course that builds on CS101. Make sure you are comfortable with basic programming concepts.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(2, 2, 'Textbook Information', 'The recommended textbook is "Introduction to Algorithms" by Cormen et al. While not required, it is an excellent reference.');

-- WEB201 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(3, 4, 'Full Stack Development Begins', 'Welcome to Full Stack Development! We will be building complete web applications using React and Node.js. Prerequisites: WEB101 or equivalent experience.');

-- JAVA101 Announcements
INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(4, 6, 'Java Programming Course', 'Welcome to Java Programming! Please install JDK 17 and IntelliJ IDEA (Community Edition is free) before our first class.');

INSERT INTO announcement (posted_by, course_id, title, content) VALUES
(4, 6, 'Office Hours', 'My office hours are Tuesday and Thursday from 3:00 PM to 5:00 PM. Feel free to drop by with any questions about the course material.');

-- ============================================================================
-- COMMENTS ON ANNOUNCEMENTS
-- ============================================================================

-- Comments on CS101 Welcome announcement (announcement_id=1)
INSERT INTO comment (announcement_id, user_id, content) VALUES
(1, 5, 'Thank you Professor! I am excited to learn programming. I have already installed Python.');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(1, 6, 'Looking forward to this course! Quick question - do we need any specific IDE?');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(1, 2, 'Good question Bob! I recommend VS Code or PyCharm. Both are free and work great for Python.');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(1, 8, 'Thanks for the IDE recommendation! I will use VS Code.');

-- Comments on Lab Session announcement (announcement_id=2)
INSERT INTO comment (announcement_id, user_id, content) VALUES
(2, 11, 'Is there a makeup session if we miss a lab due to illness?');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(2, 2, 'Yes George, please email me in advance if you need to miss a lab and we can arrange a makeup session.');

-- Comments on WEB101 Welcome (announcement_id=4)
INSERT INTO comment (announcement_id, user_id, content) VALUES
(4, 7, 'This sounds great! I have always wanted to build websites.');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(4, 8, 'Will we learn about responsive design?');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(4, 3, 'Absolutely Diana! Responsive design is a major part of this course. We will use CSS Flexbox and Grid.');

-- Comments on DB101 Introduction (announcement_id=7)
INSERT INTO comment (announcement_id, user_id, content) VALUES
(7, 5, 'Is Oracle Database free to use for students?');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(7, 4, 'Yes Alice! Oracle offers a free Express Edition that we will use. I will share installation instructions.');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(7, 9, 'I have some experience with MySQL. Will the concepts transfer?');

INSERT INTO comment (announcement_id, user_id, content) VALUES
(7, 4, 'Great question Edward! Yes, SQL is mostly standard across databases. You will pick up Oracle quickly.');

-- Nested comments (replies to comments)
-- Reply to Alice's comment on announcement 1
INSERT INTO comment (announcement_id, user_id, parent_comment_id, content) VALUES
(1, 6, 1, 'Same here Alice! Maybe we can study together?');

INSERT INTO comment (announcement_id, user_id, parent_comment_id, content) VALUES
(1, 5, 15, 'Sure Bob! Let me know when you are free.');

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

-- CS101 Assignments
INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(2, 1, 'Hello World and Variables', 'Write a Python program that prints "Hello, World!" and demonstrates the use of variables. Include examples of strings, integers, and floats.', 100, CURRENT_TIMESTAMP + INTERVAL '7' DAY, 1);

INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(2, 1, 'Loops and Conditionals', 'Create a program that uses if/else statements and loops. Include a number guessing game.', 100, CURRENT_TIMESTAMP + INTERVAL '14' DAY, 1);

INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, allow_late_submission) VALUES
(2, 1, 'Functions Practice', 'Write at least 5 functions that demonstrate different concepts: parameters, return values, default arguments, etc.', 100, CURRENT_TIMESTAMP + INTERVAL '21' DAY, 1);

-- WEB101 Assignments
INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date) VALUES
(3, 3, 'Personal Portfolio Page', 'Create a personal portfolio webpage using HTML and CSS. Include sections for About Me, Skills, and Contact.', 100, CURRENT_TIMESTAMP + INTERVAL '10' DAY);

INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(3, 3, 'Responsive Landing Page', 'Build a responsive landing page for a fictional product. Must work on mobile, tablet, and desktop.', 100, CURRENT_TIMESTAMP + INTERVAL '17' DAY, 1);

-- DB101 Assignments
INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date) VALUES
(4, 5, 'SQL Basics Quiz', 'Complete the SQL basics quiz covering SELECT, INSERT, UPDATE, and DELETE statements.', 50, CURRENT_TIMESTAMP + INTERVAL '5' DAY);

INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(4, 5, 'Database Design Project', 'Design a database schema for an e-commerce application. Include ER diagram and SQL scripts.', 150, CURRENT_TIMESTAMP + INTERVAL '28' DAY, 1);

-- CS201 Assignments
INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(2, 2, 'Linked List Implementation', 'Implement a singly linked list with insert, delete, and search operations.', 100, CURRENT_TIMESTAMP + INTERVAL '14' DAY, 1);

-- JAVA101 Assignments
INSERT INTO assignment (created_by, course_id, title, description, max_points, due_date, require_github_repo) VALUES
(4, 6, 'OOP Basics', 'Create a class hierarchy for a simple banking system with Account, SavingsAccount, and CheckingAccount classes.', 100, CURRENT_TIMESTAMP + INTERVAL '12' DAY, 1);

-- ============================================================================
-- SUBMISSIONS
-- ============================================================================

-- Submissions for CS101 Assignment 1 (Hello World)
INSERT INTO submission (assignment_id, student_id, submission_text, github_repo_url, status) VALUES
(1, 5, 'Completed the Hello World assignment. My code prints the greeting and demonstrates all variable types.', 'https://github.com/alice-martin/cs101-hw1', 'submitted');

INSERT INTO submission (assignment_id, student_id, submission_text, github_repo_url, status) VALUES
(1, 6, 'Here is my submission for the first assignment.', 'https://github.com/bob-wilson/python-basics', 'submitted');

INSERT INTO submission (assignment_id, student_id, submission_text, github_repo_url, status) VALUES
(1, 8, 'Assignment completed! I also added some extra examples.', 'https://github.com/diana-ross/cs101-assignments', 'graded');

INSERT INTO submission (assignment_id, student_id, github_repo_url, status) VALUES
(1, 10, 'https://github.com/fiona-chen/cs101', 'submitted');

INSERT INTO submission (assignment_id, student_id, github_repo_url, status) VALUES
(1, 11, 'https://github.com/george-kim/hello-python', 'pending');

-- Submissions for WEB101 Assignment 1 (Portfolio)
INSERT INTO submission (assignment_id, student_id, submission_text, status) VALUES
(4, 5, 'My portfolio page is ready! I included all required sections plus a projects gallery.', 'submitted');

INSERT INTO submission (assignment_id, student_id, submission_text, status) VALUES
(4, 7, 'Portfolio completed with responsive design.', 'graded');

INSERT INTO submission (assignment_id, student_id, submission_text, status) VALUES
(4, 8, 'Here is my portfolio. I used Flexbox for the layout.', 'submitted');

-- ============================================================================
-- GRADES
-- ============================================================================

-- Grade for Diana's CS101 submission
INSERT INTO grade (submission_id, graded_by, points_earned, max_points, feedback) VALUES
(3, 2, 95, 100, 'Excellent work Diana! Your code is clean and well-documented. The extra examples show great initiative. Minor deduction for missing docstrings.');

-- Grade for Charlie's WEB101 submission
INSERT INTO grade (submission_id, graded_by, points_earned, max_points, feedback) VALUES
(7, 3, 88, 100, 'Good job Charlie! The design is clean and responsive. Consider adding more CSS transitions for a polished feel.');

COMMIT;

-- ============================================================================
-- DATA SUMMARY
-- ============================================================================
/*
Created:
- 11 Users (1 admin, 3 professors, 7 students)
- 6 Courses
- 24 Enrollments
- 13 Announcements
- 16 Comments (including nested replies)
- 9 Assignments
- 8 Submissions
- 2 Grades

User IDs:
1 = Admin
2 = Prof. Smith (CS101, CS201)
3 = Prof. Johnson (WEB101, WEB201)
4 = Prof. Williams (DB101, JAVA101)
5 = Alice (student)
6 = Bob (student)
7 = Charlie (student)
8 = Diana (student)
9 = Edward (student)
10 = Fiona (student)
11 = George (student)

Course IDs:
1 = CS101
2 = CS201
3 = WEB101
4 = WEB201
5 = DB101
6 = JAVA101
*/
