import { useState } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, Download,
  Map, PieChart, Layers, Calendar, ArrowUp, ArrowDown,
  Filter, ChevronRight, Target,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

const C = {
  primary: '#0058BC', primaryLight: 'rgba(0,88,188,0.09)', primaryBorder: 'rgba(0,88,188,0.2)',
  green: '#1A7A2E', greenBg: 'rgba(52,199,89,0.10)',
  red: '#C0392B', redBg: 'rgba(255,59,48,0.08)',
  amber: '#A05C00', amberBg: 'rgba(255,159,10,0.09)', amberBorder: 'rgba(255,159,10,0.25)',
  purple: '#6B35C2', teal: '#0B7C6B',
  text: '#181C23', textSoft: '#414755', muted: '#717786', mutedLight: '#A0A5B4',
  border: 'rgba(193,198,215,0.38)', borderMid: 'rgba(193,198,215,0.55)',
  surface: 'rgba(255,255,255,0.58)', surfaceHigh: 'rgba(255,255,255,0.82)',
}
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" }
function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: C.surface, backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: `0.5px solid ${C.borderMid}`, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,58,152,0.05)', ...style }}>{children}</div>
}
function fmt(n: number) { return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}` }

// ─── Mock Data ────────────────────────────────────────────────────────────────

const byChannel = [
  { channel: 'Pacific Coast Agency', line: 'AUTO', premium: 3200000, growth: 0.18, policyCount: 182, lossRatio: 0.59, agents: 12, share: 0.24 },
  { channel: 'SunState MGA Partners', line: 'HOME', premium: 2840000, growth: 0.12, policyCount: 94, lossRatio: 0.64, agents: 8, share: 0.21 },
  { channel: 'CalFirst Agents Network', line: 'LIFE', premium: 2160000, growth: -0.04, policyCount: 143, lossRatio: 0.61, agents: 15, share: 0.16 },
  { channel: 'Mountain West FMO', line: 'HEALTH', premium: 1880000, growth: 0.22, policyCount: 1240, lossRatio: 0.72, agents: 6, share: 0.14 },
  { channel: 'Northeast Brokers', line: 'COMMERCIAL', premium: 1540000, growth: 0.07, policyCount: 88, lossRatio: 0.66, agents: 9, share: 0.11 },
  { channel: 'Midwest Alliance', line: 'AUTO', premium: 1240000, growth: -0.08, policyCount: 76, lossRatio: 0.68, agents: 7, share: 0.09 },
  { channel: 'Southeast Partners', line: 'HOME', premium: 660000, growth: 0.31, policyCount: 52, lossRatio: 0.55, agents: 4, share: 0.05 },
]

const monthly = [
  { m: 'Jan', premium: 8.2, policies: 184, commission: 0.98 },
  { m: 'Feb', premium: 9.1, policies: 198, commission: 1.09 },
  { m: 'Mar', premium: 10.8, policies: 226, commission: 1.30 },
  { m: 'Apr', premium: 9.6, policies: 208, commission: 1.15 },
  { m: 'May', premium: 11.4, policies: 244, commission: 1.37 },
  { m: 'Jun', premium: 12.2, policies: 262, commission: 1.46 },
  { m: 'Jul', premium: 11.8, policies: 255, commission: 1.42 },
  { m: 'Aug', premium: 13.5, policies: 288, commission: 1.62 },
]

const lineBreakdown = [
  { line: 'AUTO', premium: 5180000, share: 0.39, color: '#0058BC' },
  { line: 'HOME', premium: 3940000, share: 0.30, color: '#1A7A2E' },
  { line: 'LIFE', premium: 2160000, share: 0.16, color: '#6B35C2' },
  { line: 'HEALTH', premium: 1880000, share: 0.14, color: '#A05C00' },
  { line: 'COMMERCIAL', premium: 1540000, share: 0.12, color: '#0B7C6B' },
]

const stateData = [
  { state: 'CA', premium: 5800000, agents: 24, growth: 0.14 },
  { state: 'TX', premium: 3200000, agents: 18, growth: 0.08 },
  { state: 'FL', premium: 2100000, agents: 12, growth: 0.22 },
  { state: 'NY', premium: 1800000, agents: 10, growth: -0.03 },
  { state: 'CO', premium: 920000, agents: 6, growth: 0.31 },
  { state: 'WA', premium: 760000, agents: 5, growth: 0.18 },
]

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const totalPremium = byChannel.reduce((s, c) => s + c.premium, 0)
  const maxPremium = Math.max(...byChannel.map(c => c.premium))
  const maxBar = Math.max(...monthly.map(m => m.premium))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'YTD总保费', v: fmt(totalPremium), delta: '+14.2%', up: true, color: C.primary },
          { label: '活跃渠道数', v: String(byChannel.length), delta: '+2 YoY', up: true, color: C.green },
          { label: '整体赔付率', v: '62.4%', delta: '-1.8pp', up: true, color: C.green },
          { label: '渠道总佣金', v: '$1.73M', delta: '+11.6%', up: true, color: C.textSoft },
        ].map(k => (
          <GCard key={k.label} style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
            <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: k.color, marginTop: 6, lineHeight: 1 }}>{k.v}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11.5 }}>
              {k.up ? <ArrowUp size={11} color={C.green} /> : <ArrowDown size={11} color={C.red} />}
              <span style={{ fontWeight: 700, color: k.up ? C.green : C.red }}>{k.delta}</span>
              <span style={{ color: C.mutedLight }}>YTD</span>
            </div>
          </GCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
        {/* Monthly trend */}
        <GCard style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>月度保费趋势 (单位: $M)</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: C.primary }} /><span style={{ color: C.muted }}>保费</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: `${C.green}88` }} /><span style={{ color: C.muted }}>佣金</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 130 }}>
            {monthly.map(m => {
              const premH = Math.round((m.premium / maxBar) * 100)
              const commH = Math.round((m.commission / maxBar) * 100)
              return (
                <div key={m.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ ...mono, fontSize: 9, color: C.primary, fontWeight: 700 }}>{m.premium}M</div>
                  <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', height: 100 }}>
                    <div style={{ flex: 1, background: m.m === 'Aug' ? C.primary : `${C.primary}55`, borderRadius: '3px 3px 0 0', height: `${premH}%`, minHeight: 4 }} />
                    <div style={{ flex: 1, background: `${C.green}88`, borderRadius: '3px 3px 0 0', height: `${commH}%`, minHeight: 3 }} />
                  </div>
                  <div style={{ fontSize: 9.5, color: C.mutedLight }}>{m.m}</div>
                </div>
              )
            })}
          </div>
        </GCard>

        {/* Line breakdown donut */}
        <GCard style={{ padding: '18px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>业务线分布</div>
          {lineBreakdown.map((l, i) => (
            <div key={l.line} style={{ marginBottom: i < lineBreakdown.length - 1 ? 10 : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span style={{ fontWeight: 700, color: C.text }}>{l.line}</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ ...mono, fontWeight: 800, color: l.color }}>{(l.share * 100).toFixed(0)}%</span>
                  <span style={{ color: C.muted }}>{fmt(l.premium)}</span>
                </div>
              </div>
              <div style={{ height: 5, background: 'rgba(193,198,215,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${l.share * 100}%`, height: '100%', background: l.color, borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </GCard>
      </div>
    </div>
  )
}

// ─── Channel Analysis Tab ─────────────────────────────────────────────────────

function ChannelAnalysisTab() {
  const [sort, setSort] = useState<'premium' | 'growth' | 'lossRatio'>('premium')
  const sorted = [...byChannel].sort((a, b) => {
    if (sort === 'premium') return b.premium - a.premium
    if (sort === 'growth') return b.growth - a.growth
    return a.lossRatio - b.lossRatio
  })
  const maxPremium = Math.max(...byChannel.map(c => c.premium))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, color: C.muted }}>排序方式</span>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', border: `0.5px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {([['premium','保费规模'],['growth','增速'],['lossRatio','赔付率']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setSort(v)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: sort === v ? 700 : 500, background: sort === v ? C.primary : 'transparent', color: sort === v ? '#fff' : C.textSoft, border: 'none', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
        <button style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.45)', border: `0.5px solid ${C.border}`, cursor: 'pointer', color: C.textSoft }}>
          <Download size={12} />导出
        </button>
      </div>

      <GCard style={{ overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `0.5px solid ${C.border}`, fontWeight: 700, fontSize: 13, color: C.text }}>渠道绩效对比分析</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['渠道名称', '主业务线', 'YTD保费', '保费占比', '同比增长', '赔付率', '代理人数', ''].map(h => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(236,237,249,0.5)', borderBottom: `0.5px solid ${C.borderMid}`, whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.channel}>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: C.text }}>{c.channel}</div>
                </td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: C.primaryLight, color: C.primary }}>{c.line}</span>
                </td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 5, background: 'rgba(193,198,215,0.2)', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{ width: `${(c.premium / maxPremium) * 100}%`, height: '100%', background: C.primary, borderRadius: 3 }} />
                    </div>
                    <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.primary }}>{fmt(c.premium)}</span>
                  </div>
                </td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 12.5, fontWeight: 700, color: C.textSoft }}>{(c.share * 100).toFixed(0)}%</td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {c.growth >= 0 ? <ArrowUp size={11} color={C.green} /> : <ArrowDown size={11} color={C.red} />}
                    <span style={{ ...mono, fontSize: 13, fontWeight: 800, color: c.growth >= 0.10 ? C.green : c.growth < 0 ? C.red : C.amber }}>
                      {c.growth >= 0 ? '+' : ''}{(c.growth * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 13, fontWeight: 800, color: c.lossRatio > 0.70 ? C.red : c.lossRatio > 0.65 ? C.amber : C.green }}>
                  {(c.lossRatio * 100).toFixed(0)}%
                </td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}`, ...mono, fontSize: 13, fontWeight: 700, color: C.textSoft }}>{c.agents}</td>
                <td style={{ padding: '11px 12px', borderBottom: `0.5px solid ${C.border}` }}>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: C.primaryLight, color: C.primary, border: `0.5px solid ${C.primaryBorder}`, cursor: 'pointer' }}>
                    详情 <ChevronRight size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GCard>
    </div>
  )
}

// ─── Geographic Tab ───────────────────────────────────────────────────────────

function GeoTab() {
  const maxPremium = Math.max(...stateData.map(s => s.premium))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <GCard style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Map size={14} color={C.primary} />
          <span style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>地域分布热力图</span>
          <span style={{ fontSize: 11.5, color: C.muted, marginLeft: 4 }}>— 按州/地区</span>
        </div>

        {/* Heat bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {stateData.map(s => (
            <div key={s.state} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ ...mono, fontSize: 13, fontWeight: 800, color: C.text, width: 32, textAlign: 'center' as const, flexShrink: 0 }}>{s.state}</div>
              <div style={{ flex: 1, height: 28, background: 'rgba(193,198,215,0.12)', borderRadius: 7, overflow: 'hidden', position: 'relative' }}>
                <div style={{ width: `${(s.premium / maxPremium) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.primary}CC, ${C.primary}88)`, borderRadius: 7, display: 'flex', alignItems: 'center', paddingLeft: 10, transition: 'width 0.4s' }}>
                  <span style={{ ...mono, fontSize: 12, fontWeight: 800, color: '#fff' }}>{fmt(s.premium)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, minWidth: 120, justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, color: C.muted }}>{s.agents} 代理人</span>
                <span style={{ ...mono, fontSize: 12, fontWeight: 800, color: s.growth >= 0.15 ? C.green : s.growth < 0 ? C.red : C.amber }}>
                  {s.growth >= 0 ? '+' : ''}{(s.growth * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </GCard>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: '覆盖州数', v: stateData.length, sub: '全国布局' },
          { label: '最大市场', v: 'CA', sub: '$5.80M · 最高保费' },
          { label: '增长最快', v: 'CO', sub: '+31% YoY' },
        ].map(k => (
          <GCard key={k.label} style={{ padding: '14px 16px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 10.5, color: C.mutedLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
            <div style={{ ...mono, fontSize: 22, fontWeight: 800, color: C.primary, marginTop: 6 }}>{k.v}</div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>{k.sub}</div>
          </GCard>
        ))}
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

interface Props { navigateTo: (view: ViewId) => void }

export default function ChannelAnalyticsView({ navigateTo: _nav }: Props) {
  const { lang } = useLang()
  const [tab, setTab] = useState<'overview' | 'channels' | 'geo'>('overview')
  const title = lang === 'en' ? 'Channel Data Analytics' : '渠道数据分析'
  const tabs = [
    { id: 'overview' as const, label: lang === 'en' ? 'Performance Overview' : '整体概览', icon: <BarChart3 size={13} /> },
    { id: 'channels' as const, label: lang === 'en' ? 'Channel Analysis' : '渠道对比分析', icon: <Layers size={13} /> },
    { id: 'geo' as const, label: lang === 'en' ? 'Geographic Distribution' : '地域分布', icon: <Map size={13} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 21, fontWeight: 800, color: C.text, letterSpacing: '-0.3px', margin: 0 }}>{title}</h1>
        <p style={{ fontSize: 12.5, color: C.muted, marginTop: 4 }}>{lang === 'en' ? 'Premium trends, channel comparison, product mix, and geographic distribution analytics' : '保费趋势、渠道对比、产品结构与地域分布多维分析'}</p>
      </div>

      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.border}`, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: tab === t.id ? C.primaryLight : 'transparent', color: tab === t.id ? C.primary : C.muted, border: tab === t.id ? `0.5px solid ${C.border}` : '0.5px solid transparent', borderBottom: tab === t.id ? `2.5px solid ${C.primary}` : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'channels' && <ChannelAnalysisTab />}
      {tab === 'geo' && <GeoTab />}
    </div>
  )
}
