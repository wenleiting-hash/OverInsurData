import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw,
  Settings,
  Clock,
  TrendingUp,
  CreditCard,
  ShieldCheck
} from 'lucide-react';

interface EDI835Transaction {
  id: string;
  transactionNumber: string;
  senderId: string;
  receiverId: string;
  serviceCode: string; // 服务代码 (如：EOP, VFC, SOD)
  patientName: string;
  subscriberId: string;
  dateOfService: string;
  totalCharges: number;
  allowedAmount: number;
  paymentAmount: number;
    discountAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'rejected';
  receivedDate: string;
  processedDate?: string;
  errorDescription?: string;
}

interface EDICardinalConfig {
  id: string;
  partnerName: string;
  partnerType: 'insurer' | 'provider' | 'clearinghouse';
  x12Version: string;
  connectionStatus: 'active' | 'inactive' | 'testing';
  lastCommunication: string;
  transactionsProcessed: number;
  successRate: number;
}

interface ComplianceReport {
  id: string;
  reportName: string;
  reportType: 'monthly_reconciliation' | 'claim_analysis' | 'remittance_audit' | 'exception_report';
  generationDate: string;
  recordCount: number;
  status: 'generated' | 'sending' | 'sent' | 'failed';
  fileSize: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const EDI835IntegrationManagerView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['product', 'channel']);

  // Mock data - EDI 835 交易记录
  const [mockTransactions] = useState<EDI835Transaction[]>([
    {
      id: 'edi001',
      transactionNumber: 'EDI-835-2024-001',
      senderId: 'BCBS_IL',
      receiverId: 'CARRIER_ADMIN_001',
      serviceCode: 'EOP',
      patientName: 'John Smith',
      subscriberId: 'BCBS12345678',
      dateOfService: '2024-08-15',
      totalCharges: 1250.00,
      allowedAmount: 1000.00,
      paymentAmount: 850.00,
      discountAmount: 150.00,
      status: 'completed',
      receivedDate: '2024-08-20T10:30:00Z',
      processedDate: '2024-08-20T10:35:00Z',
    },
    {
      id: 'edi002',
      transactionNumber: 'EDI-835-2024-002',
      senderId: 'AETNA',
      receiverId: 'CARRIER_ADMIN_001',
      serviceCode: 'VFC',
      patientName: 'Jane Doe',
      subscriberId: 'AETNA98765432',
      dateOfService: '2024-08-16',
      totalCharges: 3500.00,
      allowedAmount: 2800.00,
      paymentAmount: 2380.00,
      discountAmount: 420.00,
      status: 'completed',
      receivedDate: '2024-08-21T14:20:00Z',
      processedDate: '2024-08-21T14:25:00Z',
    },
    {
      id: 'edi003',
      transactionNumber: 'EDI-835-2024-003',
      senderId: 'CIGNA',
      receiverId: 'CARRIER_ADMIN_001',
      serviceCode: 'SOD',
      patientName: 'Michael Johnson',
      subscriberId: 'CIGNA55667788',
      dateOfService: '2024-08-17',
      totalCharges: 750.00,
      allowedAmount: 600.00,
      paymentAmount: 480.00,
      discountAmount: 120.00,
      status: 'error',
      receivedDate: '2024-08-22T09:15:00Z',
      processedDate: undefined,
      errorDescription: 'Invalid subscriber ID format',
    },
    {
      id: 'edi004',
      transactionNumber: 'EDI-835-2024-004',
      senderId: 'BLUE CROSS CA',
      receiverId: 'CARRIER_ADMIN_001',
      serviceCode: 'EOP',
      patientName: 'Emily Davis',
      subscriberId: 'BCCA11223344',
      dateOfService: '2024-08-18',
      totalCharges: 2100.00,
      allowedAmount: 1750.00,
      paymentAmount: 1487.50,
      discountAmount: 262.50,
      status: 'completed',
      receivedDate: '2024-08-23T16:45:00Z',
      processedDate: '2024-08-23T16:50:00Z',
    },
    {
      id: 'edi005',
      transactionNumber: 'EDI-835-2024-005',
      senderId: 'UNITED HC',
      receiverId: 'CARRIER_ADMIN_001',
      serviceCode: 'VFC',
      patientName: 'Robert Wilson',
      subscriberId: 'UNITED66778899',
      dateOfService: '2024-08-19',
      totalCharges: 5200.00,
      allowedAmount: 4200.00,
      paymentAmount: 3570.00,
      discountAmount: 630.00,
      status: 'rejected',
      receivedDate: '2024-08-24T11:30:00Z',
      processedDate: undefined,
      errorDescription: 'Duplicate claim detected',
    },
  ]);

  // Mock data - EDI 连接配置
  const [ediConfigs] = useState<EDICardinalConfig[]>([
    {
      id: 'config001',
      partnerName: 'Blue Cross Blue Shield Illinois',
      partnerType: 'insurer',
      x12Version: '5010',
      connectionStatus: 'active',
      lastCommunication: '2024-08-20 10:30:00',
      transactionsProcessed: 15420,
      successRate: 98.5,
    },
    {
      id: 'config002',
      partnerName: 'Aetna Inc',
      partnerType: 'insurer',
      x12Version: '5010',
      connectionStatus: 'active',
      lastCommunication: '2024-08-21 14:20:00',
      transactionsProcessed: 12850,
      successRate: 97.8,
    },
    {
      id: 'config003',
      partnerName: 'Change Healthcare',
      partnerType: 'clearinghouse',
      x12Version: '5010',
      connectionStatus: 'active',
      lastCommunication: '2024-08-22 09:15:00',
      transactionsProcessed: 28640,
      successRate: 99.2,
    },
    {
      id: 'config004',
      partnerName: 'Cigna Corp',
      partnerType: 'insurer',
      x12Version: '5010',
      connectionStatus: 'testing',
      lastCommunication: '2024-08-19 16:45:00',
      transactionsProcessed: 2150,
      successRate: 95.3,
    },
  ]);

  // Mock data - 合规报告
  const [complianceReports] = useState<ComplianceReport[]>([
    {
      id: 'report001',
      reportName: '2024 年 7 月对账报告',
      reportType: 'monthly_reconciliation',
      generationDate: '2024-08-01',
      recordCount: 25840,
      status: 'sent',
      fileSize: '12.5 MB',
    },
    {
      id: 'report002',
      reportName: '索赔异常分析 - 第 3 周',
      reportType: 'claim_analysis',
      generationDate: '2024-08-20',
      recordCount: 1250,
      status: 'generated',
      fileSize: '3.2 MB',
    },
    {
      id: 'report003',
      reportName: '理赔审计追踪报告',
      reportType: 'remittance_audit',
      generationDate: '2024-08-22',
      recordCount: 890,
      status: 'sending',
      fileSize: '2.8 MB',
    },
  ]);

  const completedTransactions = mockTransactions.filter(t => t.status === 'completed').length;
  const errorTransactions = mockTransactions.filter(t => t.status === 'error').length;
  const rejectedTransactions = mockTransactions.filter(t => t.status === 'rejected').length;
  const totalPaymentAmount = mockTransactions.reduce((sum, t) => sum + t.paymentAmount, 0);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'rejected':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const handleRefreshTransactions = () => {
    alert('已刷新最新 EDI 835 交易数据');
  };

  const handleExportData = () => {
    alert('正在导出 EDI 835 数据集...');
  };

  const handleReprocessError = (id: string) => {
    alert(`已重新处理错误交易：${id}`);
  };

  const handleDownloadSample = () => {
    alert('正在下载 EDI 835 样本文件...');
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg">
              <FileText className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                EDI 835 集成管理器
              </h1>
              <p className="text-gray-600">EDI 835 Payment Information Transaction Manager</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefreshTransactions}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              刷新数据
            </button>
            <button
              onClick={handleExportData}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出数据
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <FileText className="text-blue-600" size={24} />
            </div>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{completedTransactions}</div>
          <div className="text-sm text-gray-600">成功处理</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CreditCard className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            ${totalPaymentAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="text-sm text-gray-600">总支付金额</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <span className="text-xs text-red-600 font-semibold">需处理</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{errorTransactions}</div>
          <div className="text-sm text-gray-600">处理错误</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-orange-100 rounded-xl">
              <XCircle className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{rejectedTransactions}</div>
          <div className="text-sm text-gray-600">被拒交易</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <ShieldCheck className="text-purple-600" size={24} />
            </div>
            <span className="text-xs text-purple-600 font-semibold">98.7%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{ediConfigs.length}</div>
          <div className="text-sm text-gray-600">活跃连接</div>
        </div>
      </div>

      {/* EDI Partners Connection Panel */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <Settings className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">EDI 合作伙伴连接状态</h2>
              <p className="text-sm text-gray-500">EDI Partner Connection Status</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium transition-colors">
            + 添加新连接
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ediConfigs.map((config) => (
            <div
              key={config.id}
              className={`p-4 rounded-xl border-l-4 transition-all cursor-pointer ${
                config.connectionStatus === 'active'
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-500 hover:shadow-md'
                  : config.connectionStatus === 'testing'
                  ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-500 hover:shadow-md'
                  : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-white/70 text-gray-600 font-medium">
                  {config.partnerType === 'insurer' && '保险公司'}
                  {config.partnerType === 'provider' && '医疗机构'}
                  {config.partnerType === 'clearinghouse' && '清算中心'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  config.connectionStatus === 'active' ? 'bg-green-200 text-green-700' :
                  config.connectionStatus === 'testing' ? 'bg-blue-200 text-blue-700' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {config.connectionStatus === 'active' ? '✓ 在线' :
                   config.connectionStatus === 'testing' ? '● 测试中' :
                   '○ 离线'}
                </span>
              </div>
              <div className="font-bold text-gray-900 mb-1 truncate" title={config.partnerName}>
                {config.partnerName}
              </div>
              <div className="text-sm text-gray-600 mb-2">X12 v{config.x12Version}</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">成功率：<strong className="text-green-600">{config.successRate}%</strong></span>
                <span className="text-gray-500">处理：<strong>{config.transactionsProcessed.toLocaleString()}</strong></span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                最后通信：{config.lastCommunication}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDI 835 Transactions Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">EDI 835 交易记录</h2>
            <p className="text-sm text-gray-500">EDI 835 Transaction Records</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadSample}
              className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Upload size={18} />
              上传样本
            </button>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                <option value="">所有服务代码</option>
                <option value="EOP">EOP (Explanation of Payment)</option>
                <option value="VFC">VFC (Vision Benefits)</option>
                <option value="SOD">SOD (Dental Benefits)</option>
              </select>
            </div>
            <div className="relative">
              <Settings className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm">
                <option value="">所有状态</option>
                <option value="completed">已完成</option>
                <option value="processing">处理中</option>
                <option value="error">错误</option>
                <option value="rejected">被拒</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">交易编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">发送方</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">患者姓名</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">服务日期</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">服务代码</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">总费用</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">允许金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">支付金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">折扣金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">错误详情</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-orange-50/50 border-b border-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{transaction.transactionNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{transaction.senderId}</td>
                  <td className="py-3 px-4 text-gray-700">{transaction.patientName}</td>
                  <td className="py-3 px-4 text-gray-600">{transaction.dateOfService}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm">
                      {transaction.serviceCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700">${transaction.totalCharges.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono text-blue-600 font-semibold">${transaction.allowedAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono text-green-600 font-bold">${transaction.paymentAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 font-mono text-orange-600">-${transaction.discountAmount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(transaction.status)}`}>
                      {transaction.status === 'completed' && '✓ 完成'}
                      {transaction.status === 'processing' && '● 处理中'}
                      {transaction.status === 'pending' && '○ 待处理'}
                      {transaction.status === 'error' && '✗ 错误'}
                      {transaction.status === 'rejected' && '✗ 被拒'}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate">
                    {transaction.errorDescription || '-'}
                  </td>
                  <td className="py-3 px-4">
                    {(transaction.status === 'error' || transaction.status === 'rejected') && (
                      <button
                        onClick={() => handleReprocessError(transaction.id)}
                        className="text-sm text-orange-600 hover:text-orange-800 font-medium"
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

        {/* Empty State */}
        {mockTransactions.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">暂无 EDI 835 交易记录</p>
          </div>
        )}
      </div>

      {/* Compliance Reports Section */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <CheckCircle className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">合规报告管理</h2>
              <p className="text-sm text-gray-500">Compliance Report Management</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-medium transition-colors flex items-center gap-2">
            <Clock size={16} />
            生成新报告
          </button>
        </div>

        <div className="space-y-3">
          {complianceReports.map((report) => (
            <div
              key={report.id}
              className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FileText className="text-indigo-600" size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{report.reportName}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>类型：{report.reportType.replace('_', ' ')}</span>
                    <span>记录数：{report.recordCount.toLocaleString()}</span>
                    <span>大小：{report.fileSize}</span>
                    <span>日期：{report.generationDate}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  report.status === 'sent' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                  report.status === 'generated' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  report.status === 'sending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {report.status === 'sent' && '✓ 已发送'}
                  {report.status === 'generated' && '✓ 已生成'}
                  {report.status === 'sending' && '● 发送中'}
                  {report.status === 'failed' && '✗ 失败'}
                </span>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
                  下载
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 洞察建议 */}
      <div className="mt-6 bg-gradient-to-br from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-orange-900 mb-2">AI 合规与效率优化建议</div>
            <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
              <li>CIGNA 交易中检测到无效投保人 ID 格式，建议更新接收数据验证规则</li>
              <li>UNITED HC 的被拒交易显示重复索赔，请检查是否已向患者退还多付款项</li>
              <li>近期平均处理时间缩短 15%，建议继续保持当前 EDI 连接优化策略</li>
              <li>2024 年 7 月对账报告已成功发送， awaiting 保险公司的确认回复</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EDI835IntegrationManagerView;
