-- =====================================================================
-- V1.0.15 合作管理收敛迁移（2026-09-16）
-- 幂等：所有变更使用 IF NOT EXISTS / DO $$ 列存在性块，可重复执行
--   C1 续约直接登记（O6：无中间态）：
--      carrier_renewal_task 增加 登记结果列（新到期日/续约合同/备注/登记时间/登记人）
--   C2 产品关联（取代五步接入申请）：
--      新建 cooperation_product 关联表（partnership + product 多对多，带生效日/备注）
--      取消关联时由应用层校验 channel_product_authorization 占用（409 + 占用渠道清单）
--   旧表 carrier_product_access_request / 旧续约中间态保留留痕，前端入口下线。
-- =====================================================================

-- ── C1 续约登记结果列 ────────────────────────────────────────────────
ALTER TABLE carrier_renewal_task ADD COLUMN IF NOT EXISTS new_expiry_date DATE;
ALTER TABLE carrier_renewal_task ADD COLUMN IF NOT EXISTS new_contract_id VARCHAR(32) REFERENCES carrier_contract(contract_id);
ALTER TABLE carrier_renewal_task ADD COLUMN IF NOT EXISTS register_note    VARCHAR(512);
ALTER TABLE carrier_renewal_task ADD COLUMN IF NOT EXISTS registered_at   TIMESTAMPTZ;
ALTER TABLE carrier_renewal_task ADD COLUMN IF NOT EXISTS registered_by   VARCHAR(64);

-- 旧的“谈判中”中间态在 V1.0.15 不再使用（O6）：保留行但标记删除，由登记记录取代。
UPDATE carrier_renewal_task
   SET deleted = TRUE, updated_at = NOW()
 WHERE status = 'in-negotiation'
   AND deleted = FALSE
   AND registered_at IS NULL;

-- ── C2 合作-产品关联表 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cooperation_product (
  link_id        VARCHAR(32) PRIMARY KEY,
  partnership_id VARCHAR(32) NOT NULL REFERENCES carrier_partnership(partnership_id),
  carrier_id     VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  product_id     VARCHAR(32) NOT NULL REFERENCES insurance_product(product_id),
  effective_from DATE DEFAULT CURRENT_DATE,
  remark         VARCHAR(512),
  created_by     VARCHAR(64),
  deleted        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  -- carrier_id 与 product 归属保司一致性由应用层校验（PostgreSQL CHECK 不支持子查询）
  -- 合作-产品关联由应用层 addProductLinks 校验 carrier_id = product.carrier_id
);

-- 同一合作下同产品仅一条有效关联
CREATE UNIQUE INDEX IF NOT EXISTS uq_coop_product_link
  ON cooperation_product (partnership_id, product_id)
  WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_coop_product_partnership
  ON cooperation_product (partnership_id)
  WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_coop_product_carrier
  ON cooperation_product (carrier_id)
  WHERE deleted = FALSE;

-- 历史接入申请（已批准/已集成）回填为关联，保证流程可走通（O7 真实数据迁移）
INSERT INTO cooperation_product (link_id, partnership_id, carrier_id, product_id, effective_from, remark, created_by, created_at, updated_at)
SELECT 'cpl_' || lower(substr(md5(r.request_id), 1, 24)),
       r.partnership_id, r.carrier_id, r.product_id,
       COALESCE(r.reviewed_at::date, r.created_at::date, CURRENT_DATE),
       'V1.0.15 迁移自已批准的产品接入申请',
       COALESCE(r.reviewed_by, r.requested_by, 'system:migration'),
       r.created_at, GREATEST(r.updated_at, r.created_at)
  FROM carrier_product_access_request r
 WHERE r.deleted = FALSE
   AND r.product_id IS NOT NULL
   AND r.partnership_id IS NOT NULL
   AND r.status IN ('approved', 'integrated')
ON CONFLICT DO NOTHING;
