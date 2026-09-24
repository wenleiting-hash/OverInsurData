import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useUpdateCooperation } from '@/services/cooperationService'
import type { CooperationRecord } from '@/lib/user-api-client'
import { US_STATES, COOP_TYPES, COOP_TYPE_LABEL, COOP_STATUS, COOP_TRANSITIONS, type Notify } from '../constants'

interface Props {
  coop: CooperationRecord
  notify: Notify
  onClose: () => void
}

const TIERS = ['Tier-1', 'Tier-2', 'Tier-3']

/** Right-side drawer for editing cooperation basics. Root overlay carries no padding. */
export default function CooperationEditDrawer({ coop, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const isTerminated = coop.status === 'Terminated'
  const [status, setStatus] = useState(coop.status)
  const [owner, setOwner] = useState(coop.owner_name ?? '')
  const [coopType, setCoopType] = useState(coop.cooperation_type ?? 'Full-Service')
  const [tier, setTier] = useState(coop.commission_tier ?? 'Tier-2')
  const [effective, setEffective] = useState(coop.effective_date?.slice(0, 10) ?? '')
  const [expiration, setExpiration] = useState(coop.expiration_date?.slice(0, 10) ?? '')
  const [notes, setNotes] = useState(coop.notes ?? '')
  const [states, setStates] = useState<string[]>(coop.state_scope ?? [])

  const update = useUpdateCooperation()

  // Status select follows the doc 3.6 state machine: current value + legal next states.
  // Active/Terminated expose no PUT transitions (terminate/delete use dedicated actions).
  const statusOptions = [coop.status, ...(COOP_TRANSITIONS[coop.status] ?? [])]
  const statusLocked = isTerminated || (COOP_TRANSITIONS[coop.status] ?? []).length === 0

  const toggleState = (s: string) => setStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const save = async () => {
    try {
      await update.mutateAsync({
        id: coop.partnership_id,
        dto: {
          // Terminated cooperations keep terminal status/type/dates (doc 10.8 decision).
          ...(isTerminated ? {} : {
            status,
            cooperation_type: coopType,
            effective_date: effective || undefined,
            expiration_date: expiration || undefined,
          }),
          owner_name: owner.trim() || undefined,
          commission_tier: tier,
          notes,
          state_scope: states,
        },
      })
      notify('success', t('view.toast.coopUpdated'))
      onClose()
    } catch {
      notify('error', t('view.toast.coopUpdateFailed'))
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={onClose} />
      <div style={{
        position: 'relative', width: 460, maxWidth: '92vw', height: '100%', background: '#F7F8FC',
        boxShadow: '-8px 0 32px rgba(24,28,35,0.12)', display: 'flex', flexDirection: 'column',
      }}>
        <div className="flex items-center justify-between" style={{ padding: '18px 22px', borderBottom: '0.5px solid rgba(193,198,215,0.3)' }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: '#181C23' }}>
            {t('view.establish.editTitle', { name: coop.insurer_short ?? coop.carrier_id })}
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.status')}</div>
            <select className="input-glass w-full" style={{ fontSize: 13 }} value={status} disabled={statusLocked}
              onChange={e => setStatus(e.target.value)}>
              {statusOptions.map(s => (
                <option key={s} value={s}>{t(COOP_STATUS[s]?.label ?? s)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.coopType')}</div>
              <select className="input-glass w-full" style={{ fontSize: 13 }} value={coopType} disabled={isTerminated} onChange={e => setCoopType(e.target.value)}>
                {COOP_TYPES.map(v => <option key={v} value={v}>{t(COOP_TYPE_LABEL[v])}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.owner')}</div>
              <input className="input-glass w-full" style={{ fontSize: 13 }} value={owner} placeholder={t('view.form.ownerPlaceholder')} onChange={e => setOwner(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.commissionTier')}</div>
              <select className="input-glass w-full" style={{ fontSize: 13 }} value={tier} onChange={e => setTier(e.target.value)}>
                {TIERS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.effectiveDate')}</div>
              <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={effective} disabled={isTerminated} onChange={e => setEffective(e.target.value)} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.form.expiryDate')}</div>
              <input type="date" className="input-glass w-full" style={{ fontSize: 13 }} value={expiration} disabled={isTerminated} onChange={e => setExpiration(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.wizard.step1.states')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {US_STATES.map(s => (
                <label key={s} style={{
                  padding: '4px 9px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace",
                  background: states.includes(s) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                  border: `0.5px solid ${states.includes(s) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  color: states.includes(s) ? '#0058BC' : '#414755',
                }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={states.includes(s)} onChange={() => toggleState(s)} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.wizard.step2.notes')}</div>
            <textarea className="input-glass w-full" style={{ minHeight: 80, resize: 'vertical', fontSize: 13.5 }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 justify-end" style={{ padding: '14px 22px', borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.cancel')}</button>
          <button className="btn-primary" style={{ fontSize: 13 }} disabled={update.isPending} onClick={save}>{t('view.common.save')}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
