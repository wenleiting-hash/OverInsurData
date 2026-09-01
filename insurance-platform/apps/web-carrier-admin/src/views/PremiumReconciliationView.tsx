import React, { useState } from 'react'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Download, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Premium Reconciliation View (功能点 5.6)
 * Reconcile premium amounts with carrier records
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function PremiumReconciliationView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  
  const [carrierId, setCarrierId] = useState<string>('CAR001')
  const [month, setMonth] = useState<string>('2026-08')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'MATCHED' | 'MISMATCHED'>('ALL')

  const reconciliationStats = {
    totalPolicies: 1456,
    matched: 1435,
    mismatches: 21,
    totalPremiumBilled: 687420.00,
    totalPremiumSystem: 682150.00,
    difference: 5270.00,
    matchRate: 98.56
  }

  // Mock mismatch data
  const mismatches = [
    {
      id: 'PM-001',
      policyNumber: 'POL-BCBS-FL-2026-001234',
      producerNPN: '1234567',
      insuredName: 'John Smith',
      billedPremium: 450.00,
      systemPremium: 450.00,
      difference: 0,
      mismatchType: 'GRACE_PERIOD',
      reason: 'Grace period adjustment - actual payment differs from policy rate',
      status: 'MISMATCHED',
      policyDate: '2026-07-15',
      effectiveDate: '2026-07-01'
    },
    {
      id: 'PM-002',
      policyNumber: 'POL-AETNA-TX-2026-005678',
      producerNPN: '2345678',
      insuredName: 'Jane Doe',
      billedPremium: 320.00,
      systemPremium: 352.00,
      difference: -32.00,
      mismatchType: 'PREMIUM_DIFFERENCE',
      reason: 'Policy was underwritten on different risk rating tier',
      status: 'MISMATCHED',
      policyDate: '2026-07-18',
      effectiveDate: '2026-07-01'
    },
    {
      id: 'PM-003',
      policyNumber: 'POL-UNITED-CA-2026-009012',
      producerNPN: '3456789',
      insuredName: 'Robert Johnson',
      billedPremium: 580.00,
      systemPremium: 580.00,
      difference: 0,
      mismatchType: 'TAX_VARIANCE',
      reason: 'State tax and fee differences not reflected in system',
      status: 'MISMATCHED',
      policyDate: '2026-07-20',
      effectiveDate: '2026-07-01'
    },
    {
      id: 'PM-004',
      policyNumber: 'POL-CIGNA-NY-2026-003456',
      producerNPN: '4567890',
      insuredName: 'Emily Davis',
      billedPremium: 720.00,
      systemPremium: 680.00,
      difference: 40.00,
      mismatchType: 'SUBSCRIPTION_FEE',
      reason: 'Additional subscription fees applied by carrier',
      status: 'MISMATCHED',
      policyDate: '2026-07-22',
      effectiveDate: '2026-07-01'
    },
    {
      id: 'PM-005',
      policyNumber: 'POL-HUMANAZ-IL-2026-007890',
      producerNPN: '5678901',
      insuredName: 'Michael Brown',
      billedPremium: 410.00,
      systemPremium: 410.00,
      difference: 0,
      mismatchType: 'AUTO_ENROLLMENT',
      reason: 'Automatic enrollment during open enrollment period',
      status: 'MATCHED',
      policyDate: '2026-07-25',
      effectiveDate: '2026-07-01'
    },
  ]

  const handleExportResults = () => {
    alert('Exporting premium reconciliation results...')
  }

  const handleGenerateReport = () => {
    alert('Generating premium reconciliation report...')
  }

  const getMismatchBadge = (type: string) => {
    const badges = {
      'PREMIUM_DIFFERENCE': 'bg-red-100 text-red-800',
      'GRACE_PERIOD': 'bg-yellow-100 text-yellow-800',
      'TAX_VARIANCE': 'bg-orange-100 text-orange-800',
      'SUBSCRIPTION_FEE': 'bg-purple-100 text-purple-800',
      'AUTO_ENROLLMENT': 'bg-blue-100 text-blue-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[type as keyof typeof badges]}`}>{type}</span>
  }

  const filteredMismatches = mismatches.filter(mismatch => {
    if (statusFilter === 'MATCHED') {
      return mismatch.status === 'MATCHED'
    }
    if (statusFilter === 'MISMATCHED') {
      return mismatch.status === 'MISMATCHED'
    }
    return true
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.premiumReconciliation')}
          </h1>
          <p className="text-gray-600">{t('description.premiumReconDesc')}</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGenerateReport}
            className="btn-secondary flex items-center"
          >
            <FileText size={16} className="mr-2" />
            Generate Report
          </button>
          <button
            onClick={() => navigateTo('finance-bill-import')}
            className="btn-secondary flex items-center"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Finance
          </button>
        </div>
      </div>

      {/* Configuration Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Carrier</label>
            <select
              value={carrierId}
              onChange={(e) => setCarrierId(e.target.value)}
              className="input-block"
            >
              <option value="CAR001">Blue Cross Blue Shield</option>
              <option value="CAR002">Aetna</option>
              <option value="CAR003">UnitedHealth Group</option>
              <option value="CAR004">Cigna</option>
              <option value="CAR005">Humana</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Billing Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input-block"
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary">
              <Save size={16} className="mr-2" />
              Start Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Matched Policies</div>
          <div className="text-2xl font-bold text-green-900">{reconciliationStats.matched}</div>
          <div className="text-xs text-green-700 mt-1">{reconciliationStats.matchRate}% match rate</div>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Premium Mismatches</div>
          <div className="text-2xl font-bold text-red-900">{reconciliationStats.mismatches}</div>
        </div>
        <div className="card p-4 border-l-4 border-teal-500">
          <div className="text-sm text-gray-600 mb-1">Total Billed</div>
          <div className="text-xl font-bold text-teal-900">${reconciliationStats.totalPremiumBilled.toLocaleString()}</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">System Total</div>
          <div className="text-xl font-bold text-blue-900">${reconciliationStats.totalPremiumSystem.toLocaleString()}</div>
        </div>
        <div className="card p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Variance</div>
          <div className="text-xl font-bold text-orange-900">${reconciliationStats.difference.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Show:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40"
          >
            <option value="ALL">All Records</option>
            <option value="MATCHED">Matched Only</option>
            <option value="MISMATCHED">Mismatches Only</option>
          </select>
          
          <button
            onClick={handleExportResults}
            className="btn-secondary ml-auto flex items-center px-4 py-2"
          >
            <Download size={14} className="mr-2" />
            Export Results
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Policy Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producer / Insured
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Billed Premium
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                System Premium
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discrepancy Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMismatches.map((mismatch) => (
              <tr key={mismatch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {mismatch.policyNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{mismatch.insuredName}</div>
                  <div className="text-xs text-gray-500">NPN: {mismatch.producerNPN}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mismatch.status === 'MATCHED' ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Matched
                    </span>
                  ) : (
                    getMismatchBadge(mismatch.mismatchType)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${mismatch.billedPremium.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                  ${mismatch.systemPremium.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                  Math.abs(mismatch.difference) > 0.01 
                    ? mismatch.difference > 0 
                      ? 'text-red-600' 
                      : 'text-green-600'
                    : 'text-gray-400'
                }`}>
                  {Math.abs(mismatch.difference) > 0.01 ? (
                    <>
                      {mismatch.difference > 0 ? '+$' : '-$'}
                      {Math.abs(mismatch.difference).toFixed(2)}
                    </>
                  ) : (
                    <span className="text-gray-400">$0.00</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {mismatch.mismatchType !== null && (
                    <div className="space-y-1">
                      <div>{getMismatchBadge(mismatch.mismatchType)}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">
                        {mismatch.reason}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {mismatch.status === 'MISMATCHED' && (
                    <button className="text-teal-600 hover:text-teal-800 font-medium">
                      Investigate →
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredMismatches.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No records found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filter criteria</p>
          </div>
        )}
      </div>

      {/* Summary Insights */}
      <div className="mt-6 card p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-orange-600" size={20} />
          Premium Variance Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Over-Billed by Carrier</div>
            <div className="text-2xl font-bold text-red-900">$1,250.00</div>
            <div className="text-xs text-red-700 mt-1">3 policies affected</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Under-Billed by Carrier</div>
            <div className="text-2xl font-bold text-green-900">$4,020.00</div>
            <div className="text-xs text-green-700 mt-1">12 policies affected</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Adjustment Required</div>
            <div className="text-2xl font-bold text-yellow-900">$2,770.00</div>
            <div className="text-xs text-yellow-700 mt-1">Next settlement cycle</div>
          </div>
        </div>
      </div>
    </div>
  )
}
