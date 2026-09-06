// Mock data for insurer module (Phase 0: Insurer List and Basic Management)

export interface Insurer {
  id: string;
  name: string;
  code: string;
  type: 'life' | 'property' | 'health' | 'reinsurance';
  status: 'active' | 'inactive';
  establishedDate: string;
  headquarter: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
}

/** 加载 Mock 保险公司列表（供合作管理等模块使用的统一形状） */
export function loadMockCarriers(): Array<{ carrierId: string; carrierName: string; carrierCode: string }> {
  return mockInsurers.map(i => ({
    carrierId: i.id,
    carrierName: i.name,
    carrierCode: i.code,
  }));
}

export const mockInsurers: Insurer[] = [
  {
    id: 'insurer-001',
    name: '平安人寿保险',
    code: 'PICC-LIFE',
    type: 'life',
    status: 'active',
    establishedDate: '1996-08-26',
    headquarter: '深圳市',
    contactInfo: {
      email: 'contact@pingan.com',
      phone: '400-****-****',
      address: '深圳市福田区益田路 5033 号平安金融中心',
    },
  },
];
