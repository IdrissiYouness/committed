# Committed — Architecture

## Overview

Committed is a microservices-based educational platform for automated code submission, AI-powered analysis, and grading — similar to Google Classroom with built-in code review.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              External Clients                                │
│                       (Browser, Mobile, Postman, CI)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nginx Reverse Proxy  (:80)                        │
│            /api/*  →  Gateway        /  →  React SPA (web)                  │
│            /docs   →  Scalar API UI                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                   │
                    ▼                                   ▼
     ┌──────────────────────────┐        ┌────────────────────────────┐
     │    Gateway  (:8080)      │        │    Web Frontend (:3000)    │
     │   Java Spring Boot       │        │  React + Vite + Tailwind   │
     │                          │        └────────────────────────────┘
     │  • JWT auth & blacklist  │
     │  • Rate limiting         │
     │  • Token versioning      │
     │  • Request routing       │
     └──────────────────────────┘
          │          │         │
          ▼          ▼         ▼
  ┌───────────┐ ┌──────────┐ ┌───────────────┐
  │   Core    │ │  Code    │ │ Notifications │
  │ (:8000)   │ │ Analyzer │ │   (:5001)     │
  │ PHP Sym.  │ │ (:5000)  │ │  .NET Core    │
  │           │ │  Flask   │ │               │
  │• Courses  │ │• Git     │ │• SMTP email   │
  │• Assigns. │ │  clone   │ │• HTML templ.  │
  │• Submiss. │ │• Kilo AI │ │• Async queue  │
  │• Users    │ │  analysis│ └───────────────┘
  │• Grades   │ │• PDF gen │
  └───────────┘ └──────────┘
        │              │
        │       (callback POST)
        │       /internal/analysis-result
        │              │
        ▼              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Shared Data Layer                                    │
│                                                                              │
│   PostgreSQL 16 (:5432)                    Redis (:6379)                    │
│   • users, courses, enrollment             • JWT JTI blacklist               │
│   • assignment, submission, grade          • Token version counters          │
│   • announcement, comment                 • TTL-based revocation            │
│   • code_analysis, attachments                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

### Gateway (Java Spring Boot — :8080)

Single entry point for all API traffic.

| Concern | Implementation |
|---|---|
| Authentication | JWT HS256 tokens, 24h access / 7d refresh |
| Session revocation | Redis JTI blacklist with TTL |
| Token versioning | `tokenVersion` claim checked against Redis on every request |
| Rate limiting | `RateLimitFilter` before JWT parsing |
| Authorization | URL-level Spring Security + `@PreAuthorize` on methods |
| Routing | RestTemplate proxies to Core, Code Analyzer, Notifications |
| Async notifications | `@Async` `HttpNotificationService` (fire-and-forget) |

### Core (PHP Symfony — :8000)

Data persistence and business logic.

- Course, assignment, submission, grade, announcement, comment CRUD
- File uploads (assignments, submissions, announcements) stored on disk
- Internal endpoints called by Gateway only (no public exposure)
- Doctrine DBAL for typed SQL queries against PostgreSQL

### Code Analyzer (Python Flask — :5000)

AI-powered code quality analysis pipeline.

1. Accepts `POST /analyze` from Gateway with `submissionId + repoUrl + studentId`
2. Runs in background thread pool (`MAX_WORKERS`, default 4)
3. Clones repository (GitHub/GitLab only, depth 50)
4. Runs Kilo Code CLI for static metrics
5. Classifies quality: excellent / good / average / poor
6. Generates PDF report with Typst
7. POSTs result back to Gateway at `/internal/analysis-result`

### Notifications (.NET Core — :5001)

Async email delivery service.

- Receives events via `POST /internal/notify` (X-Internal-Secret validated)
- Enqueues to `Channel<NotifyRequest>` and returns 202 immediately
- `NotificationWorker` renders HTML templates and sends via MailKit/Gmail SMTP
- Supported events: `announcement.created`, `assignment.created`, `grade.created`, `grade.validated`, `analysis.completed`, `analysis.failed`

### Web Frontend (React + Vite + Tailwind CSS — :3000)

- Served statically via Nginx in production
- Vite dev server in development
- Communicates with Gateway via `/api/*` routes through Nginx

## Request Flows

### Student Submits Code

```
1. POST /api/assignments/{id}/submissions  →  Gateway
2. Gateway validates JWT + enrollment      →  Core (save submission)
3. Core returns submissionId
4. Gateway triggers async analysis         →  Code Analyzer (POST /analyze)
5. Code Analyzer returns 202 immediately
6. Gateway responds 201 to student

[Background, 30s – 5min later]
7. Code Analyzer completes analysis
8. POST /internal/analysis-result          →  Gateway
9. Gateway saves result                    →  Core (update code_analysis)
10. Gateway sends notification             →  Notifications (POST /internal/notify)
11. Notifications sends email to student
```

### Teacher Grades a Submission

```
1. POST /api/submissions/{id}/grade    →  Gateway
2. Gateway validates JWT + course role  →  Core (save grade)
3. Core returns gradeId
4. Gateway sends notification           →  Notifications
5. Notifications emails student: "Your grade is available"
```

### Token Refresh Flow

```
1. Client POST /api/token/refresh with refreshToken
2. Gateway validates refresh token (signature + not blacklisted + type="refresh")
3. Old refresh token JTI added to Redis blacklist (TTL = remaining lifetime)
4. New access token + refresh token issued
5. Client stores new tokens
```

## Authentication & Security

### JWT Token Structure

```json
{
  "sub": "5",
  "userId": 5,
  "email": "student@committed.com",
  "fullName": "Jane Doe",
  "systemRole": "user",
  "tokenVersion": 2,
  "jti": "550e8400-e29b-41d4-a716-446655440000",
  "iss": "committed-gateway",
  "iat": 1745841600,
  "exp": 1745928000
}
```

### Redis Revocation (Two Mechanisms)

| Key pattern | Value | When set | TTL |
|---|---|---|---|
| `blacklist:{jti}` | `"1"` | Logout, token rotation | Remaining token lifetime |
| `token_version:{userId}` | `"2"` | Password change, deactivation | None (permanent) |

On every authenticated request, the filter checks **both**:
1. Is `jti` in the blacklist?
2. Does `tokenVersion` in the token match Redis `token_version:{userId}`?

If either check fails, the request is rejected with 401.

### Authorization Levels

| Level | Mechanism | Example |
|---|---|---|
| URL | Spring Security `requestMatchers` | `/api/admin/**` → ROLE_ADMIN |
| Method | `@PreAuthorize("hasRole('ADMIN')")` | Admin controller methods |
| Data | Service layer ownership check | Students see only own submissions |
| Self-guard | AdminService validation | Admins cannot deactivate themselves |

### Internal Service Security

Service-to-service calls carry `X-Internal-Secret` header (shared via env var `INTERNAL_SECRET`). `InternalAuthFilter` validates this before `JwtAuthenticationFilter` runs.

## Communication Patterns

All inter-service calls use HTTP REST over the Docker bridge network.

| From | To | URL pattern |
|---|---|---|
| Gateway | Core | `http://core:8000/api/...` |
| Gateway | Code Analyzer | `http://code-analyzer:5000/analyze` |
| Gateway | Notifications | `http://notifications:5001/internal/notify` |
| Code Analyzer | Gateway | `http://gateway:8080/internal/analysis-result` |

## Database Schema

Tables in PostgreSQL 16 (`committed_core`):

| Table | Primary key | Key relationships |
|---|---|---|
| `users` | `user_id` | — |
| `course` | `course_id` | `teacher_id → users` |
| `enrollment` | `(user_id, course_id)` | `→ users, → course` |
| `assignment` | `assignment_id` | `created_by → users`, `course_id → course` |
| `assignment_attachment` | `attachment_id` | `→ assignment` |
| `submission` | `submission_id` | `assignment_id → assignment`, `student_id → users` |
| `submission_attachment` | `attachment_id` | `→ submission` |
| `code_analysis` | `analysis_id` | `submission_id → submission` (unique) |
| `grade` | `grade_id` | `submission_id → submission` (unique), `graded_by → users` |
| `announcement` | `announcement_id` | `posted_by → users`, `course_id → course` |
| `announcement_attachment` | `attachment_id` | `→ announcement` |
| `comment` | `comment_id` | `announcement_id → announcement`, `parent_comment_id → comment` |

All tables have `created_at` / `updated_at` with auto-update triggers.
`users.token_version` is incremented on password change or deactivation.

## Docker Infrastructure

Services are orchestrated via `docker/docker-compose.yml` on the `committed-network` bridge.

| Container | Image | Port | Depends on |
|---|---|---|---|
| `committed-postgres` | postgres:16-alpine | 5432 | — |
| `committed-redis` | redis:alpine | 6379 | — |
| `committed-gateway` | build: gateway/ | 8080 | postgres (healthy), redis |
| `committed-core` | build: core/ | 8000 | postgres (healthy) |
| `committed-analyzer` | build: code-analyzer/ | 5000 | — |
| `committed-notifications` | build: notifications/ | 5001 | — |
| `committed-nginx` | build: docker/nginx/ | 80 | gateway |

### Volumes

| Volume | Used by | Contents |
|---|---|---|
| `postgres-data` | PostgreSQL | Database files |
| `redis-data` | Redis | Persistence (if configured) |
| `analyzer-temp` | Code Analyzer | Cloned repositories |
| `analyzer-reports` | Code Analyzer | Generated PDF reports |
| `./uploads` (bind) | Core | User-uploaded file attachments |

## Scalability Notes

Each service is independently scalable:

```bash
docker compose up -d --scale core=3
```

For production, consider:
- Load balancer in front of Nginx
- Read replicas for PostgreSQL
- Redis Cluster for blacklist
- Message queue (RabbitMQ/Kafka) instead of HTTP for notifications
- Object storage (S3) for file attachments instead of bind mount
