import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Filter,
  ChevronDown
} from 'lucide-react';

interface Transaction {
  id: string;
  policyNumber: string;
  channelName: string;
  amount: number;
  currency: string;
  method: 'credit-card' | 'ach' | 'wire-transfer' | 'check';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  refundAmount?: number;
}

interface PaymentMetrics {
  todayVolume: number;
  todayCount: number;
  successRate: number;
  avgProcessingTime: number;
  pendingAmount: number;
  failedToday: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Recent transactions
const mockTransactions: Transaction[] = [
  {
    id: 'txn001',
    policyNumber: 'POL-2026-CA-001234',
    channelName: '深圳 MGA 总部',
    amount: 1250.00,
    currency: 'USD',
    method: 'credit-card',
    status: 'completed',
    createdAt: '2026-08-31 14:23:15',
    processedAt: '2026-08-31 14:23:45',
  },
  {
    id: 'txn002',
    policyNumber: 'POL-2026-NY-005678',
    channelName: '纽约 MG 分部',
    amount: 3890.50,
    currency: 'USD',
    method: 'ach',
    status: 'processing',
    createdAt: '2026-08-31 13:45:32',
  },
  {
    id: 'txn003',
    policyNumber: 'POL-2026-TX-009012',
    channelName: '上海代理点',
    amount: 567.00,
    currency: 'USD',
    method: 'credit-card',
    status: 'failed',
    createdAt: '2026-08-31 12:30:18',
    failureReason: 'Insufficient funds',
  },
  {
    id: 'txn004',
    policyNumber: 'POL-2026-FL-003456',
    channelName: '北京经纪门店',
    amount: 2100.75,
    currency: 'USD',
    method: 'wire-transfer',
    status: 'pending',
    createdAt: '2026-08-31 11:15:44',
  },
  {
    id: 'txn005',
    policyNumber: 'POL-2026-WA-007890',
    channelName: '深圳 MGA 总部',
    amount: 890.25,
    currency: 'USD',
    method: 'credit-card',
    status: 'refunded',
    createdAt: '2026-08-30 16:42:11',
    processedAt: '2026-08-30 16:42:38',
    refundAmount: 890.25,
  },
  {
    id: 'txn006',
    policyNumber: 'POL-2026-AZ-002345',
    channelName: '广州办事处',
    amount: 1456.80,
    currency: 'USD',
    method: 'check',
    status: 'completed',
    createdAt: '2026-08-30 14:28:55',
    processedAt: '2026-08-30 16:10:22',
  },
  {
    id: 'txn007',
    policyNumber: 'POL-2026-GA-006789',
    channelName: '纽约 MG 分部',
    amount: 4230.00,
    currency: 'USD',
    method: 'wire-transfer',
    status: 'completed',
    createdAt: '2026-08-30 10:15:33',
    processedAt: '2026-08-30 11:45:18',
  },
  {
    id: 'txn008',
    policyNumber: 'POL-2026-NC-001122',
    channelName: '上海代理点',
    amount: 678.90,
    currency: 'USD',
    method: 'credit-card',
    status: 'failed',
    createdAt: '2026-08-29 15:33:27',
    failureReason: 'Card expired',
  },
];

// Mock metrics
const mockMetrics: PaymentMetrics = {
  todayVolume: 125678.45,
  todayCount: 156,
  successRate: 94.2,
  avgProcessingTime: 2.3, // hours
  pendingAmount: 8450.30,
  failedToday: 9,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
};

const methodIcons = {
  'credit-card': CreditCard,
  ach: DollarSign,
  'wire-transfer': Clock,
  check: DollarSign,
};

export function PaymentDashboardView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [timeRange, setTimeRange] = useState('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredTransactions = statusFilter === 'all'
    ? mockTransactions
    : mockTransactions.filter(t => t.status === statusFilter);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              支付监控仪表板
            </h1>
            <p className="text-gray-600">
              实时交易流水、成功率与异常拦截全景视图
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">今日</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.todayVolume)}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +12.5% 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CreditCard size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">笔数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.todayCount}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +8.3% 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">成功率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.successRate}%
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +2.1% 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Clock size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">平均处理</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.avgProcessingTime}h
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              -0.5h 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-yellow-600" />
              <span className="text-xs text-gray-500 font-medium">待处理</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.pendingAmount)}
            </div>
            <div className="text-sm text-yellow-600 font-semibold">
              {mockTransactions.filter(t => t.status === 'pending').length} 笔
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <XCircle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">今日失败</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.failedToday}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              -3 笔 昨日
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">时间范围:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="select"
            >
              <option value="today">今日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year">今年至今</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">交易状态:</label>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="refunded">已退款</option>
              </select>
            </div>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出 CSV
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">最近交易流水</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{filteredTransactions.length} 条记录</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">交易 ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保单号</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">渠道名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">金额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">支付方式</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">创建时间</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const MethodIcon = methodIcons[tx.method as keyof typeof methodIcons] || CreditCard;
                
                return (
                  <tr 
                    key={tx.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      tx.status === 'failed' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-600">{tx.id}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{tx.policyNumber}</span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                      {tx.channelName}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-right space-y-1">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(tx.amount)}
                        </div>
                        {tx.refundAmount && (
                          <div className="text-xs text-red-600 font-semibold">
                            退款：{formatCurrency(tx.refundAmount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MethodIcon size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700 capitalize">{tx.method.replace('-', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[tx.status]}`}>
                        {tx.status === 'completed' && '✓ 成功'}
                        {tx.status === 'pending' && '○ 待处理'}
                        {tx.status === 'processing' && '⟳ 处理中'}
                        {tx.status === 'failed' && '✗ 失败'}
                        {tx.status === 'refunded' && '↺ 已退款'}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                      <div>{tx.createdAt}</div>
                      {tx.processedAt && (
                        <div className="text-xs text-gray-400 mt-1">处理：{tx.processedAt}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {tx.status === 'failed' && tx.failureReason && (
                        <div className="text-xs text-red-600 font-medium" title={tx.failureReason}>
                          {tx.failureReason}
                        </div>
                      )}
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold ml-2">
                        详情
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Filter size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无交易记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的交易数据</p>
          </div>
        )}

        {/* Pagination placeholder */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(8, filteredTransactions.length)} 共 {filteredTransactions.length} 条
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

      {/* Footer Info */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">成功 ({formatCurrency(mockMetrics.todayVolume)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">处理中</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700">待处理</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">失败</span>
            </div>
          </div>
          <div className="text-gray-500">
            最后更新：{new Date().toLocaleString('en-US')}
          </div>
        </div>
      </div>
    </div>
  );
}
