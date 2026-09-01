import React, { useState } from 'react'
import { 
  ArrowLeft, Plus, Edit, Download, Eye, Bell, Search, Filter, Calendar,
  FileText, DocumentCheck, ShieldCheck, Lock, AlertTriangle, CheckCircle
} from 'lucide-react'
import type { ContractAgreement } from '../data/mockCooperationData'
import { 
  generateMockContracts, 
  CONTRACT_TYPES,
  CONTRACT_STATUS,
} from '../data/mockCooperationData'

/**
 * Contract Management View (功能点 3.3)
 * Manage all contracts and agreements with insurance carriers
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function ContractManagementView({ navigateTo }: Props) {
  const contracts = generateMockContracts()
  
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterByType, setFilterByType] = useState('ALL')
  const [filterByStatus, setFilterByStatus] = useState('ALL')
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({start: '', end: ''})
  const [selectedContract, setSelectedContract] = useState<ContractAgreement | null>(null)
  
  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.contractName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterByType === 'ALL' || contract.contractType === filterByType
    const matchesStatus = filterByStatus === 'ALL' || contract.status === filterByStatus
    
    return matchesSearch && matchesType && matchesStatus
  })
  
  // Upcoming expirations (within 90 days)
  const upcomingExpirations = contracts.filter(contract => {
    const daysLeft = Math.ceil((new Date(contract.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft > 0 && daysLeft <= 90
  }).sort((a, b) => {
    return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  })
  
  const handleAddContract = () => {
    alert('Create New Contract Modal - To be implemented')
  }
  
  const handleEditContract = (contract: ContractAgreement) => {
    alert(`Edit Contract: ${contract.contractName}`)
  }
  
  const viewDetail = (contract: ContractAgreement) => {
    setSelectedContract(contract)
    alert(`View Details: ${contract.contractName}`)
  }
  
  const downloadPDF = (contract: ContractAgreement) => {
    alert(`Downloading PDF: ${contract.fileMetadata?.fileName || contract.contractName}.pdf`)
  }
  
  const getDaysUntilExpiration = (expirationDate: string): number => {
    const days = Math.ceil((new Date(expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'InEffect': return 'bg-green-100 text-green-800'
      case 'ExpiringSoon': return 'bg-yellow-100 text-yellow-800'
      case 'Expired': return 'bg-red-100 text-red-800'
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'PendingApproval': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getTypeLabel = (type: string): string => {
    const typeInfo = CONTRACT_TYPES.find(t => t.value === type)
    return typeInfo?.label || type
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-blue-600" size={28}/>
          Contract & Agreement Management
        </h1>
        <p className="text-gray-600 mt-1">Manage all contracts and agreements with insurance carriers</p>
      </div>
      
      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-4 gap-4">
        <StatCard label="Total Contracts" value={contracts.length.toString()} icon={<FileText className="text-blue-600"/>} />
        <StatCard label="Active" value={contracts.filter(c => c.status === 'InEffect').length.toString()} icon={<CheckCircle className="text-green-600"/>} />
        <StatCard label="Expiring Soon (90d)" value={upcomingExpirations.length.toString()} warn={upcomingExpirations.length > 0} icon={<Bell className="text-orange-600"/>} />
        <StatCard label="Draft" value={contracts.filter(c => c.status === 'Draft').length.toString()} icon={<DocumentCheck className="text-gray-600"/>} />
      </div>
      
      {/* Expiration Alerts Banner */}
      {upcomingExpirations.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="card p-4 bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-orange-600 mt-0.5" size={20}/>
              <div className="flex-1">
                <div className="font-semibold text-orange-900 mb-1">{upcomingExpirations.length} Contract(s) Expiring Within 90 Days</div>
                <div className="grid grid-cols-3 gap-2 text-sm text-orange-800">
                  {upcomingExpirations.slice(0, 3).map(contract => (
                    <div key={contract.id} className="flex justify-between">
                      <span className="truncate">{contract.insurerName} - {contract.contractName}</span>
                      <span className="font-medium whitespace-nowrap">{getDaysUntilExpiration(contract.expirationDate)} days left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-4 card p-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18}/>
              <input
                type="text"
                placeholder="Search by contract name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          
          <select
            value={filterByType}
            onChange={(e) => setFilterByType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="ALL">All Types</option>
            {CONTRACT_TYPES.map(type => (
              <option key={type.value} value={type.value}>{getTypeLabel(type.value)}</option>
            ))}
          </select>
          
          <select
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="ALL">All Statuses</option>
            {CONTRACT_STATUS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        
        <div className="mt-3 flex items-center gap-3">
          <Calendar className="text-gray-400" size={18}/>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            placeholder="Start Date"
            className="px-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            placeholder="End Date"
            className="px-3 py-1.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
          />
          <button className="px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium">
            Apply Filter
          </button>
        </div>
      </div>
      
      {/* Action Bar */}
      <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {filteredContracts.length} of {contracts.length} contracts
        </div>
        <button
          onClick={handleAddContract}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={18}/> Add Contract
        </button>
      </div>
      
      {/* Contracts Table */}
      <div className="max-w-7xl mx-auto card overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContracts.map(contract => (
              <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{contract.contractName}</div>
                  {contract.keyTerms?.commissionRate && (
                    <div className="text-xs text-gray-500 mt-1">Comm: {contract.keyTerms.commissionRate}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {contract.contractNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.insurerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {getTypeLabel(contract.contractType)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.effectiveDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contract.expirationDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  (() => {
                    const days = getDaysUntilExpiration(contract.expirationDate)
                    if (days <= 30) return 'text-red-700'
                    if (days <= 60) return 'text-orange-700'
                    if (days <= 90) return 'text-yellow-700'
                    return 'text-gray-700'
                  })()
                }`}>
                  {getDaysUntilExpiration(contract.expirationDate)} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => viewDetail(contract)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                      title="View Details"
                    >
                      <Eye size={16}/>
                    </button>
                    <button 
                      onClick={() => handleEditContract(contract)}
                      className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                      title="Edit"
                    >
                      <Edit size={16}/>
                    </button>
                    <button 
                      onClick={() => downloadPDF(contract)}
                      className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded"
                      title="Download PDF"
                    >
                      <Download size={16}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-3" size={48}/>
            <p className="text-gray-600">No contracts found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
const StatCard = ({ 
  label, 
  value, 
  icon, 
  warn 
}: { 
  label: string
  value: string
  icon: React.ReactNode
  warn?: boolean
}) => (
  <div className={`card p-4 ${warn ? 'bg-orange-50 border-2 border-orange-200' : 'bg-white'}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm text-gray-600 font-medium">{label}</div>
        <div className={`text-2xl font-bold mt-1 ${warn ? 'text-orange-700' : 'text-gray-900'}`}>{value}</div>
      </div>
      <div className="flex-shrink-0 opacity-80">{icon}</div>
    </div>
  </div>
)

// Placeholder data
const CONTRACT_TYPES = [
  { value: 'MasterAgreement', label: 'master_agreement' },
  { value: 'ProductSupplement', label: 'product_supplement' },
  { value: 'NDA', label: 'Non-Disclosure Agreement (NDA)' },
  { value: 'DPA', label: 'Data Processing Agreement (DPA)' },
  { value: 'CommissionSupplement', label: 'commission_supplement' },
  { value: 'Compliance', label: 'compliance' },
] as const

const CONTRACT_STATUS = [
  { value: 'Draft', label: 'draft' },
  { value: 'PendingApproval', label: 'pending_approval' },
  { value: 'Signed', label: 'signed' },
  { value: 'InEffect', label: 'in_effect' },
  { value: 'ExpiringSoon', label: 'expiring_soon' },
  { value: 'Expired', label: 'expired' },
  { value: 'Terminated', label: 'terminated' },
] as const
