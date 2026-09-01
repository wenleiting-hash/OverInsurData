import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { Key, ShieldAlert, TrendingUp, DollarSign, Calendar, Plus, Filter, Download, CheckCircle, Clock } from 'lucide-react';
import ProductAuthMatrixModal from '@/components/ProductAuthMatrixModal';

interface Authorization {
  id: string;
  channelId: string;
  channelName: string;
  channelIdCode: string;
  productId: string;
  productName: string;
  productCode: string;
  insurer: string;
  limitAmount?: number;
  restrictedStates?: string[];
  restrictedTypes?: string[];
  validUntil?: string;
  status: 'active' | 'expired' | 'pending';
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

// Mock data - Existing authorizations
const mockAuthorizations: Authorization[] = [
  {
    id: 'auth1',
    channelId: 'c1',
    channelName: '上海代理点',
    channelIdCode: 'SH-001',
    productId: 'p1',
    productName: '重大疾病保险 A 款',
    productCode: 'CI-A001',
    insurer: '平安人寿',
    limitAmount: 500000,
    restrictedStates: [],
    restrictedTypes: ['high-risk'],
    validUntil: '2027-12-31',
    status: 'active',
  },
  {
    id: 'auth2',
    channelId: 'c2',
    channelName: '北京经纪门店',
    channelIdCode: 'BJ-002',
    productId: 'p2',
    productName: '医疗保险 B 款',
    productCode: 'MI-B002',
    insurer: '友邦保险',
    limitAmount: 800000,
    restrictedStates: ['TX', 'FL'],
    restrictedTypes: [],
    validUntil: '2026-06-30',
    status: 'active',
  },
  {
    id: 'auth3',
    channelId: 'c4',
    channelName: '深圳 MGA 总部',
    channelIdCode: 'SZ-004',
    productId: 'p1',
    productName: '重大疾病保险 A 款',
    productCode: 'CI-A001',
    insurer: '平安人寿',
    limitAmount: 2000000,
    restrictedStates: [],
    restrictedTypes: [],
    validUntil: '2028-09-30',
    status: 'active',
  },
  {
    id: 'auth4',
    channelId: 'c3',
    channelName: '广州 MG 公司',
    channelIdCode: 'GZ-003',
    productId: 'p3',
    productName: '意外保险 C 款',
    productCode: 'AI-C003',
    insurer: '安联保险',
    limitAmount: 300000,
    restrictedStates: ['NY'],
    restrictedTypes: ['state-restricted'],
    validUntil: '2025-03-31',
    status: 'pending',
  },
];

export default function ProductAuthView({ navigateTo }: Props) {
  const { t } = useTranslation('channel');
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showAuthModal, setShowAuthModal] = useState(false);

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
      expired: 'bg-red-100 text-red-700 border-red-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status]}`}>
        {t(`authStatus.${status}`) || status}
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

  const filteredData = mockAuthorizations.filter((auth) => {
    if (selectedChannelFilter !== 'all' && auth.channelId !== selectedChannelFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'all' && auth.status !== selectedStatusFilter) {
      return false;
    }
    return true;
  });

  const stats = {
    total: mockAuthorizations.length,
    active: mockAuthorizations.filter(a => a.status === 'active').length,
    expired: mockAuthorizations.filter(a => a.status === 'expired').length,
    pending: mockAuthorizations.filter(a => a.status === 'pending').length,
    totalLimit: mockAuthorizations.reduce((sum, a) => sum + (a.limitAmount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('productAuthorization') || '产品授权管理'}</h1>
        <p className="text-gray-600">{t('authDescription') || '管理平台与渠道之间的产品授权关系和限制条件'} </p>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalAuthorizations')}</h3>
            <Key className="text-blue-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</p>
          <p className="text-xs text-gray-500">{t('authorizationCount')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('activeAuths')}</h3>
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.active}</p>
          <p className="text-xs text-gray-500">{t('validNow')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('pendingApprovals')}</h3>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.pending}</p>
          <p className="text-xs text-gray-500">{t('awaitingReview')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('expiredAuths')}</h3>
            <Calendar className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{stats.expired}</p>
          <p className="text-xs text-gray-500">{t('needsRenewal')}</p>
        </div>

        <div className="glass p-6 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('totalAuthorizedLimit')}</h3>
            <DollarSign className="text-purple-600" size={20} />
          </div>
          <p className="text-lg font-bold text-gray-900 mb-1">{formatCurrency(stats.totalLimit)}</p>
          <p className="text-xs text-gray-500">{t('aggregateLimit')}</p>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="max-w-7xl mx-auto glass p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-60">
            <Filter size={18} className="text-gray-500" />
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有渠道</option>
              <option value="c1">上海代理点</option>
              <option value="c2">北京经纪门店</option>
              <option value="c3">广州 MG 公司</option>
              <option value="c4">深圳 MGA 总部</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有状态</option>
              <option value="active">有效</option>
              <option value="pending">待审核</option>
              <option value="expired">过期</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="btn-secondary">
              <Download size={16} />
              {t('export')}
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowAuthModal(true)}
            >
              <Plus size={16} className="mr-2" />
              {t('addAuthorization') || '新增授权'}
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
                  产品信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('limitAmount') || '授权限额'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('restrictedStates') || '限制州'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('validUntil') || '有效期至'}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((auth) => (
                <tr key={auth.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {auth.channelName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{auth.channelName}</div>
                        <div className="text-xs text-gray-500">{auth.channelIdCode}</div>
                        <div className="text-xs mt-1">
                          {getChannelTypeBadge(auth.channelId === 'c1' ? 'Agent' : auth.channelId === 'c2' ? 'Broker' : auth.channelId === 'c3' ? 'MG' : 'MGA')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-gray-900">{auth.productName}</div>
                      <div className="text-xs text-gray-500">{auth.productCode}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <ShieldAlert size={10} />
                        {auth.insurer}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-gray-900">
                      {auth.limitAmount ? formatCurrency(auth.limitAmount) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {auth.restrictedStates && auth.restrictedStates.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {auth.restrictedStates.map((state) => (
                          <span key={state} className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                            {state}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {auth.validUntil || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(auth.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3">
                      {t('edit')} →
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      {t('revoke') || '撤销'}
                    </button>
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
          <ShieldAlert className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noAuthorizations')}</h3>
          <p className="text-gray-600 mb-4">
            {t('noAuthorizationsDescription') || '暂无产品授权记录，请添加新的授权配置'}
          </p>
          <button 
            className="btn-primary"
            onClick={() => setShowAuthModal(true)}
          >
            <Plus size={16} className="mr-2" />
            {t('addAuthorization')}
          </button>
        </div>
      )}

      {/* Auth Modal */}
      <ProductAuthMatrixModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSubmit={(authorizations) => {
          console.log('保存授权:', authorizations);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
