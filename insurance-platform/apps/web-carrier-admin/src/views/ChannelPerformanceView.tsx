import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import {
  TrendingDown,
  Trophy,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

type MetricKey = 'premium' | 'policies' | 'renewal' | 'commission';
type RankChange = 'up' | 'down' | 'flat';
type RiskLevel = 'low' | 'medium' | 'high';

interface AgentRank {
  id: string;
  name: string;
  org: string;
  bizLine: string;
  premium: number;
  policies: number;
  renewalRate: number;
  commission: number;
  lossRatio: number;
  rank: number;
  prevRank: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  riskScore: number;
  riskLevel: RiskLevel;
  goal: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data — aligned with V1.3 prototype
const agents: AgentRank[] = [
  { id: 'a1', name: 'Jennifer Walsh', org: 'Pacific Coast Agency', bizLine: 'AUTO', premium: 1820000, policies: 94, renewalRate: 91, commission: 218400, lossRatio: 58, rank: 1, prevRank: 2, score: 94, grade: 'A', riskScore: 12, riskLevel: 'low', goal: 1600000 },
  { id: 'a2', name: 'Michael Torres', org: 'Pacific Coast Agency', bizLine: 'AUTO', premium: 1560000, policies: 78, renewalRate: 88, commission: 187200, lossRatio: 61, rank: 2, prevRank: 1, score: 88, grade: 'A', riskScore: 18, riskLevel: 'low', goal: 1500000 },
  { id: 'a3', name: 'Amy Park', org: 'SunState MGA Partners', bizLine: 'HOME', premium: 2340000, policies: 62, renewalRate: 86, commission: 351000, lossRatio: 64, rank: 3, prevRank: 4, score: 85, grade: 'A', riskScore: 22, riskLevel: 'low', goal: 2000000 },
  { id: 'a4', name: 'Lisa Wong', org: 'CalFirst Agents Network', bizLine: 'LIFE', premium: 980000, policies: 48, renewalRate: 84, commission: 489000, lossRatio: 66, rank: 4, prevRank: 3, score: 76, grade: 'B', riskScore: 35, riskLevel: 'medium', goal: 1200000 },
  { id: 'a5', name: 'David Martinez', org: 'Mountain West FMO', bizLine: 'HEALTH', premium: 760000, policies: 211, renewalRate: 79, commission: 60800, lossRatio: 71, rank: 5, prevRank: 6, score: 68, grade: 'B', riskScore: 51, riskLevel: 'medium', goal: 900000 },
  { id: 'a6', name: 'Sarah Johnson', org: 'Northeast Brokers', bizLine: 'COMMERCIAL', premium: 480000, policies: 31, renewalRate: 74, commission: 48000, lossRatio: 73, rank: 6, prevRank: 5, score: 59, grade: 'C', riskScore: 68, riskLevel: 'high', goal: 800000 },
  { id: 'a7', name: 'Robert Kim', org: 'Pacific Coast Agency', bizLine: 'AUTO', premium: 320000, policies: 24, renewalRate: 70, commission: 38400, lossRatio: 77, rank: 7, prevRank: 9, score: 52, grade: 'C', riskScore: 74, riskLevel: 'high', goal: 600000 },
];

const monthlyData = [
  { month: 'Jan', premium: 820 },
  { month: 'Feb', premium: 920 },
  { month: 'Mar', premium: 1100 },
  { month: 'Apr', premium: 980 },
  { month: 'May', premium: 1240 },
  { month: 'Jun', premium: 1380 },
  { month: 'Jul', premium: 1520 },
  { month: 'Aug', premium: 1820 },
];

// Free-text risk factors: zh byte-identical to prototype, parallel en values
const riskFactors: Record<string, { zh: string; en: string }[]> = {
  'Sarah Johnson': [
    { zh: '业绩连续3月下滑', en: 'Performance down 3 months in a row' },
    { zh: '活跃度降低', en: 'Decreasing activity' },
    { zh: '赔付率偏高', en: 'Loss ratio above target' },
  ],
  'Robert Kim': [
    { zh: '续保率持续下降', en: 'Renewal rate keeps declining' },
    { zh: '牌照即将到期', en: 'License expiring soon' },
    { zh: '3个月无新保单', en: 'No new policies for 3 months' },
  ],
  'Lisa Wong': [
    { zh: '业绩未达目标', en: 'Performance below target' },
    { zh: '成交率下降', en: 'Closing rate declining' },
  ],
  'David Martinez': [
    { zh: '投诉率上升', en: 'Complaint rate rising' },
    { zh: '赔付率偏高', en: 'Loss ratio above target' },
  ],
};

const kpiIndicators = [
  { key: 'indPremium', weight: 35, unit: '$', direction: 'higher', target: 1500000, current: 1820000 },
  { key: 'indRenewal', weight: 25, unit: '%', direction: 'higher', target: 88, current: 91 },
  { key: 'indLoss', weight: 20, unit: '%', direction: 'lower', target: 65, current: 58 },
  { key: 'indPolicies', weight: 12, unit: '#', direction: 'higher', target: 80, current: 94 },
  { key: 'indComplaint', weight: 8, unit: '%', direction: 'lower', target: 2, current: 0.5 },
] as const;

const leaderboardLines = [
  { line: 'AUTO', top: [{ name: 'Jennifer Walsh', v: '$1.82M' }, { name: 'Mike Torres', v: '$1.56M' }, { name: 'Robert Kim', v: '$320K' }] },
  { line: 'HOME', top: [{ name: 'Amy Park', v: '$2.34M' }, { name: 'Carol Lee', v: '$1.12M' }, { name: 'James Chen', v: '$890K' }] },
  { line: 'LIFE', top: [{ name: 'Lisa Wong', v: '$980K' }, { name: 'Tom Davis', v: '$760K' }, { name: 'Nina Patel', v: '$540K' }] },
];

const QUARTERS = ['Q3 2026', 'Q2 2026', 'Q1 2026', 'FY 2025'];

const METRICS: Array<{ id: MetricKey; key: string }> = [
  { id: 'premium', key: 'perf2.metricPremium' },
  { id: 'policies', key: 'perf2.metricPolicies' },
  { id: 'renewal', key: 'perf2.metricRenewal' },
  { id: 'commission', key: 'perf2.metricCommission' },
];

const GRADE_COLOR: Record<string, string> = { A: '#1A7A2E', B: '#0058BC', C: '#A05C00', D: '#C0392B' };
const RISK_COLOR: Record<RiskLevel, string> = { high: '#C0392B', medium: '#A05C00', low: '#1A7A2E' };
const MEDAL_COLOR = ['#B8860B', '#888888', '#B87333'];

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(193,198,215,0.6)',
    borderRadius: 8,
    fontSize: 12,
  },
};

function fmt(n: number) {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `$${(n / 1e3).toFixed(0)}K` : `$${n}`;
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────

function LeaderboardTab() {
  const { t } = useTranslation('channel');
  const [period, setPeriod] = useState('Q3 2026');
  const [dim, setDim] = useState<MetricKey>('premium');

  const rankIcon = (rank: number, prev: number) => {
    if (rank < prev) return <ArrowUp size={11} className="text-[#1A7A2E]" />;
    if (rank > prev) return <ArrowDown size={11} className="text-[#C0392B]" />;
    return <Minus size={11} className="text-[#A0A5B4]" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="input-glass font-data"
        >
          {QUARTERS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <div className="flex rounded-lg border-[0.5px] border-[rgba(193,198,215,0.38)] bg-white/40 overflow-hidden">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setDim(m.id)}
              className={`px-3 py-1.5 text-xs border-r-[0.5px] border-[rgba(193,198,215,0.38)] last:border-r-0 transition-colors ${
                dim === m.id ? 'bg-[#0058BC] text-white font-bold' : 'text-[#414755] font-medium hover:bg-white/60'
              }`}
            >
              {t(m.key)}
            </button>
          ))}
        </div>
        <button className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold bg-white/45 border-[0.5px] border-[rgba(193,198,215,0.38)] text-[#414755] hover:bg-white/70 transition-colors whitespace-nowrap">
          <Download size={12} />
          {t('perf2.btnExportBoard')}
        </button>
      </div>

      {/* Line leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {leaderboardLines.map((ll) => (
          <div key={ll.line} className="glass rounded-xl overflow-hidden">
            <div className="px-3.5 py-2.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-[rgba(0,88,188,0.09)] text-[#0058BC]">{ll.line}</span>
              <span className="text-[13px] font-bold text-[#181C23]">{t('perf2.boardTitle')}</span>
            </div>
            {ll.top.map((a, i) => (
              <div
                key={a.name}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] last:border-b-0 ${i === 0 ? 'bg-[rgba(255,215,0,0.05)]' : ''}`}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
                  style={{
                    background: i === 0 ? 'rgba(184,134,11,0.15)' : i === 1 ? 'rgba(150,150,150,0.12)' : 'rgba(184,115,51,0.1)',
                    color: MEDAL_COLOR[i],
                  }}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-[12.5px] font-bold text-[#181C23] truncate">{a.name}</span>
                <span className={`font-mono text-[13px] font-extrabold ${i === 0 ? 'text-[#B8860B]' : 'text-[#0058BC]'}`}>{a.v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Full ranking table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-3.5 py-2.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] flex items-center gap-1.5">
          <Trophy size={14} className="text-[#0058BC]" />
          <span className="font-bold text-[13.5px] text-[#181C23]">{t('perf2.tableTitle', { quarter: period })}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(236,237,249,0.5)]">
                {[
                  'perf2.colRank',
                  'perf2.colAgent',
                  'perf2.colOrg',
                  'perf2.colBizLine',
                  'perf2.colPerf',
                  'perf2.colPolicies',
                  'perf2.colRenewal',
                  'perf2.colLoss',
                  'perf2.colGrade',
                  'perf2.colRisk',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[#A0A5B4] whitespace-nowrap">
                    {t(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(193,198,215,0.38)]">
              {agents.map((a, i) => (
                <tr key={a.id} className={`hover:bg-[rgba(0,88,188,0.03)] transition-colors ${i === 0 ? 'bg-[rgba(255,215,0,0.04)]' : ''}`}>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1">
                      <span className={`font-mono text-sm font-extrabold ${i < 3 ? '' : 'text-[#181C23]'}`} style={i < 3 ? { color: MEDAL_COLOR[i] } : undefined}>
                        {a.rank}
                      </span>
                      {rankIcon(a.rank, a.prevRank)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-bold text-[#181C23] whitespace-nowrap">{a.name}</td>
                  <td className="px-3 py-2.5 text-xs text-[#717786] whitespace-nowrap">{a.org.split(' ').slice(0, 2).join(' ')}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[rgba(0,88,188,0.09)] text-[#0058BC]">{a.bizLine}</span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] font-extrabold text-[#0058BC] whitespace-nowrap">{fmt(a.premium)}</td>
                  <td className="px-3 py-2.5 font-mono text-[13px] font-bold text-[#181C23]">{a.policies}</td>
                  <td className={`px-3 py-2.5 font-mono text-[13px] font-bold whitespace-nowrap ${a.renewalRate >= 90 ? 'text-[#1A7A2E]' : a.renewalRate >= 85 ? 'text-[#A05C00]' : 'text-[#C0392B]'}`}>
                    {a.renewalRate}%
                  </td>
                  <td className={`px-3 py-2.5 font-mono text-[13px] font-bold whitespace-nowrap ${a.lossRatio > 70 ? 'text-[#C0392B]' : a.lossRatio > 65 ? 'text-[#A05C00]' : 'text-[#1A7A2E]'}`}>
                    {a.lossRatio}%
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[7px] font-extrabold text-[13px] border-[1.5px]"
                      style={{ background: `${GRADE_COLOR[a.grade]}15`, color: GRADE_COLOR[a.grade], borderColor: `${GRADE_COLOR[a.grade]}30` }}
                    >
                      {a.grade}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-12 h-[5px] bg-[rgba(193,198,215,0.25)] rounded-full overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: `${a.riskScore}%`, background: RISK_COLOR[a.riskLevel] }} />
                      </span>
                      <span className="font-mono text-[11px] font-bold" style={{ color: RISK_COLOR[a.riskLevel] }}>{a.riskScore}</span>
                    </span>
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

// ─── Personal Dashboard Tab ───────────────────────────────────────────────────

function PersonalDashboard() {
  const { t } = useTranslation('channel');
  const agent = agents[0];
  const progressPct = agent.premium / agent.goal;
  const rankDelta = Math.abs(agent.rank - agent.prevRank);

  const kpiTiles = [
    { labelKey: 'perf2.personal.kpiPremium', value: fmt(agent.premium), color: '#0058BC', sub: t('perf2.personal.goalPrefix', { v: fmt(agent.goal) }) },
    { labelKey: 'perf2.personal.kpiCommission', value: fmt(agent.commission), color: '#1A7A2E', sub: t('perf2.personal.commissionRate', { v: ((agent.commission / agent.premium) * 100).toFixed(1) }) },
    { labelKey: 'perf2.personal.kpiRenewal', value: `${agent.renewalRate}%`, color: agent.renewalRate >= 90 ? '#1A7A2E' : '#A05C00', sub: t('perf2.personal.renewalGoal') },
    { labelKey: 'perf2.personal.kpiLoss', value: `${agent.lossRatio}%`, color: agent.lossRatio > 65 ? '#A05C00' : '#1A7A2E', sub: t('perf2.personal.lossGoal') },
    { labelKey: 'perf2.personal.kpiPolicies', value: String(agent.policies), color: '#181C23', sub: t('perf2.personal.policiesGoal') },
    { labelKey: 'perf2.personal.kpiScore', value: String(agent.score), color: '#0058BC', sub: t('perf2.personal.scoreGoal') },
  ];

  const periods = ['periodMonth', 'periodQuarter', 'periodYear', 'periodCustom'];
  const activePeriod = 'periodQuarter';

  return (
    <div className="space-y-4">
      {/* Agent selector */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[12.5px] text-[#717786]">{t('perf2.personal.viewing')}</span>
        <select defaultValue={agent.id} className="input-glass">
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        <div className="flex rounded-lg border-[0.5px] border-[rgba(193,198,215,0.38)] bg-white/40 overflow-hidden">
          {periods.map((p) => (
            <button
              key={p}
              className={`px-3 py-[5px] text-xs transition-colors ${
                p === activePeriod ? 'bg-[#0058BC] text-white font-bold' : 'text-[#414755] font-medium hover:bg-white/60'
              }`}
            >
              {t(`perf2.personal.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Hero card */}
      <div className="glass rounded-xl px-6 py-5" style={{ background: 'linear-gradient(135deg, rgba(0,88,188,0.08) 0%, rgba(96,205,255,0.05) 100%)' }}>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0058BC, #60CDFF)' }}>
              {agent.name[0]}
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#181C23]">{agent.name}</div>
              <div className="text-[12.5px] text-[#717786] mt-0.5">{agent.org} · {agent.bizLine} · {t('perf2.personal.gradeLabel')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] font-extrabold bg-[#1A7A2E]/8 border-2 border-[#1A7A2E]/30 text-[#1A7A2E]">
              {agent.grade}
            </div>
            <div className="text-right">
              <div className="font-mono text-[28px] font-extrabold text-[#181C23] leading-none">#{agent.rank}</div>
              <div className={`flex items-center justify-end gap-1 text-[11.5px] ${agent.rank < agent.prevRank ? 'text-[#1A7A2E]' : 'text-[#C0392B]'}`}>
                {agent.rank < agent.prevRank ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                {rankDelta} {rankDelta === 1 ? t('perf2.personal.positionOne') : t('perf2.personal.positionMany')}
              </div>
            </div>
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpiTiles.map((k) => (
            <div key={k.labelKey} className="px-3.5 py-3 rounded-[11px] bg-white/45 border-[0.5px] border-[rgba(193,198,215,0.3)]">
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#A0A5B4] mb-1 whitespace-nowrap">{t(k.labelKey)}</p>
              <p className="font-mono text-xl font-extrabold leading-none" style={{ color: k.color }}>{k.value}</p>
              <p className="text-[11px] text-[#A0A5B4] mt-1 whitespace-nowrap">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Goal progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-bold text-[#181C23]">{t('perf2.personal.goalProgress')}</span>
            <span className={`font-mono font-extrabold ${progressPct >= 1 ? 'text-[#1A7A2E]' : 'text-[#0058BC]'}`}>{(progressPct * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-[rgba(193,198,215,0.3)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, progressPct * 100)}%`,
                background: progressPct >= 1 ? '#1A7A2E' : 'linear-gradient(90deg, #0058BC, #60CDFF)',
              }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#A0A5B4] mt-1">
            <span>{t('perf2.personal.achieved', { v: fmt(agent.premium) })}</span>
            <span>{t('perf2.personal.goalValue', { v: fmt(agent.goal) })}</span>
          </div>
        </div>
      </div>

      {/* Trend chart + KPI score breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4">
        <div className="glass rounded-xl p-4 sm:p-5 min-w-0 overflow-hidden">
          <h3 className="text-[13px] font-bold text-[#181C23] mb-4">{t('perf2.personal.trendTitle')}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 14, right: 8, bottom: 0, left: -22 }}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#A0A5B4' }} interval={0} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`$${v}K`, '']} />
              <Bar dataKey="premium" fill="#0058BC" radius={[4, 4, 0, 0]} barSize={18}>
                <LabelList dataKey="premium" position="top" formatter={(v: number) => `$${v}K`} style={{ fontSize: 9, fill: '#0058BC', fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-xl p-4 sm:p-5 min-w-0">
          <h3 className="text-[13px] font-bold text-[#181C23] mb-3.5">{t('perf2.personal.scoreTitle')}</h3>
          {kpiIndicators.map((ind) => {
            const isGood = ind.direction === 'higher' ? ind.current >= ind.target : ind.current <= ind.target;
            const pct = ind.direction === 'higher' ? Math.min(1, ind.current / ind.target) : Math.min(1, ind.target / ind.current);
            const display = ind.unit === '%' ? `${ind.current}%` : ind.unit === '$' ? fmt(ind.current) : String(ind.current);
            return (
              <div key={ind.key} className="mb-3 last:mb-0">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#181C23]">{t(`perf2.personal.${ind.key}`)}</span>
                  <span className="text-[#717786]">{t('perf2.personal.weight', { v: ind.weight })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-[5px] bg-[rgba(193,198,215,0.25)] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: isGood ? '#1A7A2E' : '#A05C00' }} />
                  </div>
                  <span className={`font-mono text-[11px] font-extrabold text-right min-w-[40px] ${isGood ? 'text-[#1A7A2E]' : 'text-[#A05C00]'}`}>
                    {display}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Risk Watch Tab ───────────────────────────────────────────────────────────

function RiskWatchTab() {
  const { t, i18n } = useTranslation('channel');
  const isEn = i18n.language.startsWith('en');
  const highRisk = agents.filter((a) => a.riskLevel === 'high');
  const medRisk = agents.filter((a) => a.riskLevel === 'medium');

  const statCards = [
    { labelKey: 'perf2.risk.highRisk', v: highRisk.length, color: '#C0392B', icon: <AlertTriangle size={15} color="#C0392B" /> },
    { labelKey: 'perf2.risk.medRisk', v: medRisk.length, color: '#A05C00', icon: <AlertTriangle size={15} color="#A05C00" /> },
    { labelKey: 'perf2.risk.lowRisk', v: agents.filter((a) => a.riskLevel === 'low').length, color: '#1A7A2E', icon: <Trophy size={15} color="#1A7A2E" /> },
  ];

  return (
    <div className="space-y-4">
      {/* Risk stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div key={s.labelKey} className="glass rounded-xl px-4 py-3.5 flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: `${s.color}12` }}>
              {s.icon}
            </div>
            <div>
              <div className="font-mono text-[22px] font-extrabold leading-none" style={{ color: s.color }}>{s.v}</div>
              <div className="text-[11.5px] text-[#717786] mt-0.5">{t(s.labelKey)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Watchlist */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-3.5 py-2.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] font-bold text-[13px] text-[#181C23]">
          {t('perf2.risk.watchlistTitle')}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(236,237,249,0.5)]">
                {[
                  'perf2.colAgent',
                  'perf2.colOrg',
                  'perf2.risk.colRiskScore',
                  'perf2.risk.colRiskLevel',
                  'perf2.risk.colFactors',
                  'perf2.risk.colTrend',
                  'perf2.risk.colActions',
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[#A0A5B4] whitespace-nowrap">
                    {t(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(193,198,215,0.38)]">
              {agents.filter((a) => a.riskLevel !== 'low').map((a) => {
                const riskColor = RISK_COLOR[a.riskLevel];
                const factors = riskFactors[a.name] ?? [{ zh: '业绩下滑', en: 'Performance decline' }];
                return (
                  <tr key={a.id} className={`transition-colors ${a.riskLevel === 'high' ? 'bg-[rgba(255,59,48,0.03)]' : ''}`}>
                    <td className="px-3 py-2.5 text-[13px] font-bold text-[#181C23] whitespace-nowrap">{a.name}</td>
                    <td className="px-3 py-2.5 text-xs text-[#717786] whitespace-nowrap">{a.org.split(' ').slice(0, 2).join(' ')}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-[60px] h-[5px] bg-[rgba(193,198,215,0.2)] rounded-full overflow-hidden">
                          <span className="block h-full rounded-full" style={{ width: `${a.riskScore}%`, background: riskColor }} />
                        </span>
                        <span className="font-mono text-xs font-extrabold" style={{ color: riskColor }}>{a.riskScore}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap" style={{ background: `${riskColor}12`, color: riskColor }}>
                        {a.riskLevel === 'high' ? t('perf2.risk.highBadge') : t('perf2.risk.medBadge')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {factors.map((f) => (
                          <span
                            key={f.zh}
                            className="text-[11px] px-[7px] py-0.5 rounded-md border-[0.5px]"
                            style={{ background: `${riskColor}09`, color: riskColor, borderColor: `${riskColor}25` }}
                          >
                            {isEn ? f.en : f.zh}
                          </span>
                        ))}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 text-[11.5px] text-[#C0392B] whitespace-nowrap">
                        <TrendingDown size={12} />
                        {t('perf2.risk.trendDeclining')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex gap-1.5">
                        <button className="px-2.5 py-[3px] rounded-md text-[11px] font-bold bg-[rgba(0,88,188,0.09)] text-[#0058BC] border-[0.5px] border-[rgba(0,88,188,0.2)] hover:bg-[rgba(0,88,188,0.15)] transition-colors whitespace-nowrap">
                          {t('perf2.risk.intervene')}
                        </button>
                        <button className="px-2.5 py-[3px] rounded-md text-[11px] font-bold bg-transparent text-[#717786] border-[0.5px] border-[rgba(193,198,215,0.38)] hover:bg-white/60 transition-colors whitespace-nowrap">
                          {t('perf2.risk.view')}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ChannelPerformanceView({ navigateTo }: Props) {
  void navigateTo;
  const { t } = useTranslation('channel');
  const [activeTab, setActiveTab] = useState<'ranking' | 'individual' | 'churn'>('ranking');
  const highRiskCount = agents.filter((a) => a.riskLevel === 'high').length;

  const tabs: { key: 'ranking' | 'individual' | 'churn'; labelKey: string; badge?: number }[] = [
    { key: 'ranking', labelKey: 'perf2.tabRanking' },
    { key: 'individual', labelKey: 'perf2.tabIndividual' },
    { key: 'churn', labelKey: 'perf2.tabChurn', badge: highRiskCount },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="mb-1" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('perf2.title')}</h1>
        <p className="text-[12.5px] text-[#717786] mb-5">{t('perf2.subtitle')}</p>

        {/* Tabs */}
        <div className="tab-bar mb-5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {t(tab.labelKey)}
              {tab.badge ? (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C0392B] text-white text-[10px] font-extrabold">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {activeTab === 'ranking' && <LeaderboardTab />}
        {activeTab === 'individual' && <PersonalDashboard />}
        {activeTab === 'churn' && <RiskWatchTab />}
      </div>
    </div>
  );
}
