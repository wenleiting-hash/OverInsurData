-- =====================================================
-- V1.2 产品详情子表（费率方案 / 可售州 / 核保规则 / 培训材料 / 业绩表现）
-- 承接 ProductDetail.tsx 5 个 Tab 的真实 API 对接，替换前端 mock 数据
-- 所有子表以 product_id 外键关联 insurance_product，级联删除
-- =====================================================

-- 1) 费率方案（一对多，含嵌套 rating_factors 与备案状态）
CREATE TABLE IF NOT EXISTS product_rate_plan (
  rate_plan_id   VARCHAR(32)  PRIMARY KEY,
  product_id     VARCHAR(32)  NOT NULL REFERENCES insurance_product(product_id) ON DELETE CASCADE,
  name           VARCHAR(128) NOT NULL,
  tier           VARCHAR(16),
  base_rate      NUMERIC(12,2),
  min_premium    NUMERIC(12,2),
  max_premium    NUMERIC(12,2),
  effective_date DATE,
  expiry_date    DATE,
  status         VARCHAR(16)  DEFAULT 'active',
  rating_factors JSONB        DEFAULT '[]'::jsonb,
  filing_status  VARCHAR(16)  DEFAULT 'not-required',
  sort_order     INTEGER      DEFAULT 0,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_plan_product ON product_rate_plan(product_id);

-- 2) 可售州明细（每产品 x 每州一行，覆盖全部 50 州）
CREATE TABLE IF NOT EXISTS product_state (
  product_id     VARCHAR(32) NOT NULL REFERENCES insurance_product(product_id) ON DELETE CASCADE,
  state_code     VARCHAR(2)  NOT NULL,
  state_name     VARCHAR(64) NOT NULL,
  enabled        BOOLEAN     DEFAULT FALSE,
  status         VARCHAR(16) DEFAULT 'not-available',
  effective_date DATE,
  filing_number  VARCHAR(64),
  channel_count  INTEGER     DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, state_code)
);

-- 3) 核保规则（一对多，双语，按 priority 排序）
CREATE TABLE IF NOT EXISTS product_underwriting_rule (
  rule_id             VARCHAR(32)  PRIMARY KEY,
  product_id          VARCHAR(32)  NOT NULL REFERENCES insurance_product(product_id) ON DELETE CASCADE,
  name                VARCHAR(128) NOT NULL,
  name_en             VARCHAR(128),
  category            VARCHAR(16),
  priority            INTEGER      DEFAULT 0,
  "condition"         TEXT,
  condition_en        TEXT,
  condition_detail    TEXT,
  condition_detail_en TEXT,
  action              VARCHAR(16),
  action_value        VARCHAR(128),
  action_value_en     VARCHAR(128),
  status              VARCHAR(16)  DEFAULT 'active',
  last_modified       DATE,
  modified_by         VARCHAR(64),
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_uw_rule_product ON product_underwriting_rule(product_id);

-- 4) 培训材料（一对多，文件元数据 + 双语标题）
CREATE TABLE IF NOT EXISTS product_training_material (
  material_id  VARCHAR(32)  PRIMARY KEY,
  product_id   VARCHAR(32)  NOT NULL REFERENCES insurance_product(product_id) ON DELETE CASCADE,
  title        VARCHAR(256) NOT NULL,
  title_en     VARCHAR(256),
  type         VARCHAR(32),
  file_name    VARCHAR(256),
  file_size    VARCHAR(32),
  upload_date  DATE,
  uploaded_by  VARCHAR(64),
  version      VARCHAR(32),
  downloads    INTEGER      DEFAULT 0,
  required_for JSONB        DEFAULT '[]'::jsonb,
  expiry_date  DATE,
  sort_order   INTEGER      DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_training_material_product ON product_training_material(product_id);

-- 5) 业绩表现（月度时序，period_order 保证时间升序，末位为最新月）
CREATE TABLE IF NOT EXISTS product_performance (
  product_id   VARCHAR(32)  NOT NULL REFERENCES insurance_product(product_id) ON DELETE CASCADE,
  month        VARCHAR(16)  NOT NULL,
  premium      NUMERIC(12,2),
  new_biz      NUMERIC(12,2),
  renewal      NUMERIC(12,2),
  policies     INTEGER,
  loss_ratio   NUMERIC(5,4),
  claims_count INTEGER,
  period_order INTEGER      DEFAULT 0,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  PRIMARY KEY (product_id, month)
);
CREATE INDEX IF NOT EXISTS idx_performance_product ON product_performance(product_id);
