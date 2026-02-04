-- This file will be executed when Oracle DB container starts
-- Create user for application
ALTER SESSION SET CONTAINER = XEPDB1;

-- Drop user if exists (for development)
BEGIN
   EXECUTE IMMEDIATE 'DROP USER committed_user CASCADE';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -1918 THEN
         RAISE;
      END IF;
END;
/

-- Create user
CREATE USER committed_user IDENTIFIED BY "SecurePassword123!";

-- Grant privileges
GRANT CONNECT, RESOURCE TO committed_user;
GRANT CREATE SESSION TO committed_user;
GRANT CREATE TABLE TO committed_user;
GRANT CREATE VIEW TO committed_user;
GRANT CREATE SEQUENCE TO committed_user;
GRANT UNLIMITED TABLESPACE TO committed_user;

-- Create a simple test table for connectivity verification
ALTER SESSION SET CURRENT_SCHEMA = committed_user;

CREATE TABLE health_check (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    service_name VARCHAR2(100) NOT NULL,
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR2(20) DEFAULT 'OK'
);

-- Insert initial record
INSERT INTO health_check (service_name, status) VALUES ('database', 'OK');
COMMIT;

-- Schema will be created by each service's ORM/migration tools
EXIT;
