// ── Compliance Management Module ──────────────────────────────────────────────
// Strictly aligned with Figma Prototype V1.0 (appointmentComplianceData.ts)
// 功能点 27-35: Appointment 申请 / 跟踪/续期/终止 + NIPR 校验 + 合规拦截 + OFAC 筛查

import type { InsuranceCarrier } from './mockData';

// ============================================================================
// APPOINTMENT RECORDS (Channel-Insurer Authorization)
// ============================================================================

// 委任记录的生命周期状态。本系统没有任何审批流程，所以这些值不是「审批结论」，而是：
//   approved      → 已生效（委任已建立、可用于出单）
//   pending       → 待生效（已录入，生效日期未到或 NIPR 尚未回执）
//   under-review  → 处理中（NIPR / 保险公司正在录入处理）
//   rejected      → 已失效（委任未能建立，如对应州牌照未激活）
// 字段名沿用历史值以兼容既有 mock 数据与筛选逻辑，UI 文案统一走 i18n（appointment 命名空间）。
export type AppointmentStatus = 
  | 'approved'      // 已生效 / Effective
  | 'pending'       // 待生效 / Pending effective
  | 'rejected'      // 已失效 / Void
  | 'expired'       // Expired appointment
  | 'terminated'    // Terminated before expiry
  | 'under-review'  // 处理中 / Processing

export type RenewalStatus = 
  | 'not-due'       // Not due yet
  | 'due-soon'      // Due within 90 days
  | 'in-progress'   // Renewal process started
  | 'renewed'       // Already renewed

export interface AppointmentRecord {
  id: string                      // ap1, ap2...
  channelId: string               // Foreign key to channel organization
  channelName: string             // Cached for quick view
  channelNpn: string              // NPN license number
  insurerId: string               // Foreign key to carrier
  insurerName: string             // Full carrier name
  insurerShort: string            // Shortened name
  state: string                   // US state code (CA, NY, TX...)
  line: string                    // Line of business (P&C, Auto, Commercial...)
  status: AppointmentStatus
  submittedDate: string           // ISO date format
  approvedDate?: string           // 生效日期（UI 显示为「生效日期 / Effective Date」）；pending / rejected 时为空
  expiryDate: string              // ISO date format
  terminatedDate?: string         // If terminated
  terminationReason?: string      // Reason for termination
  renewalStatus?: RenewalStatus   // not-due/due-soon/in-progress/renewed
  daysToExpiry: number            // Days until expiry (negative if expired)
  submittedBy: string             // Name who submitted
  processingDays?: number         // Actual processing duration
  rejectionReason?: string        // If rejected
  niprTransactionId?: string      // NIPR transaction reference
}

// ============================================================================
// NIPR LICENSES
// ============================================================================

export type LicenseStatus = 
  | 'active'    // Active and valid
  | 'inactive'  // Inactive but not expired
  | 'expired'   // Expired
  | 'suspended' // Suspended by state
  | 'pending'   // Pending verification
  | 'cancelled' // Cancelled

export type VerificationStatus = 
  | 'verified'     // Successfully verified
  | 'mismatch'     // Data mismatch detected
  | 'not-found'    // Not found in NIPR database
  | 'pending'      // Pending verification

export interface NIPRLicense {
  id: string                  // nl1, nl2...
  channelId: string           // Foreign key to channel
  channelName: string         // Cached for quick view
  npnNumber: string           // NPN license number
  licenseNumber: string       // State-specific license number
  state: string               // US state code
  licenseType: 'Producer' | 'Adjuster' | 'Surplus Lines' | 'Variable Products'
  lines: string[]             // Authorized lines of business
  status: LicenseStatus
  issueDate: string           // ISO date format
  expiryDate: string          // ISO date format
  daysToExpiry: number        // Days until expiry (negative if expired)
  lastVerified: string        // Last verification date
  verificationStatus: VerificationStatus
  residencyState: string      // Resident state
  ceCompleted?: boolean       // Continuing education completed
  ceHoursRequired?: number    // Required CE hours
  ceHoursCompleted?: number   // Completed CE hours
}

// ============================================================================
// COMPLIANCE INTERCEPTION LOGS
// ============================================================================

export type InterceptResult = 'blocked' | 'warned' | 'passed' | 'manual-review' | 'allowed' | 'flagged'
export type InterceptReason = 
  | 'no-appointment'           // No valid appointment
  | 'expired-appointment'      // Appointment expired
  | 'invalid-license'          // Invalid or suspended license
  | 'expired-license'          // License expired
  | 'ofac-match'               // OFAC SDN match
  | 'suspended-channel'        // Channel suspended
  | 'state-not-authorized'     // State not authorized

export interface ComplianceInterception {
  id: string                // ic1, ic2...
  timestamp: string         // YYYY-MM-DD HH:MM:SS
  channelId: string         // Foreign key to channel
  channelName: string       // Cached for quick view
  insurerId: string         // Foreign key to carrier
  insurerShort: string      // Shortened name
  state: string             // US state code
  line: string              // Line of business
  policyDraftId: string     // Policy draft being processed
  customerName: string      // Customer/policyholder name
  premiumAmount: number     // Premium amount in USD
  result: InterceptResult   // blocked/warned/passed/manual-review
  reasons: InterceptReason[] // Multiple reasons possible
  reasonDescriptions: string[] // Chinese descriptions for UI
  reason?: InterceptReason  // Primary reason (legacy single-value field)
  severity?: 'critical' | 'high' | 'medium' | 'low' // Risk severity
  actionType?: string       // Action taken by the system
  matchedEntity?: string    // Matched OFAC/compliance entity
  listSource?: string       // Sanctions list source
  matchScore?: number       // Similarity score (0-100)
  channelNpn?: string       // Channel NPN license number
  lineOfAuthority?: string  // Line of authority
  rejectionDetail?: string  // Detailed rejection explanation
  releasedAt?: string       // Release timestamp (if released)
  releaseNote?: string      // Release justification
  reviewedAt?: string       // Review timestamp (if reviewed)
  reviewedBy?: string       // If manually reviewed
  overrideApproved?: boolean // If override approved
  overrideNote?: string     // Override justification
}

// ============================================================================
// COMPLIANCE RULES
// ============================================================================

export type RuleCategory = 'appointment' | 'license' | 'ofac' | 'channel' | 'product'
export type RuleAction = 'block' | 'warn' | 'require-review'

export interface ComplianceRule {
  id: string              // cr1, cr2...
  name: string            // Rule name (Chinese)
  nameEn: string          // Rule name (English)
  category: RuleCategory  // appointment/license/ofac/channel/product
  condition: string       // Rule condition (Chinese)
  conditionEn: string     // Rule condition (English)
  action: RuleAction      // block/warn/require-review
  enabled: boolean        // Is rule active
  priority: number        // Priority (lower = higher priority)
  triggeredCount: number  // Total triggers
  lastTriggered?: string  // ISO date
}

// ============================================================================
// OFAC SCREENINGS
// ============================================================================

export type OFACResult = 'clear' | 'watchlist' | 'blocked' | 'pending'

// Sanction list sources
type SanctionListSource = 
  | 'SDN'           // Specially Designated Nationals List
  | 'CONSOLIDATED'   // Consolidated Sanctions List
  | 'SDGT'           // Global Terrorism Sanctions
  | 'IRAN'           // Iran Sanctions
  | 'CYBER2'         // Cyber-related Sanctions
  | 'FOREIGN SANCTIONS MAGNITSKY ACT' // Magnitsky Sanctions
  | 'SSI'            // Sectoral Sanctions Identification List
  | 'NONSDN'         // Non-SDN List

// Sanction match details
export interface SanctionMatch {
  id: string                    // match1, match2...
  screeningId: string           // Parent screening ID
  sourceList: SanctionListSource
  matchedName: string           // Name on sanctions list
  alias?: string[]              // Alternative names
  program: string[]             // Sanctions program names
  score: number                 // Similarity score (0-100)
  scoreLevel: 'low' | 'medium' | 'high' | 'exact'
  attributes: {
    name: string
    dob?: string               // Date of birth
    idNumber?: string          // Passport, SSN, Tax ID
    nationality?: string[]     // Nationality/Citizenship
    address?: string           // Address
    companyType?: string       // LLC, Corp, etc.
    registrationPlace?: string // Place of incorporation
    vesselFlag?: string        // Ship flag for vessels
    imoNumber?: string           // IMO number for ships
  }
  additionalInfo?: string       // Additional description
  effectiveDate?: string       // When sanctions imposed
  expirationDate?: string      // When sanctions expire
}

// Match review decision
type MatchReviewDecision = 'false-positive' | 'true-positive' | 'needs-investigation'

export interface MatchReview {
  id: string                    // Review ID
  screeningId: string           // Screening ID being reviewed
  matchId: string               // Specific match being reviewed
  decision: MatchReviewDecision
  reviewerName: string          // Name of person conducting review
  reviewDate: string           // ISO datetime of review
  reasoning: string            // Detailed reasoning for decision
  supportingEvidence?: string[] // Supporting documents/notes
  approvalChain?: string[]     // Approvers in chain (for true-positive)
  createdAt: string            // Creation timestamp
  updatedAt?: string           // Last update timestamp
}

export interface OFACScreening {
  id: string          // of1, of2...
  timestamp: string   // YYYY-MM-DD HH:MM:SS
  entityName: string  // Entity being screened
  entityType: 'Individual' | 'Company' | 'Vessel' | 'Aircraft'
  country?: string[]            // Country/Nationality (can be multiple)
  dateOfBirth?: string          // DOB for individuals
  dateRegistered?: string       // Registration date for companies
  identificationNumber?: string // Passport number, Tax ID, etc.
  address?: string              // Physical address
  vesselFlag?: string           // Ship flag for vessels
  imoNumber?: string            // IMO number for ships
  screenedBy: string  // "System Auto" or human name
  result: OFACResult  // clear/watchlist/blocked/pending
  matchScore?: number // Similarity score (0-100)
  matchScoreLevel?: 'low' | 'medium' | 'high' | 'exact'
  matchedEntry?: string  // Matched entry name
  matchedList?: string   // SDN List, SDGT List, etc.
  program?: string[]     // Sanctions program names
  policyId?: string    // Related policy ID
  reviewedBy?: string  // If manually reviewed
  reviewNote?: string  // Review notes
  overrideApproved?: boolean // If override approved
  reviewDate?: string  // Date of manual review
}

// ============================================================================
// COMPLIANCE REPORTS
// ============================================================================

export type ReportType = 
  | 'appointment-status'  // Appointment status report
  | 'license-compliance'  // License compliance check
  | 'ofac-summary'        // OFAC screening summary
  | 'interception-log'    // Interception logs
  | 'renewal-calendar'    // Renewal calendar
  | 'regulatory-filing'   // Regulatory filing

export interface ComplianceReport {
  id: string            // rp1, rp2...
  name: string          // Report name (Chinese)
  type: ReportType
  period: string        // Period (YYYY-MM, YYYY-Q#, YYYY-W##)
  generatedDate: string // ISO date or datetime
  generatedBy: string   // "System Auto" or user name
  status: 'ready' | 'generating' | 'scheduled' | 'failed'
  fileSize?: string     // File size (e.g., "2.1 MB")
  recordCount?: number  // Number of records
  format: 'PDF' | 'Excel' | 'CSV'
  recipients?: string[] // Email recipients
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

export function generateMockAppointmentRecords(): AppointmentRecord[] {
  return [
    // 已生效委任（6 条）
    {
      id: 'ap1',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      channelNpn: 'NPN12348901',
      insurerId: '1',
      insurerName: 'Travelers',
      insurerShort: 'Travelers',
      state: 'CA',
      line: 'P&C',
      status: 'approved',
      submittedDate: '2023-01-15',
      approvedDate: '2023-02-20',
      expiryDate: '2026-12-31',
      daysToExpiry: 131,
      submittedBy: 'Sarah Chen',
      processingDays: 36,
      renewalStatus: 'due-soon',
      niprTransactionId: 'NIPR-2023-04581',
    },
    {
      id: 'ap2',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      channelNpn: 'NPN12348901',
      insurerId: '4',
      insurerName: 'Chubb',
      insurerShort: 'Chubb',
      state: 'CA',
      line: 'P&C',
      status: 'approved',
      submittedDate: '2023-01-15',
      approvedDate: '2023-03-01',
      expiryDate: '2026-12-31',
      daysToExpiry: 131,
      submittedBy: 'Sarah Chen',
      processingDays: 44,
      renewalStatus: 'due-soon',
      niprTransactionId: 'NIPR-2023-04622',
    },
    {
      id: 'ap3',
      channelId: 'c2',
      channelName: 'Lone Star Brokerage',
      channelNpn: 'NPN23459012',
      insurerId: '1',
      insurerName: 'Travelers',
      insurerShort: 'Travelers',
      state: 'TX',
      line: 'P&C',
      status: 'approved',
      submittedDate: '2023-03-10',
      approvedDate: '2023-04-15',
      expiryDate: '2026-09-30',
      daysToExpiry: 39,
      submittedBy: 'James Rodriguez',
      processingDays: 36,
      renewalStatus: 'in-progress',
      niprTransactionId: 'NIPR-2023-07234',
    },
    {
      id: 'ap7',
      channelId: 'c3',
      channelName: 'Great Lakes Insurance Partners',
      channelNpn: 'NPN34560123',
      insurerId: '3',
      insurerName: 'Nationwide',
      insurerShort: 'Nationwide',
      state: 'IL',
      line: 'Auto',
      status: 'approved',
      submittedDate: '2023-05-10',
      approvedDate: '2023-06-20',
      expiryDate: '2026-12-31',
      daysToExpiry: 131,
      submittedBy: 'Michael Wu',
      processingDays: 41,
      renewalStatus: 'due-soon',
      niprTransactionId: 'NIPR-2023-09812',
    },
    {
      id: 'ap9',
      channelId: 'c2',
      channelName: 'Lone Star Brokerage',
      channelNpn: 'NPN23459012',
      insurerId: '4',
      insurerName: 'Chubb',
      insurerShort: 'Chubb',
      state: 'TX',
      line: 'Specialty',
      status: 'approved',
      submittedDate: '2024-02-01',
      approvedDate: '2024-03-15',
      expiryDate: '2027-03-14',
      daysToExpiry: 570,
      submittedBy: 'James Rodriguez',
      processingDays: 43,
      renewalStatus: 'not-due',
      niprTransactionId: 'NIPR-2024-02341',
    },
    {
      id: 'ap11',
      channelId: 'c6',
      channelName: 'Midwest Specialty Risk',
      channelNpn: 'NPN67893456',
      insurerId: '3',
      insurerName: 'Nationwide',
      insurerShort: 'Nationwide',
      state: 'OH',
      line: 'Commercial',
      status: 'approved',
      submittedDate: '2024-04-01',
      approvedDate: '2024-05-10',
      expiryDate: '2027-05-09',
      daysToExpiry: 625,
      submittedBy: 'David Kim',
      processingDays: 39,
      renewalStatus: 'not-due',
      niprTransactionId: 'NIPR-2024-04512',
    },
    
    // 待生效（2 条）
    {
      id: 'ap4',
      channelId: 'c4',
      channelName: 'Empire State Insurance Services',
      channelNpn: 'NPN45671234',
      insurerId: '2',
      insurerName: 'Liberty Mutual',
      insurerShort: 'Liberty Mutual',
      state: 'NY',
      line: 'Auto',
      status: 'pending',
      submittedDate: '2026-07-20',
      expiryDate: '2027-12-31',
      daysToExpiry: 496,
      submittedBy: 'Emily Johnson',
      renewalStatus: 'not-due',
    },
    {
      id: 'ap8',
      channelId: 'c9',
      channelName: 'Southwest Insurance Network',
      channelNpn: 'NPN90126789',
      insurerId: '6',
      insurerName: 'Zurich',
      insurerShort: 'Zurich',
      state: 'AZ',
      line: 'Commercial',
      status: 'pending',
      submittedDate: '2026-08-10',
      expiryDate: '2027-12-31',
      daysToExpiry: 496,
      submittedBy: 'Lisa Wang',
      renewalStatus: 'not-due',
    },
    
    // 处理中（1 条）
    {
      id: 'ap5',
      channelId: 'c5',
      channelName: 'Sunshine State Brokers',
      channelNpn: 'NPN56782345',
      insurerId: '5',
      insurerName: 'AIG',
      insurerShort: 'AIG',
      state: 'FL',
      line: 'Professional',
      status: 'under-review',
      submittedDate: '2026-08-01',
      expiryDate: '2027-12-31',
      daysToExpiry: 496,
      submittedBy: 'Carlos Martinez',
      renewalStatus: 'not-due',
    },
    
    // Expired (1 record)
    {
      id: 'ap6',
      channelId: 'c10',
      channelName: 'Northeast Professional Services',
      channelNpn: 'NPN01237890',
      insurerId: '8',
      insurerName: 'Hartford',
      insurerShort: 'Hartford',
      state: 'CT',
      line: 'Commercial',
      status: 'expired',
      submittedDate: '2023-06-01',
      approvedDate: '2023-07-15',
      expiryDate: '2026-07-14',
      daysToExpiry: -39,
      submittedBy: 'Tom Anderson',
      processingDays: 44,
      renewalStatus: 'not-due',
      niprTransactionId: 'NIPR-2023-12890',
    },
    
    // 已失效（1 条）
    {
      id: 'ap10',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      channelNpn: 'NPN12348901',
      insurerId: '1',
      insurerName: 'Travelers',
      insurerShort: 'Travelers',
      state: 'WA',
      line: 'Auto',
      status: 'rejected',
      submittedDate: '2026-06-01',
      expiryDate: '',
      daysToExpiry: 0,
      submittedBy: 'Sarah Chen',
      rejectionReason: '申请人 WA 州牌照未激活，需先完成牌照激活',
    },
    
    // Terminated (1 record)
    {
      id: 'ap12',
      channelId: 'c7',
      channelName: 'Rocky Mountain Insurance Advisors',
      channelNpn: 'NPN78904567',
      insurerId: '1',
      insurerName: 'Travelers',
      insurerShort: 'Travelers',
      state: 'CO',
      line: 'Auto',
      status: 'terminated',
      submittedDate: '2022-09-01',
      approvedDate: '2022-10-15',
      expiryDate: '2025-10-14',
      terminatedDate: '2025-08-20',
      daysToExpiry: -12,
      submittedBy: 'Jennifer Park',
      processingDays: 44,
      terminationReason: '渠道主动申请终止',
      renewalStatus: 'not-due',
    },
  ]
}

export function generateMockNIPRLicenses(): NIPRLicense[] {
  return [
    {
      id: 'nl1',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      npnNumber: 'NPN12348901',
      licenseNumber: 'CA-0I12345',
      state: 'CA',
      licenseType: 'Producer',
      lines: ['P&C', 'Life', 'Health', 'Variable'],
      status: 'active',
      issueDate: '2015-03-01',
      expiryDate: '2026-05-31',
      daysToExpiry: -83,
      lastVerified: '2026-08-20',
      verificationStatus: 'mismatch',
      residencyState: 'CA',
      ceCompleted: false,
      ceHoursRequired: 24,
      ceHoursCompleted: 18,
    },
    {
      id: 'nl2',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      npnNumber: 'NPN12348901',
      licenseNumber: 'TX-1234567',
      state: 'TX',
      licenseType: 'Producer',
      lines: ['P&C', 'Life'],
      status: 'active',
      issueDate: '2018-07-15',
      expiryDate: '2026-11-14',
      daysToExpiry: 84,
      lastVerified: '2026-08-20',
      verificationStatus: 'verified',
      residencyState: 'CA',
      ceCompleted: true,
      ceHoursRequired: 24,
      ceHoursCompleted: 24,
    },
    {
      id: 'nl3',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      npnNumber: 'NPN12348901',
      licenseNumber: 'NY-LA-234567',
      state: 'NY',
      licenseType: 'Producer',
      lines: ['P&C'],
      status: 'active',
      issueDate: '2019-02-01',
      expiryDate: '2027-01-31',
      daysToExpiry: 162,
      lastVerified: '2026-08-20',
      verificationStatus: 'verified',
      residencyState: 'CA',
      ceCompleted: true,
      ceHoursRequired: 15,
      ceHoursCompleted: 15,
    },
    {
      id: 'nl4',
      channelId: 'c2',
      channelName: 'Lone Star Brokerage',
      npnNumber: 'NPN23459012',
      licenseNumber: 'TX-2345678',
      state: 'TX',
      licenseType: 'Producer',
      lines: ['P&C', 'Life', 'Surplus Lines'],
      status: 'active',
      issueDate: '2016-05-20',
      expiryDate: '2026-09-19',
      daysToExpiry: 28,
      lastVerified: '2026-08-21',
      verificationStatus: 'verified',
      residencyState: 'TX',
      ceCompleted: false,
      ceHoursRequired: 24,
      ceHoursCompleted: 20,
    },
    {
      id: 'nl5',
      channelId: 'c3',
      channelName: 'Great Lakes Insurance Partners',
      npnNumber: 'NPN34560123',
      licenseNumber: 'IL-10123456',
      state: 'IL',
      licenseType: 'Producer',
      lines: ['P&C', 'Commercial'],
      status: 'active',
      issueDate: '2017-08-01',
      expiryDate: '2026-10-31',
      daysToExpiry: 70,
      lastVerified: '2026-08-19',
      verificationStatus: 'verified',
      residencyState: 'IL',
      ceCompleted: true,
      ceHoursRequired: 30,
      ceHoursCompleted: 30,
    },
    {
      id: 'nl6',
      channelId: 'c10',
      channelName: 'Northeast Professional Services',
      npnNumber: 'NPN01237890',
      licenseNumber: 'CT-1234567',
      state: 'CT',
      licenseType: 'Producer',
      lines: ['P&C', 'Commercial', 'Professional'],
      status: 'suspended',
      issueDate: '2014-01-15',
      expiryDate: '2026-12-31',
      daysToExpiry: 131,
      lastVerified: '2026-08-15',
      verificationStatus: 'mismatch',
      residencyState: 'CT',
      ceCompleted: false,
      ceHoursRequired: 24,
      ceHoursCompleted: 6,
    },
    {
      id: 'nl7',
      channelId: 'c5',
      channelName: 'Sunshine State Brokers',
      npnNumber: 'NPN56782345',
      licenseNumber: 'FL-P123456',
      state: 'FL',
      licenseType: 'Producer',
      lines: ['P&C', 'Life', 'Health'],
      status: 'active',
      issueDate: '2018-11-01',
      expiryDate: '2026-11-30',
      daysToExpiry: 99,
      lastVerified: '2026-08-22',
      verificationStatus: 'verified',
      residencyState: 'FL',
      ceCompleted: true,
      ceHoursRequired: 24,
      ceHoursCompleted: 24,
    },
    {
      id: 'nl8',
      channelId: 'c4',
      channelName: 'Empire State Insurance Services',
      npnNumber: 'NPN45671234',
      licenseNumber: 'NY-PC-345678',
      state: 'NY',
      licenseType: 'Producer',
      lines: ['P&C', 'Auto', 'Specialty'],
      status: 'active',
      issueDate: '2019-06-15',
      expiryDate: '2027-06-14',
      daysToExpiry: 296,
      lastVerified: '2026-08-20',
      verificationStatus: 'verified',
      residencyState: 'NY',
      ceCompleted: false,
      ceHoursRequired: 15,
      ceHoursCompleted: 8,
    },
    {
      id: 'nl9',
      channelId: 'c9',
      channelName: 'Southwest Insurance Network',
      npnNumber: 'NPN90126789',
      licenseNumber: 'AZ-1078901',
      state: 'AZ',
      licenseType: 'Producer',
      lines: ['P&C', 'Commercial'],
      status: 'pending',
      issueDate: '2026-03-01',
      expiryDate: '2028-02-28',
      daysToExpiry: 555,
      lastVerified: '2026-08-22',
      verificationStatus: 'pending',
      residencyState: 'AZ',
      ceCompleted: false,
      ceHoursRequired: 0,
      ceHoursCompleted: 0,
    },
  ]
}

export function generateMockComplianceInterceptions(): ComplianceInterception[] {
  return [
    {
      id: 'ic1',
      timestamp: '2026-08-22 14:23:11',
      channelId: 'c10',
      channelName: 'Northeast Professional Services',
      insurerId: '8',
      insurerShort: 'Hartford',
      state: 'CT',
      line: 'Commercial',
      policyDraftId: 'QT-2026-088421',
      customerName: 'Metro Logistics LLC',
      premiumAmount: 28500,
      result: 'blocked',
      reasons: ['expired-appointment', 'suspended-channel'],
      reasonDescriptions: ['Hartford CT Commercial Appointment 已于 2026-07-14 过期', '渠道合规状态：已暂停'],
    },
    {
      id: 'ic2',
      timestamp: '2026-08-22 11:08:45',
      channelId: 'c9',
      channelName: 'Southwest Insurance Network',
      insurerId: '6',
      insurerShort: 'Zurich',
      state: 'AZ',
      line: 'Commercial',
      policyDraftId: 'QT-2026-088398',
      customerName: 'Desert Solar Holdings',
      premiumAmount: 45200,
      result: 'blocked',
      reasons: ['no-appointment'],
      reasonDescriptions: ['Zurich AZ Commercial Appointment 尚未生效（NIPR 处理中）'],
    },
    {
      id: 'ic3',
      timestamp: '2026-08-22 09:31:22',
      channelId: 'c1',
      channelName: 'Pacific Coast Insurance Group',
      insurerId: '1',
      insurerShort: 'Travelers',
      state: 'CA',
      line: 'P&C',
      policyDraftId: 'QT-2026-088301',
      customerName: 'Bay Area Tech Ventures',
      premiumAmount: 67800,
      result: 'warned',
      reasons: ['expired-license'],
      reasonDescriptions: ['CA 牌照已于 2026-05-31 到期，需立即续期'],
    },
    {
      id: 'ic4',
      timestamp: '2026-08-21 16:44:10',
      channelId: 'c2',
      channelName: 'Lone Star Brokerage',
      insurerId: '1',
      insurerShort: 'Travelers',
      state: 'TX',
      line: 'P&C',
      policyDraftId: 'QT-2026-087912',
      customerName: 'Gulf Coast Energy Partners',
      premiumAmount: 112000,
      result: 'manual-review',
      reasons: ['ofac-match'],
      reasonDescriptions: ['客户名称与 OFAC SDN 列表存在模糊匹配（相似度 78%），需人工确认'],
    },
    {
      id: 'ic5',
      timestamp: '2026-08-21 10:12:33',
      channelId: 'c7',
      channelName: 'Rocky Mountain Insurance Advisors',
      insurerId: '1',
      insurerShort: 'Travelers',
      state: 'CO',
      line: 'Auto',
      policyDraftId: 'QT-2026-087654',
      customerName: 'Summit Fleet Services',
      premiumAmount: 18900,
      result: 'blocked',
      reasons: ['expired-appointment', 'state-not-authorized'],
      reasonDescriptions: ['Travelers CO Auto Appointment 已终止', 'CO 州非授权经营区域'],
    },
    {
      id: 'ic6',
      timestamp: '2026-08-20 15:30:08',
      channelId: 'c3',
      channelName: 'Great Lakes Insurance Partners',
      insurerId: '3',
      insurerShort: 'Nationwide',
      state: 'IL',
      line: 'Auto',
      policyDraftId: 'QT-2026-087321',
      customerName: 'Chicago Fleet Leasing',
      premiumAmount: 34100,
      result: 'passed',
      reasons: [],
      reasonDescriptions: [],
    },
    {
      id: 'ic7',
      timestamp: '2026-08-20 09:45:22',
      channelId: 'c5',
      channelName: 'Sunshine State Brokers',
      insurerId: '5',
      insurerShort: 'AIG',
      state: 'FL',
      line: 'Professional',
      policyDraftId: 'QT-2026-087198',
      customerName: 'Coastal Medical Associates',
      premiumAmount: 89600,
      result: 'warned',
      reasons: ['no-appointment'],
      reasonDescriptions: ['AIG FL Professional Appointment 正在 NIPR 处理中（预计 5 工作日内生效）'],
    },
  ]
}

export const REPORT_TYPE_LABEL: Record<string, string> = {
  'appointment-status': 'Appointment 状态', 
  'license-compliance': '牌照合规',
  'ofac-summary': 'OFAC 筛查摘要', 
  'interception-log': '合规拦截日志',
  'renewal-calendar': '续期日历', 
  'regulatory-filing': '监管申报',
}

export const COMPLIANCE_RULES: ComplianceRule[] = [
  {
    id: 'cr1',
    name: 'Appointment 必须有效',
    nameEn: 'Valid Appointment Required',
    category: 'appointment',
    condition: '出单时检查渠道 - 保险公司 - 州 - 业务线的 Appointment 状态 = approved',
    conditionEn: 'At bind time, verify channel-insurer-state-line Appointment status = approved',
    action: 'block',
    enabled: true,
    priority: 1,
    triggeredCount: 47,
    lastTriggered: '2026-08-22',
  },
  {
    id: 'cr2',
    name: 'Appointment 到期拦截',
    nameEn: 'Expired Appointment Block',
    category: 'appointment',
    condition: 'Appointment.expiryDate < today',
    conditionEn: 'Appointment.expiryDate < today',
    action: 'block',
    enabled: true,
    priority: 2,
    triggeredCount: 23,
    lastTriggered: '2026-08-22',
  },
  {
    id: 'cr3',
    name: '牌照有效性检查',
    nameEn: 'License Validity Check',
    category: 'license',
    condition: '渠道对应州牌照 status IN (active, pending)',
    conditionEn: 'Channel state license status IN (active, pending)',
    action: 'block',
    enabled: true,
    priority: 3,
    triggeredCount: 12,
    lastTriggered: '2026-08-22',
  },
  {
    id: 'cr4',
    name: '牌照到期警告',
    nameEn: 'License Expiry Warning',
    category: 'license',
    condition: 'license.daysToExpiry BETWEEN 0 AND 30',
    conditionEn: 'license.daysToExpiry BETWEEN 0 AND 30',
    action: 'warn',
    enabled: true,
    priority: 4,
    triggeredCount: 8,
    lastTriggered: '2026-08-21',
  },
  {
    id: 'cr5',
    name: 'OFAC SDN 精确匹配拦截',
    nameEn: 'OFAC SDN Exact Match Block',
    category: 'ofac',
    condition: 'customer.name EXACT_MATCH OFAC SDN list',
    conditionEn: 'customer.name EXACT_MATCH OFAC SDN list',
    action: 'block',
    enabled: true,
    priority: 1,
    triggeredCount: 2,
    lastTriggered: '2026-07-18',
  },
  {
    id: 'cr6',
    name: 'OFAC 模糊匹配人工审核',
    nameEn: 'OFAC Fuzzy Match Manual Review',
    category: 'ofac',
    condition: 'OFAC similarity_score >= 75%',
    conditionEn: 'OFAC similarity_score >= 75%',
    action: 'require-review',
    enabled: true,
    priority: 2,
    triggeredCount: 9,
    lastTriggered: '2026-08-21',
  },
  {
    id: 'cr7',
    name: '暂停渠道拦截',
    nameEn: 'Suspended Channel Block',
    category: 'channel',
    condition: 'channel.status = suspended',
    conditionEn: 'channel.status = suspended',
    action: 'block',
    enabled: true,
    priority: 1,
    triggeredCount: 18,
    lastTriggered: '2026-08-22',
  },
  {
    id: 'cr8',
    name: 'Non-Admitted 产品州授权',
    nameEn: 'Non-Admitted Product State Authorization',
    category: 'product',
    condition: 'product.type = Non-Admitted AND state NOT IN product.states',
    conditionEn: 'product.type = Non-Admitted AND state NOT IN product.states',
    action: 'block',
    enabled: true,
    priority: 2,
    triggeredCount: 6,
    lastTriggered: '2026-08-18',
  },
]

export const OFAC_SCREENINGS: OFACScreening[] = [
  { id: 'of1', timestamp: '2026-08-22 11:08:02', entityName: 'Desert Solar Holdings', entityType: 'Company', screenedBy: 'System Auto', result: 'clear', policyId: 'QT-2026-088398' },
  { id: 'of2', timestamp: '2026-08-21 16:44:00', entityName: 'Gulf Coast Energy Partners', entityType: 'Company', country: ['US'], screenedBy: 'System Auto', result: 'watchlist', matchScore: 78, matchScoreLevel: 'medium', matchedEntry: 'Gulf Coast Energy Trading LLC', matchedList: 'SDN', program: ['IRAN'], policyId: 'QT-2026-087912', reviewedBy: 'Chen Hao', reviewNote: '经人工核查，为不同实体，可放行', overrideApproved: true, reviewDate: '2026-08-21 17:00:00' },
  { id: 'of3', timestamp: '2026-08-19 10:23:14', entityName: 'Ali Hassan Al-Rashid', entityType: 'Individual', country: ['Syria', 'Iran'], dateOfBirth: '1975-03-15', identificationNumber: 'Passport No. A12345678', address: 'Damascus, Syria', screenedBy: 'System Auto', result: 'blocked', matchScore: 96, matchScoreLevel: 'exact', matchedEntry: 'ALI HASSAN AL-RASHID', matchedList: 'SDN', program: ['SYRIA', 'TERRORISM'], policyId: 'QT-2026-087542', reviewedBy: 'Zhang Wei', reviewNote: '确认为 SDN 制裁名单人员，拒绝出单', overrideApproved: false, reviewDate: '2026-08-19 11:30:00' },
  { id: 'of4', timestamp: '2026-08-18 14:11:38', entityName: 'Sunshine Logistics Inc', entityType: 'Company', country: ['US'], screenedBy: 'System Auto', result: 'clear', policyId: 'QT-2026-088301' },
  { id: 'of5', timestamp: '2026-08-17 09:55:22', entityName: 'Pacific Bridge Trading', entityType: 'Company', country: ['Singapore'], screenedBy: 'System Auto', result: 'clear' },
  { id: 'of6', timestamp: '2026-08-16 16:33:50', entityName: 'Omega Financial Services', entityType: 'Company', country: ['UAE'], dateRegistered: '2020-05-12', identificationNumber: 'Tax ID 98-7654321', address: 'Dubai, UAE', screenedBy: 'System Auto', result: 'watchlist', matchScore: 82, matchScoreLevel: 'high', matchedEntry: 'Omega Financial LLC (Syria)', matchedList: 'SDGT', program: ['GLOBAL_TERRORISM'], policyId: 'QT-2026-087890', reviewedBy: 'Liu Yang', reviewNote: '不同注册地，风险评级提升至中风险，可放行', overrideApproved: true, reviewDate: '2026-08-16 18:00:00' },
  { id: 'of7', timestamp: '2026-08-15 11:20:44', entityName: 'North Star Mining Corp', entityType: 'Company', country: ['Canada'], screenedBy: 'System Auto', result: 'clear' },
  { id: 'of8', timestamp: '2026-08-14 08:44:09', entityName: 'Bay Area Tech Ventures', entityType: 'Company', country: ['US'], dateRegistered: '2019-03-20', identificationNumber: 'EIN 12-3456789', address: 'San Francisco, CA, US', screenedBy: 'System Auto', result: 'clear', policyId: 'QT-2026-088301' },
  { id: 'of9', timestamp: '2026-08-13 15:30:00', entityName: 'Vessel "Pacific Dream"', entityType: 'Vessel', country: ['Panama'], vesselFlag: 'Panama', imoNumber: 'IMO 1234567', screenedBy: 'System Auto', result: 'watchlist', matchScore: 73, matchScoreLevel: 'medium', matchedEntry: 'MV Pacific Dream', matchedList: 'CONSOLIDATED', program: ['NORTH_KOREA'], policyId: 'QT-2026-087654' },
  { id: 'of10', timestamp: '2026-08-12 10:15:00', entityName: "John Michael Smith", entityType: 'Individual', country: ['UK'], dateOfBirth: '1980-07-22', identificationNumber: 'Passport No. ZK1234567', address: 'London, UK', screenedBy: 'System Auto', result: 'blocked', matchScore: 98, matchScoreLevel: 'exact', matchedEntry: 'JOHN MICHAEL SMITH', matchedList: 'FOREIGN SANCTIONS MAGNITSKY ACT', program: ['MAGNITSKY'], policyId: 'QT-2026-087321', reviewedBy: 'Sarah Chen', reviewNote: '确认与 Magnitsky 制裁名单完全匹配，必须冻结资产并报告', overrideApproved: false, reviewDate: '2026-08-12 14:00:00' },
]

export const COMPLIANCE_REPORTS: ComplianceReport[] = [
  { id: 'rp1', name: 'Appointment 状态月报 — 2026 年 8 月', type: 'appointment-status', period: '2026-08', generatedDate: '2026-08-20 08:00', generatedBy: 'System Auto', status: 'ready', fileSize: '2.1 MB', recordCount: 124, format: 'Excel', recipients: ['compliance@company.com'] },
  { id: 'rp2', name: '牌照合规检查报告 — Q3 2026', type: 'license-compliance', period: '2026-Q3', generatedDate: '2026-08-15 09:30', generatedBy: 'Zhang Wei', status: 'ready', fileSize: '1.8 MB', recordCount: 89, format: 'PDF', recipients: ['compliance@company.com', 'legal@company.com'] },
  { id: 'rp3', name: 'OFAC 筛查月度摘要 — 2026 年 8 月', type: 'ofac-summary', period: '2026-08', generatedDate: '2026-08-21 16:45', generatedBy: 'System Auto', status: 'ready', fileSize: '0.9 MB', recordCount: 248, format: 'PDF' },
  { id: 'rp4', name: '出单合规拦截日志 — 本周', type: 'interception-log', period: '2026-W34', generatedDate: '2026-08-22 07:00', generatedBy: 'System Auto', status: 'ready', fileSize: '0.4 MB', recordCount: 7, format: 'Excel' },
  { id: 'rp5', name: 'Appointment 续期日历 — 2026 Q4', type: 'renewal-calendar', period: '2026-Q4', generatedDate: '2026-08-01 10:00', generatedBy: 'Sarah Chen', status: 'ready', fileSize: '1.2 MB', recordCount: 31, format: 'PDF' },
  { id: 'rp6', name: '监管申报报告 — 2026 年 8 月', type: 'regulatory-filing', period: '2026-08', generatedDate: '', generatedBy: 'Scheduled', status: 'scheduled', format: 'PDF' },
]
