import { useState } from 'react'
import {
  ArrowLeft, ArrowRight, Save, Send, Check, Building2, MapPin, Star,
  DollarSign, FileText, Upload, X, AlertCircle, Info, Plus, Trash2,
} from 'lucide-react'
import { insurers } from './data/mockDashboardData'
import type { ViewId } from '@/App'
import { useTranslation } from 'react-i18next'

interface Props {
  mode: 'create' | 'edit'
  carrierId?: string
  navigateTo: (view: ViewId, params?: any) => void
}

const STEPS = [
  { id: 'basic', label: (t: any) => t('steps.basicInfo.label'), desc: (t: any) => t('steps.basicInfo.desc'), icon: Building2 },
  { id: 'regulatory', label: (t: any) => t('steps.regulatory.label'), desc: (t: any) => t('steps.regulatory.desc'), icon: MapPin },
  { id: 'ratings', label: (t: any) => t('steps.ratings.label'), desc: (t: any) => t('steps.ratings.desc'), icon: Star },
  { id: 'settlement', label: (t: any) => t('steps.settlement.label'), desc: (t: any) => t('steps.settlement.desc'), icon: DollarSign },
  { id: 'documents', label: (t: any) => t('steps.documents.label'), desc: (t: any) => t('steps.documents.desc'), icon: FileText },
]

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West']
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'P&C', 'Cyber', 'Specialty', 'D&O', 'E&O', 'E&S', 'Marine', 'Workers Comp']
const COOP_TYPES = ['direct', 'mga', 'wholesale', 'independent', 'platform']
const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY']
const AM_BEST_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'B++', 'B+', 'B', 'C++', 'C', 'D', 'E', 'F', 'NR']
const SP_RATINGS = ['AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-', 'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'CCC+', 'CCC', 'CCC-', 'CC', 'C', 'D']

const INPUT = { className: 'input-glass w-full', style: { fontSize: 13.5 } }

function FieldLabel({ label, required, hint }: { label: string; required?: boolean; hint?: string }) {
  const { t } = useTranslation('insurer-form')
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

export default function InsurerForm({ mode, carrierId, navigateTo }: Props) {
  const { t } = useTranslation('insurer-form')
  const coopTypeLabel: Record<string, string> = {
    direct: t('values.coopDirect'),
    mga: t('values.coopMGA'),
    wholesale: t('values.coopWholesale'),
    independent: t('values.coopIndependent'),
    platform: t('values.coopPlatform'),
  }
  const existing = carrierId ? insurers.find(i => i.carrierId === carrierId) : undefined
  const [step, setStep] = useState(0)
  const [saved, setSaved] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: existing?.carrierName ?? '',
    shortName: existing?.shortName ?? '',
    naicCode: existing?.naicCode ?? '',
    website: existing?.website ?? '',
    founded: existing?.founded?.toString() ?? '',
    type: existing?.type ?? 'Admitted',
    coopType: existing?.coopType ?? COOP_TYPES[0],
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

  const completedSteps = STEPS.map((_, i) => {
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
          <button className="btn-ghost" onClick={() => navigateTo(carrierId ? 'insurer-detail' : 'insurer-list', { carrierId })}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>
              {mode === 'create' 
                ? t('header.titleCreate') 
                : t('header.titleEdit', { name: existing?.shortName ?? '' })}
            </h1>
            <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
              {mode === 'create' 
                ? t('header.subtitleCreate') 
                : t('header.subtitleEdit')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={handleSaveDraft}>
            {saved ? <><Check size={14} />{t('header.saved')}</> : <><Save size={14} />{t('header.saveDraft')}</>}
          </button>
          {step === STEPS.length - 1 && (
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
              <Send size={14} />{mode === 'create' ? t('header.submitAudit') : t('header.saveChanges')}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step nav */}
        <div className="card" style={{ padding: '16px 12px', position: 'sticky', top: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, paddingLeft: 8 }}>
            {t('steps.label')}
          </div>
          {STEPS.map((s, i) => {
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#0058BC' : '#181C23' }}>{s.label(t)}</div>
                  <div style={{ fontSize: 11, color: '#717786', lineHeight: 1.3, marginTop: 1 }}>{s.desc(t)}</div>
                </div>
              </button>
            )
          })}

          {/* Progress */}
          <div style={{ margin: '16px 12px 0', padding: '12px 0 0', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#717786', marginBottom: 6 }}>
              <span>{t('navigation.progressLabel')}</span>
              <span>{completedSteps.filter(Boolean).length} / {STEPS.length}</span>
            </div>
            <div style={{ height: 4, background: 'rgba(193,198,215,0.4)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completedSteps.filter(Boolean).length / STEPS.length * 100}%`, background: '#0058BC', borderRadius: 2, transition: 'width 200ms ease' }} />
            </div>
          </div>
        </div>

        {/* Form content */}
        <div className="card" style={{ padding: '28px 32px' }}>

          {/* Step 0: Basic Info */}
          {step === 0 && (
            <>
              <Section title={t('sections.companyBasic')}>
                <Grid>
                  <div>
                    <FieldLabel label={t('fields.fullName')} required hint={t('fields.fullNameHint')} />
                    <input {...INPUT} placeholder="e.g. Travelers Insurance Company" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t('fields.shortName')} required />
                    <input {...INPUT} placeholder="e.g. Travelers" value={form.shortName} onChange={e => set('shortName', e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel label={t('fields.naicCode')} required hint={t('fields.naicCodeHint')} />
                    <input {...INPUT} placeholder="e.g. 25658" value={form.naicCode} onChange={e => set('naicCode', e.target.value)}
                      style={{ ...INPUT.style, fontFamily: "'JetBrains Mono', monospace" }} />
                    {form.naicCode && !/^\d{5}$/.test(form.naicCode) && (
                      <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} />{t('fields.naicCodeError')}
                      </div>
                    )}
                  </div>
                  <div>
                    <FieldLabel label={t('fields.foundedYear')} />
                    <input {...INPUT} type="number" placeholder="e.g. 1853" value={form.founded} onChange={e => set('founded', e.target.value)} min={1800} max={2026} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FieldLabel label={t('fields.website')} />
                    <input {...INPUT} placeholder="e.g. www.travelers.com" value={form.website} onChange={e => set('website', e.target.value)} />
                  </div>
                </Grid>
              </Section>

              <Section title={t('sections.businessLines')}>
                <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 10 }}>{t('fields.linesHint')}</div>
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
              <Section title={t('sections.regulatoryInfo')}>
                <Grid>
                  <div>
                    <FieldLabel label={t('fields.companyType')} required />
                    <select {...INPUT} value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="Admitted">{t('values.admitted')}</option>
                      <option value="Non-Admitted">{t('values.nonAdmitted')}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('fields.cooperationType')} required />
                    <select {...INPUT} value={form.coopType} onChange={e => set('coopType', e.target.value)}>
                      {COOP_TYPES.map(k => <option key={k} value={k}>{coopTypeLabel[k]}</option>)}
                    </select>
                  </div>
                </Grid>
                {form.type === 'Non-Admitted' && (
                  <div style={{ marginTop: 12, background: 'rgba(0,102,135,0.07)', border: '0.5px solid rgba(0,102,135,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#006687' }}>
                    <Info size={13} style={{ display: 'inline', marginRight: 6 }} />
                    {t('warnings.nonAdmitted')}
                  </div>
                )}
              </Section>

              <Section title={t('sections.headquarters')}>
                <Grid cols={3}>
                  <div>
                    <FieldLabel label={t('fields.state')} required />
                    <select {...INPUT} value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">{t('fields.selectState')}</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('fields.region')} required />
                    <select {...INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                      {REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('fields.city')} />
                    <input {...INPUT} placeholder="e.g. New York" />
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 2: Ratings */}
          {step === 2 && (
            <Section title={t('sections.ratingsInfo')}>
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 18 }}>
                {t('ratings.info')}
              </div>
              {[
                { agency: t('ratings.agency'), key: 'amBest', dateKey: 'amBestDate', ratings: AM_BEST_RATINGS, required: true },
                { agency: t('ratings.agencySp'), key: 'sp', dateKey: 'spDate', ratings: SP_RATINGS },
                { agency: t('ratings.agencyMoody'), key: 'moodys', dateKey: 'moodysDate', ratings: ['Aaa','Aa1','Aa2','Aa3','A1','A2','A3','Baa1','Baa2','NR'] },
                { agency: t('ratings.agencyFitch'), key: 'fitch', dateKey: 'fitchDate', ratings: SP_RATINGS },
              ].map(r => (
                <div key={r.agency} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)', alignItems: 'center' }}>
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.agency}</div>
                    {r.required && <span style={{ fontSize: 11, color: '#BA1A1A' }}>{t('ratings.required')}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label={t('ratings.rating')} />
                    <select
                      className="input-glass"
                      style={{ fontSize: 13.5, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}
                      value={(form as any)[r.key]}
                      onChange={e => set(r.key, e.target.value)}
                    >
                      <option value="">{t('ratings.notRated')}</option>
                      {r.ratings.map(v => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <FieldLabel label={t('ratings.ratingDate')} />
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
              <Section title={t('sections.settlementConfig')}>
                <Grid>
                  <div>
                    <FieldLabel label={t('settlementFields.settlementCycle')} required />
                    <select {...INPUT} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                      <option value="Monthly">{t('settlementFields.monthly')}</option>
                      <option value="Quarterly">{t('settlementFields.quarterly')}</option>
                      <option value="SemiAnnual">{t('settlementFields.semiAnnual')}</option>
                      <option value="Annual">{t('settlementFields.annual')}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.billingFormat')} required />
                    <select {...INPUT} value={form.billingFormat} onChange={e => set('billingFormat', e.target.value)}>
                      <option value="API">{t('settlementFields.apiPull')}</option>
                      <option value="CSV">{t('settlementFields.csvFile')}</option>
                      <option value="Excel">{t('settlementFields.excelFile')}</option>
                      <option value="EDI">{t('settlementFields.edi835')}</option>
                      <option value="Manual">{t('settlementFields.manualEntry')}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.billCutoffDay')} hint={t('settlementFields.cutoffDayHint')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t('settlementFields.day')}</span>
                      <input {...INPUT} type="number" value={form.billCutoffDay} onChange={e => set('billCutoffDay', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={28} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t('settlementFields.day')}</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.paymentTerm')} hint={t('settlementFields.paymentHint')} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t('settlementFields.afterReconcile')}</span>
                      <input {...INPUT} type="number" value={form.paymentDays} onChange={e => set('paymentDays', e.target.value)} style={{ ...INPUT.style, width: 70 }} min={1} max={90} />
                      <span style={{ fontSize: 13.5, color: '#717786' }}>{t('settlementFields.withinDays')}</span>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.currency')} />
                    <select {...INPUT} value={form.currency} onChange={e => set('currency', e.target.value)}>
                      <option value="USD">{t('settlementFields.usd')}</option>
                      <option value="CAD">{t('settlementFields.cad')}</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.premiumCollection')} />
                    <select {...INPUT} value={form.premiumCollection} onChange={e => set('premiumCollection', e.target.value)}>
                      <option value="aggregate">{t('settlementFields.aggregate')}</option>
                      <option value="direct">{t('settlementFields.direct')}</option>
                      <option value="platform">{t('settlementFields.platform')}</option>
                    </select>
                  </div>
                </Grid>
              </Section>
            </>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <Section title={t('sections.qualifications')}>
              <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 16 }}>
                {t('documents.uploadHint')}
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
                  const fake = { name: t('documents.fakeFileName', { ts: Date.now() }), type: t('documents.docs.mainAgreement'), size: '2.1 MB' }
                  set('uploadedFiles', [...form.uploadedFiles, fake])
                }}
              >
                <Upload size={28} style={{ color: '#0058BC', marginBottom: 10 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 4 }}>{t('documents.clickUpload')}</div>
                <div style={{ fontSize: 12.5, color: '#717786' }}>{t('documents.supportedFormats')}</div>
              </div>

              {/* Required doc list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { type: t('documents.docs.businessLicense'), required: true },
                  { type: t('documents.docs.mainAgreement'), required: true },
                  { type: t('documents.docs.nda'), required: true },
                  { type: t('documents.docs.dpa'), required: false },
                  { type: t('documents.docs.amBestReport'), required: false },
                ].map(doc => {
                  const uploaded = form.uploadedFiles.find(f => f.type === doc.type)
                  return (
                    <div key={doc.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.7)', border: '0.5px solid rgba(193,198,215,0.4)', borderRadius: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: uploaded ? 'rgba(52,199,89,0.10)' : 'rgba(193,198,215,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} style={{ color: uploaded ? '#34C759' : '#717786' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>
                          {doc.type}
                          {doc.required && <span style={{ fontSize: 11, color: '#BA1A1A', marginLeft: 6 }}>{t('documents.requiredDocs')}</span>}
                        </div>
                        {uploaded
                          ? <div style={{ fontSize: 11.5, color: '#1a7a2e', marginTop: 2 }}>{uploaded.name} · {uploaded.size}</div>
                          : <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t('documents.notUploaded')}</div>
                        }
                      </div>
                      {uploaded
                        ? <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} onClick={() => set('uploadedFiles', form.uploadedFiles.filter(f => f.type !== doc.type))}><X size={14} /></button>
                        : <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => {
                            const fake = { name: `${doc.type}_${Date.now()}.pdf`, type: doc.type, size: '1.2 MB' }
                            set('uploadedFiles', [...form.uploadedFiles, fake])
                          }}>{t('documents.uploadBtn')}</button>
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
              <ArrowLeft size={14} />{t('navigation.previousStep')}
            </button>
            <div style={{ fontSize: 12.5, color: '#717786' }}>{t('navigation.stepCount', { current: step + 1, total: STEPS.length })}</div>
            {step < STEPS.length - 1
              ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)}>
                  {t('navigation.nextStep')} <ArrowRight size={14} />
                </button>
              : <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSubmit}>
                  <Send size={14} />{mode === 'create' ? t('header.submitAudit') : t('header.saveChanges')}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
