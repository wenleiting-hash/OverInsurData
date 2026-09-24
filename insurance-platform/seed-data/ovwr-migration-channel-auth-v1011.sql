-- =====================================================================
-- V1.0.11 渠道产品授权与出单权限（2026-09-12）
-- 幂等：IF NOT EXISTS / ON CONFLICT DO NOTHING，可重复执行
--   1) channel_org                     渠道组织最小主数据（授权对象选择用）
--   2) channel_product_authorization   渠道×产品（×州）销售授权
--   3) channel_issuance_permission     出单操作权限与保费限额（与授权 1:1）
-- 边界：渠道授权归属"渠道管理域"，与 carrier_partnership 不做强绑定、不做终止级联。
-- =====================================================================

-- 1) 渠道组织主数据（前端渠道管理此前为纯 mock，此处仅落地授权功能所需的最小列集）
CREATE TABLE IF NOT EXISTS channel_org (
  channel_id       VARCHAR(32) PRIMARY KEY,
  channel_name     VARCHAR(128) NOT NULL,
  channel_type     VARCHAR(32),                       -- Independent Agency / Broker / MGA / Wholesale Broker / Direct
  status           VARCHAR(16) DEFAULT 'active',     -- active / inactive / onboarding / suspended
  tier             VARCHAR(16),                      -- Platinum / Gold / Silver / Standard
  parent_id        VARCHAR(32),
  hq_state         CHAR(2),
  licensed_states  JSONB DEFAULT '[]',                -- 持牌州代码数组
  npn_code         VARCHAR(32),
  manager_name     VARCHAR(64),
  deleted          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2) 渠道产品销售授权
CREATE TABLE IF NOT EXISTS channel_product_authorization (
  auth_id            VARCHAR(32) PRIMARY KEY,
  channel_id         VARCHAR(32) NOT NULL REFERENCES channel_org(channel_id),
  product_id         VARCHAR(32) NOT NULL REFERENCES insurance_product(product_id),
  carrier_id         VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  line_of_business   VARCHAR(32),
  authorized_states  JSONB NOT NULL DEFAULT '[]',     -- 授权可售州（须同时满足产品可售州+渠道持牌州）
  grant_type         VARCHAR(16) DEFAULT 'permanent', -- permanent / fixed / trial
  effective_date     DATE,
  expiration_date    DATE,                           -- NULL = 永久授权
  status             VARCHAR(16) DEFAULT 'active',   -- active / revoked（expired/expiring 为读取时推导）
  revoked_at         TIMESTAMPTZ,
  revoke_reason      TEXT,
  created_by         VARCHAR(64),
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 同一渠道+产品只允许一条有效授权（软删/已收回不冲突），冲突检测主要靠它兜底
CREATE UNIQUE INDEX IF NOT EXISTS uq_channel_product_auth_active
  ON channel_product_authorization (channel_id, product_id)
  WHERE deleted = FALSE AND status <> 'revoked';

CREATE INDEX IF NOT EXISTS idx_cpa_channel ON channel_product_authorization(channel_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cpa_product ON channel_product_authorization(product_id) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_cpa_carrier ON channel_product_authorization(carrier_id) WHERE deleted = FALSE;

-- 3) 出单操作权限与限额（与授权 1:1）
CREATE TABLE IF NOT EXISTS channel_issuance_permission (
  permission_id      VARCHAR(32) PRIMARY KEY,
  auth_id            VARCHAR(32) NOT NULL UNIQUE REFERENCES channel_product_authorization(auth_id),
  can_quote          BOOLEAN DEFAULT TRUE,    -- 报价
  can_bind           BOOLEAN DEFAULT FALSE,   -- 出单
  can_endorse        BOOLEAN DEFAULT FALSE,   -- 批改
  can_renew          BOOLEAN DEFAULT FALSE,   -- 续保
  can_surrender      BOOLEAN DEFAULT FALSE,   -- 退保
  can_claim_report   BOOLEAN DEFAULT FALSE,   -- 理赔报案
  bind_mode          VARCHAR(16) DEFAULT 'direct',      -- direct 直接出单 / underwrite 转保司核保 / forbidden 禁止出单
  limit_per_policy   NUMERIC(14,2),                       -- 单笔保费限额（USD）
  limit_monthly      NUMERIC(16,2),                       -- 月度累计限额
  limit_quarterly    NUMERIC(16,2),                       -- 季度累计限额
  over_limit_rule    VARCHAR(16) DEFAULT 'manual',       -- manual 转人工核保 / forbidden 禁止出单 / approval 主管审批
  updated_by         VARCHAR(64),
  deleted            BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4) 渠道种子（来自前端 mockChannelStore，c1..c12，幂等）
INSERT INTO channel_org
  (channel_id, channel_name, channel_type, status, tier, parent_id, hq_state, licensed_states, npn_code, manager_name)
VALUES
  ('c1','Pacific Coast Insurance Group','Independent Agency','active','Platinum',NULL,'CA','["CA"]','NPN12348901','Sarah Chen'),
  ('c2','Lone Star Brokerage','Broker','active','Platinum',NULL,'TX','["TX"]','NPN23459012','James Rodriguez'),
  ('c3','Great Lakes Insurance Partners','MGA','active','Gold',NULL,'IL','["IL"]','NPN34560123','Michael Wu'),
  ('c4','Empire State Insurance Services','Independent Agency','active','Gold',NULL,'NY','["NY"]','NPN45671234','Emily Johnson'),
  ('c5','Sunshine State Brokers','Broker','active','Gold',NULL,'FL','["FL"]','NPN56782345','Carlos Martinez'),
  ('c6','Midwest Specialty Risk','Wholesale Broker','active','Silver',NULL,'OH','["OH"]','NPN67893456','David Kim'),
  ('c7','Rocky Mountain Insurance Advisors','Independent Agency','active','Silver',NULL,'CO','["CO"]','NPN78904567','Jennifer Park'),
  ('c8','Atlantic Coastal Risk Management','MGA','active','Silver',NULL,'NC','["NC"]','NPN89015678','Robert Lee'),
  ('c9','Southwest Insurance Network','Broker','onboarding','Standard',NULL,'AZ','["AZ"]','NPN90126789','Lisa Wang'),
  ('c10','Northeast Professional Services','Independent Agency','suspended','Standard',NULL,'CT','["CT"]','NPN01237890','Tom Anderson'),
  ('c11','PCG - Bay Area Division','Independent Agency','active','Gold','c1','CA','["CA"]','NPN11248901','Amy Zhang'),
  ('c12','Lone Star - Houston Branch','Broker','active','Gold','c2','TX','["TX"]','NPN22359012','Victor Gonzalez')
ON CONFLICT (channel_id) DO NOTHING;

-- 5) 种子修复：渠道授权需要可选保司。历史清理把种子保司软删了，
--    但 insurance_product 仍引用这些保司（且产品为 Active），
--    恢复「拥有 Active 产品」的保司为可见+启用，保证 10.1 授权链路可选。
UPDATE insurance_carrier c
   SET deleted = FALSE, status = 'active', updated_at = CURRENT_TIMESTAMP
 WHERE c.carrier_id IN (SELECT DISTINCT carrier_id FROM insurance_product WHERE status = 'Active')
   AND (c.deleted = TRUE OR c.status IS DISTINCT FROM 'active')
   -- 跳过与现有有效保司 NAIC 冲突的记录（部分唯一索引 naic WHERE deleted=FALSE）
   AND NOT EXISTS (
     SELECT 1 FROM insurance_carrier x
      WHERE x.deleted = FALSE AND x.naic_code = c.naic_code AND x.carrier_id <> c.carrier_id
   );

-- 6) 种子修复：产品目录的 Active 种子产品同样被历史清理软删，
--    恢复为可见（跳过 product_code 与现有有效产品冲突的记录）。
UPDATE insurance_product p
   SET deleted = FALSE, updated_at = CURRENT_TIMESTAMP
 WHERE p.status = 'Active' AND p.deleted = TRUE
   AND NOT EXISTS (
     SELECT 1 FROM insurance_product x
      WHERE x.deleted = FALSE AND x.product_code = p.product_code AND x.product_id <> p.product_id
   );
