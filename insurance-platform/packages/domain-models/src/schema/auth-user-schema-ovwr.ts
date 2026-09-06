/**
 * OverInsur (ovwr) auth_db Schema Definitions - User Management Domain V4
 * 
 * CRITICAL: Matching EXISTING database structure in ai-saas-postgres-dev container
 * Database: ai_saas within auth schema (port 5432)
 * 
 * This file contains DRIZZLE ORM definitions for user management tables:
 * - ovwrAuthDepartment (departments with hierarchical tree structure)
 * - ovwrAuthRole (RBAC roles with JSONB permissions)  
 * - ovwrAuthUser (user accounts with dept and password info)
 * - ovwrAuthUserRole (many-to-many mapping)
 * 
 * KEY DIFFERENCES FROM PREVIOUS VERSIONS:
 * - Table names use actual DB names (auth_user, auth_role, etc.) without 'ovwr_' prefix
 * - Column names match DB exactly (id, username, email, etc.)
 * - Primary key uses integer (SERIAL in DB, no .serial() in Drizzle v0.29)
 * - Index names match existing DB indexes (idx_auth_user_*, not ovwr_idx_*)
 */

import { pgTable, varchar, timestamp, index, integer, boolean, text, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// ─── ovwr_auth_department (部门表) ──────────────────────────────

export const ovwrAuthDepartment = pgTable('auth_department', {
  ovwrDeptId: integer('dept_id').primaryKey(), // SERIAL in DB
  ovwrDeptCode: varchar('dept_code', { length: 32 }).unique().notNull(),
  ovwrDeptNameZh: varchar('dept_name_zh', { length: 100 }).notNull(),
  ovwrDeptNameEn: varchar('dept_name_en', { length: 100 }),
  ovwrParentDeptId: integer('parent_dept_id'),
  ovwrDeptLevel: integer('dept_level').notNull().default(1),
  ovwrPath: varchar('path', { length: 255 }),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  ovwrIdxDeptCode: index('idx_auth_department_code').on(table.ovwrDeptCode),
  ovwrIdxParentDept: index('idx_auth_department_parent').on(table.ovwrParentDeptId)
}));

// ─── ovwr_auth_role (角色表) ──────────────────────────────────

export const ovwrAuthRole = pgTable('auth_role', {
  ovwrRoleId: integer('role_id').primaryKey(), // SERIAL in DB
  ovwrRoleKey: varchar('role_key', { length: 64 }).unique().notNull(),
  ovwrRoleNameZh: varchar('role_name_zh', { length: 100 }).notNull(),
  ovwrRoleNameEn: varchar('role_name_en', { length: 100 }),
  ovwrRoleCode: varchar('role_code', { length: 64 }).notNull(),
  ovwrDescription: text('description'),
  ovwrPermissionKeys: jsonb('permission_keys').$type<string[]>().default([]),
  ovwrIsSystem: boolean('is_system').notNull().default(false),
  ovwrSortOrder: integer('sort_order').notNull().default(0),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  ovwrIdxRoleKey: index('idx_auth_role_key').on(table.ovwrRoleKey),
  ovwrIdxSortOrder: index('idx_auth_role_sort').on(table.ovwrSortOrder),
}));

// ─── ovwr_auth_user (用户账户表) ────────────────────────────────────
// Note: Using integer id for PK matching existing DB, but no .serial() in Drizzle v0.29

export const ovwrAuthUser = pgTable('auth_user', {
  ovwrId: integer('id').primaryKey(), // SERIAL in DB, Drizzle will use default
  ovwrUserUuid: varchar('user_uuid', { length: 36 }).unique().notNull(),
  ovwrUsername: varchar('username', { length: 64 }).unique().notNull(),
  ovwrPasswordHash: varchar('password_hash', { length: 255 }).notNull(),
  ovwrName: varchar('name', { length: 100 }).notNull(),
  ovwrNameEn: varchar('name_en', { length: 100 }),
  ovwrEmail: varchar('email', { length: 255 }).unique().notNull(),
  ovwrPhone: varchar('phone', { length: 20 }),
  
  ovwrDeptId: integer('dept_id')
    .references(() => ovwrAuthDepartment.ovwrDeptId, { onDelete: 'set null' }),
  ovwrDeptCode: varchar('dept_code', { length: 32 }).notNull(),
  
  ovwrAuthMethod: varchar('auth_method', { length: 16 }).notNull().default('local'),
  ovwrSsoProvider: varchar('sso_provider', { length: 32 }),
  ovwrLdapDn: varchar('ldap_dn', { length: 255 }),
  
  ovwrStatus: varchar('status', { length: 16 }).notNull().default('active'),
  ovwrMfaEnabled: boolean('mfa_enabled').notNull().default(false),
  ovwrMfaSecret: varchar('mfa_secret', { length: 255 }),
  
  ovwrLastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  ovwrLastLoginIp: varchar('last_login_ip', { length: 45 }),
  ovwrLoginCount: integer('login_count').notNull().default(0),
  
  ovwrCreatedBy: varchar('created_by', { length: 64 }),
  ovwrCreatedAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrUpdatedBy: varchar('updated_by', { length: 64 }),
  ovwrUpdatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ovwrDeleted: boolean('deleted').notNull().default(false),
}, (table) => ({
  ovwrIdxUsername: index('idx_auth_user_username').on(table.ovwrUsername),
  ovwrIdxEmail: index('idx_auth_user_email').on(table.ovwrEmail),
  ovwrIdxDept: index('idx_auth_user_dept').on(table.ovwrDeptId),
  ovwrIdxStatus: index('idx_auth_user_status').on(table.ovwrStatus),
}));

// ─── ovwr_auth_user_role (用户角色关联表) ───────────────────

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
  ovwrIdxUserId: index('idx_auth_user_role_user').on(table.ovwrUserId),
  ovwrIdxRoleId: index('idx_auth_user_role_role').on(table.ovwrRoleId),
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

