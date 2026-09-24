import { useState } from 'react'
import {
  LayoutDashboard, Building2, Package, Handshake, Wallet,
  BarChart3, Users, Network, UserPlus, Key, DollarSign, CreditCard,
  Trophy, GraduationCap, Globe, TrendingUp, ChevronDown, ChevronRight,
  Languages, Shield, ShieldCheck, FileText, AlertCircle, Clock,
  XCircle, BadgeCheck, Bell, Lock, FileSearch,
} from 'lucide-react'
import { useLang } from '../i18n'

export type ViewId =
  | 'dashboard'
  // Ch1 保险公司主数据
  | 'insurer-list'
  | 'insurer-detail'
  | 'insurer-new'
  | 'insurer-edit'
  | 'insurer-import'
  | 'insurer-duplicate'
  // Ch2 产品管理
  | 'product-list'
  | 'product-detail'
  | 'product-new'
  | 'product-edit'
  // Ch3 合作管理
  | 'cooperation'
  | 'cooperation-detail'
  // Ch4 合规管理 — Appointment
  | 'appointment'
  | 'appointment-new'
  | 'appointment-application'
  | 'appointment-tracking'
  | 'appointment-renewal'
  | 'appointment-termination'
  // Ch4 合规管理 — 合规管控
  | 'license-check'
  | 'license-expiry-reminder'
  | 'compliance-interceptor'
  | 'compliance-rules'
  | 'compliance-report-generator'
  | 'ofac-screening'
  // Ch5 财务结算
  | 'finance'
  // Ch6 数据分析
  | 'insurer-analytics'
  // 渠道管理
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
  // 系统管理
  | 'i18n-management'
  | 'permission'
  | 'user-management'
  | 'department'

interface NavLeaf {
  type?: 'leaf'
  id: ViewId
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
}

interface NavSubGroup {
  type: 'subgroup'
  id: string
  label: string
  icon: React.ReactNode
  items: NavLeaf[]
}

type NavEntry = NavLeaf | NavSubGroup

interface NavGroup {
  label: string
  entries: NavEntry[]
}

interface Props {
  currentView: ViewId | string
  navigateTo: (view: ViewId) => void
}

export default function Sidebar({ currentView, navigateTo }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const { t } = useLang()

  const toggle = (key: string) => setCollapsed(p => ({ ...p, [key]: !p[key] }))

  const navGroups: NavGroup[] = [
    {
      label: t.navGroupInsurer,
      entries: [
        { id: 'insurer-list',      label: t.navInsurerList,      icon: <Building2 size={15} /> },
        { id: 'product-list',      label: t.navProductList,       icon: <Package size={15} /> },
        { id: 'cooperation',       label: t.navCooperation,       icon: <Handshake size={15} /> },
        { id: 'finance',           label: t.navFinance,           icon: <Wallet size={15} /> },
        { id: 'insurer-analytics', label: t.navInsurerAnalytics,  icon: <BarChart3 size={15} /> },
      ] as NavEntry[],
    },
    {
      label: t.navGroupChannel,
      entries: [
        { id: 'channel-list',        label: t.navChannelList,         icon: <Users size={15} /> },
        { id: 'channel-master',      label: t.navChannelMaster,       icon: <Network size={15} /> },
        { id: 'channel-hierarchy',   label: t.navChannelHierarchy,    icon: <Network size={15} /> },
        { id: 'channel-onboarding',  label: t.navChannelOnboarding,   icon: <UserPlus size={15} /> },
        { id: 'product-auth',        label: t.navProductAuth,         icon: <Key size={15} /> },
        { id: 'commission-scheme',   label: t.navCommissionScheme,    icon: <DollarSign size={15} /> },
        { id: 'commission-settlement', label: t.navCommissionSettlement, icon: <CreditCard size={15} /> },
        { id: 'channel-performance', label: t.navChannelPerf,         icon: <Trophy size={15} /> },
        { id: 'channel-training',    label: t.navChannelTraining,     icon: <GraduationCap size={15} /> },
        { id: 'channel-portal',      label: t.navChannelPortal,       icon: <Globe size={15} /> },
        { id: 'channel-analytics',   label: t.navChannelAnalytics,    icon: <TrendingUp size={15} /> },
      ] as NavEntry[],
    },
    {
      label: '系统管理',
      entries: [
        { id: 'user-management', label: '用户管理',  icon: <Users size={15} /> },
        { id: 'department',      label: '部门管理',  icon: <Building2 size={15} /> },
        { id: 'permission',      label: '权限管理',  icon: <ShieldCheck size={15} /> },
        { id: 'i18n-management', label: '多语言管理', icon: <Languages size={15} /> },
      ] as NavEntry[],
    },
  ]

  // Check if any item in a subgroup is the current view
  const subgroupHasActive = (sg: NavSubGroup) => sg.items.some(i => i.id === currentView)

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
          const isGroupCollapsed = collapsed[group.label]
          return (
            <div key={group.label} className="mt-3">
              {/* Group header */}
              <button
                onClick={() => toggle(group.label)}
                className="flex items-center justify-between w-full px-2 py-1 mb-1"
                style={{ fontSize: 11, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                <span>{group.label}</span>
                {isGroupCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              </button>

              {!isGroupCollapsed && (
                <div>
                  {group.entries.map(entry => {
                    if (entry.type === 'subgroup') {
                      const sg = entry as NavSubGroup
                      const isOpen = !collapsed[sg.id]
                      const hasActive = subgroupHasActive(sg)
                      return (
                        <div key={sg.id}>
                          {/* Sub-group toggle row */}
                          <div
                            onClick={() => toggle(sg.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 10px', borderRadius: 9, cursor: 'pointer',
                              fontSize: 13, fontWeight: hasActive ? 600 : 500,
                              color: hasActive ? '#0058BC' : '#414755',
                              background: hasActive ? 'rgba(0,88,188,0.06)' : 'transparent',
                            }}
                          >
                            <span style={{ color: hasActive ? '#0058BC' : '#717786', flexShrink: 0 }}>{sg.icon}</span>
                            <span style={{ flex: 1 }}>{sg.label}</span>
                            {isOpen ? <ChevronDown size={11} style={{ color: '#A0A5B1' }} /> : <ChevronRight size={11} style={{ color: '#A0A5B1' }} />}
                          </div>
                          {/* Sub-group items */}
                          {isOpen && (
                            <div style={{ paddingLeft: 10, marginBottom: 2 }}>
                              {sg.items.map(item => (
                                <div
                                  key={item.id}
                                  className={`nav-sub-item${item.id === currentView ? ' active' : ''}`}
                                  style={{ paddingLeft: 18 }}
                                  onClick={() => navigateTo(item.id as ViewId)}
                                >
                                  <span style={{ color: item.id === currentView ? '#0058BC' : '#A0A5B1', flexShrink: 0 }}>{item.icon}</span>
                                  <span style={{ flex: 1, fontSize: 12.5 }}>{item.label}</span>
                                  {item.badge}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Flat leaf item
                    const leaf = entry as NavLeaf
                    return (
                      <div
                        key={leaf.id}
                        className={`nav-sub-item${leaf.id === currentView ? ' active' : ''}`}
                        onClick={() => navigateTo(leaf.id)}
                      >
                        <span style={{ color: leaf.id === currentView ? '#0058BC' : '#717786', flexShrink: 0 }}>{leaf.icon}</span>
                        <span>{leaf.label}</span>
                        {leaf.badge}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.4)', padding: '10px 12px' }} className="shrink-0">
        <div className="flex items-center gap-2.5">
          <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #0058BC, #60CDFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 700 }}>
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
