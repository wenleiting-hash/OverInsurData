export type InsurerStatus = 'active' | 'inactive' | 'pending'
export type InsurerType = 'Admitted' | 'Non-Admitted'
export type CoopStatus = 'active' | 'negotiating' | 'expiring' | 'terminated'
export type Region = 'Northeast' | 'Southeast' | 'Midwest' | 'West'

export interface Insurer {
  id: string
  name: string
  shortName: string
  naicCode: string
  type: InsurerType
  status: InsurerStatus
  amBestRating: string
  spRating: string
  headquarters: string
  state: string
  region: Region
  founded: number
  website: string
  totalPremium: number
  policyCount: number
  lossRatio: number
  renewalRate: number
  channelCount: number
  productCount: number
  settlementCycle: 'Monthly' | 'Quarterly'
  coopStatus: CoopStatus
  contractExpiry: string
  lines: string[]
  commissionIncome: number
}

export interface Product {
  id: string
  insurerId: string
  name: string
  code: string
  line: string
  subLine: string
  type: 'Individual' | 'Group' | 'Voluntary'
  status: 'on-sale' | 'off-sale' | 'paused' | 'pending'
  states: string[]
  premium: number
  policyCount: number
  lossRatio: number
  renewalRate: number
  launchDate: string
}

export interface Channel {
  id: string
  name: string
  type: 'Independent Agency' | 'Broker' | 'MGA' | 'Wholesale Broker' | 'Direct'
  status: 'active' | 'inactive' | 'onboarding' | 'suspended'
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard'
  parentId?: string
  level: number
  agentCount: number
  totalPremium: number
  policyCount: number
  lossRatio: number
  renewalRate: number
  commissionRate: number
  state: string
  region: Region
  joinDate: string
  npnCode: string
  manager: string
}

export interface Appointment {
  id: string
  channelId: string
  channelName: string
  insurerId: string
  insurerName: string
  state: string
  line: string
  status: 'approved' | 'pending' | 'rejected' | 'expired' | 'terminated'
  submittedDate: string
  approvedDate?: string
  expiryDate: string
  npn: string
}

export const insurers: Insurer[] = [
  {
    id: '1',
    name: 'Travelers Insurance Company',
    shortName: 'Travelers',
    naicCode: '25658',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A',
    spRating: 'AA-',
    headquarters: 'New York, NY',
    state: 'NY',
    region: 'Northeast',
    founded: 1853,
    website: 'www.travelers.com',
    totalPremium: 1250000000,
    policyCount: 48200,
    lossRatio: 0.622,
    renewalRate: 0.851,
    channelCount: 156,
    productCount: 12,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2027-03-31',
    lines: ['P&C', 'Commercial', 'Auto', 'Home'],
    commissionIncome: 8750000,
  },
  {
    id: '2',
    name: 'Liberty Mutual Insurance',
    shortName: 'Liberty Mutual',
    naicCode: '23035',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A',
    spRating: 'A',
    headquarters: 'Boston, MA',
    state: 'MA',
    region: 'Northeast',
    founded: 1912,
    website: 'www.libertymutual.com',
    totalPremium: 980000000,
    policyCount: 37100,
    lossRatio: 0.651,
    renewalRate: 0.832,
    channelCount: 128,
    productCount: 10,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2026-12-31',
    lines: ['Auto', 'Home', 'Life', 'Commercial'],
    commissionIncome: 6860000,
  },
  {
    id: '3',
    name: 'Nationwide Mutual Insurance',
    shortName: 'Nationwide',
    naicCode: '23787',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A+',
    spRating: 'A+',
    headquarters: 'Columbus, OH',
    state: 'OH',
    region: 'Midwest',
    founded: 1926,
    website: 'www.nationwide.com',
    totalPremium: 875000000,
    policyCount: 32500,
    lossRatio: 0.589,
    renewalRate: 0.871,
    channelCount: 104,
    productCount: 9,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2027-06-30',
    lines: ['Auto', 'Home', 'Life', 'Pet'],
    commissionIncome: 6125000,
  },
  {
    id: '4',
    name: 'Chubb Limited',
    shortName: 'Chubb',
    naicCode: '12777',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A++',
    spRating: 'AA',
    headquarters: 'Zurich, Switzerland (US HQ: Whitehouse Station, NJ)',
    state: 'NJ',
    region: 'Northeast',
    founded: 1882,
    website: 'www.chubb.com',
    totalPremium: 1560000000,
    policyCount: 28900,
    lossRatio: 0.548,
    renewalRate: 0.912,
    channelCount: 89,
    productCount: 15,
    settlementCycle: 'Quarterly',
    coopStatus: 'active',
    contractExpiry: '2028-01-31',
    lines: ['P&C', 'Specialty', 'Excess & Surplus'],
    commissionIncome: 10920000,
  },
  {
    id: '5',
    name: 'AIG (American International Group)',
    shortName: 'AIG',
    naicCode: '19402',
    type: 'Non-Admitted',
    status: 'active',
    amBestRating: 'A',
    spRating: 'A-',
    headquarters: 'New York, NY',
    state: 'NY',
    region: 'Northeast',
    founded: 1919,
    website: 'www.aig.com',
    totalPremium: 720000000,
    policyCount: 18700,
    lossRatio: 0.682,
    renewalRate: 0.791,
    channelCount: 72,
    productCount: 11,
    settlementCycle: 'Monthly',
    coopStatus: 'expiring',
    contractExpiry: '2026-09-30',
    lines: ['Commercial', 'Specialty', 'Life', 'Health'],
    commissionIncome: 5040000,
  },
  {
    id: '6',
    name: 'Zurich Insurance Group',
    shortName: 'Zurich',
    naicCode: '16535',
    type: 'Non-Admitted',
    status: 'active',
    amBestRating: 'A+',
    spRating: 'AA-',
    headquarters: 'Zurich, Switzerland (US HQ: Schaumburg, IL)',
    state: 'IL',
    region: 'Midwest',
    founded: 1872,
    website: 'www.zurichna.com',
    totalPremium: 495000000,
    policyCount: 15200,
    lossRatio: 0.611,
    renewalRate: 0.824,
    channelCount: 58,
    productCount: 8,
    settlementCycle: 'Quarterly',
    coopStatus: 'active',
    contractExpiry: '2027-09-30',
    lines: ['Commercial', 'Construction', 'Marine'],
    commissionIncome: 3465000,
  },
  {
    id: '7',
    name: 'Berkshire Hathaway Specialty Insurance',
    shortName: 'BHSI',
    naicCode: '22276',
    type: 'Non-Admitted',
    status: 'pending',
    amBestRating: 'A++',
    spRating: 'AA+',
    headquarters: 'Omaha, NE',
    state: 'NE',
    region: 'Midwest',
    founded: 2013,
    website: 'www.bhspecialty.com',
    totalPremium: 340000000,
    policyCount: 8900,
    lossRatio: 0.481,
    renewalRate: 0.931,
    channelCount: 41,
    productCount: 7,
    settlementCycle: 'Quarterly',
    coopStatus: 'negotiating',
    contractExpiry: '2026-12-31',
    lines: ['E&O', 'D&O', 'Cyber', 'Professional'],
    commissionIncome: 2380000,
  },
  {
    id: '8',
    name: 'The Hartford Financial Services',
    shortName: 'Hartford',
    naicCode: '29424',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A-',
    spRating: 'A-',
    headquarters: 'Hartford, CT',
    state: 'CT',
    region: 'Northeast',
    founded: 1810,
    website: 'www.thehartford.com',
    totalPremium: 680000000,
    policyCount: 24300,
    lossRatio: 0.671,
    renewalRate: 0.813,
    channelCount: 95,
    productCount: 10,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2027-03-31',
    lines: ['Commercial', 'Auto', 'Workers Comp', 'Liability'],
    commissionIncome: 4760000,
  },
  {
    id: '9',
    name: 'Markel Corporation',
    shortName: 'Markel',
    naicCode: '38970',
    type: 'Non-Admitted',
    status: 'inactive',
    amBestRating: 'A',
    spRating: 'A-',
    headquarters: 'Glen Allen, VA',
    state: 'VA',
    region: 'Southeast',
    founded: 1930,
    website: 'www.markel.com',
    totalPremium: 185000000,
    policyCount: 6200,
    lossRatio: 0.712,
    renewalRate: 0.742,
    channelCount: 28,
    productCount: 5,
    settlementCycle: 'Quarterly',
    coopStatus: 'terminated',
    contractExpiry: '2025-12-31',
    lines: ['Specialty', 'E&S'],
    commissionIncome: 0,
  },
  {
    id: '10',
    name: 'Cincinnati Financial Corporation',
    shortName: 'CinFin',
    naicCode: '20286',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A+',
    spRating: 'A+',
    headquarters: 'Fairfield, OH',
    state: 'OH',
    region: 'Midwest',
    founded: 1950,
    website: 'www.cinfin.com',
    totalPremium: 420000000,
    policyCount: 16800,
    lossRatio: 0.598,
    renewalRate: 0.882,
    channelCount: 67,
    productCount: 8,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2027-12-31',
    lines: ['Commercial', 'Home', 'Auto', 'Life'],
    commissionIncome: 2940000,
  },
]

export const products: Product[] = [
  { id: 'p1', insurerId: '1', name: 'Travelers Auto Insurance', code: 'TRV-AUTO-001', line: 'Auto', subLine: 'Personal Auto', type: 'Individual', status: 'on-sale', states: ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH'], premium: 320000000, policyCount: 18200, lossRatio: 0.612, renewalRate: 0.871, launchDate: '2020-01-15' },
  { id: 'p2', insurerId: '1', name: 'Travelers Homeowners Plus', code: 'TRV-HOME-002', line: 'Home', subLine: 'Homeowners', type: 'Individual', status: 'on-sale', states: ['CA', 'TX', 'FL', 'NY', 'IL'], premium: 280000000, policyCount: 16800, lossRatio: 0.631, renewalRate: 0.842, launchDate: '2019-03-20' },
  { id: 'p3', insurerId: '1', name: 'Travelers Commercial Property', code: 'TRV-COMM-003', line: 'Commercial', subLine: 'Commercial Property', type: 'Group', status: 'on-sale', states: ['TX', 'FL', 'NY', 'IL', 'OH'], premium: 420000000, policyCount: 8600, lossRatio: 0.578, renewalRate: 0.892, launchDate: '2018-07-01' },
  { id: 'p4', insurerId: '2', name: 'Liberty Auto Premier', code: 'LM-AUTO-001', line: 'Auto', subLine: 'Personal Auto', type: 'Individual', status: 'on-sale', states: ['CA', 'TX', 'NY', 'FL'], premium: 245000000, policyCount: 14200, lossRatio: 0.642, renewalRate: 0.822, launchDate: '2021-02-10' },
  { id: 'p5', insurerId: '2', name: 'Liberty Home Shield', code: 'LM-HOME-002', line: 'Home', subLine: 'Homeowners', type: 'Individual', status: 'on-sale', states: ['CA', 'TX', 'NY'], premium: 198000000, policyCount: 12400, lossRatio: 0.659, renewalRate: 0.811, launchDate: '2020-06-15' },
  { id: 'p6', insurerId: '3', name: 'Nationwide On Your Side Auto', code: 'NW-AUTO-001', line: 'Auto', subLine: 'Personal Auto', type: 'Individual', status: 'on-sale', states: ['OH', 'TX', 'GA', 'NC', 'VA'], premium: 210000000, policyCount: 14800, lossRatio: 0.578, renewalRate: 0.882, launchDate: '2019-09-01' },
  { id: 'p7', insurerId: '4', name: 'Chubb Masterpiece Homeowners', code: 'CHB-HOME-001', line: 'Home', subLine: 'High-Value Home', type: 'Individual', status: 'on-sale', states: ['NY', 'CA', 'CT', 'MA', 'NJ'], premium: 580000000, policyCount: 12200, lossRatio: 0.531, renewalRate: 0.921, launchDate: '2017-01-10' },
  { id: 'p8', insurerId: '4', name: 'Chubb Cyber Enterprise Risk', code: 'CHB-CYB-002', line: 'Cyber', subLine: 'Enterprise Cyber', type: 'Group', status: 'on-sale', states: ['NY', 'CA', 'TX', 'IL', 'MA'], premium: 420000000, policyCount: 6800, lossRatio: 0.542, renewalRate: 0.903, launchDate: '2020-04-01' },
  { id: 'p9', insurerId: '5', name: 'AIG Professional Liability', code: 'AIG-PL-001', line: 'Professional', subLine: 'E&O', type: 'Individual', status: 'on-sale', states: ['NY', 'CA', 'TX', 'FL', 'IL'], premium: 285000000, policyCount: 9200, lossRatio: 0.671, renewalRate: 0.781, launchDate: '2018-11-20' },
  { id: 'p10', insurerId: '5', name: 'AIG Travel Guard', code: 'AIG-TRV-002', line: 'Travel', subLine: 'Travel Insurance', type: 'Individual', status: 'paused', states: ['ALL'], premium: 125000000, policyCount: 5600, lossRatio: 0.698, renewalRate: 0.601, launchDate: '2022-01-05' },
  { id: 'p11', insurerId: '7', name: 'BHSI D&O Advantage', code: 'BHSI-DO-001', line: 'D&O', subLine: 'Directors & Officers', type: 'Group', status: 'pending', states: ['NY', 'DE', 'CA'], premium: 180000000, policyCount: 3200, lossRatio: 0.468, renewalRate: 0.941, launchDate: '2023-03-15' },
  { id: 'p12', insurerId: '8', name: 'Hartford Business Owner Policy', code: 'HFD-BOP-001', line: 'Commercial', subLine: 'BOP', type: 'Group', status: 'on-sale', states: ['CT', 'NY', 'NJ', 'MA', 'PA'], premium: 340000000, policyCount: 14800, lossRatio: 0.658, renewalRate: 0.822, launchDate: '2019-06-01' },
]

export const channels: Channel[] = [
  { id: 'c1', name: 'Pacific Coast Insurance Group', type: 'Independent Agency', status: 'active', tier: 'Platinum', level: 1, agentCount: 128, totalPremium: 245000000, policyCount: 9800, lossRatio: 0.588, renewalRate: 0.892, commissionRate: 0.12, state: 'CA', region: 'West', joinDate: '2019-02-15', npnCode: 'NPN12348901', manager: 'Sarah Chen' },
  { id: 'c2', name: 'Lone Star Brokerage', type: 'Broker', status: 'active', tier: 'Platinum', level: 1, agentCount: 96, totalPremium: 198000000, policyCount: 7900, lossRatio: 0.612, renewalRate: 0.871, commissionRate: 0.11, state: 'TX', region: 'Southeast', joinDate: '2019-08-20', npnCode: 'NPN23459012', manager: 'James Rodriguez' },
  { id: 'c3', name: 'Great Lakes Insurance Partners', type: 'MGA', status: 'active', tier: 'Gold', level: 1, agentCount: 72, totalPremium: 156000000, policyCount: 6200, lossRatio: 0.602, renewalRate: 0.862, commissionRate: 0.13, state: 'IL', region: 'Midwest', joinDate: '2020-01-10', npnCode: 'NPN34560123', manager: 'Michael Wu' },
  { id: 'c4', name: 'Empire State Insurance Services', type: 'Independent Agency', status: 'active', tier: 'Gold', level: 1, agentCount: 54, totalPremium: 134000000, policyCount: 5400, lossRatio: 0.619, renewalRate: 0.842, commissionRate: 0.11, state: 'NY', region: 'Northeast', joinDate: '2020-05-22', npnCode: 'NPN45671234', manager: 'Emily Johnson' },
  { id: 'c5', name: 'Sunshine State Brokers', type: 'Broker', status: 'active', tier: 'Gold', level: 1, agentCount: 61, totalPremium: 121000000, policyCount: 5100, lossRatio: 0.638, renewalRate: 0.821, commissionRate: 0.10, state: 'FL', region: 'Southeast', joinDate: '2020-09-14', npnCode: 'NPN56782345', manager: 'Carlos Martinez' },
  { id: 'c6', name: 'Midwest Specialty Risk', type: 'Wholesale Broker', status: 'active', tier: 'Silver', level: 1, agentCount: 38, totalPremium: 89000000, policyCount: 3600, lossRatio: 0.592, renewalRate: 0.878, commissionRate: 0.10, state: 'OH', region: 'Midwest', joinDate: '2021-02-08', npnCode: 'NPN67893456', manager: 'David Kim' },
  { id: 'c7', name: 'Rocky Mountain Insurance Advisors', type: 'Independent Agency', status: 'active', tier: 'Silver', level: 1, agentCount: 29, totalPremium: 72000000, policyCount: 2900, lossRatio: 0.608, renewalRate: 0.851, commissionRate: 0.11, state: 'CO', region: 'West', joinDate: '2021-06-30', npnCode: 'NPN78904567', manager: 'Jennifer Park' },
  { id: 'c8', name: 'Atlantic Coastal Risk Management', type: 'MGA', status: 'active', tier: 'Silver', level: 1, agentCount: 33, totalPremium: 68000000, policyCount: 2700, lossRatio: 0.624, renewalRate: 0.841, commissionRate: 0.12, state: 'NC', region: 'Southeast', joinDate: '2021-09-15', npnCode: 'NPN89015678', manager: 'Robert Lee' },
  { id: 'c9', name: 'Southwest Insurance Network', type: 'Broker', status: 'onboarding', tier: 'Standard', level: 1, agentCount: 18, totalPremium: 28000000, policyCount: 1200, lossRatio: 0.652, renewalRate: 0.801, commissionRate: 0.09, state: 'AZ', region: 'West', joinDate: '2026-03-01', npnCode: 'NPN90126789', manager: 'Lisa Wang' },
  { id: 'c10', name: 'Northeast Professional Services', type: 'Independent Agency', status: 'suspended', tier: 'Standard', level: 1, agentCount: 12, totalPremium: 22000000, policyCount: 890, lossRatio: 0.782, renewalRate: 0.682, commissionRate: 0.09, state: 'CT', region: 'Northeast', joinDate: '2022-01-20', npnCode: 'NPN01237890', manager: 'Tom Anderson' },
  { id: 'c11', name: 'PCG - Bay Area Division', type: 'Independent Agency', status: 'active', tier: 'Gold', level: 2, parentId: 'c1', agentCount: 42, totalPremium: 86000000, policyCount: 3400, lossRatio: 0.579, renewalRate: 0.901, commissionRate: 0.11, state: 'CA', region: 'West', joinDate: '2020-04-15', npnCode: 'NPN11248901', manager: 'Amy Zhang' },
  { id: 'c12', name: 'Lone Star - Houston Branch', type: 'Broker', status: 'active', tier: 'Gold', level: 2, parentId: 'c2', agentCount: 35, totalPremium: 72000000, policyCount: 2900, lossRatio: 0.621, renewalRate: 0.862, commissionRate: 0.10, state: 'TX', region: 'Southeast', joinDate: '2020-11-10', npnCode: 'NPN22359012', manager: 'Victor Gonzalez' },
]

export const appointments: Appointment[] = [
  { id: 'a1', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', insurerId: '1', insurerName: 'Travelers', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-02-20', expiryDate: '2026-12-31', npn: 'NPN12348901' },
  { id: 'a2', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', insurerId: '4', insurerName: 'Chubb', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-03-01', expiryDate: '2026-12-31', npn: 'NPN12348901' },
  { id: 'a3', channelId: 'c2', channelName: 'Lone Star Brokerage', insurerId: '1', insurerName: 'Travelers', state: 'TX', line: 'P&C', status: 'approved', submittedDate: '2023-03-10', approvedDate: '2023-04-15', expiryDate: '2026-09-30', npn: 'NPN23459012' },
  { id: 'a4', channelId: 'c4', channelName: 'Empire State Insurance Services', insurerId: '2', insurerName: 'Liberty Mutual', state: 'NY', line: 'Auto', status: 'pending', submittedDate: '2026-07-20', expiryDate: '2027-12-31', npn: 'NPN45671234' },
  { id: 'a5', channelId: 'c5', channelName: 'Sunshine State Brokers', insurerId: '5', insurerName: 'AIG', state: 'FL', line: 'Professional', status: 'pending', submittedDate: '2026-08-01', expiryDate: '2027-12-31', npn: 'NPN56782345' },
  { id: 'a6', channelId: 'c10', channelName: 'Northeast Professional Services', insurerId: '8', insurerName: 'Hartford', state: 'CT', line: 'Commercial', status: 'expired', submittedDate: '2023-06-01', approvedDate: '2023-07-15', expiryDate: '2026-07-14', npn: 'NPN01237890' },
  { id: 'a7', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', insurerId: '3', insurerName: 'Nationwide', state: 'IL', line: 'Auto', status: 'approved', submittedDate: '2023-05-10', approvedDate: '2023-06-20', expiryDate: '2026-12-31', npn: 'NPN34560123' },
  { id: 'a8', channelId: 'c9', channelName: 'Southwest Insurance Network', insurerId: '6', insurerName: 'Zurich', state: 'AZ', line: 'Commercial', status: 'pending', submittedDate: '2026-08-10', expiryDate: '2027-12-31', npn: 'NPN90126789' },
]

export const premiumTrendData = [
  { month: 'Sep \'25', premium: 482, newBiz: 68, renewal: 414, commission: 36.2 },
  { month: 'Oct \'25', premium: 498, newBiz: 72, renewal: 426, commission: 37.4 },
  { month: 'Nov \'25', premium: 515, newBiz: 78, renewal: 437, commission: 38.6 },
  { month: 'Dec \'25', premium: 528, newBiz: 71, renewal: 457, commission: 39.6 },
  { month: 'Jan \'26', premium: 504, newBiz: 65, renewal: 439, commission: 37.8 },
  { month: 'Feb \'26', premium: 519, newBiz: 74, renewal: 445, commission: 38.9 },
  { month: 'Mar \'26', premium: 541, newBiz: 82, renewal: 459, commission: 40.6 },
  { month: 'Apr \'26', premium: 558, newBiz: 88, renewal: 470, commission: 41.9 },
  { month: 'May \'26', premium: 572, newBiz: 91, renewal: 481, commission: 42.9 },
  { month: 'Jun \'26', premium: 589, newBiz: 95, renewal: 494, commission: 44.2 },
  { month: 'Jul \'26', premium: 604, newBiz: 98, renewal: 506, commission: 45.3 },
  { month: 'Aug \'26', premium: 618, newBiz: 102, renewal: 516, commission: 46.4 },
]

export const marketShareData = [
  { name: 'Chubb', value: 24.8, color: '#0058BC' },
  { name: 'Travelers', value: 19.9, color: '#0070EB' },
  { name: 'Liberty Mutual', value: 15.6, color: '#006687' },
  { name: 'Nationwide', value: 13.9, color: '#60CDFF' },
  { name: 'AIG', value: 11.4, color: '#ADC6FF' },
  { name: 'Others', value: 14.4, color: '#C1C6D7' },
]

export interface AlertItem {
  id: number
  type: string
  severity: 'high' | 'warning' | 'info'
  link: string | null
  timeKey: 'today' | 'yesterday' | 'daysAgo'
  daysAgo?: number
  // params for i18n message templates
  days?: number
  date?: string
  count?: number
  ratio?: string
  threshold?: string
  month?: number
  amount?: string
}

export const alertItems: AlertItem[] = [
  { id: 1, type: 'expiring', severity: 'high', link: '5', timeKey: 'today', days: 39, date: '2026-09-30' },
  { id: 2, type: 'appointment', severity: 'warning', link: null, timeKey: 'today', count: 3, days: 60 },
  { id: 3, type: 'lossratio', severity: 'warning', link: '9', timeKey: 'yesterday', ratio: '71.2%', threshold: '65%' },
  { id: 4, type: 'pending', severity: 'info', link: '7', timeKey: 'daysAgo', daysAgo: 2 },
  { id: 5, type: 'license', severity: 'warning', link: 'c10', timeKey: 'daysAgo', daysAgo: 3 },
  { id: 6, type: 'settlement', severity: 'info', link: null, timeKey: 'daysAgo', daysAgo: 4, month: 8, amount: '$2.14M' },
]

export interface RecentActivity {
  id: number
  actKey: 'newInsurer' | 'productLaunch' | 'appointment' | 'reconciliation' | 'channelSuspended'
  user: string
  icon: string
  timeKey: 'min' | 'hour' | 'yesterdayClock'
  n?: number
  clock?: string
  // params for i18n detail templates
  entity?: string
  entity2?: string
  region?: string
  month?: number
  variance?: string
}

export const recentActivities: RecentActivity[] = [
  { id: 1, actKey: 'newInsurer', user: 'Liu Yang', icon: 'building', timeKey: 'min', n: 10, entity: 'BHSI (Berkshire Hathaway)' },
  { id: 2, actKey: 'productLaunch', user: 'Wang Fang', icon: 'package', timeKey: 'hour', n: 1, entity: 'Chubb Cyber Enterprise Risk', region: 'NY/CA' },
  { id: 3, actKey: 'appointment', user: 'Zhang Wei', icon: 'shield', timeKey: 'hour', n: 3, entity: 'Southwest Insurance Network', entity2: 'Zurich', region: 'AZ' },
  { id: 4, actKey: 'reconciliation', user: 'System', icon: 'dollar', timeKey: 'yesterdayClock', clock: '16:40', entity: 'Travelers', month: 8, variance: '0.3%' },
  { id: 5, actKey: 'channelSuspended', user: 'Chen Hao', icon: 'alert', timeKey: 'yesterdayClock', clock: '09:12', entity: 'Northeast Professional Services' },
]

export function formatCurrency(val: number, short = false): string {
  if (short) {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`
    return `$${val}`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
}

export function formatPercent(val: number): string {
  return `${(val * 100).toFixed(1)}%`
}
