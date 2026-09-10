-- Department module i18n translations
-- Namespace: department
-- Module: department-management

INSERT INTO ovwr_auth_i18n_translation (ovwr_translation_id, ovwr_namespace, ovwr_key, ovwr_en_us, ovwr_zh_cn, ovwr_type, ovwr_module, ovwr_section, ovwr_status, ovwr_created_at, ovwr_updated_at)
VALUES
-- Page header
('dept-001', 'department', 'title', 'Department Management', '部门管理', 'label', 'department-management', 'header', '1', NOW(), NOW()),
('dept-002', 'department', 'description', 'Manage organizational structure, department hierarchy and member assignments', '管理组织架构、部门层级与人员分配', 'label', 'department-management', 'header', '1', NOW(), NOW()),
('dept-003', 'department', 'newDepartment', 'New Department', '新增部门', 'button', 'department-management', 'header', '1', NOW(), NOW()),
('dept-004', 'department', 'search', 'Search department name or code...', '搜索部门名称或编码...', 'placeholder', 'department-management', 'search', '1', NOW(), NOW()),

-- Stats cards
('dept-005', 'department', 'stats.totalDepartments', 'Total Departments', '部门总数', 'label', 'department-management', 'stats', '1', NOW(), NOW()),
('dept-006', 'department', 'stats.totalMembers', 'Total Members', '总成员数', 'label', 'department-management', 'stats', '1', NOW(), NOW()),
('dept-007', 'department', 'stats.maxLevel', 'Max Depth', '最大层级', 'label', 'department-management', 'stats', '1', NOW(), NOW()),

-- Detail panel
('dept-010', 'department', 'detail.empty', 'Select a department to view details', '选择部门查看详情', 'label', 'department-management', 'detail', '1', NOW(), NOW()),
('dept-011', 'department', 'detail.addSub', 'Add Sub', '添加子部门', 'button', 'department-management', 'detail', '1', NOW(), NOW()),
('dept-012', 'department', 'detail.edit', 'Edit', '编辑', 'button', 'department-management', 'detail', '1', NOW(), NOW()),

-- Detail info row
('dept-020', 'department', 'detail.info.members', 'Members', '成员数', 'label', 'department-management', 'detail.info', '1', NOW(), NOW()),
('dept-021', 'department', 'detail.info.subDepartments', 'Sub-departments', '子部门数', 'label', 'department-management', 'detail.info', '1', NOW(), NOW()),
('dept-022', 'department', 'detail.info.createdAt', 'Created', '创建时间', 'label', 'department-management', 'detail.info', '1', NOW(), NOW()),
('dept-023', 'department', 'detail.info.manager', 'Manager', '负责人', 'label', 'department-management', 'detail.info', '1', NOW(), NOW()),

-- Detail units
('dept-030', 'department', 'detail.unit.people', 'people', '人', 'label', 'department-management', 'detail.unit', '1', NOW(), NOW()),
('dept-031', 'department', 'detail.unit.count', 'items', '个', 'label', 'department-management', 'detail.unit', '1', NOW(), NOW()),

-- Detail sub-sections
('dept-040', 'department', 'detail.subDeptList', 'Sub-departments', '子部门列表', 'label', 'department-management', 'detail', '1', NOW(), NOW()),
('dept-041', 'department', 'detail.memberTable.title', 'Department Members', '部门成员', 'label', 'department-management', 'detail.memberTable', '1', NOW(), NOW()),
('dept-042', 'department', 'detail.memberTable.name', 'Name', '姓名', 'label', 'department-management', 'detail.memberTable', '1', NOW(), NOW()),
('dept-043', 'department', 'detail.memberTable.role', 'Role', '角色', 'label', 'department-management', 'detail.memberTable', '1', NOW(), NOW()),
('dept-044', 'department', 'detail.memberTable.email', 'Email', '邮箱', 'label', 'department-management', 'detail.memberTable', '1', NOW(), NOW()),
('dept-045', 'department', 'detail.memberTable.status', 'Status', '状态', 'label', 'department-management', 'detail.memberTable', '1', NOW(), NOW()),
('dept-046', 'department', 'detail.manageUsers', 'Manage Users →', '管理用户 →', 'button', 'department-management', 'detail', '1', NOW(), NOW()),

-- Status badges
('dept-050', 'department', 'status.active', 'Active', '正常', 'label', 'department-management', 'status', '1', NOW(), NOW()),
('dept-051', 'department', 'status.inactive', 'Inactive', '停用', 'label', 'department-management', 'status', '1', NOW(), NOW()),
('dept-052', 'department', 'status.locked', 'Locked', '已锁定', 'label', 'department-management', 'status', '1', NOW(), NOW()),
('dept-053', 'department', 'status.pending', 'Pending', '待激活', 'label', 'department-management', 'status', '1', NOW(), NOW()),

-- Form dialog
('dept-060', 'department', 'form.createTitle', 'New Department', '新增部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-061', 'department', 'form.editTitle', 'Edit Department', '编辑部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-062', 'department', 'form.addSubTitle', 'Add Sub-department', '添加子部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-063', 'department', 'form.createDesc', 'Create a new department under the organization', '在组织下创建新部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-064', 'department', 'form.editDesc', 'Edit department: {{name}}', '编辑部门：{{name}}', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-065', 'department', 'form.addSubDesc', 'Add sub-department under: {{parent}}', '在 {{parent}} 下添加子部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-066', 'department', 'form.color', 'Color', '颜色', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-067', 'department', 'form.name', 'Department Name (CN)', '部门名称（中文）', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-068', 'department', 'form.nameEn', 'Department Name (EN)', '部门名称（英文）', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-069', 'department', 'form.parent', 'Parent Department', '上级部门', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-070', 'department', 'form.parentNone', '— None (Root) —', '— 无（根部门）—', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-071', 'department', 'form.managerName', 'Manager Name', '负责人姓名', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-072', 'department', 'form.managerTitle', 'Manager Title', '负责人职位', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-073', 'department', 'form.managerEmail', 'Manager Email', '负责人邮箱', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-074', 'department', 'form.managerPhone', 'Manager Phone', '负责人电话', 'label', 'department-management', 'form', '1', NOW(), NOW()),
('dept-075', 'department', 'form.officeLocation', 'Office Location', '办公地点', 'label', 'department-management', 'form', '1', NOW(), NOW()),

-- Messages (toast)
('dept-080', 'department', 'messages.createSuccess', 'Department created successfully', '部门创建成功', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-081', 'department', 'messages.updateSuccess', 'Department updated successfully', '部门更新成功', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-082', 'department', 'messages.createError', 'Failed to create department', '部门创建失败', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-083', 'department', 'messages.updateError', 'Failed to update department', '部门更新失败', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-084', 'department', 'messages.deleteSuccess', 'Department deleted successfully', '部门删除成功', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-085', 'department', 'messages.deleteError', 'Failed to delete department', '部门删除失败', 'toast', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-086', 'department', 'messages.loading', 'Loading department tree...', '加载部门树...', 'label', 'department-management', 'messages', '1', NOW(), NOW()),
('dept-087', 'department', 'messages.empty', 'No departments found', '未找到部门', 'label', 'department-management', 'messages', '1', NOW(), NOW()),

-- Delete dialog
('dept-090', 'department', 'delete.title', 'Delete: {{name}}', '删除：{{name}}', 'label', 'department-management', 'delete', '1', NOW(), NOW()),
('dept-091', 'department', 'delete.warning', 'This action will permanently delete this department.', '此操作将永久删除该部门。', 'label', 'department-management', 'delete', '1', NOW(), NOW()),
('dept-092', 'department', 'delete.subWarning', '⚠ This department has {{count}} sub-department(s) that will also be deleted.', '⚠ 该部门包含 {{count}} 个子部门，将一并删除。', 'label', 'department-management', 'delete', '1', NOW(), NOW()),
('dept-093', 'department', 'delete.memberWarning', 'Members in this department will have their department assignment cleared.', '该部门下的成员将取消部门归属。', 'label', 'department-management', 'delete', '1', NOW(), NOW()),
('dept-094', 'department', 'delete.cancel', 'Cancel', '取消', 'button', 'department-management', 'delete', '1', NOW(), NOW()),
('dept-095', 'department', 'delete.confirm', 'Delete', '确认删除', 'button', 'department-management', 'delete', '1', NOW(), NOW())
ON CONFLICT (ovwr_translation_id) DO NOTHING;
