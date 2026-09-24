import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Zap } from 'lucide-react'
import { useUpsertSettlement } from '@/services/cooperationService'
import type { SettlementRecord } from '@/lib/user-api-client'
import type { Notify } from '../constants'

interface Props {
  partnershipId: string
  carrierId: string
  config?: SettlementRecord | null
  notify: Notify
  onClose: () => void
}

/** Create (first PUT) or edit settlement config for a partnership. */
export default function SettlementEditPanel({ partnershipId, carrierId, config, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const [cycle, setCycle] = useState(config?.cycle ?? 'Monthly')
  const [cutoff, setCutoff] = useState(String(config?.bill_cutoff_day ?? 25))
  const [terms, setTerms] = useState(String(config?.payment_term_days ?? 30))
  const [method, setMethod] = useState(config?.payment_method ?? 'ACH')
  const [format, setFormat] = useState(config?.billing_format ?? 'EDI')
  const [apiEnabled, setApiEnabled] = useState(config?.api_enabled ?? false)
  const [premCollect, setPremCollect] = useState(config?.premium_collection ?? 'AgencyBill')

  const upsert = useUpsertSettlement()

  const save = async () => {
    try {
      await upsert.mutateAsync({
        coopId: partnershipId,
        dto: {
          carrier_id: carrierId,
          cycle,
          bill_cutoff_day: Number(cutoff) || 0,
          payment_term_days: Number(terms) || 0,
          payment_method: method,
          billing_format: format,
          api_enabled: apiEnabled,
          premium_collection: premCollect,
        },
      })
      notify('success', t('view.toast.settlementSaved'))
      onClose()
    } catch {
      notify('error', t('view.toast.settlementSaveFailed'))
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        {[
          { label: t('view.settlement.cycle'), field: <select className="input-glass w-full" value={cycle} onChange={e => setCycle(e.target.value)} style={{ fontSize: 13 }}><option value="Monthly">{t('view.settlement.monthly')}</option><option value="Quarterly">{t('view.settlement.quarterly')}</option><option value="Semi-Annual">{t('view.settlement.semiAnnual')}</option></select> },
          { label: t('view.settlement.billCutoffDay'), field: <input className="input-glass w-full" value={cutoff} onChange={e => setCutoff(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="25" /> },
          { label: t('view.settlement.paymentTermsDays'), field: <input className="input-glass w-full" value={terms} onChange={e => setTerms(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="30" /> },
          { label: t('view.settlement.paymentMethod'), field: <select className="input-glass w-full" value={method} onChange={e => setMethod(e.target.value)} style={{ fontSize: 13 }}><option>ACH</option><option>Wire</option><option>Check</option><option>EFT</option></select> },
          { label: t('view.settlement.reconFormat'), field: <select className="input-glass w-full" value={format} onChange={e => setFormat(e.target.value)} style={{ fontSize: 13 }}><option>EDI</option><option>API</option><option>CSV</option><option>Excel</option></select> },
          { label: t('view.settlement.premiumCollection'), field: <select className="input-glass w-full" value={premCollect} onChange={e => setPremCollect(e.target.value)} style={{ fontSize: 13 }}><option value="AgencyBill">{t('view.settlement.collectionAgencyBill')}</option><option value="DirectBill">{t('view.settlement.collectionDirectBill')}</option></select> },
        ].map(({ label, field }) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{label}</div>
            {field}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '11px 14px', borderRadius: 10, background: apiEnabled ? 'rgba(0,88,188,0.07)' : 'rgba(241,243,254,0.7)', border: `0.5px solid ${apiEnabled ? '#0058BC' : 'rgba(193,198,215,0.4)'}` }}>
          <input type="checkbox" checked={apiEnabled} onChange={e => setApiEnabled(e.target.checked)} style={{ accentColor: '#0058BC' }} />
          <Zap size={14} style={{ color: apiEnabled ? '#0058BC' : '#717786' }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t('view.settlement.enableApiRecon')}</div>
            <div style={{ fontSize: 12, color: '#717786' }}>{t('view.settlement.enableApiReconDesc')}</div>
          </div>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.cancel')}</button>
        <button className="btn-primary" style={{ fontSize: 13 }} disabled={upsert.isPending} onClick={save}>{t('view.settlement.saveConfig')}</button>
      </div>
    </div>
  )
}
