import { useState } from 'react'
import {
  FileCheck, Clock, RefreshCw, XCircle, ShieldCheck, Bell,
  Ban, FileText, Search, AlertTriangle, CheckCircle2, XOctagon,
  Download, Plus, Eye, Edit2,
  AlertCircle, Filter, Loader2, Send, Activity,
  ToggleLeft, ToggleRight, Info,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang, type T } from '../i18n'
import {
  appointmentRecords,
  niprLicenses,
  interceptLogs,
  complianceRules,
  ofacScreenings,
  complianceReports,
  type OFACResult,
} from '../data/appointmentComplianceData'

// ── Shared helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  approved:       { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033' },
  pending:        { bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
  rejected:       { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B' },
  expired:        { bg: 'rgba(180,180,180,0.15)', color: '#666' },
  terminated:     { bg: 'rgba(130,80,255,0.12)', color: '#7B3FCA' },
  'under-review': { bg: 'rgba(0,122,255,0.12)',  color: '#005DC7' },
}

const LIC_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033' },
  inactive:  { bg: 'rgba(180,180,180,0.15)', color: '#666' },
  expired:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B' },
  suspended: { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B' },
  pending:   { bg: 'rgba(255,159,10,0.12)',  color: '#B06000' },
  cancelled: { bg: 'rgba(180,180,180,0.15)', color: '#666' },
}

const RESULT_STYLE: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  blocked:         { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B', icon: <XOctagon size={13} /> },
  warned:          { bg: 'rgba(255,159,10,0.12)', color: '#B06000', icon: <AlertTriangle size={13} /> },
  passed:          { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033', icon: <CheckCircle2 size={13} /> },
  'manual-review': { bg: 'rgba(0,122,255,0.12)', color: '#005DC7', icon: <Eye size={13} /> },
}

const OFAC_STYLE: Record<OFACResult, { bg: string; color: string }> = {
  clear:     { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033' },
  watchlist: { bg: 'rgba(255,159,10,0.12)',  color: '#B06000' },
  blocked:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B' },
  pending:   { bg: 'rgba(180,180,180,0.15)', color: '#666' },
}

const statusLabel = (t: T, s: string): string => ({
  approved: t.aptStatusApproved,
  pending: t.aptStatusPending,
  rejected: t.aptStatusRejected,
  expired: t.aptStatusExpired,
  terminated: t.aptStatusTerminated,
  'under-review': t.aptStatusUnderReview,
} as Record<string, string>)[s]

const licStatusLabel = (t: T, s: string): string => ({
  active: t.aptLicActive,
  inactive: t.aptLicInactive,
  expired: t.aptLicExpired,
  suspended: t.aptLicSuspended,
  pending: t.aptLicPending,
  cancelled: t.aptLicCancelled,
} as Record<string, string>)[s]

const resultLabel = (t: T, s: string): string => ({
  blocked: t.aptResultBlocked,
  warned: t.aptResultWarned,
  passed: t.aptResultPassed,
  'manual-review': t.aptResultManualReview,
} as Record<string, string>)[s]

const ofacLabel = (t: T, s: OFACResult): string => ({
  clear: t.aptOfacClear,
  watchlist: t.aptOfacWatchlist,
  blocked: t.aptResultBlocked,
  pending: t.aptOfacPending,
} as Record<OFACResult, string>)[s]

const licVerifyLabel = (t: T, vs: string): string => ({
  verified: t.aptVerVerified,
  mismatch: t.aptVerMismatch,
  'not-found': t.aptVerNotFound,
  pending: t.aptVerPending,
} as Record<string, string>)[vs]

const REPORT_TYPES = ['appointment-status', 'license-compliance', 'ofac-summary', 'interception-log', 'renewal-calendar', 'regulatory-filing'] as const

const reportTypeLabel = (t: T, type: string): string => ({
  'appointment-status': t.aptRptTypeAppointment,
  'license-compliance': t.aptRptTypeLicense,
  'ofac-summary': t.aptRptTypeOfac,
  'interception-log': t.aptRptTypeIntercept,
  'renewal-calendar': t.aptRptTypeRenewal,
  'regulatory-filing': t.aptRptTypeRegulatory,
} as Record<string, string>)[type]

// Date + type metadata for the event feed; text lives in the dictionary (aptTimeline).
const TIMELINE_META: { date: string; type: string }[] = [
  { date: '2026-08-22', type: 'block' },
  { date: '2026-08-22', type: 'submit' },
  { date: '2026-08-10', type: 'submit' },
  { date: '2026-08-01', type: 'review' },
  { date: '2026-07-20', type: 'submit' },
  { date: '2026-07-14', type: 'expire' },
  { date: '2026-06-01', type: 'reject' },
]

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

// ── Tab 1 — Applications ───────────────────────────────────────────────────────


function AppointmentApplicationTab({ navigateTo }: { navigateTo: (view: ViewId) => void }) {
  const { t } = useLang()
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
          { label: t.aptKpiTotal, value: counts.all, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: t.aptStatusApproved, value: counts.approved, color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: t.aptKpiPendingReview, value: counts.pending + counts['under-review'], color: '#B06000', bg: 'rgba(255,159,10,0.08)' },
          { label: t.aptKpiExpiring30, value: appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length, color: '#C0392B', bg: 'rgba(255,59,48,0.08)' },
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
              {s === 'all' ? t.aptFilterAll(counts.all) : (statusLabel(t, s) || s)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.aptSearchAppointments} className="input-glass" style={{ paddingLeft: 30, width: 220, fontSize: 12.5 }} />
          </div>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('appointment-new')}>
            <Plus size={14} /> {t.aptBtnNew}
          </button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {[t.aptColChannel, t.aptColInsurer, t.aptColStateLine, t.aptColStatus, t.aptColSubmitted, t.aptColApproved, t.aptColExpiry, t.aptColActions].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLE[r.status]
              const daysLabel = r.daysToExpiry < 0
                ? <span style={{ color: '#C0392B', fontSize: 11, fontWeight: 600 }}>{t.aptExpiredDays(Math.abs(r.daysToExpiry))}</span>
                : r.daysToExpiry <= 30
                ? <span style={{ color: '#B06000', fontSize: 11, fontWeight: 600 }}>{t.aptExpiresInDays(r.daysToExpiry)}</span>
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
                    <Badge bg={st.bg} color={st.color}>{statusLabel(t, r.status)}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: r.approvedDate ? '#555' : '#C1C6D7', fontFamily: "'JetBrains Mono', monospace" }}>{r.approvedDate || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.expiryDate ? daysLabel : <span style={{ color: '#C1C6D7' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }} title={t.aptActView}><Eye size={13} /></button>
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5 }} title={t.aptActRenew}><RefreshCw size={13} /></button>}
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5, color: '#C0392B' }} title={t.aptActTerminate}><XCircle size={13} /></button>}
                      {r.status === 'rejected' && <button className="btn-ghost" style={{ padding: 5 }} title={t.aptActReapply}><Send size={13} /></button>}
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

// ── Tab 2 — Status Tracking ────────────────────────────────────────────────────

function StatusTrackingTab() {
  const { t } = useLang()
  const pending = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review')
  const timeline = TIMELINE_META.map((m, i) => ({ date: m.date, type: m.type, event: t.aptTimeline[i].event, detail: t.aptTimeline[i].detail }))
  const typeStyle: Record<string, { color: string }> = {
    submit: { color: '#0058BC' }, review: { color: '#B06000' }, block: { color: '#C0392B' }, expire: { color: '#666' }, reject: { color: '#C0392B' }, approve: { color: '#1E8033' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t.aptInFlight(pending.length)}</div>
        <div className="flex flex-col gap-3">
          {pending.map(r => (
            <Card key={r.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{r.channelName}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{r.insurerShort} · {r.state} · {r.line}</div>
                </div>
                <Badge bg={STATUS_STYLE[r.status].bg} color={STATUS_STYLE[r.status].color}>{statusLabel(t, r.status)}</Badge>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 16, fontSize: 12 }}>
                <div><span style={{ color: '#717786' }}>{t.aptSubmittedLabel}</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</span></div>
                <div><span style={{ color: '#717786' }}>{t.aptSubmitterLabel}</span>{r.submittedBy}</div>
                <div><span style={{ color: '#717786' }}>{t.aptNiprIdLabel}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: r.niprTransactionId ? '#0058BC' : '#C1C6D7' }}>{r.niprTransactionId || t.aptNiprUnassigned}</span></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[t.aptStageNiprSubmitted, t.aptStageStateAccepted, t.aptStageCarrierReview, t.aptStageComplete].map((s, idx) => (
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t.aptRecentEvents}</div>
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

// ── Tab 3 — Renewals & Termination ────────────────────────────────────────────

function RenewalTerminationTab() {
  const { t } = useLang()
  const [subTab, setSubTab] = useState<'renewal' | 'termination'>('renewal')
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [renewStep, setRenewStep] = useState(false)

  const renewalDue = appointmentRecords.filter(r => r.status === 'approved' && r.daysToExpiry >= 0 && r.daysToExpiry <= 120)
  const terminatable = appointmentRecords.filter(r => r.status === 'approved')

  return (
    <div>
      <div className="tab-bar mb-5">
        {([['renewal', t.aptSubTabRenewal], ['termination', t.aptSubTabTermination]] as const).map(([v, l]) => (
          <div key={v} className={`tab-item${subTab === v ? ' active' : ''}`} onClick={() => setSubTab(v)}>{l}</div>
        ))}
      </div>

      {subTab === 'renewal' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
            {[
              { label: t.aptRenewDue60, value: renewalDue.filter(r => r.daysToExpiry <= 60).length, color: '#C0392B' },
              { label: t.aptRenewDue90, value: renewalDue.filter(r => r.daysToExpiry > 60 && r.daysToExpiry <= 90).length, color: '#B06000' },
              { label: t.aptRenewInProgressKpi, value: appointmentRecords.filter(r => r.renewalStatus === 'in-progress').length, color: '#0058BC' },
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
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 4, paddingLeft: 20 }}>{t.aptExpiryLabel}<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#181C23' }}>{r.expiryDate}</span> · {t.aptDaysRemainingPrefix} <span style={{ fontWeight: 700, color: urgency.dot }}>{r.daysToExpiry} {t.aptDaysUnit}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.renewalStatus === 'in-progress' && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">{t.aptRenewalInProgress}</Badge>}
                      <button onClick={() => setRenewStep(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {r.renewalStatus === 'in-progress' ? t.aptBtnViewProgress : t.aptBtnStartRenewal}
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
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><AlertTriangle size={13} /> {t.aptTermNoticeTitle}</div>
            {t.aptTermNoticeBody}
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                  {[t.aptColChannel, t.aptColInsurer, t.aptColStateLine, t.aptColApproved, t.aptColExpiry, t.aptColActions].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{h}</th>
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
                      <button onClick={() => setTerminateId(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>{t.aptActTerminate}</button>
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
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.aptTermModalTitle}</h3>
            <p style={{ fontSize: 13, color: '#717786', marginBottom: 20 }}>{t.aptTermModalDesc}</p>
            {[t.aptTermReasonChannel, t.aptTermReasonRegulator, t.aptTermReasonCarrier, t.aptTermReasonViolation, t.aptTermReasonOther].map(reason => (
              <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="term-reason" />{reason}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setTerminateId(null)}>{t.aptCancel}</button>
              <button onClick={() => setTerminateId(null)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#C0392B', color: '#fff', border: 'none', cursor: 'pointer' }}>{t.aptTermConfirm}</button>
            </div>
          </div>
        </div>
      )}

      {renewStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 18, width: 480, padding: '28px 30px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>{t.aptRenewModalTitle}</h3>
            <div style={{ fontSize: 13, color: '#717786', marginBottom: 16 }}>{t.aptRenewModalDesc}</div>
            {[t.aptRenew1yr, t.aptRenew2yr, t.aptRenewUntilLicense].map(period => (
              <label key={period} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="renew-period" />{period}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setRenewStep(false)}>{t.aptCancel}</button>
              <button onClick={() => setRenewStep(false)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>{t.aptRenewSubmit}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 4 — NIPR Licenses ──────────────────────────────────────────────────────

function NIRPLicenseTab() {
  const { t } = useLang()
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
              <span style={{ color: '#7A2020', fontWeight: 600 }}>{t.aptExpiredLicenses(expired.length)}</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>{t.aptLicenseExpiredHint}</span>
            </div>
          )}
          {mismatch.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle size={15} color="#B06000" />
              <span style={{ color: '#7A5000', fontWeight: 600 }}>{t.aptLicenseMismatchCount(mismatch.length)}</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>{t.aptLicenseMismatchHint}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: t.aptKpiLicTotal, value: niprLicenses.length, color: '#0058BC' },
          { label: t.aptKpiLicActive, value: niprLicenses.filter(l => l.status === 'active').length, color: '#1E8033' },
          { label: t.aptKpiLicExpiring60, value: expiringSoon.length, color: '#B06000' },
          { label: t.aptKpiLicExpiredSuspended, value: expired.length + niprLicenses.filter(l => l.status === 'suspended').length, color: '#C0392B' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.aptSearchLicenses} className="input-glass" style={{ paddingLeft: 30, width: 240, fontSize: 12.5 }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
          <ShieldCheck size={13} /> {t.aptBtnBulkVerify}
        </button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {[t.aptColChannelNpn, t.aptColState, t.aptColLicenseNo, t.aptColTypeLines, t.aptColStatus, t.aptColExpiry, t.aptColNiprVerify, t.aptColCeHours, t.aptColActions].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => {
              const st = LIC_STATUS_STYLE[l.status]
              const vs = l.verificationStatus
              const vsColor = vs === 'verified' ? '#1E8033' : vs === 'mismatch' ? '#B06000' : vs === 'not-found' ? '#C0392B' : '#A0A5B1'
              const vsLabel = licVerifyLabel(t, vs)
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
                  <td style={{ padding: '10px 14px' }}><Badge bg={st.bg} color={st.color}>{licStatusLabel(t, l.status)}</Badge></td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: l.daysToExpiry < 0 ? '#C0392B' : l.daysToExpiry <= 60 ? '#B06000' : '#555' }}>{l.expiryDate}</div>
                    {l.daysToExpiry >= 0 && l.daysToExpiry <= 60 && <div style={{ fontSize: 10.5, color: '#B06000', fontWeight: 600 }}>{t.aptDaysLeftShort(l.daysToExpiry)}</div>}
                    {l.daysToExpiry < 0 && <div style={{ fontSize: 10.5, color: '#C0392B', fontWeight: 600 }}>{t.aptStatusExpired}</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isVerifying
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0058BC' }}><Loader2 size={12} className="animate-spin" />{t.aptVerifying}</span>
                      : <span style={{ color: wasVerified ? '#1E8033' : vsColor, fontSize: 12, fontWeight: 600 }}>{wasVerified ? t.aptVerVerified : vsLabel}</span>
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

// ── Tab 5 — Binding Interception ───────────────────────────────────────────────

function ComplianceInterceptionTab() {
  const { lang, t } = useLang()
  const [activeTab, setActiveTab] = useState<'log' | 'rules'>('log')

  const blockCount = interceptLogs.filter(l => l.result === 'blocked').length
  const warnCount = interceptLogs.filter(l => l.result === 'warned').length
  const reviewCount = interceptLogs.filter(l => l.result === 'manual-review').length
  const passCount = interceptLogs.filter(l => l.result === 'passed').length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: t.aptKpiChecksTotal, value: interceptLogs.length, color: '#181C23' },
          { label: t.aptResultBlocked, value: blockCount, color: '#C0392B' },
          { label: t.aptResultWarned, value: warnCount, color: '#B06000' },
          { label: t.aptResultManualReview, value: reviewCount, color: '#0058BC' },
          { label: t.aptResultPassed, value: passCount, color: '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="tab-bar mb-4">
        {([['log', t.aptTabLog], ['rules', t.aptTabRules]] as const).map(([v, l]) => (
          <div key={v} className={`tab-item${activeTab === v ? ' active' : ''}`} onClick={() => setActiveTab(v)}>{l}</div>
        ))}
      </div>

      {activeTab === 'log' && (
        <div className="flex flex-col gap-3">
          {interceptLogs.map(log => {
            const rs = RESULT_STYLE[log.result]
            const descriptions = lang === 'en' ? log.reasonDescriptionsEn : log.reasonDescriptions
            return (
              <Card key={log.id} style={{ padding: '14px 16px' }}>
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge bg={rs.bg} color={rs.color}>{rs.icon} {resultLabel(t, log.result)}</Badge>
                      <span style={{ fontSize: 11.5, color: '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{log.timestamp}</span>
                      <span style={{ fontSize: 12, color: '#717786' }}>{log.channelName} · {log.insurerShort} · {log.state} {log.line}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2" style={{ fontSize: 12.5 }}>
                      <span style={{ color: '#717786' }}>{t.aptPolicyDraftLabel}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{log.policyDraftId}</span>
                      <span style={{ color: '#717786' }}>{t.aptCustomerLabel}</span>
                      <span style={{ fontWeight: 600, color: '#181C23' }}>{log.customerName}</span>
                      <span style={{ color: '#717786' }}>{t.aptPremiumLabel}</span>
                      <span style={{ fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>${log.premiumAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {descriptions.map((d, idx) => (
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
                        ? <Badge bg="rgba(52,199,89,0.12)" color="#1E8033">{t.aptReleased}</Badge>
                        : <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>{t.aptResultManualReview}</button>
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
            const actionStyle = rule.action === 'block' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: t.aptRuleActionBlock } : rule.action === 'warn' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: t.aptRuleActionWarn } : { bg: 'rgba(0,88,188,0.1)', color: '#0058BC', label: t.aptResultManualReview }
            const catColors: Record<string, string> = { appointment: '#7B3FCA', license: '#0058BC', ofac: '#C0392B', channel: '#1E8033', product: '#B06000' }
            const catBg: Record<string, string> = { appointment: 'rgba(123,63,202,0.1)', license: 'rgba(0,88,188,0.1)', ofac: 'rgba(192,57,43,0.1)', channel: 'rgba(30,128,51,0.1)', product: 'rgba(176,96,0,0.1)' }
            return (
              <Card key={rule.id} style={{ padding: '14px 16px' }}>
                <div className="flex items-center justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: 11, fontWeight: 700, background: catBg[rule.category], color: catColors[rule.category], borderRadius: 5, padding: '2px 7px' }}>{rule.category.toUpperCase()}</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{lang === 'en' ? rule.nameEn : rule.name}</span>
                      <Badge bg={actionStyle.bg} color={actionStyle.color}>{actionStyle.label}</Badge>
                      <span style={{ fontSize: 11, color: '#A0A5B1' }}>{t.aptPriority(rule.priority)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{lang === 'en' ? (rule.conditionEn ?? rule.condition) : rule.condition}</div>
                    <div style={{ fontSize: 11.5, color: '#A0A5B1' }}>{t.aptTriggerCountLabel}<span style={{ fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rule.triggeredCount}</span> · {t.aptLastTriggeredLabel}{rule.lastTriggered || '—'}</div>
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

// ── Tab 6 — Compliance Reports ─────────────────────────────────────────────────

function ComplianceReportTab() {
  const { lang, t } = useLang()
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t.aptReportCenter}</div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> {t.aptBtnNewReport}
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t.aptReportConfigTitle}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.aptReportTypeLabel}</label>
              <select value={genType} onChange={e => setGenType(e.target.value)} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                {REPORT_TYPES.map(v => <option key={v} value={v}>{reportTypeLabel(t, v)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.aptReportPeriodLabel}</label>
              <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                <option>{t.aptPeriodAug}</option><option>{t.aptPeriodJul}</option><option>2026-Q3</option><option>2026-Q2</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.aptFormatLabel}</label>
              <div className="flex gap-2">
                {(['PDF', 'Excel', 'CSV'] as const).map(f => (
                  <button key={f} onClick={() => setGenFormat(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: genFormat === f ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: genFormat === f ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: genFormat === f ? '#0058BC' : '#717786', cursor: 'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setShowForm(false)}>{t.aptCancel}</button>
            <button onClick={doGenerate} disabled={generating} style={{ padding: '7px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {generating ? <><Loader2 size={13} className="animate-spin" />{t.aptGenerating}</> : t.aptBtnGenerate}
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {complianceReports.map(rp => {
          const statusS = rp.status === 'ready' ? { bg: 'rgba(52,199,89,0.12)', color: '#1E8033', label: t.aptRptReady } : rp.status === 'generating' ? { bg: 'rgba(255,159,10,0.12)', color: '#B06000', label: t.aptRptGenerating } : rp.status === 'scheduled' ? { bg: 'rgba(180,180,180,0.15)', color: '#666', label: t.aptRptScheduled } : { bg: 'rgba(255,59,48,0.12)', color: '#C0392B', label: t.aptRptFailed }
          return (
            <Card key={rp.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg="rgba(0,88,188,0.08)" color="#0058BC">{reportTypeLabel(t, rp.type)}</Badge>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{lang === 'en' ? rp.nameEn : rp.name}</span>
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    <span style={{ fontSize: 11, color: '#A0A5B1', background: 'rgba(180,180,180,0.12)', padding: '1px 6px', borderRadius: 5 }}>{rp.format}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#717786' }}>
                    {rp.generatedDate ? <>{t.aptGeneratedAtLabel}<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.generatedDate}</span> · {t.aptGeneratedByLabel}{rp.generatedBy}</> : <>{t.aptScheduledByPrefix}{rp.generatedBy}</>}
                    {rp.fileSize && <> · {t.aptSizeLabel}<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.fileSize}</span></>}
                    {rp.recordCount && <> · {t.aptRecordCountLabel}<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{rp.recordCount}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {rp.status === 'ready' && (
                    <>
                      <button className="btn-ghost" style={{ padding: 6 }}><Eye size={14} /></button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
                        <Download size={12} /> {t.aptBtnDownload}
                      </button>
                    </>
                  )}
                  {rp.status === 'generating' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#B06000' }}><Loader2 size={13} className="animate-spin" />{t.aptRptGenerating}</span>}
                  {rp.status === 'scheduled' && <span style={{ fontSize: 12, color: '#A0A5B1' }}>{t.aptAwaitingRun}</span>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab 7 — OFAC Screening ─────────────────────────────────────────────────────

function OFACScreeningTab() {
  const { t } = useLang()
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>{t.aptOfacScreenTitle}</div>
        <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>{t.aptOfacScreenSub}</div>
        <div className="flex items-end gap-3">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.aptEntityNameLabel}</label>
            <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder={t.aptEntityNamePlaceholder} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>{t.aptTypeLabel}</label>
            <div className="flex gap-2">
              {(['Company', 'Individual'] as const).map(ty => (
                <button key={ty} onClick={() => setEntityType(ty)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: entityType === ty ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: entityType === ty ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: entityType === ty ? '#0058BC' : '#717786', cursor: 'pointer' }}>{ty === 'Company' ? t.aptTypeCompany : t.aptTypeIndividual}</button>
              ))}
            </div>
          </div>
          <button onClick={doScreen} disabled={!entityName || screening} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: entityName && !screening ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', border: 'none', cursor: entityName && !screening ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {screening ? <><Loader2 size={13} className="animate-spin" />{t.aptScreeningNow}</> : <><Search size={13} />{t.aptBtnScreen}</>}
          </button>
        </div>

        {screenResult && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: screenResult.result === 'clear' ? 'rgba(52,199,89,0.08)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.08)' : 'rgba(255,59,48,0.08)', border: `1px solid ${screenResult.result === 'clear' ? 'rgba(52,199,89,0.3)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.3)' : 'rgba(255,59,48,0.3)'}` }}>
            <div className="flex items-center gap-3">
              {screenResult.result === 'clear' ? <CheckCircle2 size={20} color="#1E8033" /> : screenResult.result === 'watchlist' ? <AlertTriangle size={20} color="#B06000" /> : <XOctagon size={20} color="#C0392B" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: screenResult.result === 'clear' ? '#1E8033' : screenResult.result === 'watchlist' ? '#B06000' : '#C0392B' }}>
                  {screenResult.result === 'clear' ? t.aptScreenClear : screenResult.result === 'watchlist' ? t.aptScreenWatch(screenResult.score ?? 0) : t.aptScreenBlocked}
                </div>
                {screenResult.entry && <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t.aptMatchedEntryLabel}{screenResult.entry}</div>}
                {screenResult.result === 'watchlist' && <div style={{ fontSize: 12, color: '#B06000', marginTop: 4 }}>{t.aptWatchHint}</div>}
                {screenResult.result === 'blocked' && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 4 }}>{t.aptBlockedHint}</div>}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: t.aptKpiScreenTotal, value: ofacScreenings.length, color: '#181C23' },
          { label: t.aptOfacClear, value: clearCount, color: '#1E8033' },
          { label: t.aptOfacWatchlist, value: watchCount, color: '#B06000' },
          { label: t.aptResultBlocked, value: blockCount, color: '#C0392B' },
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
              {[t.aptColTimestamp, t.aptColEntityName, t.aptColType, t.aptColResult, t.aptColMatchedEntry, t.aptColOperator, t.aptColDisposition].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{h}</th>
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
                  <td style={{ padding: '10px 14px' }}><Badge bg={rs.bg} color={rs.color}>{ofacLabel(t, s.result)}</Badge></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: s.matchedEntry ? '#B06000' : '#C1C6D7' }}>{s.matchedEntry || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{s.screenedBy}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {s.result === 'watchlist' && (
                      s.overrideApproved
                        ? <span style={{ fontSize: 11.5, color: '#1E8033', fontWeight: 600 }}>{t.aptReleased}</span>
                        : <button style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>{t.aptResultManualReview}</button>
                    )}
                    {s.result === 'blocked' && <span style={{ fontSize: 11.5, color: '#C0392B', fontWeight: 600 }}>{t.aptResultBlocked}</span>}
                    {s.result === 'clear' && <span style={{ fontSize: 11.5, color: '#1E8033' }}>{t.aptOfacPassed}</span>}
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
  { id: 'apply',     icon: <FileCheck size={15} /> },
  { id: 'track',     icon: <Activity size={15} /> },
  { id: 'renewal',   icon: <RefreshCw size={15} /> },
  { id: 'nipr',      icon: <ShieldCheck size={15} /> },
  { id: 'intercept', icon: <Ban size={15} /> },
  { id: 'report',    icon: <FileText size={15} /> },
  { id: 'ofac',      icon: <Search size={15} /> },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function AppointmentView({ navigateTo }: Props) {
  const { t } = useLang()
  const [tab, setTab] = useState<TabId>('apply')

  const tabLabels: Record<TabId, string> = {
    apply: t.aptTabApply,
    track: t.aptTabTrack,
    renewal: t.aptTabRenewal,
    nipr: t.aptTabNipr,
    intercept: t.aptTabIntercept,
    report: t.aptTabReport,
    ofac: t.aptTabOfac,
  }

  const expiredLicenses = niprLicenses.filter(l => l.daysToExpiry < 0).length
  const pendingApps = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review').length
  const urgentRenewals = appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30 && r.status === 'approved').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t.aptTitle}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{t.aptSubtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {expiredLicenses > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {t.aptExpiredLicenses(expiredLicenses)}
            </div>
          )}
          {urgentRenewals > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Bell size={13} /> {t.aptExpiringSoon(urgentRenewals)}
            </div>
          )}
        </div>
      </div>

      <div className="tab-bar mb-6">
        {TABS.map(tabItem => (
          <div
            key={tabItem.id}
            className={`tab-item${tab === tabItem.id ? ' active' : ''}`}
            onClick={() => setTab(tabItem.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {tabItem.icon}
            {tabLabels[tabItem.id]}
            {tabItem.id === 'apply' && pendingApps > 0 && (
              <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingApps}</span>
            )}
            {tabItem.id === 'nipr' && expiredLicenses > 0 && (
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
