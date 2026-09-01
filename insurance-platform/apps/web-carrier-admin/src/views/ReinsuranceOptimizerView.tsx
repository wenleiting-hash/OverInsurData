import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Layers, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Download, 
  Upload,
  RefreshCw,
  Settings,
  DollarSign,
  Activity
} from 'lucide-react';

interface ReinsuranceContract {
  id: string;
  contractNumber: string;
  contractName: string;
  contractType: 'quota_share' | 'surplus' | 'excess_of_loss' | 'stop_loss';
  cededLimit: number;
  retentionLimit: number;
  premiumAmount: number;
  cededPremium: number;
  recoveryRate: number;
  status: 'active' | 'suspended' | 'expired' | 'pending_approval';
  effectiveDate: string;
  expirationDate: string;
  counterparty: string;
  lastUpdated: string;
}

interface ClaimRecovery {
  id: string;
  claimNumber: string;
  policyNumber: string;
  insuredName: string;
  lossAmount: number;
  retainedAmount: number;
  cededAmount: number;
  recoveryStatus: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid';
  recoveryDate?: string;
  rejectionReason?: string;
}

interface ReinsuranceAnalysis {
  period: string;
  grossPremium: number;
  netPremium: number;
  grossLoss: number;
  netLoss: number;
  cededLoss: number;
  recoveryRatio: number; // ceded/gross loss
  costRatio: number; // ceded premium / gross premium
  protectionEffectiveness: number;
}

interface RiskProfile {
  lineOfBusiness: string;
  grossExposure: number;
  netExposure: number;
  reinsuranceCoverage: number;
  coveragePercentage: number;
  avgRetention: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const ReinsuranceOptimizerView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['product', 'channel']);

  // Mock data - 再保险合同
  const [contracts] = useState<ReinsuranceContract[]>([
    {
      id: 'reins001',
      contractNumber: 'REINS-QS-2024-001',
      contractName: '健康险成数分保协议',
      contractType: 'quota_share',
      cededLimit: 50000000,
      retentionLimit: 50000000,
      premiumAmount: 120000000,
      cededPremium: 60000000,
      recoveryRate: 50.0,
      status: 'active',
      effectiveDate: '2024-01-01',
      expirationDate: '2024-12-31',
      counterparty: 'Swiss Re',
      lastUpdated: '2024-08-15',
    },
    {
      id: 'reins002',
      contractNumber: 'REINS-EOL-2024-002',
      contractName: '重大疾病超额赔款协议',
      contractType: 'excess_of_loss',
      cededLimit: 100000000,
      retentionLimit: 10000000,
      premiumAmount: 85000000,
      cededPremium: 34000000,
      recoveryRate: 89.5,
      status: 'active',
      effectiveDate: '2024-01-01',
      expirationDate: '2024-12-31',
      counterparty: 'Munich Re',
      lastUpdated: '2024-08-10',
    },
    {
      id: 'reins003',
      contractNumber: 'REINS-SURPLUS-2024-003',
      contractName: '长期寿险溢额分保安排',
      contractType: 'surplus',
      cededLimit: 75000000,
      retentionLimit: 25000000,
      premiumAmount: 150000000,
      cededPremium: 52500000,
      recoveryRate: 66.7,
      status: 'active',
      effectiveDate: '2024-01-01',
      expirationDate: '2025-06-30',
      counterparty: 'Lloyd\'s of London',
      lastUpdated: '2024-08-20',
    },
    {
      id: 'reins004',
      contractNumber: 'REINS-SL-2024-004',
      contractName: '累积止损保护协议',
      contractType: 'stop_loss',
      cededLimit: 20000000,
      retentionLimit: 80000000,
      premiumAmount: 95000000,
      cededPremium: 19000000,
      recoveryRate: 20.0,
      status: 'pending_approval',
      effectiveDate: '2024-07-01',
      expirationDate: '2024-12-31',
      counterparty: 'Aon Reinsurance Solutions',
      lastUpdated: '2024-08-25',
    },
    {
      id: 'reins005',
      contractNumber: 'REINS-QS-2023-005',
      contractName: '工伤险成数分保协议',
      contractType: 'quota_share',
      cededLimit: 30000000,
      retentionLimit: 30000000,
      premiumAmount: 60000000,
      cededPremium: 30000000,
      recoveryRate: 50.0,
      status: 'expired',
      effectiveDate: '2023-01-01',
      expirationDate: '2023-12-31',
      counterparty: 'Bayre Re',
      lastUpdated: '2024-01-15',
    },
  ]);

  // Mock data - 理赔摊回记录
  const [claimRecoveries] = useState<ClaimRecovery[]>([
    {
      id: 'rec001',
      claimNumber: 'CLM-2024-1234',
      policyNumber: 'POL-HC-001234',
      insuredName: 'John Smith',
      lossAmount: 125000.00,
      retainedAmount: 62500.00,
      cededAmount: 62500.00,
      recoveryStatus: 'approved',
      recoveryDate: '2024-08-20',
    },
    {
      id: 'rec002',
      claimNumber: 'CLM-2024-1235',
      policyNumber: 'DI-LTC-005678',
      insuredName: 'Jane Doe',
      lossAmount: 250000.00,
      retainedAmount: 50000.00,
      cededAmount: 200000.00,
      recoveryStatus: 'paid',
      recoveryDate: '2024-08-18',
    },
    {
      id: 'rec003',
      claimNumber: 'CLM-2024-1236',
      policyNumber: 'HC-PPO-009012',
      insuredName: 'Michael Johnson',
      lossAmount: 85000.00,
      retainedAmount: 85000.00,
      cededAmount: 0,
      recoveryStatus: 'pending',
    },
    {
      id: 'rec004',
      claimNumber: 'CLM-2024-1237',
      policyNumber: 'DI-CI-003456',
      insuredName: 'Emily Davis',
      lossAmount: 500000.00,
      retainedAmount: 50000.00,
      cededAmount: 450000.00,
      recoveryStatus: 'rejected',
      rejectionReason: 'Policy exclusion applies - pre-existing condition',
    },
    {
      id: 'rec005',
      claimNumber: 'CLM-2024-1238',
      policyNumber: 'HC-PPO-007890',
      insuredName: 'Robert Wilson',
      lossAmount: 45000.00,
      retainedAmount: 45000.00,
      cededAmount: 0,
      recoveryStatus: 'processing',
    },
  ]);

  // Mock data - 再保险分析
  const [analysis] = useState<ReinsuranceAnalysis[]>([
    { period: '2024-Q1', grossPremium: 180000000, netPremium: 125000000, grossLoss: 95000000, netLoss: 52000000, cededLoss: 43000000, recoveryRatio: 45.3, costRatio: 28.5, protectionEffectiveness: 82.5 },
    { period: '2024-Q2', grossPremium: 195000000, netPremium: 135000000, grossLoss: 102000000, netLoss: 55000000, cededLoss: 47000000, recoveryRatio: 46.1, costRatio: 29.2, protectionEffectiveness: 84.2 },
    { period: '2024-Q3', grossPremium: 210000000, netPremium: 142000000, grossLoss: 108000000, netLoss: 58000000, cededLoss: 50000000, recoveryRatio: 46.3, costRatio: 30.1, protectionEffectiveness: 85.8 },
  ]);

  // Mock data - 风险敞口概况
  const [riskProfiles] = useState<RiskProfile[]>([
    { lineOfBusiness: 'Health Insurance (Medical)', grossExposure: 850000000, netExposure: 520000000, reinsuranceCoverage: 330000000, coveragePercentage: 38.8, avgRetention: 61.2 },
    { lineOfBusiness: 'Disability Income', grossExposure: 420000000, netExposure: 180000000, reinsuranceCoverage: 240000000, coveragePercentage: 57.1, avgRetention: 42.9 },
    { lineOfBusiness: 'Critical Illness', grossExposure: 380000000, netExposure: 120000000, reinsuranceCoverage: 260000000, coveragePercentage: 68.4, avgRetention: 31.6 },
    { lineOfBusiness: 'Long-term Care', grossExposure: 550000000, netExposure: 340000000, reinsuranceCoverage: 210000000, coveragePercentage: 38.2, avgRetention: 61.8 },
  ]);

  const totalCededPremium = contracts.reduce((sum, c) => sum + c.cededPremium, 0);
  const totalCededAmount = claimRecoveries.filter(r => r.recoveryStatus === 'paid').reduce((sum, r) => sum + r.cededAmount, 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const pendingApproval = contracts.filter(c => c.status === 'pending_approval').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'pending_approval':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getRecoveryStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getContractTypeLabel = (type: string) => {
    switch (type) {
      case 'quota_share':
        return '成数分保';
      case 'surplus':
        return '溢额分保';
      case 'excess_of_loss':
        return '超额赔款';
      case 'stop_loss':
        return '止损保护';
      default:
        return type;
    }
  };

  const handleRefreshData = () => {
    alert('已刷新最新再保险数据');
  };

  const handleOptimizeAllocation = () => {
    alert('正在运行再保险组合优化算法...');
  };

  const handleExportReport = () => {
    alert('正在导出再保险分析报告...');
  };

  const handleReprocessClaim = (id: string) => {
    alert(`已重新处理理赔摊回：${id}`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-purple-50 to-violet-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
              <Layers className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                再保险优化器
              </h1>
              <p className="text-gray-600">Reinsurance Optimization & Portfolio Management</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefreshData}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              刷新数据
            </button>
            <button
              onClick={handleOptimizeAllocation}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Settings size={18} />
              优化配置
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${(totalCededPremium / 1000000).toFixed(2)}M
          </div>
          <div className="text-sm text-gray-600">分保费总额</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <ShieldCheck className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs text-emerald-600 font-semibold">{(totalCededAmount / 1000000).toFixed(2)}M</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${totalCededAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-600">已摊回赔款</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Layers className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-purple-600 font-semibold">{activeContracts} 个</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{activeContracts}</div>
          <div className="text-sm text-gray-600">活跃合同</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <AlertTriangle className="text-orange-600" size={24} />
            </div>
            <span className="text-xs text-orange-600 font-semibold">需审批</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{pendingApproval}</div>
          <div className="text-sm text-gray-600">待审批合同</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-100 rounded-xl">
              <Activity className="text-indigo-600" size={24} />
            </div>
            <span className="text-xs text-indigo-600 font-semibold">85.2%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">85.2%</div>
          <div className="text-sm text-gray-600">平均保护效率</div>
        </div>
      </div>

      {/* Contract Overview Cards */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">再保险合同概览</h2>
              <p className="text-sm text-gray-500">Reinsurance Contract Overview</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium transition-colors">
            + 新建合同
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className={`p-4 rounded-xl border-l-4 transition-all cursor-pointer ${
                contract.status === 'active'
                  ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-500 hover:shadow-md'
                  : contract.status === 'pending_approval'
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-500 hover:shadow-md'
                  : contract.status === 'expired'
                  ? 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  contract.status === 'active' ? 'bg-emerald-200 text-emerald-700' :
                  contract.status === 'pending_approval' ? 'bg-blue-200 text-blue-700' :
                  contract.status === 'expired' ? 'bg-gray-200 text-gray-600' :
                  'bg-yellow-200 text-yellow-700'
                }`}>
                  {contract.status === 'active' && '✓ 有效'}
                  {contract.status === 'pending_approval' && '● 待审批'}
                  {contract.status === 'expired' && '✗ 已过期'}
                </span>
              </div>
              <div className="font-bold text-gray-900 mb-1 truncate" title={contract.contractName}>
                {contract.contractName}
              </div>
              <div className="text-xs text-gray-600 mb-2">{getContractTypeLabel(contract.contractType)}</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">分保限额:</span>
                  <strong className="text-gray-900">${(contract.cededLimit / 1000000).toFixed(0)}M</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">自留限额:</span>
                  <strong className="text-gray-900">${(contract.retentionLimit / 1000000).toFixed(0)}M</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">分保费率:</span>
                  <strong className="text-purple-600">{contract.recoveryRate.toFixed(1)}%</strong>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                到期：{contract.expirationDate}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Recovery Analysis Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">理赔摊回分析</h2>
            <p className="text-sm text-gray-500">Claim Recovery & Ceded Loss Analysis</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm">
                <option value="">所有状态</option>
                <option value="paid">已支付</option>
                <option value="approved">已批准</option>
                <option value="processing">处理中</option>
                <option value="rejected">拒绝</option>
              </select>
            </div>
            <button
              onClick={handleExportReport}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出报表
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">案件编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">保单号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">被保险人</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">损失金额</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">自留金额</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">分保金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">分摊比例</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">摊回状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">处理日期</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {claimRecoveries.map((recovery) => (
                <tr
                  key={recovery.id}
                  className="hover:bg-purple-50/50 border-b border-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{recovery.claimNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{recovery.policyNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{recovery.insuredName}</td>
                  <td className="py-3 px-4 text-right font-mono text-gray-700">${recovery.lossAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono text-orange-600">${recovery.retainedAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-purple-600">
                    ${recovery.cededAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-gray-600">
                      {recovery.lossAmount > 0 ? ((recovery.cededAmount / recovery.lossAmount) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getRecoveryStatusBadgeClass(recovery.recoveryStatus)}`}>
                      {recovery.recoveryStatus === 'paid' && '✓ 已支付'}
                      {recovery.recoveryStatus === 'approved' && '✓ 已批准'}
                      {recovery.recoveryStatus === 'processing' && '● 处理中'}
                      {recovery.recoveryStatus === 'pending' && '○ 待处理'}
                      {recovery.recoveryStatus === 'rejected' && '✗ 拒绝'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {recovery.recoveryDate || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {(recovery.recoveryStatus === 'rejected' || recovery.recoveryStatus === 'pending') && (
                      <button
                        onClick={() => handleReprocessClaim(recovery.id)}
                        className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      >
                        重新处理
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Line of Business Coverage Analysis */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">业务线风险覆盖分析</h2>
              <p className="text-sm text-gray-500">Line of Business Risk Coverage Analysis</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riskProfiles.map((profile) => (
            <div
              key={profile.lineOfBusiness}
              className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="font-semibold text-gray-900 mb-3 text-sm h-10 flex items-center overflow-hidden">
                {profile.lineOfBusiness}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">总敞口:</span>
                  <strong className="text-gray-900">${(profile.grossExposure / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">净敞口:</span>
                  <strong className="text-orange-600">${(profile.netExposure / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-teal-200">
                  <span className="text-gray-600">再保覆盖:</span>
                  <strong className="text-teal-600">${(profile.reinsuranceCoverage / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                      style={{ width: `${profile.coveragePercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-teal-600">
                    {profile.coveragePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 pt-1">
                  平均自留率：{profile.avgRetention.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quarterly Reinsurance Performance */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">季度再保险绩效分析</h2>
              <p className="text-sm text-gray-500">Quarterly Reinsurance Performance Metrics</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.map((item) => (
            <div
              key={item.period}
              className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="font-bold text-gray-900 mb-3 text-lg">{item.period}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between pb-2 border-b border-indigo-100">
                  <span className="text-gray-600">总保费:</span>
                  <strong className="text-gray-900">${(item.grossPremium / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-100">
                  <span className="text-gray-600">净保费:</span>
                  <strong className="text-purple-600">${(item.netPremium / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-100">
                  <span className="text-gray-600">总赔款:</span>
                  <strong className="text-gray-900">${(item.grossLoss / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-100">
                  <span className="text-gray-600">净赔款:</span>
                  <strong className="text-orange-600">${(item.netLoss / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="flex justify-between pb-2 border-b border-indigo-100">
                  <span className="text-gray-600">摊回赔款:</span>
                  <strong className="text-teal-600">${(item.cededLoss / 1000000).toFixed(1)}M</strong>
                </div>
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">摊回比率:</span>
                    <strong className={`${item.recoveryRatio >= 45 ? 'text-green-600' : 'text-yellow-600'}`}>{item.recoveryRatio.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">成本比率:</span>
                    <strong className={`${item.costRatio <= 30 ? 'text-green-600' : 'text-yellow-600'}`}>{item.costRatio.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">保护效率:</span>
                    <strong className={`${item.protectionEffectiveness >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>{item.protectionEffectiveness.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-purple-50 to-violet-50 p-5 rounded-xl border border-purple-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-purple-900 mb-2">AI 再保险组合优化建议</div>
            <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
              <li>Critical Illness 业务线再保险覆盖率已达 68.4%，显著高于行业基准 55%，可考虑降低分保费率至 28%-30%</li>
              <li>Emergency Room 索赔 $85K 未触达再保门槛，建议检查合同免赔额设置是否合理</li>
              <li>Q3 保护效率提升至 85.8%，主要得益于 Munich Re 超额赔款协议的生效，建议续签该协议</li>
              <li>Aon 的止损保护协议等待审批中，若获批将使整体自留率从 58% 降至 52%，增强财务稳定性</li>
              <li>观察到 Emily Davis 的重大疾病案被拒赔，原因是既往症免责条款，建议加强核保环节与再保合同的对齐</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReinsuranceOptimizerView;
