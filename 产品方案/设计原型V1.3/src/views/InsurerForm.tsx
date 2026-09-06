import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, MapPin, Star,
  DollarSign, FileText, Upload, X, AlertCircle, Info, Plus, Trash2,
} from 'lucide-react'
import { insurers } from '../data/mockData'
import { US_STATES, AM_BEST_RATINGS, SP_RATINGS } from '../data/insurerDetails'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

interface Props {
  mode: 'create' | 'edit'
  insurerId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const STEPS = [
  { id: 'basic', icon: Building2 },
  { id: 'regulatory', icon: MapPin },
  { id: 'ratings', icon: Star },
  { id: 'settlement', icon: DollarSign },
  { id: 'documents', icon: FileText },
]

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West']
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'P&C', 'Cyber', 'Specialty', 'D&O', 'E&O', 'E&S', 'Marine', 'Workers Comp']
const COOP_TYPES = ['directAgency', 'mga', 'wholesaleBroker', 'referral', 'platform']

const FORM_DOCS: { type: string; required: boolean }[] = [
  { type: 'license', required: true },
  { type: 'masterAgreement', required: true },
  { type: 'nda', required: true },
  { type: 'dpa', required: false },
  { type: 'amBestReport', required: false },
]

const INPUT = { className: 'input-glass w-full', style: { fontSize: 13.5 } }

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
      {label}
      {required && <span style={{ color: '#BA1A1A' }}>*</span>}
      {hint && <span title={hint} style={{ display: 'inline-flex', cursor: 'help' }}><Info size={11} style={{ color: '#C1C6D7' }} /></span>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#181C23', marginBottom: 16, paddingBottom: 8, borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({ cols = 2, children }: { cols?: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '14px 20px' }}>
      {children}
    </div>
  )
}

export default function InsurerForm({ mode, insurerId, navigateTo }: Props) {
  const { t } = useLang()
  const existing = insurerId ? insurers.find(i => i.id === insurerId) : undefined
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  const stepMeta = [
    { id: 'basic', icon: Building2, label: t.insStepBasic, desc: t.insStepBasicDesc },
    { id: 'regulatory', icon: MapPin, label: t.insStepRegulatory, desc: t.insStepRegulatoryDesc },
    { id: 'ratings', icon: Star, label: t.insStepRatings, desc: t.insStepRatingsDesc },
    { id: 'settlement', icon: DollarSign, label: t.insStepSettlement, desc: t.insStepSettlementDesc },
    { id: 'documents', icon: FileText, label: t.insStepDocuments, desc: t.insStepDocumentsDesc },
  ]

  const coopTypeLabel: Record<string, string> = {
    directAgency: t.insCoopDirect,
    mga: t.insCoopMga,
    wholesaleBroker: t.insCoopWholesale,
    referral: t.insCoopReferral,
    platform: t.insCoopPlatform,
  }

  const formDocLabel: Record<string, string> = {
    license: t.insDocTypeLicense,
    masterAgreement: t.insDocTypeMaster,
    nda: t.insDocTypeNda,
    dpa: t.insDocTypeDpa,
    amBestReport: t.insDocTypeAmBestReport,
  }

  // Form state
  const [form, setForm] = useState({
    name: existing?.name ?? '',
    shortName: existing?.shortName ?? '',
    naicCode: existing?.naicCode ?? '',
    website: existing?.website ?? '',
    founded: existing?.founded?.toString() ?? '',
    type: existing?.type ?? 'Admitted',
    coopType: 'directAgency',
    state: existing?.state ?? '',
    region: existing?.region ?? 'Northeast',
    lines: existing?.lines ?? [] as string[],
    amBest: existing?.amBestRating ?? '',
    amBestDate: '2026-07-15',
    sp: existing?.spRating ?? '',
    spDate: '2026-01-10',
    moodys: 'Aa3',
    moodysDate: '2025-12-01',
    fitch: 'A+',
    fitchDate: '2025-11-15',
    settlementCycle: existing?.settlementCycle ?? 'Monthly',
    billingFormat: 'API',
    billCutoffDay: '25',
    paymentDays: '30',
    currency: 'USD',
    premiumCollection: 'aggregate',
    uploadedFiles: [] as { name: string; type: string; size: string }[],
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const toggleLine = (line: string) => {
    set('lines', form.lines.includes(line) ? form.lines.filter(l => l !== line) : [...form.lines, line])
  }

  const completedSteps = stepMeta.map((_, i) => {
    if (i === 0) return form.name && form.shortName && form.naicCode
    if (i === 1) return form.type && form.state && form.region
    if (i === 2) return form.amBest
    if (i === 3) return form.settlementCycle && form.billingFormat
    return true
  })

  const handleSaveDraft = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const handleSubmit = () => { navigateTo('insurer-list') }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button className="btn-ghost" onClick={() => navigateTo(insurerId ? 'insurer-detail' : 'insurer-list', { insurerId })}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
              {mode === 'create' ? t.insFormNewTitle : t.insFormEditTitle(existing?.shortName ?? '')}
            </h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
              {mode === 'create' ? t.insFormNewSub : t.insFormEditSub}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={handleSaveDraft}>
            {saved ? <><Check size={14} />{t.insSaved}</> : <><Save size={14} />{t.insSaveDraft}</>}
          </button>
          {step === stepMeta.length - 1 && (
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
              <Send size={14} />{mode === 'create' ? t.insSubmitReview : t.insSaveChanges}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step nav */}
        <div className="card" style={{ padding: '16px 12px', position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingLeft: 8 }}>
            {t.insStepsLabel}
          </div>
          {stepMeta.map((s, i) => {
            const Icon = s.icon
            const isActive = step === i
            const isDone = completedSteps[i]
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isActive ? 'rgba(0,88,188,0.10)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 2,
                  transition: 'background 130ms',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isActive ? '#0058BC' : isDone ? 'rgba(52,199,89,0.12)' : 'rgba(193,198,215,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone && !isActive
                    ? <Check size={13} style={{ color: '#34C759' }} />
                    : <Icon size={13} style={{ color: isActive ? '#fff' : '#717786' }} />
                  }
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0058BC' : '#181C23' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: '#717786', lineHeight: 1.3, marginTop: 1 }}>{s.desc}</div>
                </div>
              </button>
            )
          })}

          {/* Progress */}
          <div style={{ margin: '16px 12px 0', padding: '12px 0 0', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#717786', marginBottom: 6 }}>
              <span>{t.insProgress}</span>
              <span>{completedSteps.filter(Boolean).length} / {stepMeta.length}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(193,198,215,0.4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completedSteps.filter(Boolean).length / stepMeta.length * 100}%`, background: '#0058BC', borderRadius: 2, transition: 'width 200ms ease' }} />
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="card" style={{ padding: '28px 32px' }}>

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <>
              <Section title={t.insSecBasic}>
                <Grid>
                  <div>
                    <FieldLabel label={t.insFFullName} required hint={t.insHintLegalName} />
                    <input {...INPUT} placeholder="e.g. Travelers Insurance Company" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t.insFShortName} required />
                    <input {...INPUT} placeholder="e.g. Travelers" value={form.shortName} onChange={e => set('shortName', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t.insFNaic} required hint={t.insHintNaic} />
                    <input {...INPUT} placeholder="e.g. 25658" value={form.naicCode} onChange={e => set('naicCode', e.target.value)}
                      style={{ ...INPUT.style, fontFamily: "'JetBrains Mono', monospace" }} />
                    {form.naicCode && !/^\d{5}$/.test(form.naicCode) && (
                      <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} />{t.insErrNaic}
                      </div>
                    )}
                  </div>
                  <div>
                    <FieldLabel label={t.insFFounded} />
                    <input {...INPUT} type="number" placeholder="e.g. 1853" value={form.founded} onChange={e => set('founded', e.target.value)} min={1800} max={2026} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel label={t.insFWebsite} />
                    <input {...INPUT} placeholder="e.g. www.travelers.com" value={form.website} onChange={e => set('website', e.target.value)} />
                  </div>
                </Grid>
              </Section>

              <Section title={t.insSecLines}>
                <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 10 }}>{t.insLinesHint}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {LINES_OF_BUSINESS.map(line => (
                    <button
                      key={line}
                      onClick={() => toggleLine(line)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: form.lines.includes(line) ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.8)',
                        background: form.lines.includes(line) ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.7)',
                        color: form.lines.includes(line) ? '#0058BC' : '#414755',
                        transition: 'all 120ms',
                      }}
                    >
                      {form.lines.includes(line) && <Check size={11} style={{ display: 'inline', marginRight: 5 }} />}
                      {line}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Step 1: Regulatory */}
          {step === 1 && (
            <>
              <Section title={t.insSecRegulatory}>
                <Grid>
                  <div>
                    <FieldLabel label={t.insFType} required />
                    <select {...INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="Admitted">{t.insOptAdmitted}</option>
                      <option value="Non-Admitted">{t.insOptNonAdmitted}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFCoopType} required />
                    <select {...INPUT} value={form.coopType} onChange={e => set('coopType', e.target.value)}>
                      {COOP_TYPES.map(k => <option key={k} value={k}>{coopTypeLabel[k]}</option>)}
                    </select>
                  </div>
                </Grid>
                {form.type === 'Non-Admitted' && (
                  <div style={{ marginTop: 12, background: 'rgba(0,102,135,0.07)', border: '0.5px solid rgba(0,102,135,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#006687' }}>
                    <Info size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {t.insNonAdmittedNote}
                  </div>
                )}
              </Section>

              <Section title={t.insSecHq}>
                <Grid cols={3}>
                  <div>
                    <FieldLabel label={t.insFHqState} required />
                    <select {...INPUT} value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">{t.insSelectState}</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFRegion} required />
                    <select {...INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFCity} />
                    <input {...INPUT} placeholder="e.g. New York" />
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 2: Ratings */}
          {step === 2 && (
            <Section title={t.insSecFormRatings}>
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 18 }}>
                {t.insRatingsIntro}
              </div>
              {[
                { agency: 'AM Best', key: 'amBest', dateKey: 'amBestDate', ratings: AM_BEST_RATINGS, required: true },
                { agency: 'Standard & Poors (S&P)', key: 'sp', dateKey: 'spDate', ratings: SP_RATINGS },
                { agency: "Moody's", key: 'moodys', dateKey: 'moodysDate', ratings: ['Aaa','Aa1','Aa2','Aa3','A1','A2','A3','Baa1','Baa2','NR'] },
                { agency: 'Fitch', key: 'fitch', dateKey: 'fitchDate', ratings: SP_RATINGS },
              ].map(r => (
                <div key={r.agency} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)', alignItems: 'center' }}>
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.agency}</div>
                    {r.required && <span style={{ fontSize: 11, color: '#BA1A1A' }}>{t.insRequired}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label={t.insFRating} />
                    <select
                      className="input-glass"
                      style={{ fontSize: 13.5, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                      value={(form as any)[r.key]}
                      onChange={e => set(r.key, e.target.value)}
                    >
                      <option value="">{t.insNotRated}</option>
                      {r.ratings.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label={t.insFRatingDate} />
                    <input type="date" className="input-glass" style={{ fontSize: 13, width: '100%' }}
                      value={(form as any)[r.dateKey]}
                      onChange={e => set(r.dateKey, e.target.value)} />
                  </div>
                  {(form as any)[r.key] && (
                    <div style={{
                      fontSize: 28, fontWeight: 800, color: (form as any)[r.key]?.startsWith('A') ? '#1a7a2e' : '#a05800',
                      fontFamily: "'JetBrains Mono', monospace",
                      width: 64, textAlign: 'center', flexShrink: 0,
                    }}>
                      {(form as any)[r.key]}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Step 3: Settlement */}
          {step === 3 && (
            <>
              <Section title={t.insSecFormSettlement}>
                <Grid>
                  <div>
                    <FieldLabel label={t.insFSettlementCycle} required />
                    <select {...INPUT} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                      <option value="Monthly">{t.insOptMonthly}</option>
                      <option value="Quarterly">{t.insOptQuarterly}</option>
                      <option value="SemiAnnual">{t.insOptSemiAnnual}</option>
                      <option value="Annual">{t.insOptAnnual}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFBillingFormat} required />
                    <select {...INPUT} value={form.billingFormat} onChange={e => set('billingFormat', e.target.value)}>
                      <option value="API">{t.insBillingApiValue}</option>
                      <option value="CSV">{t.insOptCsv}</option>
                      <option value="Excel">{t.insOptExcel}</option>
                      <option value="EDI">EDI 835</option>
                      <option value="Manual">{t.insOptManual}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFBillCutoff} hint={t.insBillCutoffHint} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t.insBillCutoffPrefix}</span>
                      <input {...INPUT} type="number" value={form.billCutoffDay} onChange={e => set('billCutoffDay', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={28} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t.insDaySuffix}</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label={t.insFPaymentTerm} hint={t.insPaymentHint} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t.insPaymentPrefix}</span>
                      <input {...INPUT} type="number" value={form.paymentDays} onChange={e => set('paymentDays', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={90} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t.insDaysSuffix}</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label={t.insFCurrency} />
                    <select {...INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="USD">{t.insOptUsd}</option>
                      <option value="CAD">{t.insOptCad}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t.insFPremiumCollectionMode} />
                    <select {...INPUT} value={form.premiumCollection} onChange={e => set('premiumCollection', e.target.value)}>
                      <option value="aggregate">{t.insOptCollectAggregate}</option>
                      <option value="direct">{t.insOptCollectDirect}</option>
                      <option value="platform">{t.insOptCollectPlatform}</option>
                    </select>
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <Section title={t.insSecFormDocs}>
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>
                {t.insDocsIntro}
              </div>

              {/* Upload zone */}
              <div
                style={{
                  border: '1.5px dashed rgba(0,88,188,0.35)',
                  borderRadius: 14,
                  padding: '32px 24px',
                  textAlign: 'center',
                  background: 'rgba(0,88,188,0.03)',
                  cursor: 'pointer',
                  marginBottom: 20,
                  transition: 'border-color 120ms, background 120ms',
                }}
                onClick={() => {
                  const fake = { name: t.insFakeFileName(Date.now()), type: 'masterAgreement', size: '2.1 MB' }
                  set('uploadedFiles', [...form.uploadedFiles, fake])
                }}
              >
                <Upload size={28} style={{ color: '#0058BC', marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{t.insClickUpload}</div>
                <div style={{ fontSize: 12.5, color: '#717786' }}>{t.insUploadFormats}</div>
              </div>

              {/* Required doc list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {FORM_DOCS.map(doc => {
                  const uploaded = form.uploadedFiles.find(f => f.type === doc.type)
                  return (
                    <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.4)', borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.10)' : 'rgba(193,198,215,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} style={{ color: uploaded ? '#34C759' : '#717786' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>
                          {formDocLabel[doc.type]}
                          {doc.required && <span style={{ fontSize: 11, color: '#BA1A1A', marginLeft: 6 }}>{t.insMust}</span>}
                        </div>
                        {uploaded
                          ? <div style={{ fontSize: 11.5, color: '#1a7a2e', marginTop: 2 }}>{uploaded.name} · {uploaded.size}</div>
                          : <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t.insNotUploaded}</div>
                        }
                      </div>
                      {uploaded
                        ? <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} onClick={() => set('uploadedFiles', form.uploadedFiles.filter(f => f.type !== doc.type))}><X size={14} /></button>
                        : <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => {
                            const fake = { name: `${formDocLabel[doc.type]}_${Date.now()}.pdf`, type: doc.type, size: '1.2 MB' }
                            set('uploadedFiles', [...form.uploadedFiles, fake])
                          }}>{t.insUploadBtn}</button>
                      }
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
            <button
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => setStep(s => s - 1)}
              style={{ fontSize: 13, opacity: step === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14} />{t.insPrev}
            </button>
            <div style={{ fontSize: 12.5, color: '#717786' }}>{t.insStepOf(step + 1, stepMeta.length)}</div>
            {step < stepMeta.length - 1
              ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)}>
                  {t.insNext} <ArrowRight size={14} />
                </button>
              : <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
                  <Send size={14} />{mode === 'create' ? t.insSubmitReview : t.insSaveChanges}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
