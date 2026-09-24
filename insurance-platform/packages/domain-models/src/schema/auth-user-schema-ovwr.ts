/**
 * OverInsur (ovwr) auth_db Schema Definitions - User Management Domain V5
 *
 * AUTHORITY: This is the SINGLE source of truth for user/role/department tables.
 * All SQL in auth.service.ts and user.service.ts must use columns defined here.
 *
 * Database: ai_saas (public schema, port 5432)
 *
 * Tables:
 * - ovwrAuthDepartment  (auth_department)
 * - ovwrAuthRole        (auth_role)
 * - ovwrAuthUser        (auth_user)
 * - ovwrAuthUserRole    (auth_user_role)
 * - ovwrAuthRefreshToken (auth_refresh_token)
 *
 * KEY DESIGN DECISIONS:
 * - Integer SERIAL PK (`id`) for Drizzle ORM compatibility
 * - `user_uuid` VARCHAR(36) as the business identifier (used in JWT, API, FK)
 * - `name_zh` / `name_en` replace legacy `name` / `real_name` columns
 * - `status` uses varchar values: active / inactive / locked / pending
 * - `deleted` boolean for soft-delete pattern
 */

import { pgTable, varchar, timestamp, index, integer, boolean, text, jsonb } from 'drizzle-orm/pg-core';

// ─── auth_department (部门表) ────────────────────────────────────────

export const ovwrAuthDepartment = pgTable('auth_department', {
  ovwrDeptId: integer('dept_id').primaryKey(),
  ovwrDeptCode: varchar('dept_code', { length: 32 }).unique().notNull(),
  ovwrDeptNameZh: varchar('dept_name_zh', { length: 100 }).notNull(),
  ovwrDeptNameEn: varchar('dept_name_en', { length: 100 }),
  ovwrParentDeptId: integer('parent_dept_id'),
  ovwrDeptLevel: integer('dept_level').notNull().default(1),
  ovwrPath: varchar('path', { length: 255 }),
  ovwrColor: varchar('color', { length: 16 }).default('#2563EB'),
  ovwrDescription: text('description'),
  ovwrManagerName: varchar('manager_name', { length: 100 }),
  ovwrManagerTitle: varchar('manager_title', { length: 100 }),
  ovwrManagerEmail: varchar('manager_email', { length: 100 }),
  ovwrManagerPhone: varchar('manager_phone', { length: 50 }),
  ovwrOfficeLocation: varchar('office_location', { length: 200 }),
  ovwrSortOrder: integer('sort_order').notNull().default(0),
  ovwrStatus: boolean('status').notNull().default(true),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  ovwrIdxDeptCode: index('idx_auth_department_code').on(table.ovwrDeptCode),
  ovwrIdxParentDept: index('idx_auth_department_parent').on(table.ovwrParentDeptId),
}));

// ─── auth_role (角色表) ───────────────────────────────────────────

export const ovwrAuthRole = pgTable('auth_role', {
  ovwrRoleId: integer('role_id').primaryKey(),
  ovwrRoleKey: varchar('role_key', { length: 64 }).unique().notNull(),
  ovwrRoleNameZh: varchar('role_name_zh', { length: 100 }).notNull(),
  ovwrRoleNameEn: varchar('role_name_en', { length: 100 }),
  ovwrRoleCode: varchar('role_code', { length: 64 }).notNull(),
  ovwrDescription: text('description'),
  ovwrPermissionKeys: jsonb('permission_keys').$type<string[]>().default([]),
  // V1.0.16 T1：所属子系统，区分 carrier_mgmt / channel_mgmt
  ovwrSubsystemKey: varchar('subsystem_key', { length: 32 }).notNull().default('carrier_mgmt'),
  ovwrIsSystem: boolean('is_system').notNull().default(false),
  ovwrSortOrder: integer('sort_order').notNull().default(0),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  ovwrIdxRoleKey: index('idx_auth_role_key').on(table.ovwrRoleKey),
  ovwrIdxSortOrder: index('idx_auth_role_sort').on(table.ovwrSortOrder),
  ovwrIdxSubsystem: index('idx_auth_role_subsystem').on(table.ovwrSubsystemKey),
}));

// ─── auth_user (用户账户表 - 权威定义) ──────────────────────────────────

export const ovwrAuthUser = pgTable('auth_user', {
  // Primary keys
  ovwrId: integer('id').primaryKey(),                              // SERIAL PK for ORM
  ovwrUserUuid: varchar('user_uuid', { length: 36 }).unique().notNull(), // Business identifier

  // Identity
  ovwrUsername: varchar('username', { length: 64 }).unique().notNull(),
  ovwrEmail: varchar('email', { length: 255 }).unique().notNull(),
  // SSO 账号无密码哈希，允许 NULL（V1.0.16 T1）
  ovwrPasswordHash: varchar('password_hash', { length: 255 }),
  ovwrNameZh: varchar('name_zh', { length: 100 }),                // 中文名
  ovwrNameEn: varchar('name_en', { length: 100 }),                // English name
  ovwrPhone: varchar('phone', { length: 20 }),
  ovwrAvatarUrl: varchar('avatar_url', { length: 512 }),

  // Department
  ovwrDeptId: integer('dept_id')
    .references(() => ovwrAuthDepartment.ovwrDeptId, { onDelete: 'set null' }),
  ovwrDeptCode: varchar('dept_code', { length: 32 }),

  // Authentication
  ovwrAuthMethod: varchar('auth_method', { length: 16 }).notNull().default('local'),
  ovwrSsoProvider: varchar('sso_provider', { length: 32 }),
  ovwrLdapDn: varchar('ldap_dn', { length: 255 }),
  // V1.0.16 T1：workOS 工号，SSO 用户匹配键，仅 sso_provider=workos 账号有值
  ovwrExternalId: varchar('external_id', { length: 64 }),

  // Status & MFA
  ovwrStatus: varchar('status', { length: 16 }).notNull().default('active'),
  ovwrMfaEnabled: boolean('mfa_enabled').notNull().default(false),
  ovwrMfaSecret: varchar('mfa_secret', { length: 255 }),

  // Login tracking
  ovwrLastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ovwrLastLoginIp: varchar('last_login_ip', { length: 45 }),
  ovwrLoginCount: integer('login_count').notNull().default(0),

  // Account lockout
  ovwrFailedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  ovwrLockedUntil: timestamp('locked_until', { withTimezone: true }),

  // Audit
  ovwrCreatedBy: varchar('created_by', { length: 64 }),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedBy: varchar('updated_by', { length: 64 }),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
  ovwrRemark: text('remark'),
}, (table) => ({
  ovwrIdxUsername: index('idx_auth_user_username').on(table.ovwrUsername),
  ovwrIdxEmail: index('idx_auth_user_email').on(table.ovwrEmail),
  ovwrIdxUserUuid: index('idx_auth_user_uuid').on(table.ovwrUserUuid),
  ovwrIdxDept: index('idx_auth_user_dept').on(table.ovwrDeptId),
  ovwrIdxStatus: index('idx_auth_user_status').on(table.ovwrStatus),
  ovwrIdxExternalId: index('idx_auth_user_external_id').on(table.ovwrExternalId),
}));

// ─── auth_user_role (用户角色关联表) ───────────────────────────────

export const ovwrAuthUserRole = pgTable('auth_user_role', {
  ovwrUserId: integer('user_id')
    .notNull()
    .references(() => ovwrAuthUser.ovwrId, { onDelete: 'cascade' }),
  ovwrRoleId: integer('role_id')
    .notNull()
    .references(() => ovwrAuthRole.ovwrRoleId, { onDelete: 'cascade' }),
  ovwrAssignedBy: varchar('assigned_by', { length: 64 }),
  ovwrAssignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrCompositePk: index('pk_auth_user_role').on(table.ovwrUserId, table.ovwrRoleId),
  ovwrIdxUserId: index('idx_auth_user_role_user').on(table.ovwrUserId),
  ovwrIdxRoleId: index('idx_auth_user_role_role').on(table.ovwrRoleId),
}));

// ─── auth_refresh_token (刷新令牌表) ─────────────────────────────────

export const ovwrAuthRefreshToken = pgTable('auth_refresh_token', {
  ovwrRefreshTokenId: integer('id').primaryKey(),
  ovwrUserUuid: varchar('user_uuid', { length: 36 }).notNull(),
  ovwrTokenHash: varchar('token_hash', { length: 255 }).notNull(),
  ovwrExpiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ovwrIssuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrIpAddress: varchar('ip_address', { length: 45 }),
  ovwrUserAgent: varchar('user_agent', { length: 255 }),
  ovwrIsRevoked: boolean('is_revoked').default(false),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  ovwrIdxUserUuid: index('idx_auth_refresh_token_user').on(table.ovwrUserUuid),
  ovwrIdxTokenHash: index('idx_auth_refresh_token_hash').on(table.ovwrTokenHash),
  ovwrIdxExpires: index('idx_auth_refresh_token_expires').on(table.ovwrExpiresAt),
}));

// =====================================================
// Type Exports
// =====================================================

export type AuthDepartment = typeof ovwrAuthDepartment.$inferSelect;
export type NewAuthDepartment = typeof ovwrAuthDepartment.$inferInsert;

export type AuthRole = typeof ovwrAuthRole.$inferSelect;
export type NewAuthRole = typeof ovwrAuthRole.$inferInsert;

export type AuthUser = typeof ovwrAuthUser.$inferSelect;
export type NewAuthUser = typeof ovwrAuthUser.$inferInsert;

export type AuthUserRole = typeof ovwrAuthUserRole.$inferSelect;
export type NewAuthUserRole = typeof ovwrAuthUserRole.$inferInsert;

export type AuthRefreshToken = typeof ovwrAuthRefreshToken.$inferSelect;
export type NewAuthRefreshToken = typeof ovwrAuthRefreshToken.$inferInsert;

