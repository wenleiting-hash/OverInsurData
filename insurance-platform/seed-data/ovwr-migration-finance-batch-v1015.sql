-- ============================================================================
-- V1.0.15 (2026-09-16) — Phase A 财务结算批次化重构
--
-- 口径（V1.0.15 文档第八章已确认）：
--   O1 一次导入一个保司+一个账单月份，不支持多保司 ZIP 批次；
--   O2 存在 open/suspended 差异时禁止封帐（409）；
--   O3 差异在批次详情「异常」Tab 行内处理，不建跨批次工作台；
--   O4 保费对账无独立入口（statements 后端保留，前端不暴露）；
--   O5 佣金率一行一州；O7 seed 真实录入。
--
-- 双状态轴：
--   import_status: imported / voided          （导入状态）
--   recon_status : pending / running / completed（对账状态，completed=已封帐锁定）
--
-- 可重复执行（列存在性判断 / 幂等 UPDATE / CREATE INDEX IF NOT EXISTS）。
-- 执行前备份 commission_bill、commission_bill_line、reconciliation_diff。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) commission_bill：批次号 / 双状态轴 / 成功失败重复计数 / 锁定与作废
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='batch_no') THEN
    ALTER TABLE commission_bill ADD COLUMN batch_no varchar(40);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='import_status') THEN
    ALTER TABLE commission_bill ADD COLUMN import_status varchar(16) NOT NULL DEFAULT 'imported';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='recon_status') THEN
    ALTER TABLE commission_bill ADD COLUMN recon_status varchar(16) NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='success_count') THEN
    ALTER TABLE commission_bill ADD COLUMN success_count integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='failed_count') THEN
    ALTER TABLE commission_bill ADD COLUMN failed_count integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='duplicate_count') THEN
    ALTER TABLE commission_bill ADD COLUMN duplicate_count integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='locked_by') THEN
    ALTER TABLE commission_bill ADD COLUMN locked_by varchar(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='locked_at') THEN
    ALTER TABLE commission_bill ADD COLUMN locked_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='completed_at') THEN
    ALTER TABLE commission_bill ADD COLUMN completed_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='voided_by') THEN
    ALTER TABLE commission_bill ADD COLUMN voided_by varchar(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill' AND column_name='voided_at') THEN
    ALTER TABLE commission_bill ADD COLUMN voided_at timestamptz;
  END IF;
END $$;

-- 1.1 状态约束
ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS chk_bill_import_status;
ALTER TABLE commission_bill
  ADD CONSTRAINT chk_bill_import_status CHECK (import_status IN ('imported', 'voided'));
ALTER TABLE commission_bill DROP CONSTRAINT IF EXISTS chk_bill_recon_status;
ALTER TABLE commission_bill
  ADD CONSTRAINT chk_bill_recon_status CHECK (recon_status IN ('pending', 'running', 'completed'));

-- 1.2 历史回填：批次号 IMP-YYYYMMDD-NNN（按导入先后全局序，保证唯一）
WITH seq AS (
  SELECT bill_id,
         ROW_NUMBER() OVER (ORDER BY import_date, created_at, bill_id) AS rn
    FROM commission_bill
   WHERE batch_no IS NULL
)
UPDATE commission_bill b
   SET batch_no = 'IMP-' || to_char(b.import_date AT TIME ZONE 'UTC', 'YYYYMMDD')
                   || '-' || lpad((seq.rn % 1000)::text, 3, '0')
  FROM seq
 WHERE b.bill_id = seq.bill_id;

-- 1.3 历史计数回填
UPDATE commission_bill
   SET success_count = CASE WHEN total_policies > 0 THEN total_policies ELSE 0 END,
       failed_count  = COALESCE((import_stats->>'failed')::int, 0),
       duplicate_count = 0
 WHERE success_count = 0 AND import_status = 'imported';

-- 1.4 对账状态轴回填：旧 status=reconciled/settled → completed（视为已封帐）；exception → running
UPDATE commission_bill
   SET recon_status = CASE WHEN status IN ('reconciled', 'settled') THEN 'completed'
                           WHEN status = 'exception' THEN 'running'
                           ELSE 'pending' END,
       locked_by     = CASE WHEN status IN ('reconciled', 'settled') THEN COALESCE(locked_by, 'system') END,
       locked_at     = CASE WHEN status IN ('reconciled', 'settled') THEN COALESCE(locked_at, NOW()) END,
       completed_at  = CASE WHEN status IN ('reconciled', 'settled') THEN COALESCE(completed_at, NOW()) END
 WHERE recon_status = 'pending'
   AND status IN ('reconciled', 'settled', 'exception');

UPDATE commission_bill
   SET recon_status = 'running'
 WHERE status = 'exception' AND recon_status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS uq_bill_batch_no ON commission_bill (batch_no);
CREATE INDEX IF NOT EXISTS idx_bill_recon_status
  ON commission_bill (recon_status, import_date DESC)
  WHERE deleted = FALSE AND import_status = 'imported';

-- ----------------------------------------------------------------------------
-- 2) commission_bill_line：行状态（导入/重复/失败）+ 试算档位 + 去重冗余键
--    去重键：保司 + 账单月份 + 保单号（行上冗余 insurer_id / period_month 以建部分唯一索引）
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='line_status') THEN
    ALTER TABLE commission_bill_line ADD COLUMN line_status varchar(16) NOT NULL DEFAULT 'imported';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='error_reason') THEN
    ALTER TABLE commission_bill_line ADD COLUMN error_reason varchar(512);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='skip_reason') THEN
    ALTER TABLE commission_bill_line ADD COLUMN skip_reason varchar(512);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='trial_level') THEN
    ALTER TABLE commission_bill_line ADD COLUMN trial_level varchar(24);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='insurer_id') THEN
    ALTER TABLE commission_bill_line ADD COLUMN insurer_id varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='commission_bill_line' AND column_name='period_month') THEN
    ALTER TABLE commission_bill_line ADD COLUMN period_month char(7);
  END IF;
END $$;

-- 2.1 冗余键回填
UPDATE commission_bill_line l
   SET insurer_id = b.insurer_id,
       period_month = b.period_month
  FROM commission_bill b
 WHERE l.bill_id = b.bill_id
   AND (l.insurer_id IS NULL OR l.period_month IS NULL);

ALTER TABLE commission_bill_line DROP CONSTRAINT IF EXISTS chk_bline_line_status;
ALTER TABLE commission_bill_line
  ADD CONSTRAINT chk_bline_line_status CHECK (line_status IN ('imported', 'duplicate', 'failed'));
ALTER TABLE commission_bill_line DROP CONSTRAINT IF EXISTS chk_bline_trial_level;
ALTER TABLE commission_bill_line
  ADD CONSTRAINT chk_bline_trial_level
  CHECK (trial_level IS NULL OR trial_level IN
        ('product_state', 'product_all', 'lob_state', 'lob_all', 'bill_original'));

-- 2.2 历史重复数据规整：同 保司+月份+保单号 保留最早一行为 imported，其余置 duplicate
WITH dup AS (
  SELECT l.line_id,
         ROW_NUMBER() OVER (PARTITION BY l.insurer_id, l.period_month, l.policy_number
                                ORDER BY b.import_date, l.line_id) AS rn
    FROM commission_bill_line l
    JOIN commission_bill b ON b.bill_id = l.bill_id
   WHERE l.deleted = FALSE AND b.deleted = FALSE
     AND l.policy_number IS NOT NULL
)
UPDATE commission_bill_line l
   SET line_status = 'duplicate',
       skip_reason = COALESCE(l.skip_reason, 'historical-duplicate-v1015')
  FROM dup
 WHERE l.line_id = dup.line_id AND dup.rn > 1 AND l.line_status = 'imported';

-- 2.3 去重唯一索引：同保司+月份+保单号仅允许一行 imported
CREATE UNIQUE INDEX IF NOT EXISTS uq_bline_dedup
  ON commission_bill_line (insurer_id, period_month, policy_number)
  WHERE deleted = FALSE AND line_status = 'imported';

CREATE INDEX IF NOT EXISTS idx_bline_status ON commission_bill_line (bill_id, line_status);

-- ----------------------------------------------------------------------------
-- 3) reconciliation_diff：批次内行级差异（关联 bill_line / 五类处理结果 / 挂起原因）
--    旧 V1.0.13 词汇（accepted/adjusted/disputed/closed、rate/premium/...）保留于约束，
--    供历史数据只读展示；新流程仅写 open/suspended/resolved + rate_diff/amount_diff。
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='line_id') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN line_id varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='resolution_result') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN resolution_result varchar(32);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='resolved_by') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN resolved_by varchar(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='reconciliation_diff' AND column_name='suspend_reason') THEN
    ALTER TABLE reconciliation_diff ADD COLUMN suspend_reason varchar(512);
  END IF;
END $$;

ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_resolution_v1015;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_resolution_v1015
  CHECK (resolution IN ('open', 'suspended', 'resolved',
                        'accepted', 'adjusted', 'disputed', 'closed'));
ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_resolution_result;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_resolution_result
  CHECK (resolution_result IS NULL OR resolution_result IN
        ('carrier_bill_error', 'our_calc_error', 'rate_corrected',
         'mutual_agreed', 'data_confirmed'));
ALTER TABLE reconciliation_diff DROP CONSTRAINT IF EXISTS chk_diff_type_v1015;
ALTER TABLE reconciliation_diff
  ADD CONSTRAINT chk_diff_type_v1015
  CHECK (diff_type IN ('rate', 'premium', 'agent', 'policy-missing',
                       'extra', 'missing', 'manual',
                       'rate_diff', 'amount_diff'));

CREATE INDEX IF NOT EXISTS idx_diff_bill_line ON reconciliation_diff (bill_id, resolution);

-- ----------------------------------------------------------------------------
-- 4) carrier_commission_rate：备注（原型「新增佣金率」弹窗字段）
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name='carrier_commission_rate' AND column_name='remark') THEN
    ALTER TABLE carrier_commission_rate ADD COLUMN remark varchar(512);
  END IF;
END $$;

-- ============================================================================
-- 完成。应用层变更见 finance.service.ts / finance.controller.ts。
-- ============================================================================
