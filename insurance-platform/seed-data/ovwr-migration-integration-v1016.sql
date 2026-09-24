-- =============================================================================
-- V1.0.16 系统集成：接入应用凭证表 (integration_app) + nonce 防重放表
-- 幂等迁移：先 DROP 再 CREATE / 用 IF NOT EXISTS
-- =============================================================================

-- ─── integration_app 接入应用表 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_app (
    app_id              VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    app_key             VARCHAR(64) UNIQUE NOT NULL,
    app_secret_hash     VARCHAR(255) NOT NULL,
    app_name            VARCHAR(128) NOT NULL,
    app_desc            TEXT,
    status              VARCHAR(16) NOT NULL DEFAULT 'active',   -- active / disabled
    ip_whitelist        TEXT,                                     -- CIDR 逗号分隔，空=不限制
    rate_limit          INTEGER NOT NULL DEFAULT 60,              -- 次/分钟
    created_by          VARCHAR(64),
    created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_called_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_integration_app_key ON integration_app(app_key);
CREATE INDEX IF NOT EXISTS idx_integration_app_status ON integration_app(status);

COMMENT ON TABLE integration_app IS '系统集成接入应用凭证（workOS 等外部调用方）';
COMMENT ON COLUMN integration_app.app_key IS '应用标识，明文';
COMMENT ON COLUMN integration_app.app_secret_hash IS 'appSecret 的 bcrypt 哈希，不存明文';
COMMENT ON COLUMN integration_app.ip_whitelist IS '允许的来源 IP/CIDR，逗号分隔，空表示不限制';

-- ─── integration_nonce 防重放表 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_nonce (
    nonce       VARCHAR(64) NOT NULL,
    app_key     VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (nonce, app_key)
);

CREATE INDEX IF NOT EXISTS idx_integration_nonce_expires ON integration_nonce(expires_at);

COMMENT ON TABLE integration_nonce IS '集成接口 nonce 防重放记录，保留 10 分钟';
