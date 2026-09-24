-- ============================================================================
-- V1.0.18 (2026-09-24)
-- 险种字典：三级字典入库（业务线 / 子险种 / 承保范围）+ 业务线×承保范围关联。
--
-- 背景：
-- 同一份「业务线→子险种」联动字典此前硬编码于后端集成服务、建品表单、联调模拟器
-- 三处；承保范围 9 项全局硬编码且不随业务线联动。本迁移建立字典四表并播种现网
-- 口径数据（11 业务线 / 36 子险种 / 9 承保范围 / 99 关联），供 dictionary 模块
-- 管理端 CRUD 与 coverage-tree / I4 集成快照消费。
--
-- 设计要点（对齐 PRD §4）：
-- 1. code 一律不可变（更新接口仅接受 name/sort_order/status）。
-- 2. 删除为软删（deleted=TRUE）；被产品引用的项在应用层拒绝删除。
-- 3. 子险种 code 保留原始形态（'Personal Auto'、'D&O'），与产品表 sub_line
--    现存值一致，避免数据迁移。
-- 4. 关联播种为每业务线 × 全部 9 项承保范围（11×9=99 行），保持现网行为
--    （不联动→等效于全适用），上线后由业务在管理界面逐步收窄。
--
-- 可重复执行（IF NOT EXISTS / ON CONFLICT DO NOTHING）。
-- 仅新增表，不触碰既有表。
-- ============================================================================

-- ─── 业务线 ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_line (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(32)  NOT NULL UNIQUE,          -- Auto / Home / ...（不可变）
  name_zh      VARCHAR(64)  NOT NULL,
  name_en      VARCHAR(64)  NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  status       VARCHAR(16)  NOT NULL DEFAULT 'active', -- active / disabled
  deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by   VARCHAR(64),
  updated_by   VARCHAR(64),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 子险种（挂业务线）─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_sub_line (
  id           SERIAL PRIMARY KEY,
  line_code    VARCHAR(32)  NOT NULL REFERENCES insurance_line(code),
  code         VARCHAR(64)  NOT NULL,                 -- 'Personal Auto'（含空格与 &，唯一性按 line 维度）
  name_zh      VARCHAR(64)  NOT NULL,
  name_en      VARCHAR(64)  NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  status       VARCHAR(16)  NOT NULL DEFAULT 'active',
  deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by   VARCHAR(64),
  updated_by   VARCHAR(64),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (line_code, code)
);

-- ─── 承保范围（全局）────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_coverage (
  id           SERIAL PRIMARY KEY,
  code         VARCHAR(64)  NOT NULL UNIQUE,          -- liability / newCarValue（camelCase，不可变）
  name_zh      VARCHAR(64)  NOT NULL,
  name_en      VARCHAR(64)  NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  status       VARCHAR(16)  NOT NULL DEFAULT 'active',
  deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_by   VARCHAR(64),
  updated_by   VARCHAR(64),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── 业务线 × 承保范围 关联（真三级联动核心）────────────────────────────────
CREATE TABLE IF NOT EXISTS line_coverage_rel (
  id            SERIAL PRIMARY KEY,
  line_code     VARCHAR(32) NOT NULL REFERENCES insurance_line(code),
  coverage_code VARCHAR(64) NOT NULL REFERENCES insurance_coverage(code),
  created_by    VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (line_code, coverage_code)
);

CREATE INDEX IF NOT EXISTS idx_sub_line_line   ON insurance_sub_line(line_code) WHERE deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_rel_line        ON line_coverage_rel(line_code);

COMMENT ON TABLE insurance_line        IS '险种字典-业务线（11 项，code 不可变）；产品表 line_of_business 引用其 code。';
COMMENT ON TABLE insurance_sub_line    IS '险种字典-子险种（按 line_code 归组，code 保留原始形态）；产品表 sub_line 引用其 code。';
COMMENT ON TABLE insurance_coverage    IS '险种字典-承保范围（全局 9 项，camelCase code）；产品表 coverages JSONB 引用其 code。';
COMMENT ON TABLE line_coverage_rel     IS '业务线×承保范围 适用关联（真三级联动核心；全量替换式维护）。';

-- ─── 播种：11 业务线（顺序即 sort_order）───────────────────────────────────
INSERT INTO insurance_line (code, name_zh, name_en, sort_order, created_by) VALUES
  ('Auto',        '车险',       'Auto',        1, 'seed'),
  ('Home',        '家庭财产险', 'Home',        2, 'seed'),
  ('Commercial',  '商业保险',   'Commercial',  3, 'seed'),
  ('Cyber',       '网络保险',   'Cyber',       4, 'seed'),
  ('Life',        '人寿保险',   'Life',        5, 'seed'),
  ('Travel',      '旅行保险',   'Travel',      6, 'seed'),
  ('Professional','职业责任险', 'Professional', 7, 'seed'),
  ('D&O',         '董监高责任险','D&O',        8, 'seed'),
  ('E&O',         '错误与遗漏险','E&O',        9, 'seed'),
  ('Marine',      '海事保险',   'Marine',     10, 'seed'),
  ('Specialty',   '特殊险种',   'Specialty',  11, 'seed')
ON CONFLICT (code) DO NOTHING;

-- ─── 播种：36 子险种（业务线内 sort_order 从 1 起）─────────────────────────
INSERT INTO insurance_sub_line (line_code, code, name_zh, name_en, sort_order, created_by) VALUES
  -- Auto（3）
  ('Auto', 'Personal Auto',    '个人车险',        'Personal Auto',    1, 'seed'),
  ('Auto', 'Commercial Auto',  '商业车险',        'Commercial Auto',  2, 'seed'),
  ('Auto', 'Fleet Auto',       '车队车险',        'Fleet Auto',       3, 'seed'),
  -- Home（4）
  ('Home', 'Homeowners',       '业主保险',        'Homeowners',       1, 'seed'),
  ('Home', 'Renters',          '租客保险',        'Renters',          2, 'seed'),
  ('Home', 'Condo',            '公寓保险',        'Condo',            3, 'seed'),
  ('Home', 'Landlord',         '房东保险',        'Landlord',         4, 'seed'),
  -- Commercial（4）
  ('Commercial', 'General Liability',   '综合责任险', 'General Liability',   1, 'seed'),
  ('Commercial', 'Commercial Property', '商业财产险', 'Commercial Property', 2, 'seed'),
  ('Commercial', 'Workers Comp',        '工伤保险',   'Workers Comp',        3, 'seed'),
  ('Commercial', 'BOP',                 '商主保单',   'BOP',                 4, 'seed'),
  -- Cyber（3）
  ('Cyber', 'Cyber Liability',  '网络责任险',      'Cyber Liability',  1, 'seed'),
  ('Cyber', 'Data Breach',      '数据泄露险',      'Data Breach',      2, 'seed'),
  ('Cyber', 'Network Security', '网络安全险',      'Network Security', 3, 'seed'),
  -- Life（3）
  ('Life', 'Term Life',        '定期寿险',        'Term Life',        1, 'seed'),
  ('Life', 'Whole Life',       '终身寿险',        'Whole Life',       2, 'seed'),
  ('Life', 'Universal Life',   '万能寿险',        'Universal Life',   3, 'seed'),
  -- Travel（3）
  ('Travel', 'Single Trip',        '单程旅行险',     'Single Trip',        1, 'seed'),
  ('Travel', 'Annual Multi-Trip',  '年度多次旅行险', 'Annual Multi-Trip',  2, 'seed'),
  ('Travel', 'Business Travel',    '商务旅行险',     'Business Travel',    3, 'seed'),
  -- Professional（3）
  ('Professional', 'Professional Liability',   '职业责任险',       'Professional Liability',   1, 'seed'),
  ('Professional', 'Medical Malpractice',      '医疗事故险',       'Medical Malpractice',      2, 'seed'),
  ('Professional', 'Architects & Engineers',   '设计师与工程师险', 'Architects & Engineers',   3, 'seed'),
  -- D&O（3）
  ('D&O', 'Directors & Officers', '董事与高管责任险', 'Directors & Officers', 1, 'seed'),
  ('D&O', 'Employment Practices', '雇佣行为责任险',   'Employment Practices', 2, 'seed'),
  ('D&O', 'Fiduciary Liability',  '信托责任险',       'Fiduciary Liability',  3, 'seed'),
  -- E&O（3）
  ('E&O', 'Errors & Omissions', '错误与遗漏险',     'Errors & Omissions', 1, 'seed'),
  ('E&O', 'Technology E&O',     '科技错误与遗漏险', 'Technology E&O',     2, 'seed'),
  ('E&O', 'Media Liability',    '媒体责任险',       'Media Liability',    3, 'seed'),
  -- Marine（3）
  ('Marine', 'Inland Marine', '内陆运输险',      'Inland Marine', 1, 'seed'),
  ('Marine', 'Ocean Marine',  '海洋运输险',      'Ocean Marine',  2, 'seed'),
  ('Marine', 'Cargo',         '货物运输险',      'Cargo',         3, 'seed'),
  -- Specialty（4）
  ('Specialty', 'Event Insurance', '活动保险',     'Event Insurance', 1, 'seed'),
  ('Specialty', 'Pet Insurance',   '宠物保险',     'Pet Insurance',   2, 'seed'),
  ('Specialty', 'Warranty',        '延长保修险',   'Warranty',        3, 'seed'),
  ('Specialty', 'Surety',          '保证保险',     'Surety',          4, 'seed')
ON CONFLICT (line_code, code) DO NOTHING;

-- ─── 播种：9 承保范围（中文名对齐 i18n product.json detail.info.* 现网文案）──
INSERT INTO insurance_coverage (code, name_zh, name_en, sort_order, created_by) VALUES
  ('liability',         '责任险',       'Liability',            1, 'seed'),
  ('comprehensive',     '综合险',       'Comprehensive',        2, 'seed'),
  ('collision',         '碰撞险',       'Collision',            3, 'seed'),
  ('medical',           '医疗赔付',     'Medical Payments',     4, 'seed'),
  ('um',                '未保险驾驶员', 'Uninsured Motorist',   5, 'seed'),
  ('roadside',          '道路救援',     'Roadside Assistance',  6, 'seed'),
  ('substitute',        '车辆替代',     'Substitute Vehicle',   7, 'seed'),
  ('newCarValue',       '新车价值保障', 'New Car Value',        8, 'seed'),
  ('deductibleWaiver',  '自付额豁免',   'Deductible Waiver',    9, 'seed')
ON CONFLICT (code) DO NOTHING;

-- ─── 播种：关联 99 行（11 业务线 × 9 承保范围，保持现网「全适用」行为）──────
INSERT INTO line_coverage_rel (line_code, coverage_code, created_by)
SELECT l.code, c.code, 'seed'
  FROM insurance_line l
  CROSS JOIN insurance_coverage c
 WHERE l.deleted = FALSE AND c.deleted = FALSE
ON CONFLICT (line_code, coverage_code) DO NOTHING;

-- ─── 权限点：dict:read / dict:manage（授予超级管理员 / 运营管理员）──────────
-- 说明：ovwr_auth_permission 属权限注册表（ovwr 管理库），部分环境（如本地
-- overinsur_db 单库）无该表 → 条件执行；真正生效的鉴权数据是 auth_role.permission_keys。
DO $$
BEGIN
  IF to_regclass('public.ovwr_auth_permission') IS NOT NULL THEN
    INSERT INTO ovwr_auth_permission (
        ovwr_permission_id,
        ovwr_permission_code,
        ovwr_permission_name,
        ovwr_module,
        ovwr_action,
        ovwr_resource_type,
        ovwr_description
    ) VALUES
      ('ovwr-perm-dict-1018-001', 'dict:read',   '查看险种字典', 'dictionary', 'read',   'page',   'V1.0.18 查看险种字典与联动树'),
      ('ovwr-perm-dict-1018-002', 'dict:manage', '维护险种字典', 'dictionary', 'update', 'button', 'V1.0.18 险种字典增删改、启停与适用范围维护')
    ON CONFLICT (ovwr_permission_id) DO NOTHING;
  END IF;
END $$;

-- 角色授权（幂等：jsonb 去重聚合，重复执行结果不变）
UPDATE auth_role
   SET permission_keys = (
         SELECT COALESCE(jsonb_agg(DISTINCT k ORDER BY k), '[]'::jsonb)
           FROM jsonb_array_elements(permission_keys || '["dict:read","dict:manage"]'::jsonb) t(k)
       )
 WHERE role_key IN ('super_admin', 'ops_manager');

-- ─── 播种数核对（手工执行验证用）：11 / 36 / 9 / 99 ─────────────────────────
-- SELECT (SELECT count(*) FROM insurance_line)      AS lines,
--        (SELECT count(*) FROM insurance_sub_line)  AS sub_lines,
--        (SELECT count(*) FROM insurance_coverage)  AS coverages,
--        (SELECT count(*) FROM line_coverage_rel)   AS rels;
