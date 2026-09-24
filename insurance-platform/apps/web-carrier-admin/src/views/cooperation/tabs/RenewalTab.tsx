import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw, CheckCircle, X, CalendarClock } from 'lucide-react'
import {
  useGetCoopRenewals, useGetContracts, useRegisterRenewal,
} from '@/services/cooperationService'
import type { CooperationRecord } from '@/lib/user-api-client'
import { RENEWAL_PRIORITY, RENEWAL_STATUS, daysUntil, type Notify } from '../constants'

export interface RenewalPrefill {
  /** 从合同 Tab「续签」按钮带入，预选续约合同。 */
  contractId?: string
}

interface Props {
  partnership: CooperationRecord
  notify: Notify
  /** Set when the user jumps from the contract tab's "renew" action. */
  prefill: RenewalPrefill | null
  onPrefillConsumed: () => void
}

interface ModalState {
  contractId?: string
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * V1.0.15 O6：续约无谈判/待执行中间态。
 * 页面展示到期提醒行 + 续约登记时间线；登记即直接延长合作到期日。
 */
export default function RenewalPanel({ partnership, notify, prefill, onPrefillConsumed }: Props) {
  const { t } = useTranslation('cooperation')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [newExpiry, setNewExpiry] = useState('')
  const [contractId, setContractId] = useState('')
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState('')

  const { data: renewals = [], isLoading, isError, refetch } = useGetCoopRenewals(partnership.partnership_id)
  const { data: contracts = [] } = useGetContracts(partnership.partnership_id)
  const register = useRegisterRenewal()

  const canRegister = ['Signed', 'Active'].includes(partnership.status)

  const openModal = (st?: ModalState) => {
    setModal(st ?? {})
    setContractId(st?.contractId ?? '')
    setNote('')
    setFormError('')
    // 默认新到期日：当前到期日 +1 年（兜底今天 +1 年）
    const base = partnership.expiration_date ? new Date(partnership.expiration_date) : new Date()
    const d = Number.isNaN(base.getTime()) ? new Date() : base
    d.setFullYear(d.getFullYear() + 1)
    setNewExpiry(d.toISOString().slice(0, 10))
  }

  // 合同 Tab「续签」跳入时自动打开登记弹窗并预选合同
  useEffect(() => {
    if (prefill) {
      openModal({ contractId: prefill.contractId })
      onPrefillConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill])

  const sorted = useMemo(
    () => [...renewals].sort((a, b) =>
      new Date(b.registered_at ?? b.created_at ?? 0).getTime() - new Date(a.registered_at ?? a.created_at ?? 0).getTime()),
    [renewals],
  )

  const validate = (): boolean => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiry)) {
      setFormError(t('view.renewal.dateInvalid'))
      return false
    }
    const next = new Date(`${newExpiry}T00:00:00Z`).getTime()
    if (next <= Date.now()) {
      setFormError(t('view.renewal.dateMustBeFuture'))
      return false
    }
    if (partnership.expiration_date && next <= new Date(partnership.expiration_date).getTime()) {
      setFormError(t('view.renewal.dateMustBeLater', { date: partnership.expiration_date.slice(0, 10) }))
      return false
    }
    return true
  }

  const submit = async () => {
    if (!validate()) return
    try {
      await register.mutateAsync({
        coopId: partnership.partnership_id,
        dto: {
          new_expiry_date: newExpiry,
          new_contract_id: contractId || undefined,
          note: note.trim() || undefined,
        },
      })
      notify('success', t('view.toast.renewalRegistered'))
      setModal(null)
    } catch (e: any) {
      notify('error', e?.response?.data?.message ? String(e.response.data.message) : t('view.toast.renewalRegisterFailed'))
    }
  }

  const header = (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#414755' }}>{t('view.renewal.recordsTitle')}</span>
      <button
        className="btn-primary"
        style={{ fontSize: 13 }}
        disabled={!canRegister}
        title={canRegister ? undefined : t('view.renewal.registerDisabled')}
        onClick={() => openModal()}
      >
        <RefreshCw size={14} />{t('view.renewal.register')}
      </button>
    </div>
  )

  return (
    <div>
      {header}
      {isLoading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div>
      ) : isError ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: '#BA1A1A', fontSize: 13.5, marginBottom: 12 }}>{t('view.common.loadError')}</div>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => refetch()}>{t('view.common.retry')}</button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: '#717786' }}>{t('view.empty.renewal')}</div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(193,198,215,0.4)', borderRadius: 1 }} />
          {sorted.map(r => {
            const isRegistered = r.status === 'renewed'
            const st = RENEWAL_STATUS[r.status] || RENEWAL_STATUS.upcoming
            const pr = RENEWAL_PRIORITY[r.priority] ?? RENEWAL_PRIORITY.normal
            const d = daysUntil(r.expiry_date)
            const isOverdue = d !== null && d < 0
            return (
              <div key={r.renewal_id} className="flex items-start gap-4" style={{ marginBottom: 18, position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%',
                  background: isRegistered ? '#34C759' : isOverdue ? '#BA1A1A' : (d ?? 999) <= 90 ? '#FF9500' : '#0058BC',
                  border: '2px solid white',
                }} />
                <div className="card" style={{ flex: 1, padding: '14px 18px', marginLeft: 4 }}>
                  <div className="flex items-start justify-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-1" style={{ flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.title}</span>
                        <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{t(st.label)}</span>
                        {!isRegistered && r.priority && (
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: pr.color, background: pr.color + '14', padding: '2px 7px', borderRadius: 6 }}>
                            {t(pr.label)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {t('view.renewal.expiryDate')}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: isOverdue && !isRegistered ? '#BA1A1A' : '#414755' }}>
                          {r.expiry_date?.slice(0, 10)}
                        </span>
                        {!isRegistered && d !== null && (
                          <span style={{ marginLeft: 10, color: isOverdue ? '#BA1A1A' : d <= 30 ? '#a05800' : '#717786', fontWeight: 500 }}>
                            {isOverdue ? t('view.renewal.overdue', { days: Math.abs(d) }) : t('view.renewal.daysLeft', { days: d })}
                          </span>
                        )}
                      </div>
                      {isRegistered && (
                        <div style={{ fontSize: 12.5, color: '#414755', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                          <span>
                            {t('view.renewal.newExpiryDate')}
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1A7F37', fontWeight: 600 }}>{r.new_expiry_date?.slice(0, 10)}</span>
                          </span>
                          {r.new_contract_title && (
                            <span>{t('view.renewal.newContract')}{r.new_contract_title}</span>
                          )}
                          <span style={{ color: '#9AA0B4' }}>
                            {t('view.renewal.registeredAt')} {r.registered_at?.slice(0, 10)} · {r.registered_by ?? '—'}
                          </span>
                        </div>
                      )}
                      {isRegistered && r.register_note && (
                        <div style={{ fontSize: 12.5, color: '#717786', marginTop: 5 }}>
                          {t('view.renewal.registerNoteWith', { note: r.register_note })}
                        </div>
                      )}
                    </div>
                    {!isRegistered && (
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12.5, padding: '6px 14px' }}
                        disabled={!canRegister}
                        title={canRegister ? undefined : t('view.renewal.registerDisabled')}
                        onClick={() => openModal({ contractId: r.contract_id ?? undefined })}
                      >
                        <CheckCircle size={13} />{t('view.renewal.register')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,28,35,0.35)' }} onClick={register.isPending ? undefined : () => setModal(null)} />
          <div className="card" style={{ position: 'relative', width: 500, maxWidth: '94vw', padding: '22px 26px', margin: 0 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#181C23' }}>
                <CalendarClock size={17} style={{ color: '#0058BC' }} />
                {t('view.renewal.registerTitle')}
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setModal(null)}><X size={16} /></button>
            </div>

            <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '11px 16px', marginBottom: 16, fontSize: 12.5, color: '#414755' }}>
              {partnership.insurer_short ?? partnership.carrier_id} · {t('view.renewal.currentExpiry')}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", marginLeft: 4 }}>
                {partnership.expiration_date?.slice(0, 10) ?? '—'}
              </span>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>
                {t('view.renewal.newExpiryDate')}<span style={{ color: '#BA1A1A' }}> *</span>
              </div>
              <input
                type="date"
                className="input-glass w-full"
                style={{ fontSize: 13.5 }}
                min={todayStr()}
                value={newExpiry}
                onChange={e => { setNewExpiry(e.target.value); setFormError('') }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.renewal.newContract')}</div>
              <select
                className="input-glass w-full"
                style={{ fontSize: 13.5 }}
                value={contractId}
                onChange={e => setContractId(e.target.value)}
              >
                <option value="">{t('view.renewal.newContractNone')}</option>
                {contracts.map(ct => (
                  <option key={ct.contract_id} value={ct.contract_id}>
                    {ct.title}{ct.expiry_date ? t('view.renewal.contractExpirySuffix', { date: ct.expiry_date.slice(0, 10) }) : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: formError ? 10 : 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.renewal.registerNote')}</div>
              <textarea
                className="input-glass w-full"
                style={{ minHeight: 64, fontSize: 13, resize: 'vertical' }}
                placeholder={t('view.renewal.registerNotePlaceholder')}
                value={note}
                maxLength={500}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            {formError && (
              <div style={{ fontSize: 12.5, color: '#BA1A1A', marginBottom: 12 }}>{formError}</div>
            )}

            <div className="flex gap-2 justify-end">
              <button className="btn-secondary" style={{ fontSize: 13 }} disabled={register.isPending} onClick={() => setModal(null)}>
                {t('view.common.cancel')}
              </button>
              <button className="btn-primary" style={{ fontSize: 13 }} disabled={register.isPending || !newExpiry} onClick={submit}>
                <RefreshCw size={13} />{t('view.renewal.confirmRegister')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
