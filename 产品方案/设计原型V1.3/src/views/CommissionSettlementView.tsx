import { useState } from 'react'
import {
  Search, Check, X, Download, Upload, RefreshCw,
  DollarSign, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Eye, MoreHorizontal, Loader2, Zap,
  FileText, CreditCard, ArrowUpDown, Filter, BarChart3,
  XCircle, ArrowUp, ArrowDown, Plus, Minus, Send,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)', greenBorder: 'rgba(52,199,89,0.25)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)', redBorder: 'rgba(255,59,48,0.22)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
  bg: 'rgba(249,249,255,0.45)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

// ─── Mock data ────────────────────────────────────────────────────────────────

type SettlStatus = 'pending-calc' | 'calculated' | 'pending-approval' | 'approved' | 'paid' | 'failed'

interface Settlement {
  id: string
  period: string
  channel: string
  channelType: string
  baseComm: number
  override: number
  bonus: number
  chargeback: number
  adjustment: number
  total: number
  policyCount: number
  status: SettlStatus
  payMethod: 'ACH' | 'check' | 'wire'
  approvedBy: string | null
  paidDate: string | null
  bankLast4: string
}

interface CommDetail {
  id: string
  policyNo: string
  insured: string
  insurer: string
  product: string
  premium: number
  commType: 'direct' | 'override' | 'renewal' | 'bonus' | 'chargeback'
  rate: number
  amount: number
  period: string
  agent: string
  status: string
}

interface ReconcileRow {
  id: string
  policyNo: string
  insurer: string
  ourCalc: number
  insurerBill: number
  diff: number
  diffType: 'rate-diff' | 'premium-diff' | 'agent-mismatch' | 'not-found' | 'match'
  resolved: boolean
}

const settlements: Settlement[] = [
  { id: 'st1', period: '2026-08', channel: 'Pacific Coast Insurance Agency', channelType: '代理机构', baseComm: 28750, override: 4320, bonus: 2500, chargeback: -1200, adjustment: 500, total: 34870, policyCount: 87, status: 'pending-approval', payMethod: 'ACH', approvedBy: null, paidDate: null, bankLast4: '4521' },
  { id: 'st2', period: '2026-08', channel: 'SunState MGA Partners', channelType: 'MGA', baseComm: 92400, override: 13860, bonus: 8000, chargeback: -3200, adjustment: 0, total: 111060, policyCount: 215, status: 'pending-approval', payMethod: 'ACH', approvedBy: null, paidDate: null, bankLast4: '7803' },
  { id: 'st3', period: '2026-08', channel: 'Mountain West FMO', channelType: 'FMO', baseComm: 45200, override: 6780, bonus: 3000, chargeback: -800, adjustment: -1500, total: 52680, policyCount: 132, status: 'approved', payMethod: 'wire', approvedBy: 'David Kim', paidDate: null, bankLast4: '2290' },
  { id: 'st4', period: '2026-08', channel: 'Northeast Brokers Group', channelType: '经纪公司', baseComm: 18900, override: 0, bonus: 0, chargeback: -450, adjustment: 0, total: 18450, policyCount: 43, status: 'paid', payMethod: 'check', approvedBy: 'David Kim', paidDate: '2026-08-25', bankLast4: '0000' },
  { id: 'st5', period: '2026-07', channel: 'Pacific Coast Insurance Agency', channelType: '代理机构', baseComm: 26400, override: 3960, bonus: 0, chargeback: -600, adjustment: 0, total: 29760, policyCount: 79, status: 'paid', payMethod: 'ACH', approvedBy: 'Sarah Wang', paidDate: '2026-07-28', bankLast4: '4521' },
]

const details: CommDetail[] = [
  { id: 'd1', policyNo: 'PM-2026-004521', insured: 'Jennifer Walsh', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1840, commType: 'direct', rate: 0.12, amount: 220.8, period: '2026-08', agent: 'Mike Torres', status: '已结算' },
  { id: 'd2', policyNo: 'LS-2026-008834', insured: 'Robert Chen', insurer: 'Liberty Shield', product: 'Homeowners Elite', premium: 3200, commType: 'direct', rate: 0.15, amount: 480, period: '2026-08', agent: 'Amy Park', status: '已结算' },
  { id: 'd3', policyNo: 'PM-2025-001122', insured: 'Maria Santos', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1560, commType: 'renewal', rate: 0.10, amount: 156, period: '2026-08', agent: 'Mike Torres', status: '已结算' },
  { id: 'd4', policyNo: 'AT-2026-002099', insured: 'James Kim', insurer: 'AmeriTrust', product: 'Term Life 20', premium: 4800, commType: 'direct', rate: 0.55, amount: 2640, period: '2026-08', agent: 'Lisa Wong', status: '已结算' },
  { id: 'd5', policyNo: 'PM-2026-000321', insured: 'Anna Brown', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1200, commType: 'chargeback', rate: 1.0, amount: -144, period: '2026-08', agent: 'Mike Torres', status: '已追回' },
]

const reconcileRows: ReconcileRow[] = [
  { id: 'r1', policyNo: 'PM-2026-003344', insurer: 'Pacific Mutual', ourCalc: 220.8, insurerBill: 220.8, diff: 0, diffType: 'match', resolved: false },
  { id: 'r2', policyNo: 'PM-2026-004422', insurer: 'Pacific Mutual', ourCalc: 336, insurerBill: 280, diff: 56, diffType: 'rate-diff', resolved: false },
  { id: 'r3', policyNo: 'PM-2026-005511', insurer: 'Pacific Mutual', ourCalc: 192, insurerBill: 160, diff: 32, diffType: 'premium-diff', resolved: true },
  { id: 'r4', policyNo: 'PM-2026-006600', insurer: 'Pacific Mutual', ourCalc: 0, insurerBill: 144, diff: -144, diffType: 'agent-mismatch', resolved: false },
  { id: 'r5', policyNo: 'PM-2026-007712', insurer: 'Pacific Mutual', ourCalc: 96, insurerBill: 0, diff: 96, diffType: 'not-found', resolved: false },
]

// ─── Primitives ───────────────────────────────────────────────────────────────

function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
}

function PrimaryBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '5px 12px' : '7px 16px', borderRadius: 8, fontSize: sm ? 12 : 13, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

function GhostBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '4px 10px' : '6px 12px', borderRadius: 8, fontSize: sm ? 11.5 : 12.5, fontWeight: 600, color: C.textSoft, background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

const STATUS_META: Record<SettlStatus, { label: string; labelEn: string; color: string; bg: string }> = {
  'pending-calc':     { label: '待计算', labelEn: 'Pending Calc', color: C.muted, bg: 'rgba(193,198,215,0.18)' },
  calculated:         { label: '已计算', labelEn: 'Calculated', color: C.primary, bg: C.primaryLight },
  'pending-approval': { label: '待审批', labelEn: 'Pending Approval', color: C.amber, bg: C.amberBg },
  approved:           { label: '已审批', labelEn: 'Approved', color: C.green, bg: C.greenBg },
  paid:               { label: '已支付', labelEn: 'Paid', color: C.green, bg: C.greenBg },
  failed:             { label: '支付失败', labelEn: 'Payment Failed', color: C.red, bg: C.redBg },
}

function StatusBadge({ s }: { s: SettlStatus }) {
  const { lang } = useLang()
  const m = STATUS_META[s]
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color }} />{lang === 'en' ? m.labelEn : m.label}
  </span>
}

const DIFF_TYPE: Record<string, string> = { 'rate-diff': '费率差异', 'premium-diff': '保费差异', 'agent-mismatch': '代理人不匹配', 'not-found': '账单无此保单', match: '一致' }
const DIFF_TYPE_EN: Record<string, string> = { 'rate-diff': 'Rate Difference', 'premium-diff': 'Premium Difference', 'agent-mismatch': 'Agent Mismatch', 'not-found': 'Policy Not on Bill', match: 'Match' }
// Mock data 中的中文展示值 → 英文（枚举/逻辑值保持不变，仅渲染层映射）
const CHANNEL_TYPE_EN: Record<string, string> = { '代理机构': 'Agency', '经纪公司': 'Broker', 'MGA': 'MGA', 'FMO': 'FMO' }
const DETAIL_STATUS_EN: Record<string, string> = { '已结算': 'Settled', '已追回': 'Clawed Back' }
function chTypeEn(t: string) { return CHANNEL_TYPE_EN[t] ?? t }

const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, verticalAlign: 'middle', fontSize: 12.5 }

function fmt(n: number) {
  const abs = Math.abs(n)
  const s = abs >= 1e6 ? `$${(abs / 1e6).toFixed(2)}M` : `$${abs.toLocaleString()}`
  return n < 0 ? `-${s}` : s
}

// ─── Settlement List Tab ──────────────────────────────────────────────────────

function SettlementTab() {
  const { lang } = useLang()
  const [period, setPeriod] = useState('2026-08')
  const [selected, setSelected] = useState<Settlement | null>(settlements[0])
  const [calcRunning, setCalcRunning] = useState(false)

  const periodData = settlements.filter(s => s.period === period)
  const totalPayable = periodData.filter(s => ['approved','paid'].includes(s.status)).reduce((acc, s) => acc + s.total, 0)
  const pendingApproval = periodData.filter(s => s.status === 'pending-approval').length

  const runCalc = () => { setCalcRunning(true); setTimeout(() => setCalcRunning(false), 2200) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: lang === 'en' ? 'Commission Payable This Period' : '本期应付佣金', v: fmt(periodData.reduce((a, s) => a + s.total, 0)), color: C.primary },
          { label: lang === 'en' ? 'Pending Settlement Statements' : '待审批结算单', v: String(pendingApproval), color: C.amber },
          { label: lang === 'en' ? 'Approved · Awaiting Payment' : '已审批待支付', v: fmt(periodData.filter(s => s.status === 'approved').reduce((a, s) => a + s.total, 0)), color: C.green },
          { label: lang === 'en' ? 'Policies This Period' : '本期保单数', v: String(periodData.reduce((a, s) => a + s.policyCount, 0)), color: C.text },
        ].map(s => (
          <GCard key={s.label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{s.label}</div>
            <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: s.color }}>{s.v}</div>
          </GCard>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12.5, color: C.muted }}>{lang === 'en' ? 'Settlement Period' : '结算周期'}</span>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: C.text, outline: 'none', ...mono }}>
            {['2026-08','2026-07','2026-06','2026-05'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <PrimaryBtn onClick={runCalc} sm>
          {calcRunning ? <><Loader2 size={12} className="animate-spin" />{lang === 'en' ? 'Calculating…' : '计算中…'}</> : <><Zap size={12} />{lang === 'en' ? 'Trigger Commission Calculation' : '触发佣金计算'}</>}
        </PrimaryBtn>
        <GhostBtn sm><FileText size={12} />{lang === 'en' ? 'Generate Batch Statements' : '批量生成结算单'}</GhostBtn>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Export Batch' : '批量导出'}</GhostBtn>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <GCard style={{ flex: 1, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{(lang === 'en'
                ? ['Channel', 'Type', 'Base Commission', 'Override', 'Bonus', 'Clawback', 'Adjustment', 'Total', 'Status', 'Payment Method', '']
                : ['渠道', '类型', '基础佣金', 'Override', '奖金', '追回', '调整', '合计', '状态', '支付方式', '']
              ).map(h => <th key={h} style={TH}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {periodData.map(s => {
                const isSel = selected?.id === s.id
                return (
                  <tr key={s.id} onClick={() => setSelected(isSel ? null : s)} style={{ background: isSel ? C.primaryLight : 'transparent', cursor: 'pointer' }}>
                    <td style={TD}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{s.channel.split(' ').slice(0, 3).join(' ')}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{lang === 'en' ? chTypeEn(s.channelType) : s.channelType}</div>
                    </td>
                    <td style={{ ...TD, fontSize: 11.5, color: C.muted }}>{s.policyCount} {lang === 'en' ? (s.policyCount === 1 ? 'policy' : 'policies') : '保单'}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12, color: C.text }}>{fmt(s.baseComm)}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12, color: s.override > 0 ? C.amber : C.mutedLight }}>{s.override > 0 ? `+${fmt(s.override)}` : '—'}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12, color: s.bonus > 0 ? C.green : C.mutedLight }}>{s.bonus > 0 ? `+${fmt(s.bonus)}` : '—'}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12, color: s.chargeback < 0 ? C.red : C.mutedLight }}>{s.chargeback < 0 ? fmt(s.chargeback) : '—'}</td>
                    <td style={{ ...TD, ...mono, fontSize: 12, color: s.adjustment !== 0 ? (s.adjustment > 0 ? C.green : C.red) : C.mutedLight }}>{s.adjustment !== 0 ? (s.adjustment > 0 ? '+' : '') + fmt(s.adjustment) : '—'}</td>
                    <td style={{ ...TD, ...mono, fontSize: 14, fontWeight: 800, color: C.primary }}>{fmt(s.total)}</td>
                    <td style={TD}><StatusBadge s={s.status} /></td>
                    <td style={{ ...TD, ...mono, fontSize: 11, color: C.muted }}>{s.payMethod.toUpperCase()}</td>
                    <td style={TD}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {s.status === 'pending-approval' && <button onClick={e => { e.stopPropagation() }} style={{ background: C.primary, border: 'none', cursor: 'pointer', color: '#fff', padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{lang === 'en' ? 'Approve' : '审批'}</button>}
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Eye size={12} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: '3px 4px' }}><Download size={12} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </GCard>

        {/* Settlement detail */}
        {selected && (
          <GCard style={{ width: 300, flexShrink: 0, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{selected.channel.split(' ').slice(0, 2).join(' ')}</div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={14} /></button>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatusBadge s={selected.status} />
              <div style={{ ...mono, fontSize: 26, fontWeight: 800, color: C.primary }}>{fmt(selected.total)}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{selected.period} · {selected.policyCount} {lang === 'en' ? (selected.policyCount === 1 ? 'policy' : 'policies') : '保单'}</div>

              {/* Breakdown chart */}
              <div style={{ borderRadius: 9, padding: '10px 12px', background: C.bg, marginTop: 4 }}>
                {[
                  { label: lang === 'en' ? 'Base Commission' : '基础佣金', v: selected.baseComm, color: C.primary },
                  { label: 'Override', v: selected.override, color: C.amber },
                  { label: lang === 'en' ? 'Bonus' : '奖金', v: selected.bonus, color: C.green },
                  { label: lang === 'en' ? 'Cancellation Clawback' : '退保追回', v: selected.chargeback, color: C.red },
                  { label: lang === 'en' ? 'Manual Adjustment' : '人工调整', v: selected.adjustment, color: selected.adjustment >= 0 ? C.green : C.red },
                ].filter(r => r.v !== 0).map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ fontSize: 12, color: C.muted }}>{r.label}</span>
                    <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: r.color }}>{r.v > 0 ? '+' : ''}{fmt(r.v)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{lang === 'en' ? 'Total' : '合计'}</span>
                  <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.primary }}>{fmt(selected.total)}</span>
                </div>
              </div>

              {[
                [lang === 'en' ? 'Payment Method' : '支付方式', selected.payMethod.toUpperCase()],
                [lang === 'en' ? 'Bank Account (Last 4)' : '银行账户后4位', `****${selected.bankLast4}`],
                ...(selected.approvedBy ? [[lang === 'en' ? 'Approved By' : '审批人', selected.approvedBy]] : []),
                ...(selected.paidDate ? [[lang === 'en' ? 'Payment Date' : '支付日期', selected.paidDate]] : []),
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `0.5px solid ${C.border}` }}>
                  <span style={{ fontSize: 11.5, color: C.muted }}>{k}</span>
                  <span style={{ ...mono, fontSize: 12, fontWeight: 600, color: C.text }}>{v}</span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {selected.status === 'pending-approval' && <PrimaryBtn sm><Check size={12} />{lang === 'en' ? 'Approve' : '审批通过'}</PrimaryBtn>}
                {selected.status === 'approved' && <PrimaryBtn sm><Send size={12} />{lang === 'en' ? 'Initiate Payment' : '发起支付'}</PrimaryBtn>}
                <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Download Statement' : '下载结算单'}</GhostBtn>
              </div>
            </div>
          </GCard>
        )}
      </div>
    </div>
  )
}

// ─── Detail Tab ───────────────────────────────────────────────────────────────

function DetailTab() {
  const { lang } = useLang()
  const [search, setSearch] = useState('')
  const [typeF, setTypeF] = useState('all')

  const typeLabels: Record<string, string> = lang === 'en'
    ? { direct: 'Direct Commission', override: 'Override', renewal: 'Renewal Commission', bonus: 'Bonus', chargeback: 'Cancellation Clawback' }
    : { direct: '直接佣金', override: 'Override', renewal: '续期佣金', bonus: '奖金', chargeback: '退保追回' }
  const typeColors: Record<string, string> = { direct: C.primary, override: C.amber, renewal: C.green, bonus: C.purple, chargeback: C.red }

  const filtered = details.filter(d =>
    (typeF === 'all' || d.commType === typeF) &&
    (!search || d.policyNo.includes(search) || d.insured.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <GCard style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: C.bg }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === 'en' ? 'Search policy no. or insured…' : '搜索保单号或被保人…'} style={{ width: '100%', padding: '6px 10px 6px 27px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, color: C.text, outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', fontFamily: 'inherit' }}>
          <option value="all">{lang === 'en' ? 'All Types' : '全部类型'}</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.5)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.textSoft, outline: 'none', fontFamily: 'inherit' }}>
          {['2026-08','2026-07','2026-06'].map(p => <option key={p}>{p}</option>)}
        </select>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Export Details' : '导出明细'}</GhostBtn>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{(lang === 'en'
            ? ['Policy No.', 'Insured', 'Insurer / Product', 'Agent', 'Commission Type', 'Premium', 'Rate', 'Commission', 'Status']
            : ['保单号', '被保人', '保险公司 / 产品', '代理人', '佣金类型', '保费', '佣金率', '佣金金额', '状态']
          ).map(h => <th key={h} style={TH}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {filtered.map(d => (
            <tr key={d.id} style={{ background: d.commType === 'chargeback' ? C.redBg : 'transparent' }}>
              <td style={{ ...TD, ...mono, fontSize: 11.5, color: C.primary }}>{d.policyNo}</td>
              <td style={{ ...TD, fontSize: 12.5, fontWeight: 600, color: C.text }}>{d.insured}</td>
              <td style={TD}>
                <div style={{ fontSize: 12, color: C.textSoft }}>{d.insurer}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{d.product}</div>
              </td>
              <td style={{ ...TD, fontSize: 12, color: C.textSoft }}>{d.agent}</td>
              <td style={TD}><span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${typeColors[d.commType]}12`, color: typeColors[d.commType] }}>{typeLabels[d.commType]}</span></td>
              <td style={{ ...TD, ...mono, fontSize: 12 }}>${d.premium.toLocaleString()}</td>
              <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 700, color: C.textSoft }}>{(d.rate * 100).toFixed(1)}%</td>
              <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 800, color: d.amount < 0 ? C.red : C.green }}>
                {d.amount < 0 ? '' : '+'}{fmt(d.amount)}
              </td>
              <td style={TD}><span style={{ fontSize: 11.5, color: d.status === '已结算' ? C.green : C.amber }}>{lang === 'en' ? (DETAIL_STATUS_EN[d.status] ?? d.status) : d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '7px 14px', borderTop: `0.5px solid ${C.border}`, fontSize: 11.5, color: C.mutedLight }}>
        {lang === 'en'
          ? `Showing ${filtered.length} / ${details.length} commission records`
          : `显示 ${filtered.length} / ${details.length} 条佣金明细`}
      </div>
    </GCard>
  )
}

// ─── Reconcile Tab ────────────────────────────────────────────────────────────

function ReconcileTab() {
  const { lang } = useLang()
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(true)

  const diffRows = reconcileRows.filter(r => r.diffType !== 'match')
  const totalDiff = diffRows.reduce((a, r) => a + Math.abs(r.diff), 0)

  const diffTypeColor: Record<string, string> = { 'rate-diff': C.amber, 'premium-diff': C.primary, 'agent-mismatch': C.red, 'not-found': C.red }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <GCard style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{lang === 'en' ? 'Insurer Bill Reconciliation' : '保险公司账单对账'}</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>Pacific Mutual · 2026-08</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostBtn sm><Upload size={12} />{lang === 'en' ? 'Upload Bill File' : '上传账单文件'}</GhostBtn>
            <PrimaryBtn sm onClick={() => { setRunning(true); setTimeout(() => { setRunning(false) }, 2000) }}>
              {running ? <><Loader2 size={12} className="animate-spin" />{lang === 'en' ? 'Reconciling…' : '对账中…'}</> : <><Zap size={12} />{lang === 'en' ? 'Start Reconciliation' : '发起对账'}</>}
            </PrimaryBtn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { label: lang === 'en' ? 'Policies Reconciled' : '对账保单数', v: reconcileRows.length, color: C.text },
            { label: lang === 'en' ? 'Matched' : '一致', v: reconcileRows.filter(r => r.diffType === 'match').length, color: C.green },
            { label: lang === 'en' ? 'Differences' : '差异', v: diffRows.filter(r => !r.resolved).length, color: C.red },
            { label: lang === 'en' ? 'Difference Amount' : '差异金额', v: `$${totalDiff.toFixed(2)}`, color: C.amber },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' as const, padding: '10px', borderRadius: 9, background: C.bg }}>
              <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </GCard>

      <GCard style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{(lang === 'en'
              ? ['Policy No.', 'Insurer', 'System Calc', 'Bill Amount', 'Difference', 'Diff Type', 'Resolution Status', 'Actions']
              : ['保单号', '保险公司', '系统计算', '账单金额', '差异', '差异类型', '处理状态', '操作']
            ).map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {reconcileRows.map(r => (
              <tr key={r.id} style={{ background: r.diffType !== 'match' && !r.resolved ? C.redBg : 'transparent' }}>
                <td style={{ ...TD, ...mono, fontSize: 11.5 }}>{r.policyNo}</td>
                <td style={{ ...TD, fontSize: 12 }}>{r.insurer}</td>
                <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 700 }}>${r.ourCalc.toFixed(2)}</td>
                <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 700 }}>${r.insurerBill.toFixed(2)}</td>
                <td style={{ ...TD, ...mono, fontSize: 12, fontWeight: 800, color: r.diff > 0 ? C.amber : r.diff < 0 ? C.red : C.green }}>
                  {r.diff === 0 ? '—' : (r.diff > 0 ? '+' : '') + `$${r.diff.toFixed(2)}`}
                </td>
                <td style={TD}>
                  {r.diffType === 'match'
                    ? <span style={{ fontSize: 11, color: C.green, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle2 size={11} />{lang === 'en' ? 'Match' : '一致'}</span>
                    : <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: `${diffTypeColor[r.diffType]}12`, color: diffTypeColor[r.diffType] }}>{lang === 'en' ? DIFF_TYPE_EN[r.diffType] : DIFF_TYPE[r.diffType]}</span>
                  }
                </td>
                <td style={TD}>
                  {r.resolved ? <span style={{ fontSize: 11, color: C.green }}>{lang === 'en' ? 'Resolved' : '已解决'}</span> : r.diffType !== 'match' ? <span style={{ fontSize: 11, color: C.amber }}>{lang === 'en' ? 'Pending' : '待处理'}</span> : null}
                </td>
                <td style={TD}>
                  {r.diffType !== 'match' && !r.resolved && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ background: C.greenBg, border: `0.5px solid ${C.greenBorder}`, cursor: 'pointer', color: C.green, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{lang === 'en' ? 'Confirm' : '确认'}</button>
                      <button style={{ background: C.redBg, border: `0.5px solid ${C.redBorder}`, cursor: 'pointer', color: C.red, padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{lang === 'en' ? 'Dispute' : '申诉'}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function CommissionSettlementView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'settlement' | 'detail' | 'reconcile'>('settlement')
  const title = lang === 'en' ? 'Commission Calculation & Settlement' : '佣金计算与结算'
  const tabs = [
    { id: 'settlement' as const, label: lang === 'en' ? 'Settlement Statements' : '结算单管理', badge: settlements.filter(s => s.status === 'pending-approval').length },
    { id: 'detail' as const, label: lang === 'en' ? 'Commission Details' : '佣金明细查询' },
    { id: 'reconcile' as const, label: lang === 'en' ? 'Reconciliation' : '账单对账' },
  ]

  return (
    <div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} .animate-spin{animation:spin 1s linear infinite} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'Automated commission calculation, settlement approval, payment processing and reconciliation' : '自动化佣金计算、结算审批、支付处理和账单对账'}</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}{(t as any).badge > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px' }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'settlement' && <SettlementTab />}
      {tab === 'detail' && <DetailTab />}
      {tab === 'reconcile' && <ReconcileTab />}
    </div>
  )
}
