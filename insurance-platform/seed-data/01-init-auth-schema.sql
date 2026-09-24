-- ============================================================
-- File: 01-init-auth-schema.sql
-- Purpose: Initialize authentication & user management schema
-- Source: Drizzle schema `auth-user-schema-ovwr.ts` (V5, SINGLE source of truth)
-- Notes:
--   * Tables use plain names (no ovwr_ prefix)
--   * Uses SERIAL for auto-incrementing integer PKs
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- 1. auth_department
--    Department hierarchy for the carrier management subsystem.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_department (
    dept_id         SERIAL PRIMARY KEY,
    dept_code       VARCHAR(32) UNIQUE NOT NULL,
    dept_name_zh    VARCHAR(100) NOT NULL,
    dept_name_en    VARCHAR(100),
    parent_dept_id  INTEGER,
    dept_level      INTEGER NOT NULL DEFAULT 1,
    path            VARCHAR(255),
    color           VARCHAR(16) DEFAULT '#2563EB',
    description     TEXT,
    manager_name    VARCHAR(100),
    manager_title   VARCHAR(100),
    manager_email   VARCHAR(100),
    manager_phone   VARCHAR(50),
    office_location VARCHAR(200),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    status          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_department_code   ON auth_department(dept_code);
CREATE INDEX IF NOT EXISTS idx_auth_department_parent ON auth_department(parent_dept_id);

-- ------------------------------------------------------------
-- 2. auth_role
--    Role definitions scoped by subsystem_key (default: carrier_mgmt).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_role (
    role_id          SERIAL PRIMARY KEY,
    role_key         VARCHAR(64) UNIQUE NOT NULL,
    role_name_zh     VARCHAR(100) NOT NULL,
    role_name_en     VARCHAR(100),
    role_code        VARCHAR(64) NOT NULL,
    description      TEXT,
    permission_keys  JSONB DEFAULT '[]',
    subsystem_key    VARCHAR(32) NOT NULL DEFAULT 'carrier_mgmt',
    is_system        BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_auth_role_key        ON auth_role(role_key);
CREATE INDEX IF NOT EXISTS idx_auth_role_sort       ON auth_role(sort_order);
CREATE INDEX IF NOT EXISTS idx_auth_role_subsystem  ON auth_role(subsystem_key);

-- ------------------------------------------------------------
-- 3. auth_user
--    Application users. password_hash is nullable to support SSO/LDAP.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_user (
    id                     SERIAL PRIMARY KEY,
    user_uuid              VARCHAR(36) UNIQUE NOT NULL,
    username               VARCHAR(64) UNIQUE NOT NULL,
    email                  VARCHAR(255) UNIQUE NOT NULL,
    password_hash          VARCHAR(255),
    name_zh                VARCHAR(100),
    name_en                VARCHAR(100),
    phone                  VARCHAR(20),
    avatar_url             VARCHAR(512),
    dept_id                INTEGER REFERENCES auth_department(dept_id) ON DELETE SET NULL,
    dept_code              VARCHAR(32),
    auth_method            VARCHAR(16) NOT NULL DEFAULT 'local',
    sso_provider           VARCHAR(32),
    ldap_dn                VARCHAR(255),
    external_id            VARCHAR(64),
    status                 VARCHAR(16) NOT NULL DEFAULT 'active',
    mfa_enabled            BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret             VARCHAR(255),
    last_login_at          TIMESTAMPTZ,
    last_login_ip          VARCHAR(45),
    login_count            INTEGER NOT NULL DEFAULT 0,
    failed_login_attempts  INTEGER NOT NULL DEFAULT 0,
    locked_until           TIMESTAMPTZ,
    created_by             VARCHAR(64),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by             VARCHAR(64),
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted                BOOLEAN NOT NULL DEFAULT FALSE,
    remark                 TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_user_username     ON auth_user(username);
CREATE INDEX IF NOT EXISTS idx_auth_user_email        ON auth_user(email);
CREATE INDEX IF NOT EXISTS idx_auth_user_uuid         ON auth_user(user_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_user_dept         ON auth_user(dept_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_status       ON auth_user(status);
CREATE INDEX IF NOT EXISTS idx_auth_user_external_id  ON auth_user(external_id);

-- ------------------------------------------------------------
-- 4. auth_user_role
--    Many-to-many association between users and roles.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_user_role (
    user_id     INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role_id     INTEGER NOT NULL REFERENCES auth_role(role_id) ON DELETE CASCADE,
    assigned_by VARCHAR(64),
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_auth_user_role_user ON auth_user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_role_role ON auth_user_role(role_id);

-- ------------------------------------------------------------
-- 5. auth_refresh_token
--    Refresh tokens issued for authenticated sessions.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auth_refresh_token (
    id          SERIAL PRIMARY KEY,
    user_uuid   VARCHAR(36) NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    issued_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(255),
    is_revoked  BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_token_user    ON auth_refresh_token(user_uuid);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_token_hash   ON auth_refresh_token(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_token_expires ON auth_refresh_token(expires_at);
