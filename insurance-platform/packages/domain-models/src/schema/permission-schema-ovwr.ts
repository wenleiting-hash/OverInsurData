/**
 * OverInsur (ovwr) auth_db Schema Definitions (Permission Management Domain)
 * 
 * IMPORTANT: All tables use 'ovwr_' prefix to distinguish from existing projects
 * Database: auth_db within ai-saas-postgres container (port 5432)
 */

import { pgTable, varchar, timestamp, index, jsonb, integer, text } from 'drizzle-orm/pg-core';

// ─── ovwr_auth_permission (功能权限点表) ────────────────────────────────────

export const ovwrAuthPermission = pgTable('ovwr_auth_permission', {
  ovwrPermissionId: varchar('ovwr_permission_id', { length: 32 }).primaryKey(),
  ovwrPermissionCode: varchar('ovwr_permission_code', { length: 64 }).unique().notNull(),
  ovwrPermissionName: varchar('ovwr_permission_name', { length: 128 }).notNull(),
  ovwrModule: varchar('ovwr_module', { length: 32 }).notNull(),
  ovwrAction: varchar('ovwr_action', {
    enum: ['create', 'read', 'update', 'delete', 'import', 'export', 'approve', 'audit'],
  }).notNull(),
  ovwrResourceType: varchar('ovwr_resource_type', {
    enum: ['page', 'api', 'menu', 'button', 'data'],
  }),
  ovwrParentPermissionId: varchar('ovwr_parent_permission_id', { length: 32 }),
  ovwrSortOrder: integer('ovwr_sort_order').default(0),
  ovwrIcon: varchar('ovwr_icon', { length: 64 }),
  ovwrDescription: text('ovwr_description'),
  ovwrStatus: varchar('ovwr_status', { length: 1 }).default('1'),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueCode: index('ovwr_idx_permission_code').on(table.ovwrPermissionCode),
  ovwrIdxModule: index('ovwr_idx_module').on(table.ovwrModule),
  ovwrParentIdx: index('ovwr_idx_parent_permission').on(table.ovwrParentPermissionId),
}));

// ─── ovwr_auth_user_role (用户角色关联表) ──────────────────────────────────

export const ovwrAuthUserRole = pgTable('ovwr_auth_user_role', {
  ovwrRoleId: varchar('ovwr_role_id', { length: 32 }).primaryKey(),
  ovwrUserId: varchar('ovwr_user_id', { length: 32 }).notNull(), // Reference to auth_user table
  ovwrSourceType: varchar('ovwr_source_type', {
    enum: ['DIRECT_ASSIGN', 'INHERITED', 'TEMPLATE_APPLIED'],
  }),
  ovwrAppliedTemplateId: varchar('ovwr_applied_template_id', { length: 32 }),
  ovwrGrantedBy: varchar('ovwr_granted_by', { length: 32 }),
  ovwrGrantedAt: timestamp('ovwr_granted_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrExpiresAt: timestamp('ovwr_expires_at', { withTimezone: true }),
  ovwrStatus: varchar('ovwr_status', {
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
  }).default('ACTIVE'),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueUserRole: index('ovwr_idx_user_role').on(table.ovwrUserId, table.ovwrRoleId),
  ovwrIdxUserId: index('ovwr_idx_user_id').on(table.ovwrUserId),
}));

// ─── ovwr_auth_role_permission (角色权限关联表) ─────────────────────────────

export const ovwrAuthRolePermission = pgTable('ovwr_auth_role_permission', {
  ovwrRoleId: varchar('ovwr_role_id', { length: 32 })
    .notNull()
    .references(() => ovwrAuthUserRole.ovwrRoleId),
  ovwrPermissionId: varchar('ovwr_permission_id', { length: 32 })
    .notNull()
    .references(() => ovwrAuthPermission.ovwrPermissionId),
  ovwrInheritedFrom: varchar('ovwr_inherited_from', { length: 32 }),
  ovwrSourceType: varchar('ovwr_source_type', {
    enum: ['DIRECT_ASSIGN', 'TEMPLATE_APPLIED', 'ROLE_INHERITANCE'],
  }),
  ovwrGrantedAt: timestamp('ovwr_granted_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrUniqueMapping: index('ovwr_idx_role_perm').on(table.ovwrRoleId, table.ovwrPermissionId),
  ovwrIdxPermission: index('ovwr_idx_permission').on(table.ovwrPermissionId),
}));

// ─── ovwr_auth_permission_template (权限模板表) ─────────────────────────────

export const ovwrAuthPermissionTemplate = pgTable('ovwr_auth_permission_template', {
  ovwrTemplateId: varchar('ovwr_template_id', { length: 32 }).primaryKey(),
  ovwrTemplateName: varchar('ovwr_template_name', { length: 128 }).notNull(),
  ovwrVersion: varchar('ovwr_version', { length: 16 }).notNull(),
  ovwrDescription: text('ovwr_description'),
  ovwrFormat: varchar('ovwr_format', { length: 8 }).notNull(),
  ovwrRoleCount: integer('ovwr_role_count').default(0),
  ovwrPermissionCount: integer('ovwr_permission_count').default(0),
  ovwrCreatedBy: varchar('ovwr_created_by', { length: 32 }),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrLastUsedAt: timestamp('ovwr_last_used_at', { withTimezone: true }),
  ovwrUsageCount: integer('ovwr_usage_count').default(0),
  ovwrMetadata: jsonb('ovwr_metadata').$type<{
    applicable_scenarios?: string[];
    applicable_modules?: string[];
    compatibility?: {
      minBackendVersion?: string;
      maxBackendVersion?: string;
    };
    tags?: string[];
  }>(),
}, (table) => ({
  ovwrUniqueVersion: index('ovwr_idx_template_name_version').on(table.ovwrTemplateName, table.ovwrVersion),
  ovwrIdxUsageCount: index('ovwr_idx_usage_count').on(table.ovwrUsageCount),
}));

// ─── ovwr_auth_operation_log (操作审计日志表) ───────────────────────────────

export const ovwrAuthOperationLog = pgTable('ovwr_auth_operation_log', {
  ovwrLogId: varchar('ovwr_log_id', { length: 32 }).primaryKey(),
  ovwrUserId: varchar('ovwr_user_id', { length: 32 }),
  ovwrUsername: varchar('ovwr_username', { length: 64 }),
  ovwrAction: varchar('ovwr_action', { length: 128 }).notNull(),
  ovwrModule: varchar('ovwr_module', { length: 32 }),
  ovwrPermissionCode: varchar('ovwr_permission_code', { length: 64 }),
  ovwrIp: varchar('ovwr_ip', { length: 64 }),
  ovwrUserAgent: text('ovwr_user_agent'),
  ovwrRequestId: varchar('ovwr_request_id', { length: 64 }),
  ovwrDuration: integer('ovwr_duration'),
  ovwrStatus: varchar('ovwr_status', { length: 1 }),
  ovwrErrorMessage: text('ovwr_error_message'),
  ovwrExtraData: jsonb('ovwr_extra_data').$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
    requestBody?: Record<string, any>;
    queryParams?: Record<string, any>;
  }>(),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrIdxCreatedAt: index('ovwr_idx_created_at').on(table.ovwrCreatedAt),
  ovwrIdxUserId: index('ovwr_idx_user_id').on(table.ovwrUserId),
  ovwrIdxAction: index('ovwr_idx_action').on(table.ovwrAction),
  ovwrIdxModule: index('ovwr_idx_module').on(table.ovwrModule),
}));

// =====================================================
// Auth User Schema
// =====================================================

/**
 * User Account Table - Core authentication entity
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
  ovwrMetadata: jsonb('ovwr_metadata'),
});

/**
 * Refresh Token Table - JWT token rotation support
 */
export const ovwrAuthRefreshToken = pgTable('ovwr_auth_refresh_token', {
  ovwrRefreshTokenId: varchar('ovwr_refresh_token_id', { length: 32 }).primaryKey(),
  ovwrUserId: varchar('ovwr_user_id', { length: 32 }).notNull(),
  ovwrTokenHash: varchar('ovwr_token_hash', { length: 255 }).notNull(),
  ovwrExpiresAt: timestamp('ovwr_expires_at', { withTimezone: true }).notNull(),
  ovwrIssuedAt: timestamp('ovwr_issued_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrIpAddress: varchar('ovwr_ip_address', { length: 45 }),
  ovwrUserAgent: varchar('ovwr_user_agent', { length: 255 }),
  ovwrIsRevoked: varchar('ovwr_is_revoked', { length: 1 }).default('0'),
  ovwrCreatedAt: timestamp('ovwr_created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('ovwr_updated_at', { withTimezone: true }).defaultNow().notNull(),
});
