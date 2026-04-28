# Core Service

PHP Symfony service responsible for all data persistence and business logic on the Committed platform. Called exclusively by the Gateway — not exposed to public clients.

## Technology Stack

- PHP 8.3 (FPM Alpine)
- Symfony 7.4
- Doctrine ORM 3.6 + Doctrine Migrations
- PostgreSQL 16 (via `pdo_pgsql`)
- Nelmio CORS Bundle
- Nginx + Supervisord (production container)

## Responsibilities

| Domain | Entities | Controller |
|---|---|---|
| Users | `User` | `InternalUserController`, `AdminUserController` |
| Courses | `Course`, `Enrollment` | `CourseController`, `EnrollmentController` |
| Assignments | `Assignment`, `AssignmentAttachment` | `AssignmentController` |
| Submissions | `Submission`, `SubmissionAttachment`, `CodeAnalysis` | `SubmissionController` |
| Grades | `Grade` | `GradeController` |
| Announcements | `Announcement`, `AnnouncementAttachment` | `AnnouncementController` |
| Comments | `Comment` | `CommentController` |
| Statistics | — | `CourseStatisticsController` |
| Files | — | `FileStorageService` |

## Endpoints (internal — called by Gateway only)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (DB status + table count) |
| GET/POST | `/api/users` | Create user / list users |
| GET/PUT | `/api/users/{id}` | Get or update user |
| GET | `/api/users/by-email` | Find user by email |
| GET/POST | `/api/courses` | List or create courses |
| GET/PUT/DELETE | `/api/courses/{id}` | Course CRUD |
| POST/DELETE | `/api/courses/{id}/enroll` | Enroll / unenroll |
| GET | `/api/courses/{id}/students` | Enrolled students |
| GET | `/api/courses/{id}/stats` | Course statistics |
| GET/POST | `/api/courses/{id}/assignments` | List or create assignments |
| GET/PUT/DELETE | `/api/assignments/{id}` | Assignment CRUD |
| GET/POST | `/api/assignments/{id}/submissions` | List or create submissions |
| GET/PUT | `/api/submissions/{id}` | Get or update submission |
| POST/GET/PUT | `/api/submissions/{id}/grade` | Grade management |
| GET/POST | `/api/courses/{id}/announcements` | Announcements |
| PUT/DELETE | `/api/courses/{cId}/announcements/{id}` | Announcement CRUD |
| GET/POST/PUT/DELETE | `.../comments` | Comment CRUD |
| GET | `/api/submissions/{id}/analysis` | Get analysis record |
| PUT | `/api/submissions/{id}/analysis` | Update analysis record (called by Gateway after callback) |

## IDE Setup (PhpStorm)

1. **File → Open** → select `services/core`
2. **Settings → PHP** → configure PHP 8.3 interpreter (local or Docker)

### Install Dependencies

```bash
composer install
```

### Run Configuration

**Run → Edit Configurations → PHP Built-in Web Server**

- Host: `localhost`, Port: `8000`
- Document root: `public/`
- Environment variables:

```
APP_ENV=dev
APP_SECRET=dev-secret-change-this
DATABASE_URL=postgresql://core_user:CoreSecurePass123!@localhost:5432/committed_core?serverVersion=16&charset=utf8
```

## Local Development

```bash
# Install dependencies
composer install

# Start development server (PHP built-in)
php -S localhost:8000 -t public

# Or with Symfony CLI
symfony server:start --port=8000

# Validate schema against the database
php bin/console doctrine:schema:validate

# Run a Doctrine migration
php bin/console doctrine:migrations:migrate

# Generate a migration from entity changes
php bin/console make:migration
```

## Docker

```bash
# Build image
docker build -t committed-core .

# Run container (requires running PostgreSQL)
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql://core_user:CoreSecurePass123!@postgres-db:5432/committed_core?serverVersion=16" \
  committed-core
```

The container uses PHP-FPM + Nginx managed by Supervisord.

## Project Structure

```
services/core/src/
├── Controller/
│   ├── AdminUserController.php
│   ├── InternalUserController.php
│   ├── CourseController.php
│   ├── EnrollmentController.php
│   ├── AssignmentController.php
│   ├── SubmissionController.php
│   ├── GradeController.php
│   ├── AnnouncementController.php
│   ├── CommentController.php
│   ├── CourseStatisticsController.php
│   └── HealthCheckController.php
├── Entity/
│   ├── User.php
│   ├── Course.php
│   ├── Enrollment.php
│   ├── Assignment.php
│   ├── AssignmentAttachment.php
│   ├── Submission.php
│   ├── SubmissionAttachment.php
│   ├── CodeAnalysis.php
│   ├── Grade.php
│   ├── Announcement.php
│   ├── AnnouncementAttachment.php
│   └── Comment.php
├── Repository/           # Doctrine repositories (one per entity)
├── Service/
│   ├── UserService.php
│   ├── SubmissionService.php
│   ├── FileStorageService.php
│   └── CourseStatisticsService.php
├── DTO/                  # Request/response DTOs
├── Exception/            # Domain exceptions
└── EventListener/
    └── ExceptionListener.php   # Maps exceptions to HTTP responses
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `APP_ENV` | Environment (`dev` / `prod`) | `dev` |
| `APP_SECRET` | Symfony secret key | **required** |
| `DATABASE_URL` | PostgreSQL DSN | `postgresql://core_user:CoreSecurePass123!@postgres-db:5432/committed_core?serverVersion=16&charset=utf8` |
| `CORS_ALLOW_ORIGIN` | Allowed CORS origins | `^https?://(localhost\|127\.0\.0\.1)(:[0-9]+)?$` |

## Testing

```bash
# Health check endpoint
curl http://localhost:8000/health

# Run a query via Doctrine DBAL (inside container)
docker exec committed-core php bin/console dbal:run-sql "SELECT COUNT(*) FROM users"

# Validate ORM mapping against database schema
docker exec committed-core php bin/console doctrine:schema:validate
```
