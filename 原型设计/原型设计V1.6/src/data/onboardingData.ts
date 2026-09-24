// ── Onboarding Types ──────────────────────────────────────────────────────────

export type OnboardingStatus =
  | 'draft' | 'submitted' | 'under-review' | 'nipr-pending' | 'bg-check'
  | 'eo-pending' | 'contract-pending' | 'appointment-pending' | 'account-setup'
  | 'training' | 'approved' | 'rejected' | 'pending-supplement'

export type ChannelType = 'agency' | 'branch' | 'agent' | 'ga'
export type ReviewResult = 'pass' | 'fail' | 'pending' | 'waived'

export interface OnboardingApp {
  id: string
  applicantName: string
  applicantType: ChannelType
  email: string
  phone: string
  state: string
  npn?: string
  businessName?: string
  submittedDate: string
  lastUpdated: string
  status: OnboardingStatus
  assignedReviewer?: string
  parentChannelId?: string
  parentChannelName?: string
  currentStep: number           // 1–11 pipeline step
  steps: OnboardingStep[]
  rejectionReason?: string
  supplementDue?: string
}

export interface OnboardingStep {
  id: string
  name: string
  status: 'pending' | 'in-progress' | 'passed' | 'failed' | 'waived' | 'waiting'
  completedDate?: string
  notes?: string
  actionRequired?: string
}

export interface DocumentReview {
  appId: string
  docs: ReviewDoc[]
  reviewerId?: string
  reviewStarted?: string
}

export interface ReviewDoc {
  id: string
  name: string
  docType: 'license' | 'eo-cert' | 'bg-auth' | 'id' | 'w9' | 'contract' | 'training' | 'other'
  uploadedDate: string
  fileSize: string
  status: ReviewResult
  reviewNote?: string
  expiryDate?: string
}

export interface NIPRVerification {
  appId: string
  npn: string
  applicantName: string
  state: string
  licenseNumber?: string
  licenseClass?: string
  issueDate?: string
  expiryDate?: string
  status: ReviewResult
  verifiedDate?: string
  rawResponse?: string
  linesOfAuthority?: string[]
}

export interface BackgroundCheck {
  appId: string
  applicantName: string
  vendor: 'Sterling' | 'Checkr' | 'HireRight'
  orderedDate: string
  completedDate?: string
  status: ReviewResult
  flags: BgFlag[]
  reportUrl?: string
}

export interface BgFlag {
  type: 'criminal' | 'civil' | 'regulatory' | 'credit' | 'employment'
  severity: 'low' | 'medium' | 'high'
  description: string
  disposition: 'clear' | 'review' | 'disqualify'
}

export interface EOInsurance {
  appId: string
  applicantName: string
  carrier: string
  policyNumber: string
  effectiveDate: string
  expiryDate: string
  coverageAmount: number
  perClaimAmount: number
  status: ReviewResult
  verifiedDate?: string
  note?: string
}

export interface EContract {
  appId: string
  applicantName: string
  contractType: 'producer-agreement' | 'ga-agreement' | 'sub-producer' | 'branch-appointment'
  templateVersion: string
  sentDate?: string
  signedDate?: string
  status: 'not-sent' | 'sent' | 'viewed' | 'signed' | 'expired' | 'declined'
  signerEmail: string
  signingProvider: 'DocuSign' | 'HelloSign' | 'Adobe Sign'
  expiresAt?: string
}

export interface TrainingCert {
  appId: string
  applicantName: string
  modules: TrainingModule[]
  overallStatus: ReviewResult
  completionDate?: string
  certUrl?: string
}

export interface TrainingModule {
  id: string
  name: string
  required: boolean
  duration: string
  status: 'not-started' | 'in-progress' | 'completed' | 'failed'
  score?: number
  completedDate?: string
  attempts: number
}

export interface AccountSetup {
  appId: string
  applicantName: string
  username?: string
  email: string
  role: string
  permissions: string[]
  status: 'not-started' | 'creating' | 'active' | 'hold'
  createdDate?: string
  activatedDate?: string
  tempPasswordSent: boolean
}

// ── Step Pipeline Definition ──────────────────────────────────────────────────

export const PIPELINE_STEPS = [
  { id: 'apply',       label: '在线申请',     icon: '📝' },
  { id: 'doc-review',  label: '资料审核',     icon: '📋' },
  { id: 'nipr',        label: 'NIPR验证',    icon: '🔍' },
  { id: 'bg-check',    label: '背景调查',     icon: '🔎' },
  { id: 'eo-check',    label: 'E&O验证',     icon: '🛡' },
  { id: 'contract',    label: '合同签署',     icon: '✍️' },
  { id: 'appointment', label: 'Appointment', icon: '📌' },
  { id: 'account',     label: '账号开通',     icon: '🔑' },
  { id: 'training',    label: '培训认证',     icon: '🎓' },
  { id: 'final',       label: '最终审批',     icon: '✅' },
]

// ── Label / Style Maps ────────────────────────────────────────────────────────

export const STATUS_STYLE: Record<OnboardingStatus, { label: string; bg: string; color: string }> = {
  'draft':              { label: '草稿',     bg: 'rgba(180,180,180,0.15)', color: '#717786' },
  'submitted':          { label: '已提交',   bg: 'rgba(0,88,188,0.10)',   color: '#0058BC' },
  'under-review':       { label: '审核中',   bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
  'nipr-pending':       { label: 'NIPR验证', bg: 'rgba(0,88,188,0.10)',   color: '#0058BC' },
  'bg-check':           { label: '背景调查', bg: 'rgba(123,63,202,0.12)', color: '#7B3FCA' },
  'eo-pending':         { label: 'E&O验证',  bg: 'rgba(123,63,202,0.12)', color: '#7B3FCA' },
  'contract-pending':   { label: '待签约',   bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
  'appointment-pending':{ label: 'Appt待办', bg: 'rgba(0,88,188,0.10)',   color: '#0058BC' },
  'account-setup':      { label: '账号设置', bg: 'rgba(0,88,188,0.10)',   color: '#0058BC' },
  'training':           { label: '培训中',   bg: 'rgba(255,159,10,0.12)', color: '#B06000' },
  'approved':           { label: '已入驻',   bg: 'rgba(52,199,89,0.12)',  color: '#1E8033' },
  'rejected':           { label: '已驳回',   bg: 'rgba(255,59,48,0.12)',  color: '#C0392B' },
  'pending-supplement': { label: '待补充',   bg: 'rgba(255,59,48,0.10)',  color: '#C0392B' },
}

export const CHANNEL_TYPE_LABEL: Record<ChannelType, string> = {
  agency: '代理机构', branch: '分支机构', agent: '个人代理', ga: 'GA',
}

export const REVIEW_RESULT_STYLE: Record<ReviewResult, { label: string; bg: string; color: string }> = {
  pass:    { label: '通过', bg: 'rgba(52,199,89,0.1)',  color: '#1E8033' },
  fail:    { label: '不通过', bg: 'rgba(255,59,48,0.1)', color: '#C0392B' },
  pending: { label: '待审核', bg: 'rgba(255,159,10,0.1)', color: '#B06000' },
  waived:  { label: '豁免', bg: 'rgba(180,180,180,0.15)', color: '#717786' },
}

// ── Sample Data ───────────────────────────────────────────────────────────────

const makeSteps = (upTo: number): OnboardingStep[] => PIPELINE_STEPS.map((s, i) => ({
  id: s.id,
  name: s.label,
  status: i < upTo ? 'passed' : i === upTo ? 'in-progress' : 'pending',
}))

export const onboardingApps: OnboardingApp[] = [
  {
    id: 'ob-001', applicantName: 'Jennifer Walsh', applicantType: 'agent',
    email: 'jwalsh@email.com', phone: '+1-310-555-0101', state: 'CA',
    npn: 'NPN99001122', businessName: undefined,
    submittedDate: '2026-08-10', lastUpdated: '2026-08-20',
    status: 'training', assignedReviewer: 'Zhang Wei',
    parentChannelId: 'c1', parentChannelName: 'Pacific Coast Insurance Group',
    currentStep: 8,
    steps: [
      { id: 'apply', name: '在线申请', status: 'passed', completedDate: '2026-08-10' },
      { id: 'doc-review', name: '资料审核', status: 'passed', completedDate: '2026-08-12' },
      { id: 'nipr', name: 'NIPR验证', status: 'passed', completedDate: '2026-08-13' },
      { id: 'bg-check', name: '背景调查', status: 'passed', completedDate: '2026-08-15' },
      { id: 'eo-check', name: 'E&O验证', status: 'passed', completedDate: '2026-08-16' },
      { id: 'contract', name: '合同签署', status: 'passed', completedDate: '2026-08-17' },
      { id: 'appointment', name: 'Appointment', status: 'passed', completedDate: '2026-08-18' },
      { id: 'account', name: '账号开通', status: 'passed', completedDate: '2026-08-19' },
      { id: 'training', name: '培训认证', status: 'in-progress' },
      { id: 'final', name: '最终审批', status: 'pending' },
    ],
  },
  {
    id: 'ob-002', applicantName: 'Coastal Pacific Advisors LLC', applicantType: 'agency',
    email: 'info@coastalpacific.com', phone: '+1-415-555-0202', state: 'CA',
    npn: 'NPN88112299', businessName: 'Coastal Pacific Advisors LLC',
    submittedDate: '2026-08-14', lastUpdated: '2026-08-21',
    status: 'contract-pending', assignedReviewer: 'Sarah Chen',
    parentChannelId: 'r-west', parentChannelName: 'West Region',
    currentStep: 5,
    steps: [
      { id: 'apply', name: '在线申请', status: 'passed', completedDate: '2026-08-14' },
      { id: 'doc-review', name: '资料审核', status: 'passed', completedDate: '2026-08-16' },
      { id: 'nipr', name: 'NIPR验证', status: 'passed', completedDate: '2026-08-17' },
      { id: 'bg-check', name: '背景调查', status: 'passed', completedDate: '2026-08-19' },
      { id: 'eo-check', name: 'E&O验证', status: 'passed', completedDate: '2026-08-20' },
      { id: 'contract', name: '合同签署', status: 'in-progress', actionRequired: '等待申请人签署电子合同' },
      { id: 'appointment', name: 'Appointment', status: 'pending' },
      { id: 'account', name: '账号开通', status: 'pending' },
      { id: 'training', name: '培训认证', status: 'pending' },
      { id: 'final', name: '最终审批', status: 'pending' },
    ],
  },
  {
    id: 'ob-003', applicantName: 'Marcus Thompson', applicantType: 'agent',
    email: 'm.thompson@email.com', phone: '+1-212-555-0303', state: 'NY',
    npn: 'NPN77334455', businessName: undefined,
    submittedDate: '2026-08-18', lastUpdated: '2026-08-22',
    status: 'pending-supplement', assignedReviewer: 'Zhang Wei',
    parentChannelId: 'c4', parentChannelName: 'Empire State Insurance Services',
    currentStep: 1,
    steps: [
      { id: 'apply', name: '在线申请', status: 'passed', completedDate: '2026-08-18' },
      { id: 'doc-review', name: '资料审核', status: 'failed', notes: 'E&O证书已过期，W-9格式不符合要求', actionRequired: '请重新上传有效E&O证书及正确格式W-9表' },
      { id: 'nipr', name: 'NIPR验证', status: 'pending' },
      { id: 'bg-check', name: '背景调查', status: 'pending' },
      { id: 'eo-check', name: 'E&O验证', status: 'pending' },
      { id: 'contract', name: '合同签署', status: 'pending' },
      { id: 'appointment', name: 'Appointment', status: 'pending' },
      { id: 'account', name: '账号开通', status: 'pending' },
      { id: 'training', name: '培训认证', status: 'pending' },
      { id: 'final', name: '最终审批', status: 'pending' },
    ],
    rejectionReason: '入驻资料缺失或无效：E&O证书已过期（有效期至2026-07-31），W-9表单格式错误。请在7日内补充完整材料，否则申请将被关闭。',
    supplementDue: '2026-08-29',
  },
  {
    id: 'ob-004', applicantName: 'SunBelt Insurance Group', applicantType: 'ga',
    email: 'contact@sunbelt.com', phone: '+1-404-555-0404', state: 'GA',
    npn: 'NPN66778899', businessName: 'SunBelt Insurance Group Inc.',
    submittedDate: '2026-08-05', lastUpdated: '2026-08-22',
    status: 'bg-check', assignedReviewer: 'Marcus Lee',
    parentChannelId: 'r-south', parentChannelName: 'South & Southeast Region',
    currentStep: 3,
    steps: [
      { id: 'apply', name: '在线申请', status: 'passed', completedDate: '2026-08-05' },
      { id: 'doc-review', name: '资料审核', status: 'passed', completedDate: '2026-08-08' },
      { id: 'nipr', name: 'NIPR验证', status: 'passed', completedDate: '2026-08-09' },
      { id: 'bg-check', name: '背景调查', status: 'in-progress', notes: 'Checkr 报告生成中，预计2-3个工作日' },
      { id: 'eo-check', name: 'E&O验证', status: 'pending' },
      { id: 'contract', name: '合同签署', status: 'pending' },
      { id: 'appointment', name: 'Appointment', status: 'pending' },
      { id: 'account', name: '账号开通', status: 'pending' },
      { id: 'training', name: '培训认证', status: 'pending' },
      { id: 'final', name: '最终审批', status: 'pending' },
    ],
  },
  {
    id: 'ob-005', applicantName: 'Priya Nair', applicantType: 'agent',
    email: 'priya.nair@email.com', phone: '+1-713-555-0505', state: 'TX',
    npn: 'NPN55443322', businessName: undefined,
    submittedDate: '2026-08-20', lastUpdated: '2026-08-21',
    status: 'under-review', assignedReviewer: 'Zhang Wei',
    parentChannelId: 'c2', parentChannelName: 'Lone Star Brokerage',
    currentStep: 1,
    steps: makeSteps(1),
  },
  {
    id: 'ob-006', applicantName: 'North Star Benefits LLC', applicantType: 'agency',
    email: 'admin@northstarbenefits.com', phone: '+1-312-555-0606', state: 'IL',
    npn: 'NPN33221100', businessName: 'North Star Benefits LLC',
    submittedDate: '2026-07-28', lastUpdated: '2026-08-22',
    status: 'approved', assignedReviewer: 'Sarah Chen',
    parentChannelId: 'r-midwest', parentChannelName: 'Midwest Region',
    currentStep: 10,
    steps: PIPELINE_STEPS.map(s => ({ id: s.id, name: s.label, status: 'passed' as const, completedDate: '2026-08-20' })),
  },
  {
    id: 'ob-007', applicantName: 'Derek Coleman', applicantType: 'agent',
    email: 'd.coleman@email.com', phone: '+1-305-555-0707', state: 'FL',
    npn: 'NPN22110099', businessName: undefined,
    submittedDate: '2026-08-12', lastUpdated: '2026-08-16',
    status: 'rejected', assignedReviewer: 'Marcus Lee',
    parentChannelId: 'c5', parentChannelName: 'Sunshine State Brokers',
    currentStep: 3,
    steps: [
      { id: 'apply', name: '在线申请', status: 'passed', completedDate: '2026-08-12' },
      { id: 'doc-review', name: '资料审核', status: 'passed', completedDate: '2026-08-13' },
      { id: 'nipr', name: 'NIPR验证', status: 'passed', completedDate: '2026-08-14' },
      { id: 'bg-check', name: '背景调查', status: 'failed', notes: '发现重大合规违规记录，不符合准入标准', completedDate: '2026-08-16' },
      ...PIPELINE_STEPS.slice(4).map(s => ({ id: s.id, name: s.label, status: 'pending' as const })),
    ],
    rejectionReason: '背景调查发现申请人存在 2024 年 Florida DOI 吊销执照记录（保费挪用），不符合公司准入政策，申请已拒绝。',
  },
]

// ── Document Reviews ──────────────────────────────────────────────────────────

export const documentReviews: DocumentReview[] = [
  {
    appId: 'ob-001', reviewerId: 'Zhang Wei', reviewStarted: '2026-08-11',
    docs: [
      { id: 'd1', name: 'CA Producer License', docType: 'license', uploadedDate: '2026-08-10', fileSize: '245 KB', status: 'pass', expiryDate: '2027-06-30' },
      { id: 'd2', name: 'E&O Certificate of Insurance', docType: 'eo-cert', uploadedDate: '2026-08-10', fileSize: '188 KB', status: 'pass', expiryDate: '2027-03-15' },
      { id: 'd3', name: 'Background Check Authorization', docType: 'bg-auth', uploadedDate: '2026-08-10', fileSize: '56 KB', status: 'pass' },
      { id: 'd4', name: 'Government-issued ID', docType: 'id', uploadedDate: '2026-08-10', fileSize: '312 KB', status: 'pass' },
      { id: 'd5', name: 'W-9 Form', docType: 'w9', uploadedDate: '2026-08-10', fileSize: '78 KB', status: 'pass' },
    ],
  },
  {
    appId: 'ob-003', reviewerId: 'Zhang Wei', reviewStarted: '2026-08-19',
    docs: [
      { id: 'd10', name: 'NY Producer License', docType: 'license', uploadedDate: '2026-08-18', fileSize: '220 KB', status: 'pass', expiryDate: '2027-09-30' },
      { id: 'd11', name: 'E&O Certificate (EXPIRED)', docType: 'eo-cert', uploadedDate: '2026-08-18', fileSize: '195 KB', status: 'fail', reviewNote: '证书有效期至2026-07-31，已过期。请上传有效证书。', expiryDate: '2026-07-31' },
      { id: 'd12', name: 'Background Check Authorization', docType: 'bg-auth', uploadedDate: '2026-08-18', fileSize: '60 KB', status: 'pass' },
      { id: 'd13', name: 'Government-issued ID', docType: 'id', uploadedDate: '2026-08-18', fileSize: '280 KB', status: 'pass' },
      { id: 'd14', name: 'W-9 Form (incorrect format)', docType: 'w9', uploadedDate: '2026-08-18', fileSize: '45 KB', status: 'fail', reviewNote: '使用了已废止的2019版本W-9表，请下载并提交2024年最新版本。' },
    ],
  },
]

// ── NIPR Verifications ────────────────────────────────────────────────────────

export const niprVerifications: NIPRVerification[] = [
  {
    appId: 'ob-001', npn: 'NPN99001122', applicantName: 'Jennifer Walsh', state: 'CA',
    licenseNumber: 'CA-0M12345', licenseClass: 'Life, Accident & Health',
    issueDate: '2019-03-15', expiryDate: '2027-06-30',
    status: 'pass', verifiedDate: '2026-08-13',
    linesOfAuthority: ['Life', 'Accident & Health', 'Property', 'Casualty'],
  },
  {
    appId: 'ob-002', npn: 'NPN88112299', applicantName: 'Coastal Pacific Advisors LLC', state: 'CA',
    licenseNumber: 'CA-0B98765', licenseClass: 'Property & Casualty',
    issueDate: '2020-06-01', expiryDate: '2028-06-01',
    status: 'pass', verifiedDate: '2026-08-17',
    linesOfAuthority: ['Property', 'Casualty', 'Commercial Lines', 'Personal Lines'],
  },
  {
    appId: 'ob-003', npn: 'NPN77334455', applicantName: 'Marcus Thompson', state: 'NY',
    licenseNumber: 'NY-LA123456', licenseClass: 'Life & Accident',
    issueDate: '2021-01-10', expiryDate: '2027-09-30',
    status: 'pending', verifiedDate: undefined,
    linesOfAuthority: [],
  },
  {
    appId: 'ob-004', npn: 'NPN66778899', applicantName: 'SunBelt Insurance Group', state: 'GA',
    licenseNumber: 'GA-B445566', licenseClass: 'Life & Variable',
    issueDate: '2018-09-01', expiryDate: '2026-09-01',
    status: 'pass', verifiedDate: '2026-08-09',
    linesOfAuthority: ['Life', 'Variable Life', 'Variable Annuity', 'Accident & Health'],
  },
]

// ── Background Checks ─────────────────────────────────────────────────────────

export const backgroundChecks: BackgroundCheck[] = [
  {
    appId: 'ob-001', applicantName: 'Jennifer Walsh', vendor: 'Checkr',
    orderedDate: '2026-08-13', completedDate: '2026-08-15',
    status: 'pass', flags: [],
  },
  {
    appId: 'ob-004', applicantName: 'SunBelt Insurance Group', vendor: 'Sterling',
    orderedDate: '2026-08-09', completedDate: undefined,
    status: 'pending',
    flags: [],
  },
  {
    appId: 'ob-007', applicantName: 'Derek Coleman', vendor: 'Checkr',
    orderedDate: '2026-08-14', completedDate: '2026-08-16',
    status: 'fail',
    flags: [
      { type: 'regulatory', severity: 'high', description: '2024-05 Florida DOI 撤销执照（保费挪用，FSS §626.611）', disposition: 'disqualify' },
    ],
  },
]

// ── E&O Insurance ─────────────────────────────────────────────────────────────

export const eoInsurances: EOInsurance[] = [
  {
    appId: 'ob-001', applicantName: 'Jennifer Walsh',
    carrier: 'Markel Insurance', policyNumber: 'MKL-2026-447890',
    effectiveDate: '2026-04-01', expiryDate: '2027-03-31',
    coverageAmount: 1000000, perClaimAmount: 1000000,
    status: 'pass', verifiedDate: '2026-08-16',
  },
  {
    appId: 'ob-002', applicantName: 'Coastal Pacific Advisors LLC',
    carrier: 'Philadelphia Insurance', policyNumber: 'PHLY-2026-PL-33221',
    effectiveDate: '2026-01-01', expiryDate: '2027-01-01',
    coverageAmount: 2000000, perClaimAmount: 1000000,
    status: 'pass', verifiedDate: '2026-08-20',
  },
  {
    appId: 'ob-003', applicantName: 'Marcus Thompson',
    carrier: 'Unknown', policyNumber: 'EXPIRED',
    effectiveDate: '2025-04-01', expiryDate: '2026-07-31',
    coverageAmount: 500000, perClaimAmount: 500000,
    status: 'fail', verifiedDate: '2026-08-19',
    note: '证书已过期，有效期至2026-07-31',
  },
]

// ── E-Contracts ───────────────────────────────────────────────────────────────

export const eContracts: EContract[] = [
  {
    appId: 'ob-001', applicantName: 'Jennifer Walsh',
    contractType: 'producer-agreement', templateVersion: 'v3.2-2026',
    sentDate: '2026-08-17', signedDate: '2026-08-17',
    status: 'signed', signerEmail: 'jwalsh@email.com',
    signingProvider: 'DocuSign',
  },
  {
    appId: 'ob-002', applicantName: 'Coastal Pacific Advisors LLC',
    contractType: 'ga-agreement', templateVersion: 'v2.8-2026',
    sentDate: '2026-08-21', signedDate: undefined,
    status: 'viewed', signerEmail: 'info@coastalpacific.com',
    signingProvider: 'DocuSign', expiresAt: '2026-08-28',
  },
  {
    appId: 'ob-006', applicantName: 'North Star Benefits LLC',
    contractType: 'ga-agreement', templateVersion: 'v2.7-2026',
    sentDate: '2026-08-14', signedDate: '2026-08-15',
    status: 'signed', signerEmail: 'admin@northstarbenefits.com',
    signingProvider: 'DocuSign',
  },
]

// ── Training Certs ────────────────────────────────────────────────────────────

export const trainingCerts: TrainingCert[] = [
  {
    appId: 'ob-001', applicantName: 'Jennifer Walsh',
    modules: [
      { id: 'tm1', name: 'InsureOS 平台使用入门', required: true, duration: '1.5h', status: 'completed', score: 94, completedDate: '2026-08-20', attempts: 1 },
      { id: 'tm2', name: '产品知识认证 — Term Life', required: true, duration: '2h', status: 'completed', score: 88, completedDate: '2026-08-20', attempts: 1 },
      { id: 'tm3', name: '合规与出单规范', required: true, duration: '1h', status: 'in-progress', score: undefined, completedDate: undefined, attempts: 0 },
      { id: 'tm4', name: '客户服务与投诉处理', required: true, duration: '1h', status: 'not-started', score: undefined, completedDate: undefined, attempts: 0 },
      { id: 'tm5', name: '跨州出单规则', required: false, duration: '45m', status: 'not-started', score: undefined, completedDate: undefined, attempts: 0 },
    ],
    overallStatus: 'pending',
  },
  {
    appId: 'ob-006', applicantName: 'North Star Benefits LLC',
    modules: [
      { id: 'tm1', name: 'InsureOS 平台使用入门', required: true, duration: '1.5h', status: 'completed', score: 96, completedDate: '2026-08-18', attempts: 1 },
      { id: 'tm2', name: '产品知识认证 — Term Life', required: true, duration: '2h', status: 'completed', score: 91, completedDate: '2026-08-18', attempts: 1 },
      { id: 'tm3', name: '合规与出单规范', required: true, duration: '1h', status: 'completed', score: 87, completedDate: '2026-08-19', attempts: 1 },
      { id: 'tm4', name: '客户服务与投诉处理', required: true, duration: '1h', status: 'completed', score: 93, completedDate: '2026-08-19', attempts: 1 },
      { id: 'tm5', name: '跨州出单规则', required: false, duration: '45m', status: 'completed', score: 89, completedDate: '2026-08-19', attempts: 1 },
    ],
    overallStatus: 'pass', completionDate: '2026-08-19',
  },
]

// ── Account Setup ─────────────────────────────────────────────────────────────

export const accountSetups: AccountSetup[] = [
  {
    appId: 'ob-001', applicantName: 'Jennifer Walsh',
    username: 'jwabash_ca', email: 'jwalsh@email.com',
    role: 'Producer — Individual Agent',
    permissions: ['view-quotes', 'create-quotes', 'submit-applications', 'view-commissions', 'view-clients'],
    status: 'active', createdDate: '2026-08-19', activatedDate: '2026-08-19', tempPasswordSent: true,
  },
  {
    appId: 'ob-006', applicantName: 'North Star Benefits LLC',
    username: 'northstar_il', email: 'admin@northstarbenefits.com',
    role: 'Agency Admin',
    permissions: ['view-quotes', 'create-quotes', 'submit-applications', 'view-commissions', 'manage-producers', 'view-reports', 'manage-clients'],
    status: 'active', createdDate: '2026-08-20', activatedDate: '2026-08-20', tempPasswordSent: true,
  },
  {
    appId: 'ob-002', applicantName: 'Coastal Pacific Advisors LLC',
    username: undefined, email: 'info@coastalpacific.com',
    role: 'Agency Admin',
    permissions: [],
    status: 'not-started', createdDate: undefined, activatedDate: undefined, tempPasswordSent: false,
  },
]

// ── Stats ─────────────────────────────────────────────────────────────────────

export const onboardingStats = {
  total: onboardingApps.length,
  pending: onboardingApps.filter(a => !['approved', 'rejected'].includes(a.status)).length,
  approved: onboardingApps.filter(a => a.status === 'approved').length,
  rejected: onboardingApps.filter(a => a.status === 'rejected').length,
  pendingSupplement: onboardingApps.filter(a => a.status === 'pending-supplement').length,
  avgDays: 12,
}
