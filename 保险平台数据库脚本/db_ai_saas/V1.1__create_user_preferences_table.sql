-- 数据库：ai_saas
-- 功能点：用户个性化偏好设置（语言、时区、日期格式等）
-- 作者/日期：2026-09-05
-- 说明：支持用户级别的语言切换和个性化配置

CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id VARCHAR(32) PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES ovwr_auth_user(ovwr_user_id) ON DELETE CASCADE,
  language_code VARCHAR(8) NOT NULL DEFAULT 'en-US',  -- en-US / zh-CN
  date_format VARCHAR(16) NOT NULL DEFAULT 'MM/DD/YYYY',  -- MM/DD/YYYY / YYYY-MM-DD / DD/MM/YYYY
  time_zone VARCHAR(32) NOT NULL DEFAULT 'America/New_York',  -- IANA timezone
  theme_mode VARCHAR(16) NOT NULL DEFAULT 'light',  -- light / dark
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 唯一约束防止重复记录
ALTER TABLE user_preferences ADD CONSTRAINT uk_user_id UNIQUE (user_id);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_preferences_language ON user_preferences(language_code);

-- 添加注释说明
COMMENT ON TABLE user_preferences IS '用户个性化偏好设置表';
COMMENT ON COLUMN user_preferences.preference_id IS '偏好 ID（UUID 格式）';
COMMENT ON COLUMN user_preferences.user_id IS '关联用户 ID';
COMMENT ON COLUMN user_preferences.language_code IS '首选语言代码';
COMMENT ON COLUMN user_preferences.date_format IS '日期显示格式';
COMMENT ON COLUMN user_preferences.time_zone IS '时区设置（IANA 标准）';
COMMENT ON COLUMN user_preferences.theme_mode IS '主题模式（亮色/暗色）';
