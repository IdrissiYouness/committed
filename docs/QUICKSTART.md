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

3. **Oracle Container Registry account** (free)
   - Sign up: https://container-registry.oracle.com
   - Accept the license for "Database Express Edition"

---

## Step 1: Login to Oracle Container Registry

Oracle Database image requires authentication:

```bash
docker login container-registry.oracle.com
```

Enter your Oracle account credentials when prompted.

---

## Step 2: Start the Database

Navigate to the docker directory and start only the Oracle database first:

```bash
cd docker
docker compose up -d oracle-db
```

**Wait for the database to be ready** (3-5 minutes on first run):

```bash
docker compose logs -f oracle-db
```

Look for this message:
```
DATABASE IS READY TO USE!
```

Press `Ctrl+C` to exit the logs once you see this message.

---

## Step 3: Create the Database Schema

Run the schema creation script:

```bash
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < db/01_schema.sql
```

You should see output like:
```
Sequence created.
Table created.
Index created.
Trigger created.
...
Commit complete.
```

---

## Step 4: Populate Test Data

Run the seed data script:

```bash
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < db/02_seed_data.sql
```

You should see:
```
1 row created.
1 row created.
...
Commit complete.
```

---

## Step 5: Verify Data with SQL*Plus (Quick Check)

Quick verification from command line:

```bash
docker exec -it committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1'
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

-- Exit SQL*Plus
EXIT
```

---

## Step 6: Connect DBeaver to Oracle Database

### 6.1 Create New Connection

1. Open DBeaver
2. Click **Database** → **New Database Connection** (or press `Ctrl+Shift+N`)
3. Select **Oracle** from the list
4. Click **Next**

### 6.2 Configure Connection Settings

Fill in the connection details:

| Field | Value |
|-------|-------|
| **Host** | `localhost` |
| **Port** | `1521` |
| **Database** | `XEPDB1` |
| **Authentication** | Database Native |
| **Username** | `committed_user` |
| **Password** | `SecurePassword123!` |

### 6.3 Download Oracle Driver (First Time Only)

1. Click **Test Connection**
2. If prompted to download the Oracle JDBC driver, click **Download**
3. Wait for the download to complete
4. Click **Test Connection** again

You should see: **"Connected"**

### 6.4 Finish Connection

1. Click **Finish**
2. The connection will appear in the Database Navigator panel

---

## Step 7: Explore Data in DBeaver

### 7.1 Navigate to Tables

In the Database Navigator:
```
committed-oracle
└── XEPDB1
    └── Schemas
        └── COMMITTED_USER
            └── Tables
                ├── ANNOUNCEMENT
                ├── ASSIGNMENT
                ├── CODE_ANALYSIS
                ├── COMMENT
                ├── COURSE
                ├── ENROLLMENT
                ├── GRADE
                ├── SUBMISSION
                └── USERS
```

### 7.2 View Table Data

1. Double-click on any table (e.g., `USERS`)
2. Click the **Data** tab at the bottom
3. You'll see all the test data

### 7.3 Run Custom Queries

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

## Step 8: Start All Services

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
committed-oracle        Up (healthy)
committed-gateway       Up
committed-core          Up
committed-analyzer      Up
committed-notifications Up
committed-web           Up
committed-nginx         Up
```

---

## Step 9: Test Service Connectivity

### Test individual services:

```bash
# Gateway (Java Spring Boot)
curl http://localhost:8080/health

# Core (PHP Symfony)
curl http://localhost:8000/health

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

---

## Step 10: Access the Web Interface

Open your browser and go to:

```
http://localhost:3000
```

Or through Nginx:

```
http://localhost
```

Click **"Test Service Chain"** to verify all services are connected.

---

## Troubleshooting

### Oracle won't start
- Increase Docker memory to 4GB+
- Check logs: `docker compose logs oracle-db`

### "ORA-01017: invalid username/password"
- Wait for Oracle to fully start
- Verify password: `SecurePassword123!`

### DBeaver can't connect
- Ensure Oracle container is running: `docker ps`
- Check port 1521 is exposed: `docker compose ps`
- Try `127.0.0.1` instead of `localhost`

### Services can't connect to database
- Wait for Oracle healthcheck to pass
- Check: `docker compose ps` (oracle-db should show "healthy")

### Schema already exists error
- Run cleanup first: `docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < db/03_cleanup.sql`
- Then run schema and seed again

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

# Access Oracle SQL*Plus
docker exec -it committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1'

# Reset database to clean state
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < db/03_cleanup.sql
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < db/02_seed_data.sql
```

---

## Test Data Summary

After running the seed script, you'll have:

| Entity | Count | Examples |
|--------|-------|----------|
| Users | 11 | 1 admin, 3 professors, 7 students |
| Courses | 6 | CS101, CS201, WEB101, WEB201, DB101, JAVA101 |
| Enrollments | 24 | Students enrolled in various courses |
| Announcements | 13 | Welcome messages, schedules, etc. |
| Comments | 16 | Including nested replies |
| Assignments | 9 | Various programming tasks |
| Submissions | 8 | Student code submissions |
| Grades | 2 | Sample graded submissions |

---

## Next Steps

1. **Explore the API**: Check `docs/API.md` for endpoint documentation
2. **Develop features**: See `docs/SETUP.md` for IDE configuration
3. **Collaborate**: Read `CONTRIBUTING.md` for team workflow
4. **Understand architecture**: Review `docs/ARCHITECTURE.md`

---

## Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Nginx (Reverse Proxy) | 80 | http://localhost |
| Web Frontend | 3000 | http://localhost:3000 |
| Gateway (Java) | 8080 | http://localhost:8080 |
| Core (PHP) | 8000 | http://localhost:8000 |
| Code Analyzer (Python) | 5000 | http://localhost:5000 |
| Notifications (.NET) | 5001 | http://localhost:5001 |
| Oracle Database | 1521 | localhost:1521/XEPDB1 |

**Database Credentials:**
- Username: `committed_user`
- Password: `SecurePassword123!`
- Service: `XEPDB1`
