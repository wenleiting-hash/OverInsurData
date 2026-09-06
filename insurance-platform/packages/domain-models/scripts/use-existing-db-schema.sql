-- =====================================================
-- 复用现有 PostgreSQL 容器的 Schema 创建脚本
-- 容器：ai-saas-postgres (端口 5432)
-- 策略：使用 PostgreSQL Schema 隔离而非独立 Database
-- =====================================================

-- Step 1: Connect to your existing database (ask DBA for credentials first!)
-- psql -h localhost -p 5432 -U admin -d [your_existing_db]

-- Step 2: Create schemas for isolation
CREATE SCHEMA IF NOT EXISTS i18n_db;
CREATE SCHEMA IF NOT EXISTS auth_db;
CREATE SCHEMA IF NOT EXISTS master_db;

-- Grant permissions (adjust user name as needed)
GRANT ALL PRIVILEGES ON SCHEMA i18n_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA auth_db TO admin;
GRANT ALL PRIVILEGES ON SCHEMA master_db TO admin;

-- Set search path for each schema later
-- SET search_path TO i18n_db, public;
