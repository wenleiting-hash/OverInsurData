import { useMemo, useState, useEffect } from 'react'
import { Search, Plus, AlertTriangle, X, Eye, Pencil, Check, Shield, ShieldCheck, Clock, Info, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import type { ViewId } from '@/App'
import { insurerApi, productApi, type ProductRecord, type InsurerRecord } from '@/lib/user-api-client'
import {
  useChannels, useAuthorizations, useCreateAuthorization, useUpdateAuthorization,
  useSetAuthorizationStatus, useUpsertPermission,
} from '@/services/channelAuthService'
import type { ChannelOrg, ChannelAuthorization, IssuancePermissionPayload } from '@/lib/user-api-client'

interface Props { navigateTo: (view: ViewId) => void }

type EffStatus = 'active' | 'expiring' | 'expired' | 'revoked'
type GrantType = 'permanent' | 'fixed' | 'trial'
type BindMode = 'direct' | 'underwrite' | 'forbidden'
type TFunc = ReturnType<typeof useTranslation>['t']

// Figma design tokens (kept from the original view)
const BRAND = 'rgb(0, 88, 188)'
const BRAND_LIGHT = 'rgba(0, 88, 188, 0.09)'
const TH_BG = 'rgba(236, 237, 249, 0.5)'
const CARD_BG = 'rgba(255, 255, 255, 0.58)'
const CARD_BD = '0.666px solid rgba(193, 198, 215, 0.55)'
const CARD_SHADOW = { boxShadow: 'rgba(0, 58, 152, 0.05) 0px 2px 12px 0px' }
const STATUS_COLORS: Record<EffStatus, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,199,89,0.1)',   color: 'rgb(26,122,46)' },
  expiring:  { bg: 'rgba(255,159,10,0.09)', color: 'rgb(160,92,0)' },
  expired:   { bg: 'rgba(255,59,48,0.08)',  color: 'rgb(192,57,43)' },
  revoked:   { bg: 'rgba(113,119,134,0.1)', color: 'rgb(113,119,134)' },
}

const OPS: { key: keyof Pick<ChannelAuthorization,'can_quote'|'can_bind'|'can_endorse'|'can_renew'|'can_surrender'|'can_claim_report'>; label: string }[] = [
  { key: 'can_quote',        label: 'opQuote' },
  { key: 'can_bind',         label: 'opBind' },
  { key: 'can_endorse',      label: 'opEndorse' },
  { key: 'can_renew',        label: 'opRenewal' },
  { key: 'can_surrender',    label: 'opSurrender' },
  { key: 'can_claim_report', label: 'opClaim' },
]

interface ToastState { msg: string; type: 'success' | 'error' }

/** Extract a human-readable message from an axios-style error. */
function errMsg(e: any, t: TFunc): string {
  const m = e?.response?.data?.message
  if (Array.isArray(m)) return m.join('; ')
  return m || e?.message || t('productAuthView.unknownError')
}

function fmtDate(v: string | null): string {
  if (!v) return ''
  return v.slice(0, 10)
}

export default function ProductAuthView(_: Props) {
  const { t } = useTranslation('channel')
  const [activeTab, setActiveTab] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [carrierFilter, setCarrierFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<ToastState | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ChannelAuthorization | null>(null)
  const [confirm, setConfirm] = useState<{ mode: 'revoke' | 'renew'; ids: string[] } | null>(null)
  const [permAuthId, setPermAuthId] = useState<string | null>(null)

  const channelsQ = useChannels()
  const authsQ = useAuthorizations()
  const channels: ChannelOrg[] = channelsQ.data ?? []
  const auths: ChannelAuthorization[] = authsQ.data ?? []

  const carriersQ = useQuery<{ data: InsurerRecord[] }>({
    queryKey: ['insurers', 'channel-auth-options'],
    queryFn: () => insurerApi.getList({ size: 100 }),
    staleTime: 60_000,
  })
  const carriers = (carriersQ.data?.data ?? []).filter(c => (c.status ?? '').toLowerCase() === 'active')

  const createM = useCreateAuthorization()
  const updateM = useUpdateAuthorization()
  const statusM = useSetAuthorizationStatus()
  const permM = useUpsertPermission()

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 3200)
  }

  const channelName = (id: string) => channels.find(c => c.channel_id === id)?.channel_name ?? id

  const stats = useMemo(() => (['active', 'expiring', 'expired', 'revoked'] as EffStatus[])
    .map(k => ({ key: k, count: auths.filter(a => a.effective_status === k).length })), [auths])

  const filtered = useMemo(() => auths.filter(a => {
    const q = searchQuery.trim().toLowerCase()
    return (!q || (a.channel_name ?? '').toLowerCase().includes(q) || (a.product_name ?? '').toLowerCase().includes(q))
      && (statusFilter === 'all' || a.effective_status === statusFilter)
      && (channelFilter === 'all' || a.channel_id === channelFilter)
      && (carrierFilter === 'all' || a.carrier_id === carrierFilter)
  }), [auths, searchQuery, statusFilter, channelFilter, carrierFilter])

  useEffect(() => {
    if (!selectedId && filtered.length) setSelectedId(filtered[0].auth_id)
    if (selectedId && !auths.some(a => a.auth_id === selectedId)) setSelectedId(filtered[0]?.auth_id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auths])

  const selected = auths.find(a => a.auth_id === selectedId) ?? null
  const expiringCount = stats.find(s => s.key === 'expiring')?.count ?? 0

  const toggleCheck = (id: string) => setChecked(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (a: ChannelAuthorization) => { setEditing(a); setFormOpen(true) }

  const goConfigPermission = (id: string) => { setPermAuthId(id); setActiveTab(2) }

  const handleBatchRevoke = () => {
    if (!checked.size) return
    setConfirm({ mode: 'revoke', ids: Array.from(checked) })
  }

  const StatusBadge = ({ status }: { status: EffStatus }) => {
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

  const StatIcon = ({ status }: { status: EffStatus }) => {
    const map = { active: Check, expiring: Clock, expired: X, revoked: X } as const
    const Ic = map[status]
    return <Ic size={14}/>
  }

  const StatCard = ({ stat }: { stat: { key: EffStatus; count: number } }) => {
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
        width: 176, borderRadius: '10px 10px 0px 0px',
        backgroundColor: active ? BRAND_LIGHT : 'transparent',
        color: active ? BRAND : 'rgb(113,119,134)',
        borderBottom: active ? '2px solid ' + BRAND : '2px solid transparent',
        fontSize: '13px', fontWeight: active ? 700 : 500, padding: '0 16px',
      }}>{icon}{label}</button>
  )

  const thStyle = { fontSize:'11px', fontWeight:700, color:'rgb(160,165,180)', padding:'8px 12px' }

  const selectCls = 'h-[32px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12px] text-[rgb(24,28,35)] focus:outline-none max-w-[200px]'

  return (
    <div className="flex-1">
      {/* Toast */}
      {toast && (
        <div className="fixed left-1/2 top-5 z-[60] -translate-x-1/2 rounded-[10px] px-4 py-2 text-[12.5px] font-[600] text-white shadow-lg"
          style={{ backgroundColor: toast.type === 'success' ? 'rgb(26,122,46)' : 'rgb(192,57,43)' }}>
          {toast.msg}
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgb(24,28,35)', letterSpacing: '-0.3px' }}>{t('productAuthView.title')}</h1>
            <p className="mt-[4px] text-[13px] text-[rgb(113,119,134)]">{t('productAuthView.subtitle')}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex items-end border-b-[0.666px] border-[rgba(193,198,215,0.55)]">
          <TabBtn active={activeTab===1} icon={<ShieldCheck size={14}/>} label={t('productAuthView.tabProducts')} onClick={() => setActiveTab(1)}/>
          <TabBtn active={activeTab===2} icon={<Shield size={14}/>} label={t('productAuthView.tabPermissions')} onClick={() => setActiveTab(2)}/>
        </div>
      </div>

      {/* ══════════ Tab 1: product authorizations ══════════ */}
      {activeTab === 1 && (
      <div className="grid grid-cols-1 gap-6 px-6 pb-10 lg:grid-cols-[1fr_380px] sm:px-10">
        <div className="min-w-0 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => <StatCard key={s.key} stat={s}/>)}
          </div>

          {expiringCount > 0 && (
            <div className="flex items-center gap-2" style={{ borderRadius:10, backgroundColor:'rgba(255,159,10,0.09)', border:'0.666px solid rgba(255,159,10,0.25)', padding:'10px 16px', color:'rgb(160,92,0)', fontSize:'12px', fontWeight:500 }}>
              <AlertTriangle size={14} className="shrink-0"/>
              {t('productAuthView.warningExpiring', { n: expiringCount })}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] max-w-[320px] flex-1">
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgb(113,119,134)]"/>
              <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                placeholder={t('productAuthView.searchPlaceholder')}
                className="h-[32px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white pl-[32px] pr-[10px] text-[12px] text-[rgb(24,28,35)] placeholder-[rgb(113,119,134)] focus:border-[rgb(0,88,188)] focus:outline-none"/>
            </div>
            <select value={channelFilter} onChange={e=>setChannelFilter(e.target.value)} className={selectCls}>
              <option value="all">{t('productAuthView.allChannels')}</option>
              {channels.map(c => <option key={c.channel_id} value={c.channel_id}>{c.channel_name}</option>)}
            </select>
            <select value={carrierFilter} onChange={e=>setCarrierFilter(e.target.value)} className={selectCls}>
              <option value="all">{t('productAuthView.allCarriers')}</option>
              {carriers.map(c => <option key={c.carrier_id ?? c.id} value={c.carrier_id ?? c.id}>{c.carrier_name}</option>)}
            </select>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={selectCls}>
              <option value="all">{t('productAuthView.allStatuses')}</option>
              {(['active','expiring','expired','revoked'] as EffStatus[]).map(s =>
                <option key={s} value={s}>{t(`productAuthView.status.${s}`)}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {checked.size > 0 && (
                <button onClick={handleBatchRevoke}
                  className="inline-flex h-[28px] items-center gap-[4px] rounded-[8px] border-[0.666px] border-[rgba(255,59,48,0.35)] bg-[rgba(255,59,48,0.06)] px-[12px] text-[12px] font-[600] text-[rgb(192,57,43)] hover:opacity-90">
                  <RotateCcw size={12}/>{t('productAuthView.batchRevoke', { n: checked.size })}
                </button>
              )}
              <button onClick={openCreate} className="inline-flex h-[28px] items-center gap-[4px] rounded-[8px] px-[14px] text-[12px] font-[700] text-white hover:opacity-90" style={{ backgroundColor: BRAND }}>
                <Plus size={12}/>{t('productAuthView.addAuth')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
            <table className="min-w-full border-collapse">
              <thead><tr style={{ backgroundColor: TH_BG }}>
                <th style={{...thStyle, width:32}}/>
                <th style={{...thStyle, minWidth:160}} className="text-left">{t('productAuthView.table.channel')}</th>
                <th style={{...thStyle, minWidth:150}} className="text-left">{t('productAuthView.table.product')}</th>
                <th style={{...thStyle, minWidth:100}} className="text-left">{t('productAuthView.table.states')}</th>
                <th style={{...thStyle, minWidth:90}} className="text-left">{t('productAuthView.table.type')}</th>
                <th style={{...thStyle, minWidth:110}} className="text-left">{t('productAuthView.table.expiryDate')}</th>
                <th style={{...thStyle, minWidth:80}} className="text-left">{t('productAuthView.table.status')}</th>
                <th style={{...thStyle, minWidth:80}} className="text-right"/>
              </tr></thead>
              <tbody>
                {filtered.map(a => {
                  const sel = selectedId === a.auth_id
                  const disabledRow = a.effective_status === 'revoked'
                  return (
                    <tr key={a.auth_id} onClick={()=>setSelectedId(a.auth_id)} className="cursor-pointer"
                      style={{ backgroundColor: sel ? BRAND_LIGHT : 'transparent', opacity: disabledRow ? 0.62 : 1 }}>
                      <td style={{padding:'12px'}} onClick={e=>e.stopPropagation()}>
                        {a.effective_status !== 'revoked' && (
                          <input type="checkbox" checked={checked.has(a.auth_id)} onChange={()=>toggleCheck(a.auth_id)}
                            className="h-[14px] w-[14px] accent-[rgb(0,88,188)]"/>
                        )}
                      </td>
                      <td style={{padding:'12px'}}>
                        <div className="text-[13px] font-[600] text-[rgb(24,28,35)] leading-[1.4]">{a.channel_name ?? channelName(a.channel_id)}</div>
                        <div className="mt-[2px] text-[11px] text-[rgb(113,119,134)]">{a.channel_id}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <div className="text-[13px] font-[500] text-[rgb(24,28,35)] leading-[1.4]">{a.product_name}</div>
                        <div className="mt-[2px] text-[11px] text-[rgb(113,119,134)]">{a.carrier_name} · {a.line_of_business}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <div className="flex flex-wrap gap-[4px]">{(a.authorized_states ?? []).map(s => <StatePill key={s} s={s}/>)}</div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span className="text-[12px] font-[500] text-[rgb(24,28,35)]">{t(`productAuthView.grantType.${a.grant_type}`)}</span>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span className="text-[12px] font-[500]"
                          style={{ color: a.effective_status==='expired'?'rgb(192,57,43)':a.effective_status==='expiring'?'rgb(160,92,0)':a.effective_status==='revoked'?'rgb(113,119,134)':'rgb(24,28,35)' }}>
                          {a.grant_type === 'permanent' ? t('productAuthView.expiryPermanent') : (fmtDate(a.expiration_date) || '—')}
                        </span>
                      </td>
                      <td style={{padding:'12px'}}><StatusBadge status={a.effective_status}/></td>
                      <td style={{padding:'12px',textAlign:'right'}} onClick={e=>e.stopPropagation()}>
                        <div className="inline-flex items-center gap-[8px] text-[rgb(113,119,134)]">
                          <button onClick={()=>setSelectedId(a.auth_id)} title={t('productAuthView.actionView')} className="hover:text-[rgb(0,88,188)]"><Eye size={14}/></button>
                          {a.effective_status !== 'revoked' && (
                            <button onClick={()=>openEdit(a)} title={t('productAuthView.actionEdit')} className="hover:text-[rgb(0,88,188)]"><Pencil size={14}/></button>
                          )}
                          {a.effective_status !== 'revoked'
                            ? <button onClick={()=>setConfirm({ mode:'revoke', ids:[a.auth_id] })} title={t('productAuthView.actionRevoke')} className="hover:text-[rgb(192,57,43)]"><RotateCcw size={14}/></button>
                            : <button onClick={()=>setConfirm({ mode:'renew', ids:[a.auth_id] })} title={t('productAuthView.actionRenew')} className="hover:text-[rgb(0,88,188)]"><Info size={14}/></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && <tr><td colSpan={8} style={{padding:'48px 12px',textAlign:'center',color:'rgb(113,119,134)',fontSize:'12px'}}>
                  {authsQ.isLoading ? t('productAuthView.loading') : t('noData')}
                </td></tr>}
              </tbody>
            </table>
            <div className="px-[14px] py-[7px] text-[11.5px] text-[rgb(113,119,134)]" style={{ borderTop:'0.5px solid rgba(193,198,215,0.38)' }}>
              {t('productAuthView.footerCount', { n: filtered.length })}
            </div>
          </div>
        </div>

        {/* Right detail panel */}
        <div className="hidden lg:block">
          {selected ? (
            <div className="sticky top-[80px] overflow-hidden" style={{ borderRadius:14, backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
              <div className="flex items-start justify-between" style={{ padding:'16px 20px' }}>
                <div>
                  <h3 className="text-[16px] font-[700] text-[rgb(24,28,35)]">{selected.product_name}</h3>
                  <p className="mt-[2px] text-[12px] text-[rgb(113,119,134)]">{selected.carrier_name}</p>
                </div>
                <button onClick={()=>setSelectedId(null)} className="text-[rgb(113,119,134)] hover:text-[rgb(24,28,35)]"><X size={16}/></button>
              </div>
              <div className="flex flex-wrap items-center gap-2" style={{ padding:'0 20px 16px', borderBottom:'0.666px solid rgba(193,198,215,0.3)' }}>
                <StatusBadge status={selected.effective_status}/>
                <span className="rounded-[6px] px-[8px] py-[2px] text-[11px] font-[600]" style={{ backgroundColor:'rgba(193,198,215,0.25)', color:'rgb(24,28,35)' }}>{t(`productAuthView.grantType.${selected.grant_type}`)}</span>
                {selected.line_of_business && <span className="rounded-[6px] px-[8px] py-[2px] text-[11px] font-[700]" style={{ backgroundColor:BRAND_LIGHT, color:BRAND }}>{selected.line_of_business}</span>}
              </div>
              <div style={{ padding:'16px 20px' }} className="space-y-3">
                {[
                  [t('productAuthView.detail.channelName'), selected.channel_name ?? channelName(selected.channel_id)],
                  [t('productAuthView.detail.effectiveDate'), fmtDate(selected.effective_date) || '—'],
                  [t('productAuthView.detail.expiryDate'), selected.grant_type === 'permanent' ? t('productAuthView.detail.expiryDatePermanent') : (fmtDate(selected.expiration_date) || '—')],
                  [t('productAuthView.detail.states'), (selected.authorized_states ?? []).join(' / ') || '—'],
                  ...(selected.effective_status === 'revoked' && selected.revoke_reason
                    ? [[t('productAuthView.detail.revokeReason'), selected.revoke_reason] as [string,string]]
                    : []),
                ].map(([l,v], i) => (
                  <div key={i} className="flex items-baseline justify-between gap-4">
                    <span className="shrink-0 text-[12px] text-[rgb(113,119,134)]">{l}</span>
                    <span className="text-right text-[12px] font-[500] text-[rgb(24,28,35)]">{v}</span>
                  </div>
                ))}
                <div className="pt-2" style={{ borderTop:'0.666px solid rgba(193,198,215,0.3)' }}>
                  <div className="text-[11px] text-[rgb(113,119,134)] mb-2">{t('productAuthView.detail.opPermissions')}</div>
                  <div className="flex flex-wrap gap-[6px]">
                    {OPS.map(op => (
                      <OpPill key={op.key} label={t(`productAuthView.detail.${op.label}`)} on={!!selected[op.key]}/>
                    ))}
                  </div>
                  {selected.bind_mode && selected.bind_mode !== 'direct' && (
                    <div className="mt-2 text-[11px] font-[600]" style={{ color: selected.bind_mode === 'forbidden' ? 'rgb(192,57,43)' : 'rgb(160,92,0)' }}>
                      {t(`productAuthView.bindMode.${selected.bind_mode}`)}
                    </div>
                  )}
                </div>
                {(selected.limit_per_policy != null || selected.limit_monthly != null || selected.limit_quarterly != null) && (
                  <div className="rounded-[8px] p-3" style={{ backgroundColor:'rgba(0,88,188,0.04)' }}>
                    <div className="space-y-1 text-[11.5px]">
                      {selected.limit_per_policy != null && <div className="flex justify-between"><span className="text-[rgb(113,119,134)]">{t('productAuthView.tab2.limitPerPolicy')}</span><span className="font-[700]" style={{color:BRAND}}>${Number(selected.limit_per_policy).toLocaleString()}</span></div>}
                      {selected.limit_monthly != null && <div className="flex justify-between"><span className="text-[rgb(113,119,134)]">{t('productAuthView.tab2.limitMonthly')}</span><span className="font-[700]" style={{color:BRAND}}>${Number(selected.limit_monthly).toLocaleString()}</span></div>}
                      {selected.limit_quarterly != null && <div className="flex justify-between"><span className="text-[rgb(113,119,134)]">{t('productAuthView.tab2.limitQuarterly')}</span><span className="font-[700]" style={{color:BRAND}}>${Number(selected.limit_quarterly).toLocaleString()}</span></div>}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ padding:'12px 20px 20px' }} className="flex gap-2">
                <button onClick={()=>goConfigPermission(selected.auth_id)}
                  className="inline-flex flex-1 items-center justify-center gap-[4px] rounded-[8px] py-[8px] text-[12px] font-[600] text-white" style={{ backgroundColor: BRAND }}>
                  <Shield size={12}/>{t('productAuthView.detail.configPermBtn')}
                </button>
                {selected.effective_status === 'revoked' ? (
                  <button onClick={()=>setConfirm({ mode:'renew', ids:[selected.auth_id] })}
                    className="inline-flex items-center justify-center gap-[4px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[14px] py-[8px] text-[12px] font-[500] text-[rgb(24,28,35)]">
                    {t('productAuthView.detail.renewBtn')}
                  </button>
                ) : (
                  <button onClick={()=>openEdit(selected)}
                    className="inline-flex items-center justify-center gap-[4px] rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[14px] py-[8px] text-[12px] font-[500] text-[rgb(24,28,35)]">
                    <Pencil size={12}/>{t('productAuthView.detail.editBtn')}
                  </button>
                )}
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

      {/* ══════════ Tab 2: issuance permissions & limits ══════════ */}
      {activeTab === 2 && (
        <PermissionTab
          auths={filtered}
          allAuths={auths}
          channels={channels}
          selectedId={permAuthId}
          onSelect={setPermAuthId}
          saving={permM.isPending}
          onSave={async (id, dto) => {
            try { await permM.mutateAsync({ id, dto }); showToast(t('productAuthView.toast.permSaved')) }
            catch (e) { showToast(errMsg(e, t), 'error') }
          }}
          thStyle={thStyle}
          t={t}
        />
      )}

      {/* Create / edit modal */}
      {formOpen && (
        <AuthFormModal
          editing={editing}
          channels={channels.filter(c => c.status === 'active')}
          carriers={carriers}
          onClose={() => setFormOpen(false)}
          saving={createM.isPending || updateM.isPending}
          onSubmit={async (payload) => {
            try {
              if (editing) {
                await updateM.mutateAsync({
                  id: editing.auth_id,
                  dto: {
                    authorized_states: payload.authorized_states,
                    grant_type: payload.grant_type,
                    effective_date: payload.effective_date,
                    expiration_date: payload.grant_type === 'permanent' ? null : payload.expiration_date,
                  },
                })
                showToast(t('productAuthView.toast.authUpdated'))
              } else {
                const created = await createM.mutateAsync(payload)
                showToast(t('productAuthView.toast.authCreated'))
                setSelectedId(created.auth_id)
              }
              setFormOpen(false)
            } catch (e) {
              showToast(errMsg(e, t), 'error')
            }
          }}
          t={t}
        />
      )}

      {/* Revoke / renew confirmation */}
      {confirm && (
        <ConfirmDialog
          mode={confirm.mode}
          count={confirm.ids.length}
          onCancel={() => setConfirm(null)}
          onConfirm={async (opts) => {
            try {
              for (const id of confirm.ids) {
                // eslint-disable-next-line no-await-in-loop
                await statusM.mutateAsync({
                  id,
                  action: confirm.mode,
                  reason: opts.reason,
                  expiration_date: opts.expiration_date || undefined,
                })
              }
              showToast(confirm.mode === 'revoke' ? t('productAuthView.toast.revoked') : t('productAuthView.toast.renewed'))
              setChecked(new Set())
              setConfirm(null)
            } catch (e) {
              showToast(errMsg(e, t), 'error')
            }
          }}
          saving={statusM.isPending}
          t={t}
        />
      )}
    </div>
  )
}

// ─── Create / edit authorization modal ────────────────────────────────

function AuthFormModal({
  editing, channels, carriers, onClose, onSubmit, saving, t,
}: {
  editing: ChannelAuthorization | null
  channels: ChannelOrg[]
  carriers: InsurerRecord[]
  onClose: () => void
  saving: boolean
  onSubmit: (payload: {
    channel_id: string; product_id: string; authorized_states: string[];
    grant_type: GrantType; effective_date?: string; expiration_date?: string;
  }) => void
  t: TFunc
}) {
  const [channelId, setChannelId] = useState(editing?.channel_id ?? '')
  const [carrierId, setCarrierId] = useState(editing?.carrier_id ?? '')
  const [productId, setProductId] = useState(editing?.product_id ?? '')
  const [states, setStates] = useState<string[]>(editing?.authorized_states ?? [])
  const [grantType, setGrantType] = useState<GrantType>(editing?.grant_type ?? 'permanent')
  const [effectiveDate, setEffectiveDate] = useState(editing ? fmtDate(editing.effective_date) : '')
  const [expirationDate, setExpirationDate] = useState(editing ? fmtDate(editing.expiration_date) : '')

  const channel = channels.find(c => c.channel_id === channelId)

  const productsQ = useQuery<{ data: ProductRecord[] }>({
    queryKey: ['products', 'for-auth', carrierId],
    queryFn: () => productApi.getList({ insurer: carrierId, status: 'Active', size: 200 }),
    enabled: !!carrierId,
    staleTime: 30_000,
  })
  const products = productsQ.data?.data ?? []
  const product = products.find(p => p.id === productId)

  // States allowed = product sellable ∩ channel licensed
  const eligibleStates = useMemo(() => {
    if (!product || !channel) return [] as string[]
    const sellable = product.available_states ?? []
    return sellable.filter(s => (channel.licensed_states ?? []).includes(s))
  }, [product, channel])

  // Reset state selection when the product changes (only in create mode)
  useEffect(() => {
    if (!editing) setStates([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, channelId])

  const toggleState = (s: string) => setStates(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const valid = !!channelId && !!carrierId && !!productId && states.length > 0
    && (grantType === 'permanent' || !!expirationDate)

  const labelCls = 'mb-1 block text-[11.5px] font-[600] text-[rgb(113,119,134)]'
  const selCls = 'h-[34px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12.5px] text-[rgb(24,28,35)] focus:border-[rgb(0,88,188)] focus:outline-none'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(24,28,35,0.45)' }} onClick={onClose}>
      <div className="max-h-[88vh] w-[560px] overflow-y-auto rounded-[16px] bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-[800] text-[rgb(24,28,35)]">
            {editing ? t('productAuthView.form.titleEdit') : t('productAuthView.form.titleCreate')}
          </h3>
          <button onClick={onClose} className="text-[rgb(113,119,134)] hover:text-[rgb(24,28,35)]"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          {!editing && (
            <div>
              <label className={labelCls}>{t('productAuthView.form.channel')} *</label>
              <select value={channelId} onChange={e=>setChannelId(e.target.value)} className={selCls}>
                <option value="">{t('productAuthView.form.selectChannel')}</option>
                {channels.map(c => <option key={c.channel_id} value={c.channel_id}>{c.channel_name} ({c.channel_id})</option>)}
              </select>
            </div>
          )}
          {!editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t('productAuthView.form.carrier')} *</label>
                <select value={carrierId} onChange={e=>{ setCarrierId(e.target.value); setProductId('') }} className={selCls}>
                  <option value="">{t('productAuthView.form.selectCarrier')}</option>
                  {carriers.map(c => <option key={c.carrier_id ?? c.id} value={c.carrier_id ?? c.id}>{c.carrier_name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>{t('productAuthView.form.product')} *</label>
                <select value={productId} onChange={e=>setProductId(e.target.value)} className={selCls} disabled={!carrierId}>
                  <option value="">{t('productAuthView.form.selectProduct')}</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                </select>
              </div>
            </div>
          )}
          {editing && (
            <div className="rounded-[8px] bg-[rgba(0,88,188,0.05)] px-3 py-2 text-[12px] text-[rgb(65,71,85)]">
              {editing.channel_name} · {editing.product_name} · {editing.carrier_name}
            </div>
          )}

          <div>
            <label className={labelCls}>{t('productAuthView.form.states')} *</label>
            {!productId && !editing
              ? <p className="text-[12px] text-[rgb(113,119,134)]">{t('productAuthView.form.statesHintPick')}</p>
              : eligibleStates.length === 0
                ? <p className="rounded-[8px] bg-[rgba(255,59,48,0.07)] px-3 py-2 text-[12px] font-[600] text-[rgb(192,57,43)]">{t('productAuthView.form.noEligibleStates')}</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {eligibleStates.map(s => {
                      const on = states.includes(s)
                      return (
                        <button type="button" key={s} onClick={()=>toggleState(s)}
                          className="rounded-[8px] px-[12px] py-[6px] text-[12px] font-[700] transition-colors"
                          style={{
                            backgroundColor: on ? BRAND_LIGHT : 'rgba(193,198,215,0.12)',
                            color: on ? BRAND : 'rgb(113,119,134)',
                            border: `0.666px solid ${on ? 'rgba(0,88,188,0.35)' : 'rgba(193,198,215,0.4)'}`,
                          }}>{s}</button>
                      )
                    })}
                  </div>
                )}
          </div>

          <div>
            <label className={labelCls}>{t('productAuthView.form.grantType')}</label>
            <div className="flex gap-2">
              {(['permanent','fixed','trial'] as GrantType[]).map(g => {
                const on = grantType === g
                return (
                  <button type="button" key={g} onClick={()=>setGrantType(g)}
                    className="flex-1 rounded-[8px] py-[7px] text-[12px] font-[700]"
                    style={{
                      backgroundColor: on ? BRAND : 'rgba(193,198,215,0.12)',
                      color: on ? '#fff' : 'rgb(113,119,134)',
                      border: `0.666px solid ${on ? BRAND : 'rgba(193,198,215,0.4)'}`,
                    }}>{t(`productAuthView.grantType.${g}`)}</button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('productAuthView.form.effectiveDate')}</label>
              <input type="date" value={effectiveDate} onChange={e=>setEffectiveDate(e.target.value)}
                className="h-[34px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12.5px] focus:border-[rgb(0,88,188)] focus:outline-none"/>
            </div>
            {grantType !== 'permanent' && (
              <div>
                <label className={labelCls}>{t('productAuthView.form.expirationDate')} *</label>
                <input type="date" value={expirationDate} onChange={e=>setExpirationDate(e.target.value)}
                  className="h-[34px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12.5px] focus:border-[rgb(0,88,188)] focus:outline-none"/>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[16px] py-[8px] text-[12.5px] font-[600] text-[rgb(24,28,35)]">
            {t('productAuthView.form.cancel')}
          </button>
          <button disabled={!valid || saving} onClick={()=>onSubmit({
            channel_id: channelId, product_id: productId, authorized_states: states,
            grant_type: grantType,
            effective_date: effectiveDate || undefined,
            expiration_date: expirationDate || undefined,
          })}
            className="rounded-[8px] px-[18px] py-[8px] text-[12.5px] font-[700] text-white disabled:opacity-50" style={{ backgroundColor: BRAND }}>
            {saving ? t('productAuthView.form.saving') : t('productAuthView.form.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Revoke / renew confirmation dialog ───────────────────────────────

function ConfirmDialog({
  mode, count, onCancel, onConfirm, saving, t,
}: {
  mode: 'revoke' | 'renew'
  count: number
  onCancel: () => void
  onConfirm: (opts: { reason?: string; expiration_date?: string }) => void
  saving: boolean
  t: TFunc
}) {
  const [reason, setReason] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(24,28,35,0.45)' }} onClick={onCancel}>
      <div className="w-[440px] rounded-[16px] bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}>
        <h3 className="text-[15.5px] font-[800] text-[rgb(24,28,35)]">
          {mode === 'revoke' ? t('productAuthView.confirm.revokeTitle', { n: count }) : t('productAuthView.confirm.renewTitle')}
        </h3>
        <p className="mt-2 text-[12.5px] text-[rgb(113,119,134)]">
          {mode === 'revoke' ? t('productAuthView.confirm.revokeText', { n: count }) : t('productAuthView.confirm.renewText')}
        </p>
        {mode === 'revoke' && (
          <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2}
            placeholder={t('productAuthView.confirm.reasonPlaceholder')}
            className="mt-3 w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white p-[10px] text-[12.5px] focus:border-[rgb(0,88,188)] focus:outline-none"/>
        )}
        {mode === 'renew' && (
          <div className="mt-3">
            <label className="mb-1 block text-[11.5px] font-[600] text-[rgb(113,119,134)]">{t('productAuthView.confirm.newExpiry')}</label>
            <input type="date" value={expirationDate} onChange={e=>setExpirationDate(e.target.value)}
              className="h-[34px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12.5px] focus:border-[rgb(0,88,188)] focus:outline-none"/>
            <p className="mt-1 text-[11px] text-[rgb(113,119,134)]">{t('productAuthView.confirm.renewDefault')}</p>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel}
            className="rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[16px] py-[8px] text-[12.5px] font-[600] text-[rgb(24,28,35)]">
            {t('productAuthView.confirm.cancel')}
          </button>
          <button disabled={saving} onClick={()=>onConfirm({ reason: reason || undefined, expiration_date: expirationDate || undefined })}
            className="rounded-[8px] px-[18px] py-[8px] text-[12.5px] font-[700] text-white disabled:opacity-50"
            style={{ backgroundColor: mode === 'revoke' ? 'rgb(192,57,43)' : BRAND }}>
            {saving ? t('productAuthView.confirm.saving') : (mode === 'revoke' ? t('productAuthView.confirm.confirmRevoke') : t('productAuthView.confirm.confirmRenew'))}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: permission matrix + configuration panel ───────────────────

function PermissionTab({
  auths, allAuths, selectedId, onSelect, saving, onSave, thStyle, t,
}: {
  auths: ChannelAuthorization[]
  allAuths: ChannelAuthorization[]
  channels: ChannelOrg[]
  selectedId: string | null
  onSelect: (id: string) => void
  saving: boolean
  onSave: (id: string, dto: IssuancePermissionPayload) => void
  thStyle: React.CSSProperties
  t: TFunc
}) {
  const active = auths.find(a => a.auth_id === selectedId) ?? auths[0] ?? null
  const [ops, setOps] = useState<Record<string, boolean>>({})
  const [bindMode, setBindMode] = useState<BindMode>('direct')
  const [limits, setLimits] = useState<{ per: string; month: string; quarter: string }>({ per:'', month:'', quarter:'' })
  const [rule, setRule] = useState<'manual' | 'forbidden' | 'approval'>('manual')

  // Hydrate draft when selection / source row changes
  useEffect(() => {
    if (!active) return
    setOps({
      can_quote: !!active.can_quote, can_bind: !!active.can_bind, can_endorse: !!active.can_endorse,
      can_renew: !!active.can_renew, can_surrender: !!active.can_surrender, can_claim_report: !!active.can_claim_report,
    })
    setBindMode((active.bind_mode as BindMode) ?? ((active.can_bind ? 'direct' : 'forbidden')))
    setLimits({
      per: active.limit_per_policy != null ? String(active.limit_per_policy) : '',
      month: active.limit_monthly != null ? String(active.limit_monthly) : '',
      quarter: active.limit_quarterly != null ? String(active.limit_quarterly) : '',
    })
    setRule((active.over_limit_rule as typeof rule) ?? 'manual')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.auth_id])

  if (!active) {
    return (
      <div className="px-6 pb-10 sm:px-10">
        <div className="flex h-[200px] items-center justify-center rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
          <span className="text-[12px] text-[rgb(113,119,134)]">{t('noData')}</span>
        </div>
      </div>
    )
  }

  const setOp = (k: string, v: boolean) => setOps(prev => ({ ...prev, [k]: v }))

  const handleSave = () => {
    const num = (s: string) => { const n = Number(s); return s.trim() === '' ? undefined : Number.isFinite(n) ? n : undefined }
    const dto: IssuancePermissionPayload = {
      ...ops,
      bind_mode: bindMode,
      can_bind: bindMode !== 'forbidden' ? (ops.can_bind ?? true) : false,
      over_limit_rule: rule,
    }
    const lp = num(limits.per), lm = num(limits.month), lq = num(limits.quarter)
    if (lp !== undefined) dto.limit_per_policy = lp
    if (lm !== undefined) dto.limit_monthly = lm
    if (lq !== undefined) dto.limit_quarterly = lq
    onSave(active.auth_id, dto)
  }

  const toggleBtn = (on: boolean) => ({
    backgroundColor: on ? 'rgba(52,199,89,0.1)' : 'rgba(255,59,48,0.08)',
    border: `0.5px solid ${on ? 'rgba(52,199,89,0.25)' : 'rgba(255,59,48,0.22)'}`,
    color: on ? 'rgb(26,122,46)' : 'rgb(192,57,43)',
  })

  const matrixRows = allAuths

  return (
    <div className="px-6 pb-10 sm:px-10">
      {/* Real permission matrix: channel × product rows, 6 op columns + bind mode */}
      <div className="mb-3 flex items-center gap-2">
        <Shield size={16} style={{ color: BRAND }}/>
        <span className="text-[14px] font-[700] text-[rgb(24,28,35)]">{t('productAuthView.tab2.title')}</span>
        <span className="text-[12px] text-[rgb(113,119,134)]">{t('productAuthView.tab2.subtitle')}</span>
      </div>
      <div className="mb-6 overflow-x-auto overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
        <table className="min-w-full border-collapse">
          <thead><tr style={{ backgroundColor: TH_BG }}>
            <th style={{...thStyle, minWidth:160}} className="text-left">{t('productAuthView.tab2.colChannel')}</th>
            <th style={{...thStyle, minWidth:150}} className="text-left">{t('productAuthView.tab2.colProduct')}</th>
            <th style={{...thStyle, minWidth:130}} className="text-left">{t('productAuthView.tab2.colCarrier')}</th>
            {OPS.map(op => <th key={op.key} style={{...thStyle, width:64}} className="text-center">{t(`productAuthView.detail.${op.label}`)}</th>)}
            <th style={{...thStyle, width:90}} className="text-center">{t('productAuthView.tab2.colBindMode')}</th>
          </tr></thead>
          <tbody>
            {matrixRows.map((a, i) => (
              <tr key={a.auth_id} onClick={()=>onSelect(a.auth_id)} className="cursor-pointer hover:bg-[rgba(0,88,188,0.04)]"
                style={{ borderTop: i===0?'none':'0.666px solid rgba(193,198,215,0.3)',
                  backgroundColor: active.auth_id === a.auth_id ? BRAND_LIGHT : undefined }}>
                <td style={{padding:'10px 12px', fontSize:'13px', fontWeight:600, color:'rgb(24,28,35)'}}>{a.channel_name}</td>
                <td style={{padding:'10px 12px', fontSize:'12.5px', color:'rgb(24,28,35)'}}>{a.product_name}<div className="text-[11px] text-[rgb(113,119,134)]">{(a.authorized_states ?? []).join(', ')}</div></td>
                <td style={{padding:'10px 12px', fontSize:'12px', color:'rgb(113,119,134)'}}>{a.carrier_name}</td>
                {OPS.map(op => (
                  <td key={op.key} style={{padding:'10px 8px', textAlign:'center'}}>
                    {a[op.key]
                      ? <Check size={14} className="inline-block" style={{color:'rgb(26,122,46)'}}/>
                      : <span className="text-[12px] text-[rgb(193,198,215)]">·</span>}
                  </td>
                ))}
                <td style={{padding:'10px 8px', textAlign:'center', fontSize:'11.5px', fontWeight:700,
                  color: a.bind_mode === 'forbidden' ? 'rgb(192,57,43)' : a.bind_mode === 'underwrite' ? 'rgb(160,92,0)' : 'rgb(26,122,46)' }}>
                  {a.bind_mode ? t(`productAuthView.bindMode.${a.bind_mode}`) : '—'}
                </td>
              </tr>
            ))}
            {matrixRows.length === 0 && (
              <tr><td colSpan={10} style={{padding:'40px',textAlign:'center',color:'rgb(113,119,134)',fontSize:'12px'}}>{t('noData')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Config: left list + right editor */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW }}>
          <div style={{ padding:'12px 16px 10px' }}>
            <span className="text-[12px] font-[700] text-[rgb(24,28,35)]">{t('productAuthView.tab2.selectHint')}</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {auths.map((a, i) => (
              <button key={a.auth_id} onClick={()=>onSelect(a.auth_id)}
                className="w-full text-left transition-colors"
                style={{ padding:'12px 16px', backgroundColor: active.auth_id===a.auth_id ? BRAND_LIGHT : 'transparent',
                  borderTop: i===0?'none':'0.666px solid rgba(193,198,215,0.3)' }}>
                <div className="text-[13px] font-[700]" style={{ color: active.auth_id===a.auth_id ? BRAND : 'rgb(24,28,35)' }}>{a.channel_name}</div>
                <div className="mt-[2px] text-[11px]" style={{ color: active.auth_id===a.auth_id ? BRAND : 'rgb(113,119,134)' }}>
                  {a.product_name} · {a.carrier_name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[14px]" style={{ backgroundColor:CARD_BG, border:CARD_BD, ...CARD_SHADOW, padding:'20px 24px' }}>
          <div className="mb-4">
            <div className="text-[15px] font-[700] text-[rgb(24,28,35)]">{active.channel_name}</div>
            <div className="mt-[2px] text-[12px] text-[rgb(113,119,134)]">
              {active.product_name} · {active.carrier_name} · {(active.authorized_states ?? []).join(', ')}
            </div>
          </div>

          {/* Operation permissions — 6 ops incl. claim reporting */}
          <div className="mb-5">
            <div className="mb-2 text-[11px] text-[rgb(113,119,134)]">{t('productAuthView.tab2.usage')}</div>
            <div className="flex flex-wrap gap-[8px]">
              {OPS.filter(op => op.key !== 'can_bind').map(op => (
                <button key={op.key} type="button" onClick={()=>setOp(op.key, !(ops[op.key]))}
                  className="inline-flex items-center gap-[5px] rounded-[8px] px-[10px] py-[6px] text-[11.5px] font-[700]"
                  style={toggleBtn(!!ops[op.key])}>
                  {ops[op.key] ? <Check size={11}/> : <X size={11}/>}{t(`productAuthView.detail.${op.label}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Bind tri-state */}
          <div className="mb-5">
            <div className="mb-2 text-[11px] text-[rgb(113,119,134)]">{t('productAuthView.tab2.bindMode')}</div>
            <div className="flex flex-wrap gap-2">
              {(['direct','underwrite','forbidden'] as BindMode[]).map(m => {
                const on = bindMode === m
                return (
                  <button key={m} type="button" onClick={()=>{ setBindMode(m); if (m==='forbidden') setOp('can_bind', false); else setOp('can_bind', true) }}
                    className="rounded-[8px] px-[12px] py-[6px] text-[12px] font-[700]"
                    style={{
                      backgroundColor: on ? (m==='forbidden' ? 'rgba(255,59,48,0.1)' : BRAND_LIGHT) : 'rgba(255,255,255,0.4)',
                      color: on ? (m==='forbidden' ? 'rgb(192,57,43)' : BRAND) : 'rgb(65,71,85)',
                      border: `0.5px solid ${on ? (m==='forbidden' ? 'rgba(255,59,48,0.3)' : 'rgba(0,88,188,0.3)') : 'rgba(193,198,215,0.38)'}`,
                    }}>{t(`productAuthView.bindMode.${m}`)}</button>
                )
              })}
            </div>
          </div>

          {/* Three-tier premium limits */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {([
              ['per', 'limitPerPolicy'], ['month', 'limitMonthly'], ['quarter', 'limitQuarterly'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <div className="mb-1 text-[11px] text-[rgb(113,119,134)]">{t(`productAuthView.tab2.${label}`)} (USD)</div>
                <input type="number" min={0} value={limits[key]}
                  onChange={e=>setLimits(prev=>({ ...prev, [key]: e.target.value }))}
                  placeholder={t('productAuthView.tab2.noLimit')}
                  className="h-[34px] w-full rounded-[8px] border-[0.666px] border-[rgba(193,198,215,0.55)] bg-white px-[10px] text-[12.5px] focus:border-[rgb(0,88,188)] focus:outline-none"/>
              </div>
            ))}
          </div>

          {/* Over-limit rule */}
          <div className="mb-5">
            <div className="mb-2 text-[11px] text-[rgb(113,119,134)]">{t('productAuthView.tab2.overLimit')}</div>
            <div className="flex flex-wrap gap-2">
              {([
                ['manual', 'ruleEscalate'], ['forbidden', 'ruleBlock'], ['approval', 'ruleApproval'],
              ] as const).map(([v, l]) => {
                const on = rule === v
                return (
                  <button key={v} type="button" onClick={()=>setRule(v)}
                    className="rounded-[8px] px-[12px] py-[6px] text-[12px] font-[700]"
                    style={{
                      backgroundColor: on ? 'rgba(255,159,10,0.09)' : 'rgba(255,255,255,0.4)',
                      color: on ? 'rgb(160,92,0)' : 'rgb(65,71,85)',
                      border: `0.5px solid ${on ? 'rgba(255,159,10,0.25)' : 'rgba(193,198,215,0.38)'}`,
                    }}>{t(`productAuthView.tab2.${l}`)}</button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center justify-center gap-[6px] rounded-[8px] px-[20px] py-[8px] text-[12px] font-[700] text-white disabled:opacity-50" style={{ backgroundColor: BRAND }}>
              <Check size={14}/>{saving ? t('productAuthView.tab2.saving') : t('productAuthView.tab2.btnSave')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
