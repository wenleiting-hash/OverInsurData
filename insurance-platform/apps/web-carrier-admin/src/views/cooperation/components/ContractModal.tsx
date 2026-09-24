import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, Upload, FileText, CheckCircle } from 'lucide-react'
import {
  useAddContract, useUpdateContract,
} from '@/services/cooperationService'
import { productApi, type ContractRecord, type CooperationRecord } from '@/lib/user-api-client'
import type { Notify } from '../constants'

const CONTRACT_TYPES = ['Master', 'Supplement', 'NDA', 'DPA', 'Commission', 'Compliance']

interface Props {
  /** Target cooperation when creating. */
  coop?: CooperationRecord | null
  /** Existing contract when editing. */
  contract?: ContractRecord | null
  notify: Notify
  onClose: () => void
}

/** Create/edit a contract; file bytes go through POST /api/uploads then file_url is submitted. */
export default function ContractModal({ coop, contract, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const isEdit = !!contract
  const partnershipId = contract?.partnership_id ?? coop?.partnership_id ?? ''
  const carrierId = contract?.carrier_id ?? coop?.carrier_id ?? ''

  const [title, setTitle] = useState(contract?.title ?? '')
  const [titleEn, setTitleEn] = useState(contract?.title_en ?? '')
  const [type, setType] = useState(contract?.contract_type ?? 'Master')
  const [version, setVersion] = useState(contract?.version ?? 'v1.0')
  const [effective, setEffective] = useState(contract?.effective_date?.slice(0, 10) ?? '')
  const [expiry, setExpiry] = useState(contract?.expiry_date?.slice(0, 10) ?? '')
  const [signUs, setSignUs] = useState(contract?.signatory_us ?? '')
  const [signThem, setSignThem] = useState(contract?.signatory_them ?? '')
  const [autoRenew, setAutoRenew] = useState(contract?.auto_renew ?? false)
  const [fileUrl, setFileUrl] = useState(contract?.file_url ?? '')
  const [fileName, setFileName] = useState(contract?.file_url?.split('/').pop() ?? '')
  const [uploading, setUploading] = useState(false)

  const add = useAddContract()
  const update = useUpdateContract()
  const busy = add.isPending || update.isPending

  const onFile = async (f: File) => {
    setUploading(true)
    try {
      const up = await productApi.uploadDocument(f)
      setFileUrl(up.url)
      setFileName(up.originalName)
    } catch {
      notify('error', t('view.toast.contractUploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!title.trim()) return
    const dto: any = {
      carrier_id: carrierId,
      partnership_id: partnershipId,
      title: title.trim(),
      title_en: titleEn || undefined,
      contract_type: type,
      version,
      effective_date: effective || undefined,
      expiry_date: expiry || undefined,
      signatory_us: signUs || undefined,
      signatory_them: signThem || undefined,
      auto_renew: autoRenew,
      file_url: fileUrl || undefined,
    }
    try {
      if (isEdit && contract) {
        await update.mutateAsync({ coopId: partnershipId, contractId: contract.contract_id, dto })
      } else {
        await add.mutateAsync({ coopId: partnershipId, dto })
      }
      notify('success', t('view.toast.contractSaved'))
      onClose()
    } catch {
      notify('error', t('view.toast.contractSaveFailed'))
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={busy ? undefined : onClose} />
      <div className="card" style={{
        position: 'relative', width: 620, maxWidth: '94vw', maxHeight: '90vh', overflowY: 'auto',
        padding: '22px 26px', margin: 0,
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>
            {isEdit ? t('view.contracts.editTitle') : t('view.contracts.newTitle')}
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={{ gridColumn: '1 / -1', marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.contractTitle')} *</div>
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1', marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.contractTitleEn')}</div>
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={titleEn} onChange={e => setTitleEn(e.target.value)} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.contracts.th.type')}</div>
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={type} onChange={e => setType(e.target.value)}>
              {CONTRACT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.contracts.th.version')}</div>
            <input className="input-glass w-full" style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} value={version} onChange={e => setVersion(e.target.value)} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.effectiveDate')}</div>
            <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={effective} onChange={e => setEffective(e.target.value)} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.expiryDate')}</div>
            <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={expiry} onChange={e => setExpiry(e.target.value)} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.contracts.th.signatoryUs')}</div>
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={signUs} onChange={e => setSignUs(e.target.value)} />
          </div>
          <div style={{ marginBottom: 13 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.contracts.th.signatoryThem')}</div>
            <input className="input-glass w-full" style={{ fontSize: 13.5 }} value={signThem} onChange={e => setSignThem(e.target.value)} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
          <input type="checkbox" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} style={{ accentColor: '#0058BC' }} />
          <span style={{ fontSize: 13, color: '#414755' }}>{t('view.form.autoRenew')}</span>
        </label>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.contractFile')}</div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, cursor: uploading ? 'wait' : 'pointer',
            background: 'rgba(0,88,188,0.04)', border: '0.5px dashed rgba(0,88,188,0.4)',
          }}>
            <Upload size={15} style={{ color: '#0058BC' }} />
            <span style={{ fontSize: 13, color: '#0058BC' }}>{uploading ? t('view.form.uploading') : t('view.form.uploadFile')}</span>
            <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={e => { const f = e.target.files?.[0]; if (f) void onFile(f) }} />
            {fileName && (
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#AF52DE' }}>
                {fileUrl && <CheckCircle size={12} style={{ color: '#34C759' }} />}
                <FileText size={12} />{fileName}
              </span>
            )}
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.cancel')}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={busy || uploading || !title.trim()} onClick={save}>{t('view.common.save')}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
