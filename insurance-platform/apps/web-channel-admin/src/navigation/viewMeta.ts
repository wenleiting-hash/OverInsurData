// 导航元数据：ViewId 类型 + 视图标签（面包屑/标题）
// 独立叶子模块，避免 App ↔ TopBar 循环依赖（App → Layout → TopBar → App）

export type ViewId =
  | 'dashboard'
  | 'channel-list'
  | 'channel-new'
  | 'channel-edit'
  | 'channel-master'
  | 'channel-hierarchy'
  | 'channel-onboarding'
  | 'product-auth'
  | 'commission-scheme'
  | 'commission-settlement'
  | 'channel-performance'
  | 'channel-training'
  | 'channel-portal'
  | 'channel-analytics'
  | 'i18n-management'
  | 'permission-management'
  | 'role-list'
  | 'role-create'
  | 'role-edit'
  | 'user-list'
  | 'department-management'
  | 'integration-apps';

export interface ViewMeta {
  crumbs: string[];
  title: string;
}

export const VIEW_LABELS: Record<string, ViewMeta> = {
  dashboard: { crumbs: [], title: 'nav.overview' },
  'channel-list': { crumbs: ['nav.channelMgmt'], title: 'nav.channelList' },
  'channel-new': { crumbs: ['nav.channelMgmt', 'nav.channelList'], title: 'nav.newChannel' },
  'channel-edit': { crumbs: ['nav.channelMgmt', 'nav.channelList'], title: 'nav.editChannel' },
  'channel-master': { crumbs: ['nav.channelMgmt'], title: 'nav.channelMasterData' },
  'channel-hierarchy': { crumbs: ['nav.channelMgmt'], title: 'nav.channelHierarchy' },
  'channel-onboarding': { crumbs: ['nav.channelMgmt'], title: 'nav.onboardingMgmt' },
  'product-auth': { crumbs: ['nav.channelMgmt'], title: 'nav.productAuth' },
  'commission-scheme': { crumbs: ['nav.channelMgmt'], title: 'nav.commissionScheme' },
  'commission-settlement': { crumbs: ['nav.channelMgmt'], title: 'nav.commissionSettlement' },
  'channel-performance': { crumbs: ['nav.channelMgmt'], title: 'nav.performanceReview' },
  'channel-training': { crumbs: ['nav.channelMgmt'], title: 'nav.trainingCertification' },
  'channel-portal': { crumbs: ['nav.channelMgmt'], title: 'nav.channelPortal' },
  'channel-analytics': { crumbs: ['nav.channelMgmt'], title: 'nav.channelAnalytics' },
  'i18n-management': { crumbs: ['nav.systemSettings'], title: 'nav.i18nManagement' },
  'permission-management': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt'], title: 'nav.permissionMgmt' },
  'role-list': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.roleMgmt' },
  'role-create': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.newRole' },
  'role-edit': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.editRole' },
  'user-list': { crumbs: ['nav.systemSettings'], title: 'nav.userMgmt' },
  'department-management': { crumbs: ['nav.systemSettings'], title: 'menu.departmentManagement' },
  'integration-apps': { crumbs: ['nav.systemSettings'], title: 'menu.integrationApps' },
};
