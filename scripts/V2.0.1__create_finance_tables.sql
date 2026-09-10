-- ============================================================================
-- V2.0.1 — 财务模块表结构
-- 4 张新表: commission_bill, commission_bill_line, reconciliation_diff,
--           settlement_cycle_config
-- ============================================================================

-- ── 1. commission_bill — 佣金账单 ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS commission_bill (
  bill_id            VARCHAR(32) PRIMARY KEY,
  file_name          VARCHAR(256) NOT NULL,
  insurer_id         VARCHAR(32) REFERENCES insurance_carrier(carrier_id),
  insurer_name       VARCHAR(128),
  insurer_short      VARCHAR(64),
  period             VARCHAR(16),                                  -- e.g. 2026-08, 2026-Q3
  import_date        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  imported_by        VARCHAR(64),
  file_size          VARCHAR(32),
  file_format        VARCHAR(8),                                   -- CSV / Excel / PDF / EDI
  status             VARCHAR(16) DEFAULT 'pending-parse',          -- pending-parse / parsed / reconciled / exception / settled / archived
  total_policies     INTEGER DEFAULT 0,
  total_premium      NUMERIC(14,2) DEFAULT 0,
  total_commission   NUMERIC(14,2) DEFAULT 0,
  parsed_policies    INTEGER DEFAULT 0,
  matched_policies   INTEGER DEFAULT 0,
  exception_count    INTEGER DEFAULT 0,
  reconciled_amount  NUMERIC(14,2) DEFAULT 0,
  difference_amount  NUMERIC(14,2) DEFAULT 0,
  settled_date       DATE,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bill_status     ON commission_bill (status);
CREATE INDEX IF NOT EXISTS idx_bill_insurer    ON commission_bill (insurer_id);
CREATE INDEX IF NOT EXISTS idx_bill_period     ON commission_bill (period);
CREATE INDEX IF NOT EXISTS idx_bill_import     ON commission_bill (import_date DESC);

-- ── 2. commission_bill_line — 账单解析明细行 ───────────────────────────────

CREATE TABLE IF NOT EXISTS commission_bill_line (
  line_id                VARCHAR(32) PRIMARY KEY,
  bill_id                VARCHAR(32) REFERENCES commission_bill(bill_id),
  line_number            INTEGER,
  policy_number          VARCHAR(64),
  insured_name           VARCHAR(128),
  channel_id             VARCHAR(32),
  channel_name           VARCHAR(128),
  state                  VARCHAR(8),
  line_of_business       VARCHAR(64),
  effective_date         DATE,
  premium                NUMERIC(14,2) DEFAULT 0,
  commission_rate        NUMERIC(6,4) DEFAULT 0,
  commission_amount      NUMERIC(14,2) DEFAULT 0,
  our_policy_number      VARCHAR(64),
  our_commission_rate    NUMERIC(6,4),
  our_commission_amount  NUMERIC(14,2),
  diff_amount            NUMERIC(14,2),
  match_status           VARCHAR(16) DEFAULT 'unmatched',          -- matched / unmatched / amount-diff / rate-diff / duplicate
  diff_note              TEXT,
  diff_note_en           TEXT,
  deleted                BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bline_bill      ON commission_bill_line (bill_id);
CREATE INDEX IF NOT EXISTS idx_bline_policy    ON commission_bill_line (policy_number);
CREATE INDEX IF NOT EXISTS idx_bline_match     ON commission_bill_line (match_status);

-- ── 3. reconciliation_diff — 对账差异记录 ──────────────────────────────────

CREATE TABLE IF NOT EXISTS reconciliation_diff (
  diff_id            VARCHAR(32) PRIMARY KEY,
  bill_id            VARCHAR(32) REFERENCES commission_bill(bill_id),
  bill_name          VARCHAR(256),
  insurer_id         VARCHAR(32) REFERENCES insurance_carrier(carrier_id),
  insurer_short      VARCHAR(64),
  policy_number      VARCHAR(64),
  insured_name       VARCHAR(128),
  diff_type          VARCHAR(32),                                  -- rate-mismatch / amount-mismatch / missing-policy / duplicate / missing-in-bill
  bill_amount        NUMERIC(14,2) DEFAULT 0,
  our_amount         NUMERIC(14,2) DEFAULT 0,
  diff_amount        NUMERIC(14,2) DEFAULT 0,
  status             VARCHAR(16) DEFAULT 'open',                   -- open / under-review / accepted / disputed / adjusted / waived
  note               TEXT,
  note_en            TEXT,
  assigned_to        VARCHAR(64),
  created_date       DATE DEFAULT CURRENT_DATE,
  resolved_date      DATE,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_diff_status   ON reconciliation_diff (status);
CREATE INDEX IF NOT EXISTS idx_diff_bill     ON reconciliation_diff (bill_id);
CREATE INDEX IF NOT EXISTS idx_diff_insurer  ON reconciliation_diff (insurer_id);
CREATE INDEX IF NOT EXISTS idx_diff_type     ON reconciliation_diff (diff_type);

-- ── 4. settlement_cycle_config — 结算周期配置 ──────────────────────────────

CREATE TABLE IF NOT EXISTS settlement_cycle_config (
  config_id          VARCHAR(32) PRIMARY KEY,
  insurer_id         VARCHAR(32) REFERENCES insurance_carrier(carrier_id),
  insurer_name       VARCHAR(128),
  insurer_short      VARCHAR(64),
  frequency          VARCHAR(16) DEFAULT 'monthly',               -- monthly / quarterly / semi-annual / annual / custom
  cutoff_day         INTEGER DEFAULT 25,
  payment_due_days   INTEGER DEFAULT 30,
  method             VARCHAR(16) DEFAULT 'ach',                   -- wire-transfer / ach / check / offset
  currency           VARCHAR(8) DEFAULT 'USD',
  min_settle_amount  NUMERIC(14,2) DEFAULT 0,
  auto_reconcile     BOOLEAN DEFAULT FALSE,
  auto_settle        BOOLEAN DEFAULT FALSE,
  notify_days_before INTEGER DEFAULT 7,
  bank_account       VARCHAR(64),
  routing_number     VARCHAR(32),
  contact_email      VARCHAR(128),
  last_settled_date  DATE,
  next_due_date      DATE,
  next_due_amount    NUMERIC(14,2),
  ytd_settled        NUMERIC(14,2) DEFAULT 0,
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scc_insurer    ON settlement_cycle_config (insurer_id);
CREATE INDEX IF NOT EXISTS idx_scc_frequency  ON settlement_cycle_config (frequency);
CREATE INDEX IF NOT EXISTS idx_scc_next_due   ON settlement_cycle_config (next_due_date);
