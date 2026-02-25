# Committed - Code Submission & Analysis Platform

Educational platform for automated code analysis and grading, similar to Google Classroom.

## Architecture

Microservices architecture with:

- **Gateway** (Java Spring Boot) - Authentication & routing
- **Core** (PHP Symfony) - Courses, assignments, submissions
- **Code Analyzer** (Python Flask) - GitHub cloning & AI analysis
- **Notifications** (.NET Core) - Email notifications
- **Web** (React + Tailwind CSS) - Frontend application
- **PostgreSQL 16** - Shared data store
- **Nginx** - Reverse proxy

## Quick Start

> **🪟 Windows Users:** See [docs/WINDOWS-SETUP.md](docs/WINDOWS-SETUP.md) for detailed Windows-specific instructions!

### Prerequisites

1. **Docker Desktop** (with at least 4GB RAM allocated)

### Setup

1. Set up environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

2. Start all services:

```bash
cd docker
docker compose up -d
```

3. Wait for PostgreSQL to be healthy (usually under 10 seconds):

```bash
docker compose ps
```

4. Access application:

- Frontend: http://localhost
- API: http://localhost/api
- API Docs: http://localhost/docs

## Service Ports

| Service       | Port | Technology                    |
| ------------- | ---- | ----------------------------- |
| Nginx         | 80   | Reverse Proxy                 |
| Gateway       | 8080 | Java Spring Boot              |
| Core          | 8000 | PHP Symfony                   |
| Code Analyzer | 5000 | Python Flask                  |
| Notifications | 5001 | .NET Core                     |
| Web           | 3000 | React + Vite + Tailwind CSS   |
| PostgreSQL    | 5432 | PostgreSQL 16 Alpine          |
| API Docs      | 80   | Scalar (via Nginx at `/docs`) |

## Testing Connectivity

After starting all services, test the end-to-end chain:

```bash
# Test the full chain: Gateway → Core → Database
curl http://localhost/api/test-chain

# Test Core service healthcheck (database connectivity + user data)
curl http://localhost:8000/health

# Or via the web frontend proxy
curl http://localhost:3000/api/core/health
```

## Development

Each service is developed independently in its respective directory.
See individual service READMEs for setup instructions.

### IDE Recommendations

| Service       | IDE           | Directory                 |
| ------------- | ------------- | ------------------------- |
| Gateway       | IntelliJ IDEA | `services/gateway/`       |
| Core          | PhpStorm      | `services/core/`          |
| Code Analyzer | VSCode        | `services/code-analyzer/` |
| Notifications | VSCode        | `services/notifications/` |
| Web           | VSCode        | `web/`                    |

See [docs/SETUP.md](docs/SETUP.md) for detailed IDE setup instructions.

## Project Structure

```
committed/
├── docker/                 # Docker configuration
│   ├── docker compose.yml
│   ├── nginx/
│   └── db/
├── services/
│   ├── gateway/           # Java Spring Boot
│   ├── core/              # PHP Symfony
│   ├── code-analyzer/     # Python Flask
│   └── notifications/     # .NET Core
├── web/                   # React + Tailwind CSS Frontend
└── docs/                  # Documentation
```

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) - **Start here!** Collaboration guide for the team
- [SETUP.md](docs/SETUP.md) - IDE setup guides
- [WINDOWS-SETUP.md](docs/WINDOWS-SETUP.md) - **Windows users guide** (Docker Desktop on Windows)
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [API.md](docs/API.md) - API documentation

## CI/CD Pipeline

This project uses GitLab CI/CD for automated testing and deployment.

### Pipeline Stages

1. **Lint** - Code style checks
2. **Test** - Unit tests for each service
3. **Build** - Docker image builds
4. **Deploy** - Deployment to staging/production (manual)

### Running the Pipeline

The pipeline runs automatically on:

- Every push to any branch
- Every merge request

See [.gitlab-ci.yml](.gitlab-ci.yml) for the full configuration.

## Team Collaboration

We're a team of 4 students working on this project. Here's how we collaborate:

### Quick Start for New Team Members

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) first!
2. Clone the repo and set up your environment
3. Pick a service to work on
4. Create a feature branch and start coding

### Branch Workflow

```
main (production) ← develop (integration) ← feature/your-feature
```

### Commit Convention

```
feat(service): add new feature
fix(service): fix a bug
docs: update documentation
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Common Commands

```bash
# Start all services
cd docker && docker compose up -d

# View logs
docker compose logs -f [service-name]

# Rebuild specific service
docker compose up -d --build gateway

# Stop all services
docker compose down

# Clean everything (including database volume)
docker compose down -v

# Access PostgreSQL database
docker exec -it committed-postgres psql -U core_user -d committed_core

# Test Core service DB connectivity
curl http://localhost:8000/health

# Run SQL via Doctrine DBAL
docker exec committed-core php bin/console dbal:run-sql "SELECT COUNT(*) FROM users"
```

## License

MIT
