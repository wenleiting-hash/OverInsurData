// 🔴 todo: replace with real API later
// 🔴 todo: add TypeScript interfaces in @/types/channel later

export const mockChannels: any[] = [
  {
    id: 'ch1',
    name: '太平洋保险代理公司',
    code: 'TG_AGENT_001',
    type: 'Agent' as const,
    status: 'active' as const,
    email: 'agent@tg-insurance.com',
    phone: '+1-555-0123',
    address: '北京市朝阳区建国路 88 号',
    licenseNumber: 'LIC-2024-001',
    licenseExpiry: '2026-12-31',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'ch2',
    name: '华泰再保险公司',
    code: 'HT_REINS',
    type: 'MGA' as const,
    status: 'active' as const,
    email: 'contact@huatai-re.com',
    phone: '+1-555-0456',
    address: '上海市浦东新区世纪大道 100 号',
    licenseNumber: 'LIC-2024-002',
    licenseExpiry: '2027-06-30',
    createdAt: '2024-02-20T00:00:00Z',
  },
];
