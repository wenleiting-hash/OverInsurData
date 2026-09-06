// ── Commission Bill Import ─────────────────────────────────────────────────────

export type BillImportStatus = 'pending-parse' | 'parsed' | 'reconciled' | 'exception' | 'settled' | 'archived'

export interface CommissionBill {
  id: string
  fileName: string
  insurerId: string
  insurerName: string
  insurerShort: string
  period: string
  importDate: string
  importedBy: string
  fileSize: string
  fileFormat: 'CSV' | 'Excel' | 'PDF' | 'EDI'
  status: BillImportStatus
  totalPolicies: number
  totalPremium: number
  totalCommission: number
  parsedPolicies?: number
  matchedPolicies?: number
  exceptionCount?: number
  reconciledAmount?: number
  differenceAmount?: number
  settledDate?: string
}

export const commissionBills: CommissionBill[] = [
  { id: 'cb1', fileName: 'Travelers_Commission_202608.csv', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', period: '2026-08', importDate: '2026-08-18 09:14:22', importedBy: 'System Auto', fileSize: '2.8 MB', fileFormat: 'CSV', status: 'reconciled', totalPolicies: 1842, totalPremium: 4821900, totalCommission: 578628, parsedPolicies: 1842, matchedPolicies: 1829, exceptionCount: 13, reconciledAmount: 576210, differenceAmount: 2418 },
  { id: 'cb2', fileName: 'LibertyMutual_Stmt_Aug2026.xlsx', insurerId: '2', insurerName: 'Liberty Mutual', insurerShort: 'Liberty Mutual', period: '2026-08', importDate: '2026-08-19 14:30:05', importedBy: 'Sarah Chen', fileSize: '4.1 MB', fileFormat: 'Excel', status: 'exception', totalPolicies: 2310, totalPremium: 6045200, totalCommission: 725424, parsedPolicies: 2310, matchedPolicies: 2285, exceptionCount: 25, reconciledAmount: 0, differenceAmount: 0 },
  { id: 'cb3', fileName: 'Nationwide_Commission_2026Q3.csv', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', period: '2026-Q3', importDate: '2026-08-20 10:05:18', importedBy: 'Zhang Wei', fileSize: '1.9 MB', fileFormat: 'CSV', status: 'parsed', totalPolicies: 987, totalPremium: 2341800, totalCommission: 281016, parsedPolicies: 987, matchedPolicies: 0, exceptionCount: 0 },
  { id: 'cb4', fileName: 'Chubb_Remittance_August.edi', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', period: '2026-08', importDate: '2026-08-21 08:22:40', importedBy: 'System Auto', fileSize: '0.7 MB', fileFormat: 'EDI', status: 'pending-parse', totalPolicies: 654, totalPremium: 3218600, totalCommission: 386232 },
  { id: 'cb5', fileName: 'AIG_Commission_Aug2026.pdf', insurerId: '5', insurerName: 'AIG', insurerShort: 'AIG', period: '2026-08', importDate: '2026-08-22 11:44:10', importedBy: 'Liu Yang', fileSize: '3.2 MB', fileFormat: 'PDF', status: 'pending-parse', totalPolicies: 421, totalPremium: 1892400, totalCommission: 227088 },
  { id: 'cb6', fileName: 'Travelers_Commission_202607.csv', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', period: '2026-07', importDate: '2026-07-20 09:10:00', importedBy: 'System Auto', fileSize: '2.6 MB', fileFormat: 'CSV', status: 'settled', totalPolicies: 1768, totalPremium: 4609200, totalCommission: 553104, parsedPolicies: 1768, matchedPolicies: 1762, exceptionCount: 6, reconciledAmount: 552198, differenceAmount: 906, settledDate: '2026-07-31' },
  { id: 'cb7', fileName: 'Zurich_CommReport_Q2_2026.xlsx', insurerId: '6', insurerName: 'Zurich', insurerShort: 'Zurich', period: '2026-Q2', importDate: '2026-07-05 14:20:00', importedBy: 'Sarah Chen', fileSize: '5.4 MB', fileFormat: 'Excel', status: 'settled', totalPolicies: 3120, totalPremium: 8934600, totalCommission: 1072152, parsedPolicies: 3120, matchedPolicies: 3118, exceptionCount: 2, reconciledAmount: 1071820, differenceAmount: 332, settledDate: '2026-07-15' },
]

// ── Parsed Bill Line Items ────────────────────────────────────────────────────

export type MatchStatus = 'matched' | 'unmatched' | 'amount-diff' | 'rate-diff' | 'duplicate'

export interface BillLineItem {
  id: string
  billId: string
  lineNumber: number
  policyNumber: string
  insuredName: string
  channelId: string
  channelName: string
  state: string
  line: string
  effectiveDate: string
  premium: number
  commissionRate: number
  commissionAmount: number
  ourPolicyNumber?: string
  ourCommissionRate?: number
  ourCommissionAmount?: number
  matchStatus: MatchStatus
  diffAmount?: number
  diffNote?: string
  diffNoteEn?: string
}

export const billLineItems: BillLineItem[] = [
  { id: 'li1', billId: 'cb1', lineNumber: 1, policyNumber: 'TRV-2026-0048821', insuredName: 'Bay Area Tech Ventures', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', state: 'CA', line: 'P&C', effectiveDate: '2026-08-01', premium: 67800, commissionRate: 0.12, commissionAmount: 8136, ourPolicyNumber: 'INS-2026-0048821', ourCommissionRate: 0.12, ourCommissionAmount: 8136, matchStatus: 'matched' },
  { id: 'li2', billId: 'cb1', lineNumber: 2, policyNumber: 'TRV-2026-0048944', insuredName: 'Golden Gate Logistics', channelId: 'c1', channelName: 'Pacific Coast Insurance Group', state: 'CA', line: 'P&C', effectiveDate: '2026-08-03', premium: 42500, commissionRate: 0.12, commissionAmount: 5100, ourPolicyNumber: 'INS-2026-0048944', ourCommissionRate: 0.125, ourCommissionAmount: 5313, matchStatus: 'rate-diff', diffAmount: -213, diffNote: '费率差异：账单12% vs 系统12.5%', diffNoteEn: 'Rate variance: bill 12% vs system 12.5%' },
  { id: 'li3', billId: 'cb1', lineNumber: 3, policyNumber: 'TRV-2026-0049012', insuredName: 'Pacific Rim Manufacturing', channelId: 'c2', channelName: 'Lone Star Brokerage', state: 'TX', line: 'Commercial', effectiveDate: '2026-08-05', premium: 89200, commissionRate: 0.10, commissionAmount: 8920, ourPolicyNumber: 'INS-2026-0049012', ourCommissionRate: 0.10, ourCommissionAmount: 8920, matchStatus: 'matched' },
  { id: 'li4', billId: 'cb1', lineNumber: 4, policyNumber: 'TRV-2026-0049188', insuredName: 'Summit Medical Group', channelId: 'c3', channelName: 'Great Lakes Insurance Partners', state: 'IL', line: 'Professional', effectiveDate: '2026-08-07', premium: 34600, commissionRate: 0.15, commissionAmount: 5190, ourPolicyNumber: undefined, ourCommissionRate: undefined, ourCommissionAmount: undefined, matchStatus: 'unmatched', diffNote: '系统中未找到匹配保单', diffNoteEn: 'No matching policy found in the system' },
  { id: 'li5', billId: 'cb1', lineNumber: 5, policyNumber: 'TRV-2026-0049302', insuredName: 'Metro Construction LLC', channelId: 'c4', channelName: 'Empire State Insurance Services', state: 'NY', line: 'Commercial', effectiveDate: '2026-08-09', premium: 156700, commissionRate: 0.10, commissionAmount: 15670, ourPolicyNumber: 'INS-2026-0049302', ourCommissionRate: 0.10, ourCommissionAmount: 14800, matchStatus: 'amount-diff', diffAmount: 870, diffNote: '金额差异：账单 $15,670 vs 系统 $14,800（保费录入差异）', diffNoteEn: 'Amount variance: bill $15,670 vs system $14,800 (premium entry discrepancy)' },
  { id: 'li6', billId: 'cb2', lineNumber: 1, policyNumber: 'LM-2026-0073421', insuredName: 'Desert Solar Holdings', channelId: 'c9', channelName: 'Southwest Insurance Network', state: 'AZ', line: 'Commercial', effectiveDate: '2026-08-02', premium: 45200, commissionRate: 0.11, commissionAmount: 4972, ourPolicyNumber: 'INS-2026-0073421', ourCommissionRate: 0.11, ourCommissionAmount: 4972, matchStatus: 'matched' },
  { id: 'li7', billId: 'cb2', lineNumber: 2, policyNumber: 'LM-2026-0073589', insuredName: 'Coastal Medical Associates', channelId: 'c5', channelName: 'Sunshine State Brokers', state: 'FL', line: 'Professional', effectiveDate: '2026-08-04', premium: 89600, commissionRate: 0.13, commissionAmount: 11648, ourPolicyNumber: 'INS-2026-0073589', ourCommissionRate: 0.13, ourCommissionAmount: 11648, matchStatus: 'matched' },
]

// ── Reconciliation Records ────────────────────────────────────────────────────

export type DiffType = 'rate-mismatch' | 'amount-mismatch' | 'missing-policy' | 'duplicate' | 'missing-in-bill'
export type DiffStatus = 'open' | 'under-review' | 'accepted' | 'disputed' | 'adjusted' | 'waived'

export interface ReconciliationDiff {
  id: string
  billId: string
  billName: string
  insurerShort: string
  policyNumber: string
  insuredName: string
  diffType: DiffType
  billAmount: number
  ourAmount: number
  diffAmount: number
  status: DiffStatus
  assignedTo?: string
  note?: string
  noteEn?: string
  createdDate: string
  resolvedDate?: string
}

export const reconciliationDiffs: ReconciliationDiff[] = [
  { id: 'rd1', billId: 'cb1', billName: 'Travelers_Commission_202608.csv', insurerShort: 'Travelers', policyNumber: 'TRV-2026-0049302', insuredName: 'Metro Construction LLC', diffType: 'amount-mismatch', billAmount: 15670, ourAmount: 14800, diffAmount: 870, status: 'under-review', assignedTo: 'Zhang Wei', note: '待核查保费基数是否录入有误', noteEn: 'Verifying whether the premium base was entered incorrectly', createdDate: '2026-08-18' },
  { id: 'rd2', billId: 'cb1', billName: 'Travelers_Commission_202608.csv', insurerShort: 'Travelers', policyNumber: 'TRV-2026-0048944', insuredName: 'Golden Gate Logistics', diffType: 'rate-mismatch', billAmount: 5100, ourAmount: 5313, diffAmount: -213, status: 'disputed', assignedTo: 'Sarah Chen', note: '已向 Travelers 发送确认请求，等待回复', noteEn: 'Confirmation request sent to Travelers; awaiting reply', createdDate: '2026-08-18' },
  { id: 'rd3', billId: 'cb1', billName: 'Travelers_Commission_202608.csv', insurerShort: 'Travelers', policyNumber: 'TRV-2026-0049188', insuredName: 'Summit Medical Group', diffType: 'missing-policy', billAmount: 5190, ourAmount: 0, diffAmount: 5190, status: 'open', createdDate: '2026-08-18' },
  { id: 'rd4', billId: 'cb2', billName: 'LibertyMutual_Stmt_Aug2026.xlsx', insurerShort: 'Liberty Mutual', policyNumber: 'LM-2026-0074122', insuredName: 'Gulf Coast Petrochemical', diffType: 'rate-mismatch', billAmount: 28440, ourAmount: 26100, diffAmount: 2340, status: 'open', createdDate: '2026-08-19' },
  { id: 'rd5', billId: 'cb2', billName: 'LibertyMutual_Stmt_Aug2026.xlsx', insurerShort: 'Liberty Mutual', policyNumber: 'LM-2026-0074290', insuredName: 'Sunrise Healthcare', diffType: 'duplicate', billAmount: 12800, ourAmount: 0, diffAmount: 12800, status: 'accepted', assignedTo: 'Liu Yang', note: '确认为重复提交，已通知 Liberty Mutual 纠正', noteEn: 'Confirmed duplicate submission; Liberty Mutual notified to correct', createdDate: '2026-08-19', resolvedDate: '2026-08-21' },
  { id: 'rd6', billId: 'cb2', billName: 'LibertyMutual_Stmt_Aug2026.xlsx', insurerShort: 'Liberty Mutual', policyNumber: 'LM-2026-0074401', insuredName: 'Mountain View Hotels', diffType: 'amount-mismatch', billAmount: 9870, ourAmount: 10450, diffAmount: -580, status: 'adjusted', assignedTo: 'Sarah Chen', note: '系统金额已调整为账单金额，差额记入调整账', noteEn: 'System amount adjusted to the billed amount; variance posted to the adjustment account', createdDate: '2026-08-19', resolvedDate: '2026-08-22' },
  { id: 'rd7', billId: 'cb6', billName: 'Travelers_Commission_202607.csv', insurerShort: 'Travelers', policyNumber: 'TRV-2026-0041188', insuredName: 'Pacific Network Corp', diffType: 'amount-mismatch', billAmount: 4210, ourAmount: 3840, diffAmount: 370, status: 'waived', assignedTo: 'Zhang Wei', note: '差额小于阈值 $500，按政策免于追偿', noteEn: 'Variance below the $500 threshold; waived per policy', createdDate: '2026-07-22', resolvedDate: '2026-07-25' },
]

// ── Settlement Cycles ─────────────────────────────────────────────────────────

export type CycleFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'custom'
export type SettlementMethod = 'wire-transfer' | 'ach' | 'check' | 'offset'

export interface SettlementCycleConfig {
  id: string
  insurerId: string
  insurerName: string
  insurerShort: string
  frequency: CycleFrequency
  cutoffDay: number
  paymentDueDays: number
  method: SettlementMethod
  currency: string
  minSettleAmount: number
  autoReconcile: boolean
  autoSettle: boolean
  notifyDaysBefore: number
  bankAccount?: string
  routingNumber?: string
  contactEmail: string
  lastSettledDate?: string
  nextDueDate: string
  nextDueAmount?: number
  ytdSettled: number
}

export const settlementCycles: SettlementCycleConfig[] = [
  { id: 'sc1', insurerId: '1', insurerName: 'Travelers', insurerShort: 'Travelers', frequency: 'monthly', cutoffDay: 15, paymentDueDays: 30, method: 'wire-transfer', currency: 'USD', minSettleAmount: 1000, autoReconcile: true, autoSettle: false, notifyDaysBefore: 5, bankAccount: '****8821', routingNumber: '021000021', contactEmail: 'commissions@travelers.com', lastSettledDate: '2026-07-31', nextDueDate: '2026-08-31', nextDueAmount: 576210, ytdSettled: 3845620 },
  { id: 'sc2', insurerId: '2', insurerName: 'Liberty Mutual', insurerShort: 'Liberty Mutual', frequency: 'monthly', cutoffDay: 20, paymentDueDays: 25, method: 'ach', currency: 'USD', minSettleAmount: 500, autoReconcile: true, autoSettle: false, notifyDaysBefore: 7, bankAccount: '****4402', routingNumber: '011000015', contactEmail: 'commissions@lmig.com', lastSettledDate: '2026-07-28', nextDueDate: '2026-08-28', nextDueAmount: 725424, ytdSettled: 4921800 },
  { id: 'sc3', insurerId: '3', insurerName: 'Nationwide', insurerShort: 'Nationwide', frequency: 'quarterly', cutoffDay: 1, paymentDueDays: 45, method: 'wire-transfer', currency: 'USD', minSettleAmount: 2000, autoReconcile: false, autoSettle: false, notifyDaysBefore: 10, bankAccount: '****7710', routingNumber: '044000037', contactEmail: 'commissions@nationwide.com', lastSettledDate: '2026-06-30', nextDueDate: '2026-09-30', nextDueAmount: 281016, ytdSettled: 2108900 },
  { id: 'sc4', insurerId: '4', insurerName: 'Chubb', insurerShort: 'Chubb', frequency: 'monthly', cutoffDay: 10, paymentDueDays: 20, method: 'wire-transfer', currency: 'USD', minSettleAmount: 5000, autoReconcile: true, autoSettle: false, notifyDaysBefore: 5, bankAccount: '****3318', routingNumber: '021000021', contactEmail: 'commissions@chubb.com', lastSettledDate: '2026-07-25', nextDueDate: '2026-08-25', ytdSettled: 5621400 },
  { id: 'sc5', insurerId: '5', insurerName: 'AIG', insurerShort: 'AIG', frequency: 'monthly', cutoffDay: 25, paymentDueDays: 30, method: 'ach', currency: 'USD', minSettleAmount: 1000, autoReconcile: true, autoSettle: false, notifyDaysBefore: 7, bankAccount: '****9941', routingNumber: '026009593', contactEmail: 'commissions@aig.com', lastSettledDate: '2026-07-31', nextDueDate: '2026-08-31', ytdSettled: 1892300 },
  { id: 'sc6', insurerId: '6', insurerName: 'Zurich', insurerShort: 'Zurich', frequency: 'quarterly', cutoffDay: 1, paymentDueDays: 30, method: 'wire-transfer', currency: 'USD', minSettleAmount: 10000, autoReconcile: false, autoSettle: false, notifyDaysBefore: 14, bankAccount: '****6612', routingNumber: '021000021', contactEmail: 'commissions@zurich.com', lastSettledDate: '2026-07-15', nextDueDate: '2026-09-30', ytdSettled: 8940100 },
]

// ── Premium Reconciliation ────────────────────────────────────────────────────

export type PremiumDiffType = 'missing-remittance' | 'over-remittance' | 'rate-error' | 'cancellation-adj' | 'endorsement-adj'
export type PremiumRecStatus = 'matched' | 'exception' | 'adjusted' | 'pending'

export interface PremiumRecRecord {
  id: string
  period: string
  insurerId: string
  insurerShort: string
  policyNumber: string
  insuredName: string
  channelName: string
  state: string
  expectedPremium: number
  remittedPremium: number
  diffAmount: number
  diffType?: PremiumDiffType
  status: PremiumRecStatus
  note?: string
  noteEn?: string
  dueDate: string
}

export interface PremiumSummary {
  insurerId: string
  insurerShort: string
  period: string
  totalPolicies: number
  totalExpected: number
  totalRemitted: number
  totalDiff: number
  matchRate: number
  exceptionCount: number
}

export const premiumRecords: PremiumRecRecord[] = [
  { id: 'pr1', period: '2026-08', insurerId: '1', insurerShort: 'Travelers', policyNumber: 'INS-2026-0049302', insuredName: 'Metro Construction LLC', channelName: 'Empire State Insurance Services', state: 'NY', expectedPremium: 156700, remittedPremium: 156700, diffAmount: 0, status: 'matched', dueDate: '2026-09-01' },
  { id: 'pr2', period: '2026-08', insurerId: '1', insurerShort: 'Travelers', policyNumber: 'INS-2026-0048821', insuredName: 'Bay Area Tech Ventures', channelName: 'Pacific Coast Insurance Group', state: 'CA', expectedPremium: 67800, remittedPremium: 67800, diffAmount: 0, status: 'matched', dueDate: '2026-09-01' },
  { id: 'pr3', period: '2026-08', insurerId: '1', insurerShort: 'Travelers', policyNumber: 'INS-2026-0050012', insuredName: 'Sunrise Technologies', channelName: 'Pacific Coast Insurance Group', state: 'CA', expectedPremium: 45600, remittedPremium: 0, diffAmount: 45600, diffType: 'missing-remittance', status: 'exception', note: '渠道逾期未缴保费，已发催缴通知', noteEn: 'Channel premium overdue; demand notice issued', dueDate: '2026-08-15' },
  { id: 'pr4', period: '2026-08', insurerId: '2', insurerShort: 'Liberty Mutual', policyNumber: 'INS-2026-0073421', insuredName: 'Desert Solar Holdings', channelName: 'Southwest Insurance Network', state: 'AZ', expectedPremium: 45200, remittedPremium: 45200, diffAmount: 0, status: 'matched', dueDate: '2026-09-01' },
  { id: 'pr5', period: '2026-08', insurerId: '2', insurerShort: 'Liberty Mutual', policyNumber: 'INS-2026-0074122', insuredName: 'Gulf Coast Petrochemical', channelName: 'Lone Star Brokerage', state: 'TX', expectedPremium: 258600, remittedPremium: 269400, diffAmount: -10800, diffType: 'over-remittance', status: 'exception', note: '多缴差额疑为背书批单保费计算错误', noteEn: 'Overpayment variance suspected to be an endorsement premium calculation error', dueDate: '2026-09-01' },
  { id: 'pr6', period: '2026-08', insurerId: '3', insurerShort: 'Nationwide', policyNumber: 'INS-2026-0034512', insuredName: 'Chicago Fleet Leasing', channelName: 'Great Lakes Insurance Partners', state: 'IL', expectedPremium: 34100, remittedPremium: 31200, diffAmount: 2900, diffType: 'cancellation-adj', status: 'adjusted', note: '保单中途取消，保费按日比例调整', noteEn: 'Policy cancelled mid-term; premium prorated on a daily basis', dueDate: '2026-09-15' },
  { id: 'pr7', period: '2026-08', insurerId: '4', insurerShort: 'Chubb', policyNumber: 'INS-2026-0062810', insuredName: 'Pinnacle Financial Group', channelName: 'Lone Star Brokerage', state: 'TX', expectedPremium: 189400, remittedPremium: 189400, diffAmount: 0, status: 'matched', dueDate: '2026-08-25' },
  { id: 'pr8', period: '2026-08', insurerId: '5', insurerShort: 'AIG', policyNumber: 'INS-2026-0089221', insuredName: 'Coastal Medical Associates', channelName: 'Sunshine State Brokers', state: 'FL', expectedPremium: 89600, remittedPremium: 0, diffAmount: 89600, diffType: 'missing-remittance', status: 'exception', note: '对接渠道提交 Appointment 审核中，暂缓收款', noteEn: 'Channel appointment under review; collection on hold', dueDate: '2026-08-20' },
]

export const premiumSummaries: PremiumSummary[] = [
  { insurerId: '1', insurerShort: 'Travelers', period: '2026-08', totalPolicies: 1842, totalExpected: 4821900, totalRemitted: 4776300, totalDiff: 45600, matchRate: 0.991, exceptionCount: 1 },
  { insurerId: '2', insurerShort: 'Liberty Mutual', period: '2026-08', totalPolicies: 2310, totalExpected: 6045200, totalRemitted: 6056000, totalDiff: -10800, matchRate: 0.988, exceptionCount: 1 },
  { insurerId: '3', insurerShort: 'Nationwide', period: '2026-08', totalPolicies: 987, totalExpected: 2341800, totalRemitted: 2338900, totalDiff: 2900, matchRate: 0.996, exceptionCount: 1 },
  { insurerId: '4', insurerShort: 'Chubb', period: '2026-08', totalPolicies: 654, totalExpected: 3218600, totalRemitted: 3218600, totalDiff: 0, matchRate: 1.0, exceptionCount: 0 },
  { insurerId: '5', insurerShort: 'AIG', period: '2026-08', totalPolicies: 421, totalExpected: 1892400, totalRemitted: 1802800, totalDiff: 89600, matchRate: 0.953, exceptionCount: 1 },
]

// ── Parse Rule Templates ──────────────────────────────────────────────────────

export interface ParseTemplate {
  id: string
  insurerId: string
  insurerShort: string
  templateName: string
  fileFormat: string
  policyCol: string
  premiumCol: string
  commissionCol: string
  rateCol?: string
  dateCol: string
  channelCol?: string
  headerRow: number
  lastUsed: string
  usageCount: number
  successRate: number
}

export const parseTemplates: ParseTemplate[] = [
  { id: 'pt1', insurerId: '1', insurerShort: 'Travelers', templateName: 'Travelers CSV Standard', fileFormat: 'CSV', policyCol: 'POLICY_NO', premiumCol: 'WRITTEN_PREMIUM', commissionCol: 'COMMISSION_AMT', rateCol: 'COMM_RATE', dateCol: 'EFF_DATE', channelCol: 'PRODUCER_CODE', headerRow: 1, lastUsed: '2026-08-18', usageCount: 24, successRate: 0.998 },
  { id: 'pt2', insurerId: '2', insurerShort: 'Liberty Mutual', templateName: 'LM Excel Layout v3', fileFormat: 'Excel', policyCol: 'Policy Number', premiumCol: 'Total Premium', commissionCol: 'Commission', rateCol: 'Comm %', dateCol: 'Effective Date', channelCol: 'Agent Code', headerRow: 3, lastUsed: '2026-08-19', usageCount: 18, successRate: 0.992 },
  { id: 'pt3', insurerId: '4', insurerShort: 'Chubb', templateName: 'Chubb EDI 834', fileFormat: 'EDI', policyCol: 'REF*PN', premiumCol: 'AMT*PR', commissionCol: 'AMT*CM', dateCol: 'DTP*007', headerRow: 0, lastUsed: '2026-08-21', usageCount: 12, successRate: 0.995 },
  { id: 'pt4', insurerId: '3', insurerShort: 'Nationwide', templateName: 'Nationwide Quarterly CSV', fileFormat: 'CSV', policyCol: 'policy_number', premiumCol: 'prem_amount', commissionCol: 'comm_earned', rateCol: 'comm_pct', dateCol: 'policy_eff_dt', channelCol: 'agent_id', headerRow: 2, lastUsed: '2026-08-20', usageCount: 8, successRate: 0.989 },
]

// ── Settlement History ────────────────────────────────────────────────────────

export interface SettlementRecord {
  id: string
  insurerId: string
  insurerShort: string
  period: string
  settledDate: string
  amount: number
  method: SettlementMethod
  referenceNumber: string
  status: 'completed' | 'pending' | 'failed' | 'reversed'
  confirmedBy?: string
}

export const settlementHistory: SettlementRecord[] = [
  { id: 'sh1', insurerId: '1', insurerShort: 'Travelers', period: '2026-07', settledDate: '2026-07-31', amount: 553104, method: 'wire-transfer', referenceNumber: 'WIRE-20260731-TRV-001', status: 'completed', confirmedBy: 'Zhang Wei' },
  { id: 'sh2', insurerId: '6', insurerShort: 'Zurich', period: '2026-Q2', settledDate: '2026-07-15', amount: 1072152, method: 'wire-transfer', referenceNumber: 'WIRE-20260715-ZUR-001', status: 'completed', confirmedBy: 'Sarah Chen' },
  { id: 'sh3', insurerId: '2', insurerShort: 'Liberty Mutual', period: '2026-07', settledDate: '2026-07-28', amount: 689200, method: 'ach', referenceNumber: 'ACH-20260728-LM-001', status: 'completed', confirmedBy: 'Liu Yang' },
  { id: 'sh4', insurerId: '5', insurerShort: 'AIG', period: '2026-07', settledDate: '2026-07-31', amount: 227088, method: 'ach', referenceNumber: 'ACH-20260731-AIG-001', status: 'completed', confirmedBy: 'Zhang Wei' },
  { id: 'sh5', insurerId: '1', insurerShort: 'Travelers', period: '2026-08', settledDate: '', amount: 576210, method: 'wire-transfer', referenceNumber: '', status: 'pending' },
]

// Presentational styles only; display labels are localized in the view via i18n.
export const DIFF_STATUS_STYLE: Record<DiffStatus, { bg: string; color: string }> = {
  open:          { bg: 'rgba(255,59,48,0.1)',  color: '#C0392B' },
  'under-review':{ bg: 'rgba(0,122,255,0.1)',  color: '#005DC7' },
  accepted:      { bg: 'rgba(52,199,89,0.1)',  color: '#1E8033' },
  disputed:      { bg: 'rgba(255,159,10,0.1)', color: '#B06000' },
  adjusted:      { bg: 'rgba(130,80,255,0.1)', color: '#7B3FCA' },
  waived:        { bg: 'rgba(180,180,180,0.15)', color: '#666' },
}
export const BILL_STATUS_STYLE: Record<BillImportStatus, { bg: string; color: string }> = {
  'pending-parse': { bg: 'rgba(180,180,180,0.15)', color: '#717786' },
  parsed:          { bg: 'rgba(255,159,10,0.1)',  color: '#B06000' },
  reconciled:      { bg: 'rgba(0,122,255,0.1)',   color: '#005DC7' },
  exception:       { bg: 'rgba(255,59,48,0.1)',   color: '#C0392B' },
  settled:         { bg: 'rgba(52,199,89,0.1)',   color: '#1E8033' },
  archived:        { bg: 'rgba(180,180,180,0.15)', color: '#A0A5B1' },
}
