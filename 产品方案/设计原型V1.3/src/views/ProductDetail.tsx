import { useState } from 'react'
import {
  ArrowLeft, Edit2, ToggleRight, Download, Plus, Shield,
  CheckCircle, Upload, FileText, BookOpen, Video,
  AlertTriangle, TrendingUp, TrendingDown, Star, Globe, MapPin,
  ChevronRight, Settings, BarChart2,
} from 'lucide-react'
import { products, insurers, formatCurrency, formatPercent } from '../data/mockData'
import {
  ratePlans, getProductStates, underwritingRules, trainingMaterials, getProductPerf,
  type RatingFactorKey,
} from '../data/productDetails'
import { useLang } from '../i18n'
import type { ViewId } from '../components/Sidebar'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

interface Props {
  productId: string
  navigateTo: (view: ViewId, params?: any) => void
  onStatusChange?: (id: string) => void
}

const LINE_COLORS: Record<string, string> = {
  Auto: '#0058BC', Home: '#34C759', Commercial: '#AF52DE',
  Cyber: '#FF3B30', Life: '#FF9500', Travel: '#64748b',
  Professional: '#FFCC00', D_O: '#FF453A',
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

export default function ProductDetail({ productId, navigateTo, onStatusChange }: Props) {
  const { lang, t } = useLang()
  const [activeTab, setActiveTab] = useState('info')
  const [stateSearch, setStateSearch] = useState('')
  const [showAllStates, setShowAllStates] = useState(false)

  const prod = products.find(p => p.id === productId) ?? products[0]
  const ins = insurers.find(i => i.id === prod.insurerId)!
  const myRatePlans = ratePlans.filter(r => r.productId === prod.id)
  const allStates = getProductStates(prod.id)
  const myRules = underwritingRules.filter(r => r.productId === prod.id)
  const myMaterials = trainingMaterials.filter(m => m.productId === prod.id)
  const perfData = getProductPerf(prod.id)

  const activeStates = allStates.filter(s => s.status === 'active')
  const pendingStates = allStates.filter(s => s.status === 'pending')

  const filteredStates = allStates.filter(s =>
    !stateSearch || s.code.toLowerCase().includes(stateSearch.toLowerCase()) || s.name.toLowerCase().includes(stateSearch.toLowerCase())
  )

  const tabs = [
    { id: 'info', label: t.prdLblBasic },
    { id: 'rates', label: t.prdTabRates },
    { id: 'states', label: t.prdLblStates },
    { id: 'underwriting', label: t.prdLblUw },
    { id: 'training', label: t.prdLblTraining },
    { id: 'performance', label: t.prdTabPerf },
  ]

  const statusMap: Record<string, { label: string; cls: string; orb: string }> = {
    'on-sale': { label: t.prdStatusOnSale, cls: 'badge-green', orb: 'orb-green' },
    'off-sale': { label: t.prdStatusOffSale, cls: 'badge-gray', orb: 'orb-gray' },
    'paused': { label: t.prdStatusPaused, cls: 'badge-yellow', orb: 'orb-yellow' },
    'pending': { label: t.prdStatusPending, cls: 'badge-purple', orb: 'orb-purple' },
  }
  const sc = statusMap[prod.status]
  const lineColor = LINE_COLORS[prod.line] ?? '#0058BC'

  const typeLabel = prod.type === 'Individual' ? t.prdTypeIndividual : prod.type === 'Group' ? t.prdTypeGroup : t.prdTypeVoluntary

  const rpStatusLabels: Record<string, { cls: string; label: string }> = {
    active: { cls: 'badge-green', label: t.prdRpActive },
    draft: { cls: 'badge-gray', label: t.prdRpDraft },
    expired: { cls: 'badge-red', label: t.prdRpExpired },
    pending: { cls: 'badge-yellow', label: t.prdRpPending },
  }

  const ruleCatLabels: Record<string, { cls: string; label: string }> = {
    eligibility: { cls: 'badge-red', label: t.prdRuleEligibility },
    rating: { cls: 'badge-blue', label: t.prdRuleRating },
    exclusion: { cls: 'badge-orange', label: t.prdRuleExclusion },
    referral: { cls: 'badge-yellow', label: t.prdRuleReferral },
  }

  const matLabels: Record<string, string> = {
    'product-guide': t.prdMatGuide,
    'rate-manual': t.prdMatRateManual,
    'underwriting-guide': t.prdMatUwGuide,
    'compliance': t.prdMatCompliance,
    'training-deck': t.prdMatDeck,
    'faq': t.prdMatFaq,
    'video': t.prdMatVideo,
  }

  const factorLabels: Record<RatingFactorKey, string> = {
    drivingRecord: t.prdFacDrivingRecord,
    vehicleType: t.prdFacVehicleType,
    drivingExperience: t.prdFacDrivingExp,
    creditScore: t.prdFacCredit,
    territory: t.prdFacTerritory,
    usage: t.prdFacUsage,
    homeRebuildCost: t.prdFacHomeRebuildCost,
    securityFeatures: t.prdFacSecurityFeatures,
    naturalRisk: t.prdFacNatRisk,
    lossHistory: t.prdFacLossHistory,
    annualRevenue: t.prdFacAnnualRevenue,
    industryRisk: t.prdFacIndustryRisk,
    securityPosture: t.prdFacSecurityPosture,
    incidentHistory: t.prdFacIncidentHistory,
    employeeCount: t.prdFacEmployeeCount,
    supplyChain: t.prdFacSupplyChain,
  }

  const latestPerf = perfData[perfData.length - 1]
  const prevPerf = perfData[perfData.length - 2]
  const premiumGrowth = prevPerf ? ((latestPerf.premium - prevPerf.premium) / prevPerf.premium) : 0

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-2 mb-4">
          <button className="btn-ghost" onClick={() => navigateTo('product-list')}><ArrowLeft size={15} /></button>
          <span style={{ fontSize: 13, color: '#717786' }}>{t.prdTitle}</span>
          <ChevronRight size={13} style={{ color: '#C1C6D7' }} />
          <span style={{ fontSize: 13, color: '#181C23', fontWeight: 500 }}>{prod.name}</span>
        </div>

        <div className="card" style={{ padding: '22px 24px' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Product icon */}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `linear-gradient(135deg, ${lineColor}22, ${lineColor}44)`,
                border: `1.5px solid ${lineColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: lineColor }}>
                  {prod.line.slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{prod.name}</h1>
                  <span className={`badge ${sc.cls}`}>{sc.label}</span>
                  <span className="badge badge-gray" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{prod.code}</span>
                </div>
                <div className="flex items-center gap-3" style={{ fontSize: 13, color: '#717786' }}>
                  <span className="flex items-center gap-1">
                    <span className={`badge ${LINE_COLORS[prod.line] ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: 11.5, background: lineColor + '18', color: lineColor, borderColor: lineColor + '30' }}>{prod.line}</span>
                    {prod.subLine}
                  </span>
                  <span>·</span>
                  <span>{typeLabel}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Globe size={12} />{ins.shortName}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{t.prdStatesSelling(activeStates.length)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost" style={{ fontSize: 13 }}><Download size={14} />{t.prdExport}</button>
              {prod.status === 'on-sale'
                ? <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }} onClick={() => onStatusChange?.(prod.id)}>
                    <ToggleRight size={14} />{t.prdDelist}
                  </button>
                : <button className="btn-ghost" style={{ fontSize: 13, color: '#1a7a2e' }} onClick={() => onStatusChange?.(prod.id)}>
                    <ToggleRight size={14} />{t.prdList}
                  </button>
              }
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('product-edit', { productId: prod.id })}>
                <Edit2 size={14} />{t.prdEdit}
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginTop: 22, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
            {[
              { label: t.prdLblPremium, value: formatCurrency(prod.premium, true), sub: `+${(premiumGrowth * 100).toFixed(1)}% MoM`, color: '#0058BC' },
              { label: t.prdLblPolicies, value: prod.policyCount.toLocaleString(), sub: t.prdKpiStatesValid(activeStates.length) },
              { label: t.prdLblLossRatio, value: formatPercent(prod.lossRatio), sub: prod.lossRatio > 0.65 ? t.prdKpiLossWarn : t.prdNormalRange, color: prod.lossRatio > 0.65 ? '#BA1A1A' : undefined },
              { label: t.prdLblRenewal, value: formatPercent(prod.renewalRate), sub: prod.renewalRate > 0.85 ? t.prdKpiHighRetention : t.prdNormal },
              { label: t.prdLblStates, value: `${activeStates.length} / 50`, sub: pendingStates.length > 0 ? t.prdKpiPendingApproval(pendingStates.length) : t.prdKpiAllActive },
              { label: t.prdLblLaunch, value: prod.launchDate, sub: t.prdKpiOnlineMonths(Math.floor((Date.now() - new Date(prod.launchDate).getTime()) / 86400000 / 30)) },
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 18 }}>{t.prdInfoBasic}</div>
            {[
              [t.prdFieldName, prod.name],
              [t.prdLblCode, prod.code],
              [t.prdLblLine, prod.line],
              [t.prdLblSubLine, prod.subLine],
              [t.prdLblType, typeLabel],
              [t.prdLblLaunch, prod.launchDate],
              [t.prdFieldStatus, sc.label],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 13 }}>
                <div style={{ width: 100, fontSize: 12.5, color: '#717786', flexShrink: 0 }}>{label}</div>
                <div style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 18 }}>{t.prdLblCarrier}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0058BC22, #0058BC44)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#0058BC' }}>
                {ins.shortName.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{ins.name}</div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>NAIC {ins.naicCode} · {ins.type}</div>
              </div>
            </div>
            {[
              ['AM Best', ins.amBestRating],
              [t.prdFieldSpRating, ins.spRating],
              [t.prdFieldHq, ins.headquarters],
              [t.prdFieldRegion, ins.region],
              [t.prdFieldCoopStatus, ins.coopStatus === 'active' ? t.prdCoopActive : ins.coopStatus === 'expiring' ? t.prdCoopExpiring : ins.coopStatus],
              [t.prdFieldContractExpiry, ins.contractExpiry],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ width: 100, fontSize: 12.5, color: '#717786', flexShrink: 0 }}>{label}</div>
                <div style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '22px 24px', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 14 }}>{t.prdCoverageTitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { icon: Shield, label: t.prdCovLiability, desc: t.prdCovLiabilityDesc },
                { icon: CheckCircle, label: t.prdCovComprehensive, desc: t.prdCovComprehensiveDesc },
                { icon: TrendingUp, label: t.prdCovCollision, desc: t.prdCovCollisionDesc },
                { icon: Globe, label: t.prdCovMedical, desc: t.prdCovMedicalDesc },
                { icon: Star, label: t.prdCovUm, desc: t.prdCovUmDesc },
                { icon: AlertTriangle, label: t.prdCovRoadside, desc: t.prdCovRoadsideDesc },
              ].map(c => (
                <div key={c.label} style={{ padding: '12px 14px', background: 'rgba(241,243,254,0.7)', borderRadius: 10, display: 'flex', gap: 12 }}>
                  <c.icon size={16} style={{ color: '#0058BC', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{c.label}</div>
                    <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Rate plans ── */}
      {activeTab === 'rates' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontSize: 14, color: '#717786' }}>
              {t.prdRatesSummary(myRatePlans.length, myRatePlans.filter(r => r.status === 'active').length)}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t.prdRatesAdd}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {myRatePlans.map(rp => (
              <div key={rp.id} className="card" style={{ padding: '20px 24px' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{rp.name}</span>
                      <span className={`badge ${rpStatusLabels[rp.status].cls}`}>{rpStatusLabels[rp.status].label}</span>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{rp.tier}</span>
                      <span className={`badge ${rp.filingStatus === 'approved' ? 'badge-green' : rp.filingStatus === 'pending' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: 10.5 }}>
                        {rp.filingStatus === 'approved' ? t.prdFilingApproved : rp.filingStatus === 'pending' ? t.prdFilingPending : t.prdFilingNotRequired}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#717786' }}>
                      {t.prdValidity(rp.effectiveDate, rp.expiryDate)}
                    </div>
                  </div>
                  {rp.status !== 'expired' && (
                    <div className="flex gap-2">
                      <button className="btn-ghost" style={{ fontSize: 12.5 }}><Edit2 size={13} />{t.prdEdit}</button>
                      {rp.status === 'draft' && <button className="btn-primary" style={{ fontSize: 12.5 }}>{t.prdSubmitApproval}</button>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      [t.prdBaseRate, `$${rp.baseRate.toLocaleString()}`],
                      [t.prdMinPremium, `$${rp.minPremium.toLocaleString()}`],
                      [t.prdMaxPremium, `$${rp.maxPremium.toLocaleString()}`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ padding: '9px 12px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {rp.ratingFactors.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t.prdRatingFactors}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rp.ratingFactors.map(f => (
                          <div key={f.factor} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 100, fontSize: 12.5, color: '#181C23', fontWeight: 500 }}>{factorLabels[f.factor]}</div>
                            <div style={{ flex: 1, height: 6, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${f.weight * 100}%`, background: '#0058BC', borderRadius: 3 }} />
                            </div>
                            <div style={{ width: 42, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#0058BC', textAlign: 'right' }}>{(f.weight * 100).toFixed(0)}%</div>
                            <div style={{ fontSize: 11.5, color: '#717786', flex: 1 }}>{lang === 'en' ? f.descriptionEn : f.description}</div>
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
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            {[
              { label: t.prdRpActive, count: activeStates.length, color: '#34C759' },
              { label: t.prdRpPending, count: pendingStates.length, color: '#FFCC00' },
              { label: t.prdStNotAvail, count: allStates.filter(s => s.status === 'not-available').length, color: '#C1C6D7' },
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
                placeholder={t.prdStateSearch}
                className="input-glass"
                style={{ fontSize: 13, paddingLeft: 10, width: 180 }}
                value={stateSearch}
                onChange={e => setStateSearch(e.target.value)}
              />
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t.prdApplyNewState}</button>
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
                    <div style={{ fontSize: 10.5, color: '#34C759', marginTop: 2 }}>{t.prdChannels(s.channelCount)}</div>
                  )}
                  {s.status === 'pending' && <div style={{ fontSize: 10.5, color: '#a05800', marginTop: 2 }}>{t.prdUnderReview}</div>}
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
              {t.prdUwSummary(myRules.length, myRules.filter(r => r.status === 'active').length, myRules.filter(r => r.status === 'testing').length)}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t.prdUwAdd}</button>
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
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{lang === 'en' ? rule.nameEn : rule.name}</span>
                      <span className={`badge ${ruleCatLabels[rule.category].cls}`} style={{ fontSize: 11 }}>{ruleCatLabels[rule.category].label}</span>
                      {rule.status === 'testing' && <span className="badge badge-purple" style={{ fontSize: 11 }}>{t.prdRuleTesting}</span>}
                      {rule.status === 'inactive' && <span className="badge badge-gray" style={{ fontSize: 11 }}>{t.prdRuleInactive}</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#414755', marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(241,243,254,0.8)', padding: '6px 10px', borderRadius: 7 }}>
                      IF {lang === 'en' ? rule.conditionEn : rule.condition}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{lang === 'en' ? rule.conditionDetailEn : rule.conditionDetail}</div>
                    <div className="flex items-center gap-3">
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                        background: `${RULE_ACTION_COLOR[rule.action]}15`,
                        color: RULE_ACTION_COLOR[rule.action],
                      }}>
                        THEN → {lang === 'en' ? (rule.actionValueEn ?? rule.action) : (rule.actionValue ?? rule.action)}
                      </div>
                      <span style={{ fontSize: 11.5, color: '#717786' }}>{t.prdLastModified(rule.lastModified, rule.modifiedBy)}</span>
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
              {t.prdTrainingSummary(myMaterials.length, myMaterials.reduce((a, m) => a + m.downloads, 0))}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Upload size={14} />{t.prdUploadMaterial}</button>
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
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{lang === 'en' ? m.titleEn : m.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>{matLabels[m.type]}</span>
                        <span className="badge badge-blue" style={{ fontSize: 10.5 }}>v{m.version}</span>
                        {isExpiring && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>{t.prdExpiringSoon}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 8 }}>
                        {m.fileName} · {m.fileSize} · {m.uploadDate} · {m.uploadedBy}
                      </div>
                      {m.requiredFor.length > 0 && (
                        <div style={{ fontSize: 11.5, color: '#0058BC', marginBottom: 8 }}>
                          {t.prdRequiredFor(m.requiredFor.join(' / '))}
                        </div>
                      )}
                      {m.expiryDate && (
                        <div style={{ fontSize: 11.5, color: isExpiring ? '#BA1A1A' : '#717786' }}>
                          {t.prdValidUntil(m.expiryDate)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end shrink-0">
                      <div style={{ fontSize: 12.5, color: '#717786', textAlign: 'right' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: '#181C23' }}>{m.downloads}</span> {t.prdDownloadsSuffix}
                      </div>
                      <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }}><Download size={12} />{t.prdDownload}</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {myMaterials.length === 0 && (
            <div className="card" style={{ padding: 60, textAlign: 'center' }}>
              <FileText size={32} style={{ color: '#C1C6D7', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 15, color: '#717786' }}>{t.prdTrainingEmpty}</div>
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
                label: t.prdPerfPremium,
                value: `$${latestPerf.premium.toFixed(1)}M`,
                delta: `${premiumGrowth >= 0 ? '+' : ''}${(premiumGrowth * 100).toFixed(1)}%`,
                up: premiumGrowth >= 0,
              },
              {
                label: t.prdPerfNewBiz,
                value: `$${latestPerf.newBiz.toFixed(1)}M`,
                delta: `${latestPerf.newBiz > prevPerf?.newBiz ? '+' : ''}${prevPerf ? (((latestPerf.newBiz - prevPerf.newBiz) / prevPerf.newBiz) * 100).toFixed(1) : '0'}%`,
                up: latestPerf.newBiz >= (prevPerf?.newBiz ?? 0),
              },
              {
                label: t.prdLblLossRatio,
                value: formatPercent(latestPerf.lossRatio),
                delta: latestPerf.lossRatio < 0.65 ? t.prdNormalRange : t.prdOverThreshold,
                up: latestPerf.lossRatio < 0.65,
                warn: latestPerf.lossRatio >= 0.65,
              },
              {
                label: t.prdPerfPolicies,
                value: latestPerf.policies.toLocaleString(),
                delta: t.prdPerfClaims(latestPerf.claimsCount),
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
              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.prdChartPremiumTrend}</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${v}M`} width={44} />
                  <Tooltip formatter={(v: any) => [`$${v}M`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Line type="monotone" dataKey="premium" stroke={lineColor} strokeWidth={2.5} dot={false} name={t.prdLblPremium} />
                  <Line type="monotone" dataKey="renewal" stroke="#34C759" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name={t.prdSeriesRenewal} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.prdChartNewVsRenewal}</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `$${v}M`} width={44} />
                  <Tooltip formatter={(v: any) => [`$${v}M`, '']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="newBiz" name={t.prdSeriesNewBiz} fill={lineColor} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="renewal" name={t.prdSeriesRenewal} fill="#34C759" radius={[4, 4, 0, 0]} opacity={0.75} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ padding: '20px 22px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.prdChartLossTrend}</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={perfData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(193,198,215,0.3)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#717786' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => `${(v * 100).toFixed(0)}%`} width={42} domain={[0.4, 0.8]} />
                  <Tooltip formatter={(v: any) => [`${(v * 100).toFixed(1)}%`, t.prdLblLossRatio]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Line type="monotone" dataKey="lossRatio" stroke="#FF9500" strokeWidth={2.5} dot={{ r: 3, fill: '#FF9500' }} name={t.prdLblLossRatio} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
