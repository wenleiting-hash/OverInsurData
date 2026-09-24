import { useState } from 'react'
import {
  FileCheck, RefreshCw, XCircle, Bell,
  Search, AlertTriangle, CheckCircle2,
  Plus, Eye, Send, Activity,
} from 'lucide-react'
import type { ViewId } from '@/App'
import { appointmentRecords } from './data/appointmentComplianceData'
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

// ── Main component ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'apply',     icon: <FileCheck size={15} />,   labelKey: 'app.tabs.application' },
  { id: 'track',     icon: <Activity size={15} />,    labelKey: 'app.tabs.tracking' },
  { id: 'renewal',   icon: <RefreshCw size={15} />,   labelKey: 'app.tabs.renewal' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function AppointmentApplicationView({ navigateTo }: Props) {
  const { t } = useTranslation('appointment')
  const [tab, setTab] = useState<TabId>('apply')

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
          </div>
        ))}
      </div>

      {tab === 'apply' && <AppointmentApplicationTab navigateTo={navigateTo} />}
      {tab === 'track' && <StatusTrackingTab />}
      {tab === 'renewal' && <RenewalTerminationTab />}
    </div>
  )
}
