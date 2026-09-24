-- ============================================================================
-- V1.0.14 (2026-09-14)
-- 佣金率主数据：保司维度（险种级 / 产品级）佣金率配置，对账期望值 = 保费 × 佣金率。
--
-- 优先级（state 维度四级回退）：产品级+州 > 产品级+全域 > 险种级+州 > 险种级+全域。
-- 可重复执行（CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT EXISTS / COMMENT）。
-- ============================================================================

CREATE TABLE IF NOT EXISTS carrier_commission_rate (
  rate_id           varchar(32) PRIMARY KEY,
  carrier_id        varchar(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  dimension         varchar(16) NOT NULL CHECK (dimension IN ('lob', 'product')),
  line_of_business  varchar(64),
  product_id        varchar(32),
  state             varchar(8),
  rate              numeric(5,4) NOT NULL CHECK (rate >= 0 AND rate <= 1),
  effective_from    date NOT NULL,
  effective_to      date,
  status            varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired')),
  version           integer NOT NULL DEFAULT 1,
  created_by        varchar(64),
  deleted           boolean NOT NULL DEFAULT FALSE,
  created_at        timestamptz NOT NULL DEFAULT NOW(),
  updated_at        timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ccr_carrier ON carrier_commission_rate(carrier_id, deleted);
CREATE INDEX IF NOT EXISTS idx_ccr_effective ON carrier_commission_rate(carrier_id, dimension, state, effective_from);

COMMENT ON TABLE carrier_commission_rate IS '佣金率主数据（V1.0.14）。期望值=保费×佣金率，产品级+州>产品级+全域>险种级+州>险种级+全域。';
COMMENT ON COLUMN carrier_commission_rate.state IS '美国州缩写（如 CA/TX）；NULL=全域适用，对账时按 州精确匹配→全域 回退。';
