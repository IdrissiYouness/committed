# Committed Architecture

## Overview

Committed is a microservices-based educational platform for automated code submission and analysis, similar to Google Classroom.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              External Clients                                │
│                         (Browsers, Mobile Apps, API)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Nginx Reverse Proxy                               │
│                              (Port 80)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /api/*  →  Gateway Service                                          │   │
│  │  /*      →  Web Frontend                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
┌───────────────────────────────┐     ┌───────────────────────────────┐
│      Gateway Service          │     │       Web Frontend            │
│    (Java Spring Boot)         │     │ (React + Vite + Tailwind CSS) │
│        Port 8080              │     │        Port 3000              │
│                               │     │                               │
│  • Authentication (JWT)       │     │  • User Interface             │
│  • Request Routing            │     │  • Dashboard                  │
│  • Rate Limiting              │     │  • Course Management          │
│  • API Gateway                │     │  • Submission Interface       │
└───────────────────────────────┘     └───────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────────┐
        ▼           ▼           ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Core Service │ │ Code Analyzer│ │ Notifications│
│(PHP Symfony) │ │(Python Flask)│ │ (.NET Core)  │
│  Port 8000   │ │  Port 5000   │ │  Port 5001   │
│              │ │              │ │              │
│• Courses     │ │• Git Clone   │ │• Email       │
│• Assignments │ │• Code Parse  │ │• Push Notif  │
│• Submissions │ │• AI Analysis │ │• In-App      │
│• Users       │ │• Grading     │ │• Templates   │
└──────────────┘ └──────────────┘ └──────────────┘
        │               │               │
        └───────────────┼───────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Oracle Database XE 21c                              │
│                              (Port 1521)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • Users & Authentication                                            │   │
│  │  • Courses & Enrollments                                             │   │
│  │  • Assignments & Submissions                                         │   │
│  │  • Analysis Results & Grades                                         │   │
│  │  • Notification History                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Responsibilities

### Gateway Service (Java Spring Boot)
- **Authentication**: JWT-based authentication and authorization
- **Routing**: Routes requests to appropriate backend services
- **Rate Limiting**: Prevents abuse and ensures fair usage
- **API Gateway**: Single entry point for all API requests

### Core Service (PHP Symfony)
- **Course Management**: CRUD operations for courses
- **Assignment Management**: Create, update, delete assignments
- **Submission Handling**: Process student code submissions
- **User Management**: Student and instructor profiles

### Code Analyzer Service (Python Flask)
- **Repository Cloning**: Clone GitHub repositories for analysis
- **Code Parsing**: Parse and analyze code structure
- **AI Analysis**: Use OpenAI for intelligent code review
- **Grading**: Automated grading based on criteria

### Notifications Service (.NET Core)
- **Email Notifications**: Send emails via SMTP
- **Push Notifications**: Browser push notifications
- **In-App Notifications**: Real-time notifications
- **Templates**: Manage notification templates

### Web Frontend (React + Vite + Tailwind CSS)
- **User Interface**: Modern, responsive UI styled with Tailwind CSS utility classes
- **Dashboard**: Overview of courses and submissions
- **Course Management**: UI for managing courses
- **Submission Interface**: Code submission and results view
- **Styling**: Utility-first approach via Tailwind CSS — no custom CSS files or inline styles needed

## Communication Patterns

### Synchronous (HTTP REST)
All services communicate via HTTP REST APIs using Docker network DNS resolution.

```
Gateway → Core:        http://core:8000/api/...
Gateway → Analyzer:    http://code-analyzer:5000/api/...
Gateway → Notifications: http://notifications:5001/api/...
Core → Analyzer:       http://code-analyzer:5000/api/...
Analyzer → Notifications: http://notifications:5001/api/...
```

### Request Flow Example

```
1. User submits code via Web Frontend
   └─→ POST http://localhost/api/submissions

2. Nginx routes to Gateway
   └─→ POST http://gateway:8080/submissions

3. Gateway authenticates and forwards to Core
   └─→ POST http://core:8000/submissions

4. Core saves submission and triggers analysis
   └─→ POST http://code-analyzer:5000/analyze

5. Analyzer clones repo, analyzes, and notifies
   └─→ POST http://notifications:5001/notify

6. Response flows back through the chain
```

## Docker Network

All services are connected via the `committed-network` bridge network:

```yaml
networks:
  committed-network:
    driver: bridge
```

This allows services to communicate using container names as hostnames.

## Data Flow

```
┌──────────┐    ┌─────────┐    ┌──────┐    ┌──────────┐
│  Client  │───▶│  Nginx  │───▶│ Gate │───▶│   Core   │
└──────────┘    └─────────┘    │ way  │    └────┬─────┘
                               └──────┘         │
                                   │            ▼
                                   │      ┌──────────┐
                                   │      │ Database │
                                   │      └──────────┘
                                   │            ▲
                                   ▼            │
                              ┌──────────┐      │
                              │ Analyzer │──────┘
                              └────┬─────┘
                                   │
                                   ▼
                              ┌──────────┐
                              │  Notif   │
                              └──────────┘
```

## Security Considerations

1. **JWT Authentication**: All API requests require valid JWT tokens
2. **HTTPS**: Use SSL/TLS in production (configure in Nginx)
3. **Rate Limiting**: Prevent abuse at Gateway level
4. **Input Validation**: Validate all inputs in each service
5. **SQL Injection Prevention**: Use parameterized queries
6. **CORS**: Configured in Nginx for cross-origin requests

## Scalability

Each service can be scaled independently:

```bash
# Scale specific service
docker compose up -d --scale core=3
```

For production, consider:
- Load balancer in front of Nginx
- Database replication
- Redis for caching
- Message queue for async operations

## Monitoring

Recommended monitoring stack:
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ELK Stack**: Log aggregation
- **Jaeger**: Distributed tracing
