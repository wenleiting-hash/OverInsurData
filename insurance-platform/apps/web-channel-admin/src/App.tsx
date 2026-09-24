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
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

// 视图按需加载（代码分割）：启动只加载 Layout + Dashboard，
// 各模块视图在导航到时才拉取，隔离非当前模块的存量问题
const Dashboard = lazy(() => import('@/views/Dashboard'));
const ChannelList = lazy(() => import('@/views/ChannelList'));
const ChannelNewView = lazy(() => import('@/views/ChannelNewView'));
const ChannelMasterView = lazy(() => import('@/views/ChannelMasterView'));
const ChannelHierarchyView = lazy(() => import('@/views/ChannelHierarchyView'));
const ChannelOnboardingView = lazy(() => import('@/views/ChannelOnboardingView'));
const ChannelPortalView = lazy(() => import('@/views/ChannelPortalView'));
const ChannelTrainingView = lazy(() => import('@/views/ChannelTrainingView'));
const ChannelPerformanceView = lazy(() => import('@/views/ChannelPerformanceView'));
const ChannelAnalyticsView = lazy(() => import('@/views/ChannelAnalyticsView'));
const CommissionSchemeView = lazy(() => import('@/views/CommissionSchemeView'));
const CommissionSettlementView = lazy(() => import('@/views/CommissionSettlementView'));
const ProductAuthView = lazy(() => import('@/views/ProductAuthView'));
const I18nManagementView = lazy(() => import('@/views/I18nManagementView'));
const PermissionView = lazy(() => import('@/views/PermissionView'));
const RoleListView = lazy(() => import('@/views/RoleListView'));
const RoleCreateView = lazy(() => import('@/views/RoleCreateView'));
const RoleEditView = lazy(() => import('@/views/RoleEditView'));
const UserListView = lazy(() => import('@/views/UserListView'));
const DepartmentView = lazy(() => import('@/views/DepartmentView'));
const IntegrationAppsView = lazy(() => import('@/views/IntegrationAppsView'));
// V1.0.16 T2 · SSO 回调页（独立路由 /sso/callback，登录守卫白名单内）
const SsoCallbackView = lazy(() => import('@/views/sso/SsoCallbackView'));

interface AppState {
  currentView: ViewId;
  selectedChannelId: string | null;
  selectedRoleId: string | null;
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
  const { isAuthenticated, isLoading, logout } = useAuth();
  const location = useLocation();

  // 空闲超时自动登出（30 分钟无操作）
  useIdleTimeout(async () => {
    await logout();
    queryClient.clear(); // 清除所有缓存，避免下次登录显示过期数据
  });

  // Initialize RTL direction manager
  useRTLManager();

  // ✅ CRITICAL FIX: All hooks must be at top level BEFORE any conditional returns
  // useState/useEffect MUST be called before the if (isLoading) and if (!isAuthenticated) checks
  const [state, setState] = useState<AppState>(() => ({
    currentView: 'dashboard',
    selectedChannelId: null,
    selectedRoleId: null,
  }));

  // URL 同步
  useEffect(() => {
    const syncUrl = () => {
      // SSO 回调页不参与 URL 同步，避免 history.replaceState 清除回调参数
      if (location.pathname === '/sso/callback') return;
      let path = '/';
      if (state.currentView === 'channel-list') path = '/channel-list';
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
      else if (state.currentView === 'department-management') path = '/department-management';
      else if (state.currentView === 'integration-apps') path = '/integration-apps';

      window.history.replaceState({}, '', path);
    };
    
    syncUrl();
  }, [state.currentView, state.selectedChannelId]);

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
    // V1.0.16 T2 · SSO 回调独立路由短路：/sso/callback 直达不要求已登录，不走 Layout
    if (location.pathname === '/sso/callback') {
      return (
        <Suspense fallback={<div style={{ padding: 40, color: '#717786' }}>Loading…</div>}>
          <SsoCallbackView />
        </Suspense>
      );
    }
    return <LoginPage />;
  }

  const navigateTo = (view: ViewId, params?: { channelId?: string; roleId?: string }) => {
    if (params?.channelId) {
      setState(prev => ({ ...prev, selectedChannelId: params.channelId || null, currentView: view }));
    } else if (params?.roleId) {
      setState(prev => ({ ...prev, selectedRoleId: params.roleId || null, currentView: view }));
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

      case 'channel-list':
        return <ChannelList navigateTo={navigateTo} />;
      case 'channel-new':
        return <ChannelNewView navigateTo={navigateTo} />;
      case 'channel-edit':
        return <ChannelNewView navigateTo={navigateTo} channelId={state.selectedChannelId || ''} />;

      case 'channel-master':
        return <ChannelMasterView navigateTo={navigateTo} />;

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

      case 'i18n-management':
        return <I18nManagementView navigateTo={navigateTo} />;

      case 'permission-management':
        return <PermissionView navigateTo={navigateTo} />;

      case 'role-list':
        return <RoleListView navigateTo={navigateTo} />;

      case 'role-create':
        return <RoleCreateView navigateTo={navigateTo} />;

      case 'role-edit':
        return <RoleEditView roleId={state.selectedRoleId || ''} navigateTo={navigateTo} />;

      case 'user-list':
        return <UserListView navigateTo={navigateTo} />;

      case 'department-management':
        return <DepartmentView navigateTo={navigateTo} />;

      case 'integration-apps':
        return <IntegrationAppsView navigateTo={navigateTo} />;

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

// 部门管理页面已由 DepartmentView 组件替代（Figma V1.5 对齐）
