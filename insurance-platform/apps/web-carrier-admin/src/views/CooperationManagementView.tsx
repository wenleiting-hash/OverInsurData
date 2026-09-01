import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus, Edit2, FileText, Settings, Users, RefreshCw, Package,
  CheckCircle, XCircle, Clock, AlertTriangle, ChevronRight,
  Download, Upload, Send, Eye, Phone, Mail, MessageSquare,
  Link2, Zap, Shield, Calendar, TrendingUp, MoreHorizontal,
  GitMerge, ArrowUpRight, X, Building2, Search
} from 'lucide-react'
import type { ViewId } from '@/App'
import Toast from '@/components/SuccessToast'
import {
  mockCooperations,
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

interface Props {
  navigateTo: (view: ViewId, params?: any) => void
}

const TABS = [
  { id: 'establish', label: '合作关系建立', icon: GitMerge },
  { id: 'terminate', label: '合作关系终止', icon: XCircle },
  { id: 'contracts', label: '合同协议管理', icon: FileText },
  { id: 'settlement', label: '结算参数配置', icon: Settings },
  { id: 'contacts', label: '对接人联络', icon: Users },
  { id: 'renewal', label: '续约管理', icon: RefreshCw },
  { id: 'integration', label: '产品资源接入', icon: Package },
]

const COOP_STATUS: Record<string, { label: string; cls: string; orb: string }> = {
  Draft: { label: '草稿', cls: 'badge-gray', orb: 'orb-gray' },
  Submitted: { label: '已提交', cls: 'badge-blue', orb: 'orb-purple' },
  UnderReview: { label: '审核中', cls: 'badge-yellow', orb: 'orb-yellow' },
  Approved: { label: '合作中', cls: 'badge-green', orb: 'orb-green' },
  Rejected: { label: '已拒绝', cls: 'badge-red', orb: 'orb-red' },
  Terminated: { label: '已终止', cls: 'badge-gray', orb: 'orb-gray' },
}

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'badge-gray' },
  negotiating: { label: '谈判中', cls: 'badge-purple' },
  'pending-sign': { label: '待签署', cls: 'badge-yellow' },
  active: { label: '有效', cls: 'badge-green' },
  expiring: { label: '即将到期', cls: 'badge-orange' },
  expired: { label: '已到期', cls: 'badge-red' },
  terminated: { label: '已终止', cls: 'badge-gray' },
}

// Mock contract data for Tab 2
const MOCK_CONTRACTS = [
  { id: 'contract001', title: '主合作协议 - State Farm', insurerShort: 'State Farm', type: 'Master', version: 'v2.1', effectiveDate: '2024-01-01', expiryDate: '2027-12-31', signatoryUs: 'InsureOS Inc.', signatoryThem: 'State Farm Insurance', status: 'active', autoRenew: true, tags: ['核心协议', '自动续'] },
  { id: 'contract002', title: '产品补充协议 - Allstate', insurerShort: 'Allstate', type: 'Supplement', version: 'v1.3', effectiveDate: '2024-03-15', expiryDate: '2026-03-14', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Allstate Insurance', status: 'active', autoRenew: false, tags: ['Auto', 'Home'] },
  { id: 'contract003', title: '保密协议 NDA - Progressive', insurerShort: 'Progressive', type: 'NDA', version: 'v1.0', effectiveDate: '2024-06-01', expiryDate: '2026-05-31', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Progressive Insurance', status: 'expiring', autoRenew: false, tags: ['保密', '即将到期'] },
  { id: 'contract004', title: '数据处理协议 DPA - Liberty Mutual', insurerShort: 'Liberty Mutual', type: 'DPA', version: 'v1.2', effectiveDate: '2024-02-20', expiryDate: '2027-02-19', signatoryUs: 'InsureOS Inc.', signatoryThem: 'Liberty Mutual', status: 'active', autoRenew: true, tags: ['数据合规', 'GDPR'] },
  { id: 'contract005', title: '佣金补充协议 - USAA', insurerShort: 'USAA', type: 'Commission', version: 'v1.5', effectiveDate: '2024-04-10', expiryDate: '2026-04-09', signatoryUs: 'InsureOS Inc.', signatoryThem: 'USAA Insurance', status: 'active', autoRenew: false, tags: ['佣金', 'Tier-1'] },
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
  { id: 'renewal001', title: 'State Farm Partnership Renewal', insurerShort: 'State Farm', expiryDate: '2027-12-31', daysLeft: 45, priority: 'normal', status: 'upcoming', accountManager: 'Emily Chen', autoRenew: true, lastAction: 'Initial review completed', lastActionDate: '2024-08-15' },
  { id: 'renewal002', title: 'Allstate Agreement Extension', insurerShort: 'Allstate', expiryDate: '2026-03-14', daysLeft: 125, priority: 'low', status: 'upcoming', accountManager: 'Kevin Wang', autoRenew: false, lastAction: 'Negotiation started', lastActionDate: '2024-07-20' },
  { id: 'renewal003', title: 'Progressive Contract Renewal', insurerShort: 'Progressive', expiryDate: '2025-05-31', daysLeft: 55, priority: 'high', status: 'in-negotiation', accountManager: 'Michael Thompson', autoRenew: false, lastAction: 'Terms discussion in progress', lastActionDate: '2024-08-25' },
  { id: 'renewal004', title: 'USAA Partnership Review', insurerShort: 'USAA', expiryDate: '2026-04-09', daysLeft: 190, priority: 'low', status: 'upcoming', accountManager: 'Emily Chen', autoRenew: false },
  { id: 'renewal005', title: 'Liberty Mutual Agreement', insurerShort: 'Liberty Mutual', expiryDate: '2025-02-19', daysLeft: 80, priority: 'critical', status: 'upcoming', accountManager: 'David Martinez', autoRenew: true, lastAction: 'Legal review pending', lastActionDate: '2024-08-28' },
]

// Mock product integrations for Tab 7
const MOCK_INTEGRATIONS = [
  { id: 'int001', productName: 'Auto Classic Plus', productCode: 'AUTO-CL-001', line: 'Auto', insurerShort: 'State Farm', requestedBy: 'Kevin Wang', priority: 'normal', status: 'integrated', targetStates: ['CA', 'NV', 'AZ'], estimatedPremium: 2500000, technicalReqs: ['REST API', 'Real-time Quotes'], apiDoc: true, testCompleted: true, notes: 'Production ready' },
  { id: 'int002', productName: 'Homeowner Premier', productCode: 'HOME-PM-002', line: 'Home', insurerShort: 'State Farm', requestedBy: 'Kevin Wang', priority: 'high', status: 'approved', targetStates: ['CA', 'NV'], estimatedPremium: 1800000, technicalReqs: ['SOAP API', 'Batch Sync'], apiDoc: false, testCompleted: false },
  { id: 'int003', productName: 'Cyber Risk Coverage', productCode: 'CYBER-RSK-001', line: 'Commercial', insurerShort: 'Allstate', requestedBy: 'Michael Thompson', priority: 'high', status: 'in-review', targetStates: ['NY', 'NJ', 'PA'], estimatedPremium: 950000, technicalReqs: ['GraphQL', 'Webhooks'], apiDoc: true, testCompleted: false },
  { id: 'int004', productName: 'Life Protect Advanced', productCode: 'LIFE-PR-003', line: 'Life', insurerShort: 'Allstate', requestedBy: 'Kevin Wang', priority: 'normal', status: 'requested', targetStates: ['ALL'], estimatedPremium: 3200000, technicalReqs: ['REST API'], apiDoc: false, testCompleted: false, notes: 'Awaiting underwriting approval' },
  { id: 'int005', productName: 'Travel Insurance Basic', productCode: 'TRVL-BSC-001', line: 'Travel', insurerShort: 'Progressive', requestedBy: 'David Martinez', priority: 'low', status: 'available', targetStates: ['FL', 'TX'], estimatedPremium: 650000, technicalReqs: ['REST API', 'XML Feed'], apiDoc: false, testCompleted: false },
]

const INTEGRATION_STATUS: Record<string, { label: string; cls: string; step: number }> = {
  available: { label: '可接入', cls: 'badge-gray', step: 0 },
  requested: { label: '已申请', cls: 'badge-blue', step: 1 },
  'in-review': { label: '审核中', cls: 'badge-yellow', step: 2 },
  approved: { label: '已批准', cls: 'badge-purple', step: 3 },
  integrated: { label: '已接入', cls: 'badge-green', step: 4 },
  rejected: { label: '已拒绝', cls: 'badge-red', step: -1 },
  suspended: { label: '已暂停', cls: 'badge-gray', step: -1 },
}

const RENEWAL_PRIORITY: Record<string, { color: string; label: string }> = {
  critical: { color: '#BA1A1A', label: '紧急' },
  high: { color: '#a05800', label: '高' },
  normal: { color: '#0058BC', label: '正常' },
  low: { color: '#717786', label: '低' },
}

const RENEWAL_STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: '待处理', cls: 'badge-blue' },
  'in-negotiation': { label: '谈判中', cls: 'badge-yellow' },
  renewed: { label: '已续约', cls: 'badge-green' },
  'at-risk': { label: '风险', cls: 'badge-red' },
  lapsed: { label: '已失效', cls: 'badge-gray' },
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
  const [step, setStep] = useState(0)
  const [selectedInsurer, setSelectedInsurer] = useState('')
  const [coopType, setCoopType] = useState<'Full-Service' | 'Specialty' | 'Preferred' | 'Surplus Lines'>('Full-Service')
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [commTier, setCommTier] = useState<'Tier-1' | 'Tier-2' | 'Tier-3'>('Tier-2')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  const availableInsurers = mockCooperations.filter(c => c.status === 'Approved').length > 0 ? [] : []
  const LINES = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty']
  const STATES_SAMPLE = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH', 'WA', 'CO', 'GA']

  if (done) return (
    <div style={{ padding: '48px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>合作申请已提交</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>申请已进入合规审核流程，预计 5–10 个工作日完成，审批结果将通过邮件通知。</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>返回合作列表</button>
    </div>
  )

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
        {['选择保险公司', '合作范围', '条款确认', '提交'].map((s, i) => (
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
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>选择保险公司</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {availableInsurers.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: '#717786' }}>所有合规保险公司均已建立合作关系</div>
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
                    <div style={{ fontSize: 12, color: '#717786' }}>合作类型：{ins.cooperationType}</div>
                  </div>
                  <span className={`badge ${ins.status === 'Approved' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 11 }}>{ins.status === 'Approved' ? '已认证' : '待审核'}</span>
                </label>
              ))
            }
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>合作范围配置</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>合作类型</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {[
                { v: 'Full-Service', label: '全服务合作', desc: '所有险种、完整渠道服务' },
                { v: 'Preferred', label: '优选合作', desc: '主要险种、专项服务支持' },
                { v: 'Specialty', label: '专项合作', desc: '指定险种或专业业务线' },
                { v: 'Surplus Lines', label: 'Surplus Lines', desc: '非标准/E&S 市场业务' },
              ].map(t => (
                <label key={t.v} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                  background: coopType === t.v ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.5)',
                  border: `0.5px solid ${coopType === t.v ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="coopType" checked={coopType === t.v as any} onChange={() => setCoopType(t.v as any)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: coopType === t.v ? '#0058BC' : '#181C23' }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{t.desc}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>业务线范围</div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>经营州</div>
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
              <span style={{ fontSize: 12.5, color: '#717786', alignSelf: 'center' }}>…（完整 50 州选择器）</span>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 16 }}>条款确认与备注</div>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>佣金等级</div>
            <div className="flex gap-3">
              {([['Tier-1', '标准优选费率'], ['Tier-2', '标准费率'], ['Tier-3', '基础费率']] as const).map(([t, d]) => (
                <label key={t} style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                  background: commTier === t ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${commTier === t ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="radio" name="commTier" checked={commTier === t} onChange={() => setCommTier(t)} style={{ display: 'none' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: commTier === t ? '#0058BC' : '#181C23' }}>{t}</div>
                  <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>{d}</div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>申请备注</div>
            <textarea className="input-glass w-full" style={{ minHeight: 88, resize: 'vertical', fontSize: 13.5 }}
              placeholder="补充说明合作背景、特殊条款要求或业务预期…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0058BC', marginBottom: 8 }}>申请摘要</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', fontSize: 12.5 }}>
              {[
                ['保险公司', selectedInsurer || '—'],
                ['合作类型', coopType],
                ['业务线', selectedLines.join(', ') || '未选择'],
                ['经营州', selectedStates.join(', ') || '未选择'],
                ['佣金等级', commTier],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-2">
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
          <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>确认提交合作申请</div>
          <p style={{ fontSize: 13.5, color: '#717786', maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
            申请提交后将进入内部合规审核，同时向保险公司发送合作意向通知。审批通过后系统将自动创建合作记录。
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ accentColor: '#0058BC' }} />
            <span style={{ fontSize: 13, color: '#414755' }}>我确认以上信息准确，同意提交合作申请</span>
          </label>
        </div>
      )}

      {/* Wizard nav */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
        <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => step > 0 ? setStep(s => s - 1) : onCancel()}>
          {step === 0 ? '取消' : '← 上一步'}
        </button>
        {step < 3
          ? <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => setStep(s => s + 1)} disabled={step === 0 && !selectedInsurer}>
              下一步 →
            </button>
          : <button className="btn-primary" style={{ fontSize: 13, background: '#1a7a2e' }} onClick={() => {
            setDone(true)
          }}>
              <Send size={14} />提交申请
            </button>
        }
      </div>
    </div>
  )
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function CooperationManagementView({ navigateTo }: Props) {
  const [tab, setTab] = useState('establish') // ✅ Fix: Default to 'establish' tab
  const [showNewCoopWizard, setShowNewCoopWizard] = useState(false)
  const [integrationFilter, setIntegrationFilter] = useState('all')
  const [editSettlementId, setEditSettlementId] = useState<string | null>(null)
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Stats based on UI design prototype status mapping
  const activeCoops = mockCooperations.filter(c => c.status === 'Approved')
  const pendingCoops = mockCooperations.filter(c => ['Submitted', 'UnderReview'].includes(c.status))

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
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>合作管理</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {activeCoops.length} 家合作保险公司 · {pendingCoops.length} 个申请处理中 · {MOCK_RENEWALS.filter(r => r.daysLeft <= 60).length} 项续约待处理
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
              {MOCK_RENEWALS.filter(r => r.daysLeft <= 60 && r.status !== 'renewed').length} 项续约紧急
            </div>
          )}
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setTab('establish'); setShowNewCoopWizard(true) }}>
            <Plus size={14} />新建合作申请
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-item${tab === t.id ? ' active' : ''}`} onClick={() => { setTab(t.id); setShowNewCoopWizard(false) }}>
            <t.icon size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'text-bottom' }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: 合作关系建立 ── */}
      {tab === 'establish' && (
        <div>
          {showNewCoopWizard ? (
            <div className="card" style={{ padding: '28px 32px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 22 }}>新建合作关系申请</div>
              <EstablishWizard onCancel={() => setShowNewCoopWizard(false)} />
            </div>
          ) : (
            <div>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: '合作中', count: activeCoops.length, color: '#34C759', bg: 'rgba(52,199,89,0.08)' },
                  { label: '审核中', count: pendingCoops.length, color: '#FFCC00', bg: 'rgba(255,204,0,0.08)' },
                  { label: '已终止', count: mockCooperations.filter(c => c.status === 'Terminated').length, color: '#717786', bg: 'rgba(193,198,215,0.15)' },
                  { label: '覆盖险种', count: [...new Set(mockCooperations.flatMap(c => c.productScope.lobTypes || []))].length, color: '#0058BC', bg: 'rgba(0,88,188,0.08)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '16px 20px', background: s.bg, borderColor: s.color + '22' }}>
                    <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.count}</div>
                    <div style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{s.label}</div>
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
                          <span className={`badge ${sc.cls}`}>{sc.label}</span>
                          {coop.status === 'Draft' && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>草稿</span>}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                          {[
                            { label: '合作期限', value: `${coop.effectiveDate.slice(0, 7)} ～ ${coop.expirationDate?.slice(0, 7) || '永久'}` },
                            { label: '佣金等级', value: coop.commissionTier || '未指定' },
                            { label: '负责人', value: coop.myContactPerson.fullName },
                          ].map(k => (
                            <div key={k.label} style={{ background: 'rgba(241,243,254,0.7)', borderRadius: 9, padding: '7px 10px' }}>
                              <div style={{ fontSize: 10.5, color: '#717786', marginBottom: 2 }}>{k.label}</div>
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#181C23' }}>{k.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                        {coop.stateScope.slice(0, 4).map(s => (
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
                          <span>{coop.notes}</span>
                        </div>
                      )}
                      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '0.5px solid rgba(193,198,215,0.15)', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}><Eye size={12} />查看详情</button>
                        <button className="btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}><Edit2 size={12} />编辑</button>
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
              共 {MOCK_CONTRACTS.length} 份合同 · {MOCK_CONTRACTS.filter(c => c.status === 'active').length} 份有效 · {MOCK_CONTRACTS.filter(c => c.status === 'expiring').length} 份即将到期
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ fontSize: 13 }}><Upload size={14} />上传合同</button>
              <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />新建合同</button>
            </div>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>合同名称</th>
                  <th>保险公司</th>
                  <th>类型</th>
                  <th>版本</th>
                  <th>有效期</th>
                  <th>签署方（我司）</th>
                  <th>签署方（对方）</th>
                  <th>状态</th>
                  <th style={{ width: 100 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CONTRACTS.map(ct => {
                  const st = CONTRACT_STATUS[ct.status] || CONTRACT_STATUS.draft
                  const daysLeft = ct.expiryDate ? Math.ceil((new Date(ct.expiryDate).getTime() - Date.now()) / 86400000) : null
                  return (
                    <tr key={ct.id}>
                      <td>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{ct.title}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                          {ct.tags.map(t => <span key={t} className="badge badge-gray" style={{ fontSize: 10 }}>{t}</span>)}
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#414755' }}>{ct.insurerShort}</td>
                      <td><span className="badge badge-gray" style={{ fontSize: 11 }}>{ct.type}</span></td>
                      <td><span className="font-data" style={{ fontSize: 12, color: '#414755' }}>{ct.version}</span></td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>
                        <div>{ct.effectiveDate} ～</div>
                        <div style={{ color: daysLeft !== null && daysLeft < 90 ? '#a05800' : undefined }}>{ct.expiryDate || '—'}
                          {daysLeft !== null && daysLeft < 90 && daysLeft > 0 && <span style={{ fontSize: 10.5, color: '#BA1A1A', marginLeft: 4 }}>({daysLeft}天)</span>}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryUs}</td>
                      <td style={{ fontSize: 12.5, color: '#414755' }}>{ct.signatoryThem}</td>
                      <td>
                        <span className={`badge ${st.cls}`}>{st.label}</span>
                        {ct.autoRenew && <span className="badge badge-blue" style={{ fontSize: 10, marginLeft: 4 }}>自动续</span>}
                      </td>
                      <td>
                        <div className="flex gap-0.5">
                          <button className="btn-ghost" style={{ padding: 5 }} title="查看"><Eye size={13} /></button>
                          <button className="btn-ghost" style={{ padding: 5 }} title="下载"><Download size={13} /></button>
                          {ct.status === 'expiring' && <button className="btn-ghost" style={{ padding: 5, color: '#0058BC' }} title="续约"><RefreshCw size={13} /></button>}
                          {ct.status === 'pending-sign' && <button className="btn-ghost" style={{ padding: 5, color: '#34C759' }} title="签署"><Edit2 size={13} /></button>}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Mock settlement configs */}
            {[
              { id: 'config001', insurerShort: 'State Farm', lastUpdated: '2024-08-15', updatedBy: 'Emily Chen', cycle: 'Monthly', billCutoffDay: 25, paymentTermDays: 30, paymentMethod: 'ACH', billingFormat: 'EDI', apiEnabled: true, premiumCollection: 'Agency Bill' },
              { id: 'config002', insurerShort: 'Allstate', lastUpdated: '2024-07-20', updatedBy: 'Kevin Wang', cycle: 'Quarterly', billCutoffDay: 20, paymentTermDays: 45, paymentMethod: 'Wire', billingFormat: 'Excel', apiEnabled: false, premiumCollection: 'Direct Bill' },
              { id: 'config003', insurerShort: 'Progressive', lastUpdated: '2024-06-10', updatedBy: 'Michael Thompson', cycle: 'Monthly', billCutoffDay: 28, paymentTermDays: 30, paymentMethod: 'EFT', billingFormat: 'API', apiEnabled: true, premiumCollection: 'Agency Bill' },
            ].map(sc => (
              <div key={sc.id} className="card" style={{ padding: '20px 24px' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'linear-gradient(135deg, rgba(0,88,188,0.10), rgba(0,88,188,0.20))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0058BC' }}>
                      {sc.insurerShort.slice(0, 3)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>{sc.insurerShort}</div>
                      <div style={{ fontSize: 12, color: '#717786' }}>最后更新：{sc.lastUpdated} · {sc.updatedBy}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-green">正常</span>
                    <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => {
                      setToast({ type: 'success', message: `结算参数已加载，请在编辑器中修改后保存` })
                      setEditSettlementId(sc.id)
                    }}><Edit2 size={13} />编辑</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                  {[{
                    label: '结算周期', value: sc.cycle === 'Monthly' ? '月结' : sc.cycle === 'Quarterly' ? '季结' : '半年结'
                  }, {
                    label: '账单截止', value: `每月 ${sc.billCutoffDay} 日`
                  }, {
                    label: '付款账期', value: `Net ${sc.paymentTermDays}`
                  }, {
                    label: '付款方式', value: sc.paymentMethod
                  }, {
                    label: '对账格式', value: sc.billingFormat + (sc.apiEnabled ? ' + API' : '')
                  }].map(k => (
                    <div key={k.label} style={{ padding: '9px 12px', background: 'rgba(241,243,254,0.7)', borderRadius: 9 }}>
                      <div style={{ fontSize: 11, color: '#717786', marginBottom: 2 }}>{k.label}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23', fontFamily: k.label.includes('期') || k.label.includes('账') ? "'JetBrains Mono', monospace" : undefined }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'contacts' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button className="btn-secondary" style={{ fontSize: 13 }}><Search size={13} />搜索保险公司</button>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />添加联系人</button>
          </div>

          {/* Group by insurer */}
          {['c1001', 'c1002'].map(iid => {
            const contacts = MOCK_CONTACTS.filter(c => c.insurerId === iid)
            return (
              <div key={iid} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#414755', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,88,188,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#0058BC' }}>{contacts[0]?.name.slice(0, 2) || 'C1'}</div>
                  {iid === 'c1001' ? 'State Farm' : iid === 'c1002' ? 'Allstate' : 'Insurer'}
                  <span style={{ fontSize: 12, color: '#717786', fontWeight: 400 }}>{contacts.length} 位联系人</span>
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
                              {ct.isPrimary && <span className="badge badge-blue" style={{ fontSize: 10.5 }}>主要</span>}
                              {ct.isEscalation && <span className="badge badge-orange" style={{ fontSize: 10.5 }}>升级</span>}
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
                  <span style={{ fontSize: 13.5, color: '#BA1A1A', fontWeight: 600 }}>合作关系终止操作将影响所有在售产品和渠道授权，请在充分评估后操作。</span>
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
                        合作类型：{coop.cooperationType} · 合同到期：{coop.expirationDate?.slice(0, 10) || '—'}
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                        {coop.stateScope.slice(0, 4).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 10.5 }}>{s}</span>)}
                        {coop.stateScope.length > 4 && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{coop.stateScope.length - 4}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 12, color: '#717786', marginBottom: 6 }}>
                        产品 12 个 · 负责人 {coop.myContactPerson.fullName}
                      </div>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: 12.5, color: '#BA1A1A', border: '0.5px solid rgba(186,26,26,0.3)', borderRadius: 8, padding: '6px 14px' }}
                        onClick={() => setTerminateId(coop.id)}
                      >
                        <XCircle size={13} />发起终止申请
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
            <div style={{ fontSize: 14, fontWeight: 600, color: '#181C23', marginBottom: 14 }}>续约时间轴</div>
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
                            <span className={`badge ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: pr.color, background: pr.color + '14', padding: '2px 7px', borderRadius: 6 }}>{pr.label}</span>
                          </div>
                          <div style={{ fontSize: 12.5, color: '#717786' }}>
                            到期日：<span style={{ fontFamily: "'JetBrains Mono', monospace", color: isOverdue ? '#BA1A1A' : '#414755' }}>{r.expiryDate}</span>
                            <span style={{ marginLeft: 10, color: isOverdue ? '#BA1A1A' : r.daysLeft <= 30 ? '#a05800' : '#717786', fontWeight: 500 }}>
                              {isOverdue ? `已超期 ${Math.abs(r.daysLeft)} 天` : `剩余 ${r.daysLeft} 天`}
                            </span>
                          </div>
                          {r.lastAction && (
                            <div style={{ fontSize: 12, color: '#717786', marginTop: 4 }}>
                              最新动态：{r.lastAction} ({r.lastActionDate})
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div style={{ fontSize: 12, color: '#717786' }}>负责人：{r.accountManager}</div>
                          {r.autoRenew
                            ? <span className="badge badge-green" style={{ fontSize: 10.5 }}>自动续约</span>
                            : <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px' }}><RefreshCw size={12} />发起续约</button>
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
                  {s === 'all' ? '全部' : INTEGRATION_STATUS[s]?.label ?? s}
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{ fontSize: 13 }}><Plus size={14} />申请产品接入</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {MOCK_INTEGRATIONS.filter(pi => integrationFilter === 'all' || pi.status === integrationFilter).map(pi => {
              const ist = INTEGRATION_STATUS[pi.status]
              const STEPS = ['可接入', '已申请', '审核中', '已批准', '已接入']
              const currentStep = ist.step
              return (
                <div key={pi.id} className="card" style={{ padding: '20px 24px' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{pi.productName}</span>
                        <span className={`badge ${ist.cls}`}>{ist.label}</span>
                        <span className="badge badge-gray" style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{pi.productCode}</span>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{pi.line}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#717786' }}>
                        {pi.insurerShort} · 申请人：{pi.requestedBy || '—'} · 优先级：
                        <span style={{ color: pi.priority === 'high' ? '#BA1A1A' : pi.priority === 'normal' ? '#0058BC' : '#717786', fontWeight: 500 }}>
                          {pi.priority === 'high' ? '高' : pi.priority === 'normal' ? '正常' : '低'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {pi.estimatedPremium && (
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0058BC', fontFamily: "'JetBrains Mono', monospace" }}>
                          ${(pi.estimatedPremium / 1000000).toFixed(0)}M <span style={{ fontSize: 12, fontWeight: 400, color: '#717786' }}>预期保费</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: '#717786', marginTop: 2 }}>
                        {pi.targetStates[0] === 'ALL' ? '全国' : pi.targetStates.join(', ')}
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
                          <div style={{ fontSize: 10.5, color: i <= currentStep ? '#181C23' : '#717786', fontWeight: i === currentStep ? 600 : 400 }}>{s}</div>
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
                      {pi.apiDoc && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>API 文档 ✓</span>}
                      {pi.testCompleted && <span style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'rgba(52,199,89,0.08)', color: '#34C759', border: '0.5px solid rgba(52,199,89,0.2)' }}>测试通过 ✓</span>}
                    </div>
                    <div className="flex gap-2">
                      {pi.notes && <span style={{ fontSize: 12, color: '#a05800', maxWidth: 240, textAlign: 'right' }}>{pi.notes}</span>}
                      {pi.status === 'available' && <button className="btn-primary" style={{ fontSize: 12.5 }}><Link2 size={13} />申请接入</button>}
                      {pi.status === 'approved' && !pi.testCompleted && <button className="btn-secondary" style={{ fontSize: 12.5 }}><Zap size={13} />开始技术对接</button>}
                      {pi.status === 'integrated' && <button className="btn-ghost" style={{ fontSize: 12.5 }}><Eye size={13} />查看产品</button>}
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

function TerminatePanel({ coop, onCancel, setToast }: { coop: typeof mockCooperations[number]; onCancel: () => void; setToast?: (toast: { type: 'success' | 'error'; message: string }) => void }) {
  const [reason, setReason] = useState('')
  const [termType, setTermType] = useState<'immediate' | 'end-of-term' | 'scheduled'>('end-of-term')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  const REASONS = [
    '合作协议到期，不再续约',
    '合规问题无法解决',
    '业务战略调整',
    '双方协商一致终止',
    '对方提出终止',
    '业绩不达标',
    '其他原因（备注中说明）'
  ] as const
  const canSubmit = reason && (termType !== 'scheduled' || date) && confirmed

  if (done) return (
    <div className="card" style={{ padding: '56px 40px', textAlign: 'center' }}>
      <CheckCircle size={44} style={{ color: '#34C759', margin: '0 auto 14px' }} />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>终止申请已提交</div>
      <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 24 }}>申请进入审批流程，审批通过后按所选时间执行终止操作。</p>
      <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={onCancel}>返回列表</button>
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#181C23' }}>终止与 {coop.insurerName} 的合作关系</div>
            <div style={{ fontSize: 12.5, color: '#717786' }}>合作类型：{coop.cooperationType} · 当前到期：{coop.expirationDate?.slice(0, 10) || '—'}
</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 4 }}>
          {[
            { label: '关联产品', value: '12 个', desc: '停止接受新保报价' },
            { label: '合作渠道', value: '8 个', desc: '产品授权将被批量收回' },
            { label: '有效合同', value: '5 份', desc: '需依合同条款处理' },
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
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>终止原因 *</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {REASONS.map(r => (
              <label key={r} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                background: reason === r ? 'rgba(186,26,26,0.07)' : 'rgba(255,255,255,0.6)',
                border: `0.5px solid ${reason === r ? 'rgba(186,26,26,0.3)' : 'rgba(193,198,215,0.5)'}`,
              }}>
                <input type="radio" name="term-reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#BA1A1A' }} />
                <span style={{ fontSize: 13.5, color: '#181C23' }}>{r}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 8 }}>终止方式 *</div>
          <div className="flex gap-3">
            {[
              { v: 'end-of-term', l: '合同到期终止', d: `按合同条款，${coop.expirationDate?.slice(0, 10) || '—'}` },
              { v: 'immediate', l: '立即终止', d: '立即执行，需双方确认' },
              { v: 'scheduled', l: '指定日期终止', d: '自定义终止日期' },
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
          <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 6 }}>备注说明</div>
          <textarea className="input-glass w-full" style={{ minHeight: 72, resize: 'vertical', fontSize: 13.5 }} value={note} onChange={e => setNote(e.target.value)} placeholder="填写终止背景、后续安排或特殊事项…" />
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2, accentColor: '#BA1A1A', width: 15, height: 15, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#414755' }}>
            我已知悉终止影响，确认申请终止与<strong style={{ color: '#181C23' }}> {coop.insurerName} </strong>的合作关系，本申请需主管审批后生效并记录至审计日志。
          </span>
        </label>
        <div className="flex gap-3 justify-end">
          <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={onCancel}>取消</button>
          <button
            disabled={!canSubmit}
            onClick={() => {
              setDone(true)
              if (setToast) {
                setToast({ type: 'success', message: `合作关系终止申请已提交（${coop.insurerName}），预计 3-5 个工作日审批完成` })
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 22px',
              background: canSubmit ? '#BA1A1A' : 'rgba(193,198,215,0.5)',
              color: canSubmit ? '#fff' : '#717786', borderRadius: 9, fontSize: 13.5, fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed', border: 'none',
            }}
          >
            <XCircle size={14} />提交终止申请
          </button>
        </div>
      </div>
    </div>
  )
}
