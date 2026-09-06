// Product Detail View - One-stop product information display (功能点 10-14)
// Synced with 设计原型V1.3 ProductDetail: header card + KPI strip + 6 tabs
// (info / rate plans / salable states / underwriting rules / training materials / performance)
// Status change wires through ProductStatusModal with session-memory state

import { useState } from 'react'
import {
  ArrowLeft, Edit2, ToggleRight, Download, Plus, Shield,
  CheckCircle, Upload, FileText, BookOpen, Video,
  TrendingUp, TrendingDown, Star, Globe, MapPin,
  ChevronRight, Settings, BarChart2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import ProductStatusModal from '@/components/ProductStatusModal'
import { products, formatCurrency, formatPercent, type InsuranceProduct } from './data/mockProductData'
import {
  ratePlans, getProductStates, underwritingRules, trainingMaterials, getProductPerf,
  type RatingFactorKey,
} from './data/productDetails'
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

export default function ProductDetail({ productId, navigateTo }: Props) {
  const { t, i18n } = useTranslation('product')
  const lang = i18n.language
  const [productState, setProductState] = useState<InsuranceProduct[]>(products)
  const [statusModalId, setStatusModalId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [stateSearch, setStateSearch] = useState('')

  const prod = productState.find(p => p.productId === productId) ?? productState[0]
  const myRatePlans = ratePlans.filter(r => r.productId === prod.productId)
  const allStates = getProductStates(prod.productId)
  const myRules = underwritingRules.filter(r => r.productId === prod.productId)
  const myMaterials = trainingMaterials.filter(m => m.productId === prod.productId)
  const perfData = getProductPerf(prod.productId)

  const activeStates = allStates.filter(s => s.status === 'active')
  const pendingStates = allStates.filter(s => s.status === 'pending')

  const filteredStates = allStates.filter(s =>
    !stateSearch || s.code.toLowerCase().includes(stateSearch.toLowerCase()) || s.name.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const tabs = [
    { id: 'info', label: t('detail.tabs.info') },
    { id: 'rates', label: t('detail.tabs.rates') },
    { id: 'states', label: t('detail.tabs.states') },
    { id: 'underwriting', label: t('detail.tabs.underwriting') },
    { id: 'training', label: t('detail.tabs.training') },
    { id: 'performance', label: t('detail.tabs.performance') },
  ]

  const statusMap: Record<InsuranceProduct['status'], { label: string; orb: string }> = {
    'Active': { label: t('values.statusOnSale'), orb: 'orb-green' },
    'Inactive': { label: t('values.statusOffSale'), orb: 'orb-gray' },
    'Paused': { label: t('values.statusPaused'), orb: 'orb-yellow' },
    'Pending': { label: t('values.statusPending'), orb: 'orb-purple' },
  }
  const sc = statusMap[prod.status]
  const lineColor = LINE_COLORS[prod.lineOfBusiness] ?? '#0058BC'
  const launchDate = prod.effectiveDate.split('T')[0]

  const typeLabel = t(`values.type${prod.type}`)

  const rpStatusLabels: Record<string, { cls: string; label: string }> = {
    active: { cls: 'badge-green', label: t('detail.rates.active') },
    draft: { cls: 'badge-gray', label: t('detail.rates.draft') },
    expired: { cls: 'badge-red', label: t('detail.rates.expired') },
    pending: { cls: 'badge-yellow', label: t('detail.rates.pending') },
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
    // Session-memory only: status change is applied to the local product copy
    if (!statusModalId) return
    setProductState(prev => prev.map(p => p.productId === statusModalId
      ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active', isActive: p.status !== 'Active' }
      : p
    ))
    setStatusModalId(null)
  }

  const statusModalProduct = statusModalId ? productState.find(p => p.productId === statusModalId) : undefined

  return (
    <div className="flex-1 overflow-auto">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 36px' }}>
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
                      <span className="badge badge-blue" style={{ fontSize: 11.5, background: lineColor + '18', color: lineColor, borderColor: lineColor + '30' }}>{t(`values.lob${prod.lineOfBusiness}`)}</span>
                      {prod.subLine ? t(`values.${prod.subLine}`) : ''}
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
                { label: t('detail.kpi.states'), value: `${activeStates.length} / 50`, sub: pendingStates.length > 0 ? t('detail.kpi.pendingApproval', { count: pendingStates.length }) : t('detail.kpi.allActive') },
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
                [t('tables.lineOfBusiness'), t(`values.lob${prod.lineOfBusiness}`)],
                [t('tables.subLine'), prod.subLine ? t(`values.${prod.subLine}`) : '-'],
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
                  {prod.insurerName.slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{prod.insurerName}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>NAIC {prod.naicCode}</div>
                </div>
              </div>
              {[
                [t('fields.underwritingMode'), t(`values.underwriting${prod.underwritingMode}`)],
                [t('fields.maxPolicyLimit'), prod.maxPolicyLimit ? `$${prod.maxPolicyLimit.toLocaleString()}` : '-'],
                [t('fields.renewalType'), prod.renewalType],
                [t('fields.policyTermYears'), `${prod.policyTermYears} ${lang.startsWith('en') ? (prod.policyTermYears === 1 ? 'year' : 'years') : '年'}`],
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
              <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t('detail.info.coverageTitle')}</div>
              {prod.coverages && prod.coverages.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {prod.coverages.map(c => {
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
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('detail.rates.add')}</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {myRatePlans.map(rp => (
                <div key={rp.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{rp.name}</span>
                        <span className={`badge ${rpStatusLabels[rp.status].cls}`}>{rpStatusLabels[rp.status].label}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>{rp.tier}</span>
                        <span className={`badge ${rp.filingStatus === 'approved' ? 'badge-green' : rp.filingStatus === 'pending' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 10.5 }}>
                          {rp.filingStatus === 'approved' ? t('detail.rates.filingApproved') : rp.filingStatus === 'pending' ? t('detail.rates.filingPending') : t('detail.rates.filingNotRequired')}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {t('detail.rates.validity', { from: rp.effectiveDate, to: rp.expiryDate })}
                      </div>
                    </div>
                    {rp.status !== 'expired' && (
                      <div className="flex gap-2">
                        <button className="btn-ghost" style={{ fontSize: 12.5 }}><Edit2 size={13} />{t('actions.edit')}</button>
                        {rp.status === 'draft' && <button className="btn-primary" style={{ fontSize: 12.5 }}>{t('detail.rates.submitApproval')}</button>}
                      </div>
                    )}
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
                { label: t('detail.rates.pending'), count: pendingStates.length, color: '#FFCC00' },
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
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('detail.states.applyNewState')}</button>
            </div>
            <div className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {filteredStates.map(s => (
                  <div
                    key={s.code}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `0.5px solid ${s.status === 'active' ? 'rgba(52,199,89,0.3)' : s.status === 'pending' ? 'rgba(255,204,0,0.35)' : 'rgba(193,198,215,0.3)'}`,
                      background: s.status === 'active' ? 'rgba(52,199,89,0.06)' : s.status === 'pending' ? 'rgba(255,204,0,0.06)' : 'rgba(255,255,255,0.4)',
                      cursor: s.status === 'not-available' ? 'default' : 'pointer',
                      opacity: s.status === 'not-available' ? 0.55 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: s.status === 'active' ? '#1a7a2e' : s.status === 'pending' ? '#a05800' : '#717786' }}>
                        {s.code}
                      </span>
                      {s.status === 'active' && <span className="orb orb-green" />}
                      {s.status === 'pending' && <span className="orb orb-yellow" />}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#717786', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                    {s.status === 'active' && s.channelCount !== undefined && (
                      <div style={{ fontSize: 10.5, color: '#34C759', marginTop: 2 }}>{t('detail.states.channels', { count: s.channelCount })}</div>
                    )}
                    {s.status === 'pending' && <div style={{ fontSize: 10.5, color: '#a05800', marginTop: 2 }}>{t('detail.states.underReview')}</div>}
                  </div>
                ))}
              </div>
            </div>
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
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('detail.underwriting.add')}</button>
            </div>
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
                        <span className={`badge ${ruleCatLabels[rule.category].cls}`} style={{ fontSize: 11 }}>{ruleCatLabels[rule.category].label}</span>
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
                          background: `${RULE_ACTION_COLOR[rule.action]}15`,
                          color: RULE_ACTION_COLOR[rule.action],
                        }}>
                          THEN → {lang.startsWith('en') ? (rule.actionValueEn ?? rule.action) : (rule.actionValue ?? rule.action)}
                        </div>
                        <span style={{ fontSize: 11.5, color: '#717786' }}>{t('detail.underwriting.lastModified', { date: rule.lastModified, by: rule.modifiedBy })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn-ghost" style={{ padding: 6 }}><Edit2 size={13} /></button>
                      <button className="btn-ghost" style={{ padding: 6 }}><Settings size={13} /></button>
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
              <button className="btn-primary" style={{ fontSize: 13 }}><Upload size={14} />{t('detail.training.uploadMaterial')}</button>
            </div>
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
                          {isExpiring && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>{t('detail.training.expiringSoon')}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#717786', marginBottom: 8 }}>
                          {m.fileName} · {m.fileSize} · {m.uploadDate} · {m.uploadedBy}
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
                        <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><Download size={12} />{t('detail.training.download')}</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {myMaterials.length === 0 && (
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
    </div>
  )
}
