import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, XCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import { useTerminateCooperation } from '@/services/cooperationService'
import type { CooperationRecord } from '@/lib/user-api-client'
import { COOP_TYPE_LABEL, type Notify } from '../constants'

const REASON_KEYS = [
  'expired', 'compliance', 'strategy', 'mutual', 'counterparty', 'performance', 'other',
] as const

interface Props {
  coop: CooperationRecord
  notify: Notify
  onClose: () => void
}

/**
 * Termination confirmation dialog.
 * V1.0.12 interaction alignment: same centered modal pattern as 保险管理停用确认
 * (components/DisableModal) — fixed overlay + centered glass dialog, red header,
 * reason/effect form inside, footer cancel/confirm. Self-portalized so list and
 * detail callers render it identically. No approval step (2026-09-13 rule).
 */
export default function TerminatePanel({ coop, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const [reason, setReason] = useState<string>('')
  const [termType, setTermType] = useState<'immediate' | 'end-of-term' | 'scheduled'>('end-of-term')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  const terminate = useTerminateCooperation()
  const stateCount = coop.state_scope?.length ?? 0
  const canSubmit = !!reason && (termType !== 'scheduled' || !!date) && confirmed && !terminate.isPending
  const today = new Date().toISOString().split('T')[0]

  const submit = async () => {
    try {
      const res = await terminate.mutateAsync({
        id: coop.partnership_id,
        payload: {
          reason,
          note: note || undefined,
          effectType: termType,
          effectiveAt: termType === 'scheduled' && date ? new Date(`${date}T00:00:00`).toISOString() : undefined,
        },
      })
      setDone(true)
      notify('success', res.scheduled
        ? t('view.toast.terminateScheduled', { date: (coop.terminate_effective_at || date || '').slice(0, 10) })
        : t('view.toast.terminateSuccess', { insurer: coop.insurer_short ?? '' }))
    } catch (e: any) {
      notify('error', e?.response?.data?.message ? String(e.response.data.message) : t('view.toast.terminateFailed'))
    }
  }

  const title = coop.insurer_short ?? coop.carrier_id

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(24,28,35,0.35)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget && !terminate.isPending) onClose() }}
    >
      <div
        className="glass-strong"
        style={{
          width: 620, maxWidth: '100%', maxHeight: '90vh',
          borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', background: '#fff',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header — same pattern as DisableModal */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(186,26,26,0.05)', flexShrink: 0,
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(186,26,26,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={18} style={{ color: '#BA1A1A' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                {t('view.terminate.modalTitle')}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>
                {t('view.terminate.currentInfo', { type: coop.cooperation_type ? t(COOP_TYPE_LABEL[coop.cooperation_type] ?? coop.cooperation_type) : '—', date: coop.expiration_date?.slice(0, 10) || '—' })}
                {coop.naic_code ? ` · NAIC ${coop.naic_code}` : ''}
              </div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} disabled={terminate.isPending} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* Success state stays inside the dialog (then closes) */
          <div style={{ padding: '48px 40px', textAlign: 'center' }}>
            <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>
              {t('view.terminate.done.title')}
            </div>
            <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t('view.terminate.done.desc')}</p>
            <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onClose}>
              {t('view.terminate.done.back')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: '22px 24px', overflowY: 'auto' }}>
              {/* Impact preview */}
              <div style={{
                background: 'rgba(255,149,0,0.07)', border: '0.5px solid rgba(255,149,0,0.25)',
                borderRadius: 14, padding: '14px 16px', marginBottom: 20,
              }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                  <AlertTriangle size={14} style={{ color: '#a05800' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>
                    {t('view.terminate.withInsurer', { insurer: title })}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>{stateCount}</div>
                    <div style={{ fontSize: 12, color: '#414755', marginTop: 2 }}>{t('view.terminate.impact.states')}</div>
                    <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t('view.terminate.impact.statesDesc')}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>
                      {coop.expiration_date?.slice(0, 10) || t('view.coopCard.permanent')}
                    </div>
                    <div style={{ fontSize: 12, color: '#414755', marginTop: 2 }}>{t('view.terminate.impact.expiry')}</div>
                    <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t('view.terminate.impact.expiryDesc')}</div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
                  {t('view.terminate.reasonLabel')}<span style={{ color: '#BA1A1A' }}> *</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {REASON_KEYS.map(r => (
                    <label key={r} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                      background: reason === r ? 'rgba(186,26,26,0.07)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${reason === r ? 'rgba(186,26,26,0.30)' : 'rgba(193,198,215,0.5)'}`,
                    }}>
                      <input type="radio" name="term-reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#BA1A1A' }} />
                      <span style={{ fontSize: 13.5, color: '#181C23' }}>{t(`view.terminate.reasons.${r}`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Effect type */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
                  {t('view.terminate.typeLabel')}<span style={{ color: '#BA1A1A' }}> *</span>
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { v: 'end-of-term', l: 'view.terminate.types.endOfTerm', d: t('view.terminate.types.endOfTermDesc', { date: coop.expiration_date?.slice(0, 10) || '—' }) },
                    { v: 'immediate', l: 'view.terminate.types.immediate', d: t('view.terminate.types.immediateDesc') },
                    { v: 'scheduled', l: 'view.terminate.types.scheduled', d: t('view.terminate.types.scheduledDesc') },
                  ].map(o => (
                    <label key={o.v} style={{
                      flex: 1, padding: '10px 12px', borderRadius: 9, cursor: 'pointer',
                      background: termType === o.v ? 'rgba(186,26,26,0.07)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${termType === o.v ? 'rgba(186,26,26,0.30)' : 'rgba(193,198,215,0.5)'}`,
                    }}>
                      <input type="radio" name="termType" checked={termType === o.v} onChange={() => setTermType(o.v as any)} style={{ display: 'none' }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: termType === o.v ? '#BA1A1A' : '#181C23' }}>{t(o.l)}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 3, lineHeight: 1.5 }}>{o.d}</div>
                    </label>
                  ))}
                </div>
                {termType === 'scheduled' && (
                  <div style={{ marginTop: 10 }}>
                    <input type="date" className="input-glass" style={{ fontSize: 13 }} min={today} value={date} onChange={e => setDate(e.target.value)} />
                    {date && <div style={{ fontSize: 12, color: '#a05800', marginTop: 6 }}>{t('view.terminate.scheduledHint', { date })}</div>}
                  </div>
                )}
              </div>

              {/* Note */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 6 }}>
                  {t('view.terminate.noteLabel')}
                </label>
                <textarea
                  className="input-glass"
                  style={{ width: '100%', minHeight: 72, resize: 'vertical', fontSize: 13.5 }}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={t('view.terminate.notePlaceholder')}
                />
              </div>

              {/* Confirm checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#BA1A1A', width: 15, height: 15, flexShrink: 0 }}
                />
                <span style={{ fontSize: 13, color: '#414755' }}>
                  {t('view.terminate.confirmPrefix')}<strong style={{ color: '#181C23' }}> {title} </strong>{t('view.terminate.confirmSuffix')}
                </span>
              </label>
            </div>

            {/* Footer actions — same pattern as DisableModal */}
            <div style={{
              padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
              background: 'rgba(241,243,254,0.5)', flexShrink: 0,
            }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} disabled={terminate.isPending} onClick={onClose}>
                {t('view.common.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
                  background: canSubmit ? '#BA1A1A' : 'rgba(193,198,215,0.5)',
                  color: canSubmit ? '#fff' : '#717786',
                  borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
                }}
              >
                {terminate.isPending
                  ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'coop-spin 0.7s linear infinite' }} />
                  : <XCircle size={14} />}
                {terminate.isPending ? t('view.terminate.submitting') : t('view.terminate.submit')}
              </button>
              <style>{`@keyframes coop-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
