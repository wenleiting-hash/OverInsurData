-- =====================================================================
-- V1.0.10 产品管理缺陷修复迁移（2026-09-11）
-- 幂等：所有变更使用 IF NOT EXISTS / OR REPLACE，可重复执行
-- =====================================================================

-- 1) 产品上下架：原因/备注/范围/州清单/操作人/操作时间落库
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_reason        VARCHAR(64);
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_remark        TEXT;
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_change_scope  VARCHAR(16);   -- all / selected
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_change_states JSONB;         -- 指定州下架时的州代码数组
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_changed_at    TIMESTAMPTZ;
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_changed_by    VARCHAR(128);

-- 2) 定时生效：pending_change 为待执行变更负载，status_effective_at 为计划生效时间
--    到点后由 ProductService 定时扫描（或读取时懒执行）落地并清空
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS status_effective_at  TIMESTAMPTZ;
ALTER TABLE insurance_product ADD COLUMN IF NOT EXISTS pending_change       JSONB;
-- pending_change 结构：
-- { "action": "delist" | "list",
--   "scope": "all" | "selected",
--   "states": ["CA", "NY"],
--   "reason": "rate-file-expired",
--   "remark": "备注" }

-- 到期待执行查询索引
CREATE INDEX IF NOT EXISTS idx_insurance_product_pending
  ON insurance_product (status_effective_at)
  WHERE pending_change IS NOT NULL;
