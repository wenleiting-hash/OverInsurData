import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react'
import { useGetInsurers } from '@/services/insurerService'
import { useCreateCooperation } from '@/services/cooperationService'
import type { Notify } from '../constants'

// V1.0.10 ch.10: prototype 2026-09-11 — 9 business lines, 12 launch states.
const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']
const STATES_LAUNCH = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'WA', 'CO', 'GA', 'AZ', 'NC']

interface Props {
  /** Carriers that already have a non-Terminated partnership — shown but disabled. */
  excludeCarrierIds: string[]
  notify: Notify
  onClose: () => void
}

/** 3-step new-cooperation wizard (prototype 2026-09-11: select carrier → scope → confirm). */
export default function EstablishWizard({ excludeCarrierIds, notify, onClose }: Props) {
  const { t } = useTranslation('cooperation')
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [coopType, setCoopType] = useState<'Full-Service' | 'Specialty' | 'Preferred' | 'Surplus Lines'>('Full-Service')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [commTier, setCommTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3'>('Tier-2')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  const { data: insurersPage, isLoading } = useGetInsurers({ status: 'active', size: 200 })
  const insurers: any[] = insurersPage?.data ?? []
  const createCoop = useCreateCooperation()

  const insurerId = (ins: any) => ins.carrier_id ?? ins.id
  const insurerName = (ins: any) => ins.carrier_name ?? ins.carrier_name_short ?? ins.short_name
  const availableInsurers = insurers.filter(ins => ins.status === 'active' || ins.status === 'Active' || ins.status === 'Approved')
  const selectable = availableInsurers.filter(ins => !excludeCarrierIds.includes(insurerId(ins)))
  const selectedIns = availableInsurers.find(ins => insurerId(ins) === selectedInsurer)
  const selectedName = selectedIns ? insurerName(selectedIns) : ''

  // lobTypes are persisted as the uppercase codes already used by seed data (CYBER, D_O …).
  const lobCode = (l: string) => (l === 'D&O' ? 'D_O' : l.replace(/[^A-Za-z]/g, '').toUpperCase())

  const submit = async () => {
    try {
      await createCoop.mutateAsync({
        carrier_id: selectedInsurer,
        cooperation_type: coopType,
        commission_tier: commTier,
        notes,
        state_scope: selectedStates,
        product_scope: { lobTypes: selectedLines.map(lobCode) },
        status: 'Negotiating',
      })
      setDone(true)
      notify('success', t('view.toast.coopCreated'))
    } catch {
      notify('error', t('view.toast.coopCreateFailed'))
    }
  }

  if (done) return (
    <div style={{ padding: '48px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('view.wizard.done.title')}</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t('view.wizard.done.desc')}</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onClose}>{t('view.wizard.done.back')}</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {[t('view.wizard.stepNames.select'), t('view.wizard.stepNames.scope'), t('view.wizard.stepNames.confirm')].map((s, i) => (
          <div key={s} className="flex items-center">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                background: i < step ? '#34C759' : i === step ? '#0058BC' : 'rgba(193,198,215,0.3)',
                color: i <= step ? '#fff' : '#717786',
              }}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: i === step ? 600 : 400, color: i === step ? '#0058BC' : '#717786' }}>{s}</span>
            </div>
            {i < 2 && <div style={{ width: 56, height: 1, background: i < step ? '#34C759' : 'rgba(193,198,215,0.4)', margin: '0 10px' }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('view.wizard.step0.title')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isLoading
              ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.common.loading')}</div>
              : selectable.length === 0
                ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.wizard.step0.empty')}</div>
                : selectable.map(ins => {
                  const id = insurerId(ins)
                  const meta = [ins.naic_code, ins.carrier_type, ins.am_best_rating ? `AM Best ${ins.am_best_rating}` : null]
                    .filter(Boolean).join(' · ') || '—'
                  return (
                    <label key={id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                      background: selectedInsurer === id ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                      border: `0.5px solid ${selectedInsurer === id ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                    }}>
                      <input type="radio" name="insurer" checked={selectedInsurer === id} onChange={() => setSelectedInsurer(id)} style={{ accentColor: '#0058BC' }} />
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                        {(ins.carrier_name_short ?? insurerName(ins)).slice(0, 3)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{insurerName(ins)}</div>
                        <div style={{ fontSize: 12, color: '#717786', fontFamily: "'JetBrains Mono', monospace" }}>{meta}</div>
                      </div>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>{t('view.wizard.step0.status.verified')}</span>
                    </label>
                  )
                })}
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('view.wizard.step1.title')}</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.wizard.step1.coopType')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { v: 'Full-Service', label: 'view.wizard.step1.coopTypes.fullService', desc: 'view.wizard.step1.coopTypes.fullServiceDesc' },
                { v: 'Preferred', label: 'view.wizard.step1.coopTypes.preferred', desc: 'view.wizard.step1.coopTypes.preferredDesc' },
                { v: 'Specialty', label: 'view.wizard.step1.coopTypes.specialty', desc: 'view.wizard.step1.coopTypes.specialtyDesc' },
                { v: 'Surplus Lines', label: 'view.wizard.step1.coopTypes.surplusLines', desc: 'view.wizard.step1.coopTypes.surplusLinesDesc' },
              ].map(opt => (
                <label key={opt.v} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: coopType === opt.v ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.5)',
                  border: `0.5px solid ${coopType === opt.v ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="coopType" checked={coopType === opt.v} onChange={() => setCoopType(opt.v as any)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: coopType === opt.v ? '#0058BC' : '#181C23' }}>{t(opt.label)}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{t(opt.desc)}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.wizard.step1.linesOfBusiness')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {LINES.map(l => (
                <label key={l} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: selectedLines.includes(l) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                  border: `0.5px solid ${selectedLines.includes(l) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  color: selectedLines.includes(l) ? '#0058BC' : '#414755',
                }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedLines.includes(l)}
                    onChange={() => setSelectedLines(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l])} />
                  {selectedLines.includes(l) && <CheckCircle size={11} />}
                  {l}
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.wizard.step1.states')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATES_LAUNCH.map(s => (
                <label key={s} style={{
                  padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  background: selectedStates.includes(s) ? 'rgba(0,88,188,0.10)' : 'rgba(241,243,254,0.7)',
                  border: `0.5px solid ${selectedStates.includes(s) ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  color: selectedStates.includes(s) ? '#0058BC' : '#414755',
                  fontWeight: selectedStates.includes(s) ? 700 : 400,
                }}>
                  <input type="checkbox" style={{ display: 'none' }} checked={selectedStates.includes(s)}
                    onChange={() => setSelectedStates(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.wizard.step2.commissionTier')}</div>
            <div className="flex gap-3">
              {([['Tier-1', 'view.wizard.step2.tiers.tier1Desc'], ['Tier-2', 'view.wizard.step2.tiers.tier2Desc'], ['Tier-3', 'view.wizard.step2.tiers.tier3Desc']] as const).map(([tier, d]) => (
                <label key={tier} style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  background: commTier === tier ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${commTier === tier ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="commTier" checked={commTier === tier} onChange={() => setCommTier(tier)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: commTier === tier ? '#0058BC' : '#181C23' }}>{tier}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{t(d)}</div>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('view.wizard.step2.summaryTitle')}</div>
          <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', fontSize: 13 }}>
              {[
                ['view.wizard.step2.summary.insurer', selectedName || '—'],
                ['view.wizard.step2.summary.coopType', coopType],
                ['view.wizard.step2.summary.lines', selectedLines.join(', ') || t('view.wizard.step2.summary.none')],
                ['view.wizard.step2.summary.states', selectedStates.join(', ') || t('view.wizard.step2.summary.none')],
                ['view.wizard.step2.summary.commission', commTier],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span style={{ color: '#717786', minWidth: 60 }}>{t(k)}</span>
                  <span style={{ color: '#181C23', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.wizard.step2.notes')}</div>
            <textarea className="input-glass w-full" style={{ minHeight: 96, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t('view.wizard.step2.notesPlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
          {step === 0 ? t('view.common.cancel') : t('view.wizard.prev')}
        </button>
        {step < 2
          ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedInsurer}>
              {t('view.wizard.next')}
            </button>
          : <button className="btn-primary" style={{ fontSize: 13 }} disabled={createCoop.isPending} onClick={submit}>
              <CheckCircle size={14} />{t('view.wizard.saveRecord')}
            </button>
        }
      </div>
    </div>
  )
}
