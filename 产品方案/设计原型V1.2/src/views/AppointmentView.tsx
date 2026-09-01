import { useState } from 'react'
import {
  FileCheck, Clock, RefreshCw, XCircle, ShieldCheck, Bell,
  Ban, FileText, Search, AlertTriangle, CheckCircle2, XOctagon,
  Download, Plus, Eye, Edit2,
  AlertCircle, Filter, Loader2, Send, Activity,
  ToggleLeft, ToggleRight, Info,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import {
  appointmentRecords,
  niprLicenses,
  interceptLogs,
  complianceRules,
  ofacScreenings,
  complianceReports,
  REPORT_TYPE_LABEL,
  type OFACResult,
} from '../data/appointmentComplianceData'

// ── Shared helpers ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  approved:       { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033', label: '已批准' },
  pending:        { bg: 'rgba(255,159,10,0.12)', color: '#B06000', label: '待审核' },
  rejected:       { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B', label: '已拒绝' },
  expired:        { bg: 'rgba(180,180,180,0.15)', color: '#666',  label: '已过期' },
  terminated:     { bg: 'rgba(130,80,255,0.12)', color: '#7B3FCA', label: '已终止' },
  'under-review': { bg: 'rgba(0,122,255,0.12)',  color: '#005DC7', label: '审核中' },
}

const LIC_STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active:    { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033', label: '有效' },
  inactive:  { bg: 'rgba(180,180,180,0.15)', color: '#666',   label: '未激活' },
  expired:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', label: '已过期' },
  suspended: { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', label: '已暂停' },
  pending:   { bg: 'rgba(255,159,10,0.12)',  color: '#B06000', label: '待处理' },
  cancelled: { bg: 'rgba(180,180,180,0.15)', color: '#666',   label: '已注销' },
}

const RESULT_STYLE: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  blocked:         { bg: 'rgba(255,59,48,0.12)',  color: '#C0392B', label: '已拦截',  icon: <XOctagon size={13} /> },
  warned:          { bg: 'rgba(255,159,10,0.12)', color: '#B06000', label: '已警告',  icon: <AlertTriangle size={13} /> },
  passed:          { bg: 'rgba(52,199,89,0.12)',  color: '#1E8033', label: '已通过',  icon: <CheckCircle2 size={13} /> },
  'manual-review': { bg: 'rgba(0,122,255,0.12)', color: '#005DC7', label: '人工审核', icon: <Eye size={13} /> },
}

const OFAC_STYLE: Record<OFACResult, { bg: string; color: string; label: string }> = {
  clear:     { bg: 'rgba(52,199,89,0.12)',   color: '#1E8033', label: '清单无记录' },
  watchlist: { bg: 'rgba(255,159,10,0.12)',  color: '#B06000', label: '疑似匹配'   },
  blocked:   { bg: 'rgba(255,59,48,0.12)',   color: '#C0392B', label: '已拦截'     },
  pending:   { bg: 'rgba(180,180,180,0.15)', color: '#666',    label: '筛查中'     },
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
    <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>
      {children}
    </div>
  )
}

// ── Tab 1 — Appointment 申请 ───────────────────────────────────────────────────

function ApplyWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ channelId: '', insurer: '', state: '', line: '', reason: '', urgent: false })
  const steps = ['选择渠道', '选择保险公司', '配置详情', '确认提交']
  const channels = [
    { id: 'c1', name: 'Pacific Coast Insurance Group', npn: 'NPN12348901', state: 'CA' },
    { id: 'c2', name: 'Lone Star Brokerage', npn: 'NPN23459012', state: 'TX' },
    { id: 'c3', name: 'Great Lakes Insurance Partners', npn: 'NPN34560123', state: 'IL' },
    { id: 'c4', name: 'Empire State Insurance Services', npn: 'NPN45671234', state: 'NY' },
    { id: 'c5', name: 'Sunshine State Brokers', npn: 'NPN56782345', state: 'FL' },
  ]
  const insurers = ['Travelers', 'Liberty Mutual', 'Nationwide', 'Chubb', 'AIG', 'Zurich', 'Berkshire Hathaway', 'Hartford']
  const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
  const lines = ['P&C', 'Auto', 'Life', 'Health', 'Commercial', 'Specialty', 'Professional', 'Surplus Lines']
  const canNext = [!!form.channelId, !!form.insurer, !!form.state && !!form.line, true]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-strong" style={{ borderRadius: 20, width: 640, padding: '28px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23' }}>新建 Appointment 申请</h2>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><XCircle size={18} /></button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i < step ? '#0058BC' : i === step ? 'rgba(0,88,188,0.12)' : 'rgba(113,119,134,0.1)', color: i <= step ? '#0058BC' : '#A0A5B1', border: i === step ? '2px solid #0058BC' : 'none' }}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? '#0058BC' : '#A0A5B1', fontWeight: i === step ? 600 : 400, whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? '#0058BC' : 'rgba(193,198,215,0.5)', margin: '0 8px', marginBottom: 16 }} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div>
            <p style={{ fontSize: 13, color: '#717786', marginBottom: 14 }}>选择要申请 Appointment 的渠道商</p>
            <div className="flex flex-col gap-2">
              {channels.map(ch => (
                <button key={ch.id} onClick={() => setForm(f => ({ ...f, channelId: ch.id }))} className="text-left" style={{ borderRadius: 10, padding: '12px 14px', border: form.channelId === ch.id ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: form.channelId === ch.id ? 'rgba(0,88,188,0.06)' : 'rgba(255,255,255,0.5)' }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#181C23' }}>{ch.name}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>NPN: {ch.npn} · 居住州: {ch.state}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <p style={{ fontSize: 13, color: '#717786', marginBottom: 14 }}>选择要申请 Appointment 的保险公司</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {insurers.map(ins => (
                <button key={ins} onClick={() => setForm(f => ({ ...f, insurer: ins }))} className="text-left" style={{ borderRadius: 10, padding: '10px 14px', border: form.insurer === ins ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: form.insurer === ins ? 'rgba(0,88,188,0.06)' : 'rgba(255,255,255,0.5)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: '#181C23' }}>{ins}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>申请州 *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
                {states.map(s => (
                  <button key={s} onClick={() => setForm(f => ({ ...f, state: s }))} style={{ borderRadius: 6, padding: '4px 2px', fontSize: 11, fontWeight: 600, border: form.state === s ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: form.state === s ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: form.state === s ? '#0058BC' : '#555', cursor: 'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>业务线 *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {lines.map(l => (
                  <button key={l} onClick={() => setForm(f => ({ ...f, line: l }))} style={{ borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, border: form.line === l ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: form.line === l ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: form.line === l ? '#0058BC' : '#555', cursor: 'pointer' }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>申请说明</label>
              <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="请输入申请原因、业务背景等补充说明…" className="input-glass" style={{ width: '100%', resize: 'vertical', fontSize: 13 }} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="urgent" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} />
              <label htmlFor="urgent" style={{ fontSize: 13, color: '#181C23', cursor: 'pointer' }}>标记为紧急申请（加急处理，预计 3 工作日）</label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="glass-card" style={{ borderRadius: 12, padding: '16px 18px', background: 'rgba(0,88,188,0.04)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>申请摘要确认</div>
              {[
                ['渠道商', channels.find(c => c.id === form.channelId)?.name || '—'],
                ['渠道 NPN', channels.find(c => c.id === form.channelId)?.npn || '—'],
                ['保险公司', form.insurer || '—'],
                ['申请州', form.state || '—'],
                ['业务线', form.line || '—'],
                ['优先级', form.urgent ? '🚨 紧急' : '普通'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.3)', padding: '7px 0', fontSize: 13 }}>
                  <span style={{ color: '#717786' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#181C23' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.2)', fontSize: 12.5, color: '#7A5000' }}>
              <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 4 }}>
                <Info size={13} /> 提交前注意事项
              </div>
              提交后系统将自动通过 NIPR 提交 Appointment 申请，处理周期通常为 2–6 周，具体视州监管机构而定。请确保渠道牌照在申请州有效。
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button className="btn-ghost" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()} style={{ padding: '8px 20px', fontSize: 13 }}>
            {step === 0 ? '取消' : '上一步'}
          </button>
          <button
            onClick={() => step < 3 ? setStep(s => s + 1) : onClose()}
            disabled={!canNext[step]}
            style={{ padding: '8px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: canNext[step] ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', cursor: canNext[step] ? 'pointer' : 'not-allowed', border: 'none' }}
          >
            {step < 3 ? '下一步' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AppointmentApplicationTab() {
  const [showWizard, setShowWizard] = useState(false)
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
      {showWizard && <ApplyWizard onClose={() => setShowWizard(false)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '总 Appointment 数', value: counts.all, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
          { label: '已批准', value: counts.approved, color: '#1E8033', bg: 'rgba(52,199,89,0.08)' },
          { label: '待审核 / 审核中', value: counts.pending + counts['under-review'], color: '#B06000', bg: 'rgba(255,159,10,0.08)' },
          { label: '近 30 天到期', value: appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30).length, color: '#C0392B', bg: 'rgba(255,59,48,0.08)' },
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
              {s === 'all' ? `全部 (${counts.all})` : (STATUS_STYLE[s]?.label ?? s)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索渠道、保险公司、州…" className="input-glass" style={{ paddingLeft: 30, width: 220, fontSize: 12.5 }} />
          </div>
          <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> 新建申请
          </button>
        </div>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['渠道商', '保险公司', '州 / 业务线', '状态', '提交日期', '批准日期', '到期日', '操作'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLE[r.status]
              const daysLabel = r.daysToExpiry < 0
                ? <span style={{ color: '#C0392B', fontSize: 11, fontWeight: 600 }}>已过期 {Math.abs(r.daysToExpiry)}d</span>
                : r.daysToExpiry <= 30
                ? <span style={{ color: '#B06000', fontSize: 11, fontWeight: 600 }}>{r.daysToExpiry}d 后到期</span>
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
                    <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: r.approvedDate ? '#555' : '#C1C6D7', fontFamily: "'JetBrains Mono', monospace" }}>{r.approvedDate || '—'}</td>
                  <td style={{ padding: '10px 14px' }}>{r.expiryDate ? daysLabel : <span style={{ color: '#C1C6D7' }}>—</span>}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-1">
                      <button className="btn-ghost" style={{ padding: 5 }} title="查看详情"><Eye size={13} /></button>
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5 }} title="申请续期"><RefreshCw size={13} /></button>}
                      {r.status === 'approved' && <button className="btn-ghost" style={{ padding: 5, color: '#C0392B' }} title="申请终止"><XCircle size={13} /></button>}
                      {r.status === 'rejected' && <button className="btn-ghost" style={{ padding: 5 }} title="重新申请"><Send size={13} /></button>}
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
  const pending = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review')
  const timeline = [
    { date: '2026-08-22', event: 'QT-2026-088421 出单被拦截', type: 'block', detail: 'Northeast Professional — Hartford CT Commercial — Appointment 已过期' },
    { date: '2026-08-22', event: 'ap8 Southwest Insurance Network 提交 Zurich AZ Commercial Appointment', type: 'submit', detail: '申请已发至 NIPR，等待州保险局受理' },
    { date: '2026-08-10', event: 'ap8 申请提交', type: 'submit', detail: '渠道 Lisa Wang 提交，系统自动预填 NPN' },
    { date: '2026-08-01', event: 'ap5 AIG FL Professional 进入人工审核', type: 'review', detail: '保险公司内部合规审查，预计 5 工作日' },
    { date: '2026-07-20', event: 'ap4 Liberty Mutual NY Auto 申请提交', type: 'submit', detail: '待 NIPR 受理确认' },
    { date: '2026-07-14', event: 'ap6 Hartford CT Commercial Appointment 到期', type: 'expire', detail: '渠道 Northeast Professional — 60 天前已发送到期提醒，未完成续期' },
    { date: '2026-06-01', event: 'ap10 Travelers CA Auto WA 申请被拒', type: 'reject', detail: 'WA 州牌照未激活' },
  ]
  const typeStyle: Record<string, { color: string }> = {
    submit: { color: '#0058BC' }, review: { color: '#B06000' }, block: { color: '#C0392B' }, expire: { color: '#666' }, reject: { color: '#C0392B' }, approve: { color: '#1E8033' },
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>处理中的 Appointment ({pending.length})</div>
        <div className="flex flex-col gap-3">
          {pending.map(r => (
            <Card key={r.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{r.channelName}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{r.insurerShort} · {r.state} · {r.line}</div>
                </div>
                <Badge bg={STATUS_STYLE[r.status].bg} color={STATUS_STYLE[r.status].color}>{STATUS_STYLE[r.status].label}</Badge>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 16, fontSize: 12 }}>
                <div><span style={{ color: '#717786' }}>提交日期：</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.submittedDate}</span></div>
                <div><span style={{ color: '#717786' }}>提交人：</span>{r.submittedBy}</div>
                <div><span style={{ color: '#717786' }}>NIPR ID：</span><span style={{ fontFamily: "'JetBrains Mono', monospace", color: r.niprTransactionId ? '#0058BC' : '#C1C6D7' }}>{r.niprTransactionId || '待分配'}</span></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {['NIPR 提交', '州保险局受理', '保险公司审核', '完成'].map((s, idx) => (
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>最近事件流</div>
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
  const [subTab, setSubTab] = useState<'renewal' | 'termination'>('renewal')
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [renewStep, setRenewStep] = useState(false)

  const renewalDue = appointmentRecords.filter(r => r.status === 'approved' && r.daysToExpiry >= 0 && r.daysToExpiry <= 120)
  const terminatable = appointmentRecords.filter(r => r.status === 'approved')

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {([['renewal', '续期管理'], ['termination', '终止管理']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '6px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: subTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: subTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: subTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'renewal' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
            {[
              { label: '待续期（60天内）', value: renewalDue.filter(r => r.daysToExpiry <= 60).length, color: '#C0392B' },
              { label: '即将到期（60–90天）', value: renewalDue.filter(r => r.daysToExpiry > 60 && r.daysToExpiry <= 90).length, color: '#B06000' },
              { label: '续期中', value: appointmentRecords.filter(r => r.renewalStatus === 'in-progress').length, color: '#0058BC' },
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
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 4, paddingLeft: 20 }}>到期日：<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#181C23' }}>{r.expiryDate}</span> · 还剩 <span style={{ fontWeight: 700, color: urgency.dot }}>{r.daysToExpiry} 天</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.renewalStatus === 'in-progress' && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">续期进行中</Badge>}
                      <button onClick={() => setRenewStep(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {r.renewalStatus === 'in-progress' ? '查看进度' : '发起续期'}
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
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><AlertTriangle size={13} /> 终止前须知</div>
            终止 Appointment 后，渠道将无法在对应州/业务线为该保险公司出单。终止操作将通过 NIPR 向监管机构报告，不可撤销。
          </div>
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                  {['渠道商', '保险公司', '州 / 业务线', '批准日期', '到期日', '操作'].map(h => (
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
                      <button onClick={() => setTerminateId(r.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>申请终止</button>
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
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>确认终止 Appointment</h3>
            <p style={{ fontSize: 13, color: '#717786', marginBottom: 20 }}>此操作不可逆。请选择终止原因：</p>
            {['渠道主动申请终止', '监管要求终止', '保险公司要求终止', '渠道违规处理', '其他原因'].map(reason => (
              <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="term-reason" />{reason}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setTerminateId(null)}>取消</button>
              <button onClick={() => setTerminateId(null)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#C0392B', color: '#fff', border: 'none', cursor: 'pointer' }}>确认终止</button>
            </div>
          </div>
        </div>
      )}

      {renewStep && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 18, width: 480, padding: '28px 30px' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 16 }}>发起 Appointment 续期</h3>
            <div style={{ fontSize: 13, color: '#717786', marginBottom: 16 }}>系统将通过 NIPR 自动提交续期申请，请确认续期周期：</div>
            {['续期 1 年', '续期 2 年', '续期至牌照到期日'].map(period => (
              <label key={period} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer', fontSize: 13, color: '#181C23' }}>
                <input type="radio" name="renew-period" />{period}
              </label>
            ))}
            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 18px' }} onClick={() => setRenewStep(false)}>取消</button>
              <button onClick={() => setRenewStep(false)} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>提交续期申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 4 — NIPR 牌照管理 ─────────────────────────────────────────────────────

function NIRPLicenseTab() {
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
              <span style={{ color: '#7A2020', fontWeight: 600 }}>{expired.length} 个牌照已过期</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>需立即续期，过期牌照将导致出单拦截</span>
            </div>
          )}
          {mismatch.length > 0 && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <AlertCircle size={15} color="#B06000" />
              <span style={{ color: '#7A5000', fontWeight: 600 }}>{mismatch.length} 个牌照与 NIPR 数据存在差异</span>
              <span style={{ color: '#A0A5B1' }}>—</span>
              <span style={{ color: '#717786' }}>需核实并更新</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: '总牌照数', value: niprLicenses.length, color: '#0058BC' },
          { label: '有效牌照', value: niprLicenses.filter(l => l.status === 'active').length, color: '#1E8033' },
          { label: '60天内到期', value: expiringSoon.length, color: '#B06000' },
          { label: '已过期 / 暂停', value: expired.length + niprLicenses.filter(l => l.status === 'suspended').length, color: '#C0392B' },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索渠道、NPN、州…" className="input-glass" style={{ paddingLeft: 30, width: 240, fontSize: 12.5 }} />
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
          <ShieldCheck size={13} /> 批量 NIPR 验证
        </button>
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['渠道商 / NPN', '州', '牌照号', '类型 / 业务线', '状态', '到期日', 'NIPR 验证', 'CE 学时', '操作'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((l, i) => {
              const st = LIC_STATUS_STYLE[l.status]
              const vs = l.verificationStatus
              const vsColor = vs === 'verified' ? '#1E8033' : vs === 'mismatch' ? '#B06000' : vs === 'not-found' ? '#C0392B' : '#A0A5B1'
              const vsLabel = vs === 'verified' ? '已验证' : vs === 'mismatch' ? '数据差异' : vs === 'not-found' ? '未找到' : '待验证'
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
                  <td style={{ padding: '10px 14px' }}><Badge bg={st.bg} color={st.color}>{st.label}</Badge></td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: l.daysToExpiry < 0 ? '#C0392B' : l.daysToExpiry <= 60 ? '#B06000' : '#555' }}>{l.expiryDate}</div>
                    {l.daysToExpiry >= 0 && l.daysToExpiry <= 60 && <div style={{ fontSize: 10.5, color: '#B06000', fontWeight: 600 }}>还剩 {l.daysToExpiry}d</div>}
                    {l.daysToExpiry < 0 && <div style={{ fontSize: 10.5, color: '#C0392B', fontWeight: 600 }}>已过期</div>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {isVerifying
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0058BC' }}><Loader2 size={12} className="animate-spin" />验证中…</span>
                      : <span style={{ color: wasVerified ? '#1E8033' : vsColor, fontSize: 12, fontWeight: 600 }}>{wasVerified ? '已验证' : vsLabel}</span>
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
  const [activeTab, setActiveTab] = useState<'log' | 'rules'>('log')

  const blockCount = interceptLogs.filter(l => l.result === 'blocked').length
  const warnCount = interceptLogs.filter(l => l.result === 'warned').length
  const reviewCount = interceptLogs.filter(l => l.result === 'manual-review').length
  const passCount = interceptLogs.filter(l => l.result === 'passed').length

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
        {[
          { label: '拦截检查总数', value: interceptLogs.length, color: '#181C23' },
          { label: '已拦截', value: blockCount, color: '#C0392B' },
          { label: '已警告', value: warnCount, color: '#B06000' },
          { label: '人工审核', value: reviewCount, color: '#0058BC' },
          { label: '已通过', value: passCount, color: '#1E8033' },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {([['log', '拦截日志'], ['rules', '规则配置']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)} style={{ padding: '6px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: activeTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: activeTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: activeTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
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
                      <Badge bg={rs.bg} color={rs.color}>{rs.icon} {rs.label}</Badge>
                      <span style={{ fontSize: 11.5, color: '#A0A5B1', fontFamily: "'JetBrains Mono', monospace" }}>{log.timestamp}</span>
                      <span style={{ fontSize: 12, color: '#717786' }}>{log.channelName} · {log.insurerShort} · {log.state} {log.line}</span>
                    </div>
                    <div className="flex items-center gap-4 mb-2" style={{ fontSize: 12.5 }}>
                      <span style={{ color: '#717786' }}>保单草稿：</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{log.policyDraftId}</span>
                      <span style={{ color: '#717786' }}>客户：</span>
                      <span style={{ fontWeight: 600, color: '#181C23' }}>{log.customerName}</span>
                      <span style={{ color: '#717786' }}>保费：</span>
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
                        ? <Badge bg="rgba(52,199,89,0.12)" color="#1E8033">已放行</Badge>
                        : <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>人工审核</button>
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
            const actionStyle = rule.action === 'block' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: '拦截' } : rule.action === 'warn' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: '警告' } : { bg: 'rgba(0,88,188,0.1)', color: '#0058BC', label: '人工审核' }
            const catColors: Record<string, string> = { appointment: '#7B3FCA', license: '#0058BC', ofac: '#C0392B', channel: '#1E8033', product: '#B06000' }
            const catBg: Record<string, string> = { appointment: 'rgba(123,63,202,0.1)', license: 'rgba(0,88,188,0.1)', ofac: 'rgba(192,57,43,0.1)', channel: 'rgba(30,128,51,0.1)', product: 'rgba(176,96,0,0.1)' }
            return (
              <Card key={rule.id} style={{ padding: '14px 16px' }}>
                <div className="flex items-center justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-1">
                      <span style={{ fontSize: 11, fontWeight: 700, background: catBg[rule.category], color: catColors[rule.category], borderRadius: 5, padding: '2px 7px' }}>{rule.category.toUpperCase()}</span>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{rule.name}</span>
                      <Badge bg={actionStyle.bg} color={actionStyle.color}>{actionStyle.label}</Badge>
                      <span style={{ fontSize: 11, color: '#A0A5B1' }}>优先级 {rule.priority}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{rule.condition}</div>
                    <div style={{ fontSize: 11.5, color: '#A0A5B1' }}>触发次数：<span style={{ fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{rule.triggeredCount}</span> · 最近触发：{rule.lastTriggered || '—'}</div>
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>合规报告中心</div>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> 生成新报告
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>配置报告参数</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>报告类型</label>
              <select value={genType} onChange={e => setGenType(e.target.value)} className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                {Object.entries(REPORT_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>报告周期</label>
              <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                <option>2026年8月</option><option>2026年7月</option><option>2026-Q3</option><option>2026-Q2</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>输出格式</label>
              <div className="flex gap-2">
                {(['PDF', 'Excel', 'CSV'] as const).map(f => (
                  <button key={f} onClick={() => setGenFormat(f)} style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: genFormat === f ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: genFormat === f ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: genFormat === f ? '#0058BC' : '#717786', cursor: 'pointer' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setShowForm(false)}>取消</button>
            <button onClick={doGenerate} disabled={generating} style={{ padding: '7px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {generating ? <><Loader2 size={13} className="animate-spin" />生成中…</> : '开始生成'}
            </button>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {complianceReports.map(rp => {
          const statusS = rp.status === 'ready' ? { bg: 'rgba(52,199,89,0.12)', color: '#1E8033', label: '可下载' } : rp.status === 'generating' ? { bg: 'rgba(255,159,10,0.12)', color: '#B06000', label: '生成中' } : rp.status === 'scheduled' ? { bg: 'rgba(180,180,180,0.15)', color: '#666', label: '已计划' } : { bg: 'rgba(255,59,48,0.12)', color: '#C0392B', label: '生成失败' }
          return (
            <Card key={rp.id} style={{ padding: '14px 16px' }}>
              <div className="flex items-center justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-1">
                    <Badge bg="rgba(0,88,188,0.08)" color="#0058BC">{REPORT_TYPE_LABEL[rp.type]}</Badge>
                    <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{rp.name}</span>
                    <Badge bg={statusS.bg} color={statusS.color}>{statusS.label}</Badge>
                    <span style={{ fontSize: 11, color: '#A0A5B1', background: 'rgba(180,180,180,0.12)', padding: '1px 6px', borderRadius: 5 }}>{rp.format}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#717786' }}>
                    {rp.generatedDate ? <>生成时间：<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.generatedDate}</span> · 生成人：{rp.generatedBy}</> : <>计划生成 · 操作人：{rp.generatedBy}</>}
                    {rp.fileSize && <> · 大小：<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{rp.fileSize}</span></>}
                    {rp.recordCount && <> · 记录数：<span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{rp.recordCount}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {rp.status === 'ready' && (
                    <>
                      <button className="btn-ghost" style={{ padding: 6 }}><Eye size={14} /></button>
                      <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
                        <Download size={12} /> 下载
                      </button>
                    </>
                  )}
                  {rp.status === 'generating' && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#B06000' }}><Loader2 size={13} className="animate-spin" />生成中</span>}
                  {rp.status === 'scheduled' && <span style={{ fontSize: 12, color: '#A0A5B1' }}>等待执行</span>}
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
        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>OFAC 制裁名单实时筛查</div>
        <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>对客户、受益人、关联实体进行 SDN / SDGT / OFSI 等制裁名单检查</div>
        <div className="flex items-end gap-3">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>实体名称 *</label>
            <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="输入个人姓名或企业名称…" className="input-glass" style={{ width: '100%', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 6 }}>类型</label>
            <div className="flex gap-2">
              {(['Company', 'Individual'] as const).map(t => (
                <button key={t} onClick={() => setEntityType(t)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, border: entityType === t ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: entityType === t ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: entityType === t ? '#0058BC' : '#717786', cursor: 'pointer' }}>{t === 'Company' ? '企业' : '个人'}</button>
              ))}
            </div>
          </div>
          <button onClick={doScreen} disabled={!entityName || screening} style={{ padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: entityName && !screening ? '#0058BC' : 'rgba(0,88,188,0.3)', color: '#fff', border: 'none', cursor: entityName && !screening ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {screening ? <><Loader2 size={13} className="animate-spin" />筛查中…</> : <><Search size={13} />开始筛查</>}
          </button>
        </div>

        {screenResult && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: screenResult.result === 'clear' ? 'rgba(52,199,89,0.08)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.08)' : 'rgba(255,59,48,0.08)', border: `1px solid ${screenResult.result === 'clear' ? 'rgba(52,199,89,0.3)' : screenResult.result === 'watchlist' ? 'rgba(255,159,10,0.3)' : 'rgba(255,59,48,0.3)'}` }}>
            <div className="flex items-center gap-3">
              {screenResult.result === 'clear' ? <CheckCircle2 size={20} color="#1E8033" /> : screenResult.result === 'watchlist' ? <AlertTriangle size={20} color="#B06000" /> : <XOctagon size={20} color="#C0392B" />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: screenResult.result === 'clear' ? '#1E8033' : screenResult.result === 'watchlist' ? '#B06000' : '#C0392B' }}>
                  {screenResult.result === 'clear' ? '筛查通过 — 无制裁记录' : screenResult.result === 'watchlist' ? `疑似匹配 — 相似度 ${screenResult.score}%` : '筛查未通过 — 制裁名单命中'}
                </div>
                {screenResult.entry && <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>匹配条目：{screenResult.entry}</div>}
                {screenResult.result === 'watchlist' && <div style={{ fontSize: 12, color: '#B06000', marginTop: 4 }}>建议进行人工复核后方可出单</div>}
                {screenResult.result === 'blocked' && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 4 }}>已自动拦截，禁止为该实体出单</div>}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 18 }}>
        {[
          { label: '历史筛查总数', value: ofacScreenings.length, color: '#181C23' },
          { label: '清单无记录', value: clearCount, color: '#1E8033' },
          { label: '疑似匹配', value: watchCount, color: '#B06000' },
          { label: '已拦截', value: blockCount, color: '#C0392B' },
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
              {['时间戳', '实体名称', '类型', '结果', '匹配条目', '操作人', '处置'].map(h => (
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
                  <td style={{ padding: '10px 14px' }}><Badge bg={rs.bg} color={rs.color}>{rs.label}</Badge></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: s.matchedEntry ? '#B06000' : '#C1C6D7' }}>{s.matchedEntry || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{s.screenedBy}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {s.result === 'watchlist' && (
                      s.overrideApproved
                        ? <span style={{ fontSize: 11.5, color: '#1E8033', fontWeight: 600 }}>已放行</span>
                        : <button style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>人工审核</button>
                    )}
                    {s.result === 'blocked' && <span style={{ fontSize: 11.5, color: '#C0392B', fontWeight: 600 }}>已拦截</span>}
                    {s.result === 'clear' && <span style={{ fontSize: 11.5, color: '#1E8033' }}>通过</span>}
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
  { id: 'apply',     icon: <FileCheck size={15} />,   label: 'Appointment 申请' },
  { id: 'track',     icon: <Activity size={15} />,    label: '状态跟踪' },
  { id: 'renewal',   icon: <RefreshCw size={15} />,   label: '续期与终止' },
  { id: 'nipr',      icon: <ShieldCheck size={15} />, label: 'NIPR 牌照管理' },
  { id: 'intercept', icon: <Ban size={15} />,         label: '出单合规拦截' },
  { id: 'report',    icon: <FileText size={15} />,    label: '合规报告' },
  { id: 'ofac',      icon: <Search size={15} />,      label: 'OFAC 筛查' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function AppointmentView({ navigateTo: _navigateTo }: Props) {
  const [tab, setTab] = useState<TabId>('apply')

  const expiredLicenses = niprLicenses.filter(l => l.daysToExpiry < 0).length
  const pendingApps = appointmentRecords.filter(r => r.status === 'pending' || r.status === 'under-review').length
  const urgentRenewals = appointmentRecords.filter(r => r.daysToExpiry >= 0 && r.daysToExpiry <= 30 && r.status === 'approved').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>Appointment & 合规管理</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>管理渠道商 Appointment 申请、牌照核验、出单合规拦截及 OFAC 制裁筛查</p>
        </div>
        <div className="flex items-center gap-3">
          {expiredLicenses > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {expiredLicenses} 个牌照已过期
            </div>
          )}
          {urgentRenewals > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', fontSize: 12.5, fontWeight: 600, color: '#B06000' }}>
              <Bell size={13} /> {urgentRenewals} 个即将到期
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === t.id ? '#0058BC' : '#717786', border: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.icon}
            {t.label}
            {t.id === 'apply' && pendingApps > 0 && (
              <span style={{ background: '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{pendingApps}</span>
            )}
            {t.id === 'nipr' && expiredLicenses > 0 && (
              <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{expiredLicenses}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'apply' && <AppointmentApplicationTab />}
      {tab === 'track' && <StatusTrackingTab />}
      {tab === 'renewal' && <RenewalTerminationTab />}
      {tab === 'nipr' && <NIRPLicenseTab />}
      {tab === 'intercept' && <ComplianceInterceptionTab />}
      {tab === 'report' && <ComplianceReportTab />}
      {tab === 'ofac' && <OFACScreeningTab />}
    </div>
  )
}
