import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw,
  Settings,
  TrendingUp,
  Target
} from 'lucide-react';

interface UnderwritingRule {
  id: string;
  ruleName: string;
  ruleCategory: 'age' | 'health' | 'occupation' | 'coverageAmount' | 'stateCompliance';
  condition: string;
  action: 'approve' | 'reject' | 'manual_review' | 'conditional_approve';
  priority: number;
  isActive: boolean;
  effectiveDate: string;
  lastModifiedBy: string;
  successRate: number;
  applicationCount: number;
}

interface UnderwritingWorkflow {
  id: string;
  productName: string;
  workflowName: string;
  autoApprovalEnabled: boolean;
  manualReviewThreshold: number; // percentage
  rulesCount: number;
  avgProcessingTime: number; // minutes
  approvalRate: number;
  status: 'active' | 'draft' | 'deprecated';
}

interface ApplicationResult {
  id: string;
  policyNumber: string;
  applicantName: string;
  coverageAmount: number;
  age: number;
  healthStatus: string;
  occupation: string;
  state: string;
  submittedAt: string;
  underwritingDecision: 'approved' | 'rejected' | 'pending_manual' | 'conditional';
  appliedRules: string[];
  processingTime: string;
  riskScore: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Underwriting rules
const mockRules: UnderwritingRule[] = [
  {
    id: 'rule001',
    ruleName: '年龄超限拒保规则',
    ruleCategory: 'age',
    condition: 'age > 70',
    action: 'reject',
    priority: 1,
    isActive: true,
    effectiveDate: '2026-01-01',
    lastModifiedBy: '核保经理 A',
    successRate: 98.5,
    applicationCount: 1250,
  },
  {
    id: 'rule002',
    ruleName: '高风险职业人工审核',
    ruleCategory: 'occupation',
    condition: 'occupation in ["mining", "construction", "piloting"]',
    action: 'manual_review',
    priority: 2,
    isActive: true,
    effectiveDate: '2026-01-01',
    lastModifiedBy: '核保团队 B',
    successRate: 87.3,
    applicationCount: 856,
  },
  {
    id: 'rule003',
    ruleName: '高额保障健康告知核查',
    ruleCategory: 'coverageAmount',
    condition: 'coverageAmount > 500000 && health_status == "declared"',
    action: 'conditional_approve',
    priority: 3,
    isActive: true,
    effectiveDate: '2026-02-15',
    lastModifiedBy: '核保经理 A',
    successRate: 92.1,
    applicationCount: 423,
  },
  {
    id: 'rule004',
    ruleName: '加州医疗险合规校验',
    ruleCategory: 'stateCompliance',
    condition: 'state == "CA" && product == "medical_insurance"',
    action: 'approve',
    priority: 4,
    isActive: true,
    effectiveDate: '2026-03-01',
    lastModifiedBy: '合规专员 C',
    successRate: 99.2,
    applicationCount: 2340,
  },
  {
    id: 'rule005',
    ruleName: 'BMI 指数异常预警',
    ruleCategory: 'health',
    condition: 'bmi < 16 || bmi > 40',
    action: 'manual_review',
    priority: 5,
    isActive: false,
    effectiveDate: '2026-01-01',
    lastModifiedBy: '核保团队 B',
    successRate: 78.5,
    applicationCount: 189,
  },
];

// Mock data - Workflows
const mockWorkflows: UnderwritingWorkflow[] = [
  {
    id: 'wf001',
    productName: '重大疾病保险 A 款',
    workflowName: '标准核保流程',
    autoApprovalEnabled: true,
    manualReviewThreshold: 15,
    rulesCount: 23,
    avgProcessingTime: 2.5,
    approvalRate: 87.3,
    status: 'active',
  },
  {
    id: 'wf002',
    productName: '人寿保险基础版',
    workflowName: '简化核保流程',
    autoApprovalEnabled: true,
    manualReviewThreshold: 25,
    rulesCount: 18,
    avgProcessingTime: 1.8,
    approvalRate: 92.1,
    status: 'active',
  },
  {
    id: 'wf003',
    productName: '医疗保险精华版',
    workflowName: '全面核保流程',
    autoApprovalEnabled: false,
    manualReviewThreshold: 10,
    rulesCount: 35,
    avgProcessingTime: 8.5,
    approvalRate: 78.5,
    status: 'active',
  },
];

// Mock data - Recent applications
const mockApplications: ApplicationResult[] = [
  {
    id: 'app001',
    policyNumber: 'POL-2026-CA-001234',
    applicantName: '张伟',
    coverageAmount: 150000.00,
    age: 45,
    healthStatus: '良好',
    occupation: 'software_engineer',
    state: 'CA',
    submittedAt: '2026-08-31 14:30:00',
    underwritingDecision: 'approved',
    appliedRules: ['rule001', 'rule004'],
    processingTime: '2 分 15 秒',
    riskScore: 72,
  },
  {
    id: 'app002',
    policyNumber: 'POL-2026-NY-005678',
    applicantName: '李明',
    coverageAmount: 750000.00,
    age: 52,
    healthStatus: '需进一步核查',
    occupation: 'construction_manager',
    state: 'NY',
    submittedAt: '2026-08-31 13:15:00',
    underwritingDecision: 'pending_manual',
    appliedRules: ['rule002', 'rule003'],
    processingTime: '等待中',
    riskScore: 65,
  },
  {
    id: 'app003',
    policyNumber: 'POL-2026-TX-009012',
    applicantName: '王芳',
    coverageAmount: 350000.00,
    age: 38,
    healthStatus: '优秀',
    occupation: 'teacher',
    state: 'TX',
    submittedAt: '2026-08-31 11:45:00',
    underwritingDecision: 'approved',
    appliedRules: ['rule001'],
    processingTime: '1 分 30 秒',
    riskScore: 85,
  },
  {
    id: 'app004',
    policyNumber: 'POL-2026-FL-003456',
    applicantName: '赵敏',
    coverageAmount: 850000.00,
    age: 75,
    healthStatus: '一般',
    occupation: 'retired',
    state: 'FL',
    submittedAt: '2026-08-31 10:20:00',
    underwritingDecision: 'rejected',
    appliedRules: ['rule001'],
    processingTime: '0 分 45 秒',
    riskScore: 28,
  },
];

export function UnderwritingRuleEngineView({ navigateTo }: Props) {
  const { t } = useTranslation('product');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredRules = mockRules.filter(rule => {
    const matchesStatus = statusFilter === 'all' || rule.isActive.toString() === statusFilter;
    const matchesCategory = categoryFilter === 'all' || rule.ruleCategory === categoryFilter;
    return matchesStatus && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        isActive 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-gray-100 text-gray-800 border-gray-200'
      }`}>
        {isActive ? '已启用' : '已禁用'}
      </span>
    );
  };

  const getActionLabel = (action: UnderwritingRule['action']) => {
    const labels: Record<UnderwritingRule['action'], string> = {
      approve: '自动通过',
      reject: '直接拒绝',
      manual_review: '人工审核',
      conditional_approve: '条件通过',
    };
    return labels[action];
  };

  const getActionColor = (action: UnderwritingRule['action']) => {
    const colors: Record<UnderwritingRule['action'], string> = {
      approve: 'text-green-600 bg-green-50',
      reject: 'text-red-600 bg-red-50',
      manual_review: 'text-orange-600 bg-orange-50',
      conditional_approve: 'text-blue-600 bg-blue-50',
    };
    return colors[action];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              核保规则引擎
            </h1>
            <p className="text-gray-600">
              自动核保规则配置、风险评估模型与决策流程管理
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Upload size={16} className="mr-2" />
              批量导入规则
            </button>
            <button className="btn-primary">
              <Plus size={16} className="mr-2" />
              新建核保规则
            </button>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Shield size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">总规则数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockRules.length}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +3 个 本月新增
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">启用的规则</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockRules.filter(r => r.isActive).length}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              生效中
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">平均通过率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {((mockWorkflows.reduce((sum, w) => sum + w.approvalRate, 0) / mockWorkflows.length)).toFixed(1)}%
            </div>
            <div className="text-sm text-purple-600 font-semibold">
              +2.1% 环比
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Settings size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">平均处理时长</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(mockWorkflows.reduce((sum, w) => sum + w.avgProcessingTime, 0) / mockWorkflows.length).toFixed(1)}m
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              -0.5m 优化
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Target size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">待人工审核</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockApplications.filter(a => a.underwritingDecision === 'pending_manual').length}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              当前队列中
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">规则状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="true">已启用</option>
              <option value="false">已禁用</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">规则类别:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部类别</option>
              <option value="age">年龄限制</option>
              <option value="health">健康状况</option>
              <option value="occupation">职业类别</option>
              <option value="coverageAmount">保额限制</option>
              <option value="stateCompliance">州合规性</option>
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
              导出规则清单
            </button>
            <button className="btn-secondary">
              <Settings size={16} className="mr-2" />
              工作流测试器
            </button>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">核保规则列表</h2>
          <span className="text-sm text-gray-600">{filteredRules.length} 条规则</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">规则名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">规则类别</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">优先级</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">触发条件</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">执行动作</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">成功率</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">应用次数</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="font-bold text-gray-900">{rule.ruleName}</div>
                    <div className="text-xs text-gray-500 font-mono">{rule.id}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-sm text-gray-700 capitalize">
                      {rule.ruleCategory.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      rule.priority <= 2 ? 'bg-red-100 text-red-800' :
                      rule.priority <= 4 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      P{rule.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                      {rule.condition}
                    </code>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border inline-block ${getActionColor(rule.action)}`}>
                      {getActionLabel(rule.action)}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="bg-gray-200 rounded-full h-2 w-24 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            rule.successRate >= 95 ? 'bg-green-500' :
                            rule.successRate >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${rule.successRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-sm text-gray-900">{rule.successRate}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-sm">
                    <span className="font-mono font-semibold text-gray-900">
                      {rule.applicationCount.toLocaleString()}
                    </span>
                    <span className="text-gray-500 ml-1">次</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getStatusBadge(rule.isActive)}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button className="btn-secondary text-sm">
                        编辑规则
                      </button>
                      <button className="btn-secondary text-sm">
                        查看日志
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">核保工作流监控</h2>
          <button className="btn-primary">
            <Plus size={16} className="mr-2" />
            新建工作流
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockWorkflows.map((workflow) => (
            <div key={workflow.id} className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{workflow.workflowName}</h3>
                  <div className="text-xs text-gray-500">{workflow.productName}</div>
                </div>
                <Shield size={24} className="text-blue-600" />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">核保规则:</span>
                  <span className="font-semibold text-gray-900">{workflow.rulesCount} 条</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">自动核保:</span>
                  <span className={`font-semibold ${workflow.autoApprovalEnabled ? 'text-green-600' : 'text-gray-600'}`}>
                    {workflow.autoApprovalEnabled ? '✓ 启用' : '✗ 禁用'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">人工审核阈值:</span>
                  <span className="font-mono font-semibold text-orange-600">{workflow.manualReviewThreshold}%</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">平均处理时长</span>
                    <span className="font-bold text-gray-900">{workflow.avgProcessingTime}分钟</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">通过率</span>
                    <span className={`font-bold ${workflow.approvalRate >= 90 ? 'text-green-600' : workflow.approvalRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {workflow.approvalRate}%
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        workflow.approvalRate >= 90 ? 'bg-green-500' :
                        workflow.approvalRate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${workflow.approvalRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between gap-2">
                <button className="btn-secondary text-sm flex-1">
                  查看详情
                </button>
                <button className="btn-secondary text-sm flex-1">
                  测试规则
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">最近核保申请</h2>
          <button className="btn-secondary">
            <Filter size={16} className="mr-2" />
            高级筛选
          </button>
        </div>

        <div className="space-y-3">
          {mockApplications.map((app) => (
            <div
              key={app.id}
              className={`p-6 rounded-lg border transition-colors hover:shadow-md ${
                app.underwritingDecision === 'approved' ? 'bg-green-50 border-green-200' :
                app.underwritingDecision === 'rejected' ? 'bg-red-50 border-red-200' :
                app.underwritingDecision === 'pending_manual' ? 'bg-orange-50 border-orange-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">申请人</div>
                    <div className="font-semibold text-gray-900">{app.applicantName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">保额</div>
                    <div className="font-bold text-gray-900">{formatCurrency(app.coverageAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">年龄/州</div>
                    <div className="text-sm text-gray-700">{app.age}岁 · {app.state}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">职业</div>
                    <div className="text-sm text-gray-700 capitalize">{app.occupation.replace(/_/g, ' ')}</div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">健康状态</div>
                    <div className="text-sm font-semibold text-gray-900">{app.healthStatus}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">风险评分</div>
                    <div className={`text-lg font-bold ${
                      app.riskScore >= 80 ? 'text-green-600' :
                      app.riskScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {app.riskScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">处理时长</div>
                    <div className="text-sm text-gray-700">{app.processingTime}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    app.underwritingDecision === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    app.underwritingDecision === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' :
                    app.underwritingDecision === 'pending_manual' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                    'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {app.underwritingDecision === 'approved' && '✓ 已通过'}
                    {app.underwritingDecision === 'rejected' && '✗ 已拒绝'}
                    {app.underwritingDecision === 'pending_manual' && '⟳ 待人工审核'}
                    {app.underwritingDecision === 'conditional' && '● 条件通过'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Insight Box */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-orange-600 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-2">核保规则健康度建议</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✅ 优秀：</span>
                <span><strong>加州医疗险合规校验</strong> 成功率高达 99.2%，表现稳定可靠，建议推广至其他州使用</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">⚠️ 改进：</span>
                <span><strong>BMI 指数异常预警</strong> 已连续禁用 150 天且成功率仅 78.5%，建议删除或重新调整阈值</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">📈 趋势：</span>
                <span>近期大额保单（&gt;$500K）申请量增加 23%，建议加强高保额核保资源配置</span>
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
              <span className="text-gray-700">自动通过</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">自动拒绝</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-700">人工审核</span>
            </div>
            <div className="ml-auto text-gray-500">
              最后更新：{new Date().toLocaleString('en-US')} | 
              数据来源：核保系统 V2.5
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
