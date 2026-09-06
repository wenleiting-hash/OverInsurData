import React, { useState } from 'react'
import { ArrowLeft, Search, Filter, CheckCircle, XCircle, AlertTriangle, Save, Database, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Bill Parsing View (功能点 5.2)
 * Parse imported bills and match with policy records and producers
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function BillParsingView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')

  const [billId, setBillId] = useState<string>('BILL-2026-08-001')
  const [searchQuery, setSearchQuery] = useState('')
  const [matchStatusFilter, setMatchStatusFilter] = useState<'ALL' | 'MATCHED' | 'UNMATCHED' | 'AMBIGUOUS'>('ALL')
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [showMatchingModal, setShowMatchingModal] = useState(false)

  const parsingStats = {
    total: 1262,
    matched: 1247,
    unmatched: 3,
    ambiguous: 12,
    successRate: 98.8
  }

  // Mock parsed bill records
  const parsedRecords = [
    {
      id: 'REC-001',
      policyNumber: 'POL-BCBS-FL-2026-001234',
      producerNPN: '1234567',
      producerName: 'John Smith Insurance Agency',
      productId: 'BCBS-HIPAA-GOLD-2026',
      premium: 450.00,
      commission: 45.00,
      commissionRate: 10,
      matchStatus: 'MATCHED',
      confidence: 99.5,
      source: 'carrier_system'
    },
    {
      id: 'REC-002',
      policyNumber: 'POL-AETNA-TX-2026-005678',
      producerNPN: '2345678',
      producerName: 'Texas Agent Group',
      productId: 'AETNA-BASIC-2026',
      premium: 320.00,
      commission: 32.00,
      commissionRate: 10,
      matchStatus: 'MATCHED',
      confidence: 98.2,
      source: 'carrier_system'
    },
    {
      id: 'REC-003',
      policyNumber: 'INVALID-FORMAT',
      producerNPN: '',
      producerName: 'Unknown Producer',
      productId: '',
      premium: 0,
      commission: 0,
      commissionRate: 0,
      matchStatus: 'UNMATCHED',
      confidence: 0,
      matchReason: 'Policy not found in system'
    },
    {
      id: 'REC-004',
      policyNumber: 'POL-UNITED-CA-2026-009012',
      producerNPN: '3456789',
      producerName: 'California Health Brokers',
      productId: 'UHG-CORE-2026',
      premium: 580.00,
      commission: 58.00,
      commissionRate: 10,
      matchStatus: 'AMBIGUOUS',
      confidence: 65.0,
      matchReason: 'Multiple potential matches found'
    },
  ]

  const handleToggleSelect = (recordId: string) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
  }

  const handleBatchMatch = () => {
    alert(`Batch matching for ${selectedRecords.size} records...`)
  }

  const handleManualMatch = (recordId: string) => {
    setShowMatchingModal(true)
  }

  const getMatchBadge = (status: string) => {
    if (status === 'MATCHED') {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{t('labels.matched')}</span>
    }
    if (status === 'UNMATCHED') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">{t('labels.unmatched')}</span>
    }
    if (status === 'AMBIGUOUS') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">{t('labels.ambiguous')}</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">{t('billParsing.unknown')}</span>
  }

  const filteredRecords = parsedRecords.filter(record => {
    if (matchStatusFilter !== 'ALL' && record.matchStatus !== matchStatusFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        record.policyNumber?.toLowerCase().includes(query) ||
        record.producerNPN?.includes(query) ||
        record.producerName?.toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.billParsing')}
          </h1>
          <p className="text-gray-600">{t('description.billParsingDesc')}</p>
        </div>
        <button
          onClick={() => navigateTo('finance-bill-import')}
          className="btn-secondary flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t('billParsing.backToImport')}
        </button>
      </div>

      {/* Bill Info Bar */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90 mb-1">{t('billParsing.currentBill')}</div>
            <div className="text-2xl font-bold">{billId}</div>
            <div className="text-sm opacity-80 mt-1">{t('billParsing.billInfo', { month: '2026-08', format: 'CSV', count: parsingStats.total })}</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90 mb-1">{t('billParsing.successRate')}</div>
            <div className="text-3xl font-bold">{parsingStats.successRate}%</div>
            <div className="text-sm opacity-80">{t('billParsing.matchedRatio', { matched: parsingStats.matched, total: parsingStats.total })}</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('billParsing.stats.matched')}</div>
              <div className="text-2xl font-bold text-gray-900">{parsingStats.matched}</div>
            </div>
            <CheckCircle className="text-green-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('billParsing.stats.unmatched')}</div>
              <div className="text-2xl font-bold text-gray-900">{parsingStats.unmatched}</div>
            </div>
            <XCircle className="text-red-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('billParsing.stats.ambiguous')}</div>
              <div className="text-2xl font-bold text-gray-900">{parsingStats.ambiguous}</div>
            </div>
            <AlertTriangle className="text-yellow-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('billParsing.stats.total')}</div>
              <div className="text-2xl font-bold text-gray-900">{parsingStats.total}</div>
            </div>
            <Database className="text-blue-600" size={28} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t('billParsing.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3 ml-4">
            <span className="text-sm text-gray-600">{t('billParsing.filterLabel')}</span>
            <select
              value={matchStatusFilter}
              onChange={(e) => setMatchStatusFilter(e.target.value as typeof matchStatusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">{t('billParsing.filterAll')}</option>
              <option value="MATCHED">{t('billParsing.filterMatched')}</option>
              <option value="UNMATCHED">{t('billParsing.filterUnmatched')}</option>
              <option value="AMBIGUOUS">{t('billParsing.filterAmbiguous')}</option>
            </select>
          </div>

          {/* Batch Actions */}
          {selectedRecords.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {t('billParsing.selectedCount', { count: selectedRecords.size })}
              </span>
              <button
                onClick={handleBatchMatch}
                className="btn-secondary flex items-center px-4 py-2"
              >
                <Save size={14} className="mr-2" />
                {t('billParsing.batchMatch')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  onChange={(e) => {
                    if (e.target.checked) {
                      filteredRecords.forEach(r => selectedRecords.add(r.id))
                    } else {
                      selectedRecords.clear()
                    }
                    setSelectedRecords(new Set(selectedRecords))
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.policyNumber')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.producer')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.product')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.premium')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.commission')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('billParsing.col.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedRecords.has(record.id)}
                    onChange={() => handleToggleSelect(record.id)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {record.policyNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>{record.producerName}</div>
                  <div className="text-gray-500">NPN: {record.producerNPN || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {record.productId || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                  ${record.premium.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-teal-600">
                  ${record.commission.toFixed(2)} ({record.commissionRate}%)
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getMatchBadge(record.matchStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.matchStatus === 'UNMATCHED' || record.matchStatus === 'AMBIGUOUS' ? (
                    <>
                      <button
                        onClick={() => handleManualMatch(record.id)}
                        className="text-teal-600 hover:text-teal-800 font-medium mr-3"
                      >
                        {t('billParsing.manualMatch')}
                      </button>
                      <button className="text-red-600 hover:text-red-800 font-medium">
                        {t('billParsing.skip')}
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Filter className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('billParsing.noRecords')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('billParsing.noRecordsDesc')}</p>
          </div>
        )}
      </div>

      {/* Matching Modal Trigger */}
      {showMatchingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('billParsing.modal.title')}</h3>
            <p className="text-gray-600 mb-4">{t('billParsing.modal.desc')}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('billParsing.modal.searchLabel')}</label>
                <input
                  type="text"
                  placeholder={t('billParsing.modal.searchPlaceholder')}
                  className="input-block"
                />
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-600">{t('billParsing.modal.resultsPlaceholder')}</div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMatchingModal(false)}
                className="btn-secondary"
              >
                {t('billParsing.modal.cancel')}
              </button>
              <button
                onClick={() => setShowMatchingModal(false)}
                className="btn-primary"
              >
                {t('billParsing.modal.confirmMatch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
