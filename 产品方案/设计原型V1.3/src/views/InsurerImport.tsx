import { useState } from 'react'
import {
  Download, Upload, CheckCircle, XCircle, AlertTriangle, ArrowRight,
  FileText, RotateCcw, Eye, ChevronRight,
} from 'lucide-react'
import type { ViewId } from '../components/Sidebar'
import { useLang } from '../i18n'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

type Step = 'template' | 'upload' | 'preview' | 'validate' | 'confirm' | 'result'

type PreviewError = 'naicRequired' | 'ratingRequired'

const STEPS: { id: Step }[] = [
  { id: 'template' },
  { id: 'upload' },
  { id: 'preview' },
  { id: 'validate' },
  { id: 'confirm' },
  { id: 'result' },
]

const MOCK_PREVIEW: { row: number; name: string; shortName: string; naic: string; type: string; state: string; region: string; rating: string; ok: boolean; error?: PreviewError }[] = [
  { row: 2, name: 'Markel Specialty Insurance', shortName: 'Markel Specialty', naic: '38971', type: 'Non-Admitted', state: 'VA', region: 'Southeast', rating: 'A', ok: true },
  { row: 3, name: 'Hanover Insurance Group', shortName: 'Hanover', naic: '22292', type: 'Admitted', state: 'MA', region: 'Northeast', rating: 'A', ok: true },
  { row: 4, name: 'W.R. Berkley Corporation', shortName: 'WR Berkley', naic: '', type: 'Non-Admitted', state: 'CT', region: 'Northeast', rating: 'A+', ok: false, error: 'naicRequired' },
  { row: 5, name: 'RLI Corp', shortName: 'RLI', naic: '13056', type: 'Admitted', state: 'IL', region: 'Midwest', rating: 'A+', ok: true },
  { row: 6, name: 'Employers Holdings Inc', shortName: 'Employers', naic: '21458', type: 'Admitted', state: 'NV', region: 'West', rating: 'A-', ok: true },
  { row: 7, name: 'AMERITAS', shortName: 'AMERITAS', naic: '61301', type: 'Admitted', state: 'NE', region: 'Midwest', rating: '', ok: false, error: 'ratingRequired' },
  { row: 8, name: 'Grinnell Mutual Insurance', shortName: 'Grinnell', naic: '14230', type: 'Admitted', state: 'IA', region: 'Midwest', rating: 'A', ok: true },
]

type SysFieldKey = 'name' | 'shortName' | 'naicCode' | 'type' | 'state' | 'region' | 'amBestRating' | 'founded'

const FIELD_MAP: { excelCol: string; sysField: SysFieldKey; matched: boolean; suggestion?: string }[] = [
  { excelCol: 'Column A: Company Full Name', sysField: 'name', matched: true },
  { excelCol: 'Column B: Short Name', sysField: 'shortName', matched: true },
  { excelCol: 'Column C: NAIC Code', sysField: 'naicCode', matched: true },
  { excelCol: 'Column D: Company Type', sysField: 'type', matched: true },
  { excelCol: 'Column E: HQ State', sysField: 'state', matched: true },
  { excelCol: 'Column F: Region', sysField: 'region', matched: true },
  { excelCol: 'Column G: AM Best Rating', sysField: 'amBestRating', matched: true },
  { excelCol: 'Column H: Founded Year', sysField: 'founded', matched: false, suggestion: 'founded' },
]

export default function InsurerImport({ navigateTo }: Props) {
  const { t } = useLang()
  const [step, setStep] = useState<Step>('template')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)

  const stepLabel: Record<Step, string> = {
    template: t.insImpStepTemplate,
    upload: t.insImpStepUpload,
    preview: t.insImpStepPreview,
    validate: t.insImpStepValidate,
    confirm: t.insImpStepConfirm,
    result: t.insImpStepResult,
  }

  const sysFieldLabel: Record<SysFieldKey, string> = {
    name: t.insFFullName,
    shortName: t.insFShortName,
    naicCode: t.insFNaic,
    type: t.insFType,
    state: t.insImpColHqState,
    region: t.insFRegion,
    amBestRating: t.insFilterRatingAll,
    founded: t.insFFounded,
  }

  const errorLabel: Record<PreviewError, string> = {
    naicRequired: t.insImpErrNaicRequired,
    ratingRequired: t.insImpErrRatingRequired,
  }

  // Template field checklist (asterisk marks required fields)
  const templateFields = [
    `${t.insFFullName} *`,
    `${t.insFNaic} *`,
    `${t.insFShortName} *`,
    `${t.insFType} *`,
    `${t.insImpColHqState} *`,
    `${t.insFRegion} *`,
    t.insFilterRatingAll,
    t.insFFounded,
  ]

  const stepIdx = STEPS.findIndex(s => s.id === step)
  const validRows = MOCK_PREVIEW.filter(r => r.ok).length
  const errorRows = MOCK_PREVIEW.filter(r => !r.ok).length

  const next = () => {
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id)
  }

  const mockUpload = () => {
    setFileName(t.insImpMockFileName())
    setTimeout(next, 600)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t.insImpTitle}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>{t.insImpSubtitle}</p>
        </div>
        <button className="btn-ghost" onClick={() => navigateTo('insurer-list')}>
          {t.insCancel}
        </button>
      </div>

      {/* Step indicator */}
      <div className="card flex items-center justify-between" style={{ padding: '16px 24px', marginBottom: 20 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: i <= stepIdx ? 'pointer' : 'default' }}
              onClick={() => { if (i <= stepIdx) setStep(s.id) }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < stepIdx ? '#34C759' : i === stepIdx ? '#0058BC' : 'rgba(193,198,215,0.3)',
                fontSize: 12, fontWeight: 700,
                color: i <= stepIdx ? '#fff' : '#717786',
              }}>
                {i < stepIdx ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: i === stepIdx ? 600 : 400, color: i === stepIdx ? '#0058BC' : i < stepIdx ? '#1a7a2e' : '#717786', whiteSpace: 'nowrap' }}>
                {stepLabel[s.id]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? '#34C759' : 'rgba(193,198,215,0.4)', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ padding: '32px 36px', minHeight: 400 }}>

        {/* Step 1: Download template */}
        {step === 'template' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FileText size={32} style={{ color: '#0058BC' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t.insImpDownloadTitle}</h2>
            <p style={{ fontSize: 14, color: '#717786', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
              {t.insImpDownloadIntro}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 520, margin: '0 auto 32px' }}>
              {[
                { title: t.insImpTplStdTitle, desc: t.insImpTplStdDesc, badge: t.insImpTplStdBadge, badgeCls: 'badge-blue' },
                { title: t.insImpTplBlankTitle, desc: t.insImpTplBlankDesc, badge: t.insImpTplBlankBadge, badgeCls: 'badge-gray' },
              ].map(tpl => (
                <div key={tpl.title} style={{ background: 'rgba(241,243,254,0.7)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 14, padding: '18px 20px', textAlign: 'left' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{tpl.title}</span>
                    <span className={`badge ${tpl.badgeCls}`} style={{ fontSize: 10 }}>{tpl.badge}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#717786', marginBottom: 12 }}>{tpl.desc}</p>
                  <button className="btn-secondary" style={{ fontSize: 12.5, width: '100%', justifyContent: 'center' }}>
                    <Download size={13} />{t.insImpDownloadExcel}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '14px 20px', maxWidth: 520, margin: '0 auto 28px', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0058BC', marginBottom: 8 }}>{t.insImpFieldNotesTitle}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {templateFields.map(f => (
                  <div key={f} style={{ fontSize: 12, color: '#414755', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: f.includes('*') ? '#BA1A1A' : '#C1C6D7' }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ fontSize: 14, padding: '11px 32px' }} onClick={next}>
              {t.insImpDownloadedNext} <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 'upload' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.insImpUploadTitle}</h2>
            <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 28 }}>{t.insImpUploadSub}</p>

            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); mockUpload() }}
              onClick={mockUpload}
              style={{
                border: `2px dashed ${dragging ? '#0058BC' : 'rgba(0,88,188,0.25)'}`,
                borderRadius: 18,
                padding: '52px 24px',
                background: dragging ? 'rgba(0,88,188,0.05)' : 'rgba(241,243,254,0.5)',
                cursor: 'pointer',
                maxWidth: 500,
                margin: '0 auto 24px',
                transition: 'border-color 120ms, background 120ms',
              }}
            >
              <Upload size={36} style={{ color: dragging ? '#0058BC' : '#C1C6D7', marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t.insImpDropTitle}</div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{t.insImpDropSub}</div>
            </div>

            {fileName && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(52,199,89,0.08)', border: '0.5px solid rgba(52,199,89,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
                <CheckCircle size={16} style={{ color: '#34C759' }} />
                <span style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{fileName}</span>
                <span style={{ fontSize: 12, color: '#717786' }}>2.3 MB</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t.insImpStepPreview}</h2>
                <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
                  {t.insImpParsedRows(MOCK_PREVIEW.length)}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="badge badge-gray" style={{ fontSize: 12 }}>{t.insImpRowCount(MOCK_PREVIEW.length)}</span>
              </div>
            </div>

            {/* Field mapping check */}
            <div style={{ background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0058BC', marginBottom: 10 }}>{t.insImpMappingTitle}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {FIELD_MAP.map(m => (
                  <div key={m.excelCol} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: m.matched ? 'rgba(52,199,89,0.12)' : 'rgba(255,204,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {m.matched ? <CheckCircle size={10} style={{ color: '#34C759' }} /> : <AlertTriangle size={10} style={{ color: '#FFCC00' }} />}
                    </div>
                    <span style={{ color: '#717786' }}>{m.excelCol.split(': ')[1]}</span>
                    <ArrowRight size={10} style={{ color: '#C1C6D7', flexShrink: 0 }} />
                    <span style={{ color: '#181C23', fontWeight: 500 }}>{sysFieldLabel[m.sysField]}</span>
                    {!m.matched && m.suggestion && (
                      <select className="input-glass" style={{ fontSize: 11, padding: '2px 20px 2px 6px', height: 24 }}>
                        <option>{m.suggestion}</option>
                        <option>{t.insImpIgnoreOption}</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Data table preview */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '0.5px solid rgba(193,198,215,0.4)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t.insImpColRow}</th>
                    <th>{t.insFFullName}</th>
                    <th>{t.insImpColShortName}</th>
                    <th>NAIC</th>
                    <th>{t.insColPType}</th>
                    <th>{t.insImpColState}</th>
                    <th>{t.insFRating}</th>
                    <th>{t.insColStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PREVIEW.map(r => (
                    <tr key={r.row} style={{ background: !r.ok ? 'rgba(186,26,26,0.04)' : undefined }}>
                      <td className="font-data" style={{ color: '#717786', fontSize: 12 }}>{r.row}</td>
                      <td style={{ fontWeight: 500 }}>{r.name}</td>
                      <td>{r.shortName}</td>
                      <td className="font-data" style={{ fontSize: 12, color: r.naic ? '#181C23' : '#BA1A1A' }}>{r.naic || '—'}</td>
                      <td><span className={`badge ${r.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11 }}>{r.type === 'Admitted' ? 'Admitted' : 'Non-Adm.'}</span></td>
                      <td className="font-data" style={{ fontSize: 12 }}>{r.state}</td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: r.rating ? '#0058BC' : '#BA1A1A' }}>{r.rating || '—'}</td>
                      <td>
                        {r.ok
                          ? <span className="flex items-center gap-1"><span className="orb orb-green" /><span style={{ fontSize: 12, color: '#1a7a2e' }}>{t.insImpRowOk}</span></span>
                          : <span className="flex items-center gap-1" title={r.error ? errorLabel[r.error] : undefined}><span className="orb orb-red" /><span style={{ fontSize: 12, color: '#BA1A1A' }}>{r.error ? errorLabel[r.error] : ''}</span></span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <button className="btn-primary" onClick={next} style={{ fontSize: 13 }}>{t.insImpGoValidate} <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Step 4: Validate */}
        {step === 'validate' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 20 }}>{t.insImpValidateTitle}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: t.insImpValidated, value: validRows, color: '#1a7a2e', bg: 'rgba(52,199,89,0.08)', icon: <CheckCircle size={20} /> },
                { label: t.insImpFailed, value: errorRows, color: '#BA1A1A', bg: 'rgba(186,26,26,0.08)', icon: <XCircle size={20} /> },
                { label: t.insImpTotalRows, value: MOCK_PREVIEW.length, color: '#0058BC', bg: 'rgba(0,88,188,0.08)', icon: <FileText size={20} /> },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ color: k.color }}>{k.icon}</div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 13, color: k.color }}>{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {errorRows > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#BA1A1A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} />{t.insImpErrorDetails}
                </div>
                {MOCK_PREVIEW.filter(r => !r.ok).map(r => (
                  <div key={r.row} style={{ display: 'flex', gap: 12, padding: '10px 14px', background: 'rgba(186,26,26,0.05)', border: '0.5px solid rgba(186,26,26,0.15)', borderRadius: 10, marginBottom: 8 }}>
                    <span className="font-data" style={{ fontSize: 12, color: '#717786', flexShrink: 0 }}>{t.insImpRowNum(r.row)}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23', flexShrink: 0 }}>{r.name}</span>
                    <XCircle size={14} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#BA1A1A' }}>{r.error ? errorLabel[r.error] : ''}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-14">
                  <button className="btn-secondary" style={{ fontSize: 13 }}><Download size={14} />{t.insImpDownloadErrors}</button>
                  <button className="btn-ghost" style={{ fontSize: 13, color: '#BA1A1A' }}>{t.insImpSkipErrors}</button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <button className="btn-primary" onClick={next} style={{ fontSize: 13 }}>{t.insImpConfirmContinue} <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Upload size={28} style={{ color: '#0058BC' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t.insImpConfirmTitle}</h2>
            <div style={{ maxWidth: 460, margin: '0 auto 28px' }}>
              <div style={{ background: 'rgba(241,243,254,0.8)', borderRadius: 14, padding: '18px 22px', textAlign: 'left' }}>
                {[
                  [t.insImpSumFile, fileName],
                  [t.insImpSumValidRows, t.insImpRowsCount(validRows)],
                  [t.insImpSumSkippedRows, t.insImpSkippedDetail(errorRows)],
                  [t.insImpSumMode, t.insImpModeInsert],
                  [t.insImpSumReview, t.insImpReviewNote],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)', fontSize: 13.5 }}>
                    <span style={{ color: '#717786' }}>{k}</span>
                    <span style={{ color: '#181C23', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-3">
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => setStep('upload')}>
                <RotateCcw size={14} />{t.insImpReupload}
              </button>
              <button className="btn-primary" style={{ fontSize: 13.5, padding: '10px 28px' }} onClick={next}>
                <Upload size={14} />{t.insImpConfirmImport(validRows)}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Result */}
        {step === 'result' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} style={{ color: '#34C759' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.insImpDoneTitle}</h2>
            <p style={{ fontSize: 14, color: '#717786', marginBottom: 28 }}>{t.insImpDoneSub(validRows, errorRows)}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 480, margin: '0 auto 32px' }}>
              {[
                { label: t.insImpStatImported, value: t.insImpCount(validRows), color: '#1a7a2e', bg: 'rgba(52,199,89,0.08)' },
                { label: t.insImpStatSkipped, value: t.insImpCount(errorRows), color: '#BA1A1A', bg: 'rgba(186,26,26,0.06)' },
                { label: t.insImpStatPendingReview, value: t.insImpCount(validRows), color: '#0058BC', bg: 'rgba(0,88,188,0.07)' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                  <div style={{ fontSize: 12.5, color: k.color, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <button className="btn-secondary" style={{ fontSize: 13.5 }}>
                <Eye size={14} />{t.insImpViewHistory}
              </button>
              <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
                <ArrowRight size={14} />{t.insImpBackToList}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
