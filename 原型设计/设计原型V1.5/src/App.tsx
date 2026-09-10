import { useState } from 'react'
import { LangProvider } from './i18n'
import LoginView, { type SSOUser } from './views/LoginView'
import Sidebar, { type ViewId } from './components/Sidebar'
import TopBar from './components/TopBar'
import Dashboard from './views/Dashboard'
import InsurerList from './views/InsurerList'
import InsurerDetail from './views/InsurerDetail'
import InsurerForm from './views/InsurerForm'
import InsurerImport from './views/InsurerImport'
import InsurerDuplicate from './views/InsurerDuplicate'
import ProductList from './views/ProductList'
import ProductDetail from './views/ProductDetail'
import ProductForm from './views/ProductForm'
import ChannelList from './views/ChannelList'
import ChannelForm from './views/ChannelForm'
import AppointmentView from './views/AppointmentView'
import AppointmentNewView from './views/AppointmentNewView'
import PlaceholderView from './views/PlaceholderView'
import DisableModal from './components/DisableModal'
import ProductStatusModal from './components/ProductStatusModal'
import CooperationView from './views/CooperationView'
import FinanceView from './views/FinanceView'
import InsurerAnalyticsView from './views/InsurerAnalyticsView'
import ChannelHierarchyView from './views/ChannelHierarchyView'
import OnboardingView from './views/OnboardingView'
import ChannelMasterView from './views/ChannelMasterView'
import ProductAuthView from './views/ProductAuthView'
import CommissionSchemeView from './views/CommissionSchemeView'
import CommissionSettlementView from './views/CommissionSettlementView'
import ChannelPerformanceView from './views/ChannelPerformanceView'
import ChannelTrainingView from './views/ChannelTrainingView'
import ChannelPortalView from './views/ChannelPortalView'
import ChannelAnalyticsView from './views/ChannelAnalyticsView'
import I18nManagementView from './views/I18nManagementView'
import PermissionView from './views/PermissionView'
import UserManagementView from './views/UserManagementView'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null)
  const [currentView, setCurrentView] = useState<ViewId>('dashboard')
  const [selectedInsurerId, setSelectedInsurerId] = useState<string>('1')
  const [selectedProductId, setSelectedProductId] = useState<string>('p1')
  const [disableModalId, setDisableModalId] = useState<string | null>(null)
  const [productStatusModalId, setProductStatusModalId] = useState<string | null>(null)

  const navigateTo = (view: ViewId, params?: { insurerId?: string; productId?: string }) => {
    if (params?.insurerId) setSelectedInsurerId(params.insurerId)
    if (params?.productId) setSelectedProductId(params.productId)
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard navigateTo={navigateTo} />
      case 'insurer-list':
        return <InsurerList navigateTo={navigateTo} onDisable={(id) => setDisableModalId(id)} />
      case 'insurer-detail':
        return <InsurerDetail insurerId={selectedInsurerId} navigateTo={navigateTo} onDisable={(id) => setDisableModalId(id)} />
      case 'insurer-new':
        return <InsurerForm mode="create" navigateTo={navigateTo} />
      case 'insurer-edit':
        return <InsurerForm mode="edit" insurerId={selectedInsurerId} navigateTo={navigateTo} />
      case 'insurer-import':
        return <InsurerImport navigateTo={navigateTo} />
      case 'insurer-duplicate':
        return <InsurerDuplicate navigateTo={navigateTo} />
      case 'product-list':
        return <ProductList navigateTo={navigateTo} onStatusChange={(id) => setProductStatusModalId(id)} />
      case 'product-detail':
        return <ProductDetail productId={selectedProductId} navigateTo={navigateTo} onStatusChange={(id) => setProductStatusModalId(id)} />
      case 'product-new':
        return <ProductForm mode="create" navigateTo={navigateTo} />
      case 'product-edit':
        return <ProductForm mode="edit" productId={selectedProductId} navigateTo={navigateTo} />
      case 'cooperation':
        return <CooperationView navigateTo={navigateTo} />
      case 'finance':
        return <FinanceView navigateTo={navigateTo} />
      case 'insurer-analytics':
        return <InsurerAnalyticsView navigateTo={navigateTo} />
      case 'channel-list':
        return <ChannelList navigateTo={navigateTo} />
      case 'channel-new':
        return <ChannelForm mode="create" navigateTo={navigateTo} />
      case 'channel-edit':
        return <ChannelForm mode="edit" channelId={selectedInsurerId} navigateTo={navigateTo} />
      case 'appointment':
        return <AppointmentView navigateTo={navigateTo} />
      case 'appointment-new':
        return <AppointmentNewView navigateTo={navigateTo} />
      case 'channel-hierarchy':
        return <ChannelHierarchyView navigateTo={navigateTo} />
      case 'channel-onboarding':
        return <OnboardingView navigateTo={navigateTo} />
      case 'channel-master':
        return <ChannelMasterView navigateTo={navigateTo} />
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
        return <ChannelPortalView navigateTo={navigateTo} />
      case 'channel-analytics':
        return <ChannelAnalyticsView navigateTo={navigateTo} />
      case 'i18n-management':
        return <I18nManagementView navigateTo={navigateTo} />
      case 'user-management':
        return <UserManagementView navigateTo={navigateTo} />
      case 'permission':
        return <PermissionView navigateTo={navigateTo} />
      default:
        return <PlaceholderView viewId={currentView} />
    }
  }

  if (!loggedIn) {
    return (
      <LangProvider>
        <LoginView onLogin={(user?: SSOUser) => {
          if (user) setCurrentUser({ name: user.name, role: user.role })
          setLoggedIn(true)
        }} />
      </LangProvider>
    )
  }

  return (
    <LangProvider currentUser={currentUser}>
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--page-bg, #F9F9FF)' }}
    >
      {/* Atmospheric background orbs */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at 12% 20%, rgba(173,198,255,0.30) 0%, transparent 46%),' +
            'radial-gradient(ellipse at 88% 80%, rgba(196,181,253,0.20) 0%, transparent 46%),' +
            'radial-gradient(ellipse at 52% 52%, rgba(224,234,255,0.35) 0%, #F9F9FF 100%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 20 }}>
        <Sidebar currentView={currentView} navigateTo={navigateTo} />
      </div>

      <div className="flex flex-col flex-1 overflow-hidden" style={{ position: 'relative', zIndex: 10 }}>
        <TopBar currentView={currentView} navigateTo={navigateTo} onLogout={() => { setLoggedIn(false); setCurrentUser(null) }} />
        <main className="flex-1 overflow-y-auto" style={{ padding: '24px 28px 32px' }}>
          {renderView()}
        </main>
      </div>

      {disableModalId && (
        <DisableModal insurerId={disableModalId} onClose={() => setDisableModalId(null)} onConfirm={() => setDisableModalId(null)} />
      )}
      {productStatusModalId && (
        <ProductStatusModal productId={productStatusModalId} onClose={() => setProductStatusModalId(null)} onConfirm={() => setProductStatusModalId(null)} />
      )}
    </div>
    </LangProvider>
  )
}
