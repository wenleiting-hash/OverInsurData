import { useState, useRef, useCallback } from 'react'
import {
  Search, Plus, Edit2, Eye, Upload, Download, Filter,
  RefreshCw, FileText, AlertTriangle, CheckCircle2, Clock,
  X, Check, ChevronRight, Building2, User, Users, Loader2,
  ArrowUp, ArrowDown, Shield, History, XCircle, Phone,
  Mail, MapPin, ExternalLink, Globe, Layers, Tag,
  ChevronDown, BarChart2, MoreHorizontal, Link2, Briefcase,
  AlertCircle, FileCheck, FileMinus, FileX, Star,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import {
  channelOrgs, channelAgents, qualDocs, changeHistory,
  sampleImportResult, masterStats,
  ORG_TYPE_LABEL, ORG_TYPE_COLOR, ORG_STATUS_STYLE,
  AGENT_STATUS_STYLE, ROLE_LABEL,
  DOC_STATUS_STYLE, DOC_CATEGORY_LABEL,
  CHANGE_TYPE_STYLE,
  type ChannelOrg, type ChannelAgent,
  type OrgStatus, type AgentStatus, type DocCategory,
} from '../data/channelMasterData'

// ─── Design primitives ────────────────────────────────────────────────────────

const C = {
  border: 'rgba(193,198,215,0.38)',
  borderStrong: 'rgba(193,198,215,0.65)',
  surface: 'rgba(255,255,255,0.55)',
  surfaceHover: 'rgba(255,255,255,0.72)',
  muted: '#717786',
  mutedLight: '#A0A5B4',
  text: '#181C23',
  textSoft: '#414755',
  primary: '#0058BC',
  green: '#1C7A30',
  greenBg: 'rgba(34,197,94,0.10)',
  red: '#C0392B',
  redBg: 'rgba(255,59,48,0.09)',
  amber: '#A05C00',
  amberBg: 'rgba(255,159,10,0.10)',
  purple: '#6B35C2',
  purpleBg: 'rgba(123,63,202,0.10)',
}

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

function Badge({
  label, color = C.muted, bg = 'rgba(193,198,215,0.2)',
  dot, size = 'sm',
}: { label: string; color?: string; bg?: string; dot?: string; size?: 'xs' | 'sm' }) {
  const pad = size === 'xs' ? '1px 5px' : '2px 7px'
  const fs = size === 'xs' ? 10 : 11
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color, fontSize: fs, fontWeight: 700,
      borderRadius: 5, padding: pad, whiteSpace: 'nowrap', lineHeight: 1.4,
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
      {label}
    </span>
  )
}

function KpiCell({ label, value, color = C.text, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: 11, color: C.mutedLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ ...mono, fontSize: 14, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</span>
      {sub && <span style={{ fontSize: 10.5, color: C.mutedLight }}>{sub}</span>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: C.mutedLight,
      padding: '8px 12px 4px',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: '0.5px', background: C.border, margin: '4px 0' }} />
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function orgStatusBadge(s: OrgStatus) {
  const m = ORG_STATUS_STYLE[s]
  const dot = s === 'active' ? C.green : s === 'suspended' ? C.red : s === 'pending' ? C.amber : C.muted
  return <Badge label={m.label} color={m.color} bg={m.bg} dot={dot} />
}

function agentStatusBadge(s: AgentStatus) {
  const m = AGENT_STATUS_STYLE[s]
  const dot = s === 'active' ? C.green : s === 'suspended' || s === 'terminated' ? C.red : s === 'pending' ? C.amber : C.muted
  return <Badge label={m.label} color={m.color} bg={m.bg} dot={dot} />
}

function docStatusIcon(s: string) {
  if (s === 'valid') return <CheckCircle2 size={13} color={C.green} />
  if (s === 'expired') return <FileX size={13} color={C.red} />
  if (s === 'expiring-soon') return <FileMinus size={13} color={C.amber} />
  if (s === 'pending-review') return <Clock size={13} color={C.primary} />
  return <AlertCircle size={13} color={C.red} />
}

function fmt(n: number) {
  if (n === 0) return '—'
  return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`
}
function pct(n: number) { return n === 0 ? '—' : `${(n * 100).toFixed(1)}%` }
function lossColor(r: number) { return r === 0 ? C.muted : r > 0.65 ? C.red : r > 0.60 ? C.amber : C.green }
function renewColor(r: number) { return r === 0 ? C.muted : r >= 0.90 ? C.green : r >= 0.85 ? C.amber : C.red }

// ─── Table base styles ────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
  padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em',
  background: 'rgba(236,237,249,0.45)', borderBottom: `0.5px solid ${C.borderStrong}`,
  whiteSpace: 'nowrap',
}
const TD: React.CSSProperties = {
  padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`,
  color: C.text, verticalAlign: 'middle', fontSize: 12.5,
}

// ─── Panel shell ──────────────────────────────────────────────────────────────

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.60)',
      backdropFilter: 'blur(28px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
      border: `0.5px solid ${C.borderStrong}`,
      borderRadius: 14,
      boxShadow: '0 2px 16px rgba(0,58,152,0.06), 0 1px 2px rgba(0,0,0,0.03)',
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Toolbar row ──────────────────────────────────────────────────────────────

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`,
      background: 'rgba(249,249,255,0.5)',
    }}>
      {children}
    </div>
  )
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <Search size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: '100%', padding: '6px 10px 6px 28px',
          background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`,
          borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 24px 6px 10px', background: 'rgba(255,255,255,0.5)',
        border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12,
        color: C.textSoft, outline: 'none', cursor: 'pointer', fontFamily: 'inherit',
        appearance: 'none', minWidth: 110,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23717786'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function PrimaryBtn({ onClick, children, danger }: { onClick?: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '6px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
      background: danger ? C.red : C.primary, color: '#fff',
      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
      transition: 'opacity 0.12s',
    }}>
      {children}
    </button>
  )
}

function GhostBtn({ onClick, children, color }: { onClick?: () => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 600,
      color: color ?? C.textSoft, background: 'rgba(255,255,255,0.4)',
      border: `0.5px solid ${C.border}`, cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

// ─── Sort control ─────────────────────────────────────────────────────────────

function SortTH({ label, sortKey, active, dir, onSort }: { label: string; sortKey: string; active: boolean; dir: 'asc' | 'desc'; onSort: (k: string) => void }) {
  return (
    <th style={{ ...TH, cursor: 'pointer', userSelect: 'none' }} onClick={() => onSort(sortKey)}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: active ? C.primary : C.mutedLight }}>
        {label}
        {active ? (dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />) : <ArrowDown size={10} style={{ opacity: 0.3 }} />}
      </span>
    </th>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — 渠道机构 (Org list + detail drawer)
// ─────────────────────────────────────────────────────────────────────────────

function OrgDetailPanel({ org, onClose, onEdit, onStatusChange }: {
  org: ChannelOrg; onClose: () => void; onEdit: () => void; onStatusChange: (o: ChannelOrg) => void
}) {
  const [activeSection, setActiveSection] = useState<'info' | 'agents' | 'docs'>('info')
  const agents = channelAgents.filter(a => a.orgId === org.id)
  const docs = qualDocs.filter(d => d.ownerId === org.id)
  const tc = ORG_TYPE_COLOR[org.type]

  const alertDocs = docs.filter(d => d.status !== 'valid')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: `linear-gradient(135deg, ${tc}22, ${tc}0A)`,
              border: `1.5px solid ${tc}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Building2 size={19} color={tc} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{org.name}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{org.shortName} · {org.primaryState}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4, lineHeight: 1 }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {orgStatusBadge(org.status)}
          <Badge label={ORG_TYPE_LABEL[org.type]} color={tc} bg={`${tc}12`} />
          {org.tags.map(t => <Badge key={t} label={t} size="xs" />)}
        </div>

        {org.status === 'suspended' && org.notes && (
          <div style={{
            marginTop: 10, padding: '8px 10px', borderRadius: 8,
            background: C.redBg, border: `0.5px solid ${C.red}30`,
            fontSize: 11.5, color: '#8B1A1A', lineHeight: 1.5,
          }}>
            {org.notes}
          </div>
        )}
      </div>

      {/* KPI strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        padding: '12px 18px', gap: 12,
        borderBottom: `0.5px solid ${C.border}`,
        background: 'rgba(249,249,255,0.4)',
      }}>
        <KpiCell label="YTD保费" value={fmt(org.ytdPremium)} color={C.primary} />
        <KpiCell label="YTD佣金" value={fmt(org.ytdCommission)} color={C.green} />
        <KpiCell label="赔付率" value={pct(org.lossRatio)} color={lossColor(org.lossRatio)} />
        <KpiCell label="续保率" value={pct(org.renewalRate)} color={renewColor(org.renewalRate)} />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.3)' }}>
        {(['info', 'agents', 'docs'] as const).map(s => (
          <button key={s} onClick={() => setActiveSection(s)} style={{
            flex: 1, padding: '8px 4px', fontSize: 12, fontWeight: activeSection === s ? 700 : 500,
            color: activeSection === s ? C.primary : C.muted,
            background: 'none', border: 'none', borderBottom: activeSection === s ? `2px solid ${C.primary}` : '2px solid transparent',
            cursor: 'pointer', transition: 'all 0.12s',
          }}>
            {{ info: '基本信息', agents: `代理人 (${agents.length})`, docs: `文件 ${alertDocs.length > 0 ? `⚠${alertDocs.length}` : ''}` }[s]}
          </button>
        ))}
      </div>

      {/* Section body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {activeSection === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Identity */}
            <div>
              <SectionLabel>注册信息</SectionLabel>
              {[
                ['NPN编号', org.npn, true],
                ['税务ID (EIN)', org.taxId, true],
                ['合同编号', org.contractId ?? '—', true],
                ['入驻日期', org.joinDate, false],
                ['最近审核', org.lastReviewDate, false],
                ['负责人', org.managerName ?? '—', false],
                ['代理人数', String(org.agentCount), true],
              ].map(([k, v, isMono]) => (
                <div key={k as string} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 12px', borderBottom: `0.5px solid ${C.border}`, gap: 8,
                }}>
                  <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{k as string}</span>
                  <span style={{ ...(isMono ? mono : {}), fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'right' }}>{v as string}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div>
              <SectionLabel>联系方式</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <Mail size={12} color={C.muted} />
                  <a href={`mailto:${org.email}`} style={{ color: C.primary, textDecoration: 'none' }}>{org.email}</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <Phone size={12} color={C.muted} />
                  <span style={{ color: C.textSoft }}>{org.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5 }}>
                  <MapPin size={12} color={C.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ color: C.textSoft }}>{org.address}, {org.city}, {org.state} {org.zip}</span>
                </div>
                {org.website && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <Globe size={12} color={C.muted} />
                    <span style={{ color: C.primary }}>{org.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Licensed states */}
            <div>
              <SectionLabel>授权出单州 ({org.licenseStates.length})</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '4px 12px' }}>
                {org.licenseStates.map(s => (
                  <span key={s} style={{
                    ...mono, padding: '3px 8px', borderRadius: 5, fontSize: 12,
                    fontWeight: 700, background: 'rgba(0,88,188,0.08)', color: C.primary,
                  }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Parent */}
            {org.parentOrgName && (
              <div>
                <SectionLabel>上级机构</SectionLabel>
                <div style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <Link2 size={12} color={C.muted} />
                  <span style={{ fontWeight: 600, color: C.text }}>{org.parentOrgName}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'agents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {agents.map(a => {
              const as_ = AGENT_STATUS_STYLE[a.status]
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 9,
                  background: C.surface, border: `0.5px solid ${C.border}`,
                  gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(0,88,188,0.08)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <User size={13} color={C.primary} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.displayName}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{ROLE_LABEL[a.role]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <Badge label={as_.label} color={as_.color} bg={as_.bg} size="xs" />
                    <span style={{ ...mono, fontSize: 11, color: C.muted }}>{fmt(a.ytdPremium)}</span>
                  </div>
                </div>
              )
            })}
            {agents.length === 0 && <div style={{ textAlign: 'center', color: C.mutedLight, padding: '24px 0', fontSize: 13 }}>暂无代理人</div>}
          </div>
        )}

        {activeSection === 'docs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {docs.map(d => {
              const ds = DOC_STATUS_STYLE[d.status]
              return (
                <div key={d.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 10px', borderRadius: 9, gap: 10,
                  background: d.status !== 'valid' ? C.redBg : C.surface,
                  border: `0.5px solid ${d.status !== 'valid' ? `${C.red}25` : C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    {docStatusIcon(d.status)}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{DOC_CATEGORY_LABEL[d.category]}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                    <Badge label={ds.label} color={ds.color} bg={ds.bg} size="xs" />
                    {d.expiryDate && <span style={{ ...mono, fontSize: 10.5, color: d.status === 'expired' ? C.red : C.mutedLight }}>{d.expiryDate}</span>}
                  </div>
                </div>
              )
            })}
            {docs.length === 0 && <div style={{ textAlign: 'center', color: C.mutedLight, padding: '24px 0', fontSize: 13 }}>暂无文件</div>}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '10px 18px', borderTop: `0.5px solid ${C.border}`,
        display: 'flex', gap: 6, background: 'rgba(249,249,255,0.4)',
      }}>
        <PrimaryBtn onClick={onEdit}><Edit2 size={12} />编辑</PrimaryBtn>
        <GhostBtn onClick={() => onStatusChange(org)}>状态变更</GhostBtn>
        <GhostBtn><Upload size={12} />上传文件</GhostBtn>
      </div>
    </div>
  )
}

// ─── Org Form Modal ───────────────────────────────────────────────────────────

function OrgFormModal({ mode, org, onClose }: { mode: 'create' | 'edit'; org?: ChannelOrg; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)
  const totalSteps = 3
  const doSave = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose() }, 1200) }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(24,28,35,0.50)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 600, maxHeight: '88vh', overflowY: 'auto',
        background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(40px)',
        border: `0.5px solid ${C.borderStrong}`,
        borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        padding: '26px 30px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>
              {mode === 'create' ? '新增渠道机构' : `编辑 · ${org?.shortName}`}
            </h2>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>步骤 {step} / {totalSteps}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 22 }}>
          {['基本信息', '联系方式', '资质州域'].map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <div style={{
                height: 3, width: '100%', borderRadius: 2,
                background: i + 1 <= step ? C.primary : C.border,
                transition: 'background 0.2s',
              }} />
              <span style={{ fontSize: 10.5, color: i + 1 <= step ? C.primary : C.mutedLight, fontWeight: i + 1 === step ? 700 : 500 }}>{s}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: '机构全称 *', placeholder: '正式注册名称', value: org?.name ?? '', span: 2 },
              { label: '简称 *', placeholder: '内部简称', value: org?.shortName ?? '' },
              { label: '机构类型 *', placeholder: '', value: '', isSelect: true },
            ].map(f => (
              <div key={f.label} style={{ gridColumn: f.span === 2 ? '1/-1' : undefined }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
                {f.isSelect ? (
                  <select defaultValue={org?.type ?? 'agency'} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }}>
                    {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                ) : (
                  <input type="text" defaultValue={f.value} placeholder={f.placeholder} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }} />
                )}
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>NPN 编号 *</label>
              <input type="text" defaultValue={org?.npn ?? ''} placeholder="NPN12345678" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', ...mono, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>税务 ID (EIN) *</label>
              <input type="text" defaultValue={org?.taxId ?? ''} placeholder="XX-XXXXXXX" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', ...mono, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>上级机构</label>
              <select defaultValue={org?.parentOrgId ?? ''} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }}>
                <option value="">— 无（顶级机构）</option>
                {channelOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>合同编号</label>
              <input type="text" defaultValue={org?.contractId ?? ''} placeholder="CTR-YYYY-XXXX" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', ...mono, outline: 'none' }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: '联系邮箱 *', placeholder: 'contact@agency.com', value: org?.email ?? '' },
              { label: '联系电话', placeholder: '+1-xxx-xxx-xxxx', value: org?.phone ?? '' },
              { label: '官网', placeholder: 'www.agency.com', value: org?.website ?? '' },
              { label: '负责人', placeholder: '全名', value: org?.managerName ?? '' },
              { label: '地址', placeholder: '街道地址', value: org?.address ?? '', span: 2 },
              { label: '城市', placeholder: '', value: org?.city ?? '' },
              { label: '州', placeholder: 'CA', value: org?.state ?? '' },
              { label: '邮编', placeholder: '94105', value: org?.zip ?? '' },
            ].map(f => (
              <div key={f.label} style={{ gridColumn: (f as any).span === 2 ? '1/-1' : undefined }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type="text" defaultValue={f.value} placeholder={f.placeholder} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>主营州 *</label>
              <select defaultValue={org?.primaryState ?? 'CA'} style={{ padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }}>
                {['CA','TX','NY','FL','IL','WA','OR','NV','CO','GA','OH','PA','NJ','CT','MA'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>已授权出单州 (多选)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {['CA','TX','NY','FL','IL','WA','OR','NV','CO','GA','OH','PA','NJ','CT','MA','AZ','NC','VA','TN','MO'].map(s => {
                  const checked = (org?.licenseStates ?? ['CA']).includes(s)
                  return (
                    <label key={s} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                      background: checked ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.5)',
                      border: `0.5px solid ${checked ? C.primary : C.border}`,
                      fontSize: 12.5, fontWeight: 700, color: checked ? C.primary : C.textSoft,
                      ...mono,
                    }}>
                      <input type="checkbox" defaultChecked={checked} style={{ display: 'none' }} />{s}
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>标签 (回车分隔)</label>
              <input type="text" defaultValue={org?.tags.join(', ') ?? ''} placeholder="如：白标合作, 高绩效…" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>备注</label>
              <textarea defaultValue={org?.notes ?? ''} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22 }}>
          {step > 1 ? <GhostBtn onClick={() => setStep(s => s - 1)}>← 上一步</GhostBtn> : <span />}
          {step < totalSteps
            ? <PrimaryBtn onClick={() => setStep(s => s + 1)}>下一步 →</PrimaryBtn>
            : <PrimaryBtn onClick={doSave}>{saving ? <><Loader2 size={12} className="animate-spin" />保存中…</> : <><Check size={12} />保存机构</>}</PrimaryBtn>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Status change modal ──────────────────────────────────────────────────────

function StatusModal({ entity, entityType, onClose }: { entity: ChannelOrg | ChannelAgent; entityType: 'org' | 'agent'; onClose: () => void }) {
  const [newStatus, setNewStatus] = useState<string>('active')
  const [reason, setReason] = useState('')
  const name = (entity as ChannelOrg).name ?? (entity as ChannelAgent).displayName
  const options = entityType === 'org'
    ? Object.entries(ORG_STATUS_STYLE).map(([k, v]) => ({ value: k, label: v.label }))
    : Object.entries(AGENT_STATUS_STYLE).map(([k, v]) => ({ value: k, label: v.label }))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(24,28,35,0.50)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 440, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(40px)', border: `0.5px solid ${C.borderStrong}`, borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.15)', padding: '24px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: C.text, margin: 0 }}>状态变更</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={15} /></button>
        </div>
        <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 16, background: 'rgba(0,88,188,0.05)', padding: '8px 10px', borderRadius: 8 }}>
          <strong style={{ color: C.text }}>{name}</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>新状态</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {options.map(o => (
                <button key={o.value} onClick={() => setNewStatus(o.value)} style={{
                  padding: '5px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  background: newStatus === o.value ? C.primary : 'rgba(255,255,255,0.5)',
                  color: newStatus === o.value ? '#fff' : C.textSoft,
                  border: `0.5px solid ${newStatus === o.value ? C.primary : C.border}`,
                }}>{o.label}</button>
              ))}
            </div>
          </div>
          {newStatus === 'suspended' && (
            <div style={{ padding: '8px 10px', borderRadius: 8, background: C.redBg, border: `0.5px solid ${C.red}25`, fontSize: 12, color: '#8B1A1A' }}>
              ⚠ 暂停后该{entityType === 'org' ? '机构及其所属代理人' : '代理人'}的出单权限将立即停止。
            </div>
          )}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>变更原因 <span style={{ color: C.red }}>*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="请说明变更原因（将记录至变更历史）…" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <GhostBtn onClick={onClose}>取消</GhostBtn>
          <PrimaryBtn onClick={onClose} danger={newStatus === 'suspended' || newStatus === 'terminated'}>
            <Check size={12} />确认变更
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 body
// ─────────────────────────────────────────────────────────────────────────────

function OrgListTab() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [selected, setSelected] = useState<ChannelOrg | null>(channelOrgs[0])
  const [showForm, setShowForm] = useState(false)
  const [editOrg, setEditOrg] = useState<ChannelOrg | undefined>()
  const [statusTarget, setStatusTarget] = useState<ChannelOrg | null>(null)
  const [sortKey, setSortKey] = useState('ytdPremium')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const doSort = (k: string) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc') } }

  const filtered = channelOrgs
    .filter(o => (statusF === 'all' || o.status === statusF) && (typeF === 'all' || o.type === typeF) && (!search || o.name.toLowerCase().includes(search.toLowerCase()) || o.npn.includes(search)))
    .sort((a, b) => {
      const v = (a as any)[sortKey] - (b as any)[sortKey]
      return sortDir === 'asc' ? v : -v
    })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 14, alignItems: 'start' }}>
      <Panel>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索机构名、NPN、州…" />
          <Select value={statusF} onChange={setStatusF} options={[{ value: 'all', label: '全部状态' }, ...Object.entries(ORG_STATUS_STYLE).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <Select value={typeF} onChange={setTypeF} options={[{ value: 'all', label: '全部类型' }, ...Object.entries(ORG_TYPE_LABEL).map(([k, v]) => ({ value: k, label: v }))]} />
          <PrimaryBtn onClick={() => { setEditOrg(undefined); setShowForm(true) }}><Plus size={13} />新增机构</PrimaryBtn>
        </Toolbar>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={TH}>机构名称</th>
                <th style={TH}>类型 / 状态</th>
                <th style={{ ...TH, ...mono }}>NPN</th>
                <th style={TH}>主营 / 授权州</th>
                <th style={TH}>代理人</th>
                <SortTH label="YTD保费" sortKey="ytdPremium" active={sortKey === 'ytdPremium'} dir={sortDir} onSort={doSort} />
                <SortTH label="赔付率" sortKey="lossRatio" active={sortKey === 'lossRatio'} dir={sortDir} onSort={doSort} />
                <SortTH label="续保率" sortKey="renewalRate" active={sortKey === 'renewalRate'} dir={sortDir} onSort={doSort} />
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(org => {
                const tc = ORG_TYPE_COLOR[org.type]
                const isSelected = selected?.id === org.id
                return (
                  <tr
                    key={org.id}
                    onClick={() => setSelected(isSelected ? null : org)}
                    style={{
                      background: isSelected ? `rgba(0,88,188,0.04)` : 'transparent',
                      cursor: 'pointer', transition: 'background 0.1s',
                      outline: isSelected ? `1.5px solid rgba(0,88,188,0.15)` : 'none',
                      outlineOffset: -1,
                    }}
                  >
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${tc}0E`, border: `1px solid ${tc}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={14} color={tc} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{org.name}</div>
                          <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{org.contractId ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Badge label={ORG_TYPE_LABEL[org.type]} color={tc} bg={`${tc}12`} size="xs" />
                        {orgStatusBadge(org.status)}
                      </div>
                    </td>
                    <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.textSoft }}>{org.npn}</td>
                    <td style={TD}>
                      <div style={{ ...mono, fontWeight: 700, fontSize: 13, color: C.text }}>{org.primaryState}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 3 }}>
                        {org.licenseStates.slice(0, 4).map(s => <span key={s} style={{ ...mono, fontSize: 10, background: 'rgba(0,88,188,0.07)', color: C.primary, borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>{s}</span>)}
                        {org.licenseStates.length > 4 && <span style={{ fontSize: 10, color: C.mutedLight }}>+{org.licenseStates.length - 4}</span>}
                      </div>
                    </td>
                    <td style={{ ...TD, ...mono, textAlign: 'center', fontWeight: 700 }}>{org.agentCount}</td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: org.ytdPremium > 0 ? C.primary : C.mutedLight }}>{fmt(org.ytdPremium)}</td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: lossColor(org.lossRatio) }}>{pct(org.lossRatio)}</td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: renewColor(org.renewalRate) }}>{pct(org.renewalRate)}</td>
                    <td style={{ ...TD }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => setSelected(org)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="详情"><Eye size={13} /></button>
                        <button onClick={() => { setEditOrg(org); setShowForm(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="编辑"><Edit2 size={13} /></button>
                        <button onClick={() => setStatusTarget(org)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="状态"><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight, display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: C.text }}>{filtered.length}</strong> 家机构</span>
          <span>正常 {filtered.filter(o => o.status === 'active').length} · 暂停 {filtered.filter(o => o.status === 'suspended').length}</span>
        </div>
      </Panel>

      {selected && (
        <Panel style={{ position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <OrgDetailPanel
            org={selected}
            onClose={() => setSelected(null)}
            onEdit={() => { setEditOrg(selected); setShowForm(true) }}
            onStatusChange={o => setStatusTarget(o)}
          />
        </Panel>
      )}

      {showForm && <OrgFormModal mode={editOrg ? 'edit' : 'create'} org={editOrg} onClose={() => setShowForm(false)} />}
      {statusTarget && <StatusModal entity={statusTarget} entityType="org" onClose={() => setStatusTarget(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — 代理人
// ─────────────────────────────────────────────────────────────────────────────

function AgentDetailPanel({ agent, onClose, onEdit, onStatusChange }: {
  agent: ChannelAgent; onClose: () => void; onEdit: () => void; onStatusChange: () => void
}) {
  const as_ = AGENT_STATUS_STYLE[agent.status]
  const docs = qualDocs.filter(d => d.ownerId === agent.id)
  const alertDocs = docs.filter(d => d.status !== 'valid')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 18px', borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,88,188,0.09)', border: '1.5px solid rgba(0,88,188,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <User size={19} color={C.primary} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{agent.displayName}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{ROLE_LABEL[agent.role]} · {agent.orgName.split(' ').slice(0, 2).join(' ')}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={15} /></button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {agentStatusBadge(agent.status)}
          <Badge label={ROLE_LABEL[agent.role]} color={C.primary} bg="rgba(0,88,188,0.08)" size="xs" />
          {alertDocs.length > 0 && <Badge label={`文件预警 ${alertDocs.length}`} color={C.amber} bg={C.amberBg} size="xs" />}
        </div>
        {agent.notes && (
          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 7, background: C.amberBg, border: `0.5px solid ${C.amber}30`, fontSize: 11.5, color: '#7A4800' }}>
            {agent.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: '12px 18px', gap: 10, borderBottom: `0.5px solid ${C.border}`, background: 'rgba(249,249,255,0.4)' }}>
        <KpiCell label="YTD保费" value={fmt(agent.ytdPremium)} color={C.primary} />
        <KpiCell label="保单数" value={agent.policyCount > 0 ? String(agent.policyCount) : '—'} />
        <KpiCell label="续保率" value={pct(agent.renewalRate)} color={renewColor(agent.renewalRate)} />
        <KpiCell label="YTD佣金" value={fmt(agent.ytdCommission)} color={C.green} />
        <KpiCell label="客户数" value={agent.clientCount > 0 ? String(agent.clientCount) : '—'} />
        <KpiCell label="赔付率" value={pct(agent.lossRatio)} color={lossColor(agent.lossRatio)} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <SectionLabel>身份信息</SectionLabel>
            {[
              ['NPN编号', agent.npn, true], ['邮箱', agent.email, false],
              ['电话', agent.phone, false], ['所属机构', agent.orgName, false],
              ['入驻日期', agent.joinDate, false], ['最后活跃', agent.lastActiveDate, false],
            ].map(([k, v, isMono]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `0.5px solid ${C.border}`, gap: 8 }}>
                <span style={{ fontSize: 12, color: C.muted, flexShrink: 0 }}>{k as string}</span>
                <span style={{ ...(isMono ? mono : {}), fontSize: 12, fontWeight: 600, color: C.text, textAlign: 'right' }}>{v as string}</span>
              </div>
            ))}
          </div>
          <div>
            <SectionLabel>授权出单州</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '4px 12px' }}>
              {agent.licenseStates.map(s => <span key={s} style={{ ...mono, padding: '3px 8px', borderRadius: 5, fontSize: 12, fontWeight: 700, background: 'rgba(0,88,188,0.08)', color: C.primary }}>{s}</span>)}
            </div>
          </div>
          {docs.length > 0 && (
            <div>
              <SectionLabel>资质文件 ({docs.length})</SectionLabel>
              {docs.map(d => {
                const ds = DOC_STATUS_STYLE[d.status]
                return (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `0.5px solid ${C.border}`, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {docStatusIcon(d.status)}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</div>
                        <div style={{ fontSize: 10.5, color: C.mutedLight }}>{DOC_CATEGORY_LABEL[d.category]}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <Badge label={ds.label} color={ds.color} bg={ds.bg} size="xs" />
                      {d.expiryDate && <span style={{ ...mono, fontSize: 10, color: d.status === 'expired' ? C.red : C.mutedLight }}>{d.expiryDate}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 18px', borderTop: `0.5px solid ${C.border}`, display: 'flex', gap: 6, background: 'rgba(249,249,255,0.4)' }}>
        <PrimaryBtn onClick={onEdit}><Edit2 size={12} />编辑</PrimaryBtn>
        <GhostBtn onClick={onStatusChange}>状态变更</GhostBtn>
        <GhostBtn><Upload size={12} />上传文件</GhostBtn>
      </div>
    </div>
  )
}

function AgentFormModal({ mode, agent, onClose }: { mode: 'create' | 'edit'; agent?: ChannelAgent; onClose: () => void }) {
  const [saving, setSaving] = useState(false)
  const doSave = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose() }, 1200) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(24,28,35,0.50)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 580, maxHeight: '88vh', overflowY: 'auto', background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(40px)', border: `0.5px solid ${C.borderStrong}`, borderRadius: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', padding: '26px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0 }}>{mode === 'create' ? '新增代理人' : `编辑 · ${agent?.displayName}`}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: '名 (First Name) *', value: agent?.firstName ?? '', mono: false },
            { label: '姓 (Last Name) *', value: agent?.lastName ?? '', mono: false },
            { label: '邮箱 *', value: agent?.email ?? '', mono: false },
            { label: '电话', value: agent?.phone ?? '', mono: false },
            { label: 'NPN 编号 *', value: agent?.npn ?? '', mono: true },
            { label: '主营州 *', value: agent?.primaryState ?? '', mono: true },
          ].map(f => (
            <div key={f.label}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
              <input type="text" defaultValue={f.value} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', ...(f.mono ? mono : {}), outline: 'none' }} />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>所属机构 *</label>
            <select defaultValue={agent?.orgId ?? ''} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }}>
              {channelOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>角色</label>
            <select defaultValue={agent?.role ?? 'agent'} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', outline: 'none' }}>
              {Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>授权出单州</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['CA','TX','NY','FL','IL','WA','OR','NV','CO','GA','OH','PA','NJ','CT','MA'].map(s => {
              const checked = (agent?.licenseStates ?? []).includes(s)
              return (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', background: checked ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', border: `0.5px solid ${checked ? C.primary : C.border}`, fontSize: 12.5, fontWeight: 700, color: checked ? C.primary : C.textSoft, ...mono }}>
                  <input type="checkbox" defaultChecked={checked} style={{ display: 'none' }} />{s}
                </label>
              )
            })}
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>备注</label>
          <textarea defaultValue={agent?.notes ?? ''} rows={2} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <GhostBtn onClick={onClose}>取消</GhostBtn>
          <PrimaryBtn onClick={doSave}>{saving ? <><Loader2 size={12} className="animate-spin" />保存中…</> : <><Check size={12} />保存代理人</>}</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

function AgentListTab() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [orgF, setOrgF] = useState('all')
  const [selected, setSelected] = useState<ChannelAgent | null>(channelAgents[0])
  const [showForm, setShowForm] = useState(false)
  const [editAgent, setEditAgent] = useState<ChannelAgent | undefined>()
  const [statusTarget, setStatusTarget] = useState<ChannelAgent | null>(null)
  const [sortKey, setSortKey] = useState('ytdPremium')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const doSort = (k: string) => { if (k === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('desc') } }

  const filtered = channelAgents
    .filter(a => (statusF === 'all' || a.status === statusF) && (orgF === 'all' || a.orgId === orgF) && (!search || a.displayName.toLowerCase().includes(search.toLowerCase()) || a.npn.includes(search) || a.email.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => { const v = (a as any)[sortKey] - (b as any)[sortKey]; return sortDir === 'asc' ? v : -v })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 14, alignItems: 'start' }}>
      <Panel>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索姓名、邮箱、NPN…" />
          <Select value={statusF} onChange={setStatusF} options={[{ value: 'all', label: '全部状态' }, ...Object.entries(AGENT_STATUS_STYLE).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <Select value={orgF} onChange={setOrgF} options={[{ value: 'all', label: '全部机构' }, ...channelOrgs.map(o => ({ value: o.id, label: o.shortName }))]} />
          <PrimaryBtn onClick={() => { setEditAgent(undefined); setShowForm(true) }}><Plus size={13} />新增代理人</PrimaryBtn>
        </Toolbar>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>代理人</th>
                <th style={TH}>机构</th>
                <th style={TH}>状态 / 角色</th>
                <th style={TH}>授权州</th>
                <SortTH label="YTD保费" sortKey="ytdPremium" active={sortKey === 'ytdPremium'} dir={sortDir} onSort={doSort} />
                <SortTH label="保单数" sortKey="policyCount" active={sortKey === 'policyCount'} dir={sortDir} onSort={doSort} />
                <SortTH label="赔付率" sortKey="lossRatio" active={sortKey === 'lossRatio'} dir={sortDir} onSort={doSort} />
                <th style={TH}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(agent => {
                const as_ = AGENT_STATUS_STYLE[agent.status]
                const isSelected = selected?.id === agent.id
                return (
                  <tr key={agent.id} onClick={() => setSelected(isSelected ? null : agent)} style={{ background: isSelected ? 'rgba(0,88,188,0.04)' : 'transparent', cursor: 'pointer', outline: isSelected ? '1.5px solid rgba(0,88,188,0.15)' : 'none', outlineOffset: -1 }}>
                    <td style={TD}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <User size={13} color={C.primary} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{agent.displayName}</div>
                          <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{agent.npn}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...TD, fontSize: 12, color: C.textSoft, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.orgName.split(' ').slice(0, 3).join(' ')}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {agentStatusBadge(agent.status)}
                        <span style={{ fontSize: 11, color: C.mutedLight }}>{ROLE_LABEL[agent.role]}</span>
                      </div>
                    </td>
                    <td style={TD}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {agent.licenseStates.map(s => <span key={s} style={{ ...mono, fontSize: 10, background: 'rgba(0,88,188,0.07)', color: C.primary, borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>{s}</span>)}
                      </div>
                    </td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: agent.ytdPremium > 0 ? C.primary : C.mutedLight }}>{fmt(agent.ytdPremium)}</td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: C.text }}>{agent.policyCount > 0 ? agent.policyCount : '—'}</td>
                    <td style={{ ...TD, ...mono, fontWeight: 700, color: lossColor(agent.lossRatio) }}>{pct(agent.lossRatio)}</td>
                    <td style={TD} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => setSelected(agent)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><Eye size={13} /></button>
                        <button onClick={() => { setEditAgent(agent); setShowForm(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><Edit2 size={13} /></button>
                        <button onClick={() => setStatusTarget(agent)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight, display: 'flex', justifyContent: 'space-between' }}>
          <span>共 <strong style={{ color: C.text }}>{filtered.length}</strong> 名代理人</span>
          <span>在职 {filtered.filter(a => a.status === 'active').length} · 待审批 {filtered.filter(a => a.status === 'pending').length}</span>
        </div>
      </Panel>

      {selected && (
        <Panel style={{ position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <AgentDetailPanel agent={selected} onClose={() => setSelected(null)} onEdit={() => { setEditAgent(selected); setShowForm(true) }} onStatusChange={() => setStatusTarget(selected)} />
        </Panel>
      )}

      {showForm && <AgentFormModal mode={editAgent ? 'edit' : 'create'} agent={editAgent} onClose={() => setShowForm(false)} />}
      {statusTarget && <StatusModal entity={statusTarget} entityType="agent" onClose={() => setStatusTarget(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — 批量导入
// ─────────────────────────────────────────────────────────────────────────────

function BulkImportTab() {
  const [step, setStep] = useState<'idle' | 'parsing' | 'done'>('idle')
  const [dragging, setDragging] = useState(false)
  const [filename, setFilename] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const r = sampleImportResult

  const handleFile = (name: string) => {
    setFilename(name); setStep('parsing')
    setTimeout(() => setStep('done'), 1800)
  }

  const FIELDS = [
    ['first_name *', '代理人名（英文）', true],
    ['last_name *', '代理人姓（英文）', true],
    ['email *', '邮箱地址', true],
    ['npn *', 'National Producer Number（8-10位数字）', true],
    ['primary_state *', '主营州（两字母代码，如 CA）', true],
    ['license_states', '授权州列表（逗号分隔，如 CA,TX,NY）', false],
    ['org_npn *', '所属机构 NPN（须已录入系统）', true],
    ['role', 'agent / senior-agent / manager / principal', false],
    ['phone', '电话（可选）', false],
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {step === 'idle' && (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f.name) }}
              onClick={() => fileRef.current?.click()}
              style={{
                borderRadius: 14, border: `1.5px dashed ${dragging ? C.primary : C.border}`,
                background: dragging ? 'rgba(0,88,188,0.04)' : C.surface,
                padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 14, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={24} color={C.primary} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>拖拽或点击上传</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>支持 .xlsx · .xls · .csv，单次最多 500 行</div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f.name) }} />
            </div>

            <Panel>
              <div style={{ padding: '12px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} color={C.primary} />导入模板字段说明</div>
                <GhostBtn><Download size={12} />下载模板</GhostBtn>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>字段名</th>
                    <th style={TH}>说明</th>
                    <th style={{ ...TH, textAlign: 'center' as const }}>必填</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map(([f, d, req]) => (
                    <tr key={f as string}>
                      <td style={{ ...TD, ...mono, fontSize: 12, color: C.primary, fontWeight: 700 }}>{(f as string).replace(' *', '')}</td>
                      <td style={{ ...TD, fontSize: 12, color: C.textSoft }}>{d as string}</td>
                      <td style={{ ...TD, textAlign: 'center' as const }}>{req ? <span style={{ color: C.red, fontWeight: 700 }}>✓</span> : <span style={{ color: C.mutedLight }}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </>
        )}

        {step === 'parsing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={28} color={C.primary} className="animate-spin" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>解析并校验字段中…</div>
              <div style={{ ...mono, fontSize: 12.5, color: C.muted, marginTop: 4 }}>{filename}</div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: '总行数', v: r.total, color: C.text },
                { label: '成功导入', v: r.success, color: C.green },
                { label: '导入失败', v: r.failed, color: C.red },
                { label: '已跳过(重复)', v: r.skipped, color: C.amber },
              ].map(s => (
                <Panel key={s.label}>
                  <div style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.v}</div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 5 }}>{s.label}</div>
                  </div>
                </Panel>
              ))}
            </div>

            {r.errors.length > 0 && (
              <Panel>
                <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} color={C.red} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>错误详情 ({r.errors.length})</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['行号', '字段', '错误说明'].map(h => <th key={h} style={TH}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {r.errors.map(e => (
                      <tr key={e.row}>
                        <td style={{ ...TD, ...mono, fontWeight: 700, color: C.red }}>第 {e.row} 行</td>
                        <td style={{ ...TD, ...mono, color: C.textSoft }}>{e.field}</td>
                        <td style={{ ...TD, fontSize: 12.5, color: C.textSoft }}>{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            )}

            <div style={{ padding: '10px 14px', borderRadius: 10, background: C.greenBg, border: `0.5px solid ${C.green}30`, fontSize: 13, color: '#1A5C26', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={14} color={C.green} />
              {r.success} 名代理人已成功导入系统，系统将自动触发 NIPR 验证流程。
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <GhostBtn onClick={() => { setStep('idle'); setFilename('') }}><RefreshCw size={12} />重新上传</GhostBtn>
              {r.errors.length > 0 && <GhostBtn><Download size={12} />下载错误报告</GhostBtn>}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.textSoft, padding: '4px 0' }}>历史导入记录</div>
        {[
          { date: '2026-08-10', file: 'agents_aug2026.xlsx', total: 18, success: 17, failed: 1 },
          { date: '2026-05-15', file: 'midwest_agents.csv', total: 8, success: 8, failed: 0 },
          { date: '2023-01-10', file: 'initial_import.xlsx', total: 65, success: 63, failed: 2 },
        ].map(h => (
          <Panel key={h.date}>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.file}</div>
              <div style={{ fontSize: 11.5, color: C.mutedLight, marginBottom: 6 }}>{h.date}</div>
              <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                <span style={{ color: C.green, fontWeight: 700 }}>✓ {h.success}</span>
                {h.failed > 0 && <span style={{ color: C.red, fontWeight: 700 }}>✗ {h.failed}</span>}
                <span style={{ color: C.mutedLight }}>共 {h.total}</span>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 4 — 资质文件管理
// ─────────────────────────────────────────────────────────────────────────────

function DocManagementTab() {
  const [catF, setCatF] = useState('all')
  const [ownerF, setOwnerF] = useState('all')
  const [statusF, setStatusF] = useState('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = qualDocs.filter(d =>
    (catF === 'all' || d.category === catF) &&
    (ownerF === 'all' || d.ownerType === ownerF) &&
    (statusF === 'all' || d.status === statusF) &&
    (!search || d.ownerName.toLowerCase().includes(search.toLowerCase()) || d.name.toLowerCase().includes(search.toLowerCase()))
  )

  const alerts = qualDocs.filter(d => ['expired', 'expiring-soon'].includes(d.status))

  const docStatusCounts = {
    valid: qualDocs.filter(d => d.status === 'valid').length,
    expiringSoon: qualDocs.filter(d => d.status === 'expiring-soon').length,
    expired: qualDocs.filter(d => d.status === 'expired').length,
    pendingReview: qualDocs.filter(d => d.status === 'pending-review').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Status overview strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: '有效文件', count: docStatusCounts.valid, color: C.green, icon: <FileCheck size={16} color={C.green} /> },
          { label: '即将到期', count: docStatusCounts.expiringSoon, color: C.amber, icon: <FileMinus size={16} color={C.amber} /> },
          { label: '已过期', count: docStatusCounts.expired, color: C.red, icon: <FileX size={16} color={C.red} /> },
          { label: '待审核', count: docStatusCounts.pendingReview, color: C.primary, icon: <Clock size={16} color={C.primary} /> },
        ].map(s => (
          <Panel key={s.label}>
            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: C.redBg, border: `0.5px solid ${C.red}30` }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.red, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><AlertTriangle size={13} />需要关注 ({alerts.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {alerts.map(d => {
              const ds = DOC_STATUS_STYLE[d.status]
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge label={ds.label} color={ds.color} bg={ds.bg} size="xs" />
                    <span style={{ fontWeight: 600, color: C.text }}>{d.ownerName.split(' ').slice(0, 2).join(' ')}</span>
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

      <Panel>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索文件名或所有人…" />
          <Select value={catF} onChange={setCatF} options={[{ value: 'all', label: '全部类型' }, ...Object.entries(DOC_CATEGORY_LABEL).map(([k, v]) => ({ value: k, label: v }))]} />
          <Select value={ownerF} onChange={setOwnerF} options={[{ value: 'all', label: '机构 + 代理' }, { value: 'org', label: '机构文件' }, { value: 'agent', label: '代理人文件' }]} />
          <Select value={statusF} onChange={setStatusF} options={[{ value: 'all', label: '全部状态' }, ...Object.entries(DOC_STATUS_STYLE).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <PrimaryBtn onClick={() => fileRef.current?.click()}><Upload size={12} />上传文件</PrimaryBtn>
          <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={() => { setUploading(true); setTimeout(() => setUploading(false), 1500) }} />
        </Toolbar>
        {uploading && (
          <div style={{ padding: '8px 14px', background: 'rgba(0,88,188,0.05)', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.primary }}>
            <Loader2 size={13} className="animate-spin" />上传并校验文件中…
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['所属', '文件名称', '类型', '版本', '上传日期', '到期日', '状态', '操作'].map(h => <th key={h} style={TH}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtered.map((doc, i) => {
              const ds = DOC_STATUS_STYLE[doc.status]
              return (
                <tr key={doc.id} style={{ background: doc.status !== 'valid' ? `${C.redBg}` : i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {doc.ownerType === 'org' ? <Building2 size={12} color={C.muted} /> : <User size={12} color={C.muted} />}
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.ownerName.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                  </td>
                  <td style={{ ...TD, fontWeight: 600, color: C.text, fontSize: 12.5 }}>{doc.name}</td>
                  <td style={TD}><Badge label={DOC_CATEGORY_LABEL[doc.category]} color={C.primary} bg="rgba(0,88,188,0.08)" size="xs" /></td>
                  <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.muted }}>v{doc.version}</td>
                  <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.mutedLight }}>{doc.uploadedDate}</td>
                  <td style={{ ...TD, ...mono, fontSize: 12, color: doc.status === 'expired' ? C.red : doc.status === 'expiring-soon' ? C.amber : C.textSoft, fontWeight: doc.status !== 'valid' ? 700 : 400 }}>
                    {doc.expiryDate ?? '—'}
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Badge label={ds.label} color={ds.color} bg={ds.bg} size="xs" />
                      {doc.reviewNote && <span style={{ fontSize: 10, color: C.red, maxWidth: 120 }}>{doc.reviewNote.slice(0, 28)}…</span>}
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="预览"><Eye size={13} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="下载"><Download size={13} /></button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }} title="更新版本"><Upload size={13} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
          显示 {filtered.length} / {qualDocs.length} 份文件
        </div>
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 5 — 变更历史
// ─────────────────────────────────────────────────────────────────────────────

function ChangeHistoryTab() {
  const [entityF, setEntityF] = useState('all')
  const [typeF, setTypeF] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = changeHistory
    .filter(c => (entityF === 'all' || c.entityType === entityF) && (typeF === 'all' || c.changeType === typeF) && (!search || c.entityName.toLowerCase().includes(search.toLowerCase()) || c.operator.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Panel>
        <Toolbar>
          <SearchInput value={search} onChange={setSearch} placeholder="搜索实体或操作人…" />
          <Select value={entityF} onChange={setEntityF} options={[{ value: 'all', label: '机构 + 代理' }, { value: 'org', label: '机构变更' }, { value: 'agent', label: '代理人变更' }]} />
          <Select value={typeF} onChange={setTypeF} options={[{ value: 'all', label: '全部操作' }, ...Object.entries(CHANGE_TYPE_STYLE).map(([k, v]) => ({ value: k, label: v.label }))]} />
        </Toolbar>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          {/* Timeline rail */}
          <div style={{ position: 'absolute', left: 34, top: 0, bottom: 0, width: 1.5, background: C.border, zIndex: 0 }} />

          {filtered.map((c, i) => {
            const cts = CHANGE_TYPE_STYLE[c.changeType]
            return (
              <div key={c.id} style={{ display: 'flex', gap: 14, paddingBottom: i < filtered.length - 1 ? 18 : 0, position: 'relative', zIndex: 1 }}>
                {/* Node */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: `${cts.color}14`, border: `2px solid ${cts.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 4,
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: cts.color }} />
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  background: C.surface, border: `0.5px solid ${C.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Badge label={cts.label} color={cts.color} bg={cts.bg} size="xs" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{c.entityName}</span>
                      <Badge label={c.entityType === 'org' ? '机构' : '代理人'} color={c.entityType === 'org' ? C.primary : C.purple} bg={c.entityType === 'org' ? 'rgba(0,88,188,0.08)' : C.purpleBg} size="xs" />
                    </div>
                    <span style={{ ...mono, fontSize: 11, color: C.mutedLight, whiteSpace: 'nowrap', flexShrink: 0 }}>{c.timestamp.replace('T', ' ')}</span>
                  </div>

                  {c.field && (
                    <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 3 }}>
                      字段：<strong style={{ color: C.text }}>{c.field}</strong>
                      {c.oldValue && <> &nbsp;<span style={{ color: C.mutedLight }}>{c.oldValue}</span> → <strong style={{ color: C.primary }}>{c.newValue}</strong></>}
                    </div>
                  )}
                  {c.note && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{c.note}</div>}
                  <div style={{ marginTop: 5, fontSize: 11.5, color: C.mutedLight, display: 'flex', gap: 12 }}>
                    <span>操作人：<strong style={{ color: C.textSoft }}>{c.operator}</strong></span>
                    <span>{c.operatorRole}</span>
                    {c.ipAddress && <span style={{ ...mono }}>{c.ipAddress}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
          共 {filtered.length} 条变更记录
        </div>
      </Panel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'orgs',    icon: <Building2 size={14} />, label: '渠道机构' },
  { id: 'agents',  icon: <Users size={14} />,      label: '代理人' },
  { id: 'import',  icon: <Upload size={14} />,     label: '批量导入' },
  { id: 'docs',    icon: <FileText size={14} />,   label: '资质文件' },
  { id: 'history', icon: <History size={14} />,    label: '变更历史' },
] as const
type TabId = typeof TABS[number]['id']

interface Props { navigateTo: (view: ViewId) => void }

export default function ChannelMasterView({ navigateTo: _nav }: Props) {
  const [tab, setTab] = useState<TabId>('orgs')

  const alertDocs = qualDocs.filter(d => ['expired', 'expiring-soon'].includes(d.status)).length
  const pendingAgents = channelAgents.filter(a => a.status === 'pending').length
  const suspendedOrgs = channelOrgs.filter(o => o.status === 'suspended').length

  return (
    <div>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>渠道主数据管理</h1>
          <p style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>渠道机构 · 代理人 · 批量导入 · 资质文件 · 变更历史</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {suspendedOrgs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: C.redBg, border: `0.5px solid ${C.red}30`, fontSize: 12, fontWeight: 700, color: C.red }}>
              <XCircle size={12} />{suspendedOrgs} 家机构已暂停
            </div>
          )}
          {alertDocs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: C.amberBg, border: `0.5px solid ${C.amber}30`, fontSize: 12, fontWeight: 700, color: C.amber }}>
              <AlertTriangle size={12} />{alertDocs} 份文件需关注
            </div>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: '机构总数',    v: masterStats.totalOrgs,   color: C.primary },
          { label: '正常机构',    v: masterStats.activeOrgs,  color: C.green   },
          { label: '暂停机构',    v: masterStats.suspendedOrgs, color: C.red   },
          { label: '代理人总数',  v: masterStats.totalAgents, color: C.purple  },
          { label: '在职代理人',  v: masterStats.activeAgents, color: C.green  },
          { label: '文件预警',    v: masterStats.expiringDocs + masterStats.missingDocs, color: C.amber },
        ].map(s => (
          <Panel key={s.label}>
            <div style={{ padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div>
            </div>
          </Panel>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {TABS.map(t => {
          const cnt = t.id === 'docs' ? alertDocs : t.id === 'agents' ? pendingAgents : 0
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
              borderRadius: '10px 10px 0 0', fontSize: 13,
              fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? 'rgba(0,88,188,0.07)' : 'transparent',
              color: tab === t.id ? C.primary : C.muted,
              border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent',
              borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent',
              cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>
              {t.icon}{t.label}
              {cnt > 0 && <span style={{ background: t.id === 'docs' ? C.red : C.amber, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{cnt}</span>}
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
