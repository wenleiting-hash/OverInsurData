import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Calculator, 
  Database, 
  Settings, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw,
  TrendingUp,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';

interface ActuarialModel {
  id: string;
  modelName: string;
  modelType: 'mortality' | 'morbidity' | 'lapsation' | 'pricing' | 'reserving';
  version: string;
  provider: string;
  status: 'active' | 'testing' | 'deprecated' | 'maintenance';
  lastUpdated: string;
  updatedBy: string;
  accuracyScore: number;
  coverageProducts: number;
  avgCalculationTime: number; // seconds
}

interface ModelTestResult {
  id: string;
  modelName: string;
  testDate: string;
  testDataSize: number;
  accuracy: number;
  confidenceInterval: string;
  status: 'passed' | 'failed' | 'pending';
  duration: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Actuarial models
const mockModels: ActuarialModel[] = [
  {
    id: 'model001',
    modelName: 'US Mortality 2024 Premium Table',
    modelType: 'mortality',
    version: '2024.1',
    provider: 'SOA (Society of Actuaries)',
    status: 'active',
    lastUpdated: '2026-01-15',
    updatedBy: '首席精算师 A',
    accuracyScore: 97.5,
    coverageProducts: 45,
    avgCalculationTime: 0.23,
  },
  {
    id: 'model002',
    modelName: 'Critical Illness Morbidity Model',
    modelType: 'morbidity',
    version: '3.2.1',
    provider: 'Internal Development',
    status: 'active',
    lastUpdated: '2026-06-20',
    updatedBy: '精算团队 B',
    accuracyScore: 94.8,
    coverageProducts: 28,
    avgCalculationTime: 0.45,
  },
  {
    id: 'model003',
    modelName: 'Policy Lapsation Prediction AI',
    modelType: 'lapsation',
    version: '1.5.0',
    provider: 'Machine Learning Pipeline',
    status: 'testing',
    lastUpdated: '2026-08-25',
    updatedBy: '数据科学家 C',
    accuracyScore: 89.2,
    coverageProducts: 15,
    avgCalculationTime: 1.20,
  },
  {
    id: 'model004',
    modelName: 'Commercial Rate Pricing Engine',
    modelType: 'pricing',
    version: '5.1.3',
    provider: 'Guy Carpenter Solution',
    status: 'active',
    lastUpdated: '2026-03-10',
    updatedBy: '精算师 D',
    accuracyScore: 96.1,
    coverageProducts: 67,
    avgCalculationTime: 0.35,
  },
  {
    id: 'model005',
    modelName: 'Reserving Claims Reserve Std',
    modelType: 'reserving',
    version: '2.8.0',
    provider: 'Milliman ProSuite',
    status: 'deprecated',
    lastUpdated: '2025-12-01',
    updatedBy: '精算团队 A',
    accuracyScore: 91.5,
    coverageProducts: 23,
    avgCalculationTime: 0.67,
  },
];

// Mock data - Test results
const mockTestResults: ModelTestResult[] = [
  {
    id: 'test001',
    modelName: 'US Mortality 2024 Premium Table',
    testDate: '2026-08-30',
    testDataSize: 50000,
    accuracy: 97.8,
    confidenceInterval: '±2.1%',
    status: 'passed',
    duration: '45 mins',
  },
  {
    id: 'test002',
    modelName: 'Critical Illness Morbidity Model',
    testDate: '2026-08-29',
    testDataSize: 35000,
    accuracy: 95.2,
    confidenceInterval: '±3.5%',
    status: 'passed',
    duration: '1 hour 20 mins',
  },
  {
    id: 'test003',
    modelName: 'Policy Lapsation Prediction AI',
    testDate: '2026-08-28',
    testDataSize: 25000,
    accuracy: 88.5,
    confidenceInterval: '±5.2%',
    status: 'failed',
    duration: '2 hours 15 mins',
  },
];

export function ActuarialModelIntegrationView({ navigateTo }: Props) {
  const { t } = useTranslation('product');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredModels = mockModels.filter(model => {
    const matchesStatus = statusFilter === 'all' || model.status === statusFilter;
    const matchesType = typeFilter === 'all' || model.modelType === typeFilter;
    return matchesStatus && matchesType;
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getStatusBadge = (status: ActuarialModel['status']) => {
    const colors: Record<ActuarialModel['status'], string> = {
      active: 'bg-green-100 text-green-800 border-green-200',
      testing: 'bg-blue-100 text-blue-800 border-blue-200',
      deprecated: 'bg-gray-100 text-gray-800 border-gray-200',
      maintenance: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    
    const labels: Record<ActuarialModel['status'], string> = {
      active: '运行中',
      testing: '测试中',
      deprecated: '已废弃',
      maintenance: '维护中',
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTypeLabel = (type: ActuarialModel['modelType']) => {
    const labels: Record<ActuarialModel['modelType'], string> = {
      mortality: '死亡率表',
      morbidity: '发病率表',
      lapsation: '退保预测',
      pricing: '定价引擎',
      reserving: '准备金评估',
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              精算模型对接门户
            </h1>
            <p className="text-gray-600">
              精算模型注册、版本管理、准确率验证与生产部署
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Database size={16} className="mr-2" />
              导入模型
            </button>
            <button className="btn-primary">
              <Plus size={16} className="mr-2" />
              新建模型配置
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Database size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">总模型数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockModels.length}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +2 个 本季新增
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">生产模型</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockModels.filter(m => m.status === 'active').length}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              覆盖全部产品线
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">平均准确率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(mockModels.reduce((sum, m) => sum + m.accuracyScore, 0) / mockModels.length)}%
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              +2.3% YoY
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Calculator size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">平均耗时</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(mockModels.reduce((sum, m) => sum + m.avgCalculationTime, 0) / mockModels.length).toFixed(2)}s
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              -0.15s 优化
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">待测模型</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockModels.filter(m => m.status === 'testing').length}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              1 个 在队列中
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">模型状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="active">运行中</option>
              <option value="testing">测试中</option>
              <option value="deprecated">已废弃</option>
              <option value="maintenance">维护中</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">模型类型:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部类型</option>
              <option value="mortality">死亡率表</option>
              <option value="morbidity">发病率表</option>
              <option value="lapsation">退保预测</option>
              <option value="pricing">定价引擎</option>
              <option value="reserving">准备金评估</option>
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
              导出模型清单
            </button>
            <button className="btn-secondary">
              <Upload size={16} className="mr-2" />
              批量更新元数据
            </button>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">精算模型库</h2>
          <span className="text-sm text-gray-600">{filteredModels.length} 个模型</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Database size={28} className="text-blue-600" />
                  <div>
                    <h3 className="font-bold text-gray-900 line-clamp-1">{model.modelName}</h3>
                    <div className="text-xs text-gray-500">{getTypeLabel(model.modelType)}</div>
                  </div>
                </div>
                {getStatusBadge(model.status)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">版本号:</span>
                  <span className="font-mono font-semibold text-gray-900">{model.version}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">提供商:</span>
                  <span className="text-gray-700 line-clamp-1 max-w-[180px]">{model.provider}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">最后更新:</span>
                  <span className="text-gray-700">{model.lastUpdated}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">更新人:</span>
                  <span className="text-gray-700">{model.updatedBy}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">准确率</span>
                    <span className={`font-bold ${model.accuracyScore >= 95 ? 'text-green-600' : model.accuracyScore >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {model.accuracyScore}%
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        model.accuracyScore >= 95 ? 'bg-green-500' : 
                        model.accuracyScore >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${model.accuracyScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">覆盖产品:</span>
                  <span className="font-semibold text-gray-900">{model.coverageProducts} 个</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">平均耗时:</span>
                  <span className="font-mono font-semibold text-gray-900">{model.avgCalculationTime.toFixed(3)}s</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                <button className="btn-secondary text-sm flex-1">
                  查看详情
                </button>
                {model.status === 'active' ? (
                  <button className="btn-secondary text-sm flex-1">
                    <Pause size={14} className="mr-1" />
                    暂停服务
                  </button>
                ) : (
                  <button className="btn-primary text-sm flex-1">
                    <Play size={14} className="mr-1" />
                    启动服务
                  </button>
                )}
                <button className="btn-secondary text-sm flex-1">
                  测试模型
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Test Results */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">近期测试结果</h2>
          </div>
          <button className="btn-primary">
            <Play size={16} className="mr-2" />
            立即测试
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">模型名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">测试日期</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">测试样本量</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">准确率</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">置信区间</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">执行时长</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockTestResults.map((result) => (
                <tr key={result.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{result.modelName}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    {result.testDate}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm">
                    <span className="font-mono font-semibold text-gray-900">
                      {result.testDataSize.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">条记录</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${
                        result.accuracy >= 95 ? 'text-green-600' : 
                        result.accuracy >= 90 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.accuracy}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    {result.confidenceInterval}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                    {result.duration}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {result.status === 'passed' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        ✓ 通过
                      </span>
                    ) : result.status === 'failed' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        ✗ 失败
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        ○ 待处理
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-sm">
                        查看报告
                      </button>
                      {result.status === 'failed' && (
                        <button className="btn-secondary text-sm">
                          重试测试
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Suggestion Box */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-orange-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">精算模型健康度预警</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 font-bold">⚠️ 高危：</span>
                <span><strong>Policy Lapsation Prediction AI v1.5.0</strong> 最近一次测试准确率为 88.5%，低于 90% 合格线，建议重新训练模型或回退至稳定版本</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">⚡ 警告：</span>
                <span><strong>Reserving Claims Reserve Std v2.8.0</strong> 已标记为废弃状态超过 90 天，请确认是否有替代方案并清理相关配置</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✅ 建议：</span>
                <span>当前生产环境模型覆盖率已达 92%，建议下季度引入至少 1 个新的机器学习模型提升精度</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">运行中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">测试中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-gray-700">已废弃</span>
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
