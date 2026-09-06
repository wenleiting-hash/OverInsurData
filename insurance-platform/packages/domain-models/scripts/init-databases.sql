-- =====================================================
-- i18n_db Database Initialization Script
-- Version: 1.0.0
-- Date: 2026-09-02
-- Description: Create and seed i18n_db schema tables
-- =====================================================

-- Step 1: Create databases if not exist (PostgreSQL)
-- Note: In PostgreSQL, 'database' is the top-level unit
-- We will create three separate databases for different domains

DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'i18n_db') THEN
        CREATE DATABASE i18n_db;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auth_db') THEN
        CREATE DATABASE auth_db;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'master_db') THEN
        CREATE DATABASE master_db;
    END IF;
END$$;

-- Note: The above script runs on template1 or postgres database
-- After execution, connect to each database individually to run schema creation
