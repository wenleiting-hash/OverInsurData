import { useState } from 'react'
import {
  Search, Plus, Check, X, AlertTriangle, ChevronRight,
  Shield, Lock, Unlock, Eye, Edit2, Download, Upload,
  Building2, Package, Globe, Calendar, Filter,
  CheckCircle2, XCircle, Clock, MoreHorizontal,
  AlertCircle, Zap, TrendingUp, Users, ArrowUpDown,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

// ─── Types ──────────────────────────────────────────────────────────────────

type AuthStatus = 'active' | 'expiring' | 'expired' | 'revoked' | 'pending'
type PermOp = 'quote' | 'bind' | 'endorse' | 'renew' | 'cancel'

interface ProductAuth {
  id: string
  channelName: string
  channelType: 'agency' | 'mga' | 'fmo' | 'broker'
  insurer: string
  product: string
  line: string
  states: string[]
  authType: 'permanent' | 'fixed' | 'trial'
  effectDate: string
  expiryDate: string | null
  status: AuthStatus
  permissions: PermOp[]
  quotaMonthly: number | null
  quotaUsed: number
  quotaSingle: number | null
}

interface PermConfig {
  channelId: string
  channelName: string
  product: string
  insurer: string
  state: string
  ops: Record<PermOp, boolean>
  singleLimit: number | null
  monthlyLimit: number | null
  quarterlyLimit: number | null
  overLimitRule: 'manual-uw' | 'block' | 'supervisor'
  inherit: boolean
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const LINES = ['AUTO', 'HOME', 'LIFE', 'HEALTH', 'COMMERCIAL', 'UMBRELLA']
const INSURERS = ['Pacific Mutual', 'Liberty Shield', 'Nationwide Plus', 'SafeGuard Re', 'AmeriTrust']
const STATES_US = ['CA', 'TX', 'NY', 'FL', 'IL', 'WA', 'OR', 'NV', 'CO', 'GA', 'OH', 'PA', 'NJ', 'CT', 'AZ']

const auths: ProductAuth[] = [
  { id: 'a1', channelName: 'Pacific Coast Insurance Agency', channelType: 'agency', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', line: 'AUTO', states: ['CA','OR','WA','NV'], authType: 'permanent', effectDate: '2024-01-01', expiryDate: null, status: 'active', permissions: ['quote','bind','endorse','renew'], quotaMonthly: 500000, quotaUsed: 287432, quotaSingle: 50000 },
  { id: 'a2', channelName: 'Pacific Coast Insurance Agency', channelType: 'agency', insurer: 'Liberty Shield', product: 'Homeowners Elite', line: 'HOME', states: ['CA','OR'], authType: 'permanent', effectDate: '2024-01-01', expiryDate: null, status: 'active', permissions: ['quote','bind','endorse','renew','cancel'], quotaMonthly: 300000, quotaUsed: 156200, quotaSingle: 30000 },
  { id: 'a3', channelName: 'SunState MGA Partners', channelType: 'mga', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', line: 'AUTO', states: ['TX','FL','GA'], authType: 'fixed', effectDate: '2024-06-01', expiryDate: '2025-06-01', status: 'expiring', permissions: ['quote','bind','renew'], quotaMonthly: 1000000, quotaUsed: 823400, quotaSingle: 100000 },
  { id: 'a4', channelName: 'Mountain West FMO', channelType: 'fmo', insurer: 'Nationwide Plus', product: 'Medicare Advantage Basic', line: 'HEALTH', states: ['CO','AZ','NV','NM'], authType: 'permanent', effectDate: '2023-07-01', expiryDate: null, status: 'active', permissions: ['quote','bind','renew'], quotaMonthly: null, quotaUsed: 0, quotaSingle: null },
  { id: 'a5', channelName: 'Northeast Brokers Group', channelType: 'broker', insurer: 'SafeGuard Re', product: 'Commercial GL Plus', line: 'COMMERCIAL', states: ['NY','NJ','CT','PA'], authType: 'fixed', effectDate: '2024-03-01', expiryDate: '2024-03-01', status: 'expired', permissions: ['quote'], quotaMonthly: 200000, quotaUsed: 200000, quotaSingle: 25000 },
  { id: 'a6', channelName: 'CalFirst Agents Network', channelType: 'agency', insurer: 'AmeriTrust', product: 'Term Life 20', line: 'LIFE', states: ['CA'], authType: 'trial', effectDate: '2026-07-01', expiryDate: '2026-10-01', status: 'pending', permissions: ['quote','bind'], quotaMonthly: 100000, quotaUsed: 12000, quotaSingle: 20000 },
  { id: 'a7', channelName: 'Lone Star Agency Group', channelType: 'agency', insurer: 'Liberty Shield', product: 'Personal Auto Preferred', line: 'AUTO', states: ['TX'], authType: 'permanent', effectDate: '2022-01-01', expiryDate: null, status: 'revoked', permissions: [], quotaMonthly: null, quotaUsed: 0, quotaSingle: null },
]

const permConfigs: PermConfig[] = [
  { channelId: 'c1', channelName: 'Pacific Coast Insurance Agency', product: 'Personal Auto Preferred', insurer: 'Pacific Mutual', state: 'CA', ops: { quote: true, bind: true, endorse: true, renew: true, cancel: false }, singleLimit: 50000, monthlyLimit: 500000, quarterlyLimit: 1500000, overLimitRule: 'manual-uw', inherit: false },
  { channelId: 'c1', channelName: 'Pacific Coast Insurance Agency', product: 'Homeowners Elite', insurer: 'Liberty Shield', state: 'CA', ops: { quote: true, bind: true, endorse: true, renew: true, cancel: true }, singleLimit: 30000, monthlyLimit: 300000, quarterlyLimit: 900000, overLimitRule: 'supervisor', inherit: false },
  { channelId: 'c2', channelName: 'SunState MGA Partners', product: 'Personal Auto Preferred', insurer: 'Pacific Mutual', state: 'TX', ops: { quote: true, bind: true, endorse: false, renew: true, cancel: false }, singleLimit: 100000, monthlyLimit: 1000000, quarterlyLimit: null, overLimitRule: 'block', inherit: true },
  { channelId: 'c3', channelName: 'Mountain West FMO', product: 'Medicare Advantage Basic', insurer: 'Nationwide Plus', state: 'CO', ops: { quote: true, bind: true, endorse: false, renew: true, cancel: false }, singleLimit: null, monthlyLimit: null, quarterlyLimit: null, overLimitRule: 'manual-uw', inherit: true },
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

// ─── Primitives ───────────────────────────────────────────────────────────────

function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>
      {children}
    </div>
  )
}

function Badge({ label, color = C.muted, bg = 'rgba(193,198,215,0.18)' }: { label: string; color?: string; bg?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color, background: bg, whiteSpace: 'nowrap' }}>{label}</span>
}

function PrimaryBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '5px 12px' : '7px 16px', borderRadius: 8, fontSize: sm ? 12 : 13, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function GhostBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '4px 10px' : '6px 12px', borderRadius: 8, fontSize: sm ? 11.5 : 12.5, fontWeight: 600, color: C.textSoft, background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function PermToggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '6px 10px', borderRadius: 8, background: on ? C.greenBg : C.redBg, border: `0.5px solid ${on ? C.greenBorder : C.redBorder}`, transition: 'all 0.12s' }}>
      <input type="checkbox" checked={on} onChange={e => onChange(e.target.checked)} style={{ display: 'none' }} />
      {on ? <Check size={11} color={C.green} /> : <X size={11} color={C.red} />}
      <span style={{ fontSize: 11.5, fontWeight: 700, color: on ? C.green : C.red }}>{label}</span>
    </label>
  )
}

const AUTH_STATUS: Record<AuthStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:   { label: '有效', color: C.green, bg: C.greenBg, dot: C.green },
  expiring: { label: '即将到期', color: C.amber, bg: C.amberBg, dot: C.amber },
  expired:  { label: '已过期', color: C.red, bg: C.redBg, dot: C.red },
  revoked:  { label: '已撤回', color: C.muted, bg: 'rgba(193,198,215,0.18)', dot: C.mutedLight },
  pending:  { label: '待审批', color: C.primary, bg: C.primaryLight, dot: C.primary },
}

function AuthStatusBadge({ s }: { s: AuthStatus }) {
  const m = AUTH_STATUS[s]
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.dot }} />{m.label}
  </span>
}

const TYPE_LABEL: Record<string, string> = { permanent: '永久授权', fixed: '固定期限', trial: '试用授权' }
const TYPE_COLOR: Record<string, string> = { permanent: C.green, fixed: C.primary, trial: C.amber }
const CHANNEL_TYPE: Record<string, string> = { agency: '代理机构', mga: 'MGA', fmo: 'FMO', broker: '经纪公司' }

const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, verticalAlign: 'middle', fontSize: 12.5 }

function fmt(n: number) { return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K` }

// ─── Auth List Tab ────────────────────────────────────────────────────────────

function AuthListTab() {
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [lineF, setLineF] = useState('all')
  const [selected, setSelected] = useState<ProductAuth | null>(auths[0])
  const [showModal, setShowModal] = useState(false)

  const filtered = auths.filter(a =>
    (statusF === 'all' || a.status === statusF) &&
    (lineF === 'all' || a.line === lineF) &&
    (!search || a.channelName.toLowerCase().includes(search.toLowerCase()) || a.product.toLowerCase().includes(search.toLowerCase()))
  )

  const stats = {
    active: auths.filter(a => a.status === 'active').length,
    expiring: auths.filter(a => a.status === 'expiring').length,
    expired: auths.filter(a => a.status === 'expired').length,
    pending: auths.filter(a => a.status === 'pending').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: '有效授权', v: stats.active, color: C.green, icon: <CheckCircle2 size={16} color={C.green} /> },
          { label: '即将到期', v: stats.expiring, color: C.amber, icon: <Clock size={16} color={C.amber} /> },
          { label: '已过期', v: stats.expired, color: C.red, icon: <XCircle size={16} color={C.red} /> },
          { label: '待审批', v: stats.pending, color: C.primary, icon: <AlertCircle size={16} color={C.primary} /> },
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

      {stats.expiring > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: C.amberBg, border: `0.5px solid ${C.amberBorder}`, fontSize: 12.5, color: C.amber, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
          <AlertTriangle size={13} />{stats.expiring} 条产品授权即将到期，请及时续期以避免渠道出单中断。
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <GCard style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索渠道名称、产品…" style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            {[
              { value: statusF, set: setStatusF, opts: [['all','全部状态'], ...Object.entries(AUTH_STATUS).map(([k,v]) => [k, v.label])] },
              { value: lineF, set: setLineF, opts: [['all','全部业务线'], ...LINES.map(l => [l, l])] },
            ].map((s, i) => (
              <select key={i} value={s.value} onChange={e => s.set(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', fontFamily: 'inherit' }}>
                {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            <PrimaryBtn onClick={() => setShowModal(true)} sm><Plus size={13} />新增授权</PrimaryBtn>
            <GhostBtn sm><Download size={12} />导出清单</GhostBtn>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['渠道', '产品 / 保险公司', '授权州', '类型', '状态', '月度限额', '限额使用率', '到期日', ''].map(h => <th key={h} style={TH}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const isSel = selected?.id === a.id
                  const pct = a.quotaMonthly ? (a.quotaUsed / a.quotaMonthly) : 0
                  const pctColor = pct > 0.9 ? C.red : pct > 0.7 ? C.amber : C.green
                  return (
                    <tr key={a.id} onClick={() => setSelected(isSel ? null : a)} style={{ background: isSel ? C.primaryLight : 'transparent', cursor: 'pointer' }}>
                      <td style={TD}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{a.channelName}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{CHANNEL_TYPE[a.channelType]}</div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text }}>{a.product}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{a.insurer}</div>
                      </td>
                      <td style={TD}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {a.states.map(s => <span key={s} style={{ ...mono, fontSize: 10, background: C.primaryLight, color: C.primary, borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>{s}</span>)}
                        </div>
                      </td>
                      <td style={TD}><Badge label={TYPE_LABEL[a.authType]} color={TYPE_COLOR[a.authType]} bg={`${TYPE_COLOR[a.authType]}12`} /></td>
                      <td style={TD}><AuthStatusBadge s={a.status} /></td>
                      <td style={{ ...TD, ...mono, fontSize: 12, color: a.quotaMonthly ? C.text : C.mutedLight }}>{a.quotaMonthly ? fmt(a.quotaMonthly) : '不限'}</td>
                      <td style={TD}>
                        {a.quotaMonthly ? (
                          <div style={{ minWidth: 80 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                              <span style={{ ...mono, color: pctColor, fontWeight: 700 }}>{(pct * 100).toFixed(0)}%</span>
                              <span style={{ color: C.mutedLight }}>{fmt(a.quotaUsed)}</span>
                            </div>
                            <div style={{ height: 4, background: 'rgba(193,198,215,0.3)', borderRadius: 2 }}>
                              <div style={{ width: `${Math.min(100, pct * 100)}%`, height: '100%', background: pctColor, borderRadius: 2, transition: 'width 0.3s' }} />
                            </div>
                          </div>
                        ) : <span style={{ fontSize: 11.5, color: C.mutedLight }}>—</span>}
                      </td>
                      <td style={{ ...TD, ...mono, fontSize: 12, color: a.status === 'expired' ? C.red : a.status === 'expiring' ? C.amber : C.textSoft }}>{a.expiryDate ?? '永久'}</td>
                      <td style={TD}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }} onClick={e => { e.stopPropagation(); setSelected(a) }}><Eye size={12} /></button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Edit2 size={12} /></button>
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
            共 {filtered.length} 条授权记录
          </div>
        </GCard>

        {/* Detail */}
        {selected && (
          <GCard style={{ width: 320, flexShrink: 0, position: 'sticky', top: 0, maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div style={{ padding: '16px 18px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>{selected.product}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>{selected.insurer}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={14} /></button>
            </div>
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <AuthStatusBadge s={selected.status} />
                <Badge label={TYPE_LABEL[selected.authType]} color={TYPE_COLOR[selected.authType]} bg={`${TYPE_COLOR[selected.authType]}12`} />
                <Badge label={selected.line} color={C.purple} bg={C.purpleBg} />
              </div>
              {[
                ['渠道名称', selected.channelName],
                ['渠道类型', CHANNEL_TYPE[selected.channelType]],
                ['生效日期', selected.effectDate],
                ['到期日期', selected.expiryDate ?? '永久有效'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `0.5px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}
              <div>
                <div style={{ fontSize: 11, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 700 }}>授权州</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {selected.states.map(s => <span key={s} style={{ ...mono, fontSize: 11, background: C.primaryLight, color: C.primary, borderRadius: 5, padding: '2px 6px', fontWeight: 700 }}>{s}</span>)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 700 }}>操作权限</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(['quote','bind','endorse','renew','cancel'] as PermOp[]).map(op => {
                    const on = selected.permissions.includes(op)
                    const labels: Record<PermOp, string> = { quote: '报价', bind: '出单', endorse: '批改', renew: '续保', cancel: '退保' }
                    return <span key={op} style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: on ? C.greenBg : 'rgba(193,198,215,0.15)', color: on ? C.green : C.mutedLight, border: `0.5px solid ${on ? C.greenBorder : C.border}` }}>{on ? '✓' : '✗'} {labels[op]}</span>
                  })}
                </div>
              </div>
              {selected.quotaMonthly && (
                <div>
                  <div style={{ fontSize: 11, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, fontWeight: 700 }}>月度限额使用</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ ...mono, fontWeight: 700, color: C.text }}>{fmt(selected.quotaUsed)}</span>
                    <span style={{ color: C.muted }}>/ {fmt(selected.quotaMonthly)}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(193,198,215,0.3)', borderRadius: 3 }}>
                    <div style={{ width: `${Math.min(100, (selected.quotaUsed / selected.quotaMonthly) * 100)}%`, height: '100%', background: selected.quotaUsed / selected.quotaMonthly > 0.9 ? C.red : C.primary, borderRadius: 3 }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 7, marginTop: 4 }}>
                <PrimaryBtn sm><Edit2 size={12} />编辑</PrimaryBtn>
                <GhostBtn sm><Unlock size={12} />续期</GhostBtn>
              </div>
            </div>
          </GCard>
        )}
      </div>

      {showModal && <AuthFormModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ─── Auth Form Modal ──────────────────────────────────────────────────────────

function AuthFormModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [selLine, setSelLine] = useState<string[]>([])
  const [selStates, setSelStates] = useState<string[]>([])
  const [authType, setAuthType] = useState<'permanent' | 'fixed' | 'trial'>('permanent')
  const totalSteps = 3

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(24,28,35,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <GCard style={{ width: 580, maxHeight: '90vh', overflowY: 'auto', background: C.surfaceHigh, borderRadius: 18, padding: '28px 32px', boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0 }}>新增产品授权</h2>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>步骤 {step} / {totalSteps}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={16} /></button>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {['选择对象与产品', '授权范围', '权限与限额'].map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i + 1 <= step ? C.primary : C.border, transition: 'background 0.2s', marginBottom: 4 }} />
              <div style={{ fontSize: 11, color: i + 1 <= step ? C.primary : C.mutedLight, fontWeight: i + 1 === step ? 700 : 400 }}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>授权对象 *</label>
              <select style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }}>
                <option value="">选择渠道组织…</option>
                {['Pacific Coast Insurance Agency','SunState MGA Partners','Mountain West FMO','Northeast Brokers Group','CalFirst Agents Network'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>保险公司 *</label>
              <select style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }}>
                <option value="">选择保险公司…</option>
                {INSURERS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>授权范围</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['all-lines', '全部业务线'], ['by-line', '指定业务线'], ['by-product', '指定产品']].map(([v, l]) => (
                  <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}` }}>
                    <input type="radio" name="scope" value={v} style={{ accentColor: C.primary }} defaultChecked={v === 'all-lines'} />{l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>业务线（可多选）</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {LINES.map(l => {
                  const on = selLine.includes(l)
                  return <label key={l} onClick={() => setSelLine(prev => on ? prev.filter(x => x !== l) : [...prev, l])} style={{ ...mono, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: on ? C.primaryLight : 'rgba(255,255,255,0.5)', color: on ? C.primary : C.textSoft, border: `0.5px solid ${on ? C.primaryBorder : C.border}` }}>{l}</label>
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>授权类型</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['permanent','fixed','trial'] as const).map(t => (
                  <button key={t} onClick={() => setAuthType(t)} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1.5px solid ${authType === t ? C.primary : C.border}`, background: authType === t ? C.primaryLight : 'transparent', color: authType === t ? C.primary : C.textSoft, cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
                    {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>
            {(authType === 'fixed' || authType === 'trial') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {['生效日期 *', '到期日期 *'].map(l => (
                  <div key={l}>
                    <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>{l}</label>
                    <input type="date" style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }} />
                  </div>
                ))}
              </div>
            )}
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>授权州（可多选）</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {STATES_US.map(s => {
                  const on = selStates.includes(s)
                  return <label key={s} onClick={() => setSelStates(prev => on ? prev.filter(x => x !== s) : [...prev, s])} style={{ ...mono, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: on ? C.primaryLight : 'rgba(255,255,255,0.5)', color: on ? C.primary : C.textSoft, border: `0.5px solid ${on ? C.primaryBorder : C.border}` }}>{s}</label>
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 8 }}>操作权限配置</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {([['quote', '报价权限'],['bind', '出单权限'],['endorse','批改权限'],['renew','续保权限'],['cancel','退保权限']] as [PermOp, string][]).map(([op, label]) => (
                  <PermToggle key={op} on={true} label={label} onChange={() => {}} />
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['单笔出单限额', '$'], ['月度累计限额', '$'], ['季度累计限额', '$']].map(([l, prefix]) => (
                <div key={l}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>{l}（可选）</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', ...mono, fontSize: 13, color: C.muted }}>{prefix}</span>
                    <input type="number" placeholder="不限" style={{ width: '100%', padding: '8px 11px 8px 20px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }} />
                  </div>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>超限处理规则</label>
                <select style={{ width: '100%', padding: '8px 11px', borderRadius: 8, border: `0.5px solid ${C.border}`, fontSize: 13, background: 'rgba(255,255,255,0.65)', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="manual-uw">转人工核保</option>
                  <option value="block">禁止出单</option>
                  <option value="supervisor">需主管审批</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, display: 'block', marginBottom: 6 }}>权限继承</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.textSoft }}>
                <input type="checkbox" defaultChecked style={{ accentColor: C.primary }} />
                子机构/代理人自动继承本授权配置的权限和限额
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          {step > 1 ? <GhostBtn onClick={() => setStep(s => s - 1)}>← 上一步</GhostBtn> : <span />}
          {step < totalSteps
            ? <PrimaryBtn onClick={() => setStep(s => s + 1)}>下一步 →</PrimaryBtn>
            : <PrimaryBtn onClick={onClose}><Check size={13} />提交授权</PrimaryBtn>
          }
        </div>
      </GCard>
    </div>
  )
}

// ─── Permission Config Tab ────────────────────────────────────────────────────

function PermConfigTab() {
  const [selected, setSelected] = useState<PermConfig | null>(permConfigs[0])
  const [perms, setPerms] = useState(selected?.ops ?? { quote: true, bind: true, endorse: false, renew: true, cancel: false })

  const OP_LABELS: Record<PermOp, string> = { quote: '报价', bind: '出单', endorse: '批改', renew: '续保', cancel: '退保' }

  const matrixData = [
    { channel: 'Pacific Coast', product: 'Personal Auto Preferred', insurer: 'Pacific Mutual', ca: '✓✓✓✓—', or: '✓✓✓✓—', wa: '✓✓✓✓—', tx: '—', fl: '—' },
    { channel: 'Pacific Coast', product: 'Homeowners Elite', insurer: 'Liberty Shield', ca: '✓✓✓✓✓', or: '✓✓✓✓✓', wa: '—', tx: '—', fl: '—' },
    { channel: 'SunState MGA', product: 'Personal Auto Preferred', insurer: 'Pacific Mutual', ca: '—', or: '—', wa: '—', tx: '✓✓—✓—', fl: '✓✓—✓—' },
    { channel: 'Mountain West FMO', product: 'Medicare Advantage Basic', insurer: 'Nationwide Plus', ca: '—', or: '—', wa: '—', tx: '—', fl: '—' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Permission matrix view */}
      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Zap size={14} color={C.primary} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>权限矩阵视图</span>
          <span style={{ fontSize: 11.5, color: C.muted, marginLeft: 4 }}>渠道 × 产品 × 州 的权限分布</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['渠道', '产品', '保险公司', 'CA', 'OR', 'WA', 'TX', 'FL'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {matrixData.map((r, i) => (
                <tr key={i}>
                  <td style={{ ...TD, fontWeight: 600, fontSize: 12 }}>{r.channel}</td>
                  <td style={{ ...TD, fontSize: 12 }}>{r.product}</td>
                  <td style={{ ...TD, fontSize: 11.5, color: C.muted }}>{r.insurer}</td>
                  {[r.ca, r.or, r.wa, r.tx, r.fl].map((v, j) => (
                    <td key={j} style={{ ...TD, textAlign: 'center' as const, ...mono, fontSize: 11 }}>
                      {v === '—' ? <span style={{ color: C.mutedLight }}>—</span> : <span style={{ color: C.green, fontSize: 10, letterSpacing: '-1px' }}>{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '8px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11, color: C.mutedLight, display: 'flex', gap: 12 }}>
          <span>图例：字母顺序 = 报价 出单 批改 续保 退保 · ✓ = 已授权 · — = 未授权 / 不适用</span>
        </div>
      </GCard>

      {/* Config editor */}
      <div style={{ display: 'flex', gap: 14 }}>
        <GCard style={{ width: 260, flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, fontSize: 12.5, fontWeight: 700, color: C.text }}>渠道 / 产品 选择</div>
          {permConfigs.map((pc, i) => {
            const isSel = selected === pc
            return (
              <div key={i} onClick={() => { setSelected(pc); setPerms(pc.ops) }} style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, cursor: 'pointer', background: isSel ? C.primaryLight : 'transparent' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isSel ? C.primary : C.text }}>{pc.channelName.split(' ').slice(0, 3).join(' ')}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{pc.product} · {pc.state}</div>
              </div>
            )
          })}
        </GCard>

        {selected && (
          <GCard style={{ flex: 1, padding: '18px 20px' }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{selected.channelName}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{selected.product} · {selected.insurer} · {selected.state}</div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>操作权限</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(Object.keys(perms) as PermOp[]).map(op => (
                  <PermToggle key={op} on={perms[op]} label={OP_LABELS[op]} onChange={v => setPerms(prev => ({ ...prev, [op]: v }))} />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
              {[['单笔限额', selected.singleLimit], ['月度限额', selected.monthlyLimit], ['季度限额', selected.quarterlyLimit]].map(([l, v]) => (
                <div key={l as string}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 6 }}>{l as string}</div>
                  <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: v ? C.text : C.mutedLight }}>{v ? fmt(v as number) : '不限'}</div>
                  <div style={{ marginTop: 5, height: 3, background: 'rgba(193,198,215,0.25)', borderRadius: 2 }}><div style={{ width: '60%', height: '100%', background: C.primary, borderRadius: 2 }} /></div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.muted, marginBottom: 8 }}>超限处理规则</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['manual-uw', '转人工核保'],['block','禁止出单'],['supervisor','需主管审批']].map(([v, l]) => {
                  const on = selected.overLimitRule === v
                  return <span key={v} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: on ? C.amberBg : 'rgba(255,255,255,0.4)', color: on ? C.amber : C.textSoft, border: `0.5px solid ${on ? C.amberBorder : C.border}` }}>{l}</span>
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryBtn><Check size={13} />保存配置</PrimaryBtn>
              <GhostBtn sm>提交审批</GhostBtn>
            </div>
          </GCard>
        )}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function ProductAuthView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'auth' | 'perm'>('auth')
  const title = lang === 'en' ? 'Product Authorization & Binding Authority' : '渠道产品授权与出单权限管理'
  const sub = lang === 'en' ? 'Manage product sales authorizations and operational permissions for channels' : '管理渠道产品销售授权及出单操作权限与限额'
  const tabs = [
    { id: 'auth' as const, label: lang === 'en' ? '10.1 Product Authorization' : '10.1 产品资源授权', icon: <Shield size={13} /> },
    { id: 'perm' as const, label: lang === 'en' ? '10.2 Permissions & Quotas' : '10.2 出单权限与限额', icon: <Lock size={13} /> },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
          <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <GhostBtn><Upload size={12} />导入授权清单</GhostBtn>
          <GhostBtn><Download size={12} />导出授权清单</GhostBtn>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'auth' && <AuthListTab />}
      {tab === 'perm' && <PermConfigTab />}
    </div>
  )
}
