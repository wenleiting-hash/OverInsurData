import { useState } from 'react'
import {
  LayoutDashboard, Building2, Package, Handshake, ShieldCheck, Wallet,
  BarChart3, Users, Network, UserPlus, Key, DollarSign, CreditCard,
  Trophy, GraduationCap, Globe, TrendingUp, ChevronDown, ChevronRight,
  Settings, Bell, LogOut,
} from 'lucide-react'

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

interface NavGroup {
  label: string
  items: { id: ViewId; label: string; icon: React.ReactNode }[]
}

const navGroups: NavGroup[] = [
  {
    label: '保险公司管理',
    items: [
      { id: 'insurer-list', label: '保险公司列表', icon: <Building2 size={15} /> },
      { id: 'product-list', label: '产品管理', icon: <Package size={15} /> },
      { id: 'cooperation', label: '合作管理', icon: <Handshake size={15} /> },
      { id: 'appointment', label: 'Appointment & 合规', icon: <ShieldCheck size={15} /> },
      { id: 'finance', label: '财务与结算', icon: <Wallet size={15} /> },
      { id: 'insurer-analytics', label: '数据分析', icon: <BarChart3 size={15} /> },
    ],
  },
  {
    label: '渠道管理',
    items: [
      { id: 'channel-list', label: '渠道列表', icon: <Users size={15} /> },
      { id: 'channel-master', label: '渠道主数据', icon: <Settings size={15} /> },
      { id: 'channel-hierarchy', label: '渠道层级', icon: <Network size={15} /> },
      { id: 'channel-onboarding', label: '入驻管理', icon: <UserPlus size={15} /> },
      { id: 'product-auth', label: '产品授权', icon: <Key size={15} /> },
      { id: 'commission-scheme', label: '佣金方案', icon: <DollarSign size={15} /> },
      { id: 'commission-settlement', label: '佣金结算', icon: <CreditCard size={15} /> },
      { id: 'channel-performance', label: '绩效考核', icon: <Trophy size={15} /> },
      { id: 'channel-training', label: '培训认证', icon: <GraduationCap size={15} /> },
      { id: 'channel-portal', label: '渠道门户', icon: <Globe size={15} /> },
      { id: 'channel-analytics', label: '渠道分析', icon: <TrendingUp size={15} /> },
    ],
  },
]

interface Props {
  currentView: ViewId | string
  navigateTo: (view: ViewId) => void
}

export default function Sidebar({ currentView, navigateTo }: Props) {
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
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', lineHeight: 1.2 }}>InsureOS</div>
          <div style={{ fontSize: 10.5, color: '#717786', fontWeight: 400 }}>海外保险管理平台</div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="px-3 pt-3 shrink-0">
        <div
          className={`nav-item${currentView === 'dashboard' ? ' active' : ''}`}
          onClick={() => navigateTo('dashboard')}
        >
          <LayoutDashboard size={15} className="nav-icon shrink-0" />
          <span>总览</span>
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
                <span>{group.label}</span>
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
            管
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>管理员</div>
            <div style={{ fontSize: 11, color: '#717786' }}>Platform Admin</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }}>
            <Settings size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
