import { useState } from 'react'
import { X, ToggleRight, AlertTriangle } from 'lucide-react'
import { products, insurers } from '../data/mockData'
import { useLang } from '../i18n'

interface Props {
  productId: string
  onClose: () => void
  onConfirm: () => void
}

export default function ProductStatusModal({ productId, onClose, onConfirm }: Props) {
  const { t } = useLang()
  const prod = products.find(p => p.id === productId) ?? products[0]
  const ins = insurers.find(i => i.id === prod.insurerId)
  const isListing = prod.status !== 'on-sale'

  const delistReasons = [t.psmDelistR1, t.psmDelistR2, t.psmDelistR3, t.psmDelistR4, t.psmDelistR5, t.psmDelistR6, t.psmDelistR7]
  const listReasons = [t.psmListR1, t.psmListR2, t.psmListR3, t.psmListR4, t.psmListR5]

  const [reason, setReason] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [note, setNote] = useState('')
  const [effectDate, setEffectDate] = useState('immediate')
  const [futureDate, setFutureDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const reasons = isListing ? listReasons : delistReasons
  const canConfirm = reason && (effectDate === 'immediate' || futureDate) && confirmed

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-strong" style={{ width: 580, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isListing ? 'rgba(52,199,89,0.05)' : 'rgba(186,26,26,0.05)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isListing ? 'rgba(52,199,89,0.12)' : 'rgba(186,26,26,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ToggleRight size={18} style={{ color: isListing ? '#34C759' : '#BA1A1A' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                {isListing ? t.psmListTitle : t.psmDelistTitle}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{prod.name} · {ins?.shortName}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Impact — delist only */}
          {!isListing && (
            <div style={{ background: 'rgba(255,149,0,0.07)', border: '0.5px solid rgba(255,149,0,0.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} style={{ color: '#a05800' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t.psmImpactTitle}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: t.psmImpactPolicies, value: prod.policyCount.toLocaleString() },
                  { label: t.psmImpactStates, value: prod.states[0] === 'ALL' ? t.prdNationwide : t.psmStatesCount(prod.states.length) },
                  { label: t.psmImpactChannels, value: t.psmChannelsCount(Math.floor(prod.policyCount / 500)) },
                  { label: t.psmImpactPremium, value: `$${(prod.premium / 1000000 * 0.15).toFixed(1)}M` },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#7a5c00', marginTop: 12 }}>
                {t.psmImpactNote}
              </div>
            </div>
          )}

          {/* Scope — delist only */}
          {!isListing && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.psmScopeTitle}</div>
              <div className="flex gap-3">
                {[
                  { val: 'all', label: t.psmScopeAll },
                  { val: 'selected', label: t.psmScopeSelected },
                ].map(o => (
                  <label key={o.val} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                    background: scope === o.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${scope === o.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  }}>
                    <input type="radio" name="scope" checked={scope === o.val} onChange={() => setScope(o.val as any)} style={{ accentColor: '#0058BC' }} />
                    <span style={{ fontSize: 13.5 }}>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>
              {isListing ? t.psmListReasonTitle : t.psmDelistReasonTitle}<span style={{ color: '#BA1A1A' }}> *</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasons.map(r => (
                <label key={r} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                  background: reason === r ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${reason === r ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  transition: 'all 120ms',
                }}>
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5, color: '#181C23' }}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t.psmNoteTitle}</div>
            <textarea className="input-glass" style={{ width: '100%', minHeight: 72, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t.psmNotePlaceholder} value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Effect date */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>
              {t.psmEffectTitle}<span style={{ color: '#BA1A1A' }}> *</span>
            </div>
            <div className="flex gap-2">
              {[{ val: 'immediate', label: t.psmEffectImmediate }, { val: 'scheduled', label: t.psmEffectScheduled }].map(opt => (
                <label key={opt.val} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                  background: effectDate === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${effectDate === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                }}>
                  <input type="radio" name="effectDate" checked={effectDate === opt.val} onChange={() => setEffectDate(opt.val)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5 }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {effectDate === 'scheduled' && (
              <input type="date" className="input-glass" style={{ fontSize: 13, marginTop: 10 }} min={today} value={futureDate} onChange={e => setFutureDate(e.target.value)} />
            )}
          </div>

          {/* Confirm */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#0058BC', width: 15, height: 15, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#414755' }}>
              {t.psmConfirmLead}{isListing ? t.psmVerbList : t.psmVerbDelist}
              <strong style={{ color: '#181C23' }}> {prod.name}</strong>{t.psmConfirmTail}
            </span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onClose}>{t.prdCancel}</button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
              background: canConfirm ? (isListing ? '#1a7a2e' : '#BA1A1A') : 'rgba(193,198,215,0.5)',
              color: canConfirm ? '#fff' : '#717786',
              borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canConfirm ? 'pointer' : 'not-allowed', border: 'none', transition: 'all 140ms',
            }}
          >
            <ToggleRight size={14} />
            {isListing ? t.psmConfirmListBtn : t.psmSubmitDelistBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
