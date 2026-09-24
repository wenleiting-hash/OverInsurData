// Product Form - Step-by-step wizard for creating/editing products (功能点 10-12)
// Synced with 设计原型V1.3 ProductForm: vertical step nav with per-step completion
// check + free jump, Field hint tooltips, rate-type cards, stable coverage/factor
// keys resolved to i18n, submission success card, then redirect back to the list

import { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft, ArrowLeft, ArrowRight, Send, AlertCircle, CheckCircle, Info, X,
  Upload, FileText, AlertTriangle, XCircle, Package, Shield, Globe, BookOpen, Eye, Loader,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useGetProduct, useCreateProduct, useUpdateProduct } from '@/services/productService'
import { useGetInsurers } from '@/services/insurerService'
import { dictionaryService, type DictTree } from '@/services/dictionaryService'
import { productApi } from '@/lib/user-api-client'
import type { ProductDocument } from '@/lib/user-api-client'

interface Props {
  productId?: string  // Edit mode has ID, create mode is undefined
  onBackToList: () => void
}

// 存量数据文件 coverages 值（PascalCase 展示名）→ 字典稳定 key 兼容层。
// 仅用于编辑回填归一化；动态选项与标签自 V1.0.18 起来自险种字典树（coverage-tree）。
const COVERAGE_BACKFILL: Record<string, string> = {
  Liability: 'liability',
  Comprehensive: 'comprehensive',
  Collision: 'collision',
  MedicalPayments: 'medical',
  UninsuredMotorist: 'um',
  RoadsideAssistance: 'roadside',
  VehicleReplacement: 'substitute',
  NewCarValue: 'newCarValue',
  DeductibleWaiver: 'deductibleWaiver',
}

/** 大小写无关解析表：历史种子数据存 PascalCase 展示名（"Liability"），字典稳定 key 是 camelCase（"liability"）。 */
const COVERAGE_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(COVERAGE_BACKFILL).map(([k, v]) => [k.toLowerCase(), v] as [string, string])
)

/** 历史值归一化：命中兼容层转稳定 key；未命中保留原值（未知项回显置灰，不可新增、可提交）。 */
const toCoverageKey = (v: unknown): string =>
  typeof v === 'string' ? (COVERAGE_LOOKUP[v.trim().toLowerCase()] ?? v.trim()) : ''

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

// PRD 3.2.3: 11 business lines。V1.0.18 起业务线/子险种选项来自险种字典树（coverage-tree），
// 本表仅作字典加载失败时的降级兜底（code → 提交口径大写，与存量 line_of_business 一致）。
const BUSINESS_LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'E&O', 'Marine', 'Specialty'] as const

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
  // Step 4: Compliance Documents — metadata persisted server-side (POST /api/uploads)
  documents?: ProductDocument[]
  // Step 0: 核保配置摘要（此前在 buildDto 里硬编码，详情页只能看到写死的 Auto/Guaranteed/1）
  underwritingMode: string
  renewalType: string
  policyTermYears: number | string
}

// 垂直步骤导航（左侧）：图标对齐原型 V1.5 STEPS（Package/FileText/Shield/Globe/BookOpen）
const STEP_ICONS = [Package, FileText, Shield, Globe, BookOpen]

// 产品文件步骤的必传文档 key（与 docList 中 required: true 的三项保持一致）
const REQUIRED_DOC_KEYS = ['filing', 'rates', 'guide']

/** 每个步骤的必填字段名（与 FormData 键同名），驱动 stepDone / 标红 / 提交校验三处逻辑。 */
const STEP_FIELDS: string[][] = [
  ['productName', 'productCode', 'insurerId', 'lineOfBusiness'],
  ['baseRate', 'minPremium', 'maxPremium'],
  ['ageMin', 'ageMax'],
  ['availableStates'],
  ['documents'],
]

/** 字段 → 所属步骤，用于只在被点名的那一步上标红。 */
const FIELD_STEP: Record<string, number> = Object.fromEntries(
  STEP_FIELDS.flatMap((fields, step) => fields.map(f => [f, step] as [string, number]))
)

// 核保模式 / 续保类型 / 保险期间可选项（PRD 3.2.1：自动/人工/MGA 委托；保证续保/有条件续保/定期不续保）
const UNDERWRITING_MODES = ['Auto', 'Manual', 'MGA'] as const
const RENEWAL_TYPES = ['Guaranteed', 'Conditional', 'NonRenewable'] as const
const TERM_YEARS = [1, 2, 3, 5, 10] as const

function Field({ label, required, hint, error, children }: { label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: error ? '#BA1A1A' : '#414755', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        {label}
        {required && <span style={{ color: '#BA1A1A' }}>*</span>}
        {hint && <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}><Info size={11} style={{ color: '#C1C6D7' }} /></span>}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} />{error}
        </div>
      )}
    </div>
  )
}

export default function ProductForm({ productId, onBackToList }: Props) {
  const { t, i18n } = useTranslation('product')
  const { t: tDict } = useTranslation('dict')
  const { data: apiProduct, isLoading: isLoadingProduct } = useGetProduct(productId ?? null)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { data: insurersResult } = useGetInsurers({ size: 100 })
  const insurers = insurersResult?.data ?? []

  // V1.0.18 险种字典：拉取联动树（仅启用项）。加载失败时降级内置 BUSINESS_LINES，
  // 子险种/承保范围则退化为空列表——不阻塞表单，仅失去联动。
  const [dictTree, setDictTree] = useState<DictTree | null>(null)
  useEffect(() => {
    dictionaryService.tree().then(r => setDictTree(r.data)).catch(() => {})
  }, [])

  const isZhLang = i18n.language?.startsWith('zh') ?? true
  const existing = apiProduct ? {
    productName: apiProduct.product_name,
    productCode: apiProduct.product_code,
    insurerId: apiProduct.carrier_id,
    type: apiProduct.product_type,
    lineOfBusiness: apiProduct.line_of_business,
    subLine: apiProduct.sub_line,
    description: apiProduct.description,
    coverages: apiProduct.coverages,
    rateType: apiProduct.rate_type,
    baseRate: apiProduct.base_rate,
    minPremium: apiProduct.min_premium,
    maxPremium: apiProduct.max_premium,
    rateFactors: apiProduct.rate_factors,
    effectiveDate: apiProduct.effective_date,
    expirationDate: apiProduct.expiration_date,
    ageMin: apiProduct.age_min,
    ageMax: apiProduct.age_max,
    excludeDUI: apiProduct.exclude_dui,
    referHighValue: apiProduct.refer_high_value,
    referThreshold: apiProduct.refer_threshold,
    blacklistConditions: apiProduct.blacklist_conditions,
    availableStates: apiProduct.available_states,
    documents: apiProduct.documents,
    underwritingMode: apiProduct.underwriting_mode,
    renewalType: apiProduct.renewal_type,
    policyTermYears: apiProduct.policy_term_years,
  } : undefined

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
    coverages: [],
    rateType: 'tiered',
    baseRate: '',
    minPremium: '',
    maxPremium: '',
    rateFactors: ['drivingRecord', 'vehicleType', 'creditScore'],
    effectiveDate: '',
    expirationDate: '',
    underwritingMode: 'Auto',
    renewalType: 'Guaranteed',
    policyTermYears: 1,
  })
  const [toastMessage, setToastMessage] = useState<string>('')
  const [showToast, setShowToast] = useState<boolean>(false)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [saveError, setSaveError] = useState<string | null>(null)
  // 逐步骤校验状态（对齐 InsurerForm）：errorStep 点名哪一步需要标红，submitError 是顶部横幅，
  // attemptedSubmit 让左侧步骤条对每个未完成步骤持续给出警示，录入后自动消失。
  const [errorStep, setErrorStep] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const [codeStatus, setCodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')

  // Load edit data when API data arrives (fix: depend on apiProduct, not productId)
  useEffect(() => {
    if (productId && existing) {
      setFormData(prev => ({
        ...prev,
        productName: existing.productName,
        productCode: existing.productCode,
        insurerId: existing.insurerId,
        type: existing.type ?? 'Individual',
        lineOfBusiness: existing.lineOfBusiness,
        subLine: existing.subLine || '',
        description: existing.description || '',
        coverages: Array.from(new Set((existing.coverages ?? []).map(toCoverageKey).filter(k => !!k))),
        rateType: existing.rateType === 'Flat' ? 'flat' : existing.rateType === 'UsageBased' ? 'usage' : 'tiered',
        baseRate: existing.baseRate ?? '',
        minPremium: existing.minPremium ?? '',
        maxPremium: existing.maxPremium ?? '',
        rateFactors: (existing.rateFactors ?? []).map(f => f.toLowerCase()),
        effectiveDate: existing.effectiveDate?.split('T')[0] || '',
        expirationDate: existing.expirationDate?.split('T')[0] || '',
        ageMin: existing.ageMin ?? '',
        ageMax: existing.ageMax ?? '',
        excludeDUI: existing.excludeDUI ?? false,
        referHighValue: existing.referHighValue ?? false,
        referThreshold: existing.referThreshold ?? '',
        blacklistConditions: existing.blacklistConditions ?? [],
        availableStates: existing.availableStates ?? [],
        documents: existing.documents ?? [],
        underwritingMode: existing.underwritingMode || 'Auto',
        renewalType: existing.renewalType || 'Guaranteed',
        policyTermYears: existing.policyTermYears ?? 1,
      }))
    }
  }, [apiProduct?.product_name])

  // 产品编码实时查重（防抖 500ms，对齐 InsurerForm 的 NAIC 查重）。编辑模式下编码未变则不查，
  // 并传 excludeId 避免自己撞自己。
  useEffect(() => {
    const code = formData.productCode.trim()
    if (!code) { setCodeStatus('idle'); return }
    if (productId && existing?.productCode === code) { setCodeStatus('idle'); return }
    setCodeStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await productApi.checkCode(code, productId)
        setCodeStatus(result.available ? 'available' : 'taken')
      } catch { setCodeStatus('idle') }
    }, 500)
    return () => clearTimeout(timer)
  }, [formData.productCode])

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  /** 字段是否已录入。数值字段用 !== '' 判定，避免 0 被当成未填。 */
  const fieldFilled = (k: string): boolean => {
    switch (k) {
      case 'productName': return !!formData.productName.trim()
      case 'productCode': return !!formData.productCode.trim()
      case 'insurerId': return !!formData.insurerId
      case 'lineOfBusiness': return !!formData.lineOfBusiness
      case 'baseRate': return formData.baseRate !== '' && formData.baseRate !== undefined
      case 'minPremium': return formData.minPremium !== '' && formData.minPremium !== undefined
      case 'maxPremium': return formData.maxPremium !== '' && formData.maxPremium !== undefined
      case 'ageMin': return formData.ageMin !== '' && formData.ageMin !== undefined
      case 'ageMax': return formData.ageMax !== '' && formData.ageMax !== undefined
      case 'availableStates': return (formData.availableStates?.length ?? 0) > 0
      case 'documents': return REQUIRED_DOC_KEYS.every(dk => (formData.documents ?? []).some(d => d.key === dk))
      default: return true
    }
  }

  const missingFields = (i: number) => (STEP_FIELDS[i] ?? []).filter(k => !fieldFilled(k))

  /** 被点名的那一步上、仍未录入的字段才标红；录入后红框自动消失。 */
  const hasErr = (k: string) => errorStep !== null && FIELD_STEP[k] === errorStep && !fieldFilled(k)

  const errBorder = (k: string): React.CSSProperties =>
    hasErr(k) ? { borderColor: '#BA1A1A', background: 'rgba(186,26,26,0.04)' } : {}

  const onFieldFocus = (k: string) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = hasErr(k) ? '#BA1A1A' : '#0058BC'
  }
  const onFieldBlur = (k: string) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = hasErr(k) ? '#BA1A1A' : 'rgba(24,28,35,0.1)'
  }

  // ── Step 4 real file upload ──
  // A single hidden <input type="file"> is shared by all doc slots; uploadTargetDocKey records
  // which slot triggered it so the returned metadata is stored against the right key.
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadTargetDocKey, setUploadTargetDocKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null)

  /** Upload the picked file to POST /api/uploads, then persist the returned metadata into formData.documents. */
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // reset so the same file can be picked again after a failure
    if (!file || !uploadTargetDocKey) return
    const key = uploadTargetDocKey
    setUploadingKey(key)
    try {
      const meta = await productApi.uploadDocument(file)
      // setFormData (not updateField) to avoid a stale formData.documents closure
      setFormData(prev => ({
        ...prev,
        documents: [
          ...(prev.documents ?? []).filter(d => d.key !== key),
          { key, name: meta.originalName, size: meta.size, url: meta.url, mimetype: meta.mimetype },
        ],
      }))
    } catch (err: any) {
      const raw = err?.response?.data?.message
      const detail = Array.isArray(raw) ? raw.join('; ') : (typeof raw === 'string' ? raw : '')
      showToastMessage(detail || t('form.documents.uploadFailed'), 'error')
    } finally {
      setUploadingKey(null)
      setUploadTargetDocKey(null)
    }
  }

  const removeDocument = (key: string) => {
    setFormData(prev => ({ ...prev, documents: (prev.documents ?? []).filter(d => d.key !== key) }))
  }

  const closePreviewDoc = () => setPreviewDoc(null)

  /** Open the shared file picker for a slot. accept is set imperatively because setState is async
   *  and click() runs in the same tick — otherwise the picker would use the previous slot's filter. */
  const openFilePicker = (key: string, accept: string) => {
    setUploadTargetDocKey(key)
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept
      fileInputRef.current.click()
    }
  }

  const fmtSize = (bytes: number) =>
    bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

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

  const showToastMessage = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  // Per-step completion check (原型 stepDone) — 完全由 STEP_FIELDS + fieldFilled 推导，
  // 与提交校验/标红共用同一份定义，不会出现“已标红但仍算完成”的不一致。
  const stepDone = (i: number) => missingFields(i).length === 0

  /** 用户主动切步骤（上一步/下一步/点左侧步骤）时清除校验提示，对齐 InsurerForm 的 goToStep。 */
  const goToStep = (i: number) => {
    setCurrentStep(i)
    setErrorStep(null)
    setSubmitError(null)
  }

  /** 数值字段→ DTO：0 是合法值，不能用真值判定丢掉（原来 ageMin=0 / baseRate=0 会被当成未填）。 */
  const numOrUndef = (v: number | string | undefined) =>
    v === '' || v === undefined || v === null ? undefined : Number(v)

  // Build DTO from form data (submit)
  const buildDto = () => ({
    carrier_id: formData.insurerId,
    product_name: formData.productName.trim(),
    product_code: formData.productCode.trim(),
    line_of_business: formData.lineOfBusiness,
    sub_line: formData.subLine || undefined,
    product_type: formData.type,
    description: formData.description || undefined,
    coverages: formData.coverages,
    rate_type: formData.rateType === 'flat' ? 'Flat' : formData.rateType === 'usage' ? 'UsageBased' : 'Tiered',
    base_rate: numOrUndef(formData.baseRate),
    min_premium: numOrUndef(formData.minPremium),
    max_premium: numOrUndef(formData.maxPremium),
    rate_factors: formData.rateFactors,
    effective_date: formData.effectiveDate ? new Date(formData.effectiveDate).toISOString() : new Date().toISOString(),
    expiration_date: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : undefined,
    age_min: numOrUndef(formData.ageMin),
    age_max: numOrUndef(formData.ageMax),
    exclude_dui: formData.excludeDUI ?? false,
    refer_high_value: formData.referHighValue ?? false,
    refer_threshold: numOrUndef(formData.referThreshold),
    blacklist_conditions: formData.blacklistConditions,
    available_states: formData.availableStates,
    documents: formData.documents,
    underwriting_mode: formData.underwritingMode || 'Auto',
    renewal_type: formData.renewalType || 'Guaranteed',
    policy_term_years: numOrUndef(formData.policyTermYears) ?? 1,
    // 编辑时不回写上架状态：否则把一个已暂停/已停售的产品“保存修改”会静默改回 Active。
    ...(productId ? {} : { status: 'Active', is_active: true }),
  })

  /** 校验指定步骤；缺字段就标红 + 弹横幅并返回 false。 */
  const validateStep = (i: number, message: string) => {
    if (missingFields(i).length === 0) return true
    setErrorStep(i)
    setSubmitError(message)
    return false
  }

  const stepErrorMsg = [
    t('form.errors.missingBasic'),
    t('form.errors.missingRates'),
    t('form.errors.missingUnderwriting'),
    t('form.errors.missingStates'),
    t('form.errors.missingDocuments'),
  ]

  /** “下一步”不再静默 disabled（原来用户以为按钮坏了）：本步未录齐就就地标红 + 提示，录齐就跳转。 */
  const handleNext = () => {
    if (!validateStep(currentStep, stepErrorMsg[currentStep])) return
    // 编码已被占用时不让人带着必失败的表单往后走
    if (currentStep === 0 && codeStatus === 'taken') {
      setErrorStep(0)
      setSubmitError(t('form.errors.codeDuplicate'))
      return
    }
    goToStep(currentStep + 1)
  }

  const handleSubmit = () => {
    setSaveError(null)
    // 逐步检查，定位第一个不完整的步骤并跳过去（对齐 InsurerForm）；
    // 同时置 attemptedSubmit 让左侧步骤条对每个未完成步骤给出警示。
    const firstIncomplete = stepLabels.findIndex((_, i) => !stepDone(i))
    if (firstIncomplete !== -1) {
      setAttemptedSubmit(true)
      setCurrentStep(firstIncomplete)
      setErrorStep(firstIncomplete)
      setSubmitError(t('form.errors.enterData'))
      showToastMessage(t('form.errors.enterData'), 'error')
      return
    }
    if (codeStatus === 'taken') {
      setAttemptedSubmit(true)
      setCurrentStep(0)
      setErrorStep(0)
      setSubmitError(t('form.errors.codeDuplicate'))
      showToastMessage(t('form.errors.codeDuplicate'), 'error')
      return
    }
    setAttemptedSubmit(false)
    setErrorStep(null)
    setSubmitError(null)
    const dto = buildDto()
    // 成功：toast 提示并返回列表；失败：弹出后端错误信息
    // （此前仅有 onSuccess、无 onError，导致保存失败时按钮从"提交中"恢复后静默无响应）
    const onSuccess = () => {
      setSaved(true)
      showToastMessage(productId ? t('form.feedback.updated') : t('form.feedback.created'), 'success')
      setTimeout(onBackToList, 1200)
    }
    const onError = (err: any) => {
      const data = err?.response?.data
      const raw = data?.message
      const detail = Array.isArray(raw) ? raw.join('; ') : (typeof raw === 'string' ? raw : '')
      // 409 产品编码重复：后端已给出 field，直接把红框打到编码输入框上
      if (err?.response?.status === 409 && data?.field === 'product_code') {
        setCodeStatus('taken')
        setCurrentStep(0)
        setErrorStep(0)
      }
      const msg = detail ? t('form.feedback.saveFailedDetail', { detail }) : t('form.feedback.saveFailed')
      setSaveError(msg)
      setSubmitError(msg)
      showToastMessage(msg, 'error')
    }
    if (productId) {
      updateProduct.mutate({ id: productId, dto }, { onSuccess, onError })
    } else {
      createProduct.mutate(dto, { onSuccess, onError })
    }
  }

  const stepLabels = [
    t('steps.basicInfo.label'),
    t('steps.rates.label'),
    t('steps.underwriting.label'),
    t('steps.states.label'),
    t('steps.documents.label'),
  ]

  // 提交中状态（对齐 InsurerForm 的 isSubmitting，用于禁用提交按钮）
  const isSubmitting = createProduct.isPending || updateProduct.isPending

  // ── V1.0.18 险种字典联动 ────────────────────────────────────────────
  // formData.lineOfBusiness 存提交口径（大写），字典 code 首字母大写 → UPPER 比较
  const toLobVal = (code: string) => code.toUpperCase().replace('&', '_')
  const selDictLine = dictTree?.lines.find(l => toLobVal(l.code) === formData.lineOfBusiness) ?? null
  const dictCovs = dictTree?.allCoverages ?? []
  const fallbackCovs: { code: string; nameZh: string; nameEn: string }[] =
    Object.values(COVERAGE_BACKFILL).map(code => ({ code, nameZh: '', nameEn: '' }))
  // 承保范围随业务线联动：选中业务线 → 该业务线关联项（空就是空，不兜底全量）；
  // 未选业务线 → 空（联动：先选业务线）；字典未加载 → 内置兼容层降级
  const availableCoverages = dictTree
    ? (selDictLine?.coverages ?? [])
    : fallbackCovs
  // 业务线选项：字典优先，字典未加载时降级内置表（label 走 values.lob* i18n）
  const lineOptions: { code: string; nameZh: string; nameEn: string }[] = dictTree?.lines?.length
    ? dictTree.lines
    : BUSINESS_LINES.map(code => ({ code, nameZh: '', nameEn: '' }))
  // 标签：字典 nameZh/nameEn → product.detail.info.* → 原始 key
  const covLabel = (key: string): string => {
    const hit = dictCovs.find(c => c.code.toLowerCase() === key.toLowerCase())
    if (hit) return isZhLang ? hit.nameZh : hit.nameEn
    return t(`detail.info.${key}`, { defaultValue: '' }) || key
  }
  // 历史值（已停用/未知项）回显置灰后缀：可提交、不可新增
  const disabledSuffix = isZhLang ? `（${tDict('status.disabled')}）` : ` (${tDict('status.disabled')})`

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
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
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
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#181C23', margin: 0 }}>
                {productId ? t('header.titleEdit', { productName: existing?.productName ?? '' }) : t('header.titleCreate')}
              </h1>
            </div>
            <p style={{ fontSize: '13px', color: '#717786' }}>
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
                  const StepIcon = STEP_ICONS[idx]
                  // 提交/下一步失败后，未完成的步骤持续给出琥珀色警示；录入齐全后自动消失
                  const warn = attemptedSubmit && !isDone
                  return (
                    <div
                      key={idx}
                      onClick={() => goToStep(idx)}
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
                        background: isActive
                          ? 'rgba(0, 88, 188, 0.15)'
                          : isDone
                            ? 'rgba(52,199,89,0.12)'
                            : warn
                              ? 'rgba(255,149,0,0.14)'
                              : 'rgba(247,248,250,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isActive ? '#0058BC' : isDone ? '#34C759' : warn ? '#a05800' : '#9CA3AF'
                      }}>
                        {/* 当前步骤只要已录齐就立即打勾——此前 isDone && !isActive 导致最后一步（产品文件）
                            上传完也永远停在蓝色激活态，看起来像没生效 */}
                        {isDone
                          ? <CheckCircle size={16} style={{ color: '#34C759' }} />
                          : warn
                            ? <AlertCircle size={16} />
                            : <StepIcon size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? '#0058BC' : isDone ? '#34C759' : warn ? '#a05800' : '#404757'
                        }}>
                          {label}
                        </div>
                        {isDone && (
                          <div style={{ fontSize: '12px', color: '#34C759', marginTop: '2px' }}>
                            {t('form.feedback.stepDone')}
                          </div>
                        )}
                        {warn && (
                          <div style={{ fontSize: '12px', color: '#a05800', marginTop: '2px' }}>
                            {t('form.feedback.stepIncomplete')}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right: Form Content */}
            <div style={{ flex: 1 }}>
              <div className="glass-card rounded-xl" style={{ padding: '28px' }}>
                {/* 校验/保存失败横幅（此前 saveError 只写进了 state、从未渲染，用户只能看到 3 秒就消失的 toast） */}
                {submitError && (
                  <div style={{
                    marginBottom: 20, padding: '12px 16px', borderRadius: 12,
                    background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <AlertCircle size={16} style={{ color: '#BA1A1A', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#BA1A1A', wordBreak: 'break-word' }}>{submitError}</span>
                    <button
                      onClick={() => { setSubmitError(null); setErrorStep(null) }}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#BA1A1A', fontSize: 13, padding: 0, flexShrink: 0 }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                {currentStep === 0 && (
                  <>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#181C23', marginBottom: '24px' }}>
                      {t('detail.info.basicTitle')}
                    </h2>

                    {/* Row 1: 产品全称 + 产品代码 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                      <Field label={t('fields.productName')} required error={hasErr('productName') ? t('form.errors.fieldRequired') : undefined}>
                        <input
                          {...INPUT}
                          className="input-glass"
                          placeholder={t('fields.productNamePlaceholder')}
                          value={formData.productName}
                          onChange={e => updateField('productName', e.target.value)}
                          style={errBorder('productName')}
                          onFocus={onFieldFocus('productName')}
                          onBlur={onFieldBlur('productName')}
                        />
                      </Field>
                      <Field label={t('fields.productCode')} required hint={t('fields.productCodeHint')} error={hasErr('productCode') ? t('form.errors.fieldRequired') : undefined}>
                        <div className="relative">
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="TRV-AUTO-001"
                            value={formData.productCode}
                            onChange={e => updateField('productCode', e.target.value)}
                            style={{ ...INPUT, textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", paddingRight: codeStatus !== 'idle' ? 34 : undefined, ...errBorder('productCode'), ...(codeStatus === 'taken' ? { borderColor: '#BA1A1A', background: 'rgba(186,26,26,0.04)' } : {}), ...(codeStatus === 'available' ? { borderColor: '#34C759', background: 'rgba(52,199,89,0.04)' } : {}) }}
                            onFocus={onFieldFocus('productCode')}
                            onBlur={onFieldBlur('productCode')}
                          />
                          {codeStatus !== 'idle' && (
                            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                              {codeStatus === 'checking' && <Loader size={15} style={{ color: '#717786', animation: 'spin 1s linear infinite' }} />}
                              {codeStatus === 'available' && <CheckCircle size={15} style={{ color: '#34C759' }} />}
                              {codeStatus === 'taken' && <AlertCircle size={15} style={{ color: '#BA1A1A' }} />}
                            </div>
                          )}
                        </div>
                        {codeStatus === 'taken' && (
                          <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={11} />{t('form.errors.codeDuplicate')}
                          </div>
                        )}
                        {codeStatus === 'available' && (
                          <div style={{ fontSize: 11.5, color: '#34C759', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={11} />{t('form.errors.codeAvailable')}
                          </div>
                        )}
                      </Field>

                      {/* Row 2: 承保保险公司 + 产品类型 */}
                      <Field label={t('sections.carrierRelation')} required error={hasErr('insurerId') ? t('form.errors.fieldRequired') : undefined}>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.insurerId}
                          onChange={e => updateField('insurerId', e.target.value)}
                          style={errBorder('insurerId')}
                          onFocus={onFieldFocus('insurerId')}
                          onBlur={onFieldBlur('insurerId')}
                        >
                          <option value="">{t('form.basic.selectInsurer')}</option>
                          {insurers.map(ins => (
                            <option key={ins.carrier_id || ins.id} value={ins.carrier_id || ins.id}>
                              {ins.carrier_name} ({ins.naic_code})
                            </option>
                          ))}
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

                      {/* Row 3: 业务线 + 业务子线 (PRD 3.2.3: 11 LOB + sub-line linkage) */}
                      <Field label={t('fields.lineOfBusiness')} required error={hasErr('lineOfBusiness') ? t('form.errors.fieldRequired') : undefined}>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.lineOfBusiness}
                          onChange={e => { updateField('lineOfBusiness', e.target.value); updateField('subLine', '') }}
                          style={errBorder('lineOfBusiness')}
                          onFocus={onFieldFocus('lineOfBusiness')}
                          onBlur={onFieldBlur('lineOfBusiness')}
                        >
                          <option value="">{t('form.basic.selectLine')}</option>
                          {lineOptions.map(l => {
                            const val = toLobVal(l.code)
                            // 标签优先字典 nameZh/nameEn，字典未命中时回退 values.lob* i18n
                            return <option key={l.code} value={val}>{(isZhLang ? l.nameZh : l.nameEn) || t(`values.lob${val}`, l.code)}</option>
                          })}
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
                          {(selDictLine?.subLines ?? []).map(s => (
                            // 标签优先字典 nameZh/nameEn，未命中降级 values.* 查表（与详情页/列表页同一口径）
                            <option key={s.code} value={s.code}>{(isZhLang ? s.nameZh : s.nameEn) || t(`values.${s.code}`, s.code)}</option>
                          ))}
                          {/* 历史值回显：已停用/未收录的子险种置灰展示，可提交、不可新增 */}
                          {(() => {
                            const subs = selDictLine?.subLines ?? []
                            const legacy = formData.subLine && !subs.some(s => s.code === formData.subLine) ? formData.subLine : ''
                            return legacy ? (
                              <option value={legacy} style={{ color: '#9AA0AE' }}>{t(`values.${legacy}`, legacy)}{disabledSuffix}</option>
                            ) : null
                          })()}
                        </select>
                      </Field>
                    </div>

                    {/* Row 4: 核保模式 + 续保类型 + 最长保险期间
                        （详情页的这三个字段此前由 buildDto 硬编码写入，用户无处可改） */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 24px' }}>
                      <Field label={t('fields.underwritingMode')} required hint={t('form.basic.uwModeHint')}>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.underwritingMode}
                          onChange={e => updateField('underwritingMode', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          {UNDERWRITING_MODES.map(m => (
                            <option key={m} value={m}>{t(`values.underwriting${m}`, m)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t('fields.renewalType')} required hint={t('form.basic.renewalHint')}>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={formData.renewalType}
                          onChange={e => updateField('renewalType', e.target.value)}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          {RENEWAL_TYPES.map(r => (
                            <option key={r} value={r}>{t(`values.renewal${r}`, r)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t('fields.policyTermYears')} required hint={t('form.basic.termHint')}>
                        <select
                          {...INPUT}
                          className="input-glass"
                          value={String(formData.policyTermYears)}
                          onChange={e => updateField('policyTermYears', parseInt(e.target.value, 10))}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0058BC'}
                          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(24,28,35,0.1)'}
                        >
                          {TERM_YEARS.map(y => (
                            <option key={y} value={y}>{y} {t('form.basic.termYearUnit')}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    {/* Row 5: 产品描述 */}
                    <Field label={t('form.basic.description')}>
                      <textarea
                        className="input-glass"
                        style={{ width: '100%', minHeight: 88, padding: '14px', resize: 'vertical', fontSize: 13.5, border: '1px solid rgba(24,28,35,0.1)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                        placeholder={t('form.basic.descPlaceholder')}
                        value={formData.description}
                        onChange={e => updateField('description', e.target.value)}
                      />
                    </Field>

                    {/* Row 6: 主要承保范围（随业务线联动，未配置关联则空） */}
                    <Field label={t('detail.info.coverageTitle')} hint={t('form.basic.coverageHint')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(() => {
                          const availKeys = availableCoverages.map(c => c.code)
                          // 已选但不在当前可选列表的历史值 → 置灰回显（可取消勾选，不可重新勾选）
                          const legacyKeys = formData.coverages.filter(k => !availKeys.some(a => a.toLowerCase() === k.toLowerCase()))
                          if (availableCoverages.length === 0 && legacyKeys.length === 0) {
                            return (
                              <span style={{ fontSize: 13, color: '#9aa3b2' }}>
                                {t('form.basic.coverageEmpty')}
                              </span>
                            )
                          }
                          return (
                            <>
                              {availableCoverages.map(c => {
                                const isSelected = formData.coverages.includes(c.code)
                                return (
                                  <label
                                    key={c.code}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                      background: isSelected ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                                      border: `0.5px solid ${isSelected ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                                      color: isSelected ? '#0058BC' : '#414755',
                                    }}
                                  >
                                    <input type="checkbox" checked={isSelected} style={{ display: 'none' }}
                                      onChange={() => toggleCoverage(c.code)} />
                                    {isSelected && <CheckCircle size={11} />}
                                    {(isZhLang ? c.nameZh : c.nameEn) || covLabel(c.code)}
                                  </label>
                                )
                              })}
                              {legacyKeys.map(k => (
                                <label
                                  key={k}
                                  title={tDict('matrix.coverageDisabled')}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                                    background: 'rgba(113,119,134,0.08)',
                                    border: '0.5px dashed rgba(113,119,134,0.45)',
                                    color: '#717786', opacity: 0.75,
                                  }}
                                >
                                  <input type="checkbox" checked style={{ display: 'none' }}
                                    onChange={() => toggleCoverage(k)} />
                                  <CheckCircle size={11} />
                                  {covLabel(k)}{disabledSuffix}
                                </label>
                              ))}
                            </>
                          )
                        })()}
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
                      <Field label={t('form.rates.baseRateAnnual')} required error={hasErr('baseRate') ? t('form.errors.fieldRequired') : undefined}>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="1,200"
                            value={formData.baseRate}
                            onChange={e => updateField('baseRate', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace", ...errBorder('baseRate') }}
                            onFocus={onFieldFocus('baseRate')}
                            onBlur={onFieldBlur('baseRate')}
                          />
                        </div>
                      </Field>
                      <Field label={t('detail.rates.minPremium')} required error={hasErr('minPremium') ? t('form.errors.fieldRequired') : undefined}>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="480"
                            value={formData.minPremium}
                            onChange={e => updateField('minPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace", ...errBorder('minPremium') }}
                            onFocus={onFieldFocus('minPremium')}
                            onBlur={onFieldBlur('minPremium')}
                          />
                        </div>
                      </Field>
                      <Field label={t('detail.rates.maxPremium')} required error={hasErr('maxPremium') ? t('form.errors.fieldRequired') : undefined}>
                        <div className="relative">
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                          <input
                            {...INPUT}
                            className="input-glass"
                            placeholder="4,200"
                            value={formData.maxPremium}
                            onChange={e => updateField('maxPremium', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            style={{ ...INPUT, paddingLeft: 22, fontFamily: "'JetBrains Mono', monospace", ...errBorder('maxPremium') }}
                            onFocus={onFieldFocus('maxPremium')}
                            onBlur={onFieldBlur('maxPremium')}
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
                    <Field label={t('underwriting.ageRange')} error={(hasErr('ageMin') || hasErr('ageMax')) ? t('form.errors.fieldRequired') : undefined}>
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
                            style={{ ...INPUT, width: 80, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", ...errBorder('ageMin') }}
                            onFocus={onFieldFocus('ageMin')}
                            onBlur={onFieldBlur('ageMin')}
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
                            style={{ ...INPUT, width: 80, textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", ...errBorder('ageMax') }}
                            onFocus={onFieldFocus('ageMax')}
                            onBlur={onFieldBlur('ageMax')}
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

                    {/* 未选任何可售州时的就地警示（对齐其他步骤的标红行为） */}
                    {hasErr('availableStates') && (
                      <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={14} style={{ color: '#BA1A1A', flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: '#BA1A1A' }}>{t('form.errors.missingStates')}</span>
                      </div>
                    )}

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

                    {/* Info Note —— 原文案「每个州均需单独获得监管批准」属于审批语义，本系统无审批流程，改为纯销售范围说明 */}
                    <div style={{ marginTop: 24, padding: 16, background: 'rgba(0, 88, 188, 0.08)', borderRadius: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'start', gap: 10 }}>
                        <AlertTriangle size={18} style={{ color: '#0058BC', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ fontSize: 13, color: '#0058BC' }}>
                          {t('warnings.stateScopeNote')}
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

                    {/* 必传材料缺失时的就地警示（问题1：编辑页保存修改也要给出提示并标红） */}
                    {hasErr('documents') && (
                      <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={14} style={{ color: '#BA1A1A', flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: '#BA1A1A' }}>{t('form.errors.missingDocuments')}</span>
                      </div>
                    )}

                    {/* Shared hidden real file input — accept is set imperatively per slot before click() */}
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {docList.map(doc => {
                        const uploadedDoc = (formData.documents ?? []).find(d => d.key === doc.key)
                        const isUploading = uploadingKey === doc.key
                        // 提交/下一步被挡下后，仍缺文件的必传项标红；上传完红框自动消失
                        const missing = errorStep === 4 && doc.required && !uploadedDoc
                        return (
                          <div key={doc.key} style={{
                            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                            background: uploadedDoc ? 'rgba(52,199,89,0.06)' : missing ? 'rgba(186,26,26,0.04)' : 'rgba(255,255,255,0.6)',
                            border: `0.5px solid ${uploadedDoc ? 'rgba(52,199,89,0.25)' : missing ? 'rgba(186,26,26,0.45)' : 'rgba(193,198,215,0.4)'}`,
                          }}>
                            <div style={{ width: 36, height: 36, borderRadius: 9, background: uploadedDoc ? 'rgba(52,199,89,0.12)' : missing ? 'rgba(186,26,26,0.10)' : 'rgba(241,243,254,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {uploadedDoc ? <CheckCircle size={16} style={{ color: '#34C759' }} /> : missing ? <AlertCircle size={16} style={{ color: '#BA1A1A' }} /> : <FileText size={16} style={{ color: '#717786' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 500, color: missing ? '#BA1A1A' : '#181C23' }}>
                                {doc.label} {doc.required && <span style={{ color: '#BA1A1A' }}>*</span>}
                              </div>
                              <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{doc.hint} · {t('form.documents.supports', { accept: doc.accept })}</div>
                              {isUploading && <div style={{ fontSize: 12, color: '#0058BC', marginTop: 2 }}>{t('form.documents.uploading')}</div>}
                              {missing && !isUploading && (
                                <div style={{ fontSize: 12, color: '#BA1A1A', marginTop: 2 }}>{t('form.errors.fieldRequired')}</div>
                              )}
                              {uploadedDoc && !isUploading && (
                                <div style={{ fontSize: 12, color: '#34C759', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {uploadedDoc.name} · {fmtSize(uploadedDoc.size)}
                                </div>
                              )}
                            </div>
                            {uploadedDoc ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                <button className="btn-ghost" style={{ fontSize: 12.5, color: '#0058BC' }} onClick={() => setPreviewDoc({ url: uploadedDoc.url, name: uploadedDoc.name })}>
                                  <Eye size={13} />{t('form.documents.preview')}
                                </button>
                                <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => removeDocument(doc.key)}>
                                  <X size={13} />{t('form.documents.remove')}
                                </button>
                              </div>
                            ) : (
                              <button className="btn-secondary" style={{ fontSize: 12.5, flexShrink: 0, opacity: isUploading ? 0.6 : 1 }} disabled={isUploading} onClick={() => openFilePicker(doc.key, doc.accept)}>
                                <Upload size={13} />{isUploading ? t('form.documents.uploading') : t('form.documents.upload')}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

              {/* Footer Actions — 置于白色卡片内部（对齐原型/InsurerForm）：上一步 btn-secondary、下一步/提交上架 btn-primary */}
              <div className="flex items-center justify-between" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
                <button
                  className="btn-secondary"
                  disabled={currentStep === 0}
                  onClick={() => goToStep(currentStep - 1)}
                  style={{ fontSize: 13, opacity: currentStep === 0 ? 0.4 : 1 }}
                >
                  <ArrowLeft size={14} />{t('navigation.previousStep')}
                </button>

                <div style={{ fontSize: 12.5, color: '#717786' }}>
                  {t('navigation.stepCount', { current: currentStep + 1, total: stepLabels.length })}
                </div>

                {currentStep < stepLabels.length - 1
                  ? <button
                      className="btn-primary"
                      style={{ fontSize: 13 }}
                      onClick={handleNext}
                    >
                      {t('navigation.nextStep')} <ArrowRight size={14} />
                    </button>
                  : <button
                      className="btn-primary"
                      disabled={isSubmitting}
                      style={{ fontSize: 13, opacity: isSubmitting ? 0.6 : 1 }}
                      onClick={handleSubmit}
                    >
                      {isSubmitting
                        ? <>{t('navigation.submitting')}</>
                        : <><Send size={14} />{productId ? t('header.saveChanges') : t('form.submitListing')}</>}
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
            {toastType === 'success'
              ? <CheckCircle size={20} style={{ color: '#34C759' }} />
              : <AlertCircle size={20} style={{ color: '#BA1A1A' }} />}
            <div style={{ fontSize: '14px', color: toastType === 'success' ? '#181C23' : '#BA1A1A', fontWeight: 500 }}>{toastMessage}</div>
            <button onClick={() => setShowToast(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: '0' }}>
              <XCircle size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
      )}

      {/* Uploaded document preview modal — served statically from the backend at /uploads/<storedName> */}
      {previewDoc && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ width: '85vw', height: '85vh', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.9)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewDoc.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Non-inline types (xlsx/pptx) cannot render in an iframe — offer a direct open/download */}
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12.5, color: '#0058BC' }}>
                  <Upload size={13} style={{ transform: 'rotate(180deg)' }} />{t('form.documents.download')}
                </a>
                <button onClick={closePreviewDoc} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                  <X size={18} style={{ color: '#717786' }} />
                </button>
              </div>
            </div>
            <iframe src={previewDoc.url} style={{ flex: 1, border: 'none' }} title={previewDoc.name} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
      `}</style>
    </div>
  )
}
