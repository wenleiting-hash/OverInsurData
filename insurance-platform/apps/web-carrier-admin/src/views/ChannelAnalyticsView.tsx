import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Calendar, BarChart3, PieChart, Download } from 'lucide-react';

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

interface AnalyticsData {
  totalPremium: number;
  totalCommission: number;
  avgGrowthRate: number;
  activeChannels: number;
  topPerformer: string;
  growthTrend: { month: string; premium: number; commission: number }[];
  channelPerformance: { name: string; premium: number; growth: number }[];
  productMix: { category: string; percentage: number; value: number }[];
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Full year analytics
const mockAnalytics: AnalyticsData = {
  totalPremium: 45000000,
  totalCommission: 7200000,
  avgGrowthRate: 18.5,
  activeChannels: 12,
  topPerformer: '深圳 MGA 总部',
  growthTrend: [
    { month: '1 月', premium: 3200000, commission: 520000 },
    { month: '2 月', premium: 3800000, commission: 615000 },
    { month: '3 月', premium: 4100000, commission: 660000 },
    { month: '4 月', premium: 4500000, commission: 725000 },
    { month: '5 月', premium: 5200000, commission: 840000 },
    { month: '6 月', premium: 5800000, commission: 935000 },
    { month: '7 月', premium: 6500000, commission: 1050000 },
    { month: '8 月', premium: 6100000, commission: 985000 },
  ],
  channelPerformance: [
    { name: '深圳 MGA 总部', premium: 12500000, growth: 35.8 },
    { name: '广州 MG 公司', premium: 8900000, growth: -5.2 },
    { name: '北京经纪门店', premium: 7200000, growth: 22.7 },
    { name: '上海代理点', premium: 5800000, growth: 15.3 },
    { name: '其他渠道', premium: 10600000, growth: 8.5 },
  ],
  productMix: [
    { category: '健康险', percentage: 45, value: 20250000 },
    { category: '意外险', percentage: 25, value: 11250000 },
    { category: '寿险', percentage: 20, value: 9000000 },
    { category: '车险', percentage: 10, value: 4500000 },
  ],
};

export default function ChannelAnalyticsView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last-6-months');

  const timeRanges: TimeRange[] = [
    { label: '最近 3 个月', value: 'last-3-months', days: 90 },
    { label: '最近 6 个月', value: 'last-6-months', days: 180 },
    { label: '最近 12 个月', value: 'last-12-months', days: 365 },
    { label: '本年至今', value: 'ytd', days: 245 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMaxValue = () => Math.max(...mockAnalytics.growthTrend.map(d => d.premium));

  // Calculate YTD stats
  const ytdStats = {
    months: selectedTimeRange === 'last-3-months' ? 3 : selectedTimeRange === 'last-6-months' ? 6 : selectedTimeRange === 'last-12-months' ? 12 : 8,
    premium: mockAnalytics.totalPremium * (mockAnalytics.growthTrend.length / 8),
    commission: mockAnalytics.totalCommission * (mockAnalytics.growthTrend.length / 8),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('channelAnalytics') || '渠道分析驾驶舱'}</h1>
            <p className="text-gray-600">{t('analyticsDescription') || '全面掌握渠道业务表现和增长趋势'} </p>
          </div>
          <button className="btn-secondary">
            <Download size={16} className="mr-2" />
            导出报告
          </button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTimeRange === range.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              onClick={() => setSelectedTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">总保费收入</h3>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(ytdStats.premium)}</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <TrendingUp size={12} /> ↑ {mockAnalytics.avgGrowthRate}% 同比
          </p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">佣金总额</h3>
            <Activity className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(ytdStats.commission)}</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <TrendingUp size={12} /> ↑ 15.2% 环比
          </p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">活跃渠道</h3>
            <Users className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{mockAnalytics.activeChannels}</p>
          <p className="text-xs text-gray-500">+3 本月新增</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">平均增长率</h3>
            <BarChart3 className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{mockAnalytics.avgGrowthRate}%</p>
          <p className="text-xs text-green-600">超出行业 12%</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">头部渠道</h3>
            <PieChart className="text-yellow-600" size={20} />
          </div>
          <p className="text-xl font-bold text-gray-900 mb-1 truncate" title={mockAnalytics.topPerformer}>
            {mockAnalytics.topPerformer}
          </p>
          <p className="text-xs text-green-600">贡献 28% 业绩</p>
        </div>
      </div>

      {/* Charts Row 1 - Growth Trend */}
      <div className="max-w-7xl mx-auto glass p-6 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            保费增长趋势
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-gray-600">保费收入</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span className="text-gray-600">佣金收入</span>
            </div>
          </div>
        </div>

        {/* Simple Bar Chart Visualization */}
        <div className="space-y-4">
          {mockAnalytics.growthTrend.map((data, index) => (
            <div key={data.month} className="relative">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 text-sm text-gray-600">{data.month}月</div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-40 bg-blue-100 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${(data.premium / getMaxValue()) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(data.premium)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-40 bg-green-100 rounded-full h-8 relative overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(data.commission / getMaxValue()) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-24 text-right">{formatCurrency(data.commission)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">最高单月保费</div>
            <div className="text-lg font-bold text-blue-600">{formatCurrency(6500000)}</div>
            <div className="text-xs text-gray-500">7 月份</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">最高单月佣金</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(1050000)}</div>
            <div className="text-xs text-gray-500">7 月份</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">季度总增长</div>
            <div className="text-lg font-bold text-purple-600">↑ 42.5%</div>
            <div className="text-xs text-gray-500">Q3 vs Q2</div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Channel Performance & Product Mix */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Channel Performance */}
        <div className="glass p-6 rounded-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            渠道表现排名
          </h2>
          <div className="space-y-4">
            {mockAnalytics.channelPerformance.slice(0, 5).map((channel, index) => (
              <div key={channel.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-900">{channel.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{formatCurrency(channel.premium)}</div>
                    <div className={`text-xs ${channel.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {channel.growth >= 0 ? '↑' : '↓'} {Math.abs(channel.growth)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${(channel.premium / mockAnalytics.channelPerformance[0].premium) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Mix */}
        <div className="glass p-6 rounded-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-purple-600" />
            产品类型分布
          </h2>
          <div className="space-y-4">
            {mockAnalytics.productMix.map((product) => (
              <div key={product.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{product.category}</span>
                  <div className="text-right">
                    <div className="font-bold text-purple-600">{formatCurrency(product.value)}</div>
                    <div className="text-xs text-gray-500">{product.percentage}%</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all"
                    style={{ width: `${product.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Mini Donut Chart Placeholder */}
          <div className="mt-6 flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="20" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="none" 
                  stroke="url(#gradient)" 
                  strokeWidth="20" 
                  strokeDasharray={`${45 * 2.51} 251`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">45%</div>
                  <div className="text-xs text-gray-500">主类别占比</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Insights */}
      <div className="max-w-7xl mx-auto glass p-6 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-green-600" />
          洞察与建议
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-600" size={18} />
              <h3 className="font-bold text-gray-900">增长机会</h3>
            </div>
            <p className="text-sm text-gray-700">
              MGA 渠道在健康险品类增长率达 35.8%，建议增加相关产品线投入
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-yellow-600" size={18} />
              <h3 className="font-bold text-gray-900">风险提示</h3>
            </div>
            <p className="text-sm text-gray-700">
              部分 MG 渠道出现负增长 (-5.2%)，需关注并制定挽回策略
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-blue-600" size={18} />
              <h3 className="font-bold text-gray-900">优化方向</h3>
            </div>
            <p className="text-sm text-gray-700">
              意外险类别市场份额仅占 25%，存在较大的增长潜力空间
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
