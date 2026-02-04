# API Documentation

## Base URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost/api |
| Docker | http://localhost/api |

All API requests go through Nginx which routes `/api/*` to the Gateway service.

---

## Health Endpoints

### Gateway Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "gateway",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Core Health
```http
GET http://localhost:8000/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "core",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Code Analyzer Health
```http
GET http://localhost:5000/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "code-analyzer",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Notifications Health
```http
GET http://localhost:5001/health
```

**Response:**
```json
{
  "status": "UP",
  "service": "notifications",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

---

## Test Endpoints

### Test Chain (End-to-End Connectivity)
```http
GET /api/test-chain
```

Tests the full service chain: Gateway → Core → Database

**Response (Success):**
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

**Response (Partial Failure):**
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

**Response (Error):**
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

### Database Test (Core)
```http
GET http://localhost:8000/db-test
```

**Response:**
```json
{
  "service": "core",
  "database": "connected",
  "message": "Oracle database connected successfully",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Database Test (Code Analyzer)
```http
GET http://localhost:5000/db-test
```

**Response:**
```json
{
  "service": "code-analyzer",
  "database": "connected",
  "message": "Oracle database connected successfully",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Database Test (Notifications)
```http
GET http://localhost:5001/db-test
```

**Response:**
```json
{
  "service": "notifications",
  "database": "connected",
  "message": "Oracle database connected successfully",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

---

## Spring Actuator Endpoints (Gateway)

### Actuator Health
```http
GET /api/actuator/health
```

**Response:**
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "Oracle",
        "validationQuery": "SELECT 1 FROM DUAL"
      }
    },
    "diskSpace": {
      "status": "UP"
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

---

## Placeholder Endpoints

These endpoints are scaffolded but not yet implemented:

### Analyze Code (Code Analyzer)
```http
POST http://localhost:5000/analyze
Content-Type: application/json

{
  "submissionId": "123",
  "repoUrl": "https://github.com/user/repo",
  "studentId": "456"
}
```

**Response:**
```json
{
  "status": "not_implemented",
  "message": "Code analysis endpoint - to be implemented",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### Send Notification (Notifications)
```http
POST http://localhost:5001/notify
Content-Type: application/json

{
  "userId": "456",
  "type": "SUBMISSION_ANALYZED",
  "subject": "Your code has been analyzed",
  "message": "Analysis complete for submission #123"
}
```

**Response:**
```json
{
  "status": "not_implemented",
  "message": "Notification endpoint - to be implemented",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request body",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2026-02-03T13:00:00.000Z"
}
```

---

## Testing with cURL

### Test All Services

```bash
# Test Gateway
curl http://localhost/api/health

# Test full chain
curl http://localhost/api/test-chain

# Test Core directly
curl http://localhost:8000/health
curl http://localhost:8000/db-test

# Test Code Analyzer directly
curl http://localhost:5000/health
curl http://localhost:5000/db-test

# Test Notifications directly
curl http://localhost:5001/health
curl http://localhost:5001/db-test

# Test Spring Actuator
curl http://localhost/api/actuator/health
```

### Test with JSON Output

```bash
# Pretty print JSON
curl -s http://localhost/api/test-chain | python -m json.tool

# Or with jq
curl -s http://localhost/api/test-chain | jq .
```

---

## Service Communication

### Internal Service URLs (Docker Network)

| Service | Internal URL |
|---------|--------------|
| Gateway | http://gateway:8080 |
| Core | http://core:8000 |
| Code Analyzer | http://code-analyzer:5000 |
| Notifications | http://notifications:5001 |
| Oracle DB | oracle-db:1521 |

### Example: Gateway calling Core

```java
// In Gateway service
String coreUrl = "http://core:8000/db-test";
ResponseEntity<Map> response = restTemplate.getForEntity(coreUrl, Map.class);
```

### Example: Core calling Analyzer

```php
// In Core service
$response = $httpClient->request('POST', 'http://code-analyzer:5000/analyze', [
    'json' => [
        'submissionId' => $submissionId,
        'repoUrl' => $repoUrl
    ]
]);
```

### Example: Analyzer calling Notifications

```python
# In Code Analyzer service
import requests

response = requests.post('http://notifications:5001/notify', json={
    'userId': user_id,
    'type': 'SUBMISSION_ANALYZED',
    'subject': 'Analysis Complete',
    'message': f'Your submission #{submission_id} has been analyzed'
})
```
