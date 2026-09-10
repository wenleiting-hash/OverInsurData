-- V1.1.1 Create user preferences table
-- Required by: carrier-service PreferencesModule (GET/PUT /api/users/preferences/current)
-- Created: 2026-09-08

CREATE TABLE IF NOT EXISTS ovwr_user_preferences (
  ovwr_preference_id VARCHAR(32) PRIMARY KEY,
  ovwr_user_id       VARCHAR(36) NOT NULL,
  ovwr_language_code VARCHAR(10) NOT NULL DEFAULT 'en-US',
  ovwr_date_format   VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
  ovwr_time_zone     VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  ovwr_theme_mode    VARCHAR(10) NOT NULL DEFAULT 'light',
  ovwr_updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_ovwr_user_preferences_user_id UNIQUE (ovwr_user_id)
);
