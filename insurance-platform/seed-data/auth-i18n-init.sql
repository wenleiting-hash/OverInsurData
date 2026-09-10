-- ============================================================
-- I18n Translation Tables for OVERINSURDATA
-- Table: ovwr_auth_i18n_translation
-- ============================================================

-- Drop if exists (safe re-run)
DROP TABLE IF EXISTS ovwr_auth_i18n_translation CASCADE;

-- ─── Create translation table ───────────────────────────────
CREATE TABLE ovwr_auth_i18n_translation (
    ovwr_translation_id   TEXT PRIMARY KEY,
    ovwr_namespace        TEXT NOT NULL,
    ovwr_key              TEXT NOT NULL,
    ovwr_en_us            TEXT,
    ovwr_zh_cn            TEXT,
    ovwr_type             TEXT DEFAULT 'label',
    ovwr_module           TEXT,
    ovwr_section          TEXT,
    ovwr_status           TEXT DEFAULT '1',
    ovwr_metadata         JSONB,
    ovwr_created_at       TIMESTAMPTZ DEFAULT NOW(),
    ovwr_updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_i18n_ns ON ovwr_auth_i18n_translation (ovwr_namespace);
CREATE INDEX idx_i18n_module ON ovwr_auth_i18n_translation (ovwr_module);
CREATE INDEX idx_i18n_type ON ovwr_auth_i18n_translation (ovwr_type);
CREATE INDEX idx_i18n_key ON ovwr_auth_i18n_translation (ovwr_key);

-- ─── Seed data: User Management translations ────────────────
INSERT INTO ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module) VALUES
  -- User management page
  ('i18n-um-001', 'permission', 'userMgmt.title', 'User Management', '用户管理', 'label', 'user-management'),
  ('i18n-um-002', 'permission', 'userMgmt.description', 'Manage system user accounts, role assignments and access permissions', '管理系统用户账户、角色分配及访问权限', 'label', 'user-management'),
  ('i18n-um-003', 'permission', 'userMgmt.newUser', 'New User', '新建用户', 'button', 'user-management'),
  ('i18n-um-004', 'permission', 'userMgmt.export', 'Export', '导出', 'button', 'user-management'),
  ('i18n-um-005', 'permission', 'userMgmt.filters.search', 'Search name, username, email or phone...', '搜索姓名、用户名、邮箱或电话...', 'placeholder', 'user-management'),
  ('i18n-um-006', 'permission', 'userMgmt.filters.allStatus', 'All Statuses', '全部状态', 'label', 'user-management'),
  ('i18n-um-007', 'permission', 'userMgmt.filters.allRoles', 'All Roles', '全部角色', 'label', 'user-management'),
  ('i18n-um-008', 'permission', 'userMgmt.filters.allDepts', 'All Departments', '全部部门', 'label', 'user-management'),
  ('i18n-um-009', 'permission', 'userMgmt.filters.reset', 'Reset', '重置', 'button', 'user-management'),
  -- Table headers
  ('i18n-um-010', 'permission', 'userMgmt.table.user', 'User', '用户', 'label', 'user-management'),
  ('i18n-um-011', 'permission', 'userMgmt.table.emailPhone', 'Email / Mobile', '邮箱 / 手机', 'label', 'user-management'),
  ('i18n-um-012', 'permission', 'userMgmt.table.deptRoles', 'Department / Roles', '部门 / 角色', 'label', 'user-management'),
  ('i18n-um-013', 'permission', 'userMgmt.table.auth', 'Authentication', '认证', 'label', 'user-management'),
  ('i18n-um-014', 'permission', 'userMgmt.table.status', 'Status', '状态', 'label', 'user-management'),
  ('i18n-um-015', 'permission', 'userMgmt.table.lastLogin', 'Recent Login', '最近登录', 'label', 'user-management'),
  ('i18n-um-016', 'permission', 'userMgmt.table.never', 'Never logged in', '从未登录', 'label', 'user-management'),
  -- Status values
  ('i18n-um-020', 'permission', 'userMgmt.status.active', 'Active', '活跃', 'label', 'user-management'),
  ('i18n-um-021', 'permission', 'userMgmt.status.inactive', 'Inactive', '停用', 'label', 'user-management'),
  ('i18n-um-022', 'permission', 'userMgmt.status.locked', 'Locked', '已锁定', 'label', 'user-management'),
  ('i18n-um-023', 'permission', 'userMgmt.status.pending', 'Pending', '待激活', 'label', 'user-management'),
  -- Role names
  ('i18n-um-030', 'permission', 'userMgmt.roles.super_admin', 'Super Admin', '超级管理员', 'label', 'user-management'),
  ('i18n-um-031', 'permission', 'userMgmt.roles.ops_manager', 'Ops Manager', '运营管理员', 'label', 'user-management'),
  ('i18n-um-032', 'permission', 'userMgmt.roles.channel_manager', 'Channel Manager', '渠道经理', 'label', 'user-management'),
  ('i18n-um-033', 'permission', 'userMgmt.roles.finance_staff', 'Finance Staff', '财务专员', 'label', 'user-management'),
  ('i18n-um-034', 'permission', 'userMgmt.roles.readonly_user', 'Read-Only User', '只读用户', 'label', 'user-management'),
  -- Auth methods
  ('i18n-um-040', 'permission', 'userMgmt.auth.local', 'Local Account', '本地账号', 'label', 'user-management'),
  ('i18n-um-041', 'permission', 'userMgmt.auth.sso', 'SSO', 'SSO', 'label', 'user-management'),
  ('i18n-um-042', 'permission', 'userMgmt.auth.ldap', 'LDAP', 'LDAP', 'label', 'user-management');

-- ─── Seed data: Permission management ────────────────────────
INSERT INTO ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module) VALUES
  ('i18n-pm-001', 'permission', 'roleList', 'Role List', '角色列表', 'label', 'permission'),
  ('i18n-pm-002', 'permission', 'createRole', 'New Role', '新建角色', 'button', 'permission'),
  ('i18n-pm-003', 'permission', 'editRole', 'Edit Role', '编辑角色', 'button', 'permission'),
  ('i18n-pm-004', 'permission', 'deleteRole', 'Delete Role', '删除角色', 'button', 'permission'),
  ('i18n-pm-005', 'permission', 'permissions', 'Permission Config', '权限配置', 'label', 'permission'),
  ('i18n-pm-006', 'permission', 'view.title', 'User Permission Management', '用户权限管理', 'label', 'permission'),
  ('i18n-pm-007', 'permission', 'view.savedToast', 'Permission config saved', '权限配置已保存', 'toast', 'permission'),
  ('i18n-pm-008', 'permission', 'view.saveChanges', 'Save Changes', '保存修改', 'button', 'permission');

-- ─── Seed data: Common UI ───────────────────────────────────
INSERT INTO ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module) VALUES
  ('i18n-common-001', 'common', 'save', 'Save', '保存', 'button', 'common'),
  ('i18n-common-002', 'common', 'cancel', 'Cancel', '取消', 'button', 'common'),
  ('i18n-common-003', 'common', 'delete', 'Delete', '删除', 'button', 'common'),
  ('i18n-common-004', 'common', 'edit', 'Edit', '编辑', 'button', 'common'),
  ('i18n-common-005', 'common', 'search', 'Search', '搜索', 'placeholder', 'common'),
  ('i18n-common-006', 'common', 'loading', 'Loading...', '加载中...', 'label', 'common'),
  ('i18n-common-007', 'common', 'confirm', 'Confirm', '确认', 'button', 'common'),
  ('i18n-common-008', 'common', 'back', 'Back', '返回', 'button', 'common');
