import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Building2
} from 'lucide-react';

interface FinancialKPI {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  profitMargin: number;
  growthRate: number;
  topChannel: string;
  topChannelRevenue: number;
  pendingReceivables: number;
  monthlyGrowth: number;
  quarterlyProjection: number;
}

interface RevenueTrend {
  month: string;
  revenue: number;
  commission: number;
  expenses: number;
  profit: number;
}

interface ChannelPerformance {
  name: string;
  revenue: number;
  growth: number;
  marketShare: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Full year financial performance
const mockKPI: FinancialKPI = {
  totalRevenue: 45670000,
  totalExpenses: 8230000,
  netIncome: 37440000,
  profitMargin: 82.0,
  growthRate: 18.5,
  topChannel: '深圳 MGA 总部',
  topChannelRevenue: 12500000,
  pendingReceivables: 3450000,
  monthlyGrowth: 12.3,
  quarterlyProjection: 52000000,
};

// Mock data - Monthly trends
const mockTrends: RevenueTrend[] = [
  { month: 'Jan', revenue: 3200000, commission: 650000, expenses: 580000, profit: 2620000 },
  { month: 'Feb', revenue: 3450000, commission: 720000, expenses: 590000, profit: 2730000 },
  { month: 'Mar', revenue: 3800000, commission: 780000, expenses: 610000, profit: 3010000 },
  { month: 'Apr', revenue: 3650000, commission: 740000, expenses: 600000, profit: 2910000 },
  { month: 'May', revenue: 4100000, commission: 850000, expenses: 630000, profit: 3250000 },
  { month: 'Jun', revenue: 4350000, commission: 900000, expenses: 650000, profit: 3450000 },
  { month: 'Jul', revenue: 4800000, commission: 980000, expenses: 680000, profit: 3820000 },
  { month: 'Aug', revenue: 3720000, commission: 750000, expenses: 570000, profit: 3000000 },
];

// Mock data - Channel performance
const mockChannels: ChannelPerformance[] = [
  { name: '深圳 MGA 总部', revenue: 12500000, growth: 25.3, marketShare: 27.4 },
  { name: '纽约 MG 分部', revenue: 9800000, growth: 18.7, marketShare: 21.5 },
  { name: '上海代理点', revenue: 7200000, growth: 15.2, marketShare: 15.8 },
  { name: '北京经纪门店', revenue: 6500000, growth: 12.4, marketShare: 14.2 },
  { name: '广州办事处', revenue: 5170000, growth: 8.9, marketShare: 11.3 },
];

// Mock data - Expense breakdown
const mockExpenses: ExpenseBreakdown[] = [
  { category: '渠道佣金', amount: 7280000, percentage: 15.9, trend: 'up' },
  { category: '运营成本', amount: 450000, percentage: 1.0, trend: 'stable' },
  { category: '合规费用', amount: 280000, percentage: 0.6, trend: 'up' },
  { category: '技术服务费', amount: 150000, percentage: 0.3, trend: 'down' },
];

const statusColors = {
  up: 'text-green-600 bg-green-100',
  down: 'text-red-600 bg-red-100',
  stable: 'text-gray-600 bg-gray-100',
};

export function FinancialSummaryView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [timeRange, setTimeRange] = useState('year-to-date');
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

  const maxRevenue = Math.max(...mockTrends.map(t => t.revenue));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              财务摘要驾驶舱
            </h1>
            <p className="text-gray-600">
              全维度财务指标可视化与 AI 驱动的洞察建议
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

        {/* Time Range Selector */}
        <div className="flex items-center gap-3 mb-6">
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">总收入</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockKPI.totalRevenue)}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
              <TrendingUp size={14} />
              <span>+{mockKPI.monthlyGrowth}% 环比</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Activity size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">总支出</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockKPI.totalExpenses)}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600 font-semibold">
              <TrendingDown size={14} />
              <span>-3.2% 环比</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">净利润</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockKPI.netIncome)}
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
              <TrendingUp size={14} />
              <span>+{mockKPI.growthRate}% 同比</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">利润率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockKPI.profitMargin}%
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600 font-semibold">
              <TrendingUp size={14} />
              <span>+4.5% 上月</span>
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CreditCard size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">待收款</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockKPI.pendingReceivables)}
            </div>
            <div className="flex items-center gap-1 text-sm text-yellow-600 font-semibold">
              <AlertTriangle size={14} />
              <span>3 笔逾期</span>
            </div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Bar Chart */}
          <div className="lg:col-span-2 glass p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">月度收支趋势</h3>
            <div className="space-y-3">
              {mockTrends.map((trend) => (
                <div key={trend.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-700 w-8">{trend.month}</span>
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>收入</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-green-500 h-full rounded-full transition-all"
                            style={{ width: `${(trend.revenue / maxRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>支出</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full transition-all"
                            style={{ width: `${(trend.expenses / maxRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(trend.revenue)}
                      </div>
                      <div className="text-sm font-bold text-blue-600">
                        {formatCurrency(trend.profit)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">收入</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">支出</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">利润</span>
              </div>
            </div>
          </div>

          {/* Top Channel Card */}
          <div className="glass p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">头部渠道贡献</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{mockKPI.topChannel}</div>
                    <div className="text-xs text-gray-500">Top Performer</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg text-green-600">
                    {formatCurrency(mockKPI.topChannelRevenue)}
                  </div>
                  <div className="text-xs text-green-600 font-semibold">
                    +{mockKPI.growthRate}% 增长
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-600 mb-2">市场占比：</div>
                <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full"
                    style={{ width: '27.4%' }}
                  />
                </div>
                <div className="text-right text-sm font-semibold text-blue-600 mt-1">
                  {mockChannels[0].marketShare}%
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  <span className="font-semibold text-blue-900">季度预测</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(mockKPI.quarterlyProjection)}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  预计增长率：+15.2%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Performance Table */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">渠道业绩排行榜</h2>
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出排行
            </button>
          </div>

          <div className="space-y-3">
            {mockChannels.map((channel, index) => (
              <div
                key={channel.name}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{channel.name}</div>
                    <div className="text-xs text-gray-500">市场份额：{channel.marketShare}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(channel.revenue)}</div>
                  <div className={`text-xs font-semibold ${
                    channel.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {channel.growth >= 0 ? '+' : ''}{channel.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="glass p-8 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">支出构成分析</h2>
            <button className="btn-secondary">
              <PieChart size={16} className="mr-2" />
              饼图视图
            </button>
          </div>

          <div className="space-y-4">
            {mockExpenses.map((expense) => (
              <div key={expense.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-700">{expense.category}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[expense.trend]}`}>
                      {expense.trend === 'up' && '↑ 上升'}
                      {expense.trend === 'down' && '↓ 下降'}
                      {expense.trend === 'stable' && '→ 稳定'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{formatCurrency(expense.amount)}</div>
                    <div className="text-sm text-gray-500">{expense.percentage}% 总支出</div>
                  </div>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all"
                    style={{ width: `${expense.percentage * 2}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">总支出</span>
                <span className="font-bold text-red-600">{formatCurrency(mockKPI.totalExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Insight Card */}
          <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3">
              <BarChart3 size={20} className="text-purple-600 mt-0.5" />
              <div>
                <div className="font-bold text-purple-900 mb-1">AI 洞察建议</div>
                <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                  <li>渠道佣金占总支出 88.5%，需优化费率结构</li>
                  <li>运营成本同比下降 3.2%，继续保持高效管理</li>
                  <li>建议增加技术服务投入以提升自动化水平</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">收入增长</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">支出</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">利润</span>
            </div>
          </div>
          <div className="text-gray-500">
            最后更新：{new Date().toLocaleString('en-US')} | 
            数据来源：财务结算系统
          </div>
        </div>
      </div>
    </div>
  );
}
