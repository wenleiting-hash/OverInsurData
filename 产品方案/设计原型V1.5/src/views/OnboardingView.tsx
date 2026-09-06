import { useState, useRef } from 'react'
import {
  UserPlus, FileText, Search, Shield, FileSignature, Key, GraduationCap,
  ChevronRight, Check, X, AlertTriangle, Clock, RefreshCw, Download,
  Eye, Upload, CheckCircle2, XCircle, Loader2, ArrowUpRight, Send,
  RotateCcw, User, Building2, ChevronDown, ExternalLink, Plus,
  ClipboardList, Settings, Mail, Lock, Unlock,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import {
  onboardingApps, documentReviews, niprVerifications, backgroundChecks,
  eoInsurances, eContracts, trainingCerts, accountSetups, onboardingStats,
  PIPELINE_STEPS, STATUS_STYLE, CHANNEL_TYPE_LABEL, REVIEW_RESULT_STYLE,
  type OnboardingApp, type OnboardingStatus,
} from '../data/onboardingData'

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>{children}</span>
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>{children}</div>
}
function fmt(n: number) { return '$' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString()) }

const STEP_STATUS_STYLE = {
  passed:      { bg: '#34C759', icon: <Check size={10} color="#fff" strokeWidth={3} /> },
  'in-progress': { bg: '#0058BC', icon: <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} /> },
  failed:      { bg: '#FF3B30', icon: <X size={10} color="#fff" strokeWidth={3} /> },
  pending:     { bg: '#C1C6D7', icon: null },
  waiting:     { bg: '#FF9F0A', icon: <Clock size={9} color="#fff" /> },
  waived:      { bg: '#A0A5B1', icon: <Check size={10} color="#fff" strokeWidth={3} /> },
}

// ── Pipeline Progress Bar ─────────────────────────────────────────────────────

function PipelineBar({ app }: { app: OnboardingApp }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {app.steps.map((step, i) => {
        const s = STEP_STATUS_STYLE[step.status]
        return (
          <div key={step.id} title={`${step.name}: ${step.status}`} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
              {s.icon}
            </div>
            {i < app.steps.length - 1 && <div style={{ width: 12, height: 2, background: step.status === 'passed' ? '#34C759' : '#E5E7EF', borderRadius: 1 }} />}
          </div>
        )
      })}
    </div>
  )
}

// ── Full Pipeline Steps ───────────────────────────────────────────────────────

function FullPipelineSteps({ app }: { app: OnboardingApp }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, background: 'rgba(193,198,215,0.4)', borderRadius: 1 }} />
      {app.steps.map((step, i) => {
        const s = STEP_STATUS_STYLE[step.status]
        return (
          <div key={step.id} style={{ display: 'flex', gap: 16, marginBottom: i < app.steps.length - 1 ? 14 : 0, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              {s.icon ?? <span style={{ fontSize: 10, color: '#717786', fontWeight: 700 }}>{i + 1}</span>}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{step.name}</span>
                {step.status === 'in-progress' && <Badge bg="rgba(0,88,188,0.1)" color="#0058BC">进行中</Badge>}
                {step.status === 'failed' && <Badge bg="rgba(255,59,48,0.1)" color="#C0392B">未通过</Badge>}
                {step.status === 'waived' && <Badge bg="rgba(180,180,180,0.15)" color="#717786">已豁免</Badge>}
              </div>
              {step.completedDate && <div style={{ fontSize: 11.5, color: '#A0A5B1', marginTop: 1 }}>完成于 {step.completedDate}</div>}
              {step.notes && <div style={{ marginTop: 4, fontSize: 12, color: '#717786', background: 'rgba(255,255,255,0.6)', borderRadius: 7, padding: '5px 9px', border: '0.5px solid rgba(193,198,215,0.35)' }}>{step.notes}</div>}
              {step.actionRequired && (
                <div style={{ marginTop: 5, fontSize: 12, color: '#C0392B', background: 'rgba(255,59,48,0.05)', borderRadius: 7, padding: '5px 9px', border: '1px solid rgba(255,59,48,0.2)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />{step.actionRequired}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── App Row ───────────────────────────────────────────────────────────────────

function AppRow({ app, selected, onClick }: { app: OnboardingApp; selected: boolean; onClick: () => void }) {
  const ss = STATUS_STYLE[app.status]
  return (
    <tr onClick={onClick} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: selected ? 'rgba(0,88,188,0.04)' : 'transparent', cursor: 'pointer', transition: 'background 0.1s' }}>
      <td style={{ padding: '12px 14px' }}>
        <div className="flex items-center gap-2">
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {app.applicantType === 'agent' ? <User size={15} color="#0058BC" /> : <Building2 size={15} color="#0058BC" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{app.applicantName}</div>
            <div style={{ fontSize: 11, color: '#717786' }}>{CHANNEL_TYPE_LABEL[app.applicantType]} · {app.state}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}><Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge></td>
      <td style={{ padding: '12px 14px' }}><PipelineBar app={app} /></td>
      <td style={{ padding: '12px 14px', fontSize: 12, color: '#717786' }}>{app.assignedReviewer ?? '—'}</td>
      <td style={{ padding: '12px 14px', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{app.submittedDate}</td>
      <td style={{ padding: '12px 14px' }}>
        {app.status === 'pending-supplement' && app.supplementDue && (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} />截止 {app.supplementDue}</span>
        )}
      </td>
    </tr>
  )
}

// ── Tab 1 — 申请总览 & 进度追踪 ──────────────────────────────────────────────

function ApplicationTab({ onSelectApp }: { onSelectApp: (app: OnboardingApp) => void }) {
  const [selected, setSelected] = useState<OnboardingApp | null>(null)
  const [statusFilter, setStatusFilter] = useState<OnboardingStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formStep, setFormStep] = useState(1)

  const filtered = onboardingApps.filter(a =>
    (statusFilter === 'all' || a.status === statusFilter) &&
    (!search || a.applicantName.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))
  )

  const quickStats = [
    { label: '总申请', value: onboardingStats.total, color: '#0058BC' },
    { label: '进行中', value: onboardingStats.pending, color: '#B06000' },
    { label: '已入驻', value: onboardingStats.approved, color: '#1E8033' },
    { label: '待补充', value: onboardingStats.pendingSupplement, color: '#C0392B' },
    { label: '平均天数', value: onboardingStats.avgDays + 'd', color: '#7B3FCA' },
  ]

  const handleSelect = (app: OnboardingApp) => {
    setSelected(app)
    onSelectApp(app)
  }

  const WIZARD_STEPS = ['基本信息', '资质材料', '渠道归属', '确认提交']

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 18 }}>
      <div>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 18 }}>
          {quickStats.map(s => (
            <Card key={s.label} style={{ padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索申请人姓名或邮箱…" className="input-glass" style={{ paddingLeft: 30, width: '100%', fontSize: 12.5 }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as OnboardingStatus | 'all')} className="input-glass" style={{ fontSize: 12.5, minWidth: 130 }}>
            <option value="all">全部状态</option>
            {Object.entries(STATUS_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={14} />新增申请
          </button>
        </div>

        {/* Table */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
                {['申请人', '状态', '流程进度', '审核人', '提交日期', '截止'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => (
                <AppRow key={app.id} app={app} selected={selected?.id === app.id} onClick={() => handleSelect(app)} />
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Side detail panel */}
      {selected && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card style={{ padding: '16px 18px' }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.applicantType === 'agent' ? <User size={17} color="#0058BC" /> : <Building2 size={17} color="#0058BC" />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#181C23' }}>{selected.applicantName}</div>
                  <div style={{ fontSize: 11.5, color: '#717786' }}>{CHANNEL_TYPE_LABEL[selected.applicantType]} · {selected.state}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost" style={{ padding: 5 }}><X size={14} /></button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge bg={STATUS_STYLE[selected.status].bg} color={STATUS_STYLE[selected.status].color}>{STATUS_STYLE[selected.status].label}</Badge>
              {selected.npn && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#717786' }}>NPN {selected.npn}</span>}
            </div>

            <div className="flex flex-col gap-1" style={{ fontSize: 12, marginBottom: 10 }}>
              {[
                ['邮箱', selected.email],
                ['电话', selected.phone],
                ['归属渠道', selected.parentChannelName ?? '—'],
                ['审核人', selected.assignedReviewer ?? '—'],
                ['提交日期', selected.submittedDate],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between" style={{ padding: '4px 0', borderBottom: '0.5px solid rgba(193,198,215,0.2)' }}>
                  <span style={{ color: '#717786' }}>{k}</span>
                  <span style={{ fontWeight: 600, color: '#181C23' }}>{v}</span>
                </div>
              ))}
            </div>

            {selected.status === 'pending-supplement' && selected.rejectionReason && (
              <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', fontSize: 12, color: '#7A2020', marginBottom: 8 }}>
                <div className="flex items-center gap-1.5" style={{ fontWeight: 700, marginBottom: 3 }}><AlertTriangle size={12} />需要补充材料</div>
                {selected.rejectionReason}
                {selected.supplementDue && <div style={{ marginTop: 4, fontWeight: 700 }}>截止日期：{selected.supplementDue}</div>}
              </div>
            )}
            {selected.status === 'rejected' && selected.rejectionReason && (
              <div style={{ padding: '10px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', fontSize: 12, color: '#7A2020' }}>
                <div className="flex items-center gap-1.5" style={{ fontWeight: 700, marginBottom: 3 }}><XCircle size={12} />驳回原因</div>
                {selected.rejectionReason}
              </div>
            )}
          </Card>

          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#A0A5B1', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' as const }}>流程进度</div>
            <FullPipelineSteps app={selected} />
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {selected.status === 'pending-supplement' && (
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Upload size={13} />上传补充材料
              </button>
            )}
            {['submitted', 'under-review'].includes(selected.status) && (
              <div className="flex gap-2">
                <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: '#1E8033', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  <Check size={12} />通过资料审核
                </button>
                <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>
                  <X size={12} />驳回补充
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New application wizard */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 20, width: 580, padding: '28px 32px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>新增入驻申请</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => { setShowForm(false); setFormStep(1) }}><X size={16} /></button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1 mb-6">
              {WIZARD_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1" style={{ flex: i < WIZARD_STEPS.length - 1 ? 1 : undefined }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: i + 1 <= formStep ? '#0058BC' : 'rgba(193,198,215,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1 < formStep ? <Check size={10} color="#fff" strokeWidth={3} /> : <span style={{ fontSize: 10.5, fontWeight: 700, color: i + 1 <= formStep ? '#fff' : '#A0A5B1' }}>{i + 1}</span>}
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: i + 1 === formStep ? 700 : 500, color: i + 1 <= formStep ? '#0058BC' : '#A0A5B1', whiteSpace: 'nowrap' }}>{s}</span>
                  </div>
                  {i < WIZARD_STEPS.length - 1 && <div style={{ flex: 1, height: 1.5, background: i + 1 < formStep ? '#0058BC' : 'rgba(193,198,215,0.4)', margin: '0 4px', borderRadius: 1 }} />}
                </div>
              ))}
            </div>

            {/* Form steps */}
            {formStep === 1 && (
              <div className="flex flex-col gap-4">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>渠道类型 *</label>
                    <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                      {Object.entries(CHANNEL_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>主营州 *</label>
                    <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                      {['CA', 'TX', 'NY', 'FL', 'IL', 'WA', 'OR', 'CO', 'GA', 'OH'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                {[
                  { label: '姓名 / 机构名称 *', placeholder: '申请人全名或注册机构名' },
                  { label: '邮箱 *', placeholder: 'name@company.com' },
                  { label: '电话 *', placeholder: '+1-xxx-xxx-xxxx' },
                  { label: 'NPN 编号', placeholder: '可选，将通过 NIPR 验证' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                  </div>
                ))}
              </div>
            )}

            {formStep === 2 && (
              <div className="flex flex-col gap-3">
                <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 4 }}>请上传以下入驻所需材料：</div>
                {['保险执照（License）', 'E&O 保险证书', '背景调查授权书（Consent Form）', '政府颁发身份证件', 'W-9 税务表格'].map(doc => (
                  <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, border: '1px dashed rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.4)', gap: 8 }}>
                    <div className="flex items-center gap-2">
                      <FileText size={14} color="#717786" />
                      <span style={{ fontSize: 13, color: '#181C23' }}>{doc}</span>
                    </div>
                    <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Upload size={11} />上传
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formStep === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>上级渠道（Parent Channel）*</label>
                  <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                    <option value="">请选择上级渠道…</option>
                    <option>Pacific Coast Insurance Group</option>
                    <option>Lone Star Brokerage</option>
                    <option>Empire State Insurance Services</option>
                    <option>Great Lakes Insurance Partners</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>分配审核人</label>
                  <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                    <option>Zhang Wei</option>
                    <option>Sarah Chen</option>
                    <option>Marcus Lee</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>合同模板</label>
                  <select className="input-glass" style={{ width: '100%', fontSize: 13 }}>
                    <option>Producer Agreement v3.2-2026</option>
                    <option>GA Agreement v2.8-2026</option>
                    <option>Sub-Producer Agreement v1.5-2026</option>
                  </select>
                </div>
              </div>
            )}

            {formStep === 4 && (
              <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5 }}>
                <div style={{ fontWeight: 700, color: '#0058BC', marginBottom: 8 }}>提交确认</div>
                <div className="flex flex-col gap-2">
                  {[
                    ['渠道类型', '个人代理 (Agent)'],
                    ['申请人', '（填写的姓名）'],
                    ['主营州', 'CA'],
                    ['上级渠道', 'Pacific Coast Insurance Group'],
                    ['合同模板', 'Producer Agreement v3.2-2026'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between" style={{ padding: '4px 0', borderBottom: '0.5px solid rgba(193,198,215,0.25)' }}>
                      <span style={{ color: '#717786' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#181C23' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 12, color: '#1E5A26' }}>
                  提交后系统将自动发送入驻邀请邮件，启动 10 步入驻流程并通知分配审核人。
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              {formStep > 1 ? (
                <button className="btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setFormStep(f => f - 1)}>上一步</button>
              ) : <div />}
              {formStep < 4 ? (
                <button style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => setFormStep(f => f + 1)}>下一步</button>
              ) : (
                <button style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#1E8033', color: '#fff', border: 'none', cursor: 'pointer' }} onClick={() => { setShowForm(false); setFormStep(1) }}>
                  <span className="flex items-center gap-1.5"><Send size={13} />提交申请</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 2 — 资料审核 ────────────────────────────────────────────────────────────

function DocReviewTab() {
  const [selectedAppId, setSelectedAppId] = useState('ob-003')
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const review = documentReviews.find(r => r.appId === selectedAppId)
  const app = onboardingApps.find(a => a.id === selectedAppId)

  const DOC_TYPE_LABEL: Record<string, string> = {
    license: '保险执照', 'eo-cert': 'E&O证书', 'bg-auth': '背景调查授权', id: '身份证件', w9: 'W-9表格', contract: '合同文件', training: '培训证书', other: '其他',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
      {/* App selector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#A0A5B1', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>选择申请</div>
        <div className="flex flex-col gap-2">
          {onboardingApps.filter(a => !['approved', 'rejected', 'draft'].includes(a.status)).map(a => {
            const ss = STATUS_STYLE[a.status]
            return (
              <div key={a.id} onClick={() => setSelectedAppId(a.id)} style={{ padding: '10px 12px', borderRadius: 10, border: selectedAppId === a.id ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.3)', background: selectedAppId === a.id ? 'rgba(0,88,188,0.05)' : 'rgba(255,255,255,0.45)', cursor: 'pointer' }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: '#181C23', marginBottom: 3 }}>{a.applicantName}</div>
                <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review panel */}
      <div>
        {app && (
          <>
            <Card style={{ padding: '14px 16px', marginBottom: 14 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#181C23' }}>{app.applicantName}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{CHANNEL_TYPE_LABEL[app.applicantType]} · {app.state} · {app.email}</div>
                </div>
                <div className="flex gap-2">
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#1E8033', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    <Check size={12} />资料审核通过
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>
                    <AlertTriangle size={12} />要求补充
                  </button>
                </div>
              </div>
            </Card>

            {review ? (
              <div className="flex flex-col gap-3">
                {review.docs.map(doc => {
                  const rs = REVIEW_RESULT_STYLE[doc.status]
                  return (
                    <Card key={doc.id} style={{ padding: '14px 16px', border: doc.status === 'fail' ? '1.5px solid rgba(255,59,48,0.3)' : '1px solid rgba(193,198,215,0.3)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0,88,188,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={17} color="#0058BC" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{doc.name}</span>
                              <Badge bg={`rgba(0,88,188,0.08)`} color="#4A6A9C">{DOC_TYPE_LABEL[doc.docType]}</Badge>
                            </div>
                            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                              {doc.uploadedDate} · {doc.fileSize}
                              {doc.expiryDate && <span style={{ marginLeft: 8, color: new Date(doc.expiryDate) < new Date() ? '#C0392B' : '#717786', fontWeight: 600 }}>有效期至 {doc.expiryDate}</span>}
                            </div>
                            {doc.reviewNote && (
                              <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 7, background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)', fontSize: 12, color: '#7A2020', display: 'flex', gap: 5 }}>
                                <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} />{doc.reviewNote}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge bg={rs.bg} color={rs.color}>{rs.label}</Badge>
                          <button className="btn-ghost" style={{ padding: 5 }} title="预览"><Eye size={13} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title="下载"><Download size={13} /></button>
                          {doc.status === 'fail' && (
                            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Upload size={11} />补充上传
                            </button>
                          )}
                          {doc.status === 'pending' && (
                            <div className="flex gap-1">
                              <button style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: 'rgba(52,199,89,0.1)', color: '#1E8033', border: '1px solid rgba(52,199,89,0.3)', cursor: 'pointer' }}>通过</button>
                              <button style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: 'rgba(255,59,48,0.08)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.2)', cursor: 'pointer' }}>退回</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} />
              </div>
            ) : (
              <Card style={{ textAlign: 'center', color: '#A0A5B1', padding: '40px 20px' }}>
                <ClipboardList size={28} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>暂无文件记录</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>该申请人尚未上传入驻材料</div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Tab 3 — 合规验证（NIPR + 背景 + E&O）────────────────────────────────────────

function ComplianceVerificationTab() {
  const [subTab, setSubTab] = useState<'nipr' | 'bg' | 'eo'>('nipr')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<string | null>(null)

  const triggerVerify = (id: string) => {
    setVerifying(id)
    setTimeout(() => { setVerifying(null); setVerifyResult(id) }, 1800)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {([['nipr', 'NIPR 牌照验证'], ['bg', '背景调查'], ['eo', 'E&O 保险验证']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: subTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: subTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: subTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'nipr' && (
        <div className="flex flex-col gap-4">
          <Card style={{ padding: '14px 16px', background: 'rgba(0,88,188,0.03)' }}>
            <div style={{ fontSize: 12.5, color: '#4A6A9C', marginBottom: 10, fontWeight: 600 }}>NIPR 实时验证</div>
            <div className="flex gap-3">
              <input placeholder="输入 NPN 编号…" className="input-glass" style={{ flex: 1, fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }} />
              <select className="input-glass" style={{ fontSize: 13, minWidth: 80 }}>
                {['CA','TX','NY','FL','IL','WA','GA','CO'].map(s => <option key={s}>{s}</option>)}
              </select>
              <button onClick={() => triggerVerify('manual')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {verifying === 'manual' ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} NIPR 查询
              </button>
            </div>
            {verifyResult === 'manual' && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 9, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.2)' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 6 }}><CheckCircle2 size={14} color="#1E8033" /><span style={{ fontWeight: 700, color: '#1E8033', fontSize: 13 }}>NIPR 验证通过</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  {[['执照号', 'CA-0M12345'],['执照类型', 'Life, Accident & Health'],['颁发日期', '2019-03-15'],['到期日期', '2027-06-30'],['状态', 'Active'],['授权险种', 'Life, A&H, P&C']].map(([k,v]) => (
                    <div key={k} className="flex justify-between" style={{ padding: '3px 0', borderBottom: '0.5px solid rgba(193,198,215,0.2)' }}>
                      <span style={{ color: '#717786' }}>{k}</span>
                      <span style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#181C23', fontSize: 11.5 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 4 }}>申请人验证记录</div>
          <div className="flex flex-col gap-3">
            {niprVerifications.map(nv => {
              const rs = REVIEW_RESULT_STYLE[nv.status]
              const app = onboardingApps.find(a => a.id === nv.appId)
              return (
                <Card key={nv.appId} style={{ padding: '14px 16px' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontWeight: 700, fontSize: 13.5, color: '#181C23' }}>{nv.applicantName}</span>
                        <Badge bg={rs.bg} color={rs.color}>{rs.label}</Badge>
                        {app && <Badge bg={STATUS_STYLE[app.status].bg} color={STATUS_STYLE[app.status].color}>{STATUS_STYLE[app.status].label}</Badge>}
                      </div>
                      <div className="flex items-center gap-4" style={{ fontSize: 12, color: '#717786' }}>
                        <span>NPN: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23' }}>{nv.npn}</strong></span>
                        <span>州: <strong style={{ color: '#181C23' }}>{nv.state}</strong></span>
                        {nv.licenseNumber && <span>执照号: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23' }}>{nv.licenseNumber}</strong></span>}
                      </div>
                      {(nv.linesOfAuthority ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(nv.linesOfAuthority ?? []).map(l => <span key={l} style={{ fontSize: 11, background: 'rgba(0,88,188,0.07)', color: '#0058BC', borderRadius: 5, padding: '1px 6px', fontWeight: 600 }}>{l}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {nv.expiryDate && <span style={{ fontSize: 11, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>到期 {nv.expiryDate}</span>}
                      {nv.status === 'pending' && (
                        <button onClick={() => triggerVerify(nv.appId)} disabled={verifying === nv.appId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: verifying === nv.appId ? 'not-allowed' : 'pointer' }}>
                          {verifying === nv.appId ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                          {verifying === nv.appId ? '验证中…' : '发起验证'}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {subTab === 'bg' && (
        <div className="flex flex-col gap-4">
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(123,63,202,0.05)', border: '1px solid rgba(123,63,202,0.15)', fontSize: 12.5, color: '#4A2E7A' }}>
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><Shield size={13} />背景调查服务商</div>
            当前集成：Checkr（主要）、Sterling（备用）。调查范围包括：刑事记录、监管记录、雇佣历史、信用报告（需申请人书面授权）。
          </div>

          <div className="flex flex-col gap-3">
            {backgroundChecks.map(bc => {
              const rs = REVIEW_RESULT_STYLE[bc.status]
              return (
                <Card key={bc.appId} style={{ padding: '14px 16px', border: bc.flags.length > 0 ? `1.5px solid rgba(255,59,48,0.3)` : '1px solid rgba(193,198,215,0.3)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{bc.applicantName}</span>
                        <Badge bg={rs.bg} color={rs.color}>{rs.label}</Badge>
                        <Badge bg="rgba(123,63,202,0.1)" color="#7B3FCA">{bc.vendor}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1" style={{ fontSize: 12, color: '#717786' }}>
                        <span>下单日期：{bc.orderedDate}</span>
                        {bc.completedDate && <span>完成日期：{bc.completedDate}</span>}
                        {!bc.completedDate && <span className="flex items-center gap-1" style={{ color: '#B06000' }}><Clock size={11} />进行中</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {bc.status === 'pending' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, background: 'rgba(255,159,10,0.1)', fontSize: 12, color: '#B06000' }}>
                          <Loader2 size={11} className="animate-spin" />预计 1–2 个工作日
                        </div>
                      )}
                      {bc.reportUrl && <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }}><ExternalLink size={12} /></button>}
                    </div>
                  </div>

                  {bc.flags.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2">
                      {bc.flags.map((f, i) => {
                        const sev = f.severity === 'high' ? { bg: 'rgba(255,59,48,0.1)', color: '#C0392B', label: '高风险' } : f.severity === 'medium' ? { bg: 'rgba(255,159,10,0.1)', color: '#B06000', label: '中风险' } : { bg: 'rgba(180,180,180,0.15)', color: '#717786', label: '低风险' }
                        return (
                          <div key={i} style={{ padding: '10px 12px', borderRadius: 9, background: sev.bg, border: `1px solid ${sev.color}20` }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Badge bg={sev.bg} color={sev.color}>{sev.label}</Badge>
                                <span style={{ fontSize: 12, fontWeight: 700, color: sev.color }}>{f.type.toUpperCase()}</span>
                              </div>
                              <Badge bg={f.disposition === 'disqualify' ? 'rgba(255,59,48,0.12)' : 'rgba(255,159,10,0.12)'} color={f.disposition === 'disqualify' ? '#C0392B' : '#B06000'}>
                                {f.disposition === 'disqualify' ? '不予准入' : f.disposition === 'review' ? '需复核' : '无影响'}
                              </Badge>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#181C23' }}>{f.description}</div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {bc.flags.length === 0 && bc.status === 'pass' && (
                    <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.2)', fontSize: 12, color: '#1E5A26', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <CheckCircle2 size={12} />无违规记录，背景调查通过
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {subTab === 'eo' && (
        <div className="flex flex-col gap-4">
          <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)', fontSize: 12.5, color: '#3A5A8C' }}>
            <div className="flex items-center gap-1.5" style={{ fontWeight: 600, marginBottom: 2 }}><Shield size={13} />E&O 保险要求</div>
            个人代理最低限额：$500,000 per occurrence / $1,000,000 aggregate；机构代理最低限额：$1,000,000 per occurrence / $2,000,000 aggregate。E&O证书须注明 InsureOS 为附加被保险人（Additional Insured）。
          </div>

          <div className="flex flex-col gap-3">
            {eoInsurances.map(eo => {
              const rs = REVIEW_RESULT_STYLE[eo.status]
              const isExpired = new Date(eo.expiryDate) < new Date()
              return (
                <Card key={eo.appId} style={{ padding: '14px 16px', border: eo.status === 'fail' ? '1.5px solid rgba(255,59,48,0.3)' : '1px solid rgba(193,198,215,0.3)' }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{eo.applicantName}</span>
                        <Badge bg={rs.bg} color={rs.color}>{rs.label}</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>
                        {eo.carrier} · 保单号 <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23', fontWeight: 600 }}>{eo.policyNumber}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, fontSize: 12 }}>
                        <div><span style={{ color: '#717786' }}>承保金额（per claim）：</span><strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23' }}>{fmt(eo.perClaimAmount)}</strong></div>
                        <div><span style={{ color: '#717786' }}>总承保限额：</span><strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23' }}>{fmt(eo.coverageAmount)}</strong></div>
                        <div><span style={{ color: '#717786' }}>生效日期：</span><strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{eo.effectiveDate}</strong></div>
                        <div><span style={{ color: '#717786' }}>到期日期：</span><strong style={{ fontFamily: "'JetBrains Mono', monospace", color: isExpired ? '#C0392B' : '#555' }}>{eo.expiryDate}{isExpired ? ' ⚠ 已过期' : ''}</strong></div>
                      </div>
                      {eo.note && <div style={{ marginTop: 6, fontSize: 12, color: '#C0392B' }}>{eo.note}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {eo.verifiedDate && <span style={{ fontSize: 11, color: '#A0A5B1' }}>验证于 {eo.verifiedDate}</span>}
                      {eo.status === 'fail' && (
                        <button style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.1)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>重新验证</button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Tab 4 — 合同签署 ────────────────────────────────────────────────────────────

function ContractTab() {
  const [sending, setSending] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  const doSend = (id: string) => {
    setSending(id)
    setTimeout(() => { setSending(null); setSent(prev => new Set(prev).add(id)) }, 1500)
  }

  const statusStyle: Record<string, { label: string; bg: string; color: string }> = {
    'not-sent': { label: '未发送', bg: 'rgba(180,180,180,0.15)', color: '#717786' },
    sent:       { label: '已发送', bg: 'rgba(0,88,188,0.1)',    color: '#0058BC' },
    viewed:     { label: '已查看', bg: 'rgba(255,159,10,0.1)',  color: '#B06000' },
    signed:     { label: '已签署', bg: 'rgba(52,199,89,0.1)',   color: '#1E8033' },
    expired:    { label: '已过期', bg: 'rgba(255,59,48,0.1)',   color: '#C0392B' },
    declined:   { label: '已拒绝', bg: 'rgba(255,59,48,0.1)',   color: '#C0392B' },
  }

  const contractTypeLabel: Record<string, string> = {
    'producer-agreement': '代理人协议', 'ga-agreement': 'GA协议',
    'sub-producer': '子代理协议', 'branch-appointment': '分支机构委任书',
  }

  const allContracts = [
    ...eContracts,
    { appId: 'ob-005', applicantName: 'Priya Nair', contractType: 'producer-agreement' as const, templateVersion: 'v3.2-2026', sentDate: undefined, signedDate: undefined, status: 'not-sent' as const, signerEmail: 'priya.nair@email.com', signingProvider: 'DocuSign' as const },
  ]

  const templates = [
    { id: 'pa-v32', name: 'Producer Agreement', version: 'v3.2-2026', type: 'producer-agreement', lastUpdated: '2026-07-01' },
    { id: 'ga-v28', name: 'GA Agreement', version: 'v2.8-2026', type: 'ga-agreement', lastUpdated: '2026-04-15' },
    { id: 'sp-v15', name: 'Sub-Producer Agreement', version: 'v1.5-2026', type: 'sub-producer', lastUpdated: '2026-01-20' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>电子合同状态</div>
        <div className="flex flex-col gap-3">
          {allContracts.map(c => {
            const localStatus = sent.has(c.appId) ? 'sent' : c.status
            const ss = statusStyle[localStatus]
            return (
              <Card key={c.appId} style={{ padding: '16px 18px' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{c.applicantName}</span>
                      <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                      <Badge bg="rgba(0,88,188,0.07)" color="#4A6A9C">{contractTypeLabel[c.contractType]}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786' }}>
                      模板版本：{c.templateVersion} · 签署平台：{c.signingProvider}
                    </div>
                    <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                      邮件地址：{c.signerEmail}
                    </div>

                    {c.status === 'viewed' && c.expiresAt && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#B06000', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />申请人已查看合同，等待签署 · 截止日期 {c.expiresAt}
                      </div>
                    )}
                    {c.status === 'signed' && c.signedDate && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#1E8033', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle2 size={11} />已于 {c.signedDate} 完成电子签署
                      </div>
                    )}
                    {(localStatus === 'sent') && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#0058BC', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Send size={11} />已发送签署链接至 {c.signerEmail}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {['not-sent'].includes(localStatus) && (
                      <button onClick={() => doSend(c.appId)} disabled={sending === c.appId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {sending === c.appId ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        {sending === c.appId ? '发送中…' : '发送合同'}
                      </button>
                    )}
                    {localStatus === 'sent' && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><RotateCcw size={11} />重新发送</button>
                    )}
                    {localStatus === 'viewed' && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Send size={11} />催签</button>
                    )}
                    {['signed'].includes(localStatus) && (
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} />下载合同</button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Template side panel */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>合同模板库</div>
        <div className="flex flex-col gap-3">
          {templates.map(t => (
            <Card key={t.id} style={{ padding: '12px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#181C23', marginBottom: 3 }}>{t.name}</div>
              <div style={{ fontSize: 11.5, color: '#717786' }}>版本：{t.version}</div>
              <div style={{ fontSize: 11, color: '#A0A5B1', marginTop: 2 }}>最后更新：{t.lastUpdated}</div>
              <div className="flex gap-2 mt-3">
                <button className="btn-ghost" style={{ flex: 1, padding: '5px 8px', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Eye size={11} />预览</button>
                <button className="btn-ghost" style={{ flex: 1, padding: '5px 8px', fontSize: 11.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}><Download size={11} />下载</button>
              </div>
            </Card>
          ))}
          <button className="btn-ghost" style={{ padding: '8px', fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <Plus size={13} />上传新模板
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab 5 — 账号开通 & 培训认证 ───────────────────────────────────────────────

function AccountTrainingTab() {
  const [subTab, setSubTab] = useState<'account' | 'training'>('account')
  const [activating, setActivating] = useState<string | null>(null)
  const [sendingPwd, setSendingPwd] = useState<string | null>(null)

  const doActivate = (id: string) => {
    setActivating(id)
    setTimeout(() => setActivating(null), 1600)
  }

  const doSendPwd = (id: string) => {
    setSendingPwd(id)
    setTimeout(() => setSendingPwd(null), 1200)
  }

  const accountStatusStyle: Record<string, { label: string; bg: string; color: string }> = {
    'not-started': { label: '未创建', bg: 'rgba(180,180,180,0.15)', color: '#717786' },
    creating:      { label: '创建中', bg: 'rgba(255,159,10,0.1)',   color: '#B06000' },
    active:        { label: '已激活', bg: 'rgba(52,199,89,0.1)',    color: '#1E8033' },
    hold:          { label: '已冻结', bg: 'rgba(255,59,48,0.1)',    color: '#C0392B' },
  }

  const trainingStatusStyle = {
    'not-started':  { label: '未开始',   bg: 'rgba(180,180,180,0.15)', color: '#717786' },
    'in-progress':  { label: '学习中',   bg: 'rgba(255,159,10,0.1)',   color: '#B06000' },
    completed:      { label: '已完成',   bg: 'rgba(52,199,89,0.1)',    color: '#1E8033' },
    failed:         { label: '未通过',   bg: 'rgba(255,59,48,0.1)',    color: '#C0392B' },
  }

  const allAccounts = [
    ...accountSetups,
    { appId: 'ob-004', applicantName: 'SunBelt Insurance Group', username: undefined, email: 'contact@sunbelt.com', role: 'Agency Admin', permissions: [], status: 'not-started' as const, createdDate: undefined, activatedDate: undefined, tempPasswordSent: false },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {([['account', '系统账号开通'], ['training', '培训认证']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setSubTab(v)} style={{ padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: subTab === v ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: subTab === v ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: subTab === v ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {subTab === 'account' && (
        <div className="flex flex-col gap-4">
          {allAccounts.map(acc => {
            const ss = accountStatusStyle[acc.status]
            return (
              <Card key={acc.appId} style={{ padding: '16px 18px' }}>
                <div className="flex items-start justify-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{acc.applicantName}</span>
                      <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                      <Badge bg="rgba(0,88,188,0.08)" color="#4A6A9C">{acc.role}</Badge>
                    </div>

                    {acc.username ? (
                      <div className="flex items-center gap-4 mb-2" style={{ fontSize: 12 }}>
                        <span style={{ color: '#717786' }}>用户名：<strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#181C23' }}>{acc.username}</strong></span>
                        <span style={{ color: '#717786' }}>邮箱：<strong style={{ color: '#181C23' }}>{acc.email}</strong></span>
                        {acc.activatedDate && <span style={{ color: '#717786' }}>激活于：<strong style={{ color: '#1E8033' }}>{acc.activatedDate}</strong></span>}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 8 }}>邮箱：{acc.email}</div>
                    )}

                    {acc.permissions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {acc.permissions.map(p => (
                          <span key={p} style={{ fontSize: 11, background: 'rgba(0,88,188,0.07)', color: '#0058BC', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>{p}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {acc.status === 'not-started' && (
                      <button onClick={() => doActivate(acc.appId)} disabled={activating === acc.appId} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                        {activating === acc.appId ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
                        {activating === acc.appId ? '创建中…' : '创建账号'}
                      </button>
                    )}
                    {acc.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => doSendPwd(acc.appId)} disabled={sendingPwd === acc.appId} className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {sendingPwd === acc.appId ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                          {acc.tempPasswordSent ? '重发密码' : '发送临时密码'}
                        </button>
                        <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Settings size={11} />权限管理</button>
                        <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11} />冻结</button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {subTab === 'training' && (
        <div className="flex flex-col gap-4">
          {trainingCerts.map(cert => {
            const completedCount = cert.modules.filter(m => m.status === 'completed').length
            const requiredTotal = cert.modules.filter(m => m.required).length
            const requiredDone = cert.modules.filter(m => m.required && m.status === 'completed').length
            const avgScore = cert.modules.filter(m => m.score !== undefined).reduce((s, m) => s + (m.score ?? 0), 0) / Math.max(1, cert.modules.filter(m => m.score !== undefined).length)
            const rrs = REVIEW_RESULT_STYLE[cert.overallStatus]

            return (
              <Card key={cert.appId} style={{ padding: '16px 18px' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{cert.applicantName}</span>
                      <Badge bg={rrs.bg} color={rrs.color}>{rrs.label}</Badge>
                    </div>
                    <div style={{ fontSize: 12, color: '#717786' }}>
                      必修完成：{requiredDone}/{requiredTotal} · 全部完成：{completedCount}/{cert.modules.length}
                      {cert.overallStatus === 'pass' && cert.completionDate && <span style={{ marginLeft: 8, color: '#1E8033', fontWeight: 600 }}>认证完成于 {cert.completionDate}</span>}
                      {avgScore > 0 && <span style={{ marginLeft: 8 }}>平均分：<strong style={{ fontFamily: "'JetBrains Mono', monospace", color: avgScore >= 90 ? '#1E8033' : avgScore >= 80 ? '#B06000' : '#C0392B' }}>{avgScore.toFixed(0)}</strong></span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {cert.certUrl && <button className="btn-ghost" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Download size={11} />证书下载</button>}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, fontSize: 11.5, color: '#717786' }}>
                    <span>培训进度</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{Math.round((completedCount / cert.modules.length) * 100)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                    <div style={{ width: `${(completedCount / cert.modules.length) * 100}%`, height: '100%', background: cert.overallStatus === 'pass' ? '#34C759' : '#0058BC', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>

                {/* Module table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
                      {['课程名称', '时长', '必修', '状态', '得分', '完成日期'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#A0A5B1' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cert.modules.map((m, i) => {
                      const ts = trainingStatusStyle[m.status]
                      return (
                        <tr key={m.id} style={{ borderBottom: i < cert.modules.length - 1 ? '0.5px solid rgba(193,198,215,0.2)' : 'none' }}>
                          <td style={{ padding: '8px 8px', fontWeight: 600, color: '#181C23' }}>
                            <div className="flex items-center gap-1.5">{m.name}</div>
                          </td>
                          <td style={{ padding: '8px 8px', color: '#717786' }}>{m.duration}</td>
                          <td style={{ padding: '8px 8px' }}>
                            {m.required ? <span style={{ color: '#C0392B', fontWeight: 700, fontSize: 12 }}>必修</span> : <span style={{ color: '#A0A5B1', fontSize: 12 }}>选修</span>}
                          </td>
                          <td style={{ padding: '8px 8px' }}><Badge bg={ts.bg} color={ts.color}>{ts.label}</Badge></td>
                          <td style={{ padding: '8px 8px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: m.score ? (m.score >= 90 ? '#1E8033' : m.score >= 80 ? '#B06000' : '#C0392B') : '#A0A5B1', fontSize: 12.5 }}>
                            {m.score !== undefined ? m.score : '—'}
                          </td>
                          <td style={{ padding: '8px 8px', fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", color: '#A0A5B1' }}>{m.completedDate ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab 6 — 驳回与补充 ────────────────────────────────────────────────────────

function RejectionSupplementTab() {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectType, setRejectType] = useState('pending-supplement')

  const actionableApps = onboardingApps.filter(a =>
    ['submitted', 'under-review', 'nipr-pending', 'bg-check', 'eo-pending', 'pending-supplement', 'rejected'].includes(a.status)
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: '待补充申请', value: onboardingApps.filter(a => a.status === 'pending-supplement').length, color: '#C0392B', desc: '需在截止日期前补充材料' },
          { label: '已驳回申请', value: onboardingApps.filter(a => a.status === 'rejected').length, color: '#717786', desc: '因不符合准入标准已驳回' },
        ].map(s => (
          <Card key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{s.desc}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {actionableApps.map(app => {
          const ss = STATUS_STYLE[app.status]
          const isRejected = app.status === 'rejected'
          const isPendingSupplement = app.status === 'pending-supplement'
          const isInReview = ['submitted', 'under-review', 'nipr-pending', 'bg-check', 'eo-pending'].includes(app.status)

          return (
            <Card key={app.id} style={{ padding: '16px 18px', border: isPendingSupplement ? '1.5px solid rgba(255,59,48,0.25)' : isRejected ? '1.5px solid rgba(180,180,180,0.3)' : '1px solid rgba(193,198,215,0.3)' }}>
              <div className="flex items-start justify-between">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,88,188,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {app.applicantType === 'agent' ? <User size={15} color="#0058BC" /> : <Building2 size={15} color="#0058BC" />}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#181C23' }}>{app.applicantName}</span>
                    <Badge bg={ss.bg} color={ss.color}>{ss.label}</Badge>
                    <span style={{ fontSize: 12, color: '#717786' }}>{app.state} · {CHANNEL_TYPE_LABEL[app.applicantType]}</span>
                  </div>

                  {(isPendingSupplement || isRejected) && app.rejectionReason && (
                    <div style={{ padding: '10px 12px', borderRadius: 9, background: isRejected ? 'rgba(180,180,180,0.1)' : 'rgba(255,59,48,0.05)', border: `1px solid ${isRejected ? 'rgba(193,198,215,0.3)' : 'rgba(255,59,48,0.2)'}`, fontSize: 12.5, color: isRejected ? '#555' : '#7A2020', marginBottom: 8 }}>
                      <div className="flex items-center gap-1.5" style={{ fontWeight: 700, marginBottom: 3 }}>
                        {isRejected ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                        {isRejected ? '驳回原因' : '需要补充'}
                      </div>
                      {app.rejectionReason}
                      {isPendingSupplement && app.supplementDue && (
                        <div style={{ marginTop: 5, fontWeight: 700, color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />补充截止日：{app.supplementDue}
                        </div>
                      )}
                    </div>
                  )}

                  <PipelineBar app={app} />
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isInReview && (
                    <button onClick={() => setRejectingId(app.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#C0392B', border: '1px solid rgba(255,59,48,0.25)', cursor: 'pointer' }}>
                      <AlertTriangle size={12} />驳回 / 要求补充
                    </button>
                  )}
                  {isPendingSupplement && (
                    <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      <Upload size={12} />查看补充材料
                    </button>
                  )}
                  {isRejected && (
                    <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <RotateCcw size={11} />重新申请
                    </button>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Rejection modal */}
      {rejectingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(24,28,35,0.55)', backdropFilter: 'blur(4px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-strong" style={{ borderRadius: 20, width: 520, padding: '28px 30px' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>驳回 / 要求补充材料</h2>
              <button className="btn-ghost" style={{ padding: 5 }} onClick={() => setRejectingId(null)}><X size={16} /></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 8 }}>处理方式</label>
                {[['pending-supplement', '要求补充材料（申请人可在截止日期内补充后继续）'], ['rejected', '直接驳回（终止入驻流程）']].map(([v, l]) => (
                  <label key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="reject-type" checked={rejectType === v} onChange={() => setRejectType(v)} style={{ marginTop: 2 }} />{l}
                  </label>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>问题说明 / 补充要求 *</label>
                <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} placeholder="请详细说明驳回原因或需要补充的材料内容，此说明将邮件通知申请人…" className="input-glass" style={{ width: '100%', fontSize: 13, resize: 'vertical' }} />
              </div>
              {rejectType === 'pending-supplement' && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#717786', display: 'block', marginBottom: 5 }}>补充截止日期</label>
                  <input type="date" className="input-glass" style={{ width: '100%', fontSize: 13 }} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button className="btn-ghost" style={{ padding: '8px 16px' }} onClick={() => setRejectingId(null)}>取消</button>
              <button disabled={!rejectReason} style={{ padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: rejectReason ? '#C0392B' : 'rgba(255,59,48,0.3)', color: '#fff', border: 'none', cursor: rejectReason ? 'pointer' : 'not-allowed' }} onClick={() => setRejectingId(null)}>
                确认{rejectType === 'rejected' ? '驳回' : '发送补充要求'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'applications', icon: <ClipboardList size={15} />, label: '申请总览' },
  { id: 'doc-review',   icon: <FileText size={15} />,      label: '资料审核' },
  { id: 'compliance',   icon: <Shield size={15} />,        label: '合规验证' },
  { id: 'contract',     icon: <FileSignature size={15} />, label: '合同签署' },
  { id: 'account',      icon: <Key size={15} />,           label: '账号与培训' },
  { id: 'rejection',    icon: <AlertTriangle size={15} />, label: '驳回与补充' },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function OnboardingView({ navigateTo: _navigateTo }: Props) {
  const [tab, setTab] = useState<TabId>('applications')
  const [, setSelectedApp] = useState<OnboardingApp | null>(null)

  const pendingDocs = documentReviews.flatMap(r => r.docs.filter(d => d.status === 'pending')).length
  const pendingSupplement = onboardingApps.filter(a => a.status === 'pending-supplement').length
  const bgInProgress = backgroundChecks.filter(b => b.status === 'pending').length
  const contractsPending = eContracts.filter(c => c.status !== 'signed').length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>渠道入驻与准入管理</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>在线申请 · 资料审核 · NIPR / 背景 / E&O 验证 · 合同签署 · 账号开通 · 培训认证</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingSupplement > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} />{pendingSupplement} 份待补充
            </div>
          )}
          {bgInProgress > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(123,63,202,0.08)', border: '1px solid rgba(123,63,202,0.2)', fontSize: 12.5, fontWeight: 600, color: '#7B3FCA' }}>
              <Clock size={13} />{bgInProgress} 份背调进行中
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(t => {
          const badge = t.id === 'doc-review' ? pendingDocs : t.id === 'contract' ? contractsPending : t.id === 'rejection' ? pendingSupplement : 0
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === t.id ? '#0058BC' : '#717786', border: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.icon}
              {t.label}
              {badge > 0 && <span style={{ background: t.id === 'rejection' ? '#FF3B30' : '#FF9F0A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{badge}</span>}
            </button>
          )
        })}
      </div>

      {tab === 'applications' && <ApplicationTab onSelectApp={setSelectedApp} />}
      {tab === 'doc-review'   && <DocReviewTab />}
      {tab === 'compliance'   && <ComplianceVerificationTab />}
      {tab === 'contract'     && <ContractTab />}
      {tab === 'account'      && <AccountTrainingTab />}
      {tab === 'rejection'    && <RejectionSupplementTab />}
    </div>
  )
}
