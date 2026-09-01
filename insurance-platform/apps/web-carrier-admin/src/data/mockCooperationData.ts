// Mock data for cooperation module (Phase 0: Insurer Cooperation Management)

export interface Contract {
  id: string;
  contractNumber: string;
  insurerId: string;
  insurerName: string;
  contractType: 'distribution' | 'agency' | 'brokerage';
  effectiveDate: string;
  expiryDate: string;
  status: 'active' | 'pending' | 'expired' | 'terminated';
}

export const mockContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'CTR-2026-001',
    insurerId: 'insurer-001',
    insurerName: '平安人寿保险',
    contractType: 'distribution',
    effectiveDate: '2026-01-01',
    expiryDate: '2027-12-31',
    status: 'active',
  },
];

export interface CooperationLifecycle {
  id: string;
  phase: 'initial_contact' | 'negotiation' | 'contract_signing' | 'onboarding' | 'active' | 'churned';
  insurerId: string;
  insurerName: string;
  startDate: string;
  endDate?: string;
  responsiblePerson: string;
}

export const mockCooperationLifeCycle: CooperationLifecycle[] = [
  {
    id: '1',
    phase: 'active',
    insurerId: 'insurer-001',
    insurerName: '平安人寿保险',
    startDate: '2026-01-01',
    responsiblePerson: '张三渠道经理',
  },
];

export interface ContactPerson {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  insurerId: string;
  isPrimary: boolean;
}

export const mockContactPersons: ContactPerson[] = [
  {
    id: '1',
    name: '李四',
    position: '业务总监',
    email: 'lisi@pingan.com',
    phone: '138****5678',
    insurerId: 'insurer-001',
    isPrimary: true,
  },
];
