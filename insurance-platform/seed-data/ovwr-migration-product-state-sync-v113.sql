-- =====================================================================
-- V1.1.3 产品可售州双写一致性修复迁移（2026-09-23）
-- 背景：产品表单保存的 available_states（insurance_product JSONB 主数据）
--       与详情州 tab / 单州暂停使用的 product_state 表此前不同步——
--       新建/编辑产品只写 JSONB，product_state 仅由种子脚本填充，
--       导致"编辑可售州后产品详情显示不正确"。
-- 本脚本对存量数据做一次性对齐（幂等，可重复执行）：
--   1) available_states 统一为大写去重；
--   2) 主数据清单内缺失的 product_state 行补录为 active；
--   3) 清单内历史 not-available/pending 行提升为 active；
--      （运营层 suspended 保留，下架暂停不丢）
--   4) 清单外行置为 not-available。
-- 之后由 ProductService.create/update 在事务内自动维护，无需再跑本脚本。
-- =====================================================================

-- 0) available_states 规范化：大写 + 去重
UPDATE insurance_product
SET available_states = (
  SELECT COALESCE(jsonb_agg(DISTINCT upper(x)), '[]'::jsonb)
  FROM jsonb_array_elements_text(available_states) AS x
)
WHERE deleted = FALSE AND jsonb_typeof(available_states) = 'array';

-- 1) 补录主数据清单内缺失的州行（默认 active）
INSERT INTO product_state (product_id, state_code, state_name, enabled, status)
SELECT p.product_id, s.code, s.name, TRUE, 'active'
FROM insurance_product p
CROSS JOIN (VALUES
  ('AL','Alabama'),('AK','Alaska'),('AZ','Arizona'),('AR','Arkansas'),('CA','California'),
  ('CO','Colorado'),('CT','Connecticut'),('DE','Delaware'),('FL','Florida'),('GA','Georgia'),
  ('HI','Hawaii'),('ID','Idaho'),('IL','Illinois'),('IN','Indiana'),('IA','Iowa'),
  ('KS','Kansas'),('KY','Kentucky'),('LA','Louisiana'),('ME','Maine'),('MD','Maryland'),
  ('MA','Massachusetts'),('MI','Michigan'),('MN','Minnesota'),('MS','Mississippi'),('MO','Missouri'),
  ('MT','Montana'),('NE','Nebraska'),('NV','Nevada'),('NH','New Hampshire'),('NJ','New Jersey'),
  ('NM','New Mexico'),('NY','New York'),('NC','North Carolina'),('ND','North Dakota'),('OH','Ohio'),
  ('OK','Oklahoma'),('OR','Oregon'),('PA','Pennsylvania'),('RI','Rhode Island'),('SC','South Carolina'),
  ('SD','South Dakota'),('TN','Tennessee'),('TX','Texas'),('UT','Utah'),('VT','Vermont'),
  ('VA','Virginia'),('WA','Washington'),('WV','West Virginia'),('WI','Wisconsin'),('WY','Wyoming')
) AS s(code, name)
WHERE p.deleted = FALSE
  AND jsonb_typeof(p.available_states) = 'array'
  AND s.code IN (SELECT upper(x) FROM jsonb_array_elements_text(p.available_states) AS x)
ON CONFLICT (product_id, state_code) DO NOTHING;

-- 2) 清单内历史不可售/审核中行 → active（suspended 运营暂停态不动）
UPDATE product_state ps
SET status = 'active', enabled = TRUE, updated_at = NOW()
FROM insurance_product p
WHERE ps.product_id = p.product_id
  AND p.deleted = FALSE
  AND ps.status IN ('not-available', 'pending')
  AND ps.state_code IN (SELECT upper(x) FROM jsonb_array_elements_text(p.available_states) AS x);

-- 3) 清单外行 → not-available（产品表单已移除该州；保留 channel_count/filing_number 列）
UPDATE product_state ps
SET status = 'not-available', enabled = FALSE, updated_at = NOW()
FROM insurance_product p
WHERE ps.product_id = p.product_id
  AND p.deleted = FALSE
  AND ps.status <> 'not-available'
  AND NOT (ps.state_code IN (SELECT upper(x) FROM jsonb_array_elements_text(p.available_states) AS x));
