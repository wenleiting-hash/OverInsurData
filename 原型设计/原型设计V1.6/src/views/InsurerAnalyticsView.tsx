import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine, Cell, PolarRadiusAxis,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  BarChart2, Map, Users, Shield, RefreshCw, Download,
  ArrowUpRight, ArrowDownRight, Info, XOctagon,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import {
  insurerKPIs, premiumTrendData, performanceVsTarget,
  productPerfData, productMonthlyData,
  statePerformance, regionSummary, regionalMonthly, REGIONS,
  channelPerfData, channelMonthly,
  lossRatioTrend, lossAlerts, lossRatioByLine,
  renewalTrend, renewalCohorts, renewalByProduct,
  MONTHS,
} from '../data/insurerAnalyticsData'

// ── Shared helpers ────────────────────────────────────────────────────────────

const INSURER_COLORS: Record<string, string> = {
  Travelers: '#0058BC', 'Liberty Mutual': '#34C759', Nationwide: '#FF9F0A',
  Chubb: '#AF52DE', AIG: '#FF6B6B', Zurich: '#60CDFF',
}

const REGION_COLORS: Record<string, string> = {
  West: '#0058BC', Southwest: '#FF9F0A', Northeast: '#AF52DE',
  Southeast: '#34C759', Midwest: '#60CDFF',
}

function fmt(n: number) { return '$' + (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'K' : n.toString()) }
function fmtFull(n: number) { return '$' + n.toLocaleString() }
function pct(n: number) { return (n * 100).toFixed(1) + '%' }
function delta(n: number, invert = false) {
  const pos = invert ? n < 0 : n > 0
  const color = pos ? '#1E8033' : '#C0392B'
  const icon = n > 0.001 ? <ArrowUpRight size={12} /> : n < -0.001 ? <ArrowDownRight size={12} /> : <Minus size={12} />
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontSize: 12, fontWeight: 700 }}>{icon}{Math.abs(n * 100).toFixed(1)}pp</span>
}

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>{children}</span>
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div className="glass-card" style={{ borderRadius: 14, padding: '18px 20px', ...style }}>{children}</div>
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 13, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{children}</div>
}

const tooltipStyle = {
  contentStyle: { background: 'rgba(255,255,255,0.92)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 10, fontSize: 12, backdropFilter: 'blur(8px)' },
  labelStyle: { fontWeight: 700, color: '#181C23' },
}

// ── Tab 1 — 保险公司业绩总览 ──────────────────────────────────────────────────

function OverviewTab() {
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(null)
  const totalPremium = insurerKPIs.reduce((s, k) => s + k.totalPremium, 0)
  const totalCommission = insurerKPIs.reduce((s, k) => s + k.totalCommission, 0)
  const avgLossRatio = insurerKPIs.reduce((s, k) => s + k.lossRatio, 0) / insurerKPIs.length
  const avgRenewal = insurerKPIs.reduce((s, k) => s + k.renewalRate, 0) / insurerKPIs.length

  return (
    <div>
      {/* Platform KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '平台年化保费收入', value: fmt(totalPremium), sub: '较上年 +13.2%', color: '#0058BC', bg: 'rgba(0,88,188,0.08)', trend: true },
          { label: '平台佣金收入', value: fmt(totalCommission), sub: '综合费率 12.0%', color: '#1E8033', bg: 'rgba(52,199,89,0.08)', trend: true },
          { label: '综合赔付率', value: pct(avgLossRatio), sub: '较上月 -0.6pp', color: '#B06000', bg: 'rgba(255,159,10,0.08)', trend: false },
          { label: '综合续保率', value: pct(avgRenewal), sub: '较上月 +0.3pp', color: '#7B3FCA', bg: 'rgba(123,63,202,0.08)', trend: true },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: s.trend ? '#1E8033' : '#B06000', marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              {s.trend ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{s.sub}
            </div>
          </Card>
        ))}
      </div>

      {/* Insurer ranking cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {insurerKPIs.sort((a, b) => b.totalPremium - a.totalPremium).map(k => (
          <div key={k.insurerId} onClick={() => setSelectedInsurer(selectedInsurer === k.insurerId ? null : k.insurerId)} style={{ borderRadius: 14, padding: '16px 18px', border: selectedInsurer === k.insurerId ? `2px solid ${k.insurerColor}` : '1px solid rgba(193,198,215,0.35)', background: selectedInsurer === k.insurerId ? `${k.insurerColor}08` : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${k.insurerColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${k.insurerColor}30` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: k.insurerColor }}>{k.insurerShort.slice(0, 2).toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#181C23' }}>{k.insurerShort}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {k.premiumGrowth > 0.1 && <Badge bg={`${k.insurerColor}15`} color={k.insurerColor}>高增长</Badge>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: '保费规模', value: fmt(k.totalPremium), mono: true },
                { label: '保费增速', value: `+${pct(k.premiumGrowth)}`, color: '#1E8033' },
                { label: '赔付率', value: pct(k.lossRatio), color: k.lossRatio > 0.65 ? '#C0392B' : k.lossRatio > 0.60 ? '#B06000' : '#1E8033' },
                { label: '续保率', value: pct(k.renewalRate), color: k.renewalRate > 0.9 ? '#1E8033' : k.renewalRate > 0.87 ? '#B06000' : '#C0392B' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color ?? '#181C23', fontFamily: m.mono ? "'JetBrains Mono', monospace" : undefined }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 12, fontSize: 11.5, color: '#717786' }}>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{k.activePolicies.toLocaleString()}</span> 张保单</span>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{k.activeChannels}</span> 个渠道</span>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{k.activeProducts}</span> 款产品</span>
            </div>
          </div>
        ))}
      </div>

      {/* Premium trend chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>月度保费趋势（万美元）</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={premiumTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${v}`} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v * 100}K`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(INSURER_COLORS).map(([name, color]) => (
                <Line key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>YTD 保费达成率（百万美元）</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceVsTarget} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#A0A5B1' }} width={80} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="actual" name="实际" radius={[0, 4, 4, 0]}>
                {performanceVsTarget.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="target" name="目标" fill="rgba(193,198,215,0.35)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 2 — 产品业绩分析 ──────────────────────────────────────────────────────

function ProductAnalyticsTab() {
  const [sortKey, setSortKey] = useState<'totalPremium' | 'lossRatio' | 'renewalRate' | 'premiumGrowth'>('totalPremium')
  const [filterInsurer, setFilterInsurer] = useState('all')

  const sorted = [...productPerfData]
    .filter(p => filterInsurer === 'all' || p.insurerShort === filterInsurer)
    .sort((a, b) => sortKey === 'lossRatio' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey])

  const topByGrowth = [...productPerfData].sort((a, b) => b.premiumGrowth - a.premiumGrowth).slice(0, 3)

  return (
    <div>
      {/* Top 3 spotlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {topByGrowth.map((p, rank) => {
          const rankStyle = [
            { bg: 'rgba(175,82,222,0.09)', border: 'rgba(175,82,222,0.22)', badge: '#AF52DE' },
            { bg: 'rgba(255,159,10,0.09)',  border: 'rgba(255,159,10,0.22)',  badge: '#FF9F0A' },
            { bg: 'rgba(160,165,177,0.09)', border: 'rgba(160,165,177,0.22)', badge: '#A0A5B1' },
          ][rank] ?? { bg: 'rgba(249,249,255,0.6)', border: 'rgba(193,198,215,0.3)', badge: '#A0A5B1' }
          return (
          <Card key={p.productId} style={{ background: rankStyle.bg, border: `1px solid ${rankStyle.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: rank === 0 ? '#AF52DE' : rank === 1 ? '#FF9F0A' : '#A0A5B1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{rank + 1}</div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#717786' }}>增速 TOP {rank + 1}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#181C23', lineHeight: 1.3, marginBottom: 6 }}>{p.productName}</div>
            <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 8 }}>{p.insurerShort} · {p.line}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div><div style={{ fontSize: 10.5, color: '#A0A5B1' }}>保费增速</div><div style={{ fontSize: 18, fontWeight: 800, color: '#1E8033', fontFamily: "'JetBrains Mono', monospace" }}>+{pct(p.premiumGrowth)}</div></div>
              <div><div style={{ fontSize: 10.5, color: '#A0A5B1' }}>规模</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(p.totalPremium)}</div></div>
            </div>
          </Card>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 160 }}>
          <option value="all">全部保险公司</option>
          {['Travelers', 'Liberty Mutual', 'Nationwide', 'Chubb', 'AIG', 'Zurich'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {[['totalPremium','保费规模'],['premiumGrowth','增速'],['lossRatio','赔付率↑佳'],['renewalRate','续保率']].map(([k, l]) => (
            <button key={k} onClick={() => setSortKey(k as any)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: sortKey === k ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: sortKey === k ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: sortKey === k ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['产品名称', '保险公司', '业务线', '保费规模', '增速', '保单数', '件均保费', '赔付率', '续保率', '主要州'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const lrColor = p.lossRatio > 0.65 ? '#C0392B' : p.lossRatio > 0.60 ? '#B06000' : '#1E8033'
              const rrColor = p.renewalRate > 0.9 ? '#1E8033' : p.renewalRate > 0.87 ? '#B06000' : '#C0392B'
              return (
                <tr key={p.productId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23', maxWidth: 200 }}>{p.productName}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, background: `${INSURER_COLORS[p.insurerShort]}15`, color: INSURER_COLORS[p.insurerShort], borderRadius: 6, padding: '2px 7px' }}>{p.insurerShort}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: '#555' }}>{p.line}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(p.totalPremium)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: p.premiumGrowth > 0 ? '#1E8033' : '#C0392B', fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.premiumGrowth > 0 ? '+' : ''}{pct(p.premiumGrowth)}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{p.policyCount.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>${p.avgPremium.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.lossRatio * 100}%`, height: '100%', background: lrColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: lrColor, fontSize: 12.5 }}>{pct(p.lossRatio)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${p.renewalRate * 100}%`, height: '100%', background: rrColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: rrColor, fontSize: 12.5 }}>{pct(p.renewalRate)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0058BC', fontSize: 13 }}>{p.topState}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Product monthly trend chart */}
      <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
        <SectionTitle>主要产品月度保费趋势（万美元）</SectionTitle>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={productMonthlyData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <defs>
              {[['Travelers Comm.','#0058BC'],['Chubb D&O','#AF52DE'],['Chubb Cyber','#FF6B6B'],['Zurich GL','#60CDFF']].map(([k, c]) => (
                <linearGradient key={k} id={`grad-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
            <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v * 100}K`, '']} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {[['Travelers Comm.','#0058BC'],['Chubb D&O','#AF52DE'],['Chubb Cyber','#FF6B6B'],['Zurich GL','#60CDFF']].map(([k, c]) => (
              <Area key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} fill={`url(#grad-${k})`} dot={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

// ── Tab 3 — 区域业绩分析 ──────────────────────────────────────────────────────

function RegionalAnalyticsTab() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const regionStates = selectedRegion ? statePerformance.filter(s => s.region === selectedRegion).sort((a, b) => b.totalPremium - a.totalPremium) : statePerformance.sort((a, b) => b.totalPremium - a.totalPremium).slice(0, 8)

  return (
    <div>
      {/* Region summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {regionSummary.map(r => {
          const color = REGION_COLORS[r.region]
          return (
            <div key={r.region} onClick={() => setSelectedRegion(selectedRegion === r.region ? null : r.region)} style={{ borderRadius: 14, padding: '14px 16px', border: selectedRegion === r.region ? `2px solid ${color}` : `1px solid ${color}28`, background: selectedRegion === r.region ? `${color}16` : `${color}08`, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{r.region}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(r.totalPremium)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11 }}>
                <span style={{ color: '#717786' }}>{r.stateCount} 州</span>
                <span style={{ color: '#717786' }}>·</span>
                <span style={{ color: '#1E8033' }}>+{pct(r.avgGrowth)}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: '#717786' }}>赔付率：<span style={{ fontWeight: 700, color: r.avgLossRatio > 0.65 ? '#C0392B' : '#555' }}>{pct(r.avgLossRatio)}</span></div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Regional trend chart */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各区域月度保费趋势（万美元）</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={regionalMonthly} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <defs>
                {Object.entries(REGION_COLORS).map(([k, c]) => (
                  <linearGradient key={k} id={`rg-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v * 100}K`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(REGION_COLORS).map(([k, c]) => (
                <Area key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} fill={`url(#rg-${k})`} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Region breakdown bar */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>区域保费 & 赔付率对比</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionSummary} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `$${v / 1e6}M`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.4, 0.8]} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === 'avgLossRatio' ? pct(v) : fmt(v), name === 'avgLossRatio' ? '赔付率' : '保费']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="totalPremium" name="保费" radius={[4, 4, 0, 0]}>
                {regionSummary.map((e, i) => <Cell key={i} fill={REGION_COLORS[e.region]} fillOpacity={0.8} />)}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="avgLossRatio" name="赔付率" stroke="#FF3B30" strokeWidth={2} dot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* State detail table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{selectedRegion ? `${selectedRegion} 区域州级明细` : '保费前 8 州明细'}</span>
          {selectedRegion && <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setSelectedRegion(null)}>查看全部</button>}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['州', '区域', '保费规模', '增速', '保单数', '赔付率', '主要保险公司', '渠道数'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regionStates.map((s, i) => {
              const rColor = REGION_COLORS[s.region]
              return (
                <tr key={s.state} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: 16, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{s.state}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, background: `${rColor}12`, color: rColor, borderRadius: 5, padding: '2px 7px' }}>{s.region}</span></td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(s.totalPremium)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1E8033', fontSize: 12.5 }}>+{pct(s.growthRate)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{s.policyCount.toLocaleString()}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: s.lossRatio > 0.65 ? '#C0392B' : s.lossRatio > 0.62 ? '#B06000' : '#1E8033', fontSize: 12.5 }}>{pct(s.lossRatio)}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, color: '#181C23' }}>{s.topInsurer}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{s.channelCount}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Tab 4 — 渠道贡献分析 ─────────────────────────────────────────────────────

function ChannelAnalyticsTab() {
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const tierColors: Record<string, { bg: string; color: string }> = {
    Platinum: { bg: 'rgba(175,82,222,0.12)', color: '#7B3FCA' },
    Gold:     { bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
    Silver:   { bg: 'rgba(180,180,180,0.15)', color: '#717786' },
    Bronze:   { bg: 'rgba(150,100,60,0.12)', color: '#8B5E3C' },
  }
  const filtered = channelPerfData.filter(c => selectedTier === 'all' || c.tier === selectedTier)
  const totalPremium = channelPerfData.reduce((s, c) => s + c.totalPremium, 0)

  return (
    <div>
      {/* Tier KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {(['Platinum', 'Gold', 'Silver', 'Bronze'] as const).map(tier => {
          const cs = channelPerfData.filter(c => c.tier === tier)
          const tc = tierColors[tier]
          return (
            <div key={tier} onClick={() => setSelectedTier(selectedTier === tier ? 'all' : tier)} style={{ borderRadius: 14, padding: '14px 16px', border: selectedTier === tier ? `2px solid ${tc.color}` : `1px solid ${tc.color}28`, background: selectedTier === tier ? `${tc.color}16` : tc.bg, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Badge bg={tc.bg} color={tc.color}>{tier}</Badge>
                <span style={{ fontSize: 11, color: '#A0A5B1' }}>{cs.length} 家</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: tc.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(cs.reduce((s, c) => s + c.totalPremium, 0))}
              </div>
              <div style={{ fontSize: 11, color: '#717786', marginTop: 3 }}>
                占比 {pct(cs.reduce((s, c) => s + c.totalPremium, 0) / totalPremium)}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Channel premium bar */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>渠道保费规模排名（百万美元）</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filtered.map(c => ({ name: c.channelShort, premium: Math.round(c.totalPremium / 1e5) / 10, tier: c.tier }))} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#A0A5B1' }} width={72} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '保费']} />
              <Bar dataKey="premium" radius={[0, 4, 4, 0]}>
                {filtered.map((c, i) => <Cell key={i} fill={tierColors[c.tier].color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top channel monthly trend */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>主要渠道月度保费趋势（万美元）</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={channelMonthly} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v * 100}K`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {[['Pacific Coast','#0058BC'],['Lone Star','#FF9F0A'],['Sunshine','#34C759'],['Empire State','#AF52DE']].map(([k, c]) => (
                <Line key={k} type="monotone" dataKey={k} stroke={c} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Channel detail table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['渠道名称', '层级', '保费贡献', '占比', '增速', '佣金收入', '赔付率', '续保率', '保险公司', '产品'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => {
              const tc = tierColors[c.tier]
              const lrC = c.lossRatio > 0.65 ? '#C0392B' : c.lossRatio > 0.62 ? '#B06000' : '#1E8033'
              const rrC = c.renewalRate > 0.9 ? '#1E8033' : c.renewalRate > 0.87 ? '#B06000' : '#C0392B'
              return (
                <tr key={c.channelId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#181C23' }}>{c.channelName}</td>
                  <td style={{ padding: '10px 14px' }}><Badge bg={tc.bg} color={tc.color}>{c.tier}</Badge></td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(c.totalPremium)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 40, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, c.premiumShare * 600)}%`, height: '100%', background: tc.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{pct(c.premiumShare)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1E8033', fontSize: 12.5 }}>+{pct(c.premiumGrowth)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{fmt(c.commissionEarned)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: lrC, fontSize: 12 }}>{pct(c.lossRatio)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: rrC, fontSize: 12 }}>{pct(c.renewalRate)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{c.activeInsurers}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>{c.activeProducts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Tab 5 — 赔付率监控 ───────────────────────────────────────────────────────

function LossRatioTab() {
  const alertSev: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    critical: { bg: 'rgba(255,59,48,0.1)',  color: '#C0392B', icon: <XOctagon size={14} /> },
    warning:  { bg: 'rgba(255,159,10,0.1)', color: '#B06000', icon: <AlertTriangle size={14} /> },
    watch:    { bg: 'rgba(0,88,188,0.1)',   color: '#0058BC', icon: <Info size={14} /> },
  }

  const THRESHOLD = 0.70

  return (
    <div>
      {/* Alert cards */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} color="#C0392B" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>预警事项</span>
          <Badge bg="rgba(255,59,48,0.1)" color="#C0392B">{lossAlerts.filter(a => a.severity === 'critical').length} 严重</Badge>
          <Badge bg="rgba(255,159,10,0.1)" color="#B06000">{lossAlerts.filter(a => a.severity === 'warning').length} 警告</Badge>
        </div>
        <div className="flex flex-col gap-2">
          {lossAlerts.map(a => {
            const sv = alertSev[a.severity]
            const trendStyle = a.trend === 'rising' ? { color: '#C0392B', icon: <TrendingUp size={13} /> } : a.trend === 'improving' ? { color: '#1E8033', icon: <TrendingDown size={13} /> } : { color: '#717786', icon: <Minus size={13} /> }
            return (
              <div key={a.id} style={{ borderRadius: 12, padding: '12px 16px', background: sv.bg, border: `1px solid ${sv.color}30`, display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ color: sv.color, flexShrink: 0 }}>{sv.icon}</span>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3 mb-0.5">
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#181C23' }}>{a.insurerShort} · {a.line} · {a.state}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: trendStyle.color }}>{trendStyle.icon}{a.trend === 'rising' ? '上升趋势' : a.trend === 'improving' ? '改善中' : '平稳'}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#717786' }}>{a.note}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: sv.color, fontFamily: "'JetBrains Mono', monospace" }}>{pct(a.currentRatio)}</div>
                  <div style={{ fontSize: 11, color: '#A0A5B1' }}>阈值 {pct(a.threshold)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Loss ratio trend */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各保险公司赔付率趋势</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lossRatioTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.45, 0.75]} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={THRESHOLD} stroke="#FF3B30" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: '预警线 70%', position: 'right', fontSize: 10, fill: '#FF3B30' }} />
              {Object.entries(INSURER_COLORS).map(([name, color]) => (
                <Line key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Loss ratio by line */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各业务线赔付率 vs 行业基准</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lossRatioByLine} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="line" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.35, 0.80]} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={THRESHOLD} stroke="#FF3B30" strokeDasharray="5 3" strokeWidth={1} />
              <Bar dataKey="ratio" name="实际赔付率" radius={[4, 4, 0, 0]}>
                {lossRatioByLine.map((e, i) => <Cell key={i} fill={e.ratio > 0.65 ? '#FF3B30' : e.ratio > 0.60 ? '#FF9F0A' : '#34C759'} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="benchmark" name="行业基准" fill="rgba(193,198,215,0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Per-insurer loss ratio summary */}
      <Card>
        <SectionTitle>保险公司赔付率汇总</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {insurerKPIs.map(k => {
            const pct_ = k.lossRatio * 100
            const barColor = k.lossRatio > 0.65 ? '#FF3B30' : k.lossRatio > 0.60 ? '#FF9F0A' : '#34C759'
            return (
              <div key={k.insurerId} style={{ padding: '12px 14px', borderRadius: 11, border: '1px solid rgba(193,198,215,0.3)', background: 'rgba(249,249,255,0.5)' }}>
                <div className="flex items-center justify-between mb-3">
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{k.insurerShort}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11.5, fontWeight: 600, color: k.lossRatioDelta < 0 ? '#1E8033' : '#C0392B' }}>
                    {k.lossRatioDelta < 0 ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                    {Math.abs(k.lossRatioDelta * 100).toFixed(1)}pp
                  </span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: barColor, fontFamily: "'JetBrains Mono', monospace", marginBottom: 8 }}>{pct(k.lossRatio)}</div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (pct_ / 80) * 100)}%`, height: '100%', background: barColor, borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5, color: '#A0A5B1' }}>
                  <span>0%</span><span style={{ color: '#FF3B30' }}>70%</span><span>80%</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ── Tab 6 — 续保率分析 ───────────────────────────────────────────────────────

function RenewalAnalyticsTab() {
  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: '平台综合续保率', value: pct(insurerKPIs.reduce((s, k) => s + k.renewalRate, 0) / insurerKPIs.length), color: '#0058BC', bg: 'rgba(0,88,188,0.08)', sub: '较上月 +0.3pp', up: true },
          { label: '本月到期保单', value: renewalCohorts[renewalCohorts.length - 1].dueCount.toLocaleString(), color: '#B06000', bg: 'rgba(255,159,10,0.08)', sub: '待续保', up: null },
          { label: '本月已续保', value: renewalCohorts[renewalCohorts.length - 1].renewedCount.toLocaleString(), color: '#1E8033', bg: 'rgba(52,199,89,0.08)', sub: pct(renewalCohorts[renewalCohorts.length - 1].renewalRate), up: true },
          { label: '续保保费增长', value: '+' + pct(renewalCohorts[renewalCohorts.length - 1].avgPremiumChange), color: '#7B3FCA', bg: 'rgba(123,63,202,0.08)', sub: '件均保费同比增长', up: true },
        ].map(s => (
          <Card key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 11, color: '#717786', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11.5, marginTop: 4, color: s.up === null ? '#717786' : s.up ? '#1E8033' : '#C0392B', display: 'flex', alignItems: 'center', gap: 3 }}>
              {s.up !== null && (s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}{s.sub}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Renewal trend */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各保险公司续保率趋势</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={renewalTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.80, 0.96]} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0.85} stroke="#FF9F0A" strokeDasharray="5 3" strokeWidth={1} label={{ value: '85%', position: 'right', fontSize: 10, fill: '#FF9F0A' }} />
              {Object.entries(INSURER_COLORS).map(([name, color]) => (
                <Line key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Cohort stacked bar */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>续保队列分析 — 到期保单构成</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renewalCohorts} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="renewedCount" name="已续保" fill="#34C759" fillOpacity={0.85} stackId="a" />
              <Bar dataKey="cancelledCount" name="主动取消" fill="#FF9F0A" fillOpacity={0.85} stackId="a" />
              <Bar dataKey="lapsedCount" name="自动失效" fill="#FF3B30" fillOpacity={0.85} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insurer renewal comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各保险公司续保率排名</SectionTitle>
          <div className="flex flex-col gap-3 mt-2">
            {[...insurerKPIs].sort((a, b) => b.renewalRate - a.renewalRate).map((k, rank) => (
              <div key={k.insurerId} className="flex items-center gap-3">
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: rank < 3 ? k.insurerColor : 'rgba(193,198,215,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: rank < 3 ? '#fff' : '#A0A5B1', flexShrink: 0 }}>{rank + 1}</div>
                <div style={{ width: 100, fontSize: 12.5, fontWeight: 600, color: '#181C23', flexShrink: 0 }}>{k.insurerShort}</div>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(193,198,215,0.25)', overflow: 'hidden' }}>
                  <div style={{ width: `${((k.renewalRate - 0.80) / 0.15) * 100}%`, height: '100%', background: k.insurerColor, borderRadius: 4 }} />
                </div>
                <div style={{ width: 48, textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: k.renewalRate > 0.90 ? '#1E8033' : k.renewalRate > 0.87 ? '#B06000' : '#C0392B', fontSize: 12.5, flexShrink: 0 }}>{pct(k.renewalRate)}</div>
                <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>{delta(k.renewalRateDelta)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Product renewal rate */}
        <Card style={{ background: 'rgba(246,248,255,0.92)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <SectionTitle>各产品续保率对比</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renewalByProduct} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.75, 1.0]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: '#A0A5B1' }} width={100} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '续保率']} />
              <ReferenceLine x={0.85} stroke="#FF9F0A" strokeDasharray="4 3" strokeWidth={1} />
              <Bar dataKey="rate" name="续保率" radius={[0, 4, 4, 0]}>
                {renewalByProduct.map((e, i) => <Cell key={i} fill={e.rate > 0.90 ? '#34C759' : e.rate > 0.87 ? '#FF9F0A' : '#FF3B30'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cohort table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', fontSize: 13, fontWeight: 700, color: '#181C23' }}>月度续保队列明细</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(249,249,255,0.7)' }}>
              {['账期', '到期保单数', '已续保', '主动取消', '自动失效', '续保率', '件均保费变动'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...renewalCohorts].reverse().map((c, i) => (
              <tr key={c.period} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'transparent' : 'rgba(249,249,255,0.4)' }}>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{c.period}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{c.dueCount.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#1E8033' }}>{c.renewedCount.toLocaleString()}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#B06000' }}>{c.cancelledCount}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#C0392B' }}>{c.lapsedCount}</td>
                <td style={{ padding: '10px 14px' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 60, height: 5, borderRadius: 3, background: 'rgba(193,198,215,0.3)', overflow: 'hidden' }}>
                      <div style={{ width: `${((c.renewalRate - 0.80) / 0.15) * 100}%`, height: '100%', background: c.renewalRate > 0.90 ? '#34C759' : '#FF9F0A', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: c.renewalRate > 0.90 ? '#1E8033' : '#B06000', fontSize: 12.5 }}>{pct(c.renewalRate)}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#7B3FCA' }}>+{pct(c.avgPremiumChange)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  icon: <BarChart2 size={15} />,  label: '账单与结算总览',   disabled: false },
  { id: 'product',   icon: <TrendingUp size={15} />,  label: '产品结算分析',   disabled: false },
  { id: 'regional',  icon: <Map size={15} />,         label: '区域结算分析',   disabled: false },
  { id: 'channel',   icon: <Users size={15} />,       label: '渠道结算贡献',   disabled: false },
  { id: 'loss',      icon: <Shield size={15} />,      label: '差异率监控', disabled: false },
  { id: 'renewal',   icon: <RefreshCw size={15} />,   label: '结算达成分析', disabled: false },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function InsurerAnalyticsView({ navigateTo: _navigateTo }: Props) {
  const [tab, setTab] = useState<TabId>('overview')
  const [period, setPeriod] = useState('2026-08')

  const criticalAlerts = lossAlerts.filter(a => a.severity === 'critical').length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>保险公司数据分析</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>账单结算总览 · 产品结算 · 区域结算 · 渠道贡献 · 差异率监控 · 结算达成分析</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAlerts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {criticalAlerts} 项赔付率预警
            </div>
          )}
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 120 }}>
            {['2026-08', '2026-07', '2026-Q3', '2026-Q2', '2026-H1'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.08)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
            <Download size={13} /> 导出报告
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => !t.disabled && setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === t.id ? 700 : 500, background: t.disabled ? 'transparent' : tab === t.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: t.disabled ? '#C0C5D0' : tab === t.id ? '#0058BC' : '#717786', borderTop: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderLeft: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderRight: tab === t.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === t.id ? '2px solid #0058BC' : '2px solid transparent', cursor: t.disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s', opacity: t.disabled ? 0.5 : 1 }}>
            {t.icon}
            {t.label}
            {t.disabled && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(193,198,215,0.4)', color: '#717786', marginLeft: 2 }}>待数据源</span>}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab />}
      {tab === 'product'   && <ProductAnalyticsTab />}
      {tab === 'regional'  && <RegionalAnalyticsTab />}
      {tab === 'channel'   && <ChannelAnalyticsTab />}
      {tab === 'loss' && <LossRatioTab />}
      {tab === 'renewal' && <RenewalAnalyticsTab />}
    </div>
  )
}
