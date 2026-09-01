import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Calculator, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Save,
  RefreshCw,
  Settings,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface RatePlan {
  id: string;
  productName: string;
  productCode: string;
  planName: string;
  effectiveDate: string;
  expiryDate?: string;
  status: 'active' | 'draft' | 'expired' | 'suspended';
  baseRate: number;
  ratingFactor: number;
  commissionRate: number;
  currency: string;
  coverageAmount: number;
  deductible: number;
  riskClass: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

interface RateConfigRule {
  id: string;
  ruleName: string;
  condition: string;
  action: string;
  priority: number;
  isActive: boolean;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Rate plans
const mockRatePlans: RatePlan[] = [
  {
    id: 'rp001',
    productName: '重大疾病保险 A 款',
    productCode: 'CI-A001',
    planName: '标准版保费计划',
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    baseRate: 1250.00,
    ratingFactor: 1.0,
    commissionRate: 16.0,
    currency: 'USD',
    coverageAmount: 50000.00,
    deductible: 0,
    riskClass: 'standard',
    lastModifiedBy: '精算师 A',
    lastModifiedAt: '2026-08-15 14:30:00',
  },
  {
    id: 'rp002',
    productName: '重大疾病保险 A 款',
    productCode: 'CI-A001',
    planName: 'Premium 高保额版',
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    baseRate: 2890.00,
    ratingFactor: 1.5,
    commissionRate: 18.0,
    currency: 'USD',
    coverageAmount: 100000.00,
    deductible: 0,
    riskClass: 'preferred',
    lastModifiedBy: '精算师 B',
    lastModifiedAt: '2026-08-20 10:15:00',
  },
  {
    id: 'rp003',
    productName: '人寿保险基础版',
    productCode: 'LT-B002',
    planName: 'Level Premium 均衡保费',
    effectiveDate: '2026-02-01',
    expiryDate: '2027-01-31',
    status: 'active',
    baseRate: 850.00,
    ratingFactor: 1.0,
    commissionRate: 15.0,
    currency: 'USD',
    coverageAmount: 250000.00,
    deductible: 0,
    riskClass: 'standard',
    lastModifiedBy: '精算师 A',
    lastModifiedAt: '2026-08-10 16:45:00',
  },
  {
    id: 'rp004',
    productName: '意外伤害保险',
    productCode: 'AI-C003',
    planName: 'Accident Pro 专业版',
    effectiveDate: '2026-03-01',
    expiryDate: undefined,
    status: 'draft',
    baseRate: 299.00,
    ratingFactor: 1.0,
    commissionRate: 12.0,
    currency: 'USD',
    coverageAmount: 50000.00,
    deductible: 100,
    riskClass: 'standard',
    lastModifiedBy: '产品经理 C',
    lastModifiedAt: '2026-08-28 09:30:00',
  },
  {
    id: 'rp005',
    productName: '医疗保险精华版',
    productCode: 'HL-D004',
    planName: 'HMO Network Plan',
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'suspended',
    baseRate: 1680.00,
    ratingFactor: 1.2,
    commissionRate: 17.0,
    currency: 'USD',
    coverageAmount: 1000000.00,
    deductible: 500,
    riskClass: 'standard',
    lastModifiedBy: '精算师 D',
    lastModifiedAt: '2026-07-15 11:00:00',
  },
];

// Mock data - Rating rules
const mockRatingRules: RateConfigRule[] = [
  {
    id: 'rule001',
    ruleName: '年龄因子调整规则',
    condition: 'age >= 50 && age < 60',
    action: 'rating_factor *= 1.2',
    priority: 1,
    isActive: true,
  },
  {
    id: 'rule002',
    ruleName: '地区风险系数',
    condition: 'state in ["CA", "NY"]',
    action: 'rating_factor *= 1.1',
    priority: 2,
    isActive: true,
  },
  {
    id: 'rule003',
    ruleName: '职业类别加成',
    condition: 'risk_class == "hazardous"',
    action: 'rating_factor *= 1.5',
    priority: 3,
    isActive: false,
  },
];

export function RatePlanEngineView({ navigateTo }: Props) {
  const { t } = useTranslation('product');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredPlans = mockRatePlans.filter(plan =>
    statusFilter === 'all' || plan.status === statusFilter
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: RatePlan['status']) => {
    const colors: Record<RatePlan['status'], string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      suspended: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    const labels: Record<RatePlan['status'], string> = {
      active: '生效中',
      draft: '草稿',
      expired: '已过期',
      suspended: '已停用',
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
              产品费率配置引擎
            </h1>
            <p className="text-gray-600">
              精算模型对接、费率因子计算与动态定价策略管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Upload size={16} className="mr-2" />
              批量导入
            </button>
            <button className="btn-primary">
              <Plus size={16} className="mr-2" />
              新建费率计划
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Calculator size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">总计费率计划</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockRatePlans.length}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +3 个 本月新增
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">生效中</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockRatePlans.filter(p => p.status === 'active').length}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              可用计费
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Settings size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">评分规则</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockRatingRules.length}
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              {mockRatingRules.filter(r => r.isActive).length} 个启用
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">平均佣金率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {((mockRatePlans.reduce((sum, p) => sum + p.commissionRate, 0) / mockRatePlans.length).toFixed(1)) + '%'}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              -1.2% 上月优化
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">费率状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="active">生效中</option>
              <option value="draft">草稿</option>
              <option value="expired">已过期</option>
              <option value="suspended">已停用</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">产品类型:</label>
            <select className="select">
              <option value="all">全品类</option>
              <option value="critical_illness">重大疾病保险</option>
              <option value="life">人寿保险</option>
              <option value="accident">意外伤害</option>
              <option value="health">医疗保险</option>
            </select>
          </div>

          <div className="flex-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`btn-secondary ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw 
                size={16} 
                className={`${isRefreshing ? 'animate-spin' : ''} mr-2`}
              />
              刷新数据
            </button>
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出 Excel
            </button>
            <button className="btn-secondary">
              <Settings size={16} className="mr-2" />
              费率计算器
            </button>
          </div>
        </div>
      </div>

      {/* Rate Plans Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">费率计划列表</h2>
          <span className="text-sm text-gray-600">{filteredPlans.length} 个计划</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">计划名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">产品名称/代码</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">基础保费</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">费率因子</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">佣金率</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保额/免赔额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保障期限</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((plan) => (
                <tr 
                  key={plan.id} 
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    plan.status === 'active' ? '' : plan.status === 'draft' ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}
                >
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{plan.planName}</div>
                    <div className="text-xs text-gray-500 font-mono">#{plan.id}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{plan.productName}</div>
                    <div className="text-xs text-gray-500 font-mono">{plan.productCode}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(plan.baseRate)}
                    </div>
                    <div className="text-xs text-gray-500">{plan.currency}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm font-semibold text-purple-600">×{plan.ratingFactor.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">调整系数</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="text-sm font-bold text-orange-600">{plan.commissionRate}%</div>
                    <div className="text-xs text-gray-500">渠道佣金</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm">
                    <div className="text-gray-900">保额：<strong>{formatCurrency(plan.coverageAmount)}</strong></div>
                    <div className="text-gray-500 text-xs mt-1">免赔额：{plan.deductible > 0 ? formatCurrency(plan.deductible) : '-'}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    <div>生效：{plan.effectiveDate}</div>
                    {plan.expiryDate && (
                      <div className="text-gray-500">到期：{plan.expiryDate}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getStatusBadge(plan.status)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-sm">
                        编辑
                      </button>
                      {plan.status === 'active' && (
                        <button className="btn-secondary text-sm">
                          暂停
                        </button>
                      )}
                      <button className="btn-secondary text-sm">
                        历史版本
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredPlans.length === 0 && (
          <div className="text-center py-12">
            <Calculator size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无费率计划</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的费率计划数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(5, filteredPlans.length)} 共 {filteredPlans.length} 个
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" disabled>
              上一页
            </button>
            <button className="btn-secondary">
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* Rating Rules Section */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">动态评分规则库</h2>
          </div>
          <button className="btn-primary">
            <Plus size={16} className="mr-2" />
            新增评分规则
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRatingRules.map((rule) => (
            <div
              key={rule.id}
              className="p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{rule.ruleName}</h3>
                  <div className="text-xs text-gray-500">优先级：{rule.priority}</div>
                </div>
                {rule.isActive ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-xs text-gray-600">
                  <strong className="text-gray-700">条件:</strong>
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{rule.condition}</code>
                </div>
                <div className="text-xs text-gray-600">
                  <strong className="text-gray-700">动作:</strong>
                  <code className="ml-2 bg-blue-50 text-blue-700 px-2 py-1 rounded">{rule.action}</code>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {rule.isActive ? '已启用' : '已禁用'}
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  编辑规则
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI Suggestion Box */}
        <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-purple-600 mt-0.5" />
            <div>
              <div className="font-bold text-purple-900 mb-1">AI 费率优化建议</div>
              <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
                <li>建议为 50-60 岁年龄段新增阶梯式保费递增因子 (+0.15)</li>
                <li>California 州医疗成本上涨 8%，建议更新区域风险系数</li>
                <li>职业类别 hazardous 的规则已禁用超过 30 天，是否删除？</li>
              </ul>
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
              <span className="text-gray-700">基础保费</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-700">费率因子</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">佣金率</span>
            </div>
            <div className="ml-auto text-gray-500">
              最后更新：{new Date().toLocaleString('en-US')} | 
              数据来源：精算系统 V3.2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
