-- 用户偏好设置表（语言、日期格式、时区、主题）
-- 来源: packages/domain-models/src/schema/user-preferences-ovwr.ts
-- 注意: 不加外键约束到 ovwr_auth_user（该表不存在，实际用户在 auth_user 表）
-- ovwr_user_id 存储的是 auth_user.user_uuid

CREATE TABLE IF NOT EXISTS ovwr_user_preferences (
  ovwr_preference_id VARCHAR(32) PRIMARY KEY,
  ovwr_user_id VARCHAR(32) NOT NULL,
  ovwr_language_code VARCHAR(8) NOT NULL DEFAULT 'en-US',
  ovwr_date_format VARCHAR(16) NOT NULL DEFAULT 'MM/DD/YYYY',
  ovwr_time_zone VARCHAR(32) NOT NULL DEFAULT 'America/New_York',
  ovwr_theme_mode VARCHAR(16) NOT NULL DEFAULT 'light',
  ovwr_created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ovwr_updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS uk_ovwr_user_preferences_user_id ON ovwr_user_preferences(ovwr_user_id);
CREATE INDEX IF NOT EXISTS idx_ovwr_user_preferences_language ON ovwr_user_preferences(ovwr_language_code);
