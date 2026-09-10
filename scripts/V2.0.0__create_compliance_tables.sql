-- ============================================================================
-- V2.0.0 — 合规模块表结构
-- 6 张新表: compliance_rule, ofac_screening_record, compliance_interception,
--           nipr_license, license_expiry_reminder, compliance_audit_report
-- ============================================================================

-- ── 1. compliance_rule — 合规规则配置 ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_rule (
  rule_id            VARCHAR(32) PRIMARY KEY,
  rule_name          VARCHAR(128) NOT NULL,
  rule_name_en       VARCHAR(128),
  category           VARCHAR(32) NOT NULL DEFAULT 'appointment',   -- appointment / license / ofac / channel / product
  condition_expr     TEXT,
  condition_expr_en  TEXT,
  action             VARCHAR(32) NOT NULL DEFAULT 'warn',          -- block / warn / require-review
  priority           INTEGER DEFAULT 50,
  enabled            BOOLEAN DEFAULT TRUE,
  triggered_count    INTEGER DEFAULT 0,
  last_triggered_at  TIMESTAMPTZ,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_compliance_rule_category ON compliance_rule (category);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_enabled  ON compliance_rule (enabled);
CREATE INDEX IF NOT EXISTS idx_compliance_rule_priority ON compliance_rule (priority);

-- ── 2. ofac_screening_record — OFAC 筛查记录 ───────────────────────────────

CREATE TABLE IF NOT EXISTS ofac_screening_record (
  screening_id       VARCHAR(32) PRIMARY KEY,
  timestamp          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  entity_name        VARCHAR(256) NOT NULL,
  entity_type        VARCHAR(32),                                  -- Individual / Company / Vessel / Aircraft
  country            VARCHAR(64),
  date_of_birth      VARCHAR(16),
  identification_number VARCHAR(64),
  address            TEXT,
  screened_by        VARCHAR(64),
  result             VARCHAR(32) DEFAULT 'pending',                -- clear / watchlist / blocked / pending
  match_score        NUMERIC(5,2),
  match_score_level  VARCHAR(16),                                  -- low / medium / high / exact
  matched_entry      VARCHAR(256),
  matched_list       VARCHAR(128),                                 -- SDN / CONSOLIDATED / SDGT / etc.
  program            JSONB DEFAULT '[]',
  policy_id          VARCHAR(32),
  reviewed_by        VARCHAR(64),
  review_note        TEXT,
  override_approved  BOOLEAN DEFAULT FALSE,
  review_date        TIMESTAMPTZ,
  details_json       JSONB DEFAULT '{}',
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ofac_result    ON ofac_screening_record (result);
CREATE INDEX IF NOT EXISTS idx_ofac_timestamp ON ofac_screening_record (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ofac_entity    ON ofac_screening_record (entity_name);

-- ── 3. compliance_interception — 合规拦截日志 ──────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_interception (
  interception_id    VARCHAR(32) PRIMARY KEY,
  timestamp          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  channel_id         VARCHAR(32),
  channel_name       VARCHAR(128),
  insurer_id         VARCHAR(32),
  insurer_short      VARCHAR(64),
  state              VARCHAR(8),
  line               VARCHAR(64),
  policy_draft_id    VARCHAR(32),
  customer_name      VARCHAR(128),
  premium_amount     NUMERIC(14,2) DEFAULT 0,
  result             VARCHAR(32) DEFAULT 'blocked',               -- blocked / warned / passed / manual-review / allowed / flagged
  reasons            JSONB DEFAULT '[]',
  reason_descriptions JSONB DEFAULT '[]',
  severity           VARCHAR(16),                                  -- critical / high / medium / low
  action_type        VARCHAR(64),
  matched_entity     VARCHAR(256),
  list_source        VARCHAR(128),
  match_score        NUMERIC(5,2),
  rule_id            VARCHAR(32),
  details_json       JSONB DEFAULT '{}',
  resolved_status    VARCHAR(32),
  resolved_at        TIMESTAMPTZ,
  reviewed_by        VARCHAR(64),
  reviewed_at        TIMESTAMPTZ,
  override_approved  BOOLEAN DEFAULT FALSE,
  override_note      TEXT,
  release_note       TEXT,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_interception_result    ON compliance_interception (result);
CREATE INDEX IF NOT EXISTS idx_interception_timestamp ON compliance_interception (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_interception_severity  ON compliance_interception (severity);
CREATE INDEX IF NOT EXISTS idx_interception_channel   ON compliance_interception (channel_id);

-- ── 4. nipr_license — NIPR 牌照数据 ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nipr_license (
  license_id             VARCHAR(32) PRIMARY KEY,
  channel_id             VARCHAR(32),
  channel_name           VARCHAR(128),
  npn_number             VARCHAR(32),
  license_number         VARCHAR(64),
  state                  VARCHAR(8),
  license_type           VARCHAR(32),                              -- Producer / Adjuster / Surplus Lines / Variable Products
  lines                  JSONB DEFAULT '[]',
  status                 VARCHAR(16) DEFAULT 'pending',            -- active / inactive / expired / suspended / pending / cancelled
  issue_date             DATE,
  expiry_date            DATE,
  last_verified_at       TIMESTAMPTZ,
  verification_status    VARCHAR(16) DEFAULT 'pending',            -- verified / mismatch / not-found / pending
  residency_state        VARCHAR(8),
  ce_completed           BOOLEAN DEFAULT FALSE,
  ce_hours_required      NUMERIC(4,1),
  ce_hours_completed     NUMERIC(4,1),
  nipr_transaction_id    VARCHAR(64),
  deleted                BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_nipr_state     ON nipr_license (state);
CREATE INDEX IF NOT EXISTS idx_nipr_status    ON nipr_license (status);
CREATE INDEX IF NOT EXISTS idx_nipr_channel   ON nipr_license (channel_id);
CREATE INDEX IF NOT EXISTS idx_nipr_expiry    ON nipr_license (expiry_date);

-- ── 5. license_expiry_reminder — 牌照到期提醒 ─────────────────────────────

CREATE TABLE IF NOT EXISTS license_expiry_reminder (
  reminder_id        VARCHAR(32) PRIMARY KEY,
  license_id         VARCHAR(32) REFERENCES nipr_license(license_id),
  channel_id         VARCHAR(32),
  channel_name       VARCHAR(128),
  days_before        INTEGER DEFAULT 30,
  notify_at          TIMESTAMPTZ,
  status             VARCHAR(16) DEFAULT 'pending',               -- pending / sent / acknowledged
  sent_at            TIMESTAMPTZ,
  acknowledged_at    TIMESTAMPTZ,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminder_license ON license_expiry_reminder (license_id);
CREATE INDEX IF NOT EXISTS idx_reminder_status  ON license_expiry_reminder (status);
CREATE INDEX IF NOT EXISTS idx_reminder_notify  ON license_expiry_reminder (notify_at);

-- ── 6. compliance_audit_report — 合规审计报告 ──────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_audit_report (
  report_id          VARCHAR(32) PRIMARY KEY,
  report_name        VARCHAR(256) NOT NULL,
  category           VARCHAR(32),                                  -- appointment-status / license-compliance / ofac-summary / interception-log / renewal-calendar / regulatory-filing
  period             VARCHAR(16),
  generated_at       TIMESTAMPTZ,
  generated_by       VARCHAR(64),
  status             VARCHAR(16) DEFAULT 'generating',             -- ready / generating / scheduled / failed
  file_size          VARCHAR(32),
  record_count       INTEGER DEFAULT 0,
  format             VARCHAR(8) DEFAULT 'PDF',                     -- PDF / Excel / CSV
  recipients         JSONB DEFAULT '[]',
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_report_category ON compliance_audit_report (category);
CREATE INDEX IF NOT EXISTS idx_report_status   ON compliance_audit_report (status);
CREATE INDEX IF NOT EXISTS idx_report_period   ON compliance_audit_report (period);
