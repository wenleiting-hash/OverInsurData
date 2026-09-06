// Mock data for Product Management - 1:1 matches design prototype screenshot
// Values from functional requirements: ~10 products across different carriers and LOBs

export interface InsuranceProduct {
  productId: string
  naicCode: string
  productName: string
  shortName: string
  productCode: string
  naicFormNumber?: string
  
  // Product details (description 中文主值 + descriptionEn 英文平行，coverages 为稳定英文 key)
  description?: string
  descriptionEn?: string
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
    // Product description & rate configuration
    description: '覆盖加州、内华达、亚利桑那三州的标准汽车责任险产品，提供第三者人身伤害与财产损失保障，支持在线自动核保。',
    descriptionEn: 'Standard auto liability product covering CA, NV, and AZ, providing third-party bodily injury and property damage protection with online automated underwriting.',
    coverages: ['Liability', 'UninsuredMotorist', 'RoadsideAssistance'],
    rateType: 'Tiered',
    baseRate: 1240,
    minPremium: 480,
    maxPremium: 4200,
    rateFactors: ['DrivingRecord', 'VehicleType', 'Age', 'CreditScore', 'Region'],
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
    // Product description & rate configuration
    description: '纽约州综合汽车保险，涵盖碰撞之外的玻璃、盗抢、自然灾害等风险，面向个人车主。',
    descriptionEn: 'New York comprehensive auto coverage protecting against glass, theft, and natural disasters beyond collision, for individual vehicle owners.',
    coverages: ['Comprehensive', 'Collision', 'VehicleReplacement'],
    rateType: 'Tiered',
    baseRate: 1435,
    minPremium: 520,
    maxPremium: 4800,
    rateFactors: ['DrivingRecord', 'VehicleType', 'Age', 'CreditScore'],
    lineOfBusiness: 'AUTO',
    subLine: 'Comprehensive',
    type: 'Individual',
    insurerId: 'c1002',
    insurerName: 'Chubb',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2003'],
    maxPolicyLimit: 750000,
    mgaNegotiationAuthority: false,
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
    // Product description & rate configuration
    description: '德州汽车碰撞损失保障，支持群体投保与 MGA 渠道分销，最高保额 100 万美元。',
    descriptionEn: 'Texas auto collision protection with group enrollment and MGA distribution support, up to $1M limit.',
    coverages: ['Collision', 'MedicalPayments'],
    rateType: 'Tiered',
    baseRate: 1592,
    minPremium: 600,
    maxPremium: 5200,
    rateFactors: ['DrivingRecord', 'VehicleValue', 'AccidentHistory', 'Region'],
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
    // Underwriting config
    ageMin: 21,
    ageMax: 70,
    excludeDUI: true,
    referHighValue: true,
    referThreshold: 1200000,
    blacklistConditions: ['fraudHistory', 'mispresentation'],
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
    // Product description & rate configuration
    description: '佛罗里达州医疗赔付补充保障，承担事故后乘客与驾驶人的必要医疗费用，目前处于待审核状态。',
    descriptionEn: 'Florida medical payments supplement covering necessary medical expenses for drivers and passengers after an accident; currently pending review.',
    coverages: ['MedicalPayments'],
    rateType: 'Flat',
    baseRate: 1400,
    minPremium: 300,
    maxPremium: 2500,
    rateFactors: ['Age', 'AccidentHistory'],
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
    // Underwriting config
    ageMin: 18,
    ageMax: 75,
    excludeDUI: true,
    referHighValue: false,
    blacklistConditions: ['mispresentation'],
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
    // Product description & rate configuration
    description: '加州基础房屋保险套餐，覆盖住宅主体结构及附带建筑物损失，支持年度续保。',
    descriptionEn: 'California basic homeowners package covering dwelling structure and attached buildings, with annual renewal support.',
    coverages: [],
    rateType: 'Tiered',
    baseRate: 1542,
    minPremium: 650,
    maxPremium: 8500,
    rateFactors: ['Region', 'SafetyEquipment', 'AccidentHistory'],
    lineOfBusiness: 'HOME',
    subLine: 'Dwelling',
    type: 'Individual',
    insurerId: 'c1001',
    insurerName: 'Travelers',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001', 'ch2003'],
    maxPolicyLimit: 2000000,
    mgaNegotiationAuthority: false,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['CA', 'NV'],
    effectiveDate: '2024-02-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 21,
    ageMax: 80,
    excludeDUI: false,
    referHighValue: true,
    referThreshold: 2000000,
    blacklistConditions: ['poorCredit', 'fraudHistory'],
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
    // Product description & rate configuration
    description: '纽约公寓业主综合保障，覆盖单元内部装修、个人财产与责任风险。',
    descriptionEn: 'New York condo owners comprehensive protection covering unit improvements, personal property, and liability risks.',
    coverages: [],
    rateType: 'Tiered',
    baseRate: 1436,
    minPremium: 580,
    maxPremium: 7200,
    rateFactors: ['Region', 'SafetyEquipment'],
    lineOfBusiness: 'HOME',
    subLine: 'Condo',
    type: 'Individual',
    insurerId: 'c1002',
    insurerName: 'Chubb',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2003'],
    maxPolicyLimit: 1500000,
    mgaNegotiationAuthority: false,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['NY', 'CT'],
    effectiveDate: '2024-04-15T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 25,
    ageMax: 75,
    excludeDUI: false,
    referHighValue: true,
    referThreshold: 1500000,
    blacklistConditions: ['poorCredit'],
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
    // Product description & rate configuration
    description: '华盛顿州租客保险计划，保障个人财产、临时居住费用与第三方责任。',
    descriptionEn: 'Washington renters insurance plan covering personal property, additional living expenses, and third-party liability.',
    coverages: [],
    rateType: 'Flat',
    baseRate: 1071,
    minPremium: 240,
    maxPremium: 3600,
    rateFactors: ['Region', 'SafetyEquipment', 'CreditScore'],
    lineOfBusiness: 'HOME',
    subLine: 'Renters',
    type: 'Individual',
    insurerId: 'c1008',
    insurerName: 'Progressive',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2004'],
    maxPolicyLimit: 500000,
    mgaNegotiationAuthority: false,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['WA', 'OR', 'AK'],
    effectiveDate: '2025-03-01T00:00:00Z',
    expirationDate: '2028-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 18,
    ageMax: 70,
    excludeDUI: false,
    referHighValue: false,
    blacklistConditions: ['poorCredit'],
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
    // Product description & rate configuration
    description: '伊利诺伊州定期寿险标准方案，10 年固定费率，支持 500 万美元最高保额。',
    descriptionEn: 'Illinois term life standard plan with 10-year level rates and up to $5M coverage.',
    coverages: [],
    rateType: 'Tiered',
    baseRate: 1500,
    minPremium: 800,
    maxPremium: 12000,
    rateFactors: ['Age', 'AgeBracket', 'AccidentHistory'],
    lineOfBusiness: 'LIFE',
    subLine: 'Term Life',
    type: 'Individual',
    insurerId: 'c1005',
    insurerName: 'State Farm',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001', 'ch2002', 'ch2005'],
    maxPolicyLimit: 5000000,
    mgaNegotiationAuthority: false,
    renewalType: 'Non-Renewable',
    policyTermYears: 10,
    availableStates: ['IL', 'IN', 'WI', 'MI'],
    effectiveDate: '2024-01-20T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 18,
    ageMax: 65,
    excludeDUI: true,
    referHighValue: true,
    referThreshold: 3000000,
    blacklistConditions: ['fraudHistory'],
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
    // Product description & rate configuration
    description: '俄亥俄州终身寿险高端方案，具备现金价值累积与分红功能，目前暂停销售。',
    descriptionEn: 'Ohio whole life premium plan with cash value accumulation and dividend features; currently paused.',
    coverages: [],
    rateType: 'Tiered',
    baseRate: 1976,
    minPremium: 1200,
    maxPremium: 25000,
    rateFactors: ['Age', 'AgeBracket', 'AccidentHistory'],
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
    // Underwriting config
    ageMin: 30,
    ageMax: 70,
    excludeDUI: true,
    referHighValue: false,
    blacklistConditions: ['fraudHistory', 'mispresentation'],
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
    // Product description & rate configuration
    description: '马萨诸塞州重疾健康保险，覆盖 28 种重大疾病的一次性给付，面向团体客户。',
    descriptionEn: 'Massachusetts critical care health insurance providing lump-sum benefits for 28 critical illnesses, for group clients.',
    coverages: [],
    rateType: 'Flat',
    baseRate: 1885,
    minPremium: 500,
    maxPremium: 8000,
    rateFactors: ['AgeBracket'],
    lineOfBusiness: 'HEALTH',
    subLine: 'Critical Illness',
    type: 'Group',
    insurerId: 'c1001',
    insurerName: 'Travelers',
    underwritingMode: 'Auto',
    authorizedChannels: ['ch2001'],
    maxPolicyLimit: 3000000,
    mgaNegotiationAuthority: false,
    renewalType: 'Guaranteed',
    policyTermYears: 1,
    availableStates: ['MA', 'CT', 'RI', 'NH', 'VT', 'ME'],
    effectiveDate: '2024-07-01T00:00:00Z',
    expirationDate: '2027-12-31T00:00:00Z',
    status: 'Active',
    isActive: true,
    // Underwriting config
    ageMin: 18,
    ageMax: 65,
    excludeDUI: false,
    referHighValue: false,
    blacklistConditions: ['mispresentation'],
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
