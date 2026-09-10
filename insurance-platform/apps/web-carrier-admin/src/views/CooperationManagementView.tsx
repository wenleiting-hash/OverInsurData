import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Edit2, FileText, Settings, Users, RefreshCw, Package,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight,
  Download, Upload, Send, Eye, Phone, Mail, MessageSquare,
  Link2, Zap, Shield, Calendar, TrendingUp, MoreHorizontal,
  GitMerge, ArrowUpRight, X, Building2
} from 'lucide-react'
import type { ViewId } from '@/App'
import Toast from '@/components/SuccessToast'
import {
  mockContracts,
  mockSettlementConfigs,
  mockContactPersons,
} from './data/mockCooperationData'
import type {
  InsuranceCooperation,
  ContractAgreement,
  SettlementConfiguration,
  ContactPerson,
} from './data/mockCooperationData'
import { useGetCooperations, useTerminateCooperation } from '@/services/cooperationService'

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TABS = [
  { id: 'establish', label: 'view.tabs.establish', icon: GitMerge },
  { id: 'terminate', label: 'view.tabs.terminate', icon: XCircle },
  { id: 'contracts', label: 'view.tabs.contracts', icon: FileText },
  { id: 'settlement', label: 'view.tabs.settlement', icon: Settings },
  { id: 'contacts', label: 'view.tabs.contacts', icon: Users },
  { id: 'renewal', label: 'view.tabs.renewal', icon: RefreshCw },
  { id: 'integration', label: 'view.tabs.integration', icon: Package },
]

const COOP_STATUS: Record<string, { label: string; cls: string; orb: string }> = {
  Draft: { label: 'view.coopStatus.draft', cls: 'badge-gray', orb: 'orb-gray' },
  Submitted: { label: 'view.coopStatus.submitted', cls: 'badge-blue', orb: 'orb-purple' },
  UnderReview: { label: 'view.coopStatus.underReview', cls: 'badge-yellow', orb: 'orb-yellow' },
  Approved: { label: 'view.coopStatus.approved', cls: 'badge-green', orb: 'orb-green' },
  Rejected: { label: 'view.coopStatus.rejected', cls: 'badge-red', orb: 'orb-red' },
  Terminated: { label: 'view.coopStatus.terminated', cls: 'badge-gray', orb: 'orb-gray' },
}

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'view.contractStatus.draft', cls: 'badge-gray' },
  negotiating: { label: 'view.contractStatus.negotiating', cls: 'badge-purple' },
  'pending-sign': { label: 'view.contractStatus.pendingSign', cls: 'badge-yellow' },
  active: { label: 'view.contractStatus.active', cls: 'badge-green' },
  expiring: { label: 'view.contractStatus.expiring', cls: 'badge-orange' },
  expired: { label: 'view.contractStatus.expired', cls: 'badge-red' },
  terminated: { label: 'view.contractStatus.terminated', cls: 'badge-gray' },
}

// Mock contract data for Tab 2
const MOCK_CONTRACTS = [
  { id: 'contract001', title: '主合作协议 - State Farm', titleEn: 'Master Agreement - State Farm', insurerShort: 'State Farm', type: 'Master', version: 'v2.1', effectiveDate: '2024-01-01', expiryDate: '2027-12-31', signatoryUs: 'InsureOS Inc.', signatoryThem: 'State Farm Insurance', status: 'active', autoRenew: true, tags: ['核心协议', '自动续'], tagsEn: ['Core Agreement', 'Auto-Renew'] },
  { id: 'contract002', title: '产品补充协议 - Allstate', titleEn: 'Product Supplement - Allstate', insurerShort: 'Allstate', type: 'Supplement', version: 'v1.3', effectiveDate: '2024-03-15', expiryDate: '2026-03-14', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Allstate Insurance', status: 'active', autoRenew: false, tags: ['Auto', 'Home'], tagsEn: ['Auto', 'Home'] },
  { id: 'contract003', title: '保密协议 NDA - Progressive', titleEn: 'NDA - Progressive', insurerShort: 'Progressive', type: 'NDA', version: 'v1.0', effectiveDate: '2024-06-01', expiryDate: '2026-05-31', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Progressive Insurance', status: 'expiring', autoRenew: false, tags: ['保密', '即将到期'], tagsEn: ['Confidential', 'Expiring Soon'] },
  { id: 'contract004', title: '数据处理协议 DPA - Liberty Mutual', titleEn: 'Data Processing Agreement (DPA) - Liberty Mutual', insurerShort: 'Liberty Mutual', type: 'DPA', version: 'v1.2', effectiveDate: '2024-02-20', expiryDate: '2027-02-19', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Liberty Mutual', status: 'active', autoRenew: true, tags: ['数据合规', 'GDPR'], tagsEn: ['Data Compliance', 'GDPR'] },
  { id: 'contract005', title: '佣金补充协议 - USAA', titleEn: 'Commission Supplement - USAA', insurerShort: 'USAA', type: 'Commission', version: 'v1.5', effectiveDate: '2024-04-10', expiryDate: '2026-04-09', signatoryUs: 'InsureOS Inc.', signatoryThem: 'USAA Insurance', status: 'active', autoRenew: false, tags: ['佣金', 'Tier-1'], tagsEn: ['Commission', 'Tier-1'] },
]

// Mock settlement configs for Tab 3
const MOCK_SETTLEMENT_CONFIGS = [
  { id: 'config001', insurerShort: 'State Farm', lastUpdated: '2024-08-15', updatedBy: 'Emily Chen', cycle: 'Monthly', billCutoffDay: 25, paymentTermDays: 30, paymentMethod: 'ACH', billingFormat: 'EDI', apiEnabled: true, premiumCollection: 'Agency Bill' },
  { id: 'config002', insurerShort: 'Allstate', lastUpdated: '2024-07-20', updatedBy: 'Kevin Wang', cycle: 'Quarterly', billCutoffDay: 20, paymentTermDays: 45, paymentMethod: 'Wire', billingFormat: 'Excel', apiEnabled: false, premiumCollection: 'Direct Bill' },
  { id: 'config003', insurerShort: 'Progressive', lastUpdated: '2024-06-10', updatedBy: 'Michael Thompson', cycle: 'Monthly', billCutoffDay: 28, paymentTermDays: 30, paymentMethod: 'EFT', billingFormat: 'API', apiEnabled: true, premiumCollection: 'Agency Bill' },
]

// Insurer options for contacts filter
const CONTACT_INSURERS = [
  { id: 'c1001', name: 'State Farm' },
  { id: 'c1002', name: 'Allstate' },
]

// Mock contact persons data for Tab 4
const MOCK_CONTACTS = [
  { id: 'contact001', insurerId: 'c1001', name: 'John Smith', position: 'Account Manager', department: 'Business Development', role: 'Senior Management', email: 'john.smith@statefarm.com', phone: '+1-555-0101', mobilePhone: '+1-555-0102', isPrimary: true, isEscalation: false },
  { id: 'contact002', insurerId: 'c1001', name: 'Sarah Johnson', position: 'Underwriting Director', department: 'Underwriting', role: 'Underwriting', email: 'sarah.johnson@statefarm.com', phone: '+1-555-0103', isPrimary: false, isEscalation: false },
  { id: 'contact003', insurerId: 'c1001', name: 'Mike Davis', position: 'Claims Manager', department: 'Claims', role: 'Claims', email: 'mike.davis@statefarm.com', phone: '+1-555-0104', mobilePhone: '+1-555-0105', isPrimary: false, isEscalation: true },
  { id: 'contact004', insurerId: 'c1001', name: 'Lisa Chen', position: 'IT Architect', department: 'Technology', role: 'IT/API', email: 'lisa.chen@statefarm.com', phone: '+1-555-0106', isPrimary: false, isEscalation: false },
  { id: 'contact005', insurerId: 'c1002', name: 'David Martinez', position: 'Business Head', department: 'Sales', role: 'Senior Management', email: 'david.martinez@allstate.com', phone: '+1-555-0201', isPrimary: true, isEscalation: false },
  { id: 'contact006', insurerId: 'c1002', name: 'Jennifer Lopez', position: 'Compliance Officer', department: 'Legal', role: 'Legal', email: 'jennifer.lopez@allstate.com', phone: '+1-555-0202', isPrimary: false, isEscalation: false },
]

// Mock renewal items for Tab 5
const MOCK_RENEWALS = [
  { id: 'renewal001', title: 'State Farm Partnership Renewal', insurerShort: 'State Farm', expiryDate: '2027-12-31', daysLeft: 45, priority: 'normal', status: 'upcoming', accountManager: 'Emily Chen', autoRenew: true, lastAction: 'Initial check completed', lastActionDate: '2024-08-15' },
  { id: 'renewal002', title: 'Allstate Agreement Extension', insurerShort: 'Allstate', expiryDate: '2026-03-14', daysLeft: 125, priority: 'low', status: 'upcoming', accountManager: 'Kevin Wang', autoRenew: false, lastAction: 'Negotiation started', lastActionDate: '2024-07-20' },
  { id: 'renewal003', title: 'Progressive Contract Renewal', insurerShort: 'Progressive', expiryDate: '2025-05-31', daysLeft: 55, priority: 'high', status: 'in-negotiation', accountManager: 'Michael Thompson', autoRenew: false, lastAction: 'Terms discussion in progress', lastActionDate: '2024-08-25' },
  { id: 'renewal004', title: 'USAA Partnership Review', insurerShort: 'USAA', expiryDate: '2026-04-09', daysLeft: 190, priority: 'low', status: 'upcoming', accountManager: 'Emily Chen', autoRenew: false },
  { id: 'renewal005', title: 'Liberty Mutual Agreement', insurerShort: 'Liberty Mutual', expiryDate: '2025-02-19', daysLeft: 80, priority: 'critical', status: 'upcoming', accountManager: 'David Martinez', autoRenew: true, lastAction: 'Awaiting legal confirmation', lastActionDate: '2024-08-28' },
]

// Mock product integrations for Tab 7
const MOCK_INTEGRATIONS = [
  { id: 'int001', productName: 'Auto Classic Plus', productCode: 'AUTO-CL-001', line: 'Auto', insurerShort: 'State Farm', requestedBy: 'Kevin Wang', priority: 'normal', status: 'integrated', targetStates: ['CA', 'NV', 'AZ'], estimatedPremium: 2500000, technicalReqs: ['REST API', 'Real-time Quotes'], apiDoc: true, testCompleted: true, notes: 'Production ready' },
  { id: 'int002', productName: 'Homeowner Premier', productCode: 'HOME-PM-002', line: 'Home', insurerShort: 'State Farm', requestedBy: 'Kevin Wang', priority: 'high', status: 'approved', targetStates: ['CA', 'NV'], estimatedPremium: 1800000, technicalReqs: ['SOAP API', 'Batch Sync'], apiDoc: false, testCompleted: false },
  { id: 'int003', productName: 'Cyber Risk Coverage', productCode: 'CYBER-RSK-001', line: 'Commercial', insurerShort: 'Allstate', requestedBy: 'Michael Thompson', priority: 'high', status: 'in-review', targetStates: ['NY', 'NJ', 'PA'], estimatedPremium: 950000, technicalReqs: ['GraphQL', 'Webhooks'], apiDoc: true, testCompleted: false },
  { id: 'int004', productName: 'Life Protect Advanced', productCode: 'LIFE-PR-003', line: 'Life', insurerShort: 'Allstate', requestedBy: 'Kevin Wang', priority: 'normal', status: 'requested', targetStates: ['ALL'], estimatedPremium: 3200000, technicalReqs: ['REST API'], apiDoc: false, testCompleted: false, notes: 'Awaiting underwriting assessment' },
  { id: 'int005', productName: 'Travel Insurance Basic', productCode: 'TRVL-BSC-001', line: 'Travel', insurerShort: 'Progressive', requestedBy: 'David Martinez', priority: 'low', status: 'available', targetStates: ['FL', 'TX'], estimatedPremium: 650000, technicalReqs: ['REST API', 'XML Feed'], apiDoc: false, testCompleted: false },
]

const INTEGRATION_STATUS: Record<string, { label: string; cls: string; step: number }> = {
  available: { label: 'view.integrationStatus.available', cls: 'badge-gray', step: 0 },
  requested: { label: 'view.integrationStatus.requested', cls: 'badge-blue', step: 1 },
  'in-review': { label: 'view.integrationStatus.inReview', cls: 'badge-yellow', step: 2 },
  approved: { label: 'view.integrationStatus.approved', cls: 'badge-purple', step: 3 },
  integrated: { label: 'view.integrationStatus.integrated', cls: 'badge-green', step: 4 },
  rejected: { label: 'view.integrationStatus.rejected', cls: 'badge-red', step: -1 },
  suspended: { label: 'view.integrationStatus.suspended', cls: 'badge-gray', step: -1 },
}

const RENEWAL_PRIORITY: Record<string, { color: string; label: string }> = {
  critical: { color: '#BA1A1A', label: 'view.renewalPriority.critical' },
  high: { color: '#a05800', label: 'view.renewalPriority.high' },
  normal: { color: '#0058BC', label: 'view.renewalPriority.normal' },
  low: { color: '#717786', label: 'view.renewalPriority.low' },
}

const RENEWAL_STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'view.renewalStatus.upcoming', cls: 'badge-blue' },
  'in-negotiation': { label: 'view.renewalStatus.inNegotiation', cls: 'badge-yellow' },
  renewed: { label: 'view.renewalStatus.renewed', cls: 'badge-green' },
  'at-risk': { label: 'view.renewalStatus.atRisk', cls: 'badge-red' },
  lapsed: { label: 'view.renewalStatus.lapsed', cls: 'badge-gray' },
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
  const { t } = useTranslation('cooperation')
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [coopType, setCoopType] = useState<'Full-Service' | 'Specialty' | 'Preferred' | 'Surplus Lines'>('Full-Service')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [commTier, setCommTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3'>('Tier-2')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  const availableInsurers: any[] = []
  const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']
  const STATES_SAMPLE = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'WA', 'CO', 'GA']

  if (done) return (
    <div style={{ padding: '48px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('view.wizard.done.title')}</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t('view.wizard.done.desc')}</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t('view.wizard.done.back')}</button>
    </div>
  )

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {[t('view.wizard.stepNames.select'), t('view.wizard.stepNames.scope'), t('view.wizard.stepNames.terms'), t('view.wizard.stepNames.submit')].map((s, i) => (
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
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('view.wizard.step0.title')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableInsurers.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>{t('view.wizard.step0.empty')}</div>
              : availableInsurers.map(ins => (
                <label key={ins.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                  background: selectedInsurer === ins.id ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${selectedInsurer === ins.id ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  transition: 'all 100ms',
                }}>
                  <input type="radio" name="insurer" checked={selectedInsurer === ins.id} onChange={() => setSelectedInsurer(ins.id)} style={{ accentColor: '#0058BC' }} />
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                    {ins.insurerName.slice(0, 3)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23' }}>{ins.insurerName}</div>
                    <div style={{ fontSize: 12, color: '#717786' }}>{t('view.wizard.step0.coopTypeLabel')}：{ins.cooperationType}</div>
                  </div>
                  <span className={`badge ${ins.status === 'Approved' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 11 }}>{ins.status === 'Approved' ? t('view.wizard.step0.status.verified') : t('view.wizard.step0.status.pending')}</span>
                </label>
              ))
            }
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
                  <input type="radio" name="coopType" checked={coopType === opt.v as any} onChange={() => setCoopType(opt.v as any)} style={{ display: 'none' }} />
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
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.wizard.step1.states')}</div>
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
              <span style={{ fontSize: 12.5, color: '#717786', alignSelf: 'center' }}>{t('view.wizard.step1.moreStates')}</span>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>{t('view.wizard.step2.title')}</div>
          <div style={{ marginBottom: 18 }}>
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
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.wizard.step2.notes')}</div>
            <textarea className="input-glass w-full" style={{ minHeight: 88, resize: 'vertical', fontSize: 13.5 }}
              placeholder={t('view.wizard.step2.notesPlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0058BC', marginBottom: 8 }}>{t('view.wizard.step2.summaryTitle')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12.5 }}>
              {[
                ['view.wizard.step2.summary.insurer', selectedInsurer || '—'],
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
        </div>
      )}

      {step === 3 && (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Send size={28} style={{ color: '#0058BC' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('view.wizard.step3.confirmTitle')}</div>
          <p style={{ fontSize: 13.5, color: '#717786', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
            {t('view.wizard.step3.description')}
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: '#0058BC' }} />
            <span style={{ fontSize: 13, color: '#414755' }}>{t('view.wizard.step3.confirmation')}</span>
          </label>
        </div>
      )}

      {/* Wizard nav */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}>
          {step === 0 ? t('view.common.cancel') : t('view.wizard.prev')}
        </button>
        {step < 3
          ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedInsurer}>
              {t('view.wizard.next')}
            </button>
          : <button className="btn-primary" style={{ fontSize: 13, background: '#1a7a2e' }} onClick={() => {
            setDone(true)
          }}>
              <Send size={14} />{t('view.wizard.submit')}
            </button>
        }
      </div>
    </div>
  )
}

// ─── Settlement Edit Panel ────────────────────────────────────────────────────

function SettlementEditPanel({ config, onClose }: { config: typeof MOCK_SETTLEMENT_CONFIGS[number]; onClose: () => void }) {
  const { t } = useTranslation('cooperation')
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
      <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t('view.settlement.saved')}</div>
      <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>{t('view.common.close')}</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
        {[
          { label: t('view.settlement.cycle'), field: <select className="input-glass w-full" value={cycle} onChange={e => setCycle(e.target.value)} style={{ fontSize: 13 }}><option value="Monthly">{t('view.settlement.monthly')}</option><option value="Quarterly">{t('view.settlement.quarterly')}</option><option value="Semi-Annual">{t('view.settlement.semiAnnual')}</option></select> },
          { label: t('view.settlement.billCutoffDay'), field: <input className="input-glass w-full" value={cutoff} onChange={e => setCutoff(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="25" /> },
          { label: t('view.settlement.paymentTermsDays'), field: <input className="input-glass w-full" value={terms} onChange={e => setTerms(e.target.value)} style={{ fontSize: 13.5, fontFamily: "'JetBrains Mono', monospace" }} placeholder="30" /> },
          { label: t('view.settlement.paymentMethod'), field: <select className="input-glass w-full" value={method} onChange={e => setMethod(e.target.value)} style={{ fontSize: 13 }}><option>ACH</option><option>Wire</option><option>Check</option><option>EFT</option></select> },
          { label: t('view.settlement.reconFormat'), field: <select className="input-glass w-full" value={format} onChange={e => setFormat(e.target.value)} style={{ fontSize: 13 }}><option>EDI</option><option>API</option><option>CSV</option><option>Excel</option></select> },
          { label: t('view.settlement.premiumCollection'), field: <select className="input-glass w-full" value={premCollect} onChange={e => setPremCollect(e.target.value)} style={{ fontSize: 13 }}><option value="Agency Bill">Agency Bill</option><option value="Direct Bill">Direct Bill</option></select> },
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
        <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setSaved(true)}>{t('view.settlement.saveConfig')}</button>
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function CooperationManagementView({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('cooperation')
  const isEn = i18n.language.startsWith('en')

  // ── API-driven data fetching ──
  const { data: apiCoops } = useGetCooperations()
  const terminateCoop = useTerminateCooperation()
  const mockCooperations: any[] = (apiCoops ?? []).map(c => ({
    id: c.id, insurerId: c.carrier_id, insurerName: c.carrier_name ?? '',
    cooperationType: c.cooperation_type, status: c.status, commissionTier: c.commission_tier,
    notes: c.notes, notesEn: c.notes_en, settlementMethod: c.settlement_method,
    settlementCycle: c.settlement_cycle, premiumCollectionMethod: c.premium_collection_method,
    premiumSettlementCycle: c.premium_settlement_cycle, effectiveDate: c.effective_date,
    expirationDate: c.expiration_date,
    productScope: c.product_scope ?? { type: 'All' },
    stateScope: c.state_scope ?? [],
    contractFile: c.contract_file,
    createdAt: c.created_at, updatedAt: c.updated_at, createdBy: c.created_by,
  }))
  const [tab, setTab] = useState('establish') // ✅ Fix: Default to 'establish' tab
  const [showNewCoopWizard, setShowNewCoopWizard] = useState(false)
  const [integrationFilter, setIntegrationFilter] = useState('all')
  const [editSettlementId, setEditSettlementId] = useState<string | null>(null)
  const [filterInsurer, setFilterInsurer] = useState('all')
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Stats based on UI design prototype status mapping
  const activeCoops = mockCooperations.filter(c => c.status === 'Approved')
  const pendingCoops = mockCooperations.filter(c => ['Submitted', 'UnderReview'].includes(c.status))

  const editSettlement = editSettlementId ? MOCK_SETTLEMENT_CONFIGS.find(s => s.id === editSettlementId) : null
  const filteredContacts = filterInsurer === 'all' ? MOCK_CONTACTS : MOCK_CONTACTS.filter(c => c.insurerId === filterInsurer)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t('view.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t('view.subtitle', { active: activeCoops.length, pending: pendingCoops.length, renewals: MOCK_RENEWALS.filter(r => r.daysLeft <= 60).length })}
          </p>
        </div>
        <div className="flex gap-2">
          {MOCK_RENEWALS.filter(r => r.daysLeft <= 60 && r.status !== 'renewed').length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              padding: '7px 12px', 
              borderRadius: 9, 
              background: 'rgba(186,26,26,0.08)', 
              border: '0.5px solid rgba(186,26,26,0.2)', 
              fontSize: 12.5, 
              color: '#BA1A1A', 
              fontWeight: 500,
              marginRight: 8
            }}>
              <AlertTriangle size={13} />
              {t('view.renewalsUrgent', { count: MOCK_RENEWALS.filter(r => r.daysLeft <= 60 && r.status !== 'renewed').length })}
            </div>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setTab('establish'); setShowNewCoopWizard(true) }}>
            <Plus size={14} />{t('view.actions.newApplication')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map(tb => (
          <button key={tb.id} className={`tab-item${tab === tb.id ? ' active' : ''}`} onClick={() => { setTab(tb.id); setShowNewCoopWizard(false) }}>
            <tb.icon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
            {t(tb.label)}
          </button>
        ))}
      </div>

      {/* ── Tab: establish ── */}
      {tab === 'establish' && (
        <div>
          {showNewCoopWizard ? (
            <div className="card" style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 22 }}>{t('view.wizard.title')}</div>
              <EstablishWizard onCancel={() => setShowNewCoopWizard(false)} />
            </div>
          ) : (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'view.stats.active', count: activeCoops.length, color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
                  { label: 'view.stats.reviewing', count: pendingCoops.length, color: '#FFCC00', bg: 'rgba(255,204,0,0.08)' },
                  { label: 'view.stats.terminated', count: mockCooperations.filter(c => c.status === 'Terminated').length, color: '#717786', bg: 'rgba(193,198,215,0.15)' },
                  { label: 'view.stats.lobs', count: [...new Set(mockCooperations.flatMap(c => c.productScope.lobTypes || []))].length, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '16px 20px', background: s.bg, borderColor: s.color + '22' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
                    <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{t(s.label)}</div>
                  </div>
                ))}
              </div>

              {/* Coop cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {mockCooperations.map(coop => {
                  const sc = COOP_STATUS[coop.status] || COOP_STATUS.draft
                  const isActive = coop.status === 'Approved'
                  return (
                    <div key={coop.id} className="card" style={{ padding: '20px 22px' }}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,88,188,0.12), rgba(0,88,188,0.22))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                            {coop.insurerName.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{coop.insurerName}</div>
                            <div style={{ fontSize: 11.5, color: '#717786' }}>{coop.cooperationType}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`orb ${sc.orb}`} />
                          <span className={`badge ${sc.cls}`}>{t(sc.label)}</span>
                          {coop.status === 'Draft' && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>{t('view.coopStatus.draft')}</span>}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                          {[
                            { label: 'view.coopCard.term', value: `${coop.effectiveDate.slice(0, 7)} ～ ${coop.expirationDate?.slice(0, 7) || t('view.coopCard.permanent')}` },
                            { label: 'view.coopCard.commission', value: coop.commissionTier || t('view.coopCard.unspecified') },
                            { label: 'view.coopCard.owner', value: coop.myContactPerson.fullName },
                          ].map(k => (
                            <div key={k.label} style={{ background: 'rgba(241,243,254,0.7)', borderRadius: 9, padding: '7px 10px' }}>
                              <div style={{ fontSize: 10.5, color: '#717786', marginBottom: 2 }}>{t(k.label)}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#181C23' }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                        {coop.stateScope.slice(0, 4).map((s: string) => (
                          <span key={s} className="badge badge-blue" style={{ fontSize: 10.5, background: 'rgba(0,88,188,0.07)', color: '#0058BC', borderColor: 'rgba(0,88,188,0.15)' }}>{s}</span>
                        ))}
                        {coop.stateScope.length > 4 && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{coop.stateScope.length - 4}</span>}
                      </div>
                      {coop.contractFile && (
                        <div style={{ fontSize: 11.5, color: '#AF52DE', marginTop: 6 }}>
                          <FileText size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />{coop.contractFile.fileName}
                        </div>
                      )}
                      {coop.notes && (
                        <div style={{ 
                          fontSize: 12, 
                          color: '#a05800', 
                          background: 'rgba(255,149,0,0.06)', 
                          borderRadius: 8, 
                          padding: '6px 10px', 
                          marginTop: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          <span>{isEn ? coop.notesEn ?? coop.notes : coop.notes}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid rgba(193,198,215,0.15)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}><Eye size={12} />{t('view.coopCard.viewDetail')}</button>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}><Edit2 size={12} />{t('view.common.edit')}</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'contracts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div style={{ fontSize: 14, color: '#717786' }}>
              {t('view.contracts.summary', { total: MOCK_CONTRACTS.length, active: MOCK_CONTRACTS.filter(c => c.status === 'active').length, expiring: MOCK_CONTRACTS.filter(c => c.status === 'expiring').length })}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ fontSize: 13 }}><Upload size={14} />{t('view.contracts.upload')}</button>
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('view.contracts.create')}</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('view.contracts.th.name')}</th>
                  <th>{t('view.contracts.th.insurer')}</th>
                  <th>{t('view.contracts.th.type')}</th>
                  <th>{t('view.contracts.th.version')}</th>
                  <th>{t('view.contracts.th.validity')}</th>
                  <th>{t('view.contracts.th.signatoryUs')}</th>
                  <th>{t('view.contracts.th.signatoryThem')}</th>
                  <th>{t('view.contracts.th.status')}</th>
                  <th style={{ width: 100 }}>{t('view.contracts.th.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CONTRACTS.map(ct => {
                  const st = CONTRACT_STATUS[ct.status] || CONTRACT_STATUS.draft
                  const daysLeft = ct.expiryDate ? Math.ceil((new Date(ct.expiryDate).getTime() - Date.now()) / 86400000) : null
                  return (
                    <tr key={ct.id}>
                      <td>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{isEn ? ct.titleEn : ct.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                          {(isEn ? ct.tagsEn : ct.tags).map(tag => <span key={tag} className="badge badge-gray" style={{ fontSize: 10 }}>{tag}</span>)}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#414755' }}>{ct.insurerShort}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{ct.type}</span></td>
                      <td><span className="font-data" style={{ fontSize: 12, color: '#414755' }}>{ct.version}</span></td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>
                        <div>{ct.effectiveDate} ～</div>
                        <div style={{ color: daysLeft !== null && daysLeft < 90 ? '#a05800' : undefined }}>{ct.expiryDate || '—'}
                          {daysLeft !== null && daysLeft < 90 && daysLeft > 0 && <span style={{ fontSize: 10.5, color: '#BA1A1A', marginLeft: 4 }}>{t('view.contracts.daysLeft', { days: daysLeft })}</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryUs}</td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryThem}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{t(st.label)}</span>
                        {ct.autoRenew && <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>{t('view.contracts.autoRenewBadge')}</span>}
                      </td>
                      <td>
                        <div className="flex gap-0.5">
                          <button className="btn-ghost" style={{ padding: 5 }} title={t('view.contracts.actions.view')}><Eye size={13} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title={t('view.contracts.actions.download')}><Download size={13} /></button>
                          {ct.status === 'expiring' && <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} title={t('view.contracts.actions.renew')}><RefreshCw size={13} /></button>}
                          {ct.status === 'pending-sign' && <button className="btn-ghost" style={{ padding: 5, color: '#34C759' }} title={t('view.contracts.actions.sign')}><Edit2 size={13} /></button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'settlement' && (
        <div>
          {editSettlement ? (
            <div className="card" style={{ padding: '24px 28px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t('view.settlement.editTitle', { name: editSettlement.insurerShort })}</div>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setEditSettlementId(null)}><X size={16} /></button>
              </div>
              <SettlementEditPanel config={editSettlement} onClose={() => setEditSettlementId(null)} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MOCK_SETTLEMENT_CONFIGS.map(sc => (
                <div key={sc.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,88,188,0.10), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                        {sc.insurerShort.slice(0, 3)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{sc.insurerShort}</div>
                        <div style={{ fontSize: 12, color: '#717786' }}>{t('view.settlement.lastUpdated', { date: sc.lastUpdated, by: sc.updatedBy })}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green">{t('view.settlement.normal')}</span>
                      <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => {
                        setToast({ type: 'success', message: t('view.settlement.toastLoaded') })
                        setEditSettlementId(sc.id)
                      }}><Edit2 size={13} />{t('view.common.edit')}</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                    {[{
                      label: 'view.settlement.cycle', mono: true, value: sc.cycle === 'Monthly' ? t('view.settlement.monthly') : sc.cycle === 'Quarterly' ? t('view.settlement.quarterly') : t('view.settlement.semiAnnual')
                    }, {
                      label: 'view.settlement.cutoff', mono: true, value: t('view.settlement.cutoffValue', { day: sc.billCutoffDay })
                    }, {
                      label: 'view.settlement.paymentTerm', mono: true, value: `Net ${sc.paymentTermDays}`
                    }, {
                      label: 'view.settlement.paymentMethod', mono: false, value: sc.paymentMethod
                    }, {
                      label: 'view.settlement.reconFormat', mono: false, value: sc.billingFormat + (sc.apiEnabled ? ' + API' : '')
                    }].map(k => (
                      <div key={k.label} style={{ padding: '9px 12px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                        <div style={{ fontSize: 11, color: '#717786', marginBottom: 2 }}>{t(k.label)}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: k.mono ? "'JetBrains Mono', monospace" : undefined }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'contacts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <select className="input-glass" style={{ fontSize: 13 }} value={filterInsurer} onChange={e => setFilterInsurer(e.target.value)}>
              <option value="all">{t('view.contacts.allInsurers')}</option>
              {CONTACT_INSURERS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('view.contacts.addContact')}</button>
          </div>

          {/* Group by insurer */}
          {[...new Set(filteredContacts.map(c => c.insurerId))].map(iid => {
            const ins = CONTACT_INSURERS.find(i => i.id === iid)
            const contacts = filteredContacts.filter(c => c.insurerId === iid)
            return (
              <div key={iid} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#414755', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0058BC' }}>{ins?.name.slice(0, 3)}</div>
                  {ins?.name}
                  <span style={{ fontSize: 12, color: '#717786', fontWeight: 400 }}>{t('view.contacts.count', { count: contacts.length })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {contacts.map(ct => {
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
                              {ct.isPrimary && <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{t('view.contacts.primary')}</span>}
                              {ct.isEscalation && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>{t('view.contacts.escalation')}</span>}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#717786', marginBottom: 8 }}>{ct.position} · {ct.department}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <a href={`mailto:${ct.email}`} className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#0058BC', textDecoration: 'none' }}>
                                <Mail size={12} />{ct.email}
                              </a>
                              <div className="flex items-center gap-2" style={{ fontSize: 12.5, color: '#414755' }}>
                                <Phone size={12} />{ct.phone}
                                {ct.mobilePhone && <span style={{ color: '#717786' }}>· {ct.mobilePhone}</span>}
                              </div>
                            </div>
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

      {tab === 'terminate' && (
        <div>
          {terminateId ? (() => {
            const terminatedCoop = mockCooperations.find(c => c.id === terminateId)
            if (!terminatedCoop) return null
            return (
              <TerminatePanel coop={terminatedCoop} onCancel={() => setTerminateId(null)} setToast={setToast} />
            )
          })() : (
            <div>
              <div className="card" style={{ padding: '14px 18px', marginBottom: 16, background: 'rgba(186,26,26,0.05)', borderColor: 'rgba(186,26,26,0.2)' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} style={{ color: '#BA1A1A' }} />
                  <span style={{ fontSize: 13.5, color: '#BA1A1A', fontWeight: 600 }}>{t('view.terminate.warning')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mockCooperations.filter(c => c.status === 'Approved').map(coop => (
                  <div key={coop.id} className="card" style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, rgba(0,88,188,0.10), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC', flexShrink: 0 }}>
                      {coop.insurerName.slice(0, 3)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23', marginBottom: 3 }}>{coop.insurerName}</div>
                      <div style={{ fontSize: 12.5, color: '#717786' }}>
                        {t('view.terminate.coopInfo', { type: coop.cooperationType, date: coop.expirationDate?.slice(0, 10) || '—' })}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                        {coop.stateScope.slice(0, 4).map((s: string) => <span key={s} className="badge badge-gray" style={{ fontSize: 10.5 }}>{s}</span>)}
                        {coop.stateScope.length > 4 && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{coop.stateScope.length - 4}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>
                        {t('view.terminate.productsOwner', { owner: coop.myContactPerson.fullName })}
                      </div>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12.5, color: '#BA1A1A', border: '0.5px solid rgba(186,26,26,0.3)', borderRadius: 8, padding: '6px 14px' }}
                        onClick={() => setTerminateId(coop.id)}
                      >
                        <XCircle size={13} />{t('view.terminate.initiate')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'renewal' && (
        <div>
          {/* Timeline view */}
          <div className="card" style={{ padding: '18px 22px', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>{t('view.renewal.timeline')}</div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(193,198,215,0.4)', borderRadius: 1 }} />
              {[...MOCK_RENEWALS].sort((a, b) => a.daysLeft - b.daysLeft).map(r => {
                const pr = RENEWAL_PRIORITY[r.priority]
                const st = RENEWAL_STATUS[r.status] || RENEWAL_STATUS.upcoming
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
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{r.title}</span>
                            <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{t(st.label)}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: pr.color, background: pr.color + '14', padding: '2px 7px', borderRadius: 6 }}>{t(pr.label)}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: '#717786' }}>
                            {t('view.renewal.expiryDate')}<span style={{ fontFamily: "'JetBrains Mono', monospace", color: isOverdue ? '#BA1A1A' : '#414755' }}>{r.expiryDate}</span>
                            <span style={{ marginLeft: 10, color: isOverdue ? '#BA1A1A' : r.daysLeft <= 30 ? '#a05800' : '#717786', fontWeight: 500 }}>
                              {isOverdue ? t('view.renewal.overdue', { days: Math.abs(r.daysLeft) }) : t('view.renewal.daysLeft', { days: r.daysLeft })}
                            </span>
                          </div>
                          {r.lastAction && (
                            <div style={{ fontSize: 12, color: '#717786', marginTop: 4 }}>
                              {t('view.renewal.lastAction', { action: r.lastAction, date: r.lastActionDate })}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div style={{ fontSize: 12, color: '#717786' }}>{t('view.renewal.owner', { name: r.accountManager })}</div>
                          {r.autoRenew
                            ? <span className="badge badge-green" style={{ fontSize: 10.5 }}>{t('view.renewal.autoRenew')}</span>
                            : <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}><RefreshCw size={12} />{t('view.renewal.initiate')}</button>
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

      {tab === 'integration' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {['all', 'available', 'requested', 'in-review', 'approved', 'integrated', 'rejected'].map(s => (
                <button key={s} className={`btn-ghost${integrationFilter === s ? '' : ''}`}
                  style={{ fontSize: 12, padding: '5px 12px', background: integrationFilter === s ? 'rgba(0,88,188,0.10)' : undefined, color: integrationFilter === s ? '#0058BC' : '#717786', fontWeight: integrationFilter === s ? 600 : 400, borderRadius: 8 }}
                  onClick={() => setIntegrationFilter(s)}>
                  {s === 'all' ? t('view.integration.all') : t(INTEGRATION_STATUS[s]?.label ?? s)}
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />{t('view.integration.requestProduct')}</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_INTEGRATIONS.filter(pi => integrationFilter === 'all' || pi.status === integrationFilter).map(pi => {
              const ist = INTEGRATION_STATUS[pi.status]
              const STEPS = ['view.integrationStatus.available', 'view.integrationStatus.requested', 'view.integrationStatus.inReview', 'view.integrationStatus.approved', 'view.integrationStatus.integrated']
              const currentStep = ist.step
              return (
                <div key={pi.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{pi.productName}</span>
                        <span className={`badge ${ist.cls}`}>{t(ist.label)}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{pi.productCode}</span>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{pi.line}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#717786' }}>
                        {pi.insurerShort} · {t('view.integration.applicant', { name: pi.requestedBy || '—' })} · {t('view.integration.priorityLabel')}
                        <span style={{ color: pi.priority === 'high' ? '#BA1A1A' : pi.priority === 'normal' ? '#0058BC' : '#717786', fontWeight: 500 }}>
                          {pi.priority === 'high' ? t('view.priority.high') : pi.priority === 'normal' ? t('view.priority.normal') : t('view.priority.low')}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {pi.estimatedPremium && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>
                          ${(pi.estimatedPremium / 1000000).toFixed(0)}M <span style={{ fontSize: 12, fontWeight: 400, color: '#717786' }}>{t('view.integration.estimatedPremium')}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                        {pi.targetStates[0] === 'ALL' ? t('view.integration.nationwide') : pi.targetStates.join(', ')}
                      </div>
                    </div>
                  </div>

                  {/* Progress steps */}
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
                          <div style={{ fontSize: 10.5, color: i <= currentStep ? '#181C23' : '#717786', fontWeight: i === currentStep ? 600 : 400 }}>{t(s)}</div>
                        </div>
                        {i < 4 && <div style={{ width: 48, height: 2, background: i < currentStep ? '#34C759' : 'rgba(193,198,215,0.3)', margin: '0 4px', marginBottom: 14 }} />}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div style={{ display: 'flex', gap: 6 }}>
                      {pi.technicalReqs.map(r => (
                        <span key={r} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(175,82,222,0.08)', color: '#AF52DE', border: '0.5px solid rgba(175,82,222,0.2)' }}>{r}</span>
                      ))}
                      {pi.apiDoc && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>{t('view.integration.apiDoc')}</span>}
                      {pi.testCompleted && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>{t('view.integration.testPassed')}</span>}
                    </div>
                    <div className="flex gap-2">
                      {pi.notes && <span style={{ fontSize: 12, color: '#a05800', maxWidth: 240, textAlign: 'right' }}>{pi.notes}</span>}
                      {pi.status === 'available' && <button className="btn-primary" style={{ fontSize: 12.5 }}><Link2 size={13} />{t('view.integration.requestAccess')}</button>}
                      {pi.status === 'approved' && !pi.testCompleted && <button className="btn-secondary" style={{ fontSize: 12.5 }}><Zap size={13} />{t('view.integration.startTech')}</button>}
                      {pi.status === 'integrated' && <button className="btn-ghost" style={{ fontSize: 12.5 }}><Eye size={13} />{t('view.integration.viewProduct')}</button>}
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

// ─── Terminate Panel ──────────────────────────────────────────────────────────

function TerminatePanel({ coop, onCancel, setToast }: { coop: any; onCancel: () => void; setToast?: (toast: { type: 'success' | 'error'; message: string }) => void }) {
  const { t } = useTranslation('cooperation')
  const [reason, setReason] = useState('')
  const [termType, setTermType] = useState<'immediate' | 'end-of-term' | 'scheduled'>('end-of-term')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  const REASONS = [
    'view.terminate.reasons.expired',
    'view.terminate.reasons.compliance',
    'view.terminate.reasons.strategy',
    'view.terminate.reasons.mutual',
    'view.terminate.reasons.counterparty',
    'view.terminate.reasons.performance',
    'view.terminate.reasons.other',
  ] as const
  const canSubmit = reason && (termType !== 'scheduled' || date) && confirmed

  if (done) return (
    <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('view.terminate.done.title')}</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>{t('view.terminate.done.desc')}</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t('view.terminate.done.back')}</button>
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{t('view.terminate.withInsurer', { insurer: coop.insurerName })}</div>
            <div style={{ fontSize: 12.5, color: '#717786' }}>{t('view.terminate.currentInfo', { type: coop.cooperationType, date: coop.expirationDate?.slice(0, 10) || '—' })}
</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 4 }}>
          {[
            { label: 'view.terminate.impact.products', value: t('view.terminate.impact.productsValue', { count: 12 }), desc: 'view.terminate.impact.productsDesc' },
            { label: 'view.terminate.impact.channels', value: t('view.terminate.impact.channelsValue', { count: 8 }), desc: 'view.terminate.impact.channelsDesc' },
            { label: 'view.terminate.impact.contracts', value: t('view.terminate.impact.contractsValue', { count: 5 }), desc: 'view.terminate.impact.contractsDesc' },
          ].map(k => (
            <div key={k.label} style={{ padding: '12px 14px', background: 'rgba(186,26,26,0.04)', borderRadius: 10, border: '0.5px solid rgba(186,26,26,0.12)' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#BA1A1A', fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
              <div style={{ fontSize: 12, color: '#414755', marginTop: 2 }}>{t(k.label)}</div>
              <div style={{ fontSize: 11.5, color: '#717786', marginTop: 2 }}>{t(k.desc)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '22px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.terminate.reasonLabel')}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REASONS.map(r => (
              <label key={r} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                background: reason === r ? 'rgba(186,26,26,0.07)' : 'rgba(255,255,255,0.6)',
                border: `0.5px solid ${reason === r ? 'rgba(186,26,26,0.3)' : 'rgba(193,198,215,0.5)'}`,
              }}>
                <input type="radio" name="term-reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#BA1A1A' }} />
                <span style={{ fontSize: 13.5, color: '#181C23' }}>{t(r)}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>{t('view.terminate.typeLabel')}</div>
          <div className="flex gap-3">
            {[
              { v: 'end-of-term', l: 'view.terminate.types.endOfTerm', d: t('view.terminate.types.endOfTermDesc', { date: coop.expirationDate?.slice(0, 10) || '—' }) },
              { v: 'immediate', l: 'view.terminate.types.immediate', d: t('view.terminate.types.immediateDesc') },
              { v: 'scheduled', l: 'view.terminate.types.scheduled', d: t('view.terminate.types.scheduledDesc') },
            ].map(o => (
              <label key={o.v} style={{
                flex: 1, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                background: termType === o.v ? 'rgba(186,26,26,0.06)' : 'rgba(255,255,255,0.6)',
                border: `0.5px solid ${termType === o.v ? 'rgba(186,26,26,0.25)' : 'rgba(193,198,215,0.4)'}`,
              }}>
                <input type="radio" name="termType" checked={termType === o.v as any} onChange={() => setTermType(o.v as any)} style={{ display: 'none' }} />
                <div style={{ fontSize: 13.5, fontWeight: 600, color: termType === o.v ? '#BA1A1A' : '#181C23' }}>{t(o.l)}</div>
                <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{o.d}</div>
              </label>
            ))}
          </div>
          {termType === 'scheduled' && (
            <input type="date" className="input-glass" style={{ fontSize: 13, marginTop: 10 }} min={new Date().toISOString().split('T')[0]} value={date} onChange={e => setDate(e.target.value)} />
          )}
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>{t('view.terminate.noteLabel')}</div>
          <textarea className="input-glass w-full" style={{ minHeight: 72, resize: 'vertical', fontSize: 13.5 }} value={note} onChange={e => setNote(e.target.value)} placeholder={t('view.terminate.notePlaceholder')} />
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: '#BA1A1A', width: 15, height: 15, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#414755' }}>
            {t('view.terminate.confirmPrefix')}<strong style={{ color: '#181C23' }}> {coop.insurerName} </strong>{t('view.terminate.confirmSuffix')}
          </span>
        </label>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onCancel}>{t('view.common.cancel')}</button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              setDone(true)
              if (setToast) {
                setToast({ type: 'success', message: t('view.terminate.toastSubmitted', { insurer: coop.insurerName }) })
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
              background: canSubmit ? '#BA1A1A' : 'rgba(193,198,215,0.5)',
              color: canSubmit ? '#fff' : '#717786', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
            }}
          >
            <XCircle size={14} />{t('view.terminate.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
