// ── Extended Appointment Records ──────────────────────────────────────────────

export interface AppointmentRecord {
  id: string
  channelId: string
  channelName: string
  channelNpn: string
  insurerId: string
  insurerName: string
  insurerShort: string
  state: string
  line: string
  // 委任生命周期状态。本系统没有任何审批流程，这些值不是审批结论：
  // approved = 已生效、pending = 待生效、under-review = 处理中（NIPR / 保司录入）、rejected = 已失效。
  status: 'approved' | 'pending' | 'rejected' | 'expired' | 'terminated' | 'under-review'
  submittedDate: string
  approvedDate?: string   // 生效日期（UI 文案为「生效日期 / Effective Date」）
  expiryDate: string
  terminatedDate?: string
  terminationReason?: string
  terminationReasonEn?: string
  renewalStatus?: 'not-due' | 'due-soon' | 'in-progress' | 'renewed'
  daysToExpiry: number
  submittedBy: string
  processingDays?: number
  rejectionReason?: string
  rejectionReasonEn?: string
  niprTransactionId?: string
}

export const appointmentRecords: AppointmentRecord[] = [
  { id: 'ap1', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-02-20', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Sarah Chen', processingDays: 36, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-04581' },
  { id: 'ap2', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', state: 'CA', line: 'P&C', status: 'approved', submittedDate: '2023-01-15', approvedDate: '2023-03-01', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Sarah Chen', processingDays: 44, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-04622' },
  { id: 'ap3', channelId: 'c2', channelName: 'Lone Star Brokerage', channelNpn: 'NPN23459012', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'TX', line: 'P&C', status: 'approved', submittedDate: '2023-03-10', approvedDate: '2023-04-15', expiryDate: '2026-09-30', daysToExpiry: 39, submittedBy: 'James Rodriguez', processingDays: 36, renewalStatus: 'in-progress', niprTransactionId: 'NIPR-2023-07234' },
  { id: 'ap4', channelId: 'c4', channelName: 'Empire State Insurance Services', channelNpn: 'NPN45671234', insurerId: '2', insurerName: 'Liberty Mutual', insurerShort: 'Liberty Mutual', state: 'NY', line: 'Auto', status: 'pending', submittedDate: '2026-07-20', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Emily Johnson', renewalStatus: 'not-due' },
  { id: 'ap5', channelId: 'c5', channelName: 'Sunshine State Brokers', channelNpn: 'NPN56782345', insurerId: '5', insurerName: 'AIG', insurerShort: 'AIG', state: 'FL', line: 'Professional', status: 'under-review', submittedDate: '2026-08-01', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Carlos Martinez', renewalStatus: 'not-due' },
  { id: 'ap6', channelId: 'c10', channelName: 'Northeast Professional Services', channelNpn: 'NPN01237890', insurerId: '8', insurerName: 'Hartford', insurerShort: 'Hartford', state: 'CT', line: 'Commercial', status: 'expired', submittedDate: '2023-06-01', approvedDate: '2023-07-15', expiryDate: '2026-07-14', daysToExpiry: -39, submittedBy: 'Tom Anderson', processingDays: 44, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2023-12890' },
  { id: 'ap7', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', channelNpn: 'NPN34560123', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', state: 'IL', line: 'Auto', status: 'approved', submittedDate: '2023-05-10', approvedDate: '2023-06-20', expiryDate: '2026-12-31', daysToExpiry: 131, submittedBy: 'Michael Wu', processingDays: 41, renewalStatus: 'due-soon', niprTransactionId: 'NIPR-2023-09812' },
  { id: 'ap8', channelId: 'c9', channelName: 'Southwest Insurance Network', channelNpn: 'NPN90126789', insurerId: '6', insurerName: 'Zurich', insurerShort: 'Zurich', state: 'AZ', line: 'Commercial', status: 'pending', submittedDate: '2026-08-10', expiryDate: '2027-12-31', daysToExpiry: 496, submittedBy: 'Lisa Wang', renewalStatus: 'not-due' },
  { id: 'ap9', channelId: 'c2', channelName: 'Lone Star Brokerage', channelNpn: 'NPN23459012', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', state: 'TX', line: 'Specialty', status: 'approved', submittedDate: '2024-02-01', approvedDate: '2024-03-15', expiryDate: '2027-03-14', daysToExpiry: 570, submittedBy: 'James Rodriguez', processingDays: 43, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2024-02341' },
  { id: 'ap10', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', channelNpn: 'NPN12348901', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'WA', line: 'Auto', status: 'rejected', submittedDate: '2026-06-01', expiryDate: '', daysToExpiry: 0, submittedBy: 'Sarah Chen', rejectionReason: '申请人 WA 州牌照未激活，需先完成牌照激活', rejectionReasonEn: "Applicant's WA state license is not active; license activation must be completed first" },
  { id: 'ap11', channelId: 'c6', channelName: 'Midwest Specialty Risk', channelNpn: 'NPN67893456', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', state: 'OH', line: 'Commercial', status: 'approved', submittedDate: '2024-04-01', approvedDate: '2024-05-10', expiryDate: '2027-05-09', daysToExpiry: 625, submittedBy: 'David Kim', processingDays: 39, renewalStatus: 'not-due', niprTransactionId: 'NIPR-2024-04512' },
  { id: 'ap12', channelId: 'c7', channelName: 'Rocky Mountain Insurance Advisors', channelNpn: 'NPN78904567', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', state: 'CO', line: 'Auto', status: 'terminated', submittedDate: '2022-09-01', approvedDate: '2022-10-15', expiryDate: '2025-10-14', terminatedDate: '2025-08-20', daysToExpiry: -12, submittedBy: 'Jennifer Park', processingDays: 44, terminationReason: '渠道主动申请终止', terminationReasonEn: 'Termination requested by the channel', renewalStatus: 'not-due' },
]
