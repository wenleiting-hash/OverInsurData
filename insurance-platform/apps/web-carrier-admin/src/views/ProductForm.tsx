// Product Form - Step-by-step wizard for creating/editing products (功能点 10-12)
// 严格按照设计原型 V1.1 实现：垂直步骤导航 + 两列表单布局

import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Check, AlertCircle, Upload, FileText, X,
  Save, FileCheck, Cloud, Shield, Calendar, Globe, FileCheck2, AlertTriangle
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InsuranceProduct } from './data/mockProductData'
import { products } from './data/mockProductData'

interface Props {
  productId?: string  // Edit mode has ID, create mode is undefined
  onBackToList: () => void
}

// 垂直步骤导航（左侧）
const STEPS = [
  { id: 0, label: '基本信息', icon: Cloud, desc: '' },
  { id: 1, label: '费率配置', icon: FileCheck, desc: '' },
  { id: 2, label: '核保规则', icon: Shield, desc: '' },
  { id: 3, label: '可售州', icon: Globe, desc: '' },
  { id: 4, label: '合规文件', icon: FileCheck2, desc: '' },
]

// 主要承保范围选项
const COVERAGE_OPTIONS = [
  '责任险',
  '综合险',
  '碰撞险',
  '医疗赔付',
  '未保险驾驶员',
  '道路救援',
  '车辆替代',
  '新车价值保障',
  '自付额豁免',
]

const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']

interface FormData {
  productName: string
  productCode: string
  insurerId: string
  type: string
  lineOfBusiness: string
  subLine: string
  description: string
  coverages: string[]
  rateType: string
  baseRate: number | ''
  minPremium: number | ''
  maxPremium: number | ''
  rateFactors: string[]
  effectiveDate: string
  expirationDate: string
  // Step 2: Underwriting Rules (string for controlled inputs)
  ageMin?: number | string
  ageMax?: number | string
  excludeDUI?: boolean
  referHighValue?: boolean
  referThreshold?: number | string
  blacklistConditions?: string[]
  // Step 3: Available States
  availableStates?: string[]
  // Step 4: Compliance Documents
  uploadedFiles?: string[]
}

export default function ProductForm({ productId, onBackToList }: Props) {
  const { t } = useTranslation('product')
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productCode: '',
    insurerId: '',
    type: 'Individual',
    lineOfBusiness: '',
    subLine: '',
    description: '',
    coverages: [],
    rateType: 'Tiered',
    baseRate: '',
    minPremium: '',
    maxPremium: '',
    rateFactors: ['DrivingRecord', 'VehicleType', 'CreditScore'],
    effectiveDate: '',
    expirationDate: '',
  })
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  // Load edit data if exists
  useEffect(() => {
    if (productId) {
      const existing = products.find((p: InsuranceProduct) => p.productId === productId)
      if (existing) {
        setFormData({
          productName: existing.productName,
          productCode: existing.productCode,
          insurerId: existing.insurerId,
          type: existing.type,
          lineOfBusiness: existing.lineOfBusiness,
          subLine: existing.subLine || '',
          description: existing.description || '',
          coverages: existing.coverages || [],
          rateType: existing.rateType || 'Tiered',
          baseRate: existing.baseRate || '',
          minPremium: existing.minPremium || '',
          maxPremium: existing.maxPremium || '',
          rateFactors: existing.rateFactors || ['DrivingRecord', 'VehicleType', 'CreditScore'],
          effectiveDate: existing.effectiveDate.split('T')[0],
          expirationDate: existing.expirationDate?.split('T')[0] || '',
        })
      }
    }
  }, [productId])

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const toggleCoverage = (coverage: string) => {
    setFormData(prev => {
      const current = prev.coverages
      return {
        ...prev,
        coverages: current.includes(coverage)
          ? current.filter(c => c !== coverage)
          : [...current, coverage]
      }
    })
  }

  const toggleFactor = (factor: string) => {
    setFormData(prev => {
      const current = prev.rateFactors
      return {
        ...prev,
        rateFactors: current.includes(factor)
          ? current.filter(f => f !== factor)
          : [...current, factor]
      }
    })
  }

  const handleSaveDraft = () => {
    setToastMessage('草稿已保存')
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1)
    }
  }

  const handleCancel = () => {
    onBackToList()
  }

  const completedSteps = new Set<number>()
  if (formData.productName && formData.productCode && formData.insurerId) {
    completedSteps.add(0)
  }

  const INPUT = {
    width: '100%',
    height: '42px',
    padding: '0 14px',
    background: '#FFFFFF',
    border: '1px solid rgba(24,28,35,0.1)',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#181C23',
    outline: 'none',
    transition: 'border 0.2s',
  } as const

  return (
    <div className="w-full h-full flex">
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div style={{ padding: '32px 36px', maxWidth: '1440px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <button 
                className="icon-btn" 
                onClick={handleCancel}
                style={{ padding: '8px', background: 'transparent', border: 'none' }}
              >
                <ChevronLeft size={20} />
              </button>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#181C23', margin: 0 }}>
                {productId ? t('header.titleEdit') : t('steps.basicInfo.label')}
              </h1>
            </div>
            <p style={{ fontSize: '15px', color: '#717786' }}>
              {productId ? t('header.subtitleEdit') : '填写产品信息，配置费率、核保规则与可售区域'}
            </p>
          </div>

          {/* Two Column Layout: Steps + Form */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Left: Vertical Steps */}
            <div style={{ width: '240px', flexShrink: 0 }}>
              <div className="glass-card rounded-xl" style={{ padding: '20px' }}>
                {STEPS.map((step, idx) => {
                  const isActive = idx === currentStep
                  const isCompleted = completedSteps.has(idx)
                  const Icon = step.icon
                  return (
                    <div
                      key={step.id}
                      onClick={() => idx < currentStep && setCurrentStep(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        marginBottom: idx < STEPS.length - 1 ? '8px' : 0,
                        borderRadius: '10px',
                        background: isActive 
                          ? 'rgba(0, 88, 188, 0.08)' 
                          : 'transparent',
                        border: isActive ? '1px solid rgba(0, 88, 188, 0.2)' : '1px solid transparent',
                        cursor: idx < currentStep ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCompleted 
                          ? '#34C759' 
                          : isActive 
                            ? 'rgba(0, 88, 188, 0.15)' 
                            : 'rgba(247,248,250,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCompleted ? '#FFFFFF' : isActive ? '#0058BC' : '#9CA3AF'
                      }}>
                        {isCompleted ? <Check size={18} /> : <Icon size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: isActive ? 600 : 500, 
                          color: isActive ? '#0058BC' : isCompleted ? '#34C759' : '#404757'
                        }}>
                          {step.label}
                        </div>
                        {isCompleted && (
                          <div style={{ fontSize: '12px', color: '#34C759', marginTop: '2px' }}>
                            已完成
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {/* Progress */}
                <div style={{ marginTop: '20px', padding: '0 16px' }}>
                  <div style={{ height: '4px', background: 'rgba(247,248,250,0.8)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${((currentStep + 1) / STEPS.length) * 100}%`, 
                      height: '100%', 
                      background: '#0058BC',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                    {t('navigation.stepCount', { current: currentStep + 1, total: STEPS.length })} 步完成
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form Content */}
            <div style={{ flex: 1 }}>
              <div className="glass-card rounded-xl" style={{ padding: '28px' }}>
                {currentStep === 0 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      产品基本信息
                    </h2>
                    
                    {/* Row 1: 产品全称 + 产品代码 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          产品全称
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <input
                          {...INPUT}
                          placeholder="e.g. Travelers Auto Insurance"
                          value={formData.productName}
                          onChange={e => updateField('productName', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          产品代码
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <input
                          {...INPUT}
                          placeholder="TRV-AUTO-001"
                          value={formData.productCode}
                          onChange={e => updateField('productCode', e.target.value)}
                          style={{ ...INPUT, textTransform: 'uppercase' }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </div>
                    </div>

                    {/* Row 2: 承保保险公司 + 产品类型 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          承保保险公司
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <select
                          {...INPUT}
                          value={formData.insurerId}
                          onChange={e => updateField('insurerId', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">选择保险公司</option>
                          <option value="c1001">Travelers</option>
                          <option value="c1002">Chubb</option>
                          <option value="c1005">State Farm</option>
                          <option value="c1006">The Hartford</option>
                          <option value="c1007">Allstate</option>
                          <option value="c1008">Progressive</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          产品类型
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          {[
                            { value: 'Individual', label: '个人险' },
                            { value: 'Group', label: '团体险' },
                            { value: 'VoluntaryBenefits', label: '自愿福利险' },
                          ].map(opt => (
                            <label
                              key={opt.value}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: `2px solid ${formData.type === opt.value ? '#0058BC' : 'rgba(24,28,35,0.1)'}`,
                                background: formData.type === opt.value ? 'rgba(0, 88, 188, 0.08)' : '#FFFFFF',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#181C23',
                                transition: 'all 0.2s'
                              }}
                            >
                              <input
                                type="radio"
                                name="productType"
                                value={opt.value}
                                checked={formData.type === opt.value}
                                onChange={() => updateField('type', opt.value)}
                                style={{ accentColor: '#0058BC' }}
                              />
                              {opt.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Row 3: 业务线 + 业务子线 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          业务线
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <select
                          {...INPUT}
                          value={formData.lineOfBusiness}
                          onChange={e => updateField('lineOfBusiness', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">选择业务线</option>
                          <option value="AUTO">AUTO（汽车保险）</option>
                          <option value="HOME">HOME（家庭保险）</option>
                          <option value="LIFE">LIFE（人寿保险）</option>
                          <option value="HEALTH">HEALTH（健康保险）</option>
                          <option value="COMMERCIAL">COMMERCIAL（商业保险）</option>
                          <option value="P&C">P&C（财产与责任保险）</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          业务子线
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <select
                          {...INPUT}
                          value={formData.subLine}
                          onChange={e => updateField('subLine', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">选择业务子线</option>
                          <option value="Liability">Liability（责任险）</option>
                          <option value="Collision">Collision（碰撞险）</option>
                          <option value="Comprehensive">Comprehensive（全面险）</option>
                          <option value="Medical">Medical（医疗险）</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 4: 产品描述 */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                        产品描述
                      </label>
                      <textarea
                        style={{
                          ...INPUT,
                          height: '100px',
                          padding: '14px',
                          resize: 'vertical',
                          fontFamily: 'system-ui'
                        }}
                        placeholder="描述产品的核心价值、目标客群和主要特点..."
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                      />
                    </div>

                    {/* Row 5: 主要承保范围 */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                        主要承保范围
                        <AlertCircle size={14} style={{ color: '#9CA3AF', cursor: 'help' }} />
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {COVERAGE_OPTIONS.map(coverage => {
                          const isSelected = formData.coverages.includes(coverage)
                          return (
                            <button
                              key={coverage}
                              type="button"
                              onClick={() => toggleCoverage(coverage)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: `1.5px solid ${isSelected ? '#0058BC' : 'rgba(24,28,35,0.15)'}`,
                                background: isSelected ? 'rgba(0, 88, 188, 0.08)' : '#FFFFFF',
                                color: isSelected ? '#0058BC' : '#404757',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {isSelected && <Check size={14} />}
                              {coverage}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      费率结构配置
                    </h2>

                    {/* Row 1: 费率类型 */}
                    <div style={{ marginBottom: '28px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '16px' }}>
                        费率类型
                        <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {
                          [
                            { value: 'Flat', label: '固定费率', desc: '统一基础费率' },
                            { value: 'Tiered', label: '分级费率', desc: '按风险等级分层' },
                            { value: 'UsageBased', label: '按用量计费', desc: 'Usage-Based / Telematics' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => updateField('rateType', opt.value)}
                              style={{
                                flex: 1,
                                padding: '16px 20px',
                                borderRadius: '10px',
                                border: `2px solid ${formData.rateType === opt.value ? '#0058BC' : 'rgba(24,28,35,0.1)'}`,
                                background: formData.rateType === opt.value ? 'rgba(0, 88, 188, 0.08)' : '#FFFFFF',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                              }}
                            >
                              <div style={{ fontSize: '14px', fontWeight: 600, color: '#181C23', marginBottom: '4px' }}>
                                {opt.label}
                              </div>
                              <div style={{ fontSize: '12px', color: '#717786' }}>
                                {opt.desc}
                              </div>
                            </button>
                          ))
                        }
                      </div>
                    </div>

                    {/* Row 2: 基础费率 + 最低保费 + 最高保费 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          基础费率（年）
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <input
                          {...INPUT}
                          placeholder="$1,200"
                          value={formData.baseRate}
                          onChange={e => updateField('baseRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          最低保费
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <input
                          {...INPUT}
                          placeholder="$480"
                          value={formData.minPremium}
                          onChange={e => updateField('minPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>
                          最高保费
                          <span style={{ color: '#BA1A1A', fontSize: '12px' }}>*</span>
                        </label>
                        <input
                          {...INPUT}
                          placeholder="$4,200"
                          value={formData.maxPremium}
                          onChange={e => updateField('maxPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </div>
                    </div>

                    {/* Row 3: 费率影响因子 */}
                    <div style={{ marginBottom: '28px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '16px' }}>
                        费率影响因子
                        <AlertCircle size={14} style={{ color: '#9CA3AF', cursor: 'help' }} />
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {
                          ['DrivingRecord', 'VehicleType', 'Age', 'CreditScore', 'Region', 'Purpose', 'AgeBracket', 'AccidentHistory', 'VehicleValue', 'SafetyEquipment'].map(factor => {
                            const isSelected = formData.rateFactors.includes(factor)
                            const factorLabels = {
                              DrivingRecord: '驾驶记录',
                              VehicleType: '车型系数',
                              Age: '驾龄',
                              CreditScore: '信用评分',
                              Region: '地区系数',
                              Purpose: '用途系数',
                              AgeBracket: '年龄段',
                              AccidentHistory: '出险历史',
                              VehicleValue: '车辆价值',
                              SafetyEquipment: '安全设备'
                            }
                            return (
                              <button
                                key={factor}
                                type="button"
                                onClick={() => toggleFactor(factor)}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '20px',
                                  border: `1.5px solid ${isSelected ? '#0058BC' : 'rgba(24,28,35,0.15)'}`,
                                  background: isSelected ? 'rgba(0, 88, 188, 0.08)' : '#FFFFFF',
                                  color: isSelected ? '#0058BC' : '#404757',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isSelected && <Check size={14} />}
                                {factorLabels[factor as keyof typeof factorLabels]}
                              </button>
                            )
                          })
                        }
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      核保规则配置
                    </h2>

                    {/* Section 1: 年龄范围 */}
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>
                        投保人年龄要求
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                          <input
                            {...INPUT}
                            type="number"
                            min="0"
                            max="120"
                            placeholder="最小年龄"
                            value={formData.ageMin ?? ''}
                            onChange={e => updateField('ageMin', e.target.value === '' ? '' : parseInt(e.target.value))}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                          />
                          <div style={{ fontSize: '12px', color: '#717786', marginTop: '6px' }}>投保人最小年龄限制</div>
                        </div>
                        <div>
                          <input
                            {...INPUT}
                            type="number"
                            min="0"
                            max="120"
                            placeholder="最大年龄"
                            value={formData.ageMax ?? ''}
                            onChange={e => updateField('ageMax', e.target.value === '' ? '' : parseInt(e.target.value))}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                          />
                          <div style={{ fontSize: '12px', color: '#717786', marginTop: '6px' }}>投保人最大年龄限制</div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: DUI 记录拒保 */}
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#181C23' }}>
                        <input
                          type="checkbox"
                          checked={formData.excludeDUI || false}
                          onChange={e => updateField('excludeDUI', e.target.checked)}
                          style={{ accentColor: '#BA1A1A', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>DUI/DWI 记录拒保（自动排除）</div>
                          <div style={{ fontSize: '12px', color: '#717786' }}>
                            过去 5 年内有 DUI/DWI 交通记录的申请人将自动拒保，无需人工核保
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Section 3: 高价值标的转人工核保 */}
                    <div style={{ marginBottom: '32px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', fontSize: '14px', fontWeight: 500, color: '#181C23' }}>
                        <input
                          type="checkbox"
                          checked={formData.referHighValue || false}
                          onChange={e => updateField('referHighValue', e.target.checked)}
                          style={{ accentColor: '#BF690B', marginTop: '2px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>高价值标的转人工核保（自动转介）</div>
                          <div style={{ fontSize: '12px', color: '#717786' }}>
                            当保单保额超过设定阈值时，自动转专业核保团队审核
                          </div>
                          {formData.referHighValue && (
                            <div style={{ marginTop: '12px', paddingLeft: '32px' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 500, color: '#181C23', marginBottom: '8px' }}>
                                转介阈值（美元）
                              </label>
                              <input
                                {...INPUT}
                                type="number"
                                placeholder="例如：$1,000,000"
                                value={formData.referThreshold ?? ''}
                                onChange={e => updateField('referThreshold', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Section 4: 其他核保条件 */}
                    <div style={{ marginBottom: '28px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>
                        核保黑名单条件
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {[{ value: 'poorCredit', label: '信用不良' }, { value: 'fraudHistory', label: '欺诈历史' }, { value: 'mispresentation', label: '虚假陈述' }].map(condition => {
                          const isSelected = formData.blacklistConditions?.includes(condition.value)
                          return (
                            <button
                              key={condition.value}
                              type="button"
                              onClick={() => {
                                const current = formData.blacklistConditions || []
                                updateField('blacklistConditions', isSelected 
                                  ? current.filter(c => c !== condition.value)
                                  : [...current, condition.value]
                                )
                              }}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                border: `1.5px solid ${isSelected ? '#0058BC' : 'rgba(24,28,35,0.15)'}`,
                                background: isSelected ? 'rgba(0, 88, 188, 0.08)' : '#FFFFFF',
                                color: isSelected ? '#0058BC' : '#404757',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {isSelected && <Check size={14} />}
                              {condition.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      可售州配置
                    </h2>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', color: '#404757' }}>
                        已选 {formData.availableStates?.length || 0} 个州
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn-ghost"
                          onClick={() => updateField('availableStates', US_STATES)}
                          style={{ padding: '8px 14px', fontSize: '12px' }}
                        >
                          全选 (50 州)
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => updateField('availableStates', [])}
                          style={{ padding: '8px 14px', fontSize: '12px', color: '#BA1A1A' }}
                        >
                          清空
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0, 88, 188, 0.05)', borderRadius: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#181C23', marginBottom: '10px' }}>常见区域预设：</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                          { name: '东北六州', states: ['NY', 'NJ', 'CT', 'MA', 'PA', 'NH'] }, 
                          { name: '加州周边', states: ['CA', 'NV', 'AZ'] },
                          { name: '德州周边', states: ['TX', 'OK', 'LA', 'NM'] }
                        ].map(preset => (
                          <button
                            key={preset.name}
                            className="btn-ghost"
                            onClick={() => {
                              const current = new Set(formData.availableStates || [])
                              preset.states.forEach(s => current.add(s))
                              updateField('availableStates', Array.from(current))
                            }}
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 50 States Grid */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', 
                      gap: '8px' 
                    }}>
                      {US_STATES.map(state => {
                        const isSelected = formData.availableStates?.includes(state)
                        return (
                          <button
                            key={state}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                updateField('availableStates', formData.availableStates.filter(s => s !== state))
                              } else {
                                updateField('availableStates', [...(formData.availableStates || []), state])
                              }
                            }}
                            style={{
                              padding: '10px 8px',
                              borderRadius: '8px',
                              border: `2px solid ${isSelected ? '#0058BC' : 'rgba(24,28,35,0.1)'}`,
                              background: isSelected ? 'rgba(0, 88, 188, 0.12)' : '#FFFFFF',
                              color: isSelected ? '#0058BC' : '#181C23',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {state}
                          </button>
                        )
                      })}
                    </div>

                    {/* Info Note */}
                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0, 88, 188, 0.08)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                        <AlertTriangle size={18} style={{ color: '#0058BC', marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ fontSize: '13px', color: '#0058BC' }}>
                          每个州均需单独获得监管批准才能销售。未获批的州将无法生成保单。
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      合规文件上传
                    </h2>

                    <div style={{ fontSize: '14px', color: '#404757', marginBottom: '24px' }}>
                      请上传产品备案所需的各类合规文件。标*为必需文件。
                    </div>

                    {/* Required Documents */}
                    <div style={{ marginBottom: '32px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>
                        📄 必需文件 *
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                          { key: 'termsOfInsurance', label: '产品条款' },
                          { key: 'rateFiling', label: '费率备案表' },
                          { key: 'complianceCertificate', label: 'NAIC 合规证书' }
                        ].map(doc => {
                          const uploaded = formData.uploadedFiles?.includes(doc.key)
                          return (
                            <div
                              key={doc.key}
                              style={{
                                padding: '20px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(24,28,35,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: '#0058BC' }} />
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#181C23' }}>{doc.label}</span>
                                <span style={{ fontSize: '11px', color: '#BA1A1A' }}>*</span>
                              </div>
                              {uploaded ? (
                                <button
                                  className="btn-ghost"
                                  onClick={() => updateField('uploadedFiles', formData.uploadedFiles.filter(f => f !== doc.key))}
                                  style={{ fontSize: '12px', color: '#BA1A1A' }}
                                >
                                  ✕ 移除文件
                                </button>
                              ) : (
                                <button
                                  className="btn-secondary"
                                  onClick={() => alert('触发文件上传对话框')}
                                  style={{ fontSize: '12px' }}
                                >
                                  📤 上传文件
                                </button>
                              )}
                              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                支持 PDF/Word/Excel，最大 50MB
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Optional Documents */}
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#181C23', marginBottom: '16px' }}>
                        📋 可选文件
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {[
                          { key: 'underwritingGuide', label: '核保指南' },
                          { key: 'salesTrainingMaterials', label: '销售培训材料' }
                        ].map(doc => {
                          const uploaded = formData.uploadedFiles?.includes(doc.key)
                          return (
                            <div
                              key={doc.key}
                              style={{
                                padding: '20px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(24,28,35,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} style={{ color: '#717786' }} />
                                <span style={{ fontSize: '14px', fontWeight: 500, color: '#404757' }}>{doc.label}</span>
                              </div>
                              {uploaded ? (
                                <button
                                  className="btn-ghost"
                                  onClick={() => updateField('uploadedFiles', formData.uploadedFiles.filter(f => f !== doc.key))}
                                  style={{ fontSize: '12px', color: '#BA1A1A' }}
                                >
                                  ✕ 移除文件
                                </button>
                              ) : (
                                <button
                                  className="btn-secondary"
                                  onClick={() => alert('触发文件上传对话框')}
                                  style={{ fontSize: '12px' }}
                                >
                                  📤 上传文件
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <button 
                  className="icon-btn" 
                  onClick={currentStep > 0 ? () => setCurrentStep(s => s - 1) : handleCancel}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#404757' }}
                >
                  <ChevronLeft size={16} />
                  <span>{currentStep > 0 ? '上一步' : '取消'}</span>
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="action-btn" 
                    onClick={handleSaveDraft}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Save size={16} />
                    <span>保存草稿</span>
                  </button>
                  <button 
                    className="action-btn-primary" 
                    onClick={() => {
                      if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span>下一步</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div style={{ position: 'fixed', top: '56px', right: '24px', zIndex: 9999, animation: 'slideIn 0.3s ease-out' }}>
          <div style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,248,250,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(24, 28, 35, 0.1)',
            display: 'flex', alignItems: 'center', gap: '12px',
            minWidth: '300px'
          }}>
            <Check size={20} style={{ color: '#34C759' }} />
            <div style={{ fontSize: '14px', color: '#181C23', fontWeight: 500 }}>{toastMessage}</div>
            <button onClick={() => setShowToast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
              <X size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .glass-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(247,248,250,0.7) 100%);
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(24, 28, 35, 0.08);
        }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(24,28,35,0.1);
          background: rgba(255,255,255,0.8); color: #404757; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .icon-btn:hover:not(:disabled) { background: rgba(255,255,255,1); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .action-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 14px; border-radius: 8px; border: none;
          background: rgba(240,242,245,0.9); color: #404757; font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { background: rgba(240,242,245,1); transform: translateY(-1px); }
        .action-btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px; border: none;
          background: #0058BC; color: #FFFFFF; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0, 88, 188, 0.25);
        }
        .action-btn-primary:hover { background: #00489B; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0, 88, 188, 0.35); }
      `}</style>
    </div>
  )
}
