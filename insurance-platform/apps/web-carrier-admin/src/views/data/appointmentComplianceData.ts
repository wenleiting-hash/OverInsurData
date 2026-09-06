// ── Extended Appointment Records ──────────────────────────────────────────────

export interface AppointmentRecord {
  id: string
  channelId: string
  channelName: string
  channelNpn: string
  insurerId: string
  insurerName: string
  insurerShort: string
  state: string
  line: string
  status: 'approved' | 'pending' | 'rejected' | 'expired' | 'terminated' | 'under-review'
  submittedDate: string
  approvedDate?: string
  expiryDate: string
  terminatedDate?: string
  terminationReason?: string
  terminationReasonEn?: string
  renewalStatus?: 'not-due' | 'due-soon' | 'in-progress' | 'renewed'
  daysToExpiry: number
  submittedBy: string
  processingDays?: number
  rejectionReason?: string
  rejectionReasonEn?: string
  niprTransactionId?: string
}

export const appointmentRecords: AppointmentRecord[] = [
  { id: 'ap1', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-02-20', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Sarah Chen', processingDays: 36, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-04581' },
  { id: 'ap2', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-03-01', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Sarah Chen', processingDays: 44, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-04622' },
  { id: 'ap3', channelId: 'c2', channelName: 'Lone Star Brokerage', channelNpn: 'NPN23459012', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'TX', line: 'P&C', status: 'approved', submittedDate: '2023-03-10', approvedDate: '2023-04-15', expiryDate: '2026-09-30', daysToExpiry: 39, submittedBy: 'James Rodriguez', processingDays: 36, renewalStatus: 'in-progress', niprTransactionId: 'NIPR-2023-07234' },
  { id: 'ap4', channelId: 'c4', channelName: 'Empire State Insurance Services', channelNpn: 'NPN45671234', insurerId: '2', insurerName: 'Liberty Mutual', insurerShort: 'Liberty Mutual', state: 'NY', line: 'Auto', status: 'pending', submittedDate: '2026-07-20', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Emily Johnson', renewalStatus: 'not-due' },
  { id: 'ap5', channelId: 'c5', channelName: 'Sunshine State Brokers', channelNpn: 'NPN56782345', insurerId: '5', insurerName: 'AIG', insurerShort: 'AIG', state: 'FL', line: 'Professional', status: 'under-review', submittedDate: '2026-08-01', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Carlos Martinez', renewalStatus: 'not-due' },
  { id: 'ap6', channelId: 'c10', channelName: 'Northeast Professional Services', channelNpn: 'NPN01237890', insurerId: '8', insurerName: 'Hartford', insurerShort: 'Hartford', state: 'CT', line: 'Commercial', status: 'expired', submittedDate: '2023-06-01', approvedDate: '2023-07-15', expiryDate: '2026-07-14', daysToExpiry: -39, submittedBy: 'Tom Anderson', processingDays: 44, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2023-12890' },
  { id: 'ap7', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', channelNpn: 'NPN34560123', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', state: 'IL', line: 'Auto', status: 'approved', submittedDate: '2023-05-10', approvedDate: '2023-06-20', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Michael Wu', processingDays: 41, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-09812' },
  { id: 'ap8', channelId: 'c9', channelName: 'Southwest Insurance Network', channelNpn: 'NPN90126789', insurerId: '6', insurerName: 'Zurich', insurerShort: 'Zurich', state: 'AZ', line: 'Commercial', status: 'pending', submittedDate: '2026-08-10', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Lisa Wang', renewalStatus: 'not-due' },
  { id: 'ap9', channelId: 'c2', channelName: 'Lone Star Brokerage', channelNpn: 'NPN23459012', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', state: 'TX', line: 'Specialty', status: 'approved', submittedDate: '2024-02-01', approvedDate: '2024-03-15', expiryDate: '2027-03-14', daysToExpiry: 570, submittedBy: 'James Rodriguez', processingDays: 43, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2024-02341' },
  { id: 'ap10', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'WA', line: 'Auto', status: 'rejected', submittedDate: '2026-06-01', expiryDate: '', daysToExpiry: 0, submittedBy: 'Sarah Chen', rejectionReason: '申请人 WA 州牌照未激活，需先完成牌照激活', rejectionReasonEn: "Applicant's WA state license is not active; license activation must be completed first" },
  { id: 'ap11', channelId: 'c6', channelName: 'Midwest Specialty Risk', channelNpn: 'NPN67893456', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', state: 'OH', line: 'Commercial', status: 'approved', submittedDate: '2024-04-01', approvedDate: '2024-05-10', expiryDate: '2027-05-09', daysToExpiry: 625, submittedBy: 'David Kim', processingDays: 39, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2024-04512' },
  { id: 'ap12', channelId: 'c7', channelName: 'Rocky Mountain Insurance Advisors', channelNpn: 'NPN78904567', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'CO', line: 'Auto', status: 'terminated', submittedDate: '2022-09-01', approvedDate: '2022-10-15', expiryDate: '2025-10-14', terminatedDate: '2025-08-20', daysToExpiry: -12, submittedBy: 'Jennifer Park', processingDays: 44, terminationReason: '渠道主动申请终止', terminationReasonEn: 'Termination requested by the channel', renewalStatus: 'not-due' },
]

// ── NIPR License Records ───────────────────────────────────────────────────────

export type LicenseStatus = 'active' | 'inactive' | 'expired' | 'suspended' | 'pending' | 'cancelled'

export interface NIPRLicense {
  id: string
  channelId: string
  channelName: string
  npnNumber: string
  licenseNumber: string
  state: string
  licenseType: 'Producer' | 'Adjuster' | 'Surplus Lines' | 'Variable Products'
  lines: string[]
  status: LicenseStatus
  issueDate: string
  expiryDate: string
  daysToExpiry: number
  lastVerified: string
  verificationStatus: 'verified' | 'mismatch' | 'not-found' | 'pending'
  residencyState: string
  ceCompleted?: boolean
  ceHoursRequired?: number
  ceHoursCompleted?: number
}

export const niprLicenses: NIPRLicense[] = [
  { id: 'nl1', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', npnNumber: 'NPN12348901', licenseNumber: 'CA-0I12345', state: 'CA', licenseType: 'Producer', lines: ['P&C', 'Life', 'Health', 'Variable'], status: 'active', issueDate: '2015-03-01', expiryDate: '2026-05-31', daysToExpiry: -83, lastVerified: '2026-08-20', verificationStatus: 'mismatch', residencyState: 'CA', ceCompleted: false, ceHoursRequired: 24, ceHoursCompleted: 18 },
  { id: 'nl2', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', npnNumber: 'NPN12348901', licenseNumber: 'TX-1234567', state: 'TX', licenseType: 'Producer', lines: ['P&C', 'Life'], status: 'active', issueDate: '2018-07-15', expiryDate: '2026-11-14', daysToExpiry: 84, lastVerified: '2026-08-20', verificationStatus: 'verified', residencyState: 'CA', ceCompleted: true, ceHoursRequired: 24, ceHoursCompleted: 24 },
  { id: 'nl3', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', npnNumber: 'NPN12348901', licenseNumber: 'NY-LA-234567', state: 'NY', licenseType: 'Producer', lines: ['P&C'], status: 'active', issueDate: '2019-02-01', expiryDate: '2027-01-31', daysToExpiry: 162, lastVerified: '2026-08-20', verificationStatus: 'verified', residencyState: 'CA', ceCompleted: true, ceHoursRequired: 15, ceHoursCompleted: 15 },
  { id: 'nl4', channelId: 'c2', channelName: 'Lone Star Brokerage', npnNumber: 'NPN23459012', licenseNumber: 'TX-2345678', state: 'TX', licenseType: 'Producer', lines: ['P&C', 'Life', 'Surplus Lines'], status: 'active', issueDate: '2016-05-20', expiryDate: '2026-09-19', daysToExpiry: 28, lastVerified: '2026-08-21', verificationStatus: 'verified', residencyState: 'TX', ceCompleted: false, ceHoursRequired: 24, ceHoursCompleted: 20 },
  { id: 'nl5', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', npnNumber: 'NPN34560123', licenseNumber: 'IL-10123456', state: 'IL', licenseType: 'Producer', lines: ['P&C', 'Commercial'], status: 'active', issueDate: '2017-08-01', expiryDate: '2026-10-31', daysToExpiry: 70, lastVerified: '2026-08-19', verificationStatus: 'verified', residencyState: 'IL', ceCompleted: true, ceHoursRequired: 30, ceHoursCompleted: 30 },
  { id: 'nl6', channelId: 'c10', channelName: 'Northeast Professional Services', npnNumber: 'NPN01237890', licenseNumber: 'CT-1234567', state: 'CT', licenseType: 'Producer', lines: ['P&C', 'Commercial', 'Professional'], status: 'suspended', issueDate: '2014-01-15', expiryDate: '2026-12-31', daysToExpiry: 131, lastVerified: '2026-08-15', verificationStatus: 'mismatch', residencyState: 'CT', ceCompleted: false, ceHoursRequired: 24, ceHoursCompleted: 6 },
  { id: 'nl7', channelId: 'c5', channelName: 'Sunshine State Brokers', npnNumber: 'NPN56782345', licenseNumber: 'FL-P123456', state: 'FL', licenseType: 'Producer', lines: ['P&C', 'Life', 'Health'], status: 'active', issueDate: '2018-11-01', expiryDate: '2026-11-30', daysToExpiry: 99, lastVerified: '2026-08-22', verificationStatus: 'verified', residencyState: 'FL', ceCompleted: true, ceHoursRequired: 24, ceHoursCompleted: 24 },
  { id: 'nl8', channelId: 'c4', channelName: 'Empire State Insurance Services', npnNumber: 'NPN45671234', licenseNumber: 'NY-PC-345678', state: 'NY', licenseType: 'Producer', lines: ['P&C', 'Auto', 'Specialty'], status: 'active', issueDate: '2019-06-15', expiryDate: '2027-06-14', daysToExpiry: 296, lastVerified: '2026-08-20', verificationStatus: 'verified', residencyState: 'NY', ceCompleted: false, ceHoursRequired: 15, ceHoursCompleted: 8 },
  { id: 'nl9', channelId: 'c9', channelName: 'Southwest Insurance Network', npnNumber: 'NPN90126789', licenseNumber: 'AZ-1078901', state: 'AZ', licenseType: 'Producer', lines: ['P&C', 'Commercial'], status: 'pending', issueDate: '2026-03-01', expiryDate: '2028-02-28', daysToExpiry: 555, lastVerified: '2026-08-22', verificationStatus: 'pending', residencyState: 'AZ', ceCompleted: false, ceHoursRequired: 0, ceHoursCompleted: 0 },
]

// ── Compliance Interception Logs ───────────────────────────────────────────────

export type InterceptResult = 'blocked' | 'warned' | 'passed' | 'manual-review'
export type InterceptReason = 'no-appointment' | 'expired-appointment' | 'invalid-license' | 'expired-license' | 'ofac-match' | 'suspended-channel' | 'state-not-authorized'

export interface ComplianceInterception {
  id: string
  timestamp: string
  channelId: string
  channelName: string
  insurerId: string
  insurerShort: string
  state: string
  line: string
  policyDraftId: string
  customerName: string
  premiumAmount: number
  result: InterceptResult
  reasons: InterceptReason[]
  reasonDescriptions: string[]
  reasonDescriptionsEn: string[]
  reviewedBy?: string
  overrideApproved?: boolean
  overrideNote?: string
}

export const interceptLogs: ComplianceInterception[] = [
  { id: 'ic1', timestamp: '2026-08-22 14:23:11', channelId: 'c10', channelName: 'Northeast Professional Services', insurerId: '8', insurerShort: 'Hartford', state: 'CT', line: 'Commercial', policyDraftId: 'QT-2026-088421', customerName: 'Metro Logistics LLC', premiumAmount: 28500, result: 'blocked', reasons: ['expired-appointment', 'suspended-channel'], reasonDescriptions: ['Hartford CT Commercial Appointment 已于 2026-07-14 过期', '渠道合规状态：已暂停'], reasonDescriptionsEn: ['The Hartford CT Commercial appointment expired on 2026-07-14', 'Channel compliance status: suspended'] },
  { id: 'ic2', timestamp: '2026-08-22 11:08:45', channelId: 'c9', channelName: 'Southwest Insurance Network', insurerId: '6', insurerShort: 'Zurich', state: 'AZ', line: 'Commercial', policyDraftId: 'QT-2026-088398', customerName: 'Desert Solar Holdings', premiumAmount: 45200, result: 'blocked', reasons: ['no-appointment'], reasonDescriptions: ['Zurich AZ Commercial Appointment 申请审核中，尚未批准'], reasonDescriptionsEn: ['The Zurich AZ Commercial appointment is under review and has not been approved yet'] },
  { id: 'ic3', timestamp: '2026-08-22 09:31:22', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', insurerId: '1', insurerShort: 'Travelers', state: 'CA', line: 'P&C', policyDraftId: 'QT-2026-088301', customerName: 'Bay Area Tech Ventures', premiumAmount: 67800, result: 'warned', reasons: ['expired-license'], reasonDescriptions: ['CA 牌照已于 2026-05-31 到期，需立即续期'], reasonDescriptionsEn: ['The CA license expired on 2026-05-31 and must be renewed immediately'] },
  { id: 'ic4', timestamp: '2026-08-21 16:44:10', channelId: 'c2', channelName: 'Lone Star Brokerage', insurerId: '1', insurerShort: 'Travelers', state: 'TX', line: 'P&C', policyDraftId: 'QT-2026-087912', customerName: 'Gulf Coast Energy Partners', premiumAmount: 112000, result: 'manual-review', reasons: ['ofac-match'], reasonDescriptions: ['客户名称与 OFAC SDN 列表存在模糊匹配（相似度 78%），需人工确认'], reasonDescriptionsEn: ['Fuzzy match between the customer name and the OFAC SDN list (78% similarity) — manual confirmation required'] },
  { id: 'ic5', timestamp: '2026-08-21 10:12:33', channelId: 'c7', channelName: 'Rocky Mountain Insurance Advisors', insurerId: '1', insurerShort: 'Travelers', state: 'CO', line: 'Auto', policyDraftId: 'QT-2026-087654', customerName: 'Summit Fleet Services', premiumAmount: 18900, result: 'blocked', reasons: ['expired-appointment', 'state-not-authorized'], reasonDescriptions: ['Travelers CO Auto Appointment 已终止', 'CO 州非授权经营区域'], reasonDescriptionsEn: ['The Travelers CO Auto appointment has been terminated', 'CO is outside the authorized operating territory'] },
  { id: 'ic6', timestamp: '2026-08-20 15:30:08', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', insurerId: '3', insurerShort: 'Nationwide', state: 'IL', line: 'Auto', policyDraftId: 'QT-2026-087321', customerName: 'Chicago Fleet Leasing', premiumAmount: 34100, result: 'passed', reasons: [], reasonDescriptions: [], reasonDescriptionsEn: [] },
  { id: 'ic7', timestamp: '2026-08-20 09:45:22', channelId: 'c5', channelName: 'Sunshine State Brokers', insurerId: '5', insurerShort: 'AIG', state: 'FL', line: 'Professional', policyDraftId: 'QT-2026-087198', customerName: 'Coastal Medical Associates', premiumAmount: 89600, result: 'warned', reasons: ['no-appointment'], reasonDescriptions: ['AIG FL Professional Appointment 申请正在审核（预计 5 工作日内审批）'], reasonDescriptionsEn: ['The AIG FL Professional appointment is under review (approval expected within 5 business days)'] },
]

// ── Compliance Rules ───────────────────────────────────────────────────────────

export interface ComplianceRule {
  id: string
  name: string
  nameEn: string
  category: 'appointment' | 'license' | 'ofac' | 'channel' | 'product'
  condition: string
  conditionEn?: string
  action: 'block' | 'warn' | 'require-review'
  enabled: boolean
  priority: number
  triggeredCount: number
  lastTriggered?: string
}

export const complianceRules: ComplianceRule[] = [
  { id: 'cr1', name: 'Appointment 必须有效', nameEn: 'Valid appointment required', category: 'appointment', condition: '出单时检查渠道-保险公司-州-业务线的 Appointment 状态 = approved', conditionEn: 'At binding time, verify that the channel-insurer-state-line appointment status = approved', action: 'block', enabled: true, priority: 1, triggeredCount: 47, lastTriggered: '2026-08-22' },
  { id: 'cr2', name: 'Appointment 到期拦截', nameEn: 'Expired appointment block', category: 'appointment', condition: 'Appointment.expiryDate < today', action: 'block', enabled: true, priority: 2, triggeredCount: 23, lastTriggered: '2026-08-22' },
  { id: 'cr3', name: '牌照有效性检查', nameEn: 'License validity check', category: 'license', condition: '渠道对应州牌照 status IN (active, pending)', conditionEn: 'Channel license in the application state has status IN (active, pending)', action: 'block', enabled: true, priority: 3, triggeredCount: 12, lastTriggered: '2026-08-22' },
  { id: 'cr4', name: '牌照到期警告', nameEn: 'License expiry warning', category: 'license', condition: 'license.daysToExpiry BETWEEN 0 AND 30', action: 'warn', enabled: true, priority: 4, triggeredCount: 8, lastTriggered: '2026-08-21' },
  { id: 'cr5', name: 'OFAC SDN 精确匹配拦截', nameEn: 'OFAC SDN exact match block', category: 'ofac', condition: 'customer.name EXACT_MATCH OFAC SDN list', action: 'block', enabled: true, priority: 1, triggeredCount: 2, lastTriggered: '2026-07-18' },
  { id: 'cr6', name: 'OFAC 模糊匹配人工审核', nameEn: 'OFAC fuzzy match manual review', category: 'ofac', condition: 'OFAC similarity_score >= 75%', action: 'require-review', enabled: true, priority: 2, triggeredCount: 9, lastTriggered: '2026-08-21' },
  { id: 'cr7', name: '暂停渠道拦截', nameEn: 'Suspended channel block', category: 'channel', condition: 'channel.status = suspended', action: 'block', enabled: true, priority: 1, triggeredCount: 18, lastTriggered: '2026-08-22' },
  { id: 'cr8', name: 'Non-Admitted 产品州授权', nameEn: 'Non-admitted product state authorization', category: 'product', condition: 'product.type = Non-Admitted AND state NOT IN product.states', action: 'block', enabled: true, priority: 2, triggeredCount: 6, lastTriggered: '2026-08-18' },
]

// ── OFAC Screening ────────────────────────────────────────────────────────────

export type OFACResult = 'clear' | 'watchlist' | 'blocked' | 'pending'

export interface OFACScreening {
  id: string
  timestamp: string
  entityName: string
  entityType: 'Individual' | 'Company' | 'Vessel' | 'Aircraft'
  screenedBy: string
  result: OFACResult
  matchScore?: number
  matchedEntry?: string
  matchedList?: string
  policyId?: string
  reviewedBy?: string
  reviewNote?: string
  reviewNoteEn?: string
  overrideApproved?: boolean
}

export const ofacScreenings: OFACScreening[] = [
  { id: 'of1', timestamp: '2026-08-22 11:08:02', entityName: 'Desert Solar Holdings', entityType: 'Company', screenedBy: 'System Auto', result: 'clear', policyId: 'QT-2026-088398' },
  { id: 'of2', timestamp: '2026-08-21 16:44:00', entityName: 'Gulf Coast Energy Partners', entityType: 'Company', screenedBy: 'System Auto', result: 'watchlist', matchScore: 78, matchedEntry: 'Gulf Coast Energy Trading LLC', matchedList: 'SDN List', policyId: 'QT-2026-087912', reviewedBy: 'Chen Hao', reviewNote: '经人工核查，为不同实体，可放行', reviewNoteEn: 'Verified manually as a different entity — cleared to proceed', overrideApproved: true },
  { id: 'of3', timestamp: '2026-08-19 10:23:14', entityName: 'Ali Hassan Al-Rashid', entityType: 'Individual', screenedBy: 'System Auto', result: 'blocked', matchScore: 96, matchedEntry: 'ALI HASSAN AL-RASHID', matchedList: 'SDN List', reviewedBy: 'Zhang Wei', reviewNote: '确认为 SDN 制裁名单人员，拒绝出单', reviewNoteEn: 'Confirmed as an SDN-listed party — binding denied' },
  { id: 'of4', timestamp: '2026-08-18 14:11:38', entityName: 'Sunshine Logistics Inc', entityType: 'Company', screenedBy: 'System Auto', result: 'clear' },
  { id: 'of5', timestamp: '2026-08-17 09:55:22', entityName: 'Pacific Bridge Trading', entityType: 'Company', screenedBy: 'System Auto', result: 'clear' },
  { id: 'of6', timestamp: '2026-08-16 16:33:50', entityName: 'Omega Financial Services', entityType: 'Company', screenedBy: 'System Auto', result: 'watchlist', matchScore: 82, matchedEntry: 'Omega Financial LLC (Syria)', matchedList: 'SDGT List', reviewedBy: 'Liu Yang', reviewNote: '不同注册地，风险评级提升至中风险，可放行', reviewNoteEn: 'Different jurisdiction of registration — risk rating raised to medium; cleared to proceed', overrideApproved: true },
  { id: 'of7', timestamp: '2026-08-15 11:20:44', entityName: 'North Star Mining Corp', entityType: 'Company', screenedBy: 'System Auto', result: 'clear' },
  { id: 'of8', timestamp: '2026-08-14 08:44:09', entityName: 'Bay Area Tech Ventures', entityType: 'Company', screenedBy: 'System Auto', result: 'clear', policyId: 'QT-2026-088301' },
]

// ── Compliance Reports ────────────────────────────────────────────────────────

export interface ComplianceReport {
  id: string
  name: string
  nameEn: string
  type: 'appointment-status' | 'license-compliance' | 'ofac-summary' | 'interception-log' | 'renewal-calendar' | 'regulatory-filing'
  period: string
  generatedDate: string
  generatedBy: string
  status: 'ready' | 'generating' | 'scheduled' | 'failed'
  fileSize?: string
  recordCount?: number
  format: 'PDF' | 'Excel' | 'CSV'
  recipients?: string[]
}

export const complianceReports: ComplianceReport[] = [
  { id: 'rp1', name: 'Appointment 状态月报 — 2026年8月', nameEn: 'Appointment Status Monthly Report — August 2026', type: 'appointment-status', period: '2026-08', generatedDate: '2026-08-20 08:00', generatedBy: 'System Auto', status: 'ready', fileSize: '2.1 MB', recordCount: 124, format: 'Excel', recipients: ['compliance@company.com'] },
  { id: 'rp2', name: '牌照合规检查报告 — Q3 2026', nameEn: 'License Compliance Review Report — Q3 2026', type: 'license-compliance', period: '2026-Q3', generatedDate: '2026-08-15 09:30', generatedBy: 'Zhang Wei', status: 'ready', fileSize: '1.8 MB', recordCount: 89, format: 'PDF', recipients: ['compliance@company.com', 'legal@company.com'] },
  { id: 'rp3', name: 'OFAC 筛查月度摘要 — 2026年8月', nameEn: 'OFAC Screening Monthly Summary — August 2026', type: 'ofac-summary', period: '2026-08', generatedDate: '2026-08-21 16:45', generatedBy: 'System Auto', status: 'ready', fileSize: '0.9 MB', recordCount: 248, format: 'PDF' },
  { id: 'rp4', name: '出单合规拦截日志 — 本周', nameEn: 'Binding Compliance Interception Log — This Week', type: 'interception-log', period: '2026-W34', generatedDate: '2026-08-22 07:00', generatedBy: 'System Auto', status: 'ready', fileSize: '0.4 MB', recordCount: 7, format: 'Excel' },
  { id: 'rp5', name: 'Appointment 续期日历 — 2026 Q4', nameEn: 'Appointment Renewal Calendar — Q4 2026', type: 'renewal-calendar', period: '2026-Q4', generatedDate: '2026-08-01 10:00', generatedBy: 'Sarah Chen', status: 'ready', fileSize: '1.2 MB', recordCount: 31, format: 'PDF' },
  { id: 'rp6', name: '监管申报报告 — 2026年8月', nameEn: 'Regulatory Filing Report — August 2026', type: 'regulatory-filing', period: '2026-08', generatedDate: '', generatedBy: 'Scheduled', status: 'scheduled', format: 'PDF' },
]

// Stable type ids; display labels are localized in the view via app.reportTypes.*.
export const REPORT_TYPES: string[] = [
  'appointment-status', 'license-compliance', 'ofac-summary',
  'interception-log', 'renewal-calendar', 'regulatory-filing',
]
