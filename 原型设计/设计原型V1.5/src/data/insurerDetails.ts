export interface ChangeRecord {
  id: string
  insurerId: string
  field: string
  section: string
  oldValue: string
  newValue: string
  operator: string
  operatorRole: string
  timestamp: string
  reason: string
  approvedBy?: string
  approvedAt?: string
  status: 'approved' | 'pending' | 'auto'
}

export interface InsurerDocument {
  id: string
  insurerId: string
  name: string
  type: string
  size: string
  uploadedAt: string
  uploadedBy: string
  status: 'valid' | 'expiring' | 'expired'
  expiry?: string
  url?: string
}

export interface InsurerContact {
  id: string
  insurerId: string
  role: string
  name: string
  title: string
  department: string
  email: string
  phone: string
  isPrimary: boolean
  status: 'active' | 'inactive'
}

export interface DuplicateGroup {
  id: string
  similarity: number
  matchFields: string[]
  records: DuplicateRecord[]
}

export interface DuplicateRecord {
  id: string
  name: string
  shortName: string
  naicCode: string
  type: string
  headquarters: string
  status: string
  createdAt: string
  createdBy: string
}

export const changeHistory: ChangeRecord[] = [
  { id: 'ch1', insurerId: '1', field: 'AM Best Rating', section: '财务评级', oldValue: 'A-', newValue: 'A', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2026-07-15 14:32:10', reason: '评级机构 AM Best 发布季度评级更新', approvedBy: 'Wang Fang', approvedAt: '2026-07-15 16:45:00', status: 'approved' },
  { id: 'ch2', insurerId: '1', field: 'Settlement Cycle', section: '结算信息', oldValue: 'Quarterly', newValue: 'Monthly', operator: 'Zhang Wei', operatorRole: 'Finance Manager', timestamp: '2026-05-20 09:18:44', reason: '双方协商变更为月结，邮件确认附件已上传', approvedBy: 'Chen Hao', approvedAt: '2026-05-21 10:30:00', status: 'approved' },
  { id: 'ch3', insurerId: '1', field: 'Contract Expiry', section: '合作管理', oldValue: '2026-06-30', newValue: '2027-03-31', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2026-04-01 11:05:22', reason: '完成续签，合同有效期延长至 2027-03-31', approvedBy: 'Wang Fang', approvedAt: '2026-04-01 14:20:00', status: 'approved' },
  { id: 'ch4', insurerId: '1', field: 'S&P Rating', section: '财务评级', oldValue: 'A-', newValue: 'AA-', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2026-01-10 16:00:55', reason: 'Standard & Poors 上调评级', approvedBy: 'Wang Fang', approvedAt: '2026-01-11 09:00:00', status: 'approved' },
  { id: 'ch5', insurerId: '1', field: 'Website', section: '基本信息', oldValue: 'www.travelers.com/old', newValue: 'www.travelers.com', operator: 'Zhang Wei', operatorRole: 'Operations', timestamp: '2025-11-15 10:42:33', reason: '保险公司官网地址更新', status: 'auto' },
  { id: 'ch6', insurerId: '1', field: 'Primary Contact - Finance', section: '对接人', oldValue: 'Mark Johnson (+1-212-555-0001)', newValue: 'Sarah Williams (+1-212-555-0042)', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2025-09-02 14:10:18', reason: '对接人离职，新对接人已确认', approvedBy: 'Wang Fang', approvedAt: '2025-09-03 09:30:00', status: 'approved' },
  { id: 'ch7', insurerId: '1', field: 'Billing Format', section: '结算信息', oldValue: 'Excel', newValue: 'API', operator: 'Zhang Wei', operatorRole: 'Tech Manager', timestamp: '2025-06-10 09:00:00', reason: 'Travelers 完成 API 对接，切换至自动拉取模式', approvedBy: 'Chen Hao', approvedAt: '2025-06-10 15:00:00', status: 'approved' },

  { id: 'ch8', insurerId: '5', field: 'Cooperation Status', section: '合作管理', oldValue: 'Active', newValue: 'Expiring', operator: 'System', operatorRole: 'Automated', timestamp: '2026-08-01 00:00:00', reason: '系统自动检测：合同将于 60 天内到期', status: 'auto' },
  { id: 'ch9', insurerId: '5', field: 'AM Best Rating', section: '财务评级', oldValue: 'A+', newValue: 'A', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2025-12-15 11:20:00', reason: 'AM Best 年度评级调整', approvedBy: 'Wang Fang', approvedAt: '2025-12-16 09:00:00', status: 'approved' },

  { id: 'ch10', insurerId: '2', field: 'Region', section: '基本信息', oldValue: 'Southeast', newValue: 'Northeast', operator: 'Liu Yang', operatorRole: 'Data Admin', timestamp: '2025-08-20 14:00:00', reason: '总部区域分类调整，Boston 归属 Northeast 大区', approvedBy: 'Wang Fang', approvedAt: '2025-08-20 16:30:00', status: 'approved' },
]

export const documents: InsurerDocument[] = [
  { id: 'd1', insurerId: '1', name: '主合作协议_Travelers_2024-2027.pdf', type: '主合作协议', size: '2.4 MB', uploadedAt: '2024-01-10', uploadedBy: 'Liu Yang', status: 'valid', expiry: '2027-03-31' },
  { id: 'd2', insurerId: '1', name: 'NDA_Travelers_2024.pdf', type: '保密协议 (NDA)', size: '0.8 MB', uploadedAt: '2024-01-10', uploadedBy: 'Liu Yang', status: 'valid', expiry: '2026-12-31' },
  { id: 'd3', insurerId: '1', name: 'DPA_Travelers_2024.pdf', type: '数据处理协议 (DPA)', size: '1.1 MB', uploadedAt: '2024-01-15', uploadedBy: 'Liu Yang', status: 'valid', expiry: '2027-03-31' },
  { id: 'd4', insurerId: '1', name: 'AMBest_Rating_Report_2026Q2.pdf', type: '评级报告', size: '0.5 MB', uploadedAt: '2026-07-15', uploadedBy: 'Zhang Wei', status: 'valid' },
  { id: 'd5', insurerId: '1', name: 'Travelers_License_NY_2026.pdf', type: '州营业执照', size: '0.3 MB', uploadedAt: '2026-01-10', uploadedBy: 'Liu Yang', status: 'expiring', expiry: '2026-12-31' },
  { id: 'd6', insurerId: '1', name: '佣金补充协议_2026.pdf', type: '佣金补充协议', size: '0.7 MB', uploadedAt: '2026-05-20', uploadedBy: 'Zhang Wei', status: 'valid', expiry: '2027-03-31' },

  { id: 'd7', insurerId: '5', name: '主合作协议_AIG_2023-2026.pdf', type: '主合作协议', size: '3.1 MB', uploadedAt: '2023-10-01', uploadedBy: 'Liu Yang', status: 'expiring', expiry: '2026-09-30' },
  { id: 'd8', insurerId: '5', name: 'NDA_AIG_2023.pdf', type: '保密协议 (NDA)', size: '0.9 MB', uploadedAt: '2023-10-01', uploadedBy: 'Liu Yang', status: 'expiring', expiry: '2026-09-30' },
]

export const contacts: InsurerContact[] = [
  { id: 'ct1', insurerId: '1', role: '客户经理', name: 'Robert Galloway', title: 'Senior Account Manager', department: 'Agency Distribution', email: 'rgalloway@travelers.com', phone: '+1-212-555-0100', isPrimary: true, status: 'active' },
  { id: 'ct2', insurerId: '1', role: '核保联系人', name: 'Jennifer Liu', title: 'Underwriting Manager', department: 'Commercial Lines Underwriting', email: 'jliu@travelers.com', phone: '+1-212-555-0101', isPrimary: true, status: 'active' },
  { id: 'ct3', insurerId: '1', role: '结算财务联系人', name: 'Sarah Williams', title: 'Finance Coordinator', department: 'Agency Accounting', email: 'swilliams@travelers.com', phone: '+1-212-555-0042', isPrimary: true, status: 'active' },
  { id: 'ct4', insurerId: '1', role: 'IT技术对接人', name: 'David Chen', title: 'API Integration Engineer', department: 'Technology', email: 'dchen@travelers.com', phone: '+1-212-555-0200', isPrimary: true, status: 'active' },
  { id: 'ct5', insurerId: '1', role: '合规联系人', name: 'Michael Torres', title: 'Compliance Officer', department: 'Legal & Compliance', email: 'mtorres@travelers.com', phone: '+1-212-555-0300', isPrimary: true, status: 'active' },

  { id: 'ct6', insurerId: '5', role: '客户经理', name: 'Amanda Ross', title: 'Global Account Executive', department: 'Commercial Lines', email: 'aross@aig.com', phone: '+1-212-770-0001', isPrimary: true, status: 'active' },
  { id: 'ct7', insurerId: '5', role: '结算财务联系人', name: 'Tom Bradley', title: 'Finance Manager', department: 'Finance', email: 'tbradley@aig.com', phone: '+1-212-770-0002', isPrimary: true, status: 'active' },
]

export const duplicateGroups: DuplicateGroup[] = [
  {
    id: 'dg1',
    similarity: 0.96,
    matchFields: ['公司名称（模糊匹配）', 'NAIC编码部分匹配', '总部州一致'],
    records: [
      { id: 'dup1', name: 'American International Group, Inc.', shortName: 'AIG', naicCode: '19402', type: 'Non-Admitted', headquarters: 'New York, NY', status: 'active', createdAt: '2022-03-15', createdBy: 'Liu Yang' },
      { id: 'dup2', name: 'AIG Insurance Company', shortName: 'AIG Insurance', naicCode: '19403', type: 'Non-Admitted', headquarters: 'New York, NY', status: 'pending', createdAt: '2026-08-10', createdBy: 'Zhang Wei' },
    ],
  },
  {
    id: 'dg2',
    similarity: 0.88,
    matchFields: ['公司名称高度相似', '总部城市一致'],
    records: [
      { id: 'dup3', name: 'The Hartford Financial Services Group', shortName: 'Hartford', naicCode: '29424', type: 'Admitted', headquarters: 'Hartford, CT', status: 'active', createdAt: '2021-06-01', createdBy: 'Wang Fang' },
      { id: 'dup4', name: 'Hartford Life Insurance Company', shortName: 'Hartford Life', naicCode: '29432', type: 'Admitted', headquarters: 'Hartford, CT', status: 'pending', createdAt: '2026-07-22', createdBy: 'Liu Yang' },
    ],
  },
  {
    id: 'dg3',
    similarity: 0.82,
    matchFields: ['公司简称相同', 'NAIC编码格式匹配'],
    records: [
      { id: 'dup5', name: 'Nationwide Mutual Insurance Company', shortName: 'Nationwide', naicCode: '23787', type: 'Admitted', headquarters: 'Columbus, OH', status: 'active', createdAt: '2020-01-10', createdBy: 'Wang Fang' },
      { id: 'dup6', name: 'Nationwide Property & Casualty Insurance', shortName: 'Nationwide P&C', naicCode: '23788', type: 'Admitted', headquarters: 'Columbus, OH', status: 'pending', createdAt: '2026-08-18', createdBy: 'Chen Hao' },
    ],
  },
]

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]

export const AM_BEST_RATINGS = ['A++','A+','A','A-','B++','B+','B','B-','C++','C+','C','C-','D','E','F','S','NR']
export const SP_RATINGS = ['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','NR']
