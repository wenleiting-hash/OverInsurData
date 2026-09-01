import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, ArrowRight, CheckCircle, Save, Upload, Building2, FileText, 
  User, Users, Banknote, Globe, Settings, AlertCircle, Info
} from 'lucide-react'
import type { InsuranceCarrier } from './data/mockInsurerData'
import { 
  CooperationsFormData, 
  ContactPerson, 
  SettlementMethod, 
  PremiumCollectionMethod,
  LineOfBusiness,
  ProductScopeConfig,
  State,
  COOPERATION_TYPES,
  SETTLEMENT_METHODS,
  PREMIUM_COLLECTION_METHODS,
  US_STATES,
  generateMockCooperations,
} from './data/mockCooperationData'
import { loadMockCarriers } from './data/mockInsurerData'
import { useTranslation } from 'react-i18next'

interface InsuranceCarrier {
  carrierId: string
  carrierName: string
  carrierCode: string
}

/**
 * Cooperation Form (功能点 3.1)
 * Five-step wizard for creating/ editing insurance cooperation relationships
 */
interface Props {
  navigateTo: (view: string, params?: any) => void
}

export default function CooperationForm({ navigateTo }: Props) {
  const carriers = loadMockCarriers() as InsuranceCarrier[]
  const { t } = useTranslation('cooperation')
  
  // Step configuration
  const STEPS = [
    { id: 0, label: 't("cooperationForm.sections.basicInfo.title")', desc: 't("cooperationForm.sections.basicInfo.description")' },
    { id: 1, label: 't("cooperationForm.sections.contactPersons.title")', desc: 't("cooperationForm.sections.contactPersons.description")' },
    { id: 2, label: 't("cooperationForm.sections.settlementConfig.title")', desc: 't("cooperationForm.sections.settlementConfig.description")' },
    { id: 3, label: 't("cooperationForm.sections.scopeConfig.title")', desc: 't("cooperationForm.sections.scopeConfig.description")' },
    { id: 4, label: 't("cooperationForm.sections.documents.title")', desc: 't("cooperationForm.sections.documents.description")' },
    { id: 5, label: 't("cooperationForm.sections.review.title")', desc: 't("cooperationForm.sections.review.description")' },
  ]
  
  // Form state
  const [formData, setFormData] = useState<CooperationsFormData>({
    insurerId: '',
    cooperationType: undefined,
    status: 'Draft',
    myContactPerson: { name: '', email: '', phone: '' },
    insurerContactPerson: { name: '', position: '', email: '', phone: '' },
    settlementMethod: undefined,
    settlementCycle: 45,
    premiumCollectionMethod: undefined,
    premiumSettlementCycle: 'Monthly',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    productScope: { type: 'SpecificLOB', lobTypes: [] },
    stateScope: [],
    contractFile: undefined,
  })
  
  const [currentStep, setCurrentStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooperationSaved, setCooperationSaved] = useState(false)
  
  // Calculate completed steps
  const completedSteps = STEPS.map((step, index) => {
    if (index === 0) return formData.insurerId && formData.cooperationType && formData.effectiveDate
    if (index === 1) return formData.myContactPerson.name && formData.myContactPerson.email
    if (index === 2) return formData.settlementMethod && formData.premiumCollectionMethod
    if (index === 3) return formData.productScope.type === 'SpecificLOB' ? formData.productScope.lobTypes?.length : true
    if (index === 4) return formData.contractFile || formData.productScope.type !== 'All'
    return true
  })
  
  // Field change handlers
  const updateField = (
    key: string,
    value: any
  ) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.')
      setFormData((prev: any) => ({
        ...prev,
        [parent]: { ...(prev[parent] as object), [child]: value },
      }))
    } else {
      setFormData((prev: any) => ({ ...prev, [key]: value }))
    }
  }
  
  // Validation for each step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch(step) {
      case 0: // Basic Info
        if (!formData.insurerId) newErrors.insurerId = 'Please select a cooperating insurance company'
        if (!formData.cooperationType) newErrors.cooperationType = 'Please select a cooperation type'
        if (!formData.effectiveDate) newErrors.effectiveDate = 'Effective date is required'
        if (formData.expirationDate && formData.expirationDate <= formData.effectiveDate) {
          newErrors.expirationDate = 'Expiration date must be after effective date'
        }
        break
        
      case 1: // Contact Persons
        if (!formData.myContactPerson?.name) newErrors.myContactName = 'Our contact person name is required'
        if (!formData.myContactPerson?.email) newErrors.myContactEmail = 'Our contact person email is required'
        else if (!/\S+@\S+\.\S+/.test(formData.myContactPerson.email)) {
          newErrors.myContactEmail = 'Invalid email format'
        }
        break
        
      case 2: // Settlement Configuration
        if (!formData.settlementMethod) newErrors.settlementMethod = 'Please select settlement method'
        if (!formData.premiumCollectionMethod) newErrors.premiumCollectionMethod = 'Please select premium collection method'
        break
        
      case 3: // Scope Configuration
        if (!formData.stateScope || formData.stateScope.length === 0) {
          newErrors.stateScope = 'Please select at least one state'
        }
        if (formData.productScope.type === 'SpecificLOB' && (!formData.productScope.lobTypes || formData.productScope.lobTypes.length === 0)) {
          newErrors.productScopeLOB = 'Please select at least one line of business'
        }
        break
        
      case 4: // Documents (optional - allow skip if all products included)
        if (formData.productScope.type !== 'All' && !formData.contractFile) {
          newErrors.contractFile = 'Please upload cooperation agreement'
        }
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }
  
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }
  
  // Form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const savedCooperation = {
      id: `coop${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user_current',
    }
    
    setCooperationSaved(true)
    setIsSubmitting(false)
  }
  
  const handleSaveDraft = () => {
    setFormData((prev: any) => ({ ...prev, status: 'Draft' }))
    alert('Draft saved!')
  }
  
  // Render functions for each step
  const renderBasicInfoStep = () => (
    <>
      <div className="space-y-6">
        {/* Insurer Selection */}
        <div className="card p-6">
          <label className="block text-sm font-semibold mb-2 text-gray-800">
            Select Cooperating Insurance Company*
          </label>
          <select
            value={formData.insurerId}
            onChange={(e) => updateField('insurerId', e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${errors.insurerId ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors bg-white`}
          >
            <option value="">Select an insurance company</option>
            {carriers.map(carrier => (
              <option key={carrier.carrierId} value={carrier.carrierId}>
                {carrier.carrierName} ({carrier.carrierCode})
              </option>
            ))}
          </select>
          {errors.insurerId && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {errors.insurerId}</p>}
        </div>
        
        {/* Cooperation Type */}
        <div className="card p-6">
          <label className="block text-sm font-semibold mb-3 text-gray-800">
            Cooperation Type*
          </label>
          <div className="grid grid-cols-2 gap-3">
            {COOPERATION_TYPES.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => updateField('cooperationType', type.value)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.cooperationType === type.value 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Building2 size={20} className={`mt-0.5 ${formData.cooperationType === type.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{t(`values.${type.label.toLowerCase()}`)}</div>
                  </div>
                </div>
                {formData.cooperationType === type.value && <CheckCircle size={18} className="ml-auto text-blue-600" />}
              </button>
            ))}
          </div>
          {errors.cooperationType && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {errors.cooperationType}</p>}
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <label className="block text-sm font-semibold mb-2 text-gray-800">
              Effective Date*
            </label>
            <input
              type="date"
              value={formData.effectiveDate}
              onChange={(e) => updateField('effectiveDate', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${errors.effectiveDate ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            />
            {errors.effectiveDate && <p className="mt-1 text-xs text-red-600">{errors.effectiveDate}</p>}
          </div>
          
          <div className="card p-4">
            <label className="block text-sm font-semibold mb-2 text-gray-800">
              Expiration Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expirationDate}
              onChange={(e) => updateField('expirationDate', e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border ${errors.expirationDate ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            />
            {errors.expirationDate && <p className="mt-1 text-xs text-red-600">{errors.expirationDate}</p>}
          </div>
        </div>
      </div>
    </>
  )
  
  const renderContactPersonsStep = () => (
    <div className="space-y-6">
      {/* Our Contact Person */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="text-blue-600" size={20}/>
          Our Contact Person*
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name*
            </label>
            <input
              type="text"
              value={formData.myContactPerson?.name || ''}
              onChange={(e) => updateField('myContactPerson.name', e.target.value)}
              placeholder="e.g., John Williams"
              className={`w-full px-3 py-2 rounded-lg border ${errors.myContactName ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            />
            {errors.myContactName && <p className="mt-1 text-xs text-red-600">{errors.myContactName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address*
            </label>
            <input
              type="email"
              value={formData.myContactPerson?.email || ''}
              onChange={(e) => updateField('myContactPerson.email', e.target.value)}
              placeholder="john.williams@ourcompany.com"
              className={`w-full px-3 py-2 rounded-lg border ${errors.myContactEmail ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            />
            {errors.myContactEmail && <p className="mt-1 text-xs text-red-600">{errors.myContactEmail}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.myContactPerson?.phone || ''}
              onChange={(e) => updateField('myContactPerson.phone', e.target.value)}
              placeholder="+1-415-555-0101"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>
      
      {/* Insurer Contact Person */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="text-green-600" size={20}/>
          Insurer Contact Person (Optional)
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.insurerContactPerson?.name || ''}
              onChange={(e) => updateField('insurerContactPerson.name', e.target.value)}
              placeholder="e.g., Sarah Johnson"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position/Title
            </label>
            <input
              type="text"
              value={formData.insurerContactPerson?.position || ''}
              onChange={(e) => updateField('insurerContactPerson.position', e.target.value)}
              placeholder="e.g., Regional President - West Coast"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.insurerContactPerson?.email || ''}
              onChange={(e) => updateField('insurerContactPerson.email', e.target.value)}
              placeholder="sarah.johnson@travelers.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.insurerContactPerson?.phone || ''}
              onChange={(e) => updateField('insurerContactPerson.phone', e.target.value)}
              placeholder="+1-415-555-0201"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
      </div>
    </div>
  )
  
  const renderSettlementConfigStep = () => (
    <div className="space-y-6">
      {/* Settlement Method */}
      <div className="card p-6">
        <label className="block text-sm font-semibold mb-3 text-gray-800">
          Settlement Method*
        </label>
        <div className="space-y-3">
          {SETTLEMENT_METHODS.map(method => (
            <label 
              key={method.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.settlementMethod === method.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="settlementMethod"
                value={method.value}
                checked={formData.settlementMethod === method.value}
                onChange={(e) => updateField('settlementMethod', e.target.value as SettlementMethod)}
                className="mt-1 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{method.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {method.value === 'DirectPay' ? 'Insurer pays commission directly to us' : 'We aggregate and settle with insurers'}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.settlementMethod && <p className="mt-2 text-sm text-red-600">{errors.settlementMethod}</p>}
      </div>
      
      {/* Commission Cycle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <label className="block text-sm font-semibold mb-2 text-gray-800">
            Commission Payment Terms (Days)
          </label>
          <input
            type="number"
            value={formData.settlementCycle}
            onChange={(e) => updateField('settlementCycle', parseInt(e.target.value))}
            min="15"
            max="90"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>
        
        <div className="card p-4">
          <label className="block text-sm font-semibold mb-2 text-gray-800">
            Premium Settlement Frequency
          </label>
          <select
            value={formData.premiumSettlementCycle}
            onChange={(e) => updateField('premiumSettlementCycle', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>
      </div>
      
      {/* Premium Collection Method */}
      <div className="card p-6">
        <label className="block text-sm font-semibold mb-3 text-gray-800">
          Premium Collection Method*
        </label>
        <div className="space-y-3">
          {PREMIUM_COLLECTION_METHODS.map(method => (
            <label 
              key={method.value}
              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.premiumCollectionMethod === method.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="premiumCollectionMethod"
                value={method.value}
                checked={formData.premiumCollectionMethod === method.value}
                onChange={(e) => updateField('premiumCollectionMethod', e.target.value as PremiumCollectionMethod)}
                className="mt-1 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{method.label}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {method.value === 'ChannelToMyToInsurer' ? 'Channel → Our Platform → Insurer' : 'Channel → Insurer Directly'}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.premiumCollectionMethod && <p className="mt-2 text-sm text-red-600">{errors.premiumCollectionMethod}</p>}
      </div>
    </div>
  )
  
  const renderScopeConfigStep = () => (
    <div className="space-y-6">
      {/* Product Scope */}
      <div className="card p-6">
        <label className="block text-sm font-semibold mb-3 text-gray-800">
          Cooperative Product Scope*
        </label>
        <div className="space-y-3">
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.productScope.type === 'All' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="productScope"
              value="All"
              checked={formData.productScope.type === 'All'}
              onChange={(e) => updateField('productScope', { type: 'All' as const })}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">All Products</div>
              <div className="text-sm text-gray-500">Include all products from this insurer</div>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.productScope.type === 'SpecificLOB' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="productScope"
              value="SpecificLOB"
              checked={formData.productScope.type === 'SpecificLOB'}
              onChange={(e) => updateField('productScope', { type: 'SpecificLOB' as const, lobTypes: [] })}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Specific Lines of Business</div>
              <div className="text-sm text-gray-500 mt-1">Select specific LOBs:</div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {['AUTO', 'HOME', 'LIFE', 'HEALTH', 'PENSION'].map(lob => (
                  <label key={lob} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.productScope.lobTypes?.includes(lob as LineOfBusiness)}
                      onChange={(e) => {
                        const current = formData.productScope.lobTypes || []
                        updateField(
                          'productScope.lobTypes',
                          e.target.checked 
                            ? [...current, lob as LineOfBusiness]
                            : current.filter(l => l !== lob)
                        )
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {lob}
                  </label>
                ))}
              </div>
            </div>
          </label>
          
          <label className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            formData.productScope.type === 'SpecificProducts' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="productScope"
              value="SpecificProducts"
              checked={formData.productScope.type === 'SpecificProducts'}
              onChange={(e) => updateField('productScope', { type: 'SpecificProducts' as const, productIds: [] })}
              className="mt-1 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="font-medium text-gray-900">Specific Products</div>
              <div className="text-sm text-gray-500">Select individual products</div>
            </div>
          </label>
        </div>
        {(errors.productScopeLOB || errors.productScope) && (
          <p className="mt-2 text-sm text-red-600">{errors.productScopeLOB || errors.productScope}</p>
        )}
      </div>
      
      {/* State Coverage */}
      <div className="card p-6">
        <label className="block text-sm font-semibold mb-3 text-gray-800">
          Covered States*
        </label>
        <div className="grid grid-cols-4 gap-2">
          {US_STATES.slice(0, 25).map(state => (
            <button
              key={state}
              type="button"
              onClick={() => {
                const current = formData.stateScope || []
                updateField('stateScope', 
                  current.includes(state) 
                    ? current.filter(s => s !== state)
                    : [...current, state]
                )
              }}
              className={`px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                formData.stateScope?.includes(state)
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {state}
            </button>
          ))}
        </div>
        {errors.stateScope && <p className="mt-2 text-sm text-red-600">{errors.stateScope}</p>}
      </div>
    </div>
  )
  
  const renderDocumentsStep = () => (
    <div className="space-y-4">
      <div className="card p-6">
        <label className="block text-sm font-semibold mb-2 text-gray-800">
          Upload Cooperation Agreement (PDF/Word)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
          <Upload className="mx-auto text-gray-400 mb-3" size={32}/>
          <p className="text-gray-600">Drag & drop your file here, or click to browse</p>
          <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
          <input type="file" className="hidden" accept=".pdf,.doc,.docx"/>
        </div>
        {formData.contractFile && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <FileText className="text-blue-600" size={20}/>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{formData.contractFile.fileName}</div>
              <div className="text-sm text-gray-500">
                {(formData.contractFile.fileSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <a href={formData.contractFile.downloadUrl} download className="text-blue-600 hover:text-blue-700 text-sm">
              Download
            </a>
          </div>
        )}
        {errors.contractFile && <p className="mt-2 text-sm text-red-600">{errors.contractFile}</p>}
      </div>
      
      <div className="card p-4 bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-2">
          <Info className="text-yellow-600 mt-0.5" size={18}/>
          <div className="text-sm text-yellow-800">
            <strong>Note:</strong> Contract uploads are required unless you selected "All Products" in scope configuration
          </div>
        </div>
      </div>
    </div>
  )
  
  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Review Your Cooperation Details</h3>
        
        <div className="space-y-3">
          <DetailRow label="Insurance Company" value={carriers.find(c => c.carrierId === formData.insurerId)?.carrierName || 'N/A'} />
          <DetailRow label="Cooperation Type" value={formData.cooperationType || 'N/A'} />
          <DetailRow label="Effective Date" value={formData.effectiveDate || 'N/A'} />
          <DetailRow label="Expiration Date" value={formData.expirationDate || 'Permanent partnership'} />
          
          <hr className="border-gray-200"/>
          
          <h4 className="font-semibold text-gray-900 mb-2">Contact Persons</h4>
          <DetailRow 
            label="Our Contact" 
            value={`${formData.myContactPerson?.name} (${formData.myContactPerson?.email})`} 
          />
          <DetailRow 
            label="Insurer Contact" 
            value={formData.insurerContactPerson?.name || 'Not provided'} 
          />
          
          <hr className="border-gray-200"/>
          
          <h4 className="font-semibold text-gray-900 mb-2">Settlement Configuration</h4>
          <DetailRow label="Settlement Method" value={formData.settlementMethod || 'N/A'} />
          <DetailRow label="Commission Cycle" value={`${formData.settlementCycle} days`} />
          <DetailRow label="Premium Collection" value={formData.premiumCollectionMethod || 'N/A'} />
          
          <hr className="border-gray-200"/>
          
          <h4 className="font-semibold text-gray-900 mb-2">Coverage</h4>
          <DetailRow label="Product Scope" value={formData.productScope.type} />
          <DetailRow label="States Covered" value={formData.stateScope?.join(', ') || 'None selected'} />
        </div>
      </div>
      
      <div className="card p-4 bg-green-50 border border-green-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="text-green-600 mt-0.5" size={18}/>
          <div className="text-sm text-green-800">
            All information appears complete and correct
          </div>
        </div>
      </div>
    </div>
  )
  
  // Helper component for detail rows
  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
  
  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <button onClick={() => navigateTo('cooperation-list')} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft size={18}/> Back to Cooperation List
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Cooperation</h1>
        <p className="text-gray-600 mt-1">Configure the cooperation parameters between us and the selected insurance carrier</p>
      </div>
      
      {/* Progress Indicator */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    index === currentStep 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                      : completedSteps[index] 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {completedSteps[index] ? <CheckCircle size={20}/> : <span>{index + 1}</span>}
                  </div>
                  <div className="text-xs font-medium mt-2 text-center max-w-[80px] truncate">
                    {step.label}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    completedSteps[index] ? 'bg-green-500' : 'bg-gray-200'
                  }`}/>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      
      {/* Form Content */}
      <div className="max-w-5xl mx-auto">
        <div className="card p-8">
          {currentStep === 0 && renderBasicInfoStep()}
          {currentStep === 1 && renderContactPersonsStep()}
          {currentStep === 2 && renderSettlementConfigStep()}
          {currentStep === 3 && renderScopeConfigStep()}
          {currentStep === 4 && renderDocumentsStep()}
          {currentStep === 5 && renderReviewStep()}
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="max-w-5xl mx-auto mt-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft size={18}/> Back
        </button>
        
        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next <ArrowRight size={18}/>
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18}/> Save Draft
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>Submit for Approval <CheckCircle size={18}/></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
