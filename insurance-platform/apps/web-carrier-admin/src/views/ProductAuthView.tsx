import { useState } from 'react'
import { Upload, Download, Search, Plus, AlertTriangle, X, Eye, Pencil, Check, Shield, ShieldCheck, Clock, Info, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import ProductAuthMatrixModal from '@/components/ProductAuthMatrixModal'

interface Props { navigateTo: (view: ViewId) => void }
/** 授权状态。本系统没有任何审批流程，所以 'pending' 指的是「待生效」——
 *  授权已录入但 effective_date 尚未到达（如试用授权），不是「待审批」。 */
type AuthStatus = 'active' | 'expiring' | 'expired' | 'pending' | 'withdrawn'
type ChannelTypeKey = 'agency' | 'brokerage' | 'mga' | 'fmo'
type AuthModeKey = 'permanent' | 'term' | 'trial'
/** 超限处理规则。本系统没有任何审批流程，所以去掉了原 'supervisor'（需主管审批）选项，
 *  超限只剩两种处置：转人工核保、禁止出单。 */
type OverLimitRule = 'manual-uw' | 'block'

interface OpPermissions { quote: boolean; bind: boolean; endorse: boolean; renewal: boolean; surrender: boolean }

interface AuthRow {
  id: string
  channelName: string
  channelShort: string
  channelTypeKey: ChannelTypeKey
  productName: string
  insurer: string
  businessLine: string
  states: string[]
  status: AuthStatus
  authModeKey: AuthModeKey
  effectiveDate: string
  expiryPermanent: boolean
  expiryDateLabel: string
  monthlyLimit: string | null
  limitUsagePercent: number
  limitUsageConsumed?: string
  limitProgressColor?: 'green' | 'orange' | 'red' | 'gray'
  permissions: OpPermissions
}

// Figma design tokens
const BRAND = 'rgb(0, 88, 188)'
const BRAND_LIGHT = 'rgba(0, 88, 188, 0.09)'
const TH_BG = 'rgba(236, 237, 249, 0.5)'
const CARD_BG = 'rgba(255, 255, 255, 0.58)'
const CARD_BD = '0.666px solid rgba(193, 198, 215, 0.55)'
const CARD_SHADOW = { boxShadow: 'rgba(0, 58, 152, 0.05) 0px 2px 12px 0px' }
const STATUS_COLORS: Record<AuthStatus, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,199,89,0.1)',   color: 'rgb(26,122,46)' },
  expiring:  { bg: 'rgba(255,159,10,0.09)', color: 'rgb(160,92,0)' },
  expired:   { bg: 'rgba(255,59,48,0.08)',  color: 'rgb(192,57,43)' },
  pending:   { bg: 'rgba(0,88,188,0.09)',   color: 'rgb(0,88,188)' },
  withdrawn: { bg: 'rgba(113,119,134,0.1)', color: 'rgb(113,119,134)' },
}
const PROGRESS_COLORS: Record<string, string> = {
  green: 'rgb(52,199,89)', orange: 'rgb(255,159,10)',
  red: 'rgb(255,59,48)', gray: 'rgb(193,198,215)',
}

// Tab1 mock data — exactly matches prototype 7 rows (enums use stable English keys + t() rendering)
const MOCK_DATA: AuthRow[] = [
  { id:'a1', channelName:'Pacific Coast Insurance Agency', channelShort:'Pacific Coast', channelTypeKey:'agency',
    productName:'Personal Auto Preferred', insurer:'Pacific Mutual', businessLine:'AUTO',
    states:['CA','OR','WA','NV'], status:'active', authModeKey:'permanent',
    effectiveDate:'2024-01-01', expiryPermanent:true, expiryDateLabel:'', monthlyLimit:'$500K',
    limitUsagePercent:57, limitUsageConsumed:'$287K', limitProgressColor:'green',
    permissions:{quote:true, bind:true, endorse:true, renewal:true, surrender:false} },
  { id:'a2', channelName:'Pacific Coast Insurance Agency', channelShort:'Pacific Coast', channelTypeKey:'agency',
    productName:'Homeowners Elite', insurer:'Liberty Shield', businessLine:'HOME',
    states:['CA','OR'], status:'active', authModeKey:'permanent',
    effectiveDate:'2024-01-01', expiryPermanent:true, expiryDateLabel:'', monthlyLimit:'$300K',
    limitUsagePercent:52, limitUsageConsumed:'$156K', limitProgressColor:'green',
    permissions:{quote:true, bind:true, endorse:true, renewal:true, surrender:false} },
  { id:'a3', channelName:'SunState MGA Partners', channelShort:'SunState MGA', channelTypeKey:'mga',
    productName:'Personal Auto Preferred', insurer:'Pacific Mutual', businessLine:'AUTO',
    states:['TX','FL','GA'], status:'expiring', authModeKey:'term',
    effectiveDate:'2023-07-15', expiryPermanent:false, expiryDateLabel:'2025-06-01', monthlyLimit:'$1.0M',
    limitUsagePercent:82, limitUsageConsumed:'$823K', limitProgressColor:'orange',
    permissions:{quote:true, bind:true, endorse:true, renewal:true, surrender:false} },
  { id:'a4', channelName:'Mountain West FMO', channelShort:'Mountain West FMO', channelTypeKey:'fmo',
    productName:'Medicare Advantage Basic', insurer:'Nationwide Plus', businessLine:'MED',
    states:['CO','AZ','NV','NM'], status:'active', authModeKey:'permanent',
    effectiveDate:'2022-03-01', expiryPermanent:true, expiryDateLabel:'', monthlyLimit:null,
    limitUsagePercent:0, limitProgressColor:'gray',
    permissions:{quote:true, bind:true, endorse:true, renewal:true, surrender:false} },
  { id:'a5', channelName:'Northeast Brokers Group', channelShort:'Northeast Brokers Group', channelTypeKey:'brokerage',
    productName:'Commercial GL Plus', insurer:'SafeGuard Re', businessLine:'GL',
    states:['NY','NJ','CT','PA'], status:'expired', authModeKey:'term',
    effectiveDate:'2022-01-01', expiryPermanent:false, expiryDateLabel:'2024-03-01', monthlyLimit:'$200K',
    limitUsagePercent:100, limitUsageConsumed:'$200K', limitProgressColor:'red',
    permissions:{quote:false, bind:false, endorse:false, renewal:false, surrender:false} },
  { id:'a6', channelName:'CalFirst Agents Network', channelShort:'CalFirst Agents Network', channelTypeKey:'agency',
    productName:'Term Life 20', insurer:'AmeriTrust', businessLine:'Life',
    states:['CA'], status:'pending', authModeKey:'trial',
    effectiveDate:'2026-10-01', expiryPermanent:false, expiryDateLabel:'2026-10-01', monthlyLimit:'$100K',
    limitUsagePercent:12, limitUsageConsumed:'$12K', limitProgressColor:'gray',
    permissions:{quote:true, bind:true, endorse:false, renewal:false, surrender:false} },
  { id:'a7', channelName:'Lone Star Agency Group', channelShort:'Lone Star Agency Group', channelTypeKey:'agency',
    productName:'Personal Auto Preferred', insurer:'Liberty Shield', businessLine:'AUTO',
    states:['TX'], status:'withdrawn', authModeKey:'permanent',
    effectiveDate:'2025-01-01', expiryPermanent:true, expiryDateLabel:'', monthlyLimit:null,
    limitUsagePercent:0, limitProgressColor:'gray',
    permissions:{quote:false, bind:false, endorse:false, renewal:false, surrender:false} },
]

// Tab2 permission matrix data
interface MatrixRow {
  channelShort: string; product: string; carrier: string
  cells: { state: string; perms: OpPermissions | null }[] // null = not applicable
}
const MATRIX_STATES = ['CA','OR','WA','TX','FL']
const MATRIX_DATA: MatrixRow[] = [
  { channelShort:'Pacific Coast', product:'Personal Auto Preferred', carrier:'Pacific Mutual',
    cells:[
      { state:'CA', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'OR', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'WA', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'TX', perms:null }, { state:'FL', perms:null },
    ]},
  { channelShort:'Pacific Coast', product:'Homeowners Elite', carrier:'Liberty Shield',
    cells:[
      { state:'CA', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'OR', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'WA', perms:null }, { state:'TX', perms:null }, { state:'FL', perms:null },
    ]},
  { channelShort:'SunState MGA', product:'Personal Auto Preferred', carrier:'Pacific Mutual',
    cells:[
      { state:'CA', perms:null }, { state:'OR', perms:null }, { state:'WA', perms:null },
      { state:'TX', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
      { state:'FL', perms:{quote:true,bind:true,endorse:true,renewal:true,surrender:false} },
    ]},
  { channelShort:'Mountain West FMO', product:'Medicare Advantage Basic', carrier:'Nationwide Plus',
    cells:[
      { state:'CA', perms:null }, { state:'OR', perms:null }, { state:'WA', perms:null },
      { state:'TX', perms:null }, { state:'FL', perms:null },
    ]},
]

// Tab2 config panel data — aligned to prototype permConfigs (toggleable operation permissions + 3-tier limits + over-limit rules highlighted by data)
interface CpConfig {
  id: string; channel: string; product: string; carrier: string; state: string
  ops: OpPermissions
  limits: { perPolicy: string | null; monthly: string | null; quarterly: string | null }
  overLimitRule: OverLimitRule
}
const CHANNEL_PRODUCTS: CpConfig[] = [
  { id:'cp1', channel:'Pacific Coast Insurance', product:'Personal Auto Preferred', carrier:'Pacific Mutual', state:'CA',
    ops:{quote:true, bind:true, endorse:true, renewal:true, surrender:false},
    limits:{ perPolicy:'$50K', monthly:'$500K', quarterly:'$1.5M' }, overLimitRule:'manual-uw' },
  { id:'cp2', channel:'Pacific Coast Insurance', product:'Homeowners Elite', carrier:'Liberty Shield', state:'CA',
    ops:{quote:true, bind:true, endorse:true, renewal:true, surrender:true},
    limits:{ perPolicy:'$30K', monthly:'$300K', quarterly:'$900K' }, overLimitRule:'manual-uw' },
  { id:'cp3', channel:'SunState MGA Partners', product:'Personal Auto Preferred', carrier:'Pacific Mutual', state:'TX',
    ops:{quote:true, bind:true, endorse:false, renewal:true, surrender:false},
    limits:{ perPolicy:'$100K', monthly:'$1.0M', quarterly:null }, overLimitRule:'block' },
  { id:'cp4', channel:'Mountain West FMO', product:'Medicare Advantage Basic', carrier:'Nationwide Plus', state:'CO',
    ops:{quote:true, bind:true, endorse:false, renewal:true, surrender:false},
    limits:{ perPolicy:null, monthly:null, quarterly:null }, overLimitRule:'manual-uw' },
]

export default function ProductAuthView(_: Props) {
  const { t } = useTranslation('channel')
  const [activeTab, setActiveTab] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lineFilter, setLineFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(MOCK_DATA[0].id)
  const [showModal, setShowModal] = useState(false)
  const [activeCp, setActiveCp] = useState(CHANNEL_PRODUCTS[0].id)
  const [draftPerms, setDraftPerms] = useState<OpPermissions>(CHANNEL_PRODUCTS[0].ops)

  const data = MOCK_DATA
  const stats = (['active','expiring','expired','pending'] as AuthStatus[])
    .map(k => ({ key: k, count: MOCK_DATA.filter(a => a.status === k).length }))
  const filtered = data.filter(a => {
    const q = searchQuery.trim().toLowerCase()
    return (!q || a.channelName.toLowerCase().includes(q) || a.productName.toLowerCase().includes(q))
      && (statusFilter === 'all' || a.status === statusFilter)
      && (lineFilter === 'all' || a.businessLine === lineFilter)
  })
  const selected = data.find(a => a.id === selectedId) ?? null
  const expiringCount = MOCK_DATA.filter(a => a.status === 'expiring').length
  const activeCpData = CHANNEL_PRODUCTS.find(c => c.id === activeCp)!
  const selectCp = (id: string) => {
    const cp = CHANNEL_PRODUCTS.find(c => c.id === id)
    if (!cp) return
    setActiveCp(id)
    setDraftPerms(cp.ops)
  }

  const StatusBadge = ({ status }: { status: AuthStatus }) => {
    const s = STATUS_COLORS[status]
    return <span className="inline-flex items-center gap-[3px] rounded-[6px] px-[8px] py-[2px] text-[11px] font-[700]"
      style={{ backgroundColor: s.bg, color: s.color }}>
      <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ backgroundColor: s.color }}/>
      {t(`productAuthView.status.${status}`)}
    </span>
  }

  const StatePill = ({ s }: { s: string }) => (
    <span className="rounded-[6px] px-[6px] py-[2px] text-[11px] font-[600]"
      style={{ backgroundColor: 'rgba(0,88,188,0.09)', color: BRAND }}>{s}</span>
  )

  const OpPill = ({ label, on }: { label: string; on: boolean }) => (
    <span className="inline-flex items-center gap-[3px] rounded-[6px] px-[10px] py-[4px] text-[12px] font-[600]"
      style={{ backgroundColor: on ? 'rgba(52,199,89,0.1)' : 'rgba(193,198,215,0.15)', color: on ? 'rgb(26,122,46)' : 'rgb(193,198,215)' }}>
      {on ? <Check size={12}/> : <span style={{ fontSize:12 }}>✗</span>}{label}
    </span>
  )

  // Tab2 toggleable permission switches — aligned to prototype PermToggle
  const PermToggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!on)} className="inline-flex items-center gap-[5px] rounded-[8px] px-[10px] py-[6px] text-[11.5px] font-[700] transition-colors"
      style={{ backgroundColor: on ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.08)', border: `0.5px solid ${on ? 'rgba(52,199,89,0.25)' : 'rgba(255,59,48,0.22)'}`, color: on ? 'rgb(26,122,46)' : 'rgb(192,57,43)', cursor: 'pointer' }}>
      {on ? <Check size={11}/> : <X size={11}/>}{label}
    </button>
  )

  const StatIcon = ({ status }: { status: AuthStatus }) => {
    const map: Record<AuthStatus, typeof Check | null> = { active: Check, expiring: Clock, expired: X, pending: Info, withdrawn: X }
    const Ic = map[status]
    return Ic ? <Ic size={14}/> : null
  }

  const StatCard = ({ stat }: { stat: { key: AuthStatus; count: number } }) => {
    const s = STATUS_COLORS[stat.key]
    return (
      <div style={{ borderRadius:20, backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW, padding:'16px 18px' }}
        className="flex items-center gap-3">
        <div className="h-[28px] w-[28px] flex-shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: s.bg, color: s.color }}>
          <StatIcon status={stat.key}/>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-[26px] font-[700] leading-none flex-shrink-0" style={{ color: s.color }}>{stat.count}</div>
          <div className="text-[12px] text-[rgb(113,119,134)] leading-none whitespace-nowrap">{t(`productAuthView.stats.${stat.key}`)}</div>
        </div>
      </div>
    )
  }

  const TabBtn = ({ active, label, icon, onClick }: { active: boolean; label: string; icon: React.ReactNode; onClick: () => void }) => (
    <button onClick={onClick} className="h-[40px] flex items-center gap-[6px] text-left transition-colors"
      style={{
        width: active ? 160 : 176,
        borderRadius: '10px 10px 0px 0px',
        backgroundColor: active ? BRAND_LIGHT : 'transparent',
        color: active ? BRAND : 'rgb(113,119,134)',
        borderBottom: active ? '2px solid ' + BRAND : '2px solid transparent',
        fontSize: '13px', fontWeight: active ? 700 : 500, padding: '0 16px',
      }}>{icon}{label}</button>
  )

  const thStyle = { fontSize:'11px', fontWeight:700, color:'rgb(160,165,180)', padding:'8px 12px' }

  // Permission matrix cell rendering
  const MatrixCell = ({ perms }: { perms: OpPermissions | null }) => {
    if (!perms) return <span className="text-[rgb(113,119,134)] text-[12px]">—</span>
    const letters = ['Q','P','E','R','C'] as const // Quote, Bind, Endorse, Renewal, Surrender
    const vals = [perms.quote, perms.bind, perms.endorse, perms.renewal, perms.surrender]
    return (
      <span className="text-[12px] font-[700]" style={{ color:'rgb(26,122,46)', letterSpacing:1 }}>
        {letters.map((l,i) => vals[i] ? l : '·').join('')}
      </span>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="px-6 pt-6 sm:px-10 sm:pt-10">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: 'rgb(24,28,35)', letterSpacing: '-0.3px' }}>{t('productAuthView.title')}</h1>
            <p className="mt-[4px] text-[13px] text-[rgb(113,119,134)]">{t('productAuthView.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-[32px] items-center gap-[6px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[12px] text-[12px] font-[500] text-[rgb(24,28,35)]">
              <Upload size={14}/>{t('productAuthView.importList')}
            </button>
            <button className="inline-flex h-[32px] items-center gap-[6px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[12px] text-[12px] font-[500] text-[rgb(24,28,35)]">
              <Download size={14}/>{t('productAuthView.exportList')}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex items-end border-b-[0.666px] border-[rgba(193,198,215,0.55)]">
          <TabBtn active={activeTab===1} icon={<ShieldCheck size={14}/>} label={t('productAuthView.tabProducts')} onClick={() => { setActiveTab(1); setSelectedId(data[0]?.id ?? null) }}/>
          <TabBtn active={activeTab===2} icon={<Shield size={14}/>} label={t('productAuthView.tabPermissions')} onClick={() => { setActiveTab(2) }}/>
        </div>
      </div>

      {/* Tab1 body: two-column split */}
      {activeTab === 1 && (
      <div className="grid grid-cols-1 gap-6 px-6 pb-10 lg:grid-cols-[1fr_380px] sm:px-10">
        <div className="min-w-0 space-y-4">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => <StatCard key={s.key} stat={s}/>)}
          </div>

          {/* Expiry warning banner */}
          {expiringCount > 0 && (
            <div className="flex items-center gap-2" style={{ borderRadius:10, backgroundColor:'rgba(255,159,10,0.09)', border:'0.666px solid rgba(255,159,10,0.25)', padding:'10px 16px', color:'rgb(160,92,0)', fontSize:'12px', fontWeight:500 }}>
              <AlertTriangle size={14} className="shrink-0"/>
              {t('productAuthView.warningExpiring', { n: expiringCount })}
            </div>
          )}

          {/* Search & filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] max-w-[360px] flex-1">
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgb(113,119,134)]"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                placeholder={t('productAuthView.searchPlaceholder')}
                className="h-[32px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white pl-[32px] pr-[10px] text-[12px] text-[rgb(24,28,35)] placeholder-[rgb(113,119,134)] focus:border-[rgb(0,88,188)] focus:outline-none"/>
            </div>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
              className="h-[32px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12px] text-[rgb(24,28,35)] focus:outline-none">
              <option value="all">{t('productAuthView.allStatuses')}</option>
              {(['active','expiring','expired','pending','withdrawn'] as AuthStatus[]).map(s =>
                <option key={s} value={s}>{t(`productAuthView.status.${s}`)}</option>)}
            </select>
            <select value={lineFilter} onChange={e=>setLineFilter(e.target.value)}
              className="h-[32px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12px] text-[rgb(24,28,35)] focus:outline-none">
              <option value="all">{t('productAuthView.allLines')}</option>
              {['AUTO','HOME','GL','PKG','MED','UMB','Life'].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={()=>setShowModal(true)} className="inline-flex h-[28px] items-center gap-[4px] rounded-[8px] px-[14px] text-[12px] font-[700] text-white hover:opacity-90" style={{ backgroundColor: BRAND }}>
                <Plus size={12}/>{t('productAuthView.addAuth')}
              </button>
              <button className="inline-flex h-[28px] items-center gap-[4px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[12px] text-[12px] font-[500] text-[rgb(24,28,35)]">
                <Download size={12}/>{t('productAuthView.exportSheet')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
            <table className="min-w-full border-collapse">
              <thead><tr style={{ backgroundColor: TH_BG }}>
                <th style={{...thStyle, minWidth:160}} className="text-left">{t('productAuthView.table.channel')}</th>
                <th style={{...thStyle, minWidth:140}} className="text-left">{t('productAuthView.table.product')}</th>
                <th style={{...thStyle, minWidth:100}} className="text-left">{t('productAuthView.table.states')}</th>
                <th style={{...thStyle, minWidth:90}} className="text-left">{t('productAuthView.table.type')}</th>
                <th style={{...thStyle, minWidth:70}} className="text-left">{t('productAuthView.table.status')}</th>
                <th style={{...thStyle, minWidth:90}} className="text-left">{t('productAuthView.table.monthlyLimit')}</th>
                <th style={{...thStyle, minWidth:110}} className="text-left">{t('productAuthView.table.limitUsage')}</th>
                <th style={{...thStyle, minWidth:100}} className="text-left">{t('productAuthView.table.expiryDate')}</th>
                <th style={{...thStyle, minWidth:80}} className="text-right"></th>
              </tr></thead>
              <tbody>
                {filtered.map(a => {
                  const sel = selectedId === a.id
                  return (
                    <tr key={a.id} onClick={()=>setSelectedId(a.id)} className="cursor-pointer"
                      style={{ backgroundColor: sel ? BRAND_LIGHT : 'transparent' }}>
                      <td style={{padding:'12px'}}>
                        <div className="text-[13px] font-[600] text-[rgb(24,28,35)] leading-[1.4]">{a.channelName}</div>
                        <div className="mt-[2px] text-[11px] text-[rgb(113,119,134)]">{t(`productAuthView.channelType.${a.channelTypeKey}`)}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <div className="text-[13px] font-[500] text-[rgb(24,28,35)] leading-[1.4]">{a.productName}</div>
                        <div className="mt-[2px] text-[11px] text-[rgb(113,119,134)]">{a.insurer}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <div className="flex flex-wrap gap-[4px]">{a.states.map(s => <StatePill key={s} s={s}/>)}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span className="text-[12px] font-[500] text-[rgb(24,28,35)]">{t(`productAuthView.authMode.${a.authModeKey}`)}</span>
                      </td>
                      <td style={{padding:'12px'}}><StatusBadge status={a.status}/></td>
                      <td style={{padding:'12px'}}><span className="text-[13px] font-[600] text-[rgb(24,28,35)]">{a.monthlyLimit ?? t('productAuthView.tab2.noLimit')}</span></td>
                      <td style={{padding:'12px'}}>
                        {a.limitUsagePercent > 0 ? (
                          <div className="flex items-center gap-[8px]">
                            <span className="text-[13px] font-[700]" style={{ color: PROGRESS_COLORS[a.limitProgressColor||'gray'] }}>{a.limitUsagePercent}%</span>
                            <div className="flex flex-col">
                              <div className="h-[4px] w-[72px] overflow-hidden rounded-full bg-[rgba(193,198,215,0.3)]">
                                <div className="h-full rounded-full" style={{ width: Math.min(a.limitUsagePercent,100)+'%', backgroundColor: PROGRESS_COLORS[a.limitProgressColor||'gray'] }}/>
                              </div>
                              <span className="mt-[2px] text-[10px] text-[rgb(113,119,134)]">{a.limitUsageConsumed}</span>
                            </div>
                          </div>
                        ) : <span className="text-[12px] text-[rgb(113,119,134)]">—</span>}
                      </td>
                      <td style={{padding:'12px'}}>
                        <span className="text-[13px] font-[500]" style={{ color: a.status==='expired'?'rgb(192,57,43)':a.status==='expiring'?'rgb(160,92,0)':a.status==='withdrawn'?'rgb(113,119,134)':'rgb(24,28,35)' }}>{a.expiryPermanent ? t('productAuthView.expiryPermanent') : a.expiryDateLabel}</span>
                      </td>
                      <td style={{padding:'12px',textAlign:'right'}}>
                        <div className="inline-flex items-center gap-[8px] text-[rgb(113,119,134)]">
                          <button onClick={e=>{e.stopPropagation();setSelectedId(a.id)}} className="hover:text-[rgb(0,88,188)]"><Eye size={14}/></button>
                          <button onClick={e=>e.stopPropagation()} className="hover:text-[rgb(0,88,188)]"><Pencil size={14}/></button>
                          <button onClick={e=>e.stopPropagation()} className="hover:text-[rgb(0,88,188)]"><span className="text-[14px] font-[700]">···</span></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && <tr><td colSpan={9} style={{padding:'48px 12px',textAlign:'center',color:'rgb(113,119,134)',fontSize:'12px'}}>{t('noData')}</td></tr>}
              </tbody>
            </table>
            {/* Table footer record count — aligned to prototype */}
            <div className="px-[14px] py-[7px] text-[11.5px] text-[rgb(113,119,134)]" style={{ borderTop:'0.5px solid rgba(193,198,215,0.38)' }}>
              {t('productAuthView.footerCount', { n: filtered.length })}
            </div>
          </div>
        </div>

        {/* Right detail panel — 380px */}
        <div className="hidden lg:block">
          {selected ? (
            <div className="sticky top-[80px] overflow-hidden" style={{ borderRadius:14, backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
              <div className="flex items-start justify-between" style={{ padding:'16px 20px' }}>
                <div>
                  <h3 className="text-[16px] font-[700] text-[rgb(24,28,35)]">{selected.productName}</h3>
                  <p className="mt-[2px] text-[12px] text-[rgb(113,119,134)]">{selected.insurer}</p>
                </div>
                <button onClick={()=>setSelectedId(null)} className="text-[rgb(113,119,134)] hover:text-[rgb(24,28,35)]">
                  <X size={16}/>
                </button>
              </div>
              {/* Three label rows */}
              <div className="flex flex-wrap items-center gap-2" style={{ padding:'0 20px 16px', borderBottom:'0.666px solid rgba(193,198,215,0.3)' }}>
                <StatusBadge status={selected.status}/>
                <span className="rounded-[6px] px-[8px] py-[2px] text-[11px] font-[600]" style={{ backgroundColor:'rgba(193,198,215,0.25)', color:'rgb(24,28,35)' }}>{t(`productAuthView.authMode.${selected.authModeKey}`)}</span>
                <span className="rounded-[6px] px-[8px] py-[2px] text-[11px] font-[700]" style={{ backgroundColor:BRAND_LIGHT, color:BRAND }}>{selected.businessLine}</span>
              </div>
              {/* Detail fields, 5 rows */}
              <div style={{ padding:'16px 20px' }} className="space-y-3">
                {[
                  [t('productAuthView.detail.channelName'), selected.channelName],
                  [t('productAuthView.detail.channelType'), t(`productAuthView.channelType.${selected.channelTypeKey}`)],
                  [t('productAuthView.detail.effectiveDate'), selected.effectiveDate],
                  [t('productAuthView.detail.expiryDate'), selected.expiryPermanent ? t('productAuthView.detail.expiryDatePermanent') : selected.expiryDateLabel],
                  [t('productAuthView.detail.states'), selected.states.join(' / ')],
                ].map(([l,v]) => (
                  <div key={l} className="flex items-baseline justify-between gap-4">
                    <span className="shrink-0 text-[12px] text-[rgb(113,119,134)]">{l}</span>
                    <span className="text-right text-[12px] font-[500] text-[rgb(24,28,35)]">{v}</span>
                  </div>
                ))}
                {/* Operation permission pill group */}
                <div className="pt-2" style={{ borderTop:'0.666px solid rgba(193,198,215,0.3)' }}>
                  <div className="text-[11px] text-[rgb(113,119,134)] mb-2">{t('productAuthView.detail.opPermissions')}</div>
                  <div className="flex flex-wrap gap-[6px]">
                    <OpPill label={t('productAuthView.detail.opQuote')} on={selected.permissions.quote}/>
                    <OpPill label={t('productAuthView.detail.opBind')} on={selected.permissions.bind}/>
                    <OpPill label={t('productAuthView.detail.opEndorse')} on={selected.permissions.endorse}/>
                    <OpPill label={t('productAuthView.detail.opRenewal')} on={selected.permissions.renewal}/>
                    <OpPill label={t('productAuthView.detail.opSurrender')} on={selected.permissions.surrender}/>
                  </div>
                </div>
                {/* Monthly limit usage */}
                {selected.monthlyLimit !== null && selected.limitUsagePercent > 0 && (
                  <div className="mt-1 rounded-[8px] p-3" style={{ backgroundColor:'rgba(0,88,188,0.04)' }}>
                    <div className="text-[11px] text-[rgb(113,119,134)] mb-1">{t('productAuthView.detail.usageTitle')}</div>
                    <div className="flex items-baseline justify-between text-[13px] font-[600]">
                      <span style={{ color: BRAND }}>{selected.limitUsageConsumed}</span>
                      <span className="text-[12px] text-[rgb(113,119,134)]">/ {selected.monthlyLimit}</span>
                    </div>
                    <div className="mt-2 h-[4px] w-full overflow-hidden rounded-full bg-[rgba(193,198,215,0.3)]">
                      <div className="h-full rounded-full" style={{ width: Math.min(selected.limitUsagePercent,100)+'%', backgroundColor: BRAND }}/>
                    </div>
                  </div>
                )}
              </div>
              {/* Footer buttons */}
              <div style={{ padding:'12px 20px 20px' }} className="flex gap-2">
                <button className="inline-flex flex-1 items-center justify-center gap-[4px] rounded-[8px] py-[8px] text-[12px] font-[600] text-white" style={{ backgroundColor: BRAND }}>
                  <Pencil size={12}/>{t('productAuthView.detail.editBtn')}
                </button>
                <button className="inline-flex items-center justify-center gap-[4px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[14px] py-[8px] text-[12px] font-[500] text-[rgb(24,28,35)]">
                  {t('productAuthView.detail.renewBtn')}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
              <span className="text-[12px] text-[rgb(113,119,134)]">{t('productAuthView.detail.noSelection')}</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Tab2: permission matrix view */}
      {activeTab === 2 && (
      <div className="px-6 pb-10 sm:px-10">
        {/* Permission matrix title */}
        <div className="mb-3 flex items-center gap-2">
          <Zap size={16} style={{ color: BRAND }}/>
          <span className="text-[14px] font-[700] text-[rgb(24,28,35)]">{t('productAuthView.tab2.title')}</span>
          <span className="text-[12px] text-[rgb(113,119,134)]">{t('productAuthView.tab2.subtitle')}</span>
        </div>

        {/* Permission matrix table */}
        <div className="mb-6 overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
          <table className="min-w-full border-collapse">
            <thead><tr style={{ backgroundColor: TH_BG }}>
              <th style={{...thStyle, padding:'10px 12px', minWidth:140}} className="text-left">{t('productAuthView.tab2.colChannel')}</th>
              <th style={{...thStyle, padding:'10px 12px', minWidth:150}} className="text-left">{t('productAuthView.tab2.colProduct')}</th>
              <th style={{...thStyle, padding:'10px 12px', minWidth:140}} className="text-left">{t('productAuthView.tab2.colCarrier')}</th>
              {MATRIX_STATES.map(s => <th key={s} style={{...thStyle, padding:'10px 8px', width:70}} className="text-center">{s}</th>)}
            </tr></thead>
            <tbody>
              {MATRIX_DATA.map((row, ri) => (
                <tr key={ri} style={{ borderTop: ri===0?'none':'0.666px solid rgba(193,198,215,0.3)' }}>
                  <td style={{padding:'12px', fontSize:'13px', fontWeight:600, color:'rgb(24,28,35)'}}>{row.channelShort}</td>
                  <td style={{padding:'12px', fontSize:'13px', fontWeight:500, color:'rgb(24,28,35)'}}>{row.product}</td>
                  <td style={{padding:'12px', fontSize:'12px', color:'rgb(113,119,134)'}}>{row.carrier}</td>
                  {row.cells.map((c,ci) => (
                    <td key={ci} style={{padding:'12px 8px', textAlign:'center'}}><MatrixCell perms={c.perms}/></td>
                  ))}
                </tr>
              ))}
              <tr>
                <td colSpan={3+MATRIX_STATES.length} style={{padding:'10px 12px', fontSize:'11px', color:'rgb(113,119,134)', backgroundColor:'rgba(193,198,215,0.1)'}}>
                  {t('productAuthView.tab2.legend')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Two-column config panel */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          {/* Left column: channel/product selection */}
          <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
            <div style={{ padding:'12px 16px 10px' }}>
              <span className="text-[12px] font-[700] text-[rgb(24,28,35)]">{t('productAuthView.tab2.selectHint')}</span>
            </div>
            <div className="max-h-[360px] overflow-y-auto">
              {CHANNEL_PRODUCTS.map((cp, i) => (
                <button key={cp.id} onClick={()=>selectCp(cp.id)}
                  className="w-full text-left transition-colors"
                  style={{ padding:'12px 16px', backgroundColor:activeCp===cp.id ? BRAND_LIGHT : 'transparent', borderTop: i===0?'none':'0.666px solid rgba(193,198,215,0.3)' }}>
                  <div className="text-[13px] font-[700]" style={{ color:activeCp===cp.id ? BRAND : 'rgb(24,28,35)' }}>{cp.channel}</div>
                  <div className="mt-[2px] text-[11px]" style={{ color:activeCp===cp.id ? BRAND : 'rgb(113,119,134)' }}>
                    {cp.product} · {cp.carrier} · {cp.state}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right column: operation permission config */}
          <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW, padding:'20px 24px' }}>
            {/* Title */}
            <div className="mb-4">
              <div className="text-[15px] font-[700] text-[rgb(24,28,35)]">{activeCpData.channel}</div>
              <div className="mt-[2px] text-[12px] text-[rgb(113,119,134)]">
                {activeCpData.product} · {activeCpData.carrier} · {activeCpData.state}
              </div>
            </div>

            {/* Operation permission switches — toggleable per prototype PermToggle */}
            <div className="mb-5">
              <div className="text-[11px] text-[rgb(113,119,134)] mb-2">{t('productAuthView.tab2.usage')}</div>
              <div className="flex flex-wrap gap-[8px]">
                <PermToggle label={t('productAuthView.detail.opQuote')} on={draftPerms.quote} onChange={v=>setDraftPerms(p=>({...p,quote:v}))}/>
                <PermToggle label={t('productAuthView.detail.opBind')} on={draftPerms.bind} onChange={v=>setDraftPerms(p=>({...p,bind:v}))}/>
                <PermToggle label={t('productAuthView.detail.opEndorse')} on={draftPerms.endorse} onChange={v=>setDraftPerms(p=>({...p,endorse:v}))}/>
                <PermToggle label={t('productAuthView.detail.opRenewal')} on={draftPerms.renewal} onChange={v=>setDraftPerms(p=>({...p,renewal:v}))}/>
                <PermToggle label={t('productAuthView.detail.opSurrender')} on={draftPerms.surrender} onChange={v=>setDraftPerms(p=>({...p,surrender:v}))}/>
              </div>
            </div>

            {/* 3-tier limits — rendered per selected channel data */}
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { key:'perPolicy', label:t('productAuthView.tab2.limitPerPolicy'), value:activeCpData.limits.perPolicy },
                { key:'monthly', label:t('productAuthView.tab2.limitMonthly'), value:activeCpData.limits.monthly },
                { key:'quarterly', label:t('productAuthView.tab2.limitQuarterly'), value:activeCpData.limits.quarterly },
              ].map(l => (
                <div key={l.key}>
                  <div className="text-[11px] text-[rgb(113,119,134)] mb-1">{l.label}</div>
                  <div className="text-[18px] font-[700] mb-2" style={{ color: l.value ? 'rgb(24,28,35)' : 'rgb(160,165,180)' }}>{l.value ?? t('productAuthView.tab2.noLimit')}</div>
                  <div className="h-[3px] w-full overflow-hidden rounded-full bg-[rgba(193,198,215,0.3)]">
                    <div className="h-full rounded-full" style={{ width: '60%', backgroundColor: BRAND }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Over-limit handling rules — highlighted per selected channel data */}
            <div className="mb-5">
              <div className="text-[11px] text-[rgb(113,119,134)] mb-2">{t('productAuthView.tab2.overLimit')}</div>
              <div className="flex flex-wrap gap-[8px]">
                {([
                  ['manual-uw', t('productAuthView.tab2.ruleEscalate')],
                  ['block', t('productAuthView.tab2.ruleBlock')],
                ] as [OverLimitRule, string][]).map(([v, l]) => {
                  const on = activeCpData.overLimitRule === v
                  return <span key={v} className="rounded-[8px] px-[12px] py-[5px] text-[12px] font-[700]"
                    style={{ backgroundColor: on ? 'rgba(255,159,10,0.09)' : 'rgba(255,255,255,0.4)', color: on ? 'rgb(160,92,0)' : 'rgb(65,71,85)', border: `0.5px solid ${on ? 'rgba(255,159,10,0.25)' : 'rgba(193,198,215,0.38)'}` }}>
                    {l}
                  </span>
                })}
              </div>
            </div>

            {/* Footer buttons —— 原「提交审批」按钮已删除：本系统没有任何审批流程，配置保存即生效。 */}
            <div className="flex gap-2">
              <button className="inline-flex items-center justify-center gap-[6px] rounded-[8px] px-[20px] py-[8px] text-[12px] font-[700] text-white" style={{ backgroundColor: BRAND }}>
                <Check size={14}/>{t('productAuthView.tab2.btnSave')}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modals preserved */}
      <ProductAuthMatrixModal open={showModal} onClose={()=>setShowModal(false)}
        onSubmit={()=>setShowModal(false)}/>
    </div>
  )
}
