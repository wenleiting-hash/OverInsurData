import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, ArrowRight, Send, Check, Building2, MapPin, Star,
  DollarSign, FileText, X, AlertCircle, Info, Eye, CheckCircle, Loader,
} from 'lucide-react'
import { useGetInsurer, useCreateInsurer, useUpdateInsurer } from '@/services/insurerService'
import { insurerApi } from '@/lib/user-api-client'
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
const LINES_OF_BUSINESS = ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'Cyber', 'Travel', 'Professional', 'D&O', 'E&O', 'Marine', 'Specialty', 'Workers Comp']
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
  const { data: apiInsurer, isLoading: isLoadingInsurer } = useGetInsurer(mode === 'edit' ? carrierId ?? null : null)
  const createInsurer = useCreateInsurer()
  const updateInsurer = useUpdateInsurer()
  const existing = apiInsurer ? {
    carrierName: apiInsurer.carrier_name,
    shortName: apiInsurer.carrier_name_short || apiInsurer.short_name || '',
    naicCode: apiInsurer.naic_code,
    website: apiInsurer.website,
    founded: (apiInsurer.founded_year || apiInsurer.founded)?.toString() ?? '',
    type: apiInsurer.carrier_type || apiInsurer.type,
    coopType: apiInsurer.coop_type,
    state: apiInsurer.state,
    region: apiInsurer.region,
    lines: apiInsurer.lines,
    amBestRating: apiInsurer.am_best_rating,
    spRating: apiInsurer.sp_rating,
    moodysRating: apiInsurer.moodys_rating,
    fitchRating: apiInsurer.fitch_rating,
    settlementCycle: apiInsurer.settlement_cycle,
  } : undefined
  const [step, setStep] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [naicError, setNaicError] = useState(false)
  const [naicStatus, setNaicStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [uploadTargetDocType, setUploadTargetDocType] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    moodys: existing?.moodysRating ?? '',
    moodysDate: '2025-12-01',
    fitch: existing?.fitchRating ?? '',
    fitchDate: '2025-11-15',
    settlementCycle: existing?.settlementCycle ?? '',
    billingFormat: '',
    billCutoffDay: '25',
    paymentDays: '30',
    currency: 'USD',
    premiumCollection: 'aggregate',
    uploadedFiles: [] as { name: string; type: string; size: string; file?: File }[],
  })

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  // 必填字段红色标记 helper（函数返回 JSX，避免在函数体内定义组件导致输入框重挂载/焦点丢失）
  const errBorder = (k: string) => (fieldErrors[k] ? { borderColor: '#BA1A1A', background: 'rgba(186,26,26,0.04)' } : {})
  const renderFieldError = (k: string) => fieldErrors[k] ? (
    <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
      <AlertCircle size={11} />{fieldErrors[k]}
    </div>
  ) : null

  // 用户主动切换步骤（下一步/上一步/点其他步骤）时清除提交校验提示
  const goToStep = (i: number) => {
    setStep(i)
    setSubmitError(null)
    setFieldErrors({})
  }

  // Populate form when API data arrives (edit mode)
  const [dataLoaded, setDataLoaded] = useState(false)
  useEffect(() => {
    if (existing && !dataLoaded) {
      setForm(p => ({
        ...p,
        name: existing.carrierName ?? '',
        shortName: existing.shortName ?? '',
        naicCode: existing.naicCode ?? '',
        website: existing.website ?? '',
        founded: existing.founded?.toString() ?? '',
        type: existing.type ?? 'Admitted',
        coopType: existing.coopType ?? COOP_TYPES[0],
        state: existing.state ?? '',
        region: existing.region ?? 'Northeast',
        lines: existing.lines ?? [],
        amBest: existing.amBestRating ?? '',
        sp: existing.spRating ?? '',
        moodys: existing.moodysRating ?? '',
        fitch: existing.fitchRating ?? '',
        settlementCycle: existing.settlementCycle ?? '',
      }))
      setDataLoaded(true)
    }
  }, [existing])

  // Debounced NAIC availability check
  useEffect(() => {
    const code = form.naicCode.trim()
    if (!/^\d{5}$/.test(code)) { setNaicStatus('idle'); return }
    // Skip check in edit mode if code hasn't changed
    if (mode === 'edit' && existing?.naicCode === code) { setNaicStatus('idle'); return }
    setNaicStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const result = await insurerApi.checkNaic(code, mode === 'edit' ? carrierId : undefined)
        setNaicStatus(result.available ? 'available' : 'taken')
        if (!result.available) setNaicError(true)
      } catch { setNaicStatus('idle') }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.naicCode])

  const toggleLine = (line: string) => {
    set('lines', form.lines.includes(line) ? form.lines.filter(l => l !== line) : [...form.lines, line])
  }

  const completedSteps = STEPS.map((_, i) => {
    if (i === 0) return form.name && form.shortName && form.naicCode
    if (i === 1) return form.type && form.state && form.region
    if (i === 2) return form.amBest
    if (i === 3) return form.settlementCycle && form.billingFormat
    return form.uploadedFiles.filter(f =>
      [t('documents.docs.businessLicense'), t('documents.docs.mainAgreement'), t('documents.docs.nda')].includes(f.type)
    ).length === 3
  })

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    const docType = uploadTargetDocType || t('documents.docs.mainAgreement')
    set('uploadedFiles', [...form.uploadedFiles, { name: file.name, type: docType, size: `${sizeMB} MB`, file }])
    e.target.value = '' // reset so same file can be re-selected
  }

  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  const handlePreview = (f: { name: string; file?: File }) => {
    if (f.file) {
      const url = URL.createObjectURL(f.file)
      setPreviewFile({ url, name: f.name })
    }
  }

  const closePreview = () => {
    if (previewFile?.url) URL.revokeObjectURL(previewFile.url)
    setPreviewFile(null)
  }

  const isSubmitting = createInsurer.isPending || updateInsurer.isPending

  const handleSubmit = () => {
    setSubmitError(null)
    // 逐步骤校验必填字段：跳到第一个缺失步骤并红色标记该步骤缺失字段
    const requiredDocs = [t('documents.docs.businessLicense'), t('documents.docs.mainAgreement'), t('documents.docs.nda')]
    const docsOk = requiredDocs.every(d => form.uploadedFiles.some(f => f.type === d))
    const missingByStep: string[][] = [
      [!form.name.trim() ? 'name' : '', !form.shortName.trim() ? 'shortName' : '', !form.naicCode.trim() ? 'naicCode' : ''].filter(Boolean),
      [!form.state ? 'state' : ''].filter(Boolean),
      [!form.amBest ? 'amBest' : ''].filter(Boolean),
      [!form.settlementCycle ? 'settlementCycle' : '', !form.billingFormat ? 'billingFormat' : ''].filter(Boolean),
      [docsOk ? '' : 'documents'].filter(Boolean),
    ]
    const stepErrorMsg = [
      t('errors.requiredFields'),
      t('errors.missingRegulatory'),
      t('errors.missingRatings'),
      t('errors.missingSettlement'),
      t('errors.missingDocuments'),
    ]
    const firstIncomplete = missingByStep.findIndex(arr => arr.length > 0)
    if (firstIncomplete !== -1) {
      setStep(firstIncomplete)
      setFieldErrors(Object.fromEntries(missingByStep[firstIncomplete].map(k => [k, t('errors.fieldRequired')])))
      setSubmitError(stepErrorMsg[firstIncomplete])
      return
    }
    setFieldErrors({})
    // Sanitize DTO: strip empty strings and NaN for optional fields
    const dto: any = {
      naic_code: form.naicCode.trim(),
      carrier_name: form.name.trim(),
    }
    // Optional string fields — only include if non-empty
    const optStrings: Record<string, string> = {
      carrier_name_short: form.shortName,
      carrier_type: form.type,
      status: 'active',
      region: form.region,
      state: form.state,
      coop_type: form.coopType,
      am_best_rating: form.amBest,
      sp_rating: form.sp,
      moodys_rating: form.moodys,
      fitch_rating: form.fitch,
      settlement_cycle: form.settlementCycle,
      website: form.website,
    }
    for (const [key, val] of Object.entries(optStrings)) {
      if (val && val.trim()) dto[key] = val.trim()
    }
    // Optional number field — only include if valid number
    if (form.founded) {
      const yr = parseInt(form.founded, 10)
      if (!isNaN(yr) && yr > 0) dto.founded_year = yr
    }
    // Lines array — only include if non-empty
    if (form.lines.length > 0) dto.lines = form.lines

    const onSuccess = () => navigateTo('insurer-list')
    const onError = (err: any) => {
      const status = err?.response?.status
      const data = err?.response?.data
      const error = data?.error || ''
      // Extract message: handle both string and string[] (NestJS validation)
      const rawMsg = data?.message || err?.message || 'Unknown error'
      const displayMsg = Array.isArray(rawMsg) ? rawMsg.join('; ') : (typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg))
      console.error('[InsurerForm] Submit error:', { status, error, message: displayMsg })
      setSubmitError(displayMsg)
      // Detect NAIC duplicate (409 or error code) → highlight field + jump to step 0
      if (status === 409 || error === 'NAIC_DUPLICATE' || (typeof rawMsg === 'string' && rawMsg.toLowerCase().includes('naic'))) {
        setNaicError(true)
        setNaicStatus('taken')
        setStep(0)
      }
    }
    try {
      if (mode === 'edit' && carrierId) {
        updateInsurer.mutate({ id: carrierId, dto }, { onSuccess, onError })
      } else {
        createInsurer.mutate(dto, { onSuccess, onError })
      }
    } catch (e: any) {
      console.error('[InsurerForm] Unexpected error during submit:', e)
      setSubmitError(e?.message || 'Unexpected error')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
          {step === STEPS.length - 1 && (
            <button
              className="btn-primary"
              style={{ fontSize: 13, opacity: isSubmitting ? 0.6 : 1 }}
              disabled={isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? (
                <>{t('navigation.submitting')}</>
              ) : (
                <><Send size={14} />{mode === 'create' ? t('header.createInsurer') : t('header.saveChanges')}</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error banner — TOP position (visible after submit) */}
      {submitError && (
        <div style={{
          marginBottom: 16, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <AlertCircle size={16} style={{ color: '#BA1A1A', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#BA1A1A' }}>{t('errors.submitFailed') || '提交失败'}</div>
            <div style={{ fontSize: 12.5, color: '#BA1A1A', marginTop: 2, wordBreak: 'break-all' }}>{submitError}</div>
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BA1A1A', fontSize: 14, padding: 4 }} onClick={() => setSubmitError(null)}>✕</button>
        </div>
      )}

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
                onClick={() => goToStep(i)}
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
                  {/* 当前步骤已录齐就打勾——此前 isDone && !isActive 让最后一步（资质文件）
                      上传完也永远停在蓝色激活态，看起来像没生效 */}
                  {isDone
                    ? <Check size={13} style={{ color: isActive ? '#fff' : '#34C759' }} />
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
                    <input {...INPUT} placeholder="e.g. Travelers Insurance Company" value={form.name} onChange={e => set('name', e.target.value)} style={{ ...INPUT.style, ...errBorder('name') }} />
                    {renderFieldError('name')}
                  </div>
                  <div>
                    <FieldLabel label={t('fields.shortName')} required />
                    <input {...INPUT} placeholder="e.g. Travelers" value={form.shortName} onChange={e => set('shortName', e.target.value)} style={{ ...INPUT.style, ...errBorder('shortName') }} />
                    {renderFieldError('shortName')}
                  </div>
                  <div>
                    <FieldLabel label={t('fields.naicCode')} required hint={t('fields.naicCodeHint')} />
                    <div style={{ position: 'relative' }}>
                      <input {...INPUT} placeholder="e.g. 25658" value={form.naicCode}
                        onChange={e => { set('naicCode', e.target.value); setNaicError(false); setNaicStatus('idle') }}
                        style={{
                          ...INPUT.style,
                          fontFamily: "'JetBrains Mono', monospace",
                          ...errBorder('naicCode'),
                          paddingRight: naicStatus !== 'idle' ? 32 : undefined,
                          ...(naicError || naicStatus === 'taken' ? { borderColor: '#BA1A1A', background: 'rgba(186,26,26,0.04)' } : {}),
                          ...(naicStatus === 'available' ? { borderColor: '#34C759', background: 'rgba(52,199,89,0.04)' } : {}),
                        }} />
                      {naicStatus !== 'idle' && (
                        <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                          {naicStatus === 'checking' && <Loader size={16} style={{ color: '#717786', animation: 'spin 1s linear infinite' }} />}
                          {naicStatus === 'available' && <CheckCircle size={16} style={{ color: '#34C759' }} />}
                          {naicStatus === 'taken' && <AlertCircle size={16} style={{ color: '#BA1A1A' }} />}
                        </div>
                      )}
                    </div>
                    {form.naicCode && !/^\d{5}$/.test(form.naicCode) && (
                      <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} />{t('fields.naicCodeError')}
                      </div>
                    )}
                    {naicStatus === 'taken' && (
                      <div style={{ fontSize: 11.5, color: '#BA1A1A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={11} />{t('errors.naicDuplicate') || 'This NAIC Code already exists'}
                      </div>
                    )}
                    {naicStatus === 'available' && (
                      <div style={{ fontSize: 11.5, color: '#34C759', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={11} />{t('errors.naicAvailable') || 'NAIC Code is available'}
                      </div>
                    )}
                    {renderFieldError('naicCode')}
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
                    <select {...INPUT} style={{ ...INPUT.style, ...errBorder('state') }} value={form.state} onChange={e => set('state', e.target.value)}>
                      <option value="">{t('fields.selectState')}</option>
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {renderFieldError('state')}
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
                      style={{ fontSize: 13.5, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, ...errBorder(r.key) }}
                      value={(form as any)[r.key]}
                      onChange={e => set(r.key, e.target.value)}
                    >
                      <option value="">{t('ratings.notRated')}</option>
                      {r.ratings.map(v => <option key={v}>{v}</option>)}
                    </select>
                    {renderFieldError(r.key)}
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
                    <select {...INPUT} style={{ ...INPUT.style, ...errBorder('settlementCycle') }} value={form.settlementCycle} onChange={e => set('settlementCycle', e.target.value)}>
                      <option value="" disabled>{t('settlementFields.selectPlaceholder')}</option>
                      <option value="Monthly">{t('settlementFields.monthly')}</option>
                      <option value="Quarterly">{t('settlementFields.quarterly')}</option>
                      <option value="SemiAnnual">{t('settlementFields.semiAnnual')}</option>
                      <option value="Annual">{t('settlementFields.annual')}</option>
                    </select>
                    {renderFieldError('settlementCycle')}
                  </div>
                  <div>
                    <FieldLabel label={t('settlementFields.billingFormat')} required />
                    <select {...INPUT} style={{ ...INPUT.style, ...errBorder('billingFormat') }} value={form.billingFormat} onChange={e => set('billingFormat', e.target.value)}>
                      <option value="" disabled>{t('settlementFields.selectPlaceholder')}</option>
                      <option value="API">{t('settlementFields.apiPull')}</option>
                      <option value="CSV">{t('settlementFields.csvFile')}</option>
                      <option value="Excel">{t('settlementFields.excelFile')}</option>
                      <option value="EDI">{t('settlementFields.edi835')}</option>
                      <option value="Manual">{t('settlementFields.manualEntry')}</option>
                    </select>
                    {renderFieldError('billingFormat')}
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
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
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
              {renderFieldError('documents')}

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

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
                        ? <>
                            {uploaded.file && (
                              <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} onClick={() => handlePreview(uploaded)} title={t('documents.previewBtn')}><Eye size={14} /></button>
                            )}
                            <button className="btn-ghost" style={{ padding: 5, color: '#BA1A1A' }} onClick={() => set('uploadedFiles', form.uploadedFiles.filter(f => f.type !== doc.type))}><X size={14} /></button>
                          </>
                        : <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => {
                            setUploadTargetDocType(doc.type)
                            fileInputRef.current?.click()
                          }}>{t('documents.uploadBtn')}</button>
                      }
                    </div>
                  )
                })}
              </div>
            </Section>
          )}

          {/* Bottom Error message (duplicate for visibility at bottom) */}
          {submitError && (
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} style={{ color: '#BA1A1A', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#BA1A1A', wordBreak: 'break-all' }}>{submitError}</span>
              <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#BA1A1A', fontSize: 12 }} onClick={() => setSubmitError(null)}>✕</button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between" style={{ marginTop: 32, paddingTop: 20, borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
            <button
              className="btn-secondary"
              disabled={step === 0}
              onClick={() => goToStep(step - 1)}
              style={{ fontSize: 13, opacity: step === 0 ? 0.4 : 1 }}
            >
              <ArrowLeft size={14} />{t('navigation.previousStep')}
            </button>
            <div style={{ fontSize: 12.5, color: '#717786' }}>{t('navigation.stepCount', { current: step + 1, total: STEPS.length })}</div>
            {step < STEPS.length - 1
              ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => goToStep(step + 1)}>
                  {t('navigation.nextStep')} <ArrowRight size={14} />
                </button>
              : <button
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{ fontSize: 13, opacity: isSubmitting ? 0.6 : 1 }}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>{t('navigation.submitting')}</>
                  ) : (
                    <><Send size={14} />{mode === 'create' ? t('header.createInsurer') : t('header.saveChanges')}</>
                  )}
                </button>
            }
          </div>
        </div>
      </div>

      {/* File preview modal */}
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)' }}>
          <div style={{ width: '85vw', height: '85vh', background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid rgba(193,198,215,0.4)', background: 'rgba(246,248,255,0.9)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{previewFile.name}</div>
              <button onClick={closePreview} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}><X size={18} style={{ color: '#717786' }} /></button>
            </div>
            <iframe src={previewFile.url} style={{ flex: 1, border: 'none' }} title={previewFile.name} />
          </div>
        </div>
      )}
    </div>
  )
}
