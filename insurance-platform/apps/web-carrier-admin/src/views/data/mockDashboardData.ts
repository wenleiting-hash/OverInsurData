// Mock data for Dashboard - 1:1 matches design prototype screenshot
// Values from attached screenshot: $7.5B total premium, 236,800 policies, 287 channels, $51M commission

export interface InsuranceCarrier {
  carrierId: string
  naicCode: string
  carrierName: string
  shortName: string
  type: 'Admitted' | 'Non-Admitted' | string
  status: 'active' | 'inactive' | 'pending' | string
  region: string
  lossRatio?: number
  renewalRate?: number
  revenue?: number
  policyCount?: number
  commissionIncome?: number
  coopStatus?: 'active' | 'expiring' | 'pending' | string
  amBestRating?: string
  settlementCycle?: 'Monthly' | 'Quarterly'
  lines?: string[]
  founded?: number
  website?: string
  coopType?: string
  state?: string
  spRating?: string
  moodysRating?: string
  fitchRating?: string
}

export const insurers: InsuranceCarrier[] = [
  // === Admitted Carriers (18 条) ===
  { carrierId: 'c1001', naicCode: '25658', carrierName: 'Travelers Insurance Company', shortName: 'Travelers', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.58, renewalRate: 0.92, revenue: 1850000000, policyCount: 52800, commissionIncome: 12500000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1853, website: 'www.travelers.com', coopType: '直接代理', state: 'CT', spRating: 'AA-', moodysRating: 'Aa2', fitchRating: 'AA-' },
  { carrierId: 'c1002', naicCode: '12345', carrierName: 'Chubb Limited', shortName: 'Chubb', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.62, renewalRate: 0.89, revenue: 1480000000, policyCount: 45600, commissionIncome: 10000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1882, website: 'www.chubb.com', coopType: 'MGA（Managing General Agent）', state: 'NJ', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+' },
  { carrierId: 'c1003', naicCode: '34567', carrierName: 'Liberty Mutual Insurance Group', shortName: 'Liberty Mutual', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.64, renewalRate: 0.88, revenue: 1230000000, policyCount: 38500, commissionIncome: 8400000, coopStatus: 'expiring', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1912, website: 'www.libertymutual.com', coopType: '批发经纪', state: 'MA', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
  { carrierId: 'c1004', naicCode: '45678', carrierName: 'Nationwide Mutual Insurance Company', shortName: 'Nationwide', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.61, renewalRate: 0.90, revenue: 1150000000, policyCount: 42000, commissionIncome: 9200000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1926, website: 'www.nationwide.com', coopType: '独立代理', state: 'OH', spRating: 'A', moodysRating: 'A1', fitchRating: 'A+' },
  { carrierId: 'c1005', naicCode: '56789', carrierName: 'State Farm Mutual Automobile Insurance Company', shortName: 'State Farm', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.59, renewalRate: 0.93, revenue: 1680000000, policyCount: 58000, commissionIncome: 13800000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1922, website: 'www.statefarm.com', coopType: '直接代理', state: 'IL', spRating: 'AA-', moodysRating: 'Aa3', fitchRating: 'AA-' },
  { carrierId: 'c1006', naicCode: '67890', carrierName: 'The Hartford Fire Insurance Company', shortName: 'The Hartford', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.63, renewalRate: 0.87, revenue: 980000000, policyCount: 32000, commissionIncome: 7200000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1810, website: 'www.thehartford.com', coopType: 'MGA（Managing General Agent）', state: 'CT', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-' },
  { carrierId: 'c1007', naicCode: '78901', carrierName: 'Allstate Insurance Company', shortName: 'Allstate', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.60, renewalRate: 0.91, revenue: 1320000000, policyCount: 48000, commissionIncome: 11000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1931, website: 'www.allstate.com', coopType: '独立代理', state: 'IL', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+' },
  { carrierId: 'c1008', naicCode: '89012', carrierName: 'Progressive Direct Insurance Company', shortName: 'Progressive', type: 'Admitted', status: 'active', region: 'National', lossRatio: 0.65, renewalRate: 0.86, revenue: 1540000000, policyCount: 55000, commissionIncome: 12000000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1937, website: 'www.progressive.com', coopType: '直接代理', state: 'OH', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
  { carrierId: 'c1009', naicCode: '90123', carrierName: 'Farmers Group Inc.', shortName: 'Farmers Insurance', type: 'Admitted', status: 'active', region: 'West', lossRatio: 0.62, renewalRate: 0.88, revenue: 1080000000, policyCount: 39000, commissionIncome: 8800000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1900, website: 'www.farmers.com', coopType: '独立代理', state: 'CA', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
  { carrierId: 'c1010', naicCode: '01234', carrierName: 'Metropolitan Property and Casualty Insurance Company', shortName: 'MetLife P&C', type: 'Admitted', status: 'active', region: 'Northeast', lossRatio: 0.57, renewalRate: 0.94, revenue: 720000000, policyCount: 28000, commissionIncome: 6500000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1868, website: 'www.metlife.com', coopType: 'MGA（Managing General Agent）', state: 'NY', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+' },
  
  // === Non-Admitted Carriers (5 条) ===
  { carrierId: 'c1011', naicCode: '11223', carrierName: 'Excess and Surplus Solutions LLC', shortName: 'ESS', type: 'Non-Admitted', status: 'active', region: 'Southeast', lossRatio: 0.68, renewalRate: 0.82, revenue: 450000000, policyCount: 18000, commissionIncome: 5200000, coopStatus: 'active', amBestRating: 'BBB+', settlementCycle: 'Monthly', founded: 2005, website: 'www.exsurplus.com', coopType: '特殊风险经纪商', state: 'FL', spRating: 'BBB+', moodysRating: 'Ba1', fitchRating: 'BBB+' },
  { carrierId: 'c1012', naicCode: '22334', carrierName: 'Catastrophe Reinsurance Partners', shortName: 'CRP', type: 'Non-Admitted', status: 'active', region: 'National', lossRatio: 0.72, renewalRate: 0.78, revenue: 380000000, policyCount: 12000, commissionIncome: 4800000, coopStatus: 'active', amBestRating: 'BBB', settlementCycle: 'Quarterly', founded: 2010, website: 'www.catreins.com', coopType: '再保险伙伴', state: 'TX', spRating: 'BBB', moodysRating: 'Baa3', fitchRating: 'BBB' },
  { carrierId: 'c1013', naicCode: '33445', carrierName: 'High Risk Coverage Specialists', shortName: 'HRC', type: 'Non-Admitted', status: 'pending', region: 'Midwest', lossRatio: 0.75, renewalRate: 0.75, revenue: 280000000, policyCount: 9500, commissionIncome: 3200000, coopStatus: 'pending', amBestRating: 'BB+', settlementCycle: 'Monthly', founded: 2015, website: 'www.highriskcoverage.com', coopType: '高风险经纪人', state: 'IL', spRating: 'BB+', moodysRating: 'Ba2', fitchRating: 'BBB-' },
  { carrierId: 'c1014', naicCode: '44556', carrierName: 'Cyber Liability Underwriters', shortName: 'CLU', type: 'Non-Admitted', status: 'active', region: 'West', lossRatio: 0.55, renewalRate: 0.95, revenue: 520000000, policyCount: 22000, commissionIncome: 6800000, coopStatus: 'active', amBestRating: 'A-', settlementCycle: 'Monthly', founded: 2012, website: 'www.cyberliability.com', coopType: '网络险专家', state: 'CA', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-' },
  { carrierId: 'c1015', naicCode: '55667', carrierName: 'Professional Indemnity Exchange', shortName: 'PIE', type: 'Non-Admitted', status: 'inactive', region: 'Northeast', lossRatio: 0.70, renewalRate: 0.80, revenue: 350000000, policyCount: 14000, commissionIncome: 4200000, coopStatus: 'suspended', amBestRating: 'BBB-', settlementCycle: 'Quarterly', founded: 2008, website: 'www.profindem.com', coopType: '职业责任险交换', state: 'NY', spRating: 'BBB-', moodysRating: 'Baa1', fitchRating: 'BBB-' },
  
  // === Mixed Status Carriers (7 条) ===
  { carrierId: 'c1016', naicCode: '66778', carrierName: 'American Family Mutual Insurance Company', shortName: 'AmFam', type: 'Admitted', status: 'active', region: 'Midwest', lossRatio: 0.59, renewalRate: 0.90, revenue: 890000000, policyCount: 34000, commissionIncome: 7800000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Monthly', founded: 1926, website: 'www.amfam.com', coopType: '直接代理', state: 'WI', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
  { carrierId: 'c1017', naicCode: '77889', carrierName: 'Safeco Insurance Company of Illinois', shortName: 'Safeco', type: 'Admitted', status: 'pending', region: 'West', lossRatio: 0.61, renewalRate: 0.88, revenue: 620000000, policyCount: 25000, commissionIncome: 5600000, coopStatus: 'pending', amBestRating: 'A-', settlementCycle: 'Quarterly', founded: 1895, website: 'www.safeco.com', coopType: '间接代理', state: 'CO', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-' },
  { carrierId: 'c1018', naicCode: '88990', carrierName: 'Erie Insurance Exchange', shortName: 'Erie', type: 'Admitted', status: 'active', region: 'Northeast', lossRatio: 0.58, renewalRate: 0.92, revenue: 540000000, policyCount: 21000, commissionIncome: 4900000, coopStatus: 'active', amBestRating: 'A+', settlementCycle: 'Monthly', founded: 1925, website: 'www.erieinsurance.com', coopType: '区域代理', state: 'OH', spRating: 'A+', moodysRating: 'A1', fitchRating: 'A+' },
  { carrierId: 'c1019', naicCode: '99001', carrierName: 'Auto-Owners Insurance Company', shortName: 'Auto-Owners', type: 'Admitted', status: 'active', region: 'Midwest', lossRatio: 0.56, renewalRate: 0.93, revenue: 710000000, policyCount: 29000, commissionIncome: 6700000, coopStatus: 'active', amBestRating: 'A++', settlementCycle: 'Monthly', founded: 1916, website: 'www.auto-owners.com', coopType: '自办代理', state: 'MI', spRating: 'AA-', moodysRating: 'Aa2', fitchRating: 'AA-' },
  { carrierId: 'c1020', naicCode: '00112', carrierName: 'UCO Insurance Company', shortName: 'UCO', type: 'Admitted', status: 'pending', region: 'Southeast', lossRatio: 0.63, renewalRate: 0.85, revenue: 380000000, policyCount: 15000, commissionIncome: 3800000, coopStatus: 'pending', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1974, website: 'www.ucoinsurance.com', coopType: '合作代理', state: 'SC', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
  { carrierId: 'c1021', naicCode: '11224', carrierName: 'National Service Insurance Company', shortName: 'NSIC', type: 'Admitted', status: 'inactive', region: 'National', lossRatio: 0.66, renewalRate: 0.84, revenue: 420000000, policyCount: 17000, commissionIncome: 4100000, coopStatus: 'suspended', amBestRating: 'A-', settlementCycle: 'Monthly', founded: 1969, website: 'www.nsico.com', coopType: '全国代理', state: 'CA', spRating: 'A-', moodysRating: 'A3', fitchRating: 'A-' },
  { carrierId: 'c1022', naicCode: '22335', carrierName: 'Shelter Mutual Insurance Company', shortName: 'Shelter', type: 'Admitted', status: 'active', region: 'Southwest', lossRatio: 0.60, renewalRate: 0.89, revenue: 490000000, policyCount: 20000, commissionIncome: 4600000, coopStatus: 'active', amBestRating: 'A', settlementCycle: 'Quarterly', founded: 1929, website: 'www.shelterins.com', coopType: '区域性代理', state: 'MO', spRating: 'A', moodysRating: 'A2', fitchRating: 'A' },
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

// Market Share Data (matches design prototype exactly)
export const marketShareData = [
  { name: 'Chubb', value: 21.5, color: '#0058BC' },
  { name: 'Travelers', value: 16.2, color: '#006687' },
  { name: 'Liberty Mutual', value: 13.5, color: '#9E3D00' },
  { name: 'Nationwide', value: 12.2, color: '#60CDFF' },
  { name: 'AIG', value: 11.2, color: '#34C759' },
  { name: 'Others', value: 25.4, color: '#C1C6D7' },
]

// Alert Items (6 items matching design prototype)
export const alertItems = [
  { id: 'a1', type: 'expiring', severity: 'high', message: '合同到期提醒：Chubb 合作协议将于 30 天内到期', time: '2 小时前' },
  { id: 'a2', type: 'appointment', severity: 'warning', message: '预约待确认：Travelers 产品方案评审预约（明日 14:00）', time: '3 小时前' },
  { id: 'a3', type: 'lossratio', severity: 'info', message: '赔付率预警：Nationwide Q3 赔付率上升至 68%', time: '5 小时前' },
  { id: 'a4', type: 'pending', severity: 'warning', message: '新保险商待审核：国美人寿财产险资质申请（等待中）', time: '昨天' },
  { id: 'a5', type: 'license', severity: 'high', message: '牌照校验提示：The Hartford NAIC 注册信息需更新', time: '昨天' },
  { id: 'a6', type: 'settlement', severity: 'info', message: '结算方式变更请求：Progressive 提议启用 ACH 自动结算', time: '2 天前' },
]

// Recent Activities (5 activities matching design prototype)
export const recentActivities = [
  { id: 1, action: '更新了 Liberty Mutual 的费率表', detail: '修改了 PIP 覆盖比例，生效日期 2026-09-01', user: 'David Chen', time: '10 分钟前' },
  { id: 2, action: '批准了新的渠道申请', detail: 'Florida Auto Agency 通过资质审核', user: 'Emma Wilson', time: '1 小时前' },
  { id: 3, action: '导出了 Q3 佣金报告', detail: 'Export quarterly commission report to CSV', user: 'Frank Miller', time: '2 小时前' },
  { id: 4, action: '更新了 Chubb 的联系信息', detail: '变更代理人联系邮箱和电话', user: 'Grace Liu', time: '3 小时前' },
  { id: 5, action: '完成了 Travelers 的牌照校验', detail: 'NIPR 验证通过，评级 AAA', user: 'Henry Park', time: '5 小时前' },
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
