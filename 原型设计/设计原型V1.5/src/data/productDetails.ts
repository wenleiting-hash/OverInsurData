export interface RatePlan {
  id: string
  productId: string
  name: string
  tier: 'Standard' | 'Enhanced' | 'Premium' | 'Basic'
  baseRate: number
  minPremium: number
  maxPremium: number
  effectiveDate: string
  expiryDate: string
  status: 'active' | 'draft' | 'expired' | 'pending'
  ratingFactors: { factor: string; description: string; weight: number }[]
  filingStatus: 'approved' | 'pending' | 'not-required'
}

export interface ProductState {
  code: string
  name: string
  enabled: boolean
  effectiveDate?: string
  filingNumber?: string
  status: 'active' | 'pending' | 'suspended' | 'not-available'
  channelCount?: number
}

export interface UnderwritingRule {
  id: string
  productId: string
  name: string
  category: 'eligibility' | 'rating' | 'exclusion' | 'referral'
  priority: number
  condition: string
  conditionDetail: string
  action: 'approve' | 'decline' | 'refer' | 'surcharge' | 'discount'
  actionValue?: string
  status: 'active' | 'inactive' | 'testing'
  lastModified: string
  modifiedBy: string
}

export interface TrainingMaterial {
  id: string
  productId: string
  title: string
  type: 'product-guide' | 'rate-manual' | 'underwriting-guide' | 'compliance' | 'training-deck' | 'faq' | 'video'
  fileName: string
  fileSize: string
  uploadDate: string
  uploadedBy: string
  version: string
  downloads: number
  requiredFor: string[]
  expiryDate?: string
}

export interface ProductPerformanceData {
  month: string
  premium: number
  newBiz: number
  renewal: number
  policies: number
  lossRatio: number
  claimsCount: number
}

export const ratePlans: RatePlan[] = [
  {
    id: 'rp1', productId: 'p1', name: 'Standard Auto',
    tier: 'Standard', baseRate: 1240, minPremium: 480, maxPremium: 4200,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'active',
    ratingFactors: [
      { factor: '驾驶记录', description: '过去 3 年无事故折扣', weight: 0.25 },
      { factor: '车型系数', description: '基于车辆安全等级', weight: 0.20 },
      { factor: '驾龄', description: '< 3年附加 30%', weight: 0.15 },
      { factor: '信用评分', description: 'Credit-based insurance score', weight: 0.20 },
      { factor: '地区系数', description: '城市/郊区/农村区分', weight: 0.20 },
    ],
    filingStatus: 'approved',
  },
  {
    id: 'rp2', productId: 'p1', name: 'Enhanced Auto',
    tier: 'Enhanced', baseRate: 1680, minPremium: 720, maxPremium: 6500,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'active',
    ratingFactors: [
      { factor: '驾驶记录', description: '过去 5 年全记录分析', weight: 0.30 },
      { factor: '车型系数', description: 'MSRP + 安全等级加权', weight: 0.20 },
      { factor: '驾龄', description: '分级附加系数', weight: 0.15 },
      { factor: '信用评分', description: 'Tier 1–6 分级', weight: 0.20 },
      { factor: '用途系数', description: '通勤/商用/偶尔', weight: 0.15 },
    ],
    filingStatus: 'approved',
  },
  {
    id: 'rp3', productId: 'p1', name: 'Q4 2025 Archived',
    tier: 'Standard', baseRate: 1190, minPremium: 460, maxPremium: 4000,
    effectiveDate: '2025-10-01', expiryDate: '2025-12-31', status: 'expired',
    ratingFactors: [],
    filingStatus: 'approved',
  },
  {
    id: 'rp4', productId: 'p7', name: 'High-Value Masterpiece',
    tier: 'Premium', baseRate: 3200, minPremium: 2400, maxPremium: 85000,
    effectiveDate: '2026-01-01', expiryDate: '2026-12-31', status: 'active',
    ratingFactors: [
      { factor: '房产重置成本', description: '专业估价 + 市场指数', weight: 0.35 },
      { factor: '安保设施', description: '警报/保险箱/门卫', weight: 0.15 },
      { factor: '地区自然风险', description: '洪水/地震/飓风区', weight: 0.25 },
      { factor: '历史赔付', description: '过去 7 年理赔记录', weight: 0.25 },
    ],
    filingStatus: 'approved',
  },
  {
    id: 'rp5', productId: 'p8', name: 'Enterprise Cyber Standard',
    tier: 'Standard', baseRate: 8500, minPremium: 5000, maxPremium: 250000,
    effectiveDate: '2026-04-01', expiryDate: '2027-03-31', status: 'active',
    ratingFactors: [
      { factor: '年收入规模', description: '< $50M / $50-500M / >$500M', weight: 0.30 },
      { factor: '行业风险类别', description: 'Healthcare/Finance/Retail 等', weight: 0.25 },
      { factor: '安全态势评分', description: '第三方安全扫描结果', weight: 0.30 },
      { factor: '历史事件记录', description: '过去 5 年网络事件', weight: 0.15 },
    ],
    filingStatus: 'not-required',
  },
  {
    id: 'rp6', productId: 'p8', name: 'Enterprise Cyber Enhanced',
    tier: 'Enhanced', baseRate: 14200, minPremium: 8000, maxPremium: 500000,
    effectiveDate: '2026-04-01', expiryDate: '2027-03-31', status: 'draft',
    ratingFactors: [
      { factor: '年收入规模', description: '< $50M / $50-500M / >$500M', weight: 0.25 },
      { factor: '员工数量', description: '每增 500 人系数递增', weight: 0.15 },
      { factor: '行业风险类别', description: 'NAICS 分级风险矩阵', weight: 0.20 },
      { factor: '安全态势评分', description: 'BitSight / SecurityScorecard', weight: 0.25 },
      { factor: '第三方供应链', description: '关键供应商数量', weight: 0.15 },
    ],
    filingStatus: 'pending',
  },
]

const ALL_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

const ACTIVE_CODES_P1 = ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH']
const PENDING_CODES_P1 = ['WA', 'OR', 'CO', 'AZ']

export function getProductStates(productId: string): ProductState[] {
  const p = { p1: ACTIVE_CODES_P1, p7: ['NY', 'CA', 'CT', 'MA', 'NJ', 'FL', 'TX'], p8: ['NY', 'CA', 'TX', 'IL', 'MA', 'WA', 'GA'] }
  const activeSet = new Set((p as any)[productId] ?? ['CA', 'TX', 'NY'])
  const pendingSet = new Set(productId === 'p1' ? PENDING_CODES_P1 : [])
  return ALL_STATES.map(s => ({
    code: s.code,
    name: s.name,
    enabled: activeSet.has(s.code),
    status: pendingSet.has(s.code) ? 'pending' : activeSet.has(s.code) ? 'active' : 'not-available',
    effectiveDate: activeSet.has(s.code) ? '2020-01-01' : undefined,
    filingNumber: activeSet.has(s.code) ? `FL-${s.code}-${productId.toUpperCase()}-2020` : undefined,
    channelCount: activeSet.has(s.code) ? Math.floor(Math.random() * 20) + 3 : 0,
  }))
}

export const underwritingRules: UnderwritingRule[] = [
  {
    id: 'ur1', productId: 'p1', name: '无驾照申请人拒保',
    category: 'eligibility', priority: 1,
    condition: '申请人.驾照状态 = 无效 OR 吊销',
    conditionDetail: '驾照状态检查：无有效驾照、已吊销、已暂停',
    action: 'decline', actionValue: '自动拒保',
    status: 'active', lastModified: '2026-06-15', modifiedBy: 'System Auto',
  },
  {
    id: 'ur2', productId: 'p1', name: 'DUI 记录附加保费',
    category: 'rating', priority: 2,
    condition: '驾驶记录.DUI次数 >= 1 AND 发生时间 <= 5年',
    conditionDetail: '过去 5 年内有 DUI 记录，按次数阶梯附加',
    action: 'surcharge', actionValue: '1次 +35%，2次 +80%，3次+ 拒保',
    status: 'active', lastModified: '2026-01-10', modifiedBy: 'Zhang Wei',
  },
  {
    id: 'ur3', productId: 'p1', name: '高价值车辆核保转介',
    category: 'referral', priority: 3,
    condition: 'vehicle.MSRP > $150,000',
    conditionDetail: '车辆市场价值超过 15 万美元需人工核保审核',
    action: 'refer', actionValue: '转高净值承保团队',
    status: 'active', lastModified: '2025-11-20', modifiedBy: 'Wang Fang',
  },
  {
    id: 'ur4', productId: 'p1', name: '优良驾驶记录折扣',
    category: 'rating', priority: 4,
    condition: '驾驶记录.事故次数 = 0 AND 驾龄 >= 5年',
    conditionDetail: '连续 5 年无事故且驾龄超 5 年',
    action: 'discount', actionValue: '-10%',
    status: 'active', lastModified: '2025-09-01', modifiedBy: 'System Auto',
  },
  {
    id: 'ur5', productId: 'p1', name: '商业用途车辆排除',
    category: 'exclusion', priority: 5,
    condition: 'vehicle.use = 商业运营 OR 网约车',
    conditionDetail: '用于运营出租/网约车业务的车辆不在本产品承保范围',
    action: 'decline', actionValue: '建议转商业险产品',
    status: 'active', lastModified: '2025-07-01', modifiedBy: 'Chen Hao',
  },
  {
    id: 'ur6', productId: 'p1', name: '新驾照低信用评分观察',
    category: 'referral', priority: 6,
    condition: '驾龄 < 2年 AND credit_score < 580',
    conditionDetail: '新手驾驶员且信用分低于 580 需人工审核',
    action: 'refer', actionValue: '转标准核保团队，附加 15-25%',
    status: 'testing', lastModified: '2026-08-01', modifiedBy: 'Liu Yang',
  },
  {
    id: 'ur7', productId: 'p8', name: 'MFA 缺失高风险标记',
    category: 'rating', priority: 1,
    condition: 'security.MFA_coverage < 80%',
    conditionDetail: '多因素认证覆盖率低于 80% 附加风险溢价',
    action: 'surcharge', actionValue: '+20%',
    status: 'active', lastModified: '2026-05-10', modifiedBy: 'System Auto',
  },
  {
    id: 'ur8', productId: 'p8', name: '医疗行业最高限额控制',
    category: 'eligibility', priority: 2,
    condition: 'industry = Healthcare AND revenue > $1B',
    conditionDetail: '医疗行业年收入超 10 亿需特别承保审批',
    action: 'refer', actionValue: '转专业医疗险承保委员会',
    status: 'active', lastModified: '2026-03-22', modifiedBy: 'Zhang Wei',
  },
]

export const trainingMaterials: TrainingMaterial[] = [
  {
    id: 'tm1', productId: 'p1', title: 'Travelers Auto 产品指南 2026',
    type: 'product-guide', fileName: 'TRV-AUTO-ProductGuide-2026.pdf',
    fileSize: '4.2 MB', uploadDate: '2026-01-15', uploadedBy: 'Wang Fang',
    version: 'v3.2', downloads: 284, requiredFor: ['Independent Agency', 'Broker'],
    expiryDate: '2026-12-31',
  },
  {
    id: 'tm2', productId: 'p1', title: '费率手册 Q3 2026',
    type: 'rate-manual', fileName: 'TRV-AUTO-RateManual-Q3-2026.xlsx',
    fileSize: '1.8 MB', uploadDate: '2026-07-01', uploadedBy: 'Zhang Wei',
    version: 'v2026.3', downloads: 156, requiredFor: ['Independent Agency', 'Broker', 'MGA'],
    expiryDate: '2026-09-30',
  },
  {
    id: 'tm3', productId: 'p1', title: '核保规则手册 v4.1',
    type: 'underwriting-guide', fileName: 'TRV-AUTO-UW-Guide-v4.1.pdf',
    fileSize: '6.1 MB', uploadDate: '2026-03-20', uploadedBy: 'Chen Hao',
    version: 'v4.1', downloads: 201, requiredFor: ['Independent Agency', 'Broker', 'MGA', 'Wholesale Broker'],
  },
  {
    id: 'tm4', productId: 'p1', title: '加州监管合规要求 2026',
    type: 'compliance', fileName: 'CA-Compliance-AutoIns-2026.pdf',
    fileSize: '2.3 MB', uploadDate: '2026-02-01', uploadedBy: 'Liu Yang',
    version: 'v2026.1', downloads: 89, requiredFor: ['Independent Agency', 'Broker'],
    expiryDate: '2026-12-31',
  },
  {
    id: 'tm5', productId: 'p1', title: '渠道培训课件 — 产品销售技巧',
    type: 'training-deck', fileName: 'TRV-AUTO-SalesTraining-2026.pptx',
    fileSize: '18.4 MB', uploadDate: '2026-04-10', uploadedBy: 'Wang Fang',
    version: 'v2.0', downloads: 312, requiredFor: ['Independent Agency', 'Broker'],
  },
  {
    id: 'tm6', productId: 'p1', title: '常见问题解答 FAQ v2.3',
    type: 'faq', fileName: 'TRV-AUTO-FAQ-v2.3.pdf',
    fileSize: '0.9 MB', uploadDate: '2026-06-01', uploadedBy: 'System',
    version: 'v2.3', downloads: 445, requiredFor: [],
  },
  {
    id: 'tm7', productId: 'p8', title: 'Chubb Cyber Enterprise 产品简介',
    type: 'product-guide', fileName: 'CHB-CYB-ProductBrief-2026.pdf',
    fileSize: '3.8 MB', uploadDate: '2026-04-05', uploadedBy: 'Chen Hao',
    version: 'v2.1', downloads: 178, requiredFor: ['Broker', 'MGA'],
    expiryDate: '2027-03-31',
  },
  {
    id: 'tm8', productId: 'p8', title: '网络安全核保评估问卷',
    type: 'underwriting-guide', fileName: 'CHB-CYB-UW-Questionnaire-2026.pdf',
    fileSize: '1.1 MB', uploadDate: '2026-04-05', uploadedBy: 'Zhang Wei',
    version: 'v3.0', downloads: 124, requiredFor: ['Broker', 'MGA', 'Wholesale Broker'],
  },
]

export const productPerformance: Record<string, ProductPerformanceData[]> = {
  p1: [
    { month: "Mar '26", premium: 24.8, newBiz: 3.2, renewal: 21.6, policies: 1420, lossRatio: 0.608, claimsCount: 184 },
    { month: "Apr '26", premium: 25.6, newBiz: 3.5, renewal: 22.1, policies: 1480, lossRatio: 0.615, claimsCount: 191 },
    { month: "May '26", premium: 26.4, newBiz: 3.8, renewal: 22.6, policies: 1520, lossRatio: 0.601, claimsCount: 178 },
    { month: "Jun '26", premium: 27.2, newBiz: 4.1, renewal: 23.1, policies: 1590, lossRatio: 0.618, claimsCount: 204 },
    { month: "Jul '26", premium: 27.8, newBiz: 4.3, renewal: 23.5, policies: 1620, lossRatio: 0.609, claimsCount: 196 },
    { month: "Aug '26", premium: 28.5, newBiz: 4.6, renewal: 23.9, policies: 1680, lossRatio: 0.612, claimsCount: 201 },
  ],
  p7: [
    { month: "Mar '26", premium: 46.1, newBiz: 4.2, renewal: 41.9, policies: 980, lossRatio: 0.528, claimsCount: 42 },
    { month: "Apr '26", premium: 47.3, newBiz: 4.8, renewal: 42.5, policies: 1010, lossRatio: 0.534, claimsCount: 46 },
    { month: "May '26", premium: 48.2, newBiz: 5.1, renewal: 43.1, policies: 1040, lossRatio: 0.521, claimsCount: 38 },
    { month: "Jun '26", premium: 49.8, newBiz: 5.4, renewal: 44.4, policies: 1080, lossRatio: 0.539, claimsCount: 51 },
    { month: "Jul '26", premium: 50.4, newBiz: 5.2, renewal: 45.2, policies: 1100, lossRatio: 0.528, claimsCount: 44 },
    { month: "Aug '26", premium: 51.9, newBiz: 5.8, renewal: 46.1, policies: 1140, lossRatio: 0.531, claimsCount: 48 },
  ],
  p8: [
    { month: "Mar '26", premium: 33.5, newBiz: 6.2, renewal: 27.3, policies: 520, lossRatio: 0.538, claimsCount: 18 },
    { month: "Apr '26", premium: 34.2, newBiz: 6.8, renewal: 27.4, policies: 548, lossRatio: 0.544, claimsCount: 22 },
    { month: "May '26", premium: 35.1, newBiz: 7.1, renewal: 28.0, policies: 572, lossRatio: 0.531, claimsCount: 19 },
    { month: "Jun '26", premium: 36.4, newBiz: 7.4, renewal: 29.0, policies: 598, lossRatio: 0.548, claimsCount: 24 },
    { month: "Jul '26", premium: 37.0, newBiz: 7.8, renewal: 29.2, policies: 618, lossRatio: 0.540, claimsCount: 21 },
    { month: "Aug '26", premium: 38.2, newBiz: 8.2, renewal: 30.0, policies: 641, lossRatio: 0.542, claimsCount: 23 },
  ],
}

export function getProductPerf(productId: string): ProductPerformanceData[] {
  return productPerformance[productId] ?? productPerformance['p1']
}
