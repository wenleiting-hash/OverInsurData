import React, { useState, useRef, useMemo } from 'react'
import {
  Upload, FileText, Search, AlertTriangle, CheckCircle2,
  Download, Plus, Eye, Edit2, Settings, RefreshCw,
  DollarSign, AlertCircle, Clock, Loader2,
  ArrowUpDown, Check, X, Zap, ChevronRight, ChevronLeft,
  MessageSquare, Lock, ChevronDown, ChevronUp, Save,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import CommissionRateView from './CommissionRateView'
import {
  commissionBills, billLineItems, reconciliationDiffs, settlementCycles,
  premiumRecords, premiumSummaries, parseTemplates, settlementHistory,
  FREQ_LABEL, METHOD_LABEL, DIFF_TYPE_LABEL, DIFF_STATUS_STYLE, BILL_STATUS_STYLE,
  type DiffStatus,
} from '../data/financeData'
import { insurers } from '../data/mockData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11.5, fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
      {children}
    </span>
  )
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>{children}</div>
}
function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>{children}</span>
}
function fmt(n: number) { return '$' + n.toLocaleString() }

// ── Mock extensions: per-batch row counts & recon metadata ────────────────────

const BATCH_META: Record<string, {
  batchNo: string; importBy: string; total: number; success: number; failed: number; skipped: number;
  reconStatus: 'pending' | 'in-progress' | 'completed'; completedAt?: string;
}> = {
  'bill-1': { batchNo: 'IMP-2026-0041', importBy: 'Sarah Chen',   total: 1250, success: 1243, failed: 2,  skipped: 5,  reconStatus: 'completed', completedAt: '2026-08-28' },
  'bill-2': { batchNo: 'IMP-2026-0040', importBy: 'James Liu',    total: 876,  success: 874,  failed: 0,  skipped: 2,  reconStatus: 'in-progress' },
  'bill-3': { batchNo: 'IMP-2026-0039', importBy: 'Emily Johnson', total: 632, success: 629,  failed: 1,  skipped: 2,  reconStatus: 'pending' },
  'bill-4': { batchNo: 'IMP-2026-0038', importBy: 'Sarah Chen',   total: 1102, success: 1098, failed: 0,  skipped: 4,  reconStatus: 'completed', completedAt: '2026-07-30' },
  'bill-5': { batchNo: 'IMP-2026-0037', importBy: 'Michael Wu',   total: 449,  success: 447,  failed: 0,  skipped: 2,  reconStatus: 'pending' },
}
const getBatchMeta = (id: string) => BATCH_META[id] ?? { batchNo: `IMP-${id}`, importBy: '—', total: 0, success: 0, failed: 0, skipped: 0, reconStatus: 'pending' as const }

const RECON_STATUS = {
  pending:     { label: '待对账',    cls: 'badge-yellow', color: '#a05800' },
  'in-progress': { label: '对账中',  cls: 'badge-blue',   color: '#0058BC' },
  completed:   { label: '对账完成',  cls: 'badge-green',  color: '#1E8033' },
}

// ── B.1 批次列表 ──────────────────────────────────────────────────────────────

function BatchListTab({ onDetail, onOpenWizard }: { onDetail: (id: string) => void; onOpenWizard: () => void }) {
  const [insurerFilter, setInsurerFilter] = useState('all')
  const [reconFilter, setReconFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = commissionBills.filter(b => {
    const meta = getBatchMeta(b.id)
    const matchInsurer = insurerFilter === 'all' || b.insurerShort === insurerFilter
    const matchRecon = reconFilter === 'all' || meta.reconStatus === reconFilter
    const q = search.toLowerCase()
    const matchSearch = !q || b.fileName.toLowerCase().includes(q) || b.insurerShort.toLowerCase().includes(q) || meta.batchNo.toLowerCase().includes(q)
    return matchInsurer && matchRecon && matchSearch
  })

  const totalAmount = filtered.reduce((s, b) => s + b.totalCommission, 0)
  const pendingCount = filtered.filter(b => getBatchMeta(b.id).reconStatus === 'pending').length
  const completedCount = filtered.filter(b => getBatchMeta(b.id).reconStatus === 'completed').length

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 20, padding: '12px 18px', marginBottom: 16, borderRadius: 12, background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.15)', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#717786' }}>批次总数</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{filtered.length}</span>
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(193,198,215,0.4)' }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#717786' }}>账单金额合计</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(totalAmount)}</span>
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(193,198,215,0.4)' }} />
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="orb orb-yellow" />
          <span style={{ fontSize: 13, color: '#a05800' }}>待对账 {pendingCount}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="orb orb-green" />
          <span style={{ fontSize: 13, color: '#1E8033' }}>已完成 {completedCount}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ fontSize: 12.5 }}><Download size={13} />导出清单</button>
          <button className="btn-primary" style={{ fontSize: 12.5 }} onClick={onOpenWizard}><Plus size={13} />导入账单</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }} placeholder="搜索批次号、保险公司、文件名…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={insurerFilter} onChange={e => setInsurerFilter(e.target.value)}>
          <option value="all">全部保险公司</option>
          {[...new Set(commissionBills.map(b => b.insurerShort))].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={reconFilter} onChange={e => setReconFilter(e.target.value)}>
          <option value="all">全部对账状态</option>
          <option value="pending">待对账</option>
          <option value="in-progress">对账中</option>
          <option value="completed">对账完成</option>
        </select>
      </div>

      {/* Batch table */}
      <Card style={{ padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {['批次号', '保险公司', '账单月份', '原始文件', '导入时间 / 导入人', '行数统计', '对账状态', '操作'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => {
              const meta = getBatchMeta(b.id)
              const rs = RECON_STATUS[meta.reconStatus]
              return (
                <tr key={b.id} onClick={() => onDetail(b.id)}
                  style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)', cursor: 'pointer', transition: 'background 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,88,188,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)')}
                >
                  <td style={{ padding: '11px 14px' }}>
                    <Mono style={{ fontSize: 12, fontWeight: 700, color: '#0058BC' }}>{meta.batchNo}</Mono>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    {b.insurerShorts && b.insurerShorts.length > 1
                      ? <div className="flex items-center gap-1" style={{ flexWrap: 'wrap', gap: 4 }}>
                          {b.insurerShorts.map(s => <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,88,188,0.07)', color: '#0058BC' }}>{s}</span>)}
                        </div>
                      : <span style={{ fontWeight: 600, color: '#181C23' }}>{b.insurerShort}</span>
                    }
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <Mono style={{ fontSize: 12.5, color: '#555' }}>{b.period}</Mono>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} color="#0058BC" style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: '#181C23', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.fileName}</div>
                        <div style={{ fontSize: 11, color: '#A0A5B1' }}>{b.fileFormat} · {b.fileSize}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ fontSize: 12.5, color: '#414755' }}>{b.importDate.slice(0, 10)}</div>
                    <div style={{ fontSize: 11.5, color: '#717786' }}>{meta.importBy}</div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-2" style={{ fontSize: 12 }}>
                      <span style={{ color: '#181C23', fontWeight: 600 }}>{meta.total.toLocaleString()}</span>
                      <span style={{ color: '#1E8033' }}>✓{meta.success}</span>
                      {meta.failed > 0 && <span style={{ color: '#BA1A1A' }}>✗{meta.failed}</span>}
                      {meta.skipped > 0 && <span style={{ color: '#717786' }}>↷{meta.skipped}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div className="flex items-center gap-1.5">
                      <span className={`orb ${meta.reconStatus === 'completed' ? 'orb-green' : meta.reconStatus === 'in-progress' ? 'orb-blue' : 'orb-yellow'}`} />
                      <span className={`badge ${rs.cls}`} style={{ fontSize: 11 }}>{rs.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5">
                      <button className="btn-ghost" style={{ padding: 5 }} title="查看批次详情" onClick={() => onDetail(b.id)}>
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#A0A5B1', fontSize: 13 }}>暂无导入批次记录</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── B.3 批次详情 ──────────────────────────────────────────────────────────────

function BatchDetailView({ batchId, onBack, onGoCommissionRate }: { batchId: string; onBack: () => void; onGoCommissionRate?: (insurerId: string) => void }) {
  const [filterMode, setFilterMode] = useState<'all' | 'anomaly' | 'dup' | 'failed'>('all')
  const [search, setSearch] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [editingRow, setEditingRow] = useState<string | null>(null)
  const [rowEdits, setRowEdits] = useState<Record<string, { commissionAmount: string; premium: string }>>({})
  const [recalcRowId, setRecalcRowId] = useState<string | null>(null)
  const [resolvedRows, setResolvedRows] = useState<Set<string>>(new Set())
  const [rowResolutions, setRowResolutions] = useState<Record<string, string>>({})
  const [rowNotes, setRowNotes] = useState<Record<string, string>>({})
  const [sealed, setSealed] = useState(false)
  const [showSealConfirm, setShowSealConfirm] = useState(false)
  const [recalcAllRunning, setRecalcAllRunning] = useState(false)
  const [recalcAllDone, setRecalcAllDone] = useState(false)
  const [showRecalcAllConfirm, setShowRecalcAllConfirm] = useState(false)
  const [insurerFilter, setInsurerFilter] = useState<string>('all')

  const bill = commissionBills.find(b => b.id === batchId)!
  const meta = getBatchMeta(batchId)
  const lines = billLineItems.filter(l => l.billId === batchId)

  // Multi-insurer support: derive distinct insurers from line items
  const batchInsurers = useMemo(() => {
    const map = new Map<string, string>()
    lines.forEach(l => { if (l.insurerShort) map.set(l.insurerShort, l.insurerShort) })
    // Fall back to bill's single insurer if no line-level insurer info
    if (map.size === 0 && bill.insurerShort && bill.insurerShort !== '多家') map.set(bill.insurerShort, bill.insurerShort)
    return Array.from(map.keys()).sort()
  }, [lines, bill])
  const isMultiInsurer = batchInsurers.length > 1

  const isSealed = sealed || meta.reconStatus === 'completed'
  const anomalyLines = useMemo(() => lines.filter(l => l.matchStatus !== 'matched' && l.matchStatus !== 'duplicate'), [lines])
  const anomalyCount = anomalyLines.length
  const unresolvedCount = anomalyCount - resolvedRows.size
  const matched = lines.filter(l => l.matchStatus === 'matched').length
  const missingParamsCount = Math.ceil(lines.length * 0.03)
  const rs = isSealed ? { label: '已封帐', cls: 'badge-green' } : RECON_STATUS[meta.reconStatus]

  // Per-insurer stats for multi-insurer summary
  const insurerStats = useMemo(() => batchInsurers.map(ins => {
    const iLines = lines.filter(l => l.insurerShort === ins)
    return {
      name: ins,
      total: iLines.length,
      matched: iLines.filter(l => l.matchStatus === 'matched').length,
      anomaly: iLines.filter(l => l.matchStatus !== 'matched' && l.matchStatus !== 'duplicate').length,
      dup: iLines.filter(l => l.matchStatus === 'duplicate').length,
      commission: iLines.reduce((s, l) => s + l.commissionAmount, 0),
    }
  }), [lines, batchInsurers])

  const STEPS = ['导入账单', '试算期望值', '逐笔对账', '异常处理', '确认封帐']
  const currentStep = isSealed ? 5 : unresolvedCount === 0 && anomalyCount === 0 ? 4 : anomalyCount > 0 ? 4 : 3

  const fallbackDist = [
    { label: '产品 + 州',    count: Math.floor(lines.length * 0.62), color: '#0058BC' },
    { label: '产品全域',     count: Math.floor(lines.length * 0.21), color: '#34C759' },
    { label: '险种 + 州',   count: Math.floor(lines.length * 0.09), color: '#FF9500' },
    { label: '险种全域',     count: Math.floor(lines.length * 0.05), color: '#AF52DE' },
    { label: '沿用账单原值', count: missingParamsCount,              color: '#717786' },
  ]

  const filteredLines = useMemo(() => {
    let base = lines
    if (insurerFilter !== 'all') base = base.filter(l => l.insurerShort === insurerFilter)
    if (filterMode === 'anomaly') base = base.filter(l => l.matchStatus !== 'matched' && l.matchStatus !== 'duplicate')
    else if (filterMode === 'dup') base = base.filter(l => l.matchStatus === 'duplicate')
    else if (filterMode === 'failed') base = base.filter(l => (l as any).importFailed)
    const q = search.toLowerCase()
    if (q) base = base.filter(l => l.policyNumber.toLowerCase().includes(q) || l.insuredName.toLowerCase().includes(q) || l.state.toLowerCase().includes(q))
    return base
  }, [lines, filterMode, search, insurerFilter])

  const matchStyle: Record<string, { bg: string; color: string; label: string; border: string }> = {
    matched:      { bg: 'transparent',           color: '#1E8033', label: '已匹配',   border: 'transparent' },
    unmatched:    { bg: 'rgba(255,59,48,0.06)',   color: '#C0392B', label: '异常',     border: '#BA1A1A' },
    'rate-diff':  { bg: 'rgba(255,159,10,0.07)',  color: '#B06000', label: '费率差异', border: '#FF9500' },
    'amount-diff':{ bg: 'rgba(255,59,48,0.06)',   color: '#C0392B', label: '金额差异', border: '#BA1A1A' },
    duplicate:    { bg: 'rgba(130,80,255,0.05)',  color: '#7B3FCA', label: '重复跳过', border: 'rgba(130,80,255,0.3)' },
  }

  const doRowRecalc = (id: string) => {
    setRecalcRowId(id)
    setTimeout(() => setRecalcRowId(null), 1600)
  }
  const doRecalcAll = () => {
    setRecalcAllRunning(true)
    setShowRecalcAllConfirm(false)
    setTimeout(() => { setRecalcAllRunning(false); setRecalcAllDone(true) }, 2200)
  }
  const resolveRow = (id: string) => {
    setResolvedRows(prev => { const s = new Set(prev); s.add(id); return s })
    setExpandedRow(null)
  }
  const saveRowEdit = (id: string) => {
    setEditingRow(null)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Back */}
      <button className="btn-ghost" style={{ fontSize: 13, marginBottom: 16, paddingLeft: 4 }} onClick={onBack}>
        <ChevronLeft size={14} />返回批次列表
      </button>

      {/* ── Section 1: Flow + Batch header ───────────────────────────────── */}
      <Card style={{ padding: '18px 22px', marginBottom: 14, background: 'linear-gradient(135deg, #e8effe 0%, #f0f4ff 40%, #e4f0fb 100%)', border: '1px solid rgba(0,88,188,0.14)' }}>
        {/* Batch meta row */}
        <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
          <div>
            <div className="flex items-center gap-3" style={{ marginBottom: 5 }}>
              <Mono style={{ fontSize: 16, fontWeight: 800, color: '#0058BC' }}>{meta.batchNo}</Mono>
              <span className={`badge ${rs.cls}`} style={{ fontSize: 11.5 }}>{rs.label}</span>
              {isSealed && <Lock size={13} style={{ color: '#717786' }} />}
            </div>
            <div className="flex items-center gap-4" style={{ fontSize: 12.5, color: '#717786' }}>
              {isMultiInsurer
                ? <span>保险公司：{batchInsurers.map((ins, i) => <strong key={ins} style={{ color: '#181C23' }}>{i > 0 ? ' · ' : ''}{ins}</strong>)}</span>
                : <span>保险公司：<strong style={{ color: '#181C23' }}>{batchInsurers[0] ?? bill.insurerShort}</strong></span>}
              <span>账单月份：<Mono style={{ fontWeight: 700, color: '#181C23' }}>{bill.period}</Mono></span>
              <span>导入人：{meta.importBy}</span>
              <span>导入时间：<Mono>{bill.importDate.slice(0, 10)}</Mono></span>
              <span style={{ fontSize: 11.5, color: '#A0A5B1' }}>{bill.fileName} · {bill.fileFormat}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {meta.reconStatus === 'completed' && <span style={{ fontSize: 12.5, color: '#717786' }}>封帐于 {meta.completedAt}</span>}
            <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={13} />导出</button>
          </div>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 4 }}>
          {STEPS.map((s, i) => {
            const isDone = i + 1 < currentStep || isSealed
            const isActive = i + 1 === currentStep && !isSealed
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, background: isDone ? '#34C759' : isActive ? '#0058BC' : 'rgba(193,198,215,0.3)', color: isDone || isActive ? '#fff' : '#717786', transition: 'background 300ms' }}>
                    {isDone ? <Check size={12} /> : i + 1}
                  </div>
                  <span style={{ fontSize: 11.5, color: isActive ? '#0058BC' : isDone ? '#1E8033' : '#717786', fontWeight: isActive ? 700 : 400 }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ width: 32, height: 2, background: isDone ? '#34C759' : 'rgba(193,198,215,0.3)', flexShrink: 0, marginBottom: 20, transition: 'background 300ms' }} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Section 2: Summary ───────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #f5f7ff 0%, #eef3fb 100%)', border: '1px solid rgba(0,88,188,0.10)', borderRadius: 14, padding: '16px 16px', marginBottom: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
        {/* Left: KPIs + amount comparison */}
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 14 }}>
            {[
              { label: '总行数',   v: meta.total.toLocaleString(),    color: '#181C23' },
              { label: '成功导入', v: meta.success.toLocaleString(),  color: '#1E8033' },
              { label: '导入失败', v: meta.failed.toLocaleString(),   color: meta.failed > 0 ? '#BA1A1A' : '#C1C6D7' },
              { label: '重复跳过', v: meta.skipped.toLocaleString(),  color: '#7B3FCA' },
              { label: '已匹配',   v: matched.toLocaleString(),       color: '#1E8033' },
              { label: '异常行数', v: anomalyCount.toLocaleString(),  color: anomalyCount > 0 ? '#BA1A1A' : '#1E8033' },
            ].map(k => (
              <div key={k.label} style={{ padding: '9px 10px', background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.35)', borderRadius: 9 }}>
                <div style={{ fontSize: 10.5, color: '#717786', marginBottom: 3 }}>{k.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: isMultiInsurer ? 14 : 0 }}>
            {[
              { label: '保司账单金额', v: bill.totalCommission,                                    color: '#0058BC' },
              { label: '我方试算金额', v: bill.reconciledAmount ?? bill.totalCommission * 0.997,   color: '#181C23' },
              { label: '差异金额',     v: bill.differenceAmount ?? 0,                              color: (bill.differenceAmount ?? 0) !== 0 ? '#BA1A1A' : '#1E8033' },
            ].map(k => (
              <div key={k.label} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(246,248,255,0.9)', border: `1px solid ${k.label === '差异金额' && (bill.differenceAmount ?? 0) !== 0 ? 'rgba(186,26,26,0.2)' : 'rgba(193,198,215,0.35)'}` }}>
                <div style={{ fontSize: 11, color: '#717786', marginBottom: 3 }}>{k.label}</div>
                <Mono style={{ fontSize: 17, fontWeight: 800, color: k.color }}>
                  {k.label === '差异金额' && (k.v as number) > 0 ? '+' : ''}{fmt(k.v as number)}
                </Mono>
              </div>
            ))}
          </div>

          {/* Per-insurer breakdown — only shown for multi-insurer batches */}
          {isMultiInsurer && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#717786', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>各保险公司明细</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'rgba(246,248,255,0.9)', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
                    {['保险公司', '行数', '已匹配', '异常', '重复', '账单金额'].map(h => (
                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#A0A5B1', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                    <th style={{ padding: '6px 10px', width: 80 }} />
                  </tr>
                </thead>
                <tbody>
                  {insurerStats.map((s, i) => (
                    <tr key={s.name} style={{ borderBottom: i < insurerStats.length - 1 ? '0.5px solid rgba(193,198,215,0.2)' : 'none' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 700, color: '#181C23' }}>{s.name}</td>
                      <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace" }}>{s.total}</td>
                      <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#1E8033' }}>{s.matched}</td>
                      <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: s.anomaly > 0 ? '#BA1A1A' : '#1E8033', fontWeight: s.anomaly > 0 ? 700 : 400 }}>{s.anomaly}</td>
                      <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", color: '#7B3FCA' }}>{s.dup}</td>
                      <td style={{ padding: '7px 10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{fmt(s.commission)}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <button onClick={() => { setInsurerFilter(insurerFilter === s.name ? 'all' : s.name) }}
                          style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: insurerFilter === s.name ? 'rgba(0,88,188,0.12)' : 'rgba(193,198,215,0.15)', color: insurerFilter === s.name ? '#0058BC' : '#717786', border: insurerFilter === s.name ? '1px solid rgba(0,88,188,0.3)' : '1px solid transparent', cursor: 'pointer' }}>
                          {insurerFilter === s.name ? '取消筛选' : '筛选'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right: Trial calc distribution */}
        <Card style={{ padding: '16px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>试算取值分布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {fallbackDist.map(f => (
              <div key={f.label} className="flex items-center gap-2">
                <div style={{ fontSize: 11.5, color: '#717786', width: 72, flexShrink: 0 }}>{f.label}</div>
                <div style={{ flex: 1, height: 10, borderRadius: 3, background: 'rgba(193,198,215,0.2)', overflow: 'hidden' }}>
                  <div style={{ width: `${(f.count / (lines.length || 1)) * 100}%`, height: '100%', background: f.color, borderRadius: 3 }} />
                </div>
                <Mono style={{ fontSize: 11, color: f.color, fontWeight: 700, width: 28, textAlign: 'right', flexShrink: 0 }}>{f.count}</Mono>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#A0A5B1', lineHeight: 1.5 }}>
            产品+州 → 产品全域 → 险种+州 → 险种全域；均无则沿用账单原值
          </div>
          {!isSealed && missingParamsCount > 0 && (
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,159,10,0.06)', border: '0.5px solid rgba(255,159,10,0.25)', fontSize: 11.5, color: '#B06000', display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={11} style={{ flexShrink: 0 }} />
              {missingParamsCount} 条未匹配参数，可在下方重新计算
            </div>
          )}
        </Card>
      </div>
      </div>

      {/* ── Section 3: Detail table ──────────────────────────────────────── */}
      <Card style={{ padding: 0, overflow: 'visible', background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(193,198,215,0.42)', marginBottom: 14 }}>
        {/* Table header bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.9)', gap: 8, flexWrap: 'wrap' }}>
          {/* Filter pills */}
          <div className="flex gap-1.5">
            {([
              { id: 'all',     label: `全部 (${lines.length})` },
              { id: 'anomaly', label: `异常 (${anomalyCount})`, alert: anomalyCount > 0 },
              { id: 'dup',     label: `重复 (${meta.skipped})` },
              { id: 'failed',  label: `失败 (${meta.failed})` },
            ] as const).map(f => (
              <button key={f.id} onClick={() => setFilterMode(f.id)}
                style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: filterMode === f.id ? 700 : 500, border: filterMode === f.id ? '1.5px solid #0058BC' : `1px solid ${(f as any).alert ? 'rgba(186,26,26,0.4)' : 'rgba(193,198,215,0.5)'}`, background: filterMode === f.id ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.6)', color: filterMode === f.id ? '#0058BC' : (f as any).alert ? '#BA1A1A' : '#717786', cursor: 'pointer' }}>
                {(f as any).alert && filterMode !== f.id && <AlertTriangle size={11} style={{ display: 'inline', marginRight: 3 }} />}
                {f.label}
              </button>
            ))}
          </div>
          {/* Active insurer filter badge */}
          {insurerFilter !== 'all' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,88,188,0.1)', border: '1px solid rgba(0,88,188,0.25)', fontSize: 12.5, color: '#0058BC', fontWeight: 600 }}>
              {insurerFilter}
              <button onClick={() => setInsurerFilter('all')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#0058BC', display: 'flex' }}><X size={12} /></button>
            </div>
          )}
          {/* Search */}
          <div className="relative" style={{ marginLeft: 'auto' }}>
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input className="input-glass" style={{ paddingLeft: 26, fontSize: 12, width: 200 }} placeholder="保单号 / 被保人 / 州…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: '#A0A5B1' }}>{filteredLines.length} 条</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.7)' }}>
                {['行#', '保单号', '被保人', '州', '险种', ...(isMultiInsurer ? ['保险公司'] : []), '保费', '保司账单值', '我方试算值', '差异额', '状态', isSealed ? '' : '操作'].map((h, i) => (
                  <th key={i} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLines.length === 0 && (
                <tr><td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: '#A0A5B1', fontSize: 13 }}>暂无数据</td></tr>
              )}
              {filteredLines.map((l, i) => {
                const ms = matchStyle[l.matchStatus] ?? matchStyle['matched']
                const isAnomaly = l.matchStatus !== 'matched' && l.matchStatus !== 'duplicate'
                const isResolved = resolvedRows.has(l.id)
                const isExpanded = expandedRow === l.id
                const isEditing = editingRow === l.id
                const isRecalcing = recalcRowId === l.id
                const edits = rowEdits[l.id] ?? { commissionAmount: String(l.commissionAmount), premium: String(l.premium) }
                const rowBg = isEditing ? 'rgba(0,88,188,0.04)' : isAnomaly && !isResolved ? ms.bg : i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)'

                return (
                  <React.Fragment key={l.id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '0.5px solid rgba(193,198,215,0.2)', background: rowBg, borderLeft: isAnomaly && !isResolved ? `3px solid ${ms.border}` : '3px solid transparent', transition: 'background 120ms' }}>
                      <td style={{ padding: '9px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1', fontSize: 11 }}>{l.lineNumber}</td>
                      <td style={{ padding: '9px 12px' }}><Mono style={{ fontSize: 11.5, color: '#0058BC', fontWeight: 700 }}>{l.policyNumber}</Mono></td>
                      <td style={{ padding: '9px 12px', color: '#181C23', fontWeight: 500 }}>{l.insuredName}</td>
                      <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0058BC' }}>{l.state}</td>
                      <td style={{ padding: '9px 12px', color: '#717786' }}>{l.line ?? '—'}</td>
                      {isMultiInsurer && (
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,88,188,0.07)', color: '#0058BC' }}>{l.insurerShort ?? '—'}</span>
                        </td>
                      )}
                      {/* 保费 — editable */}
                      <td style={{ padding: '9px 12px' }}>
                        {isEditing
                          ? <input value={edits.premium} onChange={e => setRowEdits(p => ({ ...p, [l.id]: { ...edits, premium: e.target.value } }))} className="input-glass" style={{ width: 80, fontSize: 12, padding: '3px 6px' }} />
                          : <Mono style={{ fontSize: 11.5, color: '#555' }}>{fmt(l.premium)}</Mono>}
                      </td>
                      {/* 保司账单值 — editable */}
                      <td style={{ padding: '9px 12px' }}>
                        {isEditing
                          ? <input value={edits.commissionAmount} onChange={e => setRowEdits(p => ({ ...p, [l.id]: { ...edits, commissionAmount: e.target.value } }))} className="input-glass" style={{ width: 80, fontSize: 12, padding: '3px 6px' }} />
                          : <Mono style={{ fontSize: 12, fontWeight: 700, color: '#181C23' }}>{fmt(l.commissionAmount)}</Mono>}
                      </td>
                      {/* 我方试算值 */}
                      <td style={{ padding: '9px 12px' }}>
                        {isRecalcing
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0058BC' }}><Loader2 size={12} className="animate-spin" />计算中</span>
                          : <Mono style={{ fontSize: 12, color: l.ourCommissionAmount ? '#181C23' : '#C1C6D7' }}>{l.ourCommissionAmount ? fmt(l.ourCommissionAmount) : '—'}</Mono>}
                      </td>
                      {/* 差异额 */}
                      <td style={{ padding: '9px 12px' }}>
                        <Mono style={{ fontSize: 12, fontWeight: 700, color: l.diffAmount ? (l.diffAmount > 0 ? '#BA1A1A' : '#B06000') : '#1E8033' }}>
                          {l.diffAmount ? (l.diffAmount > 0 ? '+' : '') + fmt(l.diffAmount) : '±0'}
                        </Mono>
                      </td>
                      {/* 状态 */}
                      <td style={{ padding: '9px 12px' }}>
                        {isResolved
                          ? <Badge bg="rgba(52,199,89,0.1)" color="#1E8033"><Check size={10} />已处理</Badge>
                          : <Badge bg={ms.bg || 'rgba(52,199,89,0.1)'} color={ms.color}>{ms.label}</Badge>}
                      </td>
                      {/* 操作 */}
                      {!isSealed && (
                        <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <div className="flex gap-1">
                              <button onClick={() => saveRowEdit(l.id)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}><Save size={11} />保存</button>
                              <button onClick={() => setEditingRow(null)} style={{ padding: '4px 7px', borderRadius: 6, fontSize: 11.5, background: 'none', border: '1px solid rgba(193,198,215,0.5)', cursor: 'pointer', color: '#717786' }}>取消</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5">
                              <button className="btn-ghost" style={{ padding: 4 }} title="编辑" onClick={() => { setEditingRow(l.id); setExpandedRow(null) }}><Edit2 size={13} /></button>
                              <button className="btn-ghost" style={{ padding: 4 }} title="重新计算" onClick={() => doRowRecalc(l.id)}><RefreshCw size={13} /></button>
                              {isAnomaly && !isResolved && (
                                <button className="btn-ghost" style={{ padding: 4, color: isExpanded ? '#0058BC' : undefined }} title="异常处理" onClick={() => setExpandedRow(isExpanded ? null : l.id)}>
                                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>

                    {/* Inline anomaly panel */}
                    {isExpanded && isAnomaly && !isResolved && (
                      <tr>
                        <td colSpan={(isSealed ? 10 : 11) + (isMultiInsurer ? 1 : 0)} style={{ padding: 0, borderBottom: '0.5px solid rgba(193,198,215,0.3)', borderLeft: `3px solid ${ms.border}` }}>
                          <div style={{ padding: '14px 16px 14px 28px', background: 'rgba(255,59,48,0.03)', borderTop: '0.5px solid rgba(255,59,48,0.15)' }}>
                            <div className="flex items-start gap-16">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#BA1A1A', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <AlertTriangle size={13} />{ms.label}异常处理
                                </div>
                                <div style={{ fontSize: 12, color: '#717786', marginBottom: 12 }}>
                                  保司账单值 <Mono style={{ fontWeight: 700, color: '#181C23' }}>{fmt(l.commissionAmount)}</Mono>
                                  {' '}/ 我方试算值 <Mono style={{ fontWeight: 700, color: l.diffAmount ? '#BA1A1A' : '#181C23' }}>{l.ourCommissionAmount ? fmt(l.ourCommissionAmount) : '—'}</Mono>
                                  {l.diffAmount ? <> · 差异 <Mono style={{ fontWeight: 700, color: '#BA1A1A' }}>{l.diffAmount > 0 ? '+' : ''}{fmt(l.diffAmount)}</Mono></> : null}
                                </div>
                                <div className="flex items-center gap-2">
                                  <select className="input-glass" style={{ fontSize: 12.5, minWidth: 180 }} value={rowResolutions[l.id] ?? ''} onChange={e => setRowResolutions(p => ({ ...p, [l.id]: e.target.value }))}>
                                    <option value="">选择处理结果…</option>
                                    <option value="保司账单有误">保司账单有误</option>
                                    <option value="我方计算有误">我方计算有误</option>
                                    <option value="费率已更正">费率已更正</option>
                                    <option value="双方协商一致">双方协商一致</option>
                                    <option value="数据已确认">数据已确认</option>
                                  </select>
                                  <input className="input-glass" style={{ fontSize: 12.5, flex: 1 }} placeholder="备注（可选）…" value={rowNotes[l.id] ?? ''} onChange={e => setRowNotes(p => ({ ...p, [l.id]: e.target.value }))} />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2" style={{ flexShrink: 0, minWidth: 140 }}>
                                <button onClick={() => doRowRecalc(l.id)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'rgba(0,88,188,0.08)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <RefreshCw size={12} />重新计算
                                </button>
                                <button disabled={!rowResolutions[l.id]} onClick={() => resolveRow(l.id)} style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: rowResolutions[l.id] ? '#1E8033' : 'rgba(52,199,89,0.2)', color: '#fff', border: 'none', cursor: rowResolutions[l.id] ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Check size={12} />标记已处理
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section 4: Seal bar ──────────────────────────────────────────── */}
      {isSealed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderRadius: 14, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.25)' }}>
          <CheckCircle2 size={18} style={{ color: '#1E8033', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E8033' }}>对账已确认封帐，数据已锁定</div>
            <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>封帐后数据不可修改。如需调整请联系主管解锁。</div>
          </div>
          <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12.5, opacity: 0.6 }}><Lock size={13} />申请解锁</button>
        </div>
      ) : (
        <div style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(246,248,255,0.97)', border: '1px solid rgba(193,198,215,0.42)', display: 'flex', alignItems: 'center', gap: 16 }}>
          {unresolvedCount > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <AlertTriangle size={15} style={{ color: '#BA1A1A', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#BA1A1A' }}>
                还有 <strong>{unresolvedCount}</strong> 条异常未处理。请展开异常行完成处理，或确认后直接封帐。
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <CheckCircle2 size={15} style={{ color: '#1E8033', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#1E8033' }}>所有明细已核对，可以确认封帐。</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={() => setShowRecalcAllConfirm(true)}>
              {recalcAllDone ? <><Check size={13} />已重新计算</> : <><RefreshCw size={13} />重新计算</>}
            </button>
            <button className="btn-primary" style={unresolvedCount > 0 ? { background: 'rgba(186,26,26,0.1)', color: '#BA1A1A', border: '1px solid rgba(186,26,26,0.3)', boxShadow: 'none' } : {}} onClick={() => setShowSealConfirm(true)}>
              <Lock size={13} />确认对账
            </button>
          </div>
        </div>
      )}

      {/* ── 重新计算 确认弹框 ─────────────────────────────────────────────── */}
      {showRecalcAllConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', width: 520, overflow: 'hidden', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,88,188,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RefreshCw size={18} style={{ color: '#0058BC' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>重新计算</div>
                <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{meta.batchNo} · {bill.insurerShort !== '多家' ? bill.insurerShort : batchInsurers.join(' · ')}</div>
              </div>
              <button onClick={() => setShowRecalcAllConfirm(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#717786', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>
            {/* Impact banner */}
            <div style={{ margin: '20px 24px 0', padding: '14px 16px', borderRadius: 12, background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.15)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0058BC', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Zap size={13} />影响范围
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { label: '明细总行数', v: lines.length.toLocaleString() },
                  { label: '未匹配参数', v: missingParamsCount.toString(), color: '#B06000' },
                  { label: '当前差异额', v: fmt(bill.differenceAmount ?? 0), color: (bill.differenceAmount ?? 0) !== 0 ? '#BA1A1A' : '#1E8033' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.8)', borderRadius: 9, border: '0.5px solid rgba(193,198,215,0.4)' }}>
                    <div style={{ fontSize: 11, color: '#717786', marginBottom: 3 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: k.color ?? '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 24px 24px' }}>
              <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6, margin: 0 }}>
                将按<strong style={{ color: '#181C23' }}>最新结算参数配置</strong>对所有明细重新试算。当前试算结果将被覆盖，差异额会随之更新。
              </p>
              <p style={{ fontSize: 12.5, color: '#A0A5B1', marginTop: 8, marginBottom: 0 }}>
                重算完成后可再次核对明细，确认无误后封帐。
              </p>
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.35)', background: 'rgba(246,248,255,0.7)' }}>
              <button className="btn-secondary" onClick={() => setShowRecalcAllConfirm(false)}>取消</button>
              <button className="btn-primary" onClick={doRecalcAll} disabled={recalcAllRunning}>
                {recalcAllRunning ? <><Loader2 size={13} className="animate-spin" />计算中…</> : <><Zap size={13} />确认重算</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 确认对账（封帐）弹框 ──────────────────────────────────────────── */}
      {showSealConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', width: 520, overflow: 'hidden', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: unresolvedCount > 0 ? 'rgba(186,26,26,0.08)' : 'rgba(52,199,89,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Lock size={18} style={{ color: unresolvedCount > 0 ? '#BA1A1A' : '#1E8033' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>确认对账</div>
                <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{meta.batchNo} · {bill.insurerShort !== '多家' ? bill.insurerShort : batchInsurers.join(' · ')}</div>
              </div>
              <button onClick={() => setShowSealConfirm(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#717786', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>
            {/* Impact banner */}
            <div style={{ margin: '20px 24px 0', padding: '14px 16px', borderRadius: 12, background: unresolvedCount > 0 ? 'rgba(255,159,10,0.06)' : 'rgba(52,199,89,0.06)', border: `1px solid ${unresolvedCount > 0 ? 'rgba(255,159,10,0.25)' : 'rgba(52,199,89,0.2)'}` }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: unresolvedCount > 0 ? '#B06000' : '#1E8033', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                {unresolvedCount > 0 ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                {unresolvedCount > 0 ? `尚有 ${unresolvedCount} 条异常未处理` : '对账结果'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[
                  { label: '总行数',   v: lines.length.toLocaleString(),                                                   color: '#181C23' },
                  { label: '已匹配',   v: matched.toLocaleString(),                                                        color: '#1E8033' },
                  { label: '异常行',   v: anomalyCount.toLocaleString(),                                                   color: anomalyCount > 0 ? '#BA1A1A' : '#1E8033' },
                  { label: '差异金额', v: fmt(bill.differenceAmount ?? 0),                                                 color: (bill.differenceAmount ?? 0) !== 0 ? '#BA1A1A' : '#1E8033' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '9px 10px', background: 'rgba(255,255,255,0.8)', borderRadius: 8, border: '0.5px solid rgba(193,198,215,0.35)' }}>
                    <div style={{ fontSize: 10.5, color: '#717786', marginBottom: 2 }}>{k.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 24px 24px' }}>
              <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6, margin: 0 }}>
                封帐后本批次数据将<strong style={{ color: '#181C23' }}>锁定，不可修改</strong>。如需调整须由主管解锁。
              </p>
              {unresolvedCount > 0 && (
                <p style={{ fontSize: 12.5, color: '#B06000', marginTop: 8, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={12} />仍有未处理异常，建议处理完毕后再封帐。
                </p>
              )}
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.35)', background: 'rgba(246,248,255,0.7)' }}>
              <button className="btn-secondary" onClick={() => setShowSealConfirm(false)}>取消</button>
              <button className="btn-primary" style={{ background: '#1E8033' }} onClick={() => { setSealed(true); setShowSealConfirm(false) }}>
                <Lock size={13} />确认封帐
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── B.2 导入向导（Modal 浮层，从"导入账单"按钮触发）─────────────────────────

function ImportWizardModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [billingMonth, setBillingMonth] = useState('')
  const [fileUploaded, setFileUploaded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const mockDuplicateCount = 3
  const mockResult = { success: 1247, failed: 2, skipped: mockDuplicateCount, batchNo: 'IMP-2026-0042' }

  const doImport = () => {
    setImporting(true)
    setTimeout(() => { setImporting(false); setImportDone(true) }, 2000)
  }

  const STEPS = ['保司与文件', '映射与预检', '导入结果']

  const modalWrap = (content: React.ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'rgba(246,248,255,0.98)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 680, maxHeight: '88vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#717786', display: 'flex', alignItems: 'center', padding: 4 }}><X size={18} /></button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 20 }}>导入账单向导</div>
        {content}
      </div>
    </div>
  )

  if (importDone) return modalWrap(
    <div style={{ textAlign: 'center', paddingTop: 8 }}>
      <CheckCircle2 size={52} style={{ color: '#34C759', margin: '0 auto 16px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>导入完成</div>
      <div style={{ fontSize: 14, color: '#717786', marginBottom: 24 }}>
        已生成批次 <Mono style={{ color: '#0058BC', fontWeight: 700 }}>{mockResult.batchNo}</Mono>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: '成功导入', v: mockResult.success, color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: '导入失败', v: mockResult.failed,  color: mockResult.failed > 0 ? '#BA1A1A' : '#C1C6D7', bg: 'rgba(255,59,48,0.06)' },
          { label: '跳过（重复）', v: mockResult.skipped, color: '#7B3FCA', bg: 'rgba(175,82,222,0.08)' },
        ].map(k => (
          <div key={k.label} style={{ padding: '14px', borderRadius: 12, background: k.bg }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        {mockResult.failed > 0 && <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={13} />下载失败报告</button>}
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={onComplete}>查看批次详情 →</button>
      </div>
    </div>
  )

  return modalWrap(
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, paddingTop: 8 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i < step ? '#34C759' : i === step ? '#0058BC' : 'rgba(193,198,215,0.3)', color: i <= step ? '#fff' : '#717786', flexShrink: 0 }}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: i === step ? 700 : 400, color: i === step ? '#0058BC' : '#717786' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 32, height: 1.5, background: i < step ? '#34C759' : 'rgba(193,198,215,0.4)', flexShrink: 0, margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {/* Step 0: select insurer + month + upload */}
      {step === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 7 }}>保险公司 <span style={{ color: '#BA1A1A' }}>*</span></label>
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={selectedInsurer} onChange={e => setSelectedInsurer(e.target.value)}>
              <option value="">请选择保险公司…</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 7 }}>账单月份 <span style={{ color: '#BA1A1A' }}>*</span></label>
            <input type="month" className="input-glass w-full" style={{ fontSize: 13 }} value={billingMonth} onChange={e => setBillingMonth(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 7 }}>账单格式</label>
            <div className="flex gap-3">
              {[['CSV', true], ['Excel', true], ['EDI 835', false], ['API 拉取', false]].map(([lbl, enabled]) => (
                <label key={lbl as string} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, cursor: enabled ? 'pointer' : 'not-allowed', background: enabled ? 'rgba(0,88,188,0.06)' : 'rgba(193,198,215,0.08)', border: `0.5px solid ${enabled ? 'rgba(0,88,188,0.2)' : 'rgba(193,198,215,0.3)'}`, opacity: enabled ? 1 : 0.45 }}>
                  <input type="radio" name="fmt" disabled={!enabled as boolean} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13, color: enabled ? '#181C23' : '#A0A5B1' }}>{lbl as string}</span>
                  {!enabled && <span style={{ fontSize: 10.5, color: '#A0A5B1' }}>待开放</span>}
                </label>
              ))}
            </div>
          </div>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); setFileUploaded(true) }}
            onClick={() => fileRef.current?.click()}
            style={{ borderRadius: 12, border: `2px dashed ${dragging ? '#0058BC' : fileUploaded ? '#34C759' : 'rgba(193,198,215,0.5)'}`, background: fileUploaded ? 'rgba(52,199,89,0.04)' : dragging ? 'rgba(0,88,188,0.04)' : 'rgba(255,255,255,0.4)', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 150ms' }}
          >
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={() => setFileUploaded(true)} />
            {fileUploaded ? (
              <><CheckCircle2 size={28} color="#1E8033" /><span style={{ fontSize: 14, fontWeight: 600, color: '#1E8033' }}>文件已上传：travelers_commission_2026-08.csv</span></>
            ) : (
              <><Upload size={28} color="#A0A5B1" /><span style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>拖拽文件到此处，或 <span style={{ color: '#0058BC' }}>点击选择</span></span><span style={{ fontSize: 12, color: '#A0A5B1' }}>支持 CSV / Excel · 单文件最大 50 MB</span></>
            )}
          </div>
        </div>
      )}

      {/* Step 1: field mapping + preview + duplicate check */}
      {step === 1 && (
        <div>
          {/* Duplicate warning */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', marginBottom: 18, borderRadius: 10, background: 'rgba(175,82,222,0.07)', border: '0.5px solid rgba(175,82,222,0.25)' }}>
            <AlertTriangle size={14} style={{ color: '#AF52DE', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#AF52DE', fontWeight: 500 }}>预检发现 <strong>{mockDuplicateCount}</strong> 条重复行（相同保司+月份+保单号），导入时将自动跳过。</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>字段映射配置</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {[['保单号列', 'policy_number'], ['保费列', 'gross_premium'], ['佣金金额列', 'commission_amt'], ['州列', 'state_code'], ['险种列', 'line_of_business'], ['日期列', 'effective_date']].map(([label, col]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.4)' }}>
                  <span style={{ fontSize: 12.5, color: '#717786', minWidth: 80 }}>{label}</span>
                  <Mono style={{ fontSize: 12.5, color: '#0058BC', fontWeight: 600 }}>{col}</Mono>
                  <span className="badge badge-green" style={{ fontSize: 10, marginLeft: 'auto' }}>已匹配</span>
                </div>
              ))}
            </div>
            <button className="btn-ghost" style={{ marginTop: 10, fontSize: 12.5 }}><Edit2 size={12} />修改映射 · 保存为模板</button>
          </div>

          {/* Preview table */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>数据预览（前 5 行）</div>
          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(193,198,215,0.42)', background: 'rgba(255,255,255,0.95)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'rgba(246,248,255,0.9)', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
                  {['#', '保单号', '被保人', '州', '保费', '佣金', '状态'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  [1,'TRV-A00123','John Smith','CA','$1,240','$155.00','正常'],
                  [2,'TRV-A00124','Mary Johnson','TX','$980','$122.50','正常'],
                  [3,'TRV-A00125','David Lee','FL','$1,100','$137.50','正常'],
                  [4,'TRV-A00118','Sarah Chen','CA','$1,050','$131.25','重复跳过'],
                  [5,'TRV-A00126','Michael Brown','NY','$1,380','$172.50','正常'],
                ].map(row => (
                  <tr key={row[0] as number} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.2)', background: row[6] === '重复跳过' ? 'rgba(175,82,222,0.06)' : 'transparent' }}>
                    <td style={{ padding: '7px 12px', color: '#A0A5B1' }}>{row[0]}</td>
                    <td style={{ padding: '7px 12px' }}><Mono style={{ color: '#0058BC', fontWeight: 600, fontSize: 11.5 }}>{row[1]}</Mono></td>
                    <td style={{ padding: '7px 12px', color: '#181C23' }}>{row[2]}</td>
                    <td style={{ padding: '7px 12px', fontWeight: 700, color: '#0058BC' }}>{row[3]}</td>
                    <td style={{ padding: '7px 12px' }}><Mono style={{ color: '#555' }}>{row[4]}</Mono></td>
                    <td style={{ padding: '7px 12px' }}><Mono style={{ color: '#0058BC', fontWeight: 700 }}>{row[5]}</Mono></td>
                    <td style={{ padding: '7px 12px' }}>
                      {row[6] === '重复跳过'
                        ? <Badge bg="rgba(175,82,222,0.1)" color="#7B3FCA">重复跳过</Badge>
                        : <Badge bg="rgba(52,199,89,0.1)" color="#1E8033">正常</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : undefined}>
          {step === 0 ? '' : '← 上一步'}
        </button>
        {step < 1
          ? <button className="btn-primary" style={{ fontSize: 13 }} disabled={!selectedInsurer || !billingMonth || !fileUploaded} onClick={() => setStep(1)}>下一步 →</button>
          : <button onClick={doImport} disabled={importing} style={{ padding: '8px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: importing ? 'rgba(0,88,188,0.4)' : '#0058BC', color: '#fff', border: 'none', cursor: importing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {importing ? <><Loader2 size={14} className="animate-spin" />导入中…</> : <><Check size={14} />确认导入</>}
            </button>
        }
      </div>
    </div>
  )
}

// ── B.5 差异处理 ──────────────────────────────────────────────────────────────

const RESOLUTION_OPTIONS = ['保司账单有误', '我方计算有误', '数据已更正', '双方协商一致', '其他']

type V2DiffStatus = 'open' | 'suspended' | 'resolved'

const DIFF_V2_STATUS: Record<V2DiffStatus, { label: string; cls: string; color: string }> = {
  open:      { label: '待处理', cls: 'badge-red',    color: '#BA1A1A' },
  suspended: { label: '已挂起', cls: 'badge-yellow', color: '#a05800' },
  resolved:  { label: '已关闭', cls: 'badge-green',  color: '#1E8033' },
}

// Map old diff statuses to new
function mapDiffStatus(s: DiffStatus): V2DiffStatus {
  if (s === 'accepted' || s === 'adjusted' || s === 'waived') return 'resolved'
  if (s === 'disputed') return 'suspended'
  return 'open'
}

interface DiffNote { author: string; time: string; text: string }
const MOCK_NOTES: Record<string, DiffNote[]> = {
  'diff-1': [
    { author: 'Sarah Chen', time: '2026-08-20 14:32', text: '已联系 Travelers 账单团队，对方确认该保单有费率调整，正在核实。' },
    { author: 'Sarah Chen', time: '2026-08-22 09:15', text: '保司回复：该保单于 8/1 批改，佣金率应为 11.5% 而非 12.5%，我方计算有误，需调整。' },
  ],
}

function DiffHandlingTab({ fromBatch }: { fromBatch?: string }) {
  const [statusFilter, setStatusFilter] = useState<V2DiffStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null)
  const [resolution, setResolution] = useState<Record<string, string>>({})
  const [noteInput, setNoteInput] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, DiffNote[]>>(MOCK_NOTES)

  const filtered = reconciliationDiffs.filter(d => {
    const v2Status = mapDiffStatus(d.status)
    const matchStatus = statusFilter === 'all' || v2Status === statusFilter
    const matchType = typeFilter === 'all' || d.diffType === typeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || d.policyNumber.toLowerCase().includes(q) || d.insuredName.toLowerCase().includes(q) || d.insurerShort.toLowerCase().includes(q)
    return matchStatus && matchType && matchSearch
  })

  const openCount = reconciliationDiffs.filter(d => mapDiffStatus(d.status) === 'open').length
  const suspendedCount = reconciliationDiffs.filter(d => mapDiffStatus(d.status) === 'suspended').length
  const resolvedCount = reconciliationDiffs.filter(d => mapDiffStatus(d.status) === 'resolved').length
  const totalDiffAmt = reconciliationDiffs.filter(d => mapDiffStatus(d.status) !== 'resolved').reduce((s, d) => s + Math.abs(d.diffAmount), 0)

  const addNote = (id: string) => {
    const text = noteInput[id]?.trim()
    if (!text) return
    setNotes(prev => ({ ...prev, [id]: [...(prev[id] ?? []), { author: '当前用户', time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), text }] }))
    setNoteInput(prev => ({ ...prev, [id]: '' }))
  }

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '待处理', v: openCount.toString(), color: '#BA1A1A', bg: 'rgba(255,59,48,0.08)' },
          { label: '已挂起', v: suspendedCount.toString(), color: '#a05800', bg: 'rgba(255,149,0,0.08)' },
          { label: '待处理差异金额', v: fmt(totalDiffAmt), color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: '已关闭', v: resolvedCount.toString(), color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.v}</div>
          </Card>
        ))}
      </div>

      {fromBatch && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginBottom: 16, borderRadius: 10, background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)' }}>
          <FileText size={13} style={{ color: '#0058BC' }} />
          <span style={{ fontSize: 13, color: '#0058BC' }}>已从批次 <Mono style={{ fontWeight: 700 }}>{fromBatch}</Mono> 带入筛选 · </span>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '2px 6px' }}>查看全部差异</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
        <div className="flex gap-1">
          {(['all', 'open', 'suspended', 'resolved'] as const).map(s => {
            const st = s !== 'all' ? DIFF_V2_STATUS[s] : null
            const count = s === 'all' ? reconciliationDiffs.length : s === 'open' ? openCount : s === 'suspended' ? suspendedCount : resolvedCount
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: statusFilter === s ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: statusFilter === s ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: statusFilter === s ? '#0058BC' : '#717786', cursor: 'pointer' }}>
                {s === 'all' ? `全部 (${count})` : `${st?.label} (${count})`}
              </button>
            )
          })}
        </div>
        <select className="input-glass" style={{ fontSize: 12.5 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">全部差异类型</option>
          {Object.entries(DIFF_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="relative" style={{ marginLeft: 'auto' }}>
          <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input className="input-glass" style={{ paddingLeft: 26, fontSize: 12.5, width: 200 }} placeholder="保单号 / 被保人…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Diff list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(d => {
          const v2Status = mapDiffStatus(d.status)
          const st = DIFF_V2_STATUS[v2Status]
          const isSelected = selectedDiff === d.id
          const diffNotes = notes[d.id] ?? []
          const batchMeta = getBatchMeta('bill-1')
          return (
            <div key={d.id} style={{ borderRadius: 12, border: isSelected ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.35)', background: 'rgba(255,255,255,0.95)', overflow: 'hidden' }}>
              {/* Row header */}
              <div className="flex items-start justify-between" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setSelectedDiff(isSelected ? null : d.id)}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: 5 }}>
                    <Badge bg={st.color + '18'} color={st.color}>{st.label}</Badge>
                    <span style={{ fontSize: 11.5, background: 'rgba(180,180,180,0.12)', color: '#555', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{DIFF_TYPE_LABEL[d.diffType] ?? d.diffType}</span>
                    <Mono style={{ fontSize: 11.5, color: '#0058BC', fontWeight: 700 }}>{batchMeta.batchNo}</Mono>
                    <span style={{ fontSize: 11.5, color: '#717786' }}>·</span>
                    <Mono style={{ fontSize: 12, color: '#0058BC', fontWeight: 700 }}>{d.policyNumber}</Mono>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{d.insuredName}</span>
                  </div>
                  <div className="flex items-center gap-4" style={{ fontSize: 12, color: '#717786' }}>
                    <span>{d.insurerShort} · {d.billName?.slice(0, 28)}…</span>
                    <span>创建：<Mono>{d.createdDate}</Mono></span>
                    {diffNotes.length > 0 && <span style={{ color: '#0058BC' }}><MessageSquare size={11} style={{ display: 'inline', marginRight: 2 }} />{diffNotes.length} 条备注</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>账单 / 试算</div>
                    <Mono style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{fmt(d.billAmount)} / {fmt(d.ourAmount)}</Mono>
                    <Mono style={{ fontSize: 14, fontWeight: 800, color: d.diffAmount > 0 ? '#BA1A1A' : '#B06000' }}>
                      {d.diffAmount > 0 ? '+' : ''}{fmt(d.diffAmount)}
                    </Mono>
                  </div>
                  <ChevronRight size={14} color="#A0A5B1" style={{ transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {/* Expanded panel */}
              {isSelected && (
                <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.35)', background: 'rgba(246,248,255,0.9)', padding: '16px 16px' }}>
                  {/* Note timeline */}
                  {diffNotes.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#717786', marginBottom: 8 }}>处理记录</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[...diffNotes].reverse().map((n, ni) => (
                          <div key={ni} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.8)', border: '0.5px solid rgba(193,198,215,0.35)' }}>
                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0058BC' }}>{n.author}</span>
                              <Mono style={{ fontSize: 11, color: '#A0A5B1' }}>{n.time}</Mono>
                            </div>
                            <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.5 }}>{n.text}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add note + actions */}
                  {v2Status !== 'resolved' && (
                    <div>
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>追加备注</label>
                        <div className="flex gap-2">
                          <textarea rows={2} placeholder="记录与保司核实过程、处理决定…" className="input-glass" style={{ flex: 1, fontSize: 13, resize: 'vertical', minHeight: 56 }} value={noteInput[d.id] ?? ''} onChange={e => setNoteInput(p => ({ ...p, [d.id]: e.target.value }))} />
                          <button className="btn-secondary" style={{ fontSize: 12.5, alignSelf: 'flex-end', padding: '8px 14px' }} onClick={() => addNote(d.id)}>
                            <MessageSquare size={12} />追加
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select className="input-glass" style={{ fontSize: 12.5, flex: 1 }} value={resolution[d.id] ?? ''} onChange={e => setResolution(p => ({ ...p, [d.id]: e.target.value }))}>
                          <option value="">选择处理结果…</option>
                          {RESOLUTION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <button style={{ padding: '7px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: resolution[d.id] ? '#1E8033' : 'rgba(52,199,89,0.3)', color: '#fff', border: 'none', cursor: resolution[d.id] ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 5 }} disabled={!resolution[d.id]}>
                          <Check size={13} />关闭差异
                        </button>
                        <button style={{ padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, background: 'rgba(255,149,0,0.1)', color: '#a05800', border: '1px solid rgba(255,149,0,0.25)', cursor: 'pointer' }}>挂起</button>
                      </div>
                    </div>
                  )}
                  {v2Status === 'resolved' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, background: 'rgba(52,199,89,0.08)', border: '0.5px solid rgba(52,199,89,0.25)' }}>
                      <Check size={14} style={{ color: '#1E8033' }} />
                      <span style={{ fontSize: 13, color: '#1E8033', fontWeight: 600 }}>差异已关闭 · 处理结果：{resolution[d.id] ?? '数据已更正'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
            <CheckCircle2 size={36} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
            <div style={{ fontSize: 14, fontWeight: 500 }}>暂无差异记录</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 4 — 结算周期配置 ──────────────────────────────────────────────────────

function SettlementCycleTab() {
  const [editId, setEditId] = useState<string | null>(null)
  const editCycle = settlementCycles.find(c => c.id === editId)
  const totalNextDue = settlementCycles.reduce((s, c) => s + (c.nextDueAmount ?? 0), 0)
  const totalYtd = settlementCycles.reduce((s, c) => s + c.ytdSettled, 0)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '已配置结算关系', value: settlementCycles.length.toString(), color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: '本月即将结算', value: fmt(totalNextDue), color: '#B06000', bg: 'rgba(255,159,10,0.08)' },
          { label: '本年累计已结算', value: fmt(totalYtd), color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: '自动对账已启用', value: settlementCycles.filter(c => c.autoReconcile).length.toString(), color: '#7B3FCA', bg: 'rgba(123,63,202,0.08)' },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: editId ? '1fr 380px' : '1fr', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {settlementCycles.map(c => (
            <Card key={c.id} style={{ padding: '16px 18px', border: editId === c.id ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.35)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#181C23' }}>{c.insurerShort}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{FREQ_LABEL[c.frequency]}</Badge>
                    <Badge bg="rgba(123,63,202,0.1)" color="#7B3FCA">{METHOD_LABEL[c.method]}</Badge>
                  </div>
                </div>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setEditId(editId === c.id ? null : c.id)}><Settings size={14} /></button>
              </div>
              <div className="flex flex-col gap-2" style={{ fontSize: 12.5 }}>
                {[
                  ['结算日', `每月 ${c.cutoffDay} 日截止 · ${c.paymentDueDays}d 内付款`],
                  ['下次结算', c.nextDueDate],
                  ['应结金额', c.nextDueAmount ? fmt(c.nextDueAmount) : '待确定'],
                  ['本年累结', fmt(c.ytdSettled)],
                  ['银行账户', c.bankAccount ?? '未配置'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: '#717786' }}>{k}</span>
                    <span style={{ fontFamily: typeof v === 'string' && v.startsWith('$') ? "'JetBrains Mono', monospace" : undefined, fontWeight: 600, color: '#181C23' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '0.5px solid rgba(193,198,215,0.3)', fontSize: 12 }}>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.autoReconcile ? '#34C759' : '#C1C6D7' }} />
                  <span style={{ color: '#717786' }}>自动对账</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.autoSettle ? '#34C759' : '#C1C6D7' }} />
                  <span style={{ color: '#717786' }}>自动结算</span>
                </div>
                <span style={{ color: '#A0A5B1', marginLeft: 'auto', fontSize: 11 }}>提前 {c.notifyDaysBefore}d 通知</span>
              </div>
            </Card>
          ))}
          <button onClick={() => setEditId('new')} style={{ borderRadius: 14, border: '2px dashed rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.3)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A0A5B1', minHeight: 200 }}>
            <Plus size={22} /><span style={{ fontSize: 13, fontWeight: 600 }}>新增结算配置</span>
          </button>
        </div>
        {editId && editCycle && (
          <Card style={{ padding: '18px 20px', alignSelf: 'flex-start' }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>编辑 — {editCycle.insurerShort}</div>
              <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setEditId(null)}><X size={14} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: '结算频率', type: 'select', options: Object.entries(FREQ_LABEL).map(([v, l]) => ({ v, l })), value: editCycle.frequency },
                { label: '截止日', type: 'number', value: editCycle.cutoffDay },
                { label: '付款宽限期（天）', type: 'number', value: editCycle.paymentDueDays },
                { label: '结算方式', type: 'select', options: Object.entries(METHOD_LABEL).map(([v, l]) => ({ v, l })), value: editCycle.method },
                { label: '联系邮箱', type: 'text', value: editCycle.contactEmail },
                { label: '银行账号', type: 'text', value: editCycle.bankAccount ?? '' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  {f.type === 'select'
                    ? <select defaultValue={f.value as string} className="input-glass" style={{ width: '100%', fontSize: 13 }}>{(f.options as { v: string; l: string }[]).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
                    : <input type={f.type} defaultValue={f.value as string | number} className="input-glass" style={{ width: '100%', fontSize: 13 }} />}
                </div>
              ))}
              <button style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>保存配置</button>
            </div>
          </Card>
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>结算历史</div>
        <Card style={{ padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
                {['保险公司', '账期', '结算日期', '结算金额', '结算方式', '参考编号', '状态', '确认人'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settlementHistory.map((s, i) => {
                const statusS = s.status === 'completed' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: '已完成' } : s.status === 'pending' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: '待结算' } : s.status === 'failed' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: '失败' } : { bg: 'rgba(180,180,180,0.15)', color: '#666', label: '已冲销' }
                return (
                  <tr key={s.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{s.insurerShort}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{s.period}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: s.settledDate ? '#555' : '#C1C6D7', fontSize: 12 }}>{s.settledDate || '待执行'}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', fontSize: 12.5 }}>{fmt(s.amount)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{METHOD_LABEL[s.method]}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: s.referenceNumber ? '#555' : '#C1C6D7' }}>{s.referenceNumber || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: s.confirmedBy ? '#555' : '#C1C6D7' }}>{s.confirmedBy || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 5 — 保费对账 ──────────────────────────────────────────────────────────

function PremiumReconcileTab() {
  const [selectedInsurer, setSelectedInsurer] = useState('all')
  const filtered = premiumRecords.filter(r => selectedInsurer === 'all' || r.insurerShort === selectedInsurer)
  const summaries = selectedInsurer === 'all' ? premiumSummaries : premiumSummaries.filter(s => s.insurerShort === selectedInsurer)
  const totalExpected = summaries.reduce((s, r) => s + r.totalExpected, 0)
  const totalRemitted = summaries.reduce((s, r) => s + r.totalRemitted, 0)
  const totalDiff = totalExpected - totalRemitted
  const exceptionCount = summaries.reduce((s, r) => s + r.exceptionCount, 0)
  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    matched:   { bg: 'rgba(52,199,89,0.1)',   color: '#1E8033', label: '匹配' },
    exception: { bg: 'rgba(255,59,48,0.1)',   color: '#C0392B', label: '差异' },
    adjusted:  { bg: 'rgba(123,63,202,0.1)',  color: '#7B3FCA', label: '已调整' },
    pending:   { bg: 'rgba(255,159,10,0.1)',  color: '#B06000', label: '待确认' },
  }
  const diffTypeLabel: Record<string, string> = {
    'missing-remittance': '未收到保费', 'over-remittance': '保费多缴',
    'rate-error': '费率计算错误', 'cancellation-adj': '退保调整', 'endorsement-adj': '批单调整',
  }
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '应收保费',  value: fmt(totalExpected), color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: '已到账保费', value: fmt(totalRemitted), color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: '差异金额',  value: fmt(Math.abs(totalDiff)), sub: totalDiff > 0 ? '未足额到账' : totalDiff < 0 ? '多到账' : '无差异', color: totalDiff !== 0 ? '#C0392B' : '#1E8033', bg: totalDiff !== 0 ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)' },
          { label: '异常保单',  value: exceptionCount.toString(), color: exceptionCount > 0 ? '#C0392B' : '#1E8033', bg: exceptionCount > 0 ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)' },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            {(s as any).sub && <div style={{ fontSize: 11, color: s.color, marginTop: 3 }}>{(s as any).sub}</div>}
          </Card>
        ))}
      </div>
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>各保险公司保费对账汇总</span>
          <select value={selectedInsurer} onChange={e => setSelectedInsurer(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 160 }}>
            <option value="all">全部</option>
            {premiumSummaries.map(s => <option key={s.insurerId} value={s.insurerShort}>{s.insurerShort}</option>)}
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {['保险公司', '账期', '保单数', '应收保费', '已到账', '差异', '匹配率', '异常条数'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, i) => {
              const diff = s.totalExpected - s.totalRemitted
              return (
                <tr key={s.insurerId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{s.insurerShort}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{s.period}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{s.totalPolicies.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(s.totalExpected)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{fmt(s.totalRemitted)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: diff > 0 ? '#C0392B' : diff < 0 ? '#B06000' : '#1E8033' }}>
                    {diff !== 0 ? (diff > 0 ? '+' : '') + fmt(diff) : <span style={{ color: '#1E8033' }}>±0</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, maxWidth: 80, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.4)', overflow: 'hidden' }}>
                        <div style={{ width: `${s.matchRate * 100}%`, height: '100%', background: s.matchRate >= 0.99 ? '#34C759' : s.matchRate >= 0.97 ? '#FF9F0A' : '#FF3B30', borderRadius: 3 }} />
                      </div>
                      <Mono style={{ fontSize: 12, fontWeight: 700, color: s.matchRate >= 0.99 ? '#1E8033' : s.matchRate >= 0.97 ? '#B06000' : '#C0392B' }}>{(s.matchRate * 100).toFixed(1)}%</Mono>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.exceptionCount > 0 ? '#C0392B' : '#1E8033' }}>{s.exceptionCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>保费对账明细</div>
      <div className="flex flex-col gap-3">
        {filtered.map(r => {
          const ss = statusStyle[r.status]
          const isException = r.status === 'exception'
          return (
            <Card key={r.id} style={{ padding: '14px 16px', background: ss.bg, borderTop: `1px solid ${ss.color}22`, borderRight: `1px solid ${ss.color}22`, borderBottom: `1px solid ${ss.color}22`, borderLeft: `3px solid ${ss.color}` }}>
              <div className="flex items-start justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                    {r.diffType && <span style={{ fontSize: 11.5, background: 'rgba(255,59,48,0.08)', color: '#C0392B', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{diffTypeLabel[r.diffType]}</span>}
                    <Mono style={{ fontSize: 12, color: '#0058BC', fontWeight: 700 }}>{r.policyNumber}</Mono>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{r.insuredName}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#717786' }}>{r.channelName} · {r.insurerShort} · {r.state} · 到期：<Mono style={{ fontWeight: 600, color: '#181C23' }}>{r.dueDate}</Mono></div>
                  {r.note && <div style={{ fontSize: 12, color: '#B06000', marginTop: 6, padding: '6px 10px', borderRadius: 7, background: 'rgba(255,159,10,0.08)' }}>{r.note}</div>}
                </div>
                <div className="flex items-center gap-5 ml-6">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>应收</div>
                    <Mono style={{ fontSize: 14, fontWeight: 700, color: '#0058BC' }}>{fmt(r.expectedPremium)}</Mono>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>到账</div>
                    <Mono style={{ fontSize: 14, fontWeight: 700, color: r.remittedPremium === 0 ? '#C1C6D7' : '#181C23' }}>{r.remittedPremium === 0 ? '未到账' : fmt(r.remittedPremium)}</Mono>
                  </div>
                  {r.diffAmount !== 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#717786' }}>差额</div>
                      <Mono style={{ fontSize: 14, fontWeight: 700, color: r.diffAmount > 0 ? '#C0392B' : '#B06000' }}>{r.diffAmount > 0 ? '+' : ''}{fmt(r.diffAmount)}</Mono>
                    </div>
                  )}
                  {isException && (
                    <div className="flex gap-1">
                      <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>催缴</button>
                      <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(123,63,202,0.1)', color: '#7B3FCA', border: '1px solid rgba(123,63,202,0.2)', cursor: 'pointer' }}>调整</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'batches',         icon: <FileText size={15} />,    label: '账单批次' },
  { id: 'commission-rate', icon: <ArrowUpDown size={15} />, label: '结算参数配置' },
] as const
type TabId = typeof TABS[number]['id']

interface Props { navigateTo: (view: ViewId, params?: { commissionInsurerId?: string }) => void; commissionInsurerId?: string }

export default function FinanceView({ navigateTo: _navigateTo, commissionInsurerId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [tab, setTab] = useState<TabId>(commissionInsurerId ? 'commission-rate' : 'batches')
  const [detailBatchId, setDetailBatchId] = useState<string | null>(null)
  const [showImportWizard, setShowImportWizard] = useState(false)

  const diffCount = reconciliationDiffs.filter(d => mapDiffStatus(d.status) === 'open').length
  const exceptionCount = premiumRecords.filter(r => r.status === 'exception').length
  const pendingBatches = commissionBills.filter(b => getBatchMeta(b.id).reconStatus === 'pending').length

  const handleDetail = (id: string) => { setDetailBatchId(id); setTab('batches') }
  const handleWizardComplete = () => { setShowImportWizard(false); setDetailBatchId(null); setTab('batches') }

  return (
    <div>
      {/* Import wizard modal (rendered above everything) */}
      {showImportWizard && (
        <ImportWizardModal onClose={() => setShowImportWizard(false)} onComplete={handleWizardComplete} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>财务结算</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>以导入批次为核心的佣金对账流程：导入 → 试算 → 逐笔对账 → 差异处理 → 批次锁定</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingBatches > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Clock size={13} /> {pendingBatches} 批次待对账
            </div>
          )}
          {diffCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {diffCount} 条差异待处理
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== 'batches') setDetailBatchId(null) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === t.id ? '#0058BC' : '#717786', borderTop: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderLeft: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderRight: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.icon}{t.label}
            {t.id === 'batches' && pendingBatches > 0 && <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px' }}>{pendingBatches}</span>}
          </button>
        ))}
      </div>

      {tab === 'batches' && !detailBatchId && <BatchListTab onDetail={handleDetail} onOpenWizard={() => setShowImportWizard(true)} />}
      {tab === 'batches' && detailBatchId && <BatchDetailView batchId={detailBatchId} onBack={() => setDetailBatchId(null)} onGoCommissionRate={(insurerId) => { setDetailBatchId(null); setTab('commission-rate'); _navigateTo('finance', { commissionInsurerId: insurerId }) }} />}
      {tab === 'commission-rate' && <CommissionRateView embedded defaultInsurerId={commissionInsurerId} />}
    </div>
  )
}
