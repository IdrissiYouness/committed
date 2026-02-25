# API Documentation

Complete API contracts for the Committed platform. All services communicate via HTTP REST.

> **Interactive Spec:** See [`openapi.yaml`](./openapi.yaml) for the machine-readable OpenAPI 3.0 specification.
> Load it in [Swagger Editor](https://editor.swagger.io/) or [Swagger UI](https://petstore.swagger.io/) for interactive exploration.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Base URLs & Routing](#base-urls--routing)
- [Authentication](#authentication)
- [Standard Response Format](#standard-response-format)
- [Standard Error Format](#standard-error-format)
- [HTTP Status Codes](#http-status-codes)
- [Pagination](#pagination)
- [Public API Endpoints](#public-api-endpoints)
    - [Health](#health-endpoints)
    - [Auth](#auth-endpoints)
    - [Users](#user-endpoints)
    - [Courses](#course-endpoints)
    - [Enrollments](#enrollment-endpoints)
    - [Assignments](#assignment-endpoints)
    - [Submissions](#submission-endpoints)
    - [Analysis](#analysis-endpoints)
    - [Grades](#grade-endpoints)
    - [Announcements](#announcement-endpoints)
    - [Notifications](#notification-endpoints)
- [Internal Service-to-Service APIs](#internal-service-to-service-apis)
    - [Gateway → Core](#gateway--core)
    - [Gateway → Code Analyzer](#gateway--code-analyzer)
    - [Gateway → Notifications](#gateway--notifications)
    - [Core → Code Analyzer](#core--code-analyzer)
    - [Code Analyzer → Notifications](#code-analyzer--notifications)
- [Notification Types](#notification-types)
- [Testing with cURL](#testing-with-curl)

---

## Architecture Overview

```
Client (Browser)
    │
    ▼
┌──────────┐       ┌──────────────────────────────────────────────────────┐
│  Nginx   │──────▶│  Gateway (Java Spring Boot) :8080                   │
│  :80     │       │  • JWT Authentication                               │
│          │       │  • Request routing & proxying                        │
│  /api/*  │       │  • Rate limiting                                    │
└──────────┘       └──────┬──────────────┬────────────────┬──────────────┘
                          │              │                │
                ┌─────────▼──┐   ┌───────▼────────┐  ┌───▼──────────────┐
                │ Core       │   │ Code Analyzer  │  │ Notifications    │
                │ (Symfony)  │   │ (Flask)        │  │ (.NET Core)      │
                │ :8000      │   │ :5000          │  │ :5001            │
                │            │   │                │  │                  │
                │ • Courses  │──▶│ • Git clone    │  │ • Email (SMTP)   │
                │ • Assign.  │   │ • Code metrics │──▶ • In-app notifs  │
                │ • Submiss. │   │ • AI feedback  │  │ • Templates      │
                │ • Users    │   │ • PDF reports  │  │                  │
                └─────┬──────┘   └───────┬────────┘  └──────────────────┘
                      │                  │
                      ▼                  ▼
               ┌──────────────────────────────┐
               │   PostgreSQL 16 (Alpine)     │
               │   :5432                      │
               └──────────────────────────────┘
```

### Service Communication Map

| From          | To            | Protocol | Purpose                                 |
| ------------- | ------------- | -------- | --------------------------------------- |
| Gateway       | Core          | HTTP     | Proxy CRUD operations for all resources |
| Gateway       | Code Analyzer | HTTP     | Proxy analysis status requests          |
| Gateway       | Notifications | HTTP     | Proxy user notification queries         |
| Core          | Code Analyzer | HTTP     | Trigger code analysis on submission     |
| Code Analyzer | Notifications | HTTP     | Send analysis completion notifications  |

---

## Base URLs & Routing

| Environment | Public URL             | Description             |
| ----------- | ---------------------- | ----------------------- |
| Development | `http://localhost/api` | Via Nginx reverse proxy |

Nginx routes all `/api/*` requests to the Gateway service. The Gateway authenticates the request and proxies it to the appropriate backend service.

### Internal Service URLs (Docker Network)

| Service       | Internal URL                | Direct Access (dev)     |
| ------------- | --------------------------- | ----------------------- |
| Gateway       | `http://gateway:8080`       | `http://localhost:8080` |
| Core          | `http://core:8000`          | `http://localhost:8000` |
| Code Analyzer | `http://code-analyzer:5000` | `http://localhost:5000` |
| Notifications | `http://notifications:5001` | `http://localhost:5001` |
| PostgreSQL    | `postgres-db:5432`          | `localhost:5432`        |

---

## Authentication

All endpoints (except `/api/auth/*` and `/api/health`) require a valid JWT Bearer token.

### Token Flow

1. Client calls `POST /api/auth/login` or `POST /api/auth/register`
2. Gateway validates credentials against the database
3. Gateway returns an `accessToken` (24h TTL) and a `refreshToken` (7d TTL)
4. Client includes the access token in all subsequent requests:
    ```
    Authorization: Bearer <accessToken>
    ```
5. When the access token expires, client calls `POST /api/auth/refresh` with the refresh token

### JWT Payload

```json
{
    "sub": "1",
    "email": "student@committed.com",
    "role": "user",
    "iat": 1706968800,
    "exp": 1707055200
}
```

### Gateway → Backend Forwarding

When the Gateway proxies a request to a backend service, it includes the authenticated user's information via headers:

| Header         | Value              | Description                |
| -------------- | ------------------ | -------------------------- |
| `X-User-Id`    | `1`                | Authenticated user's ID    |
| `X-User-Email` | `user@example.com` | Authenticated user's email |
| `X-User-Role`  | `user` or `admin`  | System role                |

Backend services trust these headers since they are only accessible within the Docker network.

---

## Standard Response Format

### Success Response

All successful responses follow this envelope:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-02-03T13:00:00Z"
}
```

| Field       | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| `success`   | boolean | Always `true` for successful responses |
| `data`      | any     | Response payload (object, array, null) |
| `message`   | string  | Human-readable message                 |
| `timestamp` | string  | ISO 8601 timestamp                     |

---

## Standard Error Format

### Error Response

```json
{
    "success": false,
    "error": "Validation Error",
    "message": "Invalid input data",
    "details": {
        "email": "Email is required",
        "password": "Password must be at least 8 characters"
    },
    "timestamp": "2026-02-03T13:00:00Z"
}
```

| Field       | Type    | Description                                            |
| ----------- | ------- | ------------------------------------------------------ |
| `success`   | boolean | Always `false` for error responses                     |
| `error`     | string  | Error category                                         |
| `message`   | string  | Human-readable error message                           |
| `details`   | object  | Field-level validation errors (only for 400 responses) |
| `timestamp` | string  | ISO 8601 timestamp                                     |

---

## HTTP Status Codes

| Code | Meaning               | When Used                                     |
| ---- | --------------------- | --------------------------------------------- |
| 200  | OK                    | Successful GET, PUT                           |
| 201  | Created               | Successful POST (resource created)            |
| 202  | Accepted              | Async operation triggered (e.g., analysis)    |
| 400  | Bad Request           | Validation error, missing fields              |
| 401  | Unauthorized          | Missing or invalid JWT token                  |
| 403  | Forbidden             | Insufficient permissions                      |
| 404  | Not Found             | Resource does not exist                       |
| 409  | Conflict              | Duplicate resource (e.g., email, course code) |
| 500  | Internal Server Error | Unexpected server error                       |

---

## Pagination

All list endpoints support pagination via query parameters:

| Parameter | Type    | Default | Description               |
| --------- | ------- | ------- | ------------------------- |
| `page`    | integer | 1       | Page number (1-based)     |
| `limit`   | integer | 20      | Items per page (max: 100) |

### Paginated Response Shape

```json
{
  "success": true,
  "data": {
    "data": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  },
  "message": "Retrieved successfully",
  "timestamp": "2026-02-03T13:00:00Z"
}
```

---

## Public API Endpoints

All public endpoints are accessed through `http://localhost/api`.

---

### Health Endpoints

These endpoints do **not** require authentication.

#### `GET /api/health` — Gateway Health Check

**Response `200`:**

```json
{
    "status": "UP",
    "service": "gateway",
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

#### `GET /api/test-chain` — End-to-End Chain Test

Tests Gateway → Core → Database connectivity.

**Response `200` (success):**

```json
{
    "status": "success",
    "message": "End-to-end chain test successful",
    "chain": {
        "gateway": "connected",
        "core": "connected",
        "database": "connected"
    },
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

**Response `200` (partial failure):**

```json
{
    "status": "partial",
    "message": "Core connected but database check failed",
    "chain": {
        "gateway": "connected",
        "core": "connected",
        "database": "disconnected"
    },
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

**Response `200` (error):**

```json
{
    "status": "error",
    "message": "Failed to connect to Core service: Connection refused",
    "chain": {
        "gateway": "connected",
        "core": "disconnected",
        "database": "unknown"
    },
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

---

### Auth Endpoints

Auth endpoints are handled directly by the **Gateway** service. No JWT required.

#### `POST /api/auth/login` — User Login

**Request:**

```json
{
    "email": "student@committed.com",
    "password": "password123"
}
```

| Field      | Type   | Required | Validation         |
| ---------- | ------ | -------- | ------------------ |
| `email`    | string | Yes      | Valid email format |
| `password` | string | Yes      | Min 8 characters   |

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
        "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
        "user": {
            "userId": 1,
            "email": "student@committed.com",
            "fullName": "Jane Doe",
            "systemRole": "user",
            "isActive": true,
            "createdAt": "2026-02-01T10:00:00Z"
        }
    },
    "message": "Login successful",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `401`:** Invalid credentials.

---

#### `POST /api/auth/register` — User Registration

**Request:**

```json
{
    "email": "newstudent@committed.com",
    "fullName": "Jane Doe",
    "password": "securepass123"
}
```

| Field      | Type   | Required | Validation          |
| ---------- | ------ | -------- | ------------------- |
| `email`    | string | Yes      | Valid email, unique |
| `fullName` | string | Yes      | 1–255 characters    |
| `password` | string | Yes      | Min 8 characters    |

**Response `201`:** Same shape as login response.

**Response `409`:** Email already registered.

---

#### `POST /api/auth/refresh` — Refresh Access Token

**Request:**

```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Response `200`:** Same shape as login response (new tokens issued).

**Response `401`:** Invalid or expired refresh token.

---

### User Endpoints

**Service chain:** Gateway → Core

#### `GET /api/users/me` — Get Current User Profile

Returns the authenticated user's profile.

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "userId": 1,
        "email": "student@committed.com",
        "fullName": "Jane Doe",
        "systemRole": "user",
        "isActive": true,
        "createdAt": "2026-02-01T10:00:00Z"
    },
    "message": "User retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `PUT /api/users/me` — Update Current User Profile

**Request:**

```json
{
    "fullName": "Jane M. Doe",
    "email": "jane.doe@committed.com",
    "currentPassword": "oldpassword123",
    "newPassword": "newsecurepass456"
}
```

| Field             | Type   | Required | Description                     |
| ----------------- | ------ | -------- | ------------------------------- |
| `fullName`        | string | No       | Updated display name            |
| `email`           | string | No       | Updated email                   |
| `currentPassword` | string | No\*     | Required when changing password |
| `newPassword`     | string | No\*     | New password (min 8 chars)      |

**Response `200`:** Updated user object.

---

#### `GET /api/users/{userId}` — Get User by ID

Admin only, or the authenticated user requesting their own profile.

**Response `200`:** User object.  
**Response `403`:** Non-admin requesting another user's profile.  
**Response `404`:** User not found.

---

### Course Endpoints

**Service chain:** Gateway → Core

#### `GET /api/courses` — List Courses

Returns courses relevant to the authenticated user:

- **Students:** courses they are enrolled in
- **Professors:** courses they teach
- **Admins:** all courses

| Query Param | Type    | Default | Description                          |
| ----------- | ------- | ------- | ------------------------------------ |
| `page`      | integer | 1       | Page number                          |
| `limit`     | integer | 20      | Items per page                       |
| `search`    | string  | —       | Search by course name or course code |

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "courseId": 1,
                "courseCode": "CS101",
                "courseName": "Introduction to Computer Science",
                "description": "An introductory course covering basic CS concepts.",
                "section": "Section A",
                "subject": "Computer Science",
                "isOpen": true,
                "isActive": true,
                "teacherId": 2,
                "createdAt": "2026-01-15T08:00:00Z",
                "updatedAt": "2026-01-15T08:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 5,
            "pages": 1
        }
    },
    "message": "Courses retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `POST /api/courses` — Create Course

The authenticated user becomes the course teacher.

**Request:**

```json
{
    "courseCode": "CS201",
    "courseName": "Data Structures",
    "description": "Advanced course on data structures and algorithms.",
    "section": "Section B",
    "subject": "Computer Science"
}
```

| Field         | Type   | Required | Validation           |
| ------------- | ------ | -------- | -------------------- |
| `courseCode`  | string | Yes      | Max 50 chars, unique |
| `courseName`  | string | Yes      | Max 255 chars        |
| `description` | string | No       | Max 1000 chars       |
| `section`     | string | No       | Max 50 chars         |
| `subject`     | string | No       | Max 100 chars        |

**Response `201`:** Created course object.  
**Response `409`:** Course code already exists.

---

#### `GET /api/courses/{courseId}` — Get Course

**Response `200`:** Course object.  
**Response `404`:** Course not found.

---

#### `PUT /api/courses/{courseId}` — Update Course

Teacher or admin only.

**Request:**

```json
{
    "courseName": "Data Structures & Algorithms",
    "description": "Updated description.",
    "isOpen": false
}
```

All fields are optional. Only provided fields are updated.

**Response `200`:** Updated course object.  
**Response `403`:** Not the course teacher or admin.

---

#### `DELETE /api/courses/{courseId}` — Delete Course (Soft Delete)

Teacher or admin only. Sets `isActive` to `false`.

**Response `200`:**

```json
{
    "success": true,
    "data": null,
    "message": "Course deleted successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

### Enrollment Endpoints

**Service chain:** Gateway → Core

#### `POST /api/courses/{courseId}/enroll` — Enroll in Course

Enrolls the authenticated user as a student. Course must have `isOpen = true`.

**Response `201`:**

```json
{
    "success": true,
    "data": {
        "userId": 5,
        "courseId": 1,
        "courseRole": "student",
        "enrolledAt": "2026-02-03T13:00:00Z"
    },
    "message": "Enrolled successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `400`:** Already enrolled, or course is not open.

---

#### `DELETE /api/courses/{courseId}/unenroll` — Unenroll from Course

Removes the authenticated user's enrollment.

**Response `200`:** Success with null data.  
**Response `404`:** Not enrolled in this course.

---

#### `GET /api/courses/{courseId}/students` — List Students in Course

Teacher or admin only. Returns enrolled students with user details.

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "userId": 5,
                "courseId": 1,
                "courseRole": "student",
                "enrolledAt": "2026-02-03T13:00:00Z",
                "user": {
                    "userId": 5,
                    "email": "student@committed.com",
                    "fullName": "Jane Doe",
                    "systemRole": "user",
                    "isActive": true,
                    "createdAt": "2026-02-01T10:00:00Z"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 25,
            "pages": 2
        }
    },
    "message": "Students retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

### Assignment Endpoints

**Service chain:** Gateway → Core

#### `GET /api/courses/{courseId}/assignments` — List Course Assignments

Must be enrolled or be the course teacher.

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "assignmentId": 1,
                "courseId": 1,
                "createdBy": 2,
                "title": "Lab 1: Hello World",
                "description": "Write a Hello World program in Python.",
                "maxPoints": 100.0,
                "dueDate": "2026-03-15T23:59:00Z",
                "allowLateSubmission": false,
                "requireGithubRepo": true,
                "createdAt": "2026-02-01T10:00:00Z",
                "updatedAt": "2026-02-01T10:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 3,
            "pages": 1
        }
    },
    "message": "Assignments retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `POST /api/courses/{courseId}/assignments` — Create Assignment

Teacher only.

**Request:**

```json
{
    "title": "Lab 2: Linked Lists",
    "description": "Implement a singly linked list in Java.",
    "maxPoints": 100.0,
    "dueDate": "2026-04-01T23:59:00Z",
    "allowLateSubmission": false,
    "requireGithubRepo": true
}
```

| Field                 | Type    | Required | Default | Description                          |
| --------------------- | ------- | -------- | ------- | ------------------------------------ |
| `title`               | string  | Yes      | —       | Max 500 chars                        |
| `description`         | string  | No       | null    | Assignment instructions              |
| `maxPoints`           | number  | No       | 100.00  | Maximum points available             |
| `dueDate`             | string  | No       | null    | ISO 8601 deadline                    |
| `allowLateSubmission` | boolean | No       | false   | Accept submissions after due date    |
| `requireGithubRepo`   | boolean | No       | false   | Require GitHub URL for code analysis |

**Response `201`:** Created assignment object.

---

#### `GET /api/assignments/{assignmentId}` — Get Assignment

**Response `200`:** Assignment object.

---

#### `PUT /api/assignments/{assignmentId}` — Update Assignment

Teacher only. All fields optional.

**Response `200`:** Updated assignment object.

---

#### `DELETE /api/assignments/{assignmentId}` — Delete Assignment

Teacher only. Cascade-deletes all submissions, grades, and analyses.

**Response `200`:** Success with null data.

---

### Submission Endpoints

**Service chain:** Gateway → Core

#### `GET /api/assignments/{assignmentId}/submissions` — List Submissions

- **Students** see only their own submissions.
- **Teachers** see all submissions for the assignment.

| Query Param | Type   | Description                                                  |
| ----------- | ------ | ------------------------------------------------------------ |
| `page`      | int    | Page number                                                  |
| `limit`     | int    | Items per page                                               |
| `status`    | string | Filter: `pending`, `submitted`, `graded`, `late`, `returned` |

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "submissionId": 1,
                "assignmentId": 1,
                "studentId": 5,
                "submissionText": "See attached GitHub repository.",
                "githubRepoUrl": "https://github.com/student/lab2-linked-lists",
                "status": "submitted",
                "submittedAt": "2026-03-10T14:30:00Z",
                "updatedAt": "2026-03-10T14:30:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 18,
            "pages": 1
        }
    },
    "message": "Submissions retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `POST /api/assignments/{assignmentId}/submissions` — Create Submission

Student only. If the assignment has `requireGithubRepo = true`, `githubRepoUrl` is required. When a GitHub URL is provided, code analysis is triggered automatically.

**Request:**

```json
{
    "submissionText": "Here is my implementation of linked lists.",
    "githubRepoUrl": "https://github.com/student/lab2-linked-lists"
}
```

| Field            | Type   | Required | Description                                            |
| ---------------- | ------ | -------- | ------------------------------------------------------ |
| `submissionText` | string | No       | Text content or notes                                  |
| `githubRepoUrl`  | string | No\*     | GitHub repo URL (\*required if assignment requires it) |

**Response `201`:** Submission object with `status: "submitted"`.

---

#### `GET /api/submissions/{submissionId}` — Get Submission Detail

Returns the submission with analysis results and grade if available.

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "submissionId": 1,
        "assignmentId": 1,
        "studentId": 5,
        "submissionText": "See attached GitHub repository.",
        "githubRepoUrl": "https://github.com/student/lab2-linked-lists",
        "status": "graded",
        "submittedAt": "2026-03-10T14:30:00Z",
        "updatedAt": "2026-03-12T09:00:00Z",
        "analysis": {
            "analysisId": 42,
            "status": "completed",
            "score": 65.5,
            "category": "good",
            "reportPdfUrl": "/reports/analysis_report_1_20260310_150000.pdf",
            "errorMessage": null,
            "analyzedAt": "2026-03-10T15:00:00Z"
        },
        "grade": {
            "gradeId": 1,
            "submissionId": 1,
            "gradedBy": 2,
            "pointsEarned": 85.5,
            "maxPoints": 100.0,
            "feedback": "Good work! Consider adding more unit tests.",
            "gradedAt": "2026-03-12T09:00:00Z"
        },
        "student": {
            "userId": 5,
            "email": "student@committed.com",
            "fullName": "Jane Doe",
            "systemRole": "user",
            "isActive": true,
            "createdAt": "2026-02-01T10:00:00Z"
        }
    },
    "message": "Submission retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

> **Note:** `analysis`, `grade`, and `student` are `null` when not yet available. `student` is only populated when a teacher views the submission.

---

### Analysis Endpoints

**Service chain:** Gateway → Core → Code Analyzer → Notifications

#### `POST /api/submissions/{submissionId}/analyze` — Trigger Code Analysis

Manually trigger analysis for a submission that has a GitHub repo URL. Analysis runs asynchronously.

**Flow:**

1. Gateway validates JWT and forwards to Core
2. Core reads the submission from the database
3. Core sends `POST http://code-analyzer:5000/analyze` with `{submissionId, repoUrl, studentId}`
4. Code Analyzer clones the repo, runs metrics, generates AI feedback, creates PDF report
5. Code Analyzer updates `code_analysis` table and sends notification via `POST http://notifications:5001/api/notifications`
6. Client polls `GET /api/submissions/{id}/analysis` to check status

**Response `202`:**

```json
{
    "success": true,
    "data": {
        "submissionId": 1,
        "analysisId": 42,
        "status": "analyzing",
        "message": "Analysis has been queued"
    },
    "message": "Analysis triggered successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `400`:** Submission has no GitHub repo URL.

---

#### `GET /api/submissions/{submissionId}/analysis` — Get Analysis Results

**Response `200` (completed):**

```json
{
    "success": true,
    "data": {
        "analysisId": 42,
        "submissionId": 1,
        "status": "completed",
        "metrics": {
            "complexity": 45,
            "maintainability": 72,
            "test_coverage": 60,
            "code_smells": 5,
            "documentation": 40
        },
        "classification": {
            "score": 65.5,
            "category": "good",
            "timestamp": "2026-03-10T15:00:00Z"
        },
        "feedback": {
            "category": "good",
            "feedback": "Your code demonstrates solid fundamentals. Here are some suggestions for improvement...",
            "score": 65.5,
            "timestamp": "2026-03-10T15:00:00Z"
        },
        "reportPdfUrl": "/reports/analysis_report_1_20260310_150000.pdf",
        "errorMessage": null,
        "analyzedAt": "2026-03-10T15:00:00Z"
    },
    "message": "Analysis results retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `200` (pending/analyzing):**

```json
{
    "success": true,
    "data": {
        "analysisId": 42,
        "submissionId": 1,
        "status": "analyzing",
        "metrics": null,
        "classification": null,
        "feedback": null,
        "reportPdfUrl": null,
        "errorMessage": null,
        "analyzedAt": null
    },
    "message": "Analysis in progress",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `200` (failed):**

```json
{
    "success": true,
    "data": {
        "analysisId": 42,
        "submissionId": 1,
        "status": "failed",
        "metrics": null,
        "classification": null,
        "feedback": null,
        "reportPdfUrl": null,
        "errorMessage": "Git clone failed: Repository not found",
        "analyzedAt": null
    },
    "message": "Analysis failed",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

#### Analysis Status Values

| Status      | Description                              |
| ----------- | ---------------------------------------- |
| `pending`   | Analysis record created, not yet started |
| `analyzing` | Analysis is in progress                  |
| `completed` | Analysis completed successfully          |
| `failed`    | Analysis encountered an error            |

#### Code Quality Categories

| Category    | Score Range | Description                       |
| ----------- | ----------- | --------------------------------- |
| `excellent` | 80–100      | Outstanding code quality          |
| `good`      | 60–79       | Above average, minor improvements |
| `average`   | 40–59       | Acceptable, room for improvement  |
| `poor`      | 0–39        | Needs significant improvement     |

#### Metrics Breakdown

| Metric            | Weight | Range | Description                    |
| ----------------- | ------ | ----- | ------------------------------ |
| `complexity`      | 30%    | 0–100 | Cyclomatic complexity score    |
| `maintainability` | 25%    | 0–100 | Maintainability index          |
| `test_coverage`   | 20%    | 0–100 | Test coverage percentage       |
| `code_smells`     | 15%    | count | Number of code smells detected |
| `documentation`   | 10%    | 0–100 | Documentation coverage         |

---

### Grade Endpoints

**Service chain:** Gateway → Core

#### `POST /api/submissions/{submissionId}/grade` — Grade a Submission

Teacher only. Updates the submission status to `graded`.

**Request:**

```json
{
    "pointsEarned": 85.5,
    "feedback": "Good work! Consider adding more unit tests."
}
```

| Field          | Type   | Required | Validation                               |
| -------------- | ------ | -------- | ---------------------------------------- |
| `pointsEarned` | number | Yes      | Must not exceed assignment's `maxPoints` |
| `feedback`     | string | No       | Teacher's written feedback               |

**Response `201`:**

```json
{
    "success": true,
    "data": {
        "gradeId": 1,
        "submissionId": 1,
        "gradedBy": 2,
        "pointsEarned": 85.5,
        "maxPoints": 100.0,
        "feedback": "Good work! Consider adding more unit tests.",
        "gradedAt": "2026-03-12T09:00:00Z"
    },
    "message": "Grade assigned successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

**Response `409`:** Submission already graded (use PUT to update).

---

#### `GET /api/submissions/{submissionId}/grade` — Get Grade

**Response `200`:** Grade object.  
**Response `404`:** Not yet graded.

---

#### `PUT /api/submissions/{submissionId}/grade` — Update Grade

Teacher only.

**Request:**

```json
{
    "pointsEarned": 90.0,
    "feedback": "Updated: Excellent improvement after revision."
}
```

**Response `200`:** Updated grade object.

---

### Announcement Endpoints

**Service chain:** Gateway → Core

#### `GET /api/courses/{courseId}/announcements` — List Announcements

Must be enrolled or be the teacher.

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "announcementId": 1,
                "courseId": 1,
                "postedBy": 2,
                "title": "Welcome to CS101!",
                "content": "Welcome to the course. Please review the syllabus.",
                "postedAt": "2026-02-01T10:00:00Z",
                "updatedAt": "2026-02-01T10:00:00Z",
                "author": {
                    "userId": 2,
                    "email": "prof.smith@committed.com",
                    "fullName": "Dr. John Smith",
                    "systemRole": "user",
                    "isActive": true,
                    "createdAt": "2026-01-01T00:00:00Z"
                },
                "commentCount": 3
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 2,
            "pages": 1
        }
    },
    "message": "Announcements retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `POST /api/courses/{courseId}/announcements` — Create Announcement

Teacher only.

**Request:**

```json
{
    "title": "Midterm Exam Schedule",
    "content": "The midterm exam will be held on March 20th at 2:00 PM."
}
```

| Field     | Type   | Required | Validation    |
| --------- | ------ | -------- | ------------- |
| `title`   | string | Yes      | Max 500 chars |
| `content` | string | Yes      | —             |

**Response `201`:** Created announcement object.

---

#### `GET /api/announcements/{announcementId}` — Get Announcement

**Response `200`:** Announcement object.

---

#### `PUT /api/announcements/{announcementId}` — Update Announcement

Teacher only. Fields: `title`, `content` (both optional).

**Response `200`:** Updated announcement object.

---

#### `DELETE /api/announcements/{announcementId}` — Delete Announcement

Teacher only. Cascade-deletes all comments.

**Response `200`:** Success with null data.

---

#### `GET /api/announcements/{announcementId}/comments` — List Comments

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "commentId": 1,
                "announcementId": 1,
                "userId": 5,
                "parentCommentId": null,
                "content": "Thanks for the information!",
                "createdAt": "2026-02-01T12:00:00Z",
                "updatedAt": "2026-02-01T12:00:00Z",
                "author": {
                    "userId": 5,
                    "email": "student@committed.com",
                    "fullName": "Jane Doe",
                    "systemRole": "user",
                    "isActive": true,
                    "createdAt": "2026-02-01T10:00:00Z"
                }
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 3,
            "pages": 1
        }
    },
    "message": "Comments retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `POST /api/announcements/{announcementId}/comments` — Add Comment

Any enrolled user or teacher can comment. Supports threaded replies via `parentCommentId`.

**Request:**

```json
{
    "content": "Thanks for the information!",
    "parentCommentId": null
}
```

| Field             | Type    | Required | Description                            |
| ----------------- | ------- | -------- | -------------------------------------- |
| `content`         | string  | Yes      | Comment text                           |
| `parentCommentId` | integer | No       | Parent comment ID for threaded replies |

**Response `201`:** Created comment object.

---

### Notification Endpoints

**Service chain:** Gateway → Notifications

#### `GET /api/notifications` — Get User Notifications

Returns notifications for the authenticated user.

| Query Param   | Type    | Default | Description                    |
| ------------- | ------- | ------- | ------------------------------ |
| `page`        | integer | 1       | Page number                    |
| `limit`       | integer | 20      | Items per page                 |
| `unread_only` | boolean | false   | Show only unread notifications |

**Response `200`:**

```json
{
    "success": true,
    "data": {
        "data": [
            {
                "notificationId": 42,
                "userId": 5,
                "type": "SUBMISSION_ANALYZED",
                "subject": "Your code has been analyzed",
                "message": "Analysis complete for submission #1. Quality score: 65.5/100 (Good)",
                "isRead": false,
                "readAt": null,
                "emailSentAt": "2026-03-10T15:01:00Z",
                "createdAt": "2026-03-10T15:00:00Z"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 8,
            "pages": 1
        }
    },
    "message": "Notifications retrieved successfully",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `PUT /api/notifications/{notificationId}/read` — Mark as Read

**Response `200`:**

```json
{
    "success": true,
    "data": null,
    "message": "Notification marked as read",
    "timestamp": "2026-02-03T13:00:00Z"
}
```

---

#### `PUT /api/notifications/read-all` — Mark All as Read

**Response `200`:** Success with null data.

---

## Internal Service-to-Service APIs

These endpoints are **not** exposed publicly through Nginx. They are only accessible within the Docker network between services.

---

### Gateway → Core

The Gateway proxies authenticated requests to the Core service, translating public API paths to Core's internal API paths.

| Public Endpoint                     | Core Internal Endpoint                                   | Method         |
| ----------------------------------- | -------------------------------------------------------- | -------------- |
| `/api/users/me`                     | `http://core:8000/api/users/{userId}`                    | GET            |
| `/api/users/me`                     | `http://core:8000/api/users/{userId}`                    | PUT            |
| `/api/users/{userId}`               | `http://core:8000/api/users/{userId}`                    | GET            |
| `/api/courses`                      | `http://core:8000/api/courses?user_id={userId}`          | GET            |
| `/api/courses`                      | `http://core:8000/api/courses`                           | POST           |
| `/api/courses/{id}`                 | `http://core:8000/api/courses/{id}`                      | GET/PUT/DELETE |
| `/api/courses/{id}/enroll`          | `http://core:8000/api/courses/{id}/enroll`               | POST           |
| `/api/courses/{id}/unenroll`        | `http://core:8000/api/courses/{id}/unenroll`             | DELETE         |
| `/api/courses/{id}/students`        | `http://core:8000/api/courses/{id}/students`             | GET            |
| `/api/courses/{id}/assignments`     | `http://core:8000/api/courses/{id}/assignments`          | GET/POST       |
| `/api/assignments/{id}`             | `http://core:8000/api/assignments/{id}`                  | GET/PUT/DELETE |
| `/api/assignments/{id}/submissions` | `http://core:8000/api/assignments/{id}/submissions`      | GET/POST       |
| `/api/submissions/{id}`             | `http://core:8000/api/submissions/{id}`                  | GET            |
| `/api/submissions/{id}/analyze`     | `http://core:8000/api/submissions/{id}/trigger-analysis` | POST           |
| `/api/submissions/{id}/analysis`    | `http://core:8000/api/submissions/{id}/analysis`         | GET            |
| `/api/submissions/{id}/grade`       | `http://core:8000/api/submissions/{id}/grade`            | GET/POST/PUT   |
| `/api/courses/{id}/announcements`   | `http://core:8000/api/courses/{id}/announcements`        | GET/POST       |
| `/api/announcements/{id}`           | `http://core:8000/api/announcements/{id}`                | GET/PUT/DELETE |
| `/api/announcements/{id}/comments`  | `http://core:8000/api/announcements/{id}/comments`       | GET/POST       |

The Gateway includes user context headers on every proxied request:

```
X-User-Id: 5
X-User-Email: student@committed.com
X-User-Role: user
```

---

### Gateway → Code Analyzer

The Gateway only calls the Code Analyzer for health checks. All analysis operations go through the Core service.

| Purpose      | Endpoint                           | Method |
| ------------ | ---------------------------------- | ------ |
| Health check | `http://code-analyzer:5000/health` | GET    |

---

### Gateway → Notifications

The Gateway proxies notification queries for the authenticated user.

| Public Endpoint                | Notifications Internal Endpoint                                      | Method |
| ------------------------------ | -------------------------------------------------------------------- | ------ |
| `/api/notifications`           | `http://notifications:5001/api/notifications/user/{userId}`          | GET    |
| `/api/notifications/{id}/read` | `http://notifications:5001/api/notifications/{id}/read`              | PUT    |
| `/api/notifications/read-all`  | `http://notifications:5001/api/notifications/user/{userId}/read-all` | PUT    |
| Health check                   | `http://notifications:5001/health`                                   | GET    |

---

### Core → Code Analyzer

The Core service triggers code analysis when a submission is created or when manually requested.

#### `POST http://code-analyzer:5000/analyze`

**Request:**

```json
{
    "submissionId": 1,
    "repoUrl": "https://github.com/student/assignment-repo",
    "studentId": 5
}
```

| Field          | Type    | Required | Description                    |
| -------------- | ------- | -------- | ------------------------------ |
| `submissionId` | integer | Yes      | The submission to analyze      |
| `repoUrl`      | string  | Yes      | GitHub repository URL to clone |
| `studentId`    | integer | No       | Student ID for notifications   |

**Response `200` (success):**

```json
{
    "status": "success",
    "data": {
        "submissionId": 1,
        "status": "completed",
        "metrics": {
            "complexity": 45,
            "maintainability": 72,
            "test_coverage": 60,
            "code_smells": 5,
            "documentation": 40
        },
        "classification": {
            "score": 65.5,
            "category": "good",
            "metrics": { "...": "..." },
            "timestamp": "2026-02-03T13:05:00.000Z"
        },
        "feedback": {
            "category": "good",
            "feedback": "Your code demonstrates solid fundamentals...",
            "score": 65.5,
            "timestamp": "2026-02-03T13:05:00.000Z"
        },
        "reportUrl": "/reports/analysis_report_1_20260203_130500.pdf",
        "analyzedAt": "2026-02-03T13:05:00.000Z"
    },
    "timestamp": "2026-02-03T13:05:00.000Z"
}
```

**Response `400`:**

```json
{
    "status": "error",
    "message": "Missing required fields: submissionId, repoUrl",
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

**Response `500`:**

```json
{
    "status": "error",
    "message": "Git clone failed: Repository not found",
    "timestamp": "2026-02-03T13:00:00.000Z"
}
```

#### `GET http://code-analyzer:5000/status/{submissionId}`

**Response `200`:**

```json
{
    "submissionId": 1,
    "status": "completed",
    "timestamp": "2026-02-03T13:05:00.000Z"
}
```

---

### Code Analyzer → Notifications

After completing analysis, the Code Analyzer sends a notification to the student.

#### `POST http://notifications:5001/api/notifications`

**Request:**

```json
{
    "userId": 5,
    "type": "SUBMISSION_ANALYZED",
    "subject": "Your code has been analyzed",
    "message": "Analysis complete for submission #1. Quality score: 65.5/100 (Good)",
    "userEmail": "student@committed.com",
    "sendEmail": true
}
```

| Field       | Type    | Required | Description                                                       |
| ----------- | ------- | -------- | ----------------------------------------------------------------- |
| `userId`    | integer | Yes      | Recipient user ID                                                 |
| `type`      | string  | Yes      | Notification type (see [Notification Types](#notification-types)) |
| `subject`   | string  | Yes      | Notification subject (max 500 chars)                              |
| `message`   | string  | Yes      | Notification body                                                 |
| `userEmail` | string  | No       | Email address (required if `sendEmail` is true)                   |
| `sendEmail` | boolean | No       | Whether to also send an email (default: false)                    |

**Response `200`:**

```json
{
    "success": true,
    "message": "Notification sent successfully",
    "notificationId": 42
}
```

#### `POST http://notifications:5001/api/email/send` — Send Direct Email

Used by the Core service for custom emails (e.g., enrollment confirmations).

**Request:**

```json
{
    "toEmail": "student@committed.com",
    "subject": "Welcome to CS101",
    "htmlBody": "<h1>Welcome!</h1><p>You have been enrolled in CS101.</p>",
    "textBody": "Welcome! You have been enrolled in CS101."
}
```

| Field      | Type   | Required | Description              |
| ---------- | ------ | -------- | ------------------------ |
| `toEmail`  | string | Yes      | Recipient email address  |
| `subject`  | string | Yes      | Email subject (max 500)  |
| `htmlBody` | string | Yes      | HTML email body          |
| `textBody` | string | No       | Plain text fallback body |

**Response `200`:**

```json
{
    "success": true,
    "message": "Email sent successfully",
    "notificationId": null
}
```

---

### Core → Notifications (AI Analysis → Notifications)

The Core service may also send notifications for events like grading or enrollment. It uses the same Notifications API endpoints as described above.

**Example: Grading notification**

```json
{
    "userId": 5,
    "type": "SUBMISSION_GRADED",
    "subject": "Your submission has been graded",
    "message": "You received 85.5/100 on Lab 2: Linked Lists",
    "userEmail": "student@committed.com",
    "sendEmail": true
}
```

---

## Notification Types

| Type                   | Triggered By   | Description                                 |
| ---------------------- | -------------- | ------------------------------------------- |
| `SUBMISSION_ANALYZED`  | Code Analyzer  | Code analysis completed for a submission    |
| `ANALYSIS_FAILED`      | Code Analyzer  | Code analysis failed for a submission       |
| `SUBMISSION_GRADED`    | Core (teacher) | Teacher graded a submission                 |
| `GRADE_UPDATED`        | Core (teacher) | Teacher updated an existing grade           |
| `ASSIGNMENT_CREATED`   | Core (teacher) | New assignment posted in an enrolled course |
| `ENROLLMENT_CONFIRMED` | Core           | Student enrollment confirmed                |
| `ANNOUNCEMENT_POSTED`  | Core (teacher) | New announcement in an enrolled course      |

---

## Testing with cURL

### Health Checks

```bash
# Gateway health
curl http://localhost/api/health

# Full chain test
curl http://localhost/api/test-chain

# Core healthcheck (database connectivity + user data)
curl -s http://localhost:8000/health | python3 -m json.tool

# Core healthcheck via web frontend proxy
curl -s http://localhost:3000/api/core/health | python3 -m json.tool

# Direct service health checks
curl http://localhost:5000/health    # Code Analyzer
curl http://localhost:5001/health    # Notifications
```

### Authentication

```bash
# Register
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@committed.com",
    "fullName": "Test User",
    "password": "password123"
  }'

# Login (save token)
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@committed.com",
    "password": "password123"
  }' | python -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo $TOKEN
```

### Authenticated Requests

```bash
# Get current user
curl http://localhost/api/users/me \
  -H "Authorization: Bearer $TOKEN"

# List courses
curl http://localhost/api/courses \
  -H "Authorization: Bearer $TOKEN"

# Create a course
curl -X POST http://localhost/api/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "CS301",
    "courseName": "Software Engineering",
    "description": "Learn software engineering principles."
  }'

# Enroll in a course
curl -X POST http://localhost/api/courses/1/enroll \
  -H "Authorization: Bearer $TOKEN"

# Create an assignment
curl -X POST http://localhost/api/courses/1/assignments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Lab 1: Hello World",
    "description": "Write a Hello World program.",
    "maxPoints": 100,
    "dueDate": "2026-04-01T23:59:00Z",
    "requireGithubRepo": true
  }'

# Submit code
curl -X POST http://localhost/api/assignments/1/submissions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "githubRepoUrl": "https://github.com/student/hello-world",
    "submissionText": "My hello world implementation."
  }'

# Check submission with analysis results
curl http://localhost/api/submissions/1 \
  -H "Authorization: Bearer $TOKEN"

# Get analysis results
curl http://localhost/api/submissions/1/analysis \
  -H "Authorization: Bearer $TOKEN"

# Grade a submission (teacher)
curl -X POST http://localhost/api/submissions/1/grade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pointsEarned": 85.5,
    "feedback": "Good work!"
  }'

# Get notifications
curl http://localhost/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# Mark notification as read
curl -X PUT http://localhost/api/notifications/42/read \
  -H "Authorization: Bearer $TOKEN"
```

### Pretty Print JSON

```bash
# Using Python
curl -s http://localhost/api/test-chain | python -m json.tool

# Using jq
curl -s http://localhost/api/test-chain | jq .
```

### Spring Actuator (Gateway)

```bash
curl http://localhost/api/actuator/health
```

---

## Database Tables Reference

The API maps to the following PostgreSQL database tables (see `docker/db/01_schema.sql`):

| Table                     | Primary Key                  | Managed By    |
| ------------------------- | ---------------------------- | ------------- |
| `users`                   | `user_id` (IDENTITY)         | Gateway, Core |
| `course`                  | `course_id` (IDENTITY)       | Core          |
| `enrollment`              | `(user_id, course_id)`       | Core          |
| `assignment`              | `assignment_id` (IDENTITY)   | Core          |
| `submission`              | `submission_id` (IDENTITY)   | Core          |
| `grade`                   | `grade_id` (IDENTITY)        | Core          |
| `code_analysis`           | `analysis_id` (IDENTITY)     | Code Analyzer |
| `announcement`            | `announcement_id` (IDENTITY) | Core          |
| `comment`                 | `comment_id` (IDENTITY)      | Core          |
| `announcement_attachment` | `attachment_id` (IDENTITY)   | Core          |
| `assignment_attachment`   | `attachment_id` (IDENTITY)   | Core          |
| `submission_attachment`   | `attachment_id` (IDENTITY)   | Core          |
