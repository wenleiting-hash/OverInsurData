// Product Detail View - One-stop product information display (功能点 10-14)
// Synced with 设计原型V1.3 ProductDetail: header card + KPI strip + 6 tabs
// (info / rate plans / salable states / underwriting rules / training materials / performance)
// Status change wires through ProductStatusModal with session-memory state

import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Edit2, ToggleRight, Download, Plus, Shield,
  CheckCircle, Upload, FileText, BookOpen, Video,
  TrendingUp, TrendingDown, Star, Globe, MapPin,
  ChevronRight, BarChart2, AlertCircle, XCircle, MoreHorizontal, Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import ProductStatusModal from '@/components/ProductStatusModal'
import AddUnderwritingRuleModal from '@/components/AddUnderwritingRuleModal'
import UploadTrainingMaterialModal from '@/components/UploadTrainingMaterialModal'
import AddRatePlanModal from '@/components/AddRatePlanModal'
import { formatCurrency, formatPercent } from './data/mockProductData'
import {
  useGetProduct, useToggleProductStatus,
  useGetRatePlans, useGetProductStates, useGetUnderwritingRules,
  useGetTrainingMaterials, useGetProductPerformance,
  useCreateUnderwritingRule, useCreateTrainingMaterial,
  useUpdateUnderwritingRule, useSetRuleStatus, useDeleteUnderwritingRule,
  useSetMaterialStatus, useDeleteTrainingMaterial,
  useCreateRatePlan, useUpdateRatePlan, useDeleteRatePlan,
} from '@/services/productService'
import type {
  RatingFactorKey, CreateUnderwritingRulePayload, CreateTrainingMaterialPayload,
  CreateRatePlanPayload, ProductUnderwritingRule, ProductRatePlan,
} from '@/lib/user-api-client'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface Props {
  productId: string
  navigateTo: (view: ViewId, params?: { carrierId?: string; productId?: string; userId?: string }) => void
}

const LINE_COLORS: Record<string, string> = {
  AUTO: '#0058BC', HOME: '#34C759', COMMERCIAL: '#AF52DE',
  LIFE: '#FF9500', HEALTH: '#FF3B30', 'P&C': '#64748b',
}

const RULE_ACTION_COLOR: Record<string, string> = {
  approve: '#34C759', decline: '#BA1A1A', refer: '#a05800', surcharge: '#FF9500', discount: '#0058BC',
}

const MATERIAL_TYPE_ICON: Record<string, any> = {
  'product-guide': BookOpen,
  'rate-manual': BarChart2,
  'underwriting-guide': Shield,
  'compliance': CheckCircle,
  'training-deck': Star,
  'faq': FileText,
  'video': Video,
}

// coverage stable key → i18n label/desc keys (detail.info.*)
const COVERAGE_LABEL_KEYS: Record<string, { label: string; desc?: string }> = {
  Liability: { label: 'detail.info.liability', desc: 'detail.info.liabilityDesc' },
  Comprehensive: { label: 'detail.info.comprehensive', desc: 'detail.info.comprehensiveDesc' },
  Collision: { label: 'detail.info.collision', desc: 'detail.info.collisionDesc' },
  MedicalPayments: { label: 'detail.info.medical', desc: 'detail.info.medicalDesc' },
  UninsuredMotorist: { label: 'detail.info.um', desc: 'detail.info.umDesc' },
  RoadsideAssistance: { label: 'detail.info.roadside', desc: 'detail.info.roadsideDesc' },
  VehicleReplacement: { label: 'detail.info.substitute' },
  NewCarValue: { label: 'detail.info.newCarValue' },
  DeductibleWaiver: { label: 'detail.info.deductibleWaiver' },
}

const COVERAGE_ICONS: Record<string, any> = {
  Liability: Shield,
  Comprehensive: CheckCircle,
  Collision: TrendingUp,
  MedicalPayments: Globe,
  UninsuredMotorist: Star,
  RoadsideAssistance: BookOpen,
  VehicleReplacement: Star,
  NewCarValue: TrendingUp,
  DeductibleWaiver: CheckCircle,
}

/** coverages 在库里有两种写法：历史种子数据存 PascalCase 展示名（"Liability"），
 *  ProductForm 提交的是 camelCase 稳定 key（"liability"）。此前直接 COVERAGE_LABEL_KEYS[c] 查不到就
 *  return null，导致表单写入的值在详情页整块静默消失——所以这里统一做大小写无关 + 短别名解析。 */
const COVERAGE_BY_LOWER: Record<string, string> = Object.fromEntries(
  Object.keys(COVERAGE_LABEL_KEYS).map(k => [k.toLowerCase(), k])
)
// 表单短 key → COVERAGE_LABEL_KEYS 长 key（其余短 key 与长 key 小写后同名，无需别名）
const COVERAGE_ALIAS: Record<string, string> = {
  medical: 'MedicalPayments',
  um: 'UninsuredMotorist',
  roadside: 'RoadsideAssistance',
  substitute: 'VehicleReplacement',
}

const resolveCoverage = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v.trim()) return null
  const lower = v.trim().toLowerCase()
  return COVERAGE_BY_LOWER[lower] ?? COVERAGE_ALIAS[lower] ?? null
}

/** 「更多」下拉菜单的子资源类型：核保规则 / 培训材料 / 费率方案共用一套菜单与确认删除流程。 */
type MenuKind = 'rule' | 'material' | 'ratePlan'

function MenuItem({ icon, label, disabled, danger, onClick }: {
  icon: React.ReactNode; label: string; disabled?: boolean; danger?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
        borderRadius: 8, border: 'none', background: 'none', textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12.5, fontWeight: 500,
        color: disabled ? '#C1C6D7' : (danger ? '#BA1A1A' : '#414755'),
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = danger ? 'rgba(186,26,26,0.06)' : 'rgba(0,88,188,0.06)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      {icon}{label}
    </button>
  )
}

const MenuDivider = () => <div style={{ height: 1, background: 'rgba(193,198,215,0.45)', margin: '4px 6px' }} />

export default function ProductDetail({ productId, navigateTo }: Props) {
  const { t, i18n } = useTranslation('product')
  const lang = i18n.language
  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [stateSearch, setStateSearch] = useState('')

  // ── API-driven data fetching ──
  const { data: apiProduct, isLoading } = useGetProduct(productId)
  const toggleStatus = useToggleProductStatus()
  // Sub-resource hooks for the 5 detail tabs (called unconditionally, before any early return)
  const { data: myRatePlans = [], isLoading: lpRates } = useGetRatePlans(productId)
  const { data: allStates = [], isLoading: lpStates } = useGetProductStates(productId)
  const { data: myRules = [], isLoading: lpRules } = useGetUnderwritingRules(productId)
  const { data: myMaterials = [], isLoading: lpTraining } = useGetTrainingMaterials(productId)
  const { data: perfData = [], isLoading: lpPerf } = useGetProductPerformance(productId)

  // ── Write side: rules / materials / rate plans (问题7/8/9/11/12) ──
  // Mutations are hooks too, so they must be declared here — above the isLoading early return.
  const createRule = useCreateUnderwritingRule()
  const updateRule = useUpdateUnderwritingRule()
  const setRuleStatusMut = useSetRuleStatus()
  const deleteRuleMut = useDeleteUnderwritingRule()
  const createMaterial = useCreateTrainingMaterial()
  const setMaterialStatusMut = useSetMaterialStatus()
  const deleteMaterialMut = useDeleteTrainingMaterial()
  const createRatePlanMut = useCreateRatePlan()
  const updateRatePlanMut = useUpdateRatePlan()
  const deleteRatePlanMut = useDeleteRatePlan()

  const [showAddRule, setShowAddRule] = useState(false)
  // 非 null 即进入「编辑核保规则」模式（问题8：编辑 icon 原本是死按钮）
  const [editingRule, setEditingRule] = useState<ProductUnderwritingRule | null>(null)
  const [showUploadMaterial, setShowUploadMaterial] = useState(false)
  const [showAddRatePlan, setShowAddRatePlan] = useState(false)
  // 非 null 即进入「编辑费率方案」模式（卡片上的「编辑」按钮原本没有 onClick，是个死按钮）
  const [editingRatePlan, setEditingRatePlan] = useState<ProductRatePlan | null>(null)
  // 「更多」下拉：用 fixed + 视口坐标渲染，跳出卡片/tab 容器的 overflow 裁剪链
  const [menu, setMenu] = useState<{ kind: MenuKind; id: string; x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  // 删除不可逆，统一先走确认框
  const [confirmTarget, setConfirmTarget] = useState<{ kind: MenuKind; id: string; name: string } | null>(null)

  // 点击菜单外部 / 窗口缩放 / 任意容器滚动时收起（滚动会让 fixed 坐标与触发按钮脱节）
  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null)
    }
    const close = () => setMenu(null)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])

  // This view has no global toast provider, so it keeps a small local one for write feedback.
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Show loading state while fetching
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div style={{ maxWidth: 1200, margin: '80px auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '60px 40px' }}>
            <div style={{ fontSize: 16, color: '#717786' }}>{t('detail.tabs.info')} Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  // Map API ProductRecord to display-friendly shape compatible with existing code
  const prod: any = apiProduct ? {
    productId: apiProduct.id,
    naicCode: apiProduct.naic_form_number ?? '',
    productName: apiProduct.product_name,
    shortName: apiProduct.short_name ?? '',
    productCode: apiProduct.product_code,
    naicFormNumber: apiProduct.naic_form_number,
    description: apiProduct.description,
    descriptionEn: apiProduct.description_en,
    coverages: apiProduct.coverages ?? [],
    rateType: apiProduct.rate_type,
    baseRate: apiProduct.base_rate,
    minPremium: apiProduct.min_premium,
    maxPremium: apiProduct.max_premium,
    rateFactors: apiProduct.rate_factors,
    lineOfBusiness: apiProduct.line_of_business,
    subLine: apiProduct.sub_line,
    type: apiProduct.product_type,
    insurerId: apiProduct.carrier_id,
    insurerName: apiProduct.carrier_name,
    underwritingMode: apiProduct.underwriting_mode,
    authorizedChannels: apiProduct.authorized_channels,
    maxPolicyLimit: apiProduct.max_policy_limit,
    mgaNegotiationAuthority: apiProduct.mga_negotiation_authority,
    renewalType: apiProduct.renewal_type,
    policyTermYears: apiProduct.policy_term_years,
    ageMin: apiProduct.age_min,
    ageMax: apiProduct.age_max,
    excludeDUI: apiProduct.exclude_dui,
    referHighValue: apiProduct.refer_high_value,
    referThreshold: apiProduct.refer_threshold,
    blacklistConditions: apiProduct.blacklist_conditions,
    availableStates: apiProduct.available_states ?? [],
    effectiveDate: apiProduct.effective_date,
    expirationDate: apiProduct.expiration_date,
    status: apiProduct.status,
    isActive: apiProduct.is_active,
    premiumYTD: apiProduct.premium_ytd,
    policyCount: apiProduct.policy_count,
    avgPremium: apiProduct.avg_premium,
    lossRatio: apiProduct.loss_ratio,
    renewalRate: apiProduct.renewal_rate,
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at,
  } : { productId, productName: 'Loading...', productCode: '', lineOfBusiness: 'AUTO', status: 'Active', insurerName: '', availableStates: [], effectiveDate: '', coverages: [] }

  const activeStates = allStates.filter(s => s.status === 'active')
  // 本系统无审批流程，可售州不存在「审核中(pending)」态，只剩 已开通 / 已暂停 / 未开通
  const suspendedStates = allStates.filter(s => s.status === 'suspended')

  const filteredStates = allStates.filter(s =>
    !stateSearch || s.code.toLowerCase().includes(stateSearch.toLowerCase()) || s.name.toLowerCase().includes(stateSearch.toLowerCase())
  )

  // 基本信息 tab：承保范围解析后去重渲染；产品描述按当前语言取值，缺失时回退到中文原文
  const coverageKeys = Array.from(new Set(
    ((prod.coverages ?? []) as unknown[]).map(resolveCoverage).filter((k): k is string => !!k)
  ))
  const descriptionText = (lang.startsWith('en') ? (prod.descriptionEn || prod.description) : prod.description) || ''

  const tabs = [
    { id: 'info', label: t('detail.tabs.info') },
    { id: 'rates', label: t('detail.tabs.rates') },
    { id: 'states', label: t('detail.tabs.states') },
    { id: 'underwriting', label: t('detail.tabs.underwriting') },
    { id: 'training', label: t('detail.tabs.training') },
    { id: 'performance', label: t('detail.tabs.performance') },
  ]

  const statusMap: Record<string, { label: string; orb: string }> = {
    'Active': { label: t('values.statusOnSale'), orb: 'orb-green' },
    'Inactive': { label: t('values.statusOffSale'), orb: 'orb-gray' },
    'Paused': { label: t('values.statusPaused'), orb: 'orb-yellow' },
    'Incomplete': { label: t('values.statusIncomplete'), orb: 'orb-gray' },
  }
  const sc = statusMap[prod.status] ?? { label: prod.status, orb: 'orb-gray' }
  const lineColor = LINE_COLORS[prod.lineOfBusiness] ?? '#0058BC'
  const launchDate = (prod.effectiveDate || '').split('T')[0] || '-'

  // values.* 是「枚举值 → 展示文案」的动态查表。i18next 缺键时会把 key 本身当文案返回，
  // 页面上就出现 values.Personal Auto 这种裸键名——所以所有动态查表都带 defaultValue，缺键时
  // 降级为原始枚举值，永远不暴露键名。
  const typeLabel = t(`values.type${prod.type}`, prod.type || '-')

  const rpStatusLabels: Record<string, { cls: string; label: string }> = {
    active: { cls: 'badge-green', label: t('detail.rates.active') },
    draft: { cls: 'badge-gray', label: t('detail.rates.draft') },
    expired: { cls: 'badge-red', label: t('detail.rates.expired') },
  }

  const ruleCatLabels: Record<string, { cls: string; label: string }> = {
    eligibility: { cls: 'badge-red', label: t('detail.underwriting.eligibility') },
    rating: { cls: 'badge-blue', label: t('detail.underwriting.rating') },
    exclusion: { cls: 'badge-orange', label: t('detail.underwriting.exclusion') },
    referral: { cls: 'badge-yellow', label: t('detail.underwriting.referral') },
  }

  const matLabels: Record<string, string> = {
    'product-guide': t('detail.training.guide'),
    'rate-manual': t('detail.training.rateManual'),
    'underwriting-guide': t('detail.training.uwGuide'),
    'compliance': t('detail.training.compliance'),
    'training-deck': t('detail.training.deck'),
    'faq': t('detail.training.faq'),
    'video': t('detail.training.video'),
  }

  const factorLabels: Record<RatingFactorKey, string> = {
    drivingRecord: t('detail.rates.facDrivingRecord'),
    vehicleType: t('detail.rates.facVehicleType'),
    drivingExperience: t('detail.rates.facDrivingExp'),
    creditScore: t('detail.rates.facCredit'),
    territory: t('detail.rates.facTerritory'),
    usage: t('detail.rates.facUsage'),
    homeRebuildCost: t('detail.rates.facHomeRebuildCost'),
    securityFeatures: t('detail.rates.facSecurityFeatures'),
    naturalRisk: t('detail.rates.facNatRisk'),
    lossHistory: t('detail.rates.facLossHistory'),
    annualRevenue: t('detail.rates.facAnnualRevenue'),
    industryRisk: t('detail.rates.facIndustryRisk'),
    securityPosture: t('detail.rates.facSecurityPosture'),
    incidentHistory: t('detail.rates.facIncidentHistory'),
    employeeCount: t('detail.rates.facEmployeeCount'),
    supplyChain: t('detail.rates.facSupplyChain'),
  }

  const latestPerf = perfData[perfData.length - 1]
  const prevPerf = perfData[perfData.length - 2]
  const premiumGrowth = prevPerf ? ((latestPerf.premium - prevPerf.premium) / prevPerf.premium) : 0

  const confirmStatusChange = () => {
    if (!statusModalId) return
    toggleStatus.mutate(statusModalId, {
      onSuccess: () => setStatusModalId(null),
    })
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3200)
  }

  /** NestJS validation errors come back as string[]; surface the detail instead of a bare message. */
  const describeError = (err: any, fallback: string) => {
    const raw = err?.response?.data?.message
    const detail = Array.isArray(raw) ? raw.join('; ') : (typeof raw === 'string' ? raw : '')
    return detail ? `${fallback}: ${detail}` : fallback
  }

  const handleCreateRule = (dto: CreateUnderwritingRulePayload) => {
    createRule.mutate({ id: productId, dto }, {
      onSuccess: () => {
        setShowAddRule(false)
        showToast(t('modals.addRule.success'), 'success')
      },
      onError: (err: any) => showToast(describeError(err, t('modals.addRule.failed')), 'error'),
    })
  }

  const handleCreateMaterial = (dto: CreateTrainingMaterialPayload) => {
    createMaterial.mutate({ id: productId, dto }, {
      onSuccess: () => {
        setShowUploadMaterial(false)
        showToast(t('modals.uploadMaterial.success'), 'success')
      },
      onError: (err: any) => showToast(describeError(err, t('modals.uploadMaterial.failed')), 'error'),
    })
  }

  // Suggest a priority that sorts the new rule after every existing one
  const nextRulePriority = myRules.reduce((max, r) => Math.max(max, r.priority), 0) + 1

  /** 菜单展示名：与卡片上的标题保持同一取值口径，否则确认框里的名称会对不上。 */
  const ruleDisplayName = (r?: ProductUnderwritingRule) =>
    r ? ((lang.startsWith('en') ? (r.nameEn || r.name) : r.name) || r.id) : ''

  const openMenu = (kind: MenuKind, id: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    // 再次点击同一个按钮时收起
    setMenu(prev => (prev && prev.kind === kind && prev.id === id)
      ? null
      : { kind, id, x: rect.right, y: rect.bottom + 6 })
  }

  const handleUpdateRule = (dto: CreateUnderwritingRulePayload) => {
    if (!editingRule) return
    updateRule.mutate({ id: productId, ruleId: editingRule.id, dto }, {
      onSuccess: () => {
        setEditingRule(null)
        showToast(t('menu.ruleUpdated'), 'success')
      },
      onError: (err: any) => showToast(describeError(err, t('menu.ruleUpdateFailed')), 'error'),
    })
  }

  const handleSetRuleStatus = (ruleId: string, status: 'active' | 'inactive') => {
    setMenu(null)
    setRuleStatusMut.mutate({ id: productId, ruleId, status }, {
      onSuccess: () => showToast(t('menu.ruleStatusUpdated'), 'success'),
      onError: (err: any) => showToast(describeError(err, t('menu.ruleStatusFailed')), 'error'),
    })
  }

  const handleSetMaterialStatus = (materialId: string, status: 'active' | 'inactive') => {
    setMenu(null)
    setMaterialStatusMut.mutate({ id: productId, materialId, status }, {
      onSuccess: () => showToast(t('menu.materialStatusUpdated'), 'success'),
      onError: (err: any) => showToast(describeError(err, t('menu.materialStatusFailed')), 'error'),
    })
  }

  const handleCreateRatePlan = (dto: CreateRatePlanPayload) => {
    createRatePlanMut.mutate({ id: productId, dto }, {
      onSuccess: () => {
        setShowAddRatePlan(false)
        showToast(t('menu.ratePlanCreated'), 'success')
      },
      onError: (err: any) => showToast(describeError(err, t('menu.ratePlanCreateFailed')), 'error'),
    })
  }

  const handleUpdateRatePlan = (dto: CreateRatePlanPayload) => {
    if (!editingRatePlan) return
    // dto 是全量负载，后端 UpdateRatePlanDto 只写入出现的键，所以直接当 PATCH 体用即可
    updateRatePlanMut.mutate({ id: productId, planId: editingRatePlan.id, dto }, {
      onSuccess: () => {
        setEditingRatePlan(null)
        showToast(t('menu.ratePlanUpdated'), 'success')
      },
      onError: (err: any) => showToast(describeError(err, t('menu.ratePlanUpdateFailed')), 'error'),
    })
  }

  const askDelete = (kind: MenuKind, id: string, name: string) => {
    setMenu(null)
    setConfirmTarget({ kind, id, name })
  }

  const runConfirmedDelete = () => {
    if (!confirmTarget) return
    const { kind, id } = confirmTarget
    setConfirmTarget(null)
    const onOk = (msg: string) => () => showToast(msg, 'success')
    const onFail = (msg: string) => (err: any) => showToast(describeError(err, msg), 'error')
    if (kind === 'rule') {
      deleteRuleMut.mutate({ id: productId, ruleId: id }, {
        onSuccess: onOk(t('menu.ruleDeleted')), onError: onFail(t('menu.ruleDeleteFailed')),
      })
    } else if (kind === 'material') {
      deleteMaterialMut.mutate({ id: productId, materialId: id }, {
        onSuccess: onOk(t('menu.materialDeleted')), onError: onFail(t('menu.materialDeleteFailed')),
      })
    } else {
      deleteRatePlanMut.mutate({ id: productId, planId: id }, {
        onSuccess: onOk(t('menu.ratePlanDeleted')), onError: onFail(t('menu.ratePlanDeleteFailed')),
      })
    }
  }

  const statusModalProduct = statusModalId && apiProduct ? { ...apiProduct, productId: apiProduct.id, status: apiProduct.status as string } as any : undefined

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div className="flex items-center gap-2 mb-4">
            <button className="btn-ghost" onClick={() => navigateTo('product-list')}><ArrowLeft size={15} /></button>
            <span style={{ fontSize: 13, color: '#717786' }}>{t('pages.productManagement')}</span>
            <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
            <span style={{ fontSize: 13, color: '#181C23', fontWeight: 500 }}>{prod.productName}</span>
          </div>

          <div className="card" style={{ padding: '22px 24px' }}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                {/* Product icon */}
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg, ${lineColor}22, ${lineColor}44)`,
                  border: `1.5px solid ${lineColor}33`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 22, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: lineColor }}>
                    {prod.lineOfBusiness.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{prod.productName}</h1>
                    <span className={`badge ${sc.orb === 'orb-green' ? 'badge-green' : sc.orb === 'orb-yellow' ? 'badge-yellow' : sc.orb === 'orb-purple' ? 'badge-purple' : 'badge-gray'}`}>{sc.label}</span>
                    <span className="badge badge-gray" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{prod.productCode}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 13, color: '#717786' }}>
                    <span className="flex items-center gap-1">
                      <span className="badge badge-blue" style={{ fontSize: 11.5, background: lineColor + '18', color: lineColor, borderColor: lineColor + '30' }}>{t(`values.lob${prod.lineOfBusiness}`, prod.lineOfBusiness || '-')}</span>
                      {prod.subLine ? t(`values.${prod.subLine}`, prod.subLine) : ''}
                    </span>
                    <span>·</span>
                    <span>{typeLabel}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Globe size={12} />{prod.insurerName}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{t('detail.kpi.statesSelling', { count: activeStates.length })}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-ghost" style={{ fontSize: 13 }}><Download size={14} />{t('actions.export')}</button>
                {prod.status === 'Active'
                  ? <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => setStatusModalId(prod.productId)}>
                      <ToggleRight size={14} />{t('actions.delist')}
                    </button>
                  : <button className="btn-ghost" style={{ fontSize: 13, color: '#1a7a2e' }} onClick={() => setStatusModalId(prod.productId)}>
                      <ToggleRight size={14} />{t('actions.list')}
                    </button>
                }
                <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('product-edit', { productId: prod.productId })}>
                  <Edit2 size={14} />{t('actions.edit')}
                </button>
              </div>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 22, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
              {[
                { label: t('detail.kpi.premium'), value: formatCurrency(prod.premiumYTD ?? 0, true), sub: `+${(premiumGrowth * 100).toFixed(1)}% MoM`, color: '#0058BC' },
                { label: t('detail.kpi.policies'), value: (prod.policyCount ?? 0).toLocaleString(), sub: t('detail.kpi.statesValid', { count: activeStates.length }) },
                { label: t('detail.kpi.lossRatio'), value: formatPercent(prod.lossRatio ?? 0), sub: (prod.lossRatio ?? 0) > 0.65 ? t('detail.kpi.lossWarn') : t('detail.kpi.normalRange'), color: (prod.lossRatio ?? 0) > 0.65 ? '#BA1A1A' : undefined },
                { label: t('detail.kpi.renewal'), value: formatPercent(prod.renewalRate ?? 0), sub: (prod.renewalRate ?? 0) > 0.85 ? t('detail.kpi.highRetention') : t('detail.kpi.normal') },
                { label: t('detail.kpi.states'), value: `${activeStates.length} / 50`, sub: suspendedStates.length > 0 ? t('detail.kpi.suspended', { count: suspendedStates.length }) : t('detail.kpi.allActive') },
                { label: t('detail.kpi.launch'), value: launchDate, sub: t('detail.kpi.onlineMonths', { count: Math.max(0, Math.floor((Date.now() - new Date(prod.effectiveDate).getTime()) / 86400000 / 30)) }) },
              ].map(k => (
                <div key={k.label} style={{ padding: '12px 14px', background: 'rgba(241,243,254,0.6)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: '#717786', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: k.color ?? '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: '#717786', marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="tab-bar" style={{ marginBottom: 18 }}>
          {tabs.map(tb => (
            <button key={tb.id} className={`tab-item${activeTab === tb.id ? ' active' : ''}`} onClick={() => setActiveTab(tb.id)}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Basic info ── */}
        {activeTab === 'info' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 18 }}>{t('detail.info.basicTitle')}</div>
              {[
                [t('detail.info.productName'), prod.productName],
                [t('tables.productCode'), prod.productCode],
                [t('tables.lineOfBusiness'), t(`values.lob${prod.lineOfBusiness}`, prod.lineOfBusiness || '-')],
                [t('tables.subLine'), prod.subLine ? t(`values.${prod.subLine}`, prod.subLine) : '-'],
                [t('tables.type'), typeLabel],
                [t('detail.kpi.launch'), launchDate],
                [t('detail.info.status'), sc.label],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 13 }}>
                  <div style={{ width: 100, fontSize: 12.5, color: '#717786', flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '22px 24px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 18 }}>{t('sections.carrierRelation')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${lineColor}22, ${lineColor}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: lineColor }}>
                  {prod.insurerName ? prod.insurerName.slice(0, 2) : '--'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{prod.insurerName}</div>
                  <div style={{ fontSize: 13, color: '#717786' }}>NAIC {prod.naicCode || '-'}</div>
                </div>
              </div>
              {[
                [t('fields.underwritingMode'), t(`values.underwriting${prod.underwritingMode}`, prod.underwritingMode || '-')],
                [t('fields.maxPolicyLimit'), prod.maxPolicyLimit ? `$${prod.maxPolicyLimit.toLocaleString()}` : '-'],
                // 此前直接渲染裸值 "Guaranteed"，中英文环境都显示英文枚举
                [t('fields.renewalType'), prod.renewalType ? t(`values.renewal${prod.renewalType}`, prod.renewalType) : '-'],
                [t('fields.policyTermYears'), prod.policyTermYears
                  ? `${prod.policyTermYears} ${lang.startsWith('en') ? (prod.policyTermYears === 1 ? 'year' : 'years') : '年'}`
                  : '-'],
                [t('fields.naicFormNumber'), prod.naicFormNumber ?? '-'],
                [t('fields.productCode'), prod.productCode],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 100, fontSize: 12.5, color: '#717786', flexShrink: 0 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '22px 24px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 12 }}>{t('form.basic.description')}</div>
              {descriptionText ? (
                <div style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{descriptionText}</div>
              ) : (
                <div style={{ fontSize: 13, color: '#717786' }}>{t('emptyState')}</div>
              )}
            </div>
            <div className="card" style={{ padding: '22px 24px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t('detail.info.coverageTitle')}</div>
              {coverageKeys.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {coverageKeys.map((c: string) => {
                    const meta = COVERAGE_LABEL_KEYS[c]
                    if (!meta) return null
                    const Icon = COVERAGE_ICONS[c] ?? Shield
                    return (
                      <div key={c} style={{ padding: '12px 14px', background: 'rgba(241,243,254,0.7)', borderRadius: 10, display: 'flex', gap: 12 }}>
                        <Icon size={16} style={{ color: '#0058BC', flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{t(meta.label)}</div>
                          {meta.desc && <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t(meta.desc)}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#717786' }}>{t('emptyState')}</div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Rate plans ── */}
        {activeTab === 'rates' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 14, color: '#717786' }}>
                {t('detail.rates.summary', { total: myRatePlans.length, active: myRatePlans.filter(r => r.status === 'active').length })}
              </div>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAddRatePlan(true)}><Plus size={14} />{t('detail.rates.add')}</button>
            </div>
            {lpRates && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#717786' }}>{t('loading')}</div>
              </div>
            )}
            {!lpRates && myRatePlans.length === 0 && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <BarChart2 size={32} style={{ color: '#C1C6D7', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, color: '#717786' }}>{t('emptyState')}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myRatePlans.map(rp => (
                <div key={rp.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{rp.name}</span>
                        <span className={`badge ${rpStatusLabels[rp.status]?.cls ?? 'badge-gray'}`}>{rpStatusLabels[rp.status]?.label ?? rp.status}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>{rp.tier}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {t('detail.rates.validity', { from: rp.effectiveDate || '-', to: rp.expiryDate || '-' })}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      {/* 「编辑」不随 expired 状态隐藏：过期方案同样需要能改（否则连状态都改不回来）。
                          原「提交审批」按钮已删除 —— 本系统没有任何审批流程。 */}
                      <button
                        className="btn-ghost" style={{ fontSize: 12.5 }}
                        onClick={() => { setMenu(null); setEditingRatePlan(rp) }}
                      >
                        <Edit2 size={13} />{t('actions.edit')}
                      </button>
                      {/* 问题12：费率方案删除——后端无软删列，走确认框后硬删 */}
                      <button
                        className="btn-ghost" style={{ padding: 6, color: '#BA1A1A' }} title={t('actions.delete')}
                        onClick={e => openMenu('ratePlan', rp.id, e)}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        [t('detail.rates.baseRate'), `$${rp.baseRate.toLocaleString()}`],
                        [t('detail.rates.minPremium'), `$${rp.minPremium.toLocaleString()}`],
                        [t('detail.rates.maxPremium'), `$${rp.maxPremium.toLocaleString()}`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ padding: '9px 12px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                          <div style={{ fontSize: 11, color: '#717786', marginBottom: 2 }}>{l}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {rp.ratingFactors.length > 0 && (
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t('detail.rates.ratingFactors')}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {rp.ratingFactors.map(f => (
                            <div key={f.factor} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 100, fontSize: 12.5, color: '#181C23', fontWeight: 500, flexShrink: 0 }}>{factorLabels[f.factor]}</div>
                              <div style={{ flex: 1, height: 6, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${f.weight * 100}%`, background: '#0058BC', borderRadius: 3 }} />
                              </div>
                              <div style={{ width: 42, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC', textAlign: 'right', flexShrink: 0 }}>{(f.weight * 100).toFixed(0)}%</div>
                              <div style={{ fontSize: 11.5, color: '#717786', flex: 1, minWidth: 140 }}>{lang.startsWith('en') ? f.descriptionEn : f.description}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Salable states ── */}
        {activeTab === 'states' && (
          <div>
            <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: t('detail.rates.active'), count: activeStates.length, color: '#34C759' },
                { label: t('detail.states.suspended'), count: suspendedStates.length, color: '#FFCC00' },
                { label: t('detail.states.notAvail'), count: allStates.filter(s => s.status === 'not-available').length, color: '#C1C6D7' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2" style={{ padding: '6px 14px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{s.count}</span>
                  <span style={{ fontSize: 12.5, color: '#717786' }}>{s.label}</span>
                </div>
              ))}
              <div className="relative" style={{ marginLeft: 'auto' }}>
                <input
                  type="text"
                  placeholder={t('detail.states.search')}
                  className="input-glass"
                  style={{ fontSize: 13, paddingLeft: 10, width: 180 }}
                  value={stateSearch}
                  onChange={e => setStateSearch(e.target.value)}
                />
              </div>
              {/* 原「申请新州」按钮已删除：本系统没有审批流程，不存在「申请-审批」开通州的通道。 */}
            </div>
            {lpStates ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#717786' }}>{t('loading')}</div>
              </div>
            ) : (
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {filteredStates.map(s => (
                  <div
                    key={s.code}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `0.5px solid ${s.status === 'active' ? 'rgba(52,199,89,0.3)' : s.status === 'suspended' ? 'rgba(255,204,0,0.35)' : 'rgba(193,198,215,0.3)'}`,
                      background: s.status === 'active' ? 'rgba(52,199,89,0.06)' : s.status === 'suspended' ? 'rgba(255,204,0,0.06)' : 'rgba(255,255,255,0.4)',
                      cursor: s.status === 'not-available' ? 'default' : 'pointer',
                      opacity: s.status === 'not-available' ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.status === 'active' ? '#1a7a2e' : s.status === 'suspended' ? '#a05800' : '#717786' }}>
                        {s.code}
                      </span>
                      {s.status === 'active' && <span className="orb orb-green" />}
                      {s.status === 'suspended' && <span className="orb orb-yellow" />}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#717786', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    {s.status === 'active' && s.channelCount !== undefined && (
                      <div style={{ fontSize: 10.5, color: '#34C759', marginTop: 2 }}>{t('detail.states.channels', { count: s.channelCount })}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}

        {/* ── Tab: Underwriting rules ── */}
        {activeTab === 'underwriting' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 14, color: '#717786' }}>
                {t('detail.underwriting.summary', {
                  total: myRules.length,
                  active: myRules.filter(r => r.status === 'active').length,
                  testing: myRules.filter(r => r.status === 'testing').length,
                })}
              </div>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAddRule(true)}><Plus size={14} />{t('detail.underwriting.add')}</button>
            </div>
            {lpRules && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#717786' }}>{t('loading')}</div>
              </div>
            )}
            {!lpRules && myRules.length === 0 && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <Shield size={32} style={{ color: '#C1C6D7', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, color: '#717786' }}>{t('emptyState')}</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {myRules.map(rule => (
                <div key={rule.id} className="card" style={{ padding: '18px 22px' }}>
                  <div className="flex items-start gap-4">
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(241,243,254,0.8)', fontSize: 12, fontWeight: 700, color: '#414755', fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {rule.priority}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{lang.startsWith('en') ? rule.nameEn : rule.name}</span>
                        {/* Closed maps: an unexpected category/action must degrade, not throw and blank the tab */}
                        <span className={`badge ${ruleCatLabels[rule.category]?.cls ?? 'badge-gray'}`} style={{ fontSize: 11 }}>{ruleCatLabels[rule.category]?.label ?? rule.category}</span>
                        {rule.status === 'testing' && <span className="badge badge-purple" style={{ fontSize: 11 }}>{t('detail.underwriting.testing')}</span>}
                        {rule.status === 'inactive' && <span className="badge badge-gray" style={{ fontSize: 11 }}>{t('detail.underwriting.inactive')}</span>}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#414755', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(241,243,254,0.8)', padding: '6px 10px', borderRadius: 7 }}>
                        IF {lang.startsWith('en') ? rule.conditionEn : rule.condition}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{lang.startsWith('en') ? rule.conditionDetailEn : rule.conditionDetail}</div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                          background: `${RULE_ACTION_COLOR[rule.action] ?? '#717786'}15`,
                          color: RULE_ACTION_COLOR[rule.action] ?? '#717786',
                        }}>
                          THEN → {lang.startsWith('en') ? (rule.actionValueEn ?? rule.action) : (rule.actionValue ?? rule.action)}
                        </div>
                        <span style={{ fontSize: 11.5, color: '#717786' }}>{t('detail.underwriting.lastModified', { date: rule.lastModified, by: rule.modifiedBy })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost" style={{ padding: 6 }} title={t('actions.edit')}
                        onClick={() => { setMenu(null); setEditingRule(rule) }}
                      >
                        <Edit2 size={13} />
                      </button>
                      {/* 原「设置」按钮无任何行为——按问题7 换为「更多」下拉：生效 / 失效 / 删除 */}
                      <button
                        className="btn-ghost" style={{ padding: 6 }} title={t('actions.more')}
                        onClick={e => openMenu('rule', rule.id, e)}
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Training materials ── */}
        {activeTab === 'training' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div style={{ fontSize: 14, color: '#717786' }}>
                {t('detail.training.summary', { count: myMaterials.length, downloads: myMaterials.reduce((a, m) => a + m.downloads, 0) })}
              </div>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowUploadMaterial(true)}><Upload size={14} />{t('detail.training.uploadMaterial')}</button>
            </div>
            {lpTraining && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#717786' }}>{t('loading')}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {myMaterials.map(m => {
                const Icon = MATERIAL_TYPE_ICON[m.type] ?? FileText
                const isExpiring = m.expiryDate && new Date(m.expiryDate) < new Date(Date.now() + 60 * 86400000)
                return (
                  <div key={m.id} className="card" style={{ padding: '18px 20px' }}>
                    <div className="flex items-start gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color: '#0058BC' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{lang.startsWith('en') ? m.titleEn : m.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="badge badge-gray" style={{ fontSize: 11 }}>{matLabels[m.type]}</span>
                          <span className="badge badge-blue" style={{ fontSize: 10.5 }}>v{m.version}</span>
                          {/* status 列由 V1.4 迁移引入；旧数据回退为 active，所以只在失效时额外标记 */}
                          {m.status === 'inactive' && (
                            <span className="badge badge-red" style={{ fontSize: 10.5 }}>{t('detail.training.inactive')}</span>
                          )}
                          {isExpiring && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>{t('detail.training.expiringSoon')}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#717786', marginBottom: 8 }}>
                          {/* Seed rows may lack fileName/fileSize — filter rather than render "null" */}
                          {[m.fileName, m.fileSize, m.uploadDate, m.uploadedBy].filter(Boolean).join(' · ')}
                        </div>
                        {m.requiredFor.length > 0 && (
                          <div style={{ fontSize: 11.5, color: '#0058BC', marginBottom: 8 }}>
                            {t('detail.training.requiredFor', { list: m.requiredFor.join(' / ') })}
                          </div>
                        )}
                        {m.expiryDate && (
                          <div style={{ fontSize: 11.5, color: isExpiring ? '#BA1A1A' : '#717786' }}>
                            {t('detail.training.validUntil', { date: m.expiryDate })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 items-end shrink-0">
                        <div style={{ fontSize: 12.5, color: '#717786', textAlign: 'right' }}>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#181C23' }}>{m.downloads}</span> {t('detail.training.downloadsSuffix')}
                        </div>
                        {/* Only rows created through the upload flow have a stored file; legacy seed rows don't */}
                        {m.fileUrl ? (
                          <a
                            className="btn-secondary" href={m.fileUrl} target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}
                          >
                            <Download size={12} />{t('detail.training.download')}
                          </a>
                        ) : (
                          <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px', opacity: 0.45, cursor: 'not-allowed' }} disabled title={t('detail.training.noFile')}>
                            <Download size={12} />{t('detail.training.download')}
                          </button>
                        )}
                        {/* 问题9：右下角「更多」——置为有效 / 置为无效 / 删除 */}
                        <button
                          className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} title={t('actions.more')}
                          onClick={e => openMenu('material', m.id, e)}
                        >
                          <MoreHorizontal size={12} />{t('actions.more')}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {!lpTraining && myMaterials.length === 0 && (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <FileText size={32} style={{ color: '#C1C6D7', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, color: '#717786' }}>{t('detail.training.empty')}</div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Performance dashboard ── */}
        {activeTab === 'performance' && (
          <div>
            {lpPerf ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 15, color: '#717786' }}>{t('loading')}</div>
              </div>
            ) : !latestPerf ? (
              <div className="card" style={{ padding: 60, textAlign: 'center' }}>
                <BarChart2 size={32} style={{ color: '#C1C6D7', margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, color: '#717786' }}>{t('emptyState')}</div>
              </div>
            ) : (
            <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
              {[
                {
                  label: t('detail.performance.premium'),
                  value: `$${latestPerf.premium.toFixed(1)}M`,
                  delta: `${premiumGrowth >= 0 ? '+' : ''}${(premiumGrowth * 100).toFixed(1)}%`,
                  up: premiumGrowth >= 0,
                },
                {
                  label: t('detail.performance.newBiz'),
                  value: `$${latestPerf.newBiz.toFixed(1)}M`,
                  delta: `${latestPerf.newBiz > (prevPerf?.newBiz ?? 0) ? '+' : ''}${prevPerf ? (((latestPerf.newBiz - prevPerf.newBiz) / prevPerf.newBiz) * 100).toFixed(1) : '0'}%`,
                  up: latestPerf.newBiz >= (prevPerf?.newBiz ?? 0),
                },
                {
                  label: t('detail.kpi.lossRatio'),
                  value: formatPercent(latestPerf.lossRatio),
                  delta: latestPerf.lossRatio < 0.65 ? t('detail.kpi.normalRange') : t('detail.performance.overThreshold'),
                  up: latestPerf.lossRatio < 0.65,
                  warn: latestPerf.lossRatio >= 0.65,
                },
                {
                  label: t('detail.performance.policies'),
                  value: latestPerf.policies.toLocaleString(),
                  delta: t('detail.performance.claims', { count: latestPerf.claimsCount }),
                  up: true,
                },
              ].map(k => (
                <div key={k.label} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.warn ? '#BA1A1A' : '#181C23', fontFamily: "'JetBrains Mono', monospace", marginBottom: 6 }}>{k.value}</div>
                  <div className="flex items-center gap-1" style={{ fontSize: 12.5, color: k.up ? '#1a7a2e' : '#BA1A1A' }}>
                    {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {k.delta}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card" style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.chartPremiumTrend')}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${v}M`} width={44} />
                    <Tooltip formatter={(v: any) => [`$${v}M`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="premium" stroke={lineColor} strokeWidth={2.5} dot={false} name={t('detail.kpi.premium')} />
                    <Line type="monotone" dataKey="renewal" stroke="#34C759" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name={t('detail.performance.seriesRenewal')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px 22px' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.chartNewVsRenewal')}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${v}M`} width={44} />
                    <Tooltip formatter={(v: any) => [`$${v}M`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="newBiz" name={t('detail.performance.seriesNewBiz')} fill={lineColor} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="renewal" name={t('detail.performance.seriesRenewal')} fill="#34C759" radius={[4, 4, 0, 0]} opacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card" style={{ padding: '20px 22px', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('detail.performance.chartLossTrend')}</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(v * 100).toFixed(0)}%`} width={42} domain={[0.4, 0.8]} />
                    <Tooltip formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, t('detail.kpi.lossRatio')]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Line type="monotone" dataKey="lossRatio" stroke="#FF9500" strokeWidth={2.5} dot={{ r: 3, fill: '#FF9500' }} name={t('detail.kpi.lossRatio')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            </>
            )}
          </div>
        )}
      </div>

      {/* Product status modal (list / delist) */}
      {statusModalProduct && (
        <ProductStatusModal
          product={statusModalProduct}
          onClose={() => setStatusModalId(null)}
          onConfirm={confirmStatusChange}
        />
      )}

      {/* Add / edit underwriting rule (underwriting tab) —— 问题8：编辑 icon 复用同一弹窗，传入 editing 即进编辑态 */}
      {(showAddRule || editingRule) && (
        <AddUnderwritingRuleModal
          editing={editingRule}
          nextPriority={nextRulePriority}
          isSubmitting={editingRule ? updateRule.isPending : createRule.isPending}
          onClose={() => { setShowAddRule(false); setEditingRule(null) }}
          onSubmit={editingRule ? handleUpdateRule : handleCreateRule}
        />
      )}

      {/* Add / edit rate plan (rate-plans tab) —— 问题11 新增 + 遗留项编辑，共用同一弹窗 */}
      {(showAddRatePlan || editingRatePlan) && (
        <AddRatePlanModal
          editing={editingRatePlan}
          isSubmitting={editingRatePlan ? updateRatePlanMut.isPending : createRatePlanMut.isPending}
          onClose={() => { setShowAddRatePlan(false); setEditingRatePlan(null) }}
          onSubmit={editingRatePlan ? handleUpdateRatePlan : handleCreateRatePlan}
        />
      )}

      {/* 「更多」下拉菜单（问题7/9/12）：fixed + 视口坐标，避免被卡片的 overflow 裁掉；
          当前已处于该状态的项置灰禁用，而不是隐藏——用户能看见完整能力集。 */}
      {menu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed', left: menu.x, top: menu.y, transform: 'translateX(-100%)',
            zIndex: 1200, minWidth: 152, padding: 5, borderRadius: 12,
            background: 'rgba(255,255,255,0.98)', border: '0.5px solid rgba(193,198,215,0.6)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
          }}
        >
          {menu.kind === 'rule' && (() => {
            const st = myRules.find(r => r.id === menu.id)?.status
            return (
              <>
                <MenuItem icon={<CheckCircle size={13} />} label={t('menu.activate')} disabled={st === 'active'}
                  onClick={() => handleSetRuleStatus(menu.id, 'active')} />
                <MenuItem icon={<XCircle size={13} />} label={t('menu.deactivate')} disabled={st === 'inactive'}
                  onClick={() => handleSetRuleStatus(menu.id, 'inactive')} />
                <MenuDivider />
                <MenuItem icon={<Trash2 size={13} />} label={t('actions.delete')} danger
                  onClick={() => askDelete('rule', menu.id, ruleDisplayName(myRules.find(r => r.id === menu.id)))} />
              </>
            )
          })()}
          {menu.kind === 'material' && (() => {
            const m = myMaterials.find(x => x.id === menu.id)
            const st = m?.status ?? 'active'
            return (
              <>
                <MenuItem icon={<CheckCircle size={13} />} label={t('menu.markActive')} disabled={st === 'active'}
                  onClick={() => handleSetMaterialStatus(menu.id, 'active')} />
                <MenuItem icon={<XCircle size={13} />} label={t('menu.markInactive')} disabled={st === 'inactive'}
                  onClick={() => handleSetMaterialStatus(menu.id, 'inactive')} />
                <MenuDivider />
                <MenuItem icon={<Trash2 size={13} />} label={t('actions.delete')} danger
                  onClick={() => askDelete('material', menu.id, m ? ((lang.startsWith('en') ? (m.titleEn || m.title) : m.title) || m.id) : menu.id)} />
              </>
            )
          })()}
          {menu.kind === 'ratePlan' && (() => {
            const rp = myRatePlans.find(x => x.id === menu.id)
            return (
              <>
                <MenuItem icon={<Edit2 size={13} />} label={t('actions.edit')}
                  onClick={() => { setMenu(null); if (rp) setEditingRatePlan(rp) }} />
                <MenuDivider />
                <MenuItem icon={<Trash2 size={13} />} label={t('actions.delete')} danger
                  onClick={() => askDelete('ratePlan', menu.id, rp?.name ?? menu.id)} />
              </>
            )
          })()}
        </div>
      )}

      {/* 删除确认框：三类子资源共用，文案按 kind 切换 */}
      {confirmTarget && (() => {
        const deleting = deleteRuleMut.isPending || deleteMaterialMut.isPending || deleteRatePlanMut.isPending
        const msgKey = confirmTarget.kind === 'rule'
          ? 'menu.deleteRuleConfirm'
          : confirmTarget.kind === 'material' ? 'menu.deleteMaterialConfirm' : 'menu.deleteRatePlanConfirm'
        return (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={e => { if (e.target === e.currentTarget && !deleting) setConfirmTarget(null) }}
          >
            <div className="glass-strong" style={{ width: 440, borderRadius: 18, padding: '22px 24px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(186,26,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={17} style={{ color: '#BA1A1A' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t('menu.deleteConfirmTitle')}</div>
                  <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.65 }}>{t(msgKey, { name: confirmTarget.name })}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-secondary" style={{ fontSize: 13 }} disabled={deleting} onClick={() => setConfirmTarget(null)}>
                  {t('actions.cancel')}
                </button>
                <button
                  style={{
                    fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 10, cursor: deleting ? 'default' : 'pointer',
                    border: 'none', background: '#BA1A1A', color: '#fff', opacity: deleting ? 0.6 : 1,
                  }}
                  disabled={deleting}
                  onClick={runConfirmedDelete}
                >
                  {deleting ? t('menu.deleting') : t('menu.confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Upload training material (training tab) */}
      {showUploadMaterial && (
        <UploadTrainingMaterialModal
          isSubmitting={createMaterial.isPending}
          onClose={() => setShowUploadMaterial(false)}
          onSubmit={handleCreateMaterial}
          onError={msg => showToast(msg, 'error')}
        />
      )}

      {/* Inline toast for write feedback (no global toast provider in this view) */}
      {toast && (
        <div style={{ position: 'fixed', top: 56, right: 24, zIndex: 9999, animation: 'slideIn 0.3s ease-out' }}>
          <div style={{
            padding: '14px 20px', minWidth: 300, display: 'flex', alignItems: 'center', gap: 12,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(247,248,250,0.9) 100%)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid rgba(24,28,35,0.1)',
          }}>
            {toast.type === 'success'
              ? <CheckCircle size={20} style={{ color: '#34C759' }} />
              : <AlertCircle size={20} style={{ color: '#BA1A1A' }} />}
            <div style={{ fontSize: 14, fontWeight: 500, color: toast.type === 'success' ? '#181C23' : '#BA1A1A' }}>{toast.msg}</div>
            <button onClick={() => setToast(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              <XCircle size={16} style={{ color: '#9CA3AF' }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
