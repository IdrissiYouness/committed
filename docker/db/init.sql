-- ============================================================================
-- Committed Database Initialization (PostgreSQL)
-- This file runs automatically when PostgreSQL container starts
-- It is mounted into /docker-entrypoint-initdb.d/ as 00_init.sql
--
-- Execution order (alphabetical by filename):
--   00_init.sql      → This file (extensions + privileges)
--   01_schema.sql    → Tables, indexes, triggers
--   02_seed_data.sql → Test data
-- ============================================================================

-- ============================================================================
-- NOTE: The database and user are created automatically by PostgreSQL
-- container from environment variables:
--   POSTGRES_DB       = committed_core
--   POSTGRES_USER     = core_user
--   POSTGRES_PASSWORD = CoreSecurePass123!
-- ============================================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Grant schema privileges to the application user
-- ============================================================================

GRANT ALL PRIVILEGES ON SCHEMA public TO core_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO core_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO core_user;

-- Make sure future tables/sequences are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES TO core_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO core_user;

-- ============================================================================
-- Manual commands (only needed if you bypassed auto-init):
--
-- Schema:  docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/01_schema.sql
-- Seed:    docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/02_seed_data.sql
-- Cleanup: docker exec -i committed-postgres psql -U core_user -d committed_core < docker/db/03_cleanup.sql
-- Queries: See docker/db/04_example_queries.sql
-- ============================================================================
