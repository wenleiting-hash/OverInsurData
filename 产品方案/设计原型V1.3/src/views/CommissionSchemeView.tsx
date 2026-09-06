import { useState } from 'react'
import {
  Plus, Edit2, Eye, Copy, Check, X, ChevronRight,
  DollarSign, TrendingUp, AlertCircle, Clock,
  CheckCircle2, XCircle, MoreHorizontal, Download,
  BarChart3, Percent, Layers, Zap, ArrowUpDown,
  History, ArrowUp, ArrowDown, RefreshCw, Search,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

type SchemeStatus = 'draft' | 'pending' | 'active' | 'inactive' | 'expired'

interface CommScheme {
  id: string
  name: string
  code: string
  channelType: string
  insurer: string
  line: string
  firstYearRate: number
  renewalRates: number[]
  floorAmt: number | null
  capAmt: number | null
  effectDate: string
  expiryDate: string | null
  status: SchemeStatus
  version: number
  bindCount: number
  ladderEnabled: boolean
  overrideEnabled: boolean
  chargebackEnabled: boolean
  createdBy: string
  approvedBy: string | null
  lastModified: string
}

interface LadderTier {
  id: number
  minPremium: number
  maxPremium: number | null
  rateMultiplier: number
}

interface OverrideTier {
  level: number
  role: string
  overrideRate: number
  minTeamSize: number | null
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const schemes: CommScheme[] = [
  { id: 's1', name: 'Agency Standard — Auto', code: 'SCH-AUTO-001', channelType: '代理机构', insurer: 'Pacific Mutual', line: 'AUTO', firstYearRate: 0.12, renewalRates: [0.10, 0.09, 0.08, 0.07], floorAmt: 50, capAmt: 5000, effectDate: '2026-01-01', expiryDate: null, status: 'active', version: 3, bindCount: 18, ladderEnabled: true, overrideEnabled: true, chargebackEnabled: true, createdBy: 'Emily Chen', approvedBy: 'David Kim', lastModified: '2025-12-15' },
  { id: 's2', name: 'MGA Premium — Home', code: 'SCH-HOME-MGA', channelType: 'MGA', insurer: 'Liberty Shield', line: 'HOME', firstYearRate: 0.15, renewalRates: [0.12, 0.10, 0.08], floorAmt: 80, capAmt: 8000, effectDate: '2026-01-01', expiryDate: null, status: 'active', version: 2, bindCount: 5, ladderEnabled: true, overrideEnabled: true, chargebackEnabled: true, createdBy: 'Sarah Wang', approvedBy: 'David Kim', lastModified: '2025-11-28' },
  { id: 's3', name: 'FMO Elite — Health', code: 'SCH-HLTH-FMO', channelType: 'FMO', insurer: 'Nationwide Plus', line: 'HEALTH', firstYearRate: 0.08, renewalRates: [0.06, 0.05], floorAmt: null, capAmt: null, effectDate: '2026-01-01', expiryDate: null, status: 'active', version: 1, bindCount: 3, ladderEnabled: false, overrideEnabled: true, chargebackEnabled: false, createdBy: 'Tom Liu', approvedBy: 'David Kim', lastModified: '2025-10-01' },
  { id: 's4', name: 'Broker Comm — Commercial', code: 'SCH-COMM-BRK', channelType: '经纪公司', insurer: 'SafeGuard Re', line: 'COMMERCIAL', firstYearRate: 0.10, renewalRates: [0.08, 0.07, 0.06, 0.05, 0.05], floorAmt: 200, capAmt: 50000, effectDate: '2026-03-01', expiryDate: null, status: 'pending', version: 1, bindCount: 0, ladderEnabled: false, overrideEnabled: false, chargebackEnabled: true, createdBy: 'Emily Chen', approvedBy: null, lastModified: '2026-02-20' },
  { id: 's5', name: 'Life Agent — Term', code: 'SCH-LIFE-001', channelType: '代理机构', insurer: 'AmeriTrust', line: 'LIFE', firstYearRate: 0.55, renewalRates: [0.04, 0.04, 0.04], floorAmt: null, capAmt: null, effectDate: '2026-01-01', expiryDate: null, status: 'active', version: 4, bindCount: 12, ladderEnabled: false, overrideEnabled: true, chargebackEnabled: true, createdBy: 'Sarah Wang', approvedBy: 'David Kim', lastModified: '2025-09-10' },
  { id: 's6', name: 'Agency Standard — Auto (Old)', code: 'SCH-AUTO-000', channelType: '代理机构', insurer: 'Pacific Mutual', line: 'AUTO', firstYearRate: 0.11, renewalRates: [0.09, 0.08], floorAmt: 50, capAmt: 4000, effectDate: '2025-01-01', expiryDate: '2025-12-31', status: 'expired', version: 2, bindCount: 0, ladderEnabled: false, overrideEnabled: true, chargebackEnabled: true, createdBy: 'Emily Chen', approvedBy: 'David Kim', lastModified: '2024-12-10' },
]

const ladderTiers: LadderTier[] = [
  { id: 1, minPremium: 0, maxPremium: 100000, rateMultiplier: 1.0 },
  { id: 2, minPremium: 100000, maxPremium: 300000, rateMultiplier: 1.1 },
  { id: 3, minPremium: 300000, maxPremium: 700000, rateMultiplier: 1.2 },
  { id: 4, minPremium: 700000, maxPremium: null, rateMultiplier: 1.35 },
]

const overrideTiers: OverrideTier[] = [
  { level: 1, role: '团队长', overrideRate: 0.02, minTeamSize: 3 },
  { level: 2, role: '分支经理', overrideRate: 0.015, minTeamSize: 8 },
  { level: 3, role: '区域总监', overrideRate: 0.01, minTeamSize: 20 },
]

// ─── Colors ───────────────────────────────────────────────────────────────────

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

const SCHEME_STATUS: Record<SchemeStatus, { label: string; labelEn: string; color: string; bg: string }> = {
  draft:    { label: '草稿', labelEn: 'Draft', color: C.muted, bg: 'rgba(193,198,215,0.18)' },
  pending:  { label: '待审批', labelEn: 'Pending Approval', color: C.primary, bg: C.primaryLight },
  active:   { label: '已生效', labelEn: 'Active', color: C.green, bg: C.greenBg },
  inactive: { label: '已停用', labelEn: 'Inactive', color: C.red, bg: C.redBg },
  expired:  { label: '已失效', labelEn: 'Expired', color: C.mutedLight, bg: 'rgba(193,198,215,0.12)' },
}

// Mock data 中的中文展示值 → 英文（枚举/逻辑值保持不变，仅渲染层映射）
const CHANNEL_TYPE_EN: Record<string, string> = { '代理机构': 'Agency', '经纪公司': 'Broker', 'MGA': 'MGA', 'FMO': 'FMO' }
const OVERRIDE_ROLE_EN: Record<string, string> = { '团队长': 'Team Lead', '分支经理': 'Branch Manager', '区域总监': 'Regional Director' }
function chTypeEn(t: string) { return CHANNEL_TYPE_EN[t] ?? t }

// ─── Primitives ───────────────────────────────────────────────────────────────

function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
  )
}

function StatusBadge({ s }: { s: SchemeStatus }) {
  const { lang } = useLang()
  const m = SCHEME_STATUS[s]
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />{lang === 'en' ? m.labelEn : m.label}
  </span>
}

function PrimaryBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '5px 12px' : '7px 16px', borderRadius: 8, fontSize: sm ? 12 : 13, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function GhostBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '4px 10px' : '6px 12px', borderRadius: 8, fontSize: sm ? 11.5 : 12.5, fontWeight: 600, color: C.textSoft, background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function Feature({ on, label }: { on: boolean; label: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: on ? C.green : C.mutedLight }}>{on ? <Check size={10} /> : <X size={10} />}{label}</span>
}

const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, verticalAlign: 'middle', fontSize: 12.5 }

// ─── Scheme List Tab ──────────────────────────────────────────────────────────

function SchemeListTab() {
  const { lang } = useLang()
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [lineF, setLineF] = useState('all')
  const [selected, setSelected] = useState<CommScheme | null>(schemes[0])
  const [showForm, setShowForm] = useState(false)
  const [showImpact, setShowImpact] = useState(false)

  const filtered = schemes.filter(s =>
    (statusF === 'all' || s.status === statusF) &&
    (lineF === 'all' || s.line === lineF) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()))
  )

  const activeCount = schemes.filter(s => s.status === 'active').length
  const pendingCount = schemes.filter(s => s.status === 'pending').length
  const totalBound = schemes.reduce((acc, s) => acc + s.bindCount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: lang === 'en' ? 'Active Plans' : '生效方案数', v: activeCount, color: C.green, icon: <CheckCircle2 size={16} color={C.green} /> },
          { label: lang === 'en' ? 'Pending Approval' : '待审批', v: pendingCount, color: C.primary, icon: <Clock size={16} color={C.primary} /> },
          { label: lang === 'en' ? 'Bound Channels' : '绑定渠道数', v: totalBound, color: C.text, icon: <Layers size={16} color={C.primary} /> },
        ].map(s => (
          <GCard key={s.label} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          </GCard>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <GCard style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'en' ? 'Search plan name or code…' : '搜索方案名称或编码…'} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {[
              { value: statusF, set: setStatusF, opts: [['all', lang === 'en' ? 'All Statuses' : '全部状态'], ...Object.entries(SCHEME_STATUS).map(([k,v]) => [k, lang === 'en' ? v.labelEn : v.label])] },
              { value: lineF, set: setLineF, opts: [['all', lang === 'en' ? 'All Lines' : '全部业务线'], ...['AUTO','HOME','LIFE','HEALTH','COMMERCIAL'].map(l => [l, l])] },
            ].map((sel, i) => (
              <select key={i} value={sel.value} onChange={e => sel.set(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', fontFamily: 'inherit' }}>
                {sel.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            <PrimaryBtn onClick={() => setShowForm(true)} sm><Plus size={13} />{lang === 'en' ? 'New Plan' : '新建方案'}</PrimaryBtn>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {(lang === 'en'
                    ? ['Plan Name', 'Scope', 'First-Year Rate', 'Renewal Rate', 'Status', 'Features', 'Bound', 'Version', '']
                    : ['方案名称', '适用范围', '首年佣金率', '续期费率', '状态', '功能', '绑定数', '版本', '']
                  ).map(h => <th key={h} style={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const isSel = selected?.id === s.id
                  return (
                    <tr key={s.id} onClick={() => setSelected(isSel ? null : s)} style={{ background: isSel ? C.primaryLight : 'transparent', cursor: 'pointer' }}>
                      <td style={TD}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{s.name}</div>
                        <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{s.code}</div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize: 12, color: C.textSoft }}>{lang === 'en' ? chTypeEn(s.channelType) : s.channelType}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{s.insurer} · <span style={{ fontWeight: 700 }}>{s.line}</span></div>
                      </td>
                      <td style={{ ...TD, ...mono, fontSize: 14, fontWeight: 800, color: C.primary }}>{(s.firstYearRate * 100).toFixed(0)}%</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {s.renewalRates.map((r, i) => (
                            <span key={i} style={{ ...mono, fontSize: 10.5, fontWeight: 700, color: C.textSoft, background: 'rgba(193,198,215,0.2)', borderRadius: 4, padding: '1px 5px' }}>Y{i + 2}: {(r * 100).toFixed(0)}%</span>
                          ))}
                        </div>
                      </td>
                      <td style={TD}><StatusBadge s={s.status} /></td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <Feature on={s.ladderEnabled} label={lang === 'en' ? 'Tiered' : '阶梯'} />
                          <Feature on={s.overrideEnabled} label="Override" />
                          <Feature on={s.chargebackEnabled} label={lang === 'en' ? 'Clawback' : '追回'} />
                        </div>
                      </td>
                      <td style={{ ...TD, ...mono, textAlign: 'center' as const, fontWeight: 700 }}>{s.bindCount}</td>
                      <td style={{ ...TD, ...mono, fontSize: 11, color: C.muted }}>v{s.version}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Eye size={12} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Copy size={12} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><MoreHorizontal size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
            {lang === 'en'
              ? `${filtered.length} commission plan${filtered.length === 1 ? '' : 's'}`
              : `共 ${filtered.length} 个佣金方案`}
          </div>
        </GCard>

        {/* Detail pane */}
        {selected && (
          <GCard style={{ width: 300, flexShrink: 0, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ padding: '16px 18px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 3 }}>{selected.name}</div>
                <div style={{ ...mono, fontSize: 10.5, color: C.mutedLight }}>{selected.code}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={14} /></button>
            </div>
            <div style={{ padding: '12px 18px' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <StatusBadge s={selected.status} />
                <span style={{ ...mono, fontSize: 11, color: C.muted, padding: '2px 6px', borderRadius: 5, background: 'rgba(193,198,215,0.15)' }}>v{selected.version}</span>
              </div>

              {/* Rate visualization */}
              <div style={{ marginBottom: 16, padding: '12px', borderRadius: 10, background: C.primaryLight, border: `0.5px solid ${C.primaryBorder}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, marginBottom: 8 }}>{lang === 'en' ? 'Annual Commission Rate Structure' : '年度佣金率结构'}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  {[selected.firstYearRate, ...selected.renewalRates].map((r, i) => {
                    const h = Math.round((r / (selected.line === 'LIFE' ? 0.6 : 0.2)) * 40)
                    return (
                      <div key={i} style={{ textAlign: 'center' as const, flex: 1 }}>
                        <div style={{ height: Math.max(8, h), background: i === 0 ? C.primary : `${C.primary}${Math.round(255 * (1 - i * 0.15)).toString(16).padStart(2, '0')}`, borderRadius: '3px 3px 0 0', minHeight: 8 }} />
                        <div style={{ ...mono, fontSize: 9.5, color: C.primary, fontWeight: 700, marginTop: 3 }}>{(r * 100).toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: C.mutedLight }}>Y{i + 1}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {[
                [lang === 'en' ? 'Channel Type' : '渠道类型', lang === 'en' ? chTypeEn(selected.channelType) : selected.channelType],
                [lang === 'en' ? 'Insurer' : '保险公司', selected.insurer],
                [lang === 'en' ? 'Line of Business' : '业务线', selected.line],
                [lang === 'en' ? 'Effective Date' : '生效日期', selected.effectDate],
                [lang === 'en' ? 'Commission Floor' : '佣金下限', selected.floorAmt ? `$${selected.floorAmt}` : (lang === 'en' ? 'None' : '无')],
                [lang === 'en' ? 'Commission Cap' : '佣金上限', selected.capAmt ? `$${selected.capAmt.toLocaleString()}` : (lang === 'en' ? 'None' : '无')],
                [lang === 'en' ? 'Created By' : '创建人', selected.createdBy],
                [lang === 'en' ? 'Approved By' : '审批人', selected.approvedBy ?? (lang === 'en' ? 'Pending Approval' : '待审批')],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `0.5px solid ${C.border}` }}>
                  <span style={{ fontSize: 11.5, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                <Feature on={selected.ladderEnabled} label={lang === 'en' ? 'Tiered Commission' : '阶梯佣金'} />
                <Feature on={selected.overrideEnabled} label="Override" />
                <Feature on={selected.chargebackEnabled} label={lang === 'en' ? 'Cancellation Clawback' : '退保追回'} />
              </div>

              <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
                <PrimaryBtn sm><Edit2 size={12} />{lang === 'en' ? 'Edit' : '编辑'}</PrimaryBtn>
                <GhostBtn sm onClick={() => setShowImpact(true)}><BarChart3 size={12} />{lang === 'en' ? 'Impact Analysis' : '影响分析'}</GhostBtn>
              </div>
            </div>
          </GCard>
        )}
      </div>

      {showForm && <SchemeFormModal onClose={() => setShowForm(false)} />}
      {showImpact && <ImpactAnalysisModal onClose={() => setShowImpact(false)} />}
    </div>
  )
}

// ─── Ladder Config Tab ────────────────────────────────────────────────────────

function LadderConfigTab() {
  const { lang } = useLang()
  const [mode, setMode] = useState<'full' | 'marginal'>('marginal')
  const [cycle, setCycle] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly')
  const [tiers, setTiers] = useState<LadderTier[]>(ladderTiers)
  const [simPremium, setSimPremium] = useState(250000)

  const basePremium = 150000
  const baseRate = 0.12

  const getMultiplier = (premium: number) => {
    const tier = tiers.slice().reverse().find(t => premium >= t.minPremium)
    return tier?.rateMultiplier ?? 1.0
  }
  const multiplier = getMultiplier(simPremium)
  const simCommission = simPremium * baseRate * multiplier

  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Config */}
        <GCard style={{ padding: '18px 20px' }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Layers size={15} color={C.primary} />{lang === 'en' ? 'Tiered Commission Rules' : '阶梯佣金规则配置'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>{lang === 'en' ? 'Tier Mode' : '阶梯模式'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(lang === 'en' ? [['full', 'Full Progression'], ['marginal', 'Marginal Progression']] : [['full', '全额累进'], ['marginal', '超额累进']]).map(([v, l]) => (
                  <button key={v} onClick={() => setMode(v as any)} style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid ${mode === v ? C.primary : C.border}`, background: mode === v ? C.primaryLight : 'transparent', color: mode === v ? C.primary : C.textSoft, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>{lang === 'en' ? 'Assessment Period' : '考核周期'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(lang === 'en' ? [['monthly','Monthly'],['quarterly','Quarterly'],['annual','Annual']] : [['monthly','月度'],['quarterly','季度'],['annual','年度']]).map(([v, l]) => (
                  <button key={v} onClick={() => setCycle(v as any)} style={{ flex: 1, padding: '6px', borderRadius: 8, border: `1.5px solid ${cycle === v ? C.primary : C.border}`, background: cycle === v ? C.primaryLight : 'transparent', color: cycle === v ? C.primary : C.textSoft, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>{l}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Tiers table */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: `0.5px solid ${C.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {(lang === 'en'
                    ? ['Tier', 'Premium Floor', 'Premium Cap', 'Rate Multiplier', 'Effective Rate', 'Actions']
                    : ['档位', '保费下限', '保费上限', '费率系数', '等效费率', '操作']
                  ).map(h => <th key={h} style={{ ...TH, fontSize: 11 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={t.id} style={{ background: simPremium >= t.minPremium && (t.maxPremium === null || simPremium < t.maxPremium) ? C.primaryLight : 'transparent' }}>
                    <td style={{ ...TD, fontWeight: 700, color: C.text }}>{lang === 'en' ? `Tier ${i + 1}` : `第 ${i + 1} 档`}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12 }}>${t.minPremium.toLocaleString()}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12 }}>{t.maxPremium ? `$${t.maxPremium.toLocaleString()}` : (lang === 'en' ? 'No cap' : '不设上限')}</td>
                    <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 800, color: C.primary }}>×{t.rateMultiplier.toFixed(2)}</td>
                    <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 800, color: C.green }}>{(baseRate * t.rateMultiplier * 100).toFixed(1)}%</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Edit2 size={11} /></button>
                        {i > 0 && <button onClick={() => setTiers(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.red, padding: '3px 4px' }}><X size={11} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setTiers(prev => [...prev, { id: Date.now(), minPremium: prev[prev.length - 1].minPremium + 200000, maxPremium: null, rateMultiplier: 1.5 }])} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, background: 'transparent', border: `1px dashed ${C.border}`, color: C.muted, cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
            <Plus size={12} />{lang === 'en' ? 'Add New Tier' : '添加新档位'}
          </button>
        </GCard>
      </div>

      {/* Simulator */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <GCard style={{ padding: '18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} color={C.primary} />{lang === 'en' ? 'Tier Simulator' : '阶梯模拟计算'}
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 5 }}>{lang === 'en' ? 'Simulated Premium ($)' : '模拟保费（$）'}</div>
            <input type="range" min={0} max={1000000} step={10000} value={simPremium} onChange={e => setSimPremium(+e.target.value)} style={{ width: '100%', accentColor: C.primary }} />
            <div style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.text, marginTop: 4 }}>${simPremium.toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: lang === 'en' ? 'Matched Tier' : '命中档位', value: lang === 'en' ? `Tier ${tiers.findIndex(t => simPremium >= t.minPremium && (t.maxPremium === null || simPremium < t.maxPremium)) + 1}` : `第 ${tiers.findIndex(t => simPremium >= t.minPremium && (t.maxPremium === null || simPremium < t.maxPremium)) + 1} 档`, color: C.primary },
              { label: lang === 'en' ? 'Rate Multiplier' : '费率系数', value: `×${multiplier.toFixed(2)}`, color: C.primary },
              { label: lang === 'en' ? 'Effective Rate' : '实际佣金率', value: `${(baseRate * multiplier * 100).toFixed(1)}%`, color: C.green },
              { label: lang === 'en' ? 'Estimated Commission' : '预计佣金', value: `$${simCommission.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: C.green },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `0.5px solid ${C.border}` }}>
                <span style={{ fontSize: 12, color: C.muted }}>{r.label}</span>
                <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </GCard>

        <GCard style={{ padding: '16px 18px' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12 }}>{lang === 'en' ? 'Override Levels' : 'Override 层级配置'}</div>
          {overrideTiers.map(t => (
            <div key={t.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `0.5px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{lang === 'en' ? (OVERRIDE_ROLE_EN[t.role] ?? t.role) : t.role}</div>
                {t.minTeamSize && <div style={{ fontSize: 11, color: C.muted }}>{lang === 'en' ? `Min ${t.minTeamSize} people` : `最少 ${t.minTeamSize} 人`}</div>}
              </div>
              <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.amber }}>{(t.overrideRate * 100).toFixed(1)}%</span>
            </div>
          ))}
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, padding: '5px 10px', borderRadius: 7, fontSize: 12, color: C.primary, background: C.primaryLight, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer', fontWeight: 600 }}><Plus size={11} />{lang === 'en' ? 'Add Level' : '新增层级'}</button>
        </GCard>
      </div>
    </div>
  )
}

// ─── Approval Tab ─────────────────────────────────────────────────────────────

function ApprovalTab() {
  const { lang } = useLang()
  const pending = schemes.filter(s => s.status === 'pending')

  return (
    <GCard style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Clock size={14} color={C.primary} />{lang === 'en' ? 'Pending Approval Plans' : '待审批方案'}
          {pending.length > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 6px' }}>{pending.length}</span>}
        </div>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Batch Approval Records' : '批量审批记录'}</GhostBtn>
      </div>
      {pending.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', color: C.mutedLight, fontSize: 13 }}>
          <CheckCircle2 size={32} style={{ opacity: 0.3, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
          {lang === 'en' ? 'No pending plans' : '暂无待审批方案'}
        </div>
      ) : (
        pending.map(s => (
          <div key={s.id} style={{ padding: '16px 18px', borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{s.name}</div>
                <div style={{ ...mono, fontSize: 11, color: C.muted, marginTop: 2 }}>{s.code} · v{s.version} · {lang === 'en' ? chTypeEn(s.channelType) : s.channelType} · {s.line}</div>
              </div>
              <StatusBadge s={s.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: C.bg }}>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.primary }}>{(s.firstYearRate * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: C.muted }}>{lang === 'en' ? 'First-Year Rate' : '首年佣金率'}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.textSoft }}>{(s.renewalRates[0] * 100).toFixed(0)}%</div>
                <div style={{ fontSize: 11, color: C.muted }}>{lang === 'en' ? 'Renewal Rate Y2' : '续期佣金率Y2'}</div>
              </div>
              <div style={{ textAlign: 'center' as const }}>
                <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: C.textSoft }}>{s.bindCount}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{lang === 'en' ? 'Bound Channels' : '绑定渠道数'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryBtn sm><Check size={12} />{lang === 'en' ? 'Approve' : '审批通过'}</PrimaryBtn>
              <GhostBtn sm><X size={12} />{lang === 'en' ? 'Reject' : '驳回'}</GhostBtn>
              <GhostBtn sm><Eye size={12} />{lang === 'en' ? 'View Details' : '查看详情'}</GhostBtn>
              <GhostBtn sm><BarChart3 size={12} />{lang === 'en' ? 'Impact Analysis' : '影响分析'}</GhostBtn>
            </div>
          </div>
        ))
      )}
    </GCard>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function SchemeFormModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLang()
  const [step, setStep] = useState(1)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GCard style={{ width: 620, maxHeight: '90vh', overflowY: 'auto', background: C.surfaceHigh, borderRadius: 18, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>{lang === 'en' ? 'New Commission Plan' : '新建佣金方案'}</h2>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{lang === 'en' ? `Step ${step} / 3` : `步骤 ${step} / 3`}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {(lang === 'en' ? ['Basic Info', 'Rate Configuration', 'Additional Rules'] : ['基本信息', '费率配置', '附加规则']).map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? C.primary : C.border, marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: i + 1 <= step ? C.primary : C.mutedLight, fontWeight: i + 1 === step ? 700 : 400 }}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {(lang === 'en' ? [
              { label: 'Plan Name *', placeholder: 'e.g. Agency Standard — Auto', span: 2 },
              { label: 'Plan Code *', placeholder: 'e.g. SCH-AUTO-001' },
              { label: 'Plan Description', placeholder: 'Brief description', span: 2 },
              { label: 'Applicable Channel Type *' },
              { label: 'Applicable Insurer *' },
              { label: 'Applicable Line *' },
              { label: 'Effective Date *', type: 'date' },
              { label: 'Expiry Date (optional)', type: 'date' },
            ] : [
              { label: '方案名称 *', placeholder: 'e.g. Agency Standard — Auto', span: 2 },
              { label: '方案编码 *', placeholder: 'e.g. SCH-AUTO-001' },
              { label: '方案描述', placeholder: '简要描述', span: 2 },
              { label: '适用渠道类型 *' },
              { label: '适用保险公司 *' },
              { label: '适用业务线 *' },
              { label: '生效日期 *', type: 'date' },
              { label: '失效日期（可选）', type: 'date' },
            ]).map(f => (
              <div key={f.label} style={{ gridColumn: (f as any).span === 2 ? '1/-1' : undefined }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={(f as any).type ?? 'text'} placeholder={(f as any).placeholder} style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }} />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: C.primaryLight, border: `0.5px solid ${C.primaryBorder}` }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 10 }}>{lang === 'en' ? 'Base Commission Rate Settings' : '基本佣金率设置'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {(lang === 'en'
                  ? ['First-Year Rate *', 'Year 2 Renewal Rate', 'Year 3 Renewal Rate', 'Year 4 Renewal Rate', 'Year 5 Renewal Rate', 'Renewal Rate After Year 5']
                  : ['首年佣金率 *', '第2年续期率', '第3年续期率', '第4年续期率', '第5年续期率', '5年后续期率']
                ).map(l => (
                  <div key={l}>
                    <label style={{ fontSize: 11, color: C.primary, display: 'block', marginBottom: 4, fontWeight: 600 }}>{l}</label>
                    <div style={{ position: 'relative' }}>
                      <input type="number" step="0.1" placeholder="0.0" style={{ width: '100%', padding: '7px 28px 7px 10px', borderRadius: 7, border: `0.5px solid ${C.primaryBorder}`, fontSize: 13, background: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
                      <span style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.primary, fontWeight: 700 }}>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Commission Floor ($)' : '佣金下限（$）'}</label>
                <input type="number" placeholder={lang === 'en' ? 'optional' : '可选'} style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 5 }}>{lang === 'en' ? 'Commission Cap ($)' : '佣金上限（$）'}</label>
                <input type="number" placeholder={lang === 'en' ? 'optional' : '可选'} style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(lang === 'en' ? [
              { label: 'Enable Tiered Commission', desc: 'Set rate multiplier rewards by performance tiers' },
              { label: 'Enable Override Commission', desc: 'Managers receive override on downline production' },
              { label: 'Enable Cancellation Clawback', desc: 'Claw back paid commission per rules when policies cancel' },
              { label: 'Enable Bonus Rules', desc: 'Earn extra incentive bonus upon hitting targets' },
            ] : [
              { label: '启用阶梯佣金', desc: '按业绩档位设置费率倍数奖励' },
              { label: '启用 Override 佣金', desc: '上级对下级业绩获得管理津贴' },
              { label: '启用退保追回', desc: '保单退保时按规则追回已支付佣金' },
              { label: '启用奖金规则', desc: '达成目标后获得额外激励奖金' },
            ]).map(f => (
              <label key={f.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.label}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{f.desc}</div>
                </div>
                <input type="checkbox" defaultChecked style={{ accentColor: C.primary, transform: 'scale(1.3)' }} />
              </label>
            ))}
            <div style={{ padding: '10px 12px', borderRadius: 9, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 12, color: C.amber, fontWeight: 600 }}>
              {lang === 'en'
                ? '⚠ New plans enter the approval workflow and can only be bound to channels after approval.'
                : '⚠ 新建方案将进入审批流程，审批通过后方可绑定渠道生效。'}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          {step > 1 ? <GhostBtn onClick={() => setStep(s => s - 1)}>{lang === 'en' ? '← Back' : '← 上一步'}</GhostBtn> : <span />}
          {step < 3
            ? <PrimaryBtn onClick={() => setStep(s => s + 1)}>{lang === 'en' ? 'Next →' : '下一步 →'}</PrimaryBtn>
            : <PrimaryBtn onClick={onClose}><Check size={13} />{lang === 'en' ? 'Submit for Approval' : '提交审批'}</PrimaryBtn>
          }
        </div>
      </GCard>
    </div>
  )
}

function ImpactAnalysisModal({ onClose }: { onClose: () => void }) {
  const { lang } = useLang()
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const run = () => { setRunning(true); setTimeout(() => { setRunning(false); setDone(true) }, 1800) }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GCard style={{ width: 580, background: C.surfaceHigh, borderRadius: 18, padding: '28px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={17} color={C.primary} />{lang === 'en' ? 'Plan Impact Analysis' : '方案影响分析'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {(lang === 'en'
            ? [['Original Plan', 'SCH-AUTO-000 v2 (Expired)'], ['New Plan', 'SCH-AUTO-001 v3 (Current)'], ['Analysis Scope', 'All bound channels (18)'], ['Time Range', 'Past 12 months']]
            : [['原方案', 'SCH-AUTO-000 v2 (已失效)'], ['新方案', 'SCH-AUTO-001 v3 (当前)'], ['分析范围', '全部绑定渠道（18个）'], ['时间范围', '过去12个月']]
          ).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{v}</div>
            </div>
          ))}
        </div>
        {!done && !running && <PrimaryBtn onClick={run}><Zap size={13} />{lang === 'en' ? 'Run Simulation' : '执行模拟计算'}</PrimaryBtn>}
        {running && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: C.muted, fontSize: 13 }}>
            <div style={{ marginBottom: 8 }}>{lang === 'en'
              ? 'Running simulation — recalculating commission data for 12 months · 18 channels…'
              : '模拟计算中，正在重新计算 12 个月 · 18 个渠道的佣金数据…'}</div>
            <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '70%', height: '100%', background: C.primary, borderRadius: 2, animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
          </div>
        )}
        {done && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: lang === 'en' ? 'Original Total Commission' : '原方案总佣金', value: '$2.84M', color: C.muted },
                { label: lang === 'en' ? 'New Total Commission' : '新方案总佣金', value: '$3.19M', color: C.primary },
                { label: lang === 'en' ? 'Difference' : '差异', value: '+$350K (+12.3%)', color: C.green },
              ].map(s => (
                <GCard key={s.label} style={{ padding: '12px 14px', textAlign: 'center' as const, background: 'rgba(249,249,255,0.6)' }}>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{s.label}</div>
                </GCard>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 9, background: C.greenBg, border: `0.5px solid ${C.greenBorder}`, fontSize: 12, color: C.green, fontWeight: 600 }}>
              {lang === 'en'
                ? 'The new plan will increase overall annual channel commission income by about $350K, helping boost channel motivation and business volume.'
                : '新方案将使渠道年度佣金收入整体增加约 $350K，有利于提升渠道积极性和业务量。'}
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Export Report' : '导出分析报告'}</GhostBtn>
              <GhostBtn sm onClick={onClose}>{lang === 'en' ? 'Close' : '关闭'}</GhostBtn>
            </div>
          </div>
        )}
      </GCard>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function CommissionSchemeView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'list' | 'ladder' | 'approval'>('list')
  const title = lang === 'en' ? 'Commission Scheme Configuration' : '佣金方案配置与管理'
  const tabs = [
    { id: 'list' as const, label: lang === 'en' ? 'Commission Schemes' : '佣金方案列表' },
    { id: 'ladder' as const, label: lang === 'en' ? 'Ladder & Override Rules' : '阶梯 & Override 配置' },
    { id: 'approval' as const, label: lang === 'en' ? 'Pending Approval' : '待审批', badge: schemes.filter(s => s.status === 'pending').length },
  ]

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'Design and manage commission rate structures, ladder rules, overrides, and chargebacks' : '设计和管理佣金率结构、阶梯规则、Override 和退保追回配置'}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
            {(t as any).badge > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px' }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'list' && <SchemeListTab />}
      {tab === 'ladder' && <LadderConfigTab />}
      {tab === 'approval' && <ApprovalTab />}
    </div>
  )
}
