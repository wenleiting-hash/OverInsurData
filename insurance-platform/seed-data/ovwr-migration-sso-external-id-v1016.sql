-- =============================================================================
-- V1.0.16 系统集成：auth_user 扩展 external_id + SSO 策略 + auth_role 加 subsystem_key
-- 幂等迁移：DO $$ 块判列/索引存在，重复执行无副作用
-- 关联：版本迭代/V1.0.16-系统集成-20260918.md §11.1 T1
-- =============================================================================

-- ─── 1. auth_user 扩展 external_id（workOS 工号，SSO 匹配键） ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_user' AND column_name = 'external_id'
  ) THEN
    ALTER TABLE auth_user ADD COLUMN external_id VARCHAR(64);
  END IF;
END $$;

-- 部分唯一索引：仅未软删且非空的 external_id 唯一
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_auth_user_external_id'
  ) THEN
    CREATE UNIQUE INDEX idx_auth_user_external_id
      ON auth_user(external_id) WHERE deleted = FALSE AND external_id IS NOT NULL;
  END IF;
END $$;

-- password_hash 放宽为可空（SSO 账号无密码哈希）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_user' AND column_name = 'password_hash'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE auth_user ALTER COLUMN password_hash DROP NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN auth_user.external_id IS 'workOS 工号，SSO 用户匹配键，仅 sso_provider=workos 账号有值';
COMMENT ON COLUMN auth_user.password_hash IS '本地账号密码哈希；SSO 账号无密码，允许 NULL';

-- ─── 2. auth_role 加 subsystem_key（区分 carrier_mgmt / channel_mgmt） ──────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auth_role' AND column_name = 'subsystem_key'
  ) THEN
    ALTER TABLE auth_role
      ADD COLUMN subsystem_key VARCHAR(32) NOT NULL DEFAULT 'carrier_mgmt';
  END IF;
END $$;

-- 回填：channel_* 前缀角色归入 channel_mgmt，其余保持 carrier_mgmt
-- 用正则避免 LIKE 下划线转义歧义
UPDATE auth_role
  SET subsystem_key = 'channel_mgmt'
  WHERE role_key ~ '^channel_'
    AND subsystem_key = 'carrier_mgmt'
    AND deleted = FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_auth_role_subsystem'
  ) THEN
    CREATE INDEX idx_auth_role_subsystem ON auth_role(subsystem_key);
  END IF;
END $$;

COMMENT ON COLUMN auth_role.subsystem_key IS '所属子系统：carrier_mgmt / channel_mgmt，用于 I1 目录分组与 I2 角色校验';

-- =============================================================================
-- 回滚脚本（执行前请确认无 SSO 账号依赖）
-- =============================================================================
-- DROP INDEX IF EXISTS idx_auth_role_subsystem;
-- ALTER TABLE auth_role DROP COLUMN IF EXISTS subsystem_key;
-- ALTER TABLE auth_user ALTER COLUMN password_hash SET NOT NULL;
-- DROP INDEX IF EXISTS idx_auth_user_external_id;
-- ALTER TABLE auth_user DROP COLUMN IF EXISTS external_id;
-- =============================================================================
