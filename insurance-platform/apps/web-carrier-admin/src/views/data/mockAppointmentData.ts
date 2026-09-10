import type { InsuranceCarrier } from './mockData'

/**
 * Appointment & Compliance Module Data Models
 * 功能点 27-35: Appointment 申请/跟踪/续期/终止 + NIPR 校验 + 合规拦截 + 报告生成+OFAC 筛查
 *
 * ⚠ 已废弃：本文件当前没有被任何视图引用（活代码走 ./mockComplianceData 与 ./appointmentComplianceData）。
 *   其中带 approved / waiverApproved / reviewedBy 等字段名属于早期原型遗留，不是本系统的业务语义。
 *   本系统没有任何审批流程，请勿基于本文件新增功能；待确认后可整文件删除。
 */

// ==================== Appointment Application ====================

export interface AppointmentApplication {
  id: string
  subjectType: 'ChannelOrganization' | 'IndividualAgent'
  subjectId: string
  subjectName: string
  carrierId: string
  carrierName: string
  states: string[] // US state codes: CA, NY, TX, etc.
  lineOfBusiness: 'P&C' | 'Life' | 'Health' | 'All'
  agentNPN?: string
  licenseNumber?: string
  department?: string // Department name for organization
  status: ApplicationStatus
  submissionDate?: string
  expectedCompletion?: string
  actualApprovalDate?: string
  supportingDocuments: SupportingDocument[]
  validationResults: ValidationCheck[]
  rejectionReason?: string
  processingNotes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ApplicationStatus = 
  | 'Draft'
  | 'PendingSubmission'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'PendingInfo'

export interface SupportingDocument {
  id: string
  documentType: 'LicenseCopy' | 'EOInsuranceProof' | 'BackgroundCheck' | 'Other'
  fileName: string
  fileSize: number
  uploadDate: string
  uploadedBy: string
  url: string
}

export interface ValidationCheck {
  checkType: 'LicenseStatus' | 'EOValidity' | 'PreconditionCheck'
  status: 'Pass' | 'Fail'
  details: string
  checkedAt: string
}

// ==================== Appointment Authorization ====================

export interface AppointmentAuthorization {
  id: string
  applicationId: string
  subjectType: 'ChannelOrganization' | 'IndividualAgent'
  subjectId: string
  subjectName: string
  carrierId: string
  carrierName: string
  state: string
  lineOfBusiness: 'P&C' | 'Life' | 'Health' | 'All'
  status: AuthorizationStatus
  effectiveDate: string
  expirationDate: string
  approvedDate: string
  regulatoryFees: number
  renewalCount: number
  lastRenewalDate?: string
  notes?: string
}

export type AuthorizationStatus = 
  | 'Active'
  | 'ExpiringSoon'
  | 'Expired'
  | 'Terminated'

// ==================== Renewal Management ====================

export interface RenewalRequest {
  id: string
  appointmentId: string
  subjectName: string
  carrierName: string
  state: string
  currentExpirationDate: string
  requestedRenewalDate: string
  status: RenewalStatus
  regulatoryFees: number
  submittedBy: string
  submittedAt: string
  processedAt?: string
  notes?: string
}

export type RenewalStatus = 
  | 'Requested'
  | 'Processing'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'

// ==================== Termination Management ====================

export interface TerminationRequest {
  id: string
  appointmentId: string
  subjectName: string
  carrierName: string
  state: string
  terminationReason: TerminationReason
  requestedDate: string
  effectiveDate: string
  status: TerminationStatus
  affectedPolicies: number
  pendingQuotes: number
  handledBy: string
  approvedBy?: string
  approvedAt?: string
  notes?: string
}

export type TerminationReason = 
  | 'CooperationTerminated'
  | 'LicenseInvalid'
  | 'ComplianceIssue'
  | 'VoluntaryExit'
  | 'CarrierInitiated'

export type TerminationStatus = 
  | 'Requested'
  | 'UnderReview'
  | 'Approved'
  | 'Effective'
  | 'Cancelled'

// ==================== License Verification ====================

export interface LicenseVerification {
  id: string
  npnNumber: string
  agentName: string
  organizationName?: string
  verificationDate: string
  verificationMethod: 'NIPRAPI' | 'Manual' | 'Scheduled'
  licenseStatus: 'Active' | 'Expired' | 'Suspended' | 'Revoked'
  licensedStates: string[]
  authorizedLines: ('P&C' | 'Life' | 'Health')[]
  effectiveDate: string
  expirationDate: string
  anomalyFlags: AnomalyFlag[]
  verifiedBy: string
  sourceSystem: string
}

export type AnomalyFlag = 
  | 'LicenseExpired'
  | 'LicenseSuspended'
  | 'LicenseRevoked'
  | 'StateMismatch'
  | 'LineOfBusinessMismatch'
  | 'InformationDiscrepancy'

// ==================== Compliance Interception ====================

export interface ComplianceInterception {
  id: string
  interceptionDate: string
  agentNpn: string
  agentName: string
  channelName: string
  productId: string
  productName: string
  state: string
  interceptionRule: InterceptionRule
  interceptionReason: string
  resolutionSuggestion: string
  waiverRequested: boolean
  waiverApproved: boolean
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  notes?: string
}

export type InterceptionRule = 
  | 'LicenseCheck'
  | 'AppointmentCheck'
  | 'ProductAuthorization'
  | 'StateAvailability'
  | 'TrainingCertification'
  | 'LimitValidation'
  | 'StatusValidation'

// ==================== Compliance Report ====================

export interface ComplianceReport {
  id: string
  reportType: 'Appointment' | 'License' | 'SalesActivity' | 'Complaint' | 'Screening' | 'Interception'
  state: string
  periodType: 'Monthly' | 'Quarterly' | 'Yearly'
  periodStart: string
  periodEnd: string
  generatedAt: string
  generatedBy: string
  status: 'Pending' | 'Generated' | 'Submitted'
  submissionRecord?: SubmissionRecord
  fileUrl?: string
  notes?: string
}

export interface SubmissionRecord {
  submissionDate: string
  confirmationNumber: string
  submittedTo: string
  submittedBy: string
}

// ==================== OFAC Screening ====================

export interface OFACScreening {
  id: string
  screeningDate: string
  subjectType: 'Channel' | 'Agent' | 'Organization'
  subjectId: string
  subjectName: string
  screeningResult: 'NotMatched' | 'PotentialMatch' | 'ConfirmedMatch'
  matchDetails?: MatchDetail[]
  reviewedBy?: string
  reviewedAt?: string
  reviewDecision?: 'Clear' | 'Block'
  blockReason?: string
  screeningListVersion: string
  screenedBy: string
}

export interface MatchDetail {
  matchedName: string
  listOfNameSource: string // OFAC list source
  similarityScore: number
  matchType: 'Exact' | 'Partial' | ' phonetic'
  reasons: string[]
}

// ==================== Expiry Monitoring ====================

export interface ExpiryNotification {
  id: string
  notificationType: 'AppointmentExpiry' | 'LicenseExpiry' | 'CertificationExpiry'
  subjectType: 'Channel' | 'Agent' | 'Organization'
  subjectId: string
  subjectName: string
  expirationDate: string
  daysBeforeExpiry: number
  recipientTypes: ('Agent' | 'Channel' | 'Compliance')[]
  sent: boolean
  sentAt?: string
}

// ==================== Helper Functions ====================

export function generateMockApplications(): AppointmentApplication[] {
  const carriers = [
    { id: 'ins_001', name: 'Travelers' },
    { id: 'ins_002', name: 'Allstate' },
    { id: 'ins_003', name: 'State Farm' },
    { id: 'ins_004', name: 'Liberty Mutual' },
    { id: 'ins_005', name: 'MetLife' },
  ]

  const statuses: ApplicationStatus[] = [
    'Draft', 'PendingSubmission', 'Submitted', 'UnderReview', 
    'Approved', 'Rejected', 'PendingInfo'
  ]

  return Array.from({ length: 15 }, (_, i) => {
    const carrier = carriers[i % carriers.length]
    const status = statuses[i % statuses.length]
    
    return {
      id: `APP-${String(i + 1).padStart(4, '0')}`,
      subjectType: i % 2 === 0 ? 'ChannelOrganization' : 'IndividualAgent',
      subjectId: `SUBJ-${String(i + 1).padStart(4, '0')}`,
      subjectName: i % 2 === 0 ? `Channel Partner ${i + 1}` : `Agent John Smith ${i + 1}`,
      carrierId: carrier.id,
      carrierName: carrier.name,
      states: i % 3 === 0 ? ['CA', 'NV'] : i % 2 === 0 ? ['NY'] : ['CA', 'TX', 'FL'],
      lineOfBusiness: i % 4 === 0 ? 'P&C' : i % 4 === 1 ? 'Life' : i % 4 === 2 ? 'Health' : 'All',
      agentNPN: i % 2 === 0 ? undefined : `NPN${String(100000 + i).padStart(6, '0')}`,
      licenseNumber: i % 2 === 0 ? `LIC-${String(200000 + i).padStart(6, '0')}` : undefined,
      status,
      submissionDate: status !== 'Draft' ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      expectedCompletion: new Date(Date.now() + (15 + Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      supportingDocuments: [
        {
          id: `DOC-${i + 1}-1`,
          documentType: 'LicenseCopy',
          fileName: 'license_copy.pdf',
          fileSize: 256000,
          uploadDate: new Date().toISOString().split('T')[0],
          uploadedBy: 'admin',
          url: '/documents/license_copy.pdf'
        }
      ],
      validationResults: [
        {
          checkType: 'LicenseStatus',
          status: Math.random() > 0.1 ? 'Pass' : 'Fail',
          details: 'License is valid and active',
          checkedAt: new Date().toISOString()
        },
        {
          checkType: 'EOValidity',
          status: Math.random() > 0.05 ? 'Pass' : 'Fail',
          details: 'E&O insurance coverage is valid',
          checkedAt: new Date().toISOString()
        }
      ],
      rejectionReason: status === 'Rejected' ? 'Insufficient documentation provided' : undefined,
      createdBy: 'compliance_manager',
      createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

export function generateMockAuthorizations(): AppointmentAuthorization[] {
  const carriers = [
    { id: 'ins_001', name: 'Travelers' },
    { id: 'ins_002', name: 'Allstate' },
    { id: 'ins_003', name: 'State Farm' },
  ]

  const statuses: AuthorizationStatus[] = ['Active', 'ExpiringSoon', 'Expired', 'Terminated']

  return Array.from({ length: 25 }, (_, i) => {
    const carrier = carriers[i % carriers.length]
    const status = statuses[i % statuses.length]
    const daysUntilExpiry = status === 'ExpiringSoon' ? 30 + Math.random() * 60 :
                           status === 'Expired' ? -Math.random() * 90 :
                           365 + Math.random() * 730
    
    return {
      id: `AUTH-${String(i + 1).padStart(4, '0')}`,
      applicationId: `APP-${String(Math.floor(i / 3) + 1).padStart(4, '0')}`,
      subjectType: i % 2 === 0 ? 'ChannelOrganization' : 'IndividualAgent',
      subjectId: `SUBJ-${String(i + 1).padStart(4, '0')}`,
      subjectName: i % 2 === 0 ? `Channel Partner ${i + 1}` : `Agent John Smith ${i + 1}`,
      carrierId: carrier.id,
      carrierName: carrier.name,
      state: ['CA', 'NY', 'TX', 'FL', 'IL'][i % 5],
      lineOfBusiness: i % 4 === 0 ? 'P&C' : i % 4 === 1 ? 'Life' : i % 4 === 2 ? 'Health' : 'All',
      status,
      effectiveDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      approvedDate: new Date(Date.now() - 700 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      regulatoryFees: 150 + Math.random() * 350,
      renewalCount: Math.floor(Math.random() * 3),
      lastRenewalDate: Math.random() > 0.5 ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      notes: status === 'ExpiringSoon' ? 'Auto-renewal recommended' : undefined
    }
  })
}

export function generateMockVerifications(): LicenseVerification[] {
  const statuses: LicenseVerification['licenseStatus'][] = [
    'Active', 'Expired', 'Suspended', 'Revoked'
  ]
  
  return Array.from({ length: 30 }, (_, i) => ({
    id: `VERIF-${String(i + 1).padStart(4, '0')}`,
    npnNumber: `NPN${String(100000 + i).padStart(6, '0')}`,
    agentName: `Agent ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5]} ${i + 1}`,
    organizationName: i % 3 === 0 ? `Brokerage Firm ${i + 1}` : undefined,
    verificationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    verificationMethod: i % 5 === 0 ? 'Scheduled' : 'NIPRAPI',
    licenseStatus: statuses[i % 4],
    licensedStates: i % 2 === 0 ? ['CA', 'NV', 'AZ'] : ['NY'],
    authorizedLines: i % 3 === 0 ? ['P&C'] : i % 3 === 1 ? ['Life', 'Health'] : ['P&C', 'Life', 'Health'],
    effectiveDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + (statuses[i % 4] === 'Active' ? 365 : -30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    anomalyFlags: statuses[i % 4] !== 'Active' ? [
      statuses[i % 4] === 'Expired' ? 'LicenseExpired' :
      statuses[i % 4] === 'Suspended' ? 'LicenseSuspended' :
      'LicenseRevoked'
    ] : [],
    verifiedBy: 'system',
    sourceSystem: 'NIPR'
  }))
}

export function generateMockInterceptions(): ComplianceInterception[] {
  const rules: InterceptionRule[] = [
    'LicenseCheck', 'AppointmentCheck', 'ProductAuthorization', 
    'StateAvailability', 'TrainingCertification', 'LimitValidation', 'StatusValidation'
  ]
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `INT-${String(i + 1).padStart(4, '0')}`,
    interceptionDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    agentNpn: `NPN${String(100000 + i).padStart(6, '0')}`,
    agentName: `Agent ${['Smith', 'Johnson', 'Williams'][i % 3]} ${i + 1}`,
    channelName: `Channel Partner ${Math.floor(i / 3) + 1}`,
    productId: `PROD-${String(i % 10 + 1).padStart(3, '0')}`,
    productName: `Product Line ${i % 5 + 1}`,
    state: ['CA', 'NY', 'TX', 'FL'][i % 4],
    interceptionRule: rules[i % rules.length],
    interceptionReason: [
      'Agent license expired or invalid',
      'No appointment authorization in this state',
      'Channel not authorized to sell this product',
      'Product not authorized for sale in this state',
      'Required training certification not completed',
      'Premium amount exceeds agent limit',
      'Agent status suspended or terminated'
    ][i % rules.length],
    resolutionSuggestion: [
      'Renew agent license immediately',
      'Submit appointment application first',
      'Obtain product authorization from carrier',
      'Restrict sales to authorized states only',
      'Complete required training course',
      'Downgrade the quote to fit the agent limit',
      'Restore agent status or assign to another agent'
    ][i % rules.length],
    waiverRequested: Math.random() > 0.8,
    waiverApproved: false,
    resolved: Math.random() > 0.3,
    notes: Math.random() > 0.7 ? 'Escalated to compliance team for review' : undefined
  }))
}

export function generateMockOFACScreenings(): OFACScreening[] {
  const results: OFACScreening['screeningResult'][] = ['NotMatched', 'PotentialMatch', 'ConfirmedMatch']
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `OFAC-${String(i + 1).padStart(4, '0')}`,
    screeningDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subjectType: i % 3 === 0 ? 'Channel' : i % 2 === 0 ? 'Agent' : 'Organization',
    subjectId: `SUBJ-${String(i + 1).padStart(4, '0')}`,
    subjectName: i % 4 === 0 ? 'Global Trade Partners LLC' : 
                  i % 3 === 0 ? 'International Investment Group' :
                  i % 2 === 0 ? 'Sanctioned Entity Name' : `Normal Subject ${i + 1}`,
    screeningResult: results[i % 10 === 0 ? 2 : i % 10 === 1 ? 1 : 0],
    matchDetails: i % 10 === 0 || i % 10 === 1 ? [
      {
        matchedName: 'SANCTIONED ENTITY NAME',
        listOfNameSource: 'OFAC SDN List',
        similarityScore: i % 10 === 0 ? 100 : 85,
        matchType: i % 10 === 0 ? 'Exact' : 'Partial',
        reasons: ['Name matches sanctioned entity', 'Similar business activities']
      }
    ] : undefined,
    reviewedBy: i % 5 === 0 ? 'compliance_officer' : undefined,
    reviewedAt: i % 5 === 0 ? new Date().toISOString() : undefined,
    reviewDecision: i % 5 === 0 ? (i % 10 === 0 ? 'Block' : 'Clear') : undefined,
    blockReason: i % 10 === 0 ? 'Confirmed match with OFAC sanctioned entity' : undefined,
    screeningListVersion: 'v2024.08.15',
    screenedBy: 'automated_system'
  }))
}
