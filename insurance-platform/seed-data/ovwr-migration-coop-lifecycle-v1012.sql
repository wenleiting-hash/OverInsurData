-- ============================================================================
-- V1.0.12 (2026-09-13)
-- 合作管理：去除审批流水线状态，对齐需求 3.6 合作全生命周期状态机。
--
-- 旧状态（审批流水线）          新状态（业务生命周期，doc 3.6）
--   Draft / Rejected          -> Negotiating  洽谈中
--   Submitted / UnderReview   -> PendingSign  待签约
--   Approved                  -> Active       履行中
--   Terminated                -> Terminated   已终止（不变）
-- Signed(已签约) 为新增状态：合同签署完成、生效日未到；生效日到达后由
-- 服务端定时任务自动置为 Active。Expiring/Expired 不落库，读时按到期日派生。
--
-- 可重复执行（IF EXISTS / 幂等 UPDATE）。
-- ============================================================================

-- 1) 词汇迁移（先迁移再建 CHECK，避免违反约束）
UPDATE carrier_partnership SET status = 'Negotiating'
 WHERE status IN ('Draft', 'Rejected');
UPDATE carrier_partnership SET status = 'PendingSign'
 WHERE status IN ('Submitted', 'UnderReview');
UPDATE carrier_partnership SET status = 'Active'
 WHERE status = 'Approved';

-- 2) 列默认值
ALTER TABLE carrier_partnership ALTER COLUMN status SET DEFAULT 'Negotiating';

-- 3) 合法状态 CHECK（终态/派生口径以应用层状态机为准）
ALTER TABLE carrier_partnership DROP CONSTRAINT IF EXISTS chk_partnership_status;
ALTER TABLE carrier_partnership
  ADD CONSTRAINT chk_partnership_status
  CHECK (status IN ('Negotiating', 'PendingSign', 'Signed', 'Active', 'Terminated'));
