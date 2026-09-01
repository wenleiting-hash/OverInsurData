import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewId } from '@/App';
import { 
  DollarSign, 
  ArrowRightLeft, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Filter, 
  Download, 
  RefreshCw,
  Settings,
  Globe,
  CreditCard
} from 'lucide-react';

interface Settlement {
  id: string;
  settlementNumber: string;
  productId: string;
  productName: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';
  amount: number;
  exchangeRate: number;
  baseCurrency: 'USD';
  equivalentAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settlementDate: string;
  createdAt: string;
  counterparty: string;
  paymentMethod: 'wire_transfer' | 'ach' | 'sepa' | 'swift';
}

interface CurrencyRate {
  currency: string;
  rate: number;
  lastUpdated: string;
  dailyChange: number;
}

interface Props {
  navigateTo: (view: ViewId) => void;
}

const MultiCurrencySettlementView = ({ navigateTo }: Props) => {
  const { t } = useTranslation(['product', 'channel']);

  // Mock data - 多币种结算记录
  const [mockSettlements] = useState<Settlement[]>([
    {
      id: 'set001',
      settlementNumber: 'SET-2024-001',
      productId: 'prod001',
      productName: 'Essential Health Insurance',
      currency: 'USD',
      amount: 125000.00,
      exchangeRate: 1.0,
      baseCurrency: 'USD',
      equivalentAmount: 125000.00,
      status: 'completed',
      settlementDate: '2024-08-28',
      createdAt: '2024-08-25T10:30:00Z',
      counterparty: 'Blue Cross Blue Shield',
      paymentMethod: 'wire_transfer',
    },
    {
      id: 'set002',
      settlementNumber: 'SET-2024-002',
      productId: 'prod002',
      productName: 'Premium Dental Plan',
      currency: 'EUR',
      amount: 85000.00,
      exchangeRate: 1.08,
      baseCurrency: 'USD',
      equivalentAmount: 91800.00,
      status: 'processing',
      settlementDate: '2024-08-30',
      createdAt: '2024-08-26T14:20:00Z',
      counterparty: 'Allianz SE',
      paymentMethod: 'sepa',
    },
    {
      id: 'set003',
      settlementNumber: 'SET-2024-003',
      productId: 'prod003',
      productName: 'Comprehensive Vision Care',
      currency: 'GBP',
      amount: 62000.00,
      exchangeRate: 1.27,
      baseCurrency: 'USD',
      equivalentAmount: 78740.00,
      status: 'pending',
      settlementDate: '2024-09-01',
      createdAt: '2024-08-27T09:15:00Z',
      counterparty: 'Aviva Plc',
      paymentMethod: 'swift',
    },
    {
      id: 'set004',
      settlementNumber: 'SET-2024-004',
      productId: 'prod001',
      productName: 'Essential Health Insurance',
      currency: 'JPY',
      amount: 15000000.00,
      exchangeRate: 0.0067,
      baseCurrency: 'USD',
      equivalentAmount: 100500.00,
      status: 'completed',
      settlementDate: '2024-08-27',
      createdAt: '2024-08-24T16:45:00Z',
      counterparty: 'MS & A Injury Insurance',
      paymentMethod: 'wire_transfer',
    },
    {
      id: 'set005',
      settlementNumber: 'SET-2024-005',
      productId: 'prod004',
      productName: 'Critical Illness Protection',
      currency: 'CAD',
      amount: 95000.00,
      exchangeRate: 0.74,
      baseCurrency: 'USD',
      equivalentAmount: 70300.00,
      status: 'failed',
      settlementDate: '2024-08-29',
      createdAt: '2024-08-26T11:30:00Z',
      counterparty: 'Manulife Financial',
      paymentMethod: 'wire_transfer',
    },
  ]);

  // Mock data - 实时汇率监控
  const [currencyRates] = useState<CurrencyRate[]>([
    { currency: 'EUR', rate: 1.08, lastUpdated: '2024-08-31 14:30:00', dailyChange: 0.15 },
    { currency: 'GBP', rate: 1.27, lastUpdated: '2024-08-31 14:30:00', dailyChange: -0.08 },
    { currency: 'JPY', rate: 0.0067, lastUpdated: '2024-08-31 14:30:00', dailyChange: 0.02 },
    { currency: 'CAD', rate: 0.74, lastUpdated: '2024-08-31 14:30:00', dailyChange: -0.12 },
    { currency: 'AUD', rate: 0.65, lastUpdated: '2024-08-31 14:30:00', dailyChange: 0.05 },
  ]);

  const totalSettlementVolume = mockSettlements.reduce((sum, s) => sum + s.equivalentAmount, 0);
  const completedSettlements = mockSettlements.filter(s => s.status === 'completed').length;
  const pendingSettlements = mockSettlements.filter(s => s.status === 'pending').length;
  const failedSettlements = mockSettlements.filter(s => s.status === 'failed').length;

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'wire_transfer':
        return <Globe size={16} />;
      case 'ach':
        return <CreditCard size={16} />;
      case 'sepa':
        return <ArrowRightLeft size={16} />;
      case 'swift':
        return <DollarSign size={16} />;
      default:
        return <Settings size={16} />;
    }
  };

  const handleRefreshRates = () => {
    alert('已刷新最新汇率数据');
  };

  const handleExportSettlements = () => {
    alert('正在导出多币种结算报告...');
  };

  const handleReprocessFailed = (id: string) => {
    alert(`已重新处理失败的交易：${id}`);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg">
              <Globe className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                多币种结算枢纽
              </h1>
              <p className="text-gray-600">Multi-Currency Settlement Hub</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefreshRates}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md border border-gray-200 font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              刷新汇率
            </button>
            <button
              onClick={handleExportSettlements}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-200 flex items-center gap-2"
            >
              <Download size={18} />
              导出报表
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
            ${(totalSettlementVolume / 1000000).toFixed(2)}M
          </div>
          <div className="text-sm text-gray-600">总结算额 (本位币)</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-100 rounded-xl">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs text-emerald-600 font-semibold">95%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{completedSettlements}</div>
          <div className="text-sm text-gray-600">已完成结算</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-yellow-100 rounded-xl">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{pendingSettlements}</div>
          <div className="text-sm text-gray-600">待处理结算</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-purple-100 rounded-xl">
              <Globe className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
          <div className="text-sm text-gray-600">支持币种数量</div>
        </div>

        <div className="group bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-100 rounded-xl">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <span className="text-xs text-red-600 font-semibold">需处理</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{failedSettlements}</div>
          <div className="text-sm text-gray-600">失败交易</div>
        </div>
      </div>

      {/* 实时汇率监控面板 */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50 mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
              <ArrowRightLeft className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">实时汇率监控</h2>
              <p className="text-sm text-gray-500">Live Exchange Rate Monitoring</p>
            </div>
          </div>
          <button
            onClick={handleRefreshRates}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            刷新所有汇率
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {currencyRates.map((rate) => (
            <div
              key={rate.currency}
              className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-900">{rate.currency}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  rate.dailyChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {rate.dailyChange >= 0 ? '+' : ''}{rate.dailyChange}%
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">
                1 {rate.currency} = {rate.rate.toFixed(4)} USD
              </div>
              <div className="text-xs text-gray-500">
                最后更新：{rate.lastUpdated}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settlement Records Table */}
      <div className="bg-white backdrop-blur-xl bg-opacity-70 p-6 rounded-2xl shadow-xl border border-white/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">结算记录</h2>
            <p className="text-sm text-gray-500">Settlement Transaction Records</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="">所有币种</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm">
                <option value="">所有状态</option>
                <option value="completed">已完成</option>
                <option value="processing">处理中</option>
                <option value="pending">待处理</option>
                <option value="failed">失败</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">结算编号</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">产品名称</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">币种</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">金额</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">汇率 (→USD)</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">等值 USD</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">结算日期</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">交易对手</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">支付方式</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {mockSettlements.map((settlement) => (
                <tr
                  key={settlement.id}
                  className="hover:bg-blue-50/50 border-b border-gray-100 transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900">{settlement.settlementNumber}</td>
                  <td className="py-3 px-4 text-gray-700">{settlement.productName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg font-semibold text-sm">
                      {settlement.currency}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-700">
                    {settlement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">
                    {settlement.exchangeRate.toFixed(4)}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-gray-900">
                    ${settlement.equivalentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{settlement.settlementDate}</td>
                  <td className="py-3 px-4 text-gray-700">{settlement.counterparty}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {getPaymentMethodIcon(settlement.paymentMethod)}
                      <span className="text-sm text-gray-600 capitalize">{settlement.paymentMethod.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(settlement.status)}`}>
                      {settlement.status === 'completed' && '✓ 已完成'}
                      {settlement.status === 'processing' && '● 处理中'}
                      {settlement.status === 'pending' && '○ 待处理'}
                      {settlement.status === 'failed' && '✗ 失败'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {settlement.status === 'failed' && (
                      <button
                        onClick={() => handleReprocessFailed(settlement.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
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

        {/* Empty State if no settlements */}
        {mockSettlements.length === 0 && (
          <div className="text-center py-12">
            <Globe className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500">暂无结算记录</p>
          </div>
        )}
      </div>

      {/* AI 结算优化建议 */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg mt-0.5">
            <TrendingUp className="text-white" size={20} />
          </div>
          <div>
            <div className="font-bold text-blue-900 mb-2">AI 结算优化建议</div>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>EUR 和 GBP 汇率处于有利区间，建议在 14:30 前完成这两笔结算以减少汇兑损失</li>
              <li>CAD 结算失败原因为账户信息不匹配，请联系 Manulife Financial 更新收款账户</li>
              <li>近期 JPY 波动较大，建议对大额日元结算启用汇率锁定功能</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiCurrencySettlementView;
