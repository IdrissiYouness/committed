# Database Scripts

This folder contains SQL scripts for managing the Committed PostgreSQL database shared by all services.

## Files

| File                     | Purpose                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `init.sql`               | Creates extensions and sets up the schema on first container start (runs automatically) |
| `01_schema.sql`          | Creates all tables, indexes, and trigger functions                                      |
| `02_seed_data.sql`       | Populates database with test data                                                       |
| `03_cleanup.sql`         | Truncates all tables and resets identity sequences                                      |
| `04_example_queries.sql` | Reference queries for development                                                       |

## Quick Start

### 1. Start PostgreSQL Database

```bash
cd docker
docker compose up -d postgres-db

# Wait for database to be ready (usually under 10 seconds)
docker compose logs -f postgres-db
# Look for: "database system is ready to accept connections"
```

### 2. Create Schema

The `init.sql` script runs automatically on first container start if mounted to `/docker-entrypoint-initdb.d/`. If you need to run the schema manually:

```bash
docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/01_schema.sql
```

### 3. Populate Test Data

```bash
docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/02_seed_data.sql
```

### 4. Verify Data

```bash
docker exec -it committed-postgres psql -U core_user -d committed_core

committed_core=> SELECT COUNT(*) FROM users;
committed_core=> SELECT COUNT(*) FROM course;
committed_core=> SELECT COUNT(*) FROM enrollment;
committed_core=> \q
```

## Reset Database

To start fresh with clean data:

```bash
# Option 1: Cleanup and re-seed
docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/03_cleanup.sql
docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/02_seed_data.sql

# Option 2: Complete reset (destroys volume)
cd docker
docker compose down -v
docker compose up -d postgres-db
# Wait for startup, then run schema and seed scripts
```

## Test Data Summary

After running `02_seed_data.sql`:

### Users (11 total)

| ID  | Name                 | Role      | Email                               |
| --- | -------------------- | --------- | ----------------------------------- |
| 1   | System Administrator | admin     | admin@committed.com                 |
| 2   | Dr. John Smith       | professor | prof.smith@committed.com            |
| 3   | Dr. Emily Johnson    | professor | prof.johnson@committed.com          |
| 4   | Dr. Michael Williams | professor | prof.williams@committed.com         |
| 5   | Alice Martin         | student   | alice.martin@student.committed.com  |
| 6   | Bob Wilson           | student   | bob.wilson@student.committed.com    |
| 7   | Charlie Brown        | student   | charlie.brown@student.committed.com |
| 8   | Diana Ross           | student   | diana.ross@student.committed.com    |
| 9   | Edward Lee           | student   | edward.lee@student.committed.com    |
| 10  | Fiona Chen           | student   | fiona.chen@student.committed.com    |
| 11  | George Kim           | student   | george.kim@student.committed.com    |

### Courses (6 total)

| ID  | Code    | Name                           | Professor    |
| --- | ------- | ------------------------------ | ------------ |
| 1   | CS101   | Introduction to Programming    | Dr. Smith    |
| 2   | CS201   | Data Structures and Algorithms | Dr. Smith    |
| 3   | WEB101  | Web Development Fundamentals   | Dr. Johnson  |
| 4   | WEB201  | Full Stack Development         | Dr. Johnson  |
| 5   | DB101   | Database Systems               | Dr. Williams |
| 6   | JAVA101 | Java Programming               | Dr. Williams |

### Other Data

- 24 Enrollments (students in courses)
- 13 Announcements
- 16 Comments (including nested replies)
- 9 Assignments
- 8 Submissions
- 2 Grades

## Connecting from Services

### PHP (Symfony — Core Service)

```
DATABASE_URL=postgresql://core_user:CoreSecurePass123!@postgres-db:5432/committed_core?serverVersion=16&charset=utf8
```

### Java (Spring Boot — Gateway Service)

```yaml
spring:
    datasource:
        url: jdbc:postgresql://postgres-db:5432/committed_core
        username: core_user
        password: CoreSecurePass123!
        driver-class-name: org.postgresql.Driver
    jpa:
        database-platform: org.hibernate.dialect.PostgreSQLDialect
```

### .NET (Notification Service)

```
ConnectionStrings__DefaultConnection=Host=postgres-db;Port=5432;Database=committed_core;Username=core_user;Password=CoreSecurePass123!
```

### psql CLI

```bash
docker exec -it committed-postgres psql -U core_user -d committed_core
```

## Common Issues

### "FATAL: password authentication failed"

- Verify credentials match your `.env` file: `core_user` / `CoreSecurePass123!`
- If you changed credentials after first run, delete the volume: `docker compose down -v`

### "FATAL: database "committed_core" does not exist"

- The database is created automatically from `POSTGRES_DB` env var on first start
- If volume already exists with different config, delete it: `docker compose down -v`

### "relation does not exist"

- Run `01_schema.sql` first
- Check you're connected to `committed_core` database, not `postgres`

### Connection refused

- Verify PostgreSQL is running: `docker compose ps postgres-db`

### Scripts fail with syntax errors

- Make sure to run from project root directory
- Use the exact commands shown above
- These scripts are for PostgreSQL 16
