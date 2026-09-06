// ── Cooperation Relationship ──────────────────────────────────────────────────

export type CoopAppStatus = 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected' | 'terminated'

export interface CooperationRelationship {
  id: string
  insurerId: string
  insurerName: string
  insurerShort: string
  type: 'Full-Service' | 'Specialty' | 'Preferred' | 'Surplus Lines'
  status: CoopAppStatus
  startDate: string
  endDate: string
  scope: string[]         // lines of business
  territoryStates: string[]
  commissionTier: 'Tier-1' | 'Tier-2' | 'Tier-3' | 'Custom'
  accountManager: string
  approvedBy?: string
  approvedAt?: string
  submittedDate: string
  notes?: string
  notesEn?: string
}

export const cooperations: CooperationRelationship[] = [
  {
    id: 'cr1', insurerId: '1', insurerName: 'Travelers Property Casualty', insurerShort: 'Travelers',
    type: 'Full-Service', status: 'approved',
    startDate: '2020-01-01', endDate: '2027-12-31',
    scope: ['Auto', 'Home', 'Commercial', 'P&C'],
    territoryStates: ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH'],
    commissionTier: 'Tier-1', accountManager: 'Sarah Chen',
    approvedBy: 'VP Partnerships', approvedAt: '2019-12-15', submittedDate: '2019-11-01',
  },
  {
    id: 'cr2', insurerId: '2', insurerName: 'Liberty Mutual Insurance', insurerShort: 'Liberty Mutual',
    type: 'Full-Service', status: 'approved',
    startDate: '2019-06-01', endDate: '2026-05-31',
    scope: ['Auto', 'Home', 'Life'],
    territoryStates: ['CA', 'TX', 'NY', 'FL', 'WA'],
    commissionTier: 'Tier-1', accountManager: 'James Rodriguez',
    approvedBy: 'VP Partnerships', approvedAt: '2019-05-20', submittedDate: '2019-04-10',
  },
  {
    id: 'cr3', insurerId: '3', insurerName: 'Nationwide Mutual Insurance', insurerShort: 'Nationwide',
    type: 'Preferred', status: 'approved',
    startDate: '2020-09-01', endDate: '2026-08-31',
    scope: ['Auto', 'Home', 'Life', 'Pet'],
    territoryStates: ['OH', 'TX', 'GA', 'NC', 'VA', 'IN'],
    commissionTier: 'Tier-2', accountManager: 'Michael Wu',
    approvedBy: 'Director BD', approvedAt: '2020-08-20', submittedDate: '2020-07-15',
  },
  {
    id: 'cr4', insurerId: '4', insurerName: 'Chubb Limited', insurerShort: 'Chubb',
    type: 'Full-Service', status: 'approved',
    startDate: '2017-03-01', endDate: '2028-02-28',
    scope: ['P&C', 'Specialty', 'Cyber', 'D&O'],
    territoryStates: ['NY', 'CA', 'CT', 'MA', 'NJ', 'PA'],
    commissionTier: 'Tier-1', accountManager: 'Emily Johnson',
    approvedBy: 'CEO', approvedAt: '2017-02-20', submittedDate: '2016-12-01',
  },
  {
    id: 'cr5', insurerId: '5', insurerName: 'AIG (American International Group)', insurerShort: 'AIG',
    type: 'Specialty', status: 'approved',
    startDate: '2022-01-01', endDate: '2026-09-30',
    scope: ['Commercial', 'Professional', 'Travel'],
    territoryStates: ['NY', 'CA', 'TX', 'FL', 'IL'],
    commissionTier: 'Tier-2', accountManager: 'Carlos Martinez',
    approvedBy: 'VP Partnerships', approvedAt: '2021-12-20', submittedDate: '2021-11-01',
    notes: '合同即将到期，续约谈判进行中',
    notesEn: 'Contract expiring soon; renewal negotiation in progress',
  },
  {
    id: 'cr6', insurerId: '7', insurerName: 'Berkshire Hathaway Specialty Insurance', insurerShort: 'BHSI',
    type: 'Specialty', status: 'under-review',
    startDate: '', endDate: '',
    scope: ['Cyber', 'D&O', 'E&O'],
    territoryStates: ['NY', 'DE', 'CA'],
    commissionTier: 'Tier-2', accountManager: 'Liu Yang',
    submittedDate: '2026-08-01',
    notes: '新合作申请，合规审核中',
    notesEn: 'New partnership application under compliance review',
  },
  {
    id: 'cr7', insurerId: '9', insurerName: 'Markel Corporation', insurerShort: 'Markel',
    type: 'Surplus Lines', status: 'terminated',
    startDate: '2021-01-01', endDate: '2025-12-31',
    scope: ['Specialty', 'E&S'],
    territoryStates: ['TX', 'FL', 'CA'],
    commissionTier: 'Tier-3', accountManager: 'Tom Anderson',
    submittedDate: '2020-10-01',
    notes: '因赔付率持续超标，双方协商终止合作',
    notesEn: 'Partnership terminated by mutual agreement due to sustained loss ratio overruns',
  },
]

// ── Contracts ─────────────────────────────────────────────────────────────────

export type ContractStatus = 'draft' | 'negotiating' | 'pending-sign' | 'active' | 'expiring' | 'expired' | 'terminated'

// Stable identifiers for display tags; localized labels live in the view via i18n.
export type ContractTag = 'master' | 'P&C' | '3yr' | 'commission' | 'annual' | 'expiring' | 'high-net-worth' | '5yr' | 'commercial' | 'renewal-negotiating' | 'NDA' | 'pending-sign' | 'data-sharing' | 'CCPA' | 'GDPR'

export interface CoopContract {
  id: string
  cooperationId: string
  insurerId: string
  insurerShort: string
  title: string
  type: 'Master Agreement' | 'Commission Schedule' | 'Data Sharing' | 'Amendment' | 'Addendum' | 'NDA'
  version: string
  status: ContractStatus
  effectiveDate: string
  expiryDate: string
  signedDate?: string
  signatoryUs: string
  signatoryThem: string
  fileSize: string
  uploadedBy: string
  uploadedAt: string
  renewalAlert?: number  // days before expiry to alert
  autoRenew: boolean
  tags: ContractTag[]
}

export const contracts: CoopContract[] = [
  {
    id: 'ct1', cooperationId: 'cr1', insurerId: '1', insurerShort: 'Travelers',
    title: 'Master Agency Agreement — Travelers 2024–2027',
    type: 'Master Agreement', version: 'v3.0', status: 'active',
    effectiveDate: '2024-01-01', expiryDate: '2027-12-31', signedDate: '2023-12-15',
    signatoryUs: 'CEO Wang Jun', signatoryThem: 'SVP Agency Relations Mike Torres',
    fileSize: '2.4 MB', uploadedBy: 'Legal Team', uploadedAt: '2023-12-16',
    renewalAlert: 90, autoRenew: false, tags: ['master', 'P&C', '3yr'],
  },
  {
    id: 'ct2', cooperationId: 'cr1', insurerId: '1', insurerShort: 'Travelers',
    title: 'Commission Schedule Addendum Q1 2026',
    type: 'Commission Schedule', version: 'v2026.1', status: 'active',
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31', signedDate: '2025-12-20',
    signatoryUs: 'CFO Li Mei', signatoryThem: 'Finance Director Anna Smith',
    fileSize: '0.8 MB', uploadedBy: 'Finance', uploadedAt: '2025-12-21',
    renewalAlert: 60, autoRenew: true, tags: ['commission', 'annual'],
  },
  {
    id: 'ct3', cooperationId: 'cr2', insurerId: '2', insurerShort: 'Liberty Mutual',
    title: 'Master Agency Agreement — Liberty Mutual',
    type: 'Master Agreement', version: 'v2.1', status: 'expiring',
    effectiveDate: '2022-06-01', expiryDate: '2026-05-31', signedDate: '2022-05-25',
    signatoryUs: 'CEO Wang Jun', signatoryThem: 'VP Agency Christine Davis',
    fileSize: '2.1 MB', uploadedBy: 'Legal Team', uploadedAt: '2022-05-26',
    renewalAlert: 90, autoRenew: false, tags: ['master', 'expiring'],
  },
  {
    id: 'ct4', cooperationId: 'cr4', insurerId: '4', insurerShort: 'Chubb',
    title: 'Chubb Masterpiece Agency Agreement 2024–2028',
    type: 'Master Agreement', version: 'v4.2', status: 'active',
    effectiveDate: '2024-03-01', expiryDate: '2028-02-28', signedDate: '2024-02-20',
    signatoryUs: 'CEO Wang Jun', signatoryThem: 'President Agency Distribution Peter Lau',
    fileSize: '3.2 MB', uploadedBy: 'Legal Team', uploadedAt: '2024-02-21',
    renewalAlert: 120, autoRenew: false, tags: ['master', 'high-net-worth', '5yr'],
  },
  {
    id: 'ct5', cooperationId: 'cr5', insurerId: '5', insurerShort: 'AIG',
    title: 'AIG Commercial Lines Agency Agreement',
    type: 'Master Agreement', version: 'v1.3', status: 'expiring',
    effectiveDate: '2022-01-01', expiryDate: '2026-09-30', signedDate: '2021-12-28',
    signatoryUs: 'VP Partnerships Chen Hao', signatoryThem: 'SVP Commercial Lines Bob Murphy',
    fileSize: '1.9 MB', uploadedBy: 'Legal Team', uploadedAt: '2021-12-29',
    renewalAlert: 90, autoRenew: false, tags: ['master', 'commercial', 'renewal-negotiating'],
  },
  {
    id: 'ct6', cooperationId: 'cr6', insurerId: '7', insurerShort: 'BHSI',
    title: 'BHSI Specialty Lines MOU',
    type: 'NDA', version: 'v1.0', status: 'pending-sign',
    effectiveDate: '', expiryDate: '2027-12-31', signedDate: undefined,
    signatoryUs: 'General Counsel Zhang Li', signatoryThem: 'Legal Counsel BHSI',
    fileSize: '0.6 MB', uploadedBy: 'Legal Team', uploadedAt: '2026-08-05',
    renewalAlert: 60, autoRenew: false, tags: ['NDA', 'pending-sign'],
  },
  {
    id: 'ct7', cooperationId: 'cr1', insurerId: '1', insurerShort: 'Travelers',
    title: 'Travelers Data Sharing & Privacy Agreement',
    type: 'Data Sharing', version: 'v2.0', status: 'active',
    effectiveDate: '2024-01-01', expiryDate: '2027-12-31', signedDate: '2023-12-15',
    signatoryUs: 'CTO Liu Peng', signatoryThem: 'CIO Travelers David Park',
    fileSize: '1.2 MB', uploadedBy: 'IT Compliance', uploadedAt: '2023-12-16',
    renewalAlert: 90, autoRenew: false, tags: ['data-sharing', 'CCPA', 'GDPR'],
  },
]

// ── Settlement Parameters ─────────────────────────────────────────────────────

export interface SettlementConfig {
  id: string
  insurerId: string
  insurerShort: string
  cycle: 'Monthly' | 'Quarterly' | 'Semi-Annual'
  billCutoffDay: number
  paymentTermDays: number
  paymentMethod: 'ACH' | 'Wire' | 'Check' | 'EFT'
  currency: 'USD'
  premiumCollection: 'Direct Bill' | 'Agency Bill'
  billingFormat: 'CSV' | 'EDI' | 'API' | 'Excel'
  apiEnabled: boolean
  reconciliationContact: string
  bankAccount?: string
  routingNote?: string
  lastUpdated: string
  updatedBy: string
  status: 'active' | 'pending-review' | 'suspended'
  notes?: string
  notesEn?: string
}

export const settlementConfigs: SettlementConfig[] = [
  {
    id: 'sc1', insurerId: '1', insurerShort: 'Travelers',
    cycle: 'Monthly', billCutoffDay: 25, paymentTermDays: 30,
    paymentMethod: 'ACH', currency: 'USD',
    premiumCollection: 'Agency Bill', billingFormat: 'EDI',
    apiEnabled: true, reconciliationContact: 'billing@travelers.com',
    lastUpdated: '2026-01-15', updatedBy: 'Finance Team', status: 'active',
    notes: '月结 25 日截单，次月 30 日内付款',
    notesEn: 'Monthly cycle, cutoff on the 25th, payment due within 30 days of the following month',
  },
  {
    id: 'sc2', insurerId: '2', insurerShort: 'Liberty Mutual',
    cycle: 'Monthly', billCutoffDay: 20, paymentTermDays: 45,
    paymentMethod: 'Wire', currency: 'USD',
    premiumCollection: 'Direct Bill', billingFormat: 'CSV',
    apiEnabled: false, reconciliationContact: 'agencies@libertymutual.com',
    lastUpdated: '2025-09-01', updatedBy: 'Finance Team', status: 'active',
  },
  {
    id: 'sc3', insurerId: '3', insurerShort: 'Nationwide',
    cycle: 'Monthly', billCutoffDay: 28, paymentTermDays: 30,
    paymentMethod: 'ACH', currency: 'USD',
    premiumCollection: 'Agency Bill', billingFormat: 'EDI',
    apiEnabled: true, reconciliationContact: 'agencyservices@nationwide.com',
    lastUpdated: '2025-11-10', updatedBy: 'Finance Team', status: 'active',
  },
  {
    id: 'sc4', insurerId: '4', insurerShort: 'Chubb',
    cycle: 'Quarterly', billCutoffDay: 15, paymentTermDays: 30,
    paymentMethod: 'Wire', currency: 'USD',
    premiumCollection: 'Agency Bill', billingFormat: 'API',
    apiEnabled: true, reconciliationContact: 'agencybilling@chubb.com',
    lastUpdated: '2024-03-01', updatedBy: 'Finance Team', status: 'active',
    notes: '季结，API 实时对账，专用 SFTP 通道',
    notesEn: 'Quarterly cycle with real-time API reconciliation over a dedicated SFTP channel',
  },
  {
    id: 'sc5', insurerId: '5', insurerShort: 'AIG',
    cycle: 'Monthly', billCutoffDay: 22, paymentTermDays: 45,
    paymentMethod: 'ACH', currency: 'USD',
    premiumCollection: 'Direct Bill', billingFormat: 'Excel',
    apiEnabled: false, reconciliationContact: 'commercialbilling@aig.com',
    lastUpdated: '2022-01-20', updatedBy: 'Finance Team', status: 'active',
    notes: '合同到期前需确认新周期结算参数',
    notesEn: 'New cycle settlement parameters must be confirmed before contract expiry',
  },
]

// ── Contacts ──────────────────────────────────────────────────────────────────

export interface CoopContact {
  id: string
  insurerId: string
  insurerShort: string
  role: 'Underwriting' | 'Claims' | 'Billing' | 'IT/API' | 'Legal' | 'Marketing' | 'Senior Management'
  name: string
  title: string
  department: string
  email: string
  phone: string
  mobile?: string
  timezone: string
  preferredContact: 'Email' | 'Phone' | 'Teams' | 'Slack'
  isPrimary: boolean
  isEscalation: boolean
  status: 'active' | 'inactive'
  notes?: string
  notesEn?: string
}

export const coopContacts: CoopContact[] = [
  { id: 'cc1', insurerId: '1', insurerShort: 'Travelers', role: 'Senior Management', name: 'Mike Torres', title: 'SVP Agency Relations', department: 'Distribution', email: 'm.torres@travelers.com', phone: '+1-860-277-0111', mobile: '+1-860-555-0101', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: true, status: 'active' },
  { id: 'cc2', insurerId: '1', insurerShort: 'Travelers', role: 'Underwriting', name: 'Jennifer Walsh', title: 'Underwriting Manager', department: 'Commercial Lines UW', email: 'j.walsh@travelers.com', phone: '+1-860-277-0222', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: false, status: 'active' },
  { id: 'cc3', insurerId: '1', insurerShort: 'Travelers', role: 'Billing', name: 'Anna Smith', title: 'Agency Billing Manager', department: 'Finance', email: 'a.smith@travelers.com', phone: '+1-860-277-0333', timezone: 'ET', preferredContact: 'Phone', isPrimary: true, isEscalation: false, status: 'active' },
  { id: 'cc4', insurerId: '1', insurerShort: 'Travelers', role: 'IT/API', name: 'David Park', title: 'Agency Technology Director', department: 'Digital', email: 'd.park@travelers.com', phone: '+1-860-277-0444', timezone: 'ET', preferredContact: 'Teams', isPrimary: true, isEscalation: false, status: 'active' },
  { id: 'cc5', insurerId: '4', insurerShort: 'Chubb', role: 'Senior Management', name: 'Peter Lau', title: 'President Agency Distribution', department: 'Distribution', email: 'peter.lau@chubb.com', phone: '+1-908-903-3000', mobile: '+1-908-555-0202', timezone: 'ET', preferredContact: 'Phone', isPrimary: true, isEscalation: true, status: 'active' },
  { id: 'cc6', insurerId: '4', insurerShort: 'Chubb', role: 'Underwriting', name: 'Sophia Chen', title: 'Senior UW Specialist', department: 'High Net Worth UW', email: 's.chen@chubb.com', phone: '+1-908-903-3100', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: false, status: 'active' },
  { id: 'cc7', insurerId: '4', insurerShort: 'Chubb', role: 'IT/API', name: 'Kevin Zhang', title: 'API Integration Engineer', department: 'Digital Solutions', email: 'k.zhang@chubb.com', phone: '+1-908-903-3200', timezone: 'ET', preferredContact: 'Teams', isPrimary: false, isEscalation: false, status: 'active' },
  { id: 'cc8', insurerId: '5', insurerShort: 'AIG', role: 'Senior Management', name: 'Bob Murphy', title: 'SVP Commercial Lines', department: 'Distribution', email: 'b.murphy@aig.com', phone: '+1-212-770-7000', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: true, status: 'active', notes: '合同续约谈判主要联系人', notesEn: 'Primary contact for contract renewal negotiations' },
  { id: 'cc9', insurerId: '5', insurerShort: 'AIG', role: 'Billing', name: 'Rachel Green', title: 'Agency Settlement Coordinator', department: 'Finance', email: 'r.green@aig.com', phone: '+1-212-770-7100', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: false, status: 'active' },
  { id: 'cc10', insurerId: '2', insurerShort: 'Liberty Mutual', role: 'Underwriting', name: 'Christine Davis', title: 'VP Agency Partnerships', department: 'Distribution', email: 'c.davis@libertymutual.com', phone: '+1-617-357-9500', timezone: 'ET', preferredContact: 'Email', isPrimary: true, isEscalation: true, status: 'active' },
]

// ── Renewal Management ────────────────────────────────────────────────────────

export interface RenewalItem {
  id: string
  insurerId: string
  insurerShort: string
  type: 'contract' | 'cooperation'
  title: string
  titleEn: string
  expiryDate: string
  autoRenew: boolean
  status: 'upcoming' | 'in-negotiation' | 'renewed' | 'at-risk' | 'lapsed'
  daysLeft: number
  accountManager: string
  renewalContact?: string
  lastAction?: string
  lastActionEn?: string
  lastActionDate?: string
  priority: 'critical' | 'high' | 'normal' | 'low'
  notes?: string
  notesEn?: string
}

export const renewalItems: RenewalItem[] = [
  {
    id: 'rn1', insurerId: '5', insurerShort: 'AIG', type: 'cooperation',
    title: 'AIG 商业险合作合同续约', titleEn: 'AIG Commercial Lines Agreement Renewal', expiryDate: '2026-09-30', autoRenew: false,
    status: 'in-negotiation', daysLeft: 39, accountManager: 'Carlos Martinez',
    renewalContact: 'Bob Murphy', lastAction: '第二轮条款谈判', lastActionEn: 'Second round of terms negotiation', lastActionDate: '2026-08-15',
    priority: 'critical', notes: '佣金率降低 1.5%，讨论中', notesEn: '1.5% commission rate reduction under discussion',
  },
  {
    id: 'rn2', insurerId: '2', insurerShort: 'Liberty Mutual', type: 'contract',
    title: 'Liberty Mutual 主代理协议续签', titleEn: 'Liberty Mutual Master Agency Agreement Renewal', expiryDate: '2026-05-31', autoRenew: false,
    status: 'at-risk', daysLeft: -83, accountManager: 'James Rodriguez',
    renewalContact: 'Christine Davis', lastAction: '收到终止通知，申请延期', lastActionEn: 'Received termination notice; extension requested', lastActionDate: '2026-08-01',
    priority: 'critical', notes: '已超期，临时延期协议有效至 2026-09-30', notesEn: 'Expired; interim extension agreement valid through 2026-09-30',
  },
  {
    id: 'rn3', insurerId: '3', insurerShort: 'Nationwide', type: 'cooperation',
    title: 'Nationwide 合作协议续约', titleEn: 'Nationwide Partnership Agreement Renewal', expiryDate: '2026-08-31', autoRenew: false,
    status: 'upcoming', daysLeft: 9, accountManager: 'Michael Wu',
    renewalContact: 'Agency Services', lastAction: '提交续约申请', lastActionEn: 'Renewal application submitted', lastActionDate: '2026-07-20',
    priority: 'high',
  },
  {
    id: 'rn4', insurerId: '1', insurerShort: 'Travelers', type: 'contract',
    title: 'Travelers 佣金表年度更新', titleEn: 'Travelers Annual Commission Schedule Update', expiryDate: '2026-12-31', autoRenew: true,
    status: 'upcoming', daysLeft: 131, accountManager: 'Sarah Chen',
    priority: 'normal', notes: '自动续约，确认新费率后更新', notesEn: 'Auto-renews; update after confirming new rates',
  },
  {
    id: 'rn5', insurerId: '6', insurerShort: 'Zurich', type: 'cooperation',
    title: 'Zurich 商业险合作协议', titleEn: 'Zurich Commercial Lines Partnership Agreement', expiryDate: '2027-09-30', autoRenew: false,
    status: 'upcoming', daysLeft: 404, accountManager: 'Liu Yang',
    priority: 'low',
  },
]

// ── Product Integration ───────────────────────────────────────────────────────

export type IntegrationStatus = 'available' | 'requested' | 'in-review' | 'approved' | 'integrated' | 'rejected' | 'suspended'

export interface ProductIntegration {
  id: string
  insurerId: string
  insurerShort: string
  productName: string
  productCode: string
  line: string
  requestDate?: string
  approvedDate?: string
  integratedDate?: string
  status: IntegrationStatus
  requestedBy: string
  priority: 'high' | 'normal' | 'low'
  estimatedPremium?: number
  targetStates: string[]
  technicalReqs: string[]
  notes?: string
  notesEn?: string
  apiDoc?: boolean
  testCompleted?: boolean
}

export const productIntegrations: ProductIntegration[] = [
  {
    id: 'pi1', insurerId: '1', insurerShort: 'Travelers', productName: 'Travelers Business Owner Policy', productCode: 'TRV-BOP-004', line: 'Commercial',
    requestDate: '2026-06-15', approvedDate: '2026-07-10', integratedDate: '2026-08-01',
    status: 'integrated', requestedBy: 'Michael Wu', priority: 'high',
    estimatedPremium: 85000000, targetStates: ['CA', 'TX', 'FL', 'NY'],
    technicalReqs: ['Rate API', 'Quote API', 'Bind API'], apiDoc: true, testCompleted: true,
  },
  {
    id: 'pi2', insurerId: '4', insurerShort: 'Chubb', productName: 'Chubb Excess Liability', productCode: 'CHB-EX-003', line: 'Specialty',
    requestDate: '2026-07-20', approvedDate: '2026-08-10',
    status: 'approved', requestedBy: 'Liu Yang', priority: 'high',
    estimatedPremium: 240000000, targetStates: ['NY', 'CA', 'IL'],
    technicalReqs: ['Rate API', 'Quote API', 'Bind API', 'Claims API'], apiDoc: true, testCompleted: false,
    notes: '技术对接进行中，预计 9 月上线',
    notesEn: 'Technical onboarding in progress; expected launch in September',
  },
  {
    id: 'pi3', insurerId: '4', insurerShort: 'Chubb', productName: 'Chubb Workers Compensation', productCode: 'CHB-WC-004', line: 'Commercial',
    requestDate: '2026-08-05',
    status: 'in-review', requestedBy: 'Emily Johnson', priority: 'normal',
    estimatedPremium: 120000000, targetStates: ['CA', 'TX', 'NY', 'FL', 'OH'],
    technicalReqs: ['Rate API', 'Quote API'], apiDoc: false, testCompleted: false,
    notes: '等待 Chubb 产品团队审批',
    notesEn: 'Awaiting approval from the Chubb product team',
  },
  {
    id: 'pi4', insurerId: '7', insurerShort: 'BHSI', productName: 'BHSI E&O Professional Liability', productCode: 'BHSI-EO-002', line: 'Professional',
    status: 'available', requestedBy: '', priority: 'high',
    estimatedPremium: 95000000, targetStates: ['NY', 'CA', 'TX', 'IL'],
    technicalReqs: ['Quote API', 'Bind API'], apiDoc: true, testCompleted: false,
    notes: '待 BHSI 主合作申请审批后启动产品接入',
    notesEn: 'Product integration to start once the BHSI master partnership application is approved',
  },
  {
    id: 'pi5', insurerId: '3', insurerShort: 'Nationwide', productName: 'Nationwide Pet Insurance', productCode: 'NW-PET-003', line: 'Pet',
    requestDate: '2026-05-01', approvedDate: '2026-05-28', integratedDate: '2026-07-15',
    status: 'integrated', requestedBy: 'James Rodriguez', priority: 'normal',
    estimatedPremium: 28000000, targetStates: ['ALL'],
    technicalReqs: ['Rate API', 'Quote API'], apiDoc: true, testCompleted: true,
  },
  {
    id: 'pi6', insurerId: '2', insurerShort: 'Liberty Mutual', productName: 'Liberty Business Umbrella', productCode: 'LM-UMB-003', line: 'Commercial',
    requestDate: '2026-08-10',
    status: 'requested', requestedBy: 'Sarah Chen', priority: 'normal',
    estimatedPremium: 65000000, targetStates: ['CA', 'TX', 'NY'],
    technicalReqs: ['Quote API'], apiDoc: false, testCompleted: false,
  },
  {
    id: 'pi7', insurerId: '5', insurerShort: 'AIG', productName: 'AIG Directors & Officers', productCode: 'AIG-DO-003', line: 'D&O',
    requestDate: '2026-03-01', status: 'rejected', requestedBy: 'Chen Hao', priority: 'high',
    estimatedPremium: 180000000, targetStates: ['NY', 'DE', 'CA'],
    technicalReqs: ['Rate API', 'Quote API', 'Bind API'], apiDoc: false, testCompleted: false,
    notes: '因合同即将到期，AIG 暂不批准新产品接入申请',
    notesEn: 'AIG has declined new product integration requests due to the impending contract expiration',
  },
]
