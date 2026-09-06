// ── Monthly trend data (12 months: Sep 2025 → Aug 2026) ──────────────────────

export const MONTHS = ['Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug']
export const MONTHS_FULL = ['2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07','2026-08']

// ── Insurer Performance Overview ─────────────────────────────────────────────

export interface InsurerKPI {
  insurerId: string
  insurerShort: string
  insurerColor: string
  totalPremium: number
  premiumGrowth: number
  totalCommission: number
  commissionRate: number
  activePolicies: number
  newPolicies: number
  cancelledPolicies: number
  lossRatio: number
  lossRatioDelta: number
  renewalRate: number
  renewalRateDelta: number
  activeChannels: number
  activeProducts: number
  rank: number
}

export const insurerKPIs: InsurerKPI[] = [
  { insurerId: '1', insurerShort: 'Travelers',     insurerColor: '#0058BC', totalPremium: 48219000, premiumGrowth: 0.142, totalCommission: 5786280, commissionRate: 0.120, activePolicies: 18420, newPolicies: 3124, cancelledPolicies: 412, lossRatio: 0.612, lossRatioDelta: -0.018, renewalRate: 0.882, renewalRateDelta: 0.012, activeChannels: 28, activeProducts: 14, rank: 1 },
  { insurerId: '2', insurerShort: 'Liberty Mutual', insurerColor: '#34C759', totalPremium: 60452000, premiumGrowth: 0.089, totalCommission: 7254240, commissionRate: 0.120, activePolicies: 23100, newPolicies: 2890, cancelledPolicies: 534, lossRatio: 0.641, lossRatioDelta: 0.008, renewalRate: 0.864, renewalRateDelta: -0.004, activeChannels: 34, activeProducts: 18, rank: 2 },
  { insurerId: '3', insurerShort: 'Nationwide',    insurerColor: '#FF9F0A', totalPremium: 23418000, premiumGrowth: 0.063, totalCommission: 2810160, commissionRate: 0.120, activePolicies: 9870,  newPolicies: 1240, cancelledPolicies: 218, lossRatio: 0.578, lossRatioDelta: -0.024, renewalRate: 0.901, renewalRateDelta: 0.021, activeChannels: 18, activeProducts: 9,  rank: 4 },
  { insurerId: '4', insurerShort: 'Chubb',         insurerColor: '#AF52DE', totalPremium: 32186000, premiumGrowth: 0.201, totalCommission: 3862320, commissionRate: 0.120, activePolicies: 6540,  newPolicies: 1820, cancelledPolicies: 89,  lossRatio: 0.523, lossRatioDelta: -0.031, renewalRate: 0.921, renewalRateDelta: 0.028, activeChannels: 14, activeProducts: 21, rank: 3 },
  { insurerId: '5', insurerShort: 'AIG',           insurerColor: '#FF6B6B', totalPremium: 18924000, premiumGrowth: 0.047, totalCommission: 2270880, commissionRate: 0.120, activePolicies: 4210,  newPolicies: 620,  cancelledPolicies: 312, lossRatio: 0.682, lossRatioDelta: 0.019, renewalRate: 0.831, renewalRateDelta: -0.022, activeChannels: 12, activeProducts: 11, rank: 5 },
  { insurerId: '6', insurerShort: 'Zurich',        insurerColor: '#60CDFF', totalPremium: 89346000, premiumGrowth: 0.156, totalCommission:10721520, commissionRate: 0.120, activePolicies: 31200, newPolicies: 5480, cancelledPolicies: 720, lossRatio: 0.594, lossRatioDelta: -0.012, renewalRate: 0.876, renewalRateDelta: 0.008, activeChannels: 42, activeProducts: 26, rank: 0 },
]

// ── Monthly premium trend per insurer ────────────────────────────────────────

export const premiumTrendData = MONTHS.map((m, i) => ({
  month: m,
  Travelers:     [3200, 3350, 3480, 3600, 3750, 3810, 3920, 4010, 4120, 4250, 4380, 4822][i],
  'Liberty Mutual': [4800, 4920, 5010, 5150, 5280, 5180, 5340, 5490, 5600, 5720, 5850, 6045][i],
  Nationwide:    [1820, 1890, 1940, 2010, 2080, 2050, 2120, 2200, 2260, 2310, 2360, 2342][i],
  Chubb:         [2100, 2250, 2380, 2500, 2640, 2720, 2830, 2960, 3050, 3100, 3160, 3219][i],
  AIG:           [1680, 1710, 1740, 1760, 1780, 1760, 1790, 1820, 1840, 1870, 1900, 1892][i],
  Zurich:        [6400, 6700, 7000, 7200, 7500, 7400, 7700, 8000, 8200, 8500, 8700, 8935][i],
}))

// ── YTD performance vs target ────────────────────────────────────────────────

export const performanceVsTarget = insurerKPIs.map(k => ({
  name: k.insurerShort,
  actual: Math.round(k.totalPremium / 1e6 * 10) / 10,
  target: Math.round(k.totalPremium / 1e6 / (1 + k.premiumGrowth) * 1.1 * 10) / 10,
  color: k.insurerColor,
}))

// ── Product Performance Analysis ─────────────────────────────────────────────

export interface ProductPerf {
  productId: string
  productName: string
  insurerShort: string
  line: string
  totalPremium: number
  premiumGrowth: number
  policyCount: number
  newPolicies: number
  avgPremium: number
  commissionEarned: number
  lossRatio: number
  renewalRate: number
  topState: string
  topChannel: string
  status: 'on-sale' | 'off-sale'
}

export const productPerfData: ProductPerf[] = [
  { productId: 'p1', productName: 'Travelers Commercial Package', insurerShort: 'Travelers', line: 'Commercial', totalPremium: 14820000, premiumGrowth: 0.182, policyCount: 4210, newPolicies: 820, avgPremium: 3520, commissionEarned: 1778400, lossRatio: 0.598, renewalRate: 0.891, topState: 'CA', topChannel: 'Pacific Coast', status: 'on-sale' },
  { productId: 'p2', productName: 'Travelers Auto Commercial', insurerShort: 'Travelers', line: 'Auto', totalPremium: 8340000, premiumGrowth: 0.094, policyCount: 5820, newPolicies: 940, avgPremium: 1433, commissionEarned: 1000800, lossRatio: 0.621, renewalRate: 0.876, topState: 'TX', topChannel: 'Lone Star', status: 'on-sale' },
  { productId: 'p7', productName: 'Chubb Directors & Officers', insurerShort: 'Chubb', line: 'Specialty', totalPremium: 11240000, premiumGrowth: 0.238, policyCount: 1820, newPolicies: 640, avgPremium: 6176, commissionEarned: 1348800, lossRatio: 0.492, renewalRate: 0.934, topState: 'NY', topChannel: 'Empire State', status: 'on-sale' },
  { productId: 'p8', productName: 'Chubb Cyber Enterprise', insurerShort: 'Chubb', line: 'Specialty', totalPremium: 9840000, premiumGrowth: 0.341, policyCount: 1240, newPolicies: 580, avgPremium: 7935, commissionEarned: 1180800, lossRatio: 0.441, renewalRate: 0.951, topState: 'CA', topChannel: 'Pacific Coast', status: 'on-sale' },
  { productId: 'p3', productName: 'Liberty Mutual BOP', insurerShort: 'Liberty Mutual', line: 'Commercial', totalPremium: 18200000, premiumGrowth: 0.112, policyCount: 8200, newPolicies: 1100, avgPremium: 2220, commissionEarned: 2184000, lossRatio: 0.648, renewalRate: 0.858, topState: 'FL', topChannel: 'Sunshine State', status: 'on-sale' },
  { productId: 'p4', productName: 'Nationwide Farm & Ranch', insurerShort: 'Nationwide', line: 'Commercial', totalPremium: 6820000, premiumGrowth: 0.041, policyCount: 2840, newPolicies: 310, avgPremium: 2401, commissionEarned: 818400, lossRatio: 0.562, renewalRate: 0.912, topState: 'IL', topChannel: 'Great Lakes', status: 'on-sale' },
  { productId: 'p5', productName: 'Zurich GL Commercial', insurerShort: 'Zurich', line: 'Commercial', totalPremium: 32800000, premiumGrowth: 0.188, policyCount: 9400, newPolicies: 2100, avgPremium: 3489, commissionEarned: 3936000, lossRatio: 0.581, renewalRate: 0.882, topState: 'TX', topChannel: 'Lone Star', status: 'on-sale' },
  { productId: 'p6', productName: 'AIG Professional Liability', insurerShort: 'AIG', line: 'Professional', totalPremium: 12400000, premiumGrowth: -0.028, policyCount: 2800, newPolicies: 280, avgPremium: 4429, commissionEarned: 1488000, lossRatio: 0.714, renewalRate: 0.801, topState: 'FL', topChannel: 'Sunshine State', status: 'on-sale' },
]

// Monthly product premium trend
export const productMonthlyData = MONTHS.map((m, i) => ({
  month: m,
  'Travelers Comm.': [1050, 1100, 1150, 1180, 1220, 1240, 1280, 1310, 1360, 1400, 1460, 1482][i],
  'Chubb D&O':       [720,  760,  800,  850,  880,  920,  960,  1000, 1040, 1080, 1120, 1124][i],
  'Chubb Cyber':     [520,  560,  610,  680,  740,  800,  850,  910,  960,  1020, 980,  984][i],
  'Zurich GL':       [2200, 2320, 2450, 2560, 2680, 2640, 2780, 2900, 3020, 3100, 3180, 3280][i],
}))

// ── Regional Performance ──────────────────────────────────────────────────────

export interface StatePerf {
  state: string
  region: string
  totalPremium: number
  policyCount: number
  lossRatio: number
  growthRate: number
  topInsurer: string
  topProduct: string
  channelCount: number
}

export const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West']
export const REGION_STATES: Record<string, string[]> = {
  Northeast: ['ME','NH','VT','MA','RI','CT','NY','NJ','PA'],
  Southeast: ['DE','MD','VA','WV','KY','NC','SC','TN','GA','FL','AL','MS','AR','LA'],
  Midwest:   ['OH','MI','IN','WI','IL','MN','IA','MO','ND','SD','NE','KS'],
  Southwest: ['TX','OK','NM','AZ'],
  West:      ['CO','WY','MT','ID','WA','OR','CA','NV','UT','HI','AK'],
}

export const statePerformance: StatePerf[] = [
  { state: 'CA', region: 'West',      totalPremium: 28400000, policyCount: 8820, lossRatio: 0.601, growthRate: 0.162, topInsurer: 'Zurich',        topProduct: 'Zurich GL',    channelCount: 14 },
  { state: 'TX', region: 'Southwest', totalPremium: 22800000, policyCount: 7240, lossRatio: 0.588, growthRate: 0.198, topInsurer: 'Zurich',        topProduct: 'Zurich GL',    channelCount: 12 },
  { state: 'NY', region: 'Northeast', totalPremium: 18600000, policyCount: 5420, lossRatio: 0.641, growthRate: 0.112, topInsurer: 'Chubb',         topProduct: 'Chubb D&O',    channelCount: 10 },
  { state: 'FL', region: 'Southeast', totalPremium: 16200000, policyCount: 6180, lossRatio: 0.672, growthRate: 0.088, topInsurer: 'Liberty Mutual',topProduct: 'LM BOP',       channelCount: 9  },
  { state: 'IL', region: 'Midwest',   totalPremium: 9800000,  policyCount: 3540, lossRatio: 0.572, growthRate: 0.074, topInsurer: 'Nationwide',    topProduct: 'Farm & Ranch', channelCount: 8  },
  { state: 'OH', region: 'Midwest',   totalPremium: 6200000,  policyCount: 2280, lossRatio: 0.561, growthRate: 0.063, topInsurer: 'Nationwide',    topProduct: 'Farm & Ranch', channelCount: 6  },
  { state: 'PA', region: 'Northeast', totalPremium: 8400000,  policyCount: 2840, lossRatio: 0.618, growthRate: 0.091, topInsurer: 'Travelers',     topProduct: 'Comm Package', channelCount: 7  },
  { state: 'WA', region: 'West',      totalPremium: 5800000,  policyCount: 1920, lossRatio: 0.582, growthRate: 0.142, topInsurer: 'Chubb',         topProduct: 'Cyber',        channelCount: 5  },
  { state: 'CO', region: 'West',      totalPremium: 4600000,  policyCount: 1640, lossRatio: 0.591, growthRate: 0.108, topInsurer: 'Travelers',     topProduct: 'Comm Package', channelCount: 5  },
  { state: 'AZ', region: 'Southwest', totalPremium: 5200000,  policyCount: 1820, lossRatio: 0.608, growthRate: 0.222, topInsurer: 'Zurich',        topProduct: 'Zurich GL',    channelCount: 4  },
  { state: 'GA', region: 'Southeast', totalPremium: 6800000,  policyCount: 2460, lossRatio: 0.628, growthRate: 0.096, topInsurer: 'Liberty Mutual',topProduct: 'LM BOP',       channelCount: 6  },
  { state: 'NC', region: 'Southeast', totalPremium: 4400000,  policyCount: 1580, lossRatio: 0.644, growthRate: 0.071, topInsurer: 'Liberty Mutual',topProduct: 'LM BOP',       channelCount: 4  },
]

export const regionSummary = REGIONS.map(r => {
  const states = statePerformance.filter(s => s.region === r)
  return {
    region: r,
    totalPremium: states.reduce((sum, s) => sum + s.totalPremium, 0),
    policyCount:  states.reduce((sum, s) => sum + s.policyCount, 0),
    avgLossRatio: states.length ? states.reduce((sum, s) => sum + s.lossRatio, 0) / states.length : 0,
    avgGrowth:    states.length ? states.reduce((sum, s) => sum + s.growthRate, 0) / states.length : 0,
    stateCount:   states.length,
  }
})

export const regionalMonthly = MONTHS.map((m, i) => ({
  month: m,
  West:      [4800, 5100, 5400, 5600, 5900, 5800, 6100, 6400, 6600, 6800, 7000, 7220][i],
  Southwest: [2200, 2350, 2480, 2600, 2720, 2680, 2820, 2950, 3040, 3100, 3180, 3270][i],
  Northeast: [3600, 3700, 3820, 3950, 4050, 3980, 4120, 4240, 4350, 4450, 4560, 4640][i],
  Southeast: [2900, 3000, 3100, 3200, 3280, 3220, 3340, 3450, 3520, 3600, 3680, 3720][i],
  Midwest:   [1800, 1860, 1920, 2000, 2060, 2020, 2090, 2150, 2200, 2260, 2310, 2340][i],
}))

// ── Channel Contribution ──────────────────────────────────────────────────────

export interface ChannelPerf {
  channelId: string
  channelName: string
  channelShort: string
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze'
  totalPremium: number
  premiumShare: number
  premiumGrowth: number
  policyCount: number
  commissionEarned: number
  avgPremium: number
  activeInsurers: number
  activeProducts: number
  lossRatio: number
  renewalRate: number
  primaryState: string
}

export const channelPerfData: ChannelPerf[] = [
  { channelId: 'c6', channelName: 'Zurich Commercial Partners', channelShort: 'Zurich Partners', tier: 'Platinum', totalPremium: 32400000, premiumShare: 0.134, premiumGrowth: 0.192, policyCount: 9800, commissionEarned: 3888000, avgPremium: 3306, activeInsurers: 4, activeProducts: 12, lossRatio: 0.572, renewalRate: 0.902, primaryState: 'TX' },
  { channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelShort: 'Pacific Coast', tier: 'Platinum', totalPremium: 28600000, premiumShare: 0.118, premiumGrowth: 0.158, policyCount: 8420, commissionEarned: 3432000, avgPremium: 3397, activeInsurers: 5, activeProducts: 14, lossRatio: 0.591, renewalRate: 0.888, primaryState: 'CA' },
  { channelId: 'c2', channelName: 'Lone Star Brokerage', channelShort: 'Lone Star', tier: 'Gold', totalPremium: 22100000, premiumShare: 0.091, premiumGrowth: 0.201, policyCount: 6840, commissionEarned: 2652000, avgPremium: 3231, activeInsurers: 4, activeProducts: 9, lossRatio: 0.584, renewalRate: 0.876, primaryState: 'TX' },
  { channelId: 'c5', channelName: 'Sunshine State Brokers', channelShort: 'Sunshine', tier: 'Gold', totalPremium: 18400000, premiumShare: 0.076, premiumGrowth: 0.084, policyCount: 7120, commissionEarned: 2208000, avgPremium: 2584, activeInsurers: 3, activeProducts: 8, lossRatio: 0.658, renewalRate: 0.852, primaryState: 'FL' },
  { channelId: 'c4', channelName: 'Empire State Insurance Services', channelShort: 'Empire State', tier: 'Gold', totalPremium: 16800000, premiumShare: 0.069, premiumGrowth: 0.121, policyCount: 4980, commissionEarned: 2016000, avgPremium: 3373, activeInsurers: 4, activeProducts: 11, lossRatio: 0.621, renewalRate: 0.869, primaryState: 'NY' },
  { channelId: 'c3', channelName: 'Great Lakes Insurance Partners', channelShort: 'Great Lakes', tier: 'Silver', totalPremium: 10200000, premiumShare: 0.042, premiumGrowth: 0.067, policyCount: 3680, commissionEarned: 1224000, avgPremium: 2772, activeInsurers: 3, activeProducts: 6, lossRatio: 0.568, renewalRate: 0.912, primaryState: 'IL' },
  { channelId: 'c7', channelName: 'Rocky Mountain Insurance Advisors', channelShort: 'Rocky Mtn', tier: 'Silver', totalPremium: 8400000, premiumShare: 0.035, premiumGrowth: 0.148, policyCount: 2840, commissionEarned: 1008000, avgPremium: 2958, activeInsurers: 3, activeProducts: 7, lossRatio: 0.582, renewalRate: 0.894, primaryState: 'CO' },
  { channelId: 'c9', channelName: 'Southwest Insurance Network', channelShort: 'SW Network', tier: 'Bronze', totalPremium: 5600000, premiumShare: 0.023, premiumGrowth: 0.241, policyCount: 1920, commissionEarned: 672000, avgPremium: 2917, activeInsurers: 2, activeProducts: 4, lossRatio: 0.601, renewalRate: 0.861, primaryState: 'AZ' },
]

export const channelMonthly = MONTHS.map((m, i) => ({
  month: m,
  'Pacific Coast': [2100, 2200, 2300, 2380, 2480, 2440, 2560, 2660, 2740, 2820, 2880, 2860][i],
  'Lone Star':     [1500, 1600, 1700, 1780, 1880, 1860, 1960, 2040, 2100, 2180, 2220, 2210][i],
  'Sunshine':      [1480, 1520, 1560, 1600, 1640, 1620, 1660, 1700, 1740, 1780, 1820, 1840][i],
  'Empire State':  [1200, 1260, 1320, 1380, 1420, 1400, 1460, 1520, 1560, 1600, 1640, 1680][i],
}))

// ── Loss Ratio ────────────────────────────────────────────────────────────────

export const lossRatioTrend = MONTHS.map((m, i) => ({
  month: m,
  Travelers:      [0.628, 0.621, 0.618, 0.614, 0.611, 0.616, 0.608, 0.604, 0.609, 0.606, 0.614, 0.612][i],
  'Liberty Mutual':[0.638, 0.641, 0.636, 0.643, 0.645, 0.639, 0.637, 0.642, 0.645, 0.638, 0.640, 0.641][i],
  Nationwide:     [0.598, 0.594, 0.589, 0.584, 0.580, 0.585, 0.579, 0.576, 0.582, 0.578, 0.580, 0.578][i],
  Chubb:          [0.558, 0.551, 0.546, 0.540, 0.536, 0.541, 0.534, 0.530, 0.527, 0.526, 0.524, 0.523][i],
  AIG:            [0.664, 0.668, 0.672, 0.678, 0.681, 0.675, 0.680, 0.684, 0.686, 0.680, 0.682, 0.682][i],
  Zurich:         [0.612, 0.608, 0.604, 0.601, 0.598, 0.602, 0.597, 0.594, 0.597, 0.595, 0.596, 0.594][i],
}))

export interface LossAlert {
  id: string
  insurerShort: string
  line: string
  state: string
  currentRatio: number
  threshold: number
  trend: 'rising' | 'stable' | 'improving'
  period: string
  note: string
  noteEn: string
  severity: 'critical' | 'warning' | 'watch'
}

export const lossAlerts: LossAlert[] = [
  { id: 'la1', insurerShort: 'AIG',           line: 'Professional', state: 'FL', currentRatio: 0.724, threshold: 0.70, trend: 'rising',    period: '2026-08', note: 'FL职业责任险赔案集中，已触发再保险报告阈值', noteEn: 'Cluster of professional liability claims in FL; reinsurance reporting threshold triggered', severity: 'critical' },
  { id: 'la2', insurerShort: 'Liberty Mutual', line: 'Auto',        state: 'TX', currentRatio: 0.712, threshold: 0.70, trend: 'rising',    period: '2026-08', note: 'TX自然灾害季节影响，车险赔付率偏高', noteEn: 'Elevated auto loss ratio driven by the TX catastrophe season', severity: 'critical' },
  { id: 'la3', insurerShort: 'AIG',           line: 'Professional', state: 'NY', currentRatio: 0.688, threshold: 0.70, trend: 'rising',    period: '2026-08', note: '趋势向上，若维持将在 2 个月内超阈值', noteEn: 'Rising trend; will breach the threshold within 2 months if sustained', severity: 'warning' },
  { id: 'la4', insurerShort: 'Liberty Mutual', line: 'Commercial',  state: 'FL', currentRatio: 0.681, threshold: 0.70, trend: 'stable',    period: '2026-08', note: '连续 3 个月高于行业均值，需关注', noteEn: 'Above industry average for 3 consecutive months; monitoring required', severity: 'warning' },
  { id: 'la5', insurerShort: 'Travelers',     line: 'Commercial',  state: 'CA', currentRatio: 0.642, threshold: 0.70, trend: 'improving', period: '2026-08', note: '较上季度下降 2.1ppt，改善明显', noteEn: 'Down 2.1ppt vs last quarter; clear improvement', severity: 'watch' },
]

export const lossRatioByLine = [
  { line: 'Commercial',    ratio: 0.591, benchmark: 0.640, policies: 28400 },
  { line: 'Auto',          ratio: 0.641, benchmark: 0.650, policies: 18200 },
  { line: 'Specialty',     ratio: 0.512, benchmark: 0.580, policies: 6200  },
  { line: 'Professional',  ratio: 0.682, benchmark: 0.670, policies: 8400  },
  { line: 'P&C',           ratio: 0.618, benchmark: 0.640, policies: 22100 },
  { line: 'Surplus Lines', ratio: 0.554, benchmark: 0.600, policies: 3800  },
]

// ── Renewal Rate ──────────────────────────────────────────────────────────────

export const renewalTrend = MONTHS.map((m, i) => ({
  month: m,
  Travelers:      [0.871, 0.874, 0.876, 0.878, 0.881, 0.879, 0.882, 0.880, 0.883, 0.882, 0.883, 0.882][i],
  'Liberty Mutual':[0.868, 0.866, 0.865, 0.867, 0.868, 0.864, 0.866, 0.865, 0.864, 0.865, 0.864, 0.864][i],
  Nationwide:     [0.884, 0.886, 0.888, 0.890, 0.892, 0.896, 0.898, 0.899, 0.900, 0.901, 0.901, 0.901][i],
  Chubb:          [0.894, 0.898, 0.902, 0.906, 0.910, 0.912, 0.914, 0.916, 0.919, 0.920, 0.921, 0.921][i],
  AIG:            [0.854, 0.849, 0.845, 0.841, 0.838, 0.836, 0.834, 0.833, 0.832, 0.831, 0.832, 0.831][i],
  Zurich:         [0.862, 0.864, 0.866, 0.868, 0.871, 0.872, 0.874, 0.875, 0.876, 0.877, 0.876, 0.876][i],
}))

export interface RenewalCohort {
  period: string
  dueCount: number
  renewedCount: number
  cancelledCount: number
  lapsedCount: number
  renewalRate: number
  avgPremiumChange: number
}

export const renewalCohorts: RenewalCohort[] = [
  { period: '2026-03', dueCount: 3200, renewedCount: 2880, cancelledCount: 192, lapsedCount: 128, renewalRate: 0.900, avgPremiumChange: 0.048 },
  { period: '2026-04', dueCount: 3480, renewedCount: 3114, cancelledCount: 228, lapsedCount: 138, renewalRate: 0.895, avgPremiumChange: 0.052 },
  { period: '2026-05', dueCount: 3820, renewedCount: 3400, cancelledCount: 268, lapsedCount: 152, renewalRate: 0.890, avgPremiumChange: 0.061 },
  { period: '2026-06', dueCount: 3640, renewedCount: 3238, cancelledCount: 256, lapsedCount: 146, renewalRate: 0.889, avgPremiumChange: 0.058 },
  { period: '2026-07', dueCount: 4100, renewedCount: 3648, cancelledCount: 300, lapsedCount: 152, renewalRate: 0.890, avgPremiumChange: 0.064 },
  { period: '2026-08', dueCount: 4380, renewedCount: 3888, cancelledCount: 328, lapsedCount: 164, renewalRate: 0.888, avgPremiumChange: 0.071 },
]

export const renewalByProduct = productPerfData.map(p => ({
  name: p.productName.length > 20 ? p.productName.slice(0, 20) + '…' : p.productName,
  rate: p.renewalRate,
  count: p.policyCount,
  insurer: p.insurerShort,
}))
