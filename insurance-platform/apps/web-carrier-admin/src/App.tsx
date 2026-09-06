import { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query-config';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import { VIEW_LABELS } from '@/navigation/viewMeta';
import type { ViewId } from '@/navigation/viewMeta';
import { useRTLManager } from '@/hooks/useRTLManager';

// 视图按需加载（代码分割）：启动只加载 Layout + Dashboard，
// 各模块视图在导航到时才拉取，隔离非当前模块的存量问题
const Dashboard = lazy(() => import('@/views/Dashboard'));
const InsurerList = lazy(() => import('@/views/InsurerList'));
const InsurerDetail = lazy(() => import('@/views/InsurerDetail'));
const InsurerForm = lazy(() => import('@/views/InsurerForm'));
const InsurerImport = lazy(() => import('@/views/InsurerImport'));
const InsurerDuplicate = lazy(() => import('@/views/InsurerDuplicate'));
const ProductList = lazy(() => import('@/views/ProductList'));
const ProductDetail = lazy(() => import('@/views/ProductDetail'));
const ProductForm = lazy(() => import('@/views/ProductForm'));
const I18nManagementView = lazy(() => import('@/views/I18nManagementView'));
const PermissionView = lazy(() => import('@/views/PermissionView'));
const RoleListView = lazy(() => import('@/views/RoleListView'));
const UserListView = lazy(() => import('@/views/UserListView'));

// Compliance Views
const AppointmentApplicationView = lazy(() => import('@/views/AppointmentApplicationView'));
const AppointmentNewView = lazy(() => import('@/views/AppointmentNewView'));
const AppointmentStatusTrackingView = lazy(() => import('@/views/AppointmentStatusTrackingView'));
const AppointmentRenewalView = lazy(() => import('@/views/AppointmentRenewalView'));
const AppointmentTerminationView = lazy(() => import('@/views/AppointmentTerminationView'));
const ComplianceInterceptorView = lazy(() => import('@/views/ComplianceInterceptorView'));
const ComplianceReportGeneratorView = lazy(() => import('@/views/ComplianceReportGeneratorView'));
const NIPRLicenseCheckView = lazy(() => import('@/views/NIPRLicenseCheckView'));
const LicenseExpiryReminderView = lazy(() => import('@/views/LicenseExpiryReminderView'));
const ComplianceRulesView = lazy(() => import('@/views/ComplianceRulesView'));
const OFACScreeningView = lazy(() => import('@/views/OFACScreeningView'));
const ComplianceDashboardView = lazy(() => import('@/views/ComplianceDashboardView'));

// Finance Views
const FinanceDashboardView = lazy(() => import('@/views/FinanceDashboardView'));
const CommissionBillImportView = lazy(() => import('@/views/CommissionBillImportView'));
const BillParsingView = lazy(() => import('@/views/BillParsingView'));
const CommissionReconciliationView = lazy(() => import('@/views/CommissionReconciliationView'));
const DisputeManagementView = lazy(() => import('@/views/DisputeManagementView'));
const SettlementConfigView = lazy(() => import('@/views/SettlementConfigView'));
const PremiumReconciliationView = lazy(() => import('@/views/PremiumReconciliationView'));
const FinanceEnhancementView = lazy(() => import('@/views/FinanceEnhancementView'));
const ChannelMasterView = lazy(() => import('@/views/ChannelMasterView'));
const ChannelList = lazy(() => import('@/views/ChannelList'));
const ChannelNewView = lazy(() => import('@/views/ChannelNewView'));
const ChannelHierarchyView = lazy(() => import('@/views/ChannelHierarchyView'));
const ChannelOnboardingView = lazy(() => import('@/views/ChannelOnboardingView'));
const ProductAuthView = lazy(() => import('@/views/ProductAuthView'));
const CommissionSchemeView = lazy(() => import('@/views/CommissionSchemeView'));
const CommissionSettlementView = lazy(() => import('@/views/CommissionSettlementView'));
const ChannelPerformanceView = lazy(() => import('@/views/ChannelPerformanceView'));
const ChannelTrainingView = lazy(() => import('@/views/ChannelTrainingView'));
const ChannelPortalView = lazy(() => import('@/views/ChannelPortalView'));
const ChannelAnalyticsView = lazy(() => import('@/views/ChannelAnalyticsView'));
const CooperationManagementView = lazy(() => import('@/views/CooperationManagementView'));

// Analytics Views
const InsurerAnalyticsView = lazy(() => import('@/views/InsurerAnalyticsView'));

const RoleCreateView = lazy(() => import('@/views/RoleCreateView'));
const RoleEditView = lazy(() => import('@/views/RoleEditView'));
const UserCreateView = lazy(() => import('@/views/UserCreateView'));
const UserEditView = lazy(() => import('@/views/UserEditView'));

interface AppState {
  currentView: ViewId;
  selectedCarrierId: string | null;
  selectedProductId: string | null;
  selectedUserId: string | null;
  selectedRoleId: string | null;
  selectedChannelId: string | null;
}

// ViewId 类型抽离至 navigation/viewMeta（独立叶子模块，避免 App↔TopBar 循环依赖）
// 此处 re-export 保持全仓 type-only import 兼容
export type { ViewId } from '@/navigation/viewMeta';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Internal component that uses auth context
function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Initialize RTL direction manager
  useRTLManager();

  // ✅ CRITICAL FIX: All hooks must be at top level BEFORE any conditional returns
  // useState/useEffect MUST be called before the if (isLoading) and if (!isAuthenticated) checks
  const [state, setState] = useState<AppState>(() => ({
    currentView: 'dashboard',
    selectedCarrierId: null,
    selectedProductId: null,
    selectedUserId: null,
    selectedRoleId: null,
    selectedChannelId: null,
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
      else if (state.currentView === 'appointment-new') path = '/appointment/new';
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
      else if (state.currentView === 'channel-new') path = '/channel-list/new';
      else if (state.currentView === 'channel-edit' && state.selectedChannelId) path = '/channel-list/edit';
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
      else if (state.currentView === 'appointment-tracking') path = '/appointment/tracking';
      else if (state.currentView === 'appointment-renewal') path = '/appointment/renewal';
      else if (state.currentView === 'appointment-termination') path = '/appointment/termination';
      else if (state.currentView === 'license-check') path = '/compliance/license-check';
      else if (state.currentView === 'compliance-rules') path = '/compliance/rules';
      else if (state.currentView === 'compliance-dashboard') path = '/compliance-dashboard';
      else if (state.currentView === 'compliance-interceptor') path = '/compliance-interceptor';
      else if (state.currentView === 'compliance-report-generator') path = '/compliance-report-generator';
      else if (state.currentView === 'license-expiry-reminder') path = '/license-expiry-reminder';

      window.history.replaceState({}, '', path);
    };
    
    syncUrl();
  }, [state.currentView, state.selectedCarrierId, state.selectedProductId, state.selectedChannelId]);

  // ✅ ALL useEffects MUST be at top level (before any early returns)
  // Back button support
  useEffect(() => {
    const handlePopState = () => {
      setState(prev => ({ ...prev, currentView: 'dashboard' }));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ✅ CRITICAL: Early returns MUST be AFTER all hooks (useState/useEffect) are called
  // Loading state during initial auth check - moved AFTER useState/useEffect
  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[#0058BC] text-lg font-semibold">Loading...</div>
        </div>
      </QueryClientProvider>
    );
  }

  // Redirect to login if not authenticated - moved AFTER useState/useEffect
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigateTo = (view: ViewId, params?: { carrierId?: string; productId?: string; userId?: string; channelId?: string }) => {
    if (params?.carrierId) {
      setState(prev => ({ ...prev, selectedCarrierId: params.carrierId || null, currentView: view }));
    } else if (params?.productId) {
      setState(prev => ({ ...prev, selectedProductId: params.productId || null, currentView: view }));
    } else if (params?.userId) {
      setState(prev => ({ ...prev, selectedUserId: params.userId || null, currentView: view }));
    } else if (params?.channelId) {
      setState(prev => ({ ...prev, selectedChannelId: params.channelId || null, currentView: view }));
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

      case 'appointment-new':
        return <AppointmentNewView navigateTo={navigateTo} />;

      case 'compliance-dashboard':
        return <ComplianceDashboardView navigateTo={navigateTo} />;

      case 'appointment-tracking':
        return <AppointmentStatusTrackingView navigateTo={navigateTo} />;

      case 'appointment-renewal':
        return <AppointmentRenewalView navigateTo={navigateTo} />;

      case 'appointment-termination':
        return <AppointmentTerminationView navigateTo={navigateTo} />;

      case 'license-check':
        return <NIPRLicenseCheckView navigateTo={navigateTo} />;

      case 'compliance-rules':
        return <ComplianceRulesView navigateTo={navigateTo} />;

      case 'ofac-screening':
        return <OFACScreeningView navigateTo={navigateTo} />;

      case 'compliance-interceptor':
        return <ComplianceInterceptorView navigateTo={navigateTo} />;

      case 'compliance-report-generator':
        return <ComplianceReportGeneratorView navigateTo={navigateTo} />;

      case 'license-expiry-reminder':
        return <LicenseExpiryReminderView navigateTo={navigateTo} />;
      
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

      case 'channel-list':
        return <ChannelList navigateTo={navigateTo} />;
      case 'channel-new':
        return <ChannelNewView navigateTo={navigateTo} />;
      case 'channel-edit':
        return <ChannelNewView navigateTo={navigateTo} channelId={state.selectedChannelId || ''} />;

      case 'channel-master':
        return <ChannelMasterView navigateTo={navigateTo} />;

      case 'i18n-management':
        return <I18nManagementView navigateTo={navigateTo} />;

      case 'permission-management':
        return <PermissionView navigateTo={navigateTo} />;

      case 'role-list':
        return <RoleListView navigateTo={navigateTo} />;

      case 'role-create':
        return <RoleCreateView navigateTo={navigateTo} />;

      case 'user-list':
        return <UserListView navigateTo={navigateTo} />;

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
        return <CommissionSettlementView navigateTo={navigateTo} />

      case 'channel-performance':
        return <ChannelPerformanceView navigateTo={navigateTo} />

      case 'channel-training':
        return <ChannelTrainingView navigateTo={navigateTo} />

      case 'channel-portal':
        return <ChannelPortalView />

      case 'channel-analytics':
        return <ChannelAnalyticsView navigateTo={navigateTo} />

      case 'insurer-analytics':
        return <InsurerAnalyticsView navigateTo={navigateTo} />;

      default:
        return (
          <div className="text-center py-20 text-[#717786]">
            <h2 className="text-xl font-semibold">Unknown View</h2>
            <p>{String(state.currentView)}</p>
          </div>
        );
    }
  };

  // Note: Auth check is handled in the top-level AppContent() component
  // This ensures all routes are protected via the useAuth() hook
  
  return (
    <QueryClientProvider client={queryClient}>
      <Layout
        children={
          <Suspense fallback={<div style={{ padding: 40, color: '#717786' }}>Loading…</div>}>
            {renderView()}
          </Suspense>
        }
        currentView={state.currentView}
        navigateTo={navigateTo}
      />
    </QueryClientProvider>
  );
}
