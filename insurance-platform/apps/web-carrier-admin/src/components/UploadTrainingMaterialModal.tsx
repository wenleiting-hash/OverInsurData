// UploadTrainingMaterialModal — 产品详情 · 培训材料 Tab 的「上传材料」弹窗
// 两步流程：① 选中文件后立即 POST /api/uploads 落盘并拿到 { originalName, size, url }；
//          ② 填写元数据后提交，由父视图 POST /products/:id/training-materials 入库。
// 先上传再登记的好处是文件上传失败能立刻反馈，不会产生"已登记但文件不存在"的脏数据。

import { useRef, useState } from 'react'
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { productApi } from '@/lib/user-api-client'
import type { CreateTrainingMaterialPayload, ProductTrainingMaterial } from '@/lib/user-api-client'

interface Props {
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (dto: CreateTrainingMaterialPayload) => void
  /** Surfaces an upload/submit failure message in the parent's toast area. */
  onError: (msg: string) => void
}

const MATERIAL_TYPES: ProductTrainingMaterial['type'][] = [
  'product-guide', 'rate-manual', 'underwriting-guide', 'compliance', 'training-deck', 'faq', 'video',
]

// Same type→label mapping ProductDetail uses for its material badges, so the picker and the list agree.
const TYPE_LABEL_KEY: Record<ProductTrainingMaterial['type'], string> = {
  'product-guide': 'detail.training.guide',
  'rate-manual': 'detail.training.rateManual',
  'underwriting-guide': 'detail.training.uwGuide',
  'compliance': 'detail.training.compliance',
  'training-deck': 'detail.training.deck',
  'faq': 'detail.training.faq',
  'video': 'detail.training.video',
}

// Channel values must match those already stored in required_for (jsonb) by the seed data.
const CHANNELS = ['Independent Agency', 'Broker', 'MGA', 'Wholesale Broker']

/** Matches the seed rows' human-readable label format ("4.2 MB" / "856 KB"); DB column is varchar. */
const fmtSize = (bytes: number) =>
  bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

const inputStyle: React.CSSProperties = {
  width: '100%', height: 40, padding: '0 12px', fontSize: 13,
  border: '0.5px solid rgba(193,198,215,0.6)', borderRadius: 10,
  background: 'rgba(255,255,255,0.85)', color: '#181C23', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6, display: 'block',
}

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}{required && <span style={{ color: '#BA1A1A', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function UploadTrainingMaterialModal({ isSubmitting, onClose, onSubmit, onError }: Props) {
  const { t } = useTranslation('product')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Uploaded-file metadata (null until the POST /api/uploads call succeeds)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; url: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [title, setTitle] = useState('')
  const [titleEn, setTitleEn] = useState('')
  const [type, setType] = useState<ProductTrainingMaterial['type']>('product-guide')
  const [version, setVersion] = useState('v1.0')
  const [requiredFor, setRequiredFor] = useState<string[]>(['Independent Agency', 'Broker'])
  const [expiryDate, setExpiryDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  const extractMessage = (err: any) => {
    const raw = err?.response?.data?.message
    return Array.isArray(raw) ? raw.join('; ') : (typeof raw === 'string' ? raw : '')
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file after a failure
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const meta = await productApi.uploadDocument(file)
      setFileInfo({ name: meta.originalName, size: fmtSize(meta.size), url: meta.url })
      // Prefill the title from the file name (without extension) to save a step
      setTitle(prev => prev || meta.originalName.replace(/\.[^.]+$/, ''))
    } catch (err: any) {
      onError(extractMessage(err) || t('modals.uploadMaterial.uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  const toggleChannel = (c: string) => {
    setRequiredFor(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  const handleSubmit = () => {
    if (!fileInfo) { setError(t('modals.uploadMaterial.fileRequired')); return }
    if (!title.trim()) { setError(t('modals.uploadMaterial.titleRequired')); return }
    setError(null)
    onSubmit({
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      type,
      fileName: fileInfo.name,
      fileSize: fileInfo.size,
      version: version.trim() || undefined,
      requiredFor,
      expiryDate: expiryDate || undefined,
      url: fileInfo.url,
    })
  }

  const busy = isUploading || isSubmitting

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}
    >
      <div className="glass-strong" style={{ width: 620, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,88,188,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Upload size={17} style={{ color: '#0058BC' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23' }}>{t('modals.uploadMaterial.title')}</div>
            <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{t('modals.uploadMaterial.subtitle')}</div>
          </div>
          <button onClick={onClose} disabled={busy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <X size={18} style={{ color: '#717786' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '66vh', overflowY: 'auto' }}>
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />

          {/* Drop-zone style picker */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            style={{
              border: `1px dashed ${fileInfo ? 'rgba(52,199,89,0.45)' : 'rgba(193,198,215,0.8)'}`,
              background: fileInfo ? 'rgba(52,199,89,0.05)' : 'rgba(255,255,255,0.5)',
              borderRadius: 14, padding: '22px 18px', textAlign: 'center', cursor: isUploading ? 'default' : 'pointer',
              marginBottom: 18,
            }}
          >
            {isUploading ? (
              <div style={{ fontSize: 13, color: '#0058BC' }}>{t('modals.uploadMaterial.uploading')}</div>
            ) : fileInfo ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <CheckCircle size={17} style={{ color: '#34C759', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#181C23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fileInfo.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>
                    {fileInfo.size} · {t('modals.uploadMaterial.changeFile')}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <FileText size={22} style={{ color: '#C1C6D7', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#414755', fontWeight: 500 }}>{t('modals.uploadMaterial.pickFile')}</div>
                <div style={{ fontSize: 11.5, color: '#717786', marginTop: 4 }}>{t('modals.uploadMaterial.pickHint')}</div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.uploadMaterial.titleField')} required>
              <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} />
            </Row>
            <Row label={t('modals.uploadMaterial.titleEn')}>
              <input style={inputStyle} value={titleEn} onChange={e => setTitleEn(e.target.value)} />
            </Row>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Row label={t('modals.uploadMaterial.type')} required>
              <select style={inputStyle} value={type} onChange={e => setType(e.target.value as ProductTrainingMaterial['type'])}>
                {MATERIAL_TYPES.map(mt => <option key={mt} value={mt}>{t(TYPE_LABEL_KEY[mt])}</option>)}
              </select>
            </Row>
            <Row label={t('modals.uploadMaterial.version')}>
              <input style={inputStyle} value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" />
            </Row>
          </div>

          <Row label={t('modals.uploadMaterial.requiredFor')}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CHANNELS.map(c => {
                const on = requiredFor.includes(c)
                return (
                  <button
                    key={c} type="button" onClick={() => toggleChannel(c)}
                    style={{
                      fontSize: 12, padding: '6px 12px', borderRadius: 9, cursor: 'pointer',
                      border: `0.5px solid ${on ? '#0058BC' : 'rgba(193,198,215,0.6)'}`,
                      background: on ? 'rgba(0,88,188,0.10)' : 'rgba(255,255,255,0.7)',
                      color: on ? '#0058BC' : '#717786', fontWeight: on ? 600 : 400,
                    }}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </Row>

          <Row label={t('modals.uploadMaterial.expiryDate')}>
            <input style={inputStyle} type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          </Row>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)', fontSize: 12.5, color: '#BA1A1A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} style={{ flexShrink: 0 }} />{error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose} disabled={busy}>
            {t('modals.uploadMaterial.cancel')}
          </button>
          <button className="btn-primary" style={{ fontSize: 13, opacity: busy ? 0.6 : 1 }} onClick={handleSubmit} disabled={busy}>
            {isSubmitting ? t('modals.uploadMaterial.submitting') : t('modals.uploadMaterial.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
