# Core Service Development Skill

## Service Overview

**Service Name**: Core Service  
**Technology**: PHP Symfony  
**Language**: PHP 8.2+  
**Port**: 8000  
**IDE**: PhpStorm  
**Build Tool**: Composer  
**Database**: Oracle Database 21c XE (via OCI8)

---

## Technology Stack & Versions

### Core Dependencies

```json
{
  "require": {
    "php": ">=8.2",
    "symfony/console": "7.2.*",
    "symfony/dotenv": "7.2.*",
    "symfony/flex": "^2",
    "symfony/framework-bundle": "7.2.*",
    "symfony/runtime": "7.2.*",
    "symfony/yaml": "7.2.*",
    "doctrine/doctrine-bundle": "^2.11",
    "doctrine/orm": "^3.0",
    "symfony/validator": "7.2.*",
    "symfony/serializer": "7.2.*",
    "symfony/http-client": "7.2.*",
    "symfony/messenger": "7.2.*",
    "nelmio/cors-bundle": "^2.3"
  },
  "require-dev": {
    "phpunit/phpunit": "^10.5",
    "symfony/phpunit-bridge": "^7.2",
    "symfony/maker-bundle": "^1.52",
    "friendsofphp/php-cs-fixer": "^3.41",
    "phpstan/phpstan": "^1.10"
  }
}
```

---

## Project Structure

```
services/core/
├── config/
│   ├── bundles.php
│   ├── services.yaml
│   ├── routes.yaml
│   └── packages/
│       ├── doctrine.yaml
│       ├── framework.yaml
│       └── validator.yaml
├── public/
│   └── index.php
├── src/
│   ├── Controller/
│   │   ├── AuthController.php
│   │   ├── CourseController.php
│   │   ├── AssignmentController.php
│   │   ├── SubmissionController.php
│   │   ├── AnnouncementController.php
│   │   └── HealthController.php
│   ├── Entity/
│   │   ├── User.php
│   │   ├── Course.php
│   │   ├── Enrollment.php
│   │   ├── Assignment.php
│   │   ├── Submission.php
│   │   ├── Announcement.php
│   │   ├── Comment.php
│   │   ├── Grade.php
│   │   └── CodeAnalysis.php
│   ├── Repository/
│   │   ├── UserRepository.php
│   │   ├── CourseRepository.php
│   │   ├── EnrollmentRepository.php
│   │   ├── AssignmentRepository.php
│   │   ├── SubmissionRepository.php
│   │   └── AnnouncementRepository.php
│   ├── Service/
│   │   ├── CourseService.php
│   │   ├── AssignmentService.php
│   │   ├── SubmissionService.php
│   │   ├── AnnouncementService.php
│   │   └── AnalyzerServiceClient.php
│   ├── DTO/
│   │   ├── Request/
│   │   │   ├── CreateCourseRequest.php
│   │   │   ├── UpdateCourseRequest.php
│   │   │   └── CreateAssignmentRequest.php
│   │   └── Response/
│   │       ├── CourseResponse.php
│   │       ├── AssignmentResponse.php
│   │       └── ApiResponse.php
│   ├── Exception/
│   │   ├── ResourceNotFoundException.php
│   │   ├── ValidationException.php
│   │   └── UnauthorizedException.php
│   ├── EventListener/
│   │   └── ExceptionListener.php
│   └── Kernel.php
├── tests/
│   ├── Controller/
│   ├── Service/
│   └── Repository/
├── composer.json
├── Dockerfile
└── README.md
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
Repository Layer (Data Access)
    ↓
Database
```

### Controller Pattern

```php
<?php

namespace App\Controller;

use App\Service\CourseService;
use App\DTO\Request\CreateCourseRequest;
use App\DTO\Response\CourseResponse;
use App\DTO\Response\ApiResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
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
    #[ORM\GeneratedValue(strategy: 'SEQUENCE')]
    #[ORM\SequenceGenerator(sequenceName: 'seq_course_id', allocationSize: 1)]
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
    env(DATABASE_URL): ''

services:
    _defaults:
        autowire: true
        autoconfigure: true

    App\:
        resource: '../src/'
        exclude:
            - '../src/DependencyInjection/'
            - '../src/Entity/'
            - '../src/Kernel.php'

    App\Controller\:
        resource: '../src/Controller/'
        tags: ['controller.service_arguments']

    App\EventListener\ExceptionListener:
        tags:
            - { name: kernel.event_listener, event: kernel.exception }
```

### config/packages/doctrine.yaml

```yaml
doctrine:
    dbal:
        url: '%env(resolve:DATABASE_URL)%'
        driver: 'oci8'
        charset: UTF8
        default_table_options:
            charset: UTF8
            collate: UTF8_unicode_ci

    orm:
        auto_generate_proxy_classes: true
        enable_lazy_ghost_objects: true
        report_fields_where_declared: true
        validate_xml_mapping: true
        naming_strategy: doctrine.orm.naming_strategy.underscore_number_aware
        auto_mapping: true
        mappings:
            App:
                type: attribute
                is_bundle: false
                dir: '%kernel.project_dir%/src/Entity'
                prefix: 'App\Entity'
                alias: App
```

### .env

```env
APP_ENV=dev
APP_SECRET=your-secret-key-here

DATABASE_URL=oci8://committed_user:SecurePassword123!@oracle-db:1521/XEPDB1

ANALYZER_SERVICE_URL=http://code-analyzer:5000
NOTIFICATION_SERVICE_URL=http://notifications:5001
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
# Install dependencies
composer install

# Run development server
php -S localhost:8000 -t public

# Run console commands
bin/console cache:clear
bin/console doctrine:schema:validate
bin/console doctrine:migrations:migrate

# Run tests
vendor/bin/phpunit

# Run tests with coverage
vendor/bin/phpunit --coverage-html coverage

# Code style check
vendor/bin/php-cs-fixer check

# Code style fix
vendor/bin/php-cs-fixer fix

# Static analysis
vendor/bin/phpstan analyse src
```

---

## Resources

- [Symfony Documentation](https://symfony.com/doc/current/index.html)
- [Doctrine ORM Documentation](https://www.doctrine-project.org/projects/doctrine-orm/en/latest/)
- [PHP The Right Way](https://phptherightway.com/)
- [PSR Standards](https://www.php-fig.org/psr/)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
