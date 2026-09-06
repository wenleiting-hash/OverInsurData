-- =====================================================
-- OverInsur (ovwr_) Seed Data - Initial Permission Points
-- =====================================================
-- IMPORTANT: All IDs use 'ovwr_' prefix for consistency
-- Database: auth_db on ai-saas-postgres container (port 5432)
-- Date: 2026-09-03
-- =====================================================

-- Insert 20 core permission points
INSERT INTO ovwr_auth_permission (
    ovwr_permission_id,
    ovwr_permission_code, 
    ovwr_permission_name, 
    ovwr_module, 
    ovwr_action, 
    ovwr_resource_type,
    ovwr_description
) VALUES 
('ovwr-perm-i18n-001', 'i18n:translation:view', '查看翻译管理', 'i18n', 'read', 'page', 'Can view translation management page'),
('ovwr-perm-i18n-002', 'i18n:translation:edit', '编辑翻译词条', 'i18n', 'update', 'button', 'Can edit translation entries'),
('ovwr-perm-i18n-003', 'i18n:translation:import', '导入翻译文件', 'i18n', 'import', 'button', 'Can import translations from file'),
('ovwr-perm-i18n-004', 'i18n:translation:export', '导出翻译文件', 'i18n', 'export', 'button', 'Can export translations to file'),
('ovwr-perm-i18n-005', 'i18n:version:view', '查看版本历史', 'i18n', 'read', 'page', 'Can view version history'),
('ovwr-perm-i18n-006', 'i18n:version:publish', '发布新版本', 'i18n', 'create', 'button', 'Can publish new version'),
('ovwr-perm-i18n-007', 'i18n:version:rollback', '回滚到旧版本', 'i18n', 'update', 'button', 'Can rollback to old version'),
('ovwr-perm-permission-001', 'permission:template:view', '查看权限模板', 'permission', 'read', 'page', 'Can view permission templates'),
('ovwr-perm-permission-002', 'permission:template:create', '创建权限模板', 'permission', 'create', 'button', 'Can create new permission template'),
('ovwr-perm-permission-003', 'permission:template:edit', '编辑权限模板', 'permission', 'update', 'button', 'Can edit permission template'),
('ovwr-perm-permission-004', 'permission:template:delete', '删除权限模板', 'permission', 'delete', 'button', 'Can delete permission template'),
('ovwr-perm-permission-005', 'permission:template:import', '导入权限模板', 'permission', 'import', 'button', 'Can import permission template from file'),
('ovwr-perm-permission-006', 'permission:template:export', '导出权限模板', 'permission', 'export', 'button', 'Can export permission template to file'),
('ovwr-perm-permission-007', 'permission:template:apply', '应用权限模板', 'permission', 'update', 'button', 'Can apply permission template to roles'),
('ovwr-perm-permission-008', 'permission:template:duplicate', '复制权限模板', 'permission', 'create', 'button', 'Can duplicate permission template'),
('ovwr-perm-role-001', 'role:view', '查看角色列表', 'role', 'read', 'page', 'Can view role list'),
('ovwr-perm-role-002', 'role:create', '创建角色', 'role', 'create', 'button', 'Can create new role'),
('ovwr-perm-role-003', 'role:edit', '编辑角色', 'role', 'update', 'button', 'Can edit existing role'),
('ovwr-perm-role-004', 'role:assign', '分配角色给用户', 'role', 'update', 'button', 'Can assign roles to users'),
('ovwr-perm-role-005', 'role:delete', '删除角色', 'role', 'delete', 'button', 'Can delete roles');

COMMIT;
