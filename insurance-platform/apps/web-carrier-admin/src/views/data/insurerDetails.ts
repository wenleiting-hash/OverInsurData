// Mock data for InsurerDetail tabs

export interface Product {
  productId: string;
  insurerId: string;
  name: string;
  shortName: string;
  code: string;
  lob: string;
  subline: string;
  type: '个人险' | '团体险' | '自愿福利险';
  status: 'active' | 'inactive';
  effectiveDate: string;
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
    type: '个人险',
    status: 'active',
    effectiveDate: '2024-01-01',
  },
  {
    productId: 'p1002',
    insurerId: 'c1001',
    name: 'Chubb Homeowners Bundle',
    shortName: 'HOME Bundle',
    code: 'CHHOME002',
    lob: 'HOME',
    subline: '房屋保险套餐',
    type: '个人险',
    status: 'active',
    effectiveDate: '2024-01-01',
  },
  {
    productId: 'p1003',
    insurerId: 'c1001',
    name: 'Chubb Health Plus',
    shortName: 'Health Plus',
    code: 'CHHLTH003',
    lob: 'HEALTH',
    subline: '健康保险计划',
    type: '自愿福利险',
    status: 'active',
    effectiveDate: '2024-03-15',
  },
  {
    productId: 'p1004',
    insurerId: 'c1001',
    name: 'Chubb Cyber Liability',
    shortName: 'Cyber Liab',
    code: 'CHCYBE004',
    lob: 'CYBER',
    subline: '网络责任险',
    type: '团体险',
    status: 'active',
    effectiveDate: '2024-06-01',
  },
];

export interface Channel {
  channelId: string;
  parentId?: string;
  name: string;
  shortName: string;
  type: '直销' | 'MGA' | 'Broker' | 'Aggregator';
  state: string;
  status: 'active' | 'pending' | 'inactive';
  agreementDate: string;
  commissionRate: number;
}

export const channels: Channel[] = [
  {
    channelId: 'ch001',
    name: 'Florida Auto Agency',
    shortName: 'FL Auto',
    type: 'Broker',
    state: 'Florida',
    status: 'active',
    agreementDate: '2023-05-15',
    commissionRate: 0.15,
  },
  {
    channelId: 'ch002',
    name: 'Texas MGA Solutions',
    shortName: 'TX MGA',
    type: 'MGA',
    state: 'Texas',
    status: 'active',
    agreementDate: '2023-08-20',
    commissionRate: 0.12,
  },
  {
    channelId: 'ch003',
    name: 'New York Direct Sales',
    shortName: 'NY Direct',
    type: '直销',
    state: 'New York',
    status: 'active',
    agreementDate: '2024-01-10',
    commissionRate: 0.10,
  },
  {
    channelId: 'ch004',
    name: 'California Aggregator Platform',
    shortName: 'CA Aggregate',
    type: 'Aggregator',
    state: 'California',
    status: 'active',
    agreementDate: '2024-02-28',
    commissionRate: 0.18,
  },
  {
    channelId: 'ch005',
    name: 'Illinois Broker Network',
    shortName: 'IL Broker',
    type: 'Broker',
    state: 'Illinois',
    status: 'pending',
    agreementDate: '2024-07-01',
    commissionRate: 0.14,
  },
];

export interface Document {
  documentId: string;
  insurerId: string;
  name: string;
  type: string;
  status: 'valid' | 'expiring' | 'expired';
  issueDate: string;
  expiryDate: string;
  fileSize: number; // in KB
}

export const documents: Document[] = [
  {
    documentId: 'd001',
    insurerId: 'c1001',
    name: '主合作协议',
    type: '主合作协议',
    status: 'valid',
    issueDate: '2023-01-01',
    expiryDate: '2026-12-31',
    fileSize: 2048,
  },
  {
    documentId: 'd002',
    insurerId: 'c1001',
    name: '保密协议 (NDA)',
    type: '保密协议 (NDA)',
    status: 'valid',
    issueDate: '2023-01-01',
    expiryDate: '2025-12-31',
    fileSize: 512,
  },
  {
    documentId: 'd003',
    insurerId: 'c1001',
    name: '数据处理协议 (DPA)',
    type: '数据处理协议 (DPA)',
    status: 'expiring',
    issueDate: '2023-03-15',
    expiryDate: '2024-12-31',
    fileSize: 1024,
  },
  {
    documentId: 'd004',
    insurerId: 'c1001',
    name: 'AM Best 评级报告 2024',
    type: '评级报告',
    status: 'valid',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    fileSize: 4096,
  },
  {
    documentId: 'd005',
    insurerId: 'c1001',
    name: '纽约州营业执照',
    type: '州营业执照',
    status: 'valid',
    issueDate: '2022-06-01',
    expiryDate: '2027-06-01',
    fileSize: 1536,
  },
  {
    documentId: 'd006',
    insurerId: 'c1001',
    name: '佣金补充协议 Q3',
    type: '佣金补充协议',
    status: 'valid',
    issueDate: '2024-07-01',
    expiryDate: '2024-09-30',
    fileSize: 768,
  },
];

export interface ChangeHistory {
  historyId: string;
  insurerId: string;
  field: string;
  oldValue?: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export const changeHistory: ChangeHistory[] = [
  {
    historyId: 'h001',
    insurerId: 'c1001',
    field: 'AM Best Rating',
    oldValue: 'A+',
    newValue: 'A++',
    changedBy: 'Jane Williams',
    changedAt: '2024-01-15T10:30:00Z',
  },
  {
    historyId: 'h002',
    insurerId: 'c1001',
    field: 'Commission Rate',
    oldValue: '0.12',
    newValue: '0.15',
    changedBy: 'System',
    changedAt: '2024-02-01T08:00:00Z',
  },
  {
    historyId: 'h003',
    insurerId: 'c1001',
    field: 'Contact Email',
    oldValue: 'old@company.com',
    newValue: 'john.smith@company.com',
    changedBy: 'Robert Taylor',
    changedAt: '2024-03-10T14:20:00Z',
  },
];
