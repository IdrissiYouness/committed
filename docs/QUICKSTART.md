# Committed - Quick Start Guide

Step-by-step guide to run the entire platform, initialize the database, and verify data using DBeaver.

---

## Prerequisites

Before starting, ensure you have:

1. **Docker Desktop** installed and running
    - Download: https://www.docker.com/products/docker-desktop
    - Allocate at least **4GB RAM** to Docker (Settings → Resources → Memory)

2. **DBeaver** installed (for database visualization)
    - Download: https://dbeaver.io/download/

> **Note**: PostgreSQL images are pulled directly from Docker Hub — no container registry login or license agreement is needed.

---

## Step 0: Configure Environment Variables

The entire platform is configured via a single file: `docker/.env`.

```bash
cp docker/.env.example docker/.env
```

Open `docker/.env` and fill in the values. Most defaults work out of the box, but **`KILO_AUTH_JSON_B64` is required** for the Code Analyzer service.

### Getting KILO_AUTH_JSON_B64

The Code Analyzer uses [Kilo Code](https://kilo.ai) with GitHub Copilot to analyze student repositories. Authentication is passed as a base64-encoded token — no tools need to be installed on your machine.

**Get the value from your team's password manager** and paste it into `docker/.env`:

```
KILO_AUTH_JSON_B64=<paste value here>
```

**If you need to generate it yourself** (e.g. you are setting up the project for the first time):

```bash
# 1. Install Kilo CLI temporarily
npm install -g @kilocode/cli

# 2. Log in with GitHub Copilot (opens browser for OAuth)
kilo auth login

# 3. Generate the base64 value and copy it
base64 -w 0 ~/.local/share/kilo/auth.json
```

Paste the output into `KILO_AUTH_JSON_B64` in `docker/.env`, then share the value with your team via a password manager so they don't need to repeat this step.

> **Note**: If you just want to run the platform without AI analysis, set `AGENT_RUNNER=mock` in `docker/.env` — the analyzer will return deterministic stub results and `KILO_AUTH_JSON_B64` can be left empty.

---

## Step 1: Start the Database

Navigate to the docker directory and start only the PostgreSQL database first:

```bash
cd docker
docker compose up -d postgres-db
```

**Wait for the database to be ready** (usually under 10 seconds):

```bash
docker compose logs -f postgres-db
```

Look for this message:

```
database system is ready to accept connections
```

Press `Ctrl+C` to exit the logs once you see this message.

> The schema and seed data are loaded **automatically** on first start via scripts mounted to `/docker-entrypoint-initdb.d/`. No manual SQL execution is needed.

---

## Step 2: Verify Data with psql (Quick Check)

Quick verification from the command line:

```bash
docker exec -it committed-postgres psql -U core_user -d committed_core
```

Run these queries:

```sql
-- Count users
SELECT COUNT(*) AS user_count FROM users;
-- Expected: 11

-- Count courses
SELECT COUNT(*) AS course_count FROM course;
-- Expected: 6

-- Count enrollments
SELECT COUNT(*) AS enrollment_count FROM enrollment;
-- Expected: 24

-- List all users
SELECT user_id, full_name, system_role FROM users ORDER BY user_id;

-- List all tables
\dt

-- Exit psql
\q
```

---

## Step 3: Connect DBeaver to PostgreSQL

### 3.1 Create New Connection

1. Open DBeaver
2. Click **Database** → **New Database Connection** (or press `Ctrl+Shift+N`)
3. Select **PostgreSQL** from the list
4. Click **Next**

### 3.2 Configure Connection Settings

Fill in the connection details:

| Field              | Value                |
| ------------------ | -------------------- |
| **Host**           | `localhost`          |
| **Port**           | `5432`               |
| **Database**       | `committed_core`     |
| **Authentication** | Database Native      |
| **Username**       | `core_user`          |
| **Password**       | `CoreSecurePass123!` |

### 3.3 Download PostgreSQL Driver (First Time Only)

1. Click **Test Connection**
2. If prompted to download the PostgreSQL JDBC driver, click **Download**
3. Wait for the download to complete
4. Click **Test Connection** again

You should see: **"Connected"**

### 3.4 Finish Connection

1. Click **Finish**
2. The connection will appear in the Database Navigator panel

---

## Step 4: Explore Data in DBeaver

### 4.1 Navigate to Tables

In the Database Navigator:

```
committed-postgres
└── committed_core
    └── Schemas
        └── public
            └── Tables
                ├── announcement
                ├── announcement_attachment
                ├── assignment
                ├── assignment_attachment
                ├── code_analysis
                ├── comment
                ├── course
                ├── enrollment
                ├── grade
                ├── submission
                ├── submission_attachment
                └── users
```

### 4.2 View Table Data

1. Double-click on any table (e.g., `users`)
2. Click the **Data** tab at the bottom
3. You'll see all the test data

### 4.3 Run Custom Queries

1. Right-click on the connection → **SQL Editor** → **New SQL Script**
2. Try these queries:

```sql
-- All users with their roles
SELECT u.user_id, u.full_name, u.email, u.system_role
FROM users u
ORDER BY u.user_id;

-- Courses with teacher names
SELECT c.course_code, c.course_name, u.full_name AS teacher
FROM course c
JOIN users u ON c.teacher_id = u.user_id;

-- Students enrolled in CS101
SELECT u.full_name, e.enrolled_at
FROM enrollment e
JOIN users u ON e.user_id = u.user_id
WHERE e.course_id = 1 AND e.course_role = 'student';

-- Assignments with submission counts
SELECT a.title, c.course_code,
       (SELECT COUNT(*) FROM submission s WHERE s.assignment_id = a.assignment_id) AS submissions
FROM assignment a
JOIN course c ON a.course_id = c.course_id;
```

3. Press `Ctrl+Enter` to execute the query

---

## Step 5: Start All Services

Now start the remaining services:

```bash
# From the docker directory
docker compose up -d
```

Check all services are running:

```bash
docker compose ps
```

Expected output:

```
NAME                    STATUS
committed-postgres      Up (healthy)
committed-gateway       Up
committed-core          Up
committed-analyzer      Up
committed-notifications Up
committed-web           Up
committed-nginx         Up
```

---

## Step 6: Test Service Connectivity

### Test the Core healthcheck (database connectivity):

```bash
# Core service healthcheck (returns DB status + user data)
curl -s http://localhost:8000/health | python3 -m json.tool
```

Expected response:

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
                "created_at": "..."
            }
        ]
    },
    "timestamp": "..."
}
```

### Test individual services:

```bash
# Gateway (Java Spring Boot)
curl http://localhost:8080/health

# Code Analyzer (Python Flask)
curl http://localhost:5000/health

# Notifications (.NET Core)
curl http://localhost:5001/health
```

### Test through Nginx:

```bash
# API through reverse proxy
curl http://localhost/api/health
```

### Test the full chain:

```bash
curl http://localhost:8080/test-chain
```

### Test Core healthcheck via web frontend proxy:

```bash
curl -s http://localhost:3000/api/core/health | python3 -m json.tool
```

---

## Step 7: Access the Web Interface

Open your browser and go to:

```
http://localhost:3000
```

Or through Nginx:

```
http://localhost
```

You'll see two test buttons:

- **"Test Core + Database"** — Calls the Core service healthcheck and displays database connectivity, table count, user count, and a sample user table
- **"Test Service Chain"** — Verifies all services are connected end-to-end

---

## Troubleshooting

### PostgreSQL won't start

- Check logs: `docker compose logs postgres-db`
- Ensure port 5432 isn't already in use: `netstat -ano | findstr :5432`

### "FATAL: password authentication failed"

- Verify credentials match your `.env` file: `core_user` / `CoreSecurePass123!`
- If you changed credentials after first run, delete the volume: `docker compose down -v`

### "FATAL: database "committed_core" does not exist"

- The database is created automatically from `POSTGRES_DB` env var on first start
- If the volume already exists with a different config, remove it: `docker compose down -v`

### DBeaver can't connect

- Ensure the PostgreSQL container is running: `docker ps`
- Check port 5432 is exposed: `docker compose ps`
- Try `127.0.0.1` instead of `localhost`

### Services can't connect to database

- Wait for the PostgreSQL healthcheck to pass
- Check: `docker compose ps` (postgres-db should show "healthy")

### Schema already exists / want to start fresh

- Remove the volume and recreate:
    ```bash
    docker compose down -v
    docker compose up -d postgres-db
    # Wait for startup, schema and seed data load automatically
    ```

### Core returns "could not find driver"

- The Docker image needs to be rebuilt with the `pdo_pgsql` extension:
    ```bash
    docker compose up -d --build core
    ```

---

## Useful Commands

```bash
# View logs for a specific service
docker compose logs -f gateway

# Restart a specific service
docker compose restart core

# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v

# Access PostgreSQL via psql
docker exec -it committed-postgres psql -U core_user -d committed_core

# Test Core DB connectivity via Doctrine DBAL
docker exec committed-core php bin/console dbal:run-sql "SELECT COUNT(*) FROM users"

# Test Core DB connectivity via HTTP
curl http://localhost:8000/health

# Reset database to clean state
docker exec -i committed-postgres psql -U core_user -d committed_core < db/03_cleanup.sql
docker exec -i committed-postgres psql -U core_user -d committed_core < db/02_seed_data.sql
```

---

## Test Data Summary

The seed data is loaded automatically on first container start. You'll have:

| Entity        | Count | Examples                                     |
| ------------- | ----- | -------------------------------------------- |
| Users         | 11    | 1 admin, 3 professors, 7 students            |
| Courses       | 6     | CS101, CS201, WEB101, WEB201, DB101, JAVA101 |
| Enrollments   | 24    | Students enrolled in various courses         |
| Announcements | 13    | Welcome messages, schedules, etc.            |
| Comments      | 16    | Including nested replies                     |
| Assignments   | 9     | Various programming tasks                    |
| Submissions   | 8     | Student code submissions                     |
| Grades        | 2     | Sample graded submissions                    |

---

## Next Steps

1. **Explore the API**: Check `docs/API.md` for endpoint documentation
2. **Develop features**: See `docs/SETUP.md` for IDE configuration
3. **Collaborate**: Read `CONTRIBUTING.md` for team workflow
4. **Understand architecture**: Review `docs/ARCHITECTURE.md`

---

## Quick Reference

| Service                | Port | URL                          |
| ---------------------- | ---- | ---------------------------- |
| Nginx (Reverse Proxy)  | 80   | http://localhost             |
| Web Frontend           | 3000 | http://localhost:3000        |
| Gateway (Java)         | 8080 | http://localhost:8080        |
| Core (PHP)             | 8000 | http://localhost:8000        |
| Core Healthcheck       | 8000 | http://localhost:8000/health |
| Code Analyzer (Python) | 5000 | http://localhost:5000        |
| Notifications (.NET)   | 5001 | http://localhost:5001        |
| PostgreSQL Database    | 5432 | localhost:5432               |

**Database Credentials:**

- Username: `core_user`
- Password: `CoreSecurePass123!`
- Database: `committed_core`

---

_Last updated: February 2026_
