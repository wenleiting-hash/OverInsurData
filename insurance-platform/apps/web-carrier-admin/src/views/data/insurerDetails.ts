// Mock data for InsurerDetail tabs
// Enum-like label fields use stable English keys; views map them to i18n labels.
// Long free-text fields carry parallel *En fields for English rendering.

export type ProductTypeKey = 'individual' | 'group' | 'voluntary'
export type ChannelTypeKey = 'direct' | 'mga' | 'broker' | 'aggregator'
export type ChannelTierKey = 'platinum' | 'gold' | 'silver'
export type DocTypeKey = 'masterAgreement' | 'nda' | 'dpa' | 'ratingReport' | 'stateLicense' | 'commissionSupplement'
export type ContactRoleKey = 'accountManager' | 'underwriting' | 'finance' | 'itIntegration' | 'compliance'
export type ChangeSectionKey = 'basic' | 'rating' | 'settlement' | 'coop' | 'contact'

export interface Product {
  productId: string;
  insurerId: string;
  name: string;
  shortName: string;
  code: string;
  lob: string;
  subline: string;
  sublineEn: string;
  type: ProductTypeKey;
  status: 'active' | 'inactive';
  effectiveDate: string;
  premium: number;
  policyCount: number;
  lossRatio: number;
}

export const products: Product[] = [
  {
    productId: 'p1001',
    insurerId: 'c1001',
    name: 'Chubb Auto Comprehensive',
    shortName: 'AUTO Comp',
    code: 'CHAUTO001',
    lob: 'AUTO',
    subline: '个人车辆综合险',
    sublineEn: 'Personal Auto Comprehensive',
    type: 'individual',
    status: 'active',
    effectiveDate: '2024-01-01',
    premium: 128000000,
    policyCount: 14200,
    lossRatio: 0.582,
  },
  {
    productId: 'p1002',
    insurerId: 'c1001',
    name: 'Chubb Homeowners Bundle',
    shortName: 'HOME Bundle',
    code: 'CHHOME002',
    lob: 'HOME',
    subline: '房屋保险套餐',
    sublineEn: 'Homeowners Bundle',
    type: 'individual',
    status: 'active',
    effectiveDate: '2024-01-01',
    premium: 96000000,
    policyCount: 10800,
    lossRatio: 0.545,
  },
  {
    productId: 'p1003',
    insurerId: 'c1001',
    name: 'Chubb Health Plus',
    shortName: 'Health Plus',
    code: 'CHHLTH003',
    lob: 'HEALTH',
    subline: '健康保险计划',
    sublineEn: 'Health Insurance Plan',
    type: 'voluntary',
    status: 'active',
    effectiveDate: '2024-03-15',
    premium: 54000000,
    policyCount: 7600,
    lossRatio: 0.618,
  },
  {
    productId: 'p1004',
    insurerId: 'c1001',
    name: 'Chubb Cyber Liability',
    shortName: 'Cyber Liab',
    code: 'CHCYBE004',
    lob: 'CYBER',
    subline: '网络责任险',
    sublineEn: 'Cyber Liability',
    type: 'group',
    status: 'active',
    effectiveDate: '2024-06-01',
    premium: 72000000,
    policyCount: 3400,
    lossRatio: 0.492,
  },
];

export interface Channel {
  channelId: string;
  parentId?: string;
  name: string;
  shortName: string;
  npnCode: string;
  type: ChannelTypeKey;
  tier: ChannelTierKey;
  state: string;
  status: 'active' | 'pending' | 'inactive';
  agreementDate: string;
  commissionRate: number;
  totalPremium: number;
  lossRatio: number;
  renewalRate: number;
}

export const channels: Channel[] = [
  {
    channelId: 'ch001',
    name: 'Florida Auto Agency',
    shortName: 'FL Auto',
    npnCode: 'NPN20458112',
    type: 'broker',
    tier: 'gold',
    state: 'Florida',
    status: 'active',
    agreementDate: '2023-05-15',
    commissionRate: 0.15,
    totalPremium: 86400000,
    lossRatio: 0.578,
    renewalRate: 0.912,
  },
  {
    channelId: 'ch002',
    name: 'Texas MGA Solutions',
    shortName: 'TX MGA',
    npnCode: 'NPN19875330',
    type: 'mga',
    tier: 'platinum',
    state: 'Texas',
    status: 'active',
    agreementDate: '2023-08-20',
    commissionRate: 0.12,
    totalPremium: 124800000,
    lossRatio: 0.552,
    renewalRate: 0.934,
  },
  {
    channelId: 'ch003',
    name: 'New York Direct Sales',
    shortName: 'NY Direct',
    npnCode: 'NPN17320984',
    type: 'direct',
    tier: 'silver',
    state: 'New York',
    status: 'active',
    agreementDate: '2024-01-10',
    commissionRate: 0.10,
    totalPremium: 62100000,
    lossRatio: 0.604,
    renewalRate: 0.887,
  },
  {
    channelId: 'ch004',
    name: 'California Aggregator Platform',
    shortName: 'CA Aggregate',
    npnCode: 'NPN22184765',
    type: 'aggregator',
    tier: 'gold',
    state: 'California',
    status: 'active',
    agreementDate: '2024-02-28',
    commissionRate: 0.18,
    totalPremium: 93600000,
    lossRatio: 0.628,
    renewalRate: 0.858,
  },
  {
    channelId: 'ch005',
    name: 'Illinois Broker Network',
    shortName: 'IL Broker',
    npnCode: 'NPN18760239',
    type: 'broker',
    tier: 'silver',
    state: 'Illinois',
    status: 'pending',
    agreementDate: '2024-07-01',
    commissionRate: 0.14,
    totalPremium: 28500000,
    lossRatio: 0.591,
    renewalRate: 0.869,
  },
];

export interface Document {
  documentId: string;
  insurerId: string;
  name: string;
  nameEn: string;
  type: DocTypeKey;
  status: 'valid' | 'expiring' | 'expired';
  issueDate: string;
  expiryDate?: string;
  fileSize: number; // in KB
  uploadedBy: string;
}

export const documents: Document[] = [
  {
    documentId: 'd001',
    insurerId: 'c1001',
    name: '主合作协议_Travelers_2024-2027.pdf',
    nameEn: 'Master_Agreement_Travelers_2024-2027.pdf',
    type: 'masterAgreement',
    status: 'valid',
    issueDate: '2024-01-10',
    expiryDate: '2027-03-31',
    fileSize: 2458,
    uploadedBy: 'Liu Yang',
  },
  {
    documentId: 'd002',
    insurerId: 'c1001',
    name: '保密协议 (NDA)_Travelers_2024.pdf',
    nameEn: 'NDA_Travelers_2024.pdf',
    type: 'nda',
    status: 'valid',
    issueDate: '2024-01-10',
    expiryDate: '2026-12-31',
    fileSize: 820,
    uploadedBy: 'Liu Yang',
  },
  {
    documentId: 'd003',
    insurerId: 'c1001',
    name: '数据处理协议 (DPA)_Travelers_2024.pdf',
    nameEn: 'DPA_Travelers_2024.pdf',
    type: 'dpa',
    status: 'valid',
    issueDate: '2024-01-15',
    expiryDate: '2027-03-31',
    fileSize: 1126,
    uploadedBy: 'Liu Yang',
  },
  {
    documentId: 'd004',
    insurerId: 'c1001',
    name: 'AM Best 评级报告 2026Q2.pdf',
    nameEn: 'AMBest_Rating_Report_2026Q2.pdf',
    type: 'ratingReport',
    status: 'valid',
    issueDate: '2026-07-15',
    fileSize: 512,
    uploadedBy: 'Zhang Wei',
  },
  {
    documentId: 'd005',
    insurerId: 'c1001',
    name: '纽约州营业执照_Travelers_2026.pdf',
    nameEn: 'Travelers_License_NY_2026.pdf',
    type: 'stateLicense',
    status: 'expiring',
    issueDate: '2026-01-10',
    expiryDate: '2026-12-31',
    fileSize: 308,
    uploadedBy: 'Liu Yang',
  },
  {
    documentId: 'd006',
    insurerId: 'c1001',
    name: '佣金补充协议_2026.pdf',
    nameEn: 'Commission_Supplement_2026.pdf',
    type: 'commissionSupplement',
    status: 'valid',
    issueDate: '2026-05-20',
    expiryDate: '2027-03-31',
    fileSize: 718,
    uploadedBy: 'Zhang Wei',
  },
  {
    documentId: 'd007',
    insurerId: 'c1003',
    name: '主合作协议_LibertyMutual_2023-2026.pdf',
    nameEn: 'Master_Agreement_LibertyMutual_2023-2026.pdf',
    type: 'masterAgreement',
    status: 'expiring',
    issueDate: '2023-10-01',
    expiryDate: '2026-09-30',
    fileSize: 3174,
    uploadedBy: 'Liu Yang',
  },
  {
    documentId: 'd008',
    insurerId: 'c1003',
    name: '保密协议 (NDA)_LibertyMutual_2023.pdf',
    nameEn: 'NDA_LibertyMutual_2023.pdf',
    type: 'nda',
    status: 'expiring',
    issueDate: '2023-10-01',
    expiryDate: '2026-09-30',
    fileSize: 922,
    uploadedBy: 'Liu Yang',
  },
];

export interface Contact {
  contactId: string;
  insurerId: string;
  role: ContactRoleKey;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  isPrimary: boolean;
  status: 'active' | 'inactive';
}

export const contacts: Contact[] = [
  { contactId: 'ct1', insurerId: 'c1001', role: 'accountManager', name: 'Robert Galloway', title: 'Senior Account Manager', department: 'Agency Distribution', email: 'rgalloway@travelers.com', phone: '+1-212-555-0100', isPrimary: true, status: 'active' },
  { contactId: 'ct2', insurerId: 'c1001', role: 'underwriting', name: 'Jennifer Liu', title: 'Underwriting Manager', department: 'Commercial Lines Underwriting', email: 'jliu@travelers.com', phone: '+1-212-555-0101', isPrimary: true, status: 'active' },
  { contactId: 'ct3', insurerId: 'c1001', role: 'finance', name: 'Sarah Williams', title: 'Finance Coordinator', department: 'Agency Accounting', email: 'swilliams@travelers.com', phone: '+1-212-555-0042', isPrimary: true, status: 'active' },
  { contactId: 'ct4', insurerId: 'c1001', role: 'itIntegration', name: 'David Chen', title: 'API Integration Engineer', department: 'Technology', email: 'dchen@travelers.com', phone: '+1-212-555-0200', isPrimary: true, status: 'active' },
  { contactId: 'ct5', insurerId: 'c1001', role: 'compliance', name: 'Michael Torres', title: 'Compliance Officer', department: 'Legal & Compliance', email: 'mtorres@travelers.com', phone: '+1-212-555-0300', isPrimary: true, status: 'active' },
  { contactId: 'ct6', insurerId: 'c1003', role: 'accountManager', name: 'Amanda Ross', title: 'Global Account Executive', department: 'Commercial Lines', email: 'aross@libertymutual.com', phone: '+1-617-555-0001', isPrimary: true, status: 'active' },
  { contactId: 'ct7', insurerId: 'c1003', role: 'finance', name: 'Tom Bradley', title: 'Finance Manager', department: 'Finance', email: 'tbradley@libertymutual.com', phone: '+1-617-555-0002', isPrimary: true, status: 'active' },
];

export interface ChangeHistory {
  historyId: string;
  insurerId: string;
  field: string;
  section: ChangeSectionKey;
  oldValue?: string;
  newValue: string;
  operator: string;
  operatorRole: string;
  changedAt: string;
  reason: string;
  reasonEn: string;
  // 本系统没有任何审批流程。以下三个字段记录的是「保司信息变更历史」的落地情况：
  //   approvedBy / approvedAt → 使变更生效的操作人与时间（UI 文案为「处理人 / Handled by」）
  //   status: approved → 变更已生效；pending → 待生效（生效日未到）；auto → 系统自动同步写入
  approvedBy?: string;
  approvedAt?: string;
  status: 'approved' | 'pending' | 'auto';
}

export const changeHistory: ChangeHistory[] = [
  {
    historyId: 'h001',
    insurerId: 'c1001',
    field: 'AM Best Rating',
    section: 'rating',
    oldValue: 'A-',
    newValue: 'A++',
    operator: 'Liu Yang',
    operatorRole: 'Data Admin',
    changedAt: '2026-07-15 14:32',
    reason: '评级机构 AM Best 发布季度评级更新',
    reasonEn: 'AM Best published its quarterly rating update',
    approvedBy: 'Wang Fang',
    approvedAt: '2026-07-15 16:45',
    status: 'approved',
  },
  {
    historyId: 'h002',
    insurerId: 'c1001',
    field: 'Settlement Cycle',
    section: 'settlement',
    oldValue: 'Quarterly',
    newValue: 'Monthly',
    operator: 'Zhang Wei',
    operatorRole: 'Finance Manager',
    changedAt: '2026-05-20 09:18',
    reason: '双方协商变更为月结，邮件确认附件已上传',
    reasonEn: 'Settlement changed to monthly by mutual agreement; confirmation email attached',
    approvedBy: 'Chen Hao',
    approvedAt: '2026-05-21 10:30',
    status: 'approved',
  },
  {
    historyId: 'h003',
    insurerId: 'c1001',
    field: 'Contact Email',
    section: 'contact',
    oldValue: 'old@company.com',
    newValue: 'rgalloway@travelers.com',
    operator: 'Robert Taylor',
    operatorRole: 'Data Admin',
    changedAt: '2025-09-02 14:10',
    reason: '对接人离职，新对接人已确认',
    reasonEn: 'Previous contact departed; new contact confirmed',
    approvedBy: 'Wang Fang',
    approvedAt: '2025-09-03 09:30',
    status: 'approved',
  },
  {
    historyId: 'h004',
    insurerId: 'c1001',
    field: 'Billing Format',
    section: 'settlement',
    oldValue: 'Excel',
    newValue: 'API',
    operator: 'Zhang Wei',
    operatorRole: 'Tech Manager',
    changedAt: '2025-06-10 09:00',
    reason: 'Travelers 完成 API 对接，切换至自动拉取模式',
    reasonEn: 'Travelers completed API integration; switched to auto-pull mode',
    approvedBy: 'Chen Hao',
    approvedAt: '2025-06-10 15:00',
    status: 'approved',
  },
  {
    historyId: 'h005',
    insurerId: 'c1001',
    field: 'Website',
    section: 'basic',
    oldValue: 'www.travelers.com/old',
    newValue: 'www.travelers.com',
    operator: 'System',
    operatorRole: 'Automated',
    changedAt: '2025-11-15 10:42',
    reason: '保险公司官网地址更新',
    reasonEn: 'Carrier website URL updated',
    status: 'auto',
  },
  {
    historyId: 'h006',
    insurerId: 'c1003',
    field: 'Cooperation Status',
    section: 'coop',
    oldValue: 'Active',
    newValue: 'Expiring',
    operator: 'System',
    operatorRole: 'Automated',
    changedAt: '2026-08-01 00:00',
    reason: '系统自动检测：合同将于 60 天内到期',
    reasonEn: 'Automated detection: contract expires within 60 days',
    status: 'auto',
  },
  {
    historyId: 'h007',
    insurerId: 'c1003',
    field: 'AM Best Rating',
    section: 'rating',
    oldValue: 'A+',
    newValue: 'A',
    operator: 'Liu Yang',
    operatorRole: 'Data Admin',
    changedAt: '2025-12-15 11:20',
    reason: 'AM Best 年度评级调整',
    reasonEn: 'Annual AM Best rating adjustment',
    approvedBy: 'Wang Fang',
    approvedAt: '2025-12-16 09:00',
    status: 'approved',
  },
  {
    historyId: 'h008',
    insurerId: 'c1002',
    field: 'Region',
    section: 'basic',
    oldValue: 'Southeast',
    newValue: 'National',
    operator: 'Liu Yang',
    operatorRole: 'Data Admin',
    changedAt: '2025-08-20 14:00',
    reason: '总部区域分类调整，业务范围扩展至全国',
    reasonEn: 'HQ region reclassified; business scope expanded nationwide',
    approvedBy: 'Wang Fang',
    approvedAt: '2025-08-20 16:30',
    status: 'approved',
  },
];
