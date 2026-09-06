import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import {
  Search, Plus, X, Eye, Copy, MoreHorizontal, Check, Pencil, BarChart3,
  Layers, Zap, Clock, CheckCircle2, Download,
} from 'lucide-react';

type SchemeStatus = 'active' | 'pending' | 'draft' | 'disabled' | 'expired';
type SchemeFeature = 'tier' | 'override' | 'clawback';
type ChannelTypeKey = 'agency' | 'mga' | 'fmo' | 'broker';

interface CommissionScheme {
  id: string;
  name: string;
  code: string;
  channelType: ChannelTypeKey;
  carrier: string;
  bizLine: string;
  firstYearRate: number;
  renewalRates: number[];
  status: SchemeStatus;
  features: SchemeFeature[];
  bindings: number;
  version: number;
  effectiveDate: string;
  minCommission: number;
  maxCommission: number;
  createdBy: string;
  approvedBy: string;
}

interface LadderTier {
  id: number;
  minPremium: number;
  maxPremium: number | null;
  rateMultiplier: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data — aligned with the Figma prototype
const mockSchemes: CommissionScheme[] = [
  {
    id: 'sch-1',
    name: 'Agency Standard — Auto',
    code: 'SCH-AUTO-001',
    channelType: 'agency',
    carrier: 'Pacific Mutual',
    bizLine: 'AUTO',
    firstYearRate: 12,
    renewalRates: [10, 9, 8, 7],
    status: 'active',
    features: ['tier', 'override', 'clawback'],
    bindings: 18,
    version: 3,
    effectiveDate: '2026-01-01',
    minCommission: 50,
    maxCommission: 5000,
    createdBy: 'Emily Chen',
    approvedBy: 'David Kim',
  },
  {
    id: 'sch-2',
    name: 'MGA Premium — Home',
    code: 'SCH-HOME-MGA',
    channelType: 'mga',
    carrier: 'Liberty Shield',
    bizLine: 'HOME',
    firstYearRate: 15,
    renewalRates: [12, 10, 8],
    status: 'active',
    features: ['tier', 'override', 'clawback'],
    bindings: 5,
    version: 2,
    effectiveDate: '2026-02-01',
    minCommission: 75,
    maxCommission: 7500,
    createdBy: 'Emily Chen',
    approvedBy: 'David Kim',
  },
  {
    id: 'sch-3',
    name: 'FMO Elite — Health',
    code: 'SCH-HLTH-FMO',
    channelType: 'fmo',
    carrier: 'Nationwide Plus',
    bizLine: 'HEALTH',
    firstYearRate: 8,
    renewalRates: [6, 5],
    status: 'active',
    features: ['tier', 'clawback'],
    bindings: 3,
    version: 1,
    effectiveDate: '2026-03-15',
    minCommission: 40,
    maxCommission: 3000,
    createdBy: 'Sophia Lin',
    approvedBy: 'David Kim',
  },
  {
    id: 'sch-4',
    name: 'Broker Comm — Commercial',
    code: 'SCH-COMM-BRK',
    channelType: 'broker',
    carrier: 'SafeGuard Re',
    bizLine: 'COMMERCIAL',
    firstYearRate: 10,
    renewalRates: [8, 7, 6, 5, 5],
    status: 'pending',
    features: ['tier', 'override'],
    bindings: 0,
    version: 1,
    effectiveDate: '2026-09-01',
    minCommission: 100,
    maxCommission: 10000,
    createdBy: 'Emily Chen',
    approvedBy: '',
  },
  {
    id: 'sch-5',
    name: 'Life Agent — Term',
    code: 'SCH-LIFE-001',
    channelType: 'agency',
    carrier: 'AmeriTrust',
    bizLine: 'LIFE',
    firstYearRate: 55,
    renewalRates: [4, 4, 4],
    status: 'active',
    features: ['tier', 'override', 'clawback'],
    bindings: 12,
    version: 4,
    effectiveDate: '2025-12-01',
    minCommission: 25,
    maxCommission: 2000,
    createdBy: 'David Kim',
    approvedBy: 'David Kim',
  },
  {
    id: 'sch-6',
    name: 'Agency Standard — Auto (Old)',
    code: 'SCH-AUTO-000',
    channelType: 'agency',
    carrier: 'Pacific Mutual',
    bizLine: 'AUTO',
    firstYearRate: 11,
    renewalRates: [9, 8],
    status: 'expired',
    features: ['tier'],
    bindings: 0,
    version: 2,
    effectiveDate: '2025-01-01',
    minCommission: 50,
    maxCommission: 5000,
    createdBy: 'Emily Chen',
    approvedBy: 'David Kim',
  },
];

// Tier ladder / Override level mock — aligned to prototype ladderTiers / overrideTiers
const INITIAL_TIERS: LadderTier[] = [
  { id: 1, minPremium: 0, maxPremium: 100000, rateMultiplier: 1.0 },
  { id: 2, minPremium: 100000, maxPremium: 300000, rateMultiplier: 1.1 },
  { id: 3, minPremium: 300000, maxPremium: 700000, rateMultiplier: 1.2 },
  { id: 4, minPremium: 700000, maxPremium: null, rateMultiplier: 1.35 },
];

const OVERRIDE_LEVELS = [
  { level: 1, roleKey: 'scheme2.ladder.roleTeamLead', rate: 2.0, minTeamSize: 3 },
  { level: 2, roleKey: 'scheme2.ladder.roleBranchMgr', rate: 1.5, minTeamSize: 8 },
  { level: 3, roleKey: 'scheme2.ladder.roleRegionalDir', rate: 1.0, minTeamSize: 20 },
];

const STATUS_BADGE: Record<SchemeStatus, string> = {
  active: 'badge badge-green',
  pending: 'badge badge-orange',
  draft: 'badge badge-gray',
  disabled: 'badge badge-gray',
  expired: 'badge badge-gray',
};

const STATUS_KEY: Record<SchemeStatus, string> = {
  active: 'scheme2.statusActive',
  pending: 'scheme2.statusPending',
  draft: 'scheme2.statusDraft',
  disabled: 'scheme2.statusDisabled',
  expired: 'scheme2.statusExpired',
};

const FEATURE_META: Record<SchemeFeature, { badge: string; colKey: string; tagKey: string }> = {
  tier: { badge: 'badge badge-blue', colKey: 'scheme2.featTier', tagKey: 'scheme2.tagTier' },
  override: { badge: 'badge badge-purple', colKey: 'scheme2.featOverride', tagKey: 'scheme2.tagOverride' },
  clawback: { badge: 'badge badge-orange', colKey: 'scheme2.featClawback', tagKey: 'scheme2.tagClawback' },
};

const CHANNEL_TYPE_KEY: Record<ChannelTypeKey, string> = {
  agency: 'scheme2.chTypeAgency',
  mga: 'scheme2.chTypeMGA',
  fmo: 'scheme2.chTypeFMO',
  broker: 'scheme2.chTypeBroker',
};

const BIZ_LINES = ['AUTO', 'HOME', 'LIFE', 'HEALTH', 'COMMERCIAL'];

const formatMoney = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function CommissionSchemeView(_: Props) {
  const { t } = useTranslation('channel');
  const [activeTab, setActiveTab] = useState<'list' | 'tiers' | 'approvals'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bizLineFilter, setBizLineFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImpact, setShowImpact] = useState(false);

  const stats = {
    active: mockSchemes.filter((s) => s.status === 'active').length,
    pending: mockSchemes.filter((s) => s.status === 'pending').length,
    channels: mockSchemes.reduce((sum, s) => sum + s.bindings, 0),
    expired: mockSchemes.filter((s) => s.status === 'expired').length,
  };

  const filteredSchemes = mockSchemes.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (bizLineFilter !== 'all' && s.bizLine !== bizLineFilter) return false;
    if (searchQuery && !`${s.name} ${s.code}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selected = mockSchemes.find((s) => s.id === selectedId) ?? null;
  const selectedRates = selected
    ? [
        { year: 'Y1', rate: selected.firstYearRate },
        ...selected.renewalRates.map((r, i) => ({ year: `Y${i + 2}`, rate: r })),
      ]
    : [];
  const maxRate = selectedRates.length ? Math.max(...selectedRates.map((r) => r.rate)) : 1;

  const renderBadge = (count: number) =>
    count > 0 ? (
      <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold align-middle">
        {count}
      </span>
    ) : null;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="mb-1" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('scheme2.title')}</h1>
        <p className="mb-5" style={{ fontSize: 12.5, color: '#717786' }}>{t('scheme2.subtitle')}</p>

        {/* Tabs */}
        <div className="tab-bar mb-5">
          <button className={`tab-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            {t('scheme2.tabList')}
          </button>
          <button className={`tab-item ${activeTab === 'tiers' ? 'active' : ''}`} onClick={() => setActiveTab('tiers')}>
            {t('scheme2.tabTiers')}
          </button>
          <button
            className={`tab-item ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            {t('scheme2.tabApprovals')}
            {renderBadge(stats.pending)}
          </button>
        </div>

        {activeTab === 'list' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              <div className="kpi-card">
                <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('scheme2.statActive')}</div>
                <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#0058BC' }}>{stats.active}</div>
              </div>
              <div className="kpi-card">
                <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('scheme2.statPending')}</div>
                <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#a05800' }}>{stats.pending}</div>
              </div>
              <div className="kpi-card">
                <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('scheme2.statChannels')}</div>
                <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#1a7a2e' }}>{stats.channels}</div>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row gap-4 items-start">
              {/* Main column */}
              <div className="flex-1 min-w-0 w-full">
                {/* Filters */}
                <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717786]" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('scheme2.searchPlaceholder')}
                      className="input-glass w-full pl-9"
                    />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-glass">
                    <option value="all">{t('scheme2.allStatuses')}</option>
                    <option value="draft">{t('scheme2.statusDraft')}</option>
                    <option value="pending">{t('scheme2.statusPending')}</option>
                    <option value="active">{t('scheme2.statusActive')}</option>
                    <option value="disabled">{t('scheme2.statusDisabled')}</option>
                    <option value="expired">{t('scheme2.statusExpired')}</option>
                  </select>
                  <select value={bizLineFilter} onChange={(e) => setBizLineFilter(e.target.value)} className="input-glass">
                    <option value="all">{t('scheme2.allBizLines')}</option>
                    {BIZ_LINES.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    <Plus size={15} />
                    {t('scheme2.newScheme')}
                  </button>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('scheme2.colName')}</th>
                          <th>{t('scheme2.colScope')}</th>
                          <th>{t('scheme2.colFirstYear')}</th>
                          <th>{t('scheme2.colRenewal')}</th>
                          <th>{t('scheme2.colStatus')}</th>
                          <th>{t('scheme2.colFeatures')}</th>
                          <th>{t('scheme2.colBindings')}</th>
                          <th>{t('scheme2.colVersion')}</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSchemes.map((s) => (
                          <tr
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className={`cursor-pointer transition-colors ${selectedId === s.id ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}`}
                          >
                            <td>
                              <div className="font-semibold text-[#181C23]">{s.name}</div>
                              <div className="text-xs text-[#717786] font-data">{s.code}</div>
                            </td>
                            <td className="text-sm text-gray-600">
                              {t(CHANNEL_TYPE_KEY[s.channelType])} {s.carrier} · {s.bizLine}
                            </td>
                            <td>
                              <span className="font-bold text-blue-600">{s.firstYearRate}%</span>
                            </td>
                            <td className="text-xs text-[#717786] font-data">
                              {s.renewalRates.map((r, i) => `Y${i + 2}:${r}%`).join(' ')}
                            </td>
                            <td>
                              <span className={STATUS_BADGE[s.status]}>{t(STATUS_KEY[s.status])}</span>
                            </td>
                            <td>
                              <div className="flex gap-1">
                                {s.features.map((f) => (
                                  <span key={f} className={FEATURE_META[f].badge}>
                                    {t(FEATURE_META[f].colKey)}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="font-semibold text-[#181C23] font-data">{s.bindings}</td>
                            <td className="text-[#717786] font-data">v{s.version}</td>
                            <td>
                              <div className="flex items-center gap-1.5 text-[#717786]" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setSelectedId(s.id)} className="hover:text-[#0058BC]"><Eye size={13} /></button>
                                <button className="hover:text-[#0058BC]"><Copy size={13} /></button>
                                <button className="hover:text-[#0058BC]"><MoreHorizontal size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredSchemes.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <p className="text-sm font-medium text-[#414755] mb-1">{t('scheme2.emptyTitle')}</p>
                      <p className="text-xs text-[#717786]">{t('scheme2.emptyDesc')}</p>
                    </div>
                  ) : (
                    <div className="px-4 py-2 border-t-[0.5px] border-[rgba(193,198,215,0.38)] text-[11.5px] text-[#A0A5B4]">
                      {t('scheme2.footerCount', { n: filteredSchemes.length })}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail panel */}
              {selected && (
                <div className="w-full xl:w-[340px] shrink-0 card p-5 xl:sticky xl:top-6">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-[#181C23]">{selected.name}</h3>
                      <span className={STATUS_BADGE[selected.status]}>{t(STATUS_KEY[selected.status])}</span>
                    </div>
                    <button onClick={() => setSelectedId(null)} className="text-[#717786] hover:text-[#717786] shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="text-xs text-[#717786] font-data mb-4">
                    {selected.code} · v{selected.version}
                  </div>

                  {/* Rate chart */}
                  <div className="text-xs font-semibold text-[#717786] mb-2">{t('scheme2.rateChart')}</div>
                  <div className="flex items-end justify-between gap-2 px-1 mb-4">
                    {selectedRates.map((r) => (
                      <div key={r.year} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-semibold text-blue-600 font-data">{r.rate}%</span>
                        <div
                          className="w-full max-w-[32px] bg-blue-500 rounded-t"
                          style={{ height: `${Math.max(8, Math.round((r.rate / maxRate) * 72))}px` }}
                        />
                        <span className="text-[10px] text-[#717786] font-data">{r.year}</span>
                      </div>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="space-y-2 mb-4">
                    {[
                      { label: t('scheme2.dChannelType'), value: t(CHANNEL_TYPE_KEY[selected.channelType]) },
                      { label: t('scheme2.dCarrier'), value: selected.carrier },
                      { label: t('scheme2.dBizLine'), value: selected.bizLine },
                      { label: t('scheme2.dEffectiveDate'), value: selected.effectiveDate },
                      { label: t('scheme2.dMinComm'), value: formatMoney(selected.minCommission) },
                      { label: t('scheme2.dMaxComm'), value: formatMoney(selected.maxCommission) },
                      { label: t('scheme2.dCreatedBy'), value: selected.createdBy },
                      { label: t('scheme2.dApprovedBy'), value: selected.approvedBy || t('scheme2.dApprovedPending') },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center justify-between text-sm">
                        <span className="text-[#717786]">{f.label}</span>
                        <span className="font-medium text-[#181C23]">{f.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selected.features.map((f) => (
                      <span key={f} className={FEATURE_META[f].badge}>
                        {t(FEATURE_META[f].tagKey)}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 justify-center">{t('scheme2.btnEdit')}</button>
                    <button className="btn-secondary flex-1 justify-center" onClick={() => setShowImpact(true)}>
                      <BarChart3 size={13} />
                      {t('scheme2.btnImpact')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'tiers' && <LadderConfigTab />}
        {activeTab === 'approvals' && <ApprovalTab schemes={mockSchemes} />}
      </div>

      {/* New scheme modal — aligned to prototype SchemeFormModal */}
      {showForm && <SchemeFormModal onClose={() => setShowForm(false)} />}
      {/* Impact analysis modal — aligned to prototype ImpactAnalysisModal */}
      {showImpact && <ImpactAnalysisModal onClose={() => setShowImpact(false)} />}
    </div>
  );
}

// ─── Tab2: Ladder & Override config — aligned to prototype LadderConfigTab ──────────────────
function LadderConfigTab() {
  const { t } = useTranslation('channel');
  const [mode, setMode] = useState<'full' | 'marginal'>('marginal');
  const [cycle, setCycle] = useState<'monthly' | 'quarterly' | 'annual'>('quarterly');
  const [tiers, setTiers] = useState<LadderTier[]>(INITIAL_TIERS);
  const [simPremium, setSimPremium] = useState(250000);

  const baseRate = 12; // base first-year commission rate (%)

  const getMultiplier = (premium: number) => {
    const tier = tiers.slice().reverse().find((tr) => premium >= tr.minPremium);
    return tier?.rateMultiplier ?? 1.0;
  };
  const matchedIdx = tiers.findIndex((tr) => simPremium >= tr.minPremium && (tr.maxPremium === null || simPremium < tr.maxPremium));
  const multiplier = getMultiplier(simPremium);
  const simCommission = (simPremium * (baseRate / 100) * multiplier);

  const segBtn = (active: boolean) =>
    `flex-1 px-2 py-[6px] text-xs font-bold rounded-lg border-[1.5px] transition-colors ${
      active ? 'bg-[rgba(0,88,188,0.09)] border-[#0058BC] text-[#0058BC]' : 'border-[rgba(193,198,215,0.38)] text-[#414755] hover:bg-white/60'
    }`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 w-full space-y-4">
        {/* Ladder rule config */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={15} className="text-[#0058BC]" />
            <span className="text-sm font-extrabold text-[#181C23]">{t('scheme2.ladder.title')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[11.5px] font-bold text-[#717786] mb-2">{t('scheme2.ladder.mode')}</div>
              <div className="flex gap-1.5">
                <button className={segBtn(mode === 'full')} onClick={() => setMode('full')}>{t('scheme2.ladder.modeFull')}</button>
                <button className={segBtn(mode === 'marginal')} onClick={() => setMode('marginal')}>{t('scheme2.ladder.modeMarginal')}</button>
              </div>
            </div>
            <div>
              <div className="text-[11.5px] font-bold text-[#717786] mb-2">{t('scheme2.ladder.cycle')}</div>
              <div className="flex gap-1.5">
                <button className={segBtn(cycle === 'monthly')} onClick={() => setCycle('monthly')}>{t('scheme2.ladder.cycleMonthly')}</button>
                <button className={segBtn(cycle === 'quarterly')} onClick={() => setCycle('quarterly')}>{t('scheme2.ladder.cycleQuarterly')}</button>
                <button className={segBtn(cycle === 'annual')} onClick={() => setCycle('annual')}>{t('scheme2.ladder.cycleAnnual')}</button>
              </div>
            </div>
          </div>

          {/* Tier table */}
          <div className="overflow-x-auto rounded-[10px] border-[0.5px] border-[rgba(193,198,215,0.38)]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('scheme2.ladder.colTier')}</th>
                  <th>{t('scheme2.ladder.colFloor')}</th>
                  <th>{t('scheme2.ladder.colCap')}</th>
                  <th>{t('scheme2.ladder.colMultiplier')}</th>
                  <th>{t('scheme2.ladder.colEffective')}</th>
                  <th>{t('scheme2.ladder.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tr, i) => {
                  const hit = simPremium >= tr.minPremium && (tr.maxPremium === null || simPremium < tr.maxPremium);
                  return (
                    <tr key={tr.id} className={hit ? 'bg-blue-50/60' : ''}>
                      <td className="font-bold text-[#181C23]">{t('scheme2.ladder.tierN', { n: i + 1 })}</td>
                      <td className="font-data text-sm">${tr.minPremium.toLocaleString('en-US')}</td>
                      <td className="font-data text-sm">{tr.maxPremium ? `$${tr.maxPremium.toLocaleString('en-US')}` : t('scheme2.ladder.noCap')}</td>
                      <td className="font-data font-extrabold text-[#0058BC]">×{tr.rateMultiplier.toFixed(2)}</td>
                      <td className="font-data font-extrabold text-[#1a7a2e]">{(baseRate * tr.rateMultiplier).toFixed(1)}%</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-[#717786]">
                          <button className="hover:text-[#0058BC]"><Pencil size={12} /></button>
                          {i > 0 && (
                            <button onClick={() => setTiers((prev) => prev.filter((x) => x.id !== tr.id))} className="hover:text-[#BA1A1A]">
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button
            onClick={() =>
              setTiers((prev) => [...prev, { id: Date.now(), minPremium: prev[prev.length - 1].minPremium + 200000, maxPremium: null, rateMultiplier: 1.5 }])
            }
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-[6px] rounded-lg border border-dashed border-[rgba(193,198,215,0.55)] text-xs font-semibold text-[#717786] hover:bg-white/60 transition-colors"
          >
            <Plus size={12} />
            {t('scheme2.ladder.addTier')}
          </button>
        </div>
      </div>

      {/* Right column: simulator + Override levels */}
      <div className="w-full lg:w-[280px] shrink-0 space-y-3.5">
        <div className="card p-5">
          <div className="flex items-center gap-1.5 mb-3.5">
            <Zap size={13} className="text-[#0058BC]" />
            <span className="text-[13px] font-bold text-[#181C23]">{t('scheme2.ladder.simTitle')}</span>
          </div>
          <div className="mb-3">
            <div className="text-[11.5px] text-[#717786] mb-1.5">{t('scheme2.ladder.simPremium')}</div>
            <input
              type="range"
              min={0}
              max={1000000}
              step={10000}
              value={simPremium}
              onChange={(e) => setSimPremium(+e.target.value)}
              className="w-full accent-[#0058BC]"
            />
            <div className="font-data text-sm font-extrabold text-[#181C23] mt-1">${simPremium.toLocaleString('en-US')}</div>
          </div>
          <div className="space-y-2">
            {[
              { label: t('scheme2.ladder.simMatched'), value: matchedIdx >= 0 ? t('scheme2.ladder.tierN', { n: matchedIdx + 1 }) : '—', color: '#0058BC' },
              { label: t('scheme2.ladder.simMultiplier'), value: `×${multiplier.toFixed(2)}`, color: '#0058BC' },
              { label: t('scheme2.ladder.simRate'), value: `${(baseRate * multiplier).toFixed(1)}%`, color: '#1a7a2e' },
              { label: t('scheme2.ladder.simCommission'), value: `$${Math.round(simCommission).toLocaleString('en-US')}`, color: '#1a7a2e' },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between py-1.5 border-b-[0.5px] border-[rgba(193,198,215,0.38)] last:border-b-0">
                <span className="text-xs text-[#717786]">{r.label}</span>
                <span className="font-data text-[13px] font-extrabold" style={{ color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Override level config */}
        <div className="card p-5">
          <div className="text-[13px] font-bold text-[#181C23] mb-3">{t('scheme2.ladder.overrideTitle')}</div>
          {OVERRIDE_LEVELS.map((o) => (
            <div key={o.level} className="flex items-center justify-between py-[7px] border-b-[0.5px] border-[rgba(193,198,215,0.38)] last:border-b-0">
              <div>
                <div className="text-[12.5px] font-bold text-[#181C23]">{t(o.roleKey)}</div>
                <div className="text-[11px] text-[#717786]">{t('scheme2.ladder.minPeople', { n: o.minTeamSize })}</div>
              </div>
              <span className="font-data text-[13px] font-extrabold text-[#A05C00]">{o.rate.toFixed(1)}%</span>
            </div>
          ))}
          <button className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-[7px] text-xs font-semibold text-[#0058BC] bg-[rgba(0,88,188,0.09)] border-[0.5px] border-[rgba(0,88,188,0.2)] hover:bg-[rgba(0,88,188,0.15)] transition-colors">
            <Plus size={11} />
            {t('scheme2.ladder.addLevel')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab3: pending approvals — aligned to prototype ApprovalTab ─────────────────────────────────────
function ApprovalTab({ schemes }: { schemes: CommissionScheme[] }) {
  const { t } = useTranslation('channel');
  const pending = schemes.filter((s) => s.status === 'pending');

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b-[0.5px] border-[rgba(193,198,215,0.38)]">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-[#0058BC]" />
          <span className="text-[13.5px] font-bold text-[#181C23]">{t('scheme2.approval.title')}</span>
          {pending.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-extrabold">
              {pending.length}
            </span>
          )}
        </div>
        <button className="btn-secondary text-xs">
          <Download size={12} />
          {t('scheme2.approval.batchRecords')}
        </button>
      </div>

      {pending.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-[#A0A5B4] opacity-40" />
          <p className="text-[13px] text-[#A0A5B4]">{t('scheme2.approval.empty')}</p>
        </div>
      ) : (
        pending.map((s) => (
          <div key={s.id} className="px-4.5 px-5 py-4 border-b-[0.5px] border-[rgba(193,198,215,0.38)] last:border-b-0">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <div className="text-sm font-extrabold text-[#181C23]">{s.name}</div>
                <div className="font-data text-[11px] text-[#717786] mt-0.5">
                  {s.code} · v{s.version} · {t(CHANNEL_TYPE_KEY[s.channelType])} · {s.bizLine}
                </div>
              </div>
              <span className={STATUS_BADGE[s.status]}>{t(STATUS_KEY[s.status])}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3.5 px-3 py-2.5 rounded-[9px] bg-[rgba(249,249,255,0.6)]">
              <div className="text-center">
                <div className="font-data text-xl font-extrabold text-[#0058BC]">{s.firstYearRate}%</div>
                <div className="text-[11px] text-[#717786] mt-0.5">{t('scheme2.approval.firstYearRate')}</div>
              </div>
              <div className="text-center">
                <div className="font-data text-xl font-extrabold text-[#414755]">{s.renewalRates[0]}%</div>
                <div className="text-[11px] text-[#717786] mt-0.5">{t('scheme2.approval.renewalY2')}</div>
              </div>
              <div className="text-center">
                <div className="font-data text-xl font-extrabold text-[#414755]">{s.bindings}</div>
                <div className="text-[11px] text-[#717786] mt-0.5">{t('scheme2.approval.boundChannels')}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary text-xs">
                <Check size={12} />
                {t('scheme2.approval.approve')}
              </button>
              <button className="btn-secondary text-xs">
                <X size={12} />
                {t('scheme2.approval.reject')}
              </button>
              <button className="btn-secondary text-xs">
                <Eye size={12} />
                {t('scheme2.approval.viewDetails')}
              </button>
              <button className="btn-secondary text-xs">
                <BarChart3 size={12} />
                {t('scheme2.approval.impact')}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── New scheme modal (3-step wizard) — aligned to prototype SchemeFormModal ─────────────────────
function SchemeFormModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('channel');
  const [step, setStep] = useState(1);

  const stepLabels = [t('scheme2.modal.step1'), t('scheme2.modal.step2'), t('scheme2.modal.step3')];

  const ruleRows = [
    { label: t('scheme2.modal.ruleTier'), desc: t('scheme2.modal.ruleTierDesc') },
    { label: t('scheme2.modal.ruleOverride'), desc: t('scheme2.modal.ruleOverrideDesc') },
    { label: t('scheme2.modal.ruleClawback'), desc: t('scheme2.modal.ruleClawbackDesc') },
    { label: t('scheme2.modal.ruleBonus'), desc: t('scheme2.modal.ruleBonusDesc') },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(24,28,35,0.45)] backdrop-blur-[6px] flex items-center justify-center p-6">
      <div className="glass-strong w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[18px] p-7 sm:p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#181C23]">{t('scheme2.modal.title')}</h2>
            <p className="text-xs text-[#717786] mt-1">{t('scheme2.modal.step', { n: step })}</p>
          </div>
          <button onClick={onClose} className="text-[#717786] hover:text-[#181C23]">
            <X size={16} />
          </button>
        </div>

        {/* Step progress */}
        <div className="flex gap-1 mb-6">
          {stepLabels.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="h-[3px] rounded-[2px] mb-1" style={{ background: i + 1 <= step ? '#0058BC' : 'rgba(193,198,215,0.38)' }} />
              <div className={`text-[11px] ${i + 1 <= step ? 'text-[#0058BC]' : 'text-[#A0A5B4]'} ${i + 1 === step ? 'font-bold' : ''}`}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { label: t('scheme2.modal.fName'), ph: t('scheme2.modal.fNamePh'), span: true },
              { label: t('scheme2.modal.fCode'), ph: t('scheme2.modal.fCodePh') },
              { label: t('scheme2.modal.fDesc'), ph: t('scheme2.modal.fDescPh'), span: true },
              { label: t('scheme2.modal.fChannelType') },
              { label: t('scheme2.modal.fInsurer') },
              { label: t('scheme2.modal.fLine') },
              { label: t('scheme2.modal.fEffect'), type: 'date' },
              { label: t('scheme2.modal.fExpiry'), type: 'date' },
            ].map((f) => (
              <div key={f.label} className={f.span ? 'sm:col-span-2' : ''}>
                <label className="block text-[11.5px] font-bold text-[#717786] mb-1.5">{f.label}</label>
                <input type={f.type ?? 'text'} placeholder={f.ph} className="input-glass w-full" />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-[10px] bg-[rgba(0,88,188,0.06)] border-[0.5px] border-[rgba(0,88,188,0.2)]">
              <div className="text-xs font-bold text-[#0058BC] mb-2.5">{t('scheme2.modal.rateTitle')}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  t('scheme2.modal.rateFirst'),
                  t('scheme2.modal.rateY2'),
                  t('scheme2.modal.rateY3'),
                  t('scheme2.modal.rateY4'),
                  t('scheme2.modal.rateY5'),
                  t('scheme2.modal.rateY5Plus'),
                ].map((l) => (
                  <div key={l}>
                    <label className="block text-[11px] font-semibold text-[#0058BC] mb-1">{l}</label>
                    <div className="relative">
                      <input type="number" step="0.1" placeholder="0.0" className="input-glass w-full pr-7 font-data" />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-[#0058BC]">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11.5px] font-bold text-[#717786] mb-1.5">{t('scheme2.modal.fFloor')}</label>
                <input type="number" placeholder={t('scheme2.modal.optional')} className="input-glass w-full font-data" />
              </div>
              <div>
                <label className="block text-[11.5px] font-bold text-[#717786] mb-1.5">{t('scheme2.modal.fCap')}</label>
                <input type="number" placeholder={t('scheme2.modal.optional')} className="input-glass w-full font-data" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            {ruleRows.map((f) => (
              <label key={f.label} className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-[10px] bg-white/40 border-[0.5px] border-[rgba(193,198,215,0.38)] cursor-pointer">
                <div>
                  <div className="text-[13px] font-bold text-[#181C23]">{f.label}</div>
                  <div className="text-[11.5px] text-[#717786] mt-0.5">{f.desc}</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-[#0058BC] scale-125 shrink-0" />
              </label>
            ))}
            <div className="px-3 py-2.5 rounded-[9px] bg-[rgba(255,159,10,0.09)] border-[0.5px] border-[rgba(255,159,10,0.25)] text-xs font-semibold text-[#A05C00]">
              {t('scheme2.modal.warnApproval')}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
            <button className="btn-secondary text-xs" onClick={() => setStep((s) => s - 1)}>{t('scheme2.modal.back')}</button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button className="btn-primary text-xs" onClick={() => setStep((s) => s + 1)}>{t('scheme2.modal.next')}</button>
          ) : (
            <button className="btn-primary text-xs" onClick={onClose}>
              <Check size={13} />
              {t('scheme2.modal.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Impact analysis modal — aligned to prototype ImpactAnalysisModal ─────────────────────────────
function ImpactAnalysisModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('channel');
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(24,28,35,0.45)] backdrop-blur-[6px] flex items-center justify-center p-6">
      <div className="glass-strong w-full max-w-[580px] rounded-[18px] p-7 sm:p-8">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-base font-extrabold text-[#181C23] flex items-center gap-2">
            <BarChart3 size={17} className="text-[#0058BC]" />
            {t('scheme2.impact.title')}
          </h2>
          <button onClick={onClose} className="text-[#717786] hover:text-[#181C23]">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {[
            { k: t('scheme2.impact.oldPlan'), v: t('scheme2.impact.oldPlanVal') },
            { k: t('scheme2.impact.newPlan'), v: t('scheme2.impact.newPlanVal') },
            { k: t('scheme2.impact.scope'), v: t('scheme2.impact.scopeVal') },
            { k: t('scheme2.impact.range'), v: t('scheme2.impact.rangeVal') },
          ].map((r) => (
            <div key={r.k}>
              <div className="text-[11px] text-[#717786] mb-1">{r.k}</div>
              <div className="text-[13px] font-semibold text-[#181C23]">{r.v}</div>
            </div>
          ))}
        </div>

        {!done && !running && (
          <button className="btn-primary text-xs" onClick={run}>
            <Zap size={13} />
            {t('scheme2.impact.run')}
          </button>
        )}

        {running && (
          <div className="text-center py-8 text-[13px] text-[#717786]">
            <div className="mb-2">{t('scheme2.impact.running')}</div>
            <div className="h-1 rounded-[2px] bg-[rgba(193,198,215,0.38)] overflow-hidden max-w-[280px] mx-auto">
              <div className="w-[70%] h-full bg-[#0058BC] rounded-[2px] animate-pulse" />
            </div>
          </div>
        )}

        {done && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { label: t('scheme2.impact.oldTotal'), value: '$2.84M', color: '#717786' },
                { label: t('scheme2.impact.newTotal'), value: '$3.19M', color: '#0058BC' },
                { label: t('scheme2.impact.diff'), value: '+$350K (+12.3%)', color: '#1a7a2e' },
              ].map((s) => (
                <div key={s.label} className="px-3.5 py-3 rounded-[10px] bg-[rgba(249,249,255,0.6)] border-[0.5px] border-[rgba(193,198,215,0.38)] text-center">
                  <div className="font-data text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11px] text-[#717786] mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2.5 rounded-[9px] bg-[rgba(52,199,89,0.1)] border-[0.5px] border-[rgba(52,199,89,0.25)] text-xs font-semibold text-[#1a7a2e]">
              {t('scheme2.impact.conclusion')}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs">
                <Download size={12} />
                {t('scheme2.impact.export')}
              </button>
              <button className="btn-secondary text-xs" onClick={onClose}>{t('scheme2.impact.close')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
