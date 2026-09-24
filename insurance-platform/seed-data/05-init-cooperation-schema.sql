-- ============================================================
-- File: 05-init-cooperation-schema.sql
-- Purpose: Initialize carrier cooperation lifecycle schema (6 tables)
-- Source: domain-models/src/schema/carrier-*-schema.ts
-- Notes:
--   * Tables use application-supplied VARCHAR(32) PKs
--   * Partial indexes are used where the spec references `deleted`
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- 1. carrier_partnership
--    Top-level partnership agreement with a carrier.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_partnership (
    partnership_id              VARCHAR(32) PRIMARY KEY,
    carrier_id                   VARCHAR(32) NOT NULL,
    cooperation_type             VARCHAR(32),
    status                       VARCHAR(32) DEFAULT 'Draft',
    commission_tier              VARCHAR(16),
    notes                        TEXT,
    notes_en                     TEXT,
    settlement_method            VARCHAR(32),
    settlement_cycle_days        INTEGER DEFAULT 30,
    premium_collection           VARCHAR(32),
    premium_settlement           VARCHAR(32),
    effective_date               DATE,
    expiration_date              DATE,
    product_scope                JSONB DEFAULT '{}',
    state_scope                  JSONB DEFAULT '[]',
    contract_file                JSONB,
    created_by                   VARCHAR(64),
    owner_name                   VARCHAR(64),
    terminate_reason             VARCHAR(64),
    terminate_note               TEXT,
    terminate_effect_type         VARCHAR(16),
    terminate_effective_at       TIMESTAMPTZ,
    terminated_at                TIMESTAMPTZ,
    pending_change               JSONB,
    deleted                      BOOLEAN DEFAULT FALSE,
    created_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_partnership_carrier ON carrier_partnership(carrier_id);
CREATE INDEX IF NOT EXISTS idx_partnership_status  ON carrier_partnership(status);

-- ------------------------------------------------------------
-- 2. carrier_contract
--    Contract documents linked to a partnership.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_contract (
    contract_id          VARCHAR(32) PRIMARY KEY,
    partnership_id       VARCHAR(32),
    carrier_id           VARCHAR(32) NOT NULL,
    title                VARCHAR(256) NOT NULL,
    title_en             VARCHAR(256),
    contract_type        VARCHAR(32),
    version              VARCHAR(16),
    effective_date       DATE,
    expiry_date          DATE,
    signatory_us         VARCHAR(128),
    signatory_them       VARCHAR(128),
    status               VARCHAR(32) DEFAULT 'draft',
    auto_renew           BOOLEAN DEFAULT FALSE,
    tags                 JSONB DEFAULT '[]',
    tags_en              JSONB DEFAULT '[]',
    file_url             VARCHAR(512),
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contract_partnership ON carrier_contract(partnership_id);
CREATE INDEX IF NOT EXISTS idx_contract_carrier     ON carrier_contract(carrier_id);

-- ------------------------------------------------------------
-- 3. carrier_contact
--    Contacts at a carrier (optionally tied to a partnership).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_contact (
    contact_id           VARCHAR(32) PRIMARY KEY,
    carrier_id           VARCHAR(32) NOT NULL,
    partnership_id       VARCHAR(32),
    first_name           VARCHAR(64),
    last_name            VARCHAR(64),
    full_name            VARCHAR(128) NOT NULL,
    position             VARCHAR(100),
    department           VARCHAR(100),
    role                 VARCHAR(32),
    email                VARCHAR(128),
    phone                VARCHAR(32),
    mobile_phone         VARCHAR(32),
    office_address       VARCHAR(256),
    is_active            BOOLEAN DEFAULT TRUE,
    is_primary           BOOLEAN DEFAULT FALSE,
    created_by           VARCHAR(64),
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_carrier      ON carrier_contact(carrier_id);
CREATE INDEX IF NOT EXISTS idx_contact_partnership  ON carrier_contact(partnership_id);

-- ------------------------------------------------------------
-- 4. carrier_settlement_config
--    Settlement configuration scoped to carrier / partnership.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_settlement_config (
    config_id            VARCHAR(32) PRIMARY KEY,
    carrier_id           VARCHAR(32) NOT NULL,
    partnership_id       VARCHAR(32),
    cycle                VARCHAR(16) DEFAULT 'Monthly',
    bill_cutoff_day      INTEGER DEFAULT 25,
    payment_term_days    INTEGER DEFAULT 30,
    payment_method       VARCHAR(16) DEFAULT 'ACH',
    billing_format       VARCHAR(16) DEFAULT 'EDI',
    api_enabled          BOOLEAN DEFAULT FALSE,
    premium_collection   VARCHAR(16) DEFAULT 'AgencyBill',
    updated_by           VARCHAR(64),
    last_updated         DATE,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_settlement_carrier     ON carrier_settlement_config(carrier_id);
CREATE INDEX IF NOT EXISTS idx_settlement_partnership ON carrier_settlement_config(partnership_id);

-- ------------------------------------------------------------
-- 5. carrier_renewal_task
--    Contract renewal tracking tasks.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_renewal_task (
    renewal_id           VARCHAR(32) PRIMARY KEY,
    partnership_id       VARCHAR(32) NOT NULL,
    carrier_id           VARCHAR(32) NOT NULL,
    contract_id          VARCHAR(32),
    title                VARCHAR(256) NOT NULL,
    expiry_date          DATE NOT NULL,
    priority             VARCHAR(16) DEFAULT 'normal',
    status               VARCHAR(24) DEFAULT 'upcoming',
    auto_renew           BOOLEAN DEFAULT FALSE,
    account_manager      VARCHAR(128),
    last_action          VARCHAR(256),
    last_action_at       DATE,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_renewal_expiry ON carrier_renewal_task(expiry_date) WHERE deleted = FALSE;

-- ------------------------------------------------------------
-- 6. carrier_product_access_request
--    Requests to access a carrier product across target states.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS carrier_product_access_request (
    request_id           VARCHAR(32) PRIMARY KEY,
    partnership_id       VARCHAR(32),
    carrier_id           VARCHAR(32) NOT NULL,
    product_id           VARCHAR(32),
    product_name         VARCHAR(128) NOT NULL,
    product_code         VARCHAR(32),
    line_of_business     VARCHAR(32),
    target_states        JSONB DEFAULT '["ALL"]',
    priority             VARCHAR(16) DEFAULT 'normal',
    status               VARCHAR(16) DEFAULT 'available',
    estimated_premium    NUMERIC(14,2),
    technical_reqs       JSONB DEFAULT '[]',
    api_doc              BOOLEAN DEFAULT FALSE,
    test_completed       BOOLEAN DEFAULT FALSE,
    notes                TEXT,
    requested_by         VARCHAR(64),
    reviewed_by          VARCHAR(64),
    reviewed_at          TIMESTAMPTZ,
    deleted              BOOLEAN DEFAULT FALSE,
    created_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_status ON carrier_product_access_request(status) WHERE deleted = FALSE;
