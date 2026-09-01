import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Dashboard from '@/views/Dashboard';
import InsurerList from '@/views/InsurerList';
import InsurerDetail from '@/views/InsurerDetail';
import InsurerForm from '@/views/InsurerForm';
import InsurerImport from '@/views/InsurerImport';
import InsurerDuplicate from '@/views/InsurerDuplicate';
import ProductList from '@/views/ProductList';
import ProductDetail from '@/views/ProductDetail';
import ProductForm from '@/views/ProductForm';
import I18nManagementView from '@/views/I18nManagementView';
import PermissionView from '@/views/PermissionView';

// Compliance Views
import AppointmentApplicationView from '@/views/AppointmentApplicationView';
import AppointmentNewView from '@/views/AppointmentNewView';
import AppointmentStatusTrackingView from '@/views/AppointmentStatusTrackingView';
import AppointmentRenewalView from '@/views/AppointmentRenewalView';
import AppointmentTerminationView from '@/views/AppointmentTerminationView';
import ComplianceInterceptorView from '@/views/ComplianceInterceptorView';
import ComplianceReportGeneratorView from '@/views/ComplianceReportGeneratorView';
import NIPRLicenseCheckView from '@/views/NIPRLicenseCheckView';
import LicenseExpiryReminderView from '@/views/LicenseExpiryReminderView';
import ComplianceRulesView from '@/views/ComplianceRulesView';
import OFACScreeningView from '@/views/OFACScreeningView';

// Finance Views
import FinanceDashboardView from '@/views/FinanceDashboardView';
import CommissionBillImportView from '@/views/CommissionBillImportView';
import BillParsingView from '@/views/BillParsingView';
import CommissionReconciliationView from '@/views/CommissionReconciliationView';
import DisputeManagementView from '@/views/DisputeManagementView';
import SettlementConfigView from '@/views/SettlementConfigView';
import PremiumReconciliationView from '@/views/PremiumReconciliationView';
import FinanceEnhancementView from '@/views/FinanceEnhancementView';
import BatchImportOptimizationView from '@/views/BatchImportOptimizationView';
import ResponsiveMobileAdaptationView from '@/views/ResponsiveMobileAdaptationView';
import PWAAvanceFeatureView from '@/views/PWAAvanceFeatureView';
import ChannelMasterView from '@/views/ChannelMasterView';
import ChannelHierarchyView from '@/views/ChannelHierarchyView';
import ChannelOnboardingView from '@/views/ChannelOnboardingView';
import ProductAuthView from '@/views/ProductAuthView';
import CommissionSchemeView from '@/views/CommissionSchemeView';
import ChannelCommissionSettlementView from '@/views/ChannelCommissionSettlementView';
import ChannelPerformanceView from '@/views/ChannelPerformanceView';
import ChannelTrainingView from '@/views/ChannelTrainingView';
import ChannelPortalView from '@/views/ChannelPortalView';
import ChannelAnalyticsView from '@/views/ChannelAnalyticsView';
import CooperationManagementView from '@/views/CooperationManagementView';

import RoleCreateView from '@/views/RoleCreateView';
import RoleEditView from '@/views/RoleEditView';
import UserCreateView from '@/views/UserCreateView';
import UserEditView from '@/views/UserEditView';
import RBACMatrixEditorView from '@/views/RBACMatrixEditorView';
import PermissionTemplateManagerView from '@/views/PermissionTemplateManagerView';
import DataExportGatewayView from '@/views/DataExportGatewayView';
import RealTimeNotificationsView from '@/views/RealTimeNotificationsView';
import ClaimReservingCalculatorView from '@/views/ClaimReservingCalculatorView';
import ReinsuranceOptimizerView from '@/views/ReinsuranceOptimizerView';
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
  | 'menu-permission'
  | 'data-permission'
  | 'operation-log'
  | 'login-log'
  
  // 🔴 Phase 2: Appointment & 合规模块
  | 'appointment-application'
  | 'appointment-new'
  | 'appointment-tracking'
  | 'appointment-renewal'
  | 'appointment-termination'
  | 'license-check'
  | 'compliance-rules'
  | 'ofac-screening'
  | 'compliance-interceptor'
  | 'compliance-report-generator'
  | 'license-expiry-reminder'
  
  // 🔵 Phase 4: 高级特性增强
  | 'batch-import-optimization'
  | 'responsive-mobile-adaptation'
  | 'pwa-advance-feature'
  
  // 🔵 Phase 5: 产品深度优化模块
  | 'rate-plan-engine'
  | 'actuarial-model-integration'
  | 'underwriting-rule-engine'
  | 'product-lifecycle-dashboard'
  | 'multi-currency-settlement';

interface AppState {
  currentView: ViewId;
  selectedCarrierId: string | null;
  selectedProductId: string | null;
  selectedUserId: string | null;
  selectedRoleId: string | null;
}

const VIEW_LABELS: Record<string, { crumbs: string[]; title: string }> = {
  dashboard: { crumbs: [], title: '总览' },
  'insurer-list': { crumbs: ['保险公司管理'], title: '保险公司列表' },
  'insurer-detail': { crumbs: ['保险公司管理', '保险公司列表'], title: '保险公司详情' },
  'insurer-new': { crumbs: ['保险公司管理', '保险公司列表'], title: '新增保险公司' },
  'insurer-edit': { crumbs: ['保险公司管理', '保险公司列表'], title: '编辑保险公司' },
  'insurer-import': { crumbs: ['保险公司管理', '保险公司列表'], title: '批量导入' },
  'insurer-duplicate': { crumbs: ['保险公司管理', '保险公司列表'], title: '重复数据检测' },
  'product-list': { crumbs: ['保险公司管理'], title: '产品管理' },
  'product-detail': { crumbs: ['保险公司管理', '产品管理'], title: '产品详情' },
  'product-new': { crumbs: ['保险公司管理', '产品管理'], title: '新增产品' },
  'product-edit': { crumbs: ['保险公司管理', '产品管理'], title: '编辑产品' },
  'cooperation': { crumbs: ['保险公司管理'], title: '合作管理' },
  'appointment': { crumbs: ['保险公司管理'], title: 'Appointment & 合规' },
  'finance': { crumbs: ['保险公司管理'], title: '财务与结算 Dashboard' },
  'insurer-analytics': { crumbs: ['保险公司管理'], title: '数据分析' },
  'channel-list': { crumbs: ['渠道管理'], title: '渠道列表' },
  'channel-hierarchy': { crumbs: ['渠道管理'], title: '渠道层级' },
  'channel-onboarding': { crumbs: ['渠道管理'], title: '入驻管理' },
  'product-auth': { crumbs: ['渠道管理'], title: '产品授权' },
  'commission-scheme': { crumbs: ['渠道管理'], title: '佣金方案' },
  'commission-settlement': { crumbs: ['渠道管理'], title: '佣金结算' },
  'channel-performance': { crumbs: ['渠道管理'], title: '绩效考核' },
  'channel-training': { crumbs: ['渠道管理'], title: '培训认证' },
  'channel-portal': { crumbs: ['渠道管理'], title: '渠道门户' },
  'channel-analytics': { crumbs: ['渠道管理'], title: '渠道分析' },
  'i18n-management': { crumbs: ['系统设置'], title: '界面文案管理' },
  // 🔴 Phase 0: 权限管理模块
  'permission-management': { crumbs: ['系统设置', '权限管理'], title: '权限管理' },
  'role-list': { crumbs: ['系统设置', '权限管理', '角色管理'], title: '角色管理' },
  'role-create': { crumbs: ['系统设置', '权限管理', '角色管理'], title: '新建角色' },
  'role-edit': { crumbs: ['系统设置', '权限管理', '角色管理'], title: '编辑角色' },
  'user-list': { crumbs: ['系统设置', '权限管理', '用户管理'], title: '用户管理' },
  'user-create': { crumbs: ['系统设置', '权限管理', '用户管理'], title: '新建用户' },
  'user-edit': { crumbs: ['系统设置', '权限管理', '用户管理'], title: '编辑用户' },
  'menu-permission': { crumbs: ['系统设置', '权限管理', '菜单权限'], title: '菜单权限配置' },
  'data-permission': { crumbs: ['系统设置', '权限管理', '数据权限'], title: '数据权限配置' },
  'operation-log': { crumbs: ['系统设置', '权限管理', '操作日志'], title: '操作日志审计' },
  'login-log': { crumbs: ['系统设置', '权限管理', '登录日志'], title: '登录日志审计' },
};

export default function App() {
  const [state, setState] = useState<AppState>(() => ({
    currentView: 'dashboard',
    selectedCarrierId: null,
    selectedProductId: null,
    selectedUserId: null,
    selectedRoleId: null,
  }));

  // URL 同步
  useEffect(() => {
    const syncUrl = () => {
      let path = '/';
      if (state.currentView === 'insurer-list') path = '/insurers-list';
      else if (state.currentView === 'insurer-detail' && state.selectedCarrierId) path = `/insurer-detail/${state.selectedCarrierId}`;
      else if (state.currentView === 'insurer-new') path = '/insurer-new';
      else if (state.currentView === 'insurer-edit' && state.selectedCarrierId) path = `/insurer-edit/${state.selectedCarrierId}`;
      else if (state.currentView === 'product-list') path = '/product-list';
      else if (state.currentView === 'product-detail' && state.selectedProductId) path = `/product-detail/${state.selectedProductId}`;
      else if (state.currentView === 'cooperation') path = '/cooperation';
      else if (state.currentView === 'appointment') path = '/appointment';
      else if (state.currentView === 'ofac-screening') path = '/ofac-screening';
      else if (state.currentView === 'finance-dashboard') path = '/finance/dashboard';
      else if (state.currentView === 'finance-bill-import') path = '/finance/bills/import';
      else if (state.currentView === 'finance-bill-parsing') path = '/finance/bills/parsing';
      else if (state.currentView === 'finance-reconciliation') path = '/finance/reconciliation';
      else if (state.currentView === 'finance-disputes') path = '/finance/disputes';
      else if (state.currentView === 'finance-settlement-config') path = '/finance/settings';
      else if (state.currentView === 'finance-premium-recon') path = '/finance/premiums/reconciliation';
      else if (state.currentView === 'insurer-analytics') path = '/insurer-analytics';
      else if (state.currentView === 'channel-list') path = '/channel-list';
      else if (state.currentView === 'channel-master') path = '/channel-master';
      else if (state.currentView === 'channel-hierarchy') path = '/channel-hierarchy';
      else if (state.currentView === 'channel-onboarding') path = '/channel-onboarding';
      else if (state.currentView === 'product-auth') path = '/product-auth';
      else if (state.currentView === 'commission-scheme') path = '/commission-scheme';
      else if (state.currentView === 'commission-settlement') path = '/commission-settlement';
      else if (state.currentView === 'channel-performance') path = '/channel-performance';
      else if (state.currentView === 'channel-training') path = '/channel-training';
      else if (state.currentView === 'channel-portal') path = '/channel-portal';
      else if (state.currentView === 'channel-analytics') path = '/channel-analytics';
      else if (state.currentView === 'i18n-management') path = '/i18n-management';
      // 🔴 Phase 0: 权限管理模块路径
      else if (state.currentView === 'permission-management') path = '/permission-management';
      else if (state.currentView === 'role-list') path = '/permission/roles';
      else if (state.currentView === 'role-create') path = '/permission/roles/create';
      else if (state.currentView === 'role-edit') path = '/permission/roles/edit';
      else if (state.currentView === 'user-list') path = '/permission/users';
      else if (state.currentView === 'user-create') path = '/permission/users/create';
      else if (state.currentView === 'user-edit') path = '/permission/users/edit';
      else if (state.currentView === 'menu-permission') path = '/permission/menus';
      else if (state.currentView === 'data-permission') path = '/permission/data';
      else if (state.currentView === 'operation-log') path = '/permission/logs/operation';
      else if (state.currentView === 'login-log') path = '/permission/logs/login';
      
      // 🟢 Phase 2: Appointment & 合规模块路径
      else if (state.currentView === 'appointment-application') path = '/appointment';
      else if (state.currentView === 'compliance-interceptor') path = '/compliance-interceptor';
      else if (state.currentView === 'compliance-report-generator') path = '/compliance-report-generator';
      else if (state.currentView === 'license-expiry-reminder') path = '/license-expiry-reminder';
      
      window.history.replaceState({}, '', path);
    };
    
    syncUrl();
  }, [state.currentView, state.selectedCarrierId, state.selectedProductId]);

  // Back button support
  useEffect(() => {
    const handlePopState = () => {
      // Simplified: reset to dashboard for now
      setState(prev => ({ ...prev, currentView: 'dashboard' }));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view: ViewId, params?: { carrierId?: string; productId?: string; userId?: string }) => {
    if (params?.carrierId) {
      setState(prev => ({ ...prev, selectedCarrierId: params.carrierId || null, currentView: view }));
    } else if (params?.productId) {
      setState(prev => ({ ...prev, selectedProductId: params.productId || null, currentView: view }));
    } else if (params?.userId) {
      setState(prev => ({ ...prev, selectedUserId: params.userId || null, currentView: view }));
    } else {
      setState(prev => ({ ...prev, currentView: view }));
    }
    window.scrollTo(0, 0);
  };

  const info = VIEW_LABELS[state.currentView] ?? { crumbs: [], title: state.currentView };

  const renderView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard navigateTo={navigateTo} />;
      
      case 'insurer-list':
        return <InsurerList navigateTo={navigateTo} />;

      case 'insurer-detail':
        return <InsurerDetail carrierId={state.selectedCarrierId || 'c1001'} navigateTo={navigateTo} />;

      case 'insurer-new':
        return <InsurerForm mode="create" navigateTo={navigateTo} />;

      case 'insurer-edit':
        return <InsurerForm mode="edit" carrierId={state.selectedCarrierId || ''} navigateTo={navigateTo} />;

      case 'insurer-import':
        return <InsurerImport navigateTo={navigateTo} />;

      case 'insurer-duplicate':
        return <InsurerDuplicate navigateTo={navigateTo} />;

      case 'user-create':
        return <UserCreateView navigateTo={navigateTo} />;

      case 'user-edit':
        return <UserEditView userId={state.selectedUserId || ''} navigateTo={navigateTo} />;

      case 'product-list':
        return <ProductList navigateTo={navigateTo} />;

      case 'product-detail':
        return <ProductDetail productId={state.selectedProductId || 'p1'} navigateTo={navigateTo} />;

      case 'product-new':
        return <ProductForm onBackToList={() => navigateTo('product-list')} />;

      case 'product-edit':
        return <ProductForm productId={state.selectedProductId || ''} onBackToList={() => navigateTo('product-list')} />;
      
      // 🔴 Phase 1: Cooperation Management (Unified View)
      case 'cooperation':
        return <CooperationManagementView navigateTo={navigateTo} />;
      case 'finance-dashboard': // Legacy redirect
        return <FinanceDashboardView navigateTo={navigateTo} />;
      // 🔵 Phase 2: Appointment & Compliance Unified View
      case 'appointment':
        return <AppointmentApplicationView navigateTo={navigateTo} />;
      
      case 'finance-bill-import':
        return <CommissionBillImportView navigateTo={navigateTo} />;

      case 'finance-bill-parsing':
        return <BillParsingView navigateTo={navigateTo} />;

      case 'finance-reconciliation':
        return <CommissionReconciliationView navigateTo={navigateTo} />;

      case 'finance-disputes':
        return <DisputeManagementView navigateTo={navigateTo} />;

      case 'finance-settlement-config':
        return <SettlementConfigView navigateTo={navigateTo} />;

      case 'finance-premium-recon':
        return <PremiumReconciliationView navigateTo={navigateTo} />;

      case 'finance-enhancement':
        return <FinanceEnhancementView navigateTo={navigateTo} />;

      case 'batch-import-optimization':
        return <BatchImportOptimizationView navigateTo={navigateTo} />;

      case 'responsive-mobile-adaptation':
        return <ResponsiveMobileAdaptationView navigateTo={navigateTo} />;

      case 'pwa-advance-feature':
        return <PWAAvanceFeatureView navigateTo={navigateTo} />;
      case 'channel-list':
        return <div className="text-center py-20 text-[#717786]" style={{ padding: '80px 20px' }}>
          <h2 className="text-xl font-semibold mb-2">此功能模块正在开发中</h2>
          <p>敬请期待...</p>
          <button className="btn-primary mt-6" onClick={() => navigateTo('dashboard')}>返回首页</button>
        </div>;

      case 'channel-master':
        return <ChannelMasterView navigateTo={navigateTo} />;

      case 'i18n-management':
        return <I18nManagementView navigateTo={navigateTo} />;

      case 'permission-management':
        return <PermissionView navigateTo={navigateTo} />;

      case 'role-edit':
        return <RoleEditView roleId={state.selectedRoleId || ''} navigateTo={navigateTo} />;

      case 'channel-hierarchy':
        return <ChannelHierarchyView navigateTo={navigateTo} />
      case 'channel-onboarding':
        return <ChannelOnboardingView navigateTo={navigateTo} />
      case 'product-auth':
        return <ProductAuthView navigateTo={navigateTo} />
      case 'commission-scheme':
        return <CommissionSchemeView navigateTo={navigateTo} />
      case 'commission-settlement':
        return <ChannelCommissionSettlementView navigateTo={navigateTo} />

      case 'channel-performance':
        return <ChannelPerformanceView navigateTo={navigateTo} />

      case 'channel-training':
        return <ChannelTrainingView navigateTo={navigateTo} />

      case 'channel-portal':
        return <ChannelPortalView navigateTo={navigateTo} />

      case 'channel-analytics':
        return <ChannelAnalyticsView navigateTo={navigateTo} />

      default:
        return (
          <div className="text-center py-20 text-[#717786]">
            <h2 className="text-xl font-semibold">Unknown View</h2>
            <p>{String(state.currentView)}</p>
          </div>
        );
    }
  };

  return (
    <Layout 
      children={renderView()}
      currentView={state.currentView}
      navigateTo={navigateTo}
    />
  );
}
