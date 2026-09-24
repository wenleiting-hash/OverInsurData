-- ============================================================
-- File: 03-init-carrier-schema.sql
-- Purpose: Initialize the insurance_carrier master table
-- Source: carrier-service/src/database/schema.ts
-- Notes:
--   * Includes `deleted` column for soft-delete support (used by
--     insurer.service.ts in all WHERE clauses).
--   * Column names (region, state, am_best_rating) match the
--     insurer.service.ts raw SQL and DTOs.
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- insurance_carrier
--    Master record for an insurance carrier (NAIC-identified).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurance_carrier (
    carrier_id          VARCHAR(32) PRIMARY KEY,
    carrier_name        VARCHAR(128) NOT NULL,
    carrier_name_short  VARCHAR(64),
    naic_code           VARCHAR(8) NOT NULL,
    carrier_type        VARCHAR(50),
    state               CHAR(2),
    region              VARCHAR(8),
    am_best_rating      VARCHAR(8),
    settlement_cycle    VARCHAR(16) DEFAULT 'MONTHLY',
    statement_format    VARCHAR(16) DEFAULT 'CSV',
    status              VARCHAR(20) DEFAULT 'Active',
    contact_info        JSONB,
    settlement_config   JSONB,
    documents           JSONB,
    coop_type           VARCHAR(32),
    coop_status         VARCHAR(16) DEFAULT 'active',
    founded_year        INTEGER,
    website             VARCHAR(256),
    sp_rating           VARCHAR(8),
    moodys_rating       VARCHAR(8),
    fitch_rating        VARCHAR(8),
    contract_expiry     DATE,
    lines               JSONB DEFAULT '[]',
    revenue             BIGINT DEFAULT 0,
    loss_ratio          NUMERIC(5,4) DEFAULT 0,
    renewal_rate        NUMERIC(5,4) DEFAULT 0,
    policy_count        INTEGER DEFAULT 0,
    commission_income   BIGINT DEFAULT 0,
    channel_count       INTEGER DEFAULT 0,
    product_count       INTEGER DEFAULT 0,
    deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insurance_carrier_naic    ON insurance_carrier(naic_code);
CREATE INDEX IF NOT EXISTS idx_insurance_carrier_status  ON insurance_carrier(status);
