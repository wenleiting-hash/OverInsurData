import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Search, Edit2, Trash2, Upload, Download,
  CheckCircle, ChevronDown, X, AlertTriangle, History,
  TrendingUp, Building2, Package, Calendar, Eye, MoreHorizontal,
  PauseCircle, PlayCircle,
} from 'lucide-react'
import { insurers } from '../data/mockData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo?: (view: ViewId) => void
  embedded?: boolean
  defaultInsurerId?: string
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RateStatus = 'active' | 'upcoming' | 'expired' | 'superseded'

interface CommissionRate {
  id: string
  insurerId: string
  dimension: 'line' | 'product'
  line: string
  productId?: string
  productName?: string
  rate: number            // percentage, e.g. 12.5
  effectiveFrom: string   // YYYY-MM-DD
  effectiveTo?: string    // YYYY-MM-DD | undefined = indefinite
  version: number
  status: RateStatus
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']

const mockRates: CommissionRate[] = [
  { id: 'cr001', insurerId: '1', dimension: 'line', line: 'Auto',         rate: 12.5, effectiveFrom: '2024-01-01', version: 2, status: 'active',     createdBy: 'Sarah Chen',    createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cr002', insurerId: '1', dimension: 'line', line: 'Auto',         rate: 11.0, effectiveFrom: '2022-01-01', effectiveTo: '2023-12-31', version: 1, status: 'expired', createdBy: 'Sarah Chen', createdAt: '2022-01-01', updatedAt: '2022-01-01' },
  { id: 'cr003', insurerId: '1', dimension: 'line', line: 'Home',         rate: 10.0, effectiveFrom: '2024-01-01', version: 1, status: 'active',     createdBy: 'Sarah Chen',    createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cr004', insurerId: '1', dimension: 'line', line: 'Commercial',   rate: 8.5,  effectiveFrom: '2024-01-01', version: 1, status: 'active',     createdBy: 'Sarah Chen',    createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cr005', insurerId: '2', dimension: 'line', line: 'Auto',         rate: 13.0, effectiveFrom: '2024-03-01', version: 2, status: 'active',     createdBy: 'James Rodriguez', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
  { id: 'cr006', insurerId: '2', dimension: 'line', line: 'Auto',         rate: 12.0, effectiveFrom: '2023-01-01', effectiveTo: '2024-02-28', version: 1, status: 'expired', createdBy: 'James Rodriguez', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 'cr007', insurerId: '2', dimension: 'line', line: 'Home',         rate: 11.5, effectiveFrom: '2024-03-01', version: 1, status: 'active',     createdBy: 'James Rodriguez', createdAt: '2024-03-01', updatedAt: '2024-03-01' },
  { id: 'cr008', insurerId: '3', dimension: 'line', line: 'Auto',         rate: 11.0, effectiveFrom: '2025-01-01', version: 1, status: 'upcoming',   createdBy: 'Michael Wu',    createdAt: '2024-11-01', updatedAt: '2024-11-01' },
  { id: 'cr009', insurerId: '3', dimension: 'line', line: 'Home',         rate: 9.5,  effectiveFrom: '2024-01-01', version: 1, status: 'active',     createdBy: 'Michael Wu',    createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'cr010', insurerId: '4', dimension: 'line', line: 'Cyber',        rate: 15.0, effectiveFrom: '2024-06-01', version: 2, status: 'active',     createdBy: 'Emily Johnson', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
  { id: 'cr011', insurerId: '4', dimension: 'line', line: 'D&O',          rate: 14.5, effectiveFrom: '2024-06-01', version: 1, status: 'active',     createdBy: 'Emily Johnson', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
  { id: 'cr012', insurerId: '4', dimension: 'line', line: 'Specialty',    rate: 16.0, effectiveFrom: '2024-06-01', version: 1, status: 'active',     createdBy: 'Emily Johnson', createdAt: '2024-06-01', updatedAt: '2024-06-01' },
  { id: 'cr013', insurerId: '1', dimension: 'product', line: 'Auto', productName: 'TravElite Auto Plus', rate: 14.0, effectiveFrom: '2024-04-01', version: 1, status: 'active', createdBy: 'Sarah Chen', createdAt: '2024-04-01', updatedAt: '2024-04-01', notes: '旗舰产品特别费率' },
  { id: 'cr014', insurerId: '2', dimension: 'product', line: 'Life', productName: 'Liberty Term Life', rate: 9.0, effectiveFrom: '2024-01-01', version: 1, status: 'active', createdBy: 'James Rodriguez', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
]

// ─── Status display ───────────────────────────────────────────────────────────

const RATE_STATUS: Record<RateStatus, { label: string; cls: string; orb: string }> = {
  active:     { label: '生效中', cls: 'badge-green',  orb: 'orb-green' },
  upcoming:   { label: '待生效', cls: 'badge-blue',   orb: 'orb-blue' },
  expired:    { label: '已过期', cls: 'badge-gray',   orb: 'orb-gray' },
  superseded: { label: '已替代', cls: 'badge-gray',   orb: 'orb-gray' },
}

// ─── Rate form modal ──────────────────────────────────────────────────────────

function RateFormModal({ editing, onClose, onSave }: {
  editing: CommissionRate | null
  onClose: () => void
  onSave: (r: CommissionRate) => void
}) {
  const [insurerId, setInsurerId]   = useState(editing?.insurerId ?? '')
  const [dimension, setDimension]   = useState<'line' | 'product'>(editing?.dimension ?? 'line')
  const [line, setLine]             = useState(editing?.line ?? '')
  const [productName, setProductName] = useState(editing?.productName ?? '')
  const [rate, setRate]             = useState(String(editing?.rate ?? ''))
  const [from, setFrom]             = useState(editing?.effectiveFrom ?? '')
  const [to, setTo]                 = useState(editing?.effectiveTo ?? '')
  const [notes, setNotes]           = useState(editing?.notes ?? '')
  const [error, setError]           = useState('')

  const handleSave = () => {
    if (!insurerId) { setError('请选择保险公司'); return }
    if (!line)      { setError('请选择险种');     return }
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0 || Number(rate) > 100) { setError('请输入有效佣金率（0–100%）'); return }
    if (!from)      { setError('请填写生效日期'); return }
    setError('')
    const base = editing ?? { id: `cr${Date.now()}`, version: 1, createdBy: '当前用户', createdAt: new Date().toISOString().slice(0, 10), status: 'active' as RateStatus }
    onSave({ ...base, insurerId, dimension, line, productName: dimension === 'product' ? productName : undefined, rate: Number(rate), effectiveFrom: from, effectiveTo: to || undefined, notes: notes || undefined, updatedAt: new Date().toISOString().slice(0, 10) })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '28px 32px', width: 520, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>{editing ? '编辑佣金率' : '新增佣金率'}</div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        {error && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 9, background: 'rgba(186,26,26,0.08)', border: '0.5px solid rgba(186,26,26,0.2)', fontSize: 12.5, color: '#BA1A1A', marginBottom: 16 }}><AlertTriangle size={13} />{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>保险公司 *</label>
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={insurerId} onChange={e => setInsurerId(e.target.value)}>
              <option value="" disabled>请选择</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>配置维度</label>
            <div className="flex gap-2">
              {([['line', '险种'], ['product', '产品']] as const).map(([v, l]) => (
                <label key={v} style={{ flex: 1, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: dimension === v ? 700 : 400, background: dimension === v ? 'rgba(0,88,188,0.10)' : 'rgba(246,248,255,0.7)', color: dimension === v ? '#0058BC' : '#414755', border: `0.5px solid ${dimension === v ? '#0058BC' : 'rgba(193,198,215,0.4)'}` }}>
                  <input type="radio" style={{ display: 'none' }} checked={dimension === v} onChange={() => setDimension(v)} />{l}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>险种 *</label>
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={line} onChange={e => setLine(e.target.value)}>
              <option value="" disabled>请选择</option>
              {LINES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {dimension === 'product' && (
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>产品名称</label>
              <input className="input-glass w-full" style={{ fontSize: 13 }} placeholder="输入产品名称…" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>佣金率（%）*</label>
            <div className="relative">
              <input className="input-glass w-full" style={{ fontSize: 13, paddingRight: 28 }} type="number" min="0" max="100" step="0.01" placeholder="0.00" value={rate} onChange={e => setRate(e.target.value)} />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#717786' }}>%</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>生效日期 *</label>
            <input className="input-glass w-full" style={{ fontSize: 13 }} type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>截止日期</label>
            <input className="input-glass w-full" style={{ fontSize: 13 }} type="date" value={to} onChange={e => setTo(e.target.value)} placeholder="不填则长期有效" />
          </div>

          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 5 }}>备注</label>
            <textarea className="input-glass w-full" style={{ fontSize: 13, minHeight: 64, resize: 'vertical' }} placeholder="说明调整原因或特殊约定…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 24, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>取消</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSave}><CheckCircle size={14} />保存记录</button>
        </div>
      </div>
    </div>
  )
}

// ─── Version history drawer ───────────────────────────────────────────────────

function VersionHistory({ rates, onClose }: { rates: CommissionRate[]; onClose: () => void }) {
  const ins = insurers.find(i => i.id === rates[0]?.insurerId)
  const sorted = [...rates].sort((a, b) => b.version - a.version)
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div style={{ width: 420, height: '100%', background: 'rgba(255,255,255,0.98)', borderLeft: '1px solid rgba(193,198,215,0.4)', padding: '28px 24px', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>版本历史</div>
            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{ins?.name} · {rates[0]?.line}{rates[0]?.productName ? ` / ${rates[0].productName}` : ''}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sorted.map((r, idx) => {
            const st = RATE_STATUS[r.status]
            return (
              <div key={r.id} style={{ padding: '14px 16px', borderRadius: 11, background: r.status === 'active' ? 'rgba(0,88,188,0.05)' : 'rgba(246,248,255,0.8)', border: `1px solid ${r.status === 'active' ? 'rgba(0,88,188,0.22)' : 'rgba(193,198,215,0.4)'}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>v{r.version}</span>
                    {idx === 0 && r.status === 'active' && <span className="badge badge-blue" style={{ fontSize: 10 }}>当前版本</span>}
                    <span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, color: r.status === 'active' ? '#0058BC' : '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{r.rate}%</span>
                </div>
                <div style={{ fontSize: 12, color: '#717786' }}>
                  {r.effectiveFrom} ～ {r.effectiveTo ?? '长期有效'}
                </div>
                {r.notes && <div style={{ fontSize: 12, color: '#414755', marginTop: 4, fontStyle: 'italic' }}>{r.notes}</div>}
                <div style={{ fontSize: 11, color: '#A0A5B1', marginTop: 5 }}>by {r.createdBy} · {r.createdAt}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Rate detail drawer ───────────────────────────────────────────────────────

function RateDetailDrawer({ rate, onClose, onEdit }: { rate: CommissionRate; onClose: () => void; onEdit: () => void }) {
  const ins = insurers.find(i => i.id === rate.insurerId)
  const st = RATE_STATUS[rate.status]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div style={{ width: 440, height: '100%', background: 'rgba(246,248,255,0.99)', borderLeft: '1px solid rgba(193,198,215,0.4)', padding: '28px 24px', overflowY: 'auto', boxShadow: '-4px 0 32px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', gap: 0 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between" style={{ marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>费率详情</div>
            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{ins?.name} · {rate.line}{rate.productName ? ` / ${rate.productName}` : ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" style={{ fontSize: 12.5, padding: '6px 12px' }} onClick={onEdit}><Edit2 size={12} />编辑</button>
            <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Rate hero */}
        <div style={{ padding: '20px 24px', borderRadius: 14, background: rate.status === 'active' ? 'rgba(0,88,188,0.07)' : 'rgba(193,198,215,0.12)', border: `1px solid ${rate.status === 'active' ? 'rgba(0,88,188,0.22)' : 'rgba(193,198,215,0.35)'}`, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#717786', marginBottom: 6 }}>当前佣金率</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: rate.status === 'active' ? '#0058BC' : '#A0A5B1', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{rate.rate}%</div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className={`badge ${st.cls}`} style={{ fontSize: 12 }}>{st.label}</span>
            <span style={{ fontSize: 12.5, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>v{rate.version}</span>
          </div>
        </div>

        {/* Detail fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: '保险公司',  value: ins?.name ?? rate.insurerId },
            { label: '配置维度',  value: rate.dimension === 'product' ? '产品维度' : '险种维度' },
            { label: '险种',      value: rate.line },
            ...(rate.productName ? [{ label: '产品', value: rate.productName }] : []),
            { label: '生效日期',  value: rate.effectiveFrom },
            { label: '截止日期',  value: rate.effectiveTo ?? '长期有效' },
            { label: '创建人',    value: rate.createdBy },
            { label: '创建时间',  value: rate.createdAt },
            { label: '最后更新',  value: rate.updatedAt },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between" style={{ paddingBottom: 12, borderBottom: '0.5px solid rgba(193,198,215,0.25)' }}>
              <span style={{ fontSize: 13, color: '#717786' }}>{f.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23', textAlign: 'right', maxWidth: 240, wordBreak: 'break-word' }}>{f.value}</span>
            </div>
          ))}
        </div>

        {rate.notes && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#717786', marginBottom: 5 }}>备注</div>
            <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.55 }}>{rate.notes}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function CommissionRateView({ navigateTo: _navigateTo, embedded, defaultInsurerId }: Props) {
  const [rates, setRates] = useState<CommissionRate[]>(mockRates)
  const [search, setSearch] = useState('')
  const [filterInsurer, setFilterInsurer] = useState(defaultInsurerId ?? 'all')
  const [filterLine, setFilterLine] = useState('all')
  const [filterDim, setFilterDim] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CommissionRate | null>(null)
  const [historyKey, setHistoryKey] = useState<string | null>(null) // insurerId:line[:product]
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [disableTarget, setDisableTarget] = useState<string | null>(null)
  const [viewTarget, setViewTarget] = useState<CommissionRate | null>(null)
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const moreMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!moreMenuId) return
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreMenuId])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rates.filter(r => {
      const ins = insurers.find(i => i.id === r.insurerId)
      const matchSearch = !q || ins?.name.toLowerCase().includes(q) || r.line.toLowerCase().includes(q) || r.productName?.toLowerCase().includes(q)
      const matchInsurer = filterInsurer === 'all' || r.insurerId === filterInsurer
      const matchLine    = filterLine === 'all' || r.line === filterLine
      const matchDim     = filterDim === 'all' || r.dimension === filterDim
      const matchStatus  = filterStatus === 'all' || r.status === filterStatus
      return matchSearch && matchInsurer && matchLine && matchDim && matchStatus
    })
  }, [rates, search, filterInsurer, filterLine, filterDim, filterStatus])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const activeCount   = rates.filter(r => r.status === 'active').length
  const upcomingCount = rates.filter(r => r.status === 'upcoming').length
  const expiredCount  = rates.filter(r => r.status === 'expired' || r.status === 'superseded').length
  const insurerCount  = new Set(rates.filter(r => r.status === 'active').map(r => r.insurerId)).size

  const historyRates = historyKey
    ? rates.filter(r => `${r.insurerId}:${r.line}:${r.productName ?? ''}` === historyKey)
    : []

  const toast = (msg: string) => { setSavedMsg(msg); setSaved(true); setTimeout(() => setSaved(false), 2800) }

  const handleSave = (r: CommissionRate) => {
    setRates(prev => editing ? prev.map(x => x.id === r.id ? r : x) : [r, ...prev])
    setShowForm(false); setEditing(null); setViewTarget(null)
    toast('操作已保存，审计日志已记录')
  }

  const handleDelete = (id: string) => {
    setRates(prev => prev.filter(r => r.id !== id))
    setDeleteTarget(null)
    toast('记录已删除')
  }

  const handleToggleStatus = (id: string, action: 'disable' | 'enable') => {
    setRates(prev => prev.map(r => r.id === id
      ? { ...r, status: action === 'disable' ? 'superseded' : 'active', updatedAt: new Date().toISOString().slice(0, 10) }
      : r
    ))
    setDisableTarget(null)
    toast(action === 'disable' ? '费率已停用' : '费率已启用')
  }

  return (
    <div style={{ maxWidth: 1200, margin: embedded ? 0 : '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        {!embedded ? (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>佣金率主数据</h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
              管理保司 × 险种 / 产品维度的佣金率，作为财务对账试算值的计算基准
            </p>
          </div>
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>结算参数配置</div>
        )}
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }}><Upload size={13} />批量导入</button>
          <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={13} />导出</button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={14} />新增佣金率
          </button>
        </div>
      </div>

      {/* B.6 Four-level priority notice */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', marginBottom: 18, borderRadius: 12, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.2)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0058BC' }}>①</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0058BC', marginBottom: 5 }}>对账试算取值优先级（四级回退）</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: '产品 + 州', desc: '最精确' },
              { label: '产品（全域）', desc: '' },
              { label: '险种 + 州', desc: '' },
              { label: '险种（全域）', desc: '最宽泛' },
            ].map((s, i) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(0,88,188,0.09)', border: '0.5px solid rgba(0,88,188,0.22)', fontSize: 12.5, fontWeight: 600, color: '#0058BC', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10.5, opacity: 0.7, fontWeight: 800 }}>P{i + 1}</span>{s.label}
                </div>
                {i < 3 && <span style={{ color: '#C1C6D7', fontSize: 14 }}>→</span>}
              </div>
            ))}
            <span style={{ fontSize: 12, color: '#717786', marginLeft: 4 }}>· 均未配置时沿用账单原值（州字段留空 = 全域适用）</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '生效中',   count: activeCount,   color: '#1E8033', bg: 'rgba(52,199,89,0.08)',    border: 'rgba(52,199,89,0.22)',    icon: TrendingUp },
          { label: '待生效',   count: upcomingCount, color: '#0058BC', bg: 'rgba(0,88,188,0.08)',     border: 'rgba(0,88,188,0.22)',     icon: Calendar },
          { label: '已过期',   count: expiredCount,  color: '#717786', bg: 'rgba(193,198,215,0.12)',  border: 'rgba(193,198,215,0.3)',   icon: History },
          { label: '覆盖保司', count: insurerCount,  color: '#AF52DE', bg: 'rgba(175,82,222,0.08)',   border: 'rgba(175,82,222,0.22)',   icon: Building2 },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px 20px', borderRadius: 14, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
              <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{s.label}</div>
            </div>
            <s.icon size={22} style={{ color: s.color, opacity: 0.3 }} />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input className="input-glass w-full" style={{ paddingLeft: 32, fontSize: 13 }} placeholder="搜索保险公司、险种、产品…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => { setFilterInsurer(e.target.value); setPage(1) }}>
          <option value="all">全部保司</option>
          {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterLine} onChange={e => { setFilterLine(e.target.value); setPage(1) }}>
          <option value="all">全部险种</option>
          {LINES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterDim} onChange={e => { setFilterDim(e.target.value); setPage(1) }}>
          <option value="all">全部维度</option>
          <option value="line">险种维度</option>
          <option value="product">产品维度</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}>
          <option value="all">全部状态</option>
          <option value="active">生效中</option>
          <option value="upcoming">待生效</option>
          <option value="expired">已过期</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(246,248,255,0.9)', borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
              {['保险公司', '维度', '险种 / 产品', '佣金率', '生效日期', '截止日期', '版本', '状态', '更新人', '操作'].map((h, i) => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap', width: [undefined, 70, undefined, 80, 100, 100, 56, 80, 90, 100][i] }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10} style={{ padding: '40px 16px', textAlign: 'center', color: '#A0A5B1', fontSize: 13 }}>暂无匹配记录</td></tr>
            )}
            {pageItems.map((r, i) => {
              const ins = insurers.find(x => x.id === r.insurerId)
              const st  = RATE_STATUS[r.status]
              const hk  = `${r.insurerId}:${r.line}:${r.productName ?? ''}`
              const versionCount = rates.filter(x => x.insurerId === r.insurerId && x.line === r.line && (x.productName ?? '') === (r.productName ?? '')).length
              return (
                <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                        {ins?.shortName.slice(0, 3) ?? '—'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{ins?.shortName ?? r.insurerId}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: r.dimension === 'product' ? 'rgba(175,82,222,0.09)' : 'rgba(0,88,188,0.07)', color: r.dimension === 'product' ? '#AF52DE' : '#0058BC', border: `0.5px solid ${r.dimension === 'product' ? 'rgba(175,82,222,0.22)' : 'rgba(0,88,188,0.15)'}` }}>
                      {r.dimension === 'product' ? '产品' : '险种'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#181C23', fontWeight: 500 }}>
                    {r.line}{r.productName && <span style={{ fontSize: 11.5, color: '#717786', marginLeft: 6 }}>/ {r.productName}</span>}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: r.status === 'active' ? '#0058BC' : '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{r.rate}%</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: '#414755', fontFamily: "'JetBrains Mono', monospace" }}>{r.effectiveFrom}</td>
                  <td style={{ padding: '11px 14px', fontSize: 12.5, color: r.effectiveTo ? '#414755' : '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{r.effectiveTo ?? '长期有效'}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <button className="btn-ghost" style={{ padding: '3px 8px', fontSize: 12, gap: 4 }} onClick={() => setHistoryKey(hk)} title="查看版本历史">
                      <History size={12} />v{r.version}{versionCount > 1 && <span style={{ fontSize: 10, color: '#717786' }}>({versionCount})</span>}
                    </button>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <span className={`orb ${st.orb}`} />
                      <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#717786' }}>{r.createdBy}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-0.5">
                      <button className="btn-ghost" style={{ padding: 5 }} title="查看" onClick={() => { setViewTarget(r); setMoreMenuId(null) }}>
                        <Eye size={14} />
                      </button>
                      <button className="btn-ghost" style={{ padding: 5 }} title="编辑" onClick={() => { setEditing(r); setShowForm(true); setMoreMenuId(null) }}>
                        <Edit2 size={14} />
                      </button>
                      <div style={{ position: 'relative' }} ref={moreMenuId === r.id ? moreMenuRef : null}>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5, background: moreMenuId === r.id ? 'rgba(0,88,188,0.08)' : undefined }}
                          title="更多操作"
                          onClick={e => { e.stopPropagation(); setMoreMenuId(prev => prev === r.id ? null : r.id) }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {moreMenuId === r.id && (
                          <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 100, background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(193,198,215,0.55)', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.14)', minWidth: 130, overflow: 'hidden', padding: '4px' }} onClick={e => e.stopPropagation()}>
                            {r.status === 'active' ? (
                              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, color: '#a05800', padding: '7px 10px' }}
                                onClick={() => { setDisableTarget(r.id); setMoreMenuId(null) }}>
                                <PauseCircle size={13} />停用
                              </button>
                            ) : (r.status === 'superseded' || r.status === 'expired') ? (
                              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, color: '#1E8033', padding: '7px 10px' }}
                                onClick={() => { handleToggleStatus(r.id, 'enable'); setMoreMenuId(null) }}>
                                <PlayCircle size={13} />启用
                              </button>
                            ) : null}
                            <div style={{ height: '0.5px', background: 'rgba(193,198,215,0.35)', margin: '2px 0' }} />
                            <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, color: '#BA1A1A', padding: '7px 10px' }}
                              onClick={() => { setDeleteTarget(r.id); setMoreMenuId(null) }}>
                              <Trash2 size={13} />删除
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.7)' }}>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12.5, color: '#717786' }}>共 {filtered.length} 条</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={{ fontSize: 12.5, padding: '3px 8px', borderRadius: 7, border: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.8)', color: '#414755', cursor: 'pointer' }}>
              {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} 条/页</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === 1 ? 0.35 : 1 }} disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
            <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === 1 ? 0.35 : 1 }} disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹ 上一页</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx-1] === 'number' && (p as number) - (arr[idx-1] as number) > 1) acc.push('…')
                acc.push(p); return acc
              }, [])
              .map((p, idx) => p === '…'
                ? <span key={`e${idx}`} style={{ padding: '0 4px', fontSize: 12.5, color: '#A0A5B1' }}>…</span>
                : <button key={p} onClick={() => setPage(p as number)} style={{ minWidth: 28, height: 28, borderRadius: 7, fontSize: 12.5, fontWeight: safePage === p ? 700 : 400, background: safePage === p ? '#0058BC' : 'transparent', color: safePage === p ? '#fff' : '#414755', border: safePage === p ? 'none' : '0.5px solid rgba(193,198,215,0.4)', cursor: 'pointer' }}>{p}</button>
              )
            }
            <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === totalPages ? 0.35 : 1 }} disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>下一页 ›</button>
            <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === totalPages ? 0.35 : 1 }} disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#717786' }}>
            跳至
            <input type="number" min={1} max={totalPages} style={{ width: 44, fontSize: 12.5, textAlign: 'center', padding: '3px 6px', borderRadius: 7, border: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.8)', color: '#414755' }} placeholder="页"
              onKeyDown={e => { if (e.key === 'Enter') { const n = Math.max(1, Math.min(totalPages, Number((e.target as HTMLInputElement).value))); setPage(n); (e.target as HTMLInputElement).value = '' } }}
            />
            页
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (() => {
        const r = rates.find(x => x.id === deleteTarget)
        const ins = insurers.find(i => i.id === r?.insurerId)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setDeleteTarget(null)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(186,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} style={{ color: '#BA1A1A' }} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>确认删除</div>
              </div>
              <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6 }}>
                确认删除 <strong>{ins?.name}</strong> 的 <strong>{r?.line}</strong> 险种 v{r?.version} 佣金率记录（{r?.rate}%）？此操作不可撤销。
              </p>
              <div className="flex gap-3 justify-end" style={{ marginTop: 24 }}>
                <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setDeleteTarget(null)}>取消</button>
                <button style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9, background: '#BA1A1A', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleDelete(deleteTarget)}>确认删除</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Disable confirm */}
      {disableTarget && (() => {
        const r = rates.find(x => x.id === disableTarget)
        const ins = insurers.find(i => i.id === r?.insurerId)
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setDisableTarget(null)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,149,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PauseCircle size={18} style={{ color: '#a05800' }} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>确认停用</div>
              </div>
              <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6 }}>
                停用后，<strong>{ins?.name}</strong> 的 <strong>{r?.line}</strong> 险种 v{r?.version} 佣金率（{r?.rate}%）将不再参与对账试算，可随时重新启用。
              </p>
              <div className="flex gap-3 justify-end" style={{ marginTop: 24 }}>
                <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setDisableTarget(null)}>取消</button>
                <button style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9, background: '#a05800', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => handleToggleStatus(disableTarget, 'disable')}>确认停用</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Form modal */}
      {showForm && (
        <RateFormModal editing={editing} onClose={() => { setShowForm(false); setEditing(null) }} onSave={handleSave} />
      )}

      {/* Rate detail drawer */}
      {viewTarget && (
        <RateDetailDrawer
          rate={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditing(viewTarget); setShowForm(true); setViewTarget(null) }}
        />
      )}

      {/* Version history drawer */}
      {historyKey && <VersionHistory rates={historyRates} onClose={() => setHistoryKey(null)} />}

      {/* Toast */}
      {saved && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 400, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(30,128,51,0.95)', color: '#fff', fontSize: 13.5, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <CheckCircle size={16} />{savedMsg}
        </div>
      )}
    </div>
  )
}
