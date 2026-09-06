/**
 * OverInsur (ovwr) ai_saas Schema Definitions (User Preferences Domain)
 * 
 * IMPORTANT: All tables use 'ovwr_' prefix to distinguish from existing projects
 * Database: ai_saas within ai-saas-postgres container (port 5432)
 */

import { pgTable, varchar, timestamp, index, integer, text } from 'drizzle-orm/pg-core';

// ─── ovwr_user_preferences (用户个性化偏好设置表) ────────────────────────────────

export const ovwrUserPreferences = pgTable('ovwr_user_preferences', {
  ovwrPreferenceId: varchar('ovwr_preference_id', { length: 32 }).primaryKey(),
  ovwrUserId: varchar('ovwr_user_id', { length: 32 })
    .notNull()
    .references(() => ovwrAuthUser.ovwrUserId, { onDelete: 'cascade' }),
  ovwrLanguageCode: varchar('ovwr_language_code', { length: 8 })
    .notNull()
    .default('en-US'),  // en-US / zh-CN
  ovwrDateFormat: varchar('ovwr_date_format', { length: 16 })
    .notNull()
    .default('MM/DD/YYYY'),  // MM/DD/YYYY / YYYY-MM-DD / DD/MM/YYYY
  ovwrTimeZone: varchar('ovwr_time_zone', { length: 32 })
    .notNull()
    .default('America/New_York'),  // IANA timezone
  ovwrThemeMode: varchar('ovwr_theme_mode', { length: 16 })
    .notNull()
    .default('light'),  // light / dark
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueUserId: index('uk_ovwr_user_preferences_user_id').on(table.ovwrUserId),
  ovwrIdxLanguage: index('idx_ovwr_user_preferences_language').on(table.ovwrLanguageCode),
}));

// =====================================================
// Re-export auth_user for references
// =====================================================

/**
 * User Account Table - Core authentication entity (re-exported)
 */
export const ovwrAuthUser = pgTable('ovwr_auth_user', {
  ovwrUserId: varchar('ovwr_user_id', { length: 32 }).primaryKey(),
  ovwrUsername: varchar('ovwr_username', { length: 64 }).unique().notNull(),
  ovwrEmail: varchar('ovwr_email', { length: 128 }).unique().notNull(),
  ovwrPasswordHash: varchar('ovwr_password_hash', { length: 255 }).notNull(),
  ovwrFirstName: varchar('ovwr_first_name', { length: 64 }),
  ovwrLastName: varchar('ovwr_last_name', { length: 64 }),
  ovwrPhone: varchar('ovwr_phone', { length: 32 }),
  ovwrAvatarUrl: varchar('ovwr_avatar_url', { length: 255 }),
  ovwrStatus: varchar('ovwr_status', { length: 1 }).default('1'),
  ovwrFailedLoginAttempts: integer('ovwr_failed_login_attempts').default(0),
  ovwrLockedUntil: timestamp('ovwr_locked_until', { withTimezone: true }),
  ovwrEmailVerified: varchar('ovwr_email_verified', { length: 1 }).default('0'),
  ovwrPasswordChangedAt: timestamp('ovwr_password_changed_at', { withTimezone: true }),
  ovwrLastLoginAt: timestamp('ovwr_last_login_at', { withTimezone: true }),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
});
