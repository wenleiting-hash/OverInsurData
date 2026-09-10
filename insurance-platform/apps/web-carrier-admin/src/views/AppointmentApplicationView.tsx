import { useState } from 'react'
import {
  FileCheck, Clock, RefreshCw, XCircle, ShieldCheck, Bell,
  Ban, FileText, Search, AlertTriangle, CheckCircle2, XOctagon,
  Download, Plus, Eye, Edit2,
  AlertCircle, Filter, Loader2, Send, Activity,
  ToggleLeft, ToggleRight, Info,
} from 'lucide-react'
import type { ViewId } from '@/App'
import {
  appointmentRecords,
  niprLicenses,
  interceptLogs,
  complianceRules,
  ofacScreenings,
  complianceReports,
  REPORT_TYPES,
  type OFACResult,
} from './data/appointmentComplianceData'
import { useTranslation } from 'react-i18next'

// ── Shared helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; labelKey: string }> = {
  approved:       { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033', labelKey: 'app.status.approved' },
  pending:        { bg: 'rgba(255,159,10,0.12)', color: '#B06000', labelKey: 'app.status.pending' },
  rejected:       { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B', labelKey: 'app.status.rejected' },
  expired:        { bg: 'rgba(180,180,180,0.15)', color: '#666',  labelKey: 'app.status.expired' },
  terminated:     { bg: 'rgba(130,80,255,0.12)', color: '#7B3FCA', labelKey: 'app.status.terminated' },
  'under-review': { bg: 'rgba(0,122,255,0.12)',  color: '#005DC7', labelKey: 'app.status.underReview' },
}

const LIC_STATUS_STYLE: Record<string, { bg: string; color: string; labelKey: string }> = {
  active:    { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033', labelKey: 'app.licStatus.active' },
  inactive:  { bg: 'rgba(180,180,180,0.15)', color: '#666',   labelKey: 'app.licStatus.inactive' },
  expired:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', labelKey: 'app.licStatus.expired' },
  suspended: { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', labelKey: 'app.licStatus.suspended' },
  pending:   { bg: 'rgba(255,159,10,0.12)',  color: '#B06000', labelKey: 'app.licStatus.pending' },
  cancelled: { bg: 'rgba(180,180,180,0.15)', color: '#666',   labelKey: 'app.licStatus.cancelled' },
}

const RESULT_STYLE: Record<string, { bg: string; color: string; labelKey: string; icon: React.ReactNode }> = {
  blocked:         { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B', labelKey: 'app.result.blocked',  icon: <XOctagon size={13} /> },
  warned:          { bg: 'rgba(255,159,10,0.12)', color: '#B06000', labelKey: 'app.result.warned',  icon: <AlertTriangle size={13} /> },
  passed:          { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033', labelKey: 'app.result.passed',  icon: <CheckCircle2 size={13} /> },
  'manual-review': { bg: 'rgba(0,122,255,0.12)', color: '#005DC7', labelKey: 'app.result.manualReview', icon: <Eye size={13} /> },
}

const OFAC_STYLE: Record<OFACResult, { bg: string; color: string; labelKey: string }> = {
  clear:     { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033', labelKey: 'app.ofacResult.clear' },
  watchlist: { bg: 'rgba(255,159,10,0.12)',  color: '#B06000', labelKey: 'app.ofacResult.watchlist' },
  blocked:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', labelKey: 'app.ofacResult.blocked' },
  pending:   { bg: 'rgba(180,180,180,0.15)', color: '#666',    labelKey: 'app.ofacResult.pending' },
}

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11.5, fontWeight: 600, borderRadius: 6, padding: '2px 8px' }}>
      {children}
    </span>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

// ── Tab 1 — Appointment 申请 ───────────────────────────────────────────────────


function AppointmentApplicationTab({ navigateTo }: { navigateTo: (view: ViewId) => void }) {
  const { t } = useTranslation('appointment')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const counts = {
    all: appointmentRecords.length,
    approved: appointmentRecords.filter(r => r.status === 'approved').length,
    pending: appointmentRecords.filter(r => r.status === 'pending').length,
    'under-review': appointmentRecords.filter(r => r.status === 'under-review').length,
  }

  const filtered = appointmentRecords.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchSearch = !search || r.channelName.toLowerCase().includes(search.toLowerCase()) || r.insurerShort.toLowerCase().includes(search.toLowerCase()) || r.state.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t('app.stats.total'), value: counts.all, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: t('app.stats.approved'), value: counts.approved, color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: t('app.stats.pendingOrReview'), value: counts.pending + counts['under-review'], color: '#B06000', bg: 'rgba(255,159,10,0.08)' },
          { label: t('app.stats.expiring30'), value: appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length, color: '#C0392B', bg: 'rgba(255,59,48,0.08)' },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', fontWeight: 500, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {(['all', 'approved', 'pending', 'under-review', 'expired', 'rejected', 'terminated'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: statusFilter === s ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: statusFilter === s ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: statusFilter === s ? '#0058BC' : '#717786', cursor: 'pointer' }}>
              {s === 'all' ? t('app.filterAll', { n: counts.all }) : (STATUS_STYLE[s] ? t(STATUS_STYLE[s].labelKey) : s)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('app.searchPlaceholder')} className="input-glass" style={{ paddingLeft: 30, width: 220, fontSize: 12.5 }} />
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('appointment-new')}>
            <Plus size={14} /> {t('app.newApplication')}
          </button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['channel', 'insurer', 'stateLine', 'status', 'submittedDate', 'approvedDate', 'expiryDate', 'actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{t(`app.table.${h}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLE[r.status]
              const daysLabel = r.daysToExpiry < 0
                ? <span style={{ color: '#C0392B', fontSize: 11, fontWeight: 600 }}>{t('app.expiredDays', { d: Math.abs(r.daysToExpiry) })}</span>
                : r.daysToExpiry <= 30
                ? <span style={{ color: '#B06000', fontSize: 11, fontWeight: 600 }}>{t('app.expiresInDays', { d: r.daysToExpiry })}</span>
                : <span style={{ fontSize: 11, color: '#717786' }}>{r.expiryDate}</span>
              return (
                <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#181C23' }}>{r.channelName}</div>
                    <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{r.channelNpn}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23' }}>{r.insurerShort}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontWeight: 700, color: '#0058BC', fontSize: 13 }}>{r.state}</span>
                    <span style={{ color: '#A0A5B1', margin: '0 4px' }}>·</span>
                    <span style={{ fontSize: 12, color: '#555' }}>{r.line}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: r.approvedDate ? '#555' : '#C1C6D7', fontFamily: "'JetBrains Mono', monospace" }}>{r.approvedDate || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.expiryDate ? daysLabel : <span style={{ color: '#C1C6D7' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }} title={t('app.action.viewDetail')}><Eye size={13} /></button>
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5 }} title={t('app.action.renew')}><RefreshCw size={13} /></button>}
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5, color: '#C0392B' }} title={t('app.action.terminate')}><XCircle size={13} /></button>}
                      {r.status === 'rejected' && <button className="btn-ghost" style={{ padding: 5 }} title={t('app.action.reapply')}><Send size={13} /></button>}
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

// ── Tab 2 — 状态跟踪 ──────────────────────────────────────────────────────────

function StatusTrackingTab() {
  const { t } = useTranslation('appointment')
  const pending = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review')
  const timeline = [
    { date: '2026-08-22', event: t('app.timeline.event1'), type: 'block', detail: t('app.timeline.detail1') },
    { date: '2026-08-22', event: t('app.timeline.event2'), type: 'submit', detail: t('app.timeline.detail2') },
    { date: '2026-08-10', event: t('app.timeline.event3'), type: 'submit', detail: t('app.timeline.detail3') },
    { date: '2026-08-01', event: t('app.timeline.event4'), type: 'process', detail: t('app.timeline.detail4') },
    { date: '2026-07-20', event: t('app.timeline.event5'), type: 'submit', detail: t('app.timeline.detail5') },
    { date: '2026-07-14', event: t('app.timeline.event6'), type: 'expire', detail: t('app.timeline.detail6') },
    { date: '2026-06-01', event: t('app.timeline.event7'), type: 'void', detail: t('app.timeline.detail7') },
  ]
  // 时间轴节点类型只用于取颜色。本系统没有任何审批流程，所以类型里没有 approve/review，
  // 只有「提交 / 处理中 / 合规拦截 / 到期 / 失效」五种中性事件。
  const typeStyle: Record<string, { color: string }> = {
    submit: { color: '#0058BC' }, process: { color: '#B06000' }, block: { color: '#C0392B' }, expire: { color: '#666' }, void: { color: '#C0392B' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('app.processingAppointments', { n: pending.length })}</div>
        <div className="flex flex-col gap-3">
          {pending.map(r => (
            <Card key={r.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{r.channelName}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{r.insurerShort} · {r.state} · {r.line}</div>
                </div>
                <Badge bg={STATUS_STYLE[r.status].bg} color={STATUS_STYLE[r.status].color}>{t(STATUS_STYLE[r.status].labelKey)}</Badge>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 16, fontSize: 12 }}>
                <div><span style={{ color: '#717786' }}>{t('app.submittedDateLabel')}</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</span></div>
                <div><span style={{ color: '#717786' }}>{t('app.submittedByLabel')}</span>{r.submittedBy}</div>
                <div><span style={{ color: '#717786' }}>{t('app.niprIdLabel')}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: r.niprTransactionId ? '#0058BC' : '#C1C6D7' }}>{r.niprTransactionId || t('app.pendingAssignment')}</span></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[t('app.trackSteps.niprSubmit'), t('app.trackSteps.stateAccept'), t('app.trackSteps.insurerReview'), t('app.trackSteps.done')].map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', flex: idx < 3 ? 1 : undefined }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: idx < 1 ? '#0058BC' : 'rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx < 1 ? <CheckCircle2 size={11} color="#fff" /> : <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(193,198,215,0.8)' }} />}
                      </div>
                      <span style={{ fontSize: 10, color: '#717786', marginLeft: 3, whiteSpace: 'nowrap' }}>{s}</span>
                      {idx < 3 && <div style={{ flex: 1, height: 1, background: 'rgba(193,198,215,0.4)', margin: '0 4px' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('app.recentEvents')}</div>
        <Card style={{ padding: '16px' }}>
          <div className="flex flex-col">
            {timeline.map((ev, i) => {
              const ts = typeStyle[ev.type] || typeStyle.submit
              return (
                <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < timeline.length - 1 ? 14 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ts.color, flexShrink: 0, marginTop: 4 }} />
                    {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(193,198,215,0.4)', marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, color: '#A0A5B1', fontFamily: "'JetBrains Mono', monospace", marginBottom: 2 }}>{ev.date}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23', lineHeight: 1.4 }}>{ev.event}</div>
                    <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2, lineHeight: 1.5 }}>{ev.detail}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 3 — 续期与终止 ───────────────────────────────────────────────────────

function RenewalTerminationTab() {
  const { t } = useTranslation('appointment')
  const [subTab, setSubTab] = useState<'renewal' | 'termination'>('renewal')
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [renewStep, setRenewStep] = useState(false)

  const renewalDue = appointmentRecords.filter(r => r.status === 'approved' && r.daysToExpiry >= 0 && r.daysToExpiry <= 120)
  const terminatable = appointmentRecords.filter(r => r.status === 'approved')

  return (
    <div>
      <div className="tab-bar mb-5">
        {([['renewal', t('app.subtabs.renewal')], ['termination', t('app.subtabs.termination')]] as const).map(([v, l]) => (
          <div key={v} className={`tab-item${subTab === v ? ' active' : ''}`} onClick={() => setSubTab(v)}>{l}</div>
        ))}
      </div>

      {subTab === 'renewal' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
            {[
              { label: t('app.renewStats.due60'), value: renewalDue.filter(r => r.daysToExpiry <= 60).length, color: '#C0392B' },
              { label: t('app.renewStats.due6090'), value: renewalDue.filter(r => r.daysToExpiry > 60 && r.daysToExpiry <= 90).length, color: '#B06000' },
              { label: t('app.renewStats.inProgress'), value: appointmentRecords.filter(r => r.renewalStatus === 'in-progress').length, color: '#0058BC' },
            ].map(s => (
              <Card key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 4 }}>{s.label}</div>
              </Card>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {renewalDue.sort((a, b) => a.daysToExpiry - b.daysToExpiry).map(r => {
              const urgency = r.daysToExpiry <= 30 ? { bg: 'rgba(255,59,48,0.06)', border: 'rgba(255,59,48,0.3)', dot: '#C0392B' } : r.daysToExpiry <= 60 ? { bg: 'rgba(255,159,10,0.06)', border: 'rgba(255,159,10,0.3)', dot: '#B06000' } : { bg: 'rgba(0,88,188,0.04)', border: 'rgba(193,198,215,0.3)', dot: '#0058BC' }
              return (
                <div key={r.id} style={{ borderRadius: 12, padding: '14px 16px', background: urgency.bg, border: `1px solid ${urgency.border}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: urgency.dot, boxShadow: `0 0 6px ${urgency.dot}` }} />
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{r.channelName}</span>
                        <span style={{ fontSize: 12, color: '#717786' }}>· {r.insurerShort} · {r.state} · {r.line}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 4, paddingLeft: 20 }}>{t('app.expiryDateLabel')}<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#181C23' }}>{r.expiryDate}</span> · <span style={{ fontWeight: 700, color: urgency.dot }}>{t('app.daysLeft', { d: r.daysToExpiry })}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.renewalStatus === 'in-progress' && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t('app.renewalInProgress')}</Badge>}
                      <button onClick={() => setRenewStep(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {r.renewalStatus === 'in-progress' ? t('app.viewProgress') : t('app.startRenewal')}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {subTab === 'termination' && (
        <div>
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', fontSize: 12.5, color: '#7A2020', marginBottom: 16 }}>
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><AlertTriangle size={13} /> {t('app.terminationNotice')}</div>
            {t('app.terminationWarning')}
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                  {['channel', 'insurer', 'stateLine', 'approvedDate', 'expiryDate', 'actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{t(`app.table.${h}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terminatable.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#181C23' }}>{r.channelName}</div>
                      <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{r.channelNpn}</div>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23' }}>{r.insurerShort}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 700, color: '#0058BC' }}>{r.state}</span>
                      <span style={{ color: '#A0A5B1', margin: '0 4px' }}>·</span>
                      <span style={{ fontSize: 12, color: '#555' }}>{r.line}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{r.approvedDate}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{r.expiryDate}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => setTerminateId(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>{t('app.applyTerminate')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {terminateId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 18, width: 480, padding: '28px 30px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('app.terminateModalTitle')}</h3>
            <p style={{ fontSize: 13, color: '#717786', marginBottom: 20 }}>{t('app.terminateModalDesc')}</p>
            {[t('app.terminateReasons.channelInitiated'), t('app.terminateReasons.regulatory'), t('app.terminateReasons.insurerRequired'), t('app.terminateReasons.violation'), t('app.terminateReasons.other')].map(reason => (
              <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="term-reason" />{reason}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setTerminateId(null)}>{t('app.cancel')}</button>
              <button onClick={() => setTerminateId(null)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#C0392B', color: '#fff', border: 'none', cursor: 'pointer' }}>{t('app.confirmTerminate')}</button>
            </div>
          </div>
        </div>
      )}

      {renewStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 18, width: 480, padding: '28px 30px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{t('app.renewModalTitle')}</h3>
            <div style={{ fontSize: 13, color: '#717786', marginBottom: 16 }}>{t('app.renewModalDesc')}</div>
            {[t('app.renewPeriods.1y'), t('app.renewPeriods.2y'), t('app.renewPeriods.untilLicenseExpiry')].map(period => (
              <label key={period} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="renew-period" />{period}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setRenewStep(false)}>{t('app.cancel')}</button>
              <button onClick={() => setRenewStep(false)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>{t('app.submitRenewal')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 4 — NIPR 牌照管理 ─────────────────────────────────────────────────────

function NIRPLicenseTab() {
  const { t } = useTranslation('appointment')
  const [search, setSearch] = useState('')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verified, setVerified] = useState<string[]>([])

  const filtered = niprLicenses.filter(l =>
    !search || l.channelName.toLowerCase().includes(search.toLowerCase()) || l.npnNumber.toLowerCase().includes(search.toLowerCase()) || l.state.toLowerCase().includes(search.toLowerCase())
  )

  const expiringSoon = niprLicenses.filter(l => l.daysToExpiry >= 0 && l.daysToExpiry <= 60)
  const expired = niprLicenses.filter(l => l.daysToExpiry < 0 && l.status !== 'cancelled')
  const mismatch = niprLicenses.filter(l => l.verificationStatus === 'mismatch')

  const doVerify = (id: string) => {
    setVerifying(id)
    setTimeout(() => { setVerifying(null); setVerified(v => [...v, id]) }, 1800)
  }

  return (
    <div>
      {(expired.length > 0 || mismatch.length > 0) && (
        <div className="flex flex-col gap-2 mb-4">
          {expired.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertTriangle size={15} color="#C0392B" />
              <span style={{ color: '#7A2020', fontWeight: 600 }}>{t('app.expiredLicensesCount', { n: expired.length })}</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>{t('app.expiredLicensesHint')}</span>
            </div>
          )}
          {mismatch.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle size={15} color="#B06000" />
              <span style={{ color: '#7A5000', fontWeight: 600 }}>{t('app.mismatchLicensesCount', { n: mismatch.length })}</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>{t('app.mismatchHint')}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: t('app.licStats.total'), value: niprLicenses.length, color: '#0058BC' },
          { label: t('app.licStats.active'), value: niprLicenses.filter(l => l.status === 'active').length, color: '#1E8033' },
          { label: t('app.licStats.expiring60'), value: expiringSoon.length, color: '#B06000' },
          { label: t('app.licStats.expiredSuspended'), value: expired.length + niprLicenses.filter(l => l.status === 'suspended').length, color: '#C0392B' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="relative">
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('app.licSearchPlaceholder')} className="input-glass" style={{ paddingLeft: 30, width: 240, fontSize: 12.5 }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
          <ShieldCheck size={13} /> {t('app.batchNiprVerify')}
        </button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['channelNpn', 'state', 'licenseNumber', 'typeLine', 'status', 'expiryDate', 'niprVerification', 'ceHours', 'actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{t(`app.licTable.${h}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => {
              const st = LIC_STATUS_STYLE[l.status]
              const vs = l.verificationStatus
              const vsColor = vs === 'verified' ? '#1E8033' : vs === 'mismatch' ? '#B06000' : vs === 'not-found' ? '#C0392B' : '#A0A5B1'
              const vsLabel = vs === 'verified' ? t('app.verification.verified') : vs === 'mismatch' ? t('app.verification.mismatch') : vs === 'not-found' ? t('app.verification.notFound') : t('app.verification.pending')
              const isVerifying = verifying === l.id
              const wasVerified = verified.includes(l.id)
              const ceOk = (l.ceHoursCompleted ?? 0) >= (l.ceHoursRequired ?? 0)

              return (
                <tr key={l.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#181C23' }}>{l.channelName}</div>
                    <div style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{l.npnNumber}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0058BC', fontSize: 14 }}>{l.state}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{l.licenseNumber}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{l.licenseType}</div>
                    <div style={{ fontSize: 11, color: '#717786' }}>{l.lines.join(', ')}</div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><Badge bg={st.bg} color={st.color}>{t(st.labelKey)}</Badge></td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: l.daysToExpiry < 0 ? '#C0392B' : l.daysToExpiry <= 60 ? '#B06000' : '#555' }}>{l.expiryDate}</div>
                    {l.daysToExpiry >= 0 && l.daysToExpiry <= 60 && <div style={{ fontSize: 10.5, color: '#B06000', fontWeight: 600 }}>{t('app.daysRemaining', { d: l.daysToExpiry })}</div>}
                    {l.daysToExpiry < 0 && <div style={{ fontSize: 10.5, color: '#C0392B', fontWeight: 600 }}>{t('app.status.expired')}</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isVerifying
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0058BC' }}><Loader2 size={12} className="animate-spin" />{t('app.verifying')}</span>
                      : <span style={{ color: wasVerified ? '#1E8033' : vsColor, fontSize: 12, fontWeight: 600 }}>{wasVerified ? t('app.verification.verified') : vsLabel}</span>
                    }
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {(l.ceHoursRequired ?? 0) > 0 ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(193,198,215,0.4)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, ((l.ceHoursCompleted ?? 0) / (l.ceHoursRequired ?? 1)) * 100)}%`, background: ceOk ? '#34C759' : '#FF9F0A', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", color: ceOk ? '#1E8033' : '#B06000', fontWeight: 600 }}>{l.ceHoursCompleted}/{l.ceHoursRequired}h</span>
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: '#C1C6D7' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }}><Eye size={13} /></button>
                      <button className="btn-ghost" style={{ padding: 5 }} onClick={() => doVerify(l.id)}><ShieldCheck size={13} /></button>
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

// ── Tab 5 — 出单合规拦截 ──────────────────────────────────────────────────────

function ComplianceInterceptionTab() {
  const { t, i18n } = useTranslation('appointment')
  const isEn = i18n.language.startsWith('en')
  const [activeTab, setActiveTab] = useState<'log' | 'rules'>('log')

  const blockCount = interceptLogs.filter(l => l.result === 'blocked').length
  const warnCount = interceptLogs.filter(l => l.result === 'warned').length
  const reviewCount = interceptLogs.filter(l => l.result === 'manual-review').length
  const passCount = interceptLogs.filter(l => l.result === 'passed').length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: t('app.interceptStats.total'), value: interceptLogs.length, color: '#181C23' },
          { label: t('app.result.blocked'), value: blockCount, color: '#C0392B' },
          { label: t('app.result.warned'), value: warnCount, color: '#B06000' },
          { label: t('app.result.manualReview'), value: reviewCount, color: '#0058BC' },
          { label: t('app.result.passed'), value: passCount, color: '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="tab-bar mb-4">
        {([['log', t('app.interceptTabs.log')], ['rules', t('app.interceptTabs.rules')]] as const).map(([v, l]) => (
          <div key={v} className={`tab-item${activeTab === v ? ' active' : ''}`} onClick={() => setActiveTab(v)}>{l}</div>
        ))}
      </div>

      {activeTab === 'log' && (
        <div className="flex flex-col gap-3">
          {interceptLogs.map(log => {
            const rs = RESULT_STYLE[log.result]
            return (
              <Card key={log.id} style={{ padding: '14px 16px' }}>
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge bg={rs.bg} color={rs.color}>{rs.icon} {t(rs.labelKey)}</Badge>
                      <span style={{ fontSize: 11.5, color: '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{log.timestamp}</span>
                      <span style={{ fontSize: 12, color: '#717786' }}>{log.channelName} · {log.insurerShort} · {log.state} {log.line}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2" style={{ fontSize: 12.5 }}>
                      <span style={{ color: '#717786' }}>{t('app.policyDraftLabel')}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{log.policyDraftId}</span>
                      <span style={{ color: '#717786' }}>{t('app.customerLabel')}</span>
                      <span style={{ fontWeight: 600, color: '#181C23' }}>{log.customerName}</span>
                      <span style={{ color: '#717786' }}>{t('app.premiumLabel')}</span>
                      <span style={{ fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>${log.premiumAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {log.reasonDescriptions.map((d, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12.5, color: '#C0392B' }}>
                          <XOctagon size={11} style={{ flexShrink: 0, marginTop: 1 }} />
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {log.result === 'manual-review' && (
                    <div style={{ marginLeft: 16, flexShrink: 0 }}>
                      {log.overrideApproved
                        ? <Badge bg="rgba(52,199,89,0.12)" color="#1E8033">{t('app.released')}</Badge>
                        : <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>{t('app.result.manualReview')}</button>
                      }
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="flex flex-col gap-3">
          {complianceRules.map(rule => {
            const actionStyle = rule.action === 'block' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t('app.ruleAction.block') } : rule.action === 'warn' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t('app.ruleAction.warn') } : { bg: 'rgba(0,88,188,0.1)', color: '#0058BC', label: t('app.result.manualReview') }
            const catColors: Record<string, string> = { appointment: '#7B3FCA', license: '#0058BC', ofac: '#C0392B', channel: '#1E8033', product: '#B06000' }
            const catBg: Record<string, string> = { appointment: 'rgba(123,63,202,0.1)', license: 'rgba(0,88,188,0.1)', ofac: 'rgba(192,57,43,0.1)', channel: 'rgba(30,128,51,0.1)', product: 'rgba(176,96,0,0.1)' }
            return (
              <Card key={rule.id} style={{ padding: '14px 16px' }}>
                <div className="flex items-center justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: 11, fontWeight: 700, background: catBg[rule.category], color: catColors[rule.category], borderRadius: 5, padding: '2px 7px' }}>{rule.category.toUpperCase()}</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{isEn ? rule.nameEn : rule.name}</span>
                      <Badge bg={actionStyle.bg} color={actionStyle.color}>{actionStyle.label}</Badge>
                      <span style={{ fontSize: 11, color: '#A0A5B1' }}>{t('app.priority', { n: rule.priority })}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{isEn ? rule.conditionEn ?? rule.condition : rule.condition}</div>
                    <div style={{ fontSize: 11.5, color: '#A0A5B1' }}>{t('app.triggerCountLabel')}<span style={{ fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rule.triggeredCount}</span> · {t('app.lastTriggeredLabel')}{rule.lastTriggered || '—'}</div>
                  </div>
                  <div className="flex items-center gap-3 ml-6">
                    <button className="btn-ghost" style={{ padding: 5 }}><Edit2 size={13} /></button>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.enabled ? '#34C759' : '#C1C6D7' }}>
                      {rule.enabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab 6 — 合规报告 ──────────────────────────────────────────────────────────

function ComplianceReportTab() {
  const { t, i18n } = useTranslation('appointment')
  const isEn = i18n.language.startsWith('en')
  const [generating, setGenerating] = useState(false)
  const [genType, setGenType] = useState('appointment-status')
  const [genFormat, setGenFormat] = useState('PDF')
  const [showForm, setShowForm] = useState(false)

  const doGenerate = () => {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setShowForm(false) }, 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t('app.reportCenter')}</div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> {t('app.generateNewReport')}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t('app.configureReport')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('app.reportTypeLabel')}</label>
              <select value={genType} onChange={e => setGenType(e.target.value)} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                {REPORT_TYPES.map(v => <option key={v} value={v}>{t(`app.reportTypes.${v}`)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('app.reportPeriodLabel')}</label>
              <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                <option>{t('app.period.aug2026')}</option><option>{t('app.period.jul2026')}</option><option>2026-Q3</option><option>2026-Q2</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('app.outputFormatLabel')}</label>
              <div className="flex gap-2">
                {(['PDF', 'Excel', 'CSV'] as const).map(f => (
                  <button key={f} onClick={() => setGenFormat(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: genFormat === f ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: genFormat === f ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: genFormat === f ? '#0058BC' : '#717786', cursor: 'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setShowForm(false)}>{t('app.cancel')}</button>
            <button onClick={doGenerate} disabled={generating} style={{ padding: '7px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {generating ? <><Loader2 size={13} className="animate-spin" />{t('app.generating')}</> : t('app.startGeneration')}
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {complianceReports.map(rp => {
          const statusS = rp.status === 'ready' ? { bg: 'rgba(52,199,89,0.12)', color: '#1E8033', label: t('app.reportStatus.ready') } : rp.status === 'generating' ? { bg: 'rgba(255,159,10,0.12)', color: '#B06000', label: t('app.reportStatus.generating') } : rp.status === 'scheduled' ? { bg: 'rgba(180,180,180,0.15)', color: '#666', label: t('app.reportStatus.scheduled') } : { bg: 'rgba(255,59,48,0.12)', color: '#C0392B', label: t('app.reportStatus.failed') }
          return (
            <Card key={rp.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg="rgba(0,88,188,0.08)" color="#0058BC">{t(`app.reportTypes.${rp.type}`)}</Badge>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{isEn ? rp.nameEn : rp.name}</span>
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    <span style={{ fontSize: 11, color: '#A0A5B1', background: 'rgba(180,180,180,0.12)', padding: '1px 6px', borderRadius: 5 }}>{rp.format}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#717786' }}>
                    {rp.generatedDate ? <>{t('app.generatedAtLabel')}<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.generatedDate}</span> · {t('app.generatedByLabel')}{rp.generatedBy}</> : <>{t('app.scheduledGeneration')} · {t('app.operatorLabel')}{rp.generatedBy}</>}
                    {rp.fileSize && <> · {t('app.fileSizeLabel')}<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.fileSize}</span></>}
                    {rp.recordCount && <> · {t('app.recordCountLabel')}<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{rp.recordCount}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {rp.status === 'ready' && (
                    <>
                      <button className="btn-ghost" style={{ padding: 6 }}><Eye size={14} /></button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
                        <Download size={12} /> {t('app.download')}
                      </button>
                    </>
                  )}
                  {rp.status === 'generating' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#B06000' }}><Loader2 size={13} className="animate-spin" />{t('app.reportStatus.generating')}</span>}
                  {rp.status === 'scheduled' && <span style={{ fontSize: 12, color: '#A0A5B1' }}>{t('app.awaitingExecution')}</span>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 7 — OFAC 筛查 ────────────────────────────────────────────────────────

function OFACScreeningTab() {
  const { t } = useTranslation('appointment')
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<'Individual' | 'Company'>('Company')
  const [screening, setScreening] = useState(false)
  const [screenResult, setScreenResult] = useState<null | { result: OFACResult; score?: number; entry?: string }>(null)

  const doScreen = () => {
    setScreening(true)
    setScreenResult(null)
    setTimeout(() => {
      setScreening(false)
      const r = Math.random()
      if (r < 0.05) setScreenResult({ result: 'blocked', score: 97, entry: entityName.toUpperCase() })
      else if (r < 0.2) setScreenResult({ result: 'watchlist', score: Math.floor(75 + Math.random() * 20), entry: entityName + ' (variant)' })
      else setScreenResult({ result: 'clear' })
    }, 2200)
  }

  const clearCount = ofacScreenings.filter(s => s.result === 'clear').length
  const watchCount = ofacScreenings.filter(s => s.result === 'watchlist').length
  const blockCount = ofacScreenings.filter(s => s.result === 'blocked').length

  return (
    <div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>{t('app.ofac.title')}</div>
        <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>{t('app.ofac.subtitle')}</div>
        <div className="flex items-end gap-3">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('app.ofac.entityName')}</label>
            <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder={t('app.ofac.entityPlaceholder')} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t('app.ofac.typeLabel')}</label>
            <div className="flex gap-2">
              {(['Company', 'Individual'] as const).map(opt => (
                <button key={opt} onClick={() => setEntityType(opt)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: entityType === opt ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: entityType === opt ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: entityType === opt ? '#0058BC' : '#717786', cursor: 'pointer' }}>{opt === 'Company' ? t('app.ofac.company') : t('app.ofac.individual')}</button>
              ))}
            </div>
          </div>
          <button onClick={doScreen} disabled={!entityName || screening} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: entityName && !screening ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', border: 'none', cursor: entityName && !screening ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {screening ? <><Loader2 size={13} className="animate-spin" />{t('app.ofac.screening')}</> : <><Search size={13} />{t('app.ofac.startScreening')}</>}
          </button>
        </div>

        {screenResult && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: screenResult.result === 'clear' ? 'rgba(52,199,89,0.08)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.08)' : 'rgba(255,59,48,0.08)', border: `1px solid ${screenResult.result === 'clear' ? 'rgba(52,199,89,0.3)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.3)' : 'rgba(255,59,48,0.3)'}` }}>
            <div className="flex items-center gap-3">
              {screenResult.result === 'clear' ? <CheckCircle2 size={20} color="#1E8033" /> : screenResult.result === 'watchlist' ? <AlertTriangle size={20} color="#B06000" /> : <XOctagon size={20} color="#C0392B" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: screenResult.result === 'clear' ? '#1E8033' : screenResult.result === 'watchlist' ? '#B06000' : '#C0392B' }}>
                  {screenResult.result === 'clear' ? t('app.ofac.passed') : screenResult.result === 'watchlist' ? t('app.ofac.watchlistScore', { score: screenResult.score }) : t('app.ofac.blocked')}
                </div>
                {screenResult.entry && <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t('app.ofac.matchedEntryLabel')}{screenResult.entry}</div>}
                {screenResult.result === 'watchlist' && <div style={{ fontSize: 12, color: '#B06000', marginTop: 4 }}>{t('app.ofac.reviewHint')}</div>}
                {screenResult.result === 'blocked' && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 4 }}>{t('app.ofac.blockedHint')}</div>}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: t('app.ofac.stats.total'), value: ofacScreenings.length, color: '#181C23' },
          { label: t('app.ofacResult.clear'), value: clearCount, color: '#1E8033' },
          { label: t('app.ofacResult.watchlist'), value: watchCount, color: '#B06000' },
          { label: t('app.ofacResult.blocked'), value: blockCount, color: '#C0392B' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['timestamp', 'entityName', 'type', 'result', 'matchedEntry', 'operator', 'disposition'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{t(`app.ofac.table.${h}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ofacScreenings.map((s, i) => {
              const rs = OFAC_STYLE[s.result]
              return (
                <tr key={s.id} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: '#717786', whiteSpace: 'nowrap' }}>{s.timestamp}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#181C23' }}>{s.entityName}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#717786' }}>{s.entityType}</td>
                  <td style={{ padding: '10px 14px' }}><Badge bg={rs.bg} color={rs.color}>{t(rs.labelKey)}</Badge></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: s.matchedEntry ? '#B06000' : '#C1C6D7' }}>{s.matchedEntry || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{s.screenedBy}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {s.result === 'watchlist' && (
                      s.overrideApproved
                        ? <span style={{ fontSize: 11.5, color: '#1E8033', fontWeight: 600 }}>{t('app.released')}</span>
                        : <button style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>{t('app.result.manualReview')}</button>
                    )}
                    {s.result === 'blocked' && <span style={{ fontSize: 11.5, color: '#C0392B', fontWeight: 600 }}>{t('app.result.blocked')}</span>}
                    {s.result === 'clear' && <span style={{ fontSize: 11.5, color: '#1E8033' }}>{t('app.ofac.pass')}</span>}
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

// ── Main component ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'apply',     icon: <FileCheck size={15} />,   labelKey: 'app.tabs.application' },
  { id: 'track',     icon: <Activity size={15} />,    labelKey: 'app.tabs.tracking' },
  { id: 'renewal',   icon: <RefreshCw size={15} />,   labelKey: 'app.tabs.renewal' },
  { id: 'nipr',      icon: <ShieldCheck size={15} />, labelKey: 'app.tabs.license' },
  { id: 'intercept', icon: <Ban size={15} />,         labelKey: 'app.tabs.interception' },
  { id: 'report',    icon: <FileText size={15} />,    labelKey: 'app.tabs.report' },
  { id: 'ofac',      icon: <Search size={15} />,      labelKey: 'app.tabs.ofac' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function AppointmentApplicationView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment')
  const [tab, setTab] = useState<TabId>('apply')

  const expiredLicenses = niprLicenses.filter(l => l.daysToExpiry < 0).length
  const pendingApps = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review').length
  const urgentRenewals = appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30 && r.status === 'approved').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('app.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{t('app.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {expiredLicenses > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {t('app.expiredLicensesCount', { n: expiredLicenses })}
            </div>
          )}
          {urgentRenewals > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Bell size={13} /> {t('app.expiringSoonCount', { n: urgentRenewals })}
            </div>
          )}
        </div>
      </div>

      <div className="tab-bar mb-6">
        {TABS.map(tb => (
          <div
            key={tb.id}
            className={`tab-item${tab === tb.id ? ' active' : ''}`}
            onClick={() => setTab(tb.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {tb.icon}
            {t(tb.labelKey)}
            {tb.id === 'apply' && pendingApps > 0 && (
              <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingApps}</span>
            )}
            {tb.id === 'nipr' && expiredLicenses > 0 && (
              <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{expiredLicenses}</span>
            )}
          </div>
        ))}
      </div>

      {tab === 'apply' && <AppointmentApplicationTab navigateTo={navigateTo} />}
      {tab === 'track' && <StatusTrackingTab />}
      {tab === 'renewal' && <RenewalTerminationTab />}
      {tab === 'nipr' && <NIRPLicenseTab />}
      {tab === 'intercept' && <ComplianceInterceptionTab />}
      {tab === 'report' && <ComplianceReportTab />}
      {tab === 'ofac' && <OFACScreeningTab />}
    </div>
  )
}
