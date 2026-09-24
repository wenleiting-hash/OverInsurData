import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import {
  LayoutDashboard, Building2, Package, ShieldCheck, Wallet,
  BarChart3, Users, Network, UserPlus, Key, DollarSign, CreditCard,
  Trophy, GraduationCap, ChevronDown, ChevronRight,
  Globe, TrendingUp, Languages, Handshake, UserCog, BookMarked,
} from 'lucide-react'

interface NavGroup {
  label: string
  items: { id: ViewId; label: string; icon: React.ReactNode }[]
}

const navGroups: NavGroup[] = [
  {
    label: 'menu.insurers',
    items: [
      { id: 'insurer-list', label: 'menu.insurerList', icon: <Building2 size={15} /> },
      { id: 'product-list', label: 'menu.productManagement', icon: <Package size={15} /> },
      { id: 'cooperation', label: 'menu.cooperationManagement', icon: <Handshake size={15} /> },
      { id: 'finance-dashboard', label: 'menu.financeSettlement', icon: <Wallet size={15} /> },
      { id: 'insurer-analytics', label: 'menu.dataAnalysis', icon: <BarChart3 size={15} /> },
    ],
  },
  {
    label: 'menu.channels',
    items: [
      { id: 'channel-list', label: 'menu.channelList', icon: <Users size={15} /> },
      { id: 'channel-master', label: 'menu.channelMasterData', icon: <Network size={15} /> },
      { id: 'channel-hierarchy', label: 'menu.channelHierarchy', icon: <Network size={15} /> },
      { id: 'channel-onboarding', label: 'menu.onboardingManagement', icon: <UserPlus size={15} /> },
      {
        id: 'appointment',
        label: 'menu.appointmentCompliance',
        icon: <ShieldCheck size={15} />
      },
      { id: 'product-auth', label: 'menu.productAuthorization', icon: <Key size={15} /> },
      { id: 'commission-scheme', label: 'menu.commissionScheme', icon: <DollarSign size={15} /> },
      { id: 'commission-settlement', label: 'menu.commissionSettlement', icon: <CreditCard size={15} /> },
      { id: 'channel-performance', label: 'menu.performanceAssessment', icon: <Trophy size={15} /> },
      { id: 'channel-training', label: 'menu.trainingCertification', icon: <GraduationCap size={15} /> },
      { id: 'channel-portal', label: 'menu.channelPortal', icon: <Globe size={15} /> },
      { id: 'channel-analytics', label: 'menu.channelAnalytics', icon: <TrendingUp size={15} /> },
    ],
  },
  {
    label: 'menu.settings',
    items: [
      { id: 'user-list', label: 'menu.userManagement', icon: <UserCog size={15} /> },
      { id: 'department-management', label: 'menu.departmentManagement', icon: <Building2 size={15} /> },
      { id: 'permission-management', label: 'menu.permissionManagement', icon: <ShieldCheck size={15} /> },
      { id: 'i18n-management', label: 'menu.i18nManagement', icon: <Languages size={15} /> },
      { id: 'integration-apps', label: 'menu.integrationApps', icon: <Key size={15} /> },
      { id: 'dictionary-manage', label: 'menu.dictionaryManage', icon: <BookMarked size={15} /> },
    ],
  },
]

interface Props {
  currentView: ViewId | string
  navigateTo: (view: ViewId) => void
}

export default function Sidebar({ currentView, navigateTo }: Props) {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const toggle = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside
      className="glass flex flex-col shrink-0 h-screen overflow-hidden"
      style={{
        width: 224,
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        borderRight: '0.5px solid rgba(193,198,215,0.5)',
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 shrink-0"
        style={{ height: 56, borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
            boxShadow: '0 2px 8px rgba(0,88,188,0.35)',
          }}
        >
          <ShieldCheck size={18} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', lineHeight: 1.2 }}>InsureOS</div>
          <div style={{ fontSize: 10.5, color: '#717786', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t('common.brandTagline')}</div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-3 shrink-0">
        <div
          className={`nav-item${currentView === 'dashboard' ? ' active' : ''}`}
          onClick={() => navigateTo('dashboard')}
        >
          <LayoutDashboard size={15} className="nav-icon shrink-0" />
          <span>{t('menu.overview')}</span>
        </div>
      </div>

      {/* Scrollable nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 mt-1" style={{ scrollbarWidth: 'none' }}>
        {navGroups.map(group => {
          const isCollapsed = collapsed[group.label]
          const hasActive = group.items.some(i => i.id === currentView)
          return (
            <div key={group.label} className="mt-3">
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center justify-between w-full px-2 py-1 mb-1"
                style={{ fontSize: 11, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <span>{t(group.label)}</span>
                {isCollapsed
                  ? <ChevronRight size={12} />
                  : <ChevronDown size={12} />
                }
              </button>
              {!isCollapsed && (
                <div>
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className={`nav-sub-item${item.id === currentView ? ' active' : ''}`}
                      onClick={() => navigateTo(item.id)}
                    >
                      <span style={{ color: item.id === currentView ? '#0058BC' : '#717786', flexShrink: 0 }}>{item.icon}</span>
                      <span>{t(item.label)}</span>
                      {item.id === 'appointment' && (
                        <span className="ml-auto badge badge-red" style={{ fontSize: 10, padding: '1px 6px' }}>3</span>
                      )}
                    </div>
                  ))}  
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* User + settings */}
      <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.4)', padding: '10px 12px' }} className="shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0058BC, #60CDFF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#fff',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {t('common.admin').slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('common.admin')}</div>
            <div style={{ fontSize: 11, color: '#717786' }}>{t('common.adminRole')}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
