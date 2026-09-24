import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit2, Plus, X } from 'lucide-react'
import { useGetSettlement } from '@/services/cooperationService'
import type { CooperationRecord } from '@/lib/user-api-client'
import type { Notify } from '../constants'
import SettlementEditPanel from '../components/SettlementEditPanel'

interface Props {
  partnership: CooperationRecord
  notify: Notify
}

/** Settlement panel scoped to one cooperation: 6 prototype tiles + inline editor. */
export default function SettlementPanel({ partnership, notify }: Props) {
  const { t } = useTranslation('cooperation')
  const { data: config, isLoading, isError, refetch } = useGetSettlement(partnership.partnership_id)
  const [editing, setEditing] = useState(false)

  const cycleLabel = (c?: string | null) =>
    c === 'Monthly' ? t('view.settlement.monthly')
      : c === 'Quarterly' ? t('view.settlement.quarterly')
        : c === 'Semi-Annual' ? t('view.settlement.semiAnnual') : (c ?? '—')

  const collectionLabel = (c?: string | null) =>
    c === 'AgencyBill' ? t('view.settlement.collectionAgencyBill')
      : c === 'DirectBill' ? t('view.settlement.collectionDirectBill') : (c ?? '—')

  if (editing) {
    return (
      <div className="card" style={{ padding: '24px 28px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>
            {config ? t('view.settlement.editTitle', { name: partnership.insurer_short ?? partnership.carrier_id })
                    : t('view.settlement.createTitle', { name: partnership.insurer_short ?? partnership.carrier_id })}
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setEditing(false)}><X size={16} /></button>
        </div>
        <SettlementEditPanel
          partnershipId={partnership.partnership_id}
          carrierId={partnership.carrier_id}
          config={config ?? null}
          notify={notify}
          onClose={() => setEditing(false)}
        />
      </div>
    )
  }

  if (isLoading) return <div className="card" style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div>
  if (isError) return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
      <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
    </div>
  )

  if (!config) {
    return (
      <div>
        <div className="flex justify-end" style={{ marginBottom: 14 }}>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
            <Plus size={14} />{t('view.settlement.addConfig')}
          </button>
        </div>
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.settlement')}</div>
      </div>
    )
  }

  const tiles = [
    { label: 'view.settlement.cycle', value: cycleLabel(config.cycle) },
    { label: 'view.settlement.cutoff', value: t('view.settlement.cutoffValue', { day: config.bill_cutoff_day }) },
    { label: 'view.settlement.paymentTerm', value: `Net ${config.payment_term_days}` },
    { label: 'view.settlement.paymentMethod', value: config.payment_method || '—' },
    { label: 'view.settlement.reconFormat', value: config.billing_format || '—' },
    { label: 'view.settlement.premiumCollection', value: collectionLabel(config.premium_collection) },
  ]

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: '#717786' }}>
          {t('view.settlement.lastUpdated', { date: config.last_updated?.slice(0, 10) ?? '—', by: config.updated_by ?? '—' })}
        </div>
        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditing(true)}>
          <Edit2 size={13} />{t('view.common.edit')}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {tiles.map(k => (
          <div key={k.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>{t(k.label)}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
