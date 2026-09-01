import React, { useState } from 'react'
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Download, Save, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Commission Reconciliation View (功能点 5.3)
 * Compare system-calculated commissions with carrier bills line-by-line
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function CommissionReconciliationView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  
  const [carrierId, setCarrierId] = useState<string>('CAR001')
  const [month, setMonth] = useState<string>('2026-08')
  const [diffTypeFilter, setDiffTypeFilter] = useState<'ALL' | 'RATE' | 'PREMIUM' | 'POLICY' | 'PRODUCER'>('ALL')
  const [selectedDiffs, setSelectedDiffs] = useState<Set<string>>(new Set())

  const reconciliationStats = {
    totalRecords: 1262,
    matched: 1247,
    discrepancies: 15,
    totalDiscrepancyAmount: 487.50,
    matchRate: 98.81
  }

  const discrepancyTypes = {
    rate: 6,
    premium: 5,
    policy: 2,
    producer: 2
  }

  // Mock reconciliation data
  const discrepancies = [
    {
      id: 'DIFF-001',
      policyNumber: 'POL-BCBS-FL-2026-001234',
      producerNPN: '1234567',
      productId: 'BCBS-HIPAA-GOLD-2026',
      billedCommission: 45.00,
      systemCommission: 40.50,
      difference: 4.50,
      diffRate: 11.11,
      diffType: 'RATE',
      reason: 'Commission rate mismatch - Carrier used 10%, System calculated 9%',
      carrierBillId: 'BILL-LINE-001234',
      policyDate: '2026-07-15'
    },
    {
      id: 'DIFF-002',
      policyNumber: 'POL-AETNA-TX-2026-005678',
      producerNPN: '2345678',
      productId: 'AETNA-BASIC-2026',
      billedCommission: 32.00,
      systemCommission: 35.20,
      difference: -3.20,
      diffRate: -10.0,
      diffType: 'PREMIUM',
      reason: 'Premium amount different - Carrier billed on $320, System recorded $352',
      carrierBillId: 'BILL-LINE-005678',
      policyDate: '2026-07-18'
    },
    {
      id: 'DIFF-003',
      policyNumber: 'POL-UNITED-CA-2026-009012',
      producerNPN: '3456789',
      productId: 'UHG-CORE-2026',
      billedCommission: 58.00,
      systemCommission: 58.00,
      difference: 0,
      diffType: 'POLICY',
      reason: 'Policy status mismatch - Carrier shows Active, System shows Cancelled',
      carrierBillId: 'BILL-LINE-009012',
      policyDate: '2026-07-20'
    },
    {
      id: 'DIFF-004',
      policyNumber: 'POL-CIGNA-NY-2026-003456',
      producerNPN: '4567890',
      productId: 'CIGNA-PREMIUM-2026',
      billedCommission: 72.00,
      systemCommission: 64.80,
      difference: 7.20,
      diffRate: 11.11,
      diffType: 'PRODUCER',
      reason: 'Producer assignment error - Carrier billed to wrong NPN',
      carrierBillId: 'BILL-LINE-003456',
      policyDate: '2026-07-22'
    },
  ]

  const handleToggleSelect = (diffId: string) => {
    const newSelected = new Set(selectedDiffs)
    if (newSelected.has(diffId)) {
      newSelected.delete(diffId)
    } else {
      newSelected.add(diffId)
    }
    setSelectedDiffs(newSelected)
  }

  const handleBatchConfirm = () => {
    alert(`Batch confirmation for ${selectedDiffs.size} discrepancies...`)
  }

  const handleGenerateReport = () => {
    alert('Generating reconciliation report...')
  }

  const getDiffTypeBadge = (type: string) => {
    const types = {
      'RATE': 'bg-orange-100 text-orange-800',
      'PREMIUM': 'bg-yellow-100 text-yellow-800',
      'POLICY': 'bg-purple-100 text-purple-800',
      'PRODUCER': 'bg-blue-100 text-blue-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${types[type as keyof typeof types]}`}>{type}</span>
  }

  const getDiffIcon = (type: string) => {
    const icons = {
      'RATE': <AlertTriangle className="text-orange-600" size={16} />,
      'PREMIUM': <AlertTriangle className="text-yellow-600" size={16} />,
      'POLICY': <XCircle className="text-purple-600" size={16} />,
      'PRODUCER': <XCircle className="text-blue-600" size={16} />
    }
    return icons[type as keyof typeof icons] || <AlertTriangle className="text-gray-600" size={16} />
  }

  const filteredDiscrepancies = discrepancies.filter(diff => 
    diffTypeFilter === 'ALL' || diff.diffType === diffTypeFilter
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.commissionReconciliation')}
          </h1>
          <p className="text-gray-600">{t('description.reconciliationDesc')}</p>
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
            Back
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
              <RefreshCw size={16} className="mr-2" />
              Start Reconciliation
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="text-sm text-gray-600 mb-1">Matched Records</div>
          <div className="text-2xl font-bold text-green-900">{reconciliationStats.matched}</div>
          <div className="text-xs text-green-700 mt-1">{reconciliationStats.matchRate}% match rate</div>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="text-sm text-gray-600 mb-1">Discrepancies</div>
          <div className="text-2xl font-bold text-red-900">{reconciliationStats.discrepancies}</div>
          <div className="text-xs text-red-700 mt-1">{reconciliationStats.totalRecords - reconciliationStats.discrepancies} matched</div>
        </div>
        <div className="card p-4 border-l-4 border-orange-500">
          <div className="text-sm text-gray-600 mb-1">Rate Issues</div>
          <div className="text-xl font-bold text-orange-900">{discrepancyTypes.rate}</div>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="text-sm text-gray-600 mb-1">Premium Issues</div>
          <div className="text-xl font-bold text-yellow-900">{discrepancyTypes.premium}</div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="text-sm text-gray-600 mb-1">Total Discrepancy</div>
          <div className="text-xl font-bold text-blue-900">${reconciliationStats.totalDiscrepancyAmount.toFixed(2)}</div>
        </div>
      </div>

      {/* Filter & Actions Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
            <select
              value={diffTypeFilter}
              onChange={(e) => setDiffTypeFilter(e.target.value as typeof diffTypeFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="ALL">All Types</option>
              <option value="RATE">Rate Mismatch</option>
              <option value="PREMIUM">Premium Mismatch</option>
              <option value="POLICY">Policy Status</option>
              <option value="PRODUCER">Producer Assignment</option>
            </select>
          </div>
          {selectedDiffs.size > 0 && (
            <button
              onClick={handleBatchConfirm}
              className="btn-secondary flex items-center px-4 py-2"
            >
              <Save size={14} className="mr-2" />
              Batch Confirm ({selectedDiffs.size})
            </button>
          )}
        </div>
      </div>

      {/* Discrepancy List */}
      <div className="space-y-4">
        {filteredDiscrepancies.map((diff) => (
          <div key={diff.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedDiffs.has(diff.id)}
                onChange={() => handleToggleSelect(diff.id)}
                className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="font-semibold text-gray-900">{diff.id}</span>
                  {getDiffTypeBadge(diff.diffType)}
                  {getDiffIcon(diff.diffType)}
                  <span className="text-xs text-gray-500">{diff.policyDate}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Policy Number</div>
                    <div className="font-mono text-sm text-gray-900">{diff.policyNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Producer</div>
                    <div className="text-sm text-gray-900">{diff.producerNPN}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Product</div>
                    <div className="text-sm text-gray-900">{diff.productId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Billed Amount</div>
                    <div className="text-sm font-semibold text-red-600">${diff.billedCommission.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">System Amount</div>
                    <div className="text-sm font-semibold text-blue-600">${diff.systemCommission.toFixed(2)}</div>
                  </div>
                </div>

                {/* Difference Highlight */}
                <div className={`p-3 rounded-lg mb-3 ${
                  diff.difference > 0 ? 'bg-red-50 border border-red-200' : 
                  diff.difference < 0 ? 'bg-green-50 border border-green-200' : 
                  'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold">Difference: </span>
                      <span className={`font-bold ${
                        diff.difference > 0 ? 'text-red-600' : 
                        diff.difference < 0 ? 'text-green-600' : 
                        'text-yellow-600'
                      }`}>
                        {diff.difference > 0 ? '+$' : '-$'}{Math.abs(diff.difference).toFixed(2)} ({(diff.diffRate ?? 0).toFixed(2)}%)
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">ID: {diff.carrierBillId}</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Reason: </span>
                    <span className="text-gray-600">{diff.reason}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4 mt-4">
                  <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                    View Details →
                  </button>
                  <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                    Investigate →
                  </button>
                  <button className="text-sm text-green-600 hover:text-green-800 font-medium ml-auto">
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDiscrepancies.length === 0 && (
        <div className="card p-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Discrepancies Found</h3>
          <p className="text-gray-600">All commission records match perfectly with the carrier bill.</p>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-6 flex justify-end">
        <button className="btn-secondary flex items-center px-6 py-3">
          <Download size={16} className="mr-2" />
          Export Results to Excel
        </button>
      </div>
    </div>
  )
}
