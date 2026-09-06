import { useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, Trophy, Target,
  Star, ChevronRight, ArrowUp, ArrowDown, Minus,
  AlertTriangle, BarChart3, Download, Filter,
  Eye, Settings2, Calendar, Award, Zap, Percent,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)', greenBorder: 'rgba(52,199,89,0.25)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)', redBorder: 'rgba(255,59,48,0.22)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2', purpleBg: 'rgba(123,63,202,0.09)',
  gold: '#B8860B',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
  bg: 'rgba(249,249,255,0.45)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }

function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
}

function GhostBtn({ children, onClick, sm }: { children: React.ReactNode; onClick?: () => void; sm?: boolean }) {
  return <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: sm ? '4px 10px' : '6px 12px', borderRadius: 8, fontSize: sm ? 11.5 : 12.5, fontWeight: 600, color: C.textSoft, background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>{children}</button>
}

const TH: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '10px 12px', borderBottom: `0.5px solid ${C.border}`, verticalAlign: 'middle' }

function fmt(n: number) { return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}` }

// ─── Mock data ────────────────────────────────────────────────────────────────

const agents = [
  { id: 1, name: 'Jennifer Walsh', org: 'Pacific Coast Agency', ytdPremium: 1820000, policyCount: 94, lossRatio: 0.58, renewalRate: 0.91, rank: 1, prevRank: 2, score: 94, grade: 'A', riskScore: 12, changeRisk: 'low' as const, line: 'AUTO', goal: 1600000, commission: 218400 },
  { id: 2, name: 'Michael Torres', org: 'Pacific Coast Agency', ytdPremium: 1560000, policyCount: 78, lossRatio: 0.61, renewalRate: 0.88, rank: 2, prevRank: 1, score: 88, grade: 'A', riskScore: 18, changeRisk: 'low' as const, line: 'AUTO', goal: 1500000, commission: 187200 },
  { id: 3, name: 'Amy Park', org: 'SunState MGA Partners', ytdPremium: 2340000, policyCount: 62, lossRatio: 0.64, renewalRate: 0.86, rank: 3, prevRank: 4, score: 85, grade: 'A', riskScore: 22, changeRisk: 'low' as const, line: 'HOME', goal: 2000000, commission: 351000 },
  { id: 4, name: 'Lisa Wong', org: 'CalFirst Agents Network', ytdPremium: 980000, policyCount: 48, lossRatio: 0.66, renewalRate: 0.84, rank: 4, prevRank: 3, score: 76, grade: 'B', riskScore: 35, changeRisk: 'medium' as const, line: 'LIFE', goal: 1200000, commission: 489000 },
  { id: 5, name: 'David Martinez', org: 'Mountain West FMO', ytdPremium: 760000, policyCount: 211, lossRatio: 0.71, renewalRate: 0.79, rank: 5, prevRank: 6, score: 68, grade: 'B', riskScore: 51, changeRisk: 'medium' as const, line: 'HEALTH', goal: 900000, commission: 60800 },
  { id: 6, name: 'Sarah Johnson', org: 'Northeast Brokers', ytdPremium: 480000, policyCount: 31, lossRatio: 0.73, renewalRate: 0.74, rank: 6, prevRank: 5, score: 59, grade: 'C', riskScore: 68, changeRisk: 'high' as const, line: 'COMMERCIAL', goal: 800000, commission: 48000 },
  { id: 7, name: 'Robert Kim', org: 'Pacific Coast Agency', ytdPremium: 320000, policyCount: 24, lossRatio: 0.77, renewalRate: 0.70, rank: 7, prevRank: 9, score: 52, grade: 'C', riskScore: 74, changeRisk: 'high' as const, line: 'AUTO', goal: 600000, commission: 38400 },
]

const monthlyData = [
  { month: 'Jan', premium: 820, policies: 42 },
  { month: 'Feb', premium: 920, policies: 48 },
  { month: 'Mar', premium: 1100, policies: 56 },
  { month: 'Apr', premium: 980, policies: 51 },
  { month: 'May', premium: 1240, policies: 64 },
  { month: 'Jun', premium: 1380, policies: 71 },
  { month: 'Jul', premium: 1520, policies: 78 },
  { month: 'Aug', premium: 1820, policies: 94 },
]

const kpiScheme = {
  name: '2026年度标准考核方案',
  period: '2026 Q3',
  indicators: [
    { name: 'YTD保费', nameEn: 'YTD Premium', weight: 0.35, unit: '$', direction: 'higher', target: 1500000, current: 1820000 },
    { name: '续保率', nameEn: 'Renewal Rate', weight: 0.25, unit: '%', direction: 'higher', target: 88, current: 91 },
    { name: '赔付率', nameEn: 'Loss Ratio', weight: 0.20, unit: '%', direction: 'lower', target: 65, current: 58 },
    { name: '保单件数', nameEn: 'Policy Count', weight: 0.12, unit: '件', direction: 'higher', target: 80, current: 94 },
    { name: '投诉率', nameEn: 'Complaint Rate', weight: 0.08, unit: '%', direction: 'lower', target: 2, current: 0.5 },
  ],
}

const leaderboardLines = [
  { line: 'AUTO', top: [{ name: 'Jennifer Walsh', v: '$1.82M', rank: 1 }, { name: 'Mike Torres', v: '$1.56M', rank: 2 }, { name: 'Robert Kim', v: '$320K', rank: 3 }] },
  { line: 'HOME', top: [{ name: 'Amy Park', v: '$2.34M', rank: 1 }, { name: 'Carol Lee', v: '$1.12M', rank: 2 }, { name: 'James Chen', v: '$890K', rank: 3 }] },
  { line: 'LIFE', top: [{ name: 'Lisa Wong', v: '$980K', rank: 1 }, { name: 'Tom Davis', v: '$760K', rank: 2 }, { name: 'Nina Patel', v: '$540K', rank: 3 }] },
]

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab() {
  const { lang } = useLang()
  const [period, setPeriod] = useState('Q3 2026')
  const [dim, setDim] = useState<'premium' | 'policies' | 'renewal' | 'commission'>('premium')
  const [scope, setScope] = useState('all')

  const rankIcon = (rank: number, prev: number) => {
    if (rank < prev) return <ArrowUp size={11} color={C.green} />
    if (rank > prev) return <ArrowDown size={11} color={C.red} />
    return <Minus size={11} color={C.mutedLight} />
  }

  const gradeColor: Record<string, string> = { A: C.green, B: C.primary, C: C.amber, D: C.red }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.6)', border: `0.5px solid ${C.border}`, borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: C.text, outline: 'none', ...mono }}>
          {['Q3 2026','Q2 2026','Q1 2026','FY 2025'].map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {([['premium','保费','Premium'],['policies','保单数','Policies'],['renewal','续保率','Renewal'],['commission','佣金','Commission']] as const).map(([v, zh, en]) => (
            <button key={v} onClick={() => setDim(v)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: dim === v ? 700 : 500, background: dim === v ? C.primary : 'transparent', color: dim === v ? '#fff' : C.textSoft, border: 'none', cursor: 'pointer', borderRight: `0.5px solid ${C.border}` }}>{lang === 'en' ? en : zh}</button>
          ))}
        </div>
        <GhostBtn sm><Download size={12} />{lang === 'en' ? 'Export Leaderboard' : '导出榜单'}</GhostBtn>
      </div>

      {/* Line leaderboards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {leaderboardLines.map(ll => (
          <GCard key={ll.line} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...mono, fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 5, background: C.primaryLight, color: C.primary }}>{ll.line}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{lang === 'en' ? 'Line of Business Leaderboard' : '业务线榜单'}</span>
            </div>
            {ll.top.map((a, i) => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, background: i === 0 ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: i === 0 ? 'rgba(184,134,11,0.15)' : i === 1 ? 'rgba(150,150,150,0.12)' : 'rgba(184,115,51,0.1)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? C.gold : i === 1 ? '#888' : '#B87333' }}>{a.rank}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{a.name}</div>
                </div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 800, color: i === 0 ? C.gold : C.primary }}>{a.v}</div>
              </div>
            ))}
          </GCard>
        ))}
      </div>

      {/* Full ranking table */}
      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Trophy size={14} color={C.primary} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{lang === 'en' ? `Platform-Wide Agent Rankings — ${period}` : `全平台代理人排名 — ${period}`}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{(lang === 'en'
              ? ['Rank', 'Agent', 'Organization', 'Line of Business', 'YTD Premium', 'Policies', 'Renewal Rate', 'Loss Ratio', 'Overall Rating', 'Risk']
              : ['排名', '代理人', '机构', '业务线', 'YTD保费', '保单数', '续保率', '赔付率', '综合评级', '风险']
            ).map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {agents.map((a, i) => (
              <tr key={a.id} style={{ background: i === 0 ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                <td style={TD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ ...mono, fontSize: 14, fontWeight: 800, color: i < 3 ? [C.gold,'#888','#B87333'][i] : C.text }}>{a.rank}</span>
                    {rankIcon(a.rank, a.prevRank)}
                  </div>
                </td>
                <td style={TD}><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.name}</div></td>
                <td style={{ ...TD, fontSize: 12, color: C.muted }}>{a.org.split(' ').slice(0, 2).join(' ')}</td>
                <td style={TD}><span style={{ ...mono, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: C.primaryLight, color: C.primary }}>{a.line}</span></td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 800, color: C.primary }}>{fmt(a.ytdPremium)}</td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 700 }}>{a.policyCount}</td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 700, color: a.renewalRate >= 0.90 ? C.green : a.renewalRate >= 0.85 ? C.amber : C.red }}>{(a.renewalRate * 100).toFixed(0)}%</td>
                <td style={{ ...TD, ...mono, fontSize: 13, fontWeight: 700, color: a.lossRatio > 0.70 ? C.red : a.lossRatio > 0.65 ? C.amber : C.green }}>{(a.lossRatio * 100).toFixed(0)}%</td>
                <td style={TD}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, fontWeight: 800, fontSize: 13, background: `${gradeColor[a.grade]}15`, color: gradeColor[a.grade], border: `1.5px solid ${gradeColor[a.grade]}30` }}>{a.grade}</div>
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 48, height: 5, background: 'rgba(193,198,215,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${a.riskScore}%`, height: '100%', background: a.changeRisk === 'high' ? C.red : a.changeRisk === 'medium' ? C.amber : C.green, borderRadius: 3 }} />
                    </div>
                    <span style={{ ...mono, fontSize: 11, color: a.changeRisk === 'high' ? C.red : a.changeRisk === 'medium' ? C.amber : C.green, fontWeight: 700 }}>{a.riskScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Personal Dashboard ───────────────────────────────────────────────────────

function PersonalDashboard() {
  const { lang } = useLang()
  const agent = agents[0]
  const maxPremium = 2000000
  const progressPct = agent.ytdPremium / agent.goal

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Agent selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>{lang === 'en' ? 'Currently viewing' : '当前查看'}</span>
        <select defaultValue={agent.id} style={{ padding: '7px 12px', background: C.surfaceHigh, border: `0.5px solid ${C.border}`, borderRadius: 9, fontSize: 13, fontWeight: 700, color: C.text, outline: 'none', fontFamily: 'inherit' }}>
          {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {([['本月','Month'],['本季','Quarter'],['本年','Year'],['自定义','Custom']] as const).map(([zh, en]) => (
            <button key={zh} style={{ padding: '5px 12px', fontSize: 12, fontWeight: zh === '本季' ? 700 : 500, background: zh === '本季' ? C.primary : 'transparent', color: zh === '本季' ? '#fff' : C.textSoft, border: 'none', cursor: 'pointer' }}>{lang === 'en' ? en : zh}</button>
          ))}
        </div>
      </div>

      {/* Hero card */}
      <GCard style={{ padding: '20px 24px', background: `linear-gradient(135deg, rgba(0,88,188,0.08) 0%, rgba(96,205,255,0.05) 100%)` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #0058BC, #60CDFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
              {agent.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{agent.name}</div>
              <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3 }}>{agent.org} · {agent.line} · {lang === 'en' ? 'Overall Rating' : '综合评级'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${C.green}15`, border: `2px solid ${C.green}30`, fontSize: 22, fontWeight: 800, color: C.green }}>
              {agent.grade}
            </div>
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ ...mono, fontSize: 28, fontWeight: 800, color: C.text }}>#{agent.rank}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: agent.rank < agent.prevRank ? C.green : C.red }}>
                {agent.rank < agent.prevRank ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {Math.abs(agent.rank - agent.prevRank)} {lang === 'en' ? (Math.abs(agent.rank - agent.prevRank) === 1 ? 'position' : 'positions') : '位'}
              </div>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: lang === 'en' ? 'YTD Premium' : 'YTD保费', value: fmt(agent.ytdPremium), color: C.primary, sub: lang === 'en' ? `Goal ${fmt(agent.goal)}` : `目标 ${fmt(agent.goal)}` },
            { label: lang === 'en' ? 'YTD Commission' : 'YTD佣金', value: fmt(agent.commission), color: C.green, sub: lang === 'en' ? `${(agent.commission / agent.ytdPremium * 100).toFixed(1)}% commission rate` : `${(agent.commission / agent.ytdPremium * 100).toFixed(1)}% 佣金率` },
            { label: lang === 'en' ? 'Renewal Rate' : '续保率', value: `${(agent.renewalRate * 100).toFixed(0)}%`, color: agent.renewalRate >= 0.9 ? C.green : C.amber, sub: lang === 'en' ? 'Goal 88%' : '目标 88%' },
            { label: lang === 'en' ? 'Loss Ratio' : '赔付率', value: `${(agent.lossRatio * 100).toFixed(0)}%`, color: agent.lossRatio > 0.65 ? C.amber : C.green, sub: lang === 'en' ? 'Goal <65%' : '目标 <65%' },
            { label: lang === 'en' ? 'Policies' : '保单件数', value: String(agent.policyCount), color: C.text, sub: lang === 'en' ? 'Goal 80 policies' : '目标 80件' },
            { label: lang === 'en' ? 'Overall Score' : '综合评分', value: String(agent.score), color: C.primary, sub: lang === 'en' ? 'Out of 100' : '满分100分' },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px 14px', borderRadius: 11, background: 'rgba(255,255,255,0.45)', border: `0.5px solid rgba(193,198,215,0.3)` }}>
              <div style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{k.label}</div>
              <div style={{ ...mono, fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: C.mutedLight, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Goal progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ fontWeight: 700, color: C.text }}>{lang === 'en' ? 'Goal Progress' : '目标完成进度'}</span>
            <span style={{ ...mono, fontWeight: 800, color: progressPct >= 1 ? C.green : C.primary }}>{(progressPct * 100).toFixed(0)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(193,198,215,0.3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, progressPct * 100)}%`, height: '100%', background: progressPct >= 1 ? C.green : `linear-gradient(90deg, ${C.primary}, #60CDFF)`, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.mutedLight, marginTop: 4 }}>
            <span>{lang === 'en' ? `Achieved ${fmt(agent.ytdPremium)}` : `已完成 ${fmt(agent.ytdPremium)}`}</span>
            <span>{lang === 'en' ? `Goal ${fmt(agent.goal)}` : `目标 ${fmt(agent.goal)}`}</span>
          </div>
        </div>
      </GCard>

      {/* Trend chart (sparkline bars) + KPI score breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>
        <GCard style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>{lang === 'en' ? 'Monthly Performance Trend' : '月度业绩趋势'}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 120 }}>
            {monthlyData.map((m) => {
              const h = Math.round((m.premium / 2000) * 100)
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.primary, fontWeight: 700 }}>${m.premium}K</div>
                  <div style={{ width: '100%', background: m.month === 'Aug' ? C.primary : `${C.primary}55`, borderRadius: '4px 4px 0 0', height: `${h}%`, transition: 'height 0.3s', minHeight: 6 }} />
                  <div style={{ fontSize: 9.5, color: C.mutedLight }}>{m.month}</div>
                </div>
              )
            })}
          </div>
        </GCard>

        <GCard style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>{lang === 'en' ? 'KPI Score Breakdown' : '考核指标评分明细'}</div>
          {kpiScheme.indicators.map(ind => {
            const isGood = ind.direction === 'higher' ? ind.current >= ind.target : ind.current <= ind.target
            const pct = ind.direction === 'higher' ? Math.min(1, ind.current / ind.target) : Math.min(1, ind.target / ind.current)
            return (
              <div key={ind.name} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{lang === 'en' ? ind.nameEn : ind.name}</span>
                  <span style={{ color: C.muted }}>{lang === 'en' ? `Weight ${(ind.weight * 100).toFixed(0)}%` : `权重 ${(ind.weight * 100).toFixed(0)}%`}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 5, background: 'rgba(193,198,215,0.25)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: isGood ? C.green : C.amber, borderRadius: 3 }} />
                  </div>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 800, color: isGood ? C.green : C.amber, minWidth: 40, textAlign: 'right' as const }}>
                    {ind.unit === '%' ? `${ind.current}%` : ind.unit === '$' ? fmt(ind.current) : ind.current}
                  </span>
                </div>
              </div>
            )
          })}
        </GCard>
      </div>
    </div>
  )
}

// ─── Risk Watch Tab ───────────────────────────────────────────────────────────

function RiskWatchTab() {
  const { lang } = useLang()
  const highRisk = agents.filter(a => a.changeRisk === 'high')
  const medRisk = agents.filter(a => a.changeRisk === 'medium')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: lang === 'en' ? 'High Attrition Risk' : '高流失风险', v: highRisk.length, color: C.red, icon: <AlertTriangle size={15} color={C.red} /> },
          { label: lang === 'en' ? 'Medium Risk' : '中等风险', v: medRisk.length, color: C.amber, icon: <AlertTriangle size={15} color={C.amber} /> },
          { label: lang === 'en' ? 'Low Risk' : '低风险', v: agents.filter(a => a.changeRisk === 'low').length, color: C.green, icon: <Trophy size={15} color={C.green} /> },
        ].map(s => (
          <GCard key={s.label} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
            <div>
              <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: s.color }}>{s.v}</div>
              <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>{s.label}</div>
            </div>
          </GCard>
        ))}
      </div>

      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, color: C.text }}>{lang === 'en' ? 'Attrition Risk Watchlist' : '流失风险预警列表'}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{(lang === 'en'
            ? ['Agent', 'Organization', 'Risk Score', 'Risk Level', 'Key Risk Factors', 'Performance Trend', 'Actions']
            : ['代理人', '机构', '风险评分', '风险等级', '主要风险因素', '业绩趋势', '操作']
          ).map((h, i) => <th key={i} style={TH}>{h}</th>)}</tr></thead>
          <tbody>
            {agents.filter(a => a.changeRisk !== 'low').map(a => {
              const riskColor = a.changeRisk === 'high' ? C.red : C.amber
              const factors: Record<string, { zh: string; en: string }[]> = {
                'Sarah Johnson': [{ zh: '业绩连续3月下滑', en: 'Performance down 3 months in a row' }, { zh: '活跃度降低', en: 'Decreasing activity' }, { zh: '赔付率偏高', en: 'Loss ratio above target' }],
                'Robert Kim': [{ zh: '续保率持续下降', en: 'Renewal rate keeps declining' }, { zh: '牌照即将到期', en: 'License expiring soon' }, { zh: '3个月无新保单', en: 'No new policies for 3 months' }],
                'Lisa Wong': [{ zh: '业绩未达目标', en: 'Performance below target' }, { zh: '成交率下降', en: 'Closing rate declining' }],
                'David Martinez': [{ zh: '投诉率上升', en: 'Complaint rate rising' }, { zh: '赔付率偏高', en: 'Loss ratio above target' }],
              }
              return (
                <tr key={a.id} style={{ background: a.changeRisk === 'high' ? 'rgba(255,59,48,0.03)' : 'transparent' }}>
                  <td style={TD}><div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{a.name}</div></td>
                  <td style={{ ...TD, fontSize: 12, color: C.muted }}>{a.org.split(' ').slice(0, 2).join(' ')}</td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 60, height: 5, background: 'rgba(193,198,215,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${a.riskScore}%`, height: '100%', background: riskColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ ...mono, fontSize: 12, fontWeight: 800, color: riskColor }}>{a.riskScore}</span>
                    </div>
                  </td>
                  <td style={TD}>
                    <span style={{ padding: '3px 10px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: `${riskColor}12`, color: riskColor }}>
                      {a.changeRisk === 'high' ? (lang === 'en' ? 'High Risk' : '高风险') : (lang === 'en' ? 'Medium Risk' : '中等风险')}
                    </span>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(factors[a.name] ?? [{ zh: '业绩下滑', en: 'Performance decline' }]).map(f => (
                        <span key={f.zh} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: `${riskColor}09`, color: riskColor, border: `0.5px solid ${riskColor}25` }}>{lang === 'en' ? f.en : f.zh}</span>
                      ))}
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, color: C.red }}>
                      <TrendingDown size={12} />{lang === 'en' ? 'Declining' : '下降趋势'}
                    </div>
                  </td>
                  <td style={TD}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer' }}>{lang === 'en' ? 'Intervene' : '干预'}</button>
                      <button style={{ padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'transparent', color: C.muted, border: `0.5px solid ${C.border}`, cursor: 'pointer' }}>{lang === 'en' ? 'View' : '查看'}</button>
                    </div>
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

export default function ChannelPerformanceView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'personal' | 'leaderboard' | 'risk'>('leaderboard')
  const title = lang === 'en' ? 'Channel Performance Management' : '渠道绩效考核'
  const tabs = [
    { id: 'leaderboard' as const, label: lang === 'en' ? 'Rankings & Leaderboard' : '排名 & 龙虎榜' },
    { id: 'personal' as const, label: lang === 'en' ? 'Agent Performance Dashboard' : '个人业绩看板' },
    { id: 'risk' as const, label: lang === 'en' ? 'Attrition Risk Watch' : '流失风险预警', badge: agents.filter(a => a.changeRisk === 'high').length },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'KPI tracking, leaderboards, target management and attrition risk analysis' : 'KPI 追踪、排名榜单、目标管理与流失风险分析'}</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
            {(t as any).badge > 0 && <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 8, padding: '1px 5px' }}>{(t as any).badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && <LeaderboardTab />}
      {tab === 'personal' && <PersonalDashboard />}
      {tab === 'risk' && <RiskWatchTab />}
    </div>
  )
}
