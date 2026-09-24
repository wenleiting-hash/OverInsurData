import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Plus, Edit2, FileText, Settings, Users, RefreshCw, Package,
  CheckCircle, XCircle, AlertTriangle, Search,
  Download, Upload, Eye, Phone, Mail,
  Zap, Shield, TrendingUp, MoreHorizontal,
  ArrowUpRight, X, Building2, Trash2, ChevronRight, Info,
} from 'lucide-react'
import { insurers } from '../data/mockData'
import {
  cooperations, contracts, settlementConfigs, coopContacts,
  renewalItems, productIntegrations,
} from '../data/cooperationData'
import type { CooperationRelationship, CoopDerivedStatus } from '../data/cooperationData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

// ─── Status / config maps ──────────────────────────────────────────────────────

const COOP_STATUS: Record<CoopDerivedStatus, { label: string; cls: string; orb: string }> = {
  Negotiating: { label: '洽谈中',   cls: 'badge-purple', orb: 'orb-purple' },
  PendingSign: { label: '待签约',   cls: 'badge-yellow', orb: 'orb-yellow' },
  Signed:      { label: '已签约',   cls: 'badge-blue',   orb: 'orb-blue' },
  Active:      { label: '履行中',   cls: 'badge-green',  orb: 'orb-green' },
  Expiring:    { label: '即将到期', cls: 'badge-orange', orb: 'orb-orange' },
  Expired:     { label: '已到期',   cls: 'badge-red',    orb: 'orb-red' },
  Terminated:  { label: '已终止',   cls: 'badge-gray',   orb: 'orb-gray' },
}

// Derive display status from stored status + endDate
function deriveCoopStatus(coop: CooperationRelationship): CoopDerivedStatus {
  if (coop.status !== 'Active') return coop.status as CoopDerivedStatus
  if (!coop.endDate) return 'Active'
  const now = new Date()
  const end = new Date(coop.endDate)
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  if (diffDays < 0) return 'Expired'
  if (diffDays <= 90) return 'Expiring'
  return 'Active'
}

const COOP_TYPES = ['直接代理', 'MGA', '批发经纪', '推荐合作', '聚合平台合作'] as const

const TERMINATION_REASONS = [
  '协议到期不续约',
  '双方协商终止',
  '保险公司违约',
  '我司主动终止',
  '监管要求终止',
] as const

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'badge-gray' },
  negotiating: { label: '谈判中', cls: 'badge-purple' },
  'pending-sign': { label: '待签署', cls: 'badge-yellow' },
  active: { label: '有效', cls: 'badge-green' },
  expiring: { label: '即将到期', cls: 'badge-orange' },
  expired: { label: '已到期', cls: 'badge-red' },
  terminated: { label: '已终止', cls: 'badge-gray' },
}

const RENEWAL_STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: '待处理', cls: 'badge-blue' },
  'in-negotiation': { label: '谈判中', cls: 'badge-yellow' },
  renewed: { label: '已续约', cls: 'badge-green' },
  'at-risk': { label: '风险', cls: 'badge-red' },
  lapsed: { label: '已失效', cls: 'badge-gray' },
}

const ROLE_ICON: Record<string, any> = {
  Underwriting: Shield, Claims: AlertTriangle, Billing: TrendingUp,
  'IT/API': Zap, Legal: FileText, Marketing: ArrowUpRight, 'Senior Management': Building2,
}
const ROLE_COLOR: Record<string, string> = {
  Underwriting: '#0058BC', Claims: '#FF9500', Billing: '#34C759',
  'IT/API': '#AF52DE', Legal: '#717786', Marketing: '#FF3B30', 'Senior Management': '#181C23',
}

const DETAIL_TABS = [
  { id: 'contracts',    label: '合同协议', icon: FileText },
  { id: 'settlement',   label: '结算配置', icon: Settings },
  { id: 'commission',   label: '佣金率配置', icon: TrendingUp },
  { id: 'contacts',     label: '联系人',   icon: Users },
  { id: 'renewal',      label: '续约管理', icon: RefreshCw },
  { id: 'integration',  label: '产品接入', icon: Package },
]

// ─── Termination modal ───────────────────────────────────────────────────────

function TerminationModal({ insurerName, onClose, onConfirm }: { insurerName: string; onClose: () => void; onConfirm: () => void }) {
  const [reason, setReason] = useState('')
  const [effectiveType, setEffectiveType] = useState<'immediate' | 'expiry' | 'date'>('immediate')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return (
    <div style={{ padding: '40px 32px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 6 }}>终止操作已受理</div>
      <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>与 <strong>{insurerName}</strong> 的合作关系已进入终止流程，相关记录已写入审计日志。</p>
      <button className="btn-primary" style={{ fontSize: 13 }} onClick={onConfirm}>返回列表</button>
    </div>
  )

  const canConfirm = reason && acknowledged && (effectiveType !== 'date' || effectiveDate)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', marginBottom: 20, borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '0.5px solid rgba(186,26,26,0.18)' }}>
        <AlertTriangle size={16} style={{ color: '#BA1A1A', flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#BA1A1A', fontWeight: 500 }}>正在终止与 <strong>{insurerName}</strong> 的合作关系，终止后状态不可撤销。</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>终止原因 <span style={{ color: '#BA1A1A' }}>*</span></div>
        <select className="input-glass w-full" style={{ fontSize: 13 }} value={reason} onChange={e => setReason(e.target.value)}>
          <option value="">请选择终止原因…</option>
          {TERMINATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>生效方式</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([['immediate', '立即终止', '操作确认后即时生效'],
            ['expiry', '到期终止', '合作期满自然终止，不再续约'],
            ['date', '指定日期终止', '设定未来某日作为终止生效日']] as const).map(([v, lbl, desc]) => (
            <label key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 9, cursor: 'pointer', background: effectiveType === v ? 'rgba(186,26,26,0.06)' : 'rgba(255,255,255,0.6)', border: `0.5px solid ${effectiveType === v ? 'rgba(186,26,26,0.3)' : 'rgba(193,198,215,0.4)'}` }}>
              <input type="radio" name="effectiveType" checked={effectiveType === v} onChange={() => setEffectiveType(v)} style={{ accentColor: '#BA1A1A', marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: effectiveType === v ? '#BA1A1A' : '#181C23' }}>{lbl}</div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 1 }}>{desc}</div>
              </div>
            </label>
          ))}
        </div>
        {effectiveType === 'date' && (
          <input type="date" className="input-glass w-full" style={{ marginTop: 10, fontSize: 13 }} value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} />
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(193,198,215,0.10)', border: '0.5px solid rgba(193,198,215,0.3)', cursor: 'pointer', marginBottom: 24 }}>
        <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} style={{ accentColor: '#BA1A1A', marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: '#414755', lineHeight: 1.5 }}>
          我已知悉：合作终止不自动收回渠道产品授权；渠道授权收回需在渠道管理模块独立执行。
        </span>
      </label>

      <div className="flex gap-3 justify-end">
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>取消</button>
        <button
          style={{ fontSize: 13, padding: '8px 20px', borderRadius: 10, background: canConfirm ? '#BA1A1A' : 'rgba(186,26,26,0.35)', color: '#fff', border: 'none', cursor: canConfirm ? 'pointer' : 'not-allowed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
          disabled={!canConfirm}
          onClick={() => canConfirm && setSubmitted(true)}
        >
          <XCircle size={14} />确认终止
        </button>
      </div>
    </div>
  )
}

// ─── New cooperation wizard ────────────────────────────────────────────────────

function NewCoopModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [coopType, setCoopType] = useState<string>('直接代理')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [accountManager, setAccountManager] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [search, setSearch] = useState('')

  const availableInsurers = insurers
    .filter(i => !cooperations.some(c => c.insurerId === i.id && c.status !== 'Terminated'))
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.shortName.toLowerCase().includes(search.toLowerCase()))
  const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']
  const STATES_SAMPLE = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'WA', 'CO', 'GA', 'AZ', 'NC']

  if (done) return (
    <div style={{ padding: '48px 40px', textAlign: 'center' }}>
      <CheckCircle size={48} style={{ color: '#34C759', margin: '0 auto 16px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>合作记录已创建</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 12 }}>
        与 <strong>{insurers.find(i => i.id === selectedInsurer)?.name}</strong> 的合作关系已建立，当前状态：
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'rgba(175,82,222,0.10)', border: '0.5px solid rgba(175,82,222,0.3)', marginBottom: 28 }}>
        <span className="orb orb-purple" />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#AF52DE' }}>洽谈中</span>
      </div>
      <p style={{ fontSize: 13, color: '#717786', marginBottom: 28 }}>核心条款确认后，可在详情页推进至"待签约"状态。</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onSaved}>返回合作列表</button>
    </div>
  )

  const STEPS = ['选择保险公司', '合作参数', '确认保存']

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i < step ? '#34C759' : i === step ? '#0058BC' : 'rgba(193,198,215,0.3)', color: i <= step ? '#fff' : '#717786' }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: i === step ? 600 : 400, color: i === step ? '#0058BC' : '#717786' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 40, height: 1, background: i < step ? '#34C759' : 'rgba(193,198,215,0.4)', margin: '0 10px' }} />}
          </div>
        ))}
      </div>

      {/* Step 0: select insurer */}
      {step === 0 && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div className="relative">
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
              <input className="input-glass w-full" style={{ paddingLeft: 30, fontSize: 13 }} placeholder="搜索保险公司…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
            {availableInsurers.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>无可用保险公司</div>
              : availableInsurers.map(ins => (
                <label key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer', background: selectedInsurer === ins.id ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)', border: `0.5px solid ${selectedInsurer === ins.id ? '#0058BC' : 'rgba(193,198,215,0.4)'}`, transition: 'all 100ms' }}>
                  <input type="radio" name="insurer" checked={selectedInsurer === ins.id} onChange={() => setSelectedInsurer(ins.id)} style={{ accentColor: '#0058BC' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                    {ins.shortName.slice(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{ins.name}</div>
                    <div style={{ fontSize: 12, color: '#717786' }}>NAIC {ins.naicCode} · {ins.type} · AM Best {ins.amBestRating}</div>
                  </div>
                </label>
              ))
            }
          </div>
        </div>
      )}

      {/* Step 1: params */}
      {step === 1 && (
        <div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>合作类型</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { v: '直接代理',    desc: '我司作为保险公司的授权代理人直接代理其产品' },
                { v: 'MGA',         desc: '管理总代理，承接产品设计、核保、赔付权限' },
                { v: '批发经纪',    desc: '通过批发渠道分发，面向零售经纪人' },
                { v: '推荐合作',    desc: '流量/线索推荐，由保险公司完成出单' },
                { v: '聚合平台合作',desc: '在我司平台上架产品，平台主导出单流程' },
              ].map(t => (
                <label key={t.v} style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: coopType === t.v ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${coopType === t.v ? '#0058BC' : 'rgba(193,198,215,0.4)'}` }}>
                  <input type="radio" name="coopType" checked={coopType === t.v} onChange={() => setCoopType(t.v)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: coopType === t.v ? '#0058BC' : '#181C23' }}>{t.v}</div>
                  <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2, lineHeight: 1.4 }}>{t.desc}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>合作生效日期</div>
              <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>合作到期日期</div>
              <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="永久合作可不填" />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>我司对接人</div>
            <input className="input-glass w-full" style={{ fontSize: 13 }} placeholder="填写我司负责此合作的对接人姓名…" value={accountManager} onChange={e => setAccountManager(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>业务线范围</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LINES.map(l => (
                <label key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13, background: selectedLines.includes(l) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)', border: `0.5px solid ${selectedLines.includes(l) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`, color: selectedLines.includes(l) ? '#0058BC' : '#414755' }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedLines.includes(l)} onChange={() => setSelectedLines(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])} />
                  {selectedLines.includes(l) && <CheckCircle size={11} />}{l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>经营州</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATES_SAMPLE.map(s => (
                <label key={s} style={{ padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", background: selectedStates.includes(s) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)', border: `0.5px solid ${selectedStates.includes(s) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`, color: selectedStates.includes(s) ? '#0058BC' : '#414755', fontWeight: selectedStates.includes(s) ? 700 : 400 }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedStates.includes(s)} onChange={() => setSelectedStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} />{s}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: confirm & save */}
      {step === 2 && (
        <div>
          <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '18px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0058BC', marginBottom: 12 }}>合作记录摘要</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
              {[
                ['保险公司', insurers.find(i => i.id === selectedInsurer)?.name ?? '—'],
                ['合作类型', coopType],
                ['生效日期', startDate || '待确认'],
                ['到期日期', endDate || '永久合作'],
                ['业务线', selectedLines.join(', ') || '未选择'],
                ['经营州', selectedStates.join(', ') || '未选择'],
                ['我司对接人', accountManager || '未填写'],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span style={{ color: '#717786', minWidth: 70 }}>{k}</span>
                  <span style={{ color: '#181C23', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(175,82,222,0.07)', border: '0.5px solid rgba(175,82,222,0.2)', marginBottom: 16 }}>
            <span className="orb orb-purple" />
            <span style={{ fontSize: 13, color: '#AF52DE', fontWeight: 500 }}>保存后进入"洽谈中"状态，无需审批</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>备注</div>
            <textarea className="input-glass w-full" style={{ minHeight: 80, resize: 'vertical', fontSize: 13.5 }} placeholder="补充说明合作背景或特殊条款…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
          {step === 0 ? '取消' : '← 上一步'}
        </button>
        {step < 2
          ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedInsurer}>
              下一步 →
            </button>
          : <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setDone(true)}>
              <CheckCircle size={14} />保存记录
            </button>
        }
      </div>
    </div>
  )
}

// ─── Detail page (full view for a selected cooperation) ───────────────────────

function CoopDetailPage({ coop, onBack, navigateTo }: { coop: CooperationRelationship; onBack: () => void; navigateTo?: (view: ViewId, params?: any) => void }) {
  const [tab, setTab] = useState('contracts')
  const [showTermModal, setShowTermModal] = useState(false)
  const [showIntegrationModal, setShowIntegrationModal] = useState(false)
  const [showSettlementEdit, setShowSettlementEdit] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showRenewalModal, setShowRenewalModal] = useState(false)
  const [piMenuId, setPiMenuId] = useState<string | null>(null)
  const ins = insurers.find(i => i.id === coop.insurerId)
  const derivedStatus = deriveCoopStatus(coop)
  const sc = COOP_STATUS[derivedStatus]

  const canEdit = coop.status === 'Negotiating' || coop.status === 'PendingSign' ||
    (coop.status === 'Signed' && coop.startDate && new Date(coop.startDate) > new Date())
  const canTerminate = coop.status === 'Active' || coop.status === 'Signed' ||
    derivedStatus === 'Expiring' || derivedStatus === 'Expired'
  const canAdvance = coop.status === 'Negotiating'

  const coopContracts = contracts.filter(c => c.insurerId === coop.insurerId)
  const coopSettlement = settlementConfigs.find(s => s.insurerId === coop.insurerId)
  const coopContacts2 = coopContacts.filter(c => c.insurerId === coop.insurerId)
  const coopRenewals = renewalItems.filter(r => r.insurerId === coop.insurerId)
  const coopIntegrations = productIntegrations.filter(p => p.insurerId === coop.insurerId)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Back + header */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn-ghost" style={{ fontSize: 13, marginBottom: 14, paddingLeft: 6 }} onClick={onBack}>
          ← 返回合作列表
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-4">
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#0058BC' }}>
              {coop.insurerShort.slice(0, 3)}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{ins?.name ?? coop.insurerShort}</h1>
              <div className="flex items-center gap-3" style={{ marginTop: 4 }}>
                <span className={`orb ${sc.orb}`} /><span className={`badge ${sc.cls}`} style={{ fontSize: 12 }}>{sc.label}</span>
                <span style={{ fontSize: 13, color: '#717786' }}>{coop.type}</span>
                {coop.startDate && <span style={{ fontSize: 13, color: '#717786' }}>合作期：{coop.startDate.slice(0, 7)} ～ {coop.endDate ? coop.endDate.slice(0, 7) : '永久'}</span>}
                {coop.accountManager && <span style={{ fontSize: 13, color: '#717786' }}>负责人：{coop.accountManager}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {canAdvance && (
              <button className="btn-primary" style={{ fontSize: 13 }}>
                <ChevronRight size={13} />推进至待签约
              </button>
            )}
            {canEdit && (
              <button className="btn-secondary" style={{ fontSize: 13 }}><Edit2 size={13} />编辑</button>
            )}
            {!canEdit && coop.status !== 'Terminated' && (
              <button className="btn-secondary" style={{ fontSize: 13, opacity: 0.45, cursor: 'not-allowed' }} disabled><Edit2 size={13} />编辑</button>
            )}
            {canTerminate && (
              <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => setShowTermModal(true)}><XCircle size={13} />发起终止</button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 14, overflow: 'hidden' }}>
        <div className="flex" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)', padding: '0 20px', background: 'rgba(246,248,255,0.9)' }}>
          {DETAIL_TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '13px 16px', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#0058BC' : '#717786', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── 合同协议 ── */}
        {tab === 'contracts' && (() => {
          const expiring = coopContracts.filter(ct => {
            const d = Math.ceil((new Date(ct.expiryDate).getTime() - Date.now()) / 86400000)
            return d >= 0 && d <= 90 && ct.status !== 'terminated'
          })
          const TYPE_LABELS: Record<string, string> = {
            'Master Agreement': '主协议', 'Commission Schedule': '佣金附议',
            'Data Sharing': '数据协议', 'Amendment': '补充协议', 'Addendum': '附录', 'NDA': 'NDA',
          }
          const TYPE_COLOR: Record<string, string> = {
            'Master Agreement': '#0058BC', 'Commission Schedule': '#34C759',
            'Data Sharing': '#AF52DE', 'Amendment': '#FF9500', 'Addendum': '#717786', 'NDA': '#FF3B30',
          }
          return (
            <div>
              {expiring.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', marginBottom: 18, borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '0.5px solid rgba(186,26,26,0.2)' }}>
                  <AlertTriangle size={14} style={{ color: '#BA1A1A', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#BA1A1A', fontWeight: 500 }}>{expiring.length} 份合同将在 90 天内到期，请及时安排续签。</span>
                  <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 12, color: '#BA1A1A' }}>查看</button>
                </div>
              )}
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div className="flex gap-1">
                  {['全部', '主协议', '佣金附议', '数据协议', 'NDA'].map(f => (
                    <button key={f} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, border: '0.5px solid rgba(193,198,215,0.5)', background: f === '全部' ? '#0058BC' : 'rgba(255,255,255,0.7)', color: f === '全部' ? '#fff' : '#414755', cursor: 'pointer', fontWeight: f === '全部' ? 600 : 400 }}>{f}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" style={{ fontSize: 12 }}><Upload size={12} />上传合同</button>
                  <button className="btn-primary" style={{ fontSize: 12 }}><Plus size={12} />新建合同</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coopContracts.map(ct => {
                  const st = CONTRACT_STATUS[ct.status]
                  const daysLeft = ct.expiryDate ? Math.ceil((new Date(ct.expiryDate).getTime() - Date.now()) / 86400000) : null
                  const tColor = TYPE_COLOR[ct.type] ?? '#717786'
                  const tLabel = TYPE_LABELS[ct.type] ?? ct.type
                  const isExpiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 90
                  return (
                    <div key={ct.id} style={{ padding: '16px 18px', background: 'rgba(246,248,255,0.9)', border: `1px solid ${isExpiringSoon ? 'rgba(186,26,26,0.2)' : 'rgba(193,198,215,0.42)'}`, borderRadius: 12, display: 'flex', gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: tColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={18} style={{ color: tColor }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-start justify-between gap-3">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{ct.title}</div>
                            <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, background: tColor + '14', color: tColor, fontWeight: 600 }}>{tLabel}</span>
                              <span style={{ fontSize: 12, color: '#717786' }}>版本 {ct.version}</span>
                              {ct.signedDate && <span style={{ fontSize: 12, color: '#717786' }}>签署 {ct.signedDate}</span>}
                              <span style={{ fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>
                                {ct.effectiveDate || '—'} ～ {ct.expiryDate || '长期'}
                              </span>
                            </div>
                            {isExpiringSoon && daysLeft !== null && (
                              <div style={{ marginTop: 8 }}>
                                <div className="flex items-center justify-between" style={{ fontSize: 11.5, marginBottom: 4 }}>
                                  <span style={{ color: daysLeft <= 30 ? '#BA1A1A' : '#a05800', fontWeight: 600 }}>
                                    {daysLeft === 0 ? '今日到期' : `剩余 ${daysLeft} 天`}
                                  </span>
                                  <span style={{ color: '#717786' }}>到期 {ct.expiryDate}</span>
                                </div>
                                <div style={{ height: 4, borderRadius: 2, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', borderRadius: 2, width: `${Math.max(4, Math.min(100, daysLeft / 90 * 100))}%`, background: daysLeft <= 30 ? '#BA1A1A' : '#FF9500' }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2" style={{ flexShrink: 0 }}>
                            <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
                            <div className="flex gap-0.5">
                              <button className="btn-ghost" style={{ padding: 5 }} title="查看"><Eye size={13} /></button>
                              <button className="btn-ghost" style={{ padding: 5 }} title="下载"><Download size={13} /></button>
                              {ct.status !== 'terminated' && <button className="btn-ghost" style={{ padding: 5 }} title="续签"><RefreshCw size={13} /></button>}
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 16, fontSize: 12, color: '#717786' }}>
                          <span>我方签署：<span style={{ color: '#414755' }}>{ct.signatoryUs}</span></span>
                          <span>对方签署：<span style={{ color: '#414755' }}>{ct.signatoryThem}</span></span>
                          <span style={{ marginLeft: 'auto' }}>文件 {ct.fileSize} · 上传：{ct.uploadedBy}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {coopContracts.length === 0 && (
                  <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
                    <FileText size={32} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>暂无合同记录</div>
                    <div style={{ fontSize: 13 }}>上传已签署的合作协议，或新建合同记录开始管理</div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── 结算配置 ── */}
        {tab === 'settlement' && (() => {
          const sc2 = coopSettlement
          if (!sc2) return (
            <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
              <Settings size={32} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>暂无结算配置</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>请先配置与该保险公司的结算参数</div>
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={13} />配置结算参数</button>
            </div>
          )
          return (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>结算参数配置</div>
                  <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>最后更新：{sc2.lastUpdated} · {sc2.updatedBy}</div>
                </div>
                <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setShowSettlementEdit(true)}><Edit2 size={13} />编辑配置</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {/* 佣金结算 */}
                <div style={{ padding: '18px 20px', background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.14)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0058BC', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>佣金结算</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '结算周期', value: sc2.cycle === 'Monthly' ? '月结' : sc2.cycle === 'Quarterly' ? '季结' : '半年结' },
                      { label: '账单截止日', value: `每月 ${sc2.billCutoffDay} 日截单` },
                      { label: '对账期限', value: '收到账单后 15 天内' },
                      { label: '付款账期', value: `对账完成后 Net ${sc2.paymentTermDays}` },
                      { label: '付款方式', value: sc2.paymentMethod },
                      { label: '结算货币', value: sc2.currency },
                    ].map(k => (
                      <div key={k.label} className="flex items-center justify-between">
                        <span style={{ fontSize: 12.5, color: '#717786' }}>{k.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{k.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 保费归集 */}
                <div style={{ padding: '18px 20px', background: 'rgba(52,199,89,0.04)', border: '1px solid rgba(52,199,89,0.14)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E8033', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>保费归集</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '归集方式', value: sc2.premiumCollection === 'Agency Bill' ? '渠道代收归集' : '直付保险公司' },
                      { label: '保费结算周期', value: '月结' },
                      { label: '对账联系人', value: sc2.reconciliationContact },
                    ].map(k => (
                      <div key={k.label} className="flex items-center justify-between">
                        <span style={{ fontSize: 12.5, color: '#717786' }}>{k.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23', maxWidth: 220, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 对账与账单 */}
                <div style={{ padding: '18px 20px', background: 'rgba(175,82,222,0.04)', border: '1px solid rgba(175,82,222,0.14)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#AF52DE', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>对账与账单</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '对账方式', value: '保险公司发送账单文件', active: true },
                      { label: 'API 自动拉取', value: '待开放', disabled: true },
                      { label: 'EDI 835', value: '待开放', disabled: true },
                      { label: '账单格式', value: sc2.billingFormat },
                    ].map(k => (
                      <div key={k.label} className="flex items-center justify-between">
                        <span style={{ fontSize: 12.5, color: (k as any).disabled ? '#C1C6D7' : '#717786' }}>{k.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: (k as any).disabled ? '#C1C6D7' : (k as any).active ? '#AF52DE' : '#181C23' }}>
                          {(k as any).active && <span style={{ marginRight: 4 }}>●</span>}{k.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 差异处理规则 */}
                <div style={{ padding: '18px 20px', background: 'rgba(255,149,0,0.04)', border: '1px solid rgba(255,149,0,0.14)', borderRadius: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#a05800', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>差异处理规则</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { label: '差异处理时限', value: '15 个工作日' },
                      { label: '升级机制', value: '差异 > 5% 自动升级' },
                      { label: '争议暂扣规则', value: '争议部分暂扣至确认' },
                    ].map(k => (
                      <div key={k.label} className="flex items-center justify-between">
                        <span style={{ fontSize: 12.5, color: '#717786' }}>{k.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{k.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {sc2.notes && (
                <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(193,198,215,0.10)', border: '0.5px solid rgba(193,198,215,0.3)', fontSize: 13, color: '#414755' }}>
                  <span style={{ fontWeight: 600, color: '#717786' }}>备注：</span>{sc2.notes}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── 佣金率摘要（只读，编辑入口在财务结算）── */}
        {tab === 'commission' && (() => {
          const commRates = [
            { line: 'Auto',       rate: 12.5, state: 'CA / TX / NY', version: 3, updated: '2026-01-01', status: 'active' },
            { line: 'Home',       rate: 10.0, state: '全域',          version: 2, updated: '2026-01-01', status: 'active' },
            { line: 'Commercial', rate: 8.5,  state: '全域',          version: 2, updated: '2026-01-01', status: 'active' },
            { line: 'Cyber',      rate: 14.0, state: '全域',          version: 1, updated: '2026-06-01', status: 'active' },
            { line: 'D&O',        rate: 11.0, state: '全域',          version: 1, updated: '2026-06-01', status: 'pending' },
          ]
          const activeCount = commRates.filter(r => r.status === 'active').length
          const latestVersion = Math.max(...commRates.map(r => r.version))
          const lastUpdated = commRates.reduce((a, b) => a.updated > b.updated ? a : b).updated
          return (
            <div>
              {/* Read-only notice + jump link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', marginBottom: 20, borderRadius: 12, background: 'rgba(0,88,188,0.04)', border: '1px solid rgba(0,88,188,0.15)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0058BC', marginBottom: 3 }}>佣金率只读摘要</div>
                  <div style={{ fontSize: 12.5, color: '#717786' }}>
                    佣金率主数据在 <strong style={{ color: '#181C23' }}>财务结算 › 结算比例配置</strong> 统一维护（含版本管理、Excel 导入、试算预览）；本页仅展示当前生效摘要，不可编辑。
                  </div>
                </div>
                {navigateTo && (
                  <button
                    onClick={() => navigateTo('finance', { commissionInsurerId: coop.insurerId })}
                    style={{ padding: '8px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#0058BC', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <ArrowUpRight size={13} />维护佣金率
                  </button>
                )}
              </div>

              {/* Summary metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
                {[
                  { label: '生效中费率档位', v: `${activeCount} 个险种`, color: '#1E8033', bg: 'rgba(52,199,89,0.07)' },
                  { label: '最新版本号',     v: `v${latestVersion}`,    color: '#0058BC', bg: 'rgba(0,88,188,0.06)' },
                  { label: '最近更新时间',   v: lastUpdated,            color: '#181C23', bg: 'rgba(246,248,255,0.9)' },
                ].map(k => (
                  <div key={k.label} style={{ padding: '14px 16px', borderRadius: 10, background: k.bg, border: '1px solid rgba(193,198,215,0.35)' }}>
                    <div style={{ fontSize: 11, color: '#717786', marginBottom: 5 }}>{k.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.v}</div>
                  </div>
                ))}
              </div>

              {/* Read-only rate table */}
              <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.9)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#181C23' }}>当前生效费率（只读）</span>
                  <span style={{ fontSize: 12, color: '#717786' }}>· 取值优先级：产品+州 → 产品全域 → 险种+州 → 险种全域</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'rgba(246,248,255,0.7)', borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
                      {['险种', '当前费率', '适用州', '最近更新', '版本', '状态'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commRates.map((cr, i) => (
                      <tr key={cr.line} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.2)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.5)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0058BC' }}>{cr.line.slice(0, 2)}</div>
                            <span style={{ fontWeight: 600, color: '#181C23' }}>{cr.line}</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{cr.rate}%</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#555' }}>{cr.state}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{cr.updated}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(193,198,215,0.2)', color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>v{cr.version}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${cr.status === 'active' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 11 }}>
                            {cr.status === 'active' ? '生效中' : '待生效'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {/* ── 联系人 ── */}
        {tab === 'contacts' && (() => {
          const ROLE_ORDER = ['Senior Management', 'Underwriting', 'Claims', 'Billing', 'IT/API', 'Legal', 'Marketing']
          const grouped = ROLE_ORDER.reduce<Record<string, typeof coopContacts2>>((acc, r) => {
            const g = coopContacts2.filter(c => c.role === r)
            if (g.length) acc[r] = g
            return acc
          }, {})
          const ROLE_CN: Record<string, string> = {
            'Senior Management': '高管', 'Underwriting': '核保', 'Claims': '理赔',
            'Billing': '结算财务', 'IT/API': 'IT 技术', 'Legal': '法务', 'Marketing': '市场',
          }
          return (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#717786' }}>{coopContacts2.length} 位联系人 · {Object.keys(grouped).length} 个职能角色</span>
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowContactModal(true)}><Plus size={12} />添加联系人</button>
              </div>
              {coopContacts2.length === 0 && (
                <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
                  <Users size={32} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
                  <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>暂无联系人</div>
                  <div style={{ fontSize: 13 }}>添加保险公司各职能的对接人，便于日常沟通和问题升级</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {Object.entries(grouped).map(([role, contacts]) => {
                  const RoleIcon = ROLE_ICON[role] ?? Users
                  const roleColor = ROLE_COLOR[role] ?? '#717786'
                  return (
                    <div key={role}>
                      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: roleColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <RoleIcon size={11} style={{ color: roleColor }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{ROLE_CN[role] ?? role}</span>
                        <div style={{ flex: 1, height: '0.5px', background: roleColor + '30' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        {contacts.map(ct => (
                          <div key={ct.id} style={{ padding: '14px 16px', background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 10 }}>
                            <div className="flex items-start justify-between gap-2">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex items-center gap-2" style={{ marginBottom: 3 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{ct.name}</span>
                                  {ct.isPrimary && <span className="badge badge-blue" style={{ fontSize: 10 }}>主要</span>}
                                  {ct.isEscalation && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(186,26,26,0.08)', color: '#BA1A1A', fontWeight: 600 }}>升级</span>}
                                </div>
                                <div style={{ fontSize: 12, color: '#717786', marginBottom: 8 }}>{ct.title} · {ct.department}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <a href={`mailto:${ct.email}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#0058BC', textDecoration: 'none' }}>
                                    <Mail size={11} />{ct.email}
                                  </a>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#414755' }}>
                                    <Phone size={11} />{ct.phone}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                                <span style={{ fontSize: 11, color: '#717786' }}>{ct.timezone}</span>
                                <div style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(193,198,215,0.15)', color: '#717786' }}>
                                  {ct.preferredContact === 'Email' ? '优选邮件' : ct.preferredContact === 'Phone' ? '优选电话' : ct.preferredContact}
                                </div>
                              </div>
                            </div>
                            {ct.notes && <div style={{ marginTop: 8, paddingTop: 8, borderTop: '0.5px solid rgba(193,198,215,0.3)', fontSize: 12, color: '#717786', fontStyle: 'italic' }}>{ct.notes}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── 续约管理 ── */}
        {tab === 'renewal' && (() => {
          const displayRenewals = coopRenewals.length > 0 ? coopRenewals : renewalItems.slice(0, 3)
          const critical = displayRenewals.filter(r => r.priority === 'critical' || r.daysLeft <= 60)
          return (
            <div>
              {critical.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', marginBottom: 18, borderRadius: 10, background: 'rgba(186,26,26,0.05)', border: '0.5px solid rgba(186,26,26,0.2)' }}>
                  <AlertTriangle size={14} style={{ color: '#BA1A1A' }} />
                  <span style={{ fontSize: 13, color: '#BA1A1A', fontWeight: 500 }}>{critical.length} 项续约处于紧急状态，请尽快处理</span>
                </div>
              )}
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: '#717786' }}>{displayRenewals.length} 项续约跟踪</span>
                <div className="flex gap-2">
                  <button className="btn-secondary" style={{ fontSize: 12 }}><Download size={12} />导出</button>
                  <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowRenewalModal(true)}><RefreshCw size={12} />发起续约</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {displayRenewals.map(r => {
                  const st = RENEWAL_STATUS[r.status]
                  const isOverdue = r.daysLeft < 0
                  const isCritical = r.daysLeft <= 30 && r.daysLeft >= 0
                  const barPct = Math.max(2, Math.min(100, (r.daysLeft / 180) * 100))
                  const barColor = isOverdue ? '#BA1A1A' : isCritical ? '#FF3B30' : r.daysLeft <= 90 ? '#FF9500' : '#34C759'
                  const PRIORITY_LABEL: Record<string, string> = { critical: '紧急', high: '高', normal: '中', low: '低' }
                  const PRIORITY_CLS: Record<string, string> = { critical: 'badge-red', high: 'badge-orange', normal: 'badge-blue', low: 'badge-gray' }
                  return (
                    <div key={r.id} style={{ padding: '18px 20px', background: 'rgba(246,248,255,0.9)', border: `1px solid ${isOverdue ? 'rgba(186,26,26,0.25)' : 'rgba(193,198,215,0.42)'}`, borderRadius: 12 }}>
                      <div className="flex items-start justify-between gap-4">
                        <div style={{ flex: 1 }}>
                          <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{r.title}</span>
                            <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
                            <span className={`badge ${PRIORITY_CLS[r.priority]}`} style={{ fontSize: 10 }}>{PRIORITY_LABEL[r.priority]}</span>
                            {r.autoRenew && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,88,188,0.08)', color: '#0058BC', fontWeight: 600 }}>自动续约</span>}
                          </div>
                          <div className="flex items-center gap-4" style={{ fontSize: 12.5, color: '#717786', marginBottom: 10, flexWrap: 'wrap' }}>
                            <span>到期：<span style={{ fontWeight: 500, color: '#414755' }}>{r.expiryDate}</span></span>
                            <span style={{ color: isOverdue ? '#BA1A1A' : isCritical ? '#BA1A1A' : r.daysLeft <= 90 ? '#a05800' : '#1E8033', fontWeight: 600 }}>
                              {isOverdue ? `已超期 ${Math.abs(r.daysLeft)} 天` : r.daysLeft === 0 ? '今日到期' : `剩余 ${r.daysLeft} 天`}
                            </span>
                            {r.accountManager && <span>负责人：{r.accountManager}</span>}
                            {r.renewalContact && <span>对方联系人：{r.renewalContact}</span>}
                          </div>
                          {!isOverdue && (
                            <div>
                              <div style={{ height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', borderRadius: 3, width: `${barPct}%`, background: barColor, transition: 'width 300ms' }} />
                              </div>
                            </div>
                          )}
                          {r.lastAction && (
                            <div style={{ marginTop: 10, fontSize: 12, color: '#717786' }}>
                              最新进展：<span style={{ color: '#414755' }}>{r.lastAction}</span>
                              {r.lastActionDate && <span style={{ marginLeft: 6 }}>（{r.lastActionDate}）</span>}
                            </div>
                          )}
                          {r.notes && <div style={{ marginTop: 6, fontSize: 12, color: '#717786', fontStyle: 'italic' }}>{r.notes}</div>}
                        </div>
                        <div className="flex flex-col gap-2" style={{ flexShrink: 0, alignItems: 'flex-end' }}>
                          {!r.autoRenew && (
                            <button className="btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                              <RefreshCw size={12} />发起续约
                            </button>
                          )}
                          <button className="btn-ghost" style={{ padding: 5 }} title="详情">
                            <Eye size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {displayRenewals.length === 0 && (
                  <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
                    <RefreshCw size={32} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>暂无续约记录</div>
                    <div style={{ fontSize: 13 }}>合作到期前 90 天系统将自动提醒发起续约评估</div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── 产品接入 ── */}
        {tab === 'integration' && (() => {
          const STEP_LABELS = ['获取产品清单', '选择关联产品', '确认关联信息']
          const INTEGRATION_STATUS: Record<string, { label: string; cls: string; step: number }> = {
            available:   { label: '可接入',   cls: 'badge-blue',   step: 0 },
            requested:   { label: '已申请',   cls: 'badge-purple', step: 1 },
            'in-review': { label: '建档中',   cls: 'badge-yellow', step: 2 },
            approved:    { label: '技术对接', cls: 'badge-orange', step: 3 },
            integrated:  { label: '已上架',   cls: 'badge-green',  step: 4 },
            rejected:    { label: '已拒绝',   cls: 'badge-red',    step: -1 },
            suspended:   { label: '已下架',   cls: 'badge-gray',   step: -1 },
          }
          return (
            <div>
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>产品接入管理</div>
                  <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>从该保险公司获取并接入可销售产品，完成后可授权给下游渠道</div>
                </div>
                <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => setShowIntegrationModal(true)}><Plus size={12} />申请产品接入</button>
              </div>

              {/* 4-step guide banner */}
              <div style={{ padding: '14px 16px', marginBottom: 18, borderRadius: 12, background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0058BC', marginBottom: 10 }}>接入建档流程（3 步）</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {STEP_LABELS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,88,188,0.12)', border: '1.5px solid rgba(0,88,188,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>{i + 1}</div>
                        <div style={{ fontSize: 11, color: '#717786', textAlign: 'center', lineHeight: 1.3 }}>{s}</div>
                      </div>
                      {i < STEP_LABELS.length - 1 && <div style={{ width: 20, height: '1px', background: 'rgba(0,88,188,0.2)', flexShrink: 0, marginBottom: 14 }} />}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {coopIntegrations.map(pi => {
                  const ist = INTEGRATION_STATUS[pi.status] ?? { label: pi.status, cls: 'badge-gray', step: 0 }
                  const stepPct = ist.step < 0 ? 0 : (ist.step / STEP_LABELS.length) * 100
                  return (
                    <div key={pi.id} style={{ padding: '16px 18px', background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 12 }}>
                      <div className="flex items-start gap-3">
                        <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={18} style={{ color: '#0058BC' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{pi.productName}</div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="badge badge-blue" style={{ fontSize: 11 }}>{pi.line}</span>
                                <span className={`badge ${ist.cls}`} style={{ fontSize: 11 }}>{ist.label}</span>
                                {pi.priority === 'high' && <span className="badge badge-red" style={{ fontSize: 10 }}>高优先</span>}
                                <span style={{ fontSize: 12, color: '#717786' }}>代码 {pi.productCode}</span>
                              </div>
                            </div>
                            <div className="flex gap-0.5" style={{ flexShrink: 0 }}>
                              <button className="btn-ghost" style={{ padding: 5 }} title="查看"><Eye size={14} /></button>
                              <div style={{ position: 'relative' }}>
                                <button className="btn-ghost" style={{ padding: 5, background: piMenuId === pi.id ? 'rgba(0,88,188,0.08)' : undefined }} title="更多操作"
                                  onClick={e => { e.stopPropagation(); setPiMenuId(prev => prev === pi.id ? null : pi.id) }}>
                                  <MoreHorizontal size={14} />
                                </button>
                                {piMenuId === pi.id && (
                                  <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 100, background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(193,198,215,0.55)', borderRadius: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.14)', minWidth: 130, overflow: 'hidden', padding: '4px' }} onClick={e => e.stopPropagation()}>
                                    {pi.status !== 'integrated' && pi.status !== 'rejected' && (
                                      <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px' }}
                                        onClick={() => setPiMenuId(null)}>
                                        <ChevronRight size={13} />继续建档
                                      </button>
                                    )}
                                    <button className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', fontSize: 13, padding: '7px 10px' }}
                                      onClick={() => setPiMenuId(null)}>
                                      <Download size={13} />导出详情
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          {ist.step >= 0 && (
                            <div style={{ marginTop: 12 }}>
                              <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                                <span style={{ fontSize: 11.5, color: '#717786' }}>
                                  {ist.step >= STEP_LABELS.length ? '已完成所有步骤' : `进行至：步骤 ${Math.max(1, ist.step)} · ${STEP_LABELS[Math.max(0, ist.step - 1)]}`}
                                </span>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#0058BC' }}>{Math.round(stepPct)}%</span>
                              </div>
                              <div style={{ display: 'flex', gap: 3 }}>
                                {STEP_LABELS.map((_, i) => (
                                  <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < ist.step ? '#0058BC' : i === ist.step ? 'rgba(0,88,188,0.3)' : 'rgba(193,198,215,0.3)' }} />
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 14, fontSize: 12, color: '#717786', flexWrap: 'wrap' }}>
                            <span>目标州：<span style={{ color: '#414755' }}>{pi.targetStates[0] === 'ALL' ? '全国' : pi.targetStates.join(', ')}</span></span>
                            {pi.estimatedPremium && <span>预估保费：<span style={{ color: '#414755' }}>${(pi.estimatedPremium / 1e6).toFixed(0)}M</span></span>}
                            {pi.requestedBy && <span>申请人：<span style={{ color: '#414755' }}>{pi.requestedBy}</span></span>}
                            {pi.requestDate && <span>申请时间：<span style={{ color: '#414755' }}>{pi.requestDate}</span></span>}
                            {pi.apiDoc && <span style={{ color: '#1E8033' }}>✓ API 文档</span>}
                            {pi.testCompleted && <span style={{ color: '#1E8033' }}>✓ 测试完成</span>}
                          </div>
                          {pi.notes && <div style={{ marginTop: 8, fontSize: 12, color: '#717786', fontStyle: 'italic' }}>{pi.notes}</div>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {coopIntegrations.length === 0 && (
                  <div style={{ padding: '48px 32px', textAlign: 'center', color: '#A0A5B1' }}>
                    <Package size={32} style={{ margin: '0 auto 12px', color: '#C1C6D7' }} />
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>暂无产品接入记录</div>
                    <div style={{ fontSize: 13, marginBottom: 20 }}>获取保险公司的产品清单，选择需要接入平台的产品</div>
                    <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowIntegrationModal(true)}><Plus size={13} />申请产品接入</button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

      </div>
      </div>

      {/* ── 申请产品接入 Modal ── */}
      {showIntegrationModal && (() => {
        const STEP_LABELS = ['选择关联产品', '确认关联信息']
        const AVAILABLE_PRODUCTS = [
          { id: 'ap1', name: 'Commercial Auto Plus', code: 'CAP-2024', line: 'Auto', states: ['CA', 'TX', 'NY', 'FL', 'IL'], fee: '12.5%' },
          { id: 'ap2', name: 'Homeowners Premier',   code: 'HOP-2024', line: 'Home', states: ['ALL'],                      fee: '10.0%' },
          { id: 'ap3', name: 'Cyber Shield Business', code: 'CSB-2024', line: 'Cyber', states: ['CA', 'NY'],              fee: '14.0%' },
          { id: 'ap4', name: 'D&O Executive Cover',   code: 'DOE-2024', line: 'D&O',  states: ['ALL'],                   fee: '11.0%' },
          { id: 'ap5', name: 'Workers Comp Standard', code: 'WCS-2024', line: 'WC',   states: ['CA', 'TX', 'WA'],        fee: '9.5%' },
        ]
        const RATE_RECORDS = [
          { line: 'Auto', rate: '12.5%', scope: '全域', source: '结算比例配置', updated: '2026-01-01' },
          { line: 'Home', rate: '10.0%', scope: '全域', source: '结算比例配置', updated: '2026-01-01' },
          { line: 'Cyber', rate: '14.0%', scope: '全域', source: '结算比例配置', updated: '2026-06-01' },
          { line: 'D&O', rate: '11.0%', scope: '全域', source: '结算比例配置', updated: '2026-06-01' },
          { line: 'WC', rate: '9.5%', scope: '全域', source: '结算比例配置', updated: '2026-08-01' },
        ]

        function IntegrationWizard({ onClose }: { onClose: () => void }) {
          const [step, setStep] = useState(0)
          const [selectedIds, setSelectedIds] = useState<string[]>([])
          const [form, setForm] = useState({ effectiveFrom: new Date().toISOString().slice(0, 10), operator: 'Sarah Chen', notes: '' })
          const [confirmed, setConfirmed] = useState(false)

          const toggleProduct = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
          const selectedProducts = AVAILABLE_PRODUCTS.filter(p => selectedIds.includes(p.id))

          if (confirmed) return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#1E8033' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181C23', marginBottom: 8 }}>关联成功</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 6 }}>
                已将 <strong style={{ color: '#181C23' }}>{selectedProducts.length} 个产品</strong> 关联至本合作协议，生效日期 {form.effectiveFrom}
              </div>
              <div style={{ fontSize: 12.5, color: '#A0A5B1', marginBottom: 28 }}>产品已出现在接入记录列表中，可在产品管理模块配置可售州</div>
              <button className="btn-primary" onClick={onClose}>完成</button>
            </div>
          )

          const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(193,198,215,0.6)', fontSize: 13, outline: 'none', background: 'rgba(246,248,255,0.9)' }

          return (
            <div>
              {/* Step bar */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
                {STEP_LABELS.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flex: 1 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: i < step ? '#0058BC' : i === step ? '#0058BC' : 'rgba(193,198,215,0.3)', color: i <= step ? '#fff' : '#717786', border: i === step ? '2px solid #0058BC' : 'none', transition: 'all 200ms' }}>
                        {i < step ? <CheckCircle size={14} /> : i + 1}
                      </div>
                      <div style={{ fontSize: 11.5, color: i <= step ? '#0058BC' : '#A0A5B1', fontWeight: i === step ? 700 : 500, textAlign: 'center' }}>{s}</div>
                    </div>
                    {i < STEP_LABELS.length - 1 && <div style={{ width: 40, height: '1.5px', background: i < step ? '#0058BC' : 'rgba(193,198,215,0.4)', flexShrink: 0, marginBottom: 16, transition: 'background 200ms' }} />}
                  </div>
                ))}
              </div>

              {/* Step 0: select products */}
              {step === 0 && (
                <div>
                  <div style={{ fontSize: 13, color: '#717786', marginBottom: 14 }}>
                    从 <strong style={{ color: '#181C23' }}>{ins?.name ?? coop.insurerShort}</strong> 的产品目录中选择要关联到本合作协议的产品（可多选）
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {AVAILABLE_PRODUCTS.map(p => {
                      const selected = selectedIds.includes(p.id)
                      return (
                        <div key={p.id} onClick={() => toggleProduct(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${selected ? '#0058BC' : 'rgba(193,198,215,0.42)'}`, background: selected ? 'rgba(0,88,188,0.05)' : 'rgba(246,248,255,0.9)', cursor: 'pointer', transition: 'all 150ms' }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${selected ? '#0058BC' : '#C1C6D7'}`, background: selected ? '#0058BC' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selected && <CheckCircle size={12} style={{ color: '#fff' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', marginBottom: 3 }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{p.line}</span>
                              <span style={{ fontSize: 12, color: '#717786' }}>代码 {p.code}</span>
                              <span style={{ fontSize: 12, color: '#717786' }}>可售州：{p.states[0] === 'ALL' ? '全域（在产品管理配置）' : p.states.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, color: '#717786' }}>已选 <strong style={{ color: '#181C23' }}>{selectedIds.length}</strong> 个产品</span>
                    <button className="btn-primary" disabled={selectedIds.length === 0} onClick={() => setStep(1)} style={{ opacity: selectedIds.length === 0 ? 0.5 : 1 }}>下一步</button>
                  </div>
                </div>
              )}

              {/* Step 1: association info */}
              {step === 1 && (
                <div>
                  <div style={{ fontSize: 13, color: '#717786', marginBottom: 16 }}>确认本次关联的生效信息</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>关联产品</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedProducts.map(p => (
                          <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: 'rgba(0,88,188,0.07)', border: '0.5px solid rgba(0,88,188,0.18)', fontSize: 12.5, color: '#0058BC', fontWeight: 500 }}>
                            <Package size={11} />{p.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>合作协议</div>
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(246,248,255,0.9)', border: '0.5px solid rgba(193,198,215,0.42)', fontSize: 13, color: '#181C23', fontWeight: 500 }}>
                        {ins?.name ?? coop.insurerShort} · {coop.contractNo ?? '当前合作协议'}
                        {coop.startDate && coop.endDate && (
                          <span style={{ fontSize: 12, color: '#717786', marginLeft: 8 }}>（{coop.startDate} ～ {coop.endDate}）</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>关联生效日期</div>
                        <input type="date" value={form.effectiveFrom} onChange={e => setForm(f => ({ ...f, effectiveFrom: e.target.value }))} style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>操作人</div>
                        <input value={form.operator} onChange={e => setForm(f => ({ ...f, operator: e.target.value }))} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>备注</div>
                      <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="关联原因、特殊约定等（可选）..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(52,199,89,0.05)', border: '0.5px solid rgba(52,199,89,0.2)', fontSize: 12.5, color: '#1E8033' }}>
                      <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      可售州配置在产品管理模块完成，无需在此配置。
                    </div>
                  </div>
                  <div className="flex items-center justify-between" style={{ marginTop: 20 }}>
                    <button className="btn-ghost" onClick={() => setStep(0)}>上一步</button>
                    <button className="btn-primary" onClick={() => setConfirmed(true)}>
                      <CheckCircle size={13} />确认关联
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }} onClick={() => setShowIntegrationModal(false)}>
            <div style={{ background: 'rgba(246,248,255,0.98)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 660, maxHeight: '88vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowIntegrationModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#717786', padding: 4 }}><X size={18} /></button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 4 }}>产品接入 — 关联产品</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{ins?.name ?? coop.insurerShort} · 将产品关联至当前合作协议</div>
              <IntegrationWizard onClose={() => setShowIntegrationModal(false)} />
            </div>
          </div>
        )
      })()}

      {/* ── 编辑结算配置 Modal ── */}
      {showSettlementEdit && (() => {
        const sc2 = coopSettlement
        function SettlementEditForm({ onClose }: { onClose: () => void }) {
          const [form, setForm] = useState({
            cycle: sc2?.cycle ?? 'Monthly',
            billCutoffDay: String(sc2?.billCutoffDay ?? 25),
            reconcileDays: '15',
            paymentTermDays: String(sc2?.paymentTermDays ?? 30),
            paymentMethod: sc2?.paymentMethod ?? 'ACH',
            currency: sc2?.currency ?? 'USD',
            premiumCollection: sc2?.premiumCollection ?? 'Agency Bill',
            reconciliationContact: sc2?.reconciliationContact ?? '',
            billingFormat: sc2?.billingFormat ?? 'CSV',
            diffDeadlineDays: '15',
            escalateThresholdPct: '5',
            notes: sc2?.notes ?? '',
          })
          const [saved, setSaved] = useState(false)

          const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{label}</div>
              {children}
            </div>
          )
          const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(193,198,215,0.6)', fontSize: 13, outline: 'none', background: 'rgba(246,248,255,0.9)' }
          const selectStyle = { ...inputStyle, appearance: 'none' as const }

          if (saved) return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#1E8033' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181C23', marginBottom: 8 }}>配置已更新</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 28 }}>结算参数已成功保存</div>
              <button className="btn-primary" onClick={onClose}>关闭</button>
            </div>
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0058BC', paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.35)' }}>佣金结算参数</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="结算周期">
                  <select value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))} style={selectStyle}>
                    <option value="Monthly">月结</option>
                    <option value="Quarterly">季结</option>
                    <option value="SemiAnnual">半年结</option>
                  </select>
                </Field>
                <Field label="账单截止日（每月几日）">
                  <input type="number" min={1} max={28} value={form.billCutoffDay} onChange={e => setForm(f => ({ ...f, billCutoffDay: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="对账期限（天）">
                  <input type="number" min={1} value={form.reconcileDays} onChange={e => setForm(f => ({ ...f, reconcileDays: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="付款账期（Net 天数）">
                  <input type="number" min={0} value={form.paymentTermDays} onChange={e => setForm(f => ({ ...f, paymentTermDays: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="付款方式">
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} style={selectStyle}>
                    <option>ACH</option>
                    <option>Wire Transfer</option>
                    <option>Check</option>
                  </select>
                </Field>
                <Field label="结算货币">
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={selectStyle}>
                    <option>USD</option>
                    <option>CAD</option>
                    <option>EUR</option>
                  </select>
                </Field>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E8033', paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.35)' }}>保费归集</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="归集方式">
                  <select value={form.premiumCollection} onChange={e => setForm(f => ({ ...f, premiumCollection: e.target.value }))} style={selectStyle}>
                    <option value="Agency Bill">渠道代收归集</option>
                    <option value="Direct Bill">直付保险公司</option>
                  </select>
                </Field>
                <Field label="对账联系人">
                  <input value={form.reconciliationContact} onChange={e => setForm(f => ({ ...f, reconciliationContact: e.target.value }))} style={inputStyle} />
                </Field>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#AF52DE', paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.35)' }}>对账与账单</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="账单格式">
                  <select value={form.billingFormat} onChange={e => setForm(f => ({ ...f, billingFormat: e.target.value }))} style={selectStyle}>
                    <option>CSV</option>
                    <option>Excel</option>
                    <option>EDI 835</option>
                    <option>PDF</option>
                  </select>
                </Field>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#a05800', paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.35)' }}>差异处理规则</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="差异处理时限（工作日）">
                  <input type="number" min={1} value={form.diffDeadlineDays} onChange={e => setForm(f => ({ ...f, diffDeadlineDays: e.target.value }))} style={inputStyle} />
                </Field>
                <Field label="升级阈值（差异占比 %）">
                  <input type="number" min={0} max={100} value={form.escalateThresholdPct} onChange={e => setForm(f => ({ ...f, escalateThresholdPct: e.target.value }))} style={inputStyle} />
                </Field>
              </div>

              <Field label="备注">
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 4 }}>
                <button className="btn-ghost" onClick={onClose}>取消</button>
                <button className="btn-primary" onClick={() => setSaved(true)}>保存配置</button>
              </div>
            </div>
          )
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }} onClick={() => setShowSettlementEdit(false)}>
            <div style={{ background: 'rgba(246,248,255,0.98)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 660, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowSettlementEdit(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#717786', padding: 4 }}><X size={18} /></button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 4 }}>编辑结算配置</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{ins?.name ?? coop.insurerShort}</div>
              <SettlementEditForm onClose={() => setShowSettlementEdit(false)} />
            </div>
          </div>
        )
      })()}

      {/* ── 添加联系人 Modal ── */}
      {showContactModal && (() => {
        const ROLES = ['Senior Management', 'Underwriting', 'Claims', 'Billing', 'IT/API', 'Legal', 'Marketing']
        const ROLE_CN: Record<string, string> = { 'Senior Management': '高管', 'Underwriting': '核保', 'Claims': '理赔', 'Billing': '结算财务', 'IT/API': 'IT 技术', 'Legal': '法务', 'Marketing': '市场' }
        const TIMEZONES = ['America/New_York (ET)', 'America/Chicago (CT)', 'America/Denver (MT)', 'America/Los_Angeles (PT)', 'America/Phoenix (AZ)']

        function ContactForm({ onClose }: { onClose: () => void }) {
          const [form, setForm] = useState({ name: '', title: '', department: '', role: 'Billing', email: '', phone: '', timezone: 'America/New_York (ET)', preferredContact: 'Email', isPrimary: false, isEscalation: false, notes: '' })
          const [errors, setErrors] = useState<Record<string, string>>({})
          const [saved, setSaved] = useState(false)

          const validate = () => {
            const e: Record<string, string> = {}
            if (!form.name.trim()) e.name = '请输入姓名'
            if (!form.email.trim()) e.email = '请输入邮箱'
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '邮箱格式无效'
            if (!form.phone.trim()) e.phone = '请输入电话'
            setErrors(e)
            return Object.keys(e).length === 0
          }

          const inputStyle = (err?: string) => ({ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${err ? 'rgba(186,26,26,0.6)' : 'rgba(193,198,215,0.6)'}`, fontSize: 13, outline: 'none', background: 'rgba(246,248,255,0.9)' })

          if (saved) return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#1E8033' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181C23', marginBottom: 8 }}>联系人已添加</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 28 }}>{form.name} 已加入联系人列表</div>
              <button className="btn-primary" onClick={onClose}>关闭</button>
            </div>
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>姓名 *</div>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle(errors.name)} placeholder="Full Name" />
                  {errors.name && <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4 }}>{errors.name}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>职务头衔</div>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle()} placeholder="e.g. VP of Finance" />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>部门</div>
                  <input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} style={inputStyle()} placeholder="e.g. Finance & Accounting" />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>职能角色</div>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle(), appearance: 'none' as const }}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_CN[r] ?? r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>邮箱 *</div>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle(errors.email)} placeholder="name@insurer.com" />
                  {errors.email && <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4 }}>{errors.email}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>电话 *</div>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle(errors.phone)} placeholder="+1 (555) 000-0000" />
                  {errors.phone && <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4 }}>{errors.phone}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>时区</div>
                  <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} style={{ ...inputStyle(), appearance: 'none' as const }}>
                    {TIMEZONES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>首选联系方式</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Email', 'Phone', 'WeChat'].map(m => (
                      <div key={m} onClick={() => setForm(f => ({ ...f, preferredContact: m }))} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${form.preferredContact === m ? '#0058BC' : 'rgba(193,198,215,0.42)'}`, background: form.preferredContact === m ? 'rgba(0,88,188,0.06)' : 'transparent', fontSize: 12.5, cursor: 'pointer', textAlign: 'center', fontWeight: form.preferredContact === m ? 700 : 400, color: form.preferredContact === m ? '#0058BC' : '#414755' }}>{m}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.isPrimary} onChange={e => setForm(f => ({ ...f, isPrimary: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#0058BC' }} />
                  <span>设为主要联系人</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.isEscalation} onChange={e => setForm(f => ({ ...f, isEscalation: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#BA1A1A' }} />
                  <span>设为升级联系人</span>
                </label>
              </div>

              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>备注</div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="联系偏好、注意事项等..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(193,198,215,0.6)', fontSize: 13, outline: 'none', resize: 'vertical', background: 'rgba(246,248,255,0.9)' }} />
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 4 }}>
                <button className="btn-ghost" onClick={onClose}>取消</button>
                <button className="btn-primary" onClick={() => { if (validate()) setSaved(true) }}>保存联系人</button>
              </div>
            </div>
          )
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }} onClick={() => setShowContactModal(false)}>
            <div style={{ background: 'rgba(246,248,255,0.98)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 620, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowContactModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#717786', padding: 4 }}><X size={18} /></button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 4 }}>添加联系人</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{ins?.name ?? coop.insurerShort}</div>
              <ContactForm onClose={() => setShowContactModal(false)} />
            </div>
          </div>
        )
      })()}

      {/* ── 发起续约 Modal ── */}
      {showRenewalModal && (() => {
        function RenewalForm({ onClose }: { onClose: () => void }) {
          const calcEndDate = (start: string, term: string) => {
            if (!start) return ''
            const d = new Date(start)
            const years = parseInt(term)
            d.setFullYear(d.getFullYear() + years)
            d.setDate(d.getDate() - 1)
            return d.toISOString().slice(0, 10)
          }
          const defaultStart = coop.endDate
            ? new Date(new Date(coop.endDate).getTime() + 86400000).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10)
          const [form, setForm] = useState({
            newStartDate: defaultStart,
            targetTerm: '1年',
            renewalContact: '',
            accountManager: 'Sarah Chen',
            notes: '',
          })
          const [submitted, setSubmitted] = useState(false)
          const newEndDate = calcEndDate(form.newStartDate, form.targetTerm)
          const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(193,198,215,0.6)', fontSize: 13, outline: 'none', background: 'rgba(246,248,255,0.9)' }

          if (submitted) return (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#1E8033' }} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#181C23', marginBottom: 8 }}>续约已登记</div>
              <div style={{ fontSize: 13, color: '#414755', marginBottom: 4 }}>
                续签期限 <strong style={{ color: '#0058BC' }}>{form.targetTerm}</strong>，新合同有效期
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace", marginBottom: 28 }}>
                {form.newStartDate} ～ {newEndDate}
              </div>
              <button className="btn-primary" onClick={onClose}>完成</button>
            </div>
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 当前合同信息 */}
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(246,248,255,0.9)', border: '0.5px solid rgba(193,198,215,0.42)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#717786', marginBottom: 8 }}>当前合同</div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                  <span style={{ color: '#717786' }}>有效期：<strong style={{ color: '#181C23' }}>{coop.startDate ?? '—'} ～ {coop.endDate ?? '—'}</strong></span>
                  <span style={{ color: '#717786' }}>合同号：<strong style={{ color: '#181C23' }}>{coop.contractNo ?? '—'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>续签期限</div>
                  <select value={form.targetTerm} onChange={e => setForm(f => ({ ...f, targetTerm: e.target.value }))} style={{ ...inputStyle, appearance: 'none' as const }}>
                    {['1年', '2年', '3年', '5年'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>新合同开始日</div>
                  <input type="date" value={form.newStartDate} onChange={e => setForm(f => ({ ...f, newStartDate: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* 新合同期限预览 */}
              {form.newStartDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 9, background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.18)' }}>
                  <span style={{ fontSize: 12.5, color: '#717786' }}>新合同有效期：</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>
                    {form.newStartDate} ～ {newEndDate}
                  </span>
                  <span style={{ fontSize: 12, color: '#717786' }}>（{form.targetTerm}）</span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>对方续约联系人</div>
                  <input value={form.renewalContact} onChange={e => setForm(f => ({ ...f, renewalContact: e.target.value }))} style={inputStyle} placeholder="保险公司对接人姓名" />
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>内部负责人</div>
                  <input value={form.accountManager} onChange={e => setForm(f => ({ ...f, accountManager: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>备注</div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="续约条款变化、特殊约定等..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(193,198,215,0.6)', fontSize: 13, outline: 'none', resize: 'vertical', background: 'rgba(246,248,255,0.9)' }} />
              </div>

              <div className="flex items-center justify-end gap-3" style={{ marginTop: 4 }}>
                <button className="btn-ghost" onClick={onClose}>取消</button>
                <button className="btn-primary" disabled={!form.newStartDate} style={{ opacity: form.newStartDate ? 1 : 0.5 }} onClick={() => setSubmitted(true)}>
                  <RefreshCw size={13} />确认续约
                </button>
              </div>
            </div>
          )
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }} onClick={() => setShowRenewalModal(false)}>
            <div style={{ background: 'rgba(246,248,255,0.98)', borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 580, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowRenewalModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#717786', padding: 4 }}><X size={18} /></button>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 4 }}>发起续约</div>
              <div style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{ins?.name ?? coop.insurerShort} · 合作协议续期</div>
              <RenewalForm onClose={() => setShowRenewalModal(false)} />
            </div>
          </div>
        )
      })()}

      {/* Termination modal */}
      {showTermModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setShowTermModal(false)}>
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '28px 32px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div style={{ fontSize: 17, fontWeight: 700, color: '#BA1A1A', display: 'flex', alignItems: 'center', gap: 8 }}><XCircle size={18} />终止合作</div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowTermModal(false)}><X size={16} /></button>
            </div>
            <TerminationModal insurerName={ins?.name ?? coop.insurerShort} onClose={() => setShowTermModal(false)} onConfirm={() => { setShowTermModal(false); onBack() }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function CooperationView({ navigateTo }: Props) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [jumpInput, setJumpInput] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [showTermModal, setShowTermModal] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(null) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeCoops = cooperations.filter(c => c.status === 'Active')
  const urgentRenewals = renewalItems.filter(r => r.daysLeft <= 60 && r.status !== 'renewed')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cooperations.filter(c => {
      const ins = insurers.find(i => i.id === c.insurerId)
      const derived = deriveCoopStatus(c)
      const matchSearch = !q || ins?.name.toLowerCase().includes(q) || ins?.shortName.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.scope.some(s => s.toLowerCase().includes(q))
      let matchStatus = filterStatus === 'all'
      if (!matchStatus) {
        if (filterStatus === 'Active') matchStatus = derived === 'Active'
        else if (filterStatus === 'Expiring') matchStatus = derived === 'Expiring' || derived === 'Expired'
        else matchStatus = derived === filterStatus
      }
      const matchType = filterType === 'all' || c.type === filterType
      return matchSearch && matchStatus && matchType
    })
  }, [search, filterStatus, filterType])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => { setPage(1) }, [search, filterStatus, filterType, pageSize])

  const detailCoop = detailId ? cooperations.find(c => c.id === detailId) : null

  if (detailCoop) {
    return <CoopDetailPage coop={detailCoop} onBack={() => setDetailId(null)} navigateTo={navigateTo} />
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>合作管理</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {activeCoops.length} 家履行中 · {cooperations.filter(c => c.status === 'Terminated').length} 家已终止 · {urgentRenewals.length > 0 ? `${urgentRenewals.length} 项续约待处理` : '续约正常'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {urgentRenewals.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(186,26,26,0.08)', border: '0.5px solid rgba(186,26,26,0.2)', fontSize: 12.5, color: '#BA1A1A', fontWeight: 500 }}>
              <AlertTriangle size={13} />{urgentRenewals.length} 项续约紧急
            </div>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowNewModal(true)}>
            <Plus size={14} />新建合作
          </button>
        </div>
      </div>

      {/* KPI strip */}
      {(() => {
        const expiringCount = cooperations.filter(c => { const d = deriveCoopStatus(c); return d === 'Expiring' || d === 'Expired' }).length
        const pendingCount = cooperations.filter(c => c.status === 'Negotiating' || c.status === 'PendingSign' || c.status === 'Signed').length
        const terminatedCount = cooperations.filter(c => c.status === 'Terminated').length
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '履行中',    count: activeCoops.length, color: '#1E8033', bg: 'rgba(52,199,89,0.08)', border: 'rgba(52,199,89,0.22)' },
              { label: '待签约/签约', count: pendingCount, color: '#0058BC', bg: 'rgba(0,88,188,0.08)', border: 'rgba(0,88,188,0.22)' },
              { label: '到期预警',  count: expiringCount, color: expiringCount > 0 ? '#C0392B' : '#1E8033', bg: expiringCount > 0 ? 'rgba(255,59,48,0.08)' : 'rgba(52,199,89,0.08)', border: expiringCount > 0 ? 'rgba(255,59,48,0.22)' : 'rgba(52,199,89,0.22)' },
              { label: '已终止',    count: terminatedCount, color: '#717786', bg: 'rgba(193,198,215,0.12)', border: 'rgba(193,198,215,0.3)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px 20px', borderRadius: 14, background: s.bg, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
                <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Search & filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="relative" style={{ flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            className="input-glass w-full"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder="搜索保险公司名称、合作类型、险种…"
            value={search}
            onChange={e => { setSearch(e.target.value) }}
          />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">全部状态</option>
          <option value="Negotiating">洽谈中</option>
          <option value="PendingSign">待签约</option>
          <option value="Signed">已签约</option>
          <option value="Active">履行中</option>
          <option value="Expiring">到期预警</option>
          <option value="Terminated">已终止</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">全部类型</option>
          {COOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* List */}
      <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'rgba(246,248,255,0.9)', borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
              {['保险公司', '合作类型', '业务范围', '合作期限', '负责人', '状态', '操作'].map((h, i) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap', width: i === 6 ? 80 : undefined }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#A0A5B1', fontSize: 13 }}>未找到匹配的合作记录</td></tr>
            )}
            {pageItems.map((coop, i) => {
              const ins = insurers.find(x => x.id === coop.insurerId)
              const derived = deriveCoopStatus(coop)
              const sc = COOP_STATUS[derived]
              const canEditRow = coop.status === 'Negotiating' || coop.status === 'PendingSign' ||
                (coop.status === 'Signed' && coop.startDate && new Date(coop.startDate) > new Date())
              const canDeleteRow = coop.status === 'Negotiating' || coop.status === 'PendingSign'
              const canTerminateRow = coop.status === 'Active' || coop.status === 'Signed' || derived === 'Expiring' || derived === 'Expired'
              return (
                <tr
                  key={coop.id}
                  onClick={() => setDetailId(coop.id)}
                  style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)', cursor: 'pointer', transition: 'background 120ms' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,88,188,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)')}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                        {coop.insurerShort.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{coop.insurerShort}</div>
                        <div style={{ fontSize: 11.5, color: '#717786' }}>{ins?.naicCode}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#414755', fontSize: 12.5 }}>{coop.type}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex flex-wrap gap-1">
                      {coop.scope.slice(0, 3).map(s => (
                        <span key={s} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(0,88,188,0.07)', color: '#0058BC', border: '0.5px solid rgba(0,88,188,0.15)' }}>{s}</span>
                      ))}
                      {coop.scope.length > 3 && <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(193,198,215,0.15)', color: '#717786' }}>+{coop.scope.length - 3}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#414755', fontFamily: "'JetBrains Mono', monospace" }}>
                    {coop.startDate ? coop.startDate.slice(0, 7) : '—'} ～ {coop.endDate ? coop.endDate.slice(0, 7) : '永久'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#414755' }}>{coop.accountManager || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="flex items-center gap-1.5">
                      <span className={`orb ${sc.orb}`} />
                      <span className={`badge ${sc.cls}`} style={{ fontSize: 11 }}>{sc.label}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-0.5" ref={menuOpen === coop.id ? menuRef : undefined}>
                      <button className="btn-ghost" style={{ padding: 5 }} title="查看" onClick={() => setDetailId(coop.id)}>
                        <Eye size={14} />
                      </button>
                      {canEditRow && (
                        <button className="btn-ghost" style={{ padding: 5 }} title="编辑" onClick={() => setDetailId(coop.id)}>
                          <Edit2 size={14} />
                        </button>
                      )}
                      <div style={{ position: 'relative' }}>
                        <button className="btn-ghost" style={{ padding: 5, background: menuOpen === coop.id ? 'rgba(0,88,188,0.08)' : undefined }} title="更多操作" onClick={() => setMenuOpen(menuOpen === coop.id ? null : coop.id)}>
                          <MoreHorizontal size={14} />
                        </button>
                        {menuOpen === coop.id && (
                          <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(193,198,215,0.5)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 130, overflow: 'hidden' }}>
                            {canTerminateRow && (
                              <button className="btn-ghost" style={{ width: '100%', padding: '9px 14px', fontSize: 12.5, justifyContent: 'flex-start', borderRadius: 0, gap: 8, color: '#BA1A1A' }} onClick={() => { setMenuOpen(null); setShowTermModal(coop.id) }}>
                                <XCircle size={13} />终止合作
                              </button>
                            )}
                            {canDeleteRow ? (
                              <button className="btn-ghost" style={{ width: '100%', padding: '9px 14px', fontSize: 12.5, justifyContent: 'flex-start', borderRadius: 0, gap: 8, color: '#BA1A1A', borderTop: '0.5px solid rgba(193,198,215,0.3)' }} onClick={() => setMenuOpen(null)}>
                                <Trash2 size={13} />删除
                              </button>
                            ) : (
                              <button disabled style={{ width: '100%', padding: '9px 14px', fontSize: 12.5, justifyContent: 'flex-start', borderRadius: 0, gap: 8, color: '#A0A5B1', background: 'none', border: 'none', cursor: 'not-allowed', display: 'flex', alignItems: 'center', borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
                                <Trash2 size={13} />删除
                              </button>
                            )}
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
      </div>

      {/* Pagination bar — always shown inside the table card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: '0.5px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.7)' }}>
        {/* Left: total + page size */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 12.5, color: '#717786' }}>共 {filtered.length} 条</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            style={{ fontSize: 12.5, padding: '3px 8px', borderRadius: 7, border: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.8)', color: '#414755', cursor: 'pointer' }}
          >
            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} 条/页</option>)}
          </select>
        </div>
        {/* Center: page buttons */}
        <div className="flex items-center gap-1">
          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === 1 ? 0.35 : 1 }} disabled={safePage === 1} onClick={() => setPage(1)}>«</button>
          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === 1 ? 0.35 : 1 }} disabled={safePage === 1} onClick={() => setPage(p => p - 1)}>‹ 上一页</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | '…')[]>((acc, p, idx, arr) => {
              if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…')
              acc.push(p); return acc
            }, [])
            .map((p, idx) =>
              p === '…'
                ? <span key={`e${idx}`} style={{ padding: '0 4px', fontSize: 12.5, color: '#A0A5B1' }}>…</span>
                : <button key={p} onClick={() => setPage(p as number)} style={{ minWidth: 28, height: 28, borderRadius: 7, fontSize: 12.5, fontWeight: safePage === p ? 700 : 400, background: safePage === p ? '#0058BC' : 'transparent', color: safePage === p ? '#fff' : '#414755', border: safePage === p ? 'none' : '0.5px solid rgba(193,198,215,0.4)', cursor: 'pointer' }}>{p}</button>
            )
          }
          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === totalPages ? 0.35 : 1 }} disabled={safePage === totalPages} onClick={() => setPage(p => p + 1)}>下一页 ›</button>
          <button className="btn-ghost" style={{ padding: '4px 9px', fontSize: 12.5, opacity: safePage === totalPages ? 0.35 : 1 }} disabled={safePage === totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
        {/* Right: jump to page */}
        <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#717786' }}>
          跳至
          <input
            type="number" min={1} max={totalPages} value={jumpInput}
            onChange={e => setJumpInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { const n = Math.max(1, Math.min(totalPages, Number(jumpInput))); if (!isNaN(n)) { setPage(n); setJumpInput('') } } }}
            style={{ width: 44, fontSize: 12.5, textAlign: 'center', padding: '3px 6px', borderRadius: 7, border: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(255,255,255,0.8)', color: '#414755' }}
            placeholder="页"
          />
          页
        </div>
      </div>

      {/* Termination modal (from list "更多") */}
      {showTermModal && (() => {
        const tc = cooperations.find(c => c.id === showTermModal)
        const tins = tc ? insurers.find(i => i.id === tc.insurerId) : null
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setShowTermModal(null)}>
            <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '28px 32px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div style={{ fontSize: 17, fontWeight: 700, color: '#BA1A1A', display: 'flex', alignItems: 'center', gap: 8 }}><XCircle size={18} />终止合作</div>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowTermModal(null)}><X size={16} /></button>
              </div>
              <TerminationModal insurerName={tins?.name ?? tc?.insurerShort ?? ''} onClose={() => setShowTermModal(null)} onConfirm={() => setShowTermModal(null)} />
            </div>
          </div>
        )
      })()}

      {/* New cooperation modal */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} onClick={() => setShowNewModal(false)}>
          <div style={{ background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '28px 32px', width: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>新建合作关系</div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowNewModal(false)}><X size={16} /></button>
            </div>
            <NewCoopModal
              onClose={() => setShowNewModal(false)}
              onSaved={() => { setShowNewModal(false); setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            />
          </div>
        </div>
      )}

      {/* Save success toast */}
      {saved && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 300, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(30,128,51,0.95)', color: '#fff', fontSize: 13.5, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <CheckCircle size={16} />合作记录已成功入库
        </div>
      )}
    </div>
  )
}
