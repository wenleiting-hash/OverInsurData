// Master data for insurance carriers (Phase 0: Insurer List and Basic Management)

import type { InsuranceCarrier } from '@/types/carrier';

export const insurerMasterData: InsuranceCarrier[] = [
  {
    carrierId: 'C001',
    carrierName: '平安人寿保险集团',
    shortName: '平安人寿',
    naicCode: '12345',
    type: 'Admitted',
    rating: 'A++' as const,
    status: 'active',
    region: '华南区',
    naicsDescription: '人寿与健康保险公司',
    contactInfo: {
      address: '深圳市福田区益田路 5033 号平安金融中心',
      phone: '400-****-****',
      email: 'contact@pingan.com',
    },
    settlementConfig: {
      currency: 'CNY',
      paymentTermDays: 30,
      settlementCycle: 'Monthly',
    },
    revenue: 15000000,
    policyCount: 8500,
    lossRatio: 0.62,
    renewalRate: 0.78,
  },
];

export default insurerMasterData;
