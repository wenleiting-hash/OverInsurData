import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Shield, Key, DollarSign, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (authorizations: Authorization[]) => void;
}

interface Channel {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  type: 'MGA' | 'MG' | 'Agent' | 'Broker';
  licenseExpiry: string;
  status: 'active' | 'pending' | 'inactive';
}

interface Product {
  id: string;
  name: string;
  nameEn: string;
  code: string;
  insurer: string;
  insurerEn: string;
  status: 'active' | 'inactive' | 'expired';
  availableStates: string[];
  category: string;
  categoryEn: string;
}

interface Authorization {
  channelId: string;
  productId: string;
  limitAmount?: number;
  restrictedTypes?: string[];
  restrictedStates?: string[];
  validUntil?: string;
}

// Mock data - Channels
const mockChannels: Channel[] = [
  {
    id: 'c1',
    name: '上海代理点',
    nameEn: 'Shanghai Agency',
    code: 'SH-001',
    type: 'Agent',
    licenseExpiry: '2027-12-31',
    status: 'active',
  },
  {
    id: 'c2',
    name: '北京经纪门店',
    nameEn: 'Beijing Brokerage',
    code: 'BJ-002',
    type: 'Broker',
    licenseExpiry: '2026-06-30',
    status: 'active',
  },
  {
    id: 'c3',
    name: '广州 MG 公司',
    nameEn: 'Guangzhou MGA Co.',
    code: 'GZ-003',
    type: 'MG',
    licenseExpiry: '2025-03-31',
    status: 'pending',
  },
  {
    id: 'c4',
    name: '深圳 MGA 总部',
    nameEn: 'Shenzhen MGA HQ',
    code: 'SZ-004',
    type: 'MGA',
    licenseExpiry: '2028-09-30',
    status: 'active',
  },
];

// Mock data - Products
const mockProducts: Product[] = [
  {
    id: 'p1',
    name: '重大疾病保险 A 款',
    nameEn: 'Critical Illness Insurance A',
    code: 'CI-A001',
    insurer: '平安人寿',
    insurerEn: 'Ping An Life',
    status: 'active',
    availableStates: ['CA', 'NY', 'TX', 'FL'],
    category: '健康险',
    categoryEn: 'Health Insurance',
  },
  {
    id: 'p2',
    name: '医疗保险 B 款',
    nameEn: 'Medical Insurance B',
    code: 'MI-B002',
    insurer: '友邦保险',
    insurerEn: 'AIA Insurance',
    status: 'active',
    availableStates: ['CA', 'NY', 'IL', 'WA'],
    category: '健康险',
    categoryEn: 'Health Insurance',
  },
  {
    id: 'p3',
    name: '意外保险 C 款',
    nameEn: 'Accident Insurance C',
    code: 'AI-C003',
    insurer: '安联保险',
    insurerEn: 'Allianz Insurance',
    status: 'active',
    availableStates: ['TX', 'FL', 'PA', 'OH'],
    category: '意外险',
    categoryEn: 'Accident Insurance',
  },
  {
    id: 'p4',
    name: '寿险 D 款',
    nameEn: 'Life Insurance D',
    code: 'LT-D004',
    insurer: '大都会人寿',
    insurerEn: 'MetLife',
    status: 'inactive',
    availableStates: ['CA', 'NY'],
    category: '寿险',
    categoryEn: 'Life Insurance',
  },
];

export default function ProductAuthMatrixModal({ open, onClose }: Props) {
  const { t, i18n } = useTranslation('channel');
  const isEn = i18n.language?.startsWith?.('en') ?? false;
  const [selectedChannel, setSelectedChannel] = useState<string>('c1');
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [authorizationDetails, setAuthorizationDetails] = useState<{
    limitAmount: string;
    restrictedStates: string[];
    restrictedTypes: string[];
    validUntil: string;
  }>({
    limitAmount: '',
    restrictedStates: [],
    restrictedTypes: [],
    validUntil: '',
  });

  if (!open) return null;

  const getChannelStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      inactive: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getProductStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 border-green-300',
      inactive: 'bg-gray-100 text-gray-700 border-gray-300',
      expired: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
      <span className={`px-2 py-1 border rounded-md text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const handleSelectAll = () => {
    const allIds = mockProducts.map((p) => p.id);
    setSelectedProducts(Object.fromEntries(allIds.map((id) => [id, true])));
  };

  const handleDeselectAll = () => {
    setSelectedProducts({});
  };

  const handleSubmit = () => {
    const authorizations: Authorization[] = Object.entries(selectedProducts)
      .filter(([_, isSelected]) => isSelected)
      .map(([productId, _]) => ({
        channelId: selectedChannel,
        productId,
        limitAmount: authorizationDetails.limitAmount ? Number(authorizationDetails.limitAmount) : undefined,
        restrictedStates: authorizationDetails.restrictedStates.length > 0 ? authorizationDetails.restrictedStates : undefined,
        restrictedTypes: authorizationDetails.restrictedTypes.length > 0 ? authorizationDetails.restrictedTypes : undefined,
        validUntil: authorizationDetails.validUntil || undefined,
      }));

    console.log('Submit authorization:', authorizations);

    alert(t('productAuth.authorizationSaved'));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass w-full max-w-6xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('productAuth.matrixTitle')}</h2>
            <p className="text-sm text-gray-600 mt-1">{t('productAuth.matrixDescription')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Channel Selector */}
          <div className="mb-6 glass p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('productAuth.selectChannel')}
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full md:w-80 bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mockChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {isEn ? channel.nameEn : channel.name} ({channel.code}) - {channel.type}
                </option>
              ))}
            </select>
            
            {/* Selected Channel Info */}
            {(() => {
              const channel = mockChannels.find((c) => c.id === selectedChannel);
              if (channel) {
                return (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">{t('type')}</div>
                      <div className="font-semibold text-gray-900">{channel.type}</div>
                    </div>
                    <div className="glass p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">{t('licenseExpiry')}</div>
                      <div className="font-semibold text-gray-900">{channel.licenseExpiry}</div>
                    </div>
                    <div className="glass p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">{t('status')}</div>
                      <div>{getChannelStatusBadge(channel.status)}</div>
                    </div>
                    <div className="glass p-3 rounded-md">
                      <div className="text-xs text-gray-500 mb-1">{t('productAuth.authorizedCount')}</div>
                      <div className="font-semibold text-gray-900">{t('productAuth.authorizedCountValue', { count: 12 })}</div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Products Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('productAuth.availableProducts')}: {mockProducts.length}</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleSelectAll} className="btn-secondary text-sm">
                  {t('productAuth.selectAll')}
                </button>
                <button onClick={handleDeselectAll} className="btn-secondary text-sm">
                  {t('productAuth.deselectAll')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`glass p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    selectedProducts[product.id] ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                  }`}
                  onClick={() => {
                    setSelectedProducts({
                      ...selectedProducts,
                      [product.id]: !selectedProducts[product.id],
                    });
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="text-blue-600" size={20} />
                      <span className="font-bold text-gray-900">{isEn ? product.categoryEn : product.category}</span>
                    </div>
                    {getProductStatusBadge(product.status)}
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-1 truncate" title={isEn ? product.nameEn : product.name}>
                    {isEn ? product.nameEn : product.name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">{product.code}</p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Key size={12} />
                      <span>{isEn ? product.insurerEn : product.insurer}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={12} />
                      <span>{product.availableStates.length} states</span>
                    </div>
                  </div>

                  {selectedProducts[product.id] && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center gap-1 text-sm text-green-700">
                        <CheckCircle size={14} />
                        <span>{t('productAuth.selected')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Authorization Details */}
          <div className="glass p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key size={20} />
              {t('productAuth.authorizationSettings')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Limit Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('productAuth.limitAmount')} (USD)
                </label>
                <input
                  type="number"
                  value={authorizationDetails.limitAmount}
                  onChange={(e) =>
                    setAuthorizationDetails({ ...authorizationDetails, limitAmount: e.target.value })
                  }
                  placeholder={t('productAuth.limitAmountPlaceholder')}
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('productAuth.limitAmountHint')}</p>
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('productAuth.validUntil')}
                </label>
                <input
                  type="date"
                  value={authorizationDetails.validUntil}
                  onChange={(e) =>
                    setAuthorizationDetails({ ...authorizationDetails, validUntil: e.target.value })
                  }
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Restricted States */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('productAuth.restrictedStates')}
                </label>
                <textarea
                  rows={3}
                  value={authorizationDetails.restrictedStates.join(', ')}
                  onChange={(e) =>
                    setAuthorizationDetails({
                      ...authorizationDetails,
                      restrictedStates: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder={t('productAuth.restrictedStatesPlaceholder')}
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('productAuth.restrictedStatesHint')}</p>
              </div>

              {/* Restricted Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('productAuth.restrictedTypes')}
                </label>
                <select
                  multiple
                  value={authorizationDetails.restrictedTypes}
                  onChange={(e) =>
                    setAuthorizationDetails({
                      ...authorizationDetails,
                      restrictedTypes: Array.from(e.target.selectedOptions, (option) => option.value),
                    })
                  }
                  className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="high-risk">{t('productAuth.restrictedType.highRisk')}</option>
                  <option value="premier-premium">{t('productAuth.restrictedType.premierPremium')}</option>
                  <option value="state-restricted">{t('productAuth.restrictedType.stateRestricted')}</option>
                  <option value="medical-review">{t('productAuth.restrictedType.medicalReview')}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t('productAuth.restrictedTypesHint')}</p>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="mt-6 glass p-4 rounded-md border-l-4 border-yellow-500 flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-1">{t('productAuth.complianceNotice')}</h4>
                <p className="text-xs text-yellow-700">
                  {t('productAuth.complianceNoticeText')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          <button onClick={onClose} className="btn-secondary">
            {t('productAuth.cancel')}
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            <CheckCircle size={16} className="mr-2" />
            {t('productAuth.saveAuthorization')}
          </button>
        </div>
      </div>
    </div>
  );
}
