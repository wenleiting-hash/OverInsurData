import { useState } from 'react'
import {
  LayoutDashboard, Building2, Package, Handshake, ShieldCheck, Wallet,
  BarChart3, Users, Network, UserPlus, Key, DollarSign, CreditCard,
  Trophy, GraduationCap, Globe, TrendingUp, ChevronDown, ChevronRight, Languages, Shield,
} from 'lucide-react'
import { useLang } from '../i18n'

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
  | 'finance'
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
  | 'channel-new'
  | 'channel-edit'
  | 'appointment-new'
  | 'i18n-management'
  | 'permission'

interface Props {
  currentView: ViewId | string
  navigateTo: (view: ViewId) => void
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({ currentView, navigateTo }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const { t } = useLang()

  const toggle = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const navGroups = [
    {
      label: t.navGroupInsurer,
      items: [
        { id: 'insurer-list' as ViewId,       label: t.navInsurerList,         icon: <Building2 size={15} /> },
        { id: 'product-list' as ViewId,        label: t.navProductList,          icon: <Package size={15} /> },
        { id: 'cooperation' as ViewId,         label: t.navCooperation,          icon: <Handshake size={15} /> },
        { id: 'appointment' as ViewId,         label: t.navAppointment,          icon: <ShieldCheck size={15} /> },
        { id: 'finance' as ViewId,             label: t.navFinance,              icon: <Wallet size={15} /> },
        { id: 'insurer-analytics' as ViewId,   label: t.navInsurerAnalytics,     icon: <BarChart3 size={15} /> },
      ],
    },
    {
      label: t.navGroupChannel,
      items: [
        { id: 'channel-list' as ViewId,        label: t.navChannelList,          icon: <Users size={15} /> },
        { id: 'channel-master' as ViewId,      label: t.navChannelMaster,        icon: <Network size={15} /> },
        { id: 'channel-hierarchy' as ViewId,   label: t.navChannelHierarchy,     icon: <Network size={15} /> },
        { id: 'channel-onboarding' as ViewId,  label: t.navChannelOnboarding,    icon: <UserPlus size={15} /> },
        { id: 'product-auth' as ViewId,        label: t.navProductAuth,          icon: <Key size={15} /> },
        { id: 'commission-scheme' as ViewId,   label: t.navCommissionScheme,     icon: <DollarSign size={15} /> },
        { id: 'commission-settlement' as ViewId, label: t.navCommissionSettlement, icon: <CreditCard size={15} /> },
        { id: 'channel-performance' as ViewId, label: t.navChannelPerf,          icon: <Trophy size={15} /> },
        { id: 'channel-training' as ViewId,    label: t.navChannelTraining,      icon: <GraduationCap size={15} /> },
        { id: 'channel-portal' as ViewId,      label: t.navChannelPortal,        icon: <Globe size={15} /> },
        { id: 'channel-analytics' as ViewId,   label: t.navChannelAnalytics,     icon: <TrendingUp size={15} /> },
      ],
    },
    {
      label: t.navGroupSystem,
      items: [
        { id: 'i18n-management' as ViewId, label: t.navI18nMgmt, icon: <Languages size={15} /> },
        { id: 'permission' as ViewId,      label: t.navPermission, icon: <ShieldCheck size={15} /> },
      ],
    },
  ]

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
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
            boxShadow: '0 2px 8px rgba(0,88,188,0.35)',
          }}
        >
          <ShieldCheck size={18} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', lineHeight: 1.2 }}>InsureOS</div>
          <div style={{ fontSize: 10.5, color: '#717786', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.brandTagline}</div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-3 shrink-0">
        <div
          className={`nav-item${currentView === 'dashboard' ? ' active' : ''}`}
          onClick={() => navigateTo('dashboard')}
        >
          <LayoutDashboard size={15} className="nav-icon shrink-0" />
          <span>{t.navDashboard}</span>
        </div>
      </div>

      {/* Scrollable nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 mt-1" style={{ scrollbarWidth: 'none' }}>
        {navGroups.map(group => {
          const isCollapsed = collapsed[group.label]
          return (
            <div key={group.label} className="mt-3">
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center justify-between w-full px-2 py-1 mb-1"
                style={{
                  fontSize: 11, fontWeight: 600, color: '#717786',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', background: 'none', border: 'none',
                }}
              >
                <span>{group.label}</span>
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
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
                      <span>{item.label}</span>
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

      {/* Footer: user + language toggle */}
      <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.4)', padding: '10px 12px' }} className="shrink-0">
        <div className="flex items-center gap-2.5">
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #0058BC, #60CDFF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#fff', fontWeight: 700,
          }}>
            {t.adminName.slice(0, 1)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.adminName}</div>
            <div style={{ fontSize: 11, color: '#717786' }}>{t.adminRole}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
