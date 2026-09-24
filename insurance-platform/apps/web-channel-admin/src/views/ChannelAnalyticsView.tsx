import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import {
  BarChart3,
  Layers,
  Map,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronRight,
} from 'lucide-react';

type AnalyticsTab = 'overview' | 'compare' | 'region';
type SortKey = 'premium' | 'growth' | 'lossRatio';

interface MonthlyDatum {
  month: string;
  premium: number;
  commission: number;
}

interface BusinessLine {
  line: string;
  premium: number;
  share: number;
  color: string;
}

interface ChannelRow {
  channel: string;
  line: string;
  premium: number;
  growth: number;
  policyCount: number;
  lossRatio: number;
  agents: number;
  share: number;
}

interface StateRow {
  state: string;
  premium: number;
  agents: number;
  growth: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data — aligned with V1.3 prototype
const byChannel: ChannelRow[] = [
  { channel: 'Pacific Coast Agency', line: 'AUTO', premium: 3200000, growth: 0.18, policyCount: 182, lossRatio: 0.59, agents: 12, share: 0.24 },
  { channel: 'SunState MGA Partners', line: 'HOME', premium: 2840000, growth: 0.12, policyCount: 94, lossRatio: 0.64, agents: 8, share: 0.21 },
  { channel: 'CalFirst Agents Network', line: 'LIFE', premium: 2160000, growth: -0.04, policyCount: 143, lossRatio: 0.61, agents: 15, share: 0.16 },
  { channel: 'Mountain West FMO', line: 'HEALTH', premium: 1880000, growth: 0.22, policyCount: 1240, lossRatio: 0.72, agents: 6, share: 0.14 },
  { channel: 'Northeast Brokers', line: 'COMMERCIAL', premium: 1540000, growth: 0.07, policyCount: 88, lossRatio: 0.66, agents: 9, share: 0.11 },
  { channel: 'Midwest Alliance', line: 'AUTO', premium: 1240000, growth: -0.08, policyCount: 76, lossRatio: 0.68, agents: 7, share: 0.09 },
  { channel: 'Southeast Partners', line: 'HOME', premium: 660000, growth: 0.31, policyCount: 52, lossRatio: 0.55, agents: 4, share: 0.05 },
];

const monthly: MonthlyDatum[] = [
  { month: 'Jan', premium: 8.2, commission: 0.98 },
  { month: 'Feb', premium: 9.1, commission: 1.09 },
  { month: 'Mar', premium: 10.8, commission: 1.3 },
  { month: 'Apr', premium: 9.6, commission: 1.15 },
  { month: 'May', premium: 11.4, commission: 1.37 },
  { month: 'Jun', premium: 12.2, commission: 1.46 },
  { month: 'Jul', premium: 11.8, commission: 1.42 },
  { month: 'Aug', premium: 13.5, commission: 1.62 },
];

const lineBreakdown: BusinessLine[] = [
  { line: 'AUTO', premium: 5180000, share: 39, color: '#0058BC' },
  { line: 'HOME', premium: 3940000, share: 30, color: '#1A7A2E' },
  { line: 'LIFE', premium: 2160000, share: 16, color: '#6B35C2' },
  { line: 'HEALTH', premium: 1880000, share: 14, color: '#A05C00' },
  { line: 'COMMERCIAL', premium: 1540000, share: 12, color: '#0B7C6B' },
];

const stateData: StateRow[] = [
  { state: 'CA', premium: 5800000, agents: 24, growth: 0.14 },
  { state: 'TX', premium: 3200000, agents: 18, growth: 0.08 },
  { state: 'FL', premium: 2100000, agents: 12, growth: 0.22 },
  { state: 'NY', premium: 1800000, agents: 10, growth: -0.03 },
  { state: 'CO', premium: 920000, agents: 6, growth: 0.31 },
  { state: 'WA', premium: 760000, agents: 5, growth: 0.18 },
];

function fmt(n: number) {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(193,198,215,0.6)',
    borderRadius: 8,
    fontSize: 12,
  },
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { t } = useTranslation('channel');
  const totalPremium = byChannel.reduce((s, c) => s + c.premium, 0);

  const kpiCards = [
    { labelKey: 'analytics2.kpi.ytdPremium', v: fmt(totalPremium), delta: '+14.2%', up: true, color: '#0058BC' },
    { labelKey: 'analytics2.kpi.activeChannels', v: String(byChannel.length), delta: '+2 YoY', up: true, color: '#1A7A2E' },
    { labelKey: 'analytics2.kpi.lossRatio', v: '62.4%', delta: '-1.8pp', up: true, color: '#1A7A2E' },
    { labelKey: 'analytics2.kpi.totalCommission', v: '$1.73M', delta: '+11.6%', up: true, color: '#414755' },
  ];

  return (
    <div className="space-y-4">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <div key={k.labelKey} className="glass rounded-xl px-4 py-3.5">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#A0A5B4] whitespace-nowrap">{t(k.labelKey)}</p>
            <p className="font-mono text-[22px] font-extrabold mt-1.5 leading-none" style={{ color: k.color }}>{k.v}</p>
            <p className="flex items-center gap-1 mt-1.5 text-[11.5px]">
              {k.up ? <ArrowUp size={11} className="text-[#1A7A2E]" /> : <ArrowDown size={11} className="text-[#C0392B]" />}
              <span className="font-bold" style={{ color: k.up ? '#1A7A2E' : '#C0392B' }}>{k.delta}</span>
              <span className="text-[#A0A5B4]">YTD</span>
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-4">
        {/* Monthly trend */}
        <div className="glass rounded-xl p-4 sm:p-5 min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-[13px] font-bold text-[#181C23]">{t('analytics2.chart.monthlyTrend')}</h2>
            <div className="flex gap-3 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0058BC]" />
                <span className="text-[#717786]">{t('analytics2.legend.premium')}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1A7A2E]/55" />
                <span className="text-[#717786]">{t('analytics2.legend.commission')}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthly} margin={{ top: 14, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.25)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#A0A5B4' }} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: '#A0A5B4' }} width={40} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`$${v}M`, '']} />
              <Bar dataKey="premium" name={t('analytics2.legend.premium')} fill="#0058BC" radius={[3, 3, 0, 0]} barSize={12}>
                <LabelList dataKey="premium" position="top" formatter={(v: any) => `${v}M`} style={{ fontSize: 9, fill: '#0058BC', fontWeight: 700 }} />
              </Bar>
              <Bar dataKey="commission" name={t('analytics2.legend.commission')} fill="rgba(26,122,46,0.55)" radius={[3, 3, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Business mix */}
        <div className="glass rounded-xl p-4 sm:p-5 min-w-0">
          <h2 className="text-[13px] font-bold text-[#181C23] mb-3.5">{t('analytics2.chart.businessMix')}</h2>
          <div className="space-y-2.5">
            {lineBreakdown.map((l) => (
              <div key={l.line}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1 text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-[#181C23] whitespace-nowrap">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: l.color }} />
                    {l.line}
                  </span>
                  <span className="flex gap-2.5 whitespace-nowrap">
                    <span className="font-extrabold" style={{ color: l.color }}>{l.share}%</span>
                    <span className="text-[#717786]">{fmt(l.premium)}</span>
                  </span>
                </div>
                <div className="h-[5px] bg-[rgba(193,198,215,0.2)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${l.share}%`, background: l.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Channel Analysis Tab ─────────────────────────────────────────────────────

function ChannelAnalysisTab() {
  const { t } = useTranslation('channel');
  const [sort, setSort] = useState<SortKey>('premium');
  const sorted = [...byChannel].sort((a, b) => {
    if (sort === 'premium') return b.premium - a.premium;
    if (sort === 'growth') return b.growth - a.growth;
    return a.lossRatio - b.lossRatio;
  });
  const maxPremium = Math.max(...byChannel.map((c) => c.premium));

  const sortOptions: { key: SortKey; labelKey: string }[] = [
    { key: 'premium', labelKey: 'analytics2.sort.premium' },
    { key: 'growth', labelKey: 'analytics2.sort.growth' },
    { key: 'lossRatio', labelKey: 'analytics2.sort.lossRatio' },
  ];

  return (
    <div className="space-y-3.5">
      {/* Sort selector + export */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-[#717786]">{t('analytics2.sort.label')}</span>
        <div className="flex rounded-lg border-[0.5px] border-[rgba(193,198,215,0.38)] bg-white/40 overflow-hidden">
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={`px-3 py-[5px] text-xs transition-colors ${
                sort === o.key ? 'bg-[#0058BC] text-white font-bold' : 'text-[#414755] font-medium hover:bg-white/60'
              }`}
            >
              {t(o.labelKey)}
            </button>
          ))}
        </div>
        <button className="ml-auto inline-flex items-center gap-1 px-3 py-[5px] rounded-lg text-xs font-bold bg-white/45 border-[0.5px] border-[rgba(193,198,215,0.38)] text-[#414755] hover:bg-white/70 transition-colors">
          <Download size={12} />
          {t('export')}
        </button>
      </div>

      {/* Comparison table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] font-bold text-[13px] text-[#181C23]">
          {t('analytics2.compare.title')}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(236,237,249,0.5)]">
                {[
                  'analytics2.compare.col.channel',
                  'analytics2.compare.col.lob',
                  'analytics2.compare.col.ytdPremium',
                  'analytics2.compare.col.share',
                  'analytics2.compare.col.yoy',
                  'analytics2.compare.col.lossRatio',
                  'analytics2.compare.col.agents',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[#A0A5B4] whitespace-nowrap">
                    {t(h)}
                  </th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(193,198,215,0.38)]">
              {sorted.map((c) => (
                <tr key={c.channel} className="hover:bg-[rgba(0,88,188,0.03)] transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-bold text-[12.5px] text-[#181C23]">{c.channel}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[rgba(0,88,188,0.09)] text-[#0058BC]">
                      {c.line}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-2">
                      <span className="w-[60px] h-[5px] bg-[rgba(193,198,215,0.2)] rounded-full overflow-hidden shrink-0">
                        <span className="block h-full bg-[#0058BC] rounded-full" style={{ width: `${(c.premium / maxPremium) * 100}%` }} />
                      </span>
                      <span className="font-mono text-[13px] font-extrabold text-[#0058BC]">{fmt(c.premium)}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs font-bold text-[#414755] whitespace-nowrap">
                    {(c.share * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {c.growth >= 0 ? <ArrowUp size={11} className="text-[#1A7A2E]" /> : <ArrowDown size={11} className="text-[#C0392B]" />}
                      <span
                        className={`font-mono text-[13px] font-extrabold ${
                          c.growth >= 0.1 ? 'text-[#1A7A2E]' : c.growth < 0 ? 'text-[#C0392B]' : 'text-[#A05C00]'
                        }`}
                      >
                        {c.growth >= 0 ? '+' : ''}
                        {(c.growth * 100).toFixed(0)}%
                      </span>
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2.5 font-mono text-[13px] font-extrabold whitespace-nowrap ${
                      c.lossRatio > 0.7 ? 'text-[#C0392B]' : c.lossRatio > 0.65 ? 'text-[#A05C00]' : 'text-[#1A7A2E]'
                    }`}
                  >
                    {(c.lossRatio * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#414755]">{c.agents}</td>
                  <td className="px-3 py-2.5">
                    <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold bg-[rgba(0,88,188,0.09)] text-[#0058BC] border-[0.5px] border-[rgba(0,88,188,0.2)] hover:bg-[rgba(0,88,188,0.15)] transition-colors whitespace-nowrap">
                      {t('analytics2.compare.details')} <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Geographic Tab ───────────────────────────────────────────────────────────

function GeoTab() {
  const { t } = useTranslation('channel');
  const maxPremium = Math.max(...stateData.map((s) => s.premium));

  const statCards = [
    { labelKey: 'analytics2.geo.statesCovered', v: String(stateData.length), subKey: 'analytics2.geo.nationwide' },
    { labelKey: 'analytics2.geo.largestMarket', v: 'CA', subKey: 'analytics2.geo.largestMarketSub' },
    { labelKey: 'analytics2.geo.fastestGrowing', v: 'CO', sub: '+31% YoY' },
  ];

  return (
    <div className="space-y-3.5">
      <div className="glass rounded-xl px-5 py-4">
        <div className="flex items-center gap-1.5 mb-4">
          <Map size={14} className="text-[#0058BC]" />
          <span className="font-bold text-[13.5px] text-[#181C23]">{t('analytics2.geo.title')}</span>
          <span className="text-[11.5px] text-[#717786] ml-1">{t('analytics2.geo.subtitle')}</span>
        </div>

        {/* Heat bars */}
        <div className="space-y-3">
          {stateData.map((s) => (
            <div key={s.state} className="flex items-center gap-3">
              <span className="font-mono text-[13px] font-extrabold text-[#181C23] w-8 text-center shrink-0">{s.state}</span>
              <div className="flex-1 h-7 bg-[rgba(193,198,215,0.12)] rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg flex items-center pl-2.5 transition-[width] duration-400"
                  style={{ width: `${(s.premium / maxPremium) * 100}%`, background: 'linear-gradient(90deg, rgba(0,88,188,0.8), rgba(0,88,188,0.53))' }}
                >
                  <span className="font-mono text-xs font-extrabold text-white">{fmt(s.premium)}</span>
                </div>
              </div>
              <span className="flex gap-3 min-w-[120px] justify-end whitespace-nowrap">
                <span className="text-xs text-[#717786]">{t('analytics2.geo.agentsCount', { n: s.agents })}</span>
                <span
                  className={`font-mono text-xs font-extrabold ${
                    s.growth >= 0.15 ? 'text-[#1A7A2E]' : s.growth < 0 ? 'text-[#C0392B]' : 'text-[#A05C00]'
                  }`}
                >
                  {s.growth >= 0 ? '+' : ''}
                  {(s.growth * 100).toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map((k) => (
          <div key={k.labelKey} className="glass rounded-xl px-4 py-3.5 text-center">
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#A0A5B4]">{t(k.labelKey)}</p>
            <p className="font-mono text-[22px] font-extrabold text-[#0058BC] mt-1.5">{k.v}</p>
            <p className="text-[11.5px] text-[#717786] mt-1">{'sub' in k && k.sub ? k.sub : t(k.subKey!)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ChannelAnalyticsView({ navigateTo }: Props) {
  void navigateTo;
  const { t } = useTranslation('channel');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const tabs: { key: AnalyticsTab; labelKey: string; icon: React.ReactNode }[] = [
    { key: 'overview', labelKey: 'analytics2.tab.overview', icon: <BarChart3 size={13} /> },
    { key: 'compare', labelKey: 'analytics2.tab.compare', icon: <Layers size={13} /> },
    { key: 'region', labelKey: 'analytics2.tab.region', icon: <Map size={13} /> },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-5">
        <h1 className="mb-1" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('analytics2.title')}</h1>
        <p style={{ fontSize: 12.5, color: '#717786' }}>{t('analytics2.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-4">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-item inline-flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
            >
              {tab.icon}
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'compare' && <ChannelAnalysisTab />}
        {activeTab === 'region' && <GeoTab />}
      </div>
    </div>
  );
}
