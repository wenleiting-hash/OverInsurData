import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { TrendingUp, TrendingDown, DollarSign, Users, Shield, Activity, Calendar, Download, Filter } from 'lucide-react';

interface PerformanceMetric {
  channelId: string;
  channelName: string;
  channelType: string;
  period: string;
  premiumAmount: number;
  commissionEarned: number;
  claimCount: number;
  claimAmount: number;
  policyCount: number;
  growthRate: number;
  performanceScore: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data
const mockMetrics: PerformanceMetric[] = [
  {
    channelId: 'c1',
    channelName: '上海代理点',
    channelType: 'Agent',
    period: '2026-08',
    premiumAmount: 1250000,
    commissionEarned: 125000,
    claimCount: 12,
    claimAmount: 85000,
    policyCount: 45,
    growthRate: 15.3,
    performanceScore: 92,
  },
  {
    channelId: 'c2',
    channelName: '北京经纪门店',
    channelType: 'Broker',
    period: '2026-08',
    premiumAmount: 2180000,
    commissionEarned: 189000,
    claimCount: 8,
    claimAmount: 120000,
    policyCount: 67,
    growthRate: 22.7,
    performanceScore: 95,
  },
  {
    channelId: 'c3',
    channelName: '广州 MG 公司',
    channelType: 'MG',
    period: '2026-08',
    premiumAmount: 3500000,
    commissionEarned: 280000,
    claimCount: 25,
    claimAmount: 350000,
    policyCount: 120,
    growthRate: -5.2,
    performanceScore: 78,
  },
  {
    channelId: 'c4',
    channelName: '深圳 MGA 总部',
    channelType: 'MGA',
    period: '2026-08',
    premiumAmount: 8900000,
    commissionEarned: 712000,
    claimCount: 42,
    claimAmount: 890000,
    policyCount: 285,
    growthRate: 35.8,
    performanceScore: 97,
  },
];

export default function ChannelPerformanceView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08');
  const [sortBy, setSortBy] = useState<'premium' | 'growth' | 'score'>('score');
  const [filterType, setFilterType] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthBadge = (rate: number) => {
    if (rate >= 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          <TrendingUp size={14} />
          {rate}%
        </span>
      );
    }
    if (rate >= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          <TrendingUp size={14} />
          {rate}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
        <TrendingDown size={14} />
        {rate}%
      </span>
    );
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm font-bold">
          {score}
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-bold">
          {score}
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-sm font-bold">
          {score}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm font-bold">
        {score}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
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

  const sortedData = [...mockMetrics].sort((a, b) => {
    if (sortBy === 'premium') return b.premiumAmount - a.premiumAmount;
    if (sortBy === 'growth') return b.growthRate - a.growthRate;
    return b.performanceScore - a.performanceScore;
  });

  const filteredData = filterType === 'all' ? sortedData : sortedData.filter(m => m.channelType === filterType);

  const totalPremium = mockMetrics.reduce((sum, m) => sum + m.premiumAmount, 0);
  const totalCommission = mockMetrics.reduce((sum, m) => sum + m.commissionEarned, 0);
  const avgGrowth = mockMetrics.reduce((sum, m) => sum + m.growthRate, 0) / mockMetrics.length;
  const avgScore = mockMetrics.reduce((sum, m) => sum + m.performanceScore, 0) / mockMetrics.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('performanceAnalysis') || '渠道绩效分析'}</h1>
        <p className="text-gray-600">{t('performanceDescription') || '查看各渠道业务表现和佣金收益'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalPremium')}</h3>
            <DollarSign className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalPremium)}</p>
          <p className="text-xs text-gray-500">{t('period')}：{selectedPeriod}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalCommission')}</h3>
            <Shield className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(totalCommission)}</p>
          <p className="text-xs text-gray-500">{t('commissionRate')}：10%</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('avgGrowthRate')}</h3>
            <Activity className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{avgGrowth.toFixed(1)}%</p>
          <p className="text-xs text-gray-500">{t('channelCount')}: {mockMetrics.length}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('avgPerformance')}</h3>
            <Users className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{avgScore.toFixed(0)}</p>
          <p className="text-xs text-gray-500">{t('topPerformers')}：3 个</p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Calendar size={18} className="text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026-08">2026 年 08 月</option>
              <option value="2026-07">2026 年 07 月</option>
              <option value="2026-06">2026 年 06 月</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有类型</option>
              <option value="MGA">MGA</option>
              <option value="MG">MG</option>
              <option value="Agent">Agent</option>
              <option value="Broker">Broker</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <Download size={16} />
              {t('export')}
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('channelName')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:text-blue-600"
                  onClick={() => setSortBy(sortBy === 'premium' ? 'score' : 'premium')}
                >
                  <div className="flex items-center gap-2">
                    {t('premium')}
                    <DollarSign size={14} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('commission')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('policyCount')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('growthRate')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('performanceScore')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((metric) => (
                <tr key={metric.channelId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {metric.channelName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{metric.channelName}</div>
                        <div className="text-xs text-gray-500">{getTypeBadge(metric.channelType)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{formatCurrency(metric.premiumAmount)}</div>
                    <div className="text-xs text-gray-500">{metric.policyCount} {t('policies')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-green-600">{formatCurrency(metric.commissionEarned)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <Shield size={14} />
                      {metric.claimCount} claims / {formatCurrency(metric.claimAmount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getGrowthBadge(metric.growthRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getScoreBadge(metric.performanceScore)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      {t('viewDetail')} →
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
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noData')}</h3>
          <p className="text-gray-600 mb-4">{t('noDataDescription') || '暂无符合条件的渠道数据'}</p>
          <button className="btn-primary" onClick={() => setFilterType('all')}>
            {t('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}
