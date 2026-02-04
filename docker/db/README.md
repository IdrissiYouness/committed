# Database Scripts

This folder contains SQL scripts for managing the Committed database.

## Files

| File | Purpose |
|------|---------|
| `init.sql` | Creates the database user (runs automatically on container start) |
| `01_schema.sql` | Creates all tables, sequences, indexes, and triggers |
| `02_seed_data.sql` | Populates database with test data |
| `03_cleanup.sql` | Truncates all tables and resets sequences |
| `04_example_queries.sql` | Reference queries for development |

## Quick Start

### 1. Start Oracle Database

```bash
cd docker
docker compose up -d oracle-db

# Wait for database to be ready (3-5 minutes first time)
docker compose logs -f oracle-db
# Look for: "DATABASE IS READY TO USE!"
```

### 2. Create Schema

```bash
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < docker/db/01_schema.sql
```

### 3. Populate Test Data

```bash
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < docker/db/02_seed_data.sql
```

### 4. Verify Data

```bash
docker exec -it committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1'

SQL> SELECT COUNT(*) FROM users;
SQL> SELECT COUNT(*) FROM course;
SQL> SELECT COUNT(*) FROM enrollment;
SQL> exit
```

## Reset Database

To start fresh with clean data:

```bash
# Option 1: Cleanup and re-seed
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < docker/db/03_cleanup.sql
docker exec -i committed-oracle sqlplus 'committed_user/SecurePassword123!@XEPDB1' < docker/db/02_seed_data.sql

# Option 2: Complete reset (destroys volume)
cd docker
docker compose down -v
docker compose up -d oracle-db
# Wait for startup, then run schema and seed scripts
```

## Test Data Summary

After running `02_seed_data.sql`:

### Users (11 total)
| ID | Name | Role | Email |
|----|------|------|-------|
| 1 | System Administrator | admin | admin@committed.com |
| 2 | Dr. John Smith | professor | prof.smith@committed.com |
| 3 | Dr. Emily Johnson | professor | prof.johnson@committed.com |
| 4 | Dr. Michael Williams | professor | prof.williams@committed.com |
| 5 | Alice Martin | student | alice.martin@student.committed.com |
| 6 | Bob Wilson | student | bob.wilson@student.committed.com |
| 7 | Charlie Brown | student | charlie.brown@student.committed.com |
| 8 | Diana Ross | student | diana.ross@student.committed.com |
| 9 | Edward Lee | student | edward.lee@student.committed.com |
| 10 | Fiona Chen | student | fiona.chen@student.committed.com |
| 11 | George Kim | student | george.kim@student.committed.com |

### Courses (6 total)
| ID | Code | Name | Professor |
|----|------|------|-----------|
| 1 | CS101 | Introduction to Programming | Dr. Smith |
| 2 | CS201 | Data Structures and Algorithms | Dr. Smith |
| 3 | WEB101 | Web Development Fundamentals | Dr. Johnson |
| 4 | WEB201 | Full Stack Development | Dr. Johnson |
| 5 | DB101 | Database Systems | Dr. Williams |
| 6 | JAVA101 | Java Programming | Dr. Williams |

### Other Data
- 24 Enrollments (students in courses)
- 13 Announcements
- 16 Comments (including nested replies)
- 9 Assignments
- 8 Submissions
- 2 Grades

## Connecting from Services

### Java (Spring Boot)
```yaml
spring:
  datasource:
    url: jdbc:oracle:thin:@oracle-db:1521/XEPDB1
    username: committed_user
    password: SecurePassword123!
```

### PHP (Symfony)
```
DATABASE_URL=oci8://committed_user:SecurePassword123!@oracle-db:1521/XEPDB1
```

### .NET
```
ConnectionStrings__OracleDb=User Id=committed_user;Password=SecurePassword123!;Data Source=oracle-db:1521/XEPDB1
```

## Common Issues

### "ORA-01017: invalid username/password"
- Wait for Oracle to fully start (check logs)
- Verify password matches: `SecurePassword123!`

### "ORA-12541: TNS:no listener"
- Oracle is still starting up
- Wait 2-3 minutes and try again

### "Table or view does not exist"
- Run `01_schema.sql` first
- Check you're connected as `committed_user`, not `system`

### Scripts fail with syntax errors
- Make sure to run from project root directory
- Use the exact commands shown above
