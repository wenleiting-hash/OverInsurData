// Mock data for insurer module (Phase 0: Insurer List and Basic Management)

// Local type definition for carriers
type InsuranceCarrier = {
  carrierId: string
  carrierName: string
  carrierCode: string
}

// Forward declare to avoid circular reference
export interface ContactPerson {
  id: string
  insurerId: string
  firstName: string
  lastName: string
  fullName: string
  position: string
  department: string
  role: ContactRole
  email: string
  phone: string
  mobilePhone?: string
  officeAddress?: string
  isActive: boolean
  isPrimary: boolean
  communicationLogs?: CommunicationLog[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface InsuranceCooperation {
  id: string                    // coop001, coop002...
  insurerId: string             // Foreign key to carrier
  insurerName: string           // Cached for quick view
  
  // Basic Info
  cooperationType: CooperationType
  status: CooperationStatus
  commissionTier?: 'Tier-1' | 'Tier-2' | 'Tier-3' // Commission level for this partnership
  notes?: string                // Warnings/Notes about this partnership (e.g., renewal issues, termination reason)
  notesEn?: string              // English parallel text for notes
  
  // Contact Persons
  myContactPerson: ContactPerson
  insurerContactPerson?: ContactPerson
  
  // Settlement Configuration
  settlementMethod: SettlementMethod
  settlementCycle: number        // Days (e.g., 30, 45, 60)
  premiumCollectionMethod: PremiumCollectionMethod
  premiumSettlementCycle: PremiumSettlementFrequency
  
  // Effective Period
  effectiveDate: string          // ISO date format
  expirationDate?: string        // Optional for permanent partnerships
  
  // Scope Configuration
  productScope: ProductScopeConfig
  stateScope: State[]            // e.g., ['CA', 'NV', 'AZ']
  
  // Documents
  contractFile?: FileMetadata    // Agreement attachment
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string              // User ID who created
}

export type CooperationType = 
  | 'Full-Service'            // Direct Agency
  | 'Specialty'               // Specialty Brokerage
  | 'Preferred'              // Preferred Partner
  | 'Surplus Lines'          // Surplus Lines Broker

export type CooperationStatus = 
  | 'Draft'                  // Draft - not submitted (草稿)
  | 'Submitted'              // Submitted for approval (已提交)
  | 'UnderReview'           // Under internal review (审核中)
  | 'Approved'              // Approved and active (合作中)
  | 'Rejected'              // Application rejected (已拒绝)
  | 'Terminated'            // Partnership terminated (已终止)

export type SettlementMethod = 
  | 'DirectPay'              // Insurer pays commission directly to us
  | 'PlatformSettle'         // We aggregate and settle

export type PremiumCollectionMethod = 
  | 'ChannelToMyToInsurer'   // Channel → Our Platform → Insurer
  | 'ChannelDirectToInsurer' // Channel → Insurer directly

export type PremiumSettlementFrequency = 
  | 'Daily'                  // Daily settlement
  | 'Weekly'                 // Weekly settlement
  | 'Monthly'                // Monthly settlement

export type ProductScopeConfig = {
  type: 'All' | 'SpecificLOB' | 'SpecificProducts'
  lobTypes?: LineOfBusiness[]  // If SpecificLOB
  productIds?: string[]        // If SpecificProducts
}

export type LineOfBusiness = 
  | 'AUTO'                   // Auto Insurance
  | 'HOME'                   // Homeowners Insurance
  | 'LIFE'                   // Life Insurance
  | 'PET'                    // Pet Insurance
  | 'COMMERCIAL'             // Commercial Insurance
  | 'CYBER'                  // Cyber Liability
  | 'D_O'                    // Directors & Officers
  | 'E_O'                    // Errors & Omissions
  | 'P_C'                    // Property & Casualty
  | 'ES'                     // Excess & Surplus

export interface ContractAgreement {
  id: string                  // contract001, contract002...
  
  // Basic Information
  contractName: string
  contractNumber: string      // Contract reference number
  contractType: ContractType
  signDate: string            // Date signed by both parties
  effectiveDate: string       // Start date
  expirationDate: string      // End date
  durationYears?: number      // Contract duration in years
  
  // Association
  insurerId: string
  insurerName: string
  cooperationId?: string      // Link to specific cooperation relationship
  
  // Status & Workflow
  status: ContractStatus
  workflowStage?: string      // draft/pendingLegal/pendingSignature/inEffect/expiring/expired
  
  // Key Terms Summary
  keyTerms?: KeyTermsSummary
  
  // Reminders
  reminderThresholds: ReminderThreshold[]  // e.g., [90, 60, 30] days before expiry
  
  // Documents
  fileMetadata?: FileMetadata
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  approvedBy?: string
  approvedAt?: string
}

export type ContractType = 
  | 'MasterAgreement'        // Master Agreement
  | 'ProductSupplement'      // Product Supplement
  | 'NDA'                    // Non-Disclosure Agreement
  | 'DPA'                    // Data Processing Agreement
  | 'CommissionSupplement'   // Commission Supplement
  | 'Compliance'             // Compliance Agreement
  | 'Other'                  // Other type

export type ContractStatus = 
  | 'Draft'                  // Draft - editing
  | 'PendingApproval'        // Awaiting legal approval
  | 'PendingSignature'       // Signature pending
  | 'Signed'                 // Signed but not yet effective
  | 'InEffect'               // Currently active
  | 'ExpiringSoon'           // Within threshold
  | 'Expired'                // Has expired
  | 'Terminated'             // Early termination

export interface KeyTermsSummary {
  commissionRate?: string           // Commission rate range
  settlementPeriod?: string         // Payment terms
  terminationClause?: string        // Termination conditions
  liabilityCap?: string             // Liability cap amount
  dataSecurityRequirements?: string
  disputeResolutionMechanism?: string
  specialConditions?: string[]      // List of special conditions
}

export interface ReminderThreshold {
  daysBefore: number     // Alert X days before expiry
  enabled: boolean
  notificationChannels: ('email' | 'inApp' | 'sms')[]
}

export interface SettlementConfiguration {
  id: string                          // config001, config002...
  insurerId: string
   
  // Commission Settlement
  commissionSettlementCycle: SettlementCycleType
  billCutOffDay: number               // Day of month/quarter (1-28)
  reconciliationDeadline: number      // Days to reconcile after bill receipt
  paymentTermDays: number             // Days to pay after reconciliation
  
  // Premium Collection
  premiumCollectionMethod: PremiumCollectionMethod
  premiumSettlementCycle: PremiumSettlementFrequency
  
  // Currency & Accounts
  settlementCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD'
  insurerBankAccount?: BankAccountInfo
  myBankAccount?: BankAccountInfo
  
  // Reconciliation Method
  reconciliationMethod: ReconciliationMethod
  billFormat: BillFormatType
  fieldMappingTemplate?: object      // Custom mapping for non-standard formats
  
  // Tax & Disputes
  commissionTaxRate?: number         // Withholding tax rate (%)
  disputeResolutionRule?: DisputeRule
  
  // Approval
  requiresApproval: boolean          // Requires finance approval for changes
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type SettlementCycleType = 'Monthly' | 'Quarterly' | 'SemiAnnual' | 'Annual'

export type ReconciliationMethod = 
  | 'FileSend'          // Insurer sends bill file
  | 'ApiPull'           // API auto-fetch
  | 'EdiIntegration'    // EDI integration
  | 'ManualEntry'       // Manual entry

export type BillFormatType = 'CSV' | 'Excel' | 'EDI_835' | 'Custom'

export interface BankAccountInfo {
  accountName: string
  accountNumber: string        // Last 4 digits only for display
  routingNumber?: string
  bankName: string
  bankAddress?: string
  swiftCode?: string
  accountType: 'Checking' | 'Savings' | 'Business'
  isPrimary: boolean           // Primary receiving account
  country: string              // Account country
}

export interface DisputeRule {
  disputeDeadlineDays: number        // Timeframe to report disputes
  escalationLevel1: EscalationStep   // First escalation level
  escalationLevel2: EscalationStep   // Second escalation level
  arbitrationRequired?: boolean      // Whether arbitration is mandatory
}

export interface EscalationStep {
  level: number                       // 1 or 2
  roleTitle: string                   // e.g., "Finance Director"
  timelineDays: number                // Trigger after X days
  action: string                      // e.g., "Notify GM", "Escalate to CEO"
}

export interface ContactPerson {
  id: string                          // contact001, contact002...
  insurerId: string
  
  // Personal Info
  firstName: string
  lastName: string
  fullName: string                    // Computed field
  
  // Professional Info
  position: string
  department: string
  role: ContactRole
  
  // Contact Details
  email: string
  phone: string
  mobilePhone?: string
  officeAddress?: string
  
  // Status
  isActive: boolean
  isPrimary: boolean                  // Is primary contact for this role
  
  // Communication Logs
  communicationLogs?: CommunicationLog[]
  
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type ContactRole = 
  | 'AccountManager'              // Account Manager
  | 'Underwriting'                // Underwriting Contact
  | 'Claims'                      // Claims Contact
  | 'Finance'                     // Finance/Settlement Contact
  | 'IT'                          // IT/Technical Contact
  | 'Compliance'                  // Compliance Contact
  | 'Executive'                   // Executive Contact
  | 'Other'                       // Other role

export interface CommunicationLog {
  id: string                          // log001, log002...
  contactPersonId: string
  insurerId: string
  
  // Log Content
  logType: CommunicationType
  logDate: string                     // Date/time of communication
  subject?: string                    // Subject/topic
  content: string                     // Detailed content
  participants?: string[]             // Other participants
  
  // Follow-up
  followUpTask?: string               // Follow-up task description
  followUpDate?: string               // Due date for follow-up
  priority: PriorityLevel
  resolved: boolean                   // Whether follow-up is completed
  
  // Attachments
  attachments?: AttachmentInfo[]
  
  // Metadata
  createdAt: string
  createdBy: string                 // Who created the log
}

export type CommunicationType = 
  | 'Phone'           // Phone call
  | 'Email'           // Email exchange
  | 'Meeting'         // In-person/virtual meeting
  | 'IM'              // Instant messaging (Teams, Slack, etc.)
  | 'SiteVisit'       // On-site visit
  | 'Other'           // Other method

export type PriorityLevel = 'High' | 'Medium' | 'Low'

export interface AttachmentInfo {
  fileName: string
  fileType: string         // MIME type
  fileSize?: number        // Bytes
  url: string             // Download URL
  uploadedAt: string
  uploadedBy: string
}

export interface FileMetadata {
  fileName: string
  fileSize: number
  fileType: string         // MIME type (application/pdf, application/vnd.openxmlformats...)
  uploadDate: string
  uploadedBy: string
  downloadUrl?: string     // Temporary pre-signed URL
  isPublic?: boolean      // Whether publicly accessible
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'NE', 'NV', 'NH', 'NJ', 'NM',
  'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD',
  'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
] as const

export type State = typeof US_STATES[number]

export const COOPERATION_TYPES: CooperationTypeInfo[] = [
  { value: 'Full-Service', label: 'full_service' },
  { value: 'Specialty', label: 'specialty' },
  { value: 'Preferred', label: 'preferred' },
  { value: 'Surplus Lines', label: 'surplus_lines' },
]

export const SETTLEMENT_METHODS: SettlementMethodInfo[] = [
  { value: 'DirectPay', label: 'direct_payment' },
  { value: 'PlatformSettle', label: 'platform_settlement' },
]

export const PREMIUM_COLLECTION_METHODS: PremiumCollectionMethodInfo[] = [
  { value: 'ChannelToMyToInsurer', label: 'channel_to_platform_to_insurer' },
  { value: 'ChannelDirectToInsurer', label: 'channel_direct_to_insurer' },
]

interface CooperationTypeInfo {
  value: CooperationType
  label: string
}

interface SettlementMethodInfo {
  value: SettlementMethod
  label: string
}

interface PremiumCollectionMethodInfo {
  value: PremiumCollectionMethod
  label: string
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

export function generateMockCooperations(): InsuranceCooperation[] {
  const carriers = loadMockCarriers()
  
  return [
    // 5 active partnerships (from UI design screenshot)
    {
      id: 'coop001',
      insurerId: carriers[0].carrierId,
      insurerName: carriers[0].carrierName,
      cooperationType: 'Full-Service',
      status: 'Approved', // Changed from InProgress
      myContactPerson: {
        id: 'contact001',
        insurerId: carriers[0].carrierId,
        firstName: 'John',
        lastName: 'Williams',
        fullName: 'John Williams',
        position: 'VP of Partnerships',
        department: 'Business Development',
        role: 'AccountManager',
        email: 'john.williams@ourcompany.com',
        phone: '+1-415-555-0101',
        mobilePhone: '+1-415-555-0102',
        officeAddress: 'San Francisco, CA',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-08-01T10:00:00Z',
        createdBy: 'user_admin',
      },
      insurerContactPerson: {
        id: 'ic001',
        insurerId: carriers[0].carrierId,
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson',
        position: 'Regional President - West Coast',
        department: 'Sales',
        role: 'AccountManager',
        email: 'sarah.johnson@travelers.com',
        phone: '+1-415-555-0201',
        officeAddress: 'San Francisco, CA',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'DirectPay',
      settlementCycle: 45,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Monthly',
      effectiveDate: '2024-01-15',
      expirationDate: '2027-01-14',
      commissionTier: 'Tier-1', // Added for Card display
      productScope: { type: 'SpecificLOB', lobTypes: ['AUTO', 'HOME'] },
      stateScope: ['CA', 'NV', 'AZ', 'OR', 'WA'],
      contractFile: {
        fileName: 'Master_Agreement_Travelers_2024.pdf',
        fileSize: 2548000,
        fileType: 'application/pdf',
        uploadDate: '2024-01-10T10:00:00Z',
        uploadedBy: 'user_admin',
        downloadUrl: '/files/coop001/master_agreement.pdf',
      },
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T14:30:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'coop002',
      insurerId: carriers[1].carrierId,
      insurerName: carriers[1].carrierName,
      cooperationType: 'Specialty',
      status: 'Approved', // Changed from InProgress
      myContactPerson: {
        id: 'contact002',
        insurerId: carriers[1].carrierId,
        firstName: 'Emily',
        lastName: 'Chen',
        fullName: 'Emily Chen',
        position: 'Head of MGA Partnerships',
        department: 'Strategic Partnerships',
        role: 'AccountManager',
        email: 'emily.chen@ourcompany.com',
        phone: '+1-650-555-0101',
        officeAddress: 'Menlo Park, CA',
        isActive: true,
        isPrimary: true,
        createdAt: '2023-05-20T09:00:00Z',
        updatedAt: '2024-11-01T09:00:00Z',
        createdBy: 'user_admin',
      },
      insurerContactPerson: {
        id: 'ic002',
        insurerId: carriers[1].carrierId,
        firstName: 'Michael',
        lastName: 'Thompson',
        fullName: 'Michael Thompson',
        position: 'CEO',
        department: 'Executive',
        role: 'Executive',
        email: 'm.thompson@allstate.com',
        phone: '+1-312-555-0201',
        officeAddress: 'Chicago, IL',
        isActive: true,
        isPrimary: true,
        createdAt: '2023-05-20T09:00:00Z',
        updatedAt: '2023-05-20T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'PlatformSettle',
      settlementCycle: 30,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Weekly',
      effectiveDate: '2023-06-01',
      expirationDate: '2026-05-31',
      commissionTier: 'Tier-2', // Added for Card display
      productScope: { type: 'All' },
      stateScope: ['IL', 'IN', 'OH', 'GA', 'NC'],
      contractFile: {
        fileName: 'MGA_Agreement_Allstate_2023.pdf',
        fileSize: 3124000,
        fileType: 'application/pdf',
        uploadDate: '2023-05-25T15:00:00Z',
        uploadedBy: 'user_admin',
        downloadUrl: '/files/coop002/mga_agreement.pdf',
      },
      createdAt: '2023-05-20T10:00:00Z',
      updatedAt: '2024-11-01T09:15:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'coop003',
      insurerId: carriers[2].carrierId,
      insurerName: carriers[2].carrierName,
      cooperationType: 'Preferred',
      status: 'Approved', // Changed from ExpiringSoon
      myContactPerson: {
        id: 'contact003',
        insurerId: carriers[2].carrierId,
        firstName: 'David',
        lastName: 'Martinez',
        fullName: 'David Martinez',
        position: 'Director of Wholesale Partnerships',
        department: 'Business Development',
        role: 'AccountManager',
        email: 'david.martinez@ourcompany.com',
        phone: '+1-214-555-0101',
        officeAddress: 'Dallas, TX',
        isActive: true,
        isPrimary: true,
        createdAt: '2021-02-15T09:00:00Z',
        updatedAt: '2024-07-01T10:00:00Z',
        createdBy: 'user_admin',
      },
      insurerContactPerson: {
        id: 'ic003',
        insurerId: carriers[2].carrierId,
        firstName: 'Jennifer',
        lastName: 'Lee',
        fullName: 'Jennifer Lee',
        position: 'Wholesale Sales Director',
        department: 'Sales',
        role: 'AccountManager',
        email: 'jennifer.lee@mapfre.com',
        phone: '+1-214-555-0201',
        officeAddress: 'Dallas, TX',
        isActive: true,
        isPrimary: true,
        createdAt: '2021-02-15T09:00:00Z',
        updatedAt: '2021-02-15T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'DirectPay',
      settlementCycle: 60,
      premiumCollectionMethod: 'ChannelDirectToInsurer',
      premiumSettlementCycle: 'Monthly',
      effectiveDate: '2021-03-01',
      expirationDate: '2025-09-30',
      commissionTier: 'Tier-2',
      productScope: { type: 'SpecificLOB', lobTypes: ['HOME', 'AUTO'] },
      stateScope: ['TX', 'OK', 'NM', 'LA', 'AR'],
      contractFile: {
        fileName: 'Wholesale_Master_Mapfre_2021.pdf',
        fileSize: 1876000,
        fileType: 'application/pdf',
        uploadDate: '2021-02-20T11:00:00Z',
        uploadedBy: 'user_admin',
        downloadUrl: '/files/coop003/wholesale_agreement.pdf',
      },
      createdAt: '2021-02-15T09:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'coop004',
      insurerId: carriers[3].carrierId,
      insurerName: carriers[3].carrierName,
      cooperationType: 'Full-Service',
      status: 'Approved',
      myContactPerson: {
        id: 'contact004',
        insurerId: carriers[3].carrierId,
        firstName: 'Lisa',
        lastName: 'Anderson',
        fullName: 'Lisa Anderson',
        position: 'Senior Partnership Manager',
        department: 'Business Development',
        role: 'AccountManager',
        email: 'lisa.anderson@ourcompany.com',
        phone: '+1-617-555-0101',
        officeAddress: 'Boston, MA',
        isActive: true,
        isPrimary: true,
        createdAt: '2025-08-25T14:00:00Z',
        updatedAt: '2025-08-28T16:30:00Z',
        createdBy: 'user_partnership_mgr',
      },
      insurerContactPerson: {
        id: 'ic004',
        insurerId: carriers[3].carrierId,
        firstName: 'Robert',
        lastName: 'Brown',
        fullName: 'Robert Brown',
        position: 'VP Business Development',
        department: 'Strategy',
        role: 'AccountManager',
        email: 'r.brown@libertymutual.com',
        phone: '+1-617-555-0201',
        officeAddress: 'Boston, MA',
        isActive: true,
        isPrimary: true,
        createdAt: '2025-08-25T14:00:00Z',
        updatedAt: '2025-08-25T14:00:00Z',
        createdBy: 'user_partnership_mgr',
      },
      settlementMethod: 'PlatformSettle',
      settlementCycle: 45,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Monthly',
      effectiveDate: '2025-11-01',
      expirationDate: '2028-10-31',
      commissionTier: 'Tier-1',
      productScope: { type: 'SpecificLOB', lobTypes: ['AUTO', 'LIFE'] },
      stateScope: ['MA', 'NH', 'VT', 'ME'],
      contractFile: undefined,
      notes: '合同即将到期，续约谈判进行中', // Example from screenshot
      notesEn: 'Contract expiring soon; renewal negotiation in progress',
      createdAt: '2025-08-25T14:00:00Z',
      updatedAt: '2025-08-28T16:30:00Z',
      createdBy: 'user_partnership_mgr',
    },
    
    {
      id: 'coop005',
      insurerId: carriers[4].carrierId,
      insurerName: carriers[4].carrierName,
      cooperationType: 'Surplus Lines',
      status: 'Approved', // Changed from InProgress
      myContactPerson: {
        id: 'contact005',
        insurerId: carriers[4].carrierId,
        firstName: 'Kevin',
        lastName: 'Wang',
        fullName: 'Kevin Wang',
        position: 'Chief Technology Officer',
        department: 'Technology',
        role: 'IT',
        email: 'kevin.wang@ourcompany.com',
        phone: '+1-408-555-0101',
        officeAddress: 'Mountain View, CA',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-04-10T09:00:00Z',
        updatedAt: '2024-05-01T10:00:00Z',
        createdBy: 'user_admin',
      },
      insurerContactPerson: {
        id: 'ic005',
        insurerId: carriers[4].carrierId,
        firstName: 'Amanda',
        lastName: 'Stewart',
        fullName: 'Amanda Stewart',
        position: 'VP Engineering',
        department: 'Engineering',
        role: 'IT',
        email: 'amanda.stewart@metlife.com',
        phone: '+1-203-555-0201',
        officeAddress: 'Hartford, CT',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-04-10T09:00:00Z',
        updatedAt: '2024-04-10T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'PlatformSettle',
      settlementCycle: 30,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Weekly',
      effectiveDate: '2024-05-01',
      expirationDate: '2027-04-30',
      commissionTier: 'Tier-3',
      productScope: { type: 'All' },
      stateScope: ['CA', 'NY', 'NJ', 'CT', 'PA', 'FL'],
      contractFile: {
        fileName: 'Aggregator_Integration_Agreement_MetLife_2024.pdf',
        fileSize: 4567000,
        fileType: 'application/pdf',
        uploadDate: '2024-04-20T13:00:00Z',
        uploadedBy: 'user_admin',
        downloadUrl: '/files/coop005/aggregator_agreement.pdf',
      },
      notes: undefined, // No warnings
      createdAt: '2024-04-10T09:00:00Z',
      updatedAt: '2024-05-01T10:00:00Z',
      createdBy: 'user_admin',
    },
    
    { // BHSI - Berkshire Hathaway Specialty (under-review) for screenshot
      id: 'coop006',
      insurerId: carriers[5].carrierId,
      insurerName: 'Berkshire Hathaway Specialty Insurance',
      cooperationType: 'Specialty',
      status: 'UnderReview',
      effectiveDate: '',
      expirationDate: '',
      myContactPerson: {
        id: 'contact006',
        insurerId: carriers[5].carrierId,
        firstName: 'Liu',
        lastName: 'Yang',
        fullName: 'Liu Yang',
        position: 'VP Partnership Development',
        department: 'Strategic Partnerships',
        role: 'AccountManager',
        email: 'liu.yang@ourcompany.com',
        phone: '+1-212-555-0103',
        officeAddress: 'New York, NY',
        isActive: true,
        isPrimary: true,
        createdAt: '2024-07-01T09:00:00Z',
        updatedAt: '2024-07-01T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'PlatformSettle',
      settlementCycle: 45,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Monthly',
      commissionTier: 'Tier-2',
      productScope: { type: 'SpecificLOB', lobTypes: ['CYBER', 'D_O', 'E_O'] },
      stateScope: ['NY', 'DE', 'CA'],
      contractFile: undefined,
      notes: '新合作申请，合规审核中',
      notesEn: 'New partnership application under compliance review',
      createdAt: '2026-08-01T09:00:00Z',
      updatedAt: '2026-08-01T09:00:00Z',
      createdBy: 'user_admin',
    },
    
    { // Markel Corporation - terminated
      id: 'coop007',
      insurerId: carriers[6].carrierId,
      insurerName: 'Markel Corporation',
      cooperationType: 'Surplus Lines',
      status: 'Terminated',
      myContactPerson: {
        id: 'contact007',
        insurerId: carriers[6].carrierId,
        firstName: 'Tom',
        lastName: 'Anderson',
        fullName: 'Tom Anderson',
        position: 'Director of Specialty Markets',
        department: 'Surplus Lines',
        role: 'AccountManager',
        email: 'tom.anderson@ourcompany.com',
        phone: '+1-415-555-0104',
        officeAddress: 'San Francisco, CA',
        isActive: false,
        isPrimary: true,
        createdAt: '2023-01-01T09:00:00Z',
        updatedAt: '2025-12-31T09:00:00Z',
        createdBy: 'user_admin',
      },
      settlementMethod: 'DirectPay',
      settlementCycle: 30,
      premiumCollectionMethod: 'ChannelDirectToInsurer',
      premiumSettlementCycle: 'Monthly',
      effectiveDate: '2021-01-01',
      expirationDate: '2025-12-31',
      commissionTier: 'Tier-3',
      productScope: { type: 'SpecificLOB', lobTypes: ['COMMERCIAL', 'ES'] },
      stateScope: ['TX', 'FL', 'CA'],
      contractFile: undefined,
      notes: '因赔付率持续超标，双方协商终止合作',
      notesEn: 'Partnership terminated by mutual agreement due to sustained loss ratio overruns',
      createdAt: '2020-10-01T09:00:00Z',
      updatedAt: '2025-12-31T09:00:00Z',
      createdBy: 'user_admin',
    },
  ]
}

// Helper: Load mock carriers
function loadMockCarriers(): InsuranceCarrier[] {
  return [
    {
      carrierId: 'c1001',
      carrierName: 'Travelers',
      carrierCode: 'TRV',
    },
    {
      carrierId: 'c1002',
      carrierName: 'Allstate',
      carrierCode: 'ALL',
    },
    {
      carrierId: 'c1003',
      carrierName: 'Mapfre Generales',
      carrierCode: 'MGF',
    },
    {
      carrierId: 'c1004',
      carrierName: 'Liberty Mutual',
      carrierCode: 'LML',
    },
    {
      carrierId: 'c1005',
      carrierName: 'MetLife',
      carrierCode: 'MET',
    },
    {
      carrierId: 'c1006',
      carrierName: 'Berkshire Hathaway Specialty Insurance',
      carrierCode: 'BHS',
    },
    {
      carrierId: 'c1007',
      carrierName: 'Markel Corporation',
      carrierCode: 'MKL',
    },
  ]
}

export function generateMockContracts(): ContractAgreement[] {
  return [
    {
      id: 'contract001',
      contractName: 'Master Agency Agreement - Travelers 2024',
      contractNumber: 'MAA-TRV-2024-001',
      contractType: 'MasterAgreement',
      signDate: '2024-01-10',
      effectiveDate: '2024-01-15',
      expirationDate: '2027-01-14',
      durationYears: 3,
      insurerId: 'c1001',
      insurerName: 'Travelers',
      cooperationId: 'coop001',
      status: 'InEffect',
      workflowStage: 'in_effect',
      keyTerms: {
        commissionRate: '12-15% base + override up to 3%',
        settlementPeriod: 'Net 45 days',
        terminationClause: 'Either party may terminate with 90 days written notice',
        liabilityCap: '$5,000,000 aggregate',
        dataSecurityRequirements: 'SOC 2 Type II compliant',
        disputeResolutionMechanism: 'Binding arbitration in San Francisco, CA',
        specialConditions: ['Minimum production requirement: $2M annually', 'Quarterly business reviews required'],
      },
      reminderThresholds: [
        { daysBefore: 180, enabled: true, notificationChannels: ['email', 'inApp'] },
        { daysBefore: 90, enabled: true, notificationChannels: ['email', 'inApp', 'sms'] },
        { daysBefore: 30, enabled: true, notificationChannels: ['email', 'sms'] },
      ],
      fileMetadata: {
        fileName: 'Master_Agreement_Travelers_2024_Signed.pdf',
        fileSize: 2548000,
        fileType: 'application/pdf',
        uploadDate: '2024-01-10T10:00:00Z',
        uploadedBy: 'user_legal',
        isPublic: false,
      },
      createdAt: '2023-12-01T09:00:00Z',
      updatedAt: '2024-01-10T15:30:00Z',
      createdBy: 'user_business_dev',
      approvedBy: 'user_legal',
      approvedAt: '2024-01-09T16:00:00Z',
    },
    
    {
      id: 'contract002',
      contractName: 'MGA Appointment & Delegation Agreement - Allstate',
      contractNumber: 'MADA-ALL-2023-001',
      contractType: 'MasterAgreement',
      signDate: '2023-05-25',
      effectiveDate: '2023-06-01',
      expirationDate: '2026-05-31',
      durationYears: 3,
      insurerId: 'c1002',
      insurerName: 'Allstate',
      cooperationId: 'coop002',
      status: 'InEffect',
      workflowStage: 'in_effect',
      keyTerms: {
        commissionRate: 'Sliding scale: 10-18% based on persistency',
        settlementPeriod: 'Net 30 days',
        terminationClause: '60 days notice or immediate for cause',
        dataSecurityRequirements: 'Encryption at rest and transit',
        disputeResolutionMechanism: 'Mediation followed by binding arbitration',
        specialConditions: ['MGA must maintain $1M E&O insurance', 'Monthly compliance reporting required'],
      },
      reminderThresholds: [
        { daysBefore: 90, enabled: true, notificationChannels: ['email', 'inApp'] },
        { daysBefore: 30, enabled: true, notificationChannels: ['email'] },
      ],
      fileMetadata: {
        fileName: 'MGA_Delegation_Allstate_2023_Signed.pdf',
        fileSize: 3124000,
        fileType: 'application/pdf',
        uploadDate: '2023-05-25T16:00:00Z',
        uploadedBy: 'user_legal',
        isPublic: false,
      },
      createdAt: '2023-04-10T09:00:00Z',
      updatedAt: '2023-06-01T10:00:00Z',
      createdBy: 'user_business_dev',
      approvedBy: 'user_legal',
      approvedAt: '2023-05-24T14:00:00Z',
    },
    
    {
      id: 'contract003',
      contractName: 'Non-Disclosure Agreement - Mapfre',
      contractNumber: 'NDA-MGF-2021-001',
      contractType: 'NDA',
      signDate: '2021-02-10',
      effectiveDate: '2021-02-15',
      expirationDate: '2031-02-14',
      durationYears: 10,
      insurerId: 'c1003',
      insurerName: 'Mapfre Generales',
      status: 'InEffect',
      workflowStage: 'in_effect',
      keyTerms: {
        dataSecurityRequirements: 'Compliance with GDPR and CCPA',
        specialConditions: ['Confidential information defined broadly', 'Survives contract termination'],
      },
      reminderThresholds: [],
      fileMetadata: {
        fileName: 'NDA_Mapfre_2021_Signed.pdf',
        fileSize: 987000,
        fileType: 'application/pdf',
        uploadDate: '2021-02-10T14:00:00Z',
        uploadedBy: 'user_legal',
        isPublic: false,
      },
      createdAt: '2021-02-01T09:00:00Z',
      updatedAt: '2021-02-10T15:00:00Z',
      createdBy: 'user_legal',
      approvedBy: 'user_legal',
      approvedAt: '2021-02-10T14:30:00Z',
    },
    
    {
      id: 'contract004',
      contractName: 'Wholesale Brokerage Agreement - MetLife',
      contractNumber: 'WBA-MET-2024-001',
      contractType: 'MasterAgreement',
      signDate: '2024-04-18',
      effectiveDate: '2024-05-01',
      expirationDate: '2027-04-30',
      durationYears: 3,
      insurerId: 'c1005',
      insurerName: 'MetLife',
      cooperationId: 'coop005',
      status: 'InEffect',
      workflowStage: 'in_effect',
      keyTerms: {
        commissionRate: '10-14% base + performance bonus up to 2%',
        settlementPeriod: 'Net 30 days from invoice',
        terminationClause: '120 days notice for convenience, immediate for breach',
        dataSecurityRequirements: 'ISO 27001 certification required',
        disputeResolutionMechanism: 'Court jurisdiction in Connecticut',
        specialConditions: ['API integration mandatory within 90 days', 'Real-time quote response <2 seconds SLA'],
      },
      reminderThresholds: [
        { daysBefore: 180, enabled: true, notificationChannels: ['email', 'inApp'] },
        { daysBefore: 90, enabled: true, notificationChannels: ['email', 'inApp'] },
      ],
      fileMetadata: {
        fileName: 'Wholesale_Agreement_MetLife_2024_Signed.pdf',
        fileSize: 4567000,
        fileType: 'application/pdf',
        uploadDate: '2024-04-18T17:00:00Z',
        uploadedBy: 'user_legal',
        isPublic: false,
      },
      createdAt: '2024-03-01T09:00:00Z',
      updatedAt: '2024-05-01T10:00:00Z',
      createdBy: 'user_business_dev',
      approvedBy: 'user_legal',
      approvedAt: '2024-04-18T16:00:00Z',
    },
  ]
}

export function generateMockSettlementConfigs(): SettlementConfiguration[] {
  return [
    {
      id: 'config001',
      insurerId: 'c1001',
      commissionSettlementCycle: 'Quarterly',
      billCutOffDay: 5,
      reconciliationDeadline: 15,
      paymentTermDays: 45,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Monthly',
      settlementCurrency: 'USD',
      insurerBankAccount: {
        accountName: 'Travelers Casualty Insurance Company',
        accountNumber: '****6789',
        routingNumber: '121000248',
        bankName: 'Wells Fargo Bank',
        bankAddress: 'San Francisco, CA',
        accountType: 'Business',
        isPrimary: true,
        country: 'USA',
      },
      myBankAccount: {
        accountName: 'Our Company Operating Account',
        accountNumber: '****1234',
        routingNumber: '021000021',
        bankName: 'JPMorgan Chase Bank',
        bankAddress: 'New York, NY',
        accountType: 'Business',
        isPrimary: true,
        country: 'USA',
      },
      reconciliationMethod: 'FileSend',
      billFormat: 'Excel',
      fieldMappingTemplate: {
        CarrierCode: 'naicCode',
        PolicyNumber: 'policyNumber',
        PremiumAmount: 'premiumYTD',
        CommissionRate: 'commissionRate',
        EffectiveDate: 'effectiveDate',
      },
      commissionTaxRate: 0,
      disputeResolutionRule: {
        disputeDeadlineDays: 30,
        escalationLevel1: {
          level: 1,
          roleTitle: 'Finance Operations Manager',
          timelineDays: 7,
          action: 'Notify and request explanation',
        },
        escalationLevel2: {
          level: 2,
          roleTitle: 'CFO Office',
          timelineDays: 15,
          action: 'Escalate to executive team',
        },
      },
      requiresApproval: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-01T14:00:00Z',
      createdBy: 'user_finance',
    },
    
    {
      id: 'config002',
      insurerId: 'c1002',
      commissionSettlementCycle: 'Monthly',
      billCutOffDay: 3,
      reconciliationDeadline: 10,
      paymentTermDays: 30,
      premiumCollectionMethod: 'ChannelToMyToInsurer',
      premiumSettlementCycle: 'Weekly',
      settlementCurrency: 'USD',
      insurerBankAccount: {
        accountName: 'Allstate Insurance Company',
        accountNumber: '****3456',
        routingNumber: '071000013',
        bankName: 'Bank of America',
        bankAddress: 'Chicago, IL',
        accountType: 'Business',
        isPrimary: true,
        country: 'USA',
      },
      myBankAccount: {
        accountName: 'Our Company MGA Account',
        accountNumber: '****5678',
        routingNumber: '021000021',
        bankName: 'JPMorgan Chase Bank',
        bankAddress: 'New York, NY',
        accountType: 'Business',
        isPrimary: true,
        country: 'USA',
      },
      reconciliationMethod: 'ApiPull',
      billFormat: 'CSV',
      commissionTaxRate: 0,
      disputeResolutionRule: {
        disputeDeadlineDays: 21,
        escalationLevel1: {
          level: 1,
          roleTitle: 'Finance Manager',
          timelineDays: 5,
          action: 'Review and contact insurer',
        },
        escalationLevel2: {
          level: 2,
          roleTitle: 'CFO Office',
          timelineDays: 14,
          action: 'Executive escalation',
        },
      },
      requiresApproval: true,
      createdAt: '2023-06-01T10:00:00Z',
      updatedAt: '2024-09-01T09:00:00Z',
      createdBy: 'user_finance',
    },
  ]
}

export function generateMockContactPersons(): ContactPerson[] {
  const insurers = [
    { id: 'c1001', name: 'Travelers' },
    { id: 'c1002', name: 'Allstate' },
    { id: 'c1003', name: 'Mapfre Generales' },
  ]
  
  return [
    {
      id: 'contact001',
      insurerId: 'c1001',
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Sarah Johnson',
      position: 'Regional President - West Coast',
      department: 'Sales',
      role: 'AccountManager',
      email: 'sarah.johnson@travelers.com',
      phone: '+1-415-555-0201',
      mobilePhone: '+1-415-555-0202',
      officeAddress: '100 Broadway, Oakland, CA 94607',
      isActive: true,
      isPrimary: true,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-08-01T10:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'contact002',
      insurerId: 'c1001',
      firstName: 'James',
      lastName: 'Wilson',
      fullName: 'James Wilson',
      position: 'Senior Vice President - Claims',
      department: 'Claims',
      role: 'Claims',
      email: 'james.wilson@travelers.com',
      phone: '+1-415-555-0301',
      officeAddress: '100 Broadway, Oakland, CA 94607',
      isActive: true,
      isPrimary: true,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'contact003',
      insurerId: 'c1001',
      firstName: 'Patricia',
      lastName: 'Davis',
      fullName: 'Patricia Davis',
      position: 'Chief Financial Officer',
      department: 'Finance',
      role: 'Finance',
      email: 'patricia.davis@travelers.com',
      phone: '+1-415-555-0401',
      officeAddress: '100 Broadway, Oakland, CA 94607',
      isActive: true,
      isPrimary: true,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'contact004',
      insurerId: 'c1001',
      firstName: 'Daniel',
      lastName: 'Martinez',
      fullName: 'Daniel Martinez',
      position: 'VP Technology & Integration',
      department: 'IT',
      role: 'IT',
      email: 'daniel.martinez@travelers.com',
      phone: '+1-415-555-0501',
      officeAddress: '100 Broadway, Oakland, CA 94607',
      isActive: true,
      isPrimary: true,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'contact005',
      insurerId: 'c1002',
      firstName: 'Michael',
      lastName: 'Thompson',
      fullName: 'Michael Thompson',
      position: 'Chief Executive Officer',
      department: 'Executive',
      role: 'Executive',
      email: 'm.thompson@allstate.com',
      phone: '+1-312-555-0201',
      officeAddress: '2100 South River Road, Des Plaines, IL 60018',
      isActive: true,
      isPrimary: true,
      createdAt: '2023-06-01T09:00:00Z',
      updatedAt: '2023-06-01T09:00:00Z',
      createdBy: 'user_admin',
    },
    
    {
      id: 'contact006',
      insurerId: 'c1003',
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      fullName: 'Carlos Rodriguez',
      position: 'Sales Director - Southwest',
      department: 'Sales',
      role: 'AccountManager',
      email: 'carlos.rodriguez@mapfre.com',
      phone: '+1-214-555-0201',
      officeAddress: '2601 North Stemmons Freeway, Dallas, TX 75207',
      isActive: true,
      isPrimary: true,
      createdAt: '2021-03-01T09:00:00Z',
      updatedAt: '2021-03-01T09:00:00Z',
      createdBy: 'user_admin',
    },
  ]
}

export function generateMockCommunicationLogs(): CommunicationLog[] {
  return [
    {
      id: 'log001',
      contactPersonId: 'contact001',
      insurerId: 'c1001',
      logType: 'Meeting',
      logDate: '2024-11-15T14:00:00Z',
      subject: 'Q4 Business Review',
      content: 'Reviewed Q3 performance metrics and discussed Q4 targets. Travelers exceeded production target by 15%. Discussed new AUTO products expansion to NV state.',
      participants: ['John Williams', 'Sarah Johnson', 'Mike Chen (Underwriter)'],
      followUpTask: 'Submit formal proposal for NV expansion by Dec 1',
      followUpDate: '2024-12-01T23:59:59Z',
      priority: 'High',
      resolved: false,
      attachments: [],
      createdAt: '2024-11-15T16:00:00Z',
      createdBy: 'user_partnership_mgr',
    },
    
    {
      id: 'log002',
      contactPersonId: 'contact003',
      insurerId: 'c1001',
      logType: 'Email',
      logDate: '2024-10-28T10:30:00Z',
      subject: 'Q3 Commission Statement',
      content: 'Received Q3 commission statement from Patricia Davis. Amount: $127,450. Verified against our records - match confirmed.',
      participants: ['Lisa Wang'],
      followUpTask: undefined,
      followUpDate: undefined,
      priority: 'Medium',
      resolved: true,
      attachments: [
        {
          fileName: 'Q3_Commission_Statement_TRV_2024.pdf',
          fileType: 'application/pdf',
          fileSize: 245000,
          url: '/attachments/log002/commission_stmt.pdf',
          uploadedAt: '2024-10-28T10:35:00Z',
          uploadedBy: 'user_finance',
        },
      ],
      createdAt: '2024-10-28T10:35:00Z',
      createdBy: 'user_finance',
    },
    
    {
      id: 'log003',
      contactPersonId: 'contact004',
      insurerId: 'c1001',
      logType: 'Phone',
      logDate: '2024-10-20T09:15:00Z',
      subject: 'API Integration Questions',
      content: 'Discussed technical requirements for policy sync API integration. Daniel will send updated API documentation v2.3 by end of week.',
      participants: ['Kevin Wang', 'Daniel Martinez'],
      followUpTask: 'Review updated API docs and plan implementation schedule',
      followUpDate: '2024-10-31T23:59:59Z',
      priority: 'Medium',
      resolved: false,
      attachments: [],
      createdAt: '2024-10-20T09:20:00Z',
      createdBy: 'kevin.wang',
    },
    
    {
      id: 'log004',
      contactPersonId: 'contact005',
      insurerId: 'c1002',
      logType: 'Meeting',
      logDate: '2024-09-05T15:00:00Z',
      subject: 'Annual Strategic Planning Session',
      content: 'Michael Thompson (CEO) met with our leadership team. Discussed long-term partnership vision and potential MGA expansion opportunities.',
      participants: ['Emily Chen', 'Michael Thompson', 'Jennifer Lopez (Our CEO)', 'Mark Davis (Our CFO)'],
      followUpTask: 'Schedule detailed MGA discussion with underwriting team',
      followUpDate: '2024-09-20T23:59:59Z',
      priority: 'High',
      resolved: false,
      attachments: [
        {
          fileName: 'Annual_Planning_Deck_2025.pptx',
          fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          fileSize: 4567000,
          url: '/attachments/log004/planning_deck.pptx',
          uploadedAt: '2024-09-05T16:00:00Z',
          uploadedBy: 'emily.chen',
        },
      ],
      createdAt: '2024-09-05T16:00:00Z',
      createdBy: 'emily.chen',
    },
    
    {
      id: 'log005',
      contactPersonId: 'contact006',
      insurerId: 'c1003',
      logType: 'IM',
      logDate: '2024-08-10T11:45:00Z',
      subject: 'Quick Question about Renewals',
      content: 'Carlos sent message via Teams asking about renewal process for existing policies. Explained that renewals are automatic unless cancellation received.',
      participants: ['David Martinez', 'Carlos Rodriguez'],
      followUpTask: undefined,
      followUpDate: undefined,
      priority: 'Low',
      resolved: true,
      attachments: [],
      createdAt: '2024-08-10T11:50:00Z',
      createdBy: 'david.martinez',
    },
  ]
}

// Export all generators
export const mockCooperations = generateMockCooperations()
export const mockContracts = generateMockContracts()
export const mockSettlementConfigs = generateMockSettlementConfigs()
export const mockContactPersons = generateMockContactPersons()
export const mockCommunicationLogs = generateMockCommunicationLogs()

// ============================================================================
// COOPERATION FORM OPTIONS (功能点 3.1 - 3.2)
// ============================================================================

/** 合作表单向导的表单数据结构 */
export interface CooperationsFormData {
  insurerId: string
  cooperationType?: CooperationType
  status: CooperationStatus
  myContactPerson: { name: string; email: string; phone: string; position?: string }
  insurerContactPerson: { name: string; position: string; email: string; phone: string }
  settlementMethod?: SettlementMethod
  settlementCycle: number
  premiumCollectionMethod?: PremiumCollectionMethod
  premiumSettlementCycle: PremiumSettlementFrequency
  effectiveDate: string
  expirationDate?: string
  productScope: ProductScopeConfig
  stateScope: State[]
  contractFile?: FileMetadata
}

/** 终止原因选项 */
export const TERMINATION_REASONS: Array<{ value: string; label: string }> = [
  { value: 'performance', label: 'Performance Issues' },
  { value: 'business-strategy', label: 'Business Strategy Adjustment' },
  { value: 'compliance', label: 'Compliance Violation' },
  { value: 'low-volume', label: 'Low Business Volume' },
  { value: 'mutual-agreement', label: 'Mutual Agreement' },
  { value: 'contract-expiry', label: 'Contract Expiry (Not Renewing)' },
  { value: 'other', label: 'Other' },
]

/** 终止类型选项 */
export const TERMINATION_TYPES: Array<{ value: string; label: string }> = [
  { value: 'immediate', label: 'Immediate Termination' },
  { value: 'grace-period', label: 'Termination with Grace Period (30 days)' },
  { value: 'end-of-term', label: 'Effective at End of Current Term' },
]

/** Pending Quote 处理策略选项 */
export const PENDING_QUOTE_ACTIONS: Array<{ value: string; label: string }> = [
  { value: 'honor', label: 'Honor Existing Quotes Until Expiry' },
  { value: 'void', label: 'Void All Pending Quotes Immediately' },
  { value: 'review', label: 'Case-by-Case Review' },
]

/** 在保保单服务安排选项 */
export const ACTIVE_POLICY_ACTIONS: Array<{ value: string; label: string }> = [
  { value: 'service-through-expiry', label: 'Continue Service Until Policy Expiry' },
  { value: 'transfer', label: 'Transfer Policies to Another Channel' },
  { value: 'terminate-immediately', label: 'Terminate Coverage Immediately (Requires Legal Review)' },
]

/** 未结佣金结算方案选项 */
export const COMMISSION_ACTIONS: Array<{ value: string; label: string }> = [
  { value: 'settle-all', label: 'Settle All Unpaid Commissions in Final Cycle' },
  { value: 'forfeit', label: 'Forfeit Commissions on Terminated Business' },
  { value: 'hold-disputes', label: 'Hold Until Disputes Resolved' },
]
