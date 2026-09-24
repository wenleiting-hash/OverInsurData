// 多语言管理视图的演示文案条目数据（被管理的条目本身含中英文文案值，与原型一致）
// UI 文案见 common.json 的 i18nMgmt 子树

export interface CopyEntry {
  id: string
  module: string
  section: string
  key: string
  en: string
  zh: string
  type: 'label' | 'button' | 'placeholder' | 'toast' | 'confirm' | 'validate' | 'error-page'
  toastVariant?: 'success' | 'error' | 'warning' | 'info'
  modified?: boolean
}

export const INITIAL_ENTRIES: CopyEntry[] = [
  // ── 通用操作 ──────────────────────────────────────────────────────────────
  { id: 'c01', module: 'common', section: '操作按钮', key: 'actions.save',       en: 'Save',            zh: '保存',         type: 'button' },
  { id: 'c02', module: 'common', section: '操作按钮', key: 'actions.cancel',     en: 'Cancel',          zh: '取消',         type: 'button' },
  { id: 'c03', module: 'common', section: '操作按钮', key: 'actions.confirm',    en: 'Confirm',         zh: '确认',         type: 'button' },
  { id: 'c04', module: 'common', section: '操作按钮', key: 'actions.delete',     en: 'Delete',          zh: '删除',         type: 'button' },
  { id: 'c05', module: 'common', section: '操作按钮', key: 'actions.export',     en: 'Export',          zh: '导出',         type: 'button' },
  { id: 'c06', module: 'common', section: '操作按钮', key: 'actions.import',     en: 'Import',          zh: '导入',         type: 'button' },
  { id: 'c07', module: 'common', section: '操作按钮', key: 'actions.edit',       en: 'Edit',            zh: '编辑',         type: 'button' },
  { id: 'c08', module: 'common', section: '操作按钮', key: 'actions.reset',      en: 'Reset',           zh: '重置',         type: 'button' },
  { id: 'c09', module: 'common', section: '状态标签', key: 'status.active',      en: 'Active',          zh: '活跃',         type: 'label' },
  { id: 'c10', module: 'common', section: '状态标签', key: 'status.inactive',    en: 'Inactive',        zh: '停用',         type: 'label' },
  { id: 'c11', module: 'common', section: '状态标签', key: 'status.pending',     en: 'Pending',         zh: '待处理',        type: 'label' },
  { id: 'c12', module: 'common', section: '状态标签', key: 'status.suspended',   en: 'Suspended',       zh: '已暂停',        type: 'label' },
  { id: 'c13', module: 'common', section: '搜索输入', key: 'search.placeholder', en: 'Search…',         zh: '搜索…',         type: 'placeholder' },
  // ── 渠道模块 ──────────────────────────────────────────────────────────────
  { id: 'd01', module: 'channel', section: '页面标题', key: 'list.title',         en: 'Channel List',    zh: '渠道列表',       type: 'label' },
  { id: 'd02', module: 'channel', section: '页面标题', key: 'form.addTitle',      en: 'Add Channel',     zh: '新增渠道',       type: 'label' },
  { id: 'd03', module: 'channel', section: '渠道类型', key: 'types.independent',  en: 'Independent Agency', zh: '独立代理',    type: 'label' },
  { id: 'd04', module: 'channel', section: '渠道类型', key: 'types.broker',       en: 'Broker',          zh: '经纪商',         type: 'label' },
  { id: 'd05', module: 'channel', section: '渠道类型', key: 'types.mga',          en: 'MGA',             zh: 'MGA',           type: 'label' },
  { id: 'd06', module: 'channel', section: '渠道类型', key: 'types.wholesale',    en: 'Wholesale Broker', zh: '批发经纪',      type: 'label' },
  { id: 'd07', module: 'channel', section: '表单字段', key: 'form.npnCode',       en: 'NPN Code',        zh: '全国生产者编号',   type: 'label' },
  { id: 'd08', module: 'channel', section: '表单字段', key: 'form.manager',       en: 'Account Manager', zh: '负责人',         type: 'label' },
  { id: 'd09', module: 'channel', section: '表单字段', key: 'form.region',        en: 'Region',          zh: '所属大区',        type: 'label' },
  { id: 'd10', module: 'channel', section: '表单字段', key: 'form.tier',          en: 'Tier',            zh: '渠道等级',        type: 'label' },
  { id: 'd11', module: 'channel', section: '渠道等级', key: 'tier.platinum',      en: 'Platinum',        zh: '铂金',           type: 'label' },
  { id: 'd12', module: 'channel', section: '渠道等级', key: 'tier.gold',          en: 'Gold',            zh: '金级',           type: 'label' },
  { id: 'd13', module: 'channel', section: '渠道等级', key: 'tier.silver',        en: 'Silver',          zh: '银级',           type: 'label' },
  // ── 保险公司模块 ──────────────────────────────────────────────────────────
  { id: 'i01', module: 'carrier', section: '页面标题', key: 'list.title',         en: 'Insurer Management', zh: '保险公司管理',   type: 'label' },
  { id: 'i02', module: 'carrier', section: '页面标题', key: 'form.addTitle',      en: 'Add Insurer',     zh: '新增保险公司',     type: 'label' },
  { id: 'i03', module: 'carrier', section: '表单字段', key: 'form.naicCode',      en: 'NAIC Code',       zh: 'NAIC 编码',      type: 'label' },
  { id: 'i04', module: 'carrier', section: '表单字段', key: 'form.amBest',        en: 'AM Best Rating',  zh: 'AM Best 评级',   type: 'label' },
  { id: 'i05', module: 'carrier', section: '公司类型', key: 'types.admitted',     en: 'Admitted',        zh: '已获准',          type: 'label' },
  { id: 'i06', module: 'carrier', section: '公司类型', key: 'types.nonadmitted',  en: 'Non-Admitted',    zh: '非已获准',         type: 'label' },
  // ── 佣金模块 ──────────────────────────────────────────────────────────────
  { id: 'k01', module: 'commission', section: '页面标题', key: 'scheme.title',    en: 'Commission Scheme', zh: '佣金方案',       type: 'label' },
  { id: 'k02', module: 'commission', section: '页面标题', key: 'settlement.title',en: 'Settlement',      zh: '佣金结算',        type: 'label' },
  { id: 'k03', module: 'commission', section: '表单字段', key: 'form.rate',       en: 'Commission Rate', zh: '佣金率',          type: 'label' },
  { id: 'k04', module: 'commission', section: '表单字段', key: 'form.cycle',      en: 'Settlement Cycle', zh: '结算周期',       type: 'label' },
  // ── 提示消息 — 成功 ───────────────────────────────────────────────────────
  { id: 't01', module: 'toast', section: '成功提示', key: 'success.saved',        en: 'Saved successfully', zh: '保存成功',      type: 'toast', toastVariant: 'success' },
  { id: 't02', module: 'toast', section: '成功提示', key: 'success.submitted',    en: 'Submitted successfully', zh: '提交成功',  type: 'toast', toastVariant: 'success' },
  { id: 't03', module: 'toast', section: '成功提示', key: 'success.deleted',      en: 'Deleted successfully', zh: '删除成功',    type: 'toast', toastVariant: 'success' },
  { id: 't04', module: 'toast', section: '成功提示', key: 'success.exported',     en: 'Export complete',  zh: '导出完成',        type: 'toast', toastVariant: 'success' },
  { id: 't05', module: 'toast', section: '成功提示', key: 'success.imported',     en: '$count records imported', zh: '已导入 $count 条记录', type: 'toast', toastVariant: 'success' },
  // ── 提示消息 — 错误 ───────────────────────────────────────────────────────
  { id: 't06', module: 'toast', section: '错误提示', key: 'error.saveFailed',     en: 'Failed to save. Please try again.', zh: '保存失败，请重试',   type: 'toast', toastVariant: 'error' },
  { id: 't07', module: 'toast', section: '错误提示', key: 'error.loadFailed',     en: 'Failed to load data',  zh: '数据加载失败',          type: 'toast', toastVariant: 'error' },
  { id: 't08', module: 'toast', section: '错误提示', key: 'error.unauthorized',   en: "You don't have permission", zh: '您没有操作权限',    type: 'toast', toastVariant: 'error' },
  { id: 't09', module: 'toast', section: '错误提示', key: 'error.networkError',   en: 'Network error. Check your connection.', zh: '网络错误，请检查连接', type: 'toast', toastVariant: 'error' },
  // ── 提示消息 — 警告 ───────────────────────────────────────────────────────
  { id: 't10', module: 'toast', section: '警告提示', key: 'warning.unsaved',      en: 'You have unsaved changes', zh: '有未保存的修改',         type: 'toast', toastVariant: 'warning' },
  { id: 't11', module: 'toast', section: '警告提示', key: 'warning.expiringSoon', en: 'License expiring in $days days', zh: '执照将在 $days 天后到期', type: 'toast', toastVariant: 'warning' },
  // ── 提示消息 — 信息 ───────────────────────────────────────────────────────
  { id: 't12', module: 'toast', section: '信息提示', key: 'info.sessionExpiry',   en: 'Session expires in 15 min', zh: '会话将在 15 分钟后过期', type: 'toast', toastVariant: 'info' },
  { id: 't13', module: 'toast', section: '信息提示', key: 'info.processing',      en: 'Processing, please wait…', zh: '处理中，请稍候…',       type: 'toast', toastVariant: 'info' },
  // ── 确认弹窗 ──────────────────────────────────────────────────────────────
  { id: 'm01', module: 'modal', section: '确认弹窗', key: 'confirm.deleteChannel.title',  en: 'Delete Channel?',  zh: '确认删除渠道？', type: 'confirm' },
  { id: 'm02', module: 'modal', section: '确认弹窗', key: 'confirm.deleteChannel.body',   en: 'This will permanently delete "$name" and all sub-channels. This cannot be undone.', zh: '此操作将永久删除「$name」及其所有子渠道，无法撤销。', type: 'confirm' },
  { id: 'm03', module: 'modal', section: '确认弹窗', key: 'confirm.disableInsurer.title', en: 'Disable Insurer?', zh: '确认停用保险公司？', type: 'confirm' },
  { id: 'm04', module: 'modal', section: '确认弹窗', key: 'confirm.disableInsurer.body',  en: 'Disabling "$name" will suspend all active products and appointments.', zh: '停用「$name」将暂停其所有活跃产品和 Appointment。', type: 'confirm' },
  { id: 'm05', module: 'modal', section: '确认弹窗', key: 'confirm.logout.title',         en: 'Sign Out?',        zh: '确认退出登录？', type: 'confirm' },
  { id: 'm06', module: 'modal', section: '确认弹窗', key: 'confirm.logout.body',          en: 'Any unsaved changes will be lost.',  zh: '未保存的修改将会丢失。', type: 'confirm' },
  // ── 表单校验 ──────────────────────────────────────────────────────────────
  { id: 'v01', module: 'validate', section: '必填校验', key: 'required',           en: 'This field is required',        zh: '此字段为必填项',           type: 'validate' },
  { id: 'v02', module: 'validate', section: '必填校验', key: 'nameRequired',       en: 'Name is required',              zh: '名称不能为空',              type: 'validate' },
  { id: 'v03', module: 'validate', section: '格式校验', key: 'emailInvalid',       en: 'Please enter a valid email',    zh: '请输入有效的邮箱地址',        type: 'validate' },
  { id: 'v04', module: 'validate', section: '格式校验', key: 'npnFormat',          en: 'NPN must be 8–10 digits',       zh: 'NPN 编码须为 8–10 位数字',   type: 'validate' },
  { id: 'v05', module: 'validate', section: '格式校验', key: 'rateRange',          en: 'Rate must be between 0–100%',   zh: '费率须在 0–100% 范围内',      type: 'validate' },
  { id: 'v06', module: 'validate', section: '长度校验', key: 'maxLength',          en: 'Maximum $max characters',       zh: '最多 $max 个字符',            type: 'validate' },
  { id: 'v07', module: 'validate', section: '长度校验', key: 'minLength',          en: 'Minimum $min characters',       zh: '至少 $min 个字符',            type: 'validate' },
  // ── 错误页面 ──────────────────────────────────────────────────────────────
  { id: 'e01', module: 'error-page', section: '错误页面', key: 'notFound.title',   en: 'Page Not Found',  zh: '页面不存在',      type: 'error-page' },
  { id: 'e02', module: 'error-page', section: '错误页面', key: 'notFound.body',    en: "The page you're looking for doesn't exist or has been moved.", zh: '您访问的页面不存在或已被移动。', type: 'error-page' },
  { id: 'e03', module: 'error-page', section: '错误页面', key: 'serverError.title',en: 'Something went wrong', zh: '系统出现错误',  type: 'error-page' },
  { id: 'e04', module: 'error-page', section: '错误页面', key: 'serverError.body', en: 'Our team has been notified. Please try again in a moment.', zh: '技术团队已收到通知，请稍后重试。', type: 'error-page' },
  { id: 'e05', module: 'error-page', section: '错误页面', key: 'noPermission.title',en: 'Access Denied',   zh: '无访问权限',     type: 'error-page' },
]
