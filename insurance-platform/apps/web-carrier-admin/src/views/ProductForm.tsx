// Product Form - Step-by-step wizard for creating/editing products (功能点 10-12)
// Synced with 设计原型V1.3 ProductForm: vertical step nav with per-step completion
// check + free jump, Field hint tooltips, rate-type cards, stable coverage/factor
// keys resolved to i18n, submission success card, then redirect back to the list

import { useState, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Check, AlertCircle, CheckCircle, Info, X,
  Upload, FileText, AlertTriangle, XCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InsuranceProduct } from './data/mockProductData'
import { products } from './data/mockProductData'

interface Props {
  productId?: string  // Edit mode has ID, create mode is undefined
  onBackToList: () => void
}

// 主要承保范围选项（稳定英文 key，标签经 i18n 解析）
const COVERAGE_KEYS = ['liability', 'comprehensive', 'collision', 'medical', 'um', 'roadside', 'substitute', 'newCarValue', 'deductibleWaiver'] as const
type CoverageKey = typeof COVERAGE_KEYS[number]

const COVERAGE_LABEL_KEYS: Record<CoverageKey, string> = {
  liability: 'detail.info.liability',
  comprehensive: 'detail.info.comprehensive',
  collision: 'detail.info.collision',
  medical: 'detail.info.medical',
  um: 'detail.info.um',
  roadside: 'detail.info.roadside',
  substitute: 'detail.info.substitute',
  newCarValue: 'detail.info.newCarValue',
  deductibleWaiver: 'detail.info.deductibleWaiver',
}

// 数据文件 coverages 值 → 表单稳定 key（编辑回填用）
const COVERAGE_BACKFILL: Record<string, CoverageKey> = {
  Liability: 'liability',
  Comprehensive: 'comprehensive',
  Collision: 'collision',
  MedicalPayments: 'medical',
  UninsuredMotorist: 'um',
  RoadsideAssistance: 'roadside',
  VehicleReplacement: 'substitute',
}

// 费率影响因子（稳定 key → detail.rates.fac* 标签）
const FACTOR_KEYS = ['drivingRecord', 'vehicleType', 'drivingExperience', 'creditScore', 'territory', 'usage', 'ageBand', 'claimsHistory', 'vehicleValue', 'safetyEquip'] as const
type FactorKey = typeof FACTOR_KEYS[number]

const FACTOR_LABEL_KEYS: Record<FactorKey, string> = {
  drivingRecord: 'detail.rates.facDrivingRecord',
  vehicleType: 'detail.rates.facVehicleType',
  drivingExperience: 'detail.rates.facDrivingExp',
  creditScore: 'detail.rates.facCredit',
  territory: 'detail.rates.facTerritory',
  usage: 'detail.rates.facUsage',
  ageBand: 'detail.rates.facAgeBand',
  claimsHistory: 'detail.rates.facClaimsHistory',
  vehicleValue: 'detail.rates.facVehicleValue',
  safetyEquip: 'detail.rates.facSafetyEquip',
}

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

// 垂直步骤导航（左侧）：图标 + 每步完成判定（原型 STEPS_META）
const STEP_ICONS = [' ▪ ', ' ▪ ', ' ▪ ', ' ▪ ', ' ▪ ']

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        {label}
        {required && <span style={{ color: '#BA1A1A' }}>*</span>}
        {hint && <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}><Info size={11} style={{ color: '#C1C6D7' }} /></span>}
      </label>
      {children}
    </div>
  )
}

export default function ProductForm({ productId, onBackToList }: Props) {
  const { t } = useTranslation('product')
  const existing = productId ? products.find((p: InsuranceProduct) => p.productId === productId) : undefined

  const [currentStep, setCurrentStep] = useState(0)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    productName: '',
    productCode: '',
    insurerId: '',
    type: 'Individual',
    lineOfBusiness: '',
    subLine: '',
    description: '',
    coverages: ['liability', 'comprehensive', 'collision'],
    rateType: 'tiered',
    baseRate: '',
    minPremium: '',
    maxPremium: '',
    rateFactors: ['drivingRecord', 'vehicleType', 'creditScore'],
    effectiveDate: '',
    expirationDate: '',
  })
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)

  // Load edit data if exists
  useEffect(() => {
    if (productId && existing) {
      setFormData(prev => ({
        ...prev,
        productName: existing.productName,
        productCode: existing.productCode,
        insurerId: existing.insurerId,
        type: existing.type,
        lineOfBusiness: existing.lineOfBusiness,
        subLine: existing.subLine || '',
        description: existing.description || '',
        coverages: (existing.coverages ?? []).map(c => COVERAGE_BACKFILL[c]).filter(Boolean),
        rateType: existing.rateType === 'Flat' ? 'flat' : existing.rateType === 'UsageBased' ? 'usage' : 'tiered',
        baseRate: existing.baseRate ?? '',
        minPremium: existing.minPremium ?? '',
        maxPremium: existing.maxPremium ?? '',
        rateFactors: (existing.rateFactors ?? []).map(f => f.toLowerCase()),
        effectiveDate: existing.effectiveDate.split('T')[0],
        expirationDate: existing.expirationDate?.split('T')[0] || '',
        ageMin: existing.ageMin ?? '',
        ageMax: existing.ageMax ?? '',
        excludeDUI: existing.excludeDUI ?? false,
        referHighValue: existing.referHighValue ?? false,
        referThreshold: existing.referThreshold ?? '',
        blacklistConditions: existing.blacklistConditions ?? [],
        availableStates: existing.availableStates ?? [],
      }))
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
    setToastMessage(t('header.saved'))
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Per-step completion check (原型 stepDone)
  const stepDone = (i: number) => {
    if (i === 0) return !!formData.productName && !!formData.productCode && !!formData.insurerId && !!formData.lineOfBusiness
    if (i === 1) return formData.baseRate !== '' && formData.minPremium !== '' && formData.maxPremium !== ''
    if (i === 2) return formData.ageMin !== '' && formData.ageMin !== undefined && formData.ageMax !== '' && formData.ageMax !== undefined
    if (i === 3) return (formData.availableStates?.length ?? 0) > 0
    return true
  }

  const handleSubmit = () => {
    setSaved(true)
    setTimeout(onBackToList, 1200)
  }

  const stepLabels = [
    t('steps.basicInfo.label'),
    t('steps.rates.label'),
    t('steps.underwriting.label'),
    t('steps.states.label'),
    t('steps.documents.label'),
  ]
  const doneCount = [0, 1, 2, 3, 4].filter(stepDone).length

  const coverageLabels: Record<CoverageKey, string> = Object.fromEntries(
    COVERAGE_KEYS.map(k => [k, t(COVERAGE_LABEL_KEYS[k])])
  ) as Record<CoverageKey, string>

  const factorLabels: Record<FactorKey, string> = Object.fromEntries(
    FACTOR_KEYS.map(k => [k, t(FACTOR_LABEL_KEYS[k])])
  ) as Record<FactorKey, string>

  const rateTypeOptions = [
    { val: 'flat', label: t('form.rates.flat'), desc: t('form.rates.flatDesc') },
    { val: 'tiered', label: t('form.rates.tiered'), desc: t('form.rates.tieredDesc') },
    { val: 'usage', label: t('form.rates.usage'), desc: t('form.rates.usageDesc') },
  ]

  const blacklistOptions = [
    { value: 'poorCredit', label: t('underwriting.poorCredit') },
    { value: 'fraudHistory', label: t('underwriting.fraudHistory') },
    { value: 'mispresentation', label: t('underwriting.mispresentation') },
  ]

  const statePresets = [
    { label: t('form.states.presetNortheast'), states: ['NY', 'NJ', 'CT', 'MA', 'PA', 'VT', 'NH', 'ME', 'RI'] },
    { label: t('form.states.presetCaTx'), states: ['CA', 'TX'] },
  ]

  const docList: { key: string; label: string; required: boolean; hint: string; accept: string }[] = [
    { key: 'filing', label: t('form.documents.filing'), required: true, hint: t('form.documents.filingHint'), accept: '.pdf' },
    { key: 'rates', label: t('form.documents.rates'), required: true, hint: t('form.documents.ratesHint'), accept: '.pdf,.xlsx' },
    { key: 'guide', label: t('detail.training.guide'), required: true, hint: t('form.documents.guideHint'), accept: '.pdf' },
    { key: 'uwManual', label: t('form.documents.uwManual'), required: false, hint: t('form.documents.uwHint'), accept: '.pdf' },
    { key: 'training', label: t('detail.training.deck'), required: false, hint: t('form.documents.trainingHint'), accept: '.pdf,.pptx' },
  ]

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

  if (saved) return (
    <div className="flex-1 overflow-auto">
      <div style={{ maxWidth: 680, margin: '80px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '60px 40px' }}>
          <CheckCircle size={48} style={{ color: '#34C759', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>
            {productId ? t('form.feedback.updated') : t('form.feedback.created')}
          </div>
          <p style={{ fontSize: 14, color: '#717786' }}>{t('form.feedback.redirecting')}</p>
        </div>
      </div>
    </div>
  )

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
                onClick={onBackToList}
                style={{ padding: '8px', background: 'transparent', border: 'none' }}
              >
                <ChevronLeft size={20} />
              </button>
              <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#181C23', margin: 0 }}>
                {productId ? t('header.titleEdit', { productName: existing?.productName ?? '' }) : t('header.titleCreate')}
              </h1>
            </div>
            <p style={{ fontSize: '15px', color: '#717786' }}>
              {productId ? t('header.subtitleEdit') : t('header.subtitleCreate')}
            </p>
          </div>

          {/* Two Column Layout: Steps + Form */}
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Left: Vertical Steps */}
            <div style={{ width: '240px', flexShrink: 0 }}>
              <div className="glass-card rounded-xl" style={{ padding: '20px' }}>
                {stepLabels.map((label, idx) => {
                  const isActive = idx === currentStep
                  const isDone = stepDone(idx)
                  return (
                    <div
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        marginBottom: idx < stepLabels.length - 1 ? '8px' : 0,
                        borderRadius: '10px',
                        background: isActive
                          ? 'rgba(0, 88, 188, 0.08)'
                          : 'transparent',
                        border: isActive ? '1px solid rgba(0, 88, 188, 0.2)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isDone && !isActive
                          ? 'rgba(52,199,89,0.12)'
                          : isActive
                            ? 'rgba(0, 88, 188, 0.15)'
                            : 'rgba(247,248,250,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDone && !isActive ? '#34C759' : isActive ? '#0058BC' : '#9CA3AF'
                      }}>
                        {isDone && !isActive ? <CheckCircle size={16} /> : <span style={{ fontSize: 13 }}>{STEP_ICONS[idx].trim()}</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#0058BC' : isDone && !isActive ? '#34C759' : '#404757'
                        }}>
                          {label}
                        </div>
                        {isDone && !isActive && (
                          <div style={{ fontSize: '12px', color: '#34C759', marginTop: '2px' }}>
                            {t('form.feedback.stepDone')}
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
                      width: `${(doneCount / stepLabels.length) * 100}%`,
                      height: '100%',
                      background: '#34C759',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '8px', textAlign: 'center' }}>
                    {t('form.feedback.stepsProgress', { done: doneCount, total: stepLabels.length })}
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
                      {t('detail.info.basicTitle')}
                    </h2>

                    {/* Row 1: 产品全称 + 产品代码 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                      <Field label={t('fields.productName')} required>
                        <input
                          {...INPUT}
                          className="input-glass"
                          placeholder={t('fields.productNamePlaceholder')}
                          value={formData.productName}
                          onChange={e => updateField('productName', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </Field>
                      <Field label={t('fields.productCode')} required hint={t('fields.productCodeHint')}>
                        <input
                          {...INPUT}
                          className="input-glass"
                          placeholder="TRV-AUTO-001"
                          value={formData.productCode}
                          onChange={e => updateField('productCode', e.target.value)}
                          style={{ ...INPUT, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        />
                      </Field>

                      {/* Row 2: 承保保险公司 + 产品类型 */}
                      <Field label={t('sections.carrierRelation')} required>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.insurerId}
                          onChange={e => updateField('insurerId', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">{t('form.basic.selectInsurer')}</option>
                          <option value="c1001">Travelers</option>
                          <option value="c1002">Chubb</option>
                          <option value="c1005">State Farm</option>
                          <option value="c1006">The Hartford</option>
                          <option value="c1007">Allstate</option>
                          <option value="c1008">Progressive</option>
                        </select>
                      </Field>
                      <Field label={t('fields.productType')} required>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[
                            { value: 'Individual', label: t('values.typeIndividual') },
                            { value: 'Group', label: t('values.typeGroup') },
                            { value: 'VoluntaryBenefits', label: t('values.typeVoluntaryBenefits') },
                          ].map(opt => (
                            <label
                              key={opt.value}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 12px',
                                borderRadius: '9px',
                                border: `0.5px solid ${formData.type === opt.value ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                                background: formData.type === opt.value ? 'rgba(0, 88, 188, 0.08)' : 'rgba(255,255,255,0.6)',
                                cursor: 'pointer',
                                fontSize: '12.5px',
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
                      </Field>

                      {/* Row 3: 业务线 + 业务子线 */}
                      <Field label={t('fields.lineOfBusiness')} required>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.lineOfBusiness}
                          onChange={e => updateField('lineOfBusiness', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">{t('form.basic.selectLine')}</option>
                          <option value="AUTO">{t('values.lobAUTO')}</option>
                          <option value="HOME">{t('values.lobHOME')}</option>
                          <option value="LIFE">{t('values.lobLIFE')}</option>
                          <option value="HEALTH">{t('values.lobHEALTH')}</option>
                          <option value="COMMERCIAL">{t('values.lobCOMMERCIAL')}</option>
                          <option value="P&C">{t('values.lobP_C')}</option>
                        </select>
                      </Field>
                      <Field label={t('fields.subLine')} required>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.subLine}
                          onChange={e => updateField('subLine', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          <option value="">{t('fields.subLinePlaceholder')}</option>
                          <option value="Liability">{t('values.Liability')}</option>
                          <option value="Collision">{t('values.Collision')}</option>
                          <option value="Comprehensive">{t('values.Comprehensive')}</option>
                          <option value="Medical Payments">{t('values.Medical Payments')}</option>
                        </select>
                      </Field>
                    </div>

                    {/* Row 4: 产品描述 */}
                    <Field label={t('form.basic.description')}>
                      <textarea
                        className="input-glass"
                        style={{ width: '100%', minHeight: 88, padding: '14px', resize: 'vertical', fontSize: 13.5, border: '1px solid rgba(24,28,35,0.1)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                        placeholder={t('form.basic.descPlaceholder')}
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                      />
                    </Field>

                    {/* Row 5: 主要承保范围 */}
                    <Field label={t('detail.info.coverageTitle')} hint={t('form.basic.coverageHint')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {COVERAGE_KEYS.map(coverage => {
                          const isSelected = formData.coverages.includes(coverage)
                          return (
                            <label
                              key={coverage}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                background: isSelected ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                                border: `0.5px solid ${isSelected ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                                color: isSelected ? '#0058BC' : '#414755',
                              }}
                            >
                              <input type="checkbox" checked={isSelected} style={{ display: 'none' }}
                                onChange={() => toggleCoverage(coverage)} />
                              {isSelected && <CheckCircle size={11} />}
                              {coverageLabels[coverage]}
                            </label>
                          )
                        })}
                      </div>
                    </Field>
                  </>
                )}

                {currentStep === 1 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      {t('form.rates.configTitle')}
                    </h2>

                    {/* Row 1: 费率类型 */}
                    <Field label={t('form.rates.rateType')} required>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {rateTypeOptions.map(opt => (
                          <label
                            key={opt.val}
                            style={{
                              flex: 1,
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: `0.5px solid ${formData.rateType === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                              background: formData.rateType === opt.val ? 'rgba(0, 88, 188, 0.08)' : 'rgba(255,255,255,0.6)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input type="radio" name="rateType" checked={formData.rateType === opt.val} onChange={() => updateField('rateType', opt.val)} style={{ display: 'none' }} />
                            <div style={{ fontSize: '13.5px', fontWeight: 600, color: formData.rateType === opt.val ? '#0058BC' : '#181C23' }}>
                              {opt.label}
                            </div>
                            <div style={{ fontSize: '12px', color: '#717786', marginTop: 3 }}>
                              {opt.desc}
                            </div>
                          </label>
                        ))}
                      </div>
                    </Field>

                    {/* Row 2: 基础费率 + 最低保费 + 最高保费 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
                      <Field label={t('form.rates.baseRateAnnual')} required>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="1,200"
                            value={formData.baseRate}
                            onChange={e => updateField('baseRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                          />
                        </div>
                      </Field>
                      <Field label={t('detail.rates.minPremium')} required>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="480"
                            value={formData.minPremium}
                            onChange={e => updateField('minPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                          />
                        </div>
                      </Field>
                      <Field label={t('detail.rates.maxPremium')} required>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="4,200"
                            value={formData.maxPremium}
                            onChange={e => updateField('maxPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace" }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                          />
                        </div>
                      </Field>
                    </div>

                    {/* Row 3: 费率影响因子 */}
                    <Field label={t('detail.rates.ratingFactors')} hint={t('form.rates.factorsHint')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {FACTOR_KEYS.map(factor => {
                          const isSelected = formData.rateFactors.includes(factor)
                          return (
                            <label
                              key={factor}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                background: isSelected ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                                border: `0.5px solid ${isSelected ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                                color: isSelected ? '#0058BC' : '#414755',
                              }}
                            >
                              <input type="checkbox" checked={isSelected} style={{ display: 'none' }}
                                onChange={() => toggleFactor(factor)} />
                              {isSelected && <CheckCircle size={11} />}
                              {factorLabels[factor]}
                            </label>
                          )
                        })}
                      </div>
                    </Field>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: 6 }}>
                      {t('underwriting.title')}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#717786', marginBottom: '24px' }}>{t('form.underwriting.subtitle')}</p>

                    {/* 说明框 */}
                    <div style={{ background: 'rgba(255,149,0,0.06)', border: '0.5px solid rgba(255,149,0,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <AlertTriangle size={14} style={{ color: '#a05800' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t('form.underwriting.noteTitle')}</span>
                      </div>
                      <p style={{ fontSize: 12.5, color: '#7a5c00', margin: 0 }}>{t('form.underwriting.noteBody')}</p>
                    </div>

                    {/* 年龄范围 */}
                    <Field label={t('underwriting.ageRange')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, color: '#414755' }}>{t('underwriting.minAge')}</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            type="number"
                            min={0}
                            max={120}
                            value={formData.ageMin ?? ''}
                            onChange={e => updateField('ageMin', e.target.value === '' ? '' : parseInt(e.target.value))}
                            style={{ ...INPUT, width: 80, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}
                          />
                          <span style={{ fontSize: 13, color: '#717786' }}>{t('form.underwriting.years')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 13, color: '#414755' }}>{t('underwriting.maxAge')}</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            type="number"
                            min={0}
                            max={120}
                            value={formData.ageMax ?? ''}
                            onChange={e => updateField('ageMax', e.target.value === '' ? '' : parseInt(e.target.value))}
                            style={{ ...INPUT, width: 80, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace" }}
                          />
                          <span style={{ fontSize: 13, color: '#717786' }}>{t('form.underwriting.years')}</span>
                        </div>
                      </div>
                    </Field>

                    {/* 自动核保规则 */}
                    <Field label={t('form.underwriting.autoRules')}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          background: formData.excludeDUI ? 'rgba(186,26,26,0.05)' : 'rgba(255,255,255,0.6)',
                          border: `0.5px solid ${formData.excludeDUI ? 'rgba(186,26,26,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                          <input type="checkbox" checked={formData.excludeDUI ?? false} onChange={e => updateField('excludeDUI', e.target.checked)} style={{ accentColor: '#BA1A1A', marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t('underwriting.excludeDUI')} <span style={{ color: '#BA1A1A', fontSize: 12 }}>{t('form.underwriting.tagExclusion')}</span></div>
                            <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t('underwriting.excludeDUIHint')}</div>
                          </div>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                          background: formData.referHighValue ? 'rgba(255,149,0,0.05)' : 'rgba(255,255,255,0.6)',
                          border: `0.5px solid ${formData.referHighValue ? 'rgba(255,149,0,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                          <input type="checkbox" checked={formData.referHighValue ?? false} onChange={e => updateField('referHighValue', e.target.checked)} style={{ accentColor: '#FF9500', marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t('underwriting.referHighValue')} <span style={{ color: '#a05800', fontSize: 12 }}>{t('form.underwriting.tagReferral')}</span></div>
                            <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t('underwriting.referHighValueHint')}</div>
                            {formData.referHighValue && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                                <span style={{ fontSize: 13, color: '#414755' }}>{t('underwriting.thresholdAmount')}</span>
                                <div className="relative">
                                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                                  <input
                                    {...INPUT}
                                    className="input-glass"
                                    type="number"
                                    value={formData.referThreshold ?? ''}
                                    onChange={e => updateField('referThreshold', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                    style={{ ...INPUT, paddingLeft: 22, width: 140, fontFamily: "'JetBrains Mono', monospace" }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </Field>

                    {/* 核保黑名单条件 */}
                    <Field label={t('underwriting.blacklistConditions')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {blacklistOptions.map(condition => {
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
                                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                background: isSelected ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                                border: `0.5px solid ${isSelected ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                                color: isSelected ? '#0058BC' : '#414755',
                              }}
                            >
                              {isSelected && <CheckCircle size={11} />}
                              {condition.label}
                            </button>
                          )
                        })}
                      </div>
                    </Field>
                  </>
                )}

                {currentStep === 3 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: 8 }}>
                      {t('form.states.configTitle')}
                    </h2>

                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <p style={{ fontSize: 13, color: '#717786', margin: 0 }}>
                        {t('form.states.selectedLead')}<strong style={{ color: '#0058BC' }}>{formData.availableStates?.length || 0}</strong>{t('form.states.selectedTail')}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn-ghost" style={{ fontSize: 12.5 }}
                          onClick={() => updateField('availableStates', US_STATES)}>
                          {t('form.states.selectAll')}
                        </button>
                        <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}
                          onClick={() => updateField('availableStates', [])}>
                          {t('form.states.clearAll')}
                        </button>
                        {statePresets.map(p => (
                          <button key={p.label} className="btn-ghost" style={{ fontSize: 12.5 }}
                            onClick={() => updateField('availableStates', Array.from(new Set([...(formData.availableStates ?? []), ...p.states])))}>
                            +{p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 50 States Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                      gap: '7px'
                    }}>
                      {US_STATES.map(state => {
                        const isSelected = formData.availableStates?.includes(state)
                        return (
                          <div
                            key={state}
                            onClick={() => {
                              const current = new Set(formData.availableStates || [])
                              if (current.has(state)) current.delete(state)
                              else current.add(state)
                              updateField('availableStates', Array.from(current))
                            }}
                            style={{
                              padding: '8px 6px',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'center',
                              background: isSelected ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.5)',
                              border: `0.5px solid ${isSelected ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                              transition: 'all 100ms',
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isSelected ? '#0058BC' : '#717786' }}>{state}</div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Info Note */}
                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(0, 88, 188, 0.08)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                        <AlertTriangle size={18} style={{ color: '#0058BC', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: 13, color: '#0058BC' }}>
                          {t('warnings.stateApprovalRequired')}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 4 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: 8 }}>
                      {t('form.documents.title')}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#717786', marginBottom: '24px' }}>{t('form.documents.subtitle')}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {docList.map(doc => {
                        const uploaded = formData.uploadedFiles?.includes(doc.key)
                        return (
                          <div key={doc.key} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                            background: uploaded ? 'rgba(52,199,89,0.06)' : 'rgba(255,255,255,0.6)',
                            border: `0.5px solid ${uploaded ? 'rgba(52,199,89,0.25)' : 'rgba(193,198,215,0.4)'}`,
                          }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.12)' : 'rgba(241,243,254,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {uploaded ? <CheckCircle size={16} style={{ color: '#34C759' }} /> : <FileText size={16} style={{ color: '#717786' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>
                                {doc.label} {doc.required && <span style={{ color: '#BA1A1A' }}>*</span>}
                              </div>
                              <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{doc.hint} · {t('form.documents.supports', { accept: doc.accept })}</div>
                              {uploaded && <div style={{ fontSize: 12, color: '#34C759', marginTop: 2 }}>{t('form.documents.justUploaded', { name: doc.label })}</div>}
                            </div>
                            {uploaded
                              ? <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => updateField('uploadedFiles', (formData.uploadedFiles ?? []).filter(f => f !== doc.key))}>
                                  <X size={13} />{t('form.documents.remove')}
                                </button>
                              : <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={() => updateField('uploadedFiles', [...(formData.uploadedFiles ?? []), doc.key])}>
                                  <Upload size={13} />{t('form.documents.upload')}
                                </button>
                            }
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
                <button
                  className="icon-btn"
                  onClick={currentStep > 0 ? () => setCurrentStep(s => s - 1) : onBackToList}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#404757' }}
                >
                  <ChevronLeft size={16} />
                  <span>{currentStep > 0 ? t('navigation.previousStep') : t('actions.cancel')}</span>
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="action-btn"
                    onClick={handleSaveDraft}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Check size={16} />
                    <span>{t('header.saveDraft')}</span>
                  </button>
                  {currentStep < stepLabels.length - 1
                    ? <button
                        className="action-btn-primary"
                        onClick={() => setCurrentStep(s => s + 1)}
                        disabled={!stepDone(currentStep)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: stepDone(currentStep) ? 1 : 0.5, cursor: stepDone(currentStep) ? 'pointer' : 'not-allowed' }}
                      >
                        <span>{t('navigation.nextStep')}</span>
                        <ChevronRight size={16} />
                      </button>
                    : <button
                        className="action-btn-primary"
                        onClick={handleSubmit}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1a7a2e' }}
                      >
                        <CheckCircle size={16} />
                        <span>{productId ? t('header.saveChanges') : t('form.submitListing')}</span>
                      </button>
                  }
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
            <CheckCircle size={20} style={{ color: '#34C759' }} />
            <div style={{ fontSize: '14px', color: '#181C23', fontWeight: 500 }}>{toastMessage}</div>
            <button onClick={() => setShowToast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
              <XCircle size={16} style={{ color: '#9CA3AF' }} />
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
        .action-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
