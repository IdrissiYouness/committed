-- Migration: add token_version column to users table
-- Existing rows default to 1 (no active revocation events)
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
