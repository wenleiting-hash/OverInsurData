-- =====================================================
-- OverInsur Translation Seed Data (English Only)
-- Database: ai_saas (public schema)  
-- Date: 2026-09-03
-- Description: Insert translation entries WITHOUT Chinese characters
-- =====================================================

INSERT INTO public.ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module, ovwr_section, ovwr_status, ovwr_created_at, ovwr_updated_at) VALUES
('trans-ovwr-dash-001', 'system', 'dashboard.title', 'Dashboard', '', 'label', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-dash-002', 'system', 'dashboard.overview', 'Overview', '', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-dash-003', 'system', 'dashboard.total.users', 'Total Users', '', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-dash-004', 'system', 'dashboard.total.permissions', 'Total Permissions', '', 'label', 'system', 'dashboard', '1', NOW(), NOW()),
('trans-ovwr-common-001', 'system', 'common.actions', 'Actions', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-002', 'system', 'common.save', 'Save', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-003', 'system', 'common.cancel', 'Cancel', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-004', 'system', 'common.confirm', 'Confirm', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-005', 'system', 'common.delete', 'Delete', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-006', 'system', 'common.edit', 'Edit', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-007', 'system', 'common.add', 'Add', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-008', 'system', 'common.search', 'Search', '', 'placeholder', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-009', 'system', 'common.filter', 'Filter', '', 'label', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-010', 'system', 'common.export', 'Export', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-011', 'system', 'common.import', 'Import', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-012', 'system', 'common.download', 'Download', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-013', 'system', 'common.upload', 'Upload', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-014', 'system', 'common.refresh', 'Refresh', '', 'button', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-common-015', 'system', 'common.loading', 'Loading...', '', 'toast', 'system', 'common', '1', NOW(), NOW()),
('trans-ovwr-nav-001', 'system', 'nav.dashboard', 'Dashboard', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-002', 'system', 'nav.i18n.manage', 'i18n Management', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-003', 'system', 'nav.permission.manage', 'Permission Management', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-004', 'system', 'nav.role.manage', 'Role Management', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-005', 'system', 'nav.user.manage', 'User Management', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-nav-006', 'system', 'nav.audit.log', 'Audit Log', '', 'label', 'system', 'menu', '1', NOW(), NOW()),
('trans-ovwr-i18n-001', 'i18n', 'namespace.label', 'Namespace', '', 'label', 'i18n', 'common', '1', NOW(), NOW()),
('trans-ovwr-i18n-002', 'i18n', 'namespace.select.placeholder', 'Select Namespace', '', 'placeholder', 'i18n', 'filter', '1', NOW(), NOW()),
('trans-ovwr-i18n-003', 'i18n', 'translation.key', 'Translation Key', '', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-004', 'i18n', 'translation.en-us', 'English (US)', '', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-005', 'i18n', 'translation.zh-cn', 'Chinese (China)', '', 'label', 'i18n', 'table', '1', NOW(), NOW()),
('trans-ovwr-i18n-006', 'i18n', 'translation.status.published', 'Published', '', 'label', 'i18n', 'status', '1', NOW(), NOW()),
('trans-ovwr-i18n-007', 'i18n', 'translation.status.draft', 'Draft', '', 'label', 'i18n', 'status', '1', NOW(), NOW()),
('trans-ovwr-i18n-008', 'i18n', 'version.create', 'Create Version', '', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-i18n-009', 'i18n', 'version.publish', 'Publish Version', '', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-i18n-010', 'i18n', 'version.rollback', 'Rollback', '', 'button', 'i18n', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-001', 'permission', 'module.label', 'Module', '', 'label', 'permission', 'common', '1', NOW(), NOW()),
('trans-ovwr-perm-002', 'permission', 'permission.code', 'Permission Code', '', 'label', 'permission', 'table', '1', NOW(), NOW()),
('trans-ovwr-perm-003', 'permission', 'permission.name', 'Permission Name', '', 'label', 'permission', 'table', '1', NOW(), NOW()),
('trans-ovwr-perm-004', 'permission', 'template.apply', 'Apply Template', '', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-005', 'permission', 'template.copy', 'Copy Template', '', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-006', 'permission', 'role.assign', 'Assign to Role', '', 'button', 'permission', 'action', '1', NOW(), NOW()),
('trans-ovwr-perm-007', 'permission', 'rbac.matrix', 'RBAC Matrix', '', 'label', 'permission', 'section', '1', NOW(), NOW())
ON CONFLICT (ovwr_translation_id) DO NOTHING;
