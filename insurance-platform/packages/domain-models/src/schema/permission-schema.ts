/**
 * Auth_db Schema Definitions (Permission Management Domain)
 */

import { pgTable, varchar, timestamp, index, jsonb, integer, text } from 'drizzle-orm/pg-core';

// ─── auth_permission (功能权限点表) ──────────────────────────────────────────

export const authPermission = pgTable('auth_permission', {
  permissionId: varchar('permission_id', { length: 32 }).primaryKey(),
  permissionCode: varchar('permission_code', { length: 64 }).unique().notNull(),
  permissionName: varchar('permission_name', { length: 128 }).notNull(),
  module: varchar('module', { length: 32 }).notNull(),
  action: varchar('action', {
    enum: ['create', 'read', 'update', 'delete', 'import', 'export', 'approve', 'audit'],
  }).notNull(),
  resourceType: varchar('resource_type', {
    enum: ['page', 'api', 'menu', 'button', 'data'],
  }),
  parentPermissionId: varchar('parent_permission_id', { length: 32 }),
  sortOrder: integer('sort_order').default(0),
  icon: varchar('icon', { length: 64 }),
  description: text('description'),
  status: varchar('status', { length: 1 }).default('1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCode: index('uk_permission_code').on(table.permissionCode),
  idxModule: index('idx_module').on(table.module),
  parentIdIdx: index('idx_parent_permission').on(table.parentPermissionId),
}));

// ─── auth_user_role (用户角色关联表) ────────────────────────────────────────

export const authUserRole = pgTable('auth_user_role', {
  roleId: varchar('role_id', { length: 32 }).primaryKey(),
  userId: varchar('user_id', { length: 32 }).notNull(),
  sourceType: varchar('source_type', {
    enum: ['DIRECT_ASSIGN', 'INHERITED', 'TEMPLATE_APPLIED'],
  }),
  appliedTemplateId: varchar('applied_template_id', { length: 32 }),
  grantedBy: varchar('granted_by', { length: 32 }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  status: varchar('status', {
    enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
  }).default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserRole: index('uk_user_role').on(table.userId, table.roleId),
  idxUserId: index('idx_user_id').on(table.userId),
}));

// ─── auth_role_permission (角色权限关联表) ──────────────────────────────────

export const authRolePermission = pgTable('auth_role_permission', {
  roleId: varchar('role_id', { length: 32 })
    .notNull()
    .references(() => authUserRole.roleId),
  permissionId: varchar('permission_id', { length: 32 })
    .notNull()
    .references(() => authPermission.permissionId),
  inheritedFrom: varchar('inherited_from', { length: 32 }),
  sourceType: varchar('source_type', {
    enum: ['DIRECT_ASSIGN', 'TEMPLATE_APPLIED', 'ROLE_INHERITANCE'],
  }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueMapping: index('uk_role_perm').on(table.roleId, table.permissionId),
  idxPermission: index('idx_permission').on(table.permissionId),
}));

// ─── auth_permission_template (权限模板表) ──────────────────────────────────

export const authPermissionTemplate = pgTable('auth_permission_template', {
  templateId: varchar('template_id', { length: 32 }).primaryKey(),
  templateName: varchar('template_name', { length: 128 }).notNull(),
  version: varchar('version', { length: 16 }).notNull(),
  description: text('description'),
  format: varchar('format', { length: 8 }).notNull(),
  roleCount: integer('role_count').default(0),
  permissionCount: integer('permission_count').default(0),
  createdBy: varchar('created_by', { length: 32 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  usageCount: integer('usage_count').default(0),
  metadata: jsonb('metadata').$type<{
    applicable_scenarios?: string[];
    applicable_modules?: string[];
    compatibility?: {
      minBackendVersion?: string;
      maxBackendVersion?: string;
    };
    tags?: string[];
  }>(),
}, (table) => ({
  uniqueVersion: index('uk_template_name_version').on(table.templateName, table.version),
  idxUsageCount: index('idx_usage_count').on(table.usageCount),
}));

// ─── auth_operation_log (操作审计日志表) ─────────────────────────────────────

export const authOperationLog = pgTable('auth_operation_log', {
  logId: varchar('log_id', { length: 32 }).primaryKey(),
  userId: varchar('user_id', { length: 32 }),
  username: varchar('username', { length: 64 }),
  action: varchar('action', { length: 128 }).notNull(),
  module: varchar('module', { length: 32 }),
  permissionCode: varchar('permission_code', { length: 64 }),
  ip: varchar('ip', { length: 64 }),
  userAgent: text('user_agent'),
  requestId: varchar('request_id', { length: 64 }),
  duration: integer('duration'),
  status: varchar('status', { length: 1 }),
  errorMessage: text('error_message'),
  extraData: jsonb('extra_data').$type<{
    before?: Record<string, any>;
    after?: Record<string, any>;
    requestBody?: Record<string, any>;
    queryParams?: Record<string, any>;
  }>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxCreatedAt: index('idx_created_at').on(table.createdAt),
  idxUserId: index('idx_user_id').on(table.userId),
  idxAction: index('idx_action').on(table.action),
  idxModule: index('idx_module').on(table.module),
}));
