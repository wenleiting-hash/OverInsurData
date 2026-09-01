import React, { useState } from 'react'
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, Upload, TestTube, Settings, 
  Save, Play, RefreshCw, Download, Building2, Globe, Calendar, DollarSign,
  ShieldCheck, FileText, BookOpen, Code
} from 'lucide-react'

/**
 * Product Resource Onboarding View (功能点 3.7)
 * Complete product integration workflow with rate plans, underwriting rules, and API testing
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function ProductOnboardingView({ navigateTo }: Props) {
  // Step wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data state
  const [formData, setFormData] = useState({
    productName: '',
    productCode: '',
    lineOfBusiness: '',
    subLine: '',
    productType: '',
    insurancePeriod: 1,
    availableStates: [] as string[],
    commissionRate: 12.5,
    quoteMode: 'apiRealTime',
    underwritingMode: 'autoUnderwriting',
  })
  
  const [testResults, setTestResults] = useState<{
    endpoint: string
    success: boolean
    latency: number
    statusCode: number
  }[]>([])
  
  // Steps configuration
  const STEPS = [
    { id: 0, label: 'Basic Information', icon: FileText },
    { id: 1, label: 'Rate Plan Configuration', icon: DollarSign },
    { id: 2, label: 'Underwriting Rules', icon: ShieldCheck },
    { id: 3, label: 'API Integration & Testing', icon: Code },
    { id: 4, label: 'Review & Submit for Approval', icon: CheckCircle },
  ]
  
  const US_STATES = ['CA', 'NV', 'AZ', 'OR', 'WA', 'ID', 'UT', 'CO', 'TX', 'NM'] as const
  
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }
  
  const validateCurrentStep = (): boolean => {
    switch(currentStep) {
      case 0:
        return formData.productName && formData.productCode && formData.lineOfBusiness && formData.availableStates.length > 0
      case 1:
        return formData.commissionRate > 0 && formData.quoteMode !== ''
      case 2:
        return formData.underwritingMode !== ''
      case 3:
        return testResults.length >= 3 && testResults.every(r => r.success)
      case 4:
        return true
      default:
        return false
    }
  }
  
  const runTests = async () => {
    setIsSubmitting(true)
    
    // Simulate API tests
    const results = await Promise.all([
      simulateApiTest('Quote Endpoint', '/api/quote', 200, 150),
      simulateApiTest('Underwriting Endpoint', '/api/underwriting', 200, 280),
      simulateApiTest('Bind Endpoint', '/api/bind', 200, 320),
      simulateApiTest('Endorsement Endpoint', '/api/endorsement', 200, 200),
    ])
    
    setTestResults(results)
    setIsSubmitting(false)
  }
  
  const simulateApiTest = async (name: string, endpoint: string, status: number, latency: number): Promise<any> => {
    await new Promise(resolve => setTimeout(resolve, latency))
    return {
      endpoint,
      name,
      success: status === 200,
      latency,
      statusCode: status,
    }
  }
  
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return
    
    setIsSubmitting(true)
    
    // Simulate submission to approval workflow
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert('Product successfully submitted for listing approval!')
    setIsSubmitting(false)
    setCurrentStep(0)
  }
  
  const toggleState = (state: string) => {
    setFormData(prev => ({
      ...prev,
      availableStates: prev.availableStates.includes(state)
        ? prev.availableStates.filter(s => s !== state)
        : [...prev.availableStates, state]
    }))
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Upload className="text-blue-600" size={28}/>
          Product Resource Onboarding
        </h1>
        <p className="text-gray-600 mt-1">Obtain products from insurers and complete platform integration</p>
      </div>
      
      {/* Progress Indicator */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      index <= currentStep 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                        : index === currentStep 
                          ? 'bg-orange-500 text-white border-4 border-orange-200'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index < currentStep ? <CheckCircle size={24}/> : <Icon size={24}/>}
                    </div>
                    <div className="text-xs font-medium mt-2 text-center max-w-[100px] truncate">
                      {step.label}
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-2 mx-2 rounded ${
                      index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}/>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto grid grid-cols-3 gap-6">
        {/* Left Panel - Progress Tracking */}
        <div className="col-span-1 space-y-4">
          <div className="card p-6 bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <BookOpen size={18}/> Onboarding Guide
            </h4>
            <ol className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span>Obtain product list from insurer (API/File)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span>Enter basic info and available states</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span>Configure rates and underwriting rules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">4.</span>
                <span>Test quote/underwriting APIs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">5.</span>
                <span>Submit for approval and publish</span>
              </li>
            </ol>
          </div>
          
          {/* Data Sources */}
          <div className="card p-6">
            <h4 className="font-semibold text-gray-900 mb-3">Data Source Options</h4>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.quoteMode === 'apiRealTime' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="dataSource"
                  value="apiRealTime"
                  checked={formData.quoteMode === 'apiRealTime'}
                  onChange={(e) => setFormData({...formData, quoteMode: e.target.value})}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">API Real-time Integration</div>
                  <div className="text-xs text-gray-500">Connect via REST API endpoints</div>
                </div>
              </label>
              
              <label className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.quoteMode === 'localRateTable' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="dataSource"
                  value="localRateTable"
                  checked={formData.quoteMode === 'localRateTable'}
                  onChange={(e) => setFormData({...formData, quoteMode: e.target.value})}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Local Rate Table</div>
                  <div className="text-xs text-gray-500">Import CSV/Excel file</div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Quick Tips */}
          <div className="card p-6 bg-yellow-50 border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={18}/> Important Notes
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
              <li>All API integrations require security certification</li>
              <li>Rate tables must be actuarially approved</li>
              <li>Testing must pass before production deployment</li>
              <li>Underwriting rules need compliance review</li>
            </ul>
          </div>
        </div>
        
        {/* Right Panel - Form Wizard */}
        <div className="col-span-2 card p-8">
          {currentStep === 0 && renderBasicInfoStep(formData, setFormData, US_STATES)}
          {currentStep === 1 && renderRatePlanStep(formData, setFormData)}
          {currentStep === 2 && renderUnderwritingStep(formData, setFormData)}
          {currentStep === 3 && renderAPITestingStep(testResults, runTests, isSubmitting)}
          {currentStep === 4 && renderReviewAndSubmit(formData, handleSubmit, isSubmitting)}
        </div>
      </div>
      
      {/* Footer Navigation */}
      <div className="max-w-[1600px] mx-auto mt-6 flex items-center justify-between">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous Step
          </button>
        ) : (
          <div/>
        )}
        
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!validateCurrentStep() || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next Step
            {currentStep === 3 && <Play size={18}/>}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!validateCurrentStep() || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            <Save size={18}/>
          </button>
        )}
      </div>
    </div>
  )
}

// Step Components
const renderBasicInfoStep = (
  formData: any,
  setFormData: any,
  US_STATES: readonly string[]
) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Basic Information</h2>
    
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name*
        </label>
        <input
          type="text"
          value={formData.productName}
          onChange={(e) => setFormData({...formData, productName: e.target.value})}
          placeholder="e.g., California Auto Liability Insurance Plan"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Code*
        </label>
        <input
          type="text"
          value={formData.productCode}
          onChange={(e) => setFormData({...formData, productCode: e.target.value})}
          placeholder="e.g., CA-LIAB-2026"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Line of Business*
        </label>
        <select
          value={formData.lineOfBusiness}
          onChange={(e) => setFormData({...formData, lineOfBusiness: e.target.value})}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select LOB...</option>
          <option value="AUTO">Auto Insurance</option>
          <option value="HOME">Homeowners</option>
          <option value="LIFE">Life Insurance</option>
          <option value="HEALTH">Health Insurance</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sub-line (Optional)
        </label>
        <input
          type="text"
          value={formData.subLine}
          onChange={(e) => setFormData({...formData, subLine: e.target.value})}
          placeholder="e.g., Personal Auto"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type*
        </label>
        <select
          value={formData.productType}
          onChange={(e) => setFormData({...formData, productType: e.target.value})}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Select Type...</option>
          <option value="individual">Individual Policy</option>
          <option value="group">Group Policy</option>
          <option value="voluntary">Voluntary Benefits</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Insurance Period (Years)*
        </label>
        <input
          type="number"
          value={formData.insurancePeriod}
          onChange={(e) => setFormData({...formData, insurancePeriod: parseInt(e.target.value)})}
          min="1"
          max="10"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>
      
      <div className="col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available States*
        </label>
        <div className="grid grid-cols-5 gap-2">
          {US_STATES.slice(0, 15).map(state => (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.availableStates.includes(state)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">{formData.availableStates.length} states selected</p>
      </div>
    </div>
  </div>
)

const renderRatePlanStep = (formData: any, setFormData: any) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Rate Plan Configuration</h2>
    
    <div className="grid grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Commission Rate (%)
        </label>
        <input
          type="number"
          value={formData.commissionRate}
          onChange={(e) => setFormData({...formData, commissionRate: parseFloat(e.target.value)})}
          min="0"
          max="100"
          step="0.1"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-gray-500 mt-1">Base commission percentage</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quote Mode*
        </label>
        <select
          value={formData.quoteMode}
          onChange={(e) => setFormData({...formData, quoteMode: e.target.value})}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        >
          <option value="apiRealTime">API Real-time Quoting</option>
          <option value="localRateTable">Local Rate Table</option>
        </select>
      </div>
      
      <div className="col-span-2">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Rate Configuration Requirements</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Rate table must include age bands, gender, and geographic factors</li>
            <li>All rates must be filed and approved by state regulators</li>
            <li>Effective date must match regulatory filing dates</li>
            <li>Maintain historical rate versions for audit trail</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
)

const renderUnderwritingStep = (formData: any, setFormData: any) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Underwriting Rules Configuration</h2>
    
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Underwriting Mode*
        </label>
        <div className="space-y-2">
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.underwritingMode === 'autoUnderwriting' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="underwritingMode"
              value="autoUnderwriting"
              checked={formData.underwritingMode === 'autoUnderwriting'}
              onChange={(e) => setFormData({...formData, underwritingMode: e.target.value})}
              className="mt-1 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Auto Underwriting</div>
              <div className="text-sm text-gray-500">Automated decision-making based on configured rules</div>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.underwritingMode === 'manualUnderwriting' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="underwritingMode"
              value="manualUnderwriting"
              checked={formData.underwritingMode === 'manualUnderwriting'}
              onChange={(e) => setFormData({...formData, underwritingMode: e.target.value})}
              className="mt-1 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">Manual Underwriting</div>
              <div className="text-sm text-gray-500">Requires human underwriter review for all applications</div>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.underwritingMode === 'mgaUnderwriting' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="underwritingMode"
              value="mgaUnderwriting"
              checked={formData.underwritingMode === 'mgaUnderwriting'}
              onChange={(e) => setFormData({...formData, underwritingMode: e.target.value})}
              className="mt-1 text-green-600 focus:ring-green-500"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">MGA Delegation</div>
              <div className="text-sm text-gray-500">Delegate underwriting authority to Managing General Agent</div>
            </div>
          </label>
        </div>
      </div>
      
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h4 className="font-semibold text-purple-900 mb-2">Underwriting Rule Engine Features</h4>
        <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
          <li>Automated rule validation and conflict detection</li>
          <li>Scenario-based risk assessment</li>
          <li>Integration with external data sources</li>
          <li>Rule versioning and rollback capabilities</li>
        </ul>
      </div>
    </div>
  </div>
)

const renderAPITestingStep = (
  testResults: any[],
  runTests: () => void,
  isSubmitting: boolean
) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">API Integration & Testing</h2>
    
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Required Endpoints</h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"/> Quote Service
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"/> Underwriting Service
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"/> Policy Bind Service
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"/> Endorsement Service
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Authentication Token*
          </label>
          <input
            type="password"
            placeholder="Bearer token or API key"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono text-sm"
          />
        </div>
        
        <button
          onClick={runTests}
          disabled={isSubmitting || testResults.length > 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={18}/> Run All Tests
        </button>
      </div>
      
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Test Results</h4>
        
        {testResults.length === 0 ? (
          <div className="p-8 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <TestTube className="mx-auto text-gray-400 mb-3" size={48}/>
            <p className="text-gray-600">No tests executed yet</p>
            <p className="text-sm text-gray-500 mt-1">Click "Run All Tests" to begin testing</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{result.name}</div>
                  {result.success ? (
                    <CheckCircle className="text-green-600" size={18}/>
                  ) : (
                    <XCircle className="text-red-600" size={18}/>
                  )}
                </div>
                <div className="text-sm text-gray-600">Endpoint: {result.endpoint}</div>
                <div className="text-sm text-gray-600">Status: {result.statusCode}</div>
                <div className="text-sm text-gray-600">Latency: {result.latency}ms</div>
              </div>
            ))}
            
            {testResults.every(r => r.success) && (
              <div className="p-4 bg-green-100 rounded-lg border border-green-300">
                <div className="flex items-center gap-2 text-green-900 font-medium">
                  <CheckCircle size={18}/> All Tests Passed!
                </div>
                <p className="text-sm text-green-800 mt-1">Ready for next step</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
)

const renderReviewAndSubmit = (formData: any, handleSubmit: () => void, isSubmitting: boolean) => (
  <div className="space-y-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit for Listing Approval</h2>
    
    <div className="card p-6 bg-gray-50 border border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-4">Configuration Summary</h4>
      
      <div className="space-y-4">
        <DetailRow label="Product Name" value={formData.productName}/>
        <DetailRow label="Product Code" value={formData.productCode}/>
        <DetailRow label="Line of Business" value={formData.lineOfBusiness}/>
        <DetailRow label="Available States" value={formData.availableStates.join(', ') || 'None selected'}/>
        <hr className="border-gray-200 my-4"/>
        <DetailRow label="Commission Rate" value={`${formData.commissionRate}%`}/>
        <DetailRow label="Quote Mode" value={formData.quoteMode === 'apiRealTime' ? 'API Real-time' : 'Local Table'}/>
        <hr className="border-gray-200 my-4"/>
        <DetailRow label="Underwriting Mode" value={formData.underwritingMode === 'autoUnderwriting' ? 'Automatic' : 'Manual'}/>
        <DetailRow label="Test Results" value={`${formData.testResults?.length || 0} tests passed`}/>
      </div>
    </div>
    
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-start gap-3">
        <ShieldCheck className="text-green-600 mt-0.5" size={20}/>
        <div>
          <div className="font-semibold text-green-900 mb-1">Approval Workflow Required</div>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Product Manager Review</li>
            <li>Compliance Review</li>
            <li>Technical Validation</li>
            <li>Final Approval</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div className="flex items-center justify-end">
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
      </button>
    </div>
  </div>
)

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between py-2">
    <span className="text-sm text-gray-600">{label}:</span>
    <span className="text-sm font-medium text-gray-900">{value}</span>
  </div>
)
