# Gateway Service

Java Spring Boot service — the single entry point for all client API traffic on the Committed platform. Handles JWT authentication, authorization, rate limiting, and request proxying to backend services.

## Technology Stack

- Java 17
- Spring Boot 3.2
- Spring Security 6 (stateless, JWT-based)
- io.jsonwebtoken (JWT generation & validation)
- Spring Data Redis / Jedis (JWT blacklist + token versioning)
- RestTemplate (HTTP proxy to Core, Code Analyzer, Notifications)
- Spring Async (`@Async` for fire-and-forget notifications)

## Responsibility Map

| Layer | What it does |
|---|---|
| `RateLimitFilter` | Limits request rate before JWT is parsed |
| `InternalAuthFilter` | Validates `X-Internal-Secret` on `/internal/*` routes |
| `JwtAuthenticationFilter` | Extracts Bearer token, checks blacklist + tokenVersion, builds `JwtPrincipal` |
| Controllers | Route/method-level authorization via `@PreAuthorize` |
| Services | Business logic, data-level ownership checks, async notifications |
| `TokenBlacklistService` | Redis-backed JTI blacklist + per-user token version counters |

## API Endpoints

All routes are prefixed `/api/` when accessed through Nginx.

### Public (no token required)
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Gateway liveness check |
| GET | `/core/health` | Proxied Core health check |
| GET | `/test-chain` | End-to-end chain test (Gateway → Core → DB) |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Login and receive JWT tokens |
| POST | `/api/token/refresh` | Rotate refresh token and get new access token |

### Authenticated
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/logout` | Blacklist current tokens |
| GET | `/api/token/validate` | Validate token and return claims |
| GET/PUT | `/api/users/profile` | Get or update own profile |
| POST | `/api/users/profile/change-password` | Change password (invalidates all sessions) |
| GET/PUT/DELETE | `/api/admin/users[/{id}]` | Admin user management |
| GET/POST | `/api/courses[/enroll]` | List courses or enroll by code |
| GET/PUT/DELETE | `/api/courses/{id}` | Single course CRUD |
| DELETE | `/api/courses/{id}/enroll` | Unenroll from a course |
| GET | `/api/courses/{id}/students` | List enrolled students |
| GET | `/api/courses/{id}/stats` | Course statistics |
| GET/POST | `/api/courses/{id}/assignments` | List or create assignments |
| GET/PUT/DELETE | `/api/assignments/{id}` | Single assignment CRUD |
| GET | `/api/assignments/{id}/attachments/{aId}` | Download assignment attachment |
| GET/POST | `/api/assignments/{id}/submissions` | List or create submissions |
| GET/PUT | `/api/submissions/{id}` | Get or update submission |
| GET | `/api/submissions/{id}/analysis` | Get AI analysis result |
| GET | `/api/submissions/{id}/attachments/{aId}` | Download submission attachment |
| POST/GET | `/api/submissions/{id}/grade` | Grade or get grade |
| PUT | `/api/grades/{id}` | Update a grade |
| POST | `/api/grades/{id}/validate` | Finalize AI-suggested grade |
| GET | `/api/grades/recent` | Recent grades for current user |
| GET/POST | `/api/courses/{id}/announcements` | List or create announcements |
| PUT/DELETE | `/api/courses/{cId}/announcements/{id}` | Update or delete announcement |
| GET | `/api/courses/{cId}/announcements/{aId}/attachments/{id}` | Download attachment |
| GET/POST | `/api/courses/{cId}/announcements/{aId}/comments` | List or create comments |
| PUT/DELETE | `/api/courses/{cId}/announcements/{aId}/comments/{id}` | Update or delete comment |

### Internal (Docker network only)
| Method | Path | Caller |
|---|---|---|
| POST | `/internal/analysis-result` | Code Analyzer (callback with results) |

## JWT Security Model

```
Access token:  24h lifetime, claims: userId, email, fullName, systemRole, tokenVersion, jti
Refresh token: 7d lifetime, type="refresh" claim, rotated on each use

Redis keys:
  blacklist:{jti}          → set on logout / token rotation (TTL = remaining lifetime)
  token_version:{userId}   → incremented on password change or deactivation (no TTL)
```

Every authenticated request checks **both** Redis keys. A mismatch on either → 401.

## IDE Setup (IntelliJ IDEA)

1. **File → Open** → select `services/gateway`
2. IntelliJ detects the Maven project and imports dependencies automatically
3. Wait for indexing to complete

### Run Configuration

**Run → Edit Configurations → Add → Spring Boot**

- Main class: `com.committed.gateway.GatewayApplication`
- Environment variables (minimum for local dev):

```
CORE_SERVICE_URL=http://localhost:8000
ANALYZER_SERVICE_URL=http://localhost:5000
NOTIFICATION_SERVICE_URL=http://localhost:5001
JWT_SECRET=your-secret-key-at-least-32-bytes-long
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
INTERNAL_SECRET=dev-internal-secret
```

## Local Development

```bash
# Build and run
./mvnw spring-boot:run

# Build JAR only
./mvnw clean package -DskipTests

# Run JAR
java -jar target/gateway-*.jar
```

## Docker

```bash
# Build image
docker build -t committed-gateway .

# Run (requires running Redis + Core)
docker run -p 8080:8080 \
  -e CORE_SERVICE_URL=http://core:8000 \
  -e JWT_SECRET=change-me \
  -e REDIS_HOST=redis \
  committed-gateway
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `CORE_SERVICE_URL` | Core service base URL | `http://core:8000` |
| `ANALYZER_SERVICE_URL` | Code Analyzer base URL | `http://code-analyzer:5000` |
| `NOTIFICATION_SERVICE_URL` | Notifications base URL | `http://notifications:5001` |
| `JWT_SECRET` | HS256 signing key (min 32 bytes) | **required** |
| `JWT_EXPIRATION` | Access token TTL in ms | `86400000` (24h) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL in ms | `604800000` (7d) |
| `JWT_ISSUER` | JWT issuer claim | `committed-gateway` |
| `REDIS_HOST` | Redis hostname | `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | _(empty)_ |
| `INTERNAL_SECRET` | `X-Internal-Secret` header value | **required** |

## Project Structure

```
services/gateway/src/main/java/com/committed/gateway/
├── GatewayApplication.java
├── config/
│   ├── AsyncConfig.java          # @Async thread pool
│   ├── JwtConfig.java            # JWT property binding
│   ├── RestTemplateConfig.java   # HTTP client bean
│   └── SecurityConfig.java       # Filter chain, CORS, public routes
├── controller/
│   ├── AuthController.java
│   ├── TokenController.java
│   ├── ProfileController.java
│   ├── AdminController.java
│   ├── CourseController.java
│   ├── AssignmentController.java
│   ├── SubmissionController.java
│   ├── GradeController.java
│   ├── AnnouncementController.java
│   ├── CommentController.java
│   └── HealthController.java
├── service/
│   ├── AuthService.java
│   ├── ProfileService.java
│   ├── AdminService.java
│   ├── TokenBlacklistService.java    # Redis blacklist + version
│   ├── CodeAnalyzerService.java      # Async analysis trigger
│   ├── HttpNotificationService.java  # Fire-and-forget email events
│   └── NotificationService.java      # Interface
├── security/
│   ├── JwtTokenProvider.java         # Token generation & validation
│   ├── JwtAuthenticationFilter.java  # Per-request auth chain
│   ├── JwtAuthenticationEntryPoint.java
│   └── JwtPrincipal.java             # @AuthenticationPrincipal record
├── client/                           # RestTemplate wrappers for each service
├── dto/                              # Request/response data transfer objects
└── exception/
```
