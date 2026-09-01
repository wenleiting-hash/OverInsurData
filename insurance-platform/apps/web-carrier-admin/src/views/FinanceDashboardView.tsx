import React, { useState } from 'react'
import { TrendingUp, DollarSign, FileText, AlertTriangle, CheckCircle, Download, RefreshCw, Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Financial Dashboard View (功能点 5.6 Aggregation)
 * Centralized financial overview with key metrics and trends
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function FinanceDashboardView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  
  const [selectedCarrier, setSelectedCarrier] = useState<string>('ALL')
  const [dateRange, setDateRange] = useState<'MONTHLY' | 'QUARTERLY' | 'YTD'>('MONTHLY')
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Mock financial data
  const financialData = {
    monthlyBills: 1247,
    totalBilledAmount: 1248750.00,
    reconciledAmount: 1198420.00,
    pendingReconciliation: 50330.00,
    disputeAmount: 487.50,
    recoveredAmount: 3890.50,
    recoveryRate: 88.2,
    nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    carriersCount: 5,
    topCarriers: [
      { name: 'Blue Cross Blue Shield', amount: 487250.00, bills: 523 },
      { name: 'Aetna', amount: 342180.00, bills: 412 },
      { name: 'UnitedHealth Group', amount: 258920.00, bills: 189 },
      { name: 'Cigna', amount: 98760.00, bills: 87 },
      { name: 'Humana', amount: 61640.00, bills: 56 },
    ],
    trend: {
      revenueGrowth: 12.5,
      reconciliationEfficiency: 95.8,
      disputeResolutionTime: 7.2,
      paymentOnTimeRate: 98.2
    }
  }

  const quickActions = [
    { 
      id: 'import_bills',
      title: 'Import Bills',
      description: 'Import commission bills from carriers',
      icon: <Download className="text-blue-600" size={24} />,
      color: 'from-blue-500 to-cyan-500',
      navigateTo: 'CommissionBillImportView'
    },
    { 
      id: 'reconciliation',
      title: 'Start Reconciliation',
      description: 'Begin commission reconciliation process',
      icon: <CheckCircle className="text-green-600" size={24} />,
      color: 'from-green-500 to-emerald-500',
      navigateTo: 'CommissionReconciliationView'
    },
    { 
      id: 'disputes',
      title: 'Manage Disputes',
      description: 'Review and resolve active disputes',
      icon: <AlertTriangle className="text-orange-600" size={24} />,
      color: 'from-orange-500 to-red-500',
      navigateTo: 'DisputeManagementView'
    },
    { 
      id: 'config',
      title: 'Settlement Config',
      description: 'Configure settlement parameters',
      icon: <Calendar className="text-purple-600" size={24} />,
      color: 'from-purple-500 to-indigo-500',
      navigateTo: 'SettlementConfigView'
    },
  ]

  const handleRefresh = () => {
    setLastUpdated(new Date())
    alert('Dashboard refreshed!')
  }

  const handleExportReport = () => {
    alert('Exporting financial report...')
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.financialDashboard')}
          </h1>
          <p className="text-gray-600">{t('description.dashboardDesc')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            className="btn-secondary flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Time Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="MONTHLY">This Month</option>
                <option value="QUARTERLY">This Quarter</option>
                <option value="YTD">Year to Date</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Carrier</label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="ALL">All Carriers</option>
                <option value="CAR001">Blue Cross Blue Shield</option>
                <option value="CAR002">Aetna</option>
                <option value="CAR003">UnitedHealth Group</option>
                <option value="CAR004">Cigna</option>
                <option value="CAR005">Humana</option>
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="card p-6 bg-gradient-to-br from-blue-500 to-cyan-600 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="opacity-90">Total Billed</div>
            <DollarSign size={28} />
          </div>
          <div className="text-3xl font-bold">${(financialData.totalBilledAmount / 1000000).toFixed(2)}M</div>
          <div className="text-sm opacity-90 mt-2 flex items-center">
            <TrendingUp size={16} className="mr-1" />
            +{financialData.trend.revenueGrowth}% this month
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="opacity-90">Reconciled</div>
            <CheckCircle size={28} />
          </div>
          <div className="text-3xl font-bold">${(financialData.reconciledAmount / 1000000).toFixed(2)}M</div>
          <div className="text-sm opacity-90 mt-2 flex items-center">
            <span className="bg-green-400 px-2 py-1 rounded-full text-xs font-semibold mr-2">
              {financialData.trend.reconciliationEfficiency}% efficiency
            </span>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="opacity-90">Pending</div>
            <Calendar size={28} />
          </div>
          <div className="text-3xl font-bold">${(financialData.pendingReconciliation / 100000).toFixed(2)}K</div>
          <div className="text-sm opacity-90 mt-2">
            Awaiting reconciliation review
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="opacity-90">Recovered</div>
            <FileText size={28} />
          </div>
          <div className="text-3xl font-bold">${financialData.recoveredAmount.toFixed(2)}</div>
          <div className="text-sm opacity-90 mt-2 flex items-center">
            <span className="bg-green-400 px-2 py-1 rounded-full text-xs font-semibold mr-2">
              {financialData.recoveryRate}% recovery rate
            </span>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-teal-500 to-green-600 text-white hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="opacity-90">Next Payment</div>
            <DollarSign size={28} />
          </div>
          <div className="text-lg font-bold">Due in 7 days</div>
          <div className="text-sm opacity-90 mt-2">
            ${financialData.reconciledAmount.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigateTo(action.navigateTo)}
              className={`group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br ${action.color} text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}
            >
              <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition-all"></div>
              <div className="relative z-10">
                <div className="mb-4">{action.icon}</div>
                <div className="font-bold text-lg mb-1">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Carriers by Volume */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Carriers by Premium Volume</h3>
          <div className="space-y-4">
            {financialData.topCarriers.map((carrier, idx) => (
              <div key={idx} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{carrier.name}</div>
                    <div className="text-xs text-gray-500">{carrier.bills} bills processed</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-600">${carrier.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">
                      {((carrier.amount / financialData.totalBilledAmount) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-teal-500 to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(carrier.amount / financialData.totalBilledAmount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process Metrics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Efficiency Metrics</h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Reconciliation Efficiency</span>
                <span className="text-lg font-bold text-green-600">{financialData.trend.reconciliationEfficiency}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                  style={{ width: `${financialData.trend.reconciliationEfficiency}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((financialData.reconciledAmount / financialData.totalBilledAmount) * 100).toFixed(1)}% of bills matched
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Payment On-Time Rate</span>
                <span className="text-lg font-bold text-blue-600">{financialData.trend.paymentOnTimeRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full"
                  style={{ width: `${financialData.trend.paymentOnTimeRate}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {financialData.carriersCount} carriers tracked
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Dispute Resolution Time</span>
                <span className="text-lg font-bold text-orange-600">{financialData.trend.disputeResolutionTime} days avg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 h-3 rounded-full"
                  style={{ width: `${Math.min(100, (financialData.trend.disputeResolutionTime / 14) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: ≤10 business days
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="mt-6 card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status Overview</h3>
        
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Download className="text-blue-600" size={28} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{financialData.monthlyBills}</div>
            <div className="text-sm text-gray-600">Bills Imported</div>
          </div>

          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="text-green-600" size={28} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{((financialData.reconciledAmount / financialData.totalBilledAmount) * 100).toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Matched</div>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="text-orange-600" size={28} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{financialData.disputeAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Disputed Amount</div>
          </div>

          <div className="text-center">
            <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <DollarSign className="text-teal-600" size={28} />
            </div>
            <div className="text-2xl font-bold text-gray-900">${financialData.recoveredAmount.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Total Recovered</div>
          </div>
        </div>
      </div>
    </div>
  )
}
