import { useState } from 'react'
import {
  LayoutDashboard, Bell, FileText, DollarSign, HelpCircle,
  CheckCircle2, Clock, AlertTriangle, ChevronRight, Download,
  ExternalLink, User, MessageSquare, BookOpen, TrendingUp,
  Inbox, Star, PenSquare,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)', greenBorder: 'rgba(52,199,89,0.25)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)', redBorder: 'rgba(255,59,48,0.22)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }
function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const announcements = [
  { id: 1, title: '2026 Q3 佣金方案已更新', date: '2026-08-28', type: 'important', read: false },
  { id: 2, title: '汽车险费率调整通知 — 加州地区', date: '2026-08-25', type: 'notice', read: false },
  { id: 3, title: '9月在线培训课程安排', date: '2026-08-20', type: 'training', read: true },
  { id: 4, title: '系统维护公告 — 2026-09-01 00:00-06:00', date: '2026-08-18', type: 'system', read: true },
  { id: 5, title: '新产品上线 — 商业财产险 E&O 附加条款', date: '2026-08-10', type: 'product', read: true },
]

const pendingItems = [
  { id: 1, type: '证书续期', detail: '汽车险核保认证 U-2 将于 2026-01-19 到期', urgency: 'high', action: '立即续期' },
  { id: 2, type: '培训必修', detail: 'AML 反洗钱 2026 年度培训尚未完成', urgency: 'high', action: '开始学习' },
  { id: 3, type: '合同签署', detail: '2026 年度代理协议补充条款待签署', urgency: 'medium', action: '查看签署' },
  { id: 4, type: '信息完善', detail: '联系方式未更新，请确认最新邮箱', urgency: 'low', action: '更新信息' },
]

const commHistory = [
  { id: 1, period: '2026 Q2', base: 42600, bonus: 8400, total: 51000, status: 'paid', paidDate: '2026-07-28' },
  { id: 2, period: '2026 Q1', base: 38900, bonus: 5200, total: 44100, status: 'paid', paidDate: '2026-04-25' },
  { id: 3, period: '2025 Q4', base: 35400, bonus: 9800, total: 45200, status: 'paid', paidDate: '2026-01-20' },
  { id: 4, period: '2025 Q3', base: 31200, bonus: 4600, total: 35800, status: 'paid', paidDate: '2025-10-22' },
]

const resources = [
  { id: 1, name: '财产险产品手册 2026版', type: 'PDF', size: '4.2 MB', updated: '2026-08-01', category: '产品资料' },
  { id: 2, name: 'AUTO 险费率表 — 加州', type: 'XLSX', size: '1.1 MB', updated: '2026-07-15', category: '费率表' },
  { id: 3, name: '代理人合规操作手册', type: 'PDF', size: '2.8 MB', updated: '2026-06-01', category: '合规' },
  { id: 4, name: '客户承保申请表 (可填写)', type: 'PDF', size: '340 KB', updated: '2026-05-20', category: '表单' },
  { id: 5, name: 'E&O 报价辅助工具', type: 'XLSX', size: '890 KB', updated: '2026-04-10', category: '工具' },
]

const tickets = [
  { id: 'TK-2026-0881', subject: '保单 #PL-98234 佣金差异核查', status: 'open', priority: 'high', created: '2026-08-29', lastReply: '2026-08-30' },
  { id: 'TK-2026-0754', subject: '出单权限申请 — 商业险', status: 'pending', priority: 'medium', created: '2026-08-20', lastReply: '2026-08-22' },
  { id: 'TK-2026-0612', subject: '证书更新材料提交', status: 'resolved', priority: 'low', created: '2026-08-05', lastReply: '2026-08-12' },
]

// ─── Dashboard Tab ─────────────────────────────────────────────────────────────

function PortalDashboard() {
  const urgMeta: Record<string, { color: string; bg: string }> = {
    high: { color: C.red, bg: C.redBg },
    medium: { color: C.amber, bg: C.amberBg },
    low: { color: C.primary, bg: C.primaryLight },
  }
  const anncTypeMeta: Record<string, { color: string; label: string }> = {
    important: { color: C.red, label: '重要' },
    notice: { color: C.amber, label: '通知' },
    training: { color: C.purple, label: '培训' },
    system: { color: C.muted, label: '系统' },
    product: { color: C.primary, label: '产品' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* My snapshot */}
      <GCard style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(0,88,188,0.08) 0%, rgba(96,205,255,0.04) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, color: C.mutedLight, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>代理人门户</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginTop: 4 }}>好的，Jennifer Watson 👋</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>Pacific Coast Agency · 执照 CA-INS-2023-7721 · 2027-03-13 到期</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 11, color: C.mutedLight }}>今日</div>
            <div style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.text }}>2026-08-31</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'YTD保费', v: '$1.82M', sub: '目标达成 114%', color: C.green },
            { label: 'YTD佣金', v: '$218.4K', sub: 'Q3累计到账', color: C.primary },
            { label: '续保率', v: '91%', sub: '超目标 3pp', color: C.green },
            { label: '综合评级', v: 'A', sub: '全平台排名 #1', color: C.primary },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `0.5px solid rgba(193,198,215,0.25)` }}>
              <div style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
              <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.v}</div>
              <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 3 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      </GCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        {/* Left: pending + announcements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Pending actions */}
          <GCard style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color={C.amber} />
              <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>待处理事项</span>
              <span style={{ marginLeft: 4, background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 6px' }}>{pendingItems.filter(p => p.urgency === 'high').length}</span>
            </div>
            {pendingItems.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: urgMeta[p.urgency].bg }}>
                  {p.urgency === 'high' ? <AlertTriangle size={15} color={urgMeta[p.urgency].color} /> : <Clock size={15} color={urgMeta[p.urgency].color} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{p.type}</div>
                  <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{p.detail}</div>
                </div>
                <button style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, background: urgMeta[p.urgency].bg, color: urgMeta[p.urgency].color, border: `0.5px solid ${urgMeta[p.urgency].color}30`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {p.action}
                </button>
              </div>
            ))}
          </GCard>

          {/* Announcements */}
          <GCard style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={14} color={C.primary} />
              <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>公告与通知</span>
            </div>
            {announcements.map(a => {
              const m = anncTypeMeta[a.type]
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: !a.read ? 'rgba(0,88,188,0.03)' : 'transparent' }}>
                  {!a.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary, flexShrink: 0 }} />}
                  {a.read && <div style={{ width: 6, height: 6, flexShrink: 0 }} />}
                  <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 5, fontWeight: 700, background: `${m.color}12`, color: m.color, flexShrink: 0 }}>{m.label}</span>
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: a.read ? 500 : 700, color: C.text }}>{a.title}</span>
                  <span style={{ ...mono, fontSize: 11, color: C.mutedLight, flexShrink: 0 }}>{a.date}</span>
                  <ChevronRight size={12} color={C.border} />
                </div>
              )
            })}
          </GCard>
        </div>

        {/* Right: comm latest + quick links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GCard style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={14} color={C.green} />
              <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>最近佣金到账</span>
            </div>
            {commHistory.slice(0, 3).map(c => (
              <div key={c.id} style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{c.period}</span>
                  <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: C.green }}>${c.total.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11.5, color: C.muted }}>
                  <span>到账 {c.paidDate}</span>
                  <span>基础 ${c.base.toLocaleString()} + 奖金 ${c.bonus.toLocaleString()}</span>
                </div>
              </div>
            ))}
            <div style={{ padding: '10px 14px', textAlign: 'center' as const }}>
              <button style={{ fontSize: 12, color: C.primary, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>查看全部记录 →</button>
            </div>
          </GCard>

          <GCard style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 12 }}>快速入口</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { icon: <FileText size={14} color={C.primary} />, label: '在线出单', sub: '快速承保申请' },
                { icon: <BookOpen size={14} color={C.purple} />, label: '培训课程', sub: '继续学习' },
                { icon: <MessageSquare size={14} color={C.amber} />, label: '提交工单', sub: '业务支持' },
                { icon: <Download size={14} color={C.green} />, label: '资料下载', sub: '产品手册 & 表单' },
              ].map(q => (
                <button key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, cursor: 'pointer', textAlign: 'left' as const }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{q.icon}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{q.label}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{q.sub}</div>
                  </div>
                  <ChevronRight size={12} color={C.mutedLight} style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          </GCard>
        </div>
      </div>
    </div>
  )
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

function ResourcesTab() {
  const typeMeta: Record<string, { color: string }> = {
    PDF: { color: '#C0392B' }, XLSX: { color: '#1A7A2E' }, DOCX: { color: '#0058BC' },
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, color: C.text }}>资料与工具下载</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['文件名称', '分类', '格式', '大小', '更新日期', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}` }}>{h}</th>)}</tr></thead>
          <tbody>
            {resources.map(r => {
              const tc = (typeMeta[r.type] ?? { color: C.muted }).color
              return (
                <tr key={r.id}>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${tc}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={13} color={tc} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted }}>{r.category}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ ...mono, fontSize: 11, fontWeight: 800, padding: '2px 6px', borderRadius: 5, background: `${tc}12`, color: tc }}>{r.type}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 12, color: C.muted }}>{r.size}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 12, color: C.muted }}>{r.updated}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer' }}>
                      <Download size={11} />下载
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Support Tab ──────────────────────────────────────────────────────────────

function SupportTab() {
  const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: '处理中', color: C.primary, bg: C.primaryLight },
    pending: { label: '等待回复', color: C.amber, bg: C.amberBg },
    resolved: { label: '已解决', color: C.green, bg: C.greenBg },
  }
  const priorityMeta: Record<string, { label: string; color: string }> = {
    high: { label: '高', color: C.red },
    medium: { label: '中', color: C.amber },
    low: { label: '低', color: C.muted },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>
          <PenSquare size={13} />提交新工单
        </button>
      </div>
      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, color: C.text }}>我的工单</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['工单号', '主题', '优先级', '状态', '提交时间', '最新回复', ''].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>
            {tickets.map(t => {
              const sm = statusMeta[t.status]
              const pm = priorityMeta[t.priority]
              return (
                <tr key={t.id}>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 11.5, color: C.muted }}>{t.id}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 12.5, color: C.text }}>{t.subject}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: pm.color }}>{pm.label}优先级</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, fontWeight: 700, background: sm.bg, color: sm.color }}>{sm.label}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 12, color: C.muted }}>{t.created}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 12, color: C.muted }}>{t.lastReply}</td>
                  <td style={{ padding: '10px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                    <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer' }}>
                      查看 <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function ChannelPortalView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'dashboard' | 'resources' | 'support'>('dashboard')
  const title = lang === 'en' ? 'Channel Agent Portal' : '渠道门户 Portal'
  const tabs = [
    { id: 'dashboard' as const, label: lang === 'en' ? 'My Dashboard' : '我的工作台', icon: <LayoutDashboard size={13} />, badge: pendingItems.filter(p => p.urgency === 'high').length },
    { id: 'resources' as const, label: lang === 'en' ? 'Resources & Downloads' : '资料与工具', icon: <BookOpen size={13} /> },
    { id: 'support' as const, label: lang === 'en' ? 'Support Tickets' : '支持工单', icon: <MessageSquare size={13} />, badge: tickets.filter(t => t.status !== 'resolved').length },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'Agent self-service portal: performance snapshot, announcements, downloads, and support' : '代理人自助服务平台：业绩快览、公告通知、资料下载与业务支持'}</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.icon}{t.label}
            {(t as any).badge > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px' }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <PortalDashboard />}
      {tab === 'resources' && <ResourcesTab />}
      {tab === 'support' && <SupportTab />}
    </div>
  )
}
