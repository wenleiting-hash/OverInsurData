-- =====================================================
-- OverInsur (ovwr_) Seed Data - Initial Translations
-- =====================================================
-- IMPORTANT: All IDs use 'ovwr_' prefix for consistency
-- Database: i18n_db on ai-saas-postgres container (port 5432)
-- Date: 2026-09-03
-- =====================================================

-- Insert basic translations (common namespace)
INSERT INTO ovwr_auth_i18n_translation (
    ovwr_translation_id, 
    ovwr_namespace, 
    ovwr_key, 
    ovwr_en_us, 
    ovwr_zh_cn, 
    ovwr_type, 
    ovwr_module,
    ovwr_section,
    ovwr_status
) VALUES 
('ovwr-trans-001', 'common', 'actions.save', 'Save', '保存', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-002', 'common', 'actions.cancel', 'Cancel', '取消', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-003', 'common', 'actions.delete', 'Delete', '删除', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-004', 'common', 'actions.edit', 'Edit', '编辑', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-005', 'common', 'actions.create', 'Create', '新建', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-006', 'common', 'actions.search', 'Search', '搜索', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-007', 'common', 'actions.import', 'Import', '导入', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-008', 'common', 'actions.export', 'Export', '导出', 'button', 'common', '操作按钮', '1'),
('ovwr-trans-009', 'common', 'placeholder.enterName', 'Please enter a name', '请输入名称', 'placeholder', 'common', '表单输入', '1'),
('ovwr-trans-010', 'common', 'placeholder.enterDescription', 'Please enter a description', '请输入描述', 'placeholder', 'common', '表单输入', '1'),
('ovwr-trans-011', 'common', 'confirm.areYouSure', 'Are you sure?', '确定吗？', 'confirm', 'common', '确认框', '1'),
('ovwr-trans-012', 'common', 'toast.success', 'Operation successful', '操作成功', 'toast', 'common', '提示消息', '1');

-- Insert permission template translations
INSERT INTO ovwr_auth_i18n_translation (
    ovwr_translation_id, 
    ovwr_namespace, 
    ovwr_key, 
    ovwr_en_us, 
    ovwr_zh_cn, 
    ovwr_type, 
    ovwr_module,
    ovwr_section,
    ovwr_status
) VALUES 
('ovwr-trans-020', 'permission', 'title', 'Permission Template Management', '权限模板管理', 'label', 'permission', '页面标题', '1'),
('ovwr-trans-021', 'permission', 'createTemplate', 'Create Template', '创建模板', 'button', 'permission', '操作按钮', '1'),
('ovwr-trans-022', 'permission', 'searchPlaceholder', 'Search by name or code...', '按名称或编码搜索...', 'placeholder', 'permission', '搜索框', '1');

-- Insert i18n translation management translations
INSERT INTO ovwr_auth_i18n_translation (
    ovwr_translation_id, 
    ovwr_namespace, 
    ovwr_key, 
    ovwr_en_us, 
    ovwr_zh_cn, 
    ovwr_type, 
    ovwr_module,
    ovwr_section,
    ovwr_status
) VALUES 
('ovwr-trans-030', 'i18n', 'title', 'Translation Management', '多语言翻译管理', 'label', 'i18n', '页面标题', '1'),
('ovwr-trans-031', 'i18n', 'enUSLabel', 'English (US)', '英文（美国）', 'label', 'i18n', '字段标签', '1'),
('ovwr-trans-032', 'i18n', 'zhCNLabel', '中文（中国）', '简体中文', 'label', 'i18n', '字段标签', '1'),
('ovwr-trans-033', 'i18n', 'modifiedMark', 'Modified', '已修改', 'label', 'i18n', '状态标记', '1');

COMMIT;
