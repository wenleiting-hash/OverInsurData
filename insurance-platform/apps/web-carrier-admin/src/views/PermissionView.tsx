import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Shield, Database, Zap, Plus, Edit2, Trash2, Copy, Search,
  Check, X, ChevronDown, ChevronRight, Lock, Unlock, Eye, EyeOff,
  AlertCircle, CheckCircle2, Info, Filter, MoreHorizontal, Save,
  Globe, Building2, Network, DollarSign, BarChart3, Settings,
  UserCheck, UserX, Crown, ShieldCheck, ShieldOff, Layers,
} from 'lucide-react'
import type { ViewId } from '@/App'

interface Props { navigateTo: (view: ViewId) => void }

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  text: '#181C23', soft: '#414755', muted: '#717786', faint: '#A0A5B4',
  border: 'rgba(193,198,215,0.42)', borderMid: 'rgba(193,198,215,0.58)',
  surface: 'rgba(255,255,255,0.65)', surfaceHigh: 'rgba(255,255,255,0.85)',
  blue: '#0058BC', blueBg: 'rgba(0,88,188,0.08)', blueBorder: 'rgba(0,88,188,0.2)',
  indigo: '#4F46E5', indigoBg: 'rgba(79,70,229,0.08)',
  green: '#059669', greenBg: 'rgba(5,150,105,0.08)',
  red: '#BA1A1A', redBg: 'rgba(186,26,26,0.07)',
  amber: '#d97706', amberBg: 'rgba(217,119,6,0.08)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ─── Data model ───────────────────────────────────────────────────────────────

type PermLevel = 'full' | 'view' | 'none' | 'own' | 'team' | 'region'
type OpPerm = 'allow' | 'deny' | 'conditional'

interface FuncPermNode {
  id: string; label: string; icon?: React.ReactNode; children?: FuncPermNode[]
}
interface DataScope { id: string; label: string; desc: string }
interface OpPermDef { id: string; module: string; label: string; desc: string; risk: 'high' | 'medium' | 'low' }

interface Role {
  id: string; name: string; nameEn: string; color: string; icon: React.ReactNode
  desc: string; userCount: number; isSystem: boolean
  funcPerms: Record<string, PermLevel>
  dataPerms: Record<string, PermLevel>
  opPerms: Record<string, OpPerm>
}

// ─── Func permission tree ─────────────────────────────────────────────────────

const FUNC_TREE: FuncPermNode[] = [
  {
    id: 'insurer', label: 'view.funcTree.insurer', icon: <Building2 size={13} />, children: [
      { id: 'insurer.list',       label: 'view.funcTree.insurer_list' },
      { id: 'insurer.detail',     label: 'view.funcTree.insurer_detail' },
      { id: 'insurer.create',     label: 'view.funcTree.insurer_create' },
      { id: 'insurer.edit',       label: 'view.funcTree.insurer_edit' },
      { id: 'insurer.product',    label: 'view.funcTree.insurer_product' },
      { id: 'insurer.finance',    label: 'view.funcTree.insurer_finance' },
      { id: 'insurer.analytics',  label: 'view.funcTree.insurer_analytics' },
    ],
  },
  {
    id: 'channel', label: 'view.funcTree.channel', icon: <Network size={13} />, children: [
      { id: 'channel.list',       label: 'view.funcTree.channel_list' },
      { id: 'channel.create',     label: 'view.funcTree.channel_create' },
      { id: 'channel.hierarchy',  label: 'view.funcTree.channel_hierarchy' },
      { id: 'channel.onboarding', label: 'view.funcTree.channel_onboarding' },
      { id: 'channel.portal',     label: 'view.funcTree.channel_portal' },
      { id: 'channel.analytics',  label: 'view.funcTree.channel_analytics' },
    ],
  },
  {
    id: 'commission', label: 'view.funcTree.commission', icon: <DollarSign size={13} />, children: [
      { id: 'commission.scheme',     label: 'view.funcTree.commission_scheme' },
      { id: 'commission.settlement', label: 'view.funcTree.commission_settlement' },
      { id: 'commission.auth',       label: 'view.funcTree.commission_auth' },
    ],
  },
  {
    id: 'report', label: 'view.funcTree.report', icon: <BarChart3 size={13} />, children: [
      { id: 'report.dashboard',   label: 'view.funcTree.report_dashboard' },
      { id: 'report.performance', label: 'view.funcTree.report_performance' },
      { id: 'report.export',      label: 'view.funcTree.report_export' },
    ],
  },
  {
    id: 'system', label: 'view.funcTree.system', icon: <Settings size={13} />, children: [
      { id: 'system.users',    label: 'view.funcTree.system_users' },
      { id: 'system.roles',    label: 'view.funcTree.system_roles' },
      { id: 'system.i18n',     label: 'view.funcTree.system_i18n' },
      { id: 'system.audit',    label: 'view.funcTree.system_audit' },
    ],
  },
]

// ─── Data scope definitions ───────────────────────────────────────────────────

const DATA_SCOPES: DataScope[] = [
  { id: 'insurer_data',    label: 'view.dataScope.insurer_data.label',    desc: 'view.dataScope.insurer_data.desc' },
  { id: 'channel_data',    label: 'view.dataScope.channel_data.label',    desc: 'view.dataScope.channel_data.desc' },
  { id: 'commission_data', label: 'view.dataScope.commission_data.label', desc: 'view.dataScope.commission_data.desc' },
  { id: 'policy_data',     label: 'view.dataScope.policy_data.label',     desc: 'view.dataScope.policy_data.desc' },
  { id: 'finance_data',    label: 'view.dataScope.finance_data.label',    desc: 'view.dataScope.finance_data.desc' },
  { id: 'report_data',     label: 'view.dataScope.report_data.label',     desc: 'view.dataScope.report_data.desc' },
  { id: 'user_data',       label: 'view.dataScope.user_data.label',       desc: 'view.dataScope.user_data.desc' },
]

const DATA_LEVEL_OPTIONS: { value: PermLevel; label: string; desc: string; color: string }[] = [
  { value: 'full',   label: 'view.dataLevel.full.label',   desc: 'view.dataLevel.full.desc',   color: C.indigo },
  { value: 'region', label: 'view.dataLevel.region.label', desc: 'view.dataLevel.region.desc', color: C.blue },
  { value: 'team',   label: 'view.dataLevel.team.label',   desc: 'view.dataLevel.team.desc',   color: C.purple },
  { value: 'own',    label: 'view.dataLevel.own.label',    desc: 'view.dataLevel.own.desc',    color: C.amber },
  { value: 'none',   label: 'view.dataLevel.none.label',   desc: 'view.dataLevel.none.desc',   color: C.red },
]

// ─── Operation permissions ────────────────────────────────────────────────────

const OP_PERMS: OpPermDef[] = [
  { id: 'op.insurer.disable',     module: 'view.opModule.insurer',    label: 'view.opPerm.insurer_disable.label',      desc: 'view.opPerm.insurer_disable.desc',      risk: 'high' },
  { id: 'op.insurer.delete',      module: 'view.opModule.insurer',    label: 'view.opPerm.insurer_delete.label',       desc: 'view.opPerm.insurer_delete.desc',       risk: 'high' },
  { id: 'op.channel.delete',      module: 'view.opModule.channel',    label: 'view.opPerm.channel_delete.label',       desc: 'view.opPerm.channel_delete.desc',       risk: 'high' },
  { id: 'op.channel.suspend',     module: 'view.opModule.channel',    label: 'view.opPerm.channel_suspend.label',      desc: 'view.opPerm.channel_suspend.desc',      risk: 'medium' },
  { id: 'op.channel.approve',     module: 'view.opModule.channel',    label: 'view.opPerm.channel_approve.label',      desc: 'view.opPerm.channel_approve.desc',      risk: 'medium' },
  { id: 'op.commission.approve',  module: 'view.opModule.commission', label: 'view.opPerm.commission_approve.label',   desc: 'view.opPerm.commission_approve.desc',   risk: 'high' },
  { id: 'op.commission.pay',      module: 'view.opModule.commission', label: 'view.opPerm.commission_pay.label',       desc: 'view.opPerm.commission_pay.desc',       risk: 'high' },
  { id: 'op.product.publish',     module: 'view.opModule.product',    label: 'view.opPerm.product_publish.label',      desc: 'view.opPerm.product_publish.desc',      risk: 'medium' },
  { id: 'op.report.export',       module: 'view.opModule.report',     label: 'view.opPerm.report_export.label',        desc: 'view.opPerm.report_export.desc',        risk: 'medium' },
  { id: 'op.user.resetpwd',       module: 'view.opModule.system',     label: 'view.opPerm.user_resetpwd.label',        desc: 'view.opPerm.user_resetpwd.desc',        risk: 'high' },
  { id: 'op.user.deactivate',     module: 'view.opModule.system',     label: 'view.opPerm.user_deactivate.label',      desc: 'view.opPerm.user_deactivate.desc',      risk: 'high' },
  { id: 'op.role.edit',           module: 'view.opModule.system',     label: 'view.opPerm.role_edit.label',            desc: 'view.opPerm.role_edit.desc',            risk: 'high' },
]

// ─── Role presets ─────────────────────────────────────────────────────────────

const DEFAULT_ROLES: Role[] = [
  {
    id: 'superadmin', name: 'view.role.superadmin.name', nameEn: 'Super Admin', color: '#7c3aed', icon: <Crown size={14} />,
    desc: 'view.role.superadmin.desc', userCount: 2, isSystem: true,
    funcPerms: Object.fromEntries(
      FUNC_TREE.flatMap(g => [g.id, ...(g.children?.map(c => c.id) ?? [])]).map(id => [id, 'full' as PermLevel])
    ),
    dataPerms: Object.fromEntries(DATA_SCOPES.map(d => [d.id, 'full' as PermLevel])),
    opPerms: Object.fromEntries(OP_PERMS.map(o => [o.id, 'allow' as OpPerm])),
  },
  {
    id: 'ops_manager', name: 'view.role.ops_manager.name', nameEn: 'Ops Manager', color: '#0058BC', icon: <ShieldCheck size={14} />,
    desc: 'view.role.ops_manager.desc', userCount: 8, isSystem: false,
    funcPerms: Object.fromEntries([
      ...['insurer', 'insurer.list','insurer.detail','insurer.create','insurer.edit','insurer.product','insurer.finance','insurer.analytics'].map(id => [id, 'full' as PermLevel]),
      ...['channel','channel.list','channel.create','channel.hierarchy','channel.onboarding','channel.analytics'].map(id => [id, 'full' as PermLevel]),
      ...['commission','commission.scheme','commission.settlement','commission.auth'].map(id => [id, 'full' as PermLevel]),
      ...['report','report.dashboard','report.performance','report.export'].map(id => [id, 'full' as PermLevel]),
      ...['system','system.audit'].map(id => [id, 'view' as PermLevel]),
      ...['system.users','system.roles','system.i18n'].map(id => [id, 'none' as PermLevel]),
    ]),
    dataPerms: { insurer_data:'full', channel_data:'full', commission_data:'full', policy_data:'full', finance_data:'full', report_data:'full', user_data:'view' },
    opPerms: { 'op.insurer.disable':'allow','op.insurer.delete':'deny','op.channel.delete':'deny','op.channel.suspend':'allow','op.channel.approve':'allow','op.commission.approve':'allow','op.commission.pay':'conditional','op.product.publish':'allow','op.report.export':'allow','op.user.resetpwd':'deny','op.user.deactivate':'deny','op.role.edit':'deny' },
  },
  {
    id: 'channel_manager', name: 'view.role.channel_manager.name', nameEn: 'Channel Manager', color: '#006687', icon: <UserCheck size={14} />,
    desc: 'view.role.channel_manager.desc', userCount: 15, isSystem: false,
    funcPerms: Object.fromEntries([
      ...['channel','channel.list','channel.hierarchy','channel.onboarding','channel.portal','channel.analytics'].map(id => [id, 'full' as PermLevel]),
      ...['channel.create'].map(id => [id, 'view' as PermLevel]),
      ...['insurer','insurer.list','insurer.detail'].map(id => [id, 'view' as PermLevel]),
      ...['insurer.create','insurer.edit','insurer.finance','insurer.analytics'].map(id => [id, 'none' as PermLevel]),
      ...['commission','commission.scheme'].map(id => [id, 'view' as PermLevel]),
      ...['commission.settlement','commission.auth'].map(id => [id, 'none' as PermLevel]),
      ...['report','report.dashboard','report.performance'].map(id => [id, 'view' as PermLevel]),
      ...['report.export','system','system.users','system.roles','system.i18n','system.audit'].map(id => [id, 'none' as PermLevel]),
    ]),
    dataPerms: { insurer_data:'view', channel_data:'region', commission_data:'none', policy_data:'region', finance_data:'none', report_data:'region', user_data:'none' },
    opPerms: { 'op.insurer.disable':'deny','op.insurer.delete':'deny','op.channel.delete':'deny','op.channel.suspend':'conditional','op.channel.approve':'allow','op.commission.approve':'deny','op.commission.pay':'deny','op.product.publish':'deny','op.report.export':'deny','op.user.resetpwd':'deny','op.user.deactivate':'deny','op.role.edit':'deny' },
  },
  {
    id: 'finance_analyst', name: 'view.role.finance_analyst.name', nameEn: 'Finance Analyst', color: '#059669', icon: <Shield size={14} />,
    desc: 'view.role.finance_analyst.desc', userCount: 5, isSystem: false,
    funcPerms: Object.fromEntries([
      ...['insurer','insurer.list','insurer.detail'].map(id => [id, 'view' as PermLevel]),
      ...['insurer.create','insurer.edit','insurer.product'].map(id => [id, 'none' as PermLevel]),
      ...['insurer.finance','insurer.analytics'].map(id => [id, 'view' as PermLevel]),
      ...['channel','channel.list'].map(id => [id, 'view' as PermLevel]),
      ...['channel.create','channel.hierarchy','channel.onboarding','channel.portal','channel.analytics'].map(id => [id, 'none' as PermLevel]),
      ...['commission','commission.scheme','commission.settlement'].map(id => [id, 'view' as PermLevel]),
      ...['commission.auth'].map(id => [id, 'none' as PermLevel]),
      ...['report','report.dashboard','report.performance','report.export'].map(id => [id, 'full' as PermLevel]),
      ...['system','system.users','system.roles','system.i18n','system.audit'].map(id => [id, 'none' as PermLevel]),
    ]),
    dataPerms: { insurer_data:'view', channel_data:'view', commission_data:'full', policy_data:'view', finance_data:'full', report_data:'full', user_data:'none' },
    opPerms: Object.fromEntries(OP_PERMS.map(o => [o.id, 'deny' as OpPerm])),
  },
  {
    id: 'readonly', name: 'view.role.readonly.name', nameEn: 'Read-Only', color: '#717786', icon: <Eye size={14} />,
    desc: 'view.role.readonly.desc', userCount: 12, isSystem: false,
    funcPerms: Object.fromEntries([
      ...['insurer','insurer.list','insurer.detail','channel','channel.list','report','report.dashboard'].map(id => [id, 'view' as PermLevel]),
      ...FUNC_TREE.flatMap(g => g.children?.map(c => c.id) ?? []).filter(id => !['insurer.list','insurer.detail','channel.list','report.dashboard'].includes(id)).map(id => [id, 'none' as PermLevel]),
      ...['insurer.create','insurer.edit','commission','system'].map(id => [id, 'none' as PermLevel]),
    ]),
    dataPerms: { insurer_data:'view', channel_data:'own', commission_data:'none', policy_data:'none', finance_data:'none', report_data:'none', user_data:'none' },
    opPerms: Object.fromEntries(OP_PERMS.map(o => [o.id, 'deny' as OpPerm])),
  },
]

// ─── UI helpers ───────────────────────────────────────────────────────────────

const PERM_CELL: Record<PermLevel, { label: string; bg: string; color: string; dot: string }> = {
  full:   { label: 'view.permLevel.full',   bg: 'rgba(79,70,229,0.10)',  color: '#4F46E5', dot: '#4F46E5' },
  view:   { label: 'view.permLevel.view',   bg: 'rgba(0,88,188,0.09)',   color: '#0058BC', dot: '#0058BC' },
  own:    { label: 'view.permLevel.own',    bg: 'rgba(217,119,6,0.10)',  color: '#d97706', dot: '#d97706' },
  team:   { label: 'view.permLevel.team',   bg: 'rgba(124,58,237,0.09)', color: '#7c3aed', dot: '#7c3aed' },
  region: { label: 'view.permLevel.region', bg: 'rgba(0,102,135,0.10)',  color: '#006687', dot: '#006687' },
  none:   { label: 'view.permLevel.none',   bg: 'rgba(193,198,215,0.18)',color: '#A0A5B4', dot: '#C1C6D7' },
}
const OP_CELL: Record<OpPerm, { label: string; bg: string; color: string }> = {
  allow:       { label: 'view.opResult.allow',       bg: 'rgba(5,150,105,0.09)',  color: '#059669' },
  deny:        { label: 'view.opResult.deny',        bg: 'rgba(186,26,26,0.07)',  color: '#BA1A1A' },
  conditional: { label: 'view.opResult.conditional', bg: 'rgba(217,119,6,0.09)', color: '#d97706' },
}
const RISK_CFG = {
  high:   { label: 'view.risk.high',   bg: 'rgba(186,26,26,0.07)',  color: '#BA1A1A' },
  medium: { label: 'view.risk.medium', bg: 'rgba(217,119,6,0.08)',  color: '#d97706' },
  low:    { label: 'view.risk.low',    bg: 'rgba(5,150,105,0.08)',  color: '#059669' },
}

function PermBadge({ level }: { level: PermLevel }) {
  const { t } = useTranslation('permission')
  const cfg = PERM_CELL[level]
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11.5, fontWeight:600, background:cfg.bg, color:cfg.color }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
      {t(cfg.label)}
    </span>
  )
}
function OpBadge({ level }: { level: OpPerm }) {
  const { t } = useTranslation('permission')
  const cfg = OP_CELL[level]
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, fontSize:11.5, fontWeight:600, background:cfg.bg, color:cfg.color }}>{t(cfg.label)}</span>
}

// ─── Role card ────────────────────────────────────────────────────────────────

function RoleCard({ role, isActive, onClick }: { role: Role; isActive: boolean; onClick: () => void }) {
  const { t } = useTranslation('permission')
  return (
    <button onClick={onClick} style={{
      width:'100%', textAlign:'left', padding:'12px 14px', borderRadius:11, border:'none', cursor:'pointer',
      background: isActive ? `${role.color}12` : C.surface,
      outline: isActive ? `1.5px solid ${role.color}40` : `0.5px solid ${C.border}`,
      transition:'all 0.14s',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:`${role.color}18`, color:role.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {role.icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, display:'flex', alignItems:'center', gap:5 }}>
            {t(role.name)}
            {role.isSystem && <span style={{ fontSize:10, padding:'1px 5px', borderRadius:4, background:'rgba(124,58,237,0.12)', color:'#7c3aed', fontWeight:700 }}>{t('view.systemBadge')}</span>}
          </div>
          <div style={{ fontSize:11, color:C.faint, fontFamily:"'JetBrains Mono', monospace" }}>{role.nameEn}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <Users size={11} style={{ color:C.faint }} />
          <span style={{ fontSize:11.5, color:C.muted, fontFamily:"'JetBrains Mono', monospace" }}>{role.userCount}</span>
        </div>
      </div>
      <div style={{ fontSize:11.5, color:C.muted, lineHeight:1.4 }}>{t(role.desc)}</div>
    </button>
  )
}

// ─── Func perm table ──────────────────────────────────────────────────────────

function FuncPermPanel({ role, onChange }: { role: Role; onChange: (id: string, val: PermLevel) => void }) {
  const { t } = useTranslation('permission')
  const [expanded, setExpanded] = useState<Set<string>>(new Set(FUNC_TREE.map(g => g.id)))
  const toggle = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const levels: PermLevel[] = ['full','view','none']

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.text }}>{t('view.sections.func')}</div>
        <div style={{ display:'flex', gap:10 }}>
          {levels.map(l => <span key={l} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:C.muted }}><span style={{ width:8, height:8, borderRadius:'50%', background:PERM_CELL[l].dot }} />{t(PERM_CELL[l].label)}</span>)}
        </div>
      </div>
      <div style={{ background:C.surfaceHigh, borderRadius:11, border:`0.5px solid ${C.border}`, overflow:'hidden' }}>
        {FUNC_TREE.map((group, gi) => {
          const isOpen = expanded.has(group.id)
          const groupLevel = role.funcPerms[group.id] ?? 'none'
          return (
            <div key={group.id} style={{ borderBottom: gi < FUNC_TREE.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
              {/* Group row */}
              <div style={{ display:'flex', alignItems:'center', gap:0, padding:'0 14px', height:40, background:'rgba(249,249,255,0.5)', cursor:'pointer' }}
                onClick={() => toggle(group.id)}>
                <span style={{ color:C.muted, marginRight:6 }}>{isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
                <span style={{ color:C.blue, marginRight:8, flexShrink:0 }}>{group.icon}</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1 }}>{t(group.label)}</span>
                <div style={{ display:'flex', gap:2 }}>
                  {levels.map(l => (
                    <button key={l} onClick={e => { e.stopPropagation(); onChange(group.id, l) }} style={{
                      padding:'3px 10px', borderRadius:6, fontSize:11.5, fontWeight:600, cursor:'pointer', border:'none',
                      background: groupLevel === l ? PERM_CELL[l].bg : 'rgba(193,198,215,0.15)',
                      color: groupLevel === l ? PERM_CELL[l].color : C.faint,
                      outline: groupLevel === l ? `1px solid ${PERM_CELL[l].dot}40` : 'none',
                    }}>{t(PERM_CELL[l].label)}</button>
                  ))}
                </div>
              </div>
              {/* Children */}
              {isOpen && group.children?.map((child, ci) => {
                const childLevel = role.funcPerms[child.id] ?? groupLevel
                return (
                  <div key={child.id} style={{ display:'flex', alignItems:'center', padding:'0 14px 0 44px', height:36, borderTop:`0.5px solid ${C.border}`, background: ci % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.3)' }}>
                    <span style={{ fontSize:12.5, color:C.soft, flex:1 }}>{t(child.label)}</span>
                    <div style={{ display:'flex', gap:2 }}>
                      {levels.map(l => (
                        <button key={l} onClick={() => onChange(child.id, l)} style={{
                          padding:'2px 9px', borderRadius:5, fontSize:11.5, fontWeight:600, cursor:'pointer', border:'none',
                          background: childLevel === l ? PERM_CELL[l].bg : 'rgba(193,198,215,0.12)',
                          color: childLevel === l ? PERM_CELL[l].color : C.faint,
                          outline: childLevel === l ? `1px solid ${PERM_CELL[l].dot}35` : 'none',
                        }}>{t(PERM_CELL[l].label)}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Data perm panel ──────────────────────────────────────────────────────────

function DataPermPanel({ role, onChange }: { role: Role; onChange: (id: string, val: PermLevel) => void }) {
  const { t } = useTranslation('permission')
  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.text, marginBottom:4 }}>{t('view.sections.data')}</div>
        <div style={{ fontSize:12, color:C.muted }}>{t('view.sections.dataDesc')}</div>
      </div>

      {/* Scope levels legend */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {DATA_LEVEL_OPTIONS.map(opt => (
          <div key={opt.value} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:7, background:'rgba(255,255,255,0.6)', border:`0.5px solid ${C.border}` }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:opt.color }} />
            <span style={{ fontSize:12, fontWeight:600, color:opt.color }}>{t(opt.label)}</span>
            <span style={{ fontSize:11, color:C.faint }}>— {t(opt.desc)}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {DATA_SCOPES.map(scope => {
          const current = role.dataPerms[scope.id] ?? 'none'
          return (
            <div key={scope.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:9, background:C.surfaceHigh, border:`0.5px solid ${C.border}` }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{t(scope.label)}</div>
                <div style={{ fontSize:11.5, color:C.muted }}>{t(scope.desc)}</div>
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {DATA_LEVEL_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => onChange(scope.id, opt.value)} style={{
                    padding:'4px 10px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                    background: current === opt.value ? `${opt.color}15` : 'rgba(193,198,215,0.15)',
                    color: current === opt.value ? opt.color : C.faint,
                    outline: current === opt.value ? `1px solid ${opt.color}40` : 'none',
                    transition:'all 0.12s',
                  }}>{t(opt.label)}</button>
                ))}
              </div>
              <div style={{ width:80, textAlign:'right' }}>
                <PermBadge level={current} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Op perm panel ────────────────────────────────────────────────────────────

function OpPermPanel({ role, onChange }: { role: Role; onChange: (id: string, val: OpPerm) => void }) {
  const { t } = useTranslation('permission')
  const modules = [...new Set(OP_PERMS.map(o => o.module))]

  return (
    <div>
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:C.text, marginBottom:4 }}>{t('view.sections.op')}</div>
        <div style={{ fontSize:12, color:C.muted }}>
          {t('view.sections.opDescPrefix')}<span style={{ color:C.amber, fontWeight:600 }}>{t('view.sections.approvalTerm')}</span>{t('view.sections.opDescSuffix')}
        </div>
      </div>

      {/* High-risk warning */}
      {Object.entries(role.opPerms).some(([k, v]) => v === 'allow' && OP_PERMS.find(o => o.id === k)?.risk === 'high') && (
        <div style={{ display:'flex', gap:8, padding:'9px 12px', borderRadius:9, background:'rgba(186,26,26,0.06)', border:'0.5px solid rgba(186,26,26,0.2)', marginBottom:14 }}>
          <AlertCircle size={14} style={{ color:C.red, flexShrink:0, marginTop:1 }} />
          <span style={{ fontSize:12.5, color:'#7f1d1d' }}>{t('view.sections.highRiskWarning')}</span>
        </div>
      )}

      {modules.map(mod => (
        <div key={mod} style={{ marginBottom:14 }}>
          <div style={{ fontSize:11.5, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>{t(mod)}</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {OP_PERMS.filter(o => o.module === mod).map(op => {
              const current = role.opPerms[op.id] ?? 'deny'
              const riskCfg = RISK_CFG[op.risk]
              return (
                <div key={op.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderRadius:9, background:C.surfaceHigh, border:`0.5px solid ${C.border}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{t(op.label)}</span>
                      <span style={{ fontSize:10.5, padding:'1px 6px', borderRadius:4, fontWeight:600, background:riskCfg.bg, color:riskCfg.color }}>{t(riskCfg.label)}</span>
                    </div>
                    <div style={{ fontSize:11.5, color:C.muted }}>{t(op.desc)}</div>
                  </div>
                  <div style={{ display:'flex', gap:3 }}>
                    {(['allow','conditional','deny'] as OpPerm[]).map(v => (
                      <button key={v} onClick={() => onChange(op.id, v)} style={{
                        padding:'4px 10px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                        background: current === v ? OP_CELL[v].bg : 'rgba(193,198,215,0.15)',
                        color: current === v ? OP_CELL[v].color : C.faint,
                        outline: current === v ? `1px solid ${OP_CELL[v].color}35` : 'none',
                        transition:'all 0.12s',
                      }}>{t(OP_CELL[v].label)}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Permission diff / compare ────────────────────────────────────────────────

function ComparePanel({ roles }: { roles: Role[] }) {
  const { t } = useTranslation('permission')
  const [roleA, setRoleA] = useState(roles[0].id)
  const [roleB, setRoleB] = useState(roles[1].id)
  const rA = roles.find(r => r.id === roleA)!
  const rB = roles.find(r => r.id === roleB)!

  const funcDiffs = FUNC_TREE.flatMap(g => [g.id, ...(g.children?.map(c => c.id) ?? [])]).filter(id => (rA.funcPerms[id] ?? 'none') !== (rB.funcPerms[id] ?? 'none'))
  const dataDiffs = DATA_SCOPES.map(d => d.id).filter(id => (rA.dataPerms[id] ?? 'none') !== (rB.dataPerms[id] ?? 'none'))
  const opDiffs   = OP_PERMS.map(o => o.id).filter(id => (rA.opPerms[id] ?? 'deny') !== (rB.opPerms[id] ?? 'deny'))

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <select className="input-glass" style={{ fontSize:13 }} value={roleA} onChange={e => setRoleA(e.target.value)}>
          {roles.map(r => <option key={r.id} value={r.id}>{t(r.name)}</option>)}
        </select>
        <span style={{ color:C.faint, fontSize:13 }}>{t('view.compare.compare')}</span>
        <select className="input-glass" style={{ fontSize:13 }} value={roleB} onChange={e => setRoleB(e.target.value)}>
          {roles.map(r => <option key={r.id} value={r.id}>{t(r.name)}</option>)}
        </select>
        <span style={{ fontSize:12, color:C.muted }}>{t('view.compare.diffCount', { count: funcDiffs.length + dataDiffs.length + opDiffs.length })}</span>
      </div>

      {funcDiffs.length === 0 && dataDiffs.length === 0 && opDiffs.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px', color:C.faint, fontSize:13 }}>
          <CheckCircle2 size={28} style={{ color:'#059669', display:'block', margin:'0 auto 8px' }} />
          {t('view.compare.identical')}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px', gap:8, padding:'6px 14px', fontSize:11.5, fontWeight:700, color:C.faint }}>
            <span>{t('view.compare.permItem')}</span>
            <span style={{ color: rA.color, textAlign:'center' }}>{t(rA.name)}</span>
            <span style={{ color: rB.color, textAlign:'center' }}>{t(rB.name)}</span>
          </div>

          {funcDiffs.length > 0 && <>
            <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 14px' }}>{t('view.compare.funcDiff')}</div>
            {funcDiffs.map(id => {
              const label = FUNC_TREE.flatMap(g => [g, ...(g.children ?? [])]).find(n => n.id === id)?.label ?? id
              return (
                <div key={id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px', gap:8, padding:'8px 14px', borderRadius:8, background:C.surfaceHigh, border:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <span style={{ fontSize:12.5, color:C.soft }}>{t(label)}</span>
                  <div style={{ textAlign:'center' }}><PermBadge level={rA.funcPerms[id] ?? 'none'} /></div>
                  <div style={{ textAlign:'center' }}><PermBadge level={rB.funcPerms[id] ?? 'none'} /></div>
                </div>
              )
            })}
          </>}

          {dataDiffs.length > 0 && <>
            <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 14px', marginTop:6 }}>{t('view.compare.dataDiff')}</div>
            {dataDiffs.map(id => {
              const scope = DATA_SCOPES.find(d => d.id === id)!
              return (
                <div key={id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px', gap:8, padding:'8px 14px', borderRadius:8, background:C.surfaceHigh, border:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <span style={{ fontSize:12.5, color:C.soft }}>{t(scope.label)}</span>
                  <div style={{ textAlign:'center' }}><PermBadge level={rA.dataPerms[id] ?? 'none'} /></div>
                  <div style={{ textAlign:'center' }}><PermBadge level={rB.dataPerms[id] ?? 'none'} /></div>
                </div>
              )
            })}
          </>}

          {opDiffs.length > 0 && <>
            <div style={{ fontSize:11, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 14px', marginTop:6 }}>{t('view.compare.opDiff')}</div>
            {opDiffs.map(id => {
              const op = OP_PERMS.find(o => o.id === id)!
              return (
                <div key={id} style={{ display:'grid', gridTemplateColumns:'1fr 120px 120px', gap:8, padding:'8px 14px', borderRadius:8, background:C.surfaceHigh, border:`0.5px solid ${C.border}`, alignItems:'center' }}>
                  <span style={{ fontSize:12.5, color:C.soft }}>{t(op.label)}</span>
                  <div style={{ textAlign:'center' }}><OpBadge level={rA.opPerms[id] ?? 'deny'} /></div>
                  <div style={{ textAlign:'center' }}><OpBadge level={rB.opPerms[id] ?? 'deny'} /></div>
                </div>
              )
            })}
          </>}
        </div>
      )}
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'func',    label: 'view.tabs.func',    icon: <Layers size={13} /> },
  { id: 'data',    label: 'view.tabs.data',    icon: <Database size={13} /> },
  { id: 'op',      label: 'view.tabs.op',      icon: <Zap size={13} /> },
  { id: 'compare', label: 'view.tabs.compare', icon: <BarChart3 size={13} /> },
]

export default function PermissionView({ navigateTo }: Props) {
  const { t } = useTranslation('permission')
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES)
  const [selectedRoleId, setSelectedRoleId] = useState('ops_manager')
  const [activeTab, setActiveTab] = useState('func')
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  const selectedRole = roles.find(r => r.id === selectedRoleId)!

  const updateFuncPerm = (id: string, val: PermLevel) => {
    setRoles(prev => prev.map(r => r.id === selectedRoleId
      ? { ...r, funcPerms: { ...r.funcPerms, [id]: val } } : r))
    setDirty(true)
  }
  const updateDataPerm = (id: string, val: PermLevel) => {
    setRoles(prev => prev.map(r => r.id === selectedRoleId
      ? { ...r, dataPerms: { ...r.dataPerms, [id]: val } } : r))
    setDirty(true)
  }
  const updateOpPerm = (id: string, val: OpPerm) => {
    setRoles(prev => prev.map(r => r.id === selectedRoleId
      ? { ...r, opPerms: { ...r.opPerms, [id]: val } } : r))
    setDirty(true)
  }
  const handleSave = () => {
    setDirty(false); setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  return (
    <div style={{ maxWidth:1440, margin:'0 auto' }}>
      <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {saved && (
        <div style={{ position:'fixed', top:72, left:'50%', transform:'translateX(-50%)', zIndex:500, display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:10, background:'rgba(5,150,105,0.96)', color:'#fff', fontSize:13, fontWeight:600, boxShadow:'0 6px 24px rgba(5,150,105,0.3)', animation:'fadeSlideDown 0.2s ease' }}>
          <CheckCircle2 size={15} />{t('view.savedToast')}
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg, #7c3aed, #4F46E5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Shield size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize:19, fontWeight:700, color:C.text }}>{t('view.title')}</h1>
            <p style={{ fontSize:12.5, color:C.muted, marginTop:1 }}>
              {t('view.subtitle', { roles: roles.length, users: roles.reduce((s, r) => s + r.userCount, 0) })}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-secondary" style={{ fontSize:12.5 }}><Copy size={13} />{t('view.copyRole')}</button>
          <button className="btn-secondary" style={{ fontSize:12.5 }}><Plus size={13} />{t('view.createRole')}</button>
          {dirty && (
            <button className="btn-primary" style={{ fontSize:12.5 }} onClick={handleSave}>
              <Save size={13} />{t('view.saveChanges')}
            </button>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'210px 1fr', gap:14, alignItems:'start' }}>

        {/* Left: role list */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ fontSize:11.5, fontWeight:700, color:C.faint, textTransform:'uppercase', letterSpacing:'0.06em', padding:'0 4px', marginBottom:2 }}>{t('view.roleList')}</div>
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              isActive={selectedRoleId === role.id}
              onClick={() => { setSelectedRoleId(role.id); setDirty(false) }}
            />
          ))}
        </div>

        {/* Right: permission editor */}
        <div>
          {/* Role meta */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:11, background:C.surfaceHigh, border:`0.5px solid ${C.border}`, marginBottom:14 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${selectedRole.color}18`, color:selectedRole.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {selectedRole.icon}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{t(selectedRole.name)}</span>
                <span style={{ fontSize:11.5, color:C.faint, fontFamily:"'JetBrains Mono', monospace" }}>{selectedRole.nameEn}</span>
                {selectedRole.isSystem && <span style={{ fontSize:10.5, padding:'1px 6px', borderRadius:4, background:'rgba(124,58,237,0.12)', color:'#7c3aed', fontWeight:700 }}>{t('view.systemBuiltIn')}</span>}
              </div>
              <div style={{ fontSize:12, color:C.muted }}>{t(selectedRole.desc)}</div>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              {[
                { label:'view.sections.func', val: Object.values(selectedRole.funcPerms).filter(v => v !== 'none').length, total: Object.keys(selectedRole.funcPerms).length, color:C.indigo },
                { label:'view.sections.op', val: Object.values(selectedRole.opPerms).filter(v => v === 'allow').length, total: OP_PERMS.length, color:C.green },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:s.color, fontFamily:"'JetBrains Mono', monospace" }}>{s.val}<span style={{ fontSize:11, color:C.faint }}>/{s.total}</span></div>
                  <div style={{ fontSize:11, color:C.muted }}>{t(s.label)}</div>
                </div>
              ))}
              <div style={{ textAlign:'center' }}>
                <div style={{ display:'flex', gap:3, justifyContent:'center' }}>
                  <Users size={13} style={{ color:C.muted }} />
                  <span style={{ fontSize:18, fontWeight:700, color:C.text, fontFamily:"'JetBrains Mono', monospace" }}>{selectedRole.userCount}</span>
                </div>
                <div style={{ fontSize:11, color:C.muted }}>{t('view.assignedUsers')}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              {!selectedRole.isSystem && <button className="btn-ghost" style={{ padding:7 }}><Edit2 size={14} /></button>}
              <button className="btn-ghost" style={{ padding:7 }}><MoreHorizontal size={14} /></button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:14, background:'rgba(255,255,255,0.45)', borderRadius:10, padding:4, width:'fit-content', border:`0.5px solid ${C.border}` }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, fontSize:13,
                fontWeight: activeTab === tab.id ? 700 : 500, cursor:'pointer', border:'none', transition:'all 0.13s',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? C.text : C.muted,
                boxShadow: activeTab === tab.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
              }}>
                <span style={{ color: activeTab === tab.id ? C.indigo : C.faint }}>{tab.icon}</span>
                {t(tab.label)}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="card" style={{ padding:'20px 22px' }}>
            {activeTab === 'func'    && <FuncPermPanel   role={selectedRole} onChange={updateFuncPerm} />}
            {activeTab === 'data'    && <DataPermPanel   role={selectedRole} onChange={updateDataPerm} />}
            {activeTab === 'op'      && <OpPermPanel     role={selectedRole} onChange={updateOpPerm} />}
            {activeTab === 'compare' && <ComparePanel    roles={roles} />}
          </div>
        </div>
      </div>
    </div>
  )
}
