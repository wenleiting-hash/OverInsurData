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

-- =====================================================
-- V1.0.15 权限点增补（2026-09-16）
-- 财务结算批次化（账单作废/解锁为主管操作：super_admin/ops_manager）
-- 合作管理收敛（续约直接登记、产品直接关联/取消）
-- 幂等：重复执行不报错
-- =====================================================
INSERT INTO ovwr_auth_permission (
    ovwr_permission_id,
    ovwr_permission_code,
    ovwr_permission_name,
    ovwr_module,
    ovwr_action,
    ovwr_resource_type,
    ovwr_description
) VALUES
-- 财务结算：账单批次
('ovwr-perm-fin-1015-001', 'finance:bill:view',     '查看账单批次',     'finance', 'read',   'page',   'V1.0.15 查看账单批次列表/详情/明细行'),
('ovwr-perm-fin-1015-002', 'finance:bill:import',   '导入账单批次',     'finance', 'import', 'button', 'V1.0.15 账单预检与批次导入（单保司+单账单月份）'),
('ovwr-perm-fin-1015-003', 'finance:bill:reconcile','发起对账试算',     'finance', 'update', 'button', 'V1.0.15 发起/重新执行批次对账试算'),
('ovwr-perm-fin-1015-004', 'finance:diff:resolve',  '处理对账异常',     'finance', 'update', 'button', 'V1.0.15 批次详情异常 Tab 内处理差异（采纳/挂起/重开/重算/备注）'),
('ovwr-perm-fin-1015-005', 'finance:bill:complete', '批次封帐',         'finance', 'update', 'button', 'V1.0.15 批次封帐（存在未处理异常时禁止）'),
('ovwr-perm-fin-1015-006', 'finance:bill:unlock',   '批次解锁',         'finance', 'update', 'button', 'V1.0.15 已封帐批次解锁（仅主管 super_admin/ops_manager）'),
('ovwr-perm-fin-1015-007', 'finance:bill:void',     '批次作废',         'finance', 'delete', 'button', 'V1.0.15 作废账单批次（仅主管 super_admin/ops_manager）'),
-- 财务结算：佣金率（结算比例配置）
('ovwr-perm-fin-1015-008', 'finance:rate:view',     '查看佣金率',       'finance', 'read',   'page',   'V1.0.15 查看保司佣金率（含合作详情只读 Tab）'),
('ovwr-perm-fin-1015-009', 'finance:rate:edit',     '维护佣金率',       'finance', 'update', 'button', 'V1.0.15 新增/编辑/置失效佣金率档位'),
('ovwr-perm-fin-1015-010', 'finance:rate:import',   '批量导入佣金率',   'finance', 'import', 'button', 'V1.0.15 Excel 预检与批量导入佣金率'),
-- 合作管理：续约/产品关联
('ovwr-perm-coop-1015-001','cooperation:renewal:register','登记续约',    'cooperation', 'create', 'button', 'V1.0.15 直接登记续约（顺延合作到期日，无谈判中间态）'),
('ovwr-perm-coop-1015-002','cooperation:product:link',    '关联合作产品','cooperation', 'create', 'button', 'V1.0.15 合作关联保司产品（cooperation_product）'),
('ovwr-perm-coop-1015-003','cooperation:product:unlink',  '取消产品关联','cooperation', 'delete', 'button', 'V1.0.15 取消合作产品关联（被渠道授权占用时拒绝）')
ON CONFLICT (ovwr_permission_id) DO NOTHING;
