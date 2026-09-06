import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import {
  Zap, Loader2, FileText, Download, X, Search, Check, Send,
  Upload, CheckCircle2, Eye,
} from 'lucide-react';

type SettlementStatus = 'pending' | 'approved' | 'paid';
type ChannelTypeKey = 'agency' | 'mga' | 'fmo' | 'broker';
type CommType = 'direct' | 'override' | 'renewal' | 'bonus' | 'chargeback';
type DetailStatusKey = 'settled' | 'clawedBack';
type DiffType = 'rate-diff' | 'premium-diff' | 'agent-mismatch' | 'not-found' | 'match';

interface SettlementRecord {
  id: string;
  channelName: string;
  channelType: ChannelTypeKey;
  period: string;
  policyCount: number;
  baseCommission: number;
  override: number;
  bonus: number;
  chargeback: number;
  adjustment: number;
  totalAmount: number;
  status: SettlementStatus;
  payMethod: 'ACH' | 'check' | 'wire';
  approvedBy: string | null;
  paidDate: string | null;
  bankLast4: string;
}

interface CommDetail {
  id: string;
  policyNo: string;
  insured: string;
  insurer: string;
  product: string;
  premium: number;
  commType: CommType;
  rate: number;
  amount: number;
  period: string;
  agent: string;
  statusKey: DetailStatusKey;
}

interface ReconcileRow {
  id: string;
  policyNo: string;
  insurer: string;
  ourCalc: number;
  insurerBill: number;
  diff: number;
  diffType: DiffType;
  resolved: boolean;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data — aligned with the Figma prototype
const mockSettlements: SettlementRecord[] = [
  { id: 'st-1', channelName: 'Pacific Coast Insurance Agency', channelType: 'agency', period: '2026-08', policyCount: 87, baseCommission: 28750, override: 4320, bonus: 2500, chargeback: -1200, adjustment: 500, totalAmount: 34870, status: 'pending', payMethod: 'ACH', approvedBy: null, paidDate: null, bankLast4: '4521' },
  { id: 'st-2', channelName: 'SunState MGA Partners', channelType: 'mga', period: '2026-08', policyCount: 215, baseCommission: 92400, override: 13860, bonus: 8000, chargeback: -3200, adjustment: 0, totalAmount: 111060, status: 'pending', payMethod: 'ACH', approvedBy: null, paidDate: null, bankLast4: '7803' },
  { id: 'st-3', channelName: 'Mountain West FMO', channelType: 'fmo', period: '2026-08', policyCount: 132, baseCommission: 45200, override: 6780, bonus: 3000, chargeback: -800, adjustment: -1500, totalAmount: 52680, status: 'approved', payMethod: 'wire', approvedBy: 'David Kim', paidDate: null, bankLast4: '2290' },
  { id: 'st-4', channelName: 'Northeast Brokers Group', channelType: 'broker', period: '2026-08', policyCount: 43, baseCommission: 18900, override: 0, bonus: 0, chargeback: -450, adjustment: 0, totalAmount: 18450, status: 'paid', payMethod: 'check', approvedBy: 'David Kim', paidDate: '2026-08-25', bankLast4: '0000' },
  { id: 'st-5', channelName: 'Pacific Coast Insurance Agency', channelType: 'agency', period: '2026-07', policyCount: 79, baseCommission: 26400, override: 3960, bonus: 0, chargeback: -600, adjustment: 0, totalAmount: 29760, status: 'paid', payMethod: 'ACH', approvedBy: 'Sarah Wang', paidDate: '2026-07-28', bankLast4: '4521' },
];

// Commission detail mock — aligned to prototype details
const mockDetails: CommDetail[] = [
  { id: 'd1', policyNo: 'PM-2026-004521', insured: 'Jennifer Walsh', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1840, commType: 'direct', rate: 0.12, amount: 220.8, period: '2026-08', agent: 'Mike Torres', statusKey: 'settled' },
  { id: 'd2', policyNo: 'LS-2026-008834', insured: 'Robert Chen', insurer: 'Liberty Shield', product: 'Homeowners Elite', premium: 3200, commType: 'direct', rate: 0.15, amount: 480, period: '2026-08', agent: 'Amy Park', statusKey: 'settled' },
  { id: 'd3', policyNo: 'PM-2025-001122', insured: 'Maria Santos', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1560, commType: 'renewal', rate: 0.1, amount: 156, period: '2026-08', agent: 'Mike Torres', statusKey: 'settled' },
  { id: 'd4', policyNo: 'AT-2026-002099', insured: 'James Kim', insurer: 'AmeriTrust', product: 'Term Life 20', premium: 4800, commType: 'direct', rate: 0.55, amount: 2640, period: '2026-08', agent: 'Lisa Wong', statusKey: 'settled' },
  { id: 'd5', policyNo: 'PM-2026-000321', insured: 'Anna Brown', insurer: 'Pacific Mutual', product: 'Personal Auto Preferred', premium: 1200, commType: 'chargeback', rate: 1.0, amount: -144, period: '2026-08', agent: 'Mike Torres', statusKey: 'clawedBack' },
];

// Bill reconciliation mock — aligned to prototype reconcileRows
const reconcileRows: ReconcileRow[] = [
  { id: 'r1', policyNo: 'PM-2026-003344', insurer: 'Pacific Mutual', ourCalc: 220.8, insurerBill: 220.8, diff: 0, diffType: 'match', resolved: false },
  { id: 'r2', policyNo: 'PM-2026-004422', insurer: 'Pacific Mutual', ourCalc: 336, insurerBill: 280, diff: 56, diffType: 'rate-diff', resolved: false },
  { id: 'r3', policyNo: 'PM-2026-005511', insurer: 'Pacific Mutual', ourCalc: 192, insurerBill: 160, diff: 32, diffType: 'premium-diff', resolved: true },
  { id: 'r4', policyNo: 'PM-2026-006600', insurer: 'Pacific Mutual', ourCalc: 0, insurerBill: 144, diff: -144, diffType: 'agent-mismatch', resolved: false },
  { id: 'r5', policyNo: 'PM-2026-007712', insurer: 'Pacific Mutual', ourCalc: 96, insurerBill: 0, diff: 96, diffType: 'not-found', resolved: false },
];

const STATUS_BADGE: Record<SettlementStatus, string> = {
  pending: 'badge badge-orange',
  approved: 'badge badge-green',
  paid: 'badge badge-blue',
};

const STATUS_KEY: Record<SettlementStatus, string> = {
  pending: 'settle2.statusPending',
  approved: 'settle2.statusApproved',
  paid: 'settle2.statusPaid',
};

const CHANNEL_TYPE_KEY: Record<ChannelTypeKey, string> = {
  agency: 'scheme2.chTypeAgency',
  mga: 'scheme2.chTypeMGA',
  fmo: 'scheme2.chTypeFMO',
  broker: 'scheme2.chTypeBroker',
};

const COMM_TYPE_META: Record<CommType, { color: string; labelKey: string }> = {
  direct: { color: '#0058BC', labelKey: 'settle2.details.typeDirect' },
  override: { color: '#A05C00', labelKey: 'settle2.details.typeOverride' },
  renewal: { color: '#1a7a2e', labelKey: 'settle2.details.typeRenewal' },
  bonus: { color: '#6B35C2', labelKey: 'settle2.details.typeBonus' },
  chargeback: { color: '#BA1A1A', labelKey: 'settle2.details.typeChargeback' },
};

const DETAIL_STATUS_META: Record<DetailStatusKey, { color: string; labelKey: string }> = {
  settled: { color: '#1a7a2e', labelKey: 'settle2.details.stSettled' },
  clawedBack: { color: '#A05C00', labelKey: 'settle2.details.stClawedBack' },
};

const DIFF_TYPE_META: Record<Exclude<DiffType, 'match'>, { color: string; labelKey: string }> = {
  'rate-diff': { color: '#A05C00', labelKey: 'settle2.recon.diffRate' },
  'premium-diff': { color: '#0058BC', labelKey: 'settle2.recon.diffPremium' },
  'agent-mismatch': { color: '#BA1A1A', labelKey: 'settle2.recon.diffAgent' },
  'not-found': { color: '#BA1A1A', labelKey: 'settle2.recon.diffNotFound' },
};

const PERIODS = ['2026-08', '2026-07', '2026-06', '2026-05'];

const formatMoney = (n: number) => `$${n.toLocaleString('en-US')}`;

export default function CommissionSettlementView(_: Props) {
  const { t } = useTranslation('channel');
  const [activeTab, setActiveTab] = useState<'settlements' | 'details' | 'recon'>('settlements');

  const pendingCount = mockSettlements.filter((r) => r.status === 'pending').length;

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
        <h1 className="mb-1" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('settle2.title')}</h1>
        <p className="mb-5" style={{ fontSize: 12.5, color: '#717786' }}>{t('settle2.subtitle')}</p>

        {/* Tabs */}
        <div className="tab-bar mb-5">
          <button
            className={`tab-item ${activeTab === 'settlements' ? 'active' : ''}`}
            onClick={() => setActiveTab('settlements')}
          >
            {t('settle2.tabSettlements')}
            {renderBadge(pendingCount)}
          </button>
          <button className={`tab-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
            {t('settle2.tabDetails')}
          </button>
          <button className={`tab-item ${activeTab === 'recon' ? 'active' : ''}`} onClick={() => setActiveTab('recon')}>
            {t('settle2.tabRecon')}
          </button>
        </div>

        {activeTab === 'settlements' && <SettlementTab schemes={mockSettlements} />}
        {activeTab === 'details' && <DetailTab />}
        {activeTab === 'recon' && <ReconcileTab />}
      </div>
    </div>
  );
}

// ─── Tab1: settlement management ─────────────────────────────────────────────────────────
function SettlementTab({ schemes }: { schemes: SettlementRecord[] }) {
  const { t } = useTranslation('channel');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08');
  const [selectedId, setSelectedId] = useState<string | null>(schemes[0]?.id ?? null);
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);
  const [calcRunning, setCalcRunning] = useState(false);

  const runCalc = () => {
    setCalcRunning(true);
    setTimeout(() => setCalcRunning(false), 2200);
  };

  const filteredData = schemes.filter((r) => selectedPeriod === 'all' || r.period === selectedPeriod);

  const stats = {
    payable: filteredData.reduce((sum, r) => sum + r.totalAmount, 0),
    pendingCount: filteredData.filter((r) => r.status === 'pending').length,
    approvedUnpaid: filteredData.filter((r) => r.status === 'approved').reduce((sum, r) => sum + r.totalAmount, 0),
    policyCount: filteredData.reduce((sum, r) => sum + r.policyCount, 0),
  };

  const selected = schemes.find((r) => r.id === selectedId) ?? null;

  const handleApprove = (id: string) => {
    console.log('Approve settlement:', id);
    setShowApprovalModal(null);
  };

  const handleExport = (id: string) => {
    console.log('Export bill:', id);
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="kpi-card">
          <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('settle2.statPayable')}</div>
          <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#0058BC' }}>{formatMoney(stats.payable)}</div>
        </div>
        <div className="kpi-card">
          <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('settle2.statPendingCount')}</div>
          <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#a05800' }}>{stats.pendingCount}</div>
        </div>
        <div className="kpi-card">
          <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('settle2.statApprovedUnpaid')}</div>
          <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#1a7a2e' }}>{formatMoney(stats.approvedUnpaid)}</div>
        </div>
        <div className="kpi-card">
          <div className="mb-2" style={{ fontSize: 12.5, color: '#717786' }}>{t('settle2.statPolicies')}</div>
          <div className="font-data" style={{ fontSize: 24, fontWeight: 800, color: '#181C23' }}>{stats.policyCount}</div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 w-full">
          {/* Toolbar */}
          <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-[#717786]">{t('settle2.periodLabel')}</span>
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="input-glass">
              {PERIODS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 ml-auto">
              <button className="btn-primary" onClick={runCalc}>
                {calcRunning ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    {t('settle2.btnCalculating')}
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    {t('settle2.btnCalculate')}
                  </>
                )}
              </button>
              <button className="btn-secondary">
                <FileText size={15} />
                {t('settle2.btnBatchGenerate')}
              </button>
              <button className="btn-secondary">
                <Download size={15} />
                {t('settle2.btnBatchExport')}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('settle2.colChannel')}</th>
                    <th>{t('settle2.colType')}</th>
                    <th>{t('settle2.colBase')}</th>
                    <th>{t('settle2.colOverride')}</th>
                    <th>{t('settle2.colBonus')}</th>
                    <th>{t('settle2.colChargeback')}</th>
                    <th>{t('settle2.colAdjustment')}</th>
                    <th>{t('settle2.colTotal')}</th>
                    <th>{t('settle2.colStatus')}</th>
                    <th>{t('settle2.colPayMethod')}</th>
                    <th>{t('settle2.colAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`cursor-pointer transition-colors ${selectedId === r.id ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}`}
                    >
                      <td>
                        <div className="font-semibold text-[#181C23]">{r.channelName}</div>
                        <div className="text-xs text-[#717786]">
                          {r.policyCount} {t('settle2.policiesUnit')}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{t(CHANNEL_TYPE_KEY[r.channelType])}</span>
                      </td>
                      <td className="font-semibold text-[#181C23] font-data">{formatMoney(r.baseCommission)}</td>
                      <td className="font-data">
                        {r.override > 0 ? (
                          <span className="font-semibold text-[#A05C00]">+{formatMoney(r.override)}</span>
                        ) : (
                          <span className="text-[#C1C6D7]">—</span>
                        )}
                      </td>
                      <td className="font-data">
                        {r.bonus > 0 ? (
                          <span className="font-semibold text-[#1a7a2e]">+{formatMoney(r.bonus)}</span>
                        ) : (
                          <span className="text-[#C1C6D7]">—</span>
                        )}
                      </td>
                      <td className="font-data">
                        {r.chargeback < 0 ? (
                          <span className="font-semibold text-[#BA1A1A]">{formatMoney(r.chargeback)}</span>
                        ) : (
                          <span className="text-[#C1C6D7]">—</span>
                        )}
                      </td>
                      <td className="font-data">
                        {r.adjustment !== 0 ? (
                          <span className={`font-semibold ${r.adjustment > 0 ? 'text-[#1a7a2e]' : 'text-[#BA1A1A]'}`}>
                            {r.adjustment > 0 ? '+' : ''}{formatMoney(r.adjustment)}
                          </span>
                        ) : (
                          <span className="text-[#C1C6D7]">—</span>
                        )}
                      </td>
                      <td className="font-bold text-[#0058BC] font-data">{formatMoney(r.totalAmount)}</td>
                      <td>
                        <span className={STATUS_BADGE[r.status]}>{t(STATUS_KEY[r.status])}</span>
                      </td>
                      <td className="font-data text-xs text-[#717786]">{r.payMethod.toUpperCase()}</td>
                      <td>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {r.status === 'pending' && (
                            <button
                              className="px-2 py-[3px] rounded-[5px] text-[11px] font-bold text-white bg-[#0058BC] hover:opacity-90 transition-opacity"
                              onClick={() => setShowApprovalModal(r.id)}
                            >
                              {t('settle2.btnApproveShort')}
                            </button>
                          )}
                          <button className="text-[#717786] hover:text-[#0058BC]" onClick={() => setSelectedId(r.id)}>
                            <Eye size={13} />
                          </button>
                          <button className="text-[#717786] hover:text-[#0058BC]" onClick={() => handleExport(r.id)}>
                            <Download size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">{t('settle2.emptyTitle')}</p>
                <p className="text-xs text-[#717786]">{t('settle2.emptyDesc')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full xl:w-[320px] shrink-0 card p-5 xl:sticky xl:top-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-[#181C23]">{selected.channelName}</h3>
              <button onClick={() => setSelectedId(null)} className="text-[#717786] hover:text-[#717786] shrink-0">
                <X size={16} />
              </button>
            </div>
            <div className="mb-3">
              <span className={STATUS_BADGE[selected.status]}>{t(STATUS_KEY[selected.status])}</span>
            </div>
            <div className="font-data mb-1" style={{ fontSize: 26, fontWeight: 800, color: '#0058BC' }}>{formatMoney(selected.totalAmount)}</div>
            <div className="text-xs text-[#717786] mb-4">
              {selected.period} · {selected.policyCount} {t('settle2.policiesUnit')}
            </div>

            {/* Breakdown details — aligned to prototype (rendered only when non-zero) */}
            <div className="rounded-[9px] px-3 py-2.5 bg-[rgba(249,249,255,0.6)] mb-4">
              {[
                { label: t('settle2.detailBase'), v: selected.baseCommission, color: '#0058BC' },
                { label: t('settle2.detailOverride'), v: selected.override, color: '#A05C00' },
                { label: t('settle2.detailBonus'), v: selected.bonus, color: '#1a7a2e' },
                { label: t('settle2.detailChargeback'), v: selected.chargeback, color: '#BA1A1A' },
                { label: t('settle2.detailAdjustment'), v: selected.adjustment, color: selected.adjustment >= 0 ? '#1a7a2e' : '#BA1A1A' },
              ]
                .filter((r) => r.v !== 0)
                .map((r) => (
                  <div key={r.label} className="flex justify-between py-[5px] border-b-[0.5px] border-[rgba(193,198,215,0.38)] last:border-b-0">
                    <span className="text-xs text-[#717786]">{r.label}</span>
                    <span className="font-data text-xs font-bold" style={{ color: r.color }}>
                      {r.v > 0 ? '+' : ''}{formatMoney(r.v)}
                    </span>
                  </div>
                ))}
              <div className="flex justify-between pt-2">
                <span className="text-[13px] font-bold text-[#181C23]">{t('settle2.detailTotal')}</span>
                <span className="font-data text-sm font-extrabold text-[#0058BC]">{formatMoney(selected.totalAmount)}</span>
              </div>
            </div>

            {/* Payment info fields */}
            <div className="space-y-2 mb-4">
              {[
                { label: t('settle2.dPayMethod'), value: selected.payMethod.toUpperCase() },
                { label: t('settle2.dBankLast4'), value: `****${selected.bankLast4}` },
                ...(selected.approvedBy ? [{ label: t('settle2.dApprovedBy'), value: selected.approvedBy }] : []),
                ...(selected.paidDate ? [{ label: t('settle2.dPaidDate'), value: selected.paidDate }] : []),
              ].map((f) => (
                <div key={f.label} className="flex justify-between text-sm">
                  <span className="text-[#717786]">{f.label}</span>
                  <span className="font-medium text-[#181C23] font-data">{f.value}</span>
                </div>
              ))}
            </div>

            {selected.status === 'pending' && (
              <button
                className="btn-primary w-full justify-center mb-2"
                onClick={() => setShowApprovalModal(selected.id)}
              >
                <Check size={14} />
                {t('settle2.btnApprove')}
              </button>
            )}
            {selected.status === 'approved' && (
              <button className="btn-primary w-full justify-center mb-2">
                <Send size={14} />
                {t('settle2.btnInitiatePayment')}
              </button>
            )}
            <button className="btn-secondary w-full justify-center" onClick={() => handleExport(selected.id)}>
              <Download size={14} />
              {t('settle2.btnDownloadStatement')}
            </button>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-[#181C23] mb-2">{t('settle2.approveTitle')}</h3>
            <p className="text-sm text-[#717786] mb-5">{t('settle2.approveTip')}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setShowApprovalModal(null)}>
                {t('settle2.btnCancel')}
              </button>
              <button className="btn-primary" onClick={() => handleApprove(showApprovalModal)}>
                {t('settle2.btnApprove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Tab2: commission detail query — aligned to prototype DetailTab ────────────────────────────────
function DetailTab() {
  const { t } = useTranslation('channel');
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('all');

  const filtered = mockDetails.filter(
    (d) =>
      (typeF === 'all' || d.commType === typeF) &&
      (!search || d.policyNo.includes(search) || d.insured.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="card overflow-hidden">
      <div className="card p-4 mb-0 flex flex-wrap items-center gap-3 border-b-[0.5px] border-[rgba(193,198,215,0.38)] border-b-0 rounded-b-none">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717786]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settle2.details.searchPlaceholder')}
            className="input-glass w-full pl-9"
          />
        </div>
        <select value={typeF} onChange={(e) => setTypeF(e.target.value)} className="input-glass">
          <option value="all">{t('settle2.details.allTypes')}</option>
          {(Object.keys(COMM_TYPE_META) as CommType[]).map((k) => (
            <option key={k} value={k}>{t(COMM_TYPE_META[k].labelKey)}</option>
          ))}
        </select>
        <select className="input-glass" defaultValue="2026-08">
          {PERIODS.slice(0, 3).map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button className="btn-secondary">
          <Download size={14} />
          {t('settle2.details.export')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('settle2.details.colPolicyNo')}</th>
              <th>{t('settle2.details.colInsured')}</th>
              <th>{t('settle2.details.colInsurerProduct')}</th>
              <th>{t('settle2.details.colAgent')}</th>
              <th>{t('settle2.details.colCommType')}</th>
              <th>{t('settle2.details.colPremium')}</th>
              <th>{t('settle2.details.colRate')}</th>
              <th>{t('settle2.details.colAmount')}</th>
              <th>{t('settle2.details.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const meta = COMM_TYPE_META[d.commType];
              const st = DETAIL_STATUS_META[d.statusKey];
              return (
                <tr key={d.id} className={d.commType === 'chargeback' ? 'bg-[rgba(186,26,26,0.04)]' : ''}>
                  <td className="font-data text-xs text-[#0058BC]">{d.policyNo}</td>
                  <td className="font-semibold text-[#181C23]">{d.insured}</td>
                  <td>
                    <div className="text-sm text-[#414755]">{d.insurer}</div>
                    <div className="text-xs text-[#717786]">{d.product}</div>
                  </td>
                  <td className="text-sm text-[#414755]">{d.agent}</td>
                  <td>
                    <span
                      className="inline-block px-2 py-[2px] rounded-[5px] text-[11px] font-bold"
                      style={{ background: `${meta.color}12`, color: meta.color }}
                    >
                      {t(meta.labelKey)}
                    </span>
                  </td>
                  <td className="font-data text-sm">${d.premium.toLocaleString('en-US')}</td>
                  <td className="font-data text-sm font-bold text-[#414755]">{(d.rate * 100).toFixed(1)}%</td>
                  <td className={`font-data font-extrabold ${d.amount < 0 ? 'text-[#BA1A1A]' : 'text-[#1a7a2e]'}`}>
                    {d.amount < 0 ? '' : '+'}{formatMoney(d.amount)}
                  </td>
                  <td>
                    <span className="text-xs font-semibold" style={{ color: st.color }}>{t(st.labelKey)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t-[0.5px] border-[rgba(193,198,215,0.38)] text-[11.5px] text-[#A0A5B4]">
        {t('settle2.details.footerCount', { shown: filtered.length, total: mockDetails.length })}
      </div>
    </div>
  );
}

// ─── Tab3: bill reconciliation — aligned to prototype ReconcileTab ─────────────────────────────────
function ReconcileTab() {
  const { t } = useTranslation('channel');
  const [running, setRunning] = useState(false);

  const diffRows = reconcileRows.filter((r) => r.diffType !== 'match');
  const totalDiff = diffRows.reduce((a, r) => a + Math.abs(r.diff), 0);

  return (
    <div className="space-y-4">
      {/* Reconciliation header cards */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-extrabold text-[#181C23]">{t('settle2.recon.title')}</div>
            <div className="text-[12.5px] text-[#717786] mt-0.5">Pacific Mutual · 2026-08</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs">
              <Upload size={12} />
              {t('settle2.recon.uploadBill')}
            </button>
            <button
              className="btn-primary text-xs"
              onClick={() => {
                setRunning(true);
                setTimeout(() => setRunning(false), 2000);
              }}
            >
              {running ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  {t('settle2.recon.running')}
                </>
              ) : (
                <>
                  <Zap size={12} />
                  {t('settle2.recon.start')}
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('settle2.recon.statPolicies'), v: String(reconcileRows.length), color: '#181C23' },
            { label: t('settle2.recon.statMatched'), v: String(reconcileRows.filter((r) => r.diffType === 'match').length), color: '#1a7a2e' },
            { label: t('settle2.recon.statDiffs'), v: String(diffRows.filter((r) => !r.resolved).length), color: '#BA1A1A' },
            { label: t('settle2.recon.statDiffAmount'), v: `$${totalDiff.toFixed(2)}`, color: '#A05C00' },
          ].map((s) => (
            <div key={s.label} className="text-center px-2.5 py-2.5 rounded-[9px] bg-[rgba(249,249,255,0.6)]">
              <div className="font-data text-xl font-extrabold" style={{ color: s.color }}>{s.v}</div>
              <div className="text-[11.5px] text-[#717786] mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reconciliation result table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('settle2.recon.colPolicyNo')}</th>
                <th>{t('settle2.recon.colInsurer')}</th>
                <th>{t('settle2.recon.colOurCalc')}</th>
                <th>{t('settle2.recon.colBill')}</th>
                <th>{t('settle2.recon.colDiff')}</th>
                <th>{t('settle2.recon.colDiffType')}</th>
                <th>{t('settle2.recon.colResolve')}</th>
                <th>{t('settle2.recon.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {reconcileRows.map((r) => (
                <tr key={r.id} className={r.diffType !== 'match' && !r.resolved ? 'bg-[rgba(186,26,26,0.04)]' : ''}>
                  <td className="font-data text-xs">{r.policyNo}</td>
                  <td className="text-sm">{r.insurer}</td>
                  <td className="font-data text-sm font-bold">${r.ourCalc.toFixed(2)}</td>
                  <td className="font-data text-sm font-bold">${r.insurerBill.toFixed(2)}</td>
                  <td className={`font-data text-sm font-extrabold ${r.diff > 0 ? 'text-[#A05C00]' : r.diff < 0 ? 'text-[#BA1A1A]' : 'text-[#1a7a2e]'}`}>
                    {r.diff === 0 ? '—' : `${r.diff > 0 ? '+' : ''}$${r.diff.toFixed(2)}`}
                  </td>
                  <td>
                    {r.diffType === 'match' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1a7a2e]">
                        <CheckCircle2 size={11} />
                        {t('settle2.recon.match')}
                      </span>
                    ) : (
                      <span
                        className="inline-block px-2 py-[2px] rounded-[5px] text-[11px] font-bold"
                        style={{ background: `${DIFF_TYPE_META[r.diffType].color}12`, color: DIFF_TYPE_META[r.diffType].color }}
                      >
                        {t(DIFF_TYPE_META[r.diffType].labelKey)}
                      </span>
                    )}
                  </td>
                  <td>
                    {r.resolved ? (
                      <span className="text-[11px] text-[#1a7a2e]">{t('settle2.recon.resolved')}</span>
                    ) : r.diffType !== 'match' ? (
                      <span className="text-[11px] text-[#A05C00]">{t('settle2.recon.pending')}</span>
                    ) : null}
                  </td>
                  <td>
                    {r.diffType !== 'match' && !r.resolved && (
                      <div className="flex items-center gap-1.5">
                        <button className="px-2 py-[3px] rounded-[5px] text-[11px] font-bold text-[#1a7a2e] bg-[rgba(52,199,89,0.1)] border-[0.5px] border-[rgba(52,199,89,0.25)] hover:bg-[rgba(52,199,89,0.18)] transition-colors">
                          {t('settle2.recon.confirm')}
                        </button>
                        <button className="px-2 py-[3px] rounded-[5px] text-[11px] font-bold text-[#BA1A1A] bg-[rgba(186,26,26,0.08)] border-[0.5px] border-[rgba(186,26,26,0.22)] hover:bg-[rgba(186,26,26,0.15)] transition-colors">
                          {t('settle2.recon.dispute')}
                        </button>
                      </div>
                    )}
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
