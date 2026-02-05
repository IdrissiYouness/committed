# Gateway Service Development Skill

## Service Overview

**Service Name**: Gateway Service  
**Technology**: Java Spring Boot  
**Language**: Java 21  
**Port**: 8080  
**IDE**: IntelliJ IDEA  
**Build Tool**: Maven  
**Database**: Oracle Database 21c XE (via JDBC)

---

## Technology Stack & Versions

### Core Dependencies

```xml
<properties>
    <java.version>21</java.version>
    <spring-boot.version>3.4.2</spring-boot.version>
    <oracle-jdbc.version>23.6.0.24.10</oracle-jdbc.version>
</properties>

<dependencies>
    <!-- Spring Boot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <!-- Spring Boot Starter Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    
    <!-- Spring Boot Actuator -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    
    <!-- Oracle JDBC Driver -->
    <dependency>
        <groupId>com.oracle.database.jdbc</groupId>
        <artifactId>ojdbc11</artifactId>
        <version>${oracle-jdbc.version}</version>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Lombok (optional but recommended) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
    
    <!-- Spring Boot DevTools -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-devtools</artifactId>
        <scope>runtime</scope>
        <optional>true</optional>
    </dependency>
    
    <!-- Testing -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.security</groupId>
        <artifactId>spring-security-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

---

## Project Structure

```
services/gateway/
├── src/
│   ├── main/
│   │   ├── java/com/committed/gateway/
│   │   │   ├── GatewayApplication.java          # Main application class
│   │   │   │
│   │   │   ├── config/                          # Configuration classes
│   │   │   │   ├── SecurityConfig.java          # Spring Security configuration
│   │   │   │   ├── JwtConfig.java               # JWT configuration
│   │   │   │   ├── RestTemplateConfig.java      # RestTemplate for inter-service calls
│   │   │   │   ├── CorsConfig.java              # CORS configuration
│   │   │   │   └── SwaggerConfig.java           # API documentation
│   │   │   │
│   │   │   ├── controller/                      # REST controllers
│   │   │   │   ├── AuthController.java          # Authentication endpoints
│   │   │   │   ├── UserController.java          # User management
│   │   │   │   ├── CourseController.java        # Course proxy endpoints
│   │   │   │   ├── AssignmentController.java    # Assignment proxy endpoints
│   │   │   │   └── HealthController.java        # Health check
│   │   │   │
│   │   │   ├── dto/                             # Data Transfer Objects
│   │   │   │   ├── request/
│   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   └── RefreshTokenRequest.java
│   │   │   │   └── response/
│   │   │   │       ├── AuthResponse.java
│   │   │   │       ├── UserResponse.java
│   │   │   │       ├── ApiResponse.java
│   │   │   │       └── ErrorResponse.java
│   │   │   │
│   │   │   ├── entity/                          # JPA entities
│   │   │   │   ├── User.java
│   │   │   │   ├── Course.java
│   │   │   │   ├── Assignment.java
│   │   │   │   └── Submission.java
│   │   │   │
│   │   │   ├── repository/                      # JPA repositories
│   │   │   │   ├── UserRepository.java
│   │   │   │   ├── CourseRepository.java
│   │   │   │   └── AssignmentRepository.java
│   │   │   │
│   │   │   ├── service/                         # Business logic
│   │   │   │   ├── AuthService.java
│   │   │   │   ├── UserService.java
│   │   │   │   ├── JwtService.java
│   │   │   │   ├── CoreServiceClient.java       # HTTP client for Core service
│   │   │   │   ├── AnalyzerServiceClient.java   # HTTP client for Analyzer
│   │   │   │   └── NotificationServiceClient.java
│   │   │   │
│   │   │   ├── security/                        # Security components
│   │   │   │   ├── JwtAuthenticationFilter.java # JWT filter
│   │   │   │   ├── JwtAuthenticationEntryPoint.java
│   │   │   │   ├── UserDetailsServiceImpl.java
│   │   │   │   └── SecurityUtils.java
│   │   │   │
│   │   │   ├── exception/                       # Custom exceptions
│   │   │   │   ├── GlobalExceptionHandler.java  # Global exception handler
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   ├── UnauthorizedException.java
│   │   │   │   ├── ValidationException.java
│   │   │   │   └── ServiceUnavailableException.java
│   │   │   │
│   │   │   └── util/                            # Utility classes
│   │   │       ├── Constants.java
│   │   │       ├── DateUtils.java
│   │   │       └── ValidationUtils.java
│   │   │
│   │   └── resources/
│   │       ├── application.yml                  # Main configuration
│   │       ├── application-dev.yml              # Development profile
│   │       ├── application-prod.yml             # Production profile
│   │       └── logback-spring.xml               # Logging configuration
│   │
│   └── test/
│       └── java/com/committed/gateway/
│           ├── controller/                      # Controller tests
│           ├── service/                         # Service tests
│           ├── security/                        # Security tests
│           └── integration/                     # Integration tests
│
├── pom.xml                                      # Maven configuration
├── Dockerfile                                   # Docker build instructions
└── README.md                                    # Service documentation
```

---

## Code Style & Conventions

### Naming Conventions

#### Classes
```java
// Use PascalCase
public class UserController { }
public class AuthService { }
public class JwtAuthenticationFilter { }
```

#### Methods
```java
// Use camelCase, start with verb
public User findUserById(Long id) { }
public void deleteUser(Long id) { }
public boolean isUserActive(Long id) { }
```

#### Variables
```java
// Use camelCase
private String userName;
private Long userId;
private boolean isActive;
```

#### Constants
```java
// Use UPPER_SNAKE_CASE
public static final String JWT_SECRET_KEY = "secret";
public static final int TOKEN_EXPIRATION_TIME = 86400000;
public static final String API_VERSION = "v1";
```

#### Packages
```java
// Use lowercase, singular nouns
package com.committed.gateway.controller;
package com.committed.gateway.service;
package com.committed.gateway.entity;
```

### Code Formatting

Use **Google Java Style Guide** with these modifications:
- **Indentation**: 4 spaces
- **Line length**: 120 characters
- **Braces**: Always use braces, even for single-line blocks

IntelliJ IDEA Settings:
```
Settings → Editor → Code Style → Java
- Scheme: Google Style
- Tab size: 4
- Indent: 4
- Continuation indent: 8
```

### Annotation Order

```java
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        // Implementation
    }
}
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

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        
        log.info("Login attempt for email: {}", request.getEmail());
        
        AuthResponse response = authService.login(request);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }
    
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        
        log.info("Registration attempt for email: {}", request.getEmail());
        
        AuthResponse response = authService.register(request);
        
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Registration successful"));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        
        AuthResponse response = authService.refreshToken(request.getRefreshToken());
        
        return ResponseEntity.ok(ApiResponse.success(response, "Token refreshed"));
    }
}
```

### Service Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
        
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        
        if (!user.getIsActive()) {
            throw new UnauthorizedException("Account is inactive");
        }
        
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        log.info("User logged in successfully: {}", user.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.fromEntity(user))
                .build();
    }
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email already registered");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .systemRole("user")
                .isActive(true)
                .build();
        
        user = userRepository.save(user);
        
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        log.info("User registered successfully: {}", user.getEmail());
        
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserResponse.fromEntity(user))
                .build();
    }
}
```

### Repository Pattern

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.systemRole = :role AND u.isActive = true")
    List<User> findActiveUsersByRole(@Param("role") String role);
    
    @Query("SELECT u FROM User u WHERE u.fullName LIKE %:search% OR u.email LIKE %:search%")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
}
```

### Entity Pattern

```java
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_system_role", columnList = "system_role")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
    @SequenceGenerator(name = "user_seq", sequenceName = "seq_user_id", allocationSize = 1)
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;
    
    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;
    
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    
    @Column(name = "system_role", nullable = false, length = 20)
    private String systemRole; // "user" or "admin"
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### DTO Pattern

```java
// Request DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}

// Response DTO
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    
    private Long userId;
    private String email;
    private String fullName;
    private String systemRole;
    private Boolean isActive;
    private LocalDateTime createdAt;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .systemRole(user.getSystemRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

// Generic API Response
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    
    private boolean success;
    private T data;
    private String message;
    private LocalDateTime timestamp;
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
```

---

## Security Configuration

### JWT Service

```java
@Service
@RequiredArgsConstructor
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration}")
    private Long expiration;
    
    @Value("${jwt.refresh-expiration}")
    private Long refreshExpiration;
    
    public String generateAccessToken(User user) {
        return generateToken(user, expiration);
    }
    
    public String generateRefreshToken(User user) {
        return generateToken(user, refreshExpiration);
    }
    
    private String generateToken(User user, Long expirationTime) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationTime);
        
        return Jwts.builder()
                .setSubject(user.getUserId().toString())
                .claim("email", user.getEmail())
                .claim("role", user.getSystemRole())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }
    
    public Long getUserIdFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
    
    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

### Security Configuration

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/health", "/actuator/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(exception -> 
                exception.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### JWT Authentication Filter

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String token = extractTokenFromRequest(request);
            
            if (token != null && jwtService.validateToken(token)) {
                Long userId = jwtService.getUserIdFromToken(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

---

## Error Handling

### Global Exception Handler

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        log.error("Resource not found: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error("Not Found")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException ex) {
        log.error("Unauthorized: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Unauthorized")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        log.error("Validation error: {}", ex.getMessage());
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Error")
                .message(ex.getMessage())
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex) {
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Error")
                .message("Invalid input data")
                .details(errors)
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error: ", ex);
        
        ErrorResponse error = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("An unexpected error occurred")
                .timestamp(LocalDateTime.now())
                .build();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

---

## Inter-Service Communication

### RestTemplate Configuration

```java
@Configuration
public class RestTemplateConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        
        // Add interceptor for logging
        restTemplate.setInterceptors(Collections.singletonList(
            (request, body, execution) -> {
                log.debug("Request: {} {}", request.getMethod(), request.getURI());
                ClientHttpResponse response = execution.execute(request, body);
                log.debug("Response: {}", response.getStatusCode());
                return response;
            }
        ));
        
        // Configure timeout
        HttpComponentsClientHttpRequestFactory factory = 
            new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        restTemplate.setRequestFactory(factory);
        
        return restTemplate;
    }
}
```

### Service Client Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class CoreServiceClient {
    
    private final RestTemplate restTemplate;
    
    @Value("${services.core.url}")
    private String coreServiceUrl;
    
    public CourseResponse getCourseById(Long courseId) {
        String url = coreServiceUrl + "/courses/" + courseId;
        
        try {
            return restTemplate.getForObject(url, CourseResponse.class);
        } catch (HttpClientErrorException e) {
            log.error("Error calling Core service: {}", e.getMessage());
            throw new ServiceUnavailableException("Core service unavailable");
        }
    }
    
    public List<CourseResponse> getAllCourses() {
        String url = coreServiceUrl + "/courses";
        
        try {
            CourseResponse[] courses = restTemplate.getForObject(url, CourseResponse[].class);
            return Arrays.asList(courses);
        } catch (HttpClientErrorException e) {
            log.error("Error calling Core service: {}", e.getMessage());
            throw new ServiceUnavailableException("Core service unavailable");
        }
    }
    
    public CourseResponse createCourse(CreateCourseRequest request) {
        String url = coreServiceUrl + "/courses";
        
        try {
            return restTemplate.postForObject(url, request, CourseResponse.class);
        } catch (HttpClientErrorException e) {
            log.error("Error calling Core service: {}", e.getMessage());
            throw new ServiceUnavailableException("Core service unavailable");
        }
    }
}
```

---

## API Conventions

### Endpoint Naming

```
GET    /api/users              # List all users
GET    /api/users/{id}         # Get user by ID
POST   /api/users              # Create new user
PUT    /api/users/{id}         # Update user
DELETE /api/users/{id}         # Delete user

GET    /api/courses/{id}/students    # Get students in course
POST   /api/courses/{id}/enroll      # Enroll in course
```

### Request/Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "message": "User retrieved successfully",
  "timestamp": "2026-02-05T18:00:00"
}
```

#### Error Response
```json
{
  "status": 400,
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": {
    "email": "Email is required",
    "password": "Password must be at least 8 characters"
  },
  "timestamp": "2026-02-05T18:00:00"
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Validation error
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Configuration

### application.yml

```yaml
spring:
  application:
    name: gateway-service
  
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:oracle:thin:@localhost:1521/XEPDB1}
    username: ${SPRING_DATASOURCE_USERNAME:committed_user}
    password: ${SPRING_DATASOURCE_PASSWORD:SecurePassword123!}
    driver-class-name: oracle.jdbc.OracleDriver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.OracleDialect
        format_sql: true
  
  security:
    user:
      name: admin
      password: admin

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

jwt:
  secret: ${JWT_SECRET:your-super-secret-jwt-key-change-this-in-production-min-256-bits}
  expiration: ${JWT_EXPIRATION:86400000}  # 24 hours
  refresh-expiration: 604800000  # 7 days

services:
  core:
    url: ${CORE_SERVICE_URL:http://core:8000}
  analyzer:
    url: ${ANALYZER_SERVICE_URL:http://code-analyzer:5000}
  notification:
    url: ${NOTIFICATION_SERVICE_URL:http://notifications:5001}

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

logging:
  level:
    com.committed.gateway: DEBUG
    org.springframework.security: DEBUG
    org.hibernate.SQL: DEBUG
```

---

## Testing

### Unit Test Example

```java
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @Mock
    private JwtService jwtService;
    
    @InjectMocks
    private AuthService authService;
    
    @Test
    void login_WithValidCredentials_ReturnsAuthResponse() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        User user = User.builder()
                .userId(1L)
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .isActive(true)
                .build();
        
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash()))
                .thenReturn(true);
        when(jwtService.generateAccessToken(user))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(user))
                .thenReturn("refresh-token");
        
        // Act
        AuthResponse response = authService.login(request);
        
        // Assert
        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(userRepository).findByEmail(request.getEmail());
    }
    
    @Test
    void login_WithInvalidCredentials_ThrowsUnauthorizedException() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        
        when(userRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(UnauthorizedException.class, () -> authService.login(request));
    }
}
```

### Integration Test Example

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Test
    void login_WithValidCredentials_ReturnsToken() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists());
    }
    
    @Test
    void login_WithInvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");
        
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
```

### Test Coverage Target
- **Minimum**: 80% overall coverage
- **Services**: 90% coverage
- **Controllers**: 80% coverage
- **Repositories**: 70% coverage (mostly integration tests)

---

## Best Practices

1. **Use constructor injection** with `@RequiredArgsConstructor` (Lombok)
2. **Validate all inputs** using `@Valid` and Bean Validation annotations
3. **Log important events** (login, errors, service calls)
4. **Use DTOs** for API requests/responses, never expose entities directly
5. **Handle exceptions** globally with `@RestControllerAdvice`
6. **Use transactions** (`@Transactional`) for database operations
7. **Secure endpoints** with `@PreAuthorize` or `@Secured`
8. **Document APIs** with Swagger/OpenAPI
9. **Write tests** for all business logic
10. **Follow REST conventions** for endpoint naming and HTTP methods

---

## Quick Reference Commands

```bash
# Build
./mvnw clean install

# Run
./mvnw spring-boot:run

# Run with profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Test
./mvnw test

# Test with coverage
./mvnw test jacoco:report

# Package
./mvnw package

# Skip tests
./mvnw package -DskipTests

# Format code
./mvnw spring-javaformat:apply
```

---

## Resources

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/)
- [Spring Data JPA Documentation](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [JWT.io](https://jwt.io/)
- [Oracle JDBC Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/21/jjdbc/)
