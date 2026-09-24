// ProductStatusModal - 产品上架/下架确认弹窗
// 1:1 同步设计原型 V1.3 src/components/ProductStatusModal.tsx 交互逻辑：
// 下架影响范围（4 格指标）→ 下架范围（全部州/指定州）→ 原因（必选）→ 备注 → 生效时间（必选）→ 影响确认勾选
// 确认时向视图输出稳定 payload（原因用稳定码而非翻译文案；指定州含州码列表；定时生效含 ISO 时间）

import { useMemo, useState } from 'react'
import { X, ToggleRight, AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { InsuranceProduct } from '@/views/data/mockProductData'
import type { ToggleProductStatusPayload } from '@/lib/user-api-client'

interface Props {
  product: InsuranceProduct
  /** 当前仍在销售（active）的州，scope=selected 时只能勾选这些州；不传则回退产品静态可售州 */
  activeStates?: { code: string; name?: string }[]
  onClose: () => void
  onConfirm: (payload: ToggleProductStatusPayload) => void
}

// 稳定原因码 —— 落库/审计使用，与 i18n 文案解耦（避免语言切换后审计记录不可解读）
const DELIST_REASON_CODES = [
  'rate-expired', 'risk-control', 'product-upgrade', 'state-exit',
  'carrier-request', 'performance', 'other',
] as const
const LIST_REASON_CODES = [
  'config-ready', 'rate-updated', 'market-reopened', 'upgrade-completed', 'other',
] as const

export default function ProductStatusModal({ product, activeStates, onClose, onConfirm }: Props) {
  const { t } = useTranslation('product')
  const isListing = product.status !== 'Active'

  const reasonLabels = useMemo(() => {
    const codes = isListing ? LIST_REASON_CODES : DELIST_REASON_CODES
    return codes.map((code, i) => ({
      code,
      label: t(`modals.statusModal.${isListing ? 'listR' : 'delistR'}${i + 1}`),
    }))
  }, [t, isListing])

  // availableStates 可能缺字段（API 数据结构差异），统一兜底为空数组
  const fallbackStates = (product.availableStates ?? []) as Array<string | { code: string; name?: string } | any>
  const selectableStates: { code: string; name?: string }[] =
    activeStates && activeStates.length > 0
      ? activeStates
      : fallbackStates.map(s => (typeof s === 'string' ? { code: s } : { code: s?.code ?? s?.stateCode, name: s?.name ?? s?.stateName }))

  const [reason, setReason] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [selectedStates, setSelectedStates] = useState<string[]>(selectableStates.map(s => s.code))
  const [note, setNote] = useState('')
  const [effectDate, setEffectDate] = useState('immediate')
  const [futureDate, setFutureDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const scopeReady = isListing || scope === 'all' || selectedStates.length > 0
  const canConfirm = !!reason && (effectDate === 'immediate' || !!futureDate) && confirmed && scopeReady

  const toggleState = (code: string) => {
    setSelectedStates(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code])
  }

  const handleConfirm = () => {
    if (!canConfirm) return
    onConfirm({
      action: isListing ? 'list' : 'delist',
      reason,
      remark: note.trim() || undefined,
      // 上架时后端按上次暂停记录恢复，scope 仅对下架有意义
      scope: isListing ? 'all' : scope,
      states: !isListing && scope === 'selected' ? selectedStates : undefined,
      effectiveAt: effectDate === 'scheduled' && futureDate ? `${futureDate}T00:00:00` : null,
    })
  }

  const stateDisplayName = (s: { code: string; name?: string }) => s.name || s.code

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
                {isListing ? t('modals.statusModal.listTitle') : t('modals.statusModal.delistTitle')}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{product.productName} · {product.insurerName}</div>
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
                <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t('modals.statusModal.impactTitle')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: t('modals.statusModal.impactPolicies'), value: (product.policyCount ?? 0).toLocaleString() },
                  { label: t('modals.statusModal.impactStates'), value: selectableStates.length === 50 ? t('values.nationwide') : t('modals.statusModal.statesCount', { count: selectableStates.length }) },
                  { label: t('modals.statusModal.impactChannels'), value: t('modals.statusModal.channelsCount', { count: Math.floor((product.policyCount ?? 0) / 500) }) },
                  { label: t('modals.statusModal.impactPremium'), value: `$${((product.premiumYTD ?? 0) / 1000000 * 0.15).toFixed(1)}M` },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#7a5c00', marginTop: 12 }}>
                {t('modals.statusModal.impactNote')}
              </div>
            </div>
          )}

          {/* Scope — delist only */}
          {!isListing && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('modals.statusModal.scopeTitle')}</div>
              <div className="flex gap-3">
                {[
                  { val: 'all', label: t('modals.statusModal.scopeAll') },
                  { val: 'selected', label: t('modals.statusModal.scopeSelected') },
                ].map(o => (
                  <label key={o.val} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                    background: scope === o.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${scope === o.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  }}>
                    <input type="radio" name="scope" checked={scope === o.val} onChange={() => setScope(o.val as 'all' | 'selected')} style={{ accentColor: '#0058BC' }} />
                    <span style={{ fontSize: 13.5 }}>{o.label}</span>
                  </label>
                ))}
              </div>

              {/* State multi-select — only for scope='selected'; states already suspended/not-available are excluded */}
              {scope === 'selected' && (
                <div style={{
                  marginTop: 10, padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.6)', border: '0.5px solid rgba(193,198,215,0.5)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#414755' }}>
                      {t('modals.statusModal.selectStates')}
                    </span>
                    <div className="flex" style={{ gap: 12 }}>
                      <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: '2px 8px' }}
                        onClick={() => setSelectedStates(selectableStates.map(s => s.code))}>
                        {t('modals.statusModal.selectAll')}
                      </button>
                      <button type="button" className="btn-ghost" style={{ fontSize: 12, padding: '2px 8px' }}
                        onClick={() => setSelectedStates([])}>
                        {t('modals.statusModal.selectNone')}
                      </button>
                    </div>
                  </div>
                  {selectableStates.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: '#BA1A1A' }}>{t('modals.statusModal.noActiveStates')}</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                      {selectableStates.map(s => (
                        <label key={s.code} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, color: '#181C23' }}>
                          <input type="checkbox" checked={selectedStates.includes(s.code)} onChange={() => toggleState(s.code)}
                            style={{ accentColor: '#0058BC' }} />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{s.code}</span>
                          <span style={{ color: '#717786', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stateDisplayName(s)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {selectedStates.length > 0 && (
                    <div style={{ fontSize: 12, color: '#0058BC', marginTop: 8 }}>
                      {t('modals.statusModal.selectedCount', { count: selectedStates.length })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reason — radio value is the stable code, only the label is translated */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>
              {isListing ? t('modals.statusModal.listReasonTitle') : t('modals.statusModal.delistReasonTitle')}<span style={{ color: '#BA1A1A' }}> *</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasonLabels.map(r => (
                <label key={r.code} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                  background: reason === r.code ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${reason === r.code ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  transition: 'all 120ms',
                }}>
                  <input type="radio" name="reason" value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5, color: '#181C23' }}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('modals.statusModal.noteTitle')}</div>
            <textarea className="input-glass" style={{ width: '100%', minHeight: 72, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t('modals.statusModal.notePlaceholder')} value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Effect date */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>
              {t('modals.statusModal.effectTitle')}<span style={{ color: '#BA1A1A' }}> *</span>
            </div>
            <div className="flex gap-2">
              {[{ val: 'immediate', label: t('modals.statusModal.effectImmediate') }, { val: 'scheduled', label: t('modals.statusModal.effectScheduled') }].map(opt => (
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
            {effectDate === 'scheduled' && futureDate && (
              <div style={{ fontSize: 12, color: '#0058BC', marginTop: 6 }}>
                {t('modals.statusModal.scheduledHint', { date: futureDate })}
              </div>
            )}
          </div>

          {/* Confirm */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#0058BC', width: 15, height: 15, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#414755' }}>
              {t('modals.statusModal.confirmLead')}{isListing ? t('modals.statusModal.verbList') : t('modals.statusModal.verbDelist')}
              <strong style={{ color: '#181C23' }}> {product.productName}</strong>{t('modals.statusModal.confirmTail')}
            </span>
          </label>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onClose}>{t('actions.cancel')}</button>
          <button
            onClick={handleConfirm}
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
            {isListing ? t('modals.statusModal.confirmListBtn') : t('modals.statusModal.submitDelistBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
