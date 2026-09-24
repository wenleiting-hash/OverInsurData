-- =====================================================
-- OverInsur (ovwr) Permission Seed Data Script
-- Database: ai_saas (public schema)
-- Date: 2026-09-03
-- Description: Insert initial permission codes and templates
-- =====================================================

-- ===========================================
-- Part 1: Permission Points (31 points)
-- ===========================================

INSERT INTO public.ovwr_auth_permission (ovwr_permission_id, ovwr_permission_code, ovwr_permission_name, ovwr_module, ovwr_action, ovwr_resource_type, ovwr_status, ovwr_created_at, ovwr_updated_at) VALUES
('perm-ovwr-i18n-001', 'ovwr:i18n:manage:view', 'View i18n Management', 'i18n', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-i18n-002', 'ovwr:i18n:translation:edit', 'Edit Translation Entries', 'i18n', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-003', 'ovwr:i18n:translation:add', 'Add Translation Entry', 'i18n', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-004', 'ovwr:i18n:translation:delete', 'Delete Translation Entry', 'i18n', 'delete', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-005', 'ovwr:i18n:version:create', 'Create New Version', 'i18n', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-006', 'ovwr:i18n:version:publish', 'Publish Translation Version', 'i18n', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-007', 'ovwr:i18n:version:rollback', 'Rollback Version', 'i18n', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-008', 'ovwr:i18n:review:audit', 'Audit Translation Queue', 'i18n', 'approve', 'button', '1', NOW(), NOW()),
('perm-ovwr-i18n-009', 'ovwr:i18n:term:view', 'View Terminology Database', 'i18n', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-i18n-010', 'ovwr:i18n:term:manage', 'Manage Terminology Database', 'i18n', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-001', 'ovwr:permission:template:view', 'View Permission Templates', 'permission', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-perm-002', 'ovwr:permission:template:create', 'Create Permission Template', 'permission', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-003', 'ovwr:permission:template:edit', 'Edit Permission Template', 'permission', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-004', 'ovwr:permission:template:delete', 'Delete Permission Template', 'permission', 'delete', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-005', 'ovwr:permission:template:apply', 'Apply Permission Template', 'permission', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-006', 'ovwr:permission:template:copy', 'Copy Permission Template', 'permission', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-007', 'ovwr:permission:template:export', 'Export Permission Template', 'permission', 'export', 'button', '1', NOW(), NOW()),
('perm-ovwr-perm-008', 'ovwr:permission:template:import', 'Import Permission Template', 'permission', 'import', 'button', '1', NOW(), NOW()),
('perm-ovwr-role-001', 'ovwr:role:manage:view', 'View Role Management', 'role', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-role-002', 'ovwr:role:create', 'Create New Role', 'role', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-role-003', 'ovwr:role:assign:user', 'Assign Role to User', 'role', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-role-004', 'ovwr:role:revoke', 'Revoke Role', 'role', 'delete', 'button', '1', NOW(), NOW()),
('perm-ovwr-role-005', 'ovwr:role:clone', 'Clone Role', 'role', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-role-006', 'ovwr:role:audit', 'Audit Role Changes', 'role', 'audit', 'button', '1', NOW(), NOW()),
('perm-ovwr-user-001', 'ovwr:user:manage:view', 'View User Management', 'user', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-user-002', 'ovwr:user:create', 'Add New User', 'user', 'create', 'button', '1', NOW(), NOW()),
('perm-ovwr-user-003', 'ovwr:user:edit', 'Edit User Information', 'user', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-user-004', 'ovwr:user:reset:password', 'Reset Password', 'user', 'update', 'button', '1', NOW(), NOW()),
('perm-ovwr-audit-001', 'ovwr:audit:log:view', 'View Operation Logs', 'audit', 'read', 'page', '1', NOW(), NOW()),
('perm-ovwr-audit-002', 'ovwr:audit:log:export', 'Export Audit Logs', 'audit', 'export', 'button', '1', NOW(), NOW()),
('perm-ovwr-audit-003', 'ovwr:audit:report:generate', 'Generate Audit Report', 'audit', 'export', 'button', '1', NOW(), NOW())
ON CONFLICT (ovwr_permission_code) DO NOTHING;

-- ===========================================
-- Part 2: Default Permission Templates
-- ===========================================

-- NOTE: Column list aligned to the canonical ovwr_auth_permission_template
-- schema defined in 02-init-ovwr-schema.sql (which supersedes create-ovwr-schemas.sql).
-- The old columns ovwr_template_code/ovwr_scope/ovwr_is_default/ovwr_status no longer
-- exist; the table now uses ovwr_version + ovwr_format (NOT NULL) and a JSON-role-bundle
-- design. format='json' per table comment; version='1.0.0' as initial release.
INSERT INTO public.ovwr_auth_permission_template (ovwr_template_id, ovwr_template_name, ovwr_version, ovwr_format, ovwr_description, ovwr_usage_count, ovwr_created_at, ovwr_updated_at) VALUES
('tpl-ovwr-admin-001',    'Super Administrator', '1.0.0', 'json', 'Default admin template with all system permissions',                          0, NOW(), NOW()),
('tpl-ovwr-operator-001', 'Operator Standard',   '1.0.0', 'json', 'Standard operator permissions including i18n and basic permission management', 0, NOW(), NOW()),
('tpl-ovwr-viewer-001',    'Viewer Basic',        '1.0.0', 'json', 'Read-only viewer template with minimal permissions',                          0, NOW(), NOW())
ON CONFLICT (ovwr_template_id) DO NOTHING;

-- ===========================================
-- Part 3: Sample Translation Terms (40 terms)
-- ===========================================

INSERT INTO public.ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module, ovwr_section, ovwr_status, ovwr_created_at, ovwr_updated_at) VALUES
('trans-ovwr-dash-001', 'system', 'dashboard.title', 'Dashboard', '仪表盘', 'label', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-dash-002', 'system', 'dashboard.overview', 'Overview', '概览', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-dash-003', 'system', 'dashboard.total.users', 'Total Users', '总用户数', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-dash-004', 'system', 'dashboard.total.permissions', 'Total Permissions', '总权限数', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-common-001', 'system', 'common.actions', 'Actions', '操作', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-002', 'system', 'common.save', 'Save', '保存', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-003', 'system', 'common.cancel', 'Cancel', '取消', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-004', 'system', 'common.confirm', 'Confirm', '确认', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-005', 'system', 'common.delete', 'Delete', '删除', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-006', 'system', 'common.edit', 'Edit', '编辑', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-007', 'system', 'common.add', 'Add', '新增', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-008', 'system', 'common.search', 'Search', '搜索', 'placeholder', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-009', 'system', 'common.filter', 'Filter', '筛选', 'label', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-010', 'system', 'common.export', 'Export', '导出', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-011', 'system', 'common.import', 'Import', '导入', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-012', 'system', 'common.download', 'Download', '下载', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-013', 'system', 'common.upload', 'Upload', '上传', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-014', 'system', 'common.refresh', 'Refresh', '刷新', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-015', 'system', 'common.loading', 'Loading...', '加载中...', 'toast', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-nav-001', 'system', 'nav.dashboard', 'Dashboard', '仪表盘', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-002', 'system', 'nav.i18n.manage', 'i18n Management', '多语言管理', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-003', 'system', 'nav.permission.manage', 'Permission Management', '权限管理', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-004', 'system', 'nav.role.manage', 'Role Management', '角色管理', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-005', 'system', 'nav.user.manage', 'User Management', '用户管理', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-006', 'system', 'nav.audit.log', 'Audit Log', '操作日志', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-i18n-001', 'i18n', 'namespace.label', 'Namespace', '命名空间', 'label', 'i18n', 'common', '1', NOW(), NOW()),
('trans-ovwr-i18n-002', 'i18n', 'namespace.select.placeholder', 'Select Namespace', '选择命名空间', 'placeholder', 'i18n', 'filter', '1', NOW(), NOW()),
('trans-ovwr-i18n-003', 'i18n', 'translation.key', 'Translation Key', '翻译键', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-004', 'i18n', 'translation.en-us', 'English (US)', '英文（美）', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-005', 'i18n', 'translation.zh-cn', 'Chinese (China)', '中文（中国）', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-006', 'i18n', 'translation.status.published', 'Published', '已发布', 'label', 'i18n', 'status', '1', NOW(), NOW()),
('trans-ovwr-i18n-007', 'i18n', 'translation.status.draft', 'Draft', '草稿', 'label', 'i18n', 'status', '1', NOW(), NOW()),
('trans-ovwr-i18n-008', 'i18n', 'version.create', 'Create Version', '创建版本', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-i18n-009', 'i18n', 'version.publish', 'Publish Version', '发布版本', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-i18n-010', 'i18n', 'version.rollback', 'Rollback', '回滚', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-001', 'permission', 'module.label', 'Module', '模块', 'label', 'permission', 'common', '1', NOW(), NOW()),
('trans-ovwr-perm-002', 'permission', 'permission.code', 'Permission Code', '权限码', 'label', 'permission', 'table', '1', NOW(), NOW()),
('trans-ovwr-perm-003', 'permission', 'permission.name', 'Permission Name', '权限名称', 'label', 'permission', 'table', '1', NOW(), NOW()),
('trans-ovwr-perm-004', 'permission', 'template.apply', 'Apply Template', '应用模板', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-005', 'permission', 'template.copy', 'Copy Template', '复制模板', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-006', 'permission', 'role.assign', 'Assign to Role', '分配给角色', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-007', 'permission', 'rbac.matrix', 'RBAC Matrix', 'RBAC 矩阵', 'label', 'permission', 'section', '1', NOW(), NOW())
ON CONFLICT (ovwr_translation_id) DO NOTHING;
