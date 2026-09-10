-- V1.5 — 移除产品模块的审批 / 备案语义
--
-- 背景：本平台没有任何审批流程。产品模块历史上残留了两类「审批态」数据，与产品定位冲突：
--   a) product_state.status = 'pending'（审核中的州）—— 迁移前实测 1 行
--   b) product_rate_plan.status = 'pending'（待审批的费率方案）—— 迁移前实测 0 行，仍需防回流
--
-- 应用层已同步收口（carrier-service product-detail.dto.ts / product-detail.service.ts）：
--   · CreateRatePlanDto / UpdateRatePlanDto / SetRatePlanStatusDto 的 status 只允许 active|draft|expired
--   · RATE_PLAN_COLS 不再 SELECT / INSERT filing_status
--   · getStates 不再 SELECT filing_number
-- 本迁移把存量数据落定，并用 CHECK 约束把状态域钉死，防止任何路径再把审批态写回库里。
--
-- 关于 filing_status / filing_number 两列：
--   属监管备案字段。列**保留不删**（避免影响既有备份与回滚），但应用层已完全不读不写，
--   此处仅补注释标明为废弃列。两列均可空 / 带 DEFAULT，保留不影响任何写入。
--
-- 幂等：可重复执行。

-- ── 1) 归一存量审批态 ────────────────────────────────────────────────────────
-- 「审核中」的州 → 「未开通」：没有审批流程，就不存在审核中这个中间态。
UPDATE product_state
   SET status = 'not-available', updated_at = NOW()
 WHERE status = 'pending';

-- 「待审批」的费率方案 → 「草稿」：与 product-detail.service.ts mapRatePlan 的读时归一保持一致。
UPDATE product_rate_plan
   SET status = 'draft', updated_at = NOW()
 WHERE status = 'pending';

-- ── 2) 锁定状态域，杜绝审批态回流 ────────────────────────────────────────────
-- 两列均可空，NULL 能通过 CHECK（CHECK 仅在表达式为 FALSE 时失败），故不影响历史空值行。
ALTER TABLE product_state
  DROP CONSTRAINT IF EXISTS ck_product_state_status;
ALTER TABLE product_state
  ADD CONSTRAINT ck_product_state_status
  CHECK (status IN ('active', 'suspended', 'not-available'));

ALTER TABLE product_rate_plan
  DROP CONSTRAINT IF EXISTS ck_product_rate_plan_status;
ALTER TABLE product_rate_plan
  ADD CONSTRAINT ck_product_rate_plan_status
  CHECK (status IN ('active', 'draft', 'expired'));

-- ── 3) 列注释：写清状态域与废弃列 ────────────────────────────────────────────
COMMENT ON COLUMN product_state.status IS
  '可售州状态：active(已开通) / suspended(已暂停) / not-available(未开通)。本平台无审批流程，不存在 pending(审核中)。';

COMMENT ON COLUMN product_rate_plan.status IS
  '费率方案状态：active(生效中) / draft(草稿) / expired(已到期)。本平台无审批流程，不存在 pending(待审批)。';

COMMENT ON COLUMN product_rate_plan.filing_status IS
  '【已废弃】监管备案状态。本平台无审批 / 备案流程，应用层不再读写，列仅为兼容历史备份保留。';

COMMENT ON COLUMN product_state.filing_number IS
  '【已废弃】监管备案号。本平台无审批 / 备案流程，应用层不再读写，列仅为兼容历史备份保留。';
