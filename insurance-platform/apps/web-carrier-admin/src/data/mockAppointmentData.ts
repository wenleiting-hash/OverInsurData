// Mock data for appointment module (placeholder for Phase 2 features)

export interface AppointmentApplication {
  id: string;
  applicationNumber: string;
  applicantName: string;
  applicantType: 'individual' | 'enterprise';
  contactInfo: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'under-review';
  submittedAt: string;
  reviewer?: string;
}

export const mockAppointmentApplications: AppointmentApplication[] = [
  {
    id: '1',
    applicationNumber: 'APT-2026-001',
    applicantName: '张三保险代理公司',
    applicantType: 'enterprise',
    contactInfo: '138****5678',
    status: 'pending',
    submittedAt: '2026-08-30T10:00:00Z',
  },
];

export const generateMockApplications = () => mockAppointmentApplications;

export interface AppointmentAuthorization {
  id: string;
  authorizationNumber: string;
  agentName: string;
  productId: string;
  effectiveDate: string;
  expiryDate: string;
  status: 'active' | 'pending' | 'expired' | 'revoked';
}

export interface RenewalRequest {
  id: string;
  applicationId: string;
  requestedDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type AuthorizationStatus = 'authorized' | 'pending' | 'expired' | 'suspended';

export interface ApplicationStatus {
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'issued';
  timestamp: string;
  notes?: string;
}

export const generateMockAuthorizations = (): AppointmentAuthorization[] => [
  {
    id: '1',
    authorizationNumber: 'AUTH-2026-001',
    agentName: '李四保险代理',
    productId: 'prod-001',
    effectiveDate: '2026-01-01',
    expiryDate: '2027-12-31',
    status: 'active',
  },
];

export interface ComplianceInterceptorRule {
  id: string;
  ruleName: string;
  ruleType: 'frequency_limit' | 'document_required' | 'age_restriction';
  isActive: boolean;
}

export const mockComplianceRules: ComplianceInterceptorRule[] = [
  {
    id: '1',
    ruleName: '每日投保次数限制',
    ruleType: 'frequency_limit',
    isActive: true,
  },
];

export const generateMockInterceptions = () => [];
export const generateMockOFACScreenings = () => [];
