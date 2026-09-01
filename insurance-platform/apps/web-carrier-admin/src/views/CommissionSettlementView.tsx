import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { FileText, CheckCircle, XCircle, Clock, DollarSign, Filter, Download, RefreshCw } from 'lucide-react';

interface SettlementRecord {
  id: string;
  channelId: string;
  channelName: string;
  channelType: string;
  period: string; // e.g., "2026-08"
  totalPremium: number;
  totalCommission: number;
  bonusAmount: number;
  totalAmount: number;
  claimDeduction: number;
  netAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'paid' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  rejectionReason?: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Settlement records
const mockSettlements: SettlementRecord[] = [
  {
    id: 'settle1',
    channelId: 'c1',
    channelName: '上海代理点',
    channelType: 'Agent',
    period: '2026-07',
    totalPremium: 1250000,
    totalCommission: 156250,
    bonusAmount: 12500,
    totalAmount: 168750,
    claimDeduction: 8500,
    netAmount: 160250,
    status: 'paid',
    submittedAt: '2026-08-01',
    approvedAt: '2026-08-05',
    paidAt: '2026-08-10',
  },
  {
    id: 'settle2',
    channelId: 'c2',
    channelName: '北京经纪门店',
    channelType: 'Broker',
    period: '2026-07',
    totalPremium: 2180000,
    totalCommission: 327000,
    bonusAmount: 45000,
    totalAmount: 372000,
    claimDeduction: 12000,
    netAmount: 360000,
    status: 'approved',
    submittedAt: '2026-08-01',
    approvedAt: '2026-08-06',
  },
  {
    id: 'settle3',
    channelId: 'c4',
    channelName: '深圳 MGA 总部',
    channelType: 'MGA',
    period: '2026-07',
    totalPremium: 8900000,
    totalCommission: 1644500,
    bonusAmount: 280000,
    totalAmount: 1924500,
    claimDeduction: 89000,
    netAmount: 1835500,
    status: 'submitted',
    submittedAt: '2026-08-01',
  },
  {
    id: 'settle4',
    channelId: 'c1',
    channelName: '上海代理点',
    channelType: 'Agent',
    period: '2026-08',
    totalPremium: 1350000,
    totalCommission: 168750,
    bonusAmount: 13500,
    totalAmount: 182250,
    claimDeduction: 0,
    netAmount: 182250,
    status: 'draft',
  },
  {
    id: 'settle5',
    channelId: 'c3',
    channelName: '广州 MG 公司',
    channelType: 'MG',
    period: '2026-07',
    totalPremium: 3500000,
    totalCommission: 525000,
    bonusAmount: 0,
    totalAmount: 525000,
    claimDeduction: 350000,
    netAmount: 175000,
    status: 'rejected',
    submittedAt: '2026-08-01',
    rejectedReason: '索赔金额异常，需进一步核查',
  },
];

export default function CommissionSettlementView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all');
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700 border-gray-300',
      submitted: 'bg-blue-100 text-blue-700 border-blue-300',
      approved: 'bg-green-100 text-green-700 border-green-300',
      paid: 'bg-purple-100 text-purple-700 border-purple-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      approved: '已批准',
      paid: '已支付',
      rejected: '已拒绝',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getChannelTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      MGA: 'bg-purple-100 text-purple-700 border-purple-300',
      MG: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      Agent: 'bg-blue-100 text-blue-700 border-blue-300',
      Broker: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-700'}`}>
        {type}
      </span>
    );
  };

  const filteredData = mockSettlements.filter((record) => {
    if (selectedStatusFilter !== 'all' && record.status !== selectedStatusFilter) return false;
    if (selectedPeriodFilter !== 'all' && !record.period.includes(selectedPeriodFilter)) return false;
    return true;
  });

  // Statistics
  const stats = {
    totalAmount: mockSettlements.reduce((sum, r) => sum + r.netAmount, 0),
    pendingApproval: mockSettlements.filter(r => r.status === 'submitted').reduce((sum, r) => sum + r.netAmount, 0),
    totalPaid: mockSettlements.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.netAmount, 0),
    rejectedTotal: mockSettlements.filter(r => r.status === 'rejected').reduce((sum, r) => sum + r.totalAmount, 0),
    totalRecords: mockSettlements.length,
  };

  const handleApprove = (id: string) => {
    console.log('批准结算:', id);
    setShowApprovalModal(null);
  };

  const handleReject = (id: string, reason: string) => {
    console.log('拒绝结算:', id, reason);
    setShowApprovalModal(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('commissionSettlement') || '佣金结算管理'}</h1>
        <p className="text-gray-600">{t('settlementDescription') || '处理渠道佣金结算、对账和支付流程'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalPayouts')}</h3>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalAmount)}</p>
          <p className="text-xs text-gray-500">{t('allPeriods')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('pendingApproval')}</h3>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.pendingApproval)}</p>
          <p className="text-xs text-gray-500">{t('awaitingReview')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalPaid')}</h3>
            <CheckCircle className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-xs text-gray-500">{t('completedPayments')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('rejectedAmount')}</h3>
            <XCircle className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.rejectedTotal)}</p>
          <p className="text-xs text-gray-500">{t('requiresRecheck')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalRecords')}</h3>
            <FileText className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalRecords}</p>
          <p className="text-xs text-gray-500">{t('settlementRecords')}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedPeriodFilter}
              onChange={(e) => setSelectedPeriodFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有周期</option>
              <option value="2026-08">2026 年 08 月</option>
              <option value="2026-07">2026 年 07 月</option>
              <option value="2026-06">2026 年 06 月</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="approved">已批准</option>
              <option value="paid">已支付</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <Download size={16} />
              {t('export')}
            </button>
            <button className="btn-secondary">
              <RefreshCw size={16} className="mr-2" />
              {t('refresh') || '刷新数据'}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="max-w-7xl mx-auto glass rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  渠道信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  周期
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  保费总额
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  佣金明细
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  赔付扣减
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  应付净额
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  时间线
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {record.channelName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{record.channelName}</div>
                        <div className="text-xs mt-1">
                          {getChannelTypeBadge(record.channelType)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-semibold">{record.period}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{formatCurrency(record.totalPremium)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">佣金:</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(record.totalCommission)}</span>
                      </div>
                      {record.bonusAmount > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">奖励:</span>
                          <span className="font-semibold text-orange-600">+{formatCurrency(record.bonusAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 pt-1 border-t">
                        <span className="font-semibold text-gray-700">合计:</span>
                        <span className="font-bold text-gray-900">{formatCurrency(record.totalAmount)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {record.claimDeduction > 0 ? (
                      <span className="font-semibold text-red-600">-{formatCurrency(record.claimDeduction)}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-bold text-green-600">{formatCurrency(record.netAmount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      {record.submittedAt && (
                        <div className="text-blue-600">📤 {record.submittedAt}</div>
                      )}
                      {record.approvedAt && (
                        <div className="text-green-600">✓ {record.approvedAt}</div>
                      )}
                      {record.paidAt && (
                        <div className="text-purple-600">💰 {record.paidAt}</div>
                      )}
                      {record.rejectionReason && (
                        <div className="text-red-600">✗ {record.rejectionReason}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {record.status === 'draft' && (
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          {t('submit')} →
                        </button>
                      )}
                      {(record.status === 'submitted' || record.status === 'rejected') && (
                        <button 
                          className="text-green-600 hover:text-green-800 text-sm font-medium mr-3"
                          onClick={() => setShowApprovalModal(record.id)}
                        >
                          {t('review')} →
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                        {t('details')} →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="max-w-7xl mx-auto mt-12 text-center glass p-12 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noSettlements')}</h3>
          <p className="text-gray-600 mb-4">
            {t('noSettlementsDescription') || '暂无结算记录'}
          </p>
          <button className="btn-secondary">
            {t('refreshData') || '刷新数据'}
          </button>
        </div>
      )}

      {/* Approval Modal Placeholder */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-lg rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('approvalReview')}</h3>
            <p className="text-gray-600 mb-6">结算审核对话框占位符（待扩展完整审批流程 UI）</p>
            <div className="flex justify-end gap-3">
              <button 
                className="btn-secondary"
                onClick={() => setShowApprovalModal(null)}
              >
                {t('cancel')}
              </button>
              <button 
                className="btn-primary"
                onClick={() => handleApprove(showApprovalModal)}
              >
                {t('approve') || '批准'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
