-- ============================================================
-- File: 02-init-ovwr-schema.sql
-- Purpose: Initialize the "ovwr" i18n + permission domain schema
-- Source: Drizzle schema (ovwr_* tables); supersedes create-ovwr-schemas.sql
-- Notes:
--   * Table names keep the ovwr_ prefix
--   * PKs are VARCHAR(32) application-supplied identifiers (no SERIAL)
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- 1. ovwr_auth_i18n_translation
--    Master translation entries for the i18n system.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_i18n_translation (
    ovwr_translation_id  VARCHAR(32) PRIMARY KEY,
    ovwr_namespace       VARCHAR(64) NOT NULL,
    ovwr_key             VARCHAR(256) NOT NULL,
    ovwr_en_us           VARCHAR(512) NOT NULL,
    ovwr_zh_cn           VARCHAR(512),
    ovwr_type            VARCHAR(32),
    ovwr_module          VARCHAR(32),
    ovwr_section         VARCHAR(64),
    ovwr_status          VARCHAR(1) DEFAULT '1',
    ovwr_modified        INTEGER DEFAULT 0,
    ovwr_reviewed_by     VARCHAR(32),
    ovwr_reviewed_at     TIMESTAMPTZ,
    ovwr_metadata        JSONB,
    ovwr_created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (ovwr_namespace, ovwr_key)
);

CREATE INDEX IF NOT EXISTS ovwr_idx_namespace     ON ovwr_auth_i18n_translation(ovwr_namespace);
CREATE INDEX IF NOT EXISTS ovwr_idx_status         ON ovwr_auth_i18n_translation(ovwr_status);
CREATE INDEX IF NOT EXISTS ovwr_idx_namespace_key  ON ovwr_auth_i18n_translation(ovwr_namespace, ovwr_key);

-- ------------------------------------------------------------
-- 2. ovwr_auth_i18n_version
--    Published i18n version snapshots with rollback support.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_i18n_version (
    ovwr_version_id        VARCHAR(32) PRIMARY KEY,
    ovwr_version_number    VARCHAR(16) NOT NULL,
    ovwr_namespace         VARCHAR(64),
    ovwr_change_log        TEXT,
    ovwr_translated_count  INTEGER DEFAULT 0,
    ovwr_updated_count     INTEGER DEFAULT 0,
    ovwr_published_by      VARCHAR(32),
    ovwr_published_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_rollback_to       VARCHAR(32),
    ovwr_rollback_reason   TEXT,
    ovwr_is_active         INTEGER DEFAULT 1,
    ovwr_created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_version_number ON ovwr_auth_i18n_version(ovwr_version_number);
CREATE INDEX IF NOT EXISTS ovwr_idx_is_active       ON ovwr_auth_i18n_version(ovwr_is_active);

-- ------------------------------------------------------------
-- 3. ovwr_auth_i18n_review_queue
--    Translation review queue entries.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_i18n_review_queue (
    ovwr_queue_id          VARCHAR(32) PRIMARY KEY,
    ovwr_translation_id    VARCHAR(32) NOT NULL,
    ovwr_submitted_by      VARCHAR(32) NOT NULL,
    ovwr_submitted_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_priority          VARCHAR(8) DEFAULT 'MEDIUM',
    ovwr_assigned_to       VARCHAR(32),
    ovwr_reviewed_at       TIMESTAMPTZ,
    ovwr_review_decision   VARCHAR(16),
    ovwr_reviewer_comment   TEXT,
    ovwr_status            VARCHAR(16) DEFAULT 'PENDING',
    ovwr_created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_priority ON ovwr_auth_i18n_review_queue(ovwr_priority);
CREATE INDEX IF NOT EXISTS ovwr_idx_status   ON ovwr_auth_i18n_review_queue(ovwr_status);

-- ------------------------------------------------------------
-- 4. ovwr_dict_term
--    Insurance domain glossary / terminology dictionary.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_dict_term (
    ovwr_term_id           VARCHAR(32) PRIMARY KEY,
    ovwr_term               VARCHAR(128) NOT NULL,
    ovwr_definition         TEXT NOT NULL,
    ovwr_category           VARCHAR(32),
    ovwr_usage_example      VARCHAR(256),
    ovwr_en_equivalent      VARCHAR(128),
    ovwr_zh_equivalent      VARCHAR(128) NOT NULL,
    ovwr_frequency_of_use   INTEGER DEFAULT 0,
    ovwr_verified_by        VARCHAR(32),
    ovwr_verified_at        TIMESTAMPTZ,
    ovwr_status             VARCHAR(1) DEFAULT '1',
    ovwr_created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_term_en_zh ON ovwr_dict_term(ovwr_term, ovwr_zh_equivalent);

-- ------------------------------------------------------------
-- 5. ovwr_auth_permission
--    Feature permission points (function-level authorization).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_permission (
    ovwr_permission_id          VARCHAR(32) PRIMARY KEY,
    ovwr_permission_code        VARCHAR(64) UNIQUE NOT NULL,
    ovwr_permission_name        VARCHAR(128) NOT NULL,
    ovwr_module                 VARCHAR(32) NOT NULL,
    ovwr_action                 VARCHAR(32) NOT NULL,
    ovwr_resource_type          VARCHAR(32),
    ovwr_parent_permission_id  VARCHAR(32),
    ovwr_sort_order             INTEGER DEFAULT 0,
    ovwr_icon                   VARCHAR(64),
    ovwr_description            TEXT,
    ovwr_status                 VARCHAR(1) DEFAULT '1',
    ovwr_created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_permission_code     ON ovwr_auth_permission(ovwr_permission_code);
CREATE INDEX IF NOT EXISTS ovwr_idx_module              ON ovwr_auth_permission(ovwr_module);
CREATE INDEX IF NOT EXISTS ovwr_idx_parent_permission    ON ovwr_auth_permission(ovwr_parent_permission_id);

-- ------------------------------------------------------------
-- 6. ovwr_auth_user_role
--    User-role association within the ovwr domain (template-aware).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_user_role (
    ovwr_role_id              VARCHAR(32),
    ovwr_user_id              VARCHAR(32) NOT NULL,
    ovwr_source_type          VARCHAR(32),
    ovwr_applied_template_id  VARCHAR(32),
    ovwr_granted_by           VARCHAR(32),
    ovwr_granted_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_expires_at           TIMESTAMPTZ,
    ovwr_status               VARCHAR(8) DEFAULT 'ACTIVE',
    ovwr_created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_user_role ON ovwr_auth_user_role(ovwr_user_id, ovwr_role_id);
CREATE INDEX IF NOT EXISTS ovwr_idx_user_id   ON ovwr_auth_user_role(ovwr_user_id);

-- ------------------------------------------------------------
-- 7. ovwr_auth_role_permission
--    Role-permission grants (supports inherited permissions).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_role_permission (
    ovwr_role_id          VARCHAR(32) NOT NULL,
    ovwr_permission_id    VARCHAR(32) NOT NULL REFERENCES ovwr_auth_permission(ovwr_permission_id),
    ovwr_inherited_from   VARCHAR(32),
    ovwr_source_type      VARCHAR(32),
    ovwr_granted_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_role_perm   ON ovwr_auth_role_permission(ovwr_role_id, ovwr_permission_id);
CREATE INDEX IF NOT EXISTS ovwr_idx_permission  ON ovwr_auth_role_permission(ovwr_permission_id);

-- ------------------------------------------------------------
-- 8. ovwr_auth_permission_template
--    Reusable permission templates (e.g., JSON role bundles).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_permission_template (
    ovwr_template_id        VARCHAR(32) PRIMARY KEY,
    ovwr_template_name      VARCHAR(128) NOT NULL,
    ovwr_version             VARCHAR(16) NOT NULL,
    ovwr_description         TEXT,
    ovwr_format              VARCHAR(8) NOT NULL,
    ovwr_role_count          INTEGER DEFAULT 0,
    ovwr_permission_count    INTEGER DEFAULT 0,
    ovwr_created_by          VARCHAR(32),
    ovwr_created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ovwr_last_used_at       TIMESTAMPTZ,
    ovwr_usage_count        INTEGER DEFAULT 0,
    ovwr_metadata           JSONB
);

CREATE INDEX IF NOT EXISTS ovwr_idx_template_name_version ON ovwr_auth_permission_template(ovwr_template_name, ovwr_version);
CREATE INDEX IF NOT EXISTS ovwr_idx_usage_count          ON ovwr_auth_permission_template(ovwr_usage_count);

-- ------------------------------------------------------------
-- 9. ovwr_auth_operation_log
--    Audit log of authorization-relevant operations.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ovwr_auth_operation_log (
    ovwr_log_id            VARCHAR(32) PRIMARY KEY,
    ovwr_user_id           VARCHAR(32),
    ovwr_username          VARCHAR(64),
    ovwr_action            VARCHAR(128) NOT NULL,
    ovwr_module            VARCHAR(32),
    ovwr_permission_code   VARCHAR(64),
    ovwr_target_type       VARCHAR(32),
    ovwr_target_id         VARCHAR(64),
    ovwr_success           VARCHAR(8),
    ovwr_request_params    TEXT,
    ovwr_ip                VARCHAR(64),
    ovwr_user_agent        TEXT,
    ovwr_request_id        VARCHAR(64),
    ovwr_duration          INTEGER,
    ovwr_status            VARCHAR(1),
    ovwr_error_message     TEXT,
    ovwr_extra_data        JSONB,
    ovwr_created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ovwr_idx_created_at ON ovwr_auth_operation_log(ovwr_created_at);
CREATE INDEX IF NOT EXISTS ovwr_idx_user_id   ON ovwr_auth_operation_log(ovwr_user_id);
CREATE INDEX IF NOT EXISTS ovwr_idx_action     ON ovwr_auth_operation_log(ovwr_action);
CREATE INDEX IF NOT EXISTS ovwr_idx_module     ON ovwr_auth_operation_log(ovwr_module);
