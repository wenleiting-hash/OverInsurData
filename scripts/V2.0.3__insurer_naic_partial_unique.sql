-- ==========================================================================
-- V2.0.3: 保险公司 NAIC 编码唯一约束改为部分唯一索引
-- ==========================================================================
-- 背景：
--   insurance_carrier.naic_code 原为硬 UNIQUE 约束（insurance_carrier_naic_code_key），
--   作用于所有记录（含软删除 deleted = TRUE 的记录）。
--   导致：某保险公司被软删除后，其 NAIC 编码无法被新记录复用，
--   新增时仍会提示"编码已存在"。
--
-- 目标：
--   NAIC 编码查重仅针对未删除（列表可见）的数据。
--   软删除记录保留其 NAIC 编码，但不阻塞新记录复用同一编码。
--
-- 方案：
--   1. 删除原硬 UNIQUE 约束
--   2. 创建部分唯一索引，仅对 deleted = FALSE 的记录生效
-- 幂等：可重复执行
-- ==========================================================================

-- 1. 删除原硬 UNIQUE 约束（若存在）
ALTER TABLE insurance_carrier DROP CONSTRAINT IF EXISTS insurance_carrier_naic_code_key;

-- 2. 删除可能残留的同名索引（若存在）
DROP INDEX IF EXISTS insurance_carrier_naic_code_key;

-- 3. 创建部分唯一索引：仅未删除记录的 naic_code 需唯一
CREATE UNIQUE INDEX IF NOT EXISTS insurance_carrier_naic_code_active_key
  ON insurance_carrier (naic_code)
  WHERE deleted = FALSE;
