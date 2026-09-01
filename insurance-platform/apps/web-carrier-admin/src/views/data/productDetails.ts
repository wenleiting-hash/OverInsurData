export interface RatePlan {
  id: string;
  productId: string;
  name: string;
  tier: 'Standard' | 'Enhanced' | 'Premium' | 'Basic';
  baseRate: number;
  minPremium: number;
  maxPremium: number;
  effectiveDate: string;
  expiryDate: string;
  status: 'active' | 'draft' | 'expired' | 'pending';
  ratingFactors: { factor: string; description: string; weight: number }[];
  filingStatus: 'approved' | 'pending' | 'not-required';
}

export interface ProductState {
  code: string;
  name: string;
  enabled: boolean;
  effectiveDate?: string;
  filingNumber?: string;
  status: 'active' | 'pending' | 'suspended' | 'not-available';
  channelCount?: number;
}

export interface UnderwritingRule {
  id: string;
  productId: string;
  name: string;
  category: 'eligibility' | 'rating' | 'exclusion' | 'referral';
  priority: number;
  condition: string;
  conditionDetail: string;
  action: 'approve' | 'decline' | 'refer' | 'surcharge' | 'discount';
  actionValue?: string;
  status: 'active' | 'inactive' | 'testing';
  lastModified: string;
  modifiedBy: string;
}

export interface TrainingMaterial {
  id: string;
  productId: string;
  title: string;
  type: 'product-guide' | 'rate-manual' | 'underwriting-guide' | 'compliance' | 'training-deck' | 'faq' | 'video';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  version: string;
  downloads: number;
  requiredFor: string[];
  expiryDate?: string;
}

export interface ProductPerformanceData {
  month: string;
  premium: number;
  newBiz: number;
  renewal: number;
  policies: number;
  lossRatio: number;
  claimsCount: number;
}

export const ratePlans: RatePlan[] = [
  {
    id: 'rp1',
    productId: 'p1',
    name: 'Standard Auto',
    tier: 'Standard',
    baseRate: 1240,
    minPremium: 480,
    maxPremium: 4200,
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    ratingFactors: [
      { factor: '驾驶记录', description: '过去 3 年无事故折扣', weight: 0.25 },
      { factor: '车型系数', description: '基于车辆安全等级', weight: 0.20 },
      { factor: '驾龄', description: '< 3 年附加 30%', weight: 0.15 },
      { factor: '信用评分', description: 'Credit-based insurance score', weight: 0.20 },
      { factor: '地区系数', description: '城市/郊区/农村区分', weight: 0.20 },
    ],
    filingStatus: 'approved',
  },
  {
    id: 'rp2',
    productId: 'p1',
    name: 'Enhanced Auto',
    tier: 'Enhanced',
    baseRate: 1680,
    minPremium: 720,
    maxPremium: 6500,
    effectiveDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    ratingFactors: [
      { factor: '驾驶记录', description: '过去 5 年全记录分析', weight: 0.30 },
      { factor: '车型系数', description: 'MSRP + 安全等级加权', weight: 0.20 },
      { factor: '驾龄', description: '分级附加系数', weight: 0.15 },
      { factor: '信用评分', description: 'Tier 1–6 分级', weight: 0.20 },
      { factor: '用途系数', description: '通勤/商用/偶尔', weight: 0.15 },
    ],
    filingStatus: 'approved',
  },
];

export const getProductStates = (productId: string): ProductState[] => {
  // Return state data based on productId
  return [
    { code: 'CA', name: 'California', enabled: true, status: 'active', channelCount: 128 },
    { code: 'TX', name: 'Texas', enabled: true, status: 'active', channelCount: 96 },
    { code: 'FL', name: 'Florida', enabled: true, status: 'active', channelCount: 72 },
    { code: 'NY', name: 'New York', enabled: true, status: 'active', channelCount: 85 },
    { code: 'IL', name: 'Illinois', enabled: true, status: 'active', channelCount: 54 },
    { code: 'PA', name: 'Pennsylvania', enabled: true, status: 'pending' },
    { code: 'OH', name: 'Ohio', enabled: false, status: 'not-available' },
    { code: 'GA', name: 'Georgia', enabled: false, status: 'not-available' },
  ];
};

export const underwritingRules: UnderwritingRule[] = [
  {
    id: 'ur1',
    productId: 'p1',
    name: 'Young Driver Surcharge',
    category: 'rating',
    priority: 1,
    condition: 'Age < 25 AND ClaimHistory = No Claims',
    conditionDetail: 'Apply surcharge for drivers under 25 with clean driving record',
    action: 'surcharge',
    actionValue: '+15%',
    status: 'active',
    lastModified: '2026-01-15',
    modifiedBy: 'System Admin',
  },
  {
    id: 'ur2',
    productId: 'p1',
    name: 'Multi-Policy Discount',
    category: 'rating',
    priority: 2,
    condition: 'HasOtherPolicies = TRUE',
    conditionDetail: 'Customer has other insurance policies with same carrier',
    action: 'discount',
    actionValue: '-10%',
    status: 'active',
    lastModified: '2026-02-01',
    modifiedBy: 'Underwriting Team',
  },
  {
    id: 'ur3',
    productId: 'p1',
    name: 'High Risk Vehicle Exclusion',
    category: 'exclusion',
    priority: 3,
    condition: 'VehicleRiskScore > 80',
    conditionDetail: 'Exclude vehicles with high risk assessment scores',
    action: 'decline',
    status: 'active',
    lastModified: '2025-11-20',
    modifiedBy: 'Automated System',
  },
];

export const trainingMaterials: TrainingMaterial[] = [
  {
    id: 'tm1',
    productId: 'p1',
    title: 'Auto Insurance Product Guide',
    type: 'product-guide',
    fileName: 'auto_insurance_guide_v2.pdf',
    fileSize: '2.4 MB',
    uploadDate: '2026-01-10',
    uploadedBy: 'Product Manager',
    version: '2.1',
    downloads: 1248,
    requiredFor: ['Agent', 'Broker'],
    expiryDate: '2027-01-10',
  },
  {
    id: 'tm2',
    productId: 'p1',
    title: 'Rate Manual 2026',
    type: 'rate-manual',
    fileName: 'rate_manual_2026.xlsx',
    fileSize: '1.8 MB',
    uploadDate: '2026-01-05',
    uploadedBy: 'Actuarial Team',
    version: '2026.1',
    downloads: 892,
    requiredFor: ['Manager'],
  },
  {
    id: 'tm3',
    productId: 'p1',
    title: 'Compliance Guidelines',
    type: 'compliance',
    fileName: 'compliance_2026.pdf',
    fileSize: '3.2 MB',
    uploadDate: '2025-12-15',
    uploadedBy: 'Compliance Officer',
    version: '2026.1',
    downloads: 654,
    requiredFor: ['Agent', 'Broker', 'Manager'],
    expiryDate: '2026-12-31',
  },
];

export const getProductPerf = (productId: string): ProductPerformanceData[] => [
  {
    month: 'Sep \'25',
    premium: 32.4,
    newBiz: 4.8,
    renewal: 27.6,
    policies: 17200,
    lossRatio: 0.612,
    claimsCount: 342,
  },
  {
    month: 'Oct \'25',
    premium: 34.1,
    newBiz: 5.2,
    renewal: 28.9,
    policies: 17500,
    lossRatio: 0.598,
    claimsCount: 298,
  },
  {
    month: 'Nov \'25',
    premium: 35.8,
    newBiz: 5.8,
    renewal: 30.0,
    policies: 17800,
    lossRatio: 0.621,
    claimsCount: 365,
  },
  {
    month: 'Dec \'25',
    premium: 33.5,
    newBiz: 4.5,
    renewal: 29.0,
    policies: 17600,
    lossRatio: 0.605,
    claimsCount: 328,
  },
  {
    month: 'Jan \'26',
    premium: 36.2,
    newBiz: 6.1,
    renewal: 30.1,
    policies: 18000,
    lossRatio: 0.618,
    claimsCount: 372,
  },
  {
    month: 'Feb \'26',
    premium: 37.8,
    newBiz: 6.5,
    renewal: 31.3,
    policies: 18300,
    lossRatio: 0.602,
    claimsCount: 341,
  },
  {
    month: 'Mar \'26',
    premium: 39.4,
    newBiz: 7.2,
    renewal: 32.2,
    policies: 18600,
    lossRatio: 0.615,
    claimsCount: 358,
  },
  {
    month: 'Apr \'26',
    premium: 41.1,
    newBiz: 7.8,
    renewal: 33.3,
    policies: 18900,
    lossRatio: 0.598,
    claimsCount: 325,
  },
  {
    month: 'May \'26',
    premium: 42.6,
    newBiz: 8.2,
    renewal: 34.4,
    policies: 19100,
    lossRatio: 0.608,
    claimsCount: 342,
  },
  {
    month: 'Jun \'26',
    premium: 44.2,
    newBiz: 8.8,
    renewal: 35.4,
    policies: 19400,
    lossRatio: 0.595,
    claimsCount: 315,
  },
  {
    month: 'Jul \'26',
    premium: 45.8,
    newBiz: 9.3,
    renewal: 36.5,
    policies: 19700,
    lossRatio: 0.602,
    claimsCount: 332,
  },
  {
    month: 'Aug \'26',
    premium: 47.3,
    newBiz: 9.7,
    renewal: 37.6,
    policies: 20000,
    lossRatio: 0.612,
    claimsCount: 348,
  },
];
