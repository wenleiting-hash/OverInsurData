import { useState } from 'react'
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
import AppointmentView from './views/AppointmentView'
import PlaceholderView from './views/PlaceholderView'
import DisableModal from './components/DisableModal'
import ProductStatusModal from './components/ProductStatusModal'
import CooperationView from './views/CooperationView'
import FinanceView from './views/FinanceView'
import InsurerAnalyticsView from './views/InsurerAnalyticsView'
import ChannelHierarchyView from './views/ChannelHierarchyView'
import OnboardingView from './views/OnboardingView'
import ChannelMasterView from './views/ChannelMasterView'

export default function App() {
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
      case 'appointment':
        return <AppointmentView navigateTo={navigateTo} />
      case 'channel-hierarchy':
        return <ChannelHierarchyView navigateTo={navigateTo} />
      case 'channel-onboarding':
        return <OnboardingView navigateTo={navigateTo} />
      case 'channel-master':
        return <ChannelMasterView navigateTo={navigateTo} />
      default:
        return <PlaceholderView viewId={currentView} />
    }
  }

  return (
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
        <TopBar currentView={currentView} navigateTo={navigateTo} />
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
  )
}
