export type InsurerStatus = 'active' | 'inactive';
export type InsurerType = 'Admitted' | 'Non-Admitted';
export type CoopStatus = 'active' | 'expiring' | 'terminated';
export type Region = 'Northeast' | 'Southeast' | 'Midwest' | 'West';

export interface InsuranceCarrier {
  id: string;
  name: string;
  shortName: string;
  naicCode: string;
  type: InsurerType;
  status: InsurerStatus;
  amBestRating: string;
  spRating: string;
  headquarters: string;
  state: string;
  region: Region;
  founded: number;
  website: string;
  totalPremium: number;
  policyCount: number;
  lossRatio: number;
  renewalRate: number;
  channelCount: number;
  productCount: number;
  settlementCycle: 'Monthly' | 'Quarterly';
  coopStatus: CoopStatus;
  contractExpiry: string;
  lines: string[];
  commissionIncome: number;
}

export interface Product {
  id: string;
  insurerId: string;
  name: string;
  code: string;
  line: string;
  subLine: string;
  type: 'Individual' | 'Group' | 'Voluntary';
  status: 'on-sale' | 'off-sale' | 'paused';
  states: string[];
  premium: number;
  policyCount: number;
  lossRatio: number;
  renewalRate: number;
  launchDate: string;
}

export const INSURERS: InsuranceCarrier[] = [
  {
    id: '1',
    name: 'Travelers Insurance Company',
    shortName: 'Travelers',
    naicCode: '25658',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A+',
    spRating: 'AA-',
    headquarters: 'Hartford, CT',
    state: 'CT',
    region: 'Northeast',
    founded: 1853,
    website: 'www.travelers.com',
    totalPremium: 720000000,
    policyCount: 18700,
    lossRatio: 0.612,
    renewalRate: 0.871,
    channelCount: 72,
    productCount: 11,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2027-09-30',
    lines: ['Auto', 'Home', 'Commercial'],
    commissionIncome: 5040000,
  },
  {
    id: '2',
    name: 'Liberty Mutual Insurance',
    shortName: 'Liberty Mutual',
    naicCode: '34567',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A',
    spRating: 'AA-',
    headquarters: 'Boston, MA',
    state: 'MA',
    region: 'Northeast',
    founded: 1919,
    website: 'www.libertymutual.com',
    totalPremium: 680000000,
    policyCount: 17500,
    lossRatio: 0.642,
    renewalRate: 0.822,
    channelCount: 85,
    productCount: 13,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2028-03-31',
    lines: ['Auto', 'Home', 'Commercial'],
    commissionIncome: 4760000,
  },
  {
    id: '3',
    name: 'Nationwide Mutual Insurance',
    shortName: 'Nationwide',
    naicCode: '45678',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A+',
    spRating: 'A+',
    headquarters: 'Columbus, OH',
    state: 'OH',
    region: 'Midwest',
    founded: 1896,
    website: 'www.nationwide.com',
    totalPremium: 890000000,
    policyCount: 24300,
    lossRatio: 0.578,
    renewalRate: 0.882,
    channelCount: 95,
    productCount: 15,
    settlementCycle: 'Quarterly',
    coopStatus: 'active',
    contractExpiry: '2029-06-30',
    lines: ['Auto', 'Home', 'Life', 'Health'],
    commissionIncome: 6230000,
  },
  {
    id: '4',
    name: 'Chubb Limited',
    shortName: 'Chubb',
    naicCode: '11234',
    type: 'Admitted',
    status: 'active',
    amBestRating: 'A++',
    spRating: 'AA+',
    headquarters: 'White Plains, NY',
    state: 'NY',
    region: 'Northeast',
    founded: 1882,
    website: 'www.chubb.com',
    totalPremium: 1200000000,
    policyCount: 32100,
    lossRatio: 0.531,
    renewalRate: 0.921,
    channelCount: 128,
    productCount: 18,
    settlementCycle: 'Monthly',
    coopStatus: 'active',
    contractExpiry: '2030-12-31',
    lines: ['Home', 'Cyber', 'Commercial'],
    commissionIncome: 8400000,
  },
  {
    id: '5',
    name: 'AIG Global Business Insurance',
    shortName: 'AIG',
    naicCode: '23456',
    type: 'Non-Admitted',
    status: 'active',
    amBestRating: 'A',
    spRating: 'A+',
    headquarters: 'New York, NY',
    state: 'NY',
    region: 'Northeast',
    founded: 1919,
    website: 'www.aig.com',
    totalPremium: 720000000,
    policyCount: 18700,
    lossRatio: 0.671,
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
    headquarters: 'Schaumburg, IL',
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
    status: 'active',
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
    coopStatus: 'active',
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
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    insurerId: '1',
    name: 'Travelers Auto Insurance',
    code: 'TRV-AUTO-001',
    line: 'Auto',
    subLine: 'Personal Auto',
    type: 'Individual',
    status: 'on-sale',
    states: ['CA', 'TX', 'FL', 'NY', 'IL', 'PA', 'OH'],
    premium: 320000000,
    policyCount: 18200,
    lossRatio: 0.612,
    renewalRate: 0.871,
    launchDate: '2020-01-15',
  },
  {
    id: 'p2',
    insurerId: '1',
    name: 'Travelers Homeowners Plus',
    code: 'TRV-HOME-002',
    line: 'Home',
    subLine: 'Homeowners',
    type: 'Individual',
    status: 'on-sale',
    states: ['CA', 'TX', 'FL', 'NY', 'IL'],
    premium: 280000000,
    policyCount: 16800,
    lossRatio: 0.631,
    renewalRate: 0.842,
    launchDate: '2019-03-20',
  },
  {
    id: 'p3',
    insurerId: '1',
    name: 'Travelers Commercial Property',
    code: 'TRV-COMM-003',
    line: 'Commercial',
    subLine: 'Commercial Property',
    type: 'Group',
    status: 'on-sale',
    states: ['TX', 'FL', 'NY', 'IL', 'OH'],
    premium: 420000000,
    policyCount: 8600,
    lossRatio: 0.578,
    renewalRate: 0.892,
    launchDate: '2018-07-01',
  },
  {
    id: 'p4',
    insurerId: '2',
    name: 'Liberty Auto Premier',
    code: 'LM-AUTO-001',
    line: 'Auto',
    subLine: 'Personal Auto',
    type: 'Individual',
    status: 'on-sale',
    states: ['CA', 'TX', 'NY', 'FL'],
    premium: 245000000,
    policyCount: 14200,
    lossRatio: 0.642,
    renewalRate: 0.822,
    launchDate: '2021-02-10',
  },
  {
    id: 'p5',
    insurerId: '2',
    name: 'Liberty Home Shield',
    code: 'LM-HOME-002',
    line: 'Home',
    subLine: 'Homeowners',
    type: 'Individual',
    status: 'on-sale',
    states: ['CA', 'TX', 'NY'],
    premium: 198000000,
    policyCount: 12400,
    lossRatio: 0.659,
    renewalRate: 0.811,
    launchDate: '2020-06-15',
  },
  {
    id: 'p6',
    insurerId: '3',
    name: 'Nationwide On Your Side Auto',
    code: 'NW-AUTO-001',
    line: 'Auto',
    subLine: 'Personal Auto',
    type: 'Individual',
    status: 'on-sale',
    states: ['OH', 'TX', 'GA', 'NC', 'VA'],
    premium: 210000000,
    policyCount: 14800,
    lossRatio: 0.578,
    renewalRate: 0.882,
    launchDate: '2019-09-01',
  },
  {
    id: 'p7',
    insurerId: '4',
    name: 'Chubb Masterpiece Homeowners',
    code: 'CHB-HOME-001',
    line: 'Home',
    subLine: 'High-Value Home',
    type: 'Individual',
    status: 'on-sale',
    states: ['NY', 'CA', 'CT', 'MA', 'NJ'],
    premium: 580000000,
    policyCount: 12200,
    lossRatio: 0.531,
    renewalRate: 0.921,
    launchDate: '2017-01-10',
  },
  {
    id: 'p8',
    insurerId: '4',
    name: 'Chubb Cyber Enterprise Risk',
    code: 'CHB-CYB-002',
    line: 'Cyber',
    subLine: 'Enterprise Cyber',
    type: 'Group',
    status: 'on-sale',
    states: ['NY', 'CA', 'TX', 'IL', 'MA'],
    premium: 420000000,
    policyCount: 6800,
    lossRatio: 0.542,
    renewalRate: 0.903,
    launchDate: '2020-04-01',
  },
  {
    id: 'p9',
    insurerId: '5',
    name: 'AIG Professional Liability',
    code: 'AIG-PL-001',
    line: 'Professional',
    subLine: 'E&O',
    type: 'Individual',
    status: 'on-sale',
    states: ['NY', 'CA', 'TX', 'FL', 'IL'],
    premium: 285000000,
    policyCount: 9200,
    lossRatio: 0.671,
    renewalRate: 0.781,
    launchDate: '2018-11-20',
  },
  {
    id: 'p10',
    insurerId: '5',
    name: 'AIG Travel Guard',
    code: 'AIG-TRV-002',
    line: 'Travel',
    subLine: 'Travel Insurance',
    type: 'Individual',
    status: 'paused',
    states: ['ALL'],
    premium: 125000000,
    policyCount: 5600,
    lossRatio: 0.698,
    renewalRate: 0.601,
    launchDate: '2022-01-05',
  },
  {
    id: 'p11',
    insurerId: '7',
    name: 'BHSI D&O Advantage',
    code: 'BHSI-DO-001',
    line: 'D_O',
    subLine: 'Directors & Officers',
    type: 'Group',
    status: 'on-sale',
    states: ['NY', 'DE', 'CA'],
    premium: 180000000,
    policyCount: 3200,
    lossRatio: 0.468,
    renewalRate: 0.941,
    launchDate: '2023-03-15',
  },
  {
    id: 'p12',
    insurerId: '8',
    name: 'Hartford Business Owner Policy',
    code: 'HFD-BOP-001',
    line: 'Commercial',
    subLine: 'BOP',
    type: 'Group',
    status: 'on-sale',
    states: ['CT', 'NY', 'NJ', 'MA', 'PA'],
    premium: 340000000,
    policyCount: 14800,
    lossRatio: 0.658,
    renewalRate: 0.822,
    launchDate: '2019-06-01',
  },
];

export function formatCurrency(val: number, short?: boolean): string {
  if (short) {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(0)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
    return `$${val}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatPercent(val: number): string {
  return `${(val * 100).toFixed(1)}%`;
}

export interface Channel {
  id: string;
  name: string;
  type: 'Independent Agency' | 'Broker' | 'MGA' | 'Wholesale Broker' | 'Direct';
  status: 'active' | 'inactive' | 'onboarding' | 'suspended';
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Standard';
  parentId?: string;
  level: number;
  agentCount: number;
  totalPremium: number;
  policyCount: number;
  lossRatio: number;
  renewalRate: number;
  commissionRate: number;
  state: string;
  region: Region;
  joinDate: string;
  npnCode: string;
  manager: string;
}

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
];
