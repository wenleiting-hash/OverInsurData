import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import type { ViewId } from '@/App'
import {
  useAnalyticsOverview, useAnalyticsProducts, useAnalyticsRegional,
  useAnalyticsChannels, useAnalyticsLossRatio, useAnalyticsRenewal,
} from '@/services/analyticsService'

// ── Shared helpers ────────────────────────────────────────────────────────────

const INSURER_COLORS: Record<string, string> = {
  Travelers: '#0058BC', 'Liberty Mutual': '#34C759', Nationwide: '#FF9F0A',
  Chubb: '#AF52DE', AIG: '#FF6B6B', Zurich: '#60CDFF',
}

const REGION_COLORS: Record<string, string> = {
  West: '#0058BC', Southwest: '#FF9F0A', Northeast: '#AF52DE',
  Southeast: '#34C759', Midwest: '#60CDFF',
}

function fmt(n: number | undefined | null) { const v = n ?? 0; return '$' + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'K' : v.toString()) }
function fmtFull(n: number | undefined | null) { return '$' + (n ?? 0).toLocaleString() }
function pct(n: number | undefined | null) { return ((n ?? 0) * 100).toFixed(1) + '%' }
function delta(n: number | undefined | null, invert = false) {
  const v = n ?? 0
  const pos = invert ? v < 0 : v > 0
  const color = pos ? '#1E8033' : '#C0392B'
  const icon = v > 0.001 ? <ArrowUpRight size={12} /> : v < -0.001 ? <ArrowDownRight size={12} /> : <Minus size={12} />
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color, fontSize: 12, fontWeight: 700 }}>{icon}{Math.abs(v * 100).toFixed(1)}pp</span>
}

function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, color, fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '2px 7px' }}>{children}</span>
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ borderRadius: 14, padding: '18px 20px', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', ...style }}>{children}</div>
}

// KPI 色调常量（对齐原型 V2）
const TINT: Record<string, { bg: string; bd: string }> = {
  blue:   { bg: 'rgba(0,88,188,0.08)',   bd: '1px solid rgba(0,88,188,0.133)' },
  green:  { bg: 'rgba(52,199,89,0.08)',  bd: '1px solid rgba(30,128,51,0.133)' },
  red:    { bg: 'rgba(255,59,48,0.08)',  bd: '1px solid rgba(192,57,43,0.133)' },
  orange: { bg: 'rgba(255,159,10,0.08)', bd: '1px solid rgba(176,96,0,0.133)' },
  purple: { bg: 'rgba(123,63,202,0.08)', bd: '1px solid rgba(123,63,202,0.133)' },
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
  const { t } = useTranslation('analytics')
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(null)
  const { data: overviewRes } = useAnalyticsOverview()
  const overviewData: any = overviewRes?.data ?? {}
  const insurerKPIs: any[] = overviewData?.insurer_kpis ?? []
  const premiumTrendData: any[] = overviewData?.premium_trend ?? []
  const performanceVsTarget: any[] = overviewData?.performance_vs_target ?? []
  const totalPremium = insurerKPIs.reduce((s: number, k: any) => s + (k.total_premium || k.totalPremium || 0), 0)
  const totalCommission = insurerKPIs.reduce((s: number, k: any) => s + (k.total_commission || k.totalCommission || 0), 0)
  const avgLossRatio = insurerKPIs.length ? insurerKPIs.reduce((s: number, k: any) => s + (k.loss_ratio || k.lossRatio || 0), 0) / insurerKPIs.length : 0
  const avgRenewal = insurerKPIs.length ? insurerKPIs.reduce((s: number, k: any) => s + (k.renewal_rate || k.renewalRate || 0), 0) / insurerKPIs.length : 0

  return (
    <div>
      {/* Platform KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t('overview.kpiPremium'), value: fmt(totalPremium), sub: t('overview.kpiPremiumSub'), color: '#0058BC', trend: true },
          { label: t('overview.kpiCommission'), value: fmt(totalCommission), sub: t('overview.kpiCommissionSub'), color: '#1E8033', trend: true },
          { label: t('overview.kpiLossRatio'), value: pct(avgLossRatio), sub: t('overview.kpiLossRatioSub'), color: '#B06000', trend: false },
          { label: t('overview.kpiRenewal'), value: pct(avgRenewal), sub: t('overview.kpiRenewalSub'), color: '#7B3FCA', trend: true },
        ].map(s => (
          <Card key={s.label} style={{ background: (s.color === '#0058BC' ? TINT.blue : s.color === '#1E8033' ? TINT.green : s.color === '#B06000' ? TINT.orange : TINT.purple).bg, border: (s.color === '#0058BC' ? TINT.blue : s.color === '#1E8033' ? TINT.green : s.color === '#B06000' ? TINT.orange : TINT.purple).bd }}>
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
        {insurerKPIs.sort((a: any, b: any) => (b.total_premium || b.totalPremium || 0) - (a.total_premium || a.totalPremium || 0)).map((k: any) => {
          const kColor = k.insurer_color || k.insurerColor || INSURER_COLORS[k.insurer_short || k.insurerShort] || '#0058BC'
          const kShort = k.insurer_short || k.insurerShort || ''
          const kPremium = k.total_premium || k.totalPremium || 0
          const kGrowth = k.premium_growth || k.premiumGrowth || 0
          const kLoss = k.loss_ratio || k.lossRatio || 0
          const kRenewal = k.renewal_rate || k.renewalRate || 0
          const kPolicies = k.active_policies || k.activePolicies || 0
          const kChannels = k.active_channels || k.activeChannels || 0
          const kProducts = k.active_products || k.activeProducts || 0
          const kId = k.insurer_id || k.insurerId || ''
          return (
          <div key={kId} onClick={() => setSelectedInsurer(selectedInsurer === kId ? null : kId)} style={{ borderRadius: 14, padding: '16px 18px', border: selectedInsurer === kId ? `2px solid ${kColor}` : '1px solid rgba(193,198,215,0.35)', background: selectedInsurer === kId ? `${kColor}08` : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${kColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${kColor}30` }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: kColor }}>{kShort.slice(0, 2).toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#181C23' }}>{kShort}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {kGrowth > 0.1 && <Badge bg={`${kColor}15`} color={kColor}>{t('overview.highGrowth')}</Badge>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: t('kpi.premium'), value: fmt(kPremium), mono: true },
                { label: t('kpi.premiumGrowth'), value: `+${pct(kGrowth)}`, color: '#1E8033' },
                { label: t('kpi.lossRatio'), value: pct(kLoss), color: kLoss > 0.65 ? '#C0392B' : kLoss > 0.60 ? '#B06000' : '#1E8033' },
                { label: t('kpi.renewalRate'), value: pct(kRenewal), color: kRenewal > 0.9 ? '#1E8033' : kRenewal > 0.87 ? '#B06000' : '#C0392B' },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ fontSize: 10.5, color: '#A0A5B1', marginBottom: 1 }}>{m.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: m.color ?? '#181C23', fontFamily: m.mono ? "'JetBrains Mono', monospace" : undefined }}>{m.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid rgba(193,198,215,0.3)', display: 'flex', gap: 12, fontSize: 11.5, color: '#717786' }}>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{(kPolicies ?? 0).toLocaleString()}</span> {t('overview.unitPolicies')}</span>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{kChannels}</span> {t('overview.unitChannels')}</span>
              <span><span style={{ fontWeight: 700, color: '#181C23' }}>{kProducts}</span> {t('overview.unitProducts')}</span>
            </div>
          </div>
          )
        })}
      </div>

      {/* Premium trend chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <SectionTitle>{t('overview.chartPremiumTrend')}</SectionTitle>
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

        <Card>
          <SectionTitle>{t('overview.chartTarget')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceVsTarget} margin={{ top: 4, right: 8, bottom: 0, left: -10 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#A0A5B1' }} width={80} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="actual" name={t('overview.actual')} radius={[0, 4, 4, 0]}>
                {performanceVsTarget.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="target" name={t('overview.target')} fill="rgba(193,198,215,0.35)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 2 — 产品业绩分析 ──────────────────────────────────────────────────────

function ProductAnalyticsTab() {
  const { t } = useTranslation('analytics')
  const [sortKey, setSortKey] = useState<'totalPremium' | 'lossRatio' | 'renewalRate' | 'premiumGrowth'>('totalPremium')
  const [filterInsurer, setFilterInsurer] = useState('all')
  const { data: prodRes } = useAnalyticsProducts()
  const productPerfData: any[] = prodRes?.data ?? []
  const productMonthlyData: any[] = prodRes?.data?.monthly_trend ?? []

  const sorted = [...productPerfData]
    .filter(p => filterInsurer === 'all' || p.insurerShort === filterInsurer)
    .sort((a, b) => sortKey === 'lossRatio' ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey])

  const topByGrowth = [...productPerfData].sort((a, b) => b.premiumGrowth - a.premiumGrowth).slice(0, 3)

  return (
    <div>
      {/* Top 3 spotlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
        {topByGrowth.map((p, rank) => (
          <Card key={p.productId} style={{ background: rank === 0 ? 'linear-gradient(135deg,rgba(175,82,222,0.06) 0%,transparent 60%)' : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: rank === 0 ? '#AF52DE' : rank === 1 ? '#FF9F0A' : '#A0A5B1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{rank + 1}</div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#717786' }}>{t('product.topGrowth', { n: rank + 1 })}</span>
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#181C23', lineHeight: 1.3, marginBottom: 6 }}>{p.productName}</div>
            <div style={{ fontSize: 11.5, color: '#717786', marginBottom: 8 }}>{p.insurerShort} · {p.line}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div><div style={{ fontSize: 10.5, color: '#A0A5B1' }}>{t('kpi.premiumGrowth')}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#1E8033', fontFamily: "'JetBrains Mono', monospace" }}>+{pct(p.premiumGrowth)}</div></div>
              <div><div style={{ fontSize: 10.5, color: '#A0A5B1' }}>{t('kpi.scale')}</div><div style={{ fontSize: 18, fontWeight: 800, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{fmt(p.totalPremium)}</div></div>
            </div>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 160 }}>
          <option value="all">{t('product.filterAll')}</option>
          {['Travelers', 'Liberty Mutual', 'Nationwide', 'Chubb', 'AIG', 'Zurich'].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {[['totalPremium', t('kpi.premium')],['premiumGrowth', t('kpi.growth')],['lossRatio', t('product.sortLossRatio')],['renewalRate', t('kpi.renewalRate')]].map(([k, l]) => (
            <button key={k} onClick={() => setSortKey(k as any)} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: sortKey === k ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.4)', background: sortKey === k ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.5)', color: sortKey === k ? '#0058BC' : '#717786', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Product table */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {[t('kpi.productName'), t('kpi.insurer'), t('kpi.line'), t('kpi.premium'), t('kpi.growth'), t('kpi.policies'), t('kpi.avgPremium'), t('kpi.lossRatio'), t('kpi.renewalRate'), t('kpi.topState')].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const lrColor = p.lossRatio > 0.65 ? '#C0392B' : p.lossRatio > 0.60 ? '#B06000' : '#1E8033'
              const rrColor = p.renewalRate > 0.9 ? '#1E8033' : p.renewalRate > 0.87 ? '#B06000' : '#C0392B'
              return (
                <tr key={p.productId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
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
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{(p.policyCount ?? 0).toLocaleString()}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555', fontSize: 12 }}>${(p.avgPremium ?? 0).toLocaleString()}</td>
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
      <Card>
        <SectionTitle>{t('product.chartMonthly')}</SectionTitle>
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
  const { t } = useTranslation('analytics')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const { data: regRes } = useAnalyticsRegional()
  const regData: any = regRes?.data ?? {}
  const statePerformance: any[] = regData?.state_performance ?? []
  const regionSummary: any[] = regData?.region_summary ?? []
  const regionalMonthly: any[] = regData?.regional_monthly ?? []
  const regionStates = selectedRegion ? statePerformance.filter((s: any) => s.region === selectedRegion).sort((a: any, b: any) => (b.total_premium || b.totalPremium || 0) - (a.total_premium || a.totalPremium || 0)) : [...statePerformance].sort((a: any, b: any) => (b.total_premium || b.totalPremium || 0) - (a.total_premium || a.totalPremium || 0)).slice(0, 8)

  return (
    <div>
      {/* Region summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {regionSummary.map(r => {
          const color = REGION_COLORS[r.region]
          return (
            <div key={r.region} onClick={() => setSelectedRegion(selectedRegion === r.region ? null : r.region)} style={{ borderRadius: 14, padding: '14px 16px', border: selectedRegion === r.region ? `2px solid ${color}` : '1px solid rgba(193,198,215,0.35)', background: selectedRegion === r.region ? `${color}08` : 'rgba(255,255,255,0.5)', cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{r.region}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(r.totalPremium)}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 11 }}>
                <span style={{ color: '#717786' }}>{t('regional.statesCount', { n: r.stateCount })}</span>
                <span style={{ color: '#717786' }}>·</span>
                <span style={{ color: '#1E8033' }}>+{pct(r.avgGrowth)}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: '#717786' }}>{t('regional.lossRatioLabel')}<span style={{ fontWeight: 700, color: r.avgLossRatio > 0.65 ? '#C0392B' : '#555' }}>{pct(r.avgLossRatio)}</span></div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Regional trend chart */}
        <Card>
          <SectionTitle>{t('regional.chartMonthly')}</SectionTitle>
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
        <Card>
          <SectionTitle>{t('regional.chartCompare')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionSummary} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `$${v / 1e6}M`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.4, 0.8]} />
              <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [name === 'avgLossRatio' ? pct(v) : fmt(v), name === 'avgLossRatio' ? t('kpi.lossRatio') : t('kpi.premiumShort')]} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="totalPremium" name={t('kpi.premiumShort')} radius={[4, 4, 0, 0]}>
                {regionSummary.map((e, i) => <Cell key={i} fill={REGION_COLORS[e.region]} fillOpacity={0.8} />)}
              </Bar>
              <Line yAxisId="right" type="monotone" dataKey="avgLossRatio" name={t('kpi.lossRatio')} stroke="#FF3B30" strokeWidth={2} dot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* State detail table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{selectedRegion ? t('regional.stateDetail', { region: selectedRegion }) : t('regional.top8States')}</span>
          {selectedRegion && <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setSelectedRegion(null)}>{t('regional.viewAll')}</button>}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {[t('kpi.state'), t('kpi.region'), t('kpi.premium'), t('kpi.growth'), t('kpi.policies'), t('kpi.lossRatio'), t('kpi.topInsurer'), t('kpi.channels')].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regionStates.map((s, i) => {
              const rColor = REGION_COLORS[s.region]
              return (
                <tr key={s.state} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: 16, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>{s.state}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 11, fontWeight: 700, background: `${rColor}12`, color: rColor, borderRadius: 5, padding: '2px 7px' }}>{s.region}</span></td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0058BC' }}>{fmt(s.totalPremium)}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1E8033', fontSize: 12.5 }}>+{pct(s.growthRate)}</td>
                  <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{(s.policyCount ?? 0).toLocaleString()}</td>
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
  const { t } = useTranslation('analytics')
  const [selectedTier, setSelectedTier] = useState<string>('all')
  const { data: chanRes } = useAnalyticsChannels()
  const channelPerfData: any[] = chanRes?.data ?? []
  const channelMonthly: any[] = chanRes?.data?.monthly ?? []
  const tierColors: Record<string, { bg: string; color: string }> = {
    Platinum: { bg: 'rgba(175,82,222,0.12)', color: '#7B3FCA' },
    Gold:     { bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
    Silver:   { bg: 'rgba(180,180,180,0.15)', color: '#717786' },
    Bronze:   { bg: 'rgba(150,100,60,0.12)', color: '#8B5E3C' },
  }
  const filtered = channelPerfData.filter((c: any) => selectedTier === 'all' || c.tier === selectedTier)
  const totalPremium = channelPerfData.reduce((s: number, c: any) => s + (c.total_premium || c.totalPremium || 0), 0)

  return (
    <div>
      {/* Tier KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {(['Platinum', 'Gold', 'Silver', 'Bronze'] as const).map(tier => {
          const cs = channelPerfData.filter(c => c.tier === tier)
          const tc = tierColors[tier]
          return (
            <div key={tier} onClick={() => setSelectedTier(selectedTier === tier ? 'all' : tier)} style={{ borderRadius: 14, padding: '14px 16px', border: selectedTier === tier ? `2px solid ${tc.color}` : '1px solid rgba(193,198,215,0.35)', background: selectedTier === tier ? `${tc.color}08` : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Badge bg={tc.bg} color={tc.color}>{tier}</Badge>
                <span style={{ fontSize: 11, color: '#A0A5B1' }}>{t('channel.insurersCount', { n: cs.length })}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: tc.color, fontFamily: "'JetBrains Mono', monospace" }}>
                {fmt(cs.reduce((s, c) => s + c.totalPremium, 0))}
              </div>
              <div style={{ fontSize: 11, color: '#717786', marginTop: 3 }}>
                {t('channel.shareOf', { v: pct(cs.reduce((s, c) => s + c.totalPremium, 0) / totalPremium) })}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Channel premium bar */}
        <Card>
          <SectionTitle>{t('channel.chartRanking')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={filtered.map(c => ({ name: c.channelShort, premium: Math.round(c.totalPremium / 1e5) / 10, tier: c.tier }))} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#A0A5B1' }} width={72} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, t('kpi.premiumShort')]} />
              <Bar dataKey="premium" radius={[0, 4, 4, 0]}>
                {filtered.map((c, i) => <Cell key={i} fill={tierColors[c.tier].color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top channel monthly trend */}
        <Card>
          <SectionTitle>{t('channel.chartMonthly')}</SectionTitle>
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
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {[t('channel.name'), t('kpi.tier'), t('kpi.premiumContribution'), t('kpi.share'), t('kpi.growth'), t('kpi.commission'), t('kpi.lossRatio'), t('kpi.renewalRate'), t('kpi.insurer'), t('kpi.product')].map(h => (
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
                <tr key={c.channelId} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
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
  const { t } = useTranslation('analytics')
  const { data: lossRes } = useAnalyticsLossRatio()
  const { data: overviewRes } = useAnalyticsOverview()
  const lossData: any = lossRes?.data ?? {}
  const overviewData: any = overviewRes?.data ?? {}
  const lossAlerts: any[] = lossData?.alerts ?? []
  const lossRatioTrend: any[] = lossData?.trend ?? []
  const lossRatioByLine: any[] = lossData?.by_line ?? []
  const insurerKPIs: any[] = overviewData?.insurer_kpis ?? []
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
          <span style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t('loss.alerts')}</span>
          <Badge bg="rgba(255,59,48,0.1)" color="#C0392B">{t('loss.criticalCount', { n: lossAlerts.filter(a => a.severity === 'critical').length })}</Badge>
          <Badge bg="rgba(255,159,10,0.1)" color="#B06000">{t('loss.warningCount', { n: lossAlerts.filter(a => a.severity === 'warning').length })}</Badge>
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
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: trendStyle.color }}>{trendStyle.icon}{a.trend === 'rising' ? t('loss.trendRising') : a.trend === 'improving' ? t('loss.trendImproving') : t('loss.trendStable')}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#717786' }}>{t(`alert.${a.id}`)}</span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: sv.color, fontFamily: "'JetBrains Mono', monospace" }}>{pct(a.currentRatio)}</div>
                  <div style={{ fontSize: 11, color: '#A0A5B1' }}>{t('loss.threshold', { v: pct(a.threshold) })}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Loss ratio trend */}
        <Card>
          <SectionTitle>{t('loss.chartTrend')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lossRatioTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.45, 0.75]} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={THRESHOLD} stroke="#FF3B30" strokeDasharray="6 3" strokeWidth={1.5} label={{ value: t('loss.thresholdLine'), position: 'right', fontSize: 10, fill: '#FF3B30' }} />
              {Object.entries(INSURER_COLORS).map(([name, color]) => (
                <Line key={name} type="monotone" dataKey={name} stroke={color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Loss ratio by line */}
        <Card>
          <SectionTitle>{t('loss.chartByLine')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={lossRatioByLine} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="line" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.35, 0.80]} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={THRESHOLD} stroke="#FF3B30" strokeDasharray="5 3" strokeWidth={1} />
              <Bar dataKey="ratio" name={t('loss.actualRatio')} radius={[4, 4, 0, 0]}>
                {lossRatioByLine.map((e, i) => <Cell key={i} fill={e.ratio > 0.65 ? '#FF3B30' : e.ratio > 0.60 ? '#FF9F0A' : '#34C759'} fillOpacity={0.85} />)}
              </Bar>
              <Bar dataKey="benchmark" name={t('loss.benchmark')} fill="rgba(193,198,215,0.4)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Per-insurer loss ratio summary */}
      <Card>
        <SectionTitle>{t('loss.summary')}</SectionTitle>
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
  const { t } = useTranslation('analytics')
  const { data: renRes } = useAnalyticsRenewal()
  const { data: overviewRes } = useAnalyticsOverview()
  const renData: any = renRes?.data ?? {}
  const overviewData: any = overviewRes?.data ?? {}
  const renewalTrend: any[] = renData?.trend ?? []
  const renewalCohorts: any[] = renData?.cohorts ?? []
  const renewalByProduct: any[] = renData?.by_product ?? []
  const insurerKPIs: any[] = overviewData?.insurer_kpis ?? []
  const lastCohort = renewalCohorts[renewalCohorts.length - 1] ?? { dueCount: 0, renewedCount: 0, renewalRate: 0, avgPremiumChange: 0 }
  const avgRenewal = insurerKPIs.length ? insurerKPIs.reduce((s: number, k: any) => s + (k.renewal_rate || k.renewalRate || 0), 0) / insurerKPIs.length : 0
  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: t('renewal.kpiOverall'), value: insurerKPIs.length ? pct(avgRenewal) : '-', color: '#0058BC', sub: t('renewal.kpiOverallSub'), up: true },
          { label: t('renewal.kpiDue'), value: (lastCohort.dueCount ?? 0).toLocaleString(), color: '#181C23', sub: t('renewal.kpiDueSub'), up: null },
          { label: t('renewal.kpiRenewed'), value: (lastCohort.renewedCount ?? 0).toLocaleString(), color: '#1E8033', sub: pct(lastCohort.renewalRate), up: true },
          { label: t('renewal.kpiGrowth'), value: '+' + pct(lastCohort.avgPremiumChange), color: '#7B3FCA', sub: t('renewal.kpiGrowthSub'), up: true },
        ].map(s => (
          <Card key={s.label} style={{ background: (s.color === '#0058BC' ? TINT.blue : s.color === '#1E8033' ? TINT.green : s.color === '#181C23' ? TINT.orange : TINT.purple).bg, border: (s.color === '#0058BC' ? TINT.blue : s.color === '#1E8033' ? TINT.green : s.color === '#181C23' ? TINT.orange : TINT.purple).bd }}>
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
        <Card>
          <SectionTitle>{t('renewal.chartTrend')}</SectionTitle>
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
        <Card>
          <SectionTitle>{t('renewal.chartCohort')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renewalCohorts} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#A0A5B1' }} />
              <YAxis tick={{ fontSize: 11, fill: '#A0A5B1' }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="renewedCount" name={t('renewal.renewed')} fill="#34C759" fillOpacity={0.85} stackId="a" />
              <Bar dataKey="cancelledCount" name={t('renewal.cancelled')} fill="#FF9F0A" fillOpacity={0.85} stackId="a" />
              <Bar dataKey="lapsedCount" name={t('renewal.lapsed')} fill="#FF3B30" fillOpacity={0.85} stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insurer renewal comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle>{t('renewal.chartRanking')}</SectionTitle>
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
        <Card>
          <SectionTitle>{t('renewal.chartByProduct')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renewalByProduct} layout="vertical" margin={{ top: 4, right: 40, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#A0A5B1' }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} domain={[0.75, 1.0]} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9.5, fill: '#A0A5B1' }} width={100} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [pct(v), t('kpi.renewalRate')]} />
              <ReferenceLine x={0.85} stroke="#FF9F0A" strokeDasharray="4 3" strokeWidth={1} />
              <Bar dataKey="rate" name={t('kpi.renewalRate')} radius={[0, 4, 4, 0]}>
                {renewalByProduct.map((e, i) => <Cell key={i} fill={e.rate > 0.90 ? '#34C759' : e.rate > 0.87 ? '#FF9F0A' : '#FF3B30'} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Cohort table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t('renewal.cohortDetail')}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
              {[t('renewal.period'), t('renewal.dueCount'), t('renewal.renewed'), t('renewal.cancelled'), t('renewal.lapsed'), t('kpi.renewalRate'), t('renewal.avgPremiumChange')].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...renewalCohorts].reverse().map((c, i) => (
              <tr key={c.period} style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' }}>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: '#0058BC' }}>{c.period}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", color: '#555' }}>{(c.dueCount ?? 0).toLocaleString()}</td>
                <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#1E8033' }}>{(c.renewedCount ?? 0).toLocaleString()}</td>
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
  { id: 'overview',  icon: <BarChart2 size={15} /> },
  { id: 'product',   icon: <TrendingUp size={15} /> },
  { id: 'regional',  icon: <Map size={15} /> },
  { id: 'channel',   icon: <Users size={15} /> },
  { id: 'loss',      icon: <Shield size={15} /> },
  { id: 'renewal',   icon: <RefreshCw size={15} /> },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  navigateTo: (view: ViewId) => void
}

export default function InsurerAnalyticsView({ navigateTo: _navigateTo }: Props) {
  const { t } = useTranslation('analytics')
  const [tab, setTab] = useState<TabId>('overview')
  const [period, setPeriod] = useState('2026-08')
  const { data: lossRes } = useAnalyticsLossRatio()
  const lossAlerts: any[] = lossRes?.data?.alerts ?? []
  const criticalAlerts = lossAlerts.filter((a: any) => a.severity === 'critical').length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('header.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 3 }}>{t('header.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {criticalAlerts > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', fontSize: 12.5, fontWeight: 600, color: '#C0392B' }}>
              <AlertTriangle size={13} /> {t('header.criticalAlerts', { n: criticalAlerts })}
            </div>
          )}
          <select value={period} onChange={e => setPeriod(e.target.value)} className="input-glass" style={{ fontSize: 12.5, minWidth: 120 }}>
            {['2026-08', '2026-07', '2026-Q3', '2026-Q2', '2026-H1'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, background: 'rgba(0,88,188,0.08)', color: '#0058BC', border: '1px solid rgba(0,88,188,0.2)', cursor: 'pointer' }}>
            <Download size={13} /> {t('header.export')}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '0.5px solid rgba(193,198,215,0.4)' }}>
        {TABS.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: '10px 10px 0 0', fontSize: 13, fontWeight: tab === item.id ? 700 : 500, background: tab === item.id ? 'rgba(0,88,188,0.08)' : 'transparent', color: tab === item.id ? '#0058BC' : '#717786', border: tab === item.id ? '0.5px solid rgba(0,88,188,0.2)' : '0.5px solid transparent', borderBottom: tab === item.id ? '2px solid #0058BC' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            {item.icon}
            {t(`tabs.${item.id}`)}
            {item.id === 'loss' && criticalAlerts > 0 && (
              <span style={{ background: '#FF3B30', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 8, padding: '1px 5px', lineHeight: 1.4 }}>{criticalAlerts}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview'  && <OverviewTab />}
      {tab === 'product'   && <ProductAnalyticsTab />}
      {tab === 'regional'  && <RegionalAnalyticsTab />}
      {tab === 'channel'   && <ChannelAnalyticsTab />}
      {tab === 'loss'      && <LossRatioTab />}
      {tab === 'renewal'   && <RenewalAnalyticsTab />}
    </div>
  )
}
