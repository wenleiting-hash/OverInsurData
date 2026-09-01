import React, { useState } from 'react'
import { ArrowLeft, Search, Filter, AlertTriangle, CheckCircle, XCircle, Phone, Mail, FileText, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Dispute Management View (功能点 5.4)
 * Handle and track commission reconciliation disputes
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

export default function DisputeManagementView({ navigateTo }: Props) {
  const { t } = useTranslation('finance')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED'>('ALL')
  const [carrierFilter, setCarrierFilter] = useState<string>('ALL')
  const [selectedDisputes, setSelectedDisputes] = useState<Set<string>>(new Set())
  const [showDisputeDetail, setShowDisputeDetail] = useState(false)

  const disputeStats = {
    total: 47,
    pending: 12,
    inReview: 8,
    resolved: 23,
    closed: 4,
    totalAmount: 5420.75,
    recoveredAmount: 3890.50
  }

  const carriers = [
    { id: 'CAR001', name: 'Blue Cross Blue Shield', disputes: 15 },
    { id: 'CAR002', name: 'Aetna', disputes: 12 },
    { id: 'CAR003', name: 'UnitedHealth Group', disputes: 10 },
    { id: 'CAR004', name: 'Cigna', disputes: 8 },
    { id: 'CAR005', name: 'Humana', disputes: 2 },
  ]

  // Mock dispute records
  const disputes = [
    {
      id: 'DISPUTE-001',
      policyNumber: 'POL-BCBS-FL-2026-001234',
      producerNPN: '1234567',
      carrierId: 'CAR001',
      carrierName: 'Blue Cross Blue Shield',
      amount: 4.50,
      discrepancyType: 'Rate Mismatch',
      status: 'PENDING',
      createdDate: '2026-08-15',
      dueDate: '2026-08-22',
      daysOpen: 3,
      reason: 'Carrier charged 10% rate instead of contracted 9%',
      evidence: ['Contract_Agreement.pdf', 'Commission_Schedule.xlsx'],
      resolutionMethod: null,
      contactAttempted: false
    },
    {
      id: 'DISPUTE-002',
      policyNumber: 'POL-AETNA-TX-2026-005678',
      producerNPN: '2345678',
      carrierId: 'CAR002',
      carrierName: 'Aetna',
      amount: -3.20,
      discrepancyType: 'Premium Difference',
      status: 'IN_REVIEW',
      createdDate: '2026-08-14',
      dueDate: '2026-08-21',
      daysOpen: 4,
      reason: 'Carrier billed on incorrect premium amount',
      evidence: ['Policy_Document.pdf', 'Payment_Bank.java'],
      resolutionMethod: null,
      contactAttempted: true,
      contactDate: '2026-08-16',
      contactResult: 'Awaiting response from carrier billing department'
    },
    {
      id: 'DISPUTE-003',
      policyNumber: 'POL-UNITED-CA-2026-009012',
      producerNPN: '3456789',
      carrierId: 'CAR003',
      carrierName: 'UnitedHealth Group',
      amount: 7.20,
      discrepancyType: 'Producer Assignment Error',
      status: 'RESOLVED',
      createdDate: '2026-08-10',
      resolvedDate: '2026-08-17',
      daysOpen: 7,
      daysToResolve: 7,
      reason: 'Commission billed to wrong NPN',
      evidence: ['Producer_Agreement.pdf', 'NPN_Certificate.pdf'],
      resolutionMethod: 'Credit Memo Received',
      recoveryStatus: 'RECOVERED',
      contactAttempted: true,
      contactDate: '2026-08-12',
      contactResult: 'Carrier acknowledged error and issued credit memo #CM-2026-0847'
    },
    {
      id: 'DISPUTE-004',
      policyNumber: 'POL-CIGNA-NY-2026-003456',
      producerNPN: '4567890',
      carrierId: 'CAR004',
      carrierName: 'Cigna',
      amount: 12.80,
      discrepancyType: 'Missing Commission',
      status: 'PENDING',
      createdDate: '2026-08-17',
      dueDate: '2026-08-24',
      daysOpen: 1,
      reason: 'No commission recorded for active policy',
      evidence: [],
      resolutionMethod: null,
      contactAttempted: false
    },
  ]

  const handleToggleSelect = (disputeId: string) => {
    const newSelected = new Set(selectedDisputes)
    if (newSelected.has(disputeId)) {
      newSelected.delete(disputeId)
    } else {
      newSelected.add(disputeId)
    }
    setSelectedDisputes(newSelected)
  }

  const handleCreateDispute = () => {
    alert('Creating new dispute tracking record...')
  }

  const handleContactCarrier = (disputeId: string) => {
    alert(`Initiating contact with carrier for ${disputeId}...`)
  }

  const handleResolveDispute = () => {
    alert(`Marking ${selectedDisputes.size} dispute(s) as resolved...`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'PENDING': 'bg-orange-100 text-orange-800',
      'IN_REVIEW': 'bg-blue-100 text-blue-800',
      'RESOLVED': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-gray-100 text-gray-800'
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status as keyof typeof badges]}`}>{status}</span>
  }

  const getRecoveryBadge = (recoveryStatus: string | null) => {
    if (!recoveryStatus) return '-'
    if (recoveryStatus === 'RECOVERED') {
      return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Recovered</span>
    }
    if (recoveryStatus === 'PARTIAL') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Partial</span>
    }
    if (recoveryStatus === 'UNABLE') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Unable</span>
    }
    return '-'
  }

  const filteredDisputes = disputes.filter(dispute => {
    if (statusFilter !== 'ALL' && dispute.status !== statusFilter) {
      return false
    }
    if (carrierFilter !== 'ALL' && dispute.carrierId !== carrierFilter) {
      return false
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        dispute.id.toLowerCase().includes(query) ||
        dispute.policyNumber.toLowerCase().includes(query) ||
        dispute.producerNPN.includes(query) ||
        dispute.carrierName.toLowerCase().includes(query)
      )
    }
    return true
  })

  const totalPendingAmount = disputes
    .filter(d => d.status === 'PENDING' || d.status === 'IN_REVIEW')
    .reduce((sum, d) => sum + Math.abs(d.amount), 0)

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title.disputeManagement')}
          </h1>
          <p className="text-gray-600">{t('description.disputeDesc')}</p>
        </div>
        <button
          onClick={handleCreateDispute}
          className="btn-primary flex items-center"
        >
          Create New Dispute
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="card p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-gray-900">{disputeStats.pending}</div>
            </div>
            <Clock className="text-orange-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">In Review</div>
              <div className="text-2xl font-bold text-gray-900">{disputeStats.inReview}</div>
            </div>
            <FileText className="text-blue-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Resolved</div>
              <div className="text-2xl font-bold text-gray-900">{disputeStats.resolved}</div>
            </div>
            <CheckCircle className="text-green-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Recovery Rate</div>
              <div className="text-2xl font-bold text-teal-900">
                {((disputeStats.recoveredAmount / disputeStats.totalAmount) * 100).toFixed(1)}%
              </div>
            </div>
            <CheckCircle className="text-teal-600" size={28} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Pending Amount</div>
              <div className="text-xl font-bold text-purple-900">${totalPendingAmount.toFixed(2)}</div>
            </div>
            <AlertTriangle className="text-purple-600" size={28} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          {/* Search & Filters */}
          <div className="flex items-center space-x-4">
            <div className="w-80">
              <input
                type="text"
                placeholder="Search by dispute ID, policy, or carrier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-block"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
            >
              <option value="ALL">All Carriers</option>
              {carriers.map(carrier => (
                <option key={carrier.id} value={carrier.id}>
                  {carrier.name} ({carrier.disputes})
                </option>
              ))}
            </select>
          </div>

          {/* Batch Actions */}
          {selectedDisputes.size > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{selectedDisputes.size} selected</span>
              <button
                onClick={handleResolveDispute}
                className="btn-secondary flex items-center px-4 py-2"
              >
                Mark Resolved
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Dispute List */}
      <div className="space-y-4">
        {filteredDisputes.map((dispute) => (
          <div key={dispute.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedDisputes.has(dispute.id)}
                onChange={() => handleToggleSelect(dispute.id)}
                className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="font-semibold text-gray-900">{dispute.id}</span>
                  {getStatusBadge(dispute.status)}
                  <span className="text-xs text-gray-500">{dispute.daysOpen} days open</span>
                  {dispute.resolutionMethod && (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 ml-auto">
                      {dispute.resolutionMethod}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Carrier</div>
                    <div className="font-medium text-gray-900">{dispute.carrierName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Policy Number</div>
                    <div className="font-mono text-sm text-gray-900">{dispute.policyNumber}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Producer</div>
                    <div className="text-sm text-gray-900">NPN: {dispute.producerNPN}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Amount</div>
                    <div className={`font-bold text-lg ${dispute.amount > 0 ? 'text-teal-600' : 'text-orange-600'}`}>
                      ${Math.abs(dispute.amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex items-start space-x-3 mb-2">
                    <AlertTriangle className="text-orange-600 mt-0.5" size={16} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">Reason:</div>
                      <div className="text-sm text-gray-600">{dispute.reason}</div>
                    </div>
                  </div>
                  
                  {dispute.evidence.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Evidence:</span>
                      <div className="flex items-center space-x-2">
                        {dispute.evidence.map((file, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded bg-white text-gray-700 border border-gray-200">
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dispute.contactAttempted && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <Phone className="text-blue-600" size={14} />
                      <span className="text-xs text-gray-600">{dispute.contactResult}</span>
                    </div>
                  )}

                  {dispute.resolutionMethod && dispute.recoveryStatus && (
                    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <CheckCircle className="text-green-600" size={14} />
                      <span className="text-xs text-green-700 font-medium">{dispute.resolutionMethod}</span>
                      {getRecoveryBadge(dispute.recoveryStatus)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-4">
                  {!dispute.contactAttempted && dispute.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleContactCarrier(dispute.id)}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Mail size={14} className="mr-1" />
                        Contact Carrier
                      </button>
                      <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                        Generate Dispute Letter
                      </button>
                    </>
                  )}
                  <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
                    View Full Details →
                  </button>
                  {(dispute.status === 'PENDING' || dispute.status === 'IN_REVIEW') && (
                    <button className="text-sm text-orange-600 hover:text-orange-800 font-medium ml-auto">
                      Escalate to Manager
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDisputes.length === 0 && (
        <div className="card p-12 text-center">
          <Filter className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No disputes found</h3>
          <p className="text-gray-600">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
