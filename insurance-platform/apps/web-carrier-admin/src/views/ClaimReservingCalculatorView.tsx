import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Download, 
  Upload,
  Settings,
  Clock,
  DollarSign,
  ShieldCheck
} from 'lucide-react';

interface ClaimReserving {
  id: string;
  claimNumber: string;
  policyNumber: string;
  insuredName: string;
  claimDate: string;
  incidentType: string;
  reportedAmount: number;
  reservedAmount: number;
  paidAmount: number;
  reserveStatus: 'initial' | 'adjusted' | 'closed' | 'resolved';
  caseNumber: number;
  reserveBasis: 'IBNR' | 'Case' | 'Paid' | 'Expected';
  lastAdjustmentDate?: string;
  nextReviewDate?: string;
}

interface ReserveAnalysis {
  period: string;
  totalClaims: number;
  totalReserved: number;
  totalPaid: number;
  averageCaseSize: number;
  reserveRatio: number; // paid/reserved ratio
}

interface IBNRProjection {
  developmentYear: string;
  incurredAmounts: number[]; // 累计已发生额 (链梯法数据)
  ultimateAmount: number;
  reserveNeeded: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  completionPercentage: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const ClaimReservingCalculatorView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['product', 'channel']);

  // Mock data - 准备金计提记录
  const [mockReserves] = useState<ClaimReserving[]>([
    {
      id: 'reserve001',
      claimNumber: 'CLM-2024-001',
      policyNumber: 'POL-HC-001234',
      insuredName: 'John Smith',
      claimDate: '2024-08-15',
      incidentType: 'Medical Expense',
      reportedAmount: 12500.00,
      reservedAmount: 10000.00,
      paidAmount: 8500.00,
      reserveStatus: 'adjusted',
      caseNumber: 1254,
      reserveBasis: 'Case',
      lastAdjustmentDate: '2024-08-20',
      nextReviewDate: '2024-09-15',
    },
    {
      id: 'reserve002',
      claimNumber: 'CLM-2024-002',
      policyNumber: 'POL-HC-005678',
      insuredName: 'Jane Doe',
      claimDate: '2024-08-10',
      incidentType: 'Major Surgery',
      reportedAmount: 85000.00,
      reservedAmount: 75000.00,
      paidAmount: 62000.00,
      reserveStatus: 'initial',
      caseNumber: 1255,
      reserveBasis: 'Case',
      lastAdjustmentDate: undefined,
      nextReviewDate: '2024-09-10',
    },
    {
      id: 'reserve003',
      claimNumber: 'CLM-2024-003',
      policyNumber: 'DI-LTC-009012',
      insuredName: 'Michael Johnson',
      claimDate: '2024-07-20',
      incidentType: 'Long-term Care',
      reportedAmount: 120000.00,
      reservedAmount: 95000.00,
      paidAmount: 45000.00,
      reserveStatus: 'adjusted',
      caseNumber: 1250,
      reserveBasis: 'IBNR',
      lastAdjustmentDate: '2024-08-15',
      nextReviewDate: '2024-10-20',
    },
    {
      id: 'reserve004',
      claimNumber: 'CLM-2024-004',
      policyNumber: 'DI-CI-003456',
      insuredName: 'Emily Davis',
      claimDate: '2024-06-05',
      incidentType: 'Critical Illness',
      reportedAmount: 200000.00,
      reservedAmount: 200000.00,
      paidAmount: 200000.00,
      reserveStatus: 'resolved',
      caseNumber: 1248,
      reserveBasis: 'Paid',
      lastAdjustmentDate: '2024-07-10',
      nextReviewDate: undefined,
    },
    {
      id: 'reserve005',
      claimNumber: 'CLM-2024-005',
      policyNumber: 'HC-PPO-007890',
      insuredName: 'Robert Wilson',
      claimDate: '2024-08-25',
      incidentType: 'Emergency Room',
      reportedAmount: 8500.00,
      reservedAmount: 6000.00,
      paidAmount: 5200.00,
      reserveStatus: 'initial',
      caseNumber: 1256,
      reserveBasis: 'Case',
      lastAdjustmentDate: undefined,
      nextReviewDate: '2024-09-25',
    },
  ]);

  // Mock data - IBNR 链梯法预测
  const [ibnrProjections] = useState<IBNRProjection[]>([
    {
      developmentYear: '2021',
      incurredAmounts: [12000000, 14500000, 15800000, 16200000],
      ultimateAmount: 16500000,
      reserveNeeded: 3200000,
      confidenceInterval: { lower: 2800000, upper: 3600000 },
      completionPercentage: 98.2,
    },
    {
      developmentYear: '2022',
      incurredAmounts: [14000000, 16200000, 17100000],
      ultimateAmount: 17500000,
      reserveNeeded: 3500000,
      confidenceInterval: { lower: 3000000, upper: 4000000 },
      completionPercentage: 92.6,
    },
    {
      developmentYear: '2023',
      incurredAmounts: [15500000, 17800000, 18500000, 18900000],
      ultimateAmount: 19200000,
      reserveNeeded: 3700000,
      confidenceInterval: { lower: 3200000, upper: 4200000 },
      completionPercentage: 96.9,
    },
    {
      developmentYear: '2024-YTD',
      incurredAmounts: [16000000],
      ultimateAmount: 20500000,
      reserveNeeded: 4100000,
      confidenceInterval: { lower: 3500000, upper: 4700000 },
      completionPercentage: 78.1,
    },
  ]);

  // Mock data - 准备金分析
  const [reservesAnalysis] = useState<ReserveAnalysis[]>([
    { period: '2024-Q1', totalClaims: 1250, totalReserved: 85000000, totalPaid: 52000000, averageCaseSize: 68000, reserveRatio: 61.2 },
    { period: '2024-Q2', totalClaims: 1380, totalReserved: 92000000, totalPaid: 58000000, averageCaseSize: 66700, reserveRatio: 63.0 },
    { period: '2024-Q3', totalClaims: 1420, totalReserved: 95000000, totalPaid: 62000000, averageCaseSize: 66900, reserveRatio: 65.3 },
  ]);

  const totalReserves = mockReserves.reduce((sum, r) => sum + r.reservedAmount, 0);
  const totalPaid = mockReserves.reduce((sum, r) => sum + r.paidAmount, 0);
  const pendingReserves = mockReserves.filter(r => r.reserveStatus !== 'resolved').length;
  const averageCompletion = ibnrProjections.reduce((sum, p) => sum + p.completionPercentage, 0) / ibnrProjections.length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'adjusted':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'initial':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'closed':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getBasisBadgeClass = (basis: string) => {
    switch (basis) {
      case 'IBNR':
        return 'bg-indigo-100 text-indigo-700';
      case 'Case':
        return 'bg-orange-100 text-orange-700';
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Expected':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleRefreshData = () => {
    alert('已刷新最新准备金数据');
  };

  const handleExportReport = () => {
    alert('正在导出准备金评估报告...');
  };

  const handleRecalculate = (id: string) => {
    alert(`已重新计算准备金：${id}`);
  };

  const handleDownloadTemplate = () => {
    alert('正在下载链梯法计算模板...');
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg">
              <Calculator className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                理赔准备金计算器
              </h1>
              <p className="text-gray-600">Claim Reserving Calculator & IBNR Estimation</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefreshData}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Clock size={18} />
              刷新数据
            </button>
            <button
              onClick={handleExportReport}
              className="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出报告
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
            ${totalReserves.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-600">总准备金余额</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs text-emerald-600 font-semibold">{((totalPaid / totalReserves) * 100).toFixed(1)}%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-600">累计已赔付</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <ShieldCheck className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{pendingReserves}</div>
          <div className="text-sm text-gray-600">待结案案件</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <FileText className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-purple-600 font-semibold">98.2%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{averageCompletion.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">平均结案率</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <span className="text-xs text-red-600 font-semibold">需关注</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {((totalReserves - totalPaid) / totalReserves * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">未决赔付率</div>
        </div>
      </div>

      {/* IBNR Chain Ladder Method Analysis */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">IBNR 链梯法精算模型</h2>
              <p className="text-sm text-gray-500">Incurred But Not Reported - Chain Ladder Projection</p>
            </div>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Upload size={16} />
            导入历史数据
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <th className="text-left py-3 px-4 font-bold text-gray-900">开发年度</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">累计已发生额（各周期）</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">终极成本估计</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">需计提准备金</th>
                <th className="text-right py-3 px-4 font-bold text-gray-900">置信区间</th>
                <th className="text-center py-3 px-4 font-bold text-gray-900">完成进度</th>
                <th className="text-left py-3 px-4 font-bold text-gray-900">风险评级</th>
              </tr>
            </thead>
            <tbody>
              {ibnrProjections.map((projection, index) => (
                <tr key={projection.developmentYear} className="hover:bg-indigo-50/50 border-b border-gray-100">
                  <td className="py-3 px-4 font-semibold text-gray-900">{projection.developmentYear}</td>
                  <td className="py-3 px-4 text-gray-700">
                    <div className="flex gap-2 text-sm">
                      {projection.incurredAmounts.map((amount: number, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-gray-600">
                          ${(amount / 1000000).toFixed(1)}M
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                    ${(projection.ultimateAmount / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                    ${(projection.reserveNeeded / 1000000).toFixed(2)}M
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-gray-600">
                    [${(projection.confidenceInterval.lower / 1000000).toFixed(2)}M, ${(projection.confidenceInterval.upper / 1000000).toFixed(2)}M]
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            projection.completionPercentage >= 95 ? 'bg-emerald-500' :
                            projection.completionPercentage >= 85 ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${projection.completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">
                        {projection.completionPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      projection.completionPercentage >= 95 ? 'bg-emerald-100 text-emerald-700' :
                      projection.completionPercentage >= 85 ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {projection.completionPercentage >= 95 ? '✓ 稳定' :
                       projection.completionPercentage >= 85 ? '● 可控' :
                       '○ 需监控'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Reserve Records Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">准备金计提记录</h2>
            <p className="text-sm text-gray-500">Claim Reserve Recording & Adjustment</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm">
                <option value="">所有状态</option>
                <option value="initial">初始计提</option>
                <option value="adjusted">已调整</option>
                <option value="resolved">已结案</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm">
                <option value="">计提基础</option>
                <option value="IBNR">IBNR（未报案件）</option>
                <option value="Case">Case（报案估算）</option>
                <option value="Paid">Paid（已付基准）</option>
                <option value="Expected">Expected（期望值）</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">案件编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">保单号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">被保险人</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">出险日期</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">事故类型</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">报案金额</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">准备金</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">已付金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">计提基础</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">下次审核</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockReserves.map((reserve) => (
                <tr
                  key={reserve.id}
                  className="hover:bg-teal-50/50 border-b border-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{reserve.claimNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{reserve.policyNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{reserve.insuredName}</td>
                  <td className="py-3 px-4 text-gray-600">{reserve.claimDate}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm">
                      {reserve.incidentType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-700">${reserve.reportedAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-teal-600">
                    ${reserve.reservedAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-green-600 font-semibold">
                    ${reserve.paidAmount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getBasisBadgeClass(reserve.reserveBasis)}`}>
                      {reserve.reserveBasis === 'IBNR' && 'IBNR'}
                      {reserve.reserveBasis === 'Case' && 'Case'}
                      {reserve.reserveBasis === 'Paid' && 'Paid'}
                      {reserve.reserveBasis === 'Expected' && 'Expected'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(reserve.reserveStatus)}`}>
                      {reserve.reserveStatus === 'initial' && '○ 初始'}
                      {reserve.reserveStatus === 'adjusted' && '● 已调整'}
                      {reserve.reserveStatus === 'resolved' && '✓ 已结案'}
                      {reserve.reserveStatus === 'closed' && '✗ 已关闭'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {reserve.nextReviewDate || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {(reserve.reserveStatus === 'initial' || reserve.reserveStatus === 'adjusted') && (
                      <button
                        onClick={() => handleRecalculate(reserve.id)}
                        className="text-sm text-teal-600 hover:text-teal-800 font-medium"
                      >
                        重新计算
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quarterly Reserve Performance */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <FileText className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">季度准备金绩效分析</h2>
              <p className="text-sm text-gray-500">Quarterly Reserve Performance Analysis</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reservesAnalysis.map((analysis) => (
            <div
              key={analysis.period}
              className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="font-bold text-gray-900 mb-3 text-lg">{analysis.period}</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">案件数:</span>
                  <strong className="text-gray-900">{analysis.totalClaims.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总准备金:</span>
                  <strong className="text-teal-600">${(analysis.totalReserved / 1000000).toFixed(2)}M</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">已赔付:</span>
                  <strong className="text-green-600">${(analysis.totalPaid / 1000000).toFixed(2)}M</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">案均赔款:</span>
                  <strong className="text-gray-900">${analysis.averageCaseSize.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-emerald-200">
                  <span className="text-gray-600">赔付准备金比:</span>
                  <strong className={`${
                    analysis.reserveRatio >= 65 ? 'text-emerald-600' :
                    analysis.reserveRatio >= 55 ? 'text-yellow-600' : 'text-red-600'
                  }`}>{analysis.reserveRatio.toFixed(1)}%</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-xl border border-teal-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-teal-900 mb-2">AI 精算与准备金优化建议</div>
            <ul className="text-sm text-teal-800 space-y-1 list-disc list-inside">
              <li>2024 年 YTD 链梯法模型显示仅 78.1% 完成度，置信区间较宽，建议收集更多发展因子数据</li>
              <li>Michael Johnson 的 LTC 案件已处理 47%（$45K/$95K），建议增加季度审查频率</li>
              <li>Q3 赔付准备金比提升至 65.3%，表明准备金充足性改善，可考虑下调 1-2% 的整体费率</li>
              <li>长期来看，2021-2023 年的 Ultimate Loss Ratio 稳定在 82%-84% 区间，建议将此作为定价基准</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimReservingCalculatorView;
