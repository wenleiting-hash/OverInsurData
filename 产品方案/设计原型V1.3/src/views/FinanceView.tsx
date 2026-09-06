import { useState, useRef } from 'react'
import {
  Upload, FileText, Search, AlertTriangle, CheckCircle2, XOctagon,
  Download, Plus, Eye, Edit2, Settings, RefreshCw, ChevronDown,
  DollarSign, BarChart2, AlertCircle, Clock, Filter, Loader2,
  ArrowUpDown, Check, X, Zap, TrendingUp, TrendingDown, Minus,
  ChevronRight, ChevronsUpDown,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'
import {
  commissionBills, billLineItems, reconciliationDiffs, settlementCycles,
  premiumRecords, premiumSummaries, parseTemplates, settlementHistory,
  DIFF_STATUS_STYLE, BILL_STATUS_STYLE,
  type BillImportStatus, type DiffStatus, type DiffType, type MatchStatus,
  type CycleFrequency, type SettlementMethod, type PremiumDiffType,
} from '../data/financeData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11.5, fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
      {children}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

function Mono({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", ...style }}>{children}</span>
}

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

// ── Tab 1 — Bill Import ───────────────────────────────────────────────────────

function BillImportTab({ onSelectBill }: { onSelectBill: (id: string) => void }) {
  const { t } = useLang()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [statusFilter, setStatusFilter] = useState<BillImportStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const doUpload = () => {
    setUploading(true)
    setTimeout(() => { setUploading(false); setUploadDone(true); setTimeout(() => setUploadDone(false), 3000) }, 2000)
  }

  const filtered = commissionBills.filter(b => {
    const matchStatus = statusFilter === 'all' || b.status === statusFilter
    const matchSearch = !search || b.fileName.toLowerCase().includes(search.toLowerCase()) || b.insurerShort.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const totalPending = commissionBills.filter(b => b.status === 'pending-parse' || b.status === 'exception').length
  const totalCommission = commissionBills.reduce((s, b) => s + b.totalCommission, 0)
  const settledCommission = commissionBills.filter(b => b.status === 'settled').reduce((s, b) => s + (b.reconciledAmount ?? b.totalCommission), 0)

  const billStatusLabel: Record<BillImportStatus, string> = {
    'pending-parse': t.finStPendingParse,
    parsed: t.finStParsed,
    reconciled: t.finStReconciled,
    exception: t.finStException,
    settled: t.finStSettled,
    archived: t.finStArchived,
  }

  return (
    <div>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t.finKpiTotalBills, value: commissionBills.length, display: commissionBills.length.toString(), color: '#181C23' },
          { label: t.finKpiPending, value: totalPending, display: totalPending.toString(), color: totalPending > 0 ? '#C0392B' : '#1E8033' },
          { label: t.finKpiReceivable, value: totalCommission, display: fmt(totalCommission), color: '#0058BC' },
          { label: t.finKpiSettled, value: settledCommission, display: fmt(settledCommission), color: '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.display}</div>
          </Card>
        ))}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); doUpload() }}
        onClick={() => fileRef.current?.click()}
        style={{ borderRadius: 14, border: `2px dashed ${dragging ? '#0058BC' : 'rgba(193,198,215,0.5)'}`, background: dragging ? 'rgba(0,88,188,0.04)' : 'rgba(255,255,255,0.4)', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20, transition: 'all 0.15s' }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.edi" style={{ display: 'none' }} onChange={doUpload} />
        {uploading ? (
          <><Loader2 size={28} color="#0058BC" className="animate-spin" /><span style={{ fontSize: 13.5, fontWeight: 600, color: '#0058BC' }}>{t.finUploading}</span></>
        ) : uploadDone ? (
          <><CheckCircle2 size={28} color="#1E8033" /><span style={{ fontSize: 13.5, fontWeight: 600, color: '#1E8033' }}>{t.finUploadDone}</span></>
        ) : (
          <>
            <Upload size={28} color="#A0A5B1" />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#555' }}>{t.finDropHere}<span style={{ color: '#0058BC' }}>{t.finPickFile}</span></span>
            <span style={{ fontSize: 12, color: '#A0A5B1' }}>{t.finUploadHint}</span>
          </>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(['all', 'pending-parse', 'parsed', 'reconciled', 'exception', 'settled'] as const).map(s => {
            const st = s !== 'all' ? BILL_STATUS_STYLE[s] : null
            return (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: statusFilter === s ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: statusFilter === s ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: statusFilter === s ? '#0058BC' : '#717786', cursor: 'pointer' }}>
                {s === 'all' ? t.finAll : billStatusLabel[s]}
              </button>
            )
          })}
        </div>
        <div className="relative">
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.finSearchPlaceholder} className="input-glass" style={{ paddingLeft: 30, width: 220, fontSize: 12.5 }} />
        </div>
      </div>

      {/* Bill table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {[t.finThFile, t.finThInsurer, t.finThPeriod, t.finThStatus, t.finThPolicies, t.finThPremium, t.finThCommission, t.finThDiff, t.finThAction].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b, i) => {
              const st = BILL_STATUS_STYLE[b.status]
              return (
                <tr key={b.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)', cursor: 'pointer' }} onClick={() => onSelectBill(b.id)}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={13} color="#0058BC" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: '#181C23', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.fileName}</div>
                        <div style={{ fontSize: 11, color: '#A0A5B1' }}>{b.fileFormat} · {b.fileSize} · {b.importDate.slice(0, 10)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23', fontSize: 13 }}>{b.insurerShort}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{b.period}</td>
                  <td style={{ padding: '10px 14px' }}><Badge bg={st.bg} color={st.color}>{billStatusLabel[b.status]}</Badge></td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12.5 }}>{b.totalPolicies.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12.5 }}>{fmt(b.totalPremium)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', fontSize: 12.5 }}>{fmt(b.totalCommission)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {b.exceptionCount != null && b.exceptionCount > 0
                      ? <span style={{ fontSize: 12, fontWeight: 700, color: '#C0392B' }}>{t.finDiffCount(b.exceptionCount)}</span>
                      : b.status === 'settled' || b.status === 'reconciled'
                      ? <span style={{ fontSize: 12, color: '#1E8033' }}>{t.finNoDiff}</span>
                      : <span style={{ fontSize: 12, color: '#C1C6D7' }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button className="btn-ghost" style={{ padding: 5 }} title={t.finViewDetail}><Eye size={13} /></button>
                      {(b.status === 'pending-parse') && <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} title={t.finParseNow}><Zap size={13} /></button>}
                      {(b.status === 'parsed') && <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} title={t.finStartRecon}><ArrowUpDown size={13} /></button>}
                      <button className="btn-ghost" style={{ padding: 5 }} title={t.finDownload}><Download size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Tab 2 — Bill Parsing ──────────────────────────────────────────────────────

function BillParseTab() {
  const { t } = useLang()
  const [selectedBill, setSelectedBill] = useState(commissionBills[0].id)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const bill = commissionBills.find(b => b.id === selectedBill)!
  const lines = billLineItems.filter(l => l.billId === selectedBill)
  const template = parseTemplates.find(tp => tp.insurerId === bill.insurerId)

  const doParse = () => {
    setParsing(true)
    setTimeout(() => { setParsing(false); setParsed(true) }, 2500)
  }

  const matchStyle: Record<MatchStatus, { bg: string; color: string; label: string }> = {
    matched:     { bg: 'rgba(52,199,89,0.1)',  color: '#1E8033', label: t.finMatched },
    unmatched:   { bg: 'rgba(255,59,48,0.1)',  color: '#C0392B', label: t.finUnmatched },
    'rate-diff': { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t.finRateDiff },
    'amount-diff':{ bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t.finAmountDiff },
    duplicate:   { bg: 'rgba(130,80,255,0.1)', color: '#7B3FCA', label: t.finDuplicate },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
      {/* Left — bill selector + template info */}
      <div className="flex flex-col gap-3">
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.finSelectBill}</label>
          <select value={selectedBill} onChange={e => { setSelectedBill(e.target.value); setParsed(false) }} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
            {commissionBills.map(b => <option key={b.id} value={b.id}>{b.insurerShort} · {b.period} ({b.fileFormat})</option>)}
          </select>
        </div>

        <Card style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#717786', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' as const } as React.CSSProperties}>{t.finBillInfo}</div>
          {[
            [t.finThFile, bill.fileName.length > 24 ? bill.fileName.slice(0, 24) + '…' : bill.fileName],
            [t.finTfFormat, bill.fileFormat],
            [t.finThPeriod, bill.period],
            [t.finThPolicies, bill.totalPolicies.toLocaleString()],
            [t.finThPremium, fmt(bill.totalPremium)],
            [t.finThCommission, fmt(bill.totalCommission)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', padding: '6px 0', fontSize: 12 }}>
              <span style={{ color: '#717786' }}>{k}</span>
              <span style={{ fontWeight: 600, color: '#181C23', fontFamily: typeof v === 'string' && v.startsWith('$') ? "'JetBrains Mono', monospace" : undefined }}>{v}</span>
            </div>
          ))}
        </Card>

        {template && (
          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#717786', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' as const } as React.CSSProperties}>{t.finParseTemplate}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{template.templateName}</div>
            {[
              [t.finColPolicy, template.policyCol],
              [t.finColPremium, template.premiumCol],
              [t.finColCommission, template.commissionCol],
              [t.finColDate, template.dateCol],
              [t.finHeaderRow, t.finHeaderRowVal(template.headerRow + 1)],
              [t.finUsageCount, template.usageCount.toString()],
              [t.finSuccessRate, (template.successRate * 100).toFixed(1) + '%'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between" style={{ padding: '5px 0', fontSize: 12 }}>
                <span style={{ color: '#717786' }}>{k}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC', fontSize: 11.5 }}>{v}</span>
              </div>
            ))}
            <button className="btn-ghost" style={{ marginTop: 8, width: '100%', padding: '6px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Edit2 size={11} /> {t.finEditTemplate}
            </button>
          </Card>
        )}

        <button onClick={doParse} disabled={parsing} style={{ padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: parsing ? 'rgba(0,88,188,0.3)' : '#0058BC', color: '#fff', border: 'none', cursor: parsing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {parsing ? <><Loader2 size={14} className="animate-spin" />{t.finParsing}</> : <><Zap size={14} />{t.finStartParse}</>}
        </button>
      </div>

      {/* Right — parse results */}
      <div>
        {!parsed && !parsing && lines.length === 0 ? (
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#A0A5B1' }}>
            <FileText size={40} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>{t.finParseEmpty}</div>
            <div style={{ fontSize: 12 }}>{t.finParseEmptyHint}</div>
          </Card>
        ) : (
          <div>
            {(parsed || lines.length > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: t.finKpiParsedLines, value: (bill.parsedPolicies ?? lines.length).toLocaleString(), color: '#0058BC' },
                  { label: t.finKpiMatched, value: (bill.matchedPolicies ?? lines.filter(l => l.matchStatus === 'matched').length).toLocaleString(), color: '#1E8033' },
                  { label: t.finStException, value: (bill.exceptionCount ?? lines.filter(l => l.matchStatus !== 'matched').length).toLocaleString(), color: '#C0392B' },
                  { label: t.finKpiMatchRate, value: bill.matchedPolicies ? ((bill.matchedPolicies / bill.totalPolicies) * 100).toFixed(1) + '%' : '—', color: '#7B3FCA' },
                ].map(s => (
                  <Card key={s.label} style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                  </Card>
                ))}
              </div>
            )}

            {lines.length > 0 && (
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                      {[t.finThLine, t.finThPolicyNo, t.finThInsured, t.finThState, t.finThPrem, t.finThRate, t.finThCommBill, t.finThCommSystem, t.finThDiffAmount, t.finThStatus].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const ms = matchStyle[l.matchStatus]
                      return (
                        <tr key={l.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.2)', background: l.matchStatus !== 'matched' ? `${ms.bg}` : i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1', fontSize: 11 }}>{l.lineNumber}</td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#0058BC', fontWeight: 600 }}>{l.policyNumber}</td>
                          <td style={{ padding: '8px 12px', color: '#181C23', fontWeight: 500, fontSize: 12 }}>{l.insuredName}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0058BC', fontSize: 12 }}>{l.state}</td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 11.5 }}>{fmt(l.premium)}</td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: l.matchStatus === 'rate-diff' ? '#B06000' : '#555', fontSize: 11.5 }}>
                            {(l.commissionRate * 100).toFixed(1)}%
                            {l.matchStatus === 'rate-diff' && l.ourCommissionRate && (
                              <span style={{ color: '#0058BC' }}> vs {(l.ourCommissionRate * 100).toFixed(1)}%</span>
                            )}
                          </td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#181C23', fontSize: 11.5 }}>{fmt(l.commissionAmount)}</td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", color: l.ourCommissionAmount ? '#181C23' : '#C1C6D7', fontSize: 11.5 }}>{l.ourCommissionAmount ? fmt(l.ourCommissionAmount) : '—'}</td>
                          <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 11.5, color: l.diffAmount ? (l.diffAmount > 0 ? '#C0392B' : '#B06000') : '#C1C6D7' }}>
                            {l.diffAmount ? (l.diffAmount > 0 ? '+' : '') + fmt(l.diffAmount) : '—'}
                          </td>
                          <td style={{ padding: '8px 12px' }}><Badge bg={ms.bg} color={ms.color}>{ms.label}</Badge></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 3 — Commission Reconciliation ─────────────────────────────────────────

function CommissionReconcileTab() {
  const { t } = useLang()
  const [period, setPeriod] = useState('2026-08')
  const [insurer, setInsurer] = useState('all')

  const billsToRecon = commissionBills.filter(b => b.status === 'reconciled' || b.status === 'exception')

  const totalBill = billsToRecon.reduce((s, b) => s + b.totalCommission, 0)
  const totalOur = billsToRecon.reduce((s, b) => s + (b.reconciledAmount ?? 0), 0)
  const totalDiff = billsToRecon.reduce((s, b) => s + (b.differenceAmount ?? 0), 0)
  const exceptionTotal = billsToRecon.reduce((s, b) => s + (b.exceptionCount ?? 0), 0)

  const billStatusLabel: Record<BillImportStatus, string> = {
    'pending-parse': t.finStPendingParse,
    parsed: t.finStParsed,
    reconciled: t.finStReconciled,
    exception: t.finStException,
    settled: t.finStSettled,
    archived: t.finStArchived,
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 4 }}>{t.finThPeriod}</label>
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input-glass" style={{ fontSize: 13, minWidth: 140 }}>
            {['2026-08', '2026-07', '2026-06', '2026-Q3', '2026-Q2'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11.5, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 4 }}>{t.finThInsurer}</label>
          <select value={insurer} onChange={e => setInsurer(e.target.value)} className="input-glass" style={{ fontSize: 13, minWidth: 160 }}>
            <option value="all">{t.anAllInsurers}</option>
            {['Travelers', 'Liberty Mutual', 'Nationwide', 'Chubb', 'AIG', 'Zurich'].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <button style={{ alignSelf: 'flex-end', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={13} /> {t.finBatchRecon}
        </button>
        <button style={{ alignSelf: 'flex-end', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: 'rgba(0,88,188,0.08)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={13} /> {t.finExportReport}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t.finKpiBillCommission, value: fmt(totalBill), sub: t.finBillsSub(billsToRecon.length), color: '#0058BC', bg: 'rgba(0,88,188,0.06)' },
          { label: t.finKpiVerified, value: fmt(totalOur), sub: t.finReconDone, color: '#1E8033', bg: 'rgba(52,199,89,0.06)' },
          { label: t.finKpiDiffAmount, value: fmt(totalDiff), sub: t.finDiffItemsSub(exceptionTotal), color: totalDiff > 0 ? '#C0392B' : '#1E8033', bg: totalDiff > 0 ? 'rgba(255,59,48,0.06)' : 'rgba(52,199,89,0.06)' },
          { label: t.finKpiReconRate, value: ((billsToRecon.filter(b => b.exceptionCount === 0 || b.status === 'reconciled').length / Math.max(billsToRecon.length, 1)) * 100).toFixed(0) + '%', sub: t.finCleanRatio, color: '#7B3FCA', bg: 'rgba(123,63,202,0.06)' },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#A0A5B1', marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Per-insurer reconciliation table */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t.finSummaryTitle}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {[t.finThInsurer, t.finThBillAmount, t.finThSystemAmount, t.finKpiDiffAmount, t.finThDiffCount, t.finThStatus, t.finThAction].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billsToRecon.map((b, i) => {
              const diff = b.differenceAmount ?? 0
              const st = BILL_STATUS_STYLE[b.status]
              return (
                <tr key={b.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 700, color: '#181C23' }}>{b.insurerShort}</div>
                    <div style={{ fontSize: 11, color: '#A0A5B1' }}>{b.period} · {b.fileName.slice(0, 28)}…</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(b.totalCommission)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{b.reconciledAmount ? fmt(b.reconciledAmount) : '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: diff > 0 ? '#C0392B' : diff < 0 ? '#B06000' : '#1E8033' }}>
                    {diff !== 0 ? (diff > 0 ? '+' : '') + fmt(diff) : <span style={{ color: '#1E8033' }}>±0</span>}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: (b.exceptionCount ?? 0) > 0 ? '#C0392B' : '#1E8033', fontWeight: 700 }}>
                    {b.exceptionCount ?? 0}
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge bg={st.bg} color={st.color}>{billStatusLabel[b.status]}</Badge></td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }}><Eye size={13} /></button>
                      {b.exceptionCount! > 0 && <button className="btn-ghost" style={{ padding: 5, color: '#C0392B' }}><AlertTriangle size={13} /></button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Waterfall visualization */}
      <Card>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t.finWaterfallTitle}</div>
        <div className="flex flex-col gap-3">
          {[
            { label: t.finWfTotal, amount: totalBill, color: '#0058BC', width: 100 },
            { label: t.finWfMatched, amount: totalOur, color: '#1E8033', width: Math.round((totalOur / totalBill) * 100) },
            { label: t.finWfUnresolved, amount: totalDiff, color: '#C0392B', width: Math.round((totalDiff / totalBill) * 100) },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3">
              <div style={{ width: 140, fontSize: 12.5, color: '#717786', flexShrink: 0 }}>{row.label}</div>
              <div style={{ flex: 1, height: 18, borderRadius: 4, background: 'rgba(193,198,215,0.2)', overflow: 'hidden' }}>
                <div style={{ width: `${row.width}%`, height: '100%', background: row.color, borderRadius: 4, opacity: 0.8 }} />
              </div>
              <div style={{ width: 120, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: row.color, fontSize: 12.5, flexShrink: 0 }}>{fmt(row.amount)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Tab 4 — Diff Handling ─────────────────────────────────────────────────────

function DiffHandlingTab() {
  const { lang, t } = useLang()
  const [statusFilter, setStatusFilter] = useState<DiffStatus | 'all'>('all')
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const filtered = reconciliationDiffs.filter(d => statusFilter === 'all' || d.status === statusFilter)
  const counts: Partial<Record<DiffStatus | 'all', number>> = { all: reconciliationDiffs.length }
  ;(['open', 'under-review', 'disputed', 'accepted', 'adjusted', 'waived'] as DiffStatus[]).forEach(s => {
    counts[s] = reconciliationDiffs.filter(d => d.status === s).length
  })

  const doAction = (id: string, action: string) => {
    setProcessingAction(id + action)
    setTimeout(() => setProcessingAction(null), 1200)
  }

  const totalDiff = reconciliationDiffs.filter(d => d.status === 'open' || d.status === 'under-review' || d.status === 'disputed').reduce((s, d) => s + Math.abs(d.diffAmount), 0)

  const diffStatusLabel: Record<DiffStatus, string> = {
    open: t.finDsOpen,
    'under-review': t.finDsReview,
    accepted: t.finDsAccepted,
    disputed: t.finDsDisputed,
    adjusted: t.finDsAdjusted,
    waived: t.finDsWaived,
  }

  const diffTypeLabel: Record<DiffType, string> = {
    'rate-mismatch': t.finRateDiff,
    'amount-mismatch': t.finAmountDiff,
    'missing-policy': t.finDtMissingPolicy,
    duplicate: t.finDuplicate,
    'missing-in-bill': t.finDtMissingInBill,
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t.finKpiOpen, value: (counts['open'] ?? 0).toString(), color: '#C0392B' },
          { label: t.finKpiDisputed, value: (counts['disputed'] ?? 0).toString(), color: '#B06000' },
          { label: t.finKpiInvolved, value: fmt(totalDiff), color: '#0058BC' },
          { label: t.finKpiClosed, value: ((counts['accepted'] ?? 0) + (counts['adjusted'] ?? 0) + (counts['waived'] ?? 0)).toString(), color: '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'open', 'under-review', 'disputed', 'accepted', 'adjusted', 'waived'] as const).map(s => {
          const st = s !== 'all' ? DIFF_STATUS_STYLE[s] : null
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: statusFilter === s ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: statusFilter === s ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: statusFilter === s ? '#0058BC' : '#717786', cursor: 'pointer' }}>
              {s === 'all' ? `${t.finAll} (${counts.all})` : `${diffStatusLabel[s]} (${counts[s] ?? 0})`}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map(d => {
          const st = DIFF_STATUS_STYLE[d.status]
          const isSelected = selectedDiff === d.id
          const isProcessing = processingAction?.startsWith(d.id)
          return (
            <div key={d.id} style={{ borderRadius: 14, border: isSelected ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.35)', background: isSelected ? 'rgba(0,88,188,0.03)' : 'rgba(255,255,255,0.5)', overflow: 'hidden' }}>
              <div className="flex items-start justify-between" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => setSelectedDiff(isSelected ? null : d.id)}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg={st.bg} color={st.color}>{diffStatusLabel[d.status]}</Badge>
                    <span style={{ fontSize: 11.5, background: 'rgba(180,180,180,0.12)', color: '#555', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{diffTypeLabel[d.diffType]}</span>
                    <Mono style={{ fontSize: 12, color: '#0058BC', fontWeight: 700 }}>{d.policyNumber}</Mono>
                    <span style={{ fontSize: 12.5, color: '#181C23' }}>{d.insuredName}</span>
                  </div>
                  <div className="flex items-center gap-4" style={{ fontSize: 12 }}>
                    <span style={{ color: '#717786' }}>{d.insurerShort} · {d.billName.length > 30 ? d.billName.slice(0, 30) + '…' : d.billName}</span>
                    <span style={{ color: '#A0A5B1' }}>{t.finCreated}<Mono>{d.createdDate}</Mono></span>
                    {d.resolvedDate && <span style={{ color: '#A0A5B1' }}>{t.finResolved}<Mono>{d.resolvedDate}</Mono></span>}
                    {d.assignedTo && <span style={{ color: '#0058BC' }}>{t.finAssignee}{d.assignedTo}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>{t.finBillVsSystem}</div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: d.diffAmount > 0 ? '#C0392B' : d.diffAmount < 0 ? '#B06000' : '#1E8033' }}>
                      {d.diffAmount > 0 ? '+' : ''}{fmt(d.diffAmount)}
                    </div>
                    <div style={{ fontSize: 11, color: '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(d.billAmount)} vs {fmt(d.ourAmount)}</div>
                  </div>
                  <ChevronDown size={14} color="#A0A5B1" style={{ transform: isSelected ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {isSelected && (
                <div style={{ borderTop: '0.5px solid rgba(193,198,215,0.35)', padding: '14px 16px', background: 'rgba(249,249,255,0.6)' }}>
                  {d.note && (
                    <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)', fontSize: 12.5, color: '#7A5000', marginBottom: 12 }}>
                      <span style={{ fontWeight: 600 }}>{t.finCurrentNote}</span>{lang === 'en' ? d.noteEn ?? d.note : d.note}
                    </div>
                  )}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.finAddNote}</label>
                    <textarea rows={2} placeholder={t.finNotePlaceholder} className="input-glass" style={{ width: '100%', fontSize: 13, resize: 'vertical' }} />
                  </div>
                  <div className="flex items-center gap-2">
                    {d.status === 'open' && (
                      <>
                        <button onClick={() => doAction(d.id, 'review')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} {t.finStartReview}
                        </button>
                        <button onClick={() => doAction(d.id, 'dispute')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,159,10,0.1)', color: '#B06000', border: '1px solid rgba(255,159,10,0.2)', cursor: 'pointer' }}>{t.finMarkDispute}</button>
                        <button onClick={() => doAction(d.id, 'waive')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(180,180,180,0.12)', color: '#717786', border: '1px solid rgba(193,198,215,0.4)', cursor: 'pointer' }}>{t.finWaive}</button>
                      </>
                    )}
                    {(d.status === 'under-review' || d.status === 'disputed') && (
                      <>
                        <button onClick={() => doAction(d.id, 'accept')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(52,199,89,0.1)', color: '#1E8033', border: '1px solid rgba(52,199,89,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Check size={12} /> {t.finAcceptBill}
                        </button>
                        <button onClick={() => doAction(d.id, 'adjust')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(123,63,202,0.1)', color: '#7B3FCA', border: '1px solid rgba(123,63,202,0.2)', cursor: 'pointer' }}>{t.finAdjustSystem}</button>
                        <button onClick={() => doAction(d.id, 'reject')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <X size={12} /> {t.finRejectItem}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 5 — Settlement Cycles ─────────────────────────────────────────────────

function SettlementCycleTab() {
  const { t } = useLang()
  const [editId, setEditId] = useState<string | null>(null)
  const editCycle = settlementCycles.find(c => c.id === editId)

  const totalNextDue = settlementCycles.reduce((s, c) => s + (c.nextDueAmount ?? 0), 0)
  const totalYtd = settlementCycles.reduce((s, c) => s + c.ytdSettled, 0)

  const freqLabel: Record<CycleFrequency, string> = {
    monthly: t.finFreqMonthly,
    quarterly: t.finFreqQuarterly,
    'semi-annual': t.finFreqSemiAnnual,
    annual: t.finFreqAnnual,
    custom: t.finFreqCustom,
  }
  const methodLabel: Record<SettlementMethod, string> = {
    'wire-transfer': t.finMethodWire,
    ach: t.finMethodAch,
    check: t.finMethodCheck,
    offset: t.finMethodOffset,
  }

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t.finKpiConfigs, value: settlementCycles.length.toString(), color: '#0058BC' },
          { label: t.finKpiDueMonth, value: fmt(totalNextDue), color: '#B06000' },
          { label: t.finKpiYtd, value: fmt(totalYtd), color: '#1E8033' },
          { label: t.finKpiAutoEnabled, value: settlementCycles.filter(c => c.autoReconcile).length.toString(), color: '#7B3FCA' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editId ? '1fr 380px' : '1fr', gap: 20 }}>
        {/* Cycle cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {settlementCycles.map(c => (
            <Card key={c.id} style={{ padding: '16px 18px', border: editId === c.id ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.35)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#181C23' }}>{c.insurerShort}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{freqLabel[c.frequency]}</Badge>
                    <Badge bg="rgba(123,63,202,0.1)" color="#7B3FCA">{methodLabel[c.method]}</Badge>
                  </div>
                </div>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setEditId(editId === c.id ? null : c.id)}><Settings size={14} /></button>
              </div>

              <div className="flex flex-col gap-2" style={{ fontSize: 12.5 }}>
                {[
                  [t.finRowCutoff, t.finRowCutoffVal(c.cutoffDay, c.paymentDueDays)],
                  [t.finRowNextDue, c.nextDueDate],
                  [t.finRowDueAmount, c.nextDueAmount ? fmt(c.nextDueAmount) : t.finTbd],
                  [t.finRowYtd, fmt(c.ytdSettled)],
                  [t.finRowBank, c.bankAccount ?? t.finNotConfigured],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span style={{ color: '#717786' }}>{k}</span>
                    <span style={{ fontFamily: (typeof v === 'string' && (v.startsWith('$') || v.match(/^\*+/))) ? "'JetBrains Mono', monospace" : undefined, fontWeight: 600, color: '#181C23' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '0.5px solid rgba(193,198,215,0.3)', fontSize: 12 }}>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.autoReconcile ? '#34C759' : '#C1C6D7' }} />
                  <span style={{ color: '#717786' }}>{t.finAutoRecon}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.autoSettle ? '#34C759' : '#C1C6D7' }} />
                  <span style={{ color: '#717786' }}>{t.finAutoSettle}</span>
                </div>
                <span style={{ color: '#A0A5B1', marginLeft: 'auto', fontSize: 11 }}>{t.finNotifyBefore(c.notifyDaysBefore)}</span>
              </div>
            </Card>
          ))}

          {/* Add new */}
          <button onClick={() => setEditId('new')} style={{ borderRadius: 14, border: '2px dashed rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.3)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: '#A0A5B1', minHeight: 200 }}>
            <Plus size={22} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.finAddConfig}</span>
          </button>
        </div>

        {/* Edit panel */}
        {editId && editCycle && (
          <Card style={{ padding: '18px 20px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t.finEditConfigTitle(editCycle.insurerShort)}</div>
              <button className="btn-ghost" style={{ padding: 4 }} onClick={() => setEditId(null)}><X size={14} /></button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { label: t.finFieldFrequency, type: 'select', options: Object.entries(freqLabel).map(([v, l]) => ({ v, l })), value: editCycle.frequency },
                { label: t.finFieldCutoff, type: 'number', value: editCycle.cutoffDay },
                { label: t.finFieldGrace, type: 'number', value: editCycle.paymentDueDays },
                { label: t.finFieldMethod, type: 'select', options: Object.entries(methodLabel).map(([v, l]) => ({ v, l })), value: editCycle.method },
                { label: t.finFieldMinAmount, type: 'number', value: editCycle.minSettleAmount },
                { label: t.finFieldNotify, type: 'number', value: editCycle.notifyDaysBefore },
                { label: t.finFieldEmail, type: 'text', value: editCycle.contactEmail },
                { label: t.finFieldBank, type: 'text', value: editCycle.bankAccount ?? '' },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select defaultValue={f.value as string} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                      {(f.options as { v: string; l: string }[]).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} defaultValue={f.value as string | number} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-2">
                {[['autoReconcile', t.finChkAutoRecon, editCycle.autoReconcile], ['autoSettle', t.finChkAutoSettle, editCycle.autoSettle]].map(([k, l, v]) => (
                  <label key={k as string} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                    <input type="checkbox" defaultChecked={v as boolean} />{l as string}
                  </label>
                ))}
              </div>
              <button style={{ padding: '9px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>{t.finSaveConfig}</button>
            </div>
          </Card>
        )}
      </div>

      {/* Settlement history */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t.finHistoryTitle}</div>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                {[t.finThInsurer, t.finThPeriod, t.finThSettleDate, t.finThSettleAmount, t.finFieldMethod, t.finThRefNo, t.finThStatus, t.finThConfirmedBy].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settlementHistory.map((s, i) => {
                const statusS = s.status === 'completed' ? { bg: 'rgba(52,199,89,0.1)', color: '#1E8033', label: t.finRsCompleted } : s.status === 'pending' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t.finRsPending } : s.status === 'failed' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t.finRsFailed } : { bg: 'rgba(180,180,180,0.15)', color: '#666', label: t.finRsReversed }
                return (
                  <tr key={s.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{s.insurerShort}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{s.period}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: s.settledDate ? '#555' : '#C1C6D7', fontSize: 12 }}>{s.settledDate || t.finPendingExec}</td>
                    <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC', fontSize: 12.5 }}>{fmt(s.amount)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{methodLabel[s.method]}</td>
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

// ── Tab 6 — Premium Reconciliation ────────────────────────────────────────────

function PremiumReconcileTab() {
  const { lang, t } = useLang()
  const [selectedInsurer, setSelectedInsurer] = useState('all')

  const filtered = premiumRecords.filter(r => selectedInsurer === 'all' || r.insurerShort === selectedInsurer)
  const summaries = selectedInsurer === 'all' ? premiumSummaries : premiumSummaries.filter(s => s.insurerShort === selectedInsurer)

  const totalExpected = summaries.reduce((s, r) => s + r.totalExpected, 0)
  const totalRemitted = summaries.reduce((s, r) => s + r.totalRemitted, 0)
  const totalDiff = totalExpected - totalRemitted
  const exceptionCount = summaries.reduce((s, r) => s + r.exceptionCount, 0)

  const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
    matched:   { bg: 'rgba(52,199,89,0.1)',   color: '#1E8033', label: t.finMatched },
    exception: { bg: 'rgba(255,59,48,0.1)',   color: '#C0392B', label: t.finPsException },
    adjusted:  { bg: 'rgba(123,63,202,0.1)',  color: '#7B3FCA', label: t.finDsAdjusted },
    pending:   { bg: 'rgba(255,159,10,0.1)',  color: '#B06000', label: t.finPsPending },
  }

  const diffTypeLabel: Record<PremiumDiffType, string> = {
    'missing-remittance': t.finPdtMissing,
    'over-remittance': t.finPdtOver,
    'rate-error': t.finPdtRateError,
    'cancellation-adj': t.finPdtCancellation,
    'endorsement-adj': t.finPdtEndorsement,
  }

  return (
    <div>
      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t.finKpiExpected, value: fmt(totalExpected), color: '#0058BC' },
          { label: t.finKpiReceived, value: fmt(totalRemitted), color: '#1E8033' },
          { label: t.finKpiDiffAmount, value: fmt(Math.abs(totalDiff)), sub: totalDiff > 0 ? t.finSubShort : totalDiff < 0 ? t.finSubOver : t.finNoDiff, color: totalDiff !== 0 ? '#C0392B' : '#1E8033' },
          { label: t.finKpiExceptions, value: exceptionCount.toString(), color: exceptionCount > 0 ? '#C0392B' : '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: s.color, marginTop: 3 }}>{s.sub}</div>}
          </Card>
        ))}
      </div>

      {/* Per-insurer summary table */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t.finPremiumSummaryTitle}</span>
          <select value={selectedInsurer} onChange={e => setSelectedInsurer(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 160 }}>
            <option value="all">{t.finAll}</option>
            {premiumSummaries.map(s => <option key={s.insurerId} value={s.insurerShort}>{s.insurerShort}</option>)}
          </select>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {[t.finThInsurer, t.finThPeriod, t.finThPolicies, t.finKpiExpected, t.finThReceived, t.finThDiff, t.finThMatchRate, t.finThExceptionCount].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summaries.map((s, i) => {
              const diff = s.totalExpected - s.totalRemitted
              const matchPct = (s.matchRate * 100).toFixed(1)
              return (
                <tr key={s.insurerId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
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
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.matchRate >= 0.99 ? '#1E8033' : s.matchRate >= 0.97 ? '#B06000' : '#C0392B' }}>{matchPct}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.exceptionCount > 0 ? '#C0392B' : '#1E8033' }}>{s.exceptionCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Detail records */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t.finDetailTitle}</div>
      <div className="flex flex-col gap-3">
        {filtered.map(r => {
          const ss = statusStyle[r.status]
          const isException = r.status === 'exception'
          return (
            <Card key={r.id} style={{ padding: '14px 16px', borderLeft: isException ? '3px solid #C0392B' : '3px solid transparent' }}>
              <div className="flex items-start justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                    {r.diffType && <span style={{ fontSize: 11.5, background: 'rgba(255,59,48,0.08)', color: '#C0392B', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{diffTypeLabel[r.diffType]}</span>}
                    <Mono style={{ fontSize: 12, color: '#0058BC', fontWeight: 700 }}>{r.policyNumber}</Mono>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{r.insuredName}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#717786' }}>{r.channelName} · {r.insurerShort} · {r.state} · {t.finDueDate}<Mono style={{ fontWeight: 600, color: '#181C23' }}>{r.dueDate}</Mono></div>
                  {r.note && <div style={{ fontSize: 12, color: '#B06000', marginTop: 6, padding: '6px 10px', borderRadius: 7, background: 'rgba(255,159,10,0.08)' }}>{lang === 'en' ? r.noteEn ?? r.note : r.note}</div>}
                </div>
                <div className="flex items-center gap-6 ml-6">
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>{t.finExpected}</div>
                    <Mono style={{ fontSize: 14, fontWeight: 700, color: '#0058BC' }}>{fmt(r.expectedPremium)}</Mono>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#717786' }}>{t.finReceived}</div>
                    <Mono style={{ fontSize: 14, fontWeight: 700, color: r.remittedPremium === 0 ? '#C1C6D7' : '#181C23' }}>{r.remittedPremium === 0 ? t.finNotReceived : fmt(r.remittedPremium)}</Mono>
                  </div>
                  {r.diffAmount !== 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#717786' }}>{t.finThDiffAmount}</div>
                      <Mono style={{ fontSize: 14, fontWeight: 700, color: r.diffAmount > 0 ? '#C0392B' : '#B06000' }}>
                        {r.diffAmount > 0 ? '+' : ''}{fmt(r.diffAmount)}
                      </Mono>
                    </div>
                  )}
                  {isException && (
                    <div className="flex gap-1">
                      <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>{t.finUrge}</button>
                      <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(123,63,202,0.1)', color: '#7B3FCA', border: '1px solid rgba(123,63,202,0.2)', cursor: 'pointer' }}>{t.finAdjust}</button>
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
  { id: 'import',    icon: <Upload size={15} /> },
  { id: 'parse',     icon: <Zap size={15} /> },
  { id: 'reconcile', icon: <ArrowUpDown size={15} /> },
  { id: 'diff',      icon: <AlertCircle size={15} /> },
  { id: 'cycle',     icon: <Settings size={15} /> },
  { id: 'premium',   icon: <DollarSign size={15} /> },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function FinanceView({ navigateTo: _navigateTo }: Props) {
  const { t } = useLang()
  const [tab, setTab] = useState<TabId>('import')
  const [focusBillId, setFocusBillId] = useState<string | null>(null)

  const handleSelectBill = (id: string) => {
    setFocusBillId(id)
    setTab('parse')
  }

  const pendingCount = commissionBills.filter(b => b.status === 'pending-parse').length
  const diffCount = reconciliationDiffs.filter(d => d.status === 'open').length
  const exceptionCount = premiumRecords.filter(r => r.status === 'exception').length

  const tabLabel: Record<TabId, string> = {
    import: t.finTabImport,
    parse: t.finTabParse,
    reconcile: t.finTabReconcile,
    diff: t.finTabDiff,
    cycle: t.finTabCycle,
    premium: t.finTabPremium,
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t.finTitle}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{t.finSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Clock size={13} /> {t.finHeaderPending(pendingCount)}
            </div>
          )}
          {diffCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {t.finHeaderDiff(diffCount)}
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(d => (
          <button key={d.id} onClick={() => setTab(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === d.id ? 700 : 500, background: tab === d.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === d.id ? '#0058BC' : '#717786', border: tab === d.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === d.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {d.icon}
            {tabLabel[d.id]}
            {d.id === 'import' && pendingCount > 0 && <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingCount}</span>}
            {d.id === 'diff' && diffCount > 0 && <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{diffCount}</span>}
            {d.id === 'premium' && exceptionCount > 0 && <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{exceptionCount}</span>}
          </button>
        ))}
      </div>

      {tab === 'import'    && <BillImportTab onSelectBill={handleSelectBill} />}
      {tab === 'parse'     && <BillParseTab />}
      {tab === 'reconcile' && <CommissionReconcileTab />}
      {tab === 'diff'      && <DiffHandlingTab />}
      {tab === 'cycle'     && <SettlementCycleTab />}
      {tab === 'premium'   && <PremiumReconcileTab />}
    </div>
  )
}
