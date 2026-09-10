-- =====================================================
-- OverInsur Platform - Unified Auth Database Schema V5
-- =====================================================
-- Database: ai_saas (public schema)
-- Port: 5432 (ai-saas-postgres container)
-- Date: 2026-09-07
--
-- AUTHORITY: This script is the single source of truth.
-- It matches Drizzle schema in auth-user-schema-ovwr.ts (V5).
--
-- Tables created:
--   auth_department    - Department hierarchy
--   auth_role          - RBAC roles
--   auth_user          - User accounts (integer PK + user_uuid business key)
--   auth_user_role     - User-Role many-to-many
--   auth_refresh_token - JWT refresh token rotation
--   auth_operation_log - Audit trail
-- =====================================================

-- Drop tables in reverse dependency order (for clean re-init)
DROP TABLE IF EXISTS auth_operation_log CASCADE;
DROP TABLE IF EXISTS auth_refresh_token CASCADE;
DROP TABLE IF EXISTS auth_user_role CASCADE;
DROP TABLE IF EXISTS auth_user CASCADE;
DROP TABLE IF EXISTS auth_role CASCADE;
DROP TABLE IF EXISTS auth_department CASCADE;

-- ─── auth_department (部门表) ────────────────────────────────────────

CREATE TABLE auth_department (
    dept_id         SERIAL PRIMARY KEY,
    dept_code       VARCHAR(32) UNIQUE NOT NULL,
    dept_name_zh    VARCHAR(100) NOT NULL,
    dept_name_en    VARCHAR(100),
    parent_dept_id  INTEGER,
    dept_level      INTEGER NOT NULL DEFAULT 1,
    path            VARCHAR(255),
    status          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_auth_department_code ON auth_department(dept_code);
CREATE INDEX idx_auth_department_parent ON auth_department(parent_dept_id);

-- ─── auth_role (角色表) ───────────────────────────────────────────

CREATE TABLE auth_role (
    role_id         SERIAL PRIMARY KEY,
    role_key        VARCHAR(64) UNIQUE NOT NULL,
    role_name_zh    VARCHAR(100) NOT NULL,
    role_name_en    VARCHAR(100),
    role_code       VARCHAR(64) NOT NULL,
    description     TEXT,
    permission_keys JSONB DEFAULT '[]'::jsonb,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_auth_role_key ON auth_role(role_key);
CREATE INDEX idx_auth_role_sort ON auth_role(sort_order);

-- ─── auth_user (用户账户表 - 权威定义 V5) ──────────────────────────────

CREATE TABLE auth_user (
    -- Primary keys
    id                      SERIAL PRIMARY KEY,
    user_uuid               VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid(),

    -- Identity
    username                VARCHAR(64) UNIQUE NOT NULL,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    name_zh                 VARCHAR(100),
    name_en                 VARCHAR(100),
    phone                   VARCHAR(20),
    avatar_url              VARCHAR(512),

    -- Department
    dept_id                 INTEGER REFERENCES auth_department(dept_id) ON DELETE SET NULL,
    dept_code               VARCHAR(32),

    -- Authentication
    auth_method             VARCHAR(16) NOT NULL DEFAULT 'local',
    sso_provider            VARCHAR(32),
    ldap_dn                 VARCHAR(255),

    -- Status & MFA
    status                  VARCHAR(16) NOT NULL DEFAULT 'active',
    mfa_enabled             BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret              VARCHAR(255),

    -- Login tracking
    last_login_at           TIMESTAMP WITH TIME ZONE,
    last_login_ip           VARCHAR(45),
    login_count             INTEGER NOT NULL DEFAULT 0,

    -- Account lockout
    failed_login_attempts   INTEGER NOT NULL DEFAULT 0,
    locked_until            TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_by              VARCHAR(64),
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_by              VARCHAR(64),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    deleted                 BOOLEAN NOT NULL DEFAULT FALSE,
    remark                  TEXT
);

CREATE INDEX idx_auth_user_username ON auth_user(username);
CREATE INDEX idx_auth_user_email ON auth_user(email);
CREATE INDEX idx_auth_user_uuid ON auth_user(user_uuid);
CREATE INDEX idx_auth_user_dept ON auth_user(dept_id);
CREATE INDEX idx_auth_user_status ON auth_user(status);

-- ─── auth_user_role (用户角色关联表) ───────────────────────────────

CREATE TABLE auth_user_role (
    user_id         INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role_id         INTEGER NOT NULL REFERENCES auth_role(role_id) ON DELETE CASCADE,
    assigned_by     VARCHAR(64),
    assigned_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_auth_user_role_user ON auth_user_role(user_id);
CREATE INDEX idx_auth_user_role_role ON auth_user_role(role_id);

-- ─── auth_refresh_token (刷新令牌表) ─────────────────────────────────

CREATE TABLE auth_refresh_token (
    id              SERIAL PRIMARY KEY,
    user_uuid       VARCHAR(36) NOT NULL,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    issued_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address      VARCHAR(45),
    user_agent      VARCHAR(255),
    is_revoked      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_auth_refresh_token_user ON auth_refresh_token(user_uuid);
CREATE INDEX idx_auth_refresh_token_hash ON auth_refresh_token(token_hash);
CREATE INDEX idx_auth_refresh_token_expires ON auth_refresh_token(expires_at);

-- ─── auth_operation_log (操作审计日志表) ─────────────────────────────

CREATE TABLE auth_operation_log (
    log_id          VARCHAR(32) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id         VARCHAR(32),
    username        VARCHAR(64),
    action          VARCHAR(128) NOT NULL,
    module          VARCHAR(32),
    permission_code VARCHAR(64),
    target_type     VARCHAR(32),
    target_id       VARCHAR(64),
    success         VARCHAR(8),
    request_params  TEXT,
    ip              VARCHAR(64),
    user_agent      TEXT,
    request_id      VARCHAR(64),
    duration        INTEGER,
    status          VARCHAR(1),
    error_message   TEXT,
    extra_data      JSONB,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_auth_log_created_at ON auth_operation_log(created_at);
CREATE INDEX idx_auth_log_user_id ON auth_operation_log(user_id);
CREATE INDEX idx_auth_log_action ON auth_operation_log(action);
CREATE INDEX idx_auth_log_module ON auth_operation_log(module);

-- ─── Trigger: auto-update updated_at ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auth_user_updated_at
    BEFORE UPDATE ON auth_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_auth_department_updated_at
    BEFORE UPDATE ON auth_department
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_auth_role_updated_at
    BEFORE UPDATE ON auth_role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_auth_refresh_token_updated_at
    BEFORE UPDATE ON auth_refresh_token
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Seed Data
-- =====================================================

-- ─── Departments (对齐原型 V1.5 DEPARTMENTS) ──────────────────────

INSERT INTO auth_department (dept_code, dept_name_zh, dept_name_en, parent_dept_id, dept_level, path) VALUES
    ('TECH',     '技术部',   'Technology',     NULL, 1, '/TECH'),
    ('OPS',      '运营部',   'Operations',     NULL, 1, '/OPS'),
    ('FIN',      '财务部',   'Finance',        NULL, 1, '/FIN'),
    ('CHANNEL',  '渠道部',   'Channel',        NULL, 1, '/CHANNEL'),
    ('COMPLIANCE','合规部',  'Compliance',     NULL, 1, '/COMPLIANCE'),
    ('MARKET',   '市场部',   'Marketing',      NULL, 1, '/MARKET');

-- ─── Roles (5 roles matching prototype) ───────────────────────────

INSERT INTO auth_role (role_key, role_name_zh, role_name_en, role_code, description, is_system, sort_order) VALUES
    ('super_admin',    '超级管理员', 'Super Admin',    'SUPER_ADMIN',    '拥有系统全部权限',           TRUE,  1),
    ('ops_manager',    '运营管理员', 'Ops Manager',    'OPS_MANAGER',    '运营管理权限',              FALSE, 2),
    ('channel_manager','渠道经理',   'Channel Manager','CHANNEL_MANAGER','渠道管理权限',              FALSE, 3),
    ('finance_staff',  '财务专员',   'Finance Staff',  'FINANCE_STAFF',  '财务模块操作权限',          FALSE, 4),
    ('readonly_user',  '只读用户',   'Read-Only User', 'READONLY_USER',  '仅查看权限，无编辑操作',    FALSE, 5);

-- ─── Admin User (password: admin123) ─────────────────────────────

INSERT INTO auth_user (
    user_uuid, username, email, password_hash,
    name_zh, name_en, status, auth_method,
    dept_code, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin', 'admin@overinsur.com',
    '$2b$10$J0CMPRNdZHA54t.YUuC5beffLHlREKccz6TT7TstnUoUt489EU28y',
    '系统管理员', 'System Admin',
    'active', 'local', 'TECH', 'system'
);

-- ─── Assign admin user the super_admin role ──────────────────────

INSERT INTO auth_user_role (user_id, role_id, assigned_by)
SELECT u.id, r.role_id, 'system'
FROM auth_user u, auth_role r
WHERE u.username = 'admin' AND r.role_key = 'super_admin';

-- =====================================================
-- Verification
-- =====================================================
SELECT 'auth_department: ' || COUNT(*) FROM auth_department;
SELECT 'auth_role: ' || COUNT(*) FROM auth_role;
SELECT 'auth_user: ' || COUNT(*) FROM auth_user;
SELECT 'auth_user_role: ' || COUNT(*) FROM auth_user_role;
SELECT 'Schema V5 initialized successfully' AS status;
