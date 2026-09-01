import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Building2, FileText, CheckCircle, Clock, DollarSign, Shield, Download, RefreshCw, TrendingUp } from 'lucide-react';

interface PortalDashboard {
  channelId: string;
  channelName: string;
  channelType: string;
  licenseNumber: string;
  status: 'active' | 'pending' | 'suspended';
}

interface RecentTransactions {
  id: string;
  date: string;
  type: string;
  description: string;
  amount?: number;
  status: 'completed' | 'pending' | 'failed';
}

interface CommissionStatement {
  id: string;
  period: string;
  premium: number;
  commission: number;
  bonus: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  generatedAt: string;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Channel dashboard
const mockDashboard: PortalDashboard = {
  channelId: 'c4',
  channelName: '深圳 MGA 总部',
  channelType: 'MGA',
  licenseNumber: 'MGA-GD-2024-001',
  status: 'active',
};

// Mock data - Recent transactions
const mockTransactions: RecentTransactions[] = [
  {
    id: 'txn1',
    date: '2026-08-30',
    type: 'Premium Payment',
    description: 'Policy #POL-2024-001 Premium Collection',
    amount: 125000,
    status: 'completed',
  },
  {
    id: 'txn2',
    date: '2026-08-29',
    type: 'Commission Payout',
    description: 'July 2026 Commission Statement',
    amount: 89000,
    status: 'completed',
  },
  {
    id: 'txn3',
    date: '2026-08-28',
    type: 'Claim Settlement',
    description: 'Claim #CLM-2024-045 Paid Out',
    amount: 45000,
    status: 'completed',
  },
  {
    id: 'txn4',
    date: '2026-08-27',
    type: 'New Policy',
    description: 'Policy #POL-2024-002 Issued',
    amount: 78000,
    status: 'completed',
  },
];

// Mock data - Commission statements
const mockStatements: CommissionStatement[] = [
  {
    id: 'stmt1',
    period: '2026-07',
    premium: 8900000,
    commission: 1644500,
    bonus: 280000,
    total: 1924500,
    status: 'paid',
    generatedAt: '2026-08-01',
  },
  {
    id: 'stmt2',
    period: '2026-06',
    premium: 7500000,
    commission: 1387500,
    bonus: 225000,
    total: 1612500,
    status: 'paid',
    generatedAt: '2026-07-01',
  },
  {
    id: 'stmt3',
    period: '2026-05',
    premium: 6800000,
    commission: 1258000,
    bonus: 180000,
    total: 1438000,
    status: 'approved',
    generatedAt: '2026-06-01',
  },
];

export default function ChannelPortalView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
      active: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      suspended: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<string, string> = {
      active: '正常',
      pending: '待审核',
      suspended: '已暂停',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getTransactionStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-blue-100 text-blue-700 border-blue-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
    };
    const labels: Record<string, string> = {
      completed: '已完成',
      pending: '处理中',
      failed: '失败',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Statistics
  const stats = {
    totalPremium: mockTransactions.filter(t => t.type === 'Premium Payment').reduce((sum, t) => sum + (t.amount || 0), 0),
    totalCommission: mockStatements.reduce((sum, s) => sum + s.total, 0),
    totalClaims: mockTransactions.filter(t => t.type === 'Claim Settlement').length,
    recentPolicies: mockTransactions.filter(t => t.type === 'New Policy').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {mockDashboard.channelName} 自助门户
            </h1>
            <p className="text-gray-600">{t('portalDescription') || '管理您的保单、佣金和理赔信息'} </p>
          </div>
          <button 
            className="btn-secondary"
            onClick={handleRefresh}
          >
            <RefreshCw size={16} className="mr-2" />
            刷新数据
          </button>
        </div>
      </div>

      {/* Channel Status Card */}
      <div className="max-w-7xl mx-auto glass p-6 rounded-lg mb-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {mockDashboard.channelName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl font-bold text-gray-900">{mockDashboard.channelName}</h2>
              {getStatusBadge(mockDashboard.status)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">渠道类型：</span>
                <span className="font-semibold text-gray-900">{mockDashboard.channelType}</span>
              </div>
              <div>
                <span className="text-gray-500">牌照编号：</span>
                <span className="font-semibold text-gray-900">{mockDashboard.licenseNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">活跃天数：</span>
                <span className="font-semibold text-gray-900">365 天</span>
              </div>
              <div>
                <span className="text-gray-500">账户状态：</span>
                <span className="text-green-600 font-semibold">正常运行</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">本月保费</h3>
            <DollarSign className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalPremium)}</p>
          <p className="text-xs text-green-600">↑ 12.5% 环比增长</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">累计佣金</h3>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(stats.totalCommission)}</p>
          <p className="text-xs text-gray-500">截至 2026-08-31</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">处理理赔</h3>
            <Shield className="text-orange-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.totalClaims}</p>
          <p className="text-xs text-gray-500">本季度总量</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">新单数量</h3>
            <FileText className="text-purple-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.recentPolicies}</p>
          <p className="text-xs text-green-600">↑ 8 单 本周</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Statements */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign size={20} className="text-blue-600" />
              佣金对账单
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {mockStatements.map((stmt) => (
              <div key={stmt.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{stmt.period}月</span>
                    {stmt.status === 'paid' && <CheckCircle size={16} className="text-green-600" />}
                    {stmt.status === 'approved' && <Clock size={16} className="text-blue-600" />}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-blue-600">{formatCurrency(stmt.total)}</div>
                    <div className="text-xs text-gray-500">发放日期：{stmt.generatedAt}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs text-gray-600 pt-3 border-t">
                  <div>
                    <span>保费总额：</span>
                    <span className="font-semibold">{formatCurrency(stmt.premium)}</span>
                  </div>
                  <div>
                    <span>基础佣金：</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(stmt.commission)}</span>
                  </div>
                  <div>
                    <span>额外奖励：</span>
                    <span className="font-semibold text-orange-600">+{formatCurrency(stmt.bonus)}</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button className="btn-secondary text-sm">
                    <Download size={14} className="mr-1" />
                    下载 PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-purple-600" />
              最近交易记录
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              查看全部 →
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {mockTransactions.map((txn) => (
              <div key={txn.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      txn.type.includes('Premium') ? 'bg-green-100' :
                      txn.type.includes('Commission') ? 'bg-blue-100' :
                      txn.type.includes('Claim') ? 'bg-orange-100' : 'bg-purple-100'
                    }`}>
                      {txn.type.includes('Premium') ? <DollarSign size={18} className="text-green-600" /> :
                       txn.type.includes('Commission') ? <TrendingUp size={18} className="text-blue-600" /> :
                       txn.type.includes('Claim') ? <Shield size={18} className="text-orange-600" /> :
                       <FileText size={18} className="text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{txn.description}</div>
                      <div className="text-xs text-gray-500">{txn.type} · {txn.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {txn.amount && (
                      <div className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.amount > 0 ? '+' : '-'}{formatCurrency(txn.amount)}
                      </div>
                    )}
                    <div className="mt-1">{getTransactionStatusBadge(txn.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="max-w-7xl mx-auto mt-6 glass p-6 rounded-lg">
        <h2 className="text-lg font-bold text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="glass p-6 rounded-lg hover:shadow-lg transition-shadow border border-gray-200">
            <Building2 size={32} className="text-blue-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">提交新保单</h3>
            <p className="text-sm text-gray-600">快速录入新保险申请</p>
          </button>

          <button className="glass p-6 rounded-lg hover:shadow-lg transition-shadow border border-gray-200">
            <FileText size={32} className="text-green-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">查询保单状态</h3>
            <p className="text-sm text-gray-600">搜索并查看历史保单信息</p>
          </button>

          <button className="glass p-6 rounded-lg hover:shadow-lg transition-shadow border border-gray-200">
            <Shield size={32} className="text-orange-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">索赔申请</h3>
            <p className="text-sm text-gray-600">提交和管理理赔请求</p>
          </button>

          <button className="glass p-6 rounded-lg hover:shadow-lg transition-shadow border border-gray-200">
            <TrendingUp size={32} className="text-purple-600 mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">佣金报表</h3>
            <p className="text-sm text-gray-600">导出月度佣金汇总数据</p>
          </button>
        </div>
      </div>

      {/* Help & Support */}
      <div className="max-w-7xl mx-auto mt-6 glass p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">需要帮助？</h3>
            <p className="text-gray-600">联系平台支持团队获取 assistance</p>
          </div>
          <button className="btn-primary">
            联系客服 →
          </button>
        </div>
      </div>
    </div>
  );
}
