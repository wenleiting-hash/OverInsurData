import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Download, 
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface ProductLifecycle {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  launchDate: string;
  sunsetDate?: string;
  lifecycleStage: 'introduced' | 'growth' | 'mature' | 'decline' | 'sunsetting';
  status: 'active' | 'suspended' | 'retired';
  totalPremium: number;
  activePolicies: number;
  commissionRevenue: number;
  churnRate: number;
  profitabilityScore: number;
  lastUpdated: string;
}

interface LifecycleTrend {
  month: string;
  newProducts: number;
  retiredProducts: number;
  netGrowth: number;
  totalPremium: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Product lifecycles
const mockProducts: ProductLifecycle[] = [
  {
    id: 'prod001',
    productName: '重大疾病保险 A 款',
    productCode: 'CI-A001',
    category: 'Critical Illness',
    launchDate: '2024-01-15',
    sunsetDate: undefined,
    lifecycleStage: 'mature',
    status: 'active',
    totalPremium: 15670000.00,
    activePolicies: 3450,
    commissionRevenue: 2507200.00,
    churnRate: 8.5,
    profitabilityScore: 92.3,
    lastUpdated: '2026-08-30',
  },
  {
    id: 'prod002',
    productName: '人寿保险基础版',
    productCode: 'LT-B002',
    category: 'Life Insurance',
    launchDate: '2024-06-01',
    sunsetDate: undefined,
    lifecycleStage: 'growth',
    status: 'active',
    totalPremium: 8920000.00,
    activePolicies: 2180,
    commissionRevenue: 1338000.00,
    churnRate: 12.3,
    profitabilityScore: 85.7,
    lastUpdated: '2026-08-31',
  },
  {
    id: 'prod003',
    productName: '医疗保险精华版',
    productCode: 'HL-D004',
    category: 'Health Insurance',
    launchDate: '2023-03-20',
    sunsetDate: '2026-12-31',
    lifecycleStage: 'sunsetting',
    status: 'active',
    totalPremium: 3450000.00,
    activePolicies: 890,
    commissionRevenue: 586500.00,
    churnRate: 25.8,
    profitabilityScore: 68.2,
    lastUpdated: '2026-08-29',
  },
  {
    id: 'prod004',
    productName: '意外伤害保险 Pro',
    productCode: 'AI-C005',
    category: 'Accident Insurance',
    launchDate: '2026-01-10',
    sunsetDate: undefined,
    lifecycleStage: 'introduced',
    status: 'active',
    totalPremium: 1230000.00,
    activePolicies: 345,
    commissionRevenue: 147600.00,
    churnRate: 5.2,
    profitabilityScore: 72.5,
    lastUpdated: '2026-08-31',
  },
  {
    id: 'prod005',
    productName: '重疾险经典版',
    productCode: 'CI-E001',
    category: 'Critical Illness',
    launchDate: '2022-06-01',
    sunsetDate: '2026-09-30',
    lifecycleStage: 'decline',
    status: 'suspended',
    totalPremium: 2100000.00,
    activePolicies: 520,
    commissionRevenue: 336000.00,
    churnRate: 42.5,
    profitabilityScore: 45.8,
    lastUpdated: '2026-08-28',
  },
];

// Mock data - Lifecycle trends
const mockTrends: LifecycleTrend[] = [
  { month: 'Jan', newProducts: 3, retiredProducts: 1, netGrowth: 2, totalPremium: 32000000 },
  { month: 'Feb', newProducts: 2, retiredProducts: 0, netGrowth: 2, totalPremium: 34500000 },
  { month: 'Mar', newProducts: 4, retiredProducts: 1, netGrowth: 3, totalPremium: 37800000 },
  { month: 'Apr', newProducts: 1, retiredProducts: 2, netGrowth: -1, totalPremium: 36200000 },
  { month: 'May', newProducts: 3, retiredProducts: 0, netGrowth: 3, totalPremium: 39500000 },
  { month: 'Jun', newProducts: 2, retiredProducts: 1, netGrowth: 1, totalPremium: 41000000 },
  { month: 'Jul', newProducts: 5, retiredProducts: 2, netGrowth: 3, totalPremium: 43200000 },
  { month: 'Aug', newProducts: 2, retiredProducts: 1, netGrowth: 1, totalPremium: 45670000 },
];

export function ProductLifecycleDashboardView({ navigateTo }: Props) {
  const { t } = useTranslation('product');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesStage = stageFilter === 'all' || product.lifecycleStage === stageFilter;
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesStage && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getMaxPremium = () => Math.max(...mockTrends.map(t => t.totalPremium));

  const getStageBadge = (stage: ProductLifecycle['lifecycleStage']) => {
    const colors: Record<ProductLifecycle['lifecycleStage'], string> = {
      introduced: 'bg-blue-100 text-blue-800 border-blue-200',
      growth: 'bg-green-100 text-green-800 border-green-200',
      mature: 'bg-purple-100 text-purple-800 border-purple-200',
      decline: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      sunsetting: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    const labels: Record<ProductLifecycle['lifecycleStage'], string> = {
      introduced: '引入期',
      growth: '成长期',
      mature: '成熟期',
      decline: '衰退期',
      sunsetting: '退市期',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[stage]}`}>
        {labels[stage]}
      </span>
    );
  };

  const getStatusBadge = (status: ProductLifecycle['status']) => {
    const colors: Record<ProductLifecycle['status'], string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
      retired: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    
    const labels: Record<ProductLifecycle['status'], string> = {
      active: '运营中',
      suspended: '已暂停',
      retired: '已退休',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              产品生命周期驾驶舱
            </h1>
            <p className="text-gray-600">
              全产品组合生命周期监控、收益分析与退市决策支持
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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">总产品数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockProducts.length}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +5 个 今年新增
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">运营中</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockProducts.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              活跃状态
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">累计保费</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockProducts.reduce((sum, p) => sum + p.totalPremium, 0))}
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              +18.5% YoY
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Activity size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">平均佣金</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockProducts.reduce((sum, p) => sum + p.commissionRevenue, 0))}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              $9.3M 总收入
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">退市预警</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockProducts.filter(p => p.lifecycleStage === 'sunsetting').length}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              需紧急处理
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <PieChart size={24} className="text-indigo-600" />
              <span className="text-xs text-gray-500 font-medium">平均利润率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(mockProducts.reduce((sum, p) => sum + p.profitabilityScore, 0) / mockProducts.length).toFixed(1)}
            </div>
            <div className="text-sm text-indigo-600 font-semibold">
              得分/100
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Lifecycle Stage Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">生命周期阶段:</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部阶段</option>
              <option value="introduced">引入期</option>
              <option value="growth">成长期</option>
              <option value="mature">成熟期</option>
              <option value="decline">衰退期</option>
              <option value="sunsetting">退市期</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">产品状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="active">运营中</option>
              <option value="suspended">已暂停</option>
              <option value="retired">已退休</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">产品类型:</label>
            <select className="select">
              <option value="all">全品类</option>
              <option value="critical_illness">重大疾病保险</option>
              <option value="life">人寿保险</option>
              <option value="health">医疗保险</option>
              <option value="accident">意外伤害</option>
            </select>
          </div>

          <div className="flex-1"></div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出产品清单
            </button>
            <button className="btn-primary">
              <Calendar size={16} className="mr-2" />
              退市排期
            </button>
          </div>
        </div>
      </div>

      {/* Lifecycle Trends Chart */}
      <div className="glass p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">月度产品组合增长趋势</h3>
        <div className="space-y-3">
          {mockTrends.map((trend) => (
            <div key={trend.month} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700 w-8">{trend.month}</span>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>保费规模</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${(trend.totalPremium / getMaxPremium()) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-32 text-right space-y-1">
                    <div className="text-xs text-green-600">
                      ↑ +{trend.newProducts} 新品
                    </div>
                    <div className="text-xs text-red-600">
                      ↓ {trend.retiredProducts} 退市
                    </div>
                    <div className={`text-sm font-bold ${trend.netGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {trend.netGrowth >= 0 ? '+' : ''}{trend.netGrowth}
                    </div>
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(trend.totalPremium)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">产品生命周期列表</h2>
          <span className="text-sm text-gray-600">{filteredProducts.length} 个产品</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{product.productName}</h3>
                  <div className="text-xs text-gray-500 font-mono">{product.productCode}</div>
                </div>
                {getStageBadge(product.lifecycleStage)}
              </div>

              <div className="mb-3">
                {getStatusBadge(product.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">上线日期</div>
                    <div className="font-semibold text-gray-900">{product.launchDate}</div>
                  </div>
                  {product.sunsetDate && (
                    <div>
                      <div className="text-gray-500 text-xs">计划退市</div>
                      <div className="font-bold text-orange-600">{product.sunsetDate}</div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">累计保费</span>
                    <span className="font-bold text-gray-900">{formatCurrency(product.totalPremium)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">有效保单</span>
                    <span className="font-semibold text-gray-900">{product.activePolicies.toLocaleString()} 张</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">佣金收入</span>
                    <span className="font-bold text-orange-600">{formatCurrency(product.commissionRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">退费率</span>
                    <span className={`font-bold ${product.churnRate <= 10 ? 'text-green-600' : product.churnRate <= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.churnRate}%
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        product.churnRate <= 10 ? 'bg-green-500' :
                        product.churnRate <= 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(product.churnRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">盈利能力</span>
                    <span className={`font-bold ${product.profitabilityScore >= 85 ? 'text-green-600' : product.profitabilityScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {product.profitabilityScore}/100
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        product.profitabilityScore >= 85 ? 'bg-green-500' :
                        product.profitabilityScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${product.profitabilityScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                <button className="btn-secondary text-sm flex-1">
                  查看详情
                </button>
                {product.lifecycleStage === 'sunsetting' && (
                  <button className="btn-primary text-sm flex-1">
                    加速退市
                  </button>
                )}
                <button className="btn-secondary text-sm flex-1">
                  历史版本
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Decision Support */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={24} className="text-orange-600" />
          <h2 className="text-xl font-bold text-gray-900">AI 决策支持建议</h2>
        </div>

        <div className="space-y-3">
          {/* Sunsetting Products Alert */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-red-900 mb-1">紧急：退市期产品需关注</h4>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li><strong>医疗险精华版 HL-D004</strong> 计划退市日期 2026-12-31，剩余 92 天，当前退费率 25.8%，建议启动客户迁移方案</li>
                  <li><strong>重疾险经典版 CI-E001</strong> 已于 2026-09-30 退市，但仍有 520 张有效保单，需加强客服响应</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Growth Opportunity Alert */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-green-900 mb-1">机会：高增长产品可扩大投入</h4>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li><strong>人寿保险基础版 LT-B002</strong> 处于成长期，增长率 18.5%，建议增加营销预算并优化渠道策略</li>
                  <li><strong>意外险 Pro AI-C005</strong> 上市仅 8 个月，退费率仅 5.2%，具备爆款潜力</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Performance Optimization Alert */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-bold text-yellow-900 mb-1">建议：性能优化方向</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>重疾 A 款 CI-A001 利润率 92.3/100，建议考虑提高佣金激励比例以巩固市场地位</li>
                  <li>重疾险经典版 CI-E001 利润率降至 45.8/100，符合退市标准，建议加快清退节奏</li>
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
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">引入期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">成长期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">成熟期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">衰退期</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">退市期</span>
            </div>
            <div className="ml-auto text-gray-500">
              最后更新：{new Date().toLocaleString('en-US')} | 
              数据来源：产品管理系统 V3.1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
