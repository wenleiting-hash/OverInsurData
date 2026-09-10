-- =====================================================
-- Department Management Extension
-- Adds new columns for Figma V1.5 prototype alignment
-- Re-seeds with 12 departments in 3-level hierarchy
-- =====================================================

-- ─── Phase 1.1: ALTER TABLE (add 8 columns) ──────────────────────

ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS color VARCHAR(16) DEFAULT '#2563EB';
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS manager_name VARCHAR(100);
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS manager_title VARCHAR(100);
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS manager_email VARCHAR(100);
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(50);
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS office_location VARCHAR(200);
ALTER TABLE auth_department ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- ─── Phase 1.2: Re-seed department data (12 × 3 levels) ────────

-- Clean slate: remove all old data (already handled by pre-migration cleanup)
-- Level 0: Root
INSERT INTO auth_department (dept_code, dept_name_zh, dept_name_en, parent_dept_id, dept_level, path, color, description, manager_name, manager_title, manager_email, manager_phone, office_location, sort_order)
VALUES ('HQ', '总公司', 'Headquarters', NULL, 0, '/HQ', '#1E40AF', '公司总部，统筹全局战略与资源配置。', 'David Wang', 'CEO', 'd.wang@insure-os.com', '+1-415-000-0001', 'San Francisco, CA', 1);

-- Level 1: 6 departments under HQ
INSERT INTO auth_department (dept_code, dept_name_zh, dept_name_en, parent_dept_id, dept_level, path, color, description, manager_name, manager_title, manager_email, manager_phone, office_location, sort_order)
VALUES
  ('TECH', '技术部', 'Engineering',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/TECH', '#7C3AED', '负责平台研发、系统架构与技术基础设施。', '陈志远', 'CTO', 'chen.zhiyuan@insure-os.com', '+1-415-000-0002', 'San Francisco, CA', 1),
  ('OPS', '运营部', 'Operations',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/OPS', '#059669', '负责日常运营流程优化与客户服务。', 'Lisa Park', 'VP Operations', 'l.park@insure-os.com', '+1-415-000-0003', 'New York, NY', 2),
  ('FIN', '财务部', 'Finance',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/FIN', '#D97706', '负责财务管理、预算编制与合规审计。', 'Kevin Liu', 'CFO', 'k.liu@insure-os.com', '+1-415-000-0004', 'New York, NY', 3),
  ('CHANNEL', '渠道部', 'Channel',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/CHANNEL', '#0891B2', '负责渠道伙伴管理、拓展与培训。', 'Michael Chen', 'VP Channel', 'm.chen@insure-os.com', '+1-415-000-0005', 'Seattle, WA', 4),
  ('COMPLIANCE', '合规部', 'Compliance',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/COMPLIANCE', '#DC2626', '负责法律法规合规、风控与内部审计。', 'Emily Zhang', 'VP Compliance', 'e.zhang@insure-os.com', '+1-415-000-0006', 'Washington, DC', 5),
  ('MARKET', '市场部', 'Marketing',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'HQ' AND deleted = FALSE),
    1, '/HQ/MARKET', '#E11D48', '负责品牌推广、市场拓展与公关传播。', 'Rachel Kim', 'VP Marketing', 'r.kim@insure-os.com', '+1-415-000-0007', 'Los Angeles, CA', 6);

-- Level 2: Sub-departments under TECH (3)
INSERT INTO auth_department (dept_code, dept_name_zh, dept_name_en, parent_dept_id, dept_level, path, color, description, manager_name, manager_title, manager_email, manager_phone, office_location, sort_order)
VALUES
  ('TECH_FE', '前端研发组', 'Frontend',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'TECH' AND deleted = FALSE),
    2, '/HQ/TECH/TECH_FE', '#7C3AED', '负责 Web/移动端前端研发。', 'Alex Turner', 'Frontend Lead', 'a.turner@insure-os.com', '+1-415-000-0010', 'San Francisco, CA', 1),
  ('TECH_BE', '后端研发组', 'Backend',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'TECH' AND deleted = FALSE),
    2, '/HQ/TECH/TECH_BE', '#7C3AED', '负责后端服务架构与 API 开发。', 'James Wong', 'Backend Lead', 'j.wong@insure-os.com', '+1-415-000-0011', 'San Francisco, CA', 2),
  ('TECH_OPS', '运维与安全组', 'DevOps & Security',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'TECH' AND deleted = FALSE),
    2, '/HQ/TECH/TECH_OPS', '#7C3AED', '负责 CI/CD、基础设施与信息安全。', 'Chris Lee', 'DevOps Lead', 'c.lee@insure-os.com', '+1-415-000-0012', 'San Francisco, CA', 3);

-- Level 2: Sub-departments under CHANNEL (2)
INSERT INTO auth_department (dept_code, dept_name_zh, dept_name_en, parent_dept_id, dept_level, path, color, description, manager_name, manager_title, manager_email, manager_phone, office_location, sort_order)
VALUES
  ('CH_EXP', '渠道拓展组', 'Channel Expansion',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'CHANNEL' AND deleted = FALSE),
    2, '/HQ/CHANNEL/CH_EXP', '#0891B2', '负责新渠道伙伴拓展与合作谈判。', 'Sarah Thompson', 'Expansion Lead', 's.thompson@insure-os.com', '+1-415-000-0020', 'Seattle, WA', 1),
  ('CH_TRN', '渠道培训组', 'Channel Training',
    (SELECT dept_id FROM auth_department WHERE dept_code = 'CHANNEL' AND deleted = FALSE),
    2, '/HQ/CHANNEL/CH_TRN', '#0891B2', '负责渠道伙伴培训与认证管理。', 'Nancy Liu', 'Training Lead', 'n.liu@insure-os.com', '+1-415-000-0021', 'Seattle, WA', 2);

-- ─── Verify ────────────────────────────────────────────────────
SELECT 'auth_department (new): ' || COUNT(*) FROM auth_department WHERE deleted = FALSE;
SELECT '  Level 0: ' || COUNT(*) FROM auth_department WHERE deleted = FALSE AND dept_level = 0;
SELECT '  Level 1: ' || COUNT(*) FROM auth_department WHERE deleted = FALSE AND dept_level = 1;
SELECT '  Level 2: ' || COUNT(*) FROM auth_department WHERE deleted = FALSE AND dept_level = 2;
