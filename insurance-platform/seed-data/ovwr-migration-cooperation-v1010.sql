-- =====================================================================
-- V1.0.10 合作管理全栈补齐迁移（2026-09-11）
-- 幂等：所有变更使用 IF NOT EXISTS / ON CONFLICT DO NOTHING，可重复执行
--   1) carrier_partnership 终止流程 6 列（与产品模块 pending_change 同构）
--   2) carrier_renewal_task 续约任务表
--   3) carrier_product_access_request 产品资源接入申请表
--   4) 续约/接入种子数据（关联既有 coop001-005 / c1001-c1005）
-- =====================================================================

-- 1) 合作终止：原因码/补充说明/生效方式/计划生效时间/实际终止时间/待执行变更负载
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS terminate_reason       VARCHAR(64);
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS terminate_note         TEXT;
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS terminate_effect_type  VARCHAR(16);   -- immediate / end-of-term / scheduled
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS terminate_effective_at TIMESTAMPTZ;
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS terminated_at          TIMESTAMPTZ;
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS pending_change         JSONB;
-- pending_change 结构：
-- { "action": "terminate",
--   "reason": "contract-expired",
--   "note": "补充说明",
--   "effectType": "immediate" | "end-of-term" | "scheduled",
--   "source": "immediate" | "scheduler" }

CREATE INDEX IF NOT EXISTS idx_carrier_partnership_pending
  ON carrier_partnership (terminate_effective_at)
  WHERE pending_change IS NOT NULL;

-- 2) 续约任务表（以本表为准，sync 用确定性 ID upsert，人工任务用时间戳 ID 不被覆盖）
CREATE TABLE IF NOT EXISTS carrier_renewal_task (
  renewal_id       VARCHAR(32) PRIMARY KEY,
  partnership_id   VARCHAR(32) NOT NULL REFERENCES carrier_partnership(partnership_id),
  carrier_id       VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  contract_id      VARCHAR(32) REFERENCES carrier_contract(contract_id),
  title            VARCHAR(256) NOT NULL,
  expiry_date      DATE NOT NULL,
  priority         VARCHAR(16) DEFAULT 'normal',           -- critical / high / normal / low
  status           VARCHAR(24) DEFAULT 'upcoming',         -- upcoming / in-negotiation / renewed / expired
  auto_renew       BOOLEAN DEFAULT FALSE,
  account_manager  VARCHAR(128),
  last_action      VARCHAR(256),
  last_action_at   DATE,
  deleted          BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_renewal_expiry
  ON carrier_renewal_task(expiry_date)
  WHERE deleted = FALSE;

-- 3) 产品资源接入申请表（状态机：available→requested→in-review→approved→integrated；可 rejected/suspended）
CREATE TABLE IF NOT EXISTS carrier_product_access_request (
  request_id        VARCHAR(32) PRIMARY KEY,
  partnership_id    VARCHAR(32) REFERENCES carrier_partnership(partnership_id),
  carrier_id        VARCHAR(32) NOT NULL REFERENCES insurance_carrier(carrier_id),
  product_id        VARCHAR(32) REFERENCES insurance_product(product_id),
  product_name      VARCHAR(128) NOT NULL,
  product_code      VARCHAR(32),
  line_of_business  VARCHAR(32),
  target_states     JSONB DEFAULT '["ALL"]',
  priority          VARCHAR(16) DEFAULT 'normal',
  status            VARCHAR(16) DEFAULT 'available',
  estimated_premium NUMERIC(14,2),
  technical_reqs    JSONB DEFAULT '[]',
  api_doc           BOOLEAN DEFAULT FALSE,
  test_completed    BOOLEAN DEFAULT FALSE,
  notes             TEXT,
  requested_by      VARCHAR(64),
  reviewed_by       VARCHAR(64),
  reviewed_at       TIMESTAMPTZ,
  deleted           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_access_status
  ON carrier_product_access_request(status)
  WHERE deleted = FALSE;

-- 4) 种子数据（到期日相对 2026-09-11 编制，幂等）
INSERT INTO carrier_renewal_task
  (renewal_id, partnership_id, carrier_id, contract_id, title, expiry_date, priority, status, auto_renew, account_manager, last_action, last_action_at)
VALUES
  ('rnseed001','coop005','c1005','contract004','State Farm Master Agreement Renewal', DATE '2026-10-26','high','upcoming',TRUE, 'Emily Chen','Initial check completed', DATE '2026-09-01'),
  ('rnseed002','coop002','c1002','contract002','Chubb Product Supplement Extension',   DATE '2027-01-14','low','upcoming',FALSE,'Kevin Wang','Negotiation started',  DATE '2026-08-20'),
  ('rnseed003','coop003','c1003','contract003','Liberty Mutual NDA Renewal',  DATE '2026-11-05','high','in-negotiation',FALSE,'Michael Thompson','Terms discussion in progress', DATE '2026-08-25'),
  ('rnseed004','coop001','c1001','contract001','Travelers Annual Agreement Review', DATE '2027-03-20','low','upcoming',FALSE,'Emily Chen',NULL,NULL),
  ('rnseed005','coop004','c1004',NULL,       'Nationwide Partnership Terms Review',     DATE '2026-09-03','critical','upcoming',TRUE,'David Martinez','Awaiting legal confirmation', DATE '2026-08-28')
ON CONFLICT (renewal_id) DO NOTHING;

INSERT INTO carrier_product_access_request
  (request_id, partnership_id, carrier_id, product_id, product_name, product_code, line_of_business,
   target_states, priority, status, estimated_premium, technical_reqs, api_doc, test_completed, notes, requested_by, reviewed_by, reviewed_at)
VALUES
  ('intseed001','coop005','c1005',NULL,'Auto Classic Plus','AUTO-CL-001','Auto',
   '["CA","NV","AZ"]'::jsonb,'normal','integrated',2500000,'["REST API","Real-time Quotes"]'::jsonb,TRUE,TRUE,'Production ready','Kevin Wang','Emily Chen', NOW() - INTERVAL '20 days'),
  ('intseed002','coop005','c1005',NULL,'Homeowner Premier','HOME-PM-002','Home',
   '["CA","NV"]'::jsonb,'high','approved',1800000,'["SOAP API","Batch Sync"]'::jsonb,FALSE,FALSE,NULL,'Kevin Wang','Emily Chen', NOW() - INTERVAL '12 days'),
  ('intseed003','coop002','c1002',NULL,'Cyber Risk Coverage','CYBER-RSK-001','Commercial',
   '["NY","NJ","PA"]'::jsonb,'high','in-review',950000,'["GraphQL","Webhooks"]'::jsonb,TRUE,FALSE,NULL,'Michael Thompson',NULL,NULL),
  ('intseed004','coop002','c1002',NULL,'Life Protect Advanced','LIFE-PR-003','Life',
   '["ALL"]'::jsonb,'normal','requested',3200000,'["REST API"]'::jsonb,FALSE,FALSE,'Awaiting underwriting assessment','Kevin Wang',NULL,NULL),
  ('intseed005','coop003','c1003',NULL,'Travel Insurance Basic','TRVL-BSC-001','Travel',
   '["FL","TX"]'::jsonb,'low','available',650000,'["REST API","XML Feed"]'::jsonb,FALSE,FALSE,NULL,NULL,NULL,NULL)
ON CONFLICT (request_id) DO NOTHING;

-- =====================================================================
-- 5) 2026-09-12 原型对齐增量（迭代文档第十章 10.7 #5）
--    carrier_partnership 增加负责人 owner_name（自由姓名，不挂用户 FK）
--    并回填 7 个种子合作（按 partnership_id 精确匹配，可重复执行）
-- =====================================================================
ALTER TABLE carrier_partnership ADD COLUMN IF NOT EXISTS owner_name VARCHAR(64);

UPDATE carrier_partnership SET owner_name = 'Sarah Chen',    updated_at = NOW() WHERE partnership_id = 'coop001' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'Emily Johnson', updated_at = NOW() WHERE partnership_id = 'coop002' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'James Rodriguez', updated_at = NOW() WHERE partnership_id = 'coop003' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'Michael Wu',    updated_at = NOW() WHERE partnership_id = 'coop004' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'Lisa Anderson', updated_at = NOW() WHERE partnership_id = 'coop005' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'Sarah Chen',    updated_at = NOW() WHERE partnership_id = 'coop006' AND owner_name IS NULL;
UPDATE carrier_partnership SET owner_name = 'Tom Anderson',  updated_at = NOW() WHERE partnership_id = 'coop007' AND owner_name IS NULL;
