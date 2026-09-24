import { useState } from 'react';
import { X, AlertTriangle, StopCircle, PlayCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToggleInsurerStatus } from '@/services/insurerService';
import type { InsurerRecord } from '@/lib/user-api-client';

interface Props {
  insurer: InsurerRecord;
  onClose: () => void;
}

const DISABLE_REASON_KEYS = ['contractExpired', 'compliance', 'lineExit', 'migration', 'mutual', 'carrier', 'other'];
const ENABLE_REASON_KEYS = ['resolved', 'migrationDone', 'newContract', 'mgmt', 'otherShort'];

export default function DisableModal({ insurer, onClose }: Props) {
  const { t } = useTranslation(['insurer', 'common']);
  const toggleStatus = useToggleInsurerStatus();
  const isDisabling = insurer.status === 'active';
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [effectDate, setEffectDate] = useState('immediate');
  const [futureDate, setFutureDate] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const reasonKeys = isDisabling ? DISABLE_REASON_KEYS : ENABLE_REASON_KEYS;
  const reasonLabel: Record<string, string> = {
    contractExpired: t('modals.disable.reason.contractExpired'),
    compliance: t('modals.disable.reason.compliance'),
    lineExit: t('modals.disable.reason.lineExit'),
    migration: t('modals.disable.reason.migration'),
    mutual: t('modals.disable.reason.mutual'),
    carrier: t('modals.disable.reason.carrier'),
    other: t('modals.disable.reason.other'),
    resolved: t('modals.disable.reason.resolved'),
    migrationDone: t('modals.disable.reason.migrationDone'),
    newContract: t('modals.disable.reason.newContract'),
    mgmt: t('modals.disable.reason.mgmt'),
    otherShort: t('modals.disable.reason.otherShort'),
  };

  const impactData = {
    products: insurer.product_count ?? 0,
    channels: insurer.channel_count ?? 0,
    activePolicies: 0,
    pendingQuotes: 0,
    pendingCommission: 0,
  };

  const canConfirm = reason && (effectDate === 'immediate' || futureDate) && confirmed && !toggleStatus.isPending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(24,28,35,0.35)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-strong"
        style={{ width: 580, maxWidth: 'calc(100vw - 32px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '0.5px solid rgba(193,198,215,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: isDisabling ? 'rgba(186,26,26,0.05)' : 'rgba(52,199,89,0.05)',
        }}>
          <div className="flex items-center gap-3">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isDisabling ? 'rgba(186,26,26,0.10)' : 'rgba(52,199,89,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDisabling
                ? <StopCircle size={18} style={{ color: '#BA1A1A' }} />
                : <PlayCircle size={18} style={{ color: '#34C759' }} />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                {isDisabling ? t('modals.disable.titleDisable') : t('modals.disable.titleEnable')}
              </div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{insurer.short_name || insurer.carrier_name} · NAIC {insurer.naic_code}</div>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '70vh', overflowY: 'auto' }}>

          {/* Impact preview — only for disabling */}
          {isDisabling && (
            <div style={{ background: 'rgba(255,149,0,0.07)', border: '0.5px solid rgba(255,149,0,0.25)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <AlertTriangle size={14} style={{ color: '#a05800' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#7a5c00' }}>{t('modals.disable.impactTitle')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[
                  { label: t('modals.disable.impactProducts'), value: impactData.products },
                  { label: t('modals.disable.impactChannels'), value: impactData.channels },
                  { label: t('modals.disable.impactPolicies'), value: impactData.activePolicies.toLocaleString() },
                  { label: t('modals.disable.impactQuotes'), value: impactData.pendingQuotes },
                  { label: t('modals.disable.impactCommission'), value: `$${(impactData.pendingCommission / 1000).toFixed(0)}K` },
                ].map(k => (
                  <div key={k.label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 10px' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 11, color: '#717786', marginTop: 2 }}>{k.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#7a5c00', marginTop: 12 }}>
                {t('modals.disable.impactNote')}
              </div>
            </div>
          )}

          {/* Reason */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
              {isDisabling ? t('modals.disable.reasonDisable') : t('modals.disable.reasonEnable')}<span style={{ color: '#BA1A1A' }}> *</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reasonKeys.map(key => (
                <label
                  key={key}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                    background: reason === key ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${reason === key ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                    transition: 'all 120ms',
                  }}
                >
                  <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5, color: '#181C23' }}>{reasonLabel[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 6 }}>
              {t('modals.disable.noteLabel')}
            </label>
            <textarea
              className="input-glass"
              style={{ width: '100%', minHeight: 80, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t('modals.disable.notePlaceholder')}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Effect date */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#414755', display: 'block', marginBottom: 8 }}>
              {t('modals.disable.effectLabel')}<span style={{ color: '#BA1A1A' }}> *</span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'immediate', label: t('modals.disable.effectImmediate') },
                { val: 'scheduled', label: t('modals.disable.effectScheduled') },
              ].map(opt => (
                <label
                  key={opt.val}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                    background: effectDate === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${effectDate === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  }}
                >
                  <input type="radio" name="effectDate" value={opt.val} checked={effectDate === opt.val} onChange={() => setEffectDate(opt.val)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5 }}>{opt.label}</span>
                </label>
              ))}
            </div>
            {effectDate === 'scheduled' && (
              <div style={{ marginTop: 10 }}>
                <input type="date" className="input-glass" style={{ fontSize: 13 }} min={today} value={futureDate} onChange={e => setFutureDate(e.target.value)} />
                {isDisabling && (
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 6 }}>
                    {t('modals.disable.scheduledNote')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              style={{ marginTop: 2, accentColor: '#0058BC', width: 15, height: 15, flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#414755' }}>
              {isDisabling ? t('modals.disable.confirmDisablePre') : t('modals.disable.confirmEnablePre')}
              <strong style={{ color: '#181C23' }}> {insurer.carrier_name}</strong>
              {t('modals.disable.confirmPost')}
            </span>
          </label>
        </div>

        {/* Messages */}
        {successMsg && (
          <div style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(52,199,89,0.10)', border: '0.5px solid rgba(52,199,89,0.3)', borderRadius: 10, marginTop: 14, fontSize: 13, color: '#1a7a2e' }}>
              <CheckCircle size={14} />
              <span>{successMsg}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#1a7a2e' }} onClick={() => setSuccessMsg('')}><X size={13} /></button>
            </div>
          </div>
        )}
        {errorMsg && (
          <div style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(186,26,26,0.08)', border: '0.5px solid rgba(186,26,26,0.25)', borderRadius: 10, marginTop: 14, fontSize: 13, color: '#BA1A1A' }}>
              <AlertTriangle size={14} />
              <span>{errorMsg}</span>
              <button style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#BA1A1A' }} onClick={() => setErrorMsg('')}><X size={13} /></button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '16px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onClose}>{t('common:common.cancel')}</button>
          <button
            onClick={() => {
              setErrorMsg('');
              setSuccessMsg('');
              toggleStatus.mutate(insurer.carrier_id || insurer.id!, {
                onSuccess: () => {
                  setSuccessMsg(isDisabling ? t('modals.disable.disabledMsg') : t('modals.disable.enabledMsg'));
                  setTimeout(() => onClose(), 800);
                },
                onError: (err: any) => {
                  setErrorMsg(err?.response?.data?.message || t('modals.disable.errorMsg'));
                },
              });
            }}
            disabled={!canConfirm || toggleStatus.isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '9px 22px',
              background: !canConfirm || toggleStatus.isPending ? 'rgba(193,198,215,0.5)' : isDisabling ? '#BA1A1A' : '#0058BC',
              color: !canConfirm || toggleStatus.isPending ? '#717786' : '#fff',
              borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canConfirm && !toggleStatus.isPending ? 'pointer' : 'not-allowed',
              border: 'none', transition: 'all 140ms',
            }}
          >
            {toggleStatus.isPending
              ? <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : isDisabling ? <StopCircle size={14} /> : <PlayCircle size={14} />}
            {toggleStatus.isPending ? (isDisabling ? t('modals.disable.stopping') : t('modals.disable.enabling')) : isDisabling ? t('modals.disable.btnDisable') : t('modals.disable.btnEnable')}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
