-- ============================================================================
-- Committed Database Initialization
-- This file runs automatically when Oracle container starts
-- ============================================================================

-- Switch to the pluggable database
ALTER SESSION SET CONTAINER = XEPDB1;

-- Drop user if exists (for clean restart)
BEGIN
   EXECUTE IMMEDIATE 'DROP USER committed_user CASCADE';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -1918 THEN
         RAISE;
      END IF;
END;
/

-- Create application user (password quoted to handle special characters)
CREATE USER committed_user IDENTIFIED BY "SecurePassword123!";

-- Grant privileges
GRANT CONNECT, RESOURCE TO committed_user;
GRANT CREATE SESSION TO committed_user;
GRANT CREATE TABLE TO committed_user;
GRANT CREATE VIEW TO committed_user;
GRANT CREATE SEQUENCE TO committed_user;
GRANT CREATE TRIGGER TO committed_user;
GRANT CREATE PROCEDURE TO committed_user;
GRANT UNLIMITED TABLESPACE TO committed_user;

-- ============================================================================
-- NOTE: Schema and data are created separately
-- ============================================================================
-- After the container starts, run these scripts manually:
--
-- 1. Create schema:
--    docker exec -i committed-oracle sqlplus committed_user/SecurePassword123!@XEPDB1 < docker/db/01_schema.sql
--
-- 2. Populate test data:
--    docker exec -i committed-oracle sqlplus committed_user/SecurePassword123!@XEPDB1 < docker/db/02_seed_data.sql
--
-- 3. To reset database:
--    docker exec -i committed-oracle sqlplus committed_user/SecurePassword123!@XEPDB1 < docker/db/03_cleanup.sql
--
-- 4. Reference queries:
--    See docker/db/04_example_queries.sql
-- ============================================================================

EXIT;
