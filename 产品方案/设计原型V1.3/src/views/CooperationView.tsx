import { useState } from 'react'
import {
  Plus, Edit2, FileText, Settings, Users, RefreshCw, Package,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight,
  Download, Upload, Send, Eye, Phone, Mail, MessageSquare,
  Link2, Zap, Shield, Calendar, TrendingUp, MoreHorizontal,
  GitMerge, ArrowUpRight, X, Building2,
} from 'lucide-react'
import { useLang } from '../i18n'
import { insurers } from '../data/mockData'
import {
  cooperations, contracts, settlementConfigs, coopContacts,
  renewalItems, productIntegrations,
} from '../data/cooperationData'
import type {
  CooperationRelationship, CoopContract, SettlementConfig, CoopContact,
  RenewalItem, ProductIntegration, ContractTag, CoopAppStatus,
  ContractStatus, IntegrationStatus,
} from '../data/cooperationData'
import type { ViewId } from '../components/Sidebar'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TABS = [
  { id: 'establish', icon: GitMerge },
  { id: 'terminate', icon: XCircle },
  { id: 'contracts', icon: FileText },
  { id: 'settlement', icon: Settings },
  { id: 'contacts', icon: Users },
  { id: 'renewal', icon: RefreshCw },
  { id: 'integration', icon: Package },
] as const

type TabId = typeof TABS[number]['id']

// Style-only lookup tables; localized labels are built inside components via i18n.
const COOP_STATUS_STYLE: Record<CoopAppStatus, { cls: string; orb: string }> = {
  draft: { cls: 'badge-gray', orb: 'orb-gray' },
  submitted: { cls: 'badge-blue', orb: 'orb-purple' },
  'under-review': { cls: 'badge-yellow', orb: 'orb-yellow' },
  approved: { cls: 'badge-green', orb: 'orb-green' },
  rejected: { cls: 'badge-red', orb: 'orb-red' },
  terminated: { cls: 'badge-gray', orb: 'orb-gray' },
}

const CONTRACT_STATUS_STYLE: Record<ContractStatus, { cls: string }> = {
  draft: { cls: 'badge-gray' },
  negotiating: { cls: 'badge-purple' },
  'pending-sign': { cls: 'badge-yellow' },
  active: { cls: 'badge-green' },
  expiring: { cls: 'badge-orange' },
  expired: { cls: 'badge-red' },
  terminated: { cls: 'badge-gray' },
}

const INTEGRATION_STATUS_STYLE: Record<IntegrationStatus, { cls: string; step: number }> = {
  available: { cls: 'badge-gray', step: 0 },
  requested: { cls: 'badge-blue', step: 1 },
  'in-review': { cls: 'badge-yellow', step: 2 },
  approved: { cls: 'badge-purple', step: 3 },
  integrated: { cls: 'badge-green', step: 4 },
  rejected: { cls: 'badge-red', step: -1 },
  suspended: { cls: 'badge-gray', step: -1 },
}

const RENEWAL_PRIORITY_COLOR: Record<RenewalItem['priority'], string> = {
  critical: '#BA1A1A',
  high: '#a05800',
  normal: '#0058BC',
  low: '#717786',
}

const RENEWAL_STATUS_STYLE: Record<RenewalItem['status'], { cls: string }> = {
  upcoming: { cls: 'badge-blue' },
  'in-negotiation': { cls: 'badge-yellow' },
  renewed: { cls: 'badge-green' },
  'at-risk': { cls: 'badge-red' },
  lapsed: { cls: 'badge-gray' },
}

const ROLE_ICON: Record<string, any> = {
  Underwriting: Shield, Claims: AlertTriangle, Billing: TrendingUp,
  'IT/API': Zap, Legal: FileText, Marketing: ArrowUpRight, 'Senior Management': Building2,
}
const ROLE_COLOR: Record<string, string> = {
  Underwriting: '#0058BC', Claims: '#FF9500', Billing: '#34C759',
  'IT/API': '#AF52DE', Legal: '#717786', Marketing: '#FF3B30', 'Senior Management': '#181C23',
}

// ─── Mini Wizard — Establish Cooperation ──────────────────────────────────────

function EstablishWizard({ onCancel }: { onCancel: () => void }) {
  const { t } = useLang()
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [coopType, setCoopType] = useState<'Full-Service' | 'Specialty' | 'Preferred' | 'Surplus Lines'>('Full-Service')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [commTier, setCommTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3'>('Tier-2')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  const availableInsurers = insurers.filter(i => !cooperations.some(c => c.insurerId === i.id && c.status === 'approved'))
  const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']
  const STATES_SAMPLE = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'WA', 'CO', 'GA']
  const STEP_NAMES = [t.coopStepSelect, t.coopStepScope, t.coopStepTerms, t.coopStepSubmit]

  if (done) return (
    <div style={{ padding: '48px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.coopWizardDoneTitle}</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t.coopWizardDoneDesc}</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t.coopBackToList}</button>
    </div>
  )

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {STEP_NAMES.map((s, i) => (
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
            {i < 3 && <div style={{ width: 40, height: 1, background: i < step ? '#34C759' : 'rgba(193,198,215,0.4)', margin: '0 8px' }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.coopStepSelect}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableInsurers.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t.coopAllCertified}</div>
              : availableInsurers.map(ins => (
                <label key={ins.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  background: selectedInsurer === ins.id ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${selectedInsurer === ins.id ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  transition: 'all 100ms',
                }}>
                  <input type="radio" name="insurer" checked={selectedInsurer === ins.id} onChange={() => setSelectedInsurer(ins.id)} style={{ accentColor: '#0058BC' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                    {ins.shortName.slice(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{ins.name}</div>
                    <div style={{ fontSize: 12, color: '#717786' }}>NAIC {ins.naicCode} · {ins.type} · AM Best {ins.amBestRating}</div>
                  </div>
                  <span className={`badge ${ins.status === 'active' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 11 }}>{ins.status === 'active' ? t.coopCertified : t.coopPendingReview}</span>
                </label>
              ))
            }
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.coopScopeConfig}</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopCoopType}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { v: 'Full-Service', label: t.coopTypeFsFull, desc: t.coopTypeFsDesc },
                { v: 'Preferred', label: t.coopTypePreferred, desc: t.coopTypePreferredDesc },
                { v: 'Specialty', label: t.coopTypeSpecialty, desc: t.coopTypeSpecialtyDesc },
                { v: 'Surplus Lines', label: 'Surplus Lines', desc: t.coopTypeSurplusDesc },
              ].map(opt => (
                <label key={opt.v} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: coopType === opt.v ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.5)',
                  border: `0.5px solid ${coopType === opt.v ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="coopType" checked={coopType === opt.v as any} onChange={() => setCoopType(opt.v as any)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: coopType === opt.v ? '#0058BC' : '#181C23' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{opt.desc}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopLinesScope}</div>
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
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopStatesScope}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATES_SAMPLE.map(s => (
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
              <span style={{ fontSize: 12.5, color: '#717786', alignSelf: 'center' }}>{t.coopStatesMore}</span>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t.coopTermsNotes}</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopCommTier}</div>
            <div className="flex gap-3">
              {([['Tier-1', t.coopTier1Desc], ['Tier-2', t.coopTier2Desc], ['Tier-3', t.coopTier3Desc]] as const).map(([tier, d]) => (
                <label key={tier} style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  background: commTier === tier ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${commTier === tier ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="commTier" checked={commTier === tier} onChange={() => setCommTier(tier)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: commTier === tier ? '#0058BC' : '#181C23' }}>{tier}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{d}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t.coopNotesLabel}</div>
            <textarea className="input-glass w-full" style={{ minHeight: 88, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t.coopNotesPlaceholder} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0058BC', marginBottom: 8 }}>{t.coopSummary}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12.5 }}>
              {[
                [t.coopSumInsurer, insurers.find(i => i.id === selectedInsurer)?.name ?? '—'],
                [t.coopCoopType, coopType],
                [t.coopSumLines, selectedLines.join(', ') || t.coopNotSelected],
                [t.coopStatesScope, selectedStates.join(', ') || t.coopNotSelected],
                [t.coopCommTier, commTier],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-2">
                  <span style={{ color: '#717786', minWidth: 60 }}>{k}</span>
                  <span style={{ color: '#181C23', fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Send size={28} style={{ color: '#0058BC' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.coopConfirmSubmit}</div>
          <p style={{ fontSize: 13.5, color: '#717786', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
            {t.coopSubmitDesc}
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: '#0058BC' }} />
            <span style={{ fontSize: 13, color: '#414755' }}>{t.coopConfirmCheck}</span>
          </label>
        </div>
      )}

      {/* Wizard nav */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}>
          {step === 0 ? t.coopCancel : t.coopPrev}
        </button>
        {step < 3
          ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedInsurer}>
              {t.coopNext}
            </button>
          : <button className="btn-primary" style={{ fontSize: 13, background: '#1a7a2e' }} onClick={() => setDone(true)}>
              <Send size={14} />{t.coopSubmitApp}
            </button>
        }
      </div>
    </div>
  )
}

// ─── Settlement Edit Panel ─────────────────────────────────────────────────────

function SettlementEditPanel({ config, onClose }: { config: SettlementConfig; onClose: () => void }) {
  const { t } = useLang()
  const [cycle, setCycle] = useState(config.cycle)
  const [cutoff, setCutoff] = useState(String(config.billCutoffDay))
  const [terms, setTerms] = useState(String(config.paymentTermDays))
  const [method, setMethod] = useState(config.paymentMethod)
  const [format, setFormat] = useState(config.billingFormat)
  const [apiEnabled, setApiEnabled] = useState(config.apiEnabled)
  const [premCollect, setPremCollect] = useState(config.premiumCollection)
  const [saved, setSaved] = useState(false)

  if (saved) return (
    <div style={{ padding: '40px 0', textAlign: 'center' }}>
      <CheckCircle size={36} style={{ color: '#34C759', margin: '0 auto 12px' }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t.coopSeSaved}</div>
      <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>{t.coopSeClose}</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        {[
          { label: t.coopSeCycle, field: <select className="input-glass w-full" value={cycle} onChange={e => setCycle(e.target.value as any)} style={{ fontSize: 13 }}><option value="Monthly">{t.coopCycleMonthly}</option><option value="Quarterly">{t.coopCycleQuarterly}</option><option value="Semi-Annual">{t.coopCycleSemiAnnual}</option></select> },
          { label: t.coopSeCutoff, field: <input className="input-glass w-full" value={cutoff} onChange={e => setCutoff(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="25" /> },
          { label: t.coopSeTerms, field: <input className="input-glass w-full" value={terms} onChange={e => setTerms(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="30" /> },
          { label: t.coopSeMethod, field: <select className="input-glass w-full" value={method} onChange={e => setMethod(e.target.value as any)} style={{ fontSize: 13 }}><option>ACH</option><option>Wire</option><option>Check</option><option>EFT</option></select> },
          { label: t.coopSeFormat, field: <select className="input-glass w-full" value={format} onChange={e => setFormat(e.target.value as any)} style={{ fontSize: 13 }}><option>EDI</option><option>API</option><option>CSV</option><option>Excel</option></select> },
          { label: t.coopSePremCollect, field: <select className="input-glass w-full" value={premCollect} onChange={e => setPremCollect(e.target.value as any)} style={{ fontSize: 13 }}><option value="Agency Bill">Agency Bill</option><option value="Direct Bill">Direct Bill</option></select> },
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
            <div style={{ fontSize: 13.5, fontWeight: 500, color: '#181C23' }}>{t.coopApiRecon}</div>
            <div style={{ fontSize: 12, color: '#717786' }}>{t.coopApiReconDesc}</div>
          </div>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t.coopCancel}</button>
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setSaved(true)}>{t.coopSeSave}</button>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function CooperationView({ navigateTo }: Props) {
  const { lang, t } = useLang()
  const [tab, setTab] = useState<TabId>('establish')
  const [showNewCoopWizard, setShowNewCoopWizard] = useState(false)
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [editSettlementId, setEditSettlementId] = useState<string | null>(null)
  const [editContactId, setEditContactId] = useState<string | null>(null)
  const [showAddContact, setShowAddContact] = useState(false)
  const [filterInsurer, setFilterInsurer] = useState('all')
  const [integrationFilter, setIntegrationFilter] = useState('all')

  const activeCoops = cooperations.filter(c => c.status === 'approved')
  const pendingCoops = cooperations.filter(c => ['submitted', 'under-review'].includes(c.status))

  const editSettlement = editSettlementId ? settlementConfigs.find(s => s.id === editSettlementId) : null
  const terminateCooperation = terminateId ? cooperations.find(c => c.id === terminateId) : null

  const filteredContacts = filterInsurer === 'all' ? coopContacts : coopContacts.filter(c => c.insurerId === filterInsurer)
  const filteredIntegrations = integrationFilter === 'all' ? productIntegrations : productIntegrations.filter(p => p.status === integrationFilter)

  const urgentRenewals = renewalItems.filter(r => r.daysLeft <= 60 && r.status !== 'renewed')

  const tabLabel: Record<TabId, string> = {
    establish: t.coopTabEstablish,
    terminate: t.coopTabTerminate,
    contracts: t.coopTabContracts,
    settlement: t.coopTabSettlement,
    contacts: t.coopTabContacts,
    renewal: t.coopTabRenewal,
    integration: t.coopTabIntegration,
  }

  const coopStatusLabel: Record<CoopAppStatus, string> = {
    draft: t.coopStDraft,
    submitted: t.coopStSubmitted,
    'under-review': t.coopStReview,
    approved: t.coopStApproved,
    rejected: t.coopStRejected,
    terminated: t.coopStTerminated,
  }

  const contractStatusLabel: Record<ContractStatus, string> = {
    draft: t.coopCtDraft,
    negotiating: t.coopCtNegotiating,
    'pending-sign': t.coopCtPendingSign,
    active: t.coopCtActive,
    expiring: t.coopCtExpiring,
    expired: t.coopCtExpired,
    terminated: t.coopCtTerminated,
  }

  const contractTagLabel: Record<ContractTag, string> = {
    master: t.coopTagMaster,
    'P&C': 'P&C',
    '3yr': t.coopTag3yr,
    commission: t.coopTagCommission,
    annual: t.coopTagAnnual,
    expiring: t.coopTagExpiring,
    'high-net-worth': t.coopTagHnw,
    '5yr': t.coopTag5yr,
    commercial: t.coopTagCommercial,
    'renewal-negotiating': t.coopTagRenewing,
    NDA: 'NDA',
    'pending-sign': t.coopCtPendingSign,
    'data-sharing': t.coopTagDataSharing,
    CCPA: 'CCPA',
    GDPR: 'GDPR',
  }

  const integrationStatusLabel: Record<IntegrationStatus, string> = {
    available: t.coopIntAvailable,
    requested: t.coopIntRequested,
    'in-review': t.coopIntReview,
    approved: t.coopIntApproved,
    integrated: t.coopIntIntegrated,
    rejected: t.coopIntRejected,
    suspended: t.coopIntSuspended,
  }

  const settlementStatusBadge: Record<SettlementConfig['status'], { cls: string; label: string }> = {
    active: { cls: 'badge-green', label: t.coopSeNormal },
    'pending-review': { cls: 'badge-yellow', label: t.coopPendingReview },
    suspended: { cls: 'badge-red', label: t.coopIntSuspended },
  }

  const cycleLabel: Record<SettlementConfig['cycle'], string> = {
    Monthly: t.coopCycleMonthly,
    Quarterly: t.coopCycleQuarterly,
    'Semi-Annual': t.coopCycleSemiAnnual,
  }

  const renewalPriorityLabel: Record<RenewalItem['priority'], string> = {
    critical: t.coopPrCritical,
    high: t.coopPrHigh,
    normal: t.coopPrNormal,
    low: t.coopPrLow,
  }

  const renewalStatusLabel: Record<RenewalItem['status'], string> = {
    upcoming: t.coopRnUpcoming,
    'in-negotiation': t.coopRnNegotiating,
    renewed: t.coopRnRenewed,
    'at-risk': t.coopRnAtRisk,
    lapsed: t.coopRnLapsed,
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t.coopTitle}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t.coopHeaderSub(activeCoops.length, pendingCoops.length, urgentRenewals.length)}
          </p>
        </div>
        <div className="flex gap-2">
          {urgentRenewals.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, background: 'rgba(186,26,26,0.08)', border: '0.5px solid rgba(186,26,26,0.2)', fontSize: 12.5, color: '#BA1A1A', fontWeight: 500 }}>
              <AlertTriangle size={13} />{t.coopUrgentBadge(urgentRenewals.length)}
            </div>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setTab('establish'); setShowNewCoopWizard(true) }}>
            <Plus size={14} />{t.coopNewApp}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map(tb => (
          <button key={tb.id} className={`tab-item${tab === tb.id ? ' active' : ''}`} onClick={() => { setTab(tb.id); setShowNewCoopWizard(false) }}>
            <tb.icon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
            {tabLabel[tb.id]}
            {tb.id === 'renewal' && urgentRenewals.length > 0 && (
              <span className="badge badge-red" style={{ fontSize: 10, marginLeft: 5 }}>{urgentRenewals.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: establish ── */}
      {tab === 'establish' && (
        <div>
          {showNewCoopWizard ? (
            <div className="card" style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 22 }}>{t.coopNewAppTitle}</div>
              <EstablishWizard onCancel={() => setShowNewCoopWizard(false)} />
            </div>
          ) : (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: t.coopStApproved, count: activeCoops.length, color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
                  { label: t.coopStReview, count: pendingCoops.length, color: '#FFCC00', bg: 'rgba(255,204,0,0.08)' },
                  { label: t.coopStTerminated, count: cooperations.filter(c => c.status === 'terminated').length, color: '#717786', bg: 'rgba(193,198,215,0.15)' },
                  { label: t.coopStatLines, count: [...new Set(cooperations.flatMap(c => c.scope))].length, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '16px 20px', background: s.bg, borderColor: s.color + '22' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
                    <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Coop cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {cooperations.map(coop => {
                  const sc = COOP_STATUS_STYLE[coop.status]
                  const isActive = coop.status === 'approved'
                  return (
                    <div key={coop.id} className="card" style={{ padding: '20px 22px' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.22))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                            {coop.insurerShort.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{coop.insurerShort}</div>
                            <div style={{ fontSize: 11.5, color: '#717786' }}>{coop.type}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`orb ${sc.orb}`} />
                          <span className={`badge ${sc.cls}`}>{coopStatusLabel[coop.status]}</span>
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                          {[
                            { label: t.coopTermLabel, value: `${coop.startDate.slice(0, 7)} ～ ${coop.endDate.slice(0, 7)}` },
                            { label: t.coopCommTier, value: coop.commissionTier },
                            { label: t.coopOwnerLabel, value: coop.accountManager },
                          ].map(k => (
                            <div key={k.label} style={{ background: 'rgba(241,243,254,0.7)', borderRadius: 9, padding: '7px 10px' }}>
                              <div style={{ fontSize: 10.5, color: '#717786', marginBottom: 2 }}>{k.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#181C23' }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: coop.notes ? 10 : 0 }}>
                        {coop.scope.slice(0, 4).map(s => (
                          <span key={s} className="badge badge-blue" style={{ fontSize: 10.5, background: 'rgba(0,88,188,0.07)', color: '#0058BC', borderColor: 'rgba(0,88,188,0.15)' }}>{s}</span>
                        ))}
                        {coop.scope.length > 4 && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{coop.scope.length - 4}</span>}
                      </div>
                      {coop.notes && (
                        <div style={{ fontSize: 12, color: '#a05800', background: 'rgba(255,149,0,0.06)', borderRadius: 8, padding: '6px 10px', marginTop: 10 }}>
                          {lang === 'en' ? coop.notesEn ?? coop.notes : coop.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: terminate ── */}
      {tab === 'terminate' && (
        <div>
          {terminateCooperation ? (
            <TerminatePanel coop={terminateCooperation} onCancel={() => setTerminateId(null)} />
          ) : (
            <div>
              <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: 'rgba(186,26,26,0.05)', borderColor: 'rgba(186,26,26,0.2)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} style={{ color: '#BA1A1A' }} />
                  <span style={{ fontSize: 13.5, color: '#BA1A1A', fontWeight: 600 }}>{t.coopTermWarning}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activeCoops.map(coop => {
                  const ins = insurers.find(i => i.id === coop.insurerId)
                  const daysLeft = Math.ceil((new Date(coop.endDate).getTime() - Date.now()) / 86400000)
                  return (
                    <div key={coop.id} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,88,188,0.10), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                        {coop.insurerShort.slice(0, 3)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 3 }}>{ins?.name}</div>
                        <div style={{ fontSize: 12.5, color: '#717786' }}>
                          {t.coopTermRowSub(coop.type, coop.endDate)}
                          <span style={{ color: daysLeft < 180 ? '#a05800' : '#717786', marginLeft: 4 }}>{t.coopDaysLeft(daysLeft)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                          {coop.scope.map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 10.5 }}>{s}</span>)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>
                          {t.coopProductsMgr(insurers.find(i => i.id === coop.insurerId)?.productCount ?? 0, coop.accountManager)}
                        </div>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12.5, color: '#BA1A1A', border: '0.5px solid rgba(186,26,26,0.3)', borderRadius: 8, padding: '6px 14px' }}
                          onClick={() => setTerminateId(coop.id)}
                        >
                          <XCircle size={13} />{t.coopStartTerminate}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {cooperations.filter(c => c.status === 'terminated').length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: '#414755', marginBottom: 12 }}>{t.coopTerminatedSection}</div>
                  {cooperations.filter(c => c.status === 'terminated').map(coop => (
                    <div key={coop.id} className="card" style={{ padding: '14px 18px', marginBottom: 8, opacity: 0.65 }}>
                      <div className="flex items-center justify-between">
                        <div style={{ fontSize: 13.5, color: '#414755' }}>{coop.insurerShort} — {coop.type}</div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 12, color: '#717786' }}>{t.coopTerminatedAt(coop.endDate)}</span>
                          {coop.notes && <span style={{ fontSize: 12, color: '#717786' }}>· {lang === 'en' ? coop.notesEn ?? coop.notes : coop.notes}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: contracts ── */}
      {tab === 'contracts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontSize: 14, color: '#717786' }}>
              {t.coopCtSummary(contracts.length, contracts.filter(c => c.status === 'active').length, contracts.filter(c => c.status === 'expiring').length)}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ fontSize: 13 }}><Upload size={14} />{t.coopUploadContract}</button>
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t.coopNewContract}</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.coopThName}</th>
                  <th>{t.coopInsurer}</th>
                  <th>{t.coopThType}</th>
                  <th>{t.coopThVersion}</th>
                  <th>{t.coopThValidity}</th>
                  <th>{t.coopThSignUs}</th>
                  <th>{t.coopThSignThem}</th>
                  <th>{t.coopThStatus}</th>
                  <th style={{ width: 100 }}>{t.coopThAction}</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(ct => {
                  const st = CONTRACT_STATUS_STYLE[ct.status]
                  const daysLeft = ct.expiryDate ? Math.ceil((new Date(ct.expiryDate).getTime() - Date.now()) / 86400000) : null
                  return (
                    <tr key={ct.id}>
                      <td>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{ct.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                          {ct.tags.map(tg => <span key={tg} className="badge badge-gray" style={{ fontSize: 10 }}>{contractTagLabel[tg]}</span>)}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#414755' }}>{ct.insurerShort}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{ct.type}</span></td>
                      <td><span className="font-data" style={{ fontSize: 12, color: '#414755' }}>{ct.version}</span></td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>
                        <div>{ct.effectiveDate} ～</div>
                        <div style={{ color: daysLeft !== null && daysLeft < 90 ? '#a05800' : undefined }}>{ct.expiryDate || '—'}
                          {daysLeft !== null && daysLeft < 90 && daysLeft > 0 && <span style={{ fontSize: 10.5, color: '#BA1A1A', marginLeft: 4 }}>{t.coopContractDays(daysLeft)}</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryUs}</td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryThem}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{contractStatusLabel[ct.status]}</span>
                        {ct.autoRenew && <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>{t.coopAutoRenew}</span>}
                      </td>
                      <td>
                        <div className="flex gap-0.5">
                          <button className="btn-ghost" style={{ padding: 5 }} title={t.coopView}><Eye size={13} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title={t.coopDownload}><Download size={13} /></button>
                          {ct.status === 'expiring' && <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} title={t.coopRenewAction}><RefreshCw size={13} /></button>}
                          {ct.status === 'pending-sign' && <button className="btn-ghost" style={{ padding: 5, color: '#34C759' }} title={t.coopSign}><Edit2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: settlement ── */}
      {tab === 'settlement' && (
        <div>
          {editSettlement ? (
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="flex items-center justify-between mb-20" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t.coopSeEditTitle(editSettlement.insurerShort)}</div>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setEditSettlementId(null)}><X size={16} /></button>
              </div>
              <SettlementEditPanel config={editSettlement} onClose={() => setEditSettlementId(null)} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {settlementConfigs.map(sc => {
                const badge = settlementStatusBadge[sc.status]
                return (
                <div key={sc.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,88,188,0.10), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                        {sc.insurerShort.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{sc.insurerShort}</div>
                        <div style={{ fontSize: 12, color: '#717786' }}>{t.coopSeUpdated(sc.lastUpdated, sc.updatedBy)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setEditSettlementId(sc.id)}><Edit2 size={13} />{t.coopEdit}</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {[
                      { label: t.coopSeCycle, value: cycleLabel[sc.cycle], mono: true },
                      { label: t.coopSeCutoffShort, value: t.coopSettleCutoffVal(sc.billCutoffDay), mono: true },
                      { label: t.coopSeTermsShort, value: `Net ${sc.paymentTermDays}`, mono: true },
                      { label: t.coopSeMethod, value: sc.paymentMethod, mono: false },
                      { label: t.coopSeFormat, value: sc.billingFormat + (sc.apiEnabled ? ' + API' : ''), mono: false },
                    ].map(k => (
                      <div key={k.label} style={{ padding: '9px 12px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 2 }}>{k.label}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: k.mono ? "'JetBrains Mono', monospace" : undefined }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  {sc.notes && (
                    <div style={{ fontSize: 12.5, color: '#717786', marginTop: 10, padding: '7px 12px', background: 'rgba(241,243,254,0.5)', borderRadius: 8 }}>{lang === 'en' ? sc.notesEn ?? sc.notes : sc.notes}</div>
                  )}
                </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: contacts ── */}
      {tab === 'contacts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)}>
              <option value="all">{t.coopAllInsurers}</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.shortName}</option>)}
            </select>
            <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAddContact(true)}><Plus size={14} />{t.coopAddContact}</button>
          </div>

          {/* Group by insurer */}
          {[...new Set(filteredContacts.map(c => c.insurerId))].map(iid => {
            const ins = insurers.find(i => i.id === iid)
            const contacts = filteredContacts.filter(c => c.insurerId === iid)
            return (
              <div key={iid} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#414755', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0058BC' }}>{ins?.shortName.slice(0, 3)}</div>
                  {ins?.name}
                  <span style={{ fontSize: 12, color: '#717786', fontWeight: 400 }}>{t.coopContactsCount(contacts.length)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {contacts.map((ct: CoopContact) => {
                    const RoleIcon = ROLE_ICON[ct.role] ?? Users
                    const roleColor = ROLE_COLOR[ct.role] ?? '#717786'
                    return (
                      <div key={ct.id} className="card" style={{ padding: '16px 18px' }}>
                        <div className="flex items-start gap-3">
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: roleColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <RoleIcon size={16} style={{ color: roleColor }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{ct.name}</span>
                              {ct.isPrimary && <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{t.coopPrimary}</span>}
                              {ct.isEscalation && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>{t.coopEscalation}</span>}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{ct.title} · {ct.department}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={`mailto:${ct.email}`} className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#0058BC', textDecoration: 'none' }}>
                                <Mail size={12} />{ct.email}
                              </a>
                              <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#414755' }}>
                                <Phone size={12} />{ct.phone}
                                {ct.mobile && <span style={{ color: '#717786' }}>· {ct.mobile}</span>}
                              </div>
                            </div>
                            {ct.notes && <div style={{ fontSize: 12, color: '#a05800', marginTop: 6, padding: '4px 8px', background: 'rgba(255,149,0,0.06)', borderRadius: 6 }}>{lang === 'en' ? ct.notesEn ?? ct.notes : ct.notes}</div>}
                          </div>
                          <div className="flex flex-col gap-1.5 items-end shrink-0">
                            <span className="badge badge-gray" style={{ fontSize: 10.5, background: roleColor + '14', color: roleColor, borderColor: roleColor + '30' }}>{ct.role}</span>
                            <div className="flex gap-1">
                              <button className="btn-ghost" style={{ padding: 5 }}><Mail size={12} /></button>
                              <button className="btn-ghost" style={{ padding: 5 }}><MessageSquare size={12} /></button>
                              <button className="btn-ghost" style={{ padding: 5 }}><Edit2 size={12} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: renewal ── */}
      {tab === 'renewal' && (
        <div>
          {/* Timeline view */}
          <div className="card" style={{ padding: '18px 22px', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>{t.coopRnTimeline}</div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(193,198,215,0.4)', borderRadius: 1 }} />
              {[...renewalItems].sort((a, b) => a.daysLeft - b.daysLeft).map(r => {
                const prColor = RENEWAL_PRIORITY_COLOR[r.priority]
                const st = RENEWAL_STATUS_STYLE[r.status]
                const isOverdue = r.daysLeft < 0
                return (
                  <div key={r.id} className="flex items-start gap-4" style={{ marginBottom: 18, position: 'relative' }}>
                    <div style={{
                      position: 'absolute', left: -17, top: 4,
                      width: 10, height: 10, borderRadius: '50%',
                      background: isOverdue ? '#BA1A1A' : r.daysLeft <= 60 ? '#FF9500' : '#34C759',
                      border: '2px solid white',
                      boxShadow: `0 0 0 2px ${isOverdue ? '#BA1A1A' : r.daysLeft <= 60 ? '#FF9500' : '#34C759'}22`,
                    }} />
                    <div className="card" style={{ flex: 1, padding: '14px 18px', marginLeft: 4 }}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{lang === 'en' ? r.titleEn ?? r.title : r.title}</span>
                            <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{renewalStatusLabel[r.status]}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: prColor, background: prColor + '14', padding: '2px 7px', borderRadius: 6 }}>{renewalPriorityLabel[r.priority]}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: '#717786' }}>
                            {t.coopRnExpiry}<span style={{ fontFamily: "'JetBrains Mono', monospace", color: isOverdue ? '#BA1A1A' : '#414755' }}>{r.expiryDate}</span>
                            <span style={{ marginLeft: 10, color: isOverdue ? '#BA1A1A' : r.daysLeft <= 30 ? '#a05800' : '#717786', fontWeight: 500 }}>
                              {isOverdue ? t.coopRnOverdue(Math.abs(r.daysLeft)) : t.coopDaysLeft(r.daysLeft)}
                            </span>
                          </div>
                          {r.lastAction && (
                            <div style={{ fontSize: 12, color: '#717786', marginTop: 4 }}>
                              {t.coopRnLastAction(lang === 'en' ? r.lastActionEn ?? r.lastAction : r.lastAction, r.lastActionDate ?? '')}
                            </div>
                          )}
                          {r.notes && <div style={{ fontSize: 12, color: '#a05800', marginTop: 4 }}>{lang === 'en' ? r.notesEn ?? r.notes : r.notes}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div style={{ fontSize: 12, color: '#717786' }}>{t.coopRnOwner(r.accountManager)}</div>
                          {r.autoRenew
                            ? <span className="badge badge-green" style={{ fontSize: 10.5 }}>{t.coopRnAuto}</span>
                            : <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}><RefreshCw size={12} />{t.coopRnStart}</button>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: integration ── */}
      {tab === 'integration' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {['all', 'available', 'requested', 'in-review', 'approved', 'integrated', 'rejected'].map(s => (
                <button key={s} className={`btn-ghost${integrationFilter === s ? '' : ''}`}
                  style={{ fontSize: 12, padding: '5px 12px', background: integrationFilter === s ? 'rgba(0,88,188,0.10)' : undefined, color: integrationFilter === s ? '#0058BC' : '#717786', fontWeight: integrationFilter === s ? 600 : 400, borderRadius: 8 }}
                  onClick={() => setIntegrationFilter(s)}>
                  {s === 'all' ? t.coopAll : integrationStatusLabel[s as IntegrationStatus]}
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t.coopRequestIntegration}</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredIntegrations.map(pi => {
              const ist = INTEGRATION_STATUS_STYLE[pi.status]
              const STEPS = [t.coopIntAvailable, t.coopIntRequested, t.coopIntReview, t.coopIntApproved, t.coopIntIntegrated]
              const currentStep = ist.step
              return (
                <div key={pi.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{pi.productName}</span>
                        <span className={`badge ${ist.cls}`}>{integrationStatusLabel[pi.status]}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{pi.productCode}</span>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{pi.line}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#717786' }}>
                        {pi.insurerShort} · {t.coopApplicant(pi.requestedBy || '—')}
                        <span style={{ color: pi.priority === 'high' ? '#BA1A1A' : pi.priority === 'normal' ? '#0058BC' : '#717786', fontWeight: 500 }}>
                          {renewalPriorityLabel[pi.priority]}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {pi.estimatedPremium && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>
                          ${(pi.estimatedPremium / 1000000).toFixed(0)}M <span style={{ fontSize: 12, fontWeight: 400, color: '#717786' }}>{t.coopEstPremium}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                        {pi.targetStates[0] === 'ALL' ? t.coopNationwide : pi.targetStates.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Progress steps */}
                  {pi.status !== 'rejected' && pi.status !== 'suspended' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 14 }}>
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex items-center">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                              background: i < currentStep ? '#34C759' : i === currentStep ? '#0058BC' : 'rgba(193,198,215,0.35)',
                              color: i <= currentStep ? '#fff' : '#717786',
                            }}>
                              {i < currentStep ? <CheckCircle size={12} /> : i + 1}
                            </div>
                            <div style={{ fontSize: 10.5, color: i <= currentStep ? '#181C23' : '#717786', fontWeight: i === currentStep ? 600 : 400 }}>{s}</div>
                          </div>
                          {i < 4 && <div style={{ width: 48, height: 2, background: i < currentStep ? '#34C759' : 'rgba(193,198,215,0.3)', margin: '0 4px', marginBottom: 14 }} />}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {pi.technicalReqs.map(r => (
                        <span key={r} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(175,82,222,0.08)', color: '#AF52DE', border: '0.5px solid rgba(175,82,222,0.2)' }}>{r}</span>
                      ))}
                      {pi.apiDoc && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>{t.coopApiDoc}</span>}
                      {pi.testCompleted && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>{t.coopTestPassed}</span>}
                    </div>
                    <div className="flex gap-2">
                      {pi.notes && <span style={{ fontSize: 12, color: '#a05800', maxWidth: 240, textAlign: 'right' }}>{lang === 'en' ? pi.notesEn ?? pi.notes : pi.notes}</span>}
                      {pi.status === 'available' && <button className="btn-primary" style={{ fontSize: 12.5 }}><Link2 size={13} />{t.coopApplyIntegration}</button>}
                      {pi.status === 'approved' && !pi.testCompleted && <button className="btn-secondary" style={{ fontSize: 12.5 }}><Zap size={13} />{t.coopStartTech}</button>}
                      {pi.status === 'integrated' && <button className="btn-ghost" style={{ fontSize: 12.5 }}><Eye size={13} />{t.coopViewProduct}</button>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Terminate Panel ────────────────────────────────────────────────────────────

function TerminatePanel({ coop, onCancel }: { coop: CooperationRelationship; onCancel: () => void }) {
  const { t } = useLang()
  const ins = insurers.find(i => i.id === coop.insurerId)
  const [reason, setReason] = useState('')
  const [termType, setTermType] = useState<'immediate' | 'end-of-term' | 'scheduled'>('end-of-term')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  const REASONS: { id: string; label: string }[] = [
    { id: 'expired', label: t.coopReasonExpired },
    { id: 'compliance', label: t.coopReasonCompliance },
    { id: 'strategy', label: t.coopReasonStrategy },
    { id: 'mutual', label: t.coopReasonMutual },
    { id: 'counterparty', label: t.coopReasonCounterparty },
    { id: 'performance', label: t.coopReasonPerformance },
    { id: 'other', label: t.coopReasonOther },
  ]
  const canSubmit = reason && (termType !== 'scheduled' || date) && confirmed

  if (done) return (
    <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t.coopTermDoneTitle}</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t.coopTermDoneDesc}</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t.coopBackList}</button>
    </div>
  )

  return (
    <div>
      <div className="card" style={{ padding: '14px 18px', background: 'rgba(186,26,26,0.05)', borderColor: 'rgba(186,26,26,0.2)', marginBottom: 18 }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(186,26,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={18} style={{ color: '#BA1A1A' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t.coopTermWith(ins?.name ?? '')}</div>
            <div style={{ fontSize: 12.5, color: '#717786' }}>{t.coopTermPanelSub(coop.type, coop.endDate)}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 4 }}>
          {[
            { label: t.coopImpactProducts, value: t.coopUnitGe(ins?.productCount ?? 0), desc: t.coopImpactProductsDesc },
            { label: t.coopImpactChannels, value: t.coopUnitGe(ins?.channelCount ?? 0), desc: t.coopImpactChannelsDesc },
            { label: t.coopImpactContracts, value: t.coopUnitFen(contracts.filter(c => c.insurerId === coop.insurerId && c.status === 'active').length), desc: t.coopImpactContractsDesc },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px 14px', background: 'rgba(186,26,26,0.04)', borderRadius: 10, border: '0.5px solid rgba(186,26,26,0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#414755', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{k.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopReasonLabel}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REASONS.map(r => (
              <label key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                background: reason === r.id ? 'rgba(186,26,26,0.07)' : 'rgba(255,255,255,0.6)',
                border: `0.5px solid ${reason === r.id ? 'rgba(186,26,26,0.3)' : 'rgba(193,198,215,0.5)'}`,
              }}>
                <input type="radio" name="term-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} style={{ accentColor: '#BA1A1A' }} />
                <span style={{ fontSize: 13.5, color: '#181C23' }}>{r.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t.coopTermTypeLabel}</div>
          <div className="flex gap-3">
            {[
              { v: 'end-of-term', l: t.coopTermEndOfTerm, d: t.coopTermEndOfTermDesc(coop.endDate) },
              { v: 'immediate', l: t.coopTermImmediate, d: t.coopTermImmediateDesc },
              { v: 'scheduled', l: t.coopTermScheduled, d: t.coopTermScheduledDesc },
            ].map(o => (
              <label key={o.v} style={{
                flex: 1, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                background: termType === o.v ? 'rgba(186,26,26,0.06)' : 'rgba(255,255,255,0.6)',
                border: `0.5px solid ${termType === o.v ? 'rgba(186,26,26,0.25)' : 'rgba(193,198,215,0.4)'}`,
              }}>
                <input type="radio" name="termType" checked={termType === o.v as any} onChange={() => setTermType(o.v as any)} style={{ display: 'none' }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: termType === o.v ? '#BA1A1A' : '#181C23' }}>{o.l}</div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{o.d}</div>
              </label>
            ))}
          </div>
          {termType === 'scheduled' && (
            <input type="date" className="input-glass" style={{ fontSize: 13, marginTop: 10 }} min={new Date().toISOString().split('T')[0]} value={date} onChange={e => setDate(e.target.value)} />
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t.coopNoteLabel}</div>
          <textarea className="input-glass w-full" style={{ minHeight: 72, resize: 'vertical', fontSize: 13.5 }} value={note} onChange={e => setNote(e.target.value)} placeholder={t.coopNotePlaceholder} />
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: '#BA1A1A', width: 15, height: 15, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#414755' }}>
            {t.coopTermConfirmPre}<strong style={{ color: '#181C23' }}> {ins?.name} </strong>{t.coopTermConfirmPost}
          </span>
        </label>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t.coopCancel}</button>
          <button
            disabled={!canSubmit}
            onClick={() => setDone(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
              background: canSubmit ? '#BA1A1A' : 'rgba(193,198,215,0.5)',
              color: canSubmit ? '#fff' : '#717786', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
            }}
          >
            <XCircle size={14} />{t.coopSubmitTermination}
          </button>
        </div>
      </div>
    </div>
  )
}
