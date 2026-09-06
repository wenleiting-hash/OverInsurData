import { useState } from 'react'
import {
  ArrowLeft, ChevronRight, CheckCircle, Info, X, Upload,
  FileText, Package, Shield, Globe, BookOpen, AlertTriangle,
} from 'lucide-react'
import { products, insurers } from '../data/mockData'
import { useLang } from '../i18n'
import type { ViewId } from '../components/Sidebar'

interface Props {
  mode: 'create' | 'edit'
  productId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'E&O', 'Marine', 'Specialty']
const SUB_LINES: Record<string, string[]> = {
  Auto: ['Personal Auto', 'Commercial Auto', 'Fleet Auto'],
  Home: ['Homeowners', 'High-Value Home', 'Renters', 'Condo'],
  Commercial: ['Commercial Property', 'BOP', 'General Liability', 'Workers Comp'],
  Cyber: ['SME Cyber', 'Enterprise Cyber', 'Technology E&O'],
  Life: ['Term Life', 'Whole Life', 'Universal Life', 'Variable Life'],
  Travel: ['Travel Insurance', 'Trip Cancellation', 'Medical Evacuation'],
  Professional: ['E&O', 'Miscellaneous Professional', 'Medical Malpractice'],
  "D&O": ["Directors & Officers", "Employment Practices", "Fiduciary"],
  "E&O": ["Technology E&O", "Media Liability", "Design Professional"],
  Marine: ['Ocean Marine', 'Inland Marine', 'Yacht'],
  Specialty: ['Excess & Surplus', 'Admitted Specialty', 'Non-Standard'],
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

const STEPS_META = [
  { id: 0, icon: Package },
  { id: 1, icon: FileText },
  { id: 2, icon: Shield },
  { id: 3, icon: Globe },
  { id: 4, icon: BookOpen },
]

const COVERAGE_KEYS = ['liability', 'comprehensive', 'collision', 'medical', 'um', 'roadside', 'substitute', 'newCarValue', 'deductibleWaiver'] as const
type CoverageKey = typeof COVERAGE_KEYS[number]

const FACTOR_KEYS = ['drivingRecord', 'vehicleType', 'drivingExperience', 'creditScore', 'territory', 'usage', 'ageBand', 'claimsHistory', 'vehicleValue', 'safetyEquip'] as const
type FactorKey = typeof FACTOR_KEYS[number]

const DOC_KEYS = ['filing', 'rates', 'guide', 'uwManual', 'training'] as const
type DocKey = typeof DOC_KEYS[number]

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

export default function ProductForm({ mode, productId, navigateTo }: Props) {
  const { t } = useLang()
  const existing = products.find(p => p.id === productId)

  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  // Step 0 — basic info
  const [name, setName] = useState(existing?.name ?? '')
  const [code, setCode] = useState(existing?.code ?? '')
  const [insurerId, setInsurerId] = useState(existing?.insurerId ?? '')
  const [line, setLine] = useState(existing?.line ?? '')
  const [subLine, setSubLine] = useState(existing?.subLine ?? '')
  const [prodType, setProdType] = useState<'Individual' | 'Group' | 'Voluntary'>(existing?.type ?? 'Individual')
  const [description, setDescription] = useState('')
  const [coverages, setCoverages] = useState<CoverageKey[]>(['liability', 'comprehensive', 'collision'])

  // Step 1 — rates
  const [rateType, setRateType] = useState<'flat' | 'tiered' | 'usage'>('tiered')
  const [baseRate, setBaseRate] = useState('')
  const [minPremium, setMinPremium] = useState('')
  const [maxPremium, setMaxPremium] = useState('')
  const [rateFactors, setRateFactors] = useState<FactorKey[]>(['drivingRecord', 'vehicleType', 'creditScore'])

  // Step 2 — underwriting
  const [ageMin, setAgeMin] = useState('18')
  const [ageMax, setAgeMax] = useState('80')
  const [excludeDUI, setExcludeDUI] = useState(true)
  const [referHighValue, setReferHighValue] = useState(true)
  const [referThreshold, setReferThreshold] = useState('150000')

  // Step 3 — states
  const [selectedStates, setSelectedStates] = useState<Set<string>>(
    new Set(existing?.states?.[0] === 'ALL' ? US_STATES : (existing?.states ?? []))
  )

  // Step 4 — files
  const [uploadedFiles, setUploadedFiles] = useState<DocKey[]>([])

  const stepLabels = [t.prdLblBasic, t.prdStepRates, t.prdLblUw, t.prdLblStates, t.prdLblCompliance]

  const coverageLabels: Record<CoverageKey, string> = {
    liability: t.prdCovLiability,
    comprehensive: t.prdCovComprehensive,
    collision: t.prdCovCollision,
    medical: t.prdCovMedical,
    um: t.prdCovUm,
    roadside: t.prdCovRoadside,
    substitute: t.prdCovSubstitute,
    newCarValue: t.prdCovNewCarValue,
    deductibleWaiver: t.prdCovDeductibleWaiver,
  }

  const factorLabels: Record<FactorKey, string> = {
    drivingRecord: t.prdFacDrivingRecord,
    vehicleType: t.prdFacVehicleType,
    drivingExperience: t.prdFacDrivingExp,
    creditScore: t.prdFacCredit,
    territory: t.prdFacTerritory,
    usage: t.prdFacUsage,
    ageBand: t.prdFacAgeBand,
    claimsHistory: t.prdFacClaimsHistory,
    vehicleValue: t.prdFacVehicleValue,
    safetyEquip: t.prdFacSafetyEquip,
  }

  const rateTypeOptions = [
    { val: 'flat', label: t.prdRateFlat, desc: t.prdRateFlatDesc },
    { val: 'tiered', label: t.prdRateTiered, desc: t.prdRateTieredDesc },
    { val: 'usage', label: t.prdRateUsage, desc: t.prdRateUsageDesc },
  ]

  const docList: { key: DocKey; label: string; required: boolean; hint: string; accept: string }[] = [
    { key: 'filing', label: t.prdDocFiling, required: true, hint: t.prdDocFilingHint, accept: '.pdf' },
    { key: 'rates', label: t.prdDocRates, required: true, hint: t.prdDocRatesHint, accept: '.pdf,.xlsx' },
    { key: 'guide', label: t.prdMatGuide, required: true, hint: t.prdDocGuideHint, accept: '.pdf' },
    { key: 'uwManual', label: t.prdDocUwManual, required: false, hint: t.prdDocUwHint, accept: '.pdf' },
    { key: 'training', label: t.prdMatDeck, required: false, hint: t.prdDocTrainingHint, accept: '.pdf,.pptx' },
  ]

  const statePresets = [
    { label: t.prdPresetNortheast, states: ['NY', 'NJ', 'CT', 'MA', 'PA', 'VT', 'NH', 'ME', 'RI'] },
    { label: t.prdPresetCaTx, states: ['CA', 'TX'] },
  ]

  const typeOptions = [
    { val: 'Individual' as const, label: t.prdTypeIndividual },
    { val: 'Group' as const, label: t.prdTypeGroup },
    { val: 'Voluntary' as const, label: t.prdTypeVoluntary },
  ]

  const toggleState = (s: string) => setSelectedStates(prev => {
    const n = new Set(prev)
    n.has(s) ? n.delete(s) : n.add(s)
    return n
  })

  const stepDone = (i: number) => {
    if (i === 0) return !!name && !!code && !!insurerId && !!line
    if (i === 1) return !!baseRate && !!minPremium && !!maxPremium
    if (i === 2) return !!ageMin && !!ageMax
    if (i === 3) return selectedStates.size > 0
    return true
  }

  const handleSubmit = () => {
    setSaved(true)
    setTimeout(() => navigateTo('product-list'), 1200)
  }

  const back = () => navigateTo(productId ? 'product-detail' : 'product-list', { productId })

  if (saved) return (
    <div style={{ maxWidth: 680, margin: '80px auto', textAlign: 'center' }}>
      <div className="card" style={{ padding: '60px 40px' }}>
        <CheckCircle size={48} style={{ color: '#34C759', margin: '0 auto 16px' }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>
          {mode === 'create' ? t.prdCreated : t.prdUpdated}
        </div>
        <p style={{ fontSize: 14, color: '#717786' }}>{t.prdRedirecting}</p>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button className="btn-ghost" onClick={back}><ArrowLeft size={15} /></button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
            {mode === 'create' ? t.prdNewProduct : t.prdEditTitle(existing?.name ?? '')}
          </h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {mode === 'create' ? t.prdCreateSubtitle : t.prdEditSubtitle}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step nav */}
        <div className="card" style={{ padding: '18px 16px', position: 'sticky', top: 24 }}>
          {STEPS_META.map((s, i) => {
            const done = stepDone(i)
            const active = step === i
            return (
              <div
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 4,
                  background: active ? 'rgba(0,88,188,0.09)' : 'transparent',
                  transition: 'background 120ms',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done && !active ? 'rgba(52,199,89,0.12)' : active ? 'rgba(0,88,188,0.15)' : 'rgba(193,198,215,0.2)',
                }}>
                  {done && !active
                    ? <CheckCircle size={13} style={{ color: '#34C759' }} />
                    : <s.icon size={13} style={{ color: active ? '#0058BC' : '#717786' }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#0058BC' : '#414755' }}>{stepLabels[i]}</div>
                  {done && !active && <div style={{ fontSize: 10.5, color: '#34C759' }}>{t.prdStepDone}</div>}
                </div>
              </div>
            )
          })}
          <div style={{ marginTop: 16, padding: '0 4px' }}>
            <div style={{ height: 4, background: 'rgba(193,198,215,0.3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(STEPS_META.filter((_, i) => stepDone(i)).length / STEPS_META.length) * 100}%`, background: '#34C759', borderRadius: 3, transition: 'width 300ms' }} />
            </div>
            <div style={{ fontSize: 11.5, color: '#717786', marginTop: 6, textAlign: 'center' }}>
              {t.prdStepsProgress(STEPS_META.filter((_, i) => stepDone(i)).length, STEPS_META.length)}
            </div>
          </div>
        </div>

        {/* Form area */}
        <div className="card" style={{ padding: '28px 32px' }}>
          {/* ── Step 0: basic info ── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 24 }}>{t.prdInfoBasic}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <Field label={t.prdFieldName} required>
                  <input className="input-glass w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Travelers Auto Insurance" style={{ fontSize: 13.5 }} />
                </Field>
                <Field label={t.prdLblCode} required hint={t.prdCodeHint}>
                  <input className="input-glass w-full" value={code} onChange={e => setCode(e.target.value)} placeholder="TRV-AUTO-001" style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                </Field>
                <Field label={t.prdLblCarrier} required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={insurerId} onChange={e => setInsurerId(e.target.value)}>
                    <option value="">{t.prdSelectInsurer}</option>
                    {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName} — {i.name}</option>)}
                  </select>
                </Field>
                <Field label={t.prdLblType} required>
                  <div className="flex gap-2">
                    {typeOptions.map(tp => (
                      <label key={tp.val} style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                        background: prodType === tp.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                        border: `0.5px solid ${prodType === tp.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                      }}>
                        <input type="radio" name="prodType" checked={prodType === tp.val} onChange={() => setProdType(tp.val)} style={{ accentColor: '#0058BC' }} />
                        <span style={{ fontSize: 12.5 }}>{tp.label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label={t.prdLblLine} required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={line} onChange={e => { setLine(e.target.value); setSubLine('') }}>
                    <option value="">{t.prdSelectLine}</option>
                    {LINES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label={t.prdLblSubLine} required>
                  <select className="input-glass w-full" style={{ fontSize: 13.5 }} value={subLine} onChange={e => setSubLine(e.target.value)} disabled={!line}>
                    <option value="">{t.prdSelectSubLine}</option>
                    {(SUB_LINES[line] ?? []).map(sl => <option key={sl} value={sl}>{sl}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={t.prdFieldDesc}>
                <textarea className="input-glass w-full" style={{ minHeight: 88, resize: 'vertical', fontSize: 13.5 }}
                  placeholder={t.prdDescPlaceholder}
                  value={description} onChange={e => setDescription(e.target.value)} />
              </Field>
              <Field label={t.prdCoverageTitle} hint={t.prdCoverageHint}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {COVERAGE_KEYS.map(c => (
                    <label key={c} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      background: coverages.includes(c) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                      border: `0.5px solid ${coverages.includes(c) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      color: coverages.includes(c) ? '#0058BC' : '#414755',
                    }}>
                      <input type="checkbox" checked={coverages.includes(c)}
                        onChange={() => setCoverages(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                        style={{ display: 'none' }} />
                      {coverages.includes(c) && <CheckCircle size={11} />}
                      {coverageLabels[c]}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 1: rates ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 24 }}>{t.prdRateConfigTitle}</div>
              <Field label={t.prdRateType} required>
                <div style={{ display: 'flex', gap: 10 }}>
                  {rateTypeOptions.map(rt => (
                    <label key={rt.val} style={{
                      flex: 1, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      background: rateType === rt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${rateType === rt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                    }}>
                      <input type="radio" name="rateType" checked={rateType === rt.val} onChange={() => setRateType(rt.val as any)} style={{ display: 'none' }} />
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: rateType === rt.val ? '#0058BC' : '#181C23' }}>{rt.label}</div>
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 3 }}>{rt.desc}</div>
                    </label>
                  ))}
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 20px' }}>
                <Field label={t.prdBaseRateAnnual} required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={baseRate} onChange={e => setBaseRate(e.target.value)}
                      placeholder="1,200" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
                <Field label={t.prdMinPremium} required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={minPremium} onChange={e => setMinPremium(e.target.value)}
                      placeholder="480" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
                <Field label={t.prdMaxPremium} required>
                  <div className="relative">
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                    <input className="input-glass w-full" value={maxPremium} onChange={e => setMaxPremium(e.target.value)}
                      placeholder="4,200" style={{ paddingLeft: 22, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                  </div>
                </Field>
              </div>
              <Field label={t.prdRatingFactors} hint={t.prdFactorsHint}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {FACTOR_KEYS.map(f => (
                    <label key={f} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                      background: rateFactors.includes(f) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                      border: `0.5px solid ${rateFactors.includes(f) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      color: rateFactors.includes(f) ? '#0058BC' : '#414755',
                    }}>
                      <input type="checkbox" checked={rateFactors.includes(f)}
                        onChange={() => setRateFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])}
                        style={{ display: 'none' }} />
                      {rateFactors.includes(f) && <CheckCircle size={11} />}
                      {factorLabels[f]}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 2: underwriting ── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 6 }}>{t.prdUwConfigTitle}</div>
              <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{t.prdUwConfigSub}</p>

              <div style={{ background: 'rgba(255,149,0,0.06)', border: '0.5px solid rgba(255,149,0,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 22 }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t.prdUwNoteTitle}</span>
                </div>
                <p style={{ fontSize: 12.5, color: '#7a5c00' }}>{t.prdUwNoteBody}</p>
              </div>

              <Field label={t.prdAgeReq}>
                <div className="flex items-center gap-10">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: '#414755' }}>{t.prdAgeMin}</span>
                    <input className="input-glass" value={ageMin} onChange={e => setAgeMin(e.target.value)}
                      style={{ width: 80, textAlign: 'center', fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                    <span style={{ fontSize: 13, color: '#717786' }}>{t.prdYears}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 13, color: '#414755' }}>{t.prdAgeMax}</span>
                    <input className="input-glass" value={ageMax} onChange={e => setAgeMax(e.target.value)}
                      style={{ width: 80, textAlign: 'center', fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                    <span style={{ fontSize: 13, color: '#717786' }}>{t.prdYears}</span>
                  </div>
                </div>
              </Field>

              <Field label={t.prdAutoRules}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: excludeDUI ? 'rgba(186,26,26,0.05)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${excludeDUI ? 'rgba(186,26,26,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                    <input type="checkbox" checked={excludeDUI} onChange={e => setExcludeDUI(e.target.checked)} style={{ accentColor: '#BA1A1A', marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t.prdRuleDui} <span style={{ color: '#BA1A1A', fontSize: 12 }}>{t.prdTagExclusion}</span></div>
                      <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t.prdRuleDuiDesc}</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    background: referHighValue ? 'rgba(255,149,0,0.05)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${referHighValue ? 'rgba(255,149,0,0.2)' : 'rgba(193,198,215,0.5)'}` }}>
                    <input type="checkbox" checked={referHighValue} onChange={e => setReferHighValue(e.target.checked)} style={{ accentColor: '#FF9500', marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t.prdRuleHighValue} <span style={{ color: '#a05800', fontSize: 12 }}>{t.prdTagReferral}</span></div>
                      <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t.prdRuleHighValueDesc}</div>
                      {referHighValue && (
                        <div className="flex items-center gap-3 mt-8" style={{ marginTop: 8 }}>
                          <span style={{ fontSize: 13, color: '#414755' }}>{t.prdReferThreshold}</span>
                          <div className="relative">
                            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786', fontSize: 14 }}>$</span>
                            <input className="input-glass" value={referThreshold} onChange={e => setReferThreshold(e.target.value)}
                              style={{ paddingLeft: 22, width: 120, fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </Field>
            </div>
          )}

          {/* ── Step 3: states ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.prdStatesConfigTitle}</div>
              <div className="flex items-center justify-between mb-16" style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#717786' }}>
                  {t.prdStatesSelectedLead}<strong style={{ color: '#0058BC' }}>{selectedStates.size}</strong>{t.prdStatesSelectedTail}
                </p>
                <div className="flex gap-2">
                  <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setSelectedStates(new Set(US_STATES))}>{t.prdSelectAll}</button>
                  <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setSelectedStates(new Set())}>{t.prdClearAll}</button>
                  {/* Common presets */}
                  {statePresets.map(p => (
                    <button key={p.label} className="btn-ghost" style={{ fontSize: 12.5 }}
                      onClick={() => setSelectedStates(new Set([...selectedStates, ...p.states]))}>
                      +{p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 7 }}>
                {US_STATES.map(s => (
                  <div
                    key={s}
                    onClick={() => toggleState(s)}
                    style={{
                      padding: '8px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                      background: selectedStates.has(s) ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.5)',
                      border: `0.5px solid ${selectedStates.has(s) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                      transition: 'all 100ms',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: selectedStates.has(s) ? '#0058BC' : '#717786' }}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: compliance documents ── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.prdDocsTitle}</div>
              <p style={{ fontSize: 13, color: '#717786', marginBottom: 24 }}>{t.prdDocsSub}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {docList.map(doc => {
                  const uploaded = uploadedFiles.includes(doc.key)
                  return (
                    <div key={doc.key} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
                      background: uploaded ? 'rgba(52,199,89,0.06)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${uploaded ? 'rgba(52,199,89,0.25)' : 'rgba(193,198,215,0.4)'}`,
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.12)' : 'rgba(241,243,254,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {uploaded ? <CheckCircle size={16} style={{ color: '#34C759' }} /> : <FileText size={16} style={{ color: '#717786' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>
                          {doc.label} {doc.required && <span style={{ color: '#BA1A1A' }}>*</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{doc.hint} · {t.prdSupports(doc.accept)}</div>
                        {uploaded && <div style={{ fontSize: 12, color: '#34C759', marginTop: 2 }}>{t.prdJustUploaded(doc.label)}</div>}
                      </div>
                      {uploaded
                        ? <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setUploadedFiles(f => f.filter(x => x !== doc.key))}>
                            <X size={13} />{t.prdRemove}
                          </button>
                        : <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={() => setUploadedFiles(f => [...f, doc.key])}>
                            <Upload size={13} />{t.prdUpload}
                          </button>
                      }
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-28" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : back()}>
              <ArrowLeft size={14} /> {step === 0 ? t.prdCancel : t.prdPrev}
            </button>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ fontSize: 13 }}>{t.prdSaveDraft}</button>
              {step < STEPS_META.length - 1
                ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={!stepDone(step)}>
                    {t.prdNext} <ChevronRight size={14} />
                  </button>
                : <button className="btn-primary" style={{ fontSize: 13, background: '#1a7a2e' }} onClick={handleSubmit}>
                    <CheckCircle size={14} /> {mode === 'create' ? t.prdSubmitListing : t.prdSaveChanges}
                  </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
