// Mock data for Dashboard - 1:1 matches design prototype screenshot
// Values from attached screenshot: $7.5B total premium, 236,800 policies, 287 channels, $51M commission

export interface InsuranceCarrier {
  carrierId: string
  naicCode: string
  carrierName: string
  shortName: string
  type: 'Admitted' | 'Non-Admitted' | string
  status: 'active' | 'inactive' | string
  region: string
  lossRatio?: number
  renewalRate?: number
  revenue?: number
  policyCount?: number
  commissionIncome?: number
  coopStatus?: 'active' | 'expiring' | 'suspended' | string
  amBestRating?: string
  settlementCycle?: 'Monthly' | 'Quarterly'
  lines?: string[]
  founded?: number
  website?: string
  coopType?: 'direct' | 'mga' | 'wholesale' | 'independent' | 'platform' | string
  state?: string
  spRating?: string
  moodysRating?: string
  fitchRating?: string
  contractExpiry?: string
  channelCount?: number
  productCount?: number
}

export const insurers: InsuranceCarrier[] = [
  // === Admitted Carriers (18 条) ===
  { carrierId: 'c1001', naicCode: '25658', carrierName: 'Travelers Insurance Company', shortName: 'Travelers', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.58, renewalRate: 0.92, revenue: 1850000000, policyCount: 52800, commissionIncome: 12500000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1853, website: 'www.travelers.com', coopType: 'direct', state: 'CT', spRating: 'AA-', moodysRating: 'Aa2', fitchRating: 'AA-', contractExpiry: '2027-03-31', channelCount: 156, productCount: 12, lines: ['P&C', 'Commercial', 'Auto', 'Home'] },
  { carrierId: 'c1002', naicCode: '12345', carrierName: 'Chubb Limited', shortName: 'Chubb', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.62, renewalRate: 0.89, revenue: 1480000000, policyCount: 45600, commissionIncome: 10000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1882, website: 'www.chubb.com', coopType: 'mga', state: 'NJ', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+', contractExpiry: '2026-12-31', channelCount: 128, productCount: 10, lines: ['Commercial', 'Cyber', 'Property'] },
  { carrierId: 'c1003', naicCode: '34567', carrierName: 'Liberty Mutual Insurance Group', shortName: 'Liberty Mutual', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.64, renewalRate: 0.88, revenue: 1230000000, policyCount: 38500, commissionIncome: 8400000, coopStatus: 'expiring', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1912, website: 'www.libertymutual.com', coopType: 'wholesale', state: 'MA', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2026-09-30', channelCount: 96, productCount: 9, lines: ['Auto', 'Home', 'Commercial'] },
  { carrierId: 'c1004', naicCode: '45678', carrierName: 'Nationwide Mutual Insurance Company', shortName: 'Nationwide', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.61, renewalRate: 0.90, revenue: 1150000000, policyCount: 42000, commissionIncome: 9200000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1926, website: 'www.nationwide.com', coopType: 'independent', state: 'OH', spRating: 'A', moodysRating: 'A1', fitchRating: 'A+', contractExpiry: '2027-06-30', channelCount: 104, productCount: 9, lines: ['Auto', 'Home', 'Life', 'Commercial'] },
  { carrierId: 'c1005', naicCode: '56789', carrierName: 'State Farm Mutual Automobile Insurance Company', shortName: 'State Farm', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.59, renewalRate: 0.93, revenue: 1680000000, policyCount: 58000, commissionIncome: 13800000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1922, website: 'www.statefarm.com', coopType: 'direct', state: 'IL', spRating: 'AA-', moodysRating: 'Aa3', fitchRating: 'AA-', contractExpiry: '2027-01-31', channelCount: 142, productCount: 8, lines: ['Auto', 'Home', 'Life'] },
  { carrierId: 'c1006', naicCode: '67890', carrierName: 'The Hartford Fire Insurance Company', shortName: 'The Hartford', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.63, renewalRate: 0.87, revenue: 980000000, policyCount: 32000, commissionIncome: 7200000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1810, website: 'www.thehartford.com', coopType: 'mga', state: 'CT', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-', contractExpiry: '2026-11-30', channelCount: 88, productCount: 7, lines: ['Commercial', 'Workers Comp'] },
  { carrierId: 'c1007', naicCode: '78901', carrierName: 'Allstate Insurance Company', shortName: 'Allstate', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.60, renewalRate: 0.91, revenue: 1320000000, policyCount: 48000, commissionIncome: 11000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1931, website: 'www.allstate.com', coopType: 'independent', state: 'IL', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+', contractExpiry: '2027-04-30', channelCount: 118, productCount: 8, lines: ['Auto', 'Home'] },
  { carrierId: 'c1008', naicCode: '89012', carrierName: 'Progressive Direct Insurance Company', shortName: 'Progressive', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.65, renewalRate: 0.86, revenue: 1540000000, policyCount: 55000, commissionIncome: 12000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1937, website: 'www.progressive.com', coopType: 'direct', state: 'OH', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2027-08-31', channelCount: 134, productCount: 6, lines: ['Auto', 'Home', 'Commercial'] },
  { carrierId: 'c1009', naicCode: '90123', carrierName: 'Farmers Group Inc.', shortName: 'Farmers Insurance', type: 'Admitted', status: 'active', region: 'West', lossRatio: 0.62, renewalRate: 0.88, revenue: 1080000000, policyCount: 39000, commissionIncome: 8800000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1900, website: 'www.farmers.com', coopType: 'independent', state: 'CA', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2026-12-31', channelCount: 92, productCount: 9, lines: ['Auto', 'Home', 'Life'] },
  { carrierId: 'c1010', naicCode: '01234', carrierName: 'Metropolitan Property and Casualty Insurance Company', shortName: 'MetLife P&C', type: 'Admitted', status: 'active', region: 'Northeast', lossRatio: 0.57, renewalRate: 0.94, revenue: 720000000, policyCount: 28000, commissionIncome: 6500000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1868, website: 'www.metlife.com', coopType: 'mga', state: 'NY', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+', contractExpiry: '2027-02-28', channelCount: 64, productCount: 6, lines: ['Auto', 'Home', 'Property'] },

  // === Non-Admitted Carriers (5 条) ===
  { carrierId: 'c1011', naicCode: '11223', carrierName: 'Excess and Surplus Solutions LLC', shortName: 'ESS', type: 'Non-Admitted', status: 'active', region: 'Southeast', lossRatio: 0.68, renewalRate: 0.82, revenue: 450000000, policyCount: 18000, commissionIncome: 5200000, coopStatus: 'active', amBestRating: 'BBB+', settlementCycle: 'Monthly', founded: 2005, website: 'www.exsurplus.com', coopType: 'wholesale', state: 'FL', spRating: 'BBB+', moodysRating: 'Ba1', fitchRating: 'BBB+', contractExpiry: '2026-10-31', channelCount: 22, productCount: 4, lines: ['E&S', 'Specialty'] },
  { carrierId: 'c1012', naicCode: '22334', carrierName: 'Catastrophe Reinsurance Partners', shortName: 'CRP', type: 'Non-Admitted', status: 'active', region: 'National', lossRatio: 0.72, renewalRate: 0.78, revenue: 380000000, policyCount: 12000, commissionIncome: 4800000, coopStatus: 'active', amBestRating: 'BBB', settlementCycle: 'Quarterly', founded: 2010, website: 'www.catreins.com', coopType: 'wholesale', state: 'TX', spRating: 'BBB', moodysRating: 'Baa3', fitchRating: 'BBB', contractExpiry: '2027-05-31', channelCount: 12, productCount: 3, lines: ['Reinsurance'] },
  { carrierId: 'c1013', naicCode: '33445', carrierName: 'High Risk Coverage Specialists', shortName: 'HRC', type: 'Non-Admitted', status: 'active', region: 'Midwest', lossRatio: 0.75, renewalRate: 0.75, revenue: 280000000, policyCount: 9500, commissionIncome: 3200000, coopStatus: 'active', amBestRating: 'BB+', settlementCycle: 'Monthly', founded: 2015, website: 'www.highriskcoverage.com', coopType: 'wholesale', state: 'IL', spRating: 'BB+', moodysRating: 'Ba2', fitchRating: 'BBB-', contractExpiry: '2026-12-31', channelCount: 18, productCount: 3, lines: ['Specialty', 'E&S'] },
  { carrierId: 'c1014', naicCode: '44556', carrierName: 'Cyber Liability Underwriters', shortName: 'CLU', type: 'Non-Admitted', status: 'active', region: 'West', lossRatio: 0.55, renewalRate: 0.95, revenue: 520000000, policyCount: 22000, commissionIncome: 6800000, coopStatus: 'active', amBestRating: 'A-', settlementCycle: 'Monthly', founded: 2012, website: 'www.cyberliability.com', coopType: 'wholesale', state: 'CA', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-', contractExpiry: '2027-09-30', channelCount: 26, productCount: 5, lines: ['Cyber', 'Tech E&O'] },
  { carrierId: 'c1015', naicCode: '55667', carrierName: 'Professional Indemnity Exchange', shortName: 'PIE', type: 'Non-Admitted', status: 'inactive', region: 'Northeast', lossRatio: 0.70, renewalRate: 0.80, revenue: 350000000, policyCount: 14000, commissionIncome: 4200000, coopStatus: 'suspended', amBestRating: 'BBB-', settlementCycle: 'Quarterly', founded: 2008, website: 'www.profindem.com', coopType: 'wholesale', state: 'NY', spRating: 'BBB-', moodysRating: 'Baa1', fitchRating: 'BBB-', contractExpiry: '2026-06-30', channelCount: 14, productCount: 3, lines: ['Professional Liability'] },

  // === Mixed Status Carriers (7 条) ===
  { carrierId: 'c1016', naicCode: '66778', carrierName: 'American Family Mutual Insurance Company', shortName: 'AmFam', type: 'Admitted', status: 'active', region: 'Midwest', lossRatio: 0.59, renewalRate: 0.90, revenue: 890000000, policyCount: 34000, commissionIncome: 7800000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Monthly', founded: 1926, website: 'www.amfam.com', coopType: 'direct', state: 'WI', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2027-03-31', channelCount: 78, productCount: 7, lines: ['Auto', 'Home', 'Life'] },
  { carrierId: 'c1017', naicCode: '77889', carrierName: 'Safeco Insurance Company of Illinois', shortName: 'Safeco', type: 'Admitted', status: 'active', region: 'West', lossRatio: 0.61, renewalRate: 0.88, revenue: 620000000, policyCount: 25000, commissionIncome: 5600000, coopStatus: 'active', amBestRating: 'A-', settlementCycle: 'Quarterly', founded: 1895, website: 'www.safeco.com', coopType: 'direct', state: 'CO', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-', contractExpiry: '2026-11-30', channelCount: 56, productCount: 6, lines: ['Auto', 'Home'] },
  { carrierId: 'c1018', naicCode: '88990', carrierName: 'Erie Insurance Exchange', shortName: 'Erie', type: 'Admitted', status: 'active', region: 'Northeast', lossRatio: 0.58, renewalRate: 0.92, revenue: 540000000, policyCount: 21000, commissionIncome: 4900000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1925, website: 'www.erieinsurance.com', coopType: 'independent', state: 'OH', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+', contractExpiry: '2027-07-31', channelCount: 48, productCount: 6, lines: ['Auto', 'Home', 'Commercial'] },
  { carrierId: 'c1019', naicCode: '99001', carrierName: 'Auto-Owners Insurance Company', shortName: 'Auto-Owners', type: 'Admitted', status: 'active', region: 'Midwest', lossRatio: 0.56, renewalRate: 0.93, revenue: 710000000, policyCount: 29000, commissionIncome: 6700000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1916, website: 'www.auto-owners.com', coopType: 'direct', state: 'MI', spRating: 'AA-', moodysRating: 'Aa2', fitchRating: 'AA-', contractExpiry: '2027-02-28', channelCount: 52, productCount: 7, lines: ['Auto', 'Home', 'Life', 'Commercial'] },
  { carrierId: 'c1020', naicCode: '00112', carrierName: 'UCO Insurance Company', shortName: 'UCO', type: 'Admitted', status: 'active', region: 'Southeast', lossRatio: 0.63, renewalRate: 0.85, revenue: 380000000, policyCount: 15000, commissionIncome: 3800000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1974, website: 'www.ucoinsurance.com', coopType: 'independent', state: 'SC', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2026-12-31', channelCount: 24, productCount: 4, lines: ['Auto', 'Property'] },
  { carrierId: 'c1021', naicCode: '11224', carrierName: 'National Service Insurance Company', shortName: 'NSIC', type: 'Admitted', status: 'inactive', region: 'National', lossRatio: 0.66, renewalRate: 0.84, revenue: 420000000, policyCount: 17000, commissionIncome: 4100000, coopStatus: 'suspended', amBestRating: 'A-', settlementCycle: 'Monthly', founded: 1969, website: 'www.nsico.com', coopType: 'independent', state: 'CA', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-', contractExpiry: '2026-05-31', channelCount: 30, productCount: 4, lines: ['Auto', 'Commercial'] },
  { carrierId: 'c1022', naicCode: '22335', carrierName: 'Shelter Mutual Insurance Company', shortName: 'Shelter', type: 'Admitted', status: 'active', region: 'Southwest', lossRatio: 0.60, renewalRate: 0.89, revenue: 490000000, policyCount: 20000, commissionIncome: 4600000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1929, website: 'www.shelterins.com', coopType: 'independent', state: 'MO', spRating: 'A', moodysRating: 'A2', fitchRating: 'A', contractExpiry: '2027-04-30', channelCount: 44, productCount: 5, lines: ['Auto', 'Home'] },
] as InsuranceCarrier[];

// Premium Trend Data (matches design prototype)
export const premiumTrendData = [
  { month: 'Jan', newBiz: 52.3, renewal: 138.5, premium: 190.8 },
  { month: 'Feb', newBiz: 50.1, renewal: 140.2, premium: 190.3 },
  { month: 'Mar', newBiz: 54.8, renewal: 141.7, premium: 196.5 },
  { month: 'Apr', newBiz: 58.2, renewal: 142.9, premium: 201.1 },
  { month: 'May', newBiz: 60.5, renewal: 143.8, premium: 204.3 },
  { month: 'Jun', newBiz: 62.1, renewal: 144.5, premium: 206.6 },
  { month: 'Jul', newBiz: 63.8, renewal: 145.3, premium: 209.1 },
  { month: 'Aug', newBiz: 65.2, renewal: 146.1, premium: 211.3 },
  { month: 'Sep', newBiz: 66.5, renewal: 146.8, premium: 213.3 },
  { month: 'Oct', newBiz: 67.8, renewal: 147.4, premium: 215.2 },
  { month: 'Nov', newBiz: 69.1, renewal: 148.0, premium: 217.1 },
  { month: 'Dec', newBiz: 70.5, renewal: 148.7, premium: 219.2 },
]

// Market Share Data (blue progressive palette, aligns with design prototype)
export const marketShareData = [
  { name: 'Chubb', value: 21.5, color: '#0058BC' },
  { name: 'Travelers', value: 16.2, color: '#0070EB' },
  { name: 'Liberty Mutual', value: 13.5, color: '#006687' },
  { name: 'Nationwide', value: 12.2, color: '#60CDFF' },
  { name: 'AIG', value: 11.2, color: '#ADC6FF' },
  { name: 'Others', value: 25.4, color: '#C1C6D7' },
]

// Alert Items (6 items matching design prototype)
export interface AlertItem {
  id: number;
  type: 'expiring' | 'appointment' | 'lossratio' | 'pending' | 'license' | 'settlement' | string;
  severity: 'high' | 'warning' | 'info' | string;
  link?: string | null;
  timeKey: 'today' | 'yesterday' | 'daysAgo';
  days?: number;
  daysAgo?: number;
  date?: string;
  count?: number;
  ratio?: string;
  threshold?: string;
  month?: number;
  amount?: string;
}

export const alertItems: AlertItem[] = [
  { id: 1, type: 'expiring', severity: 'high', link: '5', timeKey: 'today', days: 39, date: '2026-09-30' },
  { id: 2, type: 'appointment', severity: 'warning', link: null, timeKey: 'today', count: 3, days: 60 },
  { id: 3, type: 'lossratio', severity: 'warning', link: '9', timeKey: 'yesterday', ratio: '71.2%', threshold: '65%' },
  { id: 4, type: 'pending', severity: 'info', link: '7', timeKey: 'daysAgo', daysAgo: 2 },
  { id: 5, type: 'license', severity: 'warning', link: 'c10', timeKey: 'daysAgo', daysAgo: 3 },
  { id: 6, type: 'settlement', severity: 'info', link: null, timeKey: 'daysAgo', daysAgo: 4, month: 8, amount: '$2.14M' },
]

// Recent Activities (5 activities matching design prototype)
export interface RecentActivity {
  id: number;
  actKey: 'newInsurer' | 'productLaunch' | 'appointment' | 'reconciliation' | 'channelSuspended';
  user: string;
  icon?: string;
  timeKey: 'min' | 'hour' | 'yesterdayClock';
  n?: number;
  clock?: string;
  entity?: string;
  entity2?: string;
  region?: string;
  month?: number;
  variance?: string;
}

export const recentActivities: RecentActivity[] = [
  { id: 1, actKey: 'newInsurer', user: 'Liu Yang', icon: 'building', timeKey: 'min', n: 10, entity: 'BHSI (Berkshire Hathaway)' },
  { id: 2, actKey: 'productLaunch', user: 'Wang Fang', icon: 'package', timeKey: 'hour', n: 1, entity: 'Chubb Cyber Enterprise Risk', region: 'NY/CA' },
  { id: 3, actKey: 'appointment', user: 'Zhang Wei', icon: 'shield', timeKey: 'hour', n: 3, entity: 'Southwest Insurance Network', entity2: 'Zurich', region: 'AZ' },
  { id: 4, actKey: 'reconciliation', user: 'System', icon: 'dollar', timeKey: 'yesterdayClock', clock: '16:40', entity: 'Travelers', month: 8, variance: '0.3%' },
  { id: 5, actKey: 'channelSuspended', user: 'Chen Hao', icon: 'alert', timeKey: 'yesterdayClock', clock: '09:12', entity: 'Northeast Professional Services' },
]

// Utility functions matching design prototype
export function formatCurrency(value: number, short = false): string {
  if (short) {
    const B = Math.abs(value) / 1_000_000_000
    return `${value < 0 ? '-' : ''}${B.toFixed(1)}B`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 }).format(value)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
