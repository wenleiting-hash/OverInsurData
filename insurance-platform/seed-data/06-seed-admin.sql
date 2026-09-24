-- ============================================================
-- File: 06-seed-admin.sql
-- Purpose: Seed the initial super-admin role + admin user + role grant
-- Source: Provided by task spec (carrier_mgmt subsystem bootstrap)
-- Notes:
--   * Password: admin123 (bcrypt, 10 rounds)
--   * Hash:     $2b$10$ryUTfrcd256QFq71BhS57.aLYTheWxvgtTqB/81v.3JkLE0ibPXai
--   * Idempotent: uses ON CONFLICT DO NOTHING so re-running is safe
--   * Target: PostgreSQL 16
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create super-admin role
-- ------------------------------------------------------------
INSERT INTO auth_role (role_key, role_name_zh, role_name_en, role_code, subsystem_key, is_system, sort_order)
VALUES ('super_admin', '超级管理员', 'Super Admin', 'ADMIN', 'carrier_mgmt', TRUE, 0)
ON CONFLICT (role_key) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Create admin user
-- ------------------------------------------------------------
INSERT INTO auth_user (user_uuid, username, email, password_hash, name_zh, name_en, auth_method, status, created_by)
VALUES (
    gen_random_uuid()::varchar,
    'admin',
    'admin@overinsur.com',
    '$2b$10$ryUTfrcd256QFq71BhS57.aLYTheWxvgtTqB/81v.3JkLE0ibPXai',
    '系统管理员',
    'System Admin',
    'local',
    'active',
    'system'
)
ON CONFLICT (username) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Link admin user to super_admin role
-- ------------------------------------------------------------
INSERT INTO auth_user_role (user_id, role_id, assigned_by)
SELECT u.id, r.role_id, 'system'
FROM auth_user u, auth_role r
WHERE u.username = 'admin' AND r.role_key = 'super_admin'
ON CONFLICT DO NOTHING;
