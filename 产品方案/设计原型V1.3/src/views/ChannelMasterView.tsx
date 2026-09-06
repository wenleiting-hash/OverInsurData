import { useState, useRef } from 'react'
import {
  Search, Plus, Edit2, Eye, Upload, Download, Filter,
  X, Check, Building2, User, Users, Loader2,
  Shield, History, Phone, Mail, MapPin, Globe,
  AlertTriangle, FileText, CheckCircle2, Clock,
  FileMinus, FileX, FileCheck, ChevronRight,
  MoreHorizontal, RefreshCw, Link2, ArrowUpDown,
  ArrowUp, ArrowDown, XCircle, AlertCircle, Star,
  TrendingUp, TrendingDown, Activity, Zap,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'
import {
  channelOrgs, channelAgents, qualDocs, changeHistory,
  sampleImportResult, masterStats,
  ORG_TYPE_LABEL, ORG_TYPE_COLOR, ORG_STATUS_STYLE,
  AGENT_STATUS_STYLE, ROLE_LABEL,
  DOC_STATUS_STYLE, DOC_CATEGORY_LABEL, CHANGE_TYPE_STYLE,
  type ChannelOrg, type ChannelAgent, type QualDoc,
  type OrgStatus, type AgentStatus,
} from '../data/channelMasterData'

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)', greenBorder: 'rgba(52,199,89,0.25)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)', redBorder: 'rgba(255,59,48,0.22)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2', purpleBg: 'rgba(123,63,202,0.09)',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
  bg: 'rgba(249,249,255,0.45)',
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

function fmt(n: number) { return n === 0 ? '—' : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K` }
function pct(n: number, decimals = 1) { return n === 0 ? '—' : `${(n * 100).toFixed(decimals)}%` }
function lossColor(r: number) { return r === 0 ? C.muted : r > 0.65 ? C.red : r > 0.60 ? C.amber : C.green }
function renewColor(r: number) { return r === 0 ? C.muted : r >= 0.90 ? C.green : r >= 0.85 ? C.amber : C.red }

// ─────────────────────────────────────────────────────────────────────────────
// Inline EN labels for Chinese strings sourced from channelMasterData
// (i18n dictionary intentionally not extended; zh text kept verbatim)
// ─────────────────────────────────────────────────────────────────────────────

const ZH_EN: Record<string, string> = {
  // statuses
  '正常': 'Active', '在职': 'Active', '未激活': 'Inactive', '已暂停': 'Suspended',
  '待审批': 'Pending', '已离职': 'Terminated',
  // org types
  '代理机构': 'Agency', '分支机构': 'Branch', '子代理': 'Sub-agent',
  // roles
  '代理人': 'Agent', '高级代理人': 'Senior Agent', '业务经理': 'Agency Manager', '负责人': 'Principal',
  // doc statuses
  '有效': 'Valid', '已过期': 'Expired', '即将到期': 'Expiring Soon', '缺失': 'Missing', '待审核': 'Pending Review',
  // doc categories
  '保险执照': 'Insurance License', 'E&O证书': 'E&O Certificate', 'W-9税务': 'W-9 Tax Form',
  '合同协议': 'Contract Agreement', '背景调查': 'Background Check', '培训证书': 'Training Certificate',
  '公司注册': 'Articles of Incorporation', '其他': 'Other',
  // change types
  '新增': 'Created', '编辑': 'Edited', '状态变更': 'Status Change', '文件上传': 'Document Upload',
  '批量导入': 'Bulk Import', '关系变更': 'Relationship Change',
  // org tags
  '白标合作': 'White-label Partner', 'API接入': 'API Integration', '高绩效': 'Top Performer',
  '高出单量': 'High Volume', '白标Draft': 'White-label Draft', '稳健增长': 'Steady Growth',
  '赔付率偏高': 'High Loss Ratio', '合规问题': 'Compliance Issue', '暂停出单': 'Writing Suspended',
  '快速增长': 'Fast Growth', 'GA合作': 'GA Partner', '新晋高绩效': 'New Top Performer',
}

function enLabel(lang: string, zh: string): string {
  return lang === 'en' ? (ZH_EN[zh] ?? zh) : zh
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitive components
// ─────────────────────────────────────────────────────────────────────────────

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      border: `0.5px solid ${C.borderMid}`, borderRadius: 14,
      boxShadow: '0 2px 12px rgba(0,58,152,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function Badge({ label, color = C.muted, bg = 'rgba(193,198,215,0.18)', dot, xs }: {
  label: string; color?: string; bg?: string; dot?: string; xs?: boolean
}) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: xs ? '1px 6px' : '2px 8px', borderRadius: 6,
      fontSize: xs ? 10 : 11, fontWeight: 700, color, background: bg,
      whiteSpace: 'nowrap', lineHeight: 1.5,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      {label}
    </span>
  )
}

function StatBar({ value, color, max = 1 }: { value: number; color: string; max?: number }) {
  const w = Math.min(100, (value / max) * 100)
  return (
    <div style={{ height: 3, background: 'rgba(193,198,215,0.25)', borderRadius: 2, overflow: 'hidden', marginTop: 3 }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function KpiTile({ label, value, color, sub, bar, maxBar }:
  { label: string; value: string; color: string; sub?: string; bar?: number; maxBar?: number }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ ...mono, fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {bar !== undefined && <StatBar value={bar} color={color} max={maxBar ?? 1} />}
      {sub && <div style={{ fontSize: 10.5, color: C.mutedLight, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function Divider({ m = 4 }: { m?: number }) {
  return <div style={{ height: '0.5px', background: C.border, margin: `${m}px 0` }} />
}

function SectionHead({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 0 4px', marginBottom: 2 }}>
      {icon && <span style={{ color: C.mutedLight }}>{icon}</span>}
      <span style={{ fontSize: 10.5, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
    </div>
  )
}

function FieldRow({ label, value, mono: isMono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `0.5px solid ${C.border}`, gap: 12 }}>
      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{label}</span>
      <span style={{ ...(isMono ? mono : {}), fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

function IconBtn({ icon, onClick, title, color }: { icon: React.ReactNode; onClick?: () => void; title?: string; color?: string }) {
  return (
    <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', color: color ?? C.muted, padding: '4px 5px', lineHeight: 1, borderRadius: 6, transition: 'background 0.12s' }}>
      {icon}
    </button>
  )
}

function PrimaryBtn({ children, onClick, sm, danger }: { children: React.ReactNode; onClick?: () => void; sm?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: sm ? '5px 12px' : '7px 16px', borderRadius: 8,
      fontSize: sm ? 12 : 13, fontWeight: 700,
      background: danger ? C.red : C.primary, color: '#fff',
      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function GhostBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: sm ? '4px 10px' : '6px 12px', borderRadius: 8,
      fontSize: sm ? 11.5 : 12.5, fontWeight: 600, color: C.textSoft,
      background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`,
      cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge helpers
// ─────────────────────────────────────────────────────────────────────────────

function OrgStatusBadge({ s }: { s: OrgStatus }) {
  const { lang } = useLang()
  const m = ORG_STATUS_STYLE[s]
  const dot = s === 'active' ? C.green : s === 'suspended' ? C.red : s === 'pending' ? C.amber : C.muted
  return <Badge label={enLabel(lang, m.label)} color={m.color} bg={m.bg} dot={dot} />
}

function AgentStatusBadge({ s }: { s: AgentStatus }) {
  const { lang } = useLang()
  const m = AGENT_STATUS_STYLE[s]
  const dot = s === 'active' ? C.green : s === 'suspended' || s === 'terminated' ? C.red : s === 'pending' ? C.amber : C.muted
  return <Badge label={enLabel(lang, m.label)} color={m.color} bg={m.bg} dot={dot} />
}

function DocStatusIcon({ s }: { s: string }) {
  if (s === 'valid') return <CheckCircle2 size={13} color={C.green} />
  if (s === 'expired') return <FileX size={13} color={C.red} />
  if (s === 'expiring-soon') return <FileMinus size={13} color={C.amber} />
  if (s === 'pending-review') return <Clock size={13} color={C.primary} />
  return <AlertCircle size={13} color={C.red} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared table styles
// ─────────────────────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em',
  background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`,
  whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = {
  padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`,
  verticalAlign: 'middle', fontSize: 12.5,
}

function SortTH({ label, sortKey, active, dir, onSort }: {
  label: string; sortKey: string; active: boolean; dir: 'asc' | 'desc'; onSort: (k: string) => void
}) {
  return (
    <th style={{ ...TH, cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(sortKey)}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: active ? C.primary : C.mutedLight }}>
        {label}
        {active ? (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowUpDown size={10} style={{ opacity: 0.3 }} />}
      </span>
    </th>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter sidebar
// ─────────────────────────────────────────────────────────────────────────────

function FilterRail({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: 176, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {children}
    </div>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <GlassCard style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>{label}</div>
      {children}
    </GlassCard>
  )
}

function FilterOption({ label, count, active, color, onClick }: {
  label: string; count: number; active: boolean; color?: string; onClick: () => void
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '5px 7px', borderRadius: 7, border: 'none', cursor: 'pointer',
      background: active ? (color ? `${color}12` : C.primaryLight) : 'transparent',
      color: active ? (color ?? C.primary) : C.textSoft,
      fontSize: 12.5, fontWeight: active ? 700 : 500, transition: 'all 0.1s',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />}
        {label}
      </span>
      <span style={{ ...mono, fontSize: 11, color: active ? (color ?? C.primary) : C.mutedLight, fontWeight: 700 }}>{count}</span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Status change modal  (with impact preview)
// ─────────────────────────────────────────────────────────────────────────────

function StatusModal({ entity, entityType, onClose }: {
  entity: ChannelOrg | ChannelAgent; entityType: 'org' | 'agent'; onClose: () => void
}) {
  const { t, lang } = useLang()
  const [newStatus, setNewStatus] = useState<string>('active')
  const [reason, setReason] = useState('')
  const [subAgentAction, setSubAgentAction] = useState<'suspend' | 'transfer'>('suspend')
  const name = (entity as ChannelOrg).name ?? (entity as ChannelAgent).displayName
  const options = entityType === 'org'
    ? Object.entries(ORG_STATUS_STYLE)
    : Object.entries(AGENT_STATUS_STYLE)

  const isDestructive = newStatus === 'suspended' || newStatus === 'terminated'
  const orgAgentCount = entityType === 'org' ? (entity as ChannelOrg).agentCount ?? 0 : 0

  // Mock impact data
  const impact = isDestructive ? {
    policies: entityType === 'org' ? orgAgentCount * 12 : 8,
    commission: entityType === 'org' ? orgAgentCount * 14800 : 6200,
  } : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <GlassCard style={{ width: 480, maxHeight: '90vh', overflowY: 'auto', background: C.surfaceHigh, borderRadius: 18, padding: '26px 28px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>{t.statusModalTitle}</h3>
          <IconBtn icon={<X size={15} />} onClick={onClose} />
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 9, background: C.primaryLight, border: `0.5px solid ${C.primaryBorder}`, fontSize: 12.5, color: C.text, marginBottom: 16, fontWeight: 600 }}>
          {name}
        </div>

        {/* Status selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>{t.statusNewStatus}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {options.map(([k, v]) => (
              <button key={k} onClick={() => setNewStatus(k)} style={{
                padding: '5px 13px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                background: newStatus === k ? C.primary : 'rgba(255,255,255,0.5)',
                color: newStatus === k ? '#fff' : C.textSoft,
                border: `0.5px solid ${newStatus === k ? C.primary : C.border}`,
              }}>{enLabel(lang, (v as any).label)}</button>
            ))}
          </div>
        </div>

        {/* Impact preview — only shown for destructive actions */}
        {impact && (
          <div style={{ marginBottom: 14, borderRadius: 10, border: `0.5px solid ${C.redBorder}`, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', background: C.redBg, borderBottom: `0.5px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={12} color={C.red} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.red }}>{lang === 'en' ? 'Impact Preview' : '影响范围预览'}</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,59,48,0.03)', display: 'grid', gridTemplateColumns: entityType === 'org' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
              {entityType === 'org' && (
                <div style={{ textAlign: 'center' as const }}>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.red }}>{orgAgentCount}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lang === 'en' ? 'Affected Agents' : '受影响代理人'}</div>
                </div>
              )}
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.amber }}>{impact.policies}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lang === 'en' ? 'Policies in Flight' : '在途保单'}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: C.amber }}>${(impact.commission / 1000).toFixed(0)}K</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lang === 'en' ? 'Outstanding Commission' : '未结佣金'}</div>
              </div>
            </div>
            {entityType === 'org' && orgAgentCount > 0 && (
              <div style={{ padding: '10px 12px', borderTop: `0.5px solid ${C.redBorder}`, background: 'rgba(255,59,48,0.03)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 8 }}>{lang === 'en' ? 'Handling of affiliated agents' : '下属代理人处理方式'}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([['suspend','随组织停用','Suspend with organization'],['transfer','转移到其他组织','Transfer to another organization']] as const).map(([v, zh, en]) => (
                    <button key={v} onClick={() => setSubAgentAction(v)} style={{ flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: subAgentAction === v ? C.primaryLight : 'rgba(255,255,255,0.5)', color: subAgentAction === v ? C.primary : C.textSoft, border: `0.5px solid ${subAgentAction === v ? C.primaryBorder : C.border}` }}>{lang === 'en' ? en : zh}</button>
                  ))}
                </div>
                {subAgentAction === 'transfer' && (
                  <div style={{ marginTop: 8 }}>
                    <select style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 12.5, background: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', outline: 'none' }}>
                      <option value="">{lang === 'en' ? 'Select target organization…' : '选择目标机构…'}</option>
                      {channelOrgs.filter(o => o.id !== entity.id).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {isDestructive && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: C.redBg, border: `0.5px solid ${C.redBorder}`, fontSize: 12, color: '#8B1A1A', marginBottom: 14 }}>
            {entityType === 'org' ? t.statusSuspendWarningOrg : t.statusSuspendWarningAgent}
          </div>
        )}

        {/* Reason (required) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
            {t.statusReason} <span style={{ color: C.red }}>*</span>
            <span style={{ fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{lang === 'en' ? 'Reason required (logged to audit trail)' : '（必须填写原因，记入审计日志）'}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 7 }}>
            {(isDestructive
              ? [['业务终止', 'Business Termination'], ['合规问题', 'Compliance Issue'], ['牌照过期', 'License Expired'], ['主动退出', 'Voluntary Exit'], ['违规处理', 'Violation Action']]
              : [['信息补充完整', 'Information Completed'], ['审核通过', 'Review Approved'], ['牌照已更新', 'License Renewed'], ['休假结束', 'Return from Leave']]
            ).map(([r, en]) => (
              <button key={r} onClick={() => setReason(r)} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontWeight: reason === r ? 700 : 500, background: reason === r ? C.primaryLight : 'rgba(255,255,255,0.5)', color: reason === r ? C.primary : C.textSoft, border: `0.5px solid ${reason === r ? C.primaryBorder : C.border}` }}>{lang === 'en' ? en : r}</button>
            ))}
          </div>
          <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
            placeholder={t.statusReasonPlaceholder}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <GhostBtn onClick={onClose}>{t.formCancel}</GhostBtn>
          <PrimaryBtn onClick={onClose} danger={isDestructive}>
            <Check size={13} />
            {isDestructive ? (lang === 'en' ? 'Submit for Approval' : '提交审批') : t.formConfirm}
          </PrimaryBtn>
        </div>
        {isDestructive && (
          <div style={{ textAlign: 'center' as const, fontSize: 11, color: C.mutedLight, marginTop: 8 }}>{lang === 'en' ? 'Suspension/termination takes effect after supervisor approval' : '停用/终止操作需要主管审批后生效'}</div>
        )}
      </GlassCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Org Form Modal  (3-step)
// ─────────────────────────────────────────────────────────────────────────────

function OrgFormModal({ mode, org, onClose }: { mode: 'create' | 'edit'; org?: ChannelOrg; onClose: () => void }) {
  const { t, lang } = useLang()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [whiteLabelOn, setWhiteLabelOn] = useState(false)
  const [orgType, setOrgType] = useState<string>(org?.type ?? 'agency')
  const totalSteps = 4
  const doSave = (draft?: boolean) => { setSaving(true); setTimeout(() => { setSaving(false); onClose() }, 1100) }

  const steps = [
    { label: lang === 'en' ? 'Basic Information' : '基本信息', sub: lang === 'en' ? 'Type · Name · NPN' : '类型 · 名称 · NPN' },
    { label: lang === 'en' ? 'HQ & Contact' : '总部 & 联系', sub: lang === 'en' ? 'Address · Contact' : '地址 · 联系人' },
    { label: lang === 'en' ? 'Business Setup' : '业务配置', sub: lang === 'en' ? 'Lines · Licensed States' : '险种 · 持牌州' },
    { label: lang === 'en' ? 'Qualifications & Submit' : '资质 & 提交', sub: lang === 'en' ? 'Documents · Review' : '文件 · 审核' },
  ]
  const STATES = ['CA','TX','NY','FL','IL','WA','OR','NV','CO','GA','OH','PA','NJ','CT','MA','AZ','NC','VA','TN','MO']

  // Shared field component using global input-glass class
  const Fld = ({ label, defaultValue, span, isMono, required, hint }: {
    label: string; defaultValue: string; span?: number; isMono?: boolean; required?: boolean; hint?: string
  }) => (
    <div style={{ gridColumn: span === 2 ? '1/-1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
        {label}
        {required && <span style={{ color: C.red, fontSize: 13, lineHeight: 1 }}>*</span>}
        {hint && <span style={{ fontWeight: 400, fontSize: 11.5, color: C.mutedLight }}>{hint}</span>}
      </label>
      <input
        type="text"
        defaultValue={defaultValue}
        className="input-glass w-full"
        style={isMono ? mono : undefined}
      />
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(14,18,28,0.52)',
      backdropFilter: 'blur(8px) saturate(1.2)',
      WebkitBackdropFilter: 'blur(8px) saturate(1.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: 640, maxHeight: '92vh', overflowY: 'auto',
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        borderRadius: 20,
        border: '0.5px solid rgba(255,255,255,0.72)',
        boxShadow: '0 32px 80px rgba(0,22,64,0.22), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header with subtle blue tint ── */}
        <div style={{
          padding: '22px 28px 18px',
          background: 'linear-gradient(160deg, rgba(0,88,188,0.05) 0%, rgba(255,255,255,0) 60%)',
          borderBottom: `0.5px solid ${C.border}`,
          borderRadius: '20px 20px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                background: 'linear-gradient(135deg, #0058BC 0%, #0070EB 100%)',
                boxShadow: '0 4px 12px rgba(0,88,188,0.30)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Building2 size={18} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>
                  {mode === 'create' ? t.formNewOrg : t.formEditOrg(org?.shortName ?? '')}
                </h2>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 3, fontWeight: 400 }}>
                  {lang === 'en' ? 'Step' : '步骤'} {step} / {totalSteps} · {steps[step - 1].sub}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(193,198,215,0.18)', border: 'none', cursor: 'pointer', color: C.muted, padding: 6, lineHeight: 1, borderRadius: 8, transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(186,26,26,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(193,198,215,0.18)')}>
              <X size={15} />
            </button>
          </div>

          {/* ── Step progress ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 20, position: 'relative' }}>
            {/* Track line */}
            <div style={{ position: 'absolute', top: 13, left: 13, right: 13, height: 1.5, background: 'rgba(193,198,215,0.5)', zIndex: 0 }}>
              <div style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.primary}, #0070EB)`, transition: 'width 0.35s cubic-bezier(.4,0,.2,1)', borderRadius: 2 }} />
            </div>
            {steps.map((s, i) => {
              const state = i + 1 < step ? 'done' : i + 1 === step ? 'active' : 'upcoming'
              return (
                <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: state === 'done' ? C.primary : state === 'active' ? '#fff' : '#fff',
                    border: state === 'done' ? `2px solid ${C.primary}` : state === 'active' ? `2.5px solid ${C.primary}` : `1.5px solid rgba(193,198,215,0.7)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: state === 'active' ? `0 0 0 4px rgba(0,88,188,0.12), 0 2px 6px rgba(0,88,188,0.18)` : state === 'done' ? '0 1px 4px rgba(0,88,188,0.2)' : 'none',
                    transition: 'all 0.25s ease',
                  }}>
                    {state === 'done'
                      ? <Check size={13} color="#fff" strokeWidth={2.5} />
                      : <span style={{ ...mono, fontSize: 11, fontWeight: 800, color: state === 'active' ? C.primary : C.mutedLight }}>{i + 1}</span>
                    }
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11.5, fontWeight: state === 'active' ? 700 : 500, color: state !== 'upcoming' ? C.primary : C.mutedLight, whiteSpace: 'nowrap', lineHeight: 1.2 }}>{s.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Form body ── */}
        <div style={{ padding: '22px 28px', flex: 1, overflowY: 'auto' }}>

          {/* Step 1: 基本信息 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Org type selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  {lang === 'en' ? 'Organization Type' : '组织类型'} <span style={{ color: C.red }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => {
                    const selected = orgType === k
                    const tc = ORG_TYPE_COLOR[k as keyof typeof ORG_TYPE_COLOR]
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setOrgType(k)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                          fontSize: 13, fontWeight: selected ? 700 : 500,
                          background: selected ? `${tc}14` : 'rgba(255,255,255,0.6)',
                          color: selected ? tc : C.textSoft,
                          border: `1px solid ${selected ? `${tc}50` : 'rgba(193,198,215,0.7)'}`,
                          boxShadow: selected ? `0 1px 4px ${tc}20` : 'none',
                          transition: 'all 0.14s',
                        }}
                      >
                        {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: tc, flexShrink: 0 }} />}
                        {enLabel(lang, v)}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Fld label={lang === 'en' ? 'Full Organization Name' : '组织全称'} defaultValue={org?.name ?? ''} span={2} required />
                <Fld label={lang === 'en' ? 'Short Name' : '简称'} defaultValue={org?.shortName ?? ''} required />
                <Fld label={lang === 'en' ? 'Brand Name' : '品牌名称'} defaultValue="" hint={lang === 'en' ? '(customer-facing)' : '（对外展示用）'} />
                <Fld label={lang === 'en' ? 'Year Founded' : '成立年份'} defaultValue="" isMono />
                <Fld label={t.formFieldNpn} defaultValue={org?.npn ?? ''} isMono required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Legal Entity Type' : '法律实体类型'}</label>
                  <select defaultValue="LLC" className="input-glass w-full">
                    {['LLC','Corporation (C-Corp)','Corporation (S-Corp)','Partnership','Sole Proprietorship','Non-Profit'].map(e => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <Fld label={lang === 'en' ? 'EIN Tax ID' : 'EIN 税号'} defaultValue={org?.taxId ?? ''} isMono />
              </div>
            </div>
          )}

          {/* Step 2: 总部 & 联系 */}
          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Fld label={lang === 'en' ? 'Primary Contact' : '主要联系人'} defaultValue={org?.managerName ?? ''} span={2} />
              <Fld label={lang === 'en' ? 'Email Address' : '邮箱地址'} defaultValue={org?.email ?? ''} required />
              <Fld label={lang === 'en' ? 'Phone Number' : '电话号码'} defaultValue={org?.phone ?? ''} />
              <Fld label={lang === 'en' ? 'Website' : '官网'} defaultValue={org?.website ?? ''} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Home State' : '所在州'} <span style={{ color: C.red }}>*</span></label>
                <select defaultValue={org?.state ?? 'CA'} className="input-glass w-full">
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <Fld label={lang === 'en' ? 'Street Address' : '详细地址'} defaultValue={org?.address ?? ''} span={2} />
              <Fld label={lang === 'en' ? 'City' : '城市'} defaultValue={org?.city ?? ''} />
              <Fld label={lang === 'en' ? 'ZIP Code' : '邮编'} defaultValue={org?.zip ?? ''} isMono />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Parent Organization (FMO / GA)' : '上级机构（FMO / 总代）'}</label>
                <select defaultValue={org?.parentOrgId ?? ''} className="input-glass w-full">
                  <option value="">{t.formParentNone}</option>
                  {channelOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <Fld label={lang === 'en' ? 'Contract No.' : '合同编号'} defaultValue={org?.contractId ?? ''} isMono />
            </div>
          )}

          {/* Step 3: 业务配置 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Primary Lines of Business' : '主营业务线'}</label>
                  <select className="input-glass w-full">
                    {(lang === 'en'
                      ? ['P&C (Property & Casualty)','Life','Health','Commercial','Multi-line']
                      : ['P&C（财产险）','Life（人寿险）','Health（健康险）','Commercial（商业险）','Multi-line']
                    ).map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <Fld label={lang === 'en' ? 'Number of Employees' : '员工人数'} defaultValue="" />
                <Fld label={lang === 'en' ? 'Number of Agents (est.)' : '代理人数（预估）'} defaultValue="" />
                <Fld label={lang === 'en' ? 'Est. Annual Premium ($)' : '年保费规模预估 ($)'} defaultValue="" isMono />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 9 }}>{lang === 'en' ? 'Licensed States' : '授权经营州'}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {STATES.map(s => {
                    const on = (org?.licenseStates ?? ['CA']).includes(s)
                    return (
                      <label key={s} style={{
                        ...mono, display: 'flex', alignItems: 'center', padding: '4px 10px',
                        borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        background: on ? C.primaryLight : 'rgba(255,255,255,0.6)',
                        color: on ? C.primary : C.textSoft,
                        border: `1px solid ${on ? C.primaryBorder : 'rgba(193,198,215,0.7)'}`,
                        transition: 'all 0.12s',
                      }}>
                        <input type="checkbox" defaultChecked={on} style={{ display: 'none' }} />{s}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* White-label toggle */}
              <div style={{ borderRadius: 12, border: `0.5px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'rgba(236,237,249,0.35)', borderBottom: whiteLabelOn ? `0.5px solid ${C.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{lang === 'en' ? 'White-label Branded Portal' : 'White-label 独立品牌门户'}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lang === 'en' ? 'Enable a branded agent portal for this channel' : '为该渠道启用独立品牌的代理人门户'}</div>
                  </div>
                  <button onClick={() => setWhiteLabelOn(v => !v)} style={{ width: 40, height: 22, borderRadius: 11, background: whiteLabelOn ? C.primary : 'rgba(193,198,215,0.4)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: whiteLabelOn ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
                {whiteLabelOn && (
                  <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Fld label={lang === 'en' ? 'Portal Brand Name' : '门户品牌名称'} defaultValue="" />
                    <Fld label="Logo URL" defaultValue="" />
                    <Fld label={lang === 'en' ? 'Primary Color (Hex)' : '主色调 (Hex)'} defaultValue="#0058BC" />
                    <Fld label={lang === 'en' ? 'Secondary Color (Hex)' : '辅助色 (Hex)'} defaultValue="#60CDFF" />
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSoft, display: 'block', marginBottom: 6 }}>{lang === 'en' ? 'Notes' : '备注'}</label>
                <textarea
                  defaultValue={org?.notes ?? ''}
                  rows={2}
                  className="input-glass w-full"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {/* Step 4: 资质文件 & 提交 */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '10px 14px', borderRadius: 9, background: C.primaryLight, border: `0.5px solid ${C.primaryBorder}`, fontSize: 12.5, color: C.primary, lineHeight: 1.6, display: 'flex', gap: 8 }}>
                <FileText size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {lang === 'en'
                  ? 'Upload the qualification documents below for compliance review. The channel can only be activated after all required documents are approved.'
                  : '上传以下资质文件，确保合规审核通过。所有必须文件审核通过后才可激活渠道。'}
              </div>
              {[
                { label: lang === 'en' ? 'Business License' : '营业执照', hint: 'Business License', required: true },
                { label: lang === 'en' ? 'Agency Insurance License' : '机构保险牌照', hint: 'Insurance License Certificate', required: true },
                { label: lang === 'en' ? 'E&O Insurance Certificate' : 'E&O 保险证明', hint: 'Errors & Omissions Insurance', required: true },
                { label: lang === 'en' ? 'W-9 Form' : 'W-9 表格', hint: 'IRS Form W-9', required: false },
              ].map(doc => (
                <div key={doc.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.55)', border: `0.5px solid ${C.border}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={17} color={C.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{doc.label}</span>
                      {doc.required
                        ? <span style={{ fontSize: 10.5, color: C.red, fontWeight: 700, padding: '1px 5px', background: 'rgba(186,26,26,0.08)', borderRadius: 4 }}>{lang === 'en' ? 'Required' : '必须'}</span>
                        : <span style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 600 }}>{lang === 'en' ? 'Optional' : '可选'}</span>
                      }
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{doc.hint}</div>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}>
                    <Upload size={12} />{lang === 'en' ? 'Upload' : '上传'}
                  </button>
                </div>
              ))}
              <div style={{ padding: '10px 14px', borderRadius: 9, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 12.5, color: C.amber, display: 'flex', alignItems: 'flex-start', gap: 7, lineHeight: 1.5 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {lang === 'en'
                  ? 'After submission, the application enters operations review, typically completed within 1–3 business days. The channel remains in “Pending Review” status during review.'
                  : '提交后进入运营审核流程，通常 1–3 个工作日完成。审核期间渠道处于「待审核」状态。'}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px 20px', borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && (
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setStep(s => s - 1)}>
                ← {t.formPrev}
              </button>
            )}
            {step === 4 && (
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => doSave(true)}>
                <FileText size={13} />{lang === 'en' ? 'Save Draft' : '保存草稿'}
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {step === 1 && (
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>{lang === 'en' ? 'Cancel' : '取消'}</button>
            )}
            {step < totalSteps
              ? (
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)}>
                  {t.formNext} →
                </button>
              )
              : (
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => doSave(false)} disabled={saving}>
                  {saving
                    ? <><Loader2 size={13} className="animate-spin" />{t.formSaving}</>
                    : <><Check size={13} strokeWidth={2.5} />{lang === 'en' ? 'Submit for Review' : '提交审核'}</>
                  }
                </button>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Form Modal
// ─────────────────────────────────────────────────────────────────────────────

function AgentFormModal({ mode, agent, onClose }: { mode: 'create' | 'edit'; agent?: ChannelAgent; onClose: () => void }) {
  const { t, lang } = useLang()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [niprState, setNiprState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')
  const totalSteps = 3
  const steps = [
    lang === 'en' ? 'Personal Information' : '个人信息',
    lang === 'en' ? 'Contact & License' : '联系 & 执照',
    lang === 'en' ? 'Organization Setup' : '组织配置',
  ]
  const doSave = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose() }, 1100) }
  const doNipr = () => { setNiprState('checking'); setTimeout(() => setNiprState('valid'), 1500) }
  const STATES = ['CA','TX','NY','FL','IL','WA','OR','NV','CO','GA','OH','PA','NJ','CT','MA','AZ','NC','VA','TN','MO']

  const inputCss: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }
  const fld = (label: string, defaultValue: string, required?: boolean, m?: boolean) => (
    <div key={label}>
      <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      <input type="text" defaultValue={defaultValue} style={{ ...inputCss, ...(m ? mono : {}) }} />
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GlassCard style={{ width: 600, maxHeight: '90vh', overflowY: 'auto', background: C.surfaceHigh, borderRadius: 18, padding: '28px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>
              {mode === 'create' ? t.formNewAgent : t.formEditAgent(agent?.displayName ?? '')}
            </h2>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{t.formStepOf(step, totalSteps)}</p>
          </div>
          <IconBtn icon={<X size={16} />} onClick={onClose} />
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', marginBottom: 24, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 11, left: '8%', right: '8%', height: 2, background: C.border, zIndex: 0 }}>
            <div style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%`, height: '100%', background: C.primary, transition: 'width 0.3s ease' }} />
          </div>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: i + 1 <= step ? C.primary : 'rgba(255,255,255,0.8)', border: `2px solid ${i + 1 <= step ? C.primary : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i + 1 < step ? <Check size={11} color="#fff" /> : <span style={{ ...mono, fontSize: 10, fontWeight: 800, color: i + 1 === step ? '#fff' : C.mutedLight }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: 10.5, color: i + 1 <= step ? C.primary : C.mutedLight, fontWeight: i + 1 === step ? 700 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 1: 个人信息 */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {fld(t.formFieldFirstName, agent?.firstName ?? '', true)}
            {fld(t.formFieldLastName, agent?.lastName ?? '', true)}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Gender' : '性别'}</label>
              <select style={{ ...inputCss }}>
                {(lang === 'en' ? ['Male','Female','Not Specified'] : ['Male（男）','Female（女）','Not Specified']).map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            {fld(lang === 'en' ? 'Date of Birth' : '出生日期', '', false, true)}
            {fld(lang === 'en' ? 'SSN (last 4 digits)' : 'SSN 后4位', '', false, true)}
            {fld(lang === 'en' ? 'Join Date / Contract Date' : '入职日期 / 签约日期', agent?.joinDate ?? '', true, true)}
          </div>
        )}

        {/* Step 2: 联系 & 执照 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {fld(t.formFieldEmailReq2, agent?.email ?? '', true)}
              {fld(t.formFieldPhoneOpt2, agent?.phone ?? '' )}
              {fld(lang === 'en' ? 'Mailing Address' : '通讯地址', '' )}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Primary State' : '主营州'} <span style={{ color: C.red }}>*</span></label>
                <select defaultValue={agent?.primaryState ?? 'CA'} style={inputCss}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* NPN + NIPR verify */}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                NPN <span style={{ color: C.red }}>*</span>
                <span style={{ fontWeight: 400, fontSize: 11, color: C.mutedLight }}>National Producer Number</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" defaultValue={agent?.npn ?? ''} style={{ ...inputCss, ...mono, flex: 1 }} />
                <button onClick={doNipr} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, background: niprState === 'valid' ? C.greenBg : C.primaryLight, color: niprState === 'valid' ? C.green : C.primary, border: `0.5px solid ${niprState === 'valid' ? C.greenBorder : C.primaryBorder}`, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {niprState === 'checking' ? <><Loader2 size={12} className="animate-spin" />{lang === 'en' ? 'Verifying…' : '校验中…'}</> : niprState === 'valid' ? <><Check size={12} />{lang === 'en' ? 'NIPR Verified' : 'NIPR 已验证'}</> : niprState === 'invalid' ? <>{lang === 'en' ? '✗ Invalid NPN' : '✗ 无效 NPN'}</> : <>{lang === 'en' ? 'NIPR Pre-check' : 'NIPR 预校验'}</>}
                </button>
              </div>
              {niprState === 'valid' && (
                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 7, background: C.greenBg, border: `0.5px solid ${C.greenBorder}`, fontSize: 12, color: C.green, display: 'flex', gap: 8 }}>
                  <Check size={12} /><span>{lang === 'en' ? 'NPN verified · Licensed states: CA, TX, FL · Lines: P&C, Life' : 'NPN 验证通过 · 持牌州: CA, TX, FL · 业务线: P&C, Life'}</span>
                </div>
              )}
              {niprState === 'invalid' && (
                <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 7, background: C.redBg, border: `0.5px solid ${C.redBorder}`, fontSize: 12, color: C.red }}>
                  {lang === 'en' ? 'This NPN was not found in the NIPR database. Please verify and re-enter.' : '该 NPN 在 NIPR 数据库中未找到，请核实后重新输入。'}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>{t.formFieldLicStatesAgent}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {STATES.map(s => {
                  const on = (agent?.licenseStates ?? []).includes(s)
                  return (
                    <label key={s} style={{ ...mono, display: 'flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: on ? C.primaryLight : 'rgba(255,255,255,0.5)', color: on ? C.primary : C.textSoft, border: `0.5px solid ${on ? C.primaryBorder : C.border}` }}>
                      <input type="checkbox" defaultChecked={on} style={{ display: 'none' }} />{s}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 组织配置 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{t.formFieldOrgReq} <span style={{ color: C.red }}>*</span></label>
                <select defaultValue={agent?.orgId ?? ''} style={inputCss}>
                  {channelOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{t.formFieldRole}</label>
                <select defaultValue={agent?.role ?? 'agent'} style={inputCss}>
                  {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{enLabel(lang, v)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Direct Manager (Referrer)' : '直接上级（推荐人）'}</label>
                <select style={inputCss}>
                  <option value="">{lang === 'en' ? 'None (reports to org)' : '无（直属机构）'}</option>
                  {channelAgents.filter(a => a.role === 'manager' || a.role === 'principal').map(a => <option key={a.id} value={a.id}>{a.displayName} · {enLabel(lang, ROLE_LABEL[a.role])}</option>)}
                </select>
              </div>
              {fld(lang === 'en' ? 'Internal Carrier Agent ID' : '保险公司内部代理人编号', '', false, true)}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Commission Plan' : '佣金方案'}</label>
                <select style={inputCss}>
                  <option value="">{lang === 'en' ? 'Use organization default plan' : '使用机构默认方案'}</option>
                  {(lang === 'en'
                    ? ['2026 Standard Personal Plan','Premier Agent Accelerator Plan','New Agent Development Plan']
                    : ['2026年度标准个人方案','高端代理人加速方案','新人培育方案']
                  ).map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>{t.formFieldNotes}</label>
              <textarea defaultValue={agent?.notes ?? ''} rows={2} style={{ ...inputCss, resize: 'vertical' }} />
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 9, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 12, color: C.amber, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={12} />{lang === 'en' ? 'Submission automatically triggers NIPR verification; once verified, the agent profile enters the review workflow.' : '提交后自动触发 NIPR 校验，校验通过后代理人档案进入审核流程。'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 16, borderTop: `0.5px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && <GhostBtn onClick={() => setStep(s => s - 1)}>{t.formPrev}</GhostBtn>}
            {step === 3 && <GhostBtn><FileText size={12} />{lang === 'en' ? 'Save Draft' : '保存草稿'}</GhostBtn>}
          </div>
          {step < totalSteps
            ? <PrimaryBtn onClick={() => setStep(s => s + 1)}>{t.formNext}</PrimaryBtn>
            : <PrimaryBtn onClick={doSave}>
                {saving ? <><Loader2 size={13} className="animate-spin" />{t.formSaving}</> : <><Check size={13} />{t.formSaveAgent}</>}
              </PrimaryBtn>
          }
        </div>
      </GlassCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Org Detail Panel
// ─────────────────────────────────────────────────────────────────────────────

function OrgDetail({ org, onClose, onEdit, onStatus }: {
  org: ChannelOrg; onClose: () => void; onEdit: () => void; onStatus: () => void
}) {
  const { t, lang } = useLang()
  const [sub, setSub] = useState<'info' | 'agents' | 'perf' | 'appt' | 'docs'>('info')
  const agents = channelAgents.filter(a => a.orgId === org.id)
  const docs = qualDocs.filter(d => d.ownerId === org.id)
  const tc = ORG_TYPE_COLOR[org.type]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{ padding: '18px 20px 12px', borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `${tc}0E`, border: `1.5px solid ${tc}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={20} color={tc} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text, lineHeight: 1.2, maxWidth: 210 }}>{org.name}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{org.shortName} · {org.primaryState}</div>
            </div>
          </div>
          <IconBtn icon={<X size={14} />} onClick={onClose} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <OrgStatusBadge s={org.status} />
          <Badge label={enLabel(lang, ORG_TYPE_LABEL[org.type])} color={tc} bg={`${tc}12`} />
          {org.tags.map(g => <Badge key={g} label={enLabel(lang, g)} xs />)}
        </div>
        {org.status === 'suspended' && org.notes && (
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: C.redBg, border: `0.5px solid ${C.redBorder}`, fontSize: 11.5, color: '#8B1A1A', lineHeight: 1.5 }}>
            {org.notes}
          </div>
        )}
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px 14px', padding: '12px 20px', borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.2)' }}>
        <KpiTile label={lang === 'en' ? 'YTD Premium' : 'YTD保费'} value={fmt(org.ytdPremium)} color={C.primary} bar={org.ytdPremium} maxBar={30000000} />
        <KpiTile label={lang === 'en' ? 'YTD Commission' : 'YTD佣金'} value={fmt(org.ytdCommission)} color={C.green} bar={org.ytdCommission} maxBar={4000000} />
        <KpiTile label={lang === 'en' ? 'Loss Ratio' : '赔付率'} value={pct(org.lossRatio)} color={lossColor(org.lossRatio)} bar={org.lossRatio} />
        <KpiTile label={lang === 'en' ? 'Renewal Rate' : '续保率'} value={pct(org.renewalRate)} color={renewColor(org.renewalRate)} bar={org.renewalRate} />
      </div>

      {/* ── Sub-tabs ── */}
      <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.border}`, overflowX: 'auto' }}>
        {(['info', 'agents', 'perf', 'appt', 'docs'] as const).map(s => {
          const docWarn = docs.filter(d => d.status !== 'valid').length
          const labels: Record<string, string> = {
            info: lang === 'en' ? 'Basic Information' : '基本信息',
            agents: lang === 'en' ? `Agents(${agents.length})` : `代理人(${agents.length})`,
            perf: lang === 'en' ? 'Performance' : '业绩',
            appt: 'Appointment',
            docs: lang === 'en'
              ? `Documents${docWarn ? ` ⚠${docWarn}` : ''}`
              : `文件${docWarn ? ` ⚠${docWarn}` : ''}`,
          }
          return (
            <button key={s} onClick={() => setSub(s as any)} style={{
              padding: '8px 10px', fontSize: 11.5, fontWeight: sub === s ? 700 : 500, flexShrink: 0,
              color: sub === s ? C.primary : C.muted, background: 'none', border: 'none',
              borderBottom: sub === s ? `2px solid ${C.primary}` : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{labels[s]}</button>
          )
        })}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        {sub === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <SectionHead label={t.secRegInfo} icon={<Shield size={11} />} />
              {[
                [t.fieldNpn, org.npn, true], [t.fieldTaxId, org.taxId, true],
                [t.fieldContractId, org.contractId ?? '—', true],
                [t.fieldJoinDate, org.joinDate, false], [t.fieldLastReview, org.lastReviewDate, false],
                [t.fieldManager, org.managerName ?? '—', false], [t.fieldAgentCount, String(org.agentCount), true],
              ].map(([k, v, m]) => <FieldRow key={k as string} label={k as string} value={v as string} mono={!!m} />)}
            </div>
            <div>
              <SectionHead label={t.secContact} icon={<Phone size={11} />} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { icon: <Mail size={12} />, value: org.email, href: `mailto:${org.email}` },
                  { icon: <Phone size={12} />, value: org.phone },
                  { icon: <MapPin size={12} />, value: `${org.address}, ${org.city}, ${org.state} ${org.zip}` },
                  ...(org.website ? [{ icon: <Globe size={12} />, value: org.website }] : []),
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                    <span style={{ color: C.mutedLight, marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
                    {r.href ? <a href={r.href} style={{ color: C.primary, textDecoration: 'none' }}>{r.value}</a> : <span style={{ color: C.textSoft }}>{r.value}</span>}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionHead label={`${t.secLicStates} (${org.licenseStates.length})`} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {org.licenseStates.map(s => (
                  <span key={s} style={{ ...mono, padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: C.primaryLight, color: C.primary }}>{s}</span>
                ))}
              </div>
            </div>
            <div>
              <SectionHead label={lang === 'en' ? 'Partner Carriers' : '合作保险公司'} icon={<Building2 size={11} />} />
              {['Farmers Insurance','State Farm','Progressive','Allstate'].map(ins => (
                <div key={ins} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: `0.5px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.text, fontWeight: 600 }}>{ins}</span>
                  <Badge label={lang === 'en' ? 'Appointed' : '合作中'} color={C.green} bg={C.greenBg} xs />
                </div>
              ))}
            </div>
            {org.parentOrgName && (
              <div>
                <SectionHead label={t.secParent} icon={<Link2 size={11} />} />
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.text, padding: '4px 0' }}>{org.parentOrgName}</div>
              </div>
            )}
          </div>
        )}

        {(sub as string) === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {agents.length === 0 && <p style={{ textAlign: 'center', color: C.mutedLight, padding: '24px 0', fontSize: 13 }}>{t.noAgents}</p>}
            {agents.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: C.surface, border: `0.5px solid ${C.border}` }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={13} color={C.primary} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{a.displayName}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{enLabel(lang, ROLE_LABEL[a.role])}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <AgentStatusBadge s={a.status} />
                  <div style={{ ...mono, fontSize: 11, color: C.muted, marginTop: 2 }}>{fmt(a.ytdPremium)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(sub as string) === 'perf' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionHead label={lang === 'en' ? 'Quarterly Performance Trend' : '季度业绩趋势'} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
              {[
                { q: 'Q1', v: 45 }, { q: 'Q2', v: 62 }, { q: 'Q3', v: 78 }, { q: 'Q4 (YTD)', v: 100 },
              ].map(b => (
                <div key={b.q} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.primary, fontWeight: 700 }}>{(org.ytdPremium * b.v / 100 / 1e6).toFixed(1)}M</div>
                  <div style={{ width: '100%', background: b.q.includes('YTD') ? C.primary : `${C.primary}55`, borderRadius: '4px 4px 0 0', height: `${b.v}%`, minHeight: 4 }} />
                  <div style={{ fontSize: 9.5, color: C.mutedLight }}>{b.q}</div>
                </div>
              ))}
            </div>
            <Divider />
            <SectionHead label={lang === 'en' ? 'Key Performance Indicators' : '关键绩效指标'} />
            {[
              { label: lang === 'en' ? 'YTD Premium' : 'YTD保费', v: fmt(org.ytdPremium), color: C.primary },
              { label: lang === 'en' ? 'YTD Commission' : 'YTD佣金', v: fmt(org.ytdCommission), color: C.green },
              { label: lang === 'en' ? 'Avg Premium per Case' : '件均保费', v: fmt(Math.round(org.ytdPremium / Math.max(1, org.agentCount * 12))), color: C.textSoft },
              { label: lang === 'en' ? 'Loss Ratio' : '赔付率', v: pct(org.lossRatio), color: lossColor(org.lossRatio) },
              { label: lang === 'en' ? 'Renewal Rate' : '续保率', v: pct(org.renewalRate), color: renewColor(org.renewalRate) },
            ].map(k => (
              <FieldRow key={k.label} label={k.label} value={k.v} mono />
            ))}
            <Divider />
            <SectionHead label={lang === 'en' ? 'Linked Commission Plans' : '绑定佣金方案'} />
            {(lang === 'en'
              ? ['2026 Standard Agency Plan (Active)', 'High-Production Bonus Add-on (Active)']
              : ['2026年度标准机构方案 (Active)', '高产奖励附加方案 (Active)']
            ).map(s => (
              <div key={s} style={{ fontSize: 12.5, color: C.text, padding: '5px 0', borderBottom: `0.5px solid ${C.border}` }}>{s}</div>
            ))}
          </div>
        )}

        {(sub as string) === 'appt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SectionHead label={lang === 'en' ? 'Appointment Status' : 'Appointment 状态'} />
            {[
              { ins: 'Farmers Insurance', states: ['CA','TX','FL'], status: 'appointed' },
              { ins: 'State Farm', states: ['CA','TX'], status: 'appointed' },
              { ins: 'Progressive', states: ['CA'], status: 'pending' },
              { ins: 'Allstate', states: ['FL','GA'], status: 'terminated' },
            ].map(r => (
              <div key={r.ins} style={{ padding: '8px 10px', borderRadius: 9, background: C.surface, border: `0.5px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{r.ins}</span>
                  <Badge label={r.status === 'appointed' ? (lang === 'en' ? 'Appointed' : '已Appt') : r.status === 'pending' ? (lang === 'en' ? 'Pending' : '待审批') : (lang === 'en' ? 'Terminated' : '已终止')} color={r.status === 'appointed' ? C.green : r.status === 'pending' ? C.amber : C.red} bg={r.status === 'appointed' ? C.greenBg : r.status === 'pending' ? C.amberBg : C.redBg} xs />
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {r.states.map(s => <span key={s} style={{ ...mono, fontSize: 10.5, padding: '2px 6px', borderRadius: 5, background: C.primaryLight, color: C.primary, fontWeight: 700 }}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {(sub as string) === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {docs.length === 0 && <p style={{ textAlign: 'center', color: C.mutedLight, padding: '24px 0', fontSize: 13 }}>{t.noDocs}</p>}
            {docs.map(d => {
              const ds = DOC_STATUS_STYLE[d.status]
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: d.status !== 'valid' ? C.redBg : C.surface, border: `0.5px solid ${d.status !== 'valid' ? C.redBorder : C.border}` }}>
                  <DocStatusIcon s={d.status} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{enLabel(lang, DOC_CATEGORY_LABEL[d.category])}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Badge label={enLabel(lang, ds.label)} color={ds.color} bg={ds.bg} xs />
                    {d.expiryDate && <div style={{ ...mono, fontSize: 10, color: d.status === 'expired' ? C.red : C.mutedLight, marginTop: 2 }}>{d.expiryDate}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div style={{ padding: '10px 20px', borderTop: `0.5px solid ${C.border}`, display: 'flex', gap: 7, background: 'rgba(249,249,255,0.4)' }}>
        <PrimaryBtn onClick={onEdit} sm><Edit2 size={12} />{t.btnEdit}</PrimaryBtn>
        <GhostBtn onClick={onStatus} sm>{t.btnStatus}</GhostBtn>
        <GhostBtn sm><Upload size={12} />{t.btnUploadFile}</GhostBtn>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Agent Detail Panel
// ─────────────────────────────────────────────────────────────────────────────

function AgentDetail({ agent, onClose, onEdit, onStatus }: {
  agent: ChannelAgent; onClose: () => void; onEdit: () => void; onStatus: () => void
}) {
  const { t, lang } = useLang()
  const docs = qualDocs.filter(d => d.ownerId === agent.id)
  const [sub, setSub] = useState<'info' | 'perf' | 'creds'>('info')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 20px 12px', borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: C.primaryLight, border: `1.5px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={20} color={C.primary} />
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text }}>{agent.displayName}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{enLabel(lang, ROLE_LABEL[agent.role])} · {agent.orgName.split(' ').slice(0, 3).join(' ')}</div>
            </div>
          </div>
          <IconBtn icon={<X size={14} />} onClick={onClose} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <AgentStatusBadge s={agent.status} />
          <Badge label={enLabel(lang, ROLE_LABEL[agent.role])} color={C.primary} bg={C.primaryLight} xs />
          {docs.filter(d => d.status !== 'valid').length > 0 && <Badge label={lang === 'en' ? `Doc Alerts ${docs.filter(d => d.status !== 'valid').length}` : `文件预警 ${docs.filter(d => d.status !== 'valid').length}`} color={C.amber} bg={C.amberBg} xs />}
        </div>
        {agent.notes && (
          <div style={{ marginTop: 8, padding: '7px 10px', borderRadius: 8, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 11.5, color: '#7A4800', lineHeight: 1.5 }}>{agent.notes}</div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px 10px', padding: '10px 20px', borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.2)' }}>
        <KpiTile label={lang === 'en' ? 'YTD Premium' : 'YTD保费'} value={fmt(agent.ytdPremium)} color={C.primary} />
        <KpiTile label={lang === 'en' ? 'Policies' : '保单数'} value={agent.policyCount > 0 ? String(agent.policyCount) : '—'} color={C.textSoft} />
        <KpiTile label={lang === 'en' ? 'Renewal Rate' : '续保率'} value={pct(agent.renewalRate)} color={renewColor(agent.renewalRate)} />
        <KpiTile label={lang === 'en' ? 'YTD Commission' : 'YTD佣金'} value={fmt(agent.ytdCommission)} color={C.green} />
        <KpiTile label={lang === 'en' ? 'Clients' : '客户数'} value={agent.clientCount > 0 ? String(agent.clientCount) : '—'} color={C.textSoft} />
        <KpiTile label={lang === 'en' ? 'Loss Ratio' : '赔付率'} value={pct(agent.lossRatio)} color={lossColor(agent.lossRatio)} />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.border}` }}>
        {([['info','基本信息','Basic Information'],['perf','业绩趋势','Performance Trend'],['creds','资质认证','Qualifications']] as const).map(([id, zh, en]) => (
          <button key={id} onClick={() => setSub(id)} style={{ flex: 1, padding: '8px 4px', fontSize: 11.5, fontWeight: sub === id ? 700 : 500, color: sub === id ? C.primary : C.muted, background: 'none', border: 'none', borderBottom: sub === id ? `2px solid ${C.primary}` : '2px solid transparent', cursor: 'pointer' }}>{lang === 'en' ? en : zh}</button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
        {sub === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <SectionHead label={t.secIdentity} icon={<Shield size={11} />} />
              {[
                [t.fieldNpn, agent.npn, true], [t.fieldEmail, agent.email, false],
                [t.fieldPhone, agent.phone, false], [t.fieldOrgName, agent.orgName, false],
                [t.fieldJoinDate, agent.joinDate, false], [t.fieldLastActive, agent.lastActiveDate, false],
              ].map(([k, v, m]) => <FieldRow key={k as string} label={k as string} value={v as string} mono={!!m} />)}
            </div>
            <div>
              <SectionHead label={`${t.secLicStatesAgent} (${agent.licenseStates.length})`} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {agent.licenseStates.map(s => <span key={s} style={{ ...mono, padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, background: C.primaryLight, color: C.primary }}>{s}</span>)}
              </div>
            </div>
            <div>
              <SectionHead label={lang === 'en' ? 'Product Authorizations' : '产品授权'} />
              {(lang === 'en'
                ? ['Auto (P&C)','Homeowner','Renter','Umbrella']
                : ['Auto险 (P&C)','Homeowner险','Renter险','Umbrella险']
              ).map(p => (
                <div key={p} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `0.5px solid ${C.border}`, fontSize: 12 }}>
                  <span style={{ color: C.text }}>{p}</span>
                  <Badge label={lang === 'en' ? 'Authorized' : '已授权'} color={C.green} bg={C.greenBg} xs />
                </div>
              ))}
            </div>
          </div>
        )}

        {sub === 'perf' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SectionHead label={lang === 'en' ? 'Monthly Premium Trend' : '月度保费趋势'} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90 }}>
              {[68,72,81,76,88,91,84,100].map((v, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: '100%', background: i === 7 ? C.primary : `${C.primary}50`, borderRadius: '3px 3px 0 0', height: `${v}%`, minHeight: 4 }} />
                  <div style={{ fontSize: 9, color: C.mutedLight }}>M{i + 1}</div>
                </div>
              ))}
            </div>
            <Divider />
            <SectionHead label={lang === 'en' ? 'Commission Information' : '佣金信息'} />
            {[
              { label: lang === 'en' ? 'Linked Plan' : '绑定方案', v: lang === 'en' ? '2026 Standard Personal Plan' : '2026年度标准个人方案' },
              { label: lang === 'en' ? 'YTD Total Commission' : 'YTD累计佣金', v: fmt(agent.ytdCommission) },
              { label: lang === 'en' ? 'Pending Settlement' : '待结算佣金', v: fmt(Math.round(agent.ytdCommission * 0.12)) },
              { label: lang === 'en' ? 'Last Settlement Amount' : '上期结算金额', v: fmt(Math.round(agent.ytdCommission * 0.28)) },
              { label: lang === 'en' ? 'Last Settlement Date' : '上期结算日期', v: '2026-07-25' },
            ].map(k => <FieldRow key={k.label} label={k.label} value={k.v} mono />)}
            <Divider />
            <SectionHead label={lang === 'en' ? 'Appointment Status' : 'Appointment 状态'} />
            {[
              { ins: 'Farmers Insurance', states: 'CA, TX, FL', status: '已Appt' },
              { ins: 'State Farm', states: 'CA', status: '待审批' },
            ].map(r => (
              <div key={r.ins} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `0.5px solid ${C.border}`, fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, color: C.text }}>{r.ins}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{r.states}</div>
                </div>
                <Badge label={r.status === '已Appt' ? (lang === 'en' ? 'Appointed' : '已Appt') : (lang === 'en' ? 'Pending' : '待审批')} color={r.status === '已Appt' ? C.green : C.amber} bg={r.status === '已Appt' ? C.greenBg : C.amberBg} xs />
              </div>
            ))}
          </div>
        )}

        {sub === 'creds' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionHead label={lang === 'en' ? 'Training & Certifications' : '培训与认证'} icon={<Star size={11} />} />
            {[
              { name: lang === 'en' ? 'P&C Fundamentals Certification P-1' : '财产险基础认证 P-1', date: '2025-03-14', exp: '2027-03-13', status: 'valid' },
              { name: lang === 'en' ? 'AML Compliance Training 2025' : 'AML 合规培训 2025', date: '2025-06-01', exp: '2026-05-31', status: 'expiring-soon' },
            ].map(c => (
              <div key={c.name} style={{ padding: '8px 10px', borderRadius: 9, background: c.status !== 'valid' ? C.amberBg : C.surface, border: `0.5px solid ${c.status !== 'valid' ? C.amberBorder : C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{c.name}</span>
                  <DocStatusIcon s={c.status} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{c.date} → {c.exp}</div>
              </div>
            ))}
            <Divider m={6} />
            {docs.length > 0 && (
              <>
                <SectionHead label={`${t.secQualDocs} (${docs.length})`} icon={<FileText size={11} />} />
                {docs.map(d => {
                  const ds = DOC_STATUS_STYLE[d.status]
                  return (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `0.5px solid ${C.border}` }}>
                      <DocStatusIcon s={d.status} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{enLabel(lang, DOC_CATEGORY_LABEL[d.category])}</div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <Badge label={enLabel(lang, ds.label)} color={ds.color} bg={ds.bg} xs />
                        {d.expiryDate && <div style={{ ...mono, fontSize: 10, color: d.status === 'expired' ? C.red : C.mutedLight, marginTop: 2 }}>{d.expiryDate}</div>}
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 20px', borderTop: `0.5px solid ${C.border}`, display: 'flex', gap: 7, background: 'rgba(249,249,255,0.4)' }}>
        <PrimaryBtn onClick={onEdit} sm><Edit2 size={12} />{t.btnEdit}</PrimaryBtn>
        <GhostBtn onClick={onStatus} sm>{t.btnStatus}</GhostBtn>
        <GhostBtn sm><Upload size={12} />{t.btnUploadFile}</GhostBtn>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Report' : '报告'}</GhostBtn>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — 渠道机构
// ─────────────────────────────────────────────────────────────────────────────

function OrgListTab() {
  const { t, lang } = useLang()
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [sortKey, setSortKey] = useState('ytdPremium')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<ChannelOrg | null>(channelOrgs[0])
  const [showForm, setShowForm] = useState(false)
  const [editOrg, setEditOrg] = useState<ChannelOrg | undefined>()
  const [statusTarget, setStatusTarget] = useState<ChannelOrg | null>(null)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const toggleCheck = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  const doSort = (k: string) => { k === sortKey ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortKey(k), setSortDir('desc')) }

  const filtered = channelOrgs
    .filter(o =>
      (statusF === 'all' || o.status === statusF) &&
      (typeF === 'all' || o.type === typeF) &&
      (!search || o.name.toLowerCase().includes(search.toLowerCase()) || o.npn.includes(search))
    )
    .sort((a, b) => {
      const v = (a as any)[sortKey] - (b as any)[sortKey]
      return sortDir === 'asc' ? v : -v
    })

  const statusCounts = Object.keys(ORG_STATUS_STYLE).reduce((acc, k) => {
    acc[k] = channelOrgs.filter(o => o.status === k).length; return acc
  }, {} as Record<string, number>)

  const typeCounts = Object.keys(ORG_TYPE_LABEL).reduce((acc, k) => {
    acc[k] = channelOrgs.filter(o => o.type === k).length; return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* ── Filter rail ── */}
      <FilterRail>
        <FilterGroup label={lang === 'en' ? 'Status' : '状态'}>
          <FilterOption label={lang === 'en' ? 'All' : '全部'} count={channelOrgs.length} active={statusF === 'all'} onClick={() => setStatusF('all')} />
          {Object.entries(ORG_STATUS_STYLE).map(([k, v]) => (
            <FilterOption key={k} label={enLabel(lang, v.label)} count={statusCounts[k] ?? 0} active={statusF === k} color={v.color} onClick={() => setStatusF(k)} />
          ))}
        </FilterGroup>
        <FilterGroup label={lang === 'en' ? 'Type' : '类型'}>
          <FilterOption label={lang === 'en' ? 'All' : '全部'} count={channelOrgs.length} active={typeF === 'all'} onClick={() => setTypeF('all')} />
          {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => (
            <FilterOption key={k} label={enLabel(lang, v)} count={typeCounts[k] ?? 0} active={typeF === k} color={ORG_TYPE_COLOR[k as keyof typeof ORG_TYPE_COLOR]} onClick={() => setTypeF(k)} />
          ))}
        </FilterGroup>
      </FilterRail>

      {/* ── Main panel ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 14 }}>
        <GlassCard style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchOrgs} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <PrimaryBtn onClick={() => { setEditOrg(undefined); setShowForm(true) }} sm><Plus size={13} />{t.btnAddOrg}</PrimaryBtn>
          </div>

          {/* Batch toolbar */}
          {checkedIds.size > 0 && (
            <div style={{ padding: '8px 14px', background: C.primaryLight, borderBottom: `0.5px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.primary }}>{lang === 'en' ? `${checkedIds.size} organizations selected` : `已选 ${checkedIds.size} 个机构`}</span>
              <div style={{ flex: 1 }} />
              {([['停用选中','Suspend Selected', true], ['批量导出','Bulk Export', false], ['清空选择','Clear Selection', false]] as const).map(([zh, en, danger]) => (
                <button key={zh} onClick={() => { if (zh === '清空选择') setCheckedIds(new Set()) }} style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: danger ? C.redBg : 'rgba(255,255,255,0.6)', color: danger ? C.red : C.textSoft, border: `0.5px solid ${danger ? C.redBorder : C.border}` }}>{lang === 'en' ? en : zh}</button>
              ))}
            </div>
          )}

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 38, position: 'sticky', left: 0, zIndex: 3, background: 'rgba(234,236,248,0.99)' }}><input type="checkbox" onChange={e => setCheckedIds(e.target.checked ? new Set(filtered.map(o => o.id)) : new Set())} checked={checkedIds.size === filtered.length && filtered.length > 0} /></th>
                  <th style={{ ...TH, position: 'sticky', left: 38, zIndex: 3, background: 'rgba(234,236,248,0.99)', boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>{t.colOrgName}</th>
                  <th style={TH}>{t.colTypeStatus}</th>
                  <th style={{ ...TH, ...mono }}>{t.colNpn}</th>
                  <th style={TH}>{t.colStatePrimary}</th>
                  <th style={{ ...TH, textAlign: 'center' as const }}>{t.colAgentCount}</th>
                  <SortTH label={t.colYtdPremium} sortKey="ytdPremium" active={sortKey === 'ytdPremium'} dir={sortDir} onSort={doSort} />
                  <SortTH label={t.colLossRatio} sortKey="lossRatio" active={sortKey === 'lossRatio'} dir={sortDir} onSort={doSort} />
                  <SortTH label={t.colRenewalRate} sortKey="renewalRate" active={sortKey === 'renewalRate'} dir={sortDir} onSort={doSort} />
                  <th style={TH} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(org => {
                  const tc2 = ORG_TYPE_COLOR[org.type]
                  const isSel = selected?.id === org.id
                  const isChecked = checkedIds.has(org.id)
                  const sBg = isChecked ? 'rgba(232,241,255,0.99)' : isSel ? 'rgba(228,238,255,0.99)' : 'rgba(253,253,255,0.99)'
                  return (
                    <tr key={org.id} onClick={() => setSelected(isSel ? null : org)} style={{ background: isChecked ? 'rgba(0,88,188,0.05)' : isSel ? C.primaryLight : 'transparent', cursor: 'pointer', outline: isSel ? `1.5px solid ${C.primaryBorder}` : 'none', outlineOffset: -1 }}>
                      <td style={{ ...TD, width: 38, position: 'sticky', left: 0, zIndex: 1, background: sBg }} onClick={e => toggleCheck(org.id, e)}>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...TD, position: 'sticky', left: 38, zIndex: 1, background: sBg, boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${tc2}0D`, border: `1px solid ${tc2}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={14} color={tc2} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>
                            <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{org.contractId ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Badge label={enLabel(lang, ORG_TYPE_LABEL[org.type])} color={tc2} bg={`${tc2}12`} xs />
                          <OrgStatusBadge s={org.status} />
                        </div>
                      </td>
                      <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.textSoft }}>{org.npn}</td>
                      <td style={TD}>
                        <div style={{ ...mono, fontWeight: 700, fontSize: 13 }}>{org.primaryState}</div>
                        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 3 }}>
                          {org.licenseStates.slice(0, 4).map(s => <span key={s} style={{ ...mono, fontSize: 10, background: C.primaryLight, color: C.primary, borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>{s}</span>)}
                          {org.licenseStates.length > 4 && <span style={{ fontSize: 10, color: C.mutedLight }}>+{org.licenseStates.length - 4}</span>}
                        </div>
                      </td>
                      <td style={{ ...TD, ...mono, textAlign: 'center', fontWeight: 700 }}>{org.agentCount}</td>
                      <td style={{ ...TD, ...mono, fontWeight: 700, color: org.ytdPremium > 0 ? C.primary : C.mutedLight }}>{fmt(org.ytdPremium)}</td>
                      <td style={{ ...TD, ...mono, fontWeight: 700, color: lossColor(org.lossRatio) }}>{pct(org.lossRatio)}</td>
                      <td style={{ ...TD, ...mono, fontWeight: 700, color: renewColor(org.renewalRate) }}>{pct(org.renewalRate)}</td>
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex' }}>
                          <IconBtn icon={<Eye size={13} />} onClick={() => setSelected(org)} title={lang === 'en' ? 'Details' : '详情'} />
                          <IconBtn icon={<Edit2 size={13} />} onClick={() => { setEditOrg(org); setShowForm(true) }} title={lang === 'en' ? 'Edit' : '编辑'} />
                          <IconBtn icon={<MoreHorizontal size={13} />} onClick={() => setStatusTarget(org)} title={lang === 'en' ? 'Status' : '状态'} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
            {t.footerOrgs(filtered.length, filtered.filter(o => o.status === 'active').length, filtered.filter(o => o.status === 'suspended').length)}
          </div>
        </GlassCard>

        {/* Detail pane */}
        {selected && (
          <GlassCard style={{ width: 340, flexShrink: 0, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <OrgDetail org={selected} onClose={() => setSelected(null)} onEdit={() => { setEditOrg(selected); setShowForm(true) }} onStatus={() => setStatusTarget(selected)} />
          </GlassCard>
        )}
      </div>

      {showForm && <OrgFormModal mode={editOrg ? 'edit' : 'create'} org={editOrg} onClose={() => setShowForm(false)} />}
      {statusTarget && <StatusModal entity={statusTarget} entityType="org" onClose={() => setStatusTarget(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — 代理人
// ─────────────────────────────────────────────────────────────────────────────

function AgentListTab() {
  const { t, lang } = useLang()
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [orgF, setOrgF] = useState('all')
  const [sortKey, setSortKey] = useState('ytdPremium')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selected, setSelected] = useState<ChannelAgent | null>(channelAgents[0])
  const [showForm, setShowForm] = useState(false)
  const [editAgent, setEditAgent] = useState<ChannelAgent | undefined>()
  const [statusTarget, setStatusTarget] = useState<ChannelAgent | null>(null)
  const [checkedAgentIds, setCheckedAgentIds] = useState<Set<string>>(new Set())
  const toggleAgentCheck = (id: string, e: React.MouseEvent) => { e.stopPropagation(); setCheckedAgentIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  const doSort = (k: string) => { k === sortKey ? setSortDir(d => d === 'asc' ? 'desc' : 'asc') : (setSortKey(k), setSortDir('desc')) }

  const filtered = channelAgents
    .filter(a =>
      (statusF === 'all' || a.status === statusF) &&
      (orgF === 'all' || a.orgId === orgF) &&
      (!search || a.displayName.toLowerCase().includes(search.toLowerCase()) || a.npn.includes(search) || a.email.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => { const v = (a as any)[sortKey] - (b as any)[sortKey]; return sortDir === 'asc' ? v : -v })

  const statusCounts = Object.keys(AGENT_STATUS_STYLE).reduce((acc, k) => {
    acc[k] = channelAgents.filter(a => a.status === k).length; return acc
  }, {} as Record<string, number>)

  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <FilterRail>
        <FilterGroup label={lang === 'en' ? 'Status' : '状态'}>
          <FilterOption label={lang === 'en' ? 'All' : '全部'} count={channelAgents.length} active={statusF === 'all'} onClick={() => setStatusF('all')} />
          {Object.entries(AGENT_STATUS_STYLE).map(([k, v]) => (
            <FilterOption key={k} label={enLabel(lang, v.label)} count={statusCounts[k] ?? 0} active={statusF === k} color={v.color} onClick={() => setStatusF(k)} />
          ))}
        </FilterGroup>
        <FilterGroup label={lang === 'en' ? 'Organization' : '机构'}>
          <FilterOption label={lang === 'en' ? 'All' : '全部'} count={channelAgents.length} active={orgF === 'all'} onClick={() => setOrgF('all')} />
          {channelOrgs.map(o => (
            <FilterOption key={o.id} label={o.shortName} count={channelAgents.filter(a => a.orgId === o.id).length} active={orgF === o.id} onClick={() => setOrgF(o.id)} />
          ))}
        </FilterGroup>
      </FilterRail>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 14 }}>
        <GlassCard style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchAgents} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <PrimaryBtn onClick={() => { setEditAgent(undefined); setShowForm(true) }} sm><Plus size={13} />{t.btnAddAgent}</PrimaryBtn>
          </div>

          {checkedAgentIds.size > 0 && (
            <div style={{ padding: '8px 14px', background: C.primaryLight, borderBottom: `0.5px solid ${C.primaryBorder}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.primary }}>{lang === 'en' ? `${checkedAgentIds.size} agents selected` : `已选 ${checkedAgentIds.size} 名代理人`}</span>
              <div style={{ flex: 1 }} />
              {([['批量暂停','Bulk Suspend', true], ['批量导出','Bulk Export', false], ['批量分配机构','Bulk Assign Organization', false], ['清空选择','Clear Selection', false]] as const).map(([zh, en, danger]) => (
                <button key={zh} onClick={() => { if (zh === '清空选择') setCheckedAgentIds(new Set()) }} style={{ padding: '4px 12px', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: danger ? C.redBg : 'rgba(255,255,255,0.6)', color: danger ? C.red : C.textSoft, border: `0.5px solid ${danger ? C.redBorder : C.border}` }}>{lang === 'en' ? en : zh}</button>
              ))}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width: 38, position: 'sticky', left: 0, zIndex: 3, background: 'rgba(234,236,248,0.99)' }}><input type="checkbox" onChange={e => setCheckedAgentIds(e.target.checked ? new Set(filtered.map(a => a.id)) : new Set())} checked={checkedAgentIds.size === filtered.length && filtered.length > 0} /></th>
                  <th style={{ ...TH, position: 'sticky', left: 38, zIndex: 3, background: 'rgba(234,236,248,0.99)', boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>{t.colAgent}</th>
                  <th style={TH}>{t.colOrg}</th>
                  <th style={TH}>{t.colStatusRole}</th>
                  <th style={TH}>{t.colLicStates}</th>
                  <SortTH label={t.colYtdPremium} sortKey="ytdPremium" active={sortKey === 'ytdPremium'} dir={sortDir} onSort={doSort} />
                  <SortTH label={t.colPolicyCount} sortKey="policyCount" active={sortKey === 'policyCount'} dir={sortDir} onSort={doSort} />
                  <SortTH label={t.colLossRatio} sortKey="lossRatio" active={sortKey === 'lossRatio'} dir={sortDir} onSort={doSort} />
                  <th style={TH} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(agent => {
                  const isSel = selected?.id === agent.id
                  const isChecked = checkedAgentIds.has(agent.id)
                  const sBg = isChecked ? 'rgba(232,241,255,0.99)' : isSel ? 'rgba(228,238,255,0.99)' : 'rgba(253,253,255,0.99)'
                  return (
                    <tr key={agent.id} onClick={() => setSelected(isSel ? null : agent)} style={{ background: isChecked ? 'rgba(0,88,188,0.05)' : isSel ? C.primaryLight : 'transparent', cursor: 'pointer', outline: isSel ? `1.5px solid ${C.primaryBorder}` : 'none', outlineOffset: -1 }}>
                      <td style={{ ...TD, width: 38, position: 'sticky', left: 0, zIndex: 1, background: sBg }} onClick={e => toggleAgentCheck(agent.id, e)}>
                        <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ ...TD, position: 'sticky', left: 38, zIndex: 1, background: sBg, boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={13} color={C.primary} />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{agent.displayName}</div>
                            <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{agent.npn}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...TD, fontSize: 12, color: C.textSoft, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.orgName.split(' ').slice(0, 3).join(' ')}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <AgentStatusBadge s={agent.status} />
                          <span style={{ fontSize: 11, color: C.mutedLight }}>{enLabel(lang, ROLE_LABEL[agent.role])}</span>
                        </div>
                      </td>
                      <td style={TD}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {agent.licenseStates.map(s => <span key={s} style={{ ...mono, fontSize: 10, background: C.primaryLight, color: C.primary, borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>{s}</span>)}
                        </div>
                      </td>
                      <td style={{ ...TD, ...mono, fontWeight: 700, color: agent.ytdPremium > 0 ? C.primary : C.mutedLight }}>{fmt(agent.ytdPremium)}</td>
                      <td style={{ ...TD, ...mono, fontWeight: 700 }}>{agent.policyCount > 0 ? agent.policyCount : '—'}</td>
                      <td style={{ ...TD, ...mono, fontWeight: 700, color: lossColor(agent.lossRatio) }}>{pct(agent.lossRatio)}</td>
                      <td style={TD} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex' }}>
                          <IconBtn icon={<Eye size={13} />} onClick={() => setSelected(agent)} />
                          <IconBtn icon={<Edit2 size={13} />} onClick={() => { setEditAgent(agent); setShowForm(true) }} />
                          <IconBtn icon={<MoreHorizontal size={13} />} onClick={() => setStatusTarget(agent)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
            {t.footerAgents(filtered.length, filtered.filter(a => a.status === 'active').length, filtered.filter(a => a.status === 'pending').length)}
          </div>
        </GlassCard>

        {selected && (
          <GlassCard style={{ width: 340, flexShrink: 0, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <AgentDetail agent={selected} onClose={() => setSelected(null)} onEdit={() => { setEditAgent(selected); setShowForm(true) }} onStatus={() => setStatusTarget(selected)} />
          </GlassCard>
        )}
      </div>

      {showForm && <AgentFormModal mode={editAgent ? 'edit' : 'create'} agent={editAgent} onClose={() => setShowForm(false)} />}
      {statusTarget && <StatusModal entity={statusTarget} entityType="agent" onClose={() => setStatusTarget(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — 批量导入
// ─────────────────────────────────────────────────────────────────────────────

function BulkImportTab() {
  const { t, lang } = useLang()
  const [step, setStep] = useState<'idle' | 'parsing' | 'done'>('idle')
  const [dragging, setDragging] = useState(false)
  const [filename, setFilename] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const r = sampleImportResult

  const handleFile = (name: string) => { setFilename(name); setStep('parsing'); setTimeout(() => setStep('done'), 1800) }

  const FIELDS: [string, string, boolean][] = [
    ['first_name', lang === 'en' ? 'Agent first name (English)' : '代理人名（英文）', true], ['last_name', lang === 'en' ? 'Agent last name (English)' : '代理人姓（英文）', true],
    ['email', lang === 'en' ? 'Email address' : '邮箱地址', true], ['npn', lang === 'en' ? 'NPN (8–10 digits)' : 'NPN（8-10位数字）', true],
    ['primary_state', lang === 'en' ? 'Primary state (2-letter code)' : '主营州（两字母代码）', true], ['license_states', lang === 'en' ? 'Licensed states (comma-separated)' : '授权州列表（逗号分隔）', false],
    ['org_npn', lang === 'en' ? 'Organization NPN (must already exist)' : '所属机构NPN（须已录入）', true], ['role', 'agent/manager/principal', false],
    ['phone', lang === 'en' ? 'Phone (optional)' : '电话（可选）', false],
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 'idle' && (
          <>
            {/* Drop zone */}
            <GlassCard>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f.name) }}
                onClick={() => fileRef.current?.click()}
                style={{
                  padding: '52px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                  cursor: 'pointer', borderRadius: 13, border: `2px dashed ${dragging ? C.primary : C.border}`,
                  background: dragging ? C.primaryLight : 'transparent', transition: 'all 0.15s',
                }}
              >
                <div style={{ width: 60, height: 60, borderRadius: 16, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={26} color={C.primary} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.importDropTitle}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 5 }}>{t.importDropSub}</div>
                </div>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f.name) }} />
              </div>
            </GlassCard>

            {/* Template */}
            <GlassCard>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.text }}>
                  <FileText size={14} color={C.primary} />{t.importTemplateName}
                </div>
                <GhostBtn sm><Download size={12} />{t.importDownloadTemplate}</GhostBtn>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{[t.importFieldName, t.importFieldDesc, t.importFieldRequired].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {FIELDS.map(([f, d, req]) => (
                    <tr key={f}>
                      <td style={{ ...TD, ...mono, fontSize: 12, color: C.primary, fontWeight: 700 }}>{f}</td>
                      <td style={{ ...TD, fontSize: 12, color: C.textSoft }}>{d}</td>
                      <td style={{ ...TD, textAlign: 'center' as const }}>{req ? <span style={{ color: C.green, fontWeight: 800 }}>✓</span> : <span style={{ color: C.mutedLight }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </>
        )}

        {step === 'parsing' && (
          <GlassCard style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 18, padding: 40 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} color={C.primary} className="animate-spin" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.importParsing}</div>
              <div style={{ ...mono, fontSize: 12.5, color: C.muted, marginTop: 5 }}>{filename}</div>
            </div>
            {/* Animated progress */}
            <div style={{ width: 280, height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: `linear-gradient(90deg, ${C.primary}, #60CDFF)`, borderRadius: 2, animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
          </GlassCard>
        )}

        {step === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: t.importTotal, v: r.total, color: C.text, icon: <Activity size={15} /> },
                { label: t.importSuccess, v: r.success, color: C.green, icon: <CheckCircle2 size={15} color={C.green} /> },
                { label: t.importFailed, v: r.failed, color: C.red, icon: <XCircle size={15} color={C.red} /> },
                { label: t.importSkipped, v: r.skipped, color: C.amber, icon: <AlertCircle size={15} color={C.amber} /> },
              ].map(s => (
                <GlassCard key={s.label} style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ ...mono, fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>{s.label}</div>
                </GlassCard>
              ))}
            </div>

            {r.errors.length > 0 && (
              <GlassCard>
                <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color={C.red} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.importErrorTitle(r.errors.length)}</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{[t.importColRow, t.importColField, t.importColMsg].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                  <tbody>
                    {r.errors.map(e => (
                      <tr key={e.row}>
                        <td style={{ ...TD, ...mono, fontWeight: 700, color: C.red }}>{lang === 'en' ? `Row ${e.row}` : `第 ${e.row} 行`}</td>
                        <td style={{ ...TD, ...mono, color: C.textSoft }}>{e.field}</td>
                        <td style={{ ...TD, fontSize: 12.5, color: C.textSoft }}>{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
            )}

            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.greenBg, border: `0.5px solid ${C.greenBorder}`, fontSize: 13, color: '#1A5C26', display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle2 size={15} color={C.green} />{t.importSuccessNote(r.success)}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn onClick={() => { setStep('idle'); setFilename('') }}><RefreshCw size={12} />{t.importReupload}</GhostBtn>
              {r.errors.length > 0 && <GhostBtn><Download size={12} />{t.importDownloadErrors}</GhostBtn>}
            </div>
          </div>
        )}
      </div>

      {/* History sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSoft }}>{t.importHistory}</div>
        {[
          { date: '2026-08-10', file: 'agents_aug2026.xlsx', total: 18, success: 17, failed: 1 },
          { date: '2026-05-15', file: 'midwest_agents.csv', total: 8, success: 8, failed: 0 },
          { date: '2023-01-10', file: 'initial_import.xlsx', total: 65, success: 63, failed: 2 },
        ].map(h => (
          <GlassCard key={h.date} style={{ padding: '12px 14px' }}>
            <div style={{ ...mono, fontSize: 11.5, fontWeight: 700, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.file}</div>
            <div style={{ fontSize: 11, color: C.mutedLight, marginBottom: 7 }}>{h.date}</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
              <span style={{ color: C.green, fontWeight: 700 }}>✓ {h.success}</span>
              {h.failed > 0 && <span style={{ color: C.red, fontWeight: 700 }}>✗ {h.failed}</span>}
              <span style={{ color: C.mutedLight }}>/ {h.total}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — 资质文件
// ─────────────────────────────────────────────────────────────────────────────

function DocManagementTab() {
  const { t, lang } = useLang()
  const [catF, setCatF] = useState('all')
  const [ownerF, setOwnerF] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [search, setSearch] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = qualDocs.filter(d =>
    (catF === 'all' || d.category === catF) &&
    (ownerF === 'all' || d.ownerType === ownerF) &&
    (statusF === 'all' || d.status === statusF) &&
    (!search || d.ownerName.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase()))
  )

  const alerts = qualDocs.filter(d => ['expired', 'expiring-soon'].includes(d.status))
  const counts = { valid: qualDocs.filter(d => d.status === 'valid').length, expiring: qualDocs.filter(d => d.status === 'expiring-soon').length, expired: qualDocs.filter(d => d.status === 'expired').length, pending: qualDocs.filter(d => d.status === 'pending-review').length }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Status overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: t.docValid, count: counts.valid, color: C.green, icon: <FileCheck size={17} color={C.green} />, bg: C.greenBg },
          { label: t.docExpiringSoon, count: counts.expiring, color: C.amber, icon: <FileMinus size={17} color={C.amber} />, bg: C.amberBg },
          { label: t.docExpired, count: counts.expired, color: C.red, icon: <FileX size={17} color={C.red} />, bg: C.redBg },
          { label: t.docPendingReview, count: counts.pending, color: C.primary, icon: <Clock size={17} color={C.primary} />, bg: C.primaryLight },
        ].map(s => (
          <GlassCard key={s.label}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 11, background: C.redBg, border: `0.5px solid ${C.redBorder}` }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.red, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={13} />{t.docAlertTitle(alerts.length)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {alerts.map(d => {
              const ds = DOC_STATUS_STYLE[d.status]
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Badge label={enLabel(lang, ds.label)} color={ds.color} bg={ds.bg} xs />
                    <span style={{ fontWeight: 600, color: C.text }}>{d.ownerName.split(' ').slice(0, 3).join(' ')}</span>
                    <span style={{ color: C.muted }}>·</span>
                    <span style={{ color: C.textSoft }}>{d.name}</span>
                  </div>
                  {d.expiryDate && <span style={{ ...mono, fontSize: 11, color: C.red }}>{d.expiryDate}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <GlassCard>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchDocs} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {[
            { value: catF, set: setCatF, opts: [{ value: 'all', label: t.allTypes }, ...Object.entries(DOC_CATEGORY_LABEL).map(([k, v]) => ({ value: k, label: enLabel(lang, v) }))] },
            { value: ownerF, set: setOwnerF, opts: [{ value: 'all', label: t.orgAndAgent }, { value: 'org', label: t.orgDocs }, { value: 'agent', label: t.agentDocs }] },
            { value: statusF, set: setStatusF, opts: [{ value: 'all', label: t.allStatuses }, ...Object.entries(DOC_STATUS_STYLE).map(([k, v]) => ({ value: k, label: enLabel(lang, v.label) }))] },
          ].map((s, i) => (
            <select key={i} value={s.value} onChange={e => s.set(e.target.value)} style={{ padding: '6px 24px 6px 9px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23717786'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
              {s.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <PrimaryBtn onClick={() => fileRef.current?.click()} sm><Upload size={12} />{t.btnUpload}</PrimaryBtn>
          <input ref={fileRef} type="file" style={{ display: 'none' }} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{[t.colOwner, t.colDocName, t.colDocType, t.colVersion, t.colUploadDate, t.colExpiry, t.colStatus, ''].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => {
              const ds = DOC_STATUS_STYLE[doc.status]
              return (
                <tr key={doc.id} style={{ background: ['expired', 'expiring-soon'].includes(doc.status) ? C.redBg : i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.3)' }}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {doc.ownerType === 'org' ? <Building2 size={11} color={C.muted} /> : <User size={11} color={C.muted} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.ownerName.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                  </td>
                  <td style={{ ...TD, fontSize: 12.5, fontWeight: 600, color: C.text, maxWidth: 200 }}>{doc.name}</td>
                  <td style={TD}><Badge label={enLabel(lang, DOC_CATEGORY_LABEL[doc.category])} color={C.primary} bg={C.primaryLight} xs /></td>
                  <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.muted }}>v{doc.version}</td>
                  <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.mutedLight }}>{doc.uploadedDate}</td>
                  <td style={{ ...TD, ...mono, fontSize: 12, color: doc.status === 'expired' ? C.red : doc.status === 'expiring-soon' ? C.amber : C.textSoft, fontWeight: doc.status !== 'valid' ? 700 : 400 }}>{doc.expiryDate ?? '—'}</td>
                  <td style={TD}>
                    <Badge label={enLabel(lang, ds.label)} color={ds.color} bg={ds.bg} xs />
                    {doc.reviewNote && <div style={{ fontSize: 10, color: C.red, maxWidth: 120, marginTop: 2 }}>{doc.reviewNote.slice(0, 26)}…</div>}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex' }}>
                      <IconBtn icon={<Eye size={12} />} title={lang === 'en' ? 'Preview' : '预览'} />
                      <IconBtn icon={<Download size={12} />} title={lang === 'en' ? 'Download' : '下载'} />
                      <IconBtn icon={<Upload size={12} />} title={lang === 'en' ? 'Update' : '更新'} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
          {t.footerDocs(filtered.length, qualDocs.length)}
        </div>
      </GlassCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5 — 变更历史
// ─────────────────────────────────────────────────────────────────────────────

function ChangeHistoryTab() {
  const { t, lang } = useLang()
  const [entityF, setEntityF] = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [operatorF, setOperatorF] = useState('all')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const operators = Array.from(new Set(changeHistory.map(c => c.operator)))

  const filtered = changeHistory
    .filter(c =>
      (entityF === 'all' || c.entityType === entityF) &&
      (typeF === 'all' || c.changeType === typeF) &&
      (operatorF === 'all' || c.operator === operatorF) &&
      (!search || c.entityName.toLowerCase().includes(search.toLowerCase()) || c.operator.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const selStyle = { padding: '6px 24px 6px 9px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none' as const, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23717786'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat' as const, backgroundPosition: 'right 8px center' }

  return (
    <GlassCard>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.searchHistory} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={entityF} onChange={e => setEntityF(e.target.value)} style={selStyle}>
          {[{ value: 'all', label: t.orgAndAgent }, { value: 'org', label: t.orgChanges }, { value: 'agent', label: t.agentChanges }].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={selStyle}>
          {[{ value: 'all', label: t.allOps }, ...Object.entries(CHANGE_TYPE_STYLE).map(([k, v]) => ({ value: k, label: enLabel(lang, v.label) }))].map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={operatorF} onChange={e => setOperatorF(e.target.value)} style={selStyle}>
          <option value="all">{lang === 'en' ? 'All Operators' : '全部操作人'}</option>
          {operators.map(op => <option key={op} value={op}>{op}</option>)}
        </select>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Export Log' : '导出日志'}</GhostBtn>
      </div>

      {/* Timeline */}
      <div style={{ padding: '20px 24px', position: 'relative' }}>
        <div style={{ position: 'absolute', left: 38, top: 0, bottom: 0, width: 1.5, background: C.border }} />
        {filtered.map((c, i) => {
          const cts = CHANGE_TYPE_STYLE[c.changeType]
          const isExp = expanded === c.id
          return (
            <div key={c.id} style={{ display: 'flex', gap: 14, paddingBottom: i < filtered.length - 1 ? 20 : 0, position: 'relative', zIndex: 1 }}>
              {/* Dot */}
              <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 3, background: `${cts.color}12`, border: `2px solid ${cts.color}45`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cts.color }} />
              </div>

              {/* Card */}
              <div style={{ flex: 1, padding: '10px 14px', borderRadius: 11, background: C.surface, border: `0.5px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Badge label={enLabel(lang, cts.label)} color={cts.color} bg={cts.bg} xs />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.entityName}</span>
                    <Badge label={c.entityType === 'org' ? (lang === 'en' ? 'Organization' : '机构') : (lang === 'en' ? 'Agent' : '代理人')} color={c.entityType === 'org' ? C.primary : C.purple} bg={c.entityType === 'org' ? C.primaryLight : C.purpleBg} xs />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ ...mono, fontSize: 11, color: C.mutedLight, whiteSpace: 'nowrap' }}>{c.timestamp}</span>
                    {c.field && (
                      <button onClick={() => setExpanded(isExp ? null : c.id)} style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10.5, fontWeight: 700, background: isExp ? C.primaryLight : 'transparent', color: isExp ? C.primary : C.mutedLight, border: `0.5px solid ${isExp ? C.primaryBorder : C.border}`, cursor: 'pointer' }}>
                        {isExp ? (lang === 'en' ? 'Collapse' : '收起') : (lang === 'en' ? 'Field Diff' : '字段对比')}
                      </button>
                    )}
                  </div>
                </div>
                {c.field && !isExp && (
                  <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 4 }}>
                    {t.historyField}<strong style={{ color: C.text }}>{c.field}</strong>
                    {c.oldValue && <> &nbsp;<span style={{ color: C.mutedLight, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c.oldValue}</span> → <strong style={{ color: C.primary, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{c.newValue}</strong></>}
                  </div>
                )}
                {c.field && isExp && (
                  <div style={{ marginBottom: 8, borderRadius: 8, overflow: 'hidden', border: `0.5px solid ${C.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      <div style={{ padding: '8px 12px', background: C.redBg, borderRight: `0.5px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{lang === 'en' ? 'Before' : '修改前'}</div>
                        <div style={{ ...mono, fontSize: 12.5, color: C.red, fontWeight: 700 }}>{c.oldValue ?? '—'}</div>
                      </div>
                      <div style={{ padding: '8px 12px', background: C.greenBg }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{lang === 'en' ? 'After' : '修改后'}</div>
                        <div style={{ ...mono, fontSize: 12.5, color: C.green, fontWeight: 700 }}>{c.newValue ?? '—'}</div>
                      </div>
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(236,237,249,0.4)', borderTop: `0.5px solid ${C.border}`, fontSize: 11, color: C.muted }}>
                      {lang === 'en' ? 'Field: ' : '字段：'}<strong style={{ color: C.text }}>{c.field}</strong>
                    </div>
                  </div>
                )}
                {c.note && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{c.note}</div>}
                <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 11.5, color: C.mutedLight }}>
                  <span>{t.historyOperator}<strong style={{ color: C.textSoft }}>{c.operator}</strong></span>
                  <span>{c.operatorRole}</span>
                  {c.ipAddress && <span style={{ ...mono, fontSize: 11 }}>{c.ipAddress}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
        {t.footerHistory(filtered.length)}
      </div>
    </GlassCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orgs',    icon: <Building2 size={14} /> },
  { id: 'agents',  icon: <Users size={14} /> },
  { id: 'import',  icon: <Upload size={14} /> },
  { id: 'docs',    icon: <FileText size={14} /> },
  { id: 'history', icon: <History size={14} /> },
] as const
type TabId = typeof TABS[number]['id']

interface Props { navigateTo: (view: ViewId) => void }

export default function ChannelMasterView({ navigateTo: _nav }: Props) {
  const { t } = useLang()
  const [tab, setTab] = useState<TabId>('orgs')

  const alertDocs = qualDocs.filter(d => ['expired', 'expiring-soon'].includes(d.status)).length
  const pendingAgents = channelAgents.filter(a => a.status === 'pending').length
  const suspendedOrgs = channelOrgs.filter(o => o.status === 'suspended').length

  const TAB_LABELS: Record<TabId, string> = {
    orgs: t.tabOrgs, agents: t.tabAgents, import: t.tabImport, docs: t.tabDocs, history: t.tabHistory,
  }

  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{t.cmTitle}</h1>
          <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{t.cmSubtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {suspendedOrgs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: C.redBg, border: `0.5px solid ${C.redBorder}`, fontSize: 12, fontWeight: 700, color: C.red }}>
              <XCircle size={12} />{t.cmAlertSuspended(suspendedOrgs)}
            </div>
          )}
          {alertDocs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 12, fontWeight: 700, color: C.amber }}>
              <AlertTriangle size={12} />{t.cmAlertDocs(alertDocs)}
            </div>
          )}
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: t.kpiTotalOrgs,     v: masterStats.totalOrgs,     color: C.text,    icon: <Building2 size={14} color={C.primary} /> },
          { label: t.kpiActiveOrgs,    v: masterStats.activeOrgs,    color: C.green,   icon: <CheckCircle2 size={14} color={C.green} /> },
          { label: t.kpiSuspendedOrgs, v: masterStats.suspendedOrgs, color: C.red,     icon: <XCircle size={14} color={C.red} /> },
          { label: t.kpiTotalAgents,   v: masterStats.totalAgents,   color: C.text,    icon: <Users size={14} color={C.primary} /> },
          { label: t.kpiActiveAgents,  v: masterStats.activeAgents,  color: C.green,   icon: <Activity size={14} color={C.green} /> },
          { label: t.kpiDocAlerts,     v: masterStats.expiringDocs + masterStats.missingDocs, color: C.amber, icon: <AlertTriangle size={14} color={C.amber} /> },
        ].map(s => (
          <GlassCard key={s.label} style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{s.label}</span>
              {s.icon}
            </div>
            <div style={{ ...mono, fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.v}</div>
          </GlassCard>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {TABS.map(tb => {
          const cnt = tb.id === 'docs' ? alertDocs : tb.id === 'agents' ? pendingAgents : 0
          const isActive = tab === tb.id
          return (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: isActive ? 700 : 500,
              background: isActive ? C.primaryLight : 'transparent',
              color: isActive ? C.primary : C.muted,
              border: isActive ? `0.5px solid ${C.border}` : '0.5px solid transparent',
              borderBottom: isActive ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
              cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>
              {tb.icon}{TAB_LABELS[tb.id]}
              {cnt > 0 && (
                <span style={{ background: tb.id === 'docs' ? C.red : C.amber, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{cnt}</span>
              )}
            </button>
          )
        })}
      </div>

      {tab === 'orgs'    && <OrgListTab />}
      {tab === 'agents'  && <AgentListTab />}
      {tab === 'import'  && <BulkImportTab />}
      {tab === 'docs'    && <DocManagementTab />}
      {tab === 'history' && <ChangeHistoryTab />}
    </div>
  )
}
