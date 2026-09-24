-- ============================================================
-- File: 04-init-finance-schema.sql
-- Purpose: Initialize finance / commission billing schema (5 tables)
-- Source: carrier-service/src/database/finance-schema.ts
-- Notes:
--   * All tables use application-supplied VARCHAR(32) PKs
--   * Monetary values use NUMERIC(14,2); rates use NUMERIC(6,4) / NUMERIC(5,4)
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- 1. commission_bill
--    Commission bill header (one per imported insurer file/batch).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_bill (
    bill_id              VARCHAR(32) PRIMARY KEY,
    batch_no             VARCHAR(40),
    file_name            VARCHAR(256) NOT NULL,
    insurer_id           VARCHAR(32),
    insurer_name         VARCHAR(128),
    insurer_short        VARCHAR(64),
    period               VARCHAR(16),
    import_date          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    imported_by          VARCHAR(64),
    file_size            VARCHAR(32),
    file_format          VARCHAR(8),
    status               VARCHAR(16) DEFAULT 'uploaded',
    import_status        VARCHAR(16) DEFAULT 'imported',
    recon_status         VARCHAR(16) DEFAULT 'pending',
    success_count        INTEGER DEFAULT 0,
    failed_count         INTEGER DEFAULT 0,
    duplicate_count      INTEGER DEFAULT 0,
    locked_by            VARCHAR(64),
    locked_at            TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    voided_by            VARCHAR(64),
    voided_at            TIMESTAMPTZ,
    total_policies        INTEGER DEFAULT 0,
    total_premium         NUMERIC(14,2) DEFAULT '0',
    total_commission     NUMERIC(14,2) DEFAULT '0',
    parsed_policies      INTEGER DEFAULT 0,
    matched_policies     INTEGER DEFAULT 0,
    exception_count      INTEGER DEFAULT 0,
    reconciled_amount    NUMERIC(14,2) DEFAULT '0',
    difference_amount    NUMERIC(14,2) DEFAULT '0',
    settled_date         DATE,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 2. commission_bill_line
--    Commission bill line items (per policy).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_bill_line (
    line_id              VARCHAR(32) PRIMARY KEY,
    bill_id              VARCHAR(32),
    line_number          INTEGER,
    policy_number        VARCHAR(64),
    insured_name         VARCHAR(128),
    channel_id           VARCHAR(32),
    channel_name         VARCHAR(128),
    state                VARCHAR(8),
    line_of_business     VARCHAR(64),
    effective_date       DATE,
    premium              NUMERIC(14,2) DEFAULT '0',
    commission_rate      NUMERIC(6,4) DEFAULT '0',
    commission_amount    NUMERIC(14,2) DEFAULT '0',
    our_policy_number    VARCHAR(64),
    our_commission_rate  NUMERIC(6,4),
    our_commission_amount NUMERIC(14,2),
    diff_amount          NUMERIC(14,2),
    match_status         VARCHAR(16) DEFAULT 'unmatched',
    line_status          VARCHAR(16) DEFAULT 'imported',
    trial_level          VARCHAR(24),
    error_reason         VARCHAR(512),
    skip_reason          VARCHAR(512),
    diff_note            TEXT,
    diff_note_en         TEXT,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_commission_bill_line_bill ON commission_bill_line(bill_id);

-- ------------------------------------------------------------
-- 3. reconciliation_diff
--    Reconciliation differences (bill vs. our records).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reconciliation_diff (
    diff_id              VARCHAR(32) PRIMARY KEY,
    bill_id              VARCHAR(32),
    bill_name            VARCHAR(256),
    insurer_id           VARCHAR(32),
    insurer_short        VARCHAR(64),
    policy_number        VARCHAR(64),
    insured_name         VARCHAR(128),
    diff_type            VARCHAR(32),
    bill_amount          NUMERIC(14,2) DEFAULT '0',
    our_amount           NUMERIC(14,2) DEFAULT '0',
    diff_amount          NUMERIC(14,2) DEFAULT '0',
    status               VARCHAR(16) DEFAULT 'open',
    note                 TEXT,
    note_en              TEXT,
    assigned_to          VARCHAR(64),
    created_date         DATE,
    resolved_date        DATE,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 4. settlement_cycle_config
--    Per-insurer settlement cycle configuration.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settlement_cycle_config (
    config_id            VARCHAR(32) PRIMARY KEY,
    insurer_id           VARCHAR(32),
    insurer_name         VARCHAR(128),
    insurer_short        VARCHAR(64),
    frequency            VARCHAR(16) DEFAULT 'monthly',
    cutoff_day           INTEGER DEFAULT 25,
    payment_due_days     INTEGER DEFAULT 30,
    method               VARCHAR(16) DEFAULT 'ach',
    currency             VARCHAR(8) DEFAULT 'USD',
    min_settle_amount    NUMERIC(14,2) DEFAULT '0',
    auto_reconcile       BOOLEAN DEFAULT FALSE,
    auto_settle          BOOLEAN DEFAULT FALSE,
    notify_days_before   INTEGER DEFAULT 7,
    bank_account         VARCHAR(64),
    routing_number        VARCHAR(32),
    contact_email        VARCHAR(128),
    last_settled_date    DATE,
    next_due_date        DATE,
    next_due_amount      NUMERIC(14,2),
    ytd_settled          NUMERIC(14,2) DEFAULT '0',
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ------------------------------------------------------------
-- 5. carrier_commission_rate
--    Commission rate catalog (per carrier / dimension / state / product).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_commission_rate (
    rate_id              VARCHAR(32) PRIMARY KEY,
    carrier_id           VARCHAR(32) NOT NULL,
    dimension            VARCHAR(16) NOT NULL,
    line_of_business     VARCHAR(64),
    product_id           VARCHAR(32),
    state                VARCHAR(8),
    rate                 NUMERIC(5,4) NOT NULL,
    effective_from       DATE NOT NULL,
    effective_to         DATE,
    status               VARCHAR(16) DEFAULT 'pending' NOT NULL,
    version              INTEGER DEFAULT 1 NOT NULL,
    created_by           VARCHAR(64),
    remark               VARCHAR(512),
    deleted              BOOLEAN DEFAULT FALSE NOT NULL,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_carrier_commission_rate_carrier ON carrier_commission_rate(carrier_id);
