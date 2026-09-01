import React, { useState } from 'react'
import { 
  ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock, 
  Package, Users, Clipboard, FileText, DollarSign, ShieldAlert
} from 'lucide-react'
import type { InsuranceCooperation } from '../data/mockCooperationData'
import { 
  generateMockCooperations, 
  TERMINATION_REASONS,
  TERMINATION_TYPES,
  PENDING_QUOTE_ACTIONS,
  ACTIVE_POLICY_ACTIONS,
  COMMISSION_ACTIONS,
} from '../data/mockCooperationData'

/**
 * Cooperation Terminate View (功能点 3.2)
 * Handle termination of insurance cooperation relationships with impact analysis and workflow
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function CooperationTerminateView({ navigateTo }: Props) {
  const cooperations = generateMockCooperations()
  
  // State management
  const [selectedCooperationId, setSelectedCooperationId] = useState('')
  const [terminationReason, setTerminationReason] = useState('')
  const [terminationType, setTerminationType] = useState('')
  const [effectiveDateMode, setEffectiveDateMode] = useState<'immediate' | 'future'>('immediate')
  const [futureDate, setFutureDate] = useState('')
  const [transitionPeriod, setTransitionPeriod] = useState(30)
  const [pendingQuoteAction, setPendingQuoteAction] = useState('')
  const [activePolicyAction, setActivePolicyAction] = useState('')
  const [commissionAction, setCommissionAction] = useState('')
  const [showImpactModal, setShowImpactModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Impact data
  const impactData = {
    affectedProducts: 15,
    authorizedChannels: 48,
    pendingQuotes: 7,
    activePolicies: 124,
    unpaidCommissions: 45678.92,
    appointmentTerminations: 156,
  }
  
  const selectedCooperation = cooperations.find(c => c.id === selectedCooperationId)
  
  const validateCurrentStep = (): boolean => {
    if (!selectedCooperationId) return false
    if (!terminationReason) return false
    if (!terminationType) return false
    return true
  }
  
  const handleViewImpact = async () => {
    if (!validateCurrentStep()) {
      alert('Please select cooperation, reason, and type')
      return
    }
    setShowImpactModal(true)
  }
  
  const handleRecallAuthorizations = async () => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(`${impactData.authorizedChannels} channel authorizations have been successfully recalled!`)
    setIsProcessing(false)
  }
  
  const handleTerminateAppointments = async () => {
    setIsProcessing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    alert(`${impactData.appointmentTerminations} appointments scheduled for termination!`)
    setIsProcessing(false)
  }
  
  const handleConfirmTermination = async () => {
    if (!validateCurrentStep()) return
    
    setIsProcessing(true)
    
    // Simulate multi-step approval workflow
    const steps = ['Legal Review', 'Compliance Review', 'General Manager Approval']
    
    for (const step of steps) {
      console.log(`Approving: ${step}...`)
      await new Promise(resolve => setTimeout(resolve, 800))
    }
    
    alert('Cooperation terminated successfully! All actions completed.')
    navigateTo('cooperation-list')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <XCircle className="text-red-600" size={28}/>
          Terminate Cooperation Relationship
        </h1>
        <p className="text-gray-600 mt-1">Initiate and manage the termination process for cooperation relationships</p>
      </div>
      
      {/* Warning Banner */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="card p-4 bg-red-50 border border-red-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-red-600 mt-0.5" size={20}/>
            <div>
              <div className="font-semibold text-red-900 mb-1">⚠️ This action will permanently terminate the cooperation relationship</div>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>All channel authorizations will be automatically recalled</li>
                <li>Appointment terminations will be filed with insurers</li>
                <li>Channels will be notified immediately</li>
                <li>This action requires legal, compliance, and GM approval</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Form */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel: Termination Details */}
          <div className="space-y-6">
            {/* Select Cooperation */}
            <div className="card p-6">
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Select Cooperation Relationship*
              </label>
              <select
                value={selectedCooperationId}
                onChange={(e) => setSelectedCooperationId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select a cooperation to terminate</option>
                {cooperations.map(coop => (
                  <option key={coop.id} value={coop.id}>
                    {coop.insurerName} ({coop.cooperationType})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Termination Reason */}
            <div className="card p-6">
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Termination Reason*
              </label>
              <select
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select reason</option>
                {TERMINATION_REASONS.map(reason => (
                  <option key={reason.value} value={reason.value}>{reason.label}</option>
                ))}
              </select>
            </div>
            
            {/* Termination Type */}
            <div className="card p-6">
              <label className="block text-sm font-semibold mb-2 text-gray-800">
                Termination Type*
              </label>
              <select
                value={terminationType}
                onChange={(e) => setTerminationType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Select termination type</option>
                {TERMINATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            {/* Effective Date Mode */}
            <div className="card p-6">
              <label className="block text-sm font-semibold mb-3 text-gray-800">
                Termination Effective Date
              </label>
              
              <div className="space-y-2">
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  effectiveDateMode === 'immediate' ? 'border-red-500 bg-red-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="effectiveDateMode"
                    value="immediate"
                    checked={effectiveDateMode === 'immediate'}
                    onChange={(e) => setEffectiveDateMode(e.target.value as 'immediate' | 'future')}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Immediate Termination</div>
                    <div className="text-xs text-gray-500">Effective as soon as approved</div>
                  </div>
                </label>
                
                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  effectiveDateMode === 'future' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="effectiveDateMode"
                    value="future"
                    checked={effectiveDateMode === 'future'}
                    onChange={(e) => setEffectiveDateMode(e.target.value as 'immediate' | 'future')}
                    className="text-orange-600 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Future Date</div>
                    <div className="text-xs text-gray-500">Set a specific termination date</div>
                  </div>
                </label>
              </div>
              
              {effectiveDateMode === 'future' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Termination Date*
                  </label>
                  <input
                    type="date"
                    value={futureDate}
                    onChange={(e) => setFutureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transition Period (Days)*
                    </label>
                    <input
                      type="number"
                      value={transitionPeriod}
                      onChange={(e) => setTransitionPeriod(parseInt(e.target.value))}
                      min="1"
                      max="90"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions Buttons */}
            <div className="card p-6">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleViewImpact}
                  disabled={!selectedCooperationId || !terminationReason || !terminationType}
                  className="px-4 py-3 rounded-lg border border-blue-500 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  View Impact Scope
                </button>
                
                <button
                  onClick={() => navigateTo('cooperation-list')}
                  className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Panel: Quick Preview */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Selected Cooperation</h3>
              
              {selectedCooperation ? (
                <div className="space-y-3">
                  <DetailRow label="Insurance Company" value={selectedCooperation.insurerName} />
                  <DetailRow label="Cooperation Type" value={selectedCooperation.cooperationType} />
                  <DetailRow label="Status" value={selectedCooperation.status} />
                  <DetailRow label="Effective Date" value={selectedCooperation.effectiveDate} />
                  <DetailRow label="Expiration Date" value={selectedCooperation.expirationDate || 'Permanent'} />
                  
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">Impact Summary</h4>
                    <p className="text-sm text-gray-600">
                      Click "View Impact Scope" to see detailed breakdown
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No cooperation selected</p>
              )}
            </div>
            
            <div className="card p-6 bg-yellow-50 border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <Clock size={18}/> Important Notes
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                <li>All affected parties will receive automatic notifications</li>
                <li>A comprehensive audit report will be generated</li>
                <li>Pending quotes may need special handling</li>
                <li>Active policies require service continuity planning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Impact Modal */}
      {showImpactModal && selectedCooperation && (
        <ImpactModal
          cooperation={selectedCooperation}
          impactData={impactData}
          onClose={() => setShowImpactModal(false)}
          onRecallAuthorizations={handleRecallAuthorizations}
          onTerminateAppointments={handleTerminateAppointments}
          isProcessing={isProcessing}
          pendingQuoteAction={pendingQuoteAction}
          setPendingQuoteAction={setPendingQuoteAction}
          activePolicyAction={activePolicyAction}
          setActivePolicyAction={setActivePolicyAction}
          commissionAction={commissionAction}
          setCommissionAction={setCommissionAction}
        />
      )}
      
      {/* Footer: Workflow Steps */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="card p-6 bg-gray-50 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Approval Workflow</h3>
          <div className="flex items-center justify-between">
            {['Legal Review', 'Compliance Review', 'General Manager Approval'].map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-600 mt-1">{step.split(' ')[0]}</span>
                </div>
                {index < 2 && (
                  <div className="flex-1 h-1 bg-gray-300 mx-4"/>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Detail Row Component
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between py-2">
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
)

// Impact Modal Component
interface ImpactModalProps {
  cooperation: InsuranceCooperation
  impactData: {
    affectedProducts: number
    authorizedChannels: number
    pendingQuotes: number
    activePolicies: number
    unpaidCommissions: number
    appointmentTerminations: number
  }
  onClose: () => void
  onRecallAuthorizations: () => void
  onTerminateAppointments: () => void
  isProcessing: boolean
  pendingQuoteAction: string
  setPendingQuoteAction: (val: string) => void
  activePolicyAction: string
  setActivePolicyAction: (val: string) => void
  commissionAction: string
  setCommissionAction: (val: string) => void
}

const ImpactModal = ({
  cooperation,
  impactData,
  onClose,
  onRecallAuthorizations,
  onTerminateAppointments,
  isProcessing,
  pendingQuoteAction,
  setPendingQuoteAction,
  activePolicyAction,
  setActivePolicyAction,
  commissionAction,
  setCommissionAction,
}: ImpactModalProps) => {
  const canProceed = pendingQuoteAction && activePolicyAction && commissionAction
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Impact Analysis & Processing</h2>
            <p className="text-sm text-gray-600 mt-1">
              {cooperation.insurerName} - {cooperation.cooperationType} Partnership
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XCircle size={24}/>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Impact Cards */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard 
              label="Affected Products" 
              value={impactData.affectedProducts.toString()} 
              icon={<Package className="text-blue-600"/>} 
            />
            <KpiCard 
              label="Authorized Channels" 
              value={impactData.authorizedChannels.toString()} 
              icon={<Users className="text-green-600"/>} 
            />
            <KpiCard 
              label="Pending Quotes" 
              value={impactData.pendingQuotes.toString()} 
              warn={impactData.pendingQuotes > 0}
              icon={<Clipboard className="text-orange-600"/>} 
            />
            <KpiCard 
              label="Active Policies" 
              value={impactData.activePolicies.toString()} 
              warn={impactData.activePolicies > 100}
              icon={<FileText className="text-purple-600"/>} 
            />
            <KpiCard 
              label="Unpaid Commissions" 
              value={`$${impactData.unpaidCommissions.toLocaleString()}`} 
              icon={<DollarSign className="text-emerald-600"/>} 
            />
            <KpiCard 
              label="Appointments to Terminate" 
              value={impactData.appointmentTerminations.toString()} 
              warn={impactData.appointmentTerminations > 100}
              icon={<ShieldAlert className="text-red-600"/>} 
            />
          </div>
          
          {/* Handling Strategies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Business Continuation Strategy</h3>
            
            {/* Pending Quotes */}
            <div className="card p-4">
              <div className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Clipboard size={18}/> Pending Quote Handling
              </div>
              <select
                value={pendingQuoteAction}
                onChange={(e) => setPendingQuoteAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select handling strategy...</option>
                {PENDING_QUOTE_ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </div>
            
            {/* Active Policies */}
            <div className="card p-4">
              <div className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <FileText size={18}/> Active Policy Service Arrangement
              </div>
              <select
                value={activePolicyAction}
                onChange={(e) => setActivePolicyAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select service arrangement...</option>
                {ACTIVE_POLICY_ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </div>
            
            {/* Unpaid Commissions */}
            <div className="card p-4">
              <div className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <DollarSign size={18}/> Unpaid Commission Settlement
              </div>
              <select
                value={commissionAction}
                onChange={(e) => setCommissionAction(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Select settlement plan...</option>
                {COMMISSION_ACTIONS.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Batch Operations */}
          <div className="card p-6 bg-gray-50 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4">Batch Operations</h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={onRecallAuthorizations}
                disabled={isProcessing}
                className="px-4 py-3 rounded-lg border border-red-500 text-red-700 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Recalling...' : `Recall ${impactData.authorizedChannels} Channel Authorizations`}
              </button>
              
              <button
                onClick={onTerminateAppointments}
                disabled={isProcessing}
                className="px-4 py-3 rounded-lg border border-orange-500 text-orange-700 hover:bg-orange-50 font-medium transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Filing...' : `Terminate ${impactData.appointmentTerminations} Appointments`}
              </button>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="card p-6 bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Next Steps</h4>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Review all impact data and select handling strategies above</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Execute batch operations (recall authorizations, file appointments)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Submit for approval workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Generate audit report upon completion</span>
              </li>
            </ol>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
              Close
            </button>
            <button
              disabled={!canProceed || isProcessing}
              className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue to Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const KpiCard = ({ 
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
  <div className={`card p-4 ${warn ? 'bg-red-50 border-2 border-red-200' : 'bg-white'}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
    </div>
    <div className={`text-2xl font-bold ${warn ? 'text-red-700' : 'text-gray-900'}`}>{value}</div>
  </div>
)
