import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Download, 
  Filter,
  RefreshCw,
  LineChart,
  Target
} from 'lucide-react';

interface BIAnalysisData {
  totalPremium: number;
  totalCommission: number;
  avgGrowthRate: number;
  activeChannels: number;
  topPerformer: string;
  growthTrend: Array<{ month: string; premium: number; commission: number; channels: number }>;
  channelPerformance: Array<{ name: string; premium: number; growth: number; marketShare: number }>;
  productMix: Array<{ category: string; percentage: number; value: number }>;
  stateDistribution: Array<{ state: string; premium: number; channels: number }>;
};

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Full year analytics with multi-dimensional drill-down
const mockBIAnalysis: BIAnalysisData = {
  totalPremium: 45670000,
  totalCommission: 7280000,
  avgGrowthRate: 18.5,
  activeChannels: 12,
  topPerformer: '深圳 MGA 总部',
  growthTrend: [
    { month: 'Jan', premium: 3200000, commission: 650000, channels: 8 },
    { month: 'Feb', premium: 3450000, commission: 720000, channels: 9 },
    { month: 'Mar', premium: 3800000, commission: 780000, channels: 9 },
    { month: 'Apr', premium: 3650000, commission: 740000, channels: 10 },
    { month: 'May', premium: 4100000, commission: 850000, channels: 11 },
    { month: 'Jun', premium: 4350000, commission: 900000, channels: 12 },
    { month: 'Jul', premium: 4800000, commission: 980000, channels: 12 },
    { month: 'Aug', premium: 3270000, commission: 660000, channels: 12 },
  ],
  channelPerformance: [
    { name: '深圳 MGA 总部', premium: 12500000, growth: 25.3, marketShare: 27.4 },
    { name: '纽约 MG 分部', premium: 9800000, growth: 18.7, marketShare: 21.5 },
    { name: '上海代理点', premium: 7200000, growth: 15.2, marketShare: 15.8 },
    { name: '北京经纪门店', premium: 6500000, growth: 12.4, marketShare: 14.2 },
    { name: '广州办事处', premium: 5170000, growth: 8.9, marketShare: 11.3 },
  ],
  productMix: [
    { category: '健康保险', percentage: 42.5, value: 19410000 },
    { category: '人寿保险', percentage: 28.3, value: 12924000 },
    { category: '财产保险', percentage: 18.7, value: 8540000 },
    { category: '意外伤害', percentage: 10.5, value: 4796000 },
  ],
  stateDistribution: [
    { state: 'California', premium: 13701000, channels: 4 },
    { state: 'New York', premium: 9800000, channels: 3 },
    { state: 'Texas', premium: 7200000, channels: 2 },
    { state: 'Florida', premium: 5670000, channels: 2 },
    { state: 'Other States', premium: 9299000, channels: 1 },
  ],
};

const statusColors = {
  up: 'text-green-600 bg-green-100',
  down: 'text-red-600 bg-red-100',
  stable: 'text-gray-600 bg-gray-100',
};

export function AdvancedAnalyticsView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [timeRange, setTimeRange] = useState('year-to-date');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const maxPremium = Math.max(...mockBIAnalysis.growthTrend.map(t => t.premium));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              高级 BI 分析驾驶舱
            </h1>
            <p className="text-gray-600">
              多维度数据分析、下钻洞察与 AI 驱动的预测建议
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`btn-secondary ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <RefreshCw 
              size={18} 
              className={`${isRefreshing ? 'animate-spin' : ''} mr-2`}
            />
            刷新数据
          </button>
        </div>

        {/* Time Range & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="select"
            >
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year-to-date">本年至今</option>
              <option value="last-year">去年</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Filter size={18} className="text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
            >
              <option value="all">全品类</option>
              <option value="health">健康保险</option>
              <option value="life">人寿保险</option>
              <option value="property">财产保险</option>
              <option value="accident">意外伤害</option>
            </select>
          </div>

          <div className="flex-1"></div>

          <button className="btn-primary">
            <Download size={16} className="mr-2" />
            导出 BI 报告
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">总保费收入</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockBIAnalysis.totalPremium)}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
              <TrendingUp size={14} />
              <span>+18.5% 同比增长</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Users size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">活跃渠道数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockBIAnalysis.activeChannels}
            </div>
            <div className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
              +3 个 上月新增
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">平均增长率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockBIAnalysis.avgGrowthRate}%
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
              <TrendingUp size={14} />
              <span>+5.2% 环比提升</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Target size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">头部渠道</span>
            </div>
            <div className="text-lg font-bold text-gray-900 mb-1 truncate">
              {mockBIAnalysis.topPerformer}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              贡献 27.4% 份额
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Activity size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">佣金支出</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockBIAnalysis.totalCommission)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 font-semibold">
              <TrendingDown size={14} />
              <span>-2.1% 费率优化</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Trend Chart */}
        <div className="lg:col-span-2 glass p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">月度趋势分析</h3>
          <div className="space-y-4">
            {mockBIAnalysis.growthTrend.map((trend) => (
              <div key={trend.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-700 w-8">{trend.month}</span>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>保费收入</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{ width: `${(trend.premium / maxPremium) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>佣金支出</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(trend.commission / maxPremium) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-semibold text-green-600">
                      {formatCurrency(trend.premium)}
                    </div>
                    <div className="text-xs text-gray-500">渠道：{trend.channels}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">保费收入</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">佣金支出</span>
            </div>
          </div>
        </div>

        {/* Top Channel Card */}
        <div className="glass p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top 渠道表现</h3>
          <div className="space-y-4">
            {mockBIAnalysis.channelPerformance.map((channel, index) => (
              <div
                key={channel.name}
                className="p-4 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{channel.name}</div>
                      <div className="text-xs text-gray-500">市场占比：{channel.marketShare}%</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-green-600">
                      {formatCurrency(channel.premium)}
                    </div>
                    <div className="text-xs text-green-600 font-semibold">
                      ↑ {channel.growth}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* AI Insight Box */}
          <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <LineChart size={20} className="text-purple-600 mt-0.5" />
              <div>
                <div className="font-bold text-purple-900 mb-1">AI 洞察预测</div>
                <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
                  <li>深圳 MGA 预计 Q4 增长 32%</li>
                  <li>新产品线需增加渠道培训</li>
                  <li>建议扩大加州市场投入</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Mix Pie Chart */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">产品类型分布</h2>
            <PieChart size={20} className="text-gray-400" />
          </div>

          <div className="space-y-4">
            {mockBIAnalysis.productMix.map((product) => (
              <div key={product.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-700">{product.category}</div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(product.value)}</div>
                    <div className="text-sm text-gray-500">{product.percentage}% 占比</div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${product.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary Card */}
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-900">
              <strong>关键发现：</strong>健康险占比最高（42.5%），但意外险增长率最快（+28% YoY）
            </div>
          </div>
        </div>

        {/* State Distribution Table */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">州别业务分布</h2>
            <Download size={16} className="text-gray-400" />
          </div>

          <div className="space-y-3">
            {mockBIAnalysis.stateDistribution.map((state) => (
              <div
                key={state.state}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{state.state}</div>
                  <div className="text-xs text-gray-500">活跃渠道：{state.channels}个</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatCurrency(state.premium)}
                  </div>
                  <div className="text-sm text-gray-500">占总保费</div>
                </div>
              </div>
            ))}
          </div>

          {/* Drill-down Action */}
          <div className="mt-6">
            <button className="btn-primary w-full">
              <Filter size={16} className="mr-2" />
              下钻到州级明细
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">保费收入增长</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">佣金支出</span>
            </div>
            <div className="ml-auto text-gray-500">
              最后更新：{new Date().toLocaleString('en-US')} | 
              数据来源：财务结算系统 + 渠道管理系统
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
