import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Mail,
  AlertTriangle,
  DollarSign
} from 'lucide-react';

interface InvoiceRecord {
  id: string;
  policyNumber: string;
  channelName: string;
  channelId: string;
  premiumAmount: number;
  commissionAmount: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: 'draft' | 'generated' | 'sent' | 'paid' | 'overdue' | 'voided';
  generatedAt?: string;
  sentAt?: string;
  paidAt?: string;
  sender?: string;
  paymentMethod?: 'wire-transfer' | 'ach' | 'check' | 'credit-card';
  notes?: string;
}

interface InvoiceMetrics {
  totalGenerated: number;
  totalSent: number;
  pendingPayment: number;
  overdueAmount: number;
  thisMonthGenerated: number;
  thisMonthPaid: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Invoice records
const mockInvoices: InvoiceRecord[] = [
  {
    id: 'inv001',
    policyNumber: 'POL-2026-CA-001234',
    channelName: '深圳 MGA 总部',
    channelId: 'c1',
    premiumAmount: 12500.00,
    commissionAmount: 2000.00,
    invoiceNumber: 'INV-2026-08-001',
    invoiceDate: '2026-08-31',
    dueDate: '2026-09-30',
    status: 'generated',
    generatedAt: '2026-08-31 09:30:00',
  },
  {
    id: 'inv002',
    policyNumber: 'POL-2026-NY-005678',
    channelName: '纽约 MG 分部',
    channelId: 'c2',
    premiumAmount: 38905.00,
    commissionAmount: 6225.00,
    invoiceNumber: 'INV-2026-08-002',
    invoiceDate: '2026-08-30',
    dueDate: '2026-09-30',
    status: 'sent',
    generatedAt: '2026-08-30 14:20:00',
    sentAt: '2026-08-30 15:00:00',
    sender: '财务专员 A',
  },
  {
    id: 'inv003',
    policyNumber: 'POL-2026-TX-009012',
    channelName: '上海代理点',
    channelId: 'c3',
    premiumAmount: 5670.00,
    commissionAmount: 907.00,
    invoiceNumber: 'INV-2026-08-003',
    invoiceDate: '2026-08-29',
    dueDate: '2026-09-29',
    status: 'paid',
    generatedAt: '2026-08-29 10:15:00',
    sentAt: '2026-08-29 11:00:00',
    sender: '财务专员 B',
    paidAt: '2026-08-29 16:30:00',
    paymentMethod: 'wire-transfer',
    notes: '通过电汇支付',
  },
  {
    id: 'inv004',
    policyNumber: 'POL-2026-FL-003456',
    channelName: '北京经纪门店',
    channelId: 'c4',
    premiumAmount: 21007.50,
    commissionAmount: 3361.00,
    invoiceNumber: 'INV-2026-07-045',
    invoiceDate: '2026-07-31',
    dueDate: '2026-08-31',
    status: 'overdue',
    generatedAt: '2026-07-31 09:00:00',
    sentAt: '2026-07-31 10:30:00',
    sender: '财务专员 A',
  },
  {
    id: 'inv005',
    policyNumber: 'POL-2026-WA-007890',
    channelName: '广州办事处',
    channelId: 'c5',
    premiumAmount: 8902.50,
    commissionAmount: 1424.00,
    invoiceNumber: 'INV-2026-08-004',
    invoiceDate: '2026-08-28',
    dueDate: '2026-09-28',
    status: 'paid',
    generatedAt: '2026-08-28 13:45:00',
    sentAt: '2026-08-28 14:00:00',
    sender: '财务专员 B',
    paidAt: '2026-08-29 10:20:00',
    paymentMethod: 'ach',
    notes: '自动扣款成功',
  },
  {
    id: 'inv006',
    policyNumber: 'POL-2026-AZ-002345',
    channelName: '深圳 MGA 总部',
    channelId: 'c1',
    premiumAmount: 14568.00,
    commissionAmount: 2331.00,
    invoiceNumber: 'INV-2026-08-005',
    invoiceDate: '2026-08-27',
    dueDate: '2026-09-27',
    status: 'draft',
    generatedAt: '2026-08-27 16:00:00',
    notes: '待发送确认',
  },
  {
    id: 'inv007',
    policyNumber: 'POL-2026-GA-006789',
    channelName: '纽约 MG 分部',
    channelId: 'c2',
    premiumAmount: 42300.00,
    commissionAmount: 6768.00,
    invoiceNumber: 'INV-2026-06-078',
    invoiceDate: '2026-06-30',
    dueDate: '2026-07-30',
    status: 'voided',
    generatedAt: '2026-06-30 09:30:00',
    sentAt: '2026-06-30 10:00:00',
    sender: '财务专员 A',
    notes: '发票编号错误，已作废重发',
  },
  {
    id: 'inv008',
    policyNumber: 'POL-2026-NC-001122',
    channelName: '上海代理点',
    channelId: 'c3',
    premiumAmount: 6789.00,
    commissionAmount: 1086.00,
    invoiceNumber: 'INV-2026-08-006',
    invoiceDate: '2026-08-26',
    dueDate: '2026-09-26',
    status: 'generated',
    generatedAt: '2026-08-26 11:20:00',
  },
  {
    id: 'inv009',
    policyNumber: 'POL-2026-OH-003344',
    channelName: '北京经纪门店',
    channelId: 'c4',
    premiumAmount: 19876.00,
    commissionAmount: 3180.00,
    invoiceNumber: 'INV-2026-08-007',
    invoiceDate: '2026-08-25',
    dueDate: '2026-09-25',
    status: 'sent',
    generatedAt: '2026-08-25 14:30:00',
    sentAt: '2026-08-25 15:15:00',
    sender: '财务专员 B',
  },
];

// Mock metrics
const mockMetrics: InvoiceMetrics = {
  totalGenerated: 156,
  totalSent: 142,
  pendingPayment: 38,
  overdueAmount: 25670.50,
  thisMonthGenerated: 24,
  thisMonthPaid: 18,
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  generated: 'bg-blue-100 text-blue-800 border-blue-200',
  sent: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  voided: 'bg-orange-100 text-orange-800 border-orange-200',
};

export function InvoiceHistoryView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'custom'>('this-month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusLabel = (status: InvoiceRecord['status']) => {
    const labels: Record<InvoiceRecord['status'], string> = {
      draft: '草稿',
      generated: '已生成',
      sent: '已发送',
      paid: '已支付',
      overdue: '逾期',
      voided: '已作废',
    };
    return labels[status];
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              账单生成历史
            </h1>
            <p className="text-gray-600">
              保费账单生成、发送与支付状态全流程追踪
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <FileText size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">本月生成</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.thisMonthGenerated}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              +8 份 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Mail size={24} className="text-indigo-600" />
              <span className="text-xs text-gray-500 font-medium">本月已发送</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.thisMonthPaid}
            </div>
            <div className="text-sm text-indigo-600 font-semibold">
              +5 份 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Clock size={24} className="text-yellow-600" />
              <span className="text-xs text-gray-500 font-medium">待支付</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.pendingPayment}
            </div>
            <div className="text-sm text-yellow-600 font-semibold">
              {mockMetrics.totalSent - mockMetrics.thisMonthPaid} 份
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">逾期金额</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.overdueAmount)}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              +3 笔 新增逾期
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">历史总计</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.totalGenerated}
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              {Math.round((mockMetrics.totalSent / mockMetrics.totalGenerated) * 100)}% 发送率
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">累计收款</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.totalSent * 15000)}
            </div>
            <div className="text-sm text-green-600 font-semibold">
              估算总额
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 flex items-center gap-3">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="搜索保单号 / 发票号 / 渠道名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-transparent"
            />
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">时间范围:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="select"
            >
              <option value="this-month">本月</option>
              <option value="last-month">上月</option>
              <option value="custom">自定义范围</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">账单状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="generated">已生成</option>
              <option value="sent">已发送</option>
              <option value="paid">已支付</option>
              <option value="overdue">逾期</option>
              <option value="voided">已作废</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出 CSV
            </button>
            <button className="btn-primary">
              <FileText size={16} className="mr-2" />
              批量生成
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">账单记录列表</h2>
          <span className="text-sm text-gray-600">{filteredInvoices.length} 条记录</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">发票号</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保单号</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">渠道名称</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">保费金额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">佣金金额</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">账单日期</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">到期日</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">状态</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                
                return (
                  <tr 
                    key={invoice.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      invoice.status === 'overdue' ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-mono text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                      {invoice.generatedAt && (
                        <div className="text-xs text-gray-400 mt-1">生成：{invoice.generatedAt}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-gray-700">
                      {invoice.policyNumber}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-700">
                      {invoice.channelName}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(invoice.premiumAmount)}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm font-semibold text-orange-600">
                        {formatCurrency(invoice.commissionAmount)}
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-600">
                      {invoice.invoiceDate}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{invoice.dueDate}</div>
                      {daysUntilDue <= 0 && daysUntilDue > -7 && (
                        <div className="text-xs text-orange-600 font-semibold mt-1">
                          已逾期{Math.abs(daysUntilDue)}天
                        </div>
                      )}
                      {daysUntilDue > 0 && daysUntilDue <= 7 && (
                        <div className="text-xs text-yellow-600 font-semibold mt-1">
                          即将到期 ({daysUntilDue}天)
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[invoice.status]}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary text-sm">
                          <Eye size={14} className="mr-1" />
                          预览
                        </button>
                        {invoice.status === 'generated' && (
                          <button className="btn-secondary text-sm">
                            <Mail size={14} className="mr-1" />
                            发送
                          </button>
                        )}
                        {invoice.status === 'paid' && invoice.sentAt && (
                          <div className="text-xs text-green-600">
                            ✓ {invoice.sentAt}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无账单记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的账单数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(8, filteredInvoices.length)} 共 {filteredInvoices.length} 条
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
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">已生成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-gray-700">已发送</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">已支付</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">逾期</span>
          </div>
          <div className="ml-auto text-gray-500">
            最后更新：{new Date().toLocaleString('en-US')}
          </div>
        </div>
      </div>
    </div>
  );
}
