-- ============================================================================
-- V1.0.13 (2026-09-13)
-- 财务结算迭代：保司账单/我方对账单文件导入 + 对账引擎 + 差异轻量闭环。
--
-- 决策口径（V1.0.13 文档第四章冻结）：
--   D1 接入仅 CSV/Excel；取消独立解析/自动匹配环节，文件读取在浏览器完成；
--   D2 我方对账期望 = 对账单文件导入 + 页面手工调整（不建保单交易域）；
--   D3 carrier_settlement_config 为唯一主数据，财务侧 1:1 扩展 insurer_finance_profile；
--      settlement_cycle_config 数据迁入扩展表后停用（保留表，代码不再读写）；
--   D6 差异处理轻量闭环（动作 + 挂起 + 跟进时间线 + 统计）。
--
-- 可重复执行（CREATE TABLE IF NOT EXISTS / 列存在性判断 / 幂等 UPDATE）。
-- 执行前务必备份：commission_bill、settlement_cycle_config 现值。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) commission_bill 扩展：类别 / 归档原件 / 映射模板 / 导入统计 / 周期月份
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='category') THEN
    ALTER TABLE commission_bill ADD COLUMN category varchar(16) NOT NULL DEFAULT 'commission';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='source_url') THEN
    ALTER TABLE commission_bill ADD COLUMN source_url varchar(512);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='source_stored_name') THEN
    ALTER TABLE commission_bill ADD COLUMN source_stored_name varchar(256);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='mapping_template_id') THEN
    ALTER TABLE commission_bill ADD COLUMN mapping_template_id varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='import_stats') THEN
    ALTER TABLE commission_bill ADD COLUMN import_stats jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='period_month') THEN
    ALTER TABLE commission_bill ADD COLUMN period_month char(7);
  END IF;
END $$;

-- 1.1 周期月份回填：仅规整 YYYY-MM 文本，季度等非标值留空
UPDATE commission_bill
   SET period_month = substring(period FROM '^[0-9]{4}-[0-9]{2}$')
 WHERE period ~ '^[0-9]{4}-[0-9]{2}$'
   AND period_month IS NULL;

-- 1.2 账单状态收敛：取消解析环节，旧 pending-parse/parsed/parse-failed 归 uploaded
UPDATE commission_bill
   SET status = 'uploaded'
 WHERE status IN ('pending-parse', 'parsed', 'parse-failed', 'pending');

ALTER TABLE commission_bill ALTER COLUMN status SET DEFAULT 'uploaded';

ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS chk_bill_category;
ALTER TABLE commission_bill
  ADD CONSTRAINT chk_bill_category CHECK (category IN ('commission', 'premium'));
ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS chk_bill_status;
ALTER TABLE commission_bill
  ADD CONSTRAINT chk_bill_status
  CHECK (status IN ('uploaded', 'reconciled', 'exception', 'settled'));
ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS chk_bill_period_month;
ALTER TABLE commission_bill
  ADD CONSTRAINT chk_bill_period_month
  CHECK (period_month IS NULL OR period_month ~ '^[0-9]{4}-[0-9]{2}$');

CREATE INDEX IF NOT EXISTS idx_bill_category_period
  ON commission_bill (insurer_id, period_month, category);

-- ----------------------------------------------------------------------------
-- 2) commission_bill_line 扩展：类别 / NPN / 行级错误 / 原始行
--    入库即终态；双侧比对结果在对账 run 时计算，不再做行级 match_status 流转。
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='category') THEN
    ALTER TABLE commission_bill_line ADD COLUMN category varchar(16) NOT NULL DEFAULT 'commission';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='npn') THEN
    ALTER TABLE commission_bill_line ADD COLUMN npn varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='product_code') THEN
    ALTER TABLE commission_bill_line ADD COLUMN product_code varchar(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='row_error') THEN
    ALTER TABLE commission_bill_line ADD COLUMN row_error text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='raw_row') THEN
    ALTER TABLE commission_bill_line ADD COLUMN raw_row jsonb;
  END IF;
END $$;

ALTER TABLE commission_bill_line DROP CONSTRAINT IF EXISTS chk_bline_category;
ALTER TABLE commission_bill_line
  ADD CONSTRAINT chk_bline_category CHECK (category IN ('commission', 'premium'));

CREATE INDEX IF NOT EXISTS idx_bline_category
  ON commission_bill_line (bill_id, category);

-- ----------------------------------------------------------------------------
-- 3) 账单列映射模板
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bill_field_mapping_template (
  template_id    varchar(32)  PRIMARY KEY,
  insurer_id     varchar(32)  NOT NULL REFERENCES insurance_carrier(carrier_id),
  category       varchar(16)  NOT NULL DEFAULT 'commission',
  template_name  varchar(128) NOT NULL,
  file_format    varchar(8)   NOT NULL DEFAULT 'xlsx',
  sheet_name     varchar(64),
  header_row     integer      NOT NULL DEFAULT 1,
  mapping_json   jsonb        NOT NULL DEFAULT '{}'::jsonb,
  enabled        boolean      NOT NULL DEFAULT true,
  deleted        boolean      NOT NULL DEFAULT false,
  created_at     timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_template_category CHECK (category IN ('commission', 'premium')),
  CONSTRAINT chk_template_format CHECK (file_format IN ('csv', 'xls', 'xlsx'))
);

COMMENT ON TABLE bill_field_mapping_template IS 'V1.0.13 保司账单/对账单列映射模板（前端列映射向导保存）';

CREATE INDEX IF NOT EXISTS idx_template_insurer
  ON bill_field_mapping_template (insurer_id, category, enabled);

ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS fk_bill_mapping_template;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_bill_mapping_template') THEN
    ALTER TABLE commission_bill
      ADD CONSTRAINT fk_bill_mapping_template
      FOREIGN KEY (mapping_template_id) REFERENCES bill_field_mapping_template(template_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4) 我方佣金/保费对账单（头 + 行）：来源文件导入，可手工调整，确认后参与对账
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS commission_statement (
  statement_id     varchar(32)  PRIMARY KEY,
  insurer_id       varchar(32)  NOT NULL REFERENCES insurance_carrier(carrier_id),
  insurer_name     varchar(128),
  insurer_short    varchar(64),
  period_month     char(7)      NOT NULL,
  category         varchar(16)  NOT NULL DEFAULT 'commission',
  status           varchar(16)  NOT NULL DEFAULT 'draft',
  source           varchar(16)  NOT NULL DEFAULT 'import',
  source_url       varchar(512),
  source_stored_name varchar(256),
  total_policies   integer      NOT NULL DEFAULT 0,
  total_premium    numeric(14,2) NOT NULL DEFAULT 0,
  total_commission numeric(14,2) NOT NULL DEFAULT 0,
  confirmed_by     varchar(64),
  confirmed_at     timestamptz,
  deleted          boolean      NOT NULL DEFAULT false,
  created_at       timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_stmt_category CHECK (category IN ('commission', 'premium')),
  CONSTRAINT chk_stmt_status   CHECK (status IN ('draft', 'confirmed')),
  CONSTRAINT chk_stmt_source   CHECK (source IN ('import', 'manual')),
  CONSTRAINT chk_stmt_period   CHECK (period_month ~ '^[0-9]{4}-[0-9]{2}$')
);

COMMENT ON TABLE commission_statement IS 'V1.0.13 我方对账单头（文件导入 + 手工调整）';

CREATE INDEX IF NOT EXISTS idx_stmt_insurer_period
  ON commission_statement (insurer_id, period_month, category);

CREATE TABLE IF NOT EXISTS commission_statement_line (
  line_id           varchar(32)  PRIMARY KEY,
  statement_id      varchar(32)  NOT NULL REFERENCES commission_statement(statement_id) ON DELETE CASCADE,
  line_number       integer,
  policy_number     varchar(64)  NOT NULL,
  insured_name      varchar(128),
  npn               varchar(32),
  product_code      varchar(64),
  channel_name      varchar(128),
  state             varchar(8),
  line_of_business  varchar(64),
  premium           numeric(14,2) NOT NULL DEFAULT 0,
  commission_rate   numeric(8,4)  NOT NULL DEFAULT 0,
  commission_amount numeric(14,2) NOT NULL DEFAULT 0,
  adjusted          boolean      NOT NULL DEFAULT false,
  deleted           boolean      NOT NULL DEFAULT false,
  created_at        timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE commission_statement_line IS 'V1.0.13 我方对账单行（adjusted=TRUE 表示页面手工调整过）';

CREATE INDEX IF NOT EXISTS idx_sline_statement
  ON commission_statement_line (statement_id);
CREATE INDEX IF NOT EXISTS idx_sline_policy
  ON commission_statement_line (policy_number);

-- ----------------------------------------------------------------------------
-- 5) 对账运行批次
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reconciliation_run (
  run_id          varchar(32)  PRIMARY KEY,
  insurer_id      varchar(32)  NOT NULL REFERENCES insurance_carrier(carrier_id),
  insurer_name    varchar(128),
  insurer_short   varchar(64),
  period_month    char(7)      NOT NULL,
  category        varchar(16)  NOT NULL DEFAULT 'commission',
  statement_id    varchar(32)  REFERENCES commission_statement(statement_id) ON DELETE SET NULL,
  bill_ids        jsonb        NOT NULL DEFAULT '[]'::jsonb,
  status          varchar(16)  NOT NULL DEFAULT 'running',
  total_count     integer      NOT NULL DEFAULT 0,
  matched_count   integer      NOT NULL DEFAULT 0,
  diff_count      integer      NOT NULL DEFAULT 0,
  missing_count   integer      NOT NULL DEFAULT 0,
  extra_count     integer      NOT NULL DEFAULT 0,
  bill_amount     numeric(14,2) NOT NULL DEFAULT 0,
  our_amount      numeric(14,2) NOT NULL DEFAULT 0,
  diff_amount     numeric(14,2) NOT NULL DEFAULT 0,
  created_by      varchar(64),
  report_json     jsonb,
  deleted         boolean      NOT NULL DEFAULT false,
  created_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_run_category CHECK (category IN ('commission', 'premium')),
  CONSTRAINT chk_run_status   CHECK (status IN ('running', 'done')),
  CONSTRAINT chk_run_period   CHECK (period_month ~ '^[0-9]{4}-[0-9]{2}$')
);

COMMENT ON TABLE reconciliation_run IS 'V1.0.13 对账运行批次（按 保司+月份+类别 幂等重算）';

CREATE INDEX IF NOT EXISTS idx_run_insurer_period
  ON reconciliation_run (insurer_id, period_month, category);

-- ----------------------------------------------------------------------------
-- 6) reconciliation_diff 扩展：类别 / run / 处理决议 / 跟进时间线
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='category') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN category varchar(16) NOT NULL DEFAULT 'commission';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='run_id') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN run_id varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='resolution') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN resolution varchar(16) NOT NULL DEFAULT 'open';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='follow_ups') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN follow_ups jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 6.1 旧 status 词汇迁移到 resolution（存量为 0 行，仍保留迁移逻辑保证幂等）
UPDATE reconciliation_diff
   SET resolution = CASE status
                      WHEN 'accepted'  THEN 'accepted'
                      WHEN 'adjusted'  THEN 'adjusted'
                      WHEN 'disputed'  THEN 'disputed'
                      WHEN 'suspended' THEN 'suspended'
                      WHEN 'waived'    THEN 'closed'
                      WHEN 'resolved'  THEN 'closed'
                      WHEN 'closed'    THEN 'closed'
                      ELSE 'open'
                    END
 WHERE resolution = 'open'
   AND COALESCE(status, 'open') <> 'open';

ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_category;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_category CHECK (category IN ('commission', 'premium'));
ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_resolution;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_resolution
  CHECK (resolution IN ('open', 'accepted', 'adjusted', 'disputed', 'suspended', 'closed'));
ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_type_v1013;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_type_v1013
  CHECK (diff_type IN ('rate', 'premium', 'agent', 'policy-missing',
                       'extra', 'missing', 'manual'));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='fk_diff_run') THEN
    ALTER TABLE reconciliation_diff
      ADD CONSTRAINT fk_diff_run FOREIGN KEY (run_id)
      REFERENCES reconciliation_run(run_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_diff_run
  ON reconciliation_diff (run_id);
CREATE INDEX IF NOT EXISTS idx_diff_category_resolution
  ON reconciliation_diff (category, resolution);

-- ----------------------------------------------------------------------------
-- 7) insurer_finance_profile：carrier_settlement_config 的 1:1 财务运行态扩展
--    周期/出账日/账期等主数据仍由合作页维护，本表只存财务运行态。
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insurer_finance_profile (
  config_id         varchar(32)  PRIMARY KEY
                    REFERENCES carrier_settlement_config(config_id) ON DELETE CASCADE,
  next_due_date     date,
  next_due_amount  numeric(14,2),
  ytd_settled       numeric(14,2) NOT NULL DEFAULT 0,
  bank_account      varchar(64),
  routing_number    varchar(32),
  contact_email     varchar(128),
  notify_days_before integer     NOT NULL DEFAULT 7,
  min_settle_amount numeric(14,2) NOT NULL DEFAULT 0,
  auto_reconcile    boolean      NOT NULL DEFAULT false,
  deleted           boolean      NOT NULL DEFAULT false,
  created_at        timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE insurer_finance_profile IS 'V1.0.13 保司财务运行态（1:1 扩展 carrier_settlement_config）';

-- 7.1 settlement_cycle_config 历史数据按 insurer_id 聚合迁入（两旧行同属 c1001）
--     金额/布尔取各行最大值（任一行为真/较大值即保留），文本取最后更新行非空值。
INSERT INTO insurer_finance_profile
  (config_id, next_due_date, next_due_amount, ytd_settled,
   bank_account, routing_number, contact_email,
   notify_days_before, min_settle_amount, auto_reconcile,
   created_at, updated_at)
SELECT c.config_id,
       MAX(s.next_due_date),
       MAX(s.next_due_amount),
       COALESCE(MAX(s.ytd_settled), 0),
       MAX(NULLIF(s.bank_account, '')),
       MAX(NULLIF(s.routing_number, '')),
       MAX(NULLIF(s.contact_email, '')),
       COALESCE(MAX(s.notify_days_before), 7),
       COALESCE(MAX(s.min_settle_amount), 0),
       BOOL_OR(COALESCE(s.auto_reconcile, false)),
       NOW(), NOW()
  FROM carrier_settlement_config c
  JOIN settlement_cycle_config s ON s.insurer_id = c.carrier_id
 GROUP BY c.config_id
ON CONFLICT (config_id) DO NOTHING;

-- 7.2 其余主数据行补默认 profile（LEFT JOIN 场景保证 1:1 齐备）
INSERT INTO insurer_finance_profile (config_id)
SELECT c.config_id
  FROM carrier_settlement_config c
 WHERE NOT EXISTS (SELECT 1 FROM insurer_finance_profile p WHERE p.config_id = c.config_id)
ON CONFLICT (config_id) DO NOTHING;

-- ============================================================================
-- 完成。settlement_cycle_config 自本版本起停用：保留表结构与历史数据，
-- 应用层不再读写；对账周期口径以 carrier_settlement_config 为准。
-- ============================================================================
