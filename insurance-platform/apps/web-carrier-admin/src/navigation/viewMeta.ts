// 导航元数据：ViewId 类型 + 视图标签（面包屑/标题）
// 独立叶子模块，避免 App ↔ TopBar 循环依赖（App → Layout → TopBar → App）

export type ViewId =
  | 'dashboard'
  | 'insurer-list'
  | 'insurer-detail'
  | 'insurer-new'
  | 'insurer-edit'
  | 'insurer-import'
  | 'insurer-duplicate'
  | 'product-list'
  | 'product-detail'
  | 'product-new'
  | 'product-edit'
  | 'cooperation'
  | 'appointment'
  | 'finance-dashboard'
  | 'finance-bill-import'
  | 'finance-bill-parsing'
  | 'finance-reconciliation'
  | 'finance-disputes'
  | 'finance-settlement-config'
  | 'finance-premium-recon'
  | 'finance-enhancement'
  | 'insurer-analytics'
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
  // 🔴 Phase 0: 权限管理模块（P0 最高优先级）
  | 'permission-management'
  | 'role-list'
  | 'role-create'
  | 'role-edit'
  | 'user-list'
  | 'user-create'
  | 'user-edit'
  | 'department-management'
  | 'menu-permission'
  | 'data-permission'
  | 'operation-log'
  | 'login-log'
  | 'integration-apps'
  | 'dictionary-manage'

  // 🔴 Phase 2: Appointment 模块
  | 'appointment-application'
  | 'appointment-new'
  | 'appointment-tracking'
  | 'appointment-renewal'
  | 'appointment-termination';

export interface ViewMeta {
  crumbs: string[];
  title: string;
}

export const VIEW_LABELS: Record<string, ViewMeta> = {
  dashboard: { crumbs: [], title: 'nav.overview' },
  'insurer-list': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.insurerList' },
  'insurer-detail': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.insurerList'], title: 'nav.insuranceCarrierDetail' },
  'insurer-new': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.insurerList'], title: 'nav.newInsuranceCarrier' },
  'insurer-edit': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.insurerList'], title: 'nav.editInsuranceCarrier' },
  'insurer-import': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.insurerList'], title: 'nav.bulkImport' },
  'insurer-duplicate': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.insurerList'], title: 'nav.duplicateDetection' },
  'product-list': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.productMgmt' },
  'product-detail': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.productMgmt'], title: 'nav.productDetail' },
  'product-new': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.productMgmt'], title: 'nav.newProduct' },
  'product-edit': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.productMgmt'], title: 'nav.editProduct' },
  'cooperation': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.cooperationMgmt' },
  'appointment': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.appointmentCompliance' },
  'finance-dashboard': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.financeDashboard' },
  'finance-bill-import': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.commissionBillImport' },
  'finance-bill-parsing': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.billParsing' },
  'finance-reconciliation': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.commissionReconciliation' },
  'finance-disputes': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.disputeMgmt' },
  'finance-settlement-config': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.settlementConfig' },
  'finance-premium-recon': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.premiumReconciliation' },
  'finance-enhancement': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.financeSettlement'], title: 'nav.financeEnhancement' },
  'insurer-analytics': { crumbs: ['nav.insuranceCarrierMgmt'], title: 'nav.dataAnalytics' },
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
  // 🔴 Phase 0: 权限管理模块
  'permission-management': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt'], title: 'nav.permissionMgmt' },
  'role-list': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.roleMgmt' },
  'role-create': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.newRole' },
  'role-edit': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.roleMgmt'], title: 'nav.editRole' },
  'user-list': { crumbs: ['nav.systemSettings'], title: 'nav.userMgmt' },
  'department-management': { crumbs: ['nav.systemSettings'], title: 'menu.departmentManagement' },
  'integration-apps': { crumbs: ['nav.systemSettings'], title: 'menu.integrationApps' },
  'dictionary-manage': { crumbs: ['nav.systemSettings'], title: 'menu.dictionaryManage' },
  'user-create': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.userMgmt'], title: 'nav.newUser' },
  'user-edit': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.userMgmt'], title: 'nav.editUser' },
  'menu-permission': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.menuPermission'], title: 'nav.menuPermissionConfig' },
  'data-permission': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.dataPermission'], title: 'nav.dataPermissionConfig' },
  'operation-log': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.operationLog'], title: 'nav.operationLogAudit' },
  'login-log': { crumbs: ['nav.systemSettings', 'nav.permissionMgmt', 'nav.loginLog'], title: 'nav.loginLogAudit' },
  // Phase 2: Appointment 模块（补齐 App.tsx 既有 case 对应的面包屑）
  'appointment-new': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.appointmentCompliance'], title: 'nav.newAppointment' },
  'appointment-tracking': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.appointmentCompliance'], title: 'nav.statusTracking' },
  'appointment-renewal': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.appointmentCompliance'], title: 'nav.renewalMgmt' },
  'appointment-termination': { crumbs: ['nav.insuranceCarrierMgmt', 'nav.appointmentCompliance'], title: 'nav.terminationMgmt' },
};
