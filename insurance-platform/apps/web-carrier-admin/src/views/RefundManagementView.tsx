import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  ArrowRightLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  MessageSquare
} from 'lucide-react';

interface RefundRequest {
  id: string;
  policyNumber: string;
  channelName: string;
  channelId: string;
  originalAmount: number;
  refundAmount: number;
  refundReason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'processed' | 'cancelled';
  reviewer?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  processedAt?: string;
  cancellationReason?: string;
  notes?: string;
}

interface RefundMetrics {
  totalPendingAmount: number;
  totalPendingCount: number;
  avgReviewTime: number; // hours
  successRate: number;
  thisMonthTotal: number;
  thisMonthCount: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Refund requests
const mockRefunds: RefundRequest[] = [
  {
    id: 'ref001',
    policyNumber: 'POL-2026-CA-001234',
    channelName: '深圳 MGA 总部',
    channelId: 'c1',
    originalAmount: 1250.00,
    refundAmount: 1250.00,
    refundReason: '客户申请全额退保 - 犹豫期内撤销',
    requestedBy: '张伟',
    requestedAt: '2026-08-31 14:30:00',
    status: 'pending',
  },
  {
    id: 'ref002',
    policyNumber: 'POL-2026-NY-005678',
    channelName: '纽约 MG 分部',
    channelId: 'c2',
    originalAmount: 3890.50,
    refundAmount: 1945.25,
    refundReason: '部分退保 - 扣除已保障期间费用',
    requestedBy: '李明',
    requestedAt: '2026-08-31 11:20:00',
    status: 'reviewing',
    reviewer: '王芳',
    reviewedAt: '2026-08-31 12:00:00',
  },
  {
    id: 'ref003',
    policyNumber: 'POL-2026-TX-009012',
    channelName: '上海代理点',
    channelId: 'c3',
    originalAmount: 567.00,
    refundAmount: 567.00,
    refundReason: '系统重复扣款 - 申请全额退还',
    requestedBy: '赵敏',
    requestedAt: '2026-08-30 16:45:00',
    status: 'approved',
    reviewer: '刘洋',
    reviewedAt: '2026-08-30 18:30:00',
    processedAt: '2026-08-31 09:00:00',
  },
  {
    id: 'ref004',
    policyNumber: 'POL-2026-FL-003456',
    channelName: '北京经纪门店',
    channelId: 'c4',
    originalAmount: 2100.75,
    refundAmount: 0,
    refundReason: '客户不符合退款条件 - 保单已生效超过犹豫期',
    requestedBy: '陈静',
    requestedAt: '2026-08-30 14:20:00',
    status: 'rejected',
    reviewer: '王芳',
    reviewedAt: '2026-08-30 15:00:00',
    rejectionReason: '根据条款规定，犹豫期后退保需扣除已承担风险成本',
  },
  {
    id: 'ref005',
    policyNumber: 'POL-2026-WA-007890',
    channelName: '广州办事处',
    channelId: 'c5',
    originalAmount: 890.25,
    refundAmount: 890.25,
    refundReason: '支付失败重试导致重复扣款',
    requestedBy: '孙磊',
    requestedAt: '2026-08-29 10:15:00',
    status: 'processed',
    reviewer: '刘洋',
    reviewedAt: '2026-08-29 11:00:00',
    processedAt: '2026-08-29 14:30:00',
  },
  {
    id: 'ref006',
    policyNumber: 'POL-2026-AZ-002345',
    channelName: '深圳 MGA 总部',
    channelId: 'c1',
    originalAmount: 1456.80,
    refundAmount: 0,
    refundReason: '客户主动取消退款申请',
    requestedBy: '周涛',
    requestedAt: '2026-08-28 15:30:00',
    status: 'cancelled',
    cancellationReason: '客户确认无需退款，保单继续有效',
  },
  {
    id: 'ref007',
    policyNumber: 'POL-2026-GA-006789',
    channelName: '纽约 MG 分部',
    channelId: 'c2',
    originalAmount: 4230.00,
    refundAmount: 2115.00,
    refundReason: '保单变更导致保费调整 - 退还多收部分',
    requestedBy: '吴霞',
    requestedAt: '2026-08-27 09:00:00',
    status: 'approved',
    reviewer: '王芳',
    reviewedAt: '2026-08-27 10:30:00',
    processedAt: '2026-08-28 11:00:00',
  },
  {
    id: 'ref008',
    policyNumber: 'POL-2026-NC-001122',
    channelName: '上海代理点',
    channelId: 'c3',
    originalAmount: 678.90,
    refundAmount: 678.90,
    refundReason: '销售误导 - 监管要求全额退款',
    requestedBy: '郑浩',
    requestedAt: '2026-08-26 13:45:00',
    status: 'pending',
  },
];

// Mock metrics
const mockMetrics: RefundMetrics = {
  totalPendingAmount: 3195.25,
  totalPendingCount: 2,
  avgReviewTime: 2.5,
  successRate: 87.5,
  thisMonthTotal: 25670.50,
  thisMonthCount: 18,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  processed: 'bg-purple-100 text-purple-800 border-purple-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function RefundManagementView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsRefreshing(false);
    alert('数据已刷新！');
  };

  const filteredRefunds = mockRefunds.filter(refund => {
    const matchesSearch = 
      refund.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || refund.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusLabel = (status: RefundRequest['status']) => {
    const labels: Record<RefundRequest['status'], string> = {
      pending: '待审核',
      reviewing: '审核中',
      approved: '已批准',
      rejected: '已拒绝',
      processed: '已处理',
      cancelled: '已取消',
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass p-8 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              退款管理
            </h1>
            <p className="text-gray-600">
              退保申请、拒付处理与退款全流程追踪
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
              <ArrowRightLeft size={24} className="text-orange-600" />
              <span className="text-xs text-gray-500 font-medium">待处理</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.totalPendingCount}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              {formatCurrency(mockMetrics.totalPendingAmount)}
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <Clock size={24} className="text-blue-600" />
              <span className="text-xs text-gray-500 font-medium">平均审核时长</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.avgReviewTime}h
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              -0.3h 昨日
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle size={24} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">成功率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.successRate}%
            </div>
            <div className="text-sm text-green-600 font-semibold">
              +3.2% 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <DollarSign size={24} className="text-purple-600" />
              <span className="text-xs text-gray-500 font-medium">本月累计</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(mockMetrics.thisMonthTotal)}
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              {mockMetrics.thisMonthCount} 笔
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <FileText size={24} className="text-indigo-600" />
              <span className="text-xs text-gray-500 font-medium">本月笔数</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {mockMetrics.thisMonthCount}
            </div>
            <div className="text-sm text-indigo-600 font-semibold">
              +5 笔 上月
            </div>
          </div>

          <div className="glass p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle size={24} className="text-red-600" />
              <span className="text-xs text-gray-500 font-medium">拒绝率</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {(100 - mockMetrics.successRate).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 font-semibold">
              -1.5% 上月
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
              placeholder="搜索保单号 / 渠道名称 / 申请人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full input-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">状态:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="all">全部状态</option>
              <option value="pending">待审核</option>
              <option value="reviewing">审核中</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
              <option value="processed">已处理</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Download size={16} className="mr-2" />
              导出 CSV
            </button>
            <button className="btn-primary">
              <ArrowRightLeft size={16} className="mr-2" />
              批量处理
            </button>
          </div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="glass p-8 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">退款申请列表</h2>
          <span className="text-sm text-gray-600">{filteredRefunds.length} 条记录</span>
        </div>

        <div className="overflow-x-auto space-y-3">
          {filteredRefunds.map((refund) => (
            <div
              key={refund.id}
              className={`p-6 rounded-lg border transition-colors hover:shadow-md ${
                refund.status === 'rejected' 
                  ? 'bg-red-50 border-red-200' 
                  : refund.status === 'cancelled'
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Section - Basic Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">保单号</div>
                    <div className="font-mono text-sm font-semibold text-gray-900">{refund.policyNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">渠道名称</div>
                    <div className="text-sm text-gray-700">{refund.channelName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">申请人</div>
                    <div className="text-sm text-gray-700">{refund.requestedBy}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">申请时间</div>
                    <div className="text-sm text-gray-700">{refund.requestedAt}</div>
                  </div>
                </div>

                {/* Middle Section - Amount Info */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">原始金额</div>
                    <div className="font-semibold text-gray-700">{formatCurrency(refund.originalAmount)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">退款金额</div>
                    <div className={`font-bold text-lg ${
                      refund.refundAmount === 0 
                        ? 'text-gray-400' 
                        : refund.refundAmount === refund.originalAmount
                        ? 'text-red-600'
                        : 'text-orange-600'
                    }`}>
                      {formatCurrency(refund.refundAmount)}
                    </div>
                    {refund.refundAmount > 0 && refund.refundAmount < refund.originalAmount && (
                      <div className="text-xs text-gray-500">
                        ({Math.round((refund.refundAmount / refund.originalAmount) * 100)}%)
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">退款原因</div>
                    <div className="text-xs text-gray-700 line-clamp-2" title={refund.refundReason}>
                      {refund.refundReason}
                    </div>
                  </div>
                </div>

                {/* Right Section - Status & Actions */}
                <div className="flex flex-col items-start lg:items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[refund.status]}`}>
                    {getStatusLabel(refund.status)}
                  </span>
                  
                  {/* Review Info */}
                  {refund.reviewer && (
                    <div className="text-xs text-gray-600">
                      {refund.reviewedAt && (
                        <div>审核人：{refund.reviewer}</div>
                      )}
                      {refund.reviewedAt && (
                        <div>审核时间：{refund.reviewedAt}</div>
                      )}
                      {refund.processedAt && (
                        <div className="text-green-600">
                          处理时间：{refund.processedAt}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {refund.rejectionReason && (
                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                      {refund.rejectionReason}
                    </div>
                  )}

                  {/* Cancellation Reason */}
                  {refund.cancellationReason && (
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {refund.cancellationReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {refund.status === 'pending' && (
                      <>
                        <button className="btn-primary text-sm">
                          审核通过
                        </button>
                        <button className="btn-secondary text-sm">
                          拒绝申请
                        </button>
                      </>
                    )}
                    <button className="btn-secondary text-sm">
                      <MessageSquare size={14} className="mr-1" />
                      查看详情
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRefunds.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">暂无退款记录</h3>
            <p className="text-gray-600">当前过滤条件下无匹配的退款申请数据</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1-{Math.min(8, filteredRefunds.length)} 共 {filteredRefunds.length} 条
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

      {/* Footer Note */}
      <div className="glass p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <AlertTriangle size={16} className="text-orange-600" />
          <div>
            <strong>提示：</strong>所有退款请求需经过合规审核流程，审批通过后将在 3-5 个工作日内原路退回至客户账户
          </div>
        </div>
      </div>
    </div>
  );
}
