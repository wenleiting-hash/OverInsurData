// Mock data for Product Management - 1:1 matches design prototype screenshot
// Values from functional requirements: ~10 products across different carriers and LOBs

export interface InsuranceProduct {
  productId: string
  naicCode: string
  productName: string
  shortName: string
  productCode: string
  naicFormNumber?: string
  
  // Product details
  description?: string
  coverages?: string[]
  
  // Rate configuration
  rateType?: 'Flat' | 'Tiered' | 'UsageBased'
  baseRate?: number
  minPremium?: number
  maxPremium?: number
  rateFactors?: string[]
  
  // Business attributes
  lineOfBusiness: 'AUTO' | 'HOME' | 'LIFE' | 'HEALTH' | 'COMMERCIAL' | 'P&C'
  subLine?: string
  type: 'Individual' | 'Group' | 'VoluntaryBenefits'
  
  // Carrier relationship
  insurerId: string
  insurerName: string
  
  // Underwriting configuration
  underwritingMode: 'Auto' | 'Manual' | 'MGA'
  authorizedChannels?: string[]
  maxPolicyLimit?: number
  mgaNegotiationAuthority?: boolean
  
  // Renewal configuration
  renewalType: 'Guaranteed' | 'Conditional' | 'Non-Renewable'
  policyTermYears: number
  
  // Underwriting configuration (Step 2 of ProductForm)
  ageMin?: number
  ageMax?: number
  excludeDUI?: boolean
  referHighValue?: boolean
  referThreshold?: number
  blacklistConditions?: string[]
  
  // Regulatory approval status
  regulatoryApprovalStatus?: 'Approved' | 'Pending' | 'Rejected'
  lastAuditDate?: string
  complianceOfficer?: string
  
  // Geographic scope
  availableStates: string[]
  effectiveDate: string
  expirationDate?: string
  
  // Status management
  status: 'Active' | 'Paused' | 'Inactive' | 'Pending'
  isActive: boolean
  
  // Performance metrics (YTD)
  premiumYTD?: number
  policyCount?: number
  avgPremium?: number
  lossRatio?: number
  renewalRate?: number
  
  // Attachments
  documents?: Array<{
    name: string
    type: 'Terms' | 'RateBook' | 'SalesGuide'
    uploadDate: string
    version: string
  }>
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

// Premium Trend Data (for performance charts)
export const productPremiumTrendData = [
  { month: 'Jan', newBiz: 42.3, renewal: 128.5, premium: 170.8 },
  { month: 'Feb', newBiz: 40.1, renewal: 130.2, premium: 170.3 },
  { month: 'Mar', newBiz: 44.8, renewal: 131.7, premium: 176.5 },
  { month: 'Apr', newBiz: 48.2, renewal: 132.9, premium: 181.1 },
  { month: 'May', newBiz: 50.5, renewal: 133.8, premium: 184.3 },
  { month: 'Jun', newBiz: 52.1, renewal: 134.5, premium: 186.6 },
  { month: 'Jul', newBiz: 53.8, renewal: 135.3, premium: 189.1 },
  { month: 'Aug', newBiz: 55.2, renewal: 136.1, premium: 191.3 },
]

export const products: InsuranceProduct[] = [
  // AUTO Products (4 条)
  { 
    productId: 'p1001', 
    naicCode: 'CA-auto-liability', 
    productName: 'California Auto Liability Insurance Plan', 
    shortName: 'CAL Auto Liability', 
    productCode: 'CA-LIAB-2026',
    naicFormNumber: 'CA-12345',
    lineOfBusiness: 'AUTO',
    subLine: 'Liability',
    type: 'Individual',
    insurerId: 'c1001',
    insurerName: 'Travelers',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001', 'ch2002'],
    maxPolicyLimit: 500000,
    mgaNegotiationAuthority: false,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['CA', 'NV', 'AZ'],
    effectiveDate: '2024-01-15T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 18,
    ageMax: 75,
    excludeDUI: true,
    referHighValue: true,
    referThreshold: 1000000,
    blacklistConditions: ['poorCredit', 'fraudHistory'],
    // Regulatory approval
    regulatoryApprovalStatus: 'Approved',
    lastAuditDate: '2026-06-15T00:00:00Z',
    complianceOfficer: 'John Smith',
    premiumYTD: 12500000,
    policyCount: 8500,
    avgPremium: 1470,
    lossRatio: 0.58,
    renewalRate: 0.92,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  { 
    productId: 'p1002', 
    naicCode: 'NY-auto-comprehensive', 
    productName: 'New York Auto Comprehensive Coverage', 
    shortName: 'NY Auto Comp', 
    productCode: 'NY-COMP-2026',
    naicFormNumber: 'NY-67890',
    lineOfBusiness: 'AUTO',
    subLine: 'Comprehensive',
    type: 'Individual',
    insurerId: 'c1002',
    insurerName: 'Chubb',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2003'],
    maxPolicyLimit: 750000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['NY', 'NJ', 'PA'],
    effectiveDate: '2024-03-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 21,
    ageMax: 65,
    excludeDUI: true,
    referHighValue: false,
    blacklistConditions: ['mispresentation'],
    // Regulatory approval
    regulatoryApprovalStatus: 'Approved',
    lastAuditDate: '2026-05-20T00:00:00Z',
    complianceOfficer: 'Emily Johnson',
    premiumYTD: 8900000,
    policyCount: 6200,
    avgPremium: 1435,
    lossRatio: 0.62,
    renewalRate: 0.89,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  { 
    productId: 'p1003', 
    naicCode: 'TX-auto-collision', 
    productName: 'Texas Auto Collision Protection', 
    shortName: 'TX Auto Collision', 
    productCode: 'TX-COLL-2026',
    naicFormNumber: 'TX-11223',
    lineOfBusiness: 'AUTO',
    subLine: 'Collision',
    type: 'Group',
    insurerId: 'c1005',
    insurerName: 'State Farm',
    underwritingMode: 'Manual',
    authorizedChannels: ['ch2001', 'ch2004', 'ch2005'],
    maxPolicyLimit: 1000000,
    mgaNegotiationAuthority: true,
    renewalType: 'Conditional',
    policyTermYears: 2,
    availableStates: ['TX', 'OK', 'LA'],
    effectiveDate: '2024-06-01T00:00:00Z',
    expirationDate: '2026-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 15600000,
    policyCount: 9800,
    avgPremium: 1592,
    lossRatio: 0.55,
    renewalRate: 0.94,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
  },
  { 
    productId: 'p1004', 
    naicCode: 'FL-auto-medical', 
    productName: 'Florida Auto Medical Payments Plan', 
    shortName: 'FL Auto MedPay', 
    productCode: 'FL-MED-2026',
    naicFormNumber: 'FL-44556',
    lineOfBusiness: 'AUTO',
    subLine: 'Medical Payments',
    type: 'Individual',
    insurerId: 'c1006',
    insurerName: 'The Hartford',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2002'],
    maxPolicyLimit: 250000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['FL', 'GA', 'AL'],
    effectiveDate: '2025-01-10T00:00:00Z',
    expirationDate: '2028-12-31T00:00:00Z',
    status: 'Pending',
    isActive: false,
    premiumYTD: 2100000,
    policyCount: 1500,
    avgPremium: 1400,
    lossRatio: 0.60,
    renewalRate: 0.85,
    createdAt: '2025-01-10T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  },
  
  // HOME Products (3 条)
  { 
    productId: 'p1005', 
    naicCode: 'CA-homeowners-basic', 
    productName: 'California Homeowners Basic Package', 
    shortName: 'CA Home Basic', 
    productCode: 'CA-HOME-2026',
    naicFormNumber: 'CA-78901',
    lineOfBusiness: 'HOME',
    subLine: 'Dwelling',
    type: 'Individual',
    insurerId: 'c1001',
    insurerName: 'Travelers',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001', 'ch2003'],
    maxPolicyLimit: 2000000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['CA', 'NV'],
    effectiveDate: '2024-02-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 18500000,
    policyCount: 12000,
    avgPremium: 1542,
    lossRatio: 0.52,
    renewalRate: 0.95,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2026-08-19T00:00:00Z',
  },
  { 
    productId: 'p1006', 
    naicCode: 'NY-condo-comprehensive', 
    productName: 'New York Condo Owners Comprehensive', 
    shortName: 'NY Condo Comp', 
    productCode: 'NY-CONDO-2026',
    naicFormNumber: 'NY-23456',
    lineOfBusiness: 'HOME',
    subLine: 'Condo',
    type: 'Individual',
    insurerId: 'c1002',
    insurerName: 'Chubb',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2003'],
    maxPolicyLimit: 1500000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['NY', 'CT'],
    effectiveDate: '2024-04-15T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 11200000,
    policyCount: 7800,
    avgPremium: 1436,
    lossRatio: 0.48,
    renewalRate: 0.93,
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2026-08-17T00:00:00Z',
  },
  { 
    productId: 'p1007', 
    naicCode: 'WA-renters-insurance', 
    productName: 'Washington Renters Insurance Plan', 
    shortName: 'WA Renters', 
    productCode: 'WA-RENT-2026',
    naicFormNumber: 'WA-34567',
    lineOfBusiness: 'HOME',
    subLine: 'Renters',
    type: 'Individual',
    insurerId: 'c1008',
    insurerName: 'Progressive',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2004'],
    maxPolicyLimit: 500000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['WA', 'OR', 'AK'],
    effectiveDate: '2025-03-01T00:00:00Z',
    expirationDate: '2028-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 4500000,
    policyCount: 4200,
    avgPremium: 1071,
    lossRatio: 0.45,
    renewalRate: 0.91,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2026-08-22T00:00:00Z',
  },
  
  // LIFE Products (2 条)
  { 
    productId: 'p1008', 
    naicCode: 'IL-term-life-standard', 
    productName: 'Illinois Term Life Standard Coverage', 
    shortName: 'IL Term Life', 
    productCode: 'IL-LIFE-2026',
    naicFormNumber: 'IL-56789',
    lineOfBusiness: 'LIFE',
    subLine: 'Term Life',
    type: 'Individual',
    insurerId: 'c1005',
    insurerName: 'State Farm',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001', 'ch2002', 'ch2005'],
    maxPolicyLimit: 5000000,
    renewalType: 'Non-Renewable',
    policyTermYears: 10,
    availableStates: ['IL', 'IN', 'WI', 'MI'],
    effectiveDate: '2024-01-20T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 22500000,
    policyCount: 15000,
    avgPremium: 1500,
    lossRatio: 0.42,
    renewalRate: 0.78,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2026-08-21T00:00:00Z',
  },
  { 
    productId: 'p1009', 
    naicCode: 'OH-whole-life-premium', 
    productName: 'Ohio Whole Life Premium Plan', 
    shortName: 'OH Whole Life', 
    productCode: 'OH-WHOLE-2026',
    naicFormNumber: 'OH-67890',
    lineOfBusiness: 'LIFE',
    subLine: 'Whole Life',
    type: 'Individual',
    insurerId: 'c1007',
    insurerName: 'Allstate',
    underwritingMode: 'Manual',
    authorizedChannels: ['ch2003', 'ch2004'],
    maxPolicyLimit: 10000000,
    mgaNegotiationAuthority: false,
    renewalType: 'Non-Renewable',
    policyTermYears: 30,
    availableStates: ['OH', 'PA', 'KY', 'WV'],
    effectiveDate: '2024-05-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Paused',
    isActive: false,
    premiumYTD: 16800000,
    policyCount: 8500,
    avgPremium: 1976,
    lossRatio: 0.38,
    renewalRate: 0.82,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2026-08-10T00:00:00Z',
  },
  
  // HEALTH Products (1 条)
  { 
    productId: 'p1010', 
    naicCode: 'MA-health-critical-care', 
    productName: 'Massachusetts Critical Care Health Insurance', 
    shortName: 'MA Critical Care', 
    productCode: 'MA-HEALTH-2026',
    naicFormNumber: 'MA-89012',
    lineOfBusiness: 'HEALTH',
    subLine: 'Critical Illness',
    type: 'Group',
    insurerId: 'c1001',
    insurerName: 'Travelers',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001'],
    maxPolicyLimit: 3000000,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['MA', 'CT', 'RI', 'NH', 'VT', 'ME'],
    effectiveDate: '2024-07-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    premiumYTD: 9800000,
    policyCount: 5200,
    avgPremium: 1885,
    lossRatio: 0.65,
    renewalRate: 0.88,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z',
  },
] as InsuranceProduct[];

export function formatCurrency(value: number, short = false): string {
  if (short) {
    const M = Math.abs(value) / 1_000_000
    return `${value < 0 ? '-' : ''}${M.toFixed(1)}M`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 }).format(value)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
