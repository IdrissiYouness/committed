# Core Service Development Skill

## Service Overview

**Service Name**: Core Service  
**Technology**: PHP Symfony 7.4  
**Language**: PHP 8.3 (Alpine)  
**Port**: 8000  
**IDE**: PhpStorm  
**Build Tool**: Composer  
**Database**: PostgreSQL 16 (via PDO_PGSQL)  
**Container Runtime**: Docker (php:8.3-fpm-alpine + nginx + supervisord)

---

## Technology Stack & Versions

### Core Dependencies

```json
{
    "require": {
        "php": ">=8.2",
        "ext-ctype": "*",
        "ext-iconv": "*",
        "doctrine/doctrine-bundle": "^2.18",
        "doctrine/doctrine-migrations-bundle": "^3.7",
        "doctrine/orm": "^3.6",
        "nelmio/cors-bundle": "^2.6",
        "phpdocumentor/reflection-docblock": "^5.6",
        "phpstan/phpdoc-parser": "^2.3",
        "symfony/console": "7.4.*",
        "symfony/dotenv": "7.4.*",
        "symfony/flex": "^2",
        "symfony/framework-bundle": "7.4.*",
        "symfony/property-access": "7.4.*",
        "symfony/property-info": "7.4.*",
        "symfony/runtime": "7.4.*",
        "symfony/serializer": "7.4.*",
        "symfony/uid": "7.4.*",
        "symfony/validator": "7.4.*",
        "symfony/yaml": "7.4.*"
    },
    "require-dev": {
        "symfony/maker-bundle": "^1.66"
    }
}
```

### PHP Extensions (installed in Docker image)

- `pdo` — PHP Data Objects base
- `pdo_pgsql` — PostgreSQL PDO driver (Doctrine DBAL)
- `pgsql` — Native PostgreSQL functions
- `intl` — Internationalization (Symfony Validator)
- `opcache` — Bytecode caching (performance)

---

## Project Structure

### Current State (implemented)

```
services/core/
├── config/
│   ├── bundles.php
│   ├── preload.php
│   ├── reference.php
│   ├── services.yaml
│   ├── routes.yaml
│   ├── routes/
│   │   └── framework.yaml
│   └── packages/
│       ├── cache.yaml
│       ├── doctrine.yaml
│       ├── doctrine_migrations.yaml
│       ├── framework.yaml
│       ├── nelmio_cors.yaml
│       ├── property_info.yaml
│       ├── routing.yaml
│       └── validator.yaml
├── docker/
│   ├── nginx.conf              # Nginx reverse proxy → PHP-FPM
│   ├── supervisord.conf        # Manages nginx + php-fpm processes
│   └── php.ini                 # Custom PHP settings
├── migrations/
├── public/
│   └── index.php
├── src/
│   ├── Controller/
│   │   └── HealthCheckController.php   # ✅ Implemented — DB connectivity test
│   ├── Entity/                          # (empty — to be created)
│   ├── Repository/                      # (empty — to be created)
│   └── Kernel.php
├── tests/
├── var/
├── vendor/
├── .editorconfig
├── .env.dev
├── composer.json
├── composer.lock
├── compose.yaml
├── compose.override.yaml
├── Dockerfile
└── symfony.lock
```

### Target Structure (planned)

```
src/
├── Controller/
│   ├── HealthCheckController.php       # ✅ Implemented
│   ├── CourseController.php
│   ├── AssignmentController.php
│   ├── SubmissionController.php
│   ├── AnnouncementController.php
│   └── AuthController.php
├── Entity/
│   ├── User.php
│   ├── Course.php
│   ├── Enrollment.php
│   ├── Assignment.php
│   ├── Submission.php
│   ├── Announcement.php
│   ├── Comment.php
│   ├── Grade.php
│   ├── CodeAnalysis.php
│   ├── AnnouncementAttachment.php
│   ├── SubmissionAttachment.php
│   └── AssignmentAttachment.php
├── Repository/
│   ├── UserRepository.php
│   ├── CourseRepository.php
│   ├── EnrollmentRepository.php
│   ├── AssignmentRepository.php
│   ├── SubmissionRepository.php
│   └── AnnouncementRepository.php
├── Service/
│   ├── CourseService.php
│   ├── AssignmentService.php
│   ├── SubmissionService.php
│   ├── AnnouncementService.php
│   └── AnalyzerServiceClient.php
├── DTO/
│   ├── Request/
│   │   ├── CreateCourseRequest.php
│   │   ├── UpdateCourseRequest.php
│   │   └── CreateAssignmentRequest.php
│   └── Response/
│       ├── CourseResponse.php
│       ├── AssignmentResponse.php
│       └── ApiResponse.php
├── Exception/
│   ├── ResourceNotFoundException.php
│   ├── ValidationException.php
│   └── UnauthorizedException.php
├── EventListener/
│   └── ExceptionListener.php
└── Kernel.php
```

---

## Docker & Deployment

### Dockerfile

```dockerfile
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    git curl libpq-dev icu-dev zip unzip nginx supervisor

# Install PHP extensions
RUN docker-php-ext-install \
    pdo pdo_pgsql pgsql intl opcache

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/core

# Copy composer files first (layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --prefer-dist

# Copy application
COPY . .
RUN composer dump-autoload --optimize

# Copy config files
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini

RUN mkdir -p var/cache var/log && chmod -R 777 var/

EXPOSE 8000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

### Container Process Management (supervisord)

The container runs **two processes** managed by supervisord:

- **nginx** — Listens on port 8000, proxies PHP requests to php-fpm on 127.0.0.1:9000
- **php-fpm** — FastCGI process manager handling PHP requests

### Docker Compose (core service)

```yaml
core:
    build:
        context: ../services/core
        dockerfile: Dockerfile
    container_name: committed-core
    ports:
        - "${CORE_PORT}:8000"
    environment:
        - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres-db:5432/${POSTGRES_DB}?serverVersion=16&charset=utf8
        - APP_ENV=${APP_ENV}
        - APP_SECRET=${APP_SECRET}
        - CORS_ALLOW_ORIGIN='^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$$'
        - GATEWAY_SERVICE_URL=http://gateway:8080
        - ANALYZER_SERVICE_URL=http://code-analyzer:5000
        - NOTIFICATION_SERVICE_URL=http://notifications:5001
    depends_on:
        postgres-db:
            condition: service_healthy
    networks:
        - committed-network
```

---

## Code Style & Conventions

### Naming Conventions

#### Classes

```php
// Use PascalCase
class CourseController { }
class CourseService { }
class ResourceNotFoundException { }
```

#### Methods

```php
// Use camelCase, start with verb
public function getAllCourses(): array { }
public function getCourseById(int $id): Course { }
public function createCourse(CreateCourseRequest $request): Course { }
public function isCourseActive(int $id): bool { }
```

#### Variables

```php
// Use camelCase
$courseName = 'Introduction to Programming';
$userId = 1;
$isActive = true;
```

#### Constants

```php
// Use UPPER_SNAKE_CASE
const MAX_COURSE_NAME_LENGTH = 255;
const DEFAULT_PAGE_SIZE = 20;
const ROLE_STUDENT = 'student';
```

### Code Formatting

Use **PSR-12** coding standard with these tools:

**PHP CS Fixer Configuration** (.php-cs-fixer.php):

```php
<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude('var')
    ->exclude('vendor');

$config = new PhpCsFixer\Config();
return $config
    ->setRules([
        '@Symfony' => true,
        '@Symfony:risky' => true,
        'array_syntax' => ['syntax' => 'short'],
        'declare_strict_types' => true,
        'strict_param' => true,
    ])
    ->setRiskyAllowed(true)
    ->setFinder($finder);
```

---

## Architecture Patterns

### Layered Architecture

```
Controller Layer (REST API)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access via Doctrine ORM / DBAL)
    ↓
PostgreSQL 16
```

### HealthCheck Controller (Implemented)

This controller is fully implemented and tests Doctrine DBAL connectivity to PostgreSQL.
It uses the raw `Connection` object (not ORM entities) so it works without entity classes.

```php
<?php

namespace App\Controller;

use Doctrine\DBAL\Connection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class HealthCheckController extends AbstractController
{
    #[Route('/health', name: 'health_check', methods: ['GET'])]
    public function index(Connection $connection): JsonResponse
    {
        try {
            // Test basic connectivity
            $connection->executeQuery('SELECT 1');

            // Get user count
            $userCount = $connection->fetchOne('SELECT COUNT(*) FROM users');

            // Get list of users (limited to 10)
            $users = $connection->fetchAllAssociative(
                'SELECT user_id, email, full_name, system_role, is_active, created_at FROM users ORDER BY user_id LIMIT 10'
            );

            // Get table count in public schema
            $tableCount = $connection->fetchOne(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            );

            return $this->json([
                'status' => 'ok',
                'database' => [
                    'connected' => true,
                    'driver' => 'pdo_pgsql',
                    'tables_count' => (int) $tableCount,
                ],
                'users' => [
                    'total_count' => (int) $userCount,
                    'sample' => array_map(fn(array $user) => [
                        'user_id' => (int) $user['user_id'],
                        'email' => $user['email'],
                        'full_name' => $user['full_name'],
                        'system_role' => $user['system_role'],
                        'is_active' => (bool) $user['is_active'],
                        'created_at' => $user['created_at'],
                    ], $users),
                ],
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ]);
        } catch (\Exception $e) {
            return $this->json([
                'status' => 'error',
                'database' => [
                    'connected' => false,
                    'error' => $e->getMessage(),
                ],
                'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
            ], 503);
        }
    }
}
```

**Endpoint**: `GET /health`  
**Accessible via web frontend**: `GET /api/core/health` (proxied through web nginx)  
**Test via CLI**: `docker exec committed-core php bin/console dbal:run-sql "SELECT 1"`

### Controller Pattern (Planned)

```php
<?php

namespace App\Controller;

use App\Service\CourseService;
use App\DTO\Request\CreateCourseRequest;
use App\DTO\Response\CourseResponse;
use App\DTO\Response\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Validator\ConstraintViolationList;

#[Route('/api/courses')]
class CourseController extends AbstractController
{
    public function __construct(
        private readonly CourseService $courseService,
        private readonly ValidatorInterface $validator
    ) {
    }

    #[Route('', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $page = $request->query->getInt('page', 1);
        $limit = $request->query->getInt('limit', 20);
        $search = $request->query->get('search');

        $courses = $this->courseService->getAllCourses($page, $limit, $search);

        return $this->json(ApiResponse::success($courses, 'Courses retrieved successfully'));
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $course = $this->courseService->getCourseById($id);

        return $this->json(ApiResponse::success($course, 'Course retrieved successfully'));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $createRequest = new CreateCourseRequest($data);

        $errors = $this->validator->validate($createRequest);
        if (count($errors) > 0) {
            return $this->json(
                ApiResponse::error('Validation failed', $this->formatErrors($errors)),
                400
            );
        }

        $course = $this->courseService->createCourse($createRequest);

        return $this->json(
            ApiResponse::success($course, 'Course created successfully'),
            201
        );
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $course = $this->courseService->updateCourse($id, $data);

        return $this->json(ApiResponse::success($course, 'Course updated successfully'));
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        $this->courseService->deleteCourse($id);

        return $this->json(ApiResponse::success(null, 'Course deleted successfully'));
    }

    private function formatErrors(ConstraintViolationList $errors): array
    {
        $formatted = [];
        foreach ($errors as $error) {
            $formatted[$error->getPropertyPath()] = $error->getMessage();
        }
        return $formatted;
    }
}
```

### Service Pattern

```php
<?php

namespace App\Service;

use App\Entity\Course;
use App\Repository\CourseRepository;
use App\DTO\Request\CreateCourseRequest;
use App\DTO\Response\CourseResponse;
use App\Exception\ResourceNotFoundException;
use App\Exception\ValidationException;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class CourseService
{
    public function __construct(
        private readonly CourseRepository $courseRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly LoggerInterface $logger
    ) {
    }

    public function getAllCourses(int $page = 1, int $limit = 20, ?string $search = null): array
    {
        $offset = ($page - 1) * $limit;

        if ($search) {
            $courses = $this->courseRepository->searchCourses($search, $limit, $offset);
            $total = $this->courseRepository->countSearchResults($search);
        } else {
            $courses = $this->courseRepository->findBy(
                ['isActive' => true],
                ['createdAt' => 'DESC'],
                $limit,
                $offset
            );
            $total = $this->courseRepository->count(['isActive' => true]);
        }

        return [
            'data' => array_map(fn($course) => CourseResponse::fromEntity($course), $courses),
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    public function getCourseById(int $id): CourseResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course) {
            throw new ResourceNotFoundException('Course not found');
        }

        return CourseResponse::fromEntity($course);
    }

    public function createCourse(CreateCourseRequest $request): CourseResponse
    {
        // Check if course code already exists
        if ($this->courseRepository->existsByCode($request->courseCode)) {
            throw new ValidationException('Course code already exists');
        }

        $course = new Course();
        $course->setCourseCode($request->courseCode);
        $course->setCourseName($request->courseName);
        $course->setDescription($request->description);
        $course->setSection($request->section);
        $course->setSubject($request->subject);
        $course->setTeacherId($request->teacherId);
        $course->setIsOpen(true);
        $course->setIsActive(true);

        $this->entityManager->persist($course);
        $this->entityManager->flush();

        $this->logger->info('Course created', ['course_id' => $course->getCourseId()]);

        return CourseResponse::fromEntity($course);
    }

    public function updateCourse(int $id, array $data): CourseResponse
    {
        $course = $this->courseRepository->find($id);

        if (!$course) {
            throw new ResourceNotFoundException('Course not found');
        }

        if (isset($data['course_name'])) {
            $course->setCourseName($data['course_name']);
        }

        if (isset($data['description'])) {
            $course->setDescription($data['description']);
        }

        if (isset($data['is_open'])) {
            $course->setIsOpen($data['is_open']);
        }

        $this->entityManager->flush();

        $this->logger->info('Course updated', ['course_id' => $course->getCourseId()]);

        return CourseResponse::fromEntity($course);
    }

    public function deleteCourse(int $id): void
    {
        $course = $this->courseRepository->find($id);

        if (!$course) {
            throw new ResourceNotFoundException('Course not found');
        }

        // Soft delete
        $course->setIsActive(false);
        $this->entityManager->flush();

        $this->logger->info('Course deleted', ['course_id' => $id]);
    }
}
```

### Repository Pattern

```php
<?php

namespace App\Repository;

use App\Entity\Course;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Course>
 */
class CourseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Course::class);
    }

    public function existsByCode(string $code): bool
    {
        return $this->count(['courseCode' => $code]) > 0;
    }

    public function searchCourses(string $search, int $limit, int $offset): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.isActive = :active')
            ->andWhere('c.courseName LIKE :search OR c.courseCode LIKE :search')
            ->setParameter('active', true)
            ->setParameter('search', '%' . $search . '%')
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->setFirstResult($offset)
            ->getQuery()
            ->getResult();
    }

    public function countSearchResults(string $search): int
    {
        return $this->createQueryBuilder('c')
            ->select('COUNT(c.courseId)')
            ->where('c.isActive = :active')
            ->andWhere('c.courseName LIKE :search OR c.courseCode LIKE :search')
            ->setParameter('active', true)
            ->setParameter('search', '%' . $search . '%')
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function findByTeacher(int $teacherId): array
    {
        return $this->findBy(
            ['teacherId' => $teacherId, 'isActive' => true],
            ['createdAt' => 'DESC']
        );
    }

    public function findEnrolledCourses(int $userId): array
    {
        $qb = $this->createQueryBuilder('c')
            ->innerJoin('c.enrollments', 'e')
            ->where('e.userId = :userId')
            ->andWhere('c.isActive = :active')
            ->andWhere('e.courseRole = :role')
            ->setParameter('userId', $userId)
            ->setParameter('active', true)
            ->setParameter('role', 'student')
            ->orderBy('c.createdAt', 'DESC');

        return $qb->getQuery()->getResult();
    }
}
```

### Entity Pattern

> **Important**: Entities are not yet created. The PostgreSQL database schema already exists
> (created by `docker/db/01_schema.sql` init scripts). Entities must be written to **map to
> the existing tables** — Doctrine will not recreate them. Use `IDENTITY` generation strategy
> (not `SEQUENCE`) since the PostgreSQL tables use `GENERATED BY DEFAULT AS IDENTITY`.

```php
<?php

namespace App\Entity;

use App\Repository\CourseRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CourseRepository::class)]
#[ORM\Table(name: 'course')]
#[ORM\Index(name: 'idx_course_code', columns: ['course_code'])]
#[ORM\Index(name: 'idx_course_teacher', columns: ['teacher_id'])]
#[ORM\Index(name: 'idx_course_is_active', columns: ['is_active'])]
#[ORM\HasLifecycleCallbacks]
class Course
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'IDENTITY')]
    #[ORM\Column(name: 'course_id')]
    private ?int $courseId = null;

    #[ORM\Column(name: 'course_code', length: 50, unique: true)]
    private string $courseCode;

    #[ORM\Column(name: 'course_name', length: 255)]
    private string $courseName;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'section', length: 50, nullable: true)]
    private ?string $section = null;

    #[ORM\Column(name: 'subject', length: 100, nullable: true)]
    private ?string $subject = null;

    #[ORM\Column(name: 'is_open')]
    private bool $isOpen = true;

    #[ORM\Column(name: 'is_active')]
    private bool $isActive = true;

    #[ORM\Column(name: 'teacher_id')]
    private int $teacherId;

    #[ORM\Column(name: 'created_at')]
    private \DateTime $createdAt;

    #[ORM\Column(name: 'updated_at')]
    private \DateTime $updatedAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    // Getters
    public function getCourseId(): ?int
    {
        return $this->courseId;
    }

    public function getCourseCode(): string
    {
        return $this->courseCode;
    }

    public function getCourseName(): string
    {
        return $this->courseName;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function getSection(): ?string
    {
        return $this->section;
    }

    public function getSubject(): ?string
    {
        return $this->subject;
    }

    public function getIsOpen(): bool
    {
        return $this->isOpen;
    }

    public function getIsActive(): bool
    {
        return $this->isActive;
    }

    public function getTeacherId(): int
    {
        return $this->teacherId;
    }

    public function getCreatedAt(): \DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTime
    {
        return $this->updatedAt;
    }

    // Setters
    public function setCourseCode(string $courseCode): self
    {
        $this->courseCode = $courseCode;
        return $this;
    }

    public function setCourseName(string $courseName): self
    {
        $this->courseName = $courseName;
        return $this;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function setSection(?string $section): self
    {
        $this->section = $section;
        return $this;
    }

    public function setSubject(?string $subject): self
    {
        $this->subject = $subject;
        return $this;
    }

    public function setIsOpen(bool $isOpen): self
    {
        $this->isOpen = $isOpen;
        return $this;
    }

    public function setIsActive(bool $isActive): self
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function setTeacherId(int $teacherId): self
    {
        $this->teacherId = $teacherId;
        return $this;
    }

    #[ORM\PreUpdate]
    public function updateTimestamps(): void
    {
        $this->updatedAt = new \DateTime();
    }
}
```

### Existing Database Schema

The PostgreSQL database is pre-populated by init scripts mounted into the container.
Entities must match these existing tables exactly:

| Table                     | Primary Key                      | Key Columns                                                           |
| ------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| `users`                   | `user_id` (IDENTITY)             | `email` (UNIQUE), `system_role`, `is_active`                          |
| `course`                  | `course_id` (IDENTITY)           | `course_code` (UNIQUE), `teacher_id` (FK → users)                     |
| `enrollment`              | `(user_id, course_id)` composite | `course_role`                                                         |
| `announcement`            | `announcement_id` (IDENTITY)     | `posted_by` (FK → users), `course_id` (FK → course)                   |
| `comment`                 | `comment_id` (IDENTITY)          | `announcement_id` (FK), `user_id` (FK), `parent_comment_id` (self-FK) |
| `assignment`              | `assignment_id` (IDENTITY)       | `created_by` (FK → users), `course_id` (FK → course)                  |
| `submission`              | `submission_id` (IDENTITY)       | `assignment_id` (FK), `student_id` (FK → users), `status`             |
| `grade`                   | `grade_id` (IDENTITY)            | `submission_id` (FK, UNIQUE), `graded_by` (FK → users)                |
| `code_analysis`           | `analysis_id` (IDENTITY)         | `submission_id` (FK, UNIQUE), `status`                                |
| `announcement_attachment` | `attachment_id` (IDENTITY)       | `announcement_id` (FK), `uploaded_by` (FK)                            |
| `submission_attachment`   | `attachment_id` (IDENTITY)       | `submission_id` (FK), `uploaded_by` (FK)                              |
| `assignment_attachment`   | `attachment_id` (IDENTITY)       | `assignment_id` (FK), `uploaded_by` (FK)                              |

All tables with `updated_at` have PostgreSQL triggers (`update_updated_at_column()`) that auto-update the timestamp on row changes.

### DTO Pattern

```php
<?php

namespace App\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

class CreateCourseRequest
{
    #[Assert\NotBlank(message: 'Course code is required')]
    #[Assert\Length(max: 50, maxMessage: 'Course code cannot exceed 50 characters')]
    public string $courseCode;

    #[Assert\NotBlank(message: 'Course name is required')]
    #[Assert\Length(max: 255, maxMessage: 'Course name cannot exceed 255 characters')]
    public string $courseName;

    #[Assert\Length(max: 1000, maxMessage: 'Description cannot exceed 1000 characters')]
    public ?string $description = null;

    #[Assert\Length(max: 50, maxMessage: 'Section cannot exceed 50 characters')]
    public ?string $section = null;

    #[Assert\Length(max: 100, maxMessage: 'Subject cannot exceed 100 characters')]
    public ?string $subject = null;

    #[Assert\NotBlank(message: 'Teacher ID is required')]
    #[Assert\Type(type: 'integer', message: 'Teacher ID must be an integer')]
    public int $teacherId;

    public function __construct(array $data = [])
    {
        $this->courseCode = $data['course_code'] ?? '';
        $this->courseName = $data['course_name'] ?? '';
        $this->description = $data['description'] ?? null;
        $this->section = $data['section'] ?? null;
        $this->subject = $data['subject'] ?? null;
        $this->teacherId = (int) ($data['teacher_id'] ?? 0);
    }
}
```

```php
<?php

namespace App\DTO\Response;

use App\Entity\Course;

class CourseResponse
{
    public int $courseId;
    public string $courseCode;
    public string $courseName;
    public ?string $description;
    public ?string $section;
    public ?string $subject;
    public bool $isOpen;
    public bool $isActive;
    public int $teacherId;
    public string $createdAt;
    public string $updatedAt;

    public static function fromEntity(Course $course): self
    {
        $response = new self();
        $response->courseId = $course->getCourseId();
        $response->courseCode = $course->getCourseCode();
        $response->courseName = $course->getCourseName();
        $response->description = $course->getDescription();
        $response->section = $course->getSection();
        $response->subject = $course->getSubject();
        $response->isOpen = $course->getIsOpen();
        $response->isActive = $course->getIsActive();
        $response->teacherId = $course->getTeacherId();
        $response->createdAt = $course->getCreatedAt()->format('Y-m-d\TH:i:s\Z');
        $response->updatedAt = $course->getUpdatedAt()->format('Y-m-d\TH:i:s\Z');

        return $response;
    }
}
```

```php
<?php

namespace App\DTO\Response;

class ApiResponse
{
    public bool $success;
    public mixed $data;
    public string $message;
    public string $timestamp;

    public static function success(mixed $data, string $message = 'Success'): self
    {
        $response = new self();
        $response->success = true;
        $response->data = $data;
        $response->message = $message;
        $response->timestamp = (new \DateTime())->format('Y-m-d\TH:i:s\Z');

        return $response;
    }

    public static function error(string $message, mixed $errors = null): self
    {
        $response = new self();
        $response->success = false;
        $response->data = $errors;
        $response->message = $message;
        $response->timestamp = (new \DateTime())->format('Y-m-d\TH:i:s\Z');

        return $response;
    }
}
```

---

## Error Handling

### Custom Exceptions

```php
<?php

namespace App\Exception;

use Exception;

class ResourceNotFoundException extends Exception
{
    public function __construct(string $message = 'Resource not found')
    {
        parent::__construct($message, 404);
    }
}
```

```php
<?php

namespace App\Exception;

use Exception;

class ValidationException extends Exception
{
    private array $errors;

    public function __construct(string $message = 'Validation failed', array $errors = [])
    {
        parent::__construct($message, 400);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
```

### Exception Listener

```php
<?php

namespace App\EventListener;

use App\Exception\ResourceNotFoundException;
use App\Exception\ValidationException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $request = $event->getRequest();

        // Only handle API requests
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $statusCode = 500;
        $message = 'An unexpected error occurred';
        $errors = null;

        if ($exception instanceof ResourceNotFoundException) {
            $statusCode = 404;
            $message = $exception->getMessage();
        } elseif ($exception instanceof ValidationException) {
            $statusCode = 400;
            $message = $exception->getMessage();
            $errors = $exception->getErrors();
        } elseif ($exception instanceof HttpExceptionInterface) {
            $statusCode = $exception->getStatusCode();
            $message = $exception->getMessage();
        }

        $data = [
            'success' => false,
            'message' => $message,
            'timestamp' => (new \DateTime())->format('Y-m-d\TH:i:s\Z'),
        ];

        if ($errors !== null) {
            $data['errors'] = $errors;
        }

        $response = new JsonResponse($data, $statusCode);
        $event->setResponse($response);
    }
}
```

---

## Inter-Service Communication

### HTTP Client Service

```php
<?php

namespace App\Service;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class AnalyzerServiceClient
{
    private HttpClientInterface $client;
    private string $baseUrl;

    public function __construct()
    {
        $this->client = HttpClient::create();
        $this->baseUrl = $_ENV['ANALYZER_SERVICE_URL'] ?? 'http://code-analyzer:5000';
    }

    public function analyzeSubmission(int $submissionId, string $repoUrl, int $studentId): array
    {
        $response = $this->client->request('POST', $this->baseUrl . '/analyze', [
            'json' => [
                'submissionId' => $submissionId,
                'repoUrl' => $repoUrl,
                'studentId' => $studentId,
            ],
            'timeout' => 300, // 5 minutes
        ]);

        return $response->toArray();
    }

    public function getAnalysisStatus(int $submissionId): array
    {
        $response = $this->client->request('GET', $this->baseUrl . '/status/' . $submissionId);

        return $response->toArray();
    }
}
```

---

## Configuration

### config/services.yaml

```yaml
parameters:

services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: "../src/"
```

> Note: Symfony 7.4 auto-discovers controllers, event listeners, etc. via `autoconfigure`.
> The `ExceptionListener` tag will be needed once the listener class is created.

### config/packages/doctrine.yaml

```yaml
doctrine:
    dbal:
        url: "%env(resolve:DATABASE_URL)%"

        # Must match the PostgreSQL image version (postgres:16-alpine)
        server_version: "16"

        profiling_collect_backtrace: "%kernel.debug%"
        use_savepoints: true
    orm:
        auto_generate_proxy_classes: true
        enable_lazy_ghost_objects: true
        report_fields_where_declared: true
        validate_xml_mapping: true
        naming_strategy: doctrine.orm.naming_strategy.underscore_number_aware
        identity_generation_preferences:
            Doctrine\DBAL\Platforms\PostgreSQLPlatform: identity
        auto_mapping: true
        mappings:
            App:
                type: attribute
                is_bundle: false
                dir: "%kernel.project_dir%/src/Entity"
                prefix: 'App\Entity'
                alias: App
        controller_resolver:
            auto_mapping: false

when@test:
    doctrine:
        dbal:
            dbname_suffix: "_test%env(default::TEST_TOKEN)%"

when@prod:
    doctrine:
        orm:
            auto_generate_proxy_classes: false
            proxy_dir: "%kernel.build_dir%/doctrine/orm/Proxies"
            query_cache_driver:
                type: pool
                pool: doctrine.system_cache_pool
            result_cache_driver:
                type: pool
                pool: doctrine.result_cache_pool
    framework:
        cache:
            pools:
                doctrine.result_cache_pool:
                    adapter: cache.app
                doctrine.system_cache_pool:
                    adapter: cache.system
```

### Environment Variables (via docker-compose)

```env
# Set by docker-compose environment block — NOT in .env file
DATABASE_URL=postgresql://core_user:CoreSecurePass123!@postgres-db:5432/committed_core?serverVersion=16&charset=utf8

APP_ENV=dev
APP_SECRET=your-secret-key-here

GATEWAY_SERVICE_URL=http://gateway:8080
ANALYZER_SERVICE_URL=http://code-analyzer:5000
NOTIFICATION_SERVICE_URL=http://notifications:5001
```

> **Note**: The `DATABASE_URL` uses the `postgresql://` scheme, which Doctrine auto-detects
> as `pdo_pgsql` driver. The `serverVersion=16` query parameter matches `server_version` in
> `doctrine.yaml`. No explicit `driver` config is needed.

---

## Database Connectivity

### How Doctrine Uses the Existing Database

The PostgreSQL database is initialized by Docker entrypoint scripts (`docker/db/init.sql`,
`01_schema.sql`, `02_seed_data.sql`) when the `postgres-db` container starts for the first
time. Doctrine connects to this **pre-existing database** — it does NOT create or manage the
schema.

Key points:

- **No `doctrine:schema:create`** needed — tables already exist
- **No `doctrine:migrations:migrate`** needed for initial setup
- Entity classes must map to the existing table/column names exactly
- Use `doctrine:schema:validate` to verify entities match the DB schema
- The `identity_generation_preferences` setting ensures Doctrine uses PostgreSQL `IDENTITY`
  columns (not sequences) for auto-increment

### Testing Connectivity

```bash
# Basic connection test via Doctrine DBAL
docker exec committed-core php bin/console dbal:run-sql "SELECT 1"

# List all tables
docker exec committed-core php bin/console dbal:run-sql \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public'"

# Query seed data
docker exec committed-core php bin/console dbal:run-sql "SELECT COUNT(*) FROM users"

# Validate entity mappings against DB (once entities exist)
docker exec committed-core php bin/console doctrine:schema:validate

# Test via HTTP endpoint (from host)
curl http://localhost:8000/health

# Test via web frontend proxy (from host)
curl http://localhost:3000/api/core/health
```

### Health Check Response Format

```json
{
    "status": "ok",
    "database": {
        "connected": true,
        "driver": "pdo_pgsql",
        "tables_count": 12
    },
    "users": {
        "total_count": 11,
        "sample": [
            {
                "user_id": 1,
                "email": "admin@committed.com",
                "full_name": "System Administrator",
                "system_role": "admin",
                "is_active": true,
                "created_at": "2026-02-24 13:58:59.999225"
            }
        ]
    },
    "timestamp": "2026-02-24T14:35:56+00:00"
}
```

On failure (HTTP 503):

```json
{
    "status": "error",
    "database": {
        "connected": false,
        "error": "could not find driver"
    },
    "timestamp": "2026-02-24T14:35:56+00:00"
}
```

---

## Testing

### Unit Test Example

```php
<?php

namespace App\Tests\Service;

use App\Entity\Course;
use App\Repository\CourseRepository;
use App\Service\CourseService;
use App\DTO\Request\CreateCourseRequest;
use App\Exception\ResourceNotFoundException;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;

class CourseServiceTest extends TestCase
{
    private CourseRepository|MockObject $courseRepository;
    private EntityManagerInterface|MockObject $entityManager;
    private CourseService $courseService;

    protected function setUp(): void
    {
        $this->courseRepository = $this->createMock(CourseRepository::class);
        $this->entityManager = $this->createMock(EntityManagerInterface::class);
        $this->courseService = new CourseService(
            $this->courseRepository,
            $this->entityManager,
            $this->createMock(LoggerInterface::class)
        );
    }

    public function testGetCourseById_WithValidId_ReturnsCourse(): void
    {
        // Arrange
        $course = new Course();
        $course->setCourseCode('CS101');
        $course->setCourseName('Introduction to Programming');
        $course->setTeacherId(1);

        $this->courseRepository
            ->expects($this->once())
            ->method('find')
            ->with(1)
            ->willReturn($course);

        // Act
        $result = $this->courseService->getCourseById(1);

        // Assert
        $this->assertEquals('CS101', $result->courseCode);
        $this->assertEquals('Introduction to Programming', $result->courseName);
    }

    public function testGetCourseById_WithInvalidId_ThrowsException(): void
    {
        // Arrange
        $this->courseRepository
            ->expects($this->once())
            ->method('find')
            ->with(999)
            ->willReturn(null);

        // Act & Assert
        $this->expectException(ResourceNotFoundException::class);
        $this->expectExceptionMessage('Course not found');

        $this->courseService->getCourseById(999);
    }
}
```

### Integration Test Example

```php
<?php

namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class CourseControllerTest extends WebTestCase
{
    public function testGetAllCourses(): void
    {
        $client = static::createClient();

        $client->request('GET', '/courses');

        $this->assertResponseIsSuccessful();
        $this->assertResponseHeaderSame('content-type', 'application/json');

        $response = $client->getResponse();
        $data = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('success', $data);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
    }

    public function testGetCourseById_WithValidId_ReturnsCourse(): void
    {
        $client = static::createClient();

        $client->request('GET', '/courses/1');

        $this->assertResponseIsSuccessful();

        $response = $client->getResponse();
        $data = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('success', $data);
        $this->assertTrue($data['success']);
        $this->assertArrayHasKey('data', $data);
        $this->assertEquals(1, $data['data']['courseId']);
    }

    public function testGetCourseById_WithInvalidId_Returns404(): void
    {
        $client = static::createClient();

        $client->request('GET', '/courses/999');

        $this->assertResponseStatusCodeSame(404);

        $response = $client->getResponse();
        $data = json_decode($response->getContent(), true);

        $this->assertArrayHasKey('success', $data);
        $this->assertFalse($data['success']);
    }
}
```

### Test Coverage Target

- **Minimum**: 80% overall coverage
- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Repositories**: 70% coverage

---

## Best Practices

1. **Use dependency injection** with constructor injection
2. **Validate all inputs** using Symfony Validator
3. **Use DTOs** for API requests/responses
4. **Handle exceptions** with custom exception classes
5. **Log important events** using PSR-3 logger
6. **Use transactions** for complex operations
7. **Follow PSR standards** (PSR-4, PSR-12)
8. **Write tests** for all business logic
9. **Use type hints** for all parameters and return types
10. **Keep controllers thin** - business logic in services

---

## Quick Reference Commands

```bash
# === Docker Commands (primary workflow) ===

# Build and start core service
cd docker && docker compose up -d --build core

# View logs
docker logs committed-core --tail 50 -f

# Shell into container
docker exec -it committed-core sh

# Run Symfony console commands inside container
docker exec committed-core php bin/console cache:clear
docker exec committed-core php bin/console debug:router
docker exec committed-core php bin/console doctrine:schema:validate

# Test database connectivity
docker exec committed-core php bin/console dbal:run-sql "SELECT 1"
curl http://localhost:8000/health

# Rebuild from scratch (wipes DB volume too)
cd docker && docker compose down -v && docker compose up -d --build

# === Local Development (without Docker) ===

# Install dependencies
composer install

# Run development server
php -S localhost:8000 -t public

# Run tests
vendor/bin/phpunit

# Run tests with coverage
vendor/bin/phpunit --coverage-html coverage

# Check loaded PHP extensions
php -m | grep pdo
```

---

## Important Notes

### PostgreSQL Database Conventions

This project uses PostgreSQL 16. Key conventions for Doctrine ORM entity mapping:

| Aspect            | PostgreSQL Convention                                  |
| ----------------- | ------------------------------------------------------ |
| Driver            | `pdo_pgsql` (auto-detected from `DATABASE_URL`)        |
| URL scheme        | `postgresql://user:pass@host:5432/db?serverVersion=16` |
| ID generation     | `GENERATED BY DEFAULT AS IDENTITY`                     |
| Doctrine strategy | `IDENTITY` (configured in `doctrine.yaml`)             |
| Connectivity test | `SELECT 1`                                             |
| Text columns      | `TEXT`                                                 |
| Boolean columns   | `BOOLEAN` (native)                                     |
| String columns    | `VARCHAR(n)`                                           |
| Timestamps        | `TIMESTAMP` (maps to `\DateTimeImmutable` in PHP)      |

### Web Frontend Integration

The web frontend (React) can access the core healthcheck via a proxied route:

- **Docker**: `http://localhost:3000/api/core/health` → nginx proxies to `http://core:8000/health`
- **Vite dev**: `http://localhost:3000/api/core/health` → vite proxy to `http://localhost:8000/health`

---

## Resources

- [Symfony 7.4 Documentation](https://symfony.com/doc/7.4/index.html)
- [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/)
- [Doctrine DBAL — PostgreSQL](https://www.doctrine-project.org/projects/doctrine-dbal/en/latest/reference/configuration.html)
- [PHP The Right Way](https://phptherightway.com/)
- [PSR Standards](https://www.php-fig.org/psr/)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [PostgreSQL 16 Documentation](https://www.postgresql.org/docs/16/)
