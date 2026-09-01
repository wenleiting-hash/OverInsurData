import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { TrendingUp, DollarSign, Percent, Plus, Trash2, ArrowUpDown, Filter, Download } from 'lucide-react';

interface CommissionTier {
  id: string;
  tierName: string;
  minPremium: number;
  maxPremium?: number; // undefined = unlimited
  commissionRate: number; // percentage (e.g., 15.5 for 15.5%)
  bonusThreshold?: number;
  bonusRate?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  applicableChannels: string[];
  applicableProducts: string[];
  status: 'active' | 'draft' | 'expired';
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Existing commission schemes
const mockTiers: CommissionTier[] = [
  {
    id: 'tier1',
    tierName: '基础阶梯-A 级代理',
    minPremium: 0,
    maxPremium: 100000,
    commissionRate: 12.5,
    bonusThreshold: 50000,
    bonusRate: 2.0,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    applicableChannels: ['c1'],
    applicableProducts: ['p1', 'p2'],
    status: 'active',
  },
  {
    id: 'tier2',
    tierName: '进阶阶梯-B 级经纪商',
    minPremium: 100000,
    maxPremium: 500000,
    commissionRate: 15.0,
    bonusThreshold: 300000,
    bonusRate: 3.5,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    applicableChannels: ['c2'],
    applicableProducts: ['p1', 'p2', 'p3'],
    status: 'active',
  },
  {
    id: 'tier3',
    tierName: '顶级阶梯-MGA 专属',
    minPremium: 500000,
    commissionRate: 18.5,
    bonusThreshold: 1000000,
    bonusRate: 5.0,
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
    applicableChannels: ['c4'],
    applicableProducts: ['p1', 'p2', 'p3', 'p4'],
    status: 'active',
  },
  {
    id: 'tier4',
    tierName: '临时促销方案',
    minPremium: 0,
    maxPremium: 200000,
    commissionRate: 20.0,
    bonusThreshold: 100000,
    bonusRate: 8.0,
    effectiveFrom: '2026-06-01',
    effectiveTo: '2026-08-31',
    applicableChannels: ['c1', 'c2'],
    applicableProducts: ['p3'],
    status: 'expired',
  },
];

export default function CommissionSchemeView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rate' | 'name' | 'minPremium'>('name');
  const [showAddModal, setShowAddModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-300',
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {t(`status.${status}`) || status}
      </span>
    );
  };

  const getChannelTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      MGA: 'bg-purple-100 text-purple-700 border-purple-300',
      MG: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      Agent: 'bg-blue-100 text-blue-700 border-blue-300',
      Broker: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  // Filter and sort data
  let filteredData = mockTiers.filter((tier) => {
    if (selectedStatusFilter !== 'all' && tier.status !== selectedStatusFilter) return false;
    if (selectedChannelFilter !== 'all') {
      // Simple filter by checking if any applicable channel matches
      const allChannels = ['c1', 'c2', 'c3', 'c4'];
      const channelNames: Record<string, string> = {
        c1: 'Agent',
        c2: 'Broker',
        c3: 'MG',
        c4: 'MGA',
      };
      if (!tier.applicableChannels.includes(selectedChannelFilter)) return false;
    }
    return true;
  });

  // Sort
  filteredData.sort((a, b) => {
    if (sortBy === 'rate') return b.commissionRate - a.commissionRate;
    if (sortBy === 'minPremium') return a.minPremium - b.minPremium;
    return a.tierName.localeCompare(b.tierName);
  });

  // Statistics
  const stats = {
    total: mockTiers.length,
    active: mockTiers.filter(t => t.status === 'active').length,
    avgRate: mockTiers.reduce((sum, t) => sum + t.commissionRate, 0) / mockTiers.length,
    highestRate: Math.max(...mockTiers.map(t => t.commissionRate)),
    totalBonusBudget: mockTiers.reduce((sum, t) => sum + (t.bonusThreshold || 0) * (t.bonusRate || 0) / 100, 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('commissionScheme') || '阶梯佣金配置'}</h1>
        <p className="text-gray-600">{t('schemeDescription') || '定义基于保费阈值的阶梯式佣金率和奖励机制'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalTiers')}</h3>
            <Percent className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-xs text-gray-500">{t('activeCommissions')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('activeSchemes')}</h3>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.active}</p>
          <p className="text-xs text-gray-500">{t('currentlyRunning')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('avgCommissionRate')}</h3>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.avgRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">{t('standardRate')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('highestRate')}</h3>
            <TrendingUp className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.highestRate}%</p>
          <p className="text-xs text-gray-500">{t('topChannel')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('bonusBudget')}</h3>
            <DollarSign className="text-red-600" size={20} />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">{formatCurrency(stats.totalBonusBudget)}</p>
          <p className="text-xs text-gray-500">{t('annualEstimate')}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="active">有效</option>
              <option value="draft">草稿</option>
              <option value="expired">过期</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有渠道类型</option>
              <option value="c1">Agent</option>
              <option value="c2">Broker</option>
              <option value="c3">MG</option>
              <option value="c4">MGA</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <Download size={16} />
              {t('export')}
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} className="mr-2" />
              {t('addTier') || '新增阶梯'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-blue-600"
                  onClick={() => setSortBy(sortBy === 'name' ? 'rate' : 'name')}
                >
                  <div className="flex items-center gap-2">
                    {t('tierName')}
                    {sortBy === 'name' && <ArrowUpDown size={14} />}
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('premiumRange')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('commissionRate')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('bonusThreshold')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('applicableChannels')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('validityPeriod')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((tier) => (
                <tr key={tier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{tier.tierName}</div>
                    {tier.bonusThreshold && (
                      <div className="text-xs text-orange-600 mt-1">
                        🎁 Bonus: {tier.bonusRate}% over {tier.bonusThreshold}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{formatCurrency(tier.minPremium)}+</div>
                    {tier.maxPremium && (
                      <div className="text-xs text-gray-500">
                        ≤ {formatCurrency(tier.maxPremium)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600 text-lg">{tier.commissionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tier.bonusThreshold ? (
                      <span className="text-orange-600 font-semibold">
                        {formatCurrency(tier.bonusThreshold)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {tier.applicableChannels.map((channelId) => {
                        const type = channelId === 'c1' ? 'Agent' : channelId === 'c2' ? 'Broker' : channelId === 'c3' ? 'MG' : 'MGA';
                        return getChannelTypeBadge(type);
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{tier.effectiveFrom}</div>
                    {tier.effectiveTo && (
                      <div className="text-xs text-gray-500">→ {tier.effectiveTo}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(tier.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                      {t('edit')} →
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      {t('deactivate')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="max-w-7xl mx-auto mt-12 text-center glass p-12 rounded-lg">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSchemes')}</h3>
          <p className="text-gray-600 mb-4">
            {t('noSchemesDescription') || '暂无佣金方案配置，请添加新的阶梯设置'}
          </p>
          <button 
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} className="mr-2" />
            {t('addTier')}
          </button>
        </div>
      )}
    </div>
  );
}
