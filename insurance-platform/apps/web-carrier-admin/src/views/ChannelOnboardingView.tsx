import { useState, useRef } from 'react'
import { Fragment } from 'react'
import type { ComponentType } from 'react'
import {
  FileText,
  FileCheck2,
  ShieldCheck,
  FileSignature,
  UserCog,
  Undo2,
  Search,
  AlertTriangle,
  Clock,
  User,
  Check,
  Plus,
  FileText as FileIcon,
  Download,
  Eye,
  AlertCircle,
  XCircle,
  CircleCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'

/**
 * Channel onboarding & admission management view (pixel-perfect, aligned to Figma prototype)
 * Online application · Document review · NIPR / background / E&O verification · Contract signing · Account provisioning · Training certification
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

type ApplicantStatus =
  | 'training'
  | 'docReview'
  | 'onboarded'
  | 'pendingInfo'
  | 'backgroundCheck'
  | 'signing'
  | 'pendingApproval'

interface Applicant {
  id: string
  name: string
  typeKey: string
  state: string
  status: ApplicantStatus
  /** Completed steps (out of 10 total) */
  progress: number
  reviewer: string
  reviewerEn: string
  email?: string
}

// ============ Tab 1 application overview mock ============
const MOCK_APPLICANTS: Applicant[] = [
  { id: 'a1', name: 'Jennifer Walsh', typeKey: 'individual', state: 'CA', status: 'training', progress: 8, reviewer: '张伟', reviewerEn: 'Zhang Wei', email: 'jennifer.w@email.com' },
  { id: 'a2', name: 'Carson Reed', typeKey: 'brokerage', state: 'TX', status: 'docReview', progress: 3, reviewer: '李娜', reviewerEn: 'Li Na', email: 'carson.r@email.com' },
  { id: 'a3', name: 'Maria Gonzalez', typeKey: 'agency', state: 'FL', status: 'onboarded', progress: 10, reviewer: '王芳', reviewerEn: 'Wang Fang', email: 'maria.g@email.com' },
  { id: 'a4', name: 'David Thompson', typeKey: 'individual', state: 'NY', status: 'pendingInfo', progress: 5, reviewer: '张伟', reviewerEn: 'Zhang Wei', email: 'david.t@email.com' },
  { id: 'a5', name: 'Sarah Kim', typeKey: 'mga', state: 'WA', status: 'backgroundCheck', progress: 6, reviewer: '陈静', reviewerEn: 'Chen Jing', email: 'sarah.k@email.com' },
  { id: 'a6', name: 'James Miller', typeKey: 'brokerage', state: 'IL', status: 'signing', progress: 7, reviewer: '李娜', reviewerEn: 'Li Na', email: 'james.m@email.com' },
  { id: 'a7', name: 'Emily Chen', typeKey: 'individual', state: 'NJ', status: 'pendingApproval', progress: 4, reviewer: '王芳', reviewerEn: 'Wang Fang', email: 'emily.c@email.com' },
]

// ============ Tab 2 document review mock ============
type DocStatus = 'passed' | 'failed' | 'warning'
interface DocumentItem {
  id: string
  title: string
  titleSuffix?: string
  typeLabel: string
  typeLabelEn: string
  date: string
  size: string
  validUntil?: string
  status: DocStatus
  alertText?: string
  alertTextEn?: string
}
const MOCK_DOC_REVIEW: Array<{
  id: string
  applicant: Applicant
  documents: DocumentItem[]
}> = [
  {
    id: 'dr1',
    applicant: MOCK_APPLICANTS[0],
    documents: [
      { id: 'd1', title: 'NY Producer License', typeLabel: '保险执照', typeLabelEn: 'Insurance License', date: '2026-08-18', size: '220 KB', validUntil: '2027-09-30', status: 'passed' },
      { id: 'd2', title: 'E&O Certificate', titleSuffix: 'EXPIRED', typeLabel: 'E&O证书', typeLabelEn: 'E&O Certificate', date: '2026-08-18', size: '195 KB', validUntil: '2026-07-31', status: 'warning', alertText: '证书有效期至 2026-07-31，已过期，请上传有效证书。', alertTextEn: 'Certificate expired on 2026-07-31. Please upload a valid certificate.' },
      { id: 'd3', title: 'Background Check Authorization', typeLabel: '调查授权', typeLabelEn: 'Investigation Authorization', date: '2026-08-18', size: '60 KB', status: 'passed' },
      { id: 'd4', title: 'Government-issued ID', typeLabel: '身份证', typeLabelEn: 'Government ID', date: '2026-08-18', size: '85 KB', status: 'passed' },
      { id: 'd5', title: 'W-9 Form', titleSuffix: 'incorrect format', typeLabel: 'W-9表格', typeLabelEn: 'W-9 Form', date: '2026-08-18', size: '45 KB', status: 'failed', alertText: '使用了已废止的 2019 版本 W-9 表，请下载并提交 2024 年最新版本。', alertTextEn: 'The outdated 2019 revision of the W-9 form was used. Please download and submit the latest 2024 version.' },
    ],
  },
  {
    id: 'dr2',
    applicant: MOCK_APPLICANTS[3],
    documents: [
      { id: 'd1', title: 'CA Producer License', typeLabel: '保险执照', typeLabelEn: 'Insurance License', date: '2026-08-15', size: '198 KB', validUntil: '2027-05-20', status: 'passed' },
      { id: 'd2', title: 'Business License', typeLabel: '营业执照', typeLabelEn: 'Business License', date: '2026-08-15', size: '120 KB', status: 'passed' },
    ],
  },
]

// ============ Tab 3 compliance verification mock ============
type ComplianceStatus = 'passed' | 'pending' | 'failed'
interface ComplianceItem {
  id: string
  name: string
  nameEn: string
  applicantName: string
  status: ComplianceStatus
  checkedAt?: string
  detail?: string
  detailEn?: string
}
const MOCK_COMPLIANCE: ComplianceItem[] = [
  { id: 'c1', name: 'NIPR 背景调查', nameEn: 'NIPR Background Check', applicantName: 'Marcus Thompson', status: 'passed', checkedAt: '2026-08-20 14:32', detail: '已完成 NIPR 代理执照验证，无监管处罚记录。', detailEn: 'NIPR producer license verification completed. No regulatory disciplinary records.' },
  { id: 'c2', name: '信用记录检查', nameEn: 'Credit History Check', applicantName: 'Marcus Thompson', status: 'passed', checkedAt: '2026-08-20 14:45', detail: '信用评分 742，无重大逾期。', detailEn: 'Credit score 742, no major delinquencies.' },
  { id: 'c3', name: 'E&O 保险有效性验证', nameEn: 'E&O Insurance Validation', applicantName: 'Marcus Thompson', status: 'failed', checkedAt: '2026-08-21 09:12', detail: 'E&O 证书已于 2026-07-31 过期，请更新证书后重新提交。', detailEn: 'E&O certificate expired on 2026-07-31. Please renew the certificate and resubmit.' },
  { id: 'c4', name: '反洗钱 (AML) 筛查', nameEn: 'Anti-Money Laundering (AML) Screening', applicantName: 'Marcus Thompson', status: 'passed', checkedAt: '2026-08-20 14:58', detail: 'OFAC/SDN 清单扫描通过，无匹配记录。', detailEn: 'OFAC/SDN list screening passed. No matches found.' },
  { id: 'c5', name: '监管处罚记录', nameEn: 'Regulatory Disciplinary Records', applicantName: 'Marcus Thompson', status: 'passed', checkedAt: '2026-08-21 10:02', detail: '无监管处罚或吊销记录。', detailEn: 'No regulatory sanctions or revocation records.' },
]

// ============ Tab 4 contract signing mock ============
interface ContractItem {
  id: string
  applicantName: string
  type: string
  typeEn: string
  status: 'draft' | 'sent' | 'signed' | 'expired'
  sentAt?: string
  signedAt?: string
}
const MOCK_CONTRACTS: ContractItem[] = [
  { id: 'k1', applicantName: 'Jennifer Walsh', type: '2026 标准个人代理协议', typeEn: '2026 Standard Individual Producer Agreement', status: 'signed', signedAt: '2026-08-25' },
  { id: 'k2', applicantName: 'Carson Reed', type: '经纪机构框架协议', typeEn: 'Brokerage Framework Agreement', status: 'sent', sentAt: '2026-08-26' },
  { id: 'k3', applicantName: 'Marcus Thompson', type: '2026 标准个人代理协议', typeEn: '2026 Standard Individual Producer Agreement', status: 'sent', sentAt: '2026-08-27' },
  { id: 'k4', applicantName: 'Sarah Kim', type: 'MGA 授权协议', typeEn: 'MGA Authorization Agreement', status: 'draft' },
  { id: 'k5', applicantName: 'David Thompson', type: '2026 标准个人代理协议', typeEn: '2026 Standard Individual Producer Agreement', status: 'expired' },
  { id: 'k6', applicantName: 'James Miller', type: '经纪机构补充条款', typeEn: 'Brokerage Supplementary Clauses', status: 'sent', sentAt: '2026-08-28' },
]

// ============ Tab 5 account & training mock ============
interface TrainingCourse {
  id: string
  title: string
  titleEn: string
  category: string
  categoryEn: string
  duration: string
  durationEn: string
  completed?: boolean
  completedAt?: string
  score?: string
}
const MOCK_TRAINING_ACCOUNTS = [
  {
    id: 'ta1',
    applicantName: 'Jennifer Walsh',
    accountCreated: true,
    createdAt: '2026-08-22',
    trainingProgress: 2,
    courses: [
      { id: 'tc1', title: 'AML 反洗钱合规培训 2026', titleEn: 'AML Anti-Money-Laundering Compliance Training 2026', category: '合规必修', categoryEn: 'Compliance Required', duration: '45 分钟', durationEn: '45 min', completed: true, completedAt: '2026-08-23', score: '92' },
      { id: 'tc2', title: '财产险基础认证 P-1', titleEn: 'Property Insurance Fundamentals Certification P-1', category: '产品培训', categoryEn: 'Product Training', duration: '2 小时', durationEn: '2 hr', completed: true, completedAt: '2026-08-24', score: '88' },
      { id: 'tc3', title: '汽车险核保实务', titleEn: 'Auto Insurance Underwriting Essentials', category: '产品培训', categoryEn: 'Product Training', duration: '1.5 小时', durationEn: '1.5 hr' },
      { id: 'tc4', title: '续保与客户留存策略', titleEn: 'Renewal & Retention Strategies', category: '销售提升', categoryEn: 'Sales Enhancement', duration: '1 小时', durationEn: '1 hr' },
    ] as TrainingCourse[],
  },
]

// ============ Tab 6 rejection & supplement mock ============
interface RejectionItem {
  id: string
  applicantName: string
  reason: string
  reasonEn: string
  rejectedAt: string
  supplementRequired: string
  supplementRequiredEn: string
  dueDate: string
}
const MOCK_REJECTIONS: RejectionItem[] = [
  { id: 'r1', applicantName: 'Marcus Thompson', reason: 'E&O 保险证书已过期，证书有效期至 2026-07-31', reasonEn: 'E&O insurance certificate expired; valid through 2026-07-31', rejectedAt: '2026-08-21', supplementRequired: '更新后的 E&O Certificate（有效期不早于 2027-07-31）', supplementRequiredEn: 'Updated E&O Certificate (valid no earlier than 2027-07-31)', dueDate: '2026-09-05' },
  { id: 'r2', applicantName: 'David Thompson', reason: 'W-9 表格格式错误（提交了已废止的 2019 版本）', reasonEn: 'W-9 form format error (outdated 2019 revision submitted)', rejectedAt: '2026-08-20', supplementRequired: '2024 年最新版 W-9 Form', supplementRequiredEn: 'Latest 2024 revision of the W-9 Form', dueDate: '2026-09-03' },
  { id: 'r3', applicantName: 'Priya Nair', reason: '政府签发证件照片不清晰', reasonEn: 'Government-issued ID photo is blurry', rejectedAt: '2026-08-19', supplementRequired: '重新上传清晰的政府签发身份证件', supplementRequiredEn: 'Re-upload a clear government-issued ID', dueDate: '2026-09-02' },
]

// ============ Status badges (prototype ground truth: SOFT-FILL) ============
const STATUS_BADGE_STYLES: Record<ApplicantStatus, string> = {
  training:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]',
  docReview:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]',
  signing:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]',
  pendingApproval:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]',
  pendingInfo:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,59,48,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(192,57,43)]',
  backgroundCheck:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(123,63,202,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(123,63,202)]',
  onboarded:
    'inline-flex items-center gap-1 rounded-[6px] bg-[rgba(52,199,89,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(30,128,51)]',
}

const TOTAL_PROGRESS_STEPS = 10

/** Flow progress: DONE=20×20 green circle + 10×10 white ✓ / CURRENT=20×20 blue circle + 6×6 white dot / PENDING=20×20 light gray circle */
function ProgressSteps({ completed }: { completed: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: TOTAL_PROGRESS_STEPS }).map((_, i) => {
        const done = i < completed
        const current = i === completed
        return (
          <Fragment key={i}>
            {i > 0 && (
              <div
                className={`h-[2px] w-[12px] ${
                  i <= completed ? 'bg-[rgb(52,199,89)]' : 'bg-[rgb(229,231,239)]'
                }`}
              />
            )}
            {done ? (
              <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[rgb(52,199,89)]">
                <Check size={10} strokeWidth={2.5} className="text-white" />
              </div>
            ) : current ? (
              <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[rgb(0,88,188)]">
                <div className="h-[6px] w-[6px] rounded-full bg-white" />
              </div>
            ) : (
              <div className="h-[20px] w-[20px] shrink-0 rounded-full bg-[rgb(193,198,215)]" />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

/** Shared "avatar + name + sub-text" cell for applicants / reviewers (34×34 r=10 blue 8% + 13fw700 + 11#717786) */
function PersonCell({
  name,
  subText,
  showAvatar = true,
  avatarSize = 34,
}: {
  name: string
  subText?: string
  showAvatar?: boolean
  avatarSize?: number
}) {
  return (
    <div className="flex items-center gap-3">
      {showAvatar && (
        <div
          className="flex shrink-0 items-center justify-center rounded-[10px] bg-[rgba(0,88,188,0.08)]"
          style={{ width: avatarSize, height: avatarSize }}
        >
          <User size={Math.round(avatarSize * 0.44)} className="text-[rgb(24,28,35)]" />
        </div>
      )}
      <div>
        <div className="text-[13px] font-bold text-[rgb(24,28,35)]">{name}</div>
        {subText && (
          <div className="mt-0 text-[11px] text-[rgb(113,119,134)]">{subText}</div>
        )}
      </div>
    </div>
  )
}

// ============ Tab 2 document review: status badge ============
function DocStatusBadge({ status }: { status: DocStatus }) {
  const { t } = useTranslation('channel')
  if (status === 'passed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] bg-[rgba(52,199,89,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(30,128,51)]">
        <CircleCheck size={11} />
        {t('onboardingView.docStatus.passed')}
      </span>
    )
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]">
        <AlertCircle size={11} />
        {t('onboardingView.docStatus.warning')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,59,48,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(192,57,43)]">
      <XCircle size={11} />
      {t('onboardingView.docStatus.failed')}
    </span>
  )
}

// ============ Tab 4 contract status badge ============
function ContractStatusBadge({ status }: { status: ContractItem['status'] }) {
  const { t } = useTranslation('channel')
  const map: Record<ContractItem['status'], { cls: string; labelKey: string }> = {
    signed: { cls: 'bg-[rgba(52,199,89,0.12)] text-[rgb(30,128,51)]', labelKey: 'onboardingView.contractStatus.signed' },
    sent: { cls: 'bg-[rgba(255,159,10,0.12)] text-[rgb(176,96,0)]', labelKey: 'onboardingView.contractStatus.sent' },
    draft: { cls: 'bg-[rgba(0,0,0,0.06)] text-[rgb(113,119,134)]', labelKey: 'onboardingView.contractStatus.draft' },
    expired: { cls: 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]', labelKey: 'onboardingView.contractStatus.expired' },
  }
  const c = map[status]
  return (
    <span className={`inline-flex items-center rounded-[6px] px-[7px] py-[2px] text-[11px] font-bold ${c.cls}`}>
      {t(c.labelKey)}
    </span>
  )
}

// ============ Tab 3 compliance status badge ============
function ComplianceStatusBadge({ status }: { status: ComplianceStatus }) {
  const { t } = useTranslation('channel')
  if (status === 'passed') {
    return <span className="inline-flex rounded-[6px] bg-[rgba(52,199,89,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(30,128,51)]">{t('onboardingView.complianceStatus.passed')}</span>
  }
  if (status === 'pending') {
    return <span className="inline-flex rounded-[6px] bg-[rgba(123,63,202,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(123,63,202)]">{t('onboardingView.complianceStatus.pending')}</span>
  }
  return <span className="inline-flex rounded-[6px] bg-[rgba(255,59,48,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(192,57,43)]">{t('onboardingView.complianceStatus.failed')}</span>
}

// ============ Main component ============
export default function ChannelOnboardingView(_props: Props) {
  const { t, i18n } = useTranslation('channel')
  const isEn = i18n.language.startsWith('en')
  const [activeTab, setActiveTab] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [docReviewId, setDocReviewId] = useState('dr1')
  const supplementInputRef = useRef<HTMLInputElement>(null)

  const wizardTabs: Array<{
    id: number
    icon: ComponentType<{ size?: number | string; className?: string }>
    labelKey: string
    badge?: number
    badgeClass?: string
  }> = [
    { id: 1, icon: FileText, labelKey: 'onboardingView.tabs.overview' },
    { id: 2, icon: FileCheck2, labelKey: 'onboardingView.tabs.documents' },
    { id: 3, icon: ShieldCheck, labelKey: 'onboardingView.tabs.compliance' },
    { id: 4, icon: FileSignature, labelKey: 'onboardingView.tabs.contract', badge: 1, badgeClass: 'bg-[rgb(255,159,10)]' },
    { id: 5, icon: UserCog, labelKey: 'onboardingView.tabs.accountTraining' },
    { id: 6, icon: Undo2, labelKey: 'onboardingView.tabs.rejection', badge: 1, badgeClass: 'bg-[rgb(255,59,48)]' },
  ]

  const stats = [
    { value: '7', labelKey: 'onboardingView.stats.total', valueClass: 'text-[rgb(0,88,188)]' },
    { value: '5', labelKey: 'onboardingView.stats.inProgress', valueClass: 'text-[rgb(176,96,0)]' },
    { value: '1', labelKey: 'onboardingView.stats.onboarded', valueClass: 'text-[rgb(30,128,51)]' },
    { value: '1', labelKey: 'onboardingView.stats.pendingInfo', valueClass: 'text-[rgb(192,57,43)]' },
  ]

  const statusOptions: ApplicantStatus[] = [
    'docReview',
    'backgroundCheck',
    'signing',
    'pendingApproval',
    'training',
    'pendingInfo',
    'onboarded',
  ]

  const filteredApplicants = MOCK_APPLICANTS.filter((a) => {
    const q = searchQuery.trim().toLowerCase()
    const matchQuery = !q || a.name.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || a.status === statusFilter
    return matchQuery && matchStatus
  })

  // ============ Render ============
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF3FF] via-[#F8F9FE] to-white p-4 sm:p-8">
      {/* ===== Header ===== */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="leading-tight mb-0" style={{ fontSize: 21, fontWeight: 800, color: '#181C23', letterSpacing: '-0.3px' }}>{t('onboardingView.title')}</h1>
          <p className="mt-[3px] text-[13px] text-[rgb(113,119,134)] whitespace-nowrap">{t('onboardingView.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <span className="flex items-center gap-[6px] rounded-[9px] border border-[rgba(255,59,48,0.25)] bg-[rgba(255,59,48,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(192,57,43)] whitespace-nowrap">
            <AlertTriangle size={16} />
            {t('onboardingView.badgePendingInfo', { n: 1 })}
          </span>
          <span className="flex items-center gap-[6px] rounded-[9px] border border-[rgba(123,63,202,0.2)] bg-[rgba(123,63,202,0.08)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(123,63,202)] whitespace-nowrap">
            <Clock size={16} />
            {t('onboardingView.badgeBackgroundCheck', { n: 1 })}
          </span>
          <button type="button" className="inline-flex items-center gap-2 rounded-[10px] bg-[rgb(0,88,188)] px-4 py-[7px] text-[13px] font-bold text-white transition-opacity hover:opacity-90">
            <Plus size={14} strokeWidth={2.5} />
            {t('onboardingView.actions.newApplication')}
          </button>
        </div>
      </div>

      {/* ===== 6-step wizard tabs ===== */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex flex-wrap items-end pb-0">
          {wizardTabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-[10px] rounded-b-none px-4 py-2 text-left text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? 'border-0 bg-[rgba(0,88,188,0.08)] text-[rgb(0,88,188)] font-bold'
                    : 'border-0 bg-transparent text-[rgb(113,119,134)] font-medium hover:text-[rgb(24,28,35)]'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex items-center gap-1.5">
                  {t(tab.labelKey)}
                  {tab.badge != null && (
                    <span
                      className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[8px] px-[5px] py-[1px] text-[10px] font-bold leading-none text-white ${tab.badgeClass ?? 'bg-[rgb(255,59,48)]'}`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ===== Tab 1: application overview (done) ===== */}
      {activeTab === 1 && (
        <>
          <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4">
            {stats.map((stat) => (
              <div key={stat.labelKey} className="shrink-0">
                <div className={`text-[22px] font-extrabold tabular-nums tracking-tight leading-none ${stat.valueClass}`}>{stat.value}</div>
                <div className="mt-[2px] text-[11.5px] whitespace-nowrap text-[rgb(113,119,134)] font-normal">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative shrink-0 w-[230px]">
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[rgb(113,119,134)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('onboardingView.searchPlaceholder')}
                className="w-full rounded-[8px] border border-[rgba(193,198,215,0.8)] bg-white/70 py-2 pl-[30px] pr-3 text-[13px] text-[rgb(24,28,35)] placeholder-[rgb(113,119,134)] focus:border-[rgb(0,88,188)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,88,188,0.1)]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-[130px] shrink-0 rounded-[8px] border border-[rgba(193,198,215,0.8)] bg-white/70 px-3 pr-7 py-2 text-[12.5px] text-[rgb(24,28,35)] focus:border-[rgb(0,88,188)] focus:outline-none focus:ring-2 focus:ring-[rgba(0,88,188,0.1)]"
            >
              <option value="all">{t('onboardingView.allStatuses')}</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{t(`onboardingView.status.${s}`)}</option>
              ))}
            </select>
          </div>
          <div className="rounded-[14px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(249,249,255,0.7)] border-b border-[rgba(193,198,215,0.5)]">
                    <th className="px-[14px] py-[10px] text-left text-[11px] font-semibold text-[rgb(113,119,134)] align-middle">{t('onboardingView.table.applicant')}</th>
                    <th className="px-[14px] py-[10px] text-left text-[11px] font-semibold text-[rgb(113,119,134)] align-middle">{t('onboardingView.table.status')}</th>
                    <th className="px-[14px] py-[10px] text-left text-[11px] font-semibold text-[rgb(113,119,134)] align-middle">{t('onboardingView.table.progress')}</th>
                    <th className="px-[14px] py-[10px] text-left text-[11px] font-semibold text-[rgb(113,119,134)] align-middle">{t('onboardingView.table.reviewer')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((applicant, idx) => (
                    <tr key={applicant.id} className={`border-b border-[rgba(193,198,215,0.25)] ${idx === filteredApplicants.length - 1 ? 'last:border-b-0' : ''}`}>
                      <td className="px-[14px] py-[12px] align-middle">
                        <PersonCell name={applicant.name} subText={`${t(`onboardingView.applicantType.${applicant.typeKey}`)} · ${applicant.state}`} />
                      </td>
                      <td className="px-[14px] py-[12px] align-middle">
                        <span className={STATUS_BADGE_STYLES[applicant.status]}>{t(`onboardingView.status.${applicant.status}`)}</span>
                      </td>
                      <td className="px-[14px] py-[12px] align-middle"><ProgressSteps completed={applicant.progress} /></td>
                      <td className="px-[14px] py-[12px] align-middle">
                        <PersonCell name={isEn ? applicant.reviewerEn : applicant.reviewer} subText={t('onboardingView.reviewerRole')} />
                      </td>
                    </tr>
                  ))}
                  {filteredApplicants.length === 0 && (
                    <tr><td colSpan={4} className="px-[14px] py-12 text-center text-[13px] text-[rgb(113,119,134)]">{t('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===== Tab 2: document review ===== */}
      {activeTab === 2 && (() => {
        const current = MOCK_DOC_REVIEW.find((d) => d.id === docReviewId) ?? MOCK_DOC_REVIEW[0]
        return (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: applicant selection list */}
            <aside className="lg:w-[240px] shrink-0">
              <div className="mb-2 text-[12px] font-semibold text-[rgb(113,119,134)] pl-1">{t('onboardingView.docReview.selectApplication')}</div>
              <div className="space-y-2">
                {MOCK_DOC_REVIEW.map((item) => {
                  const active = item.id === docReviewId
                  const a = item.applicant
                  const badgeCls = STATUS_BADGE_STYLES[a.status]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDocReviewId(item.id)}
                      className={`flex w-full flex-col gap-1 rounded-[10px] px-[14px] py-[12px] text-left transition-colors ${
                        active
                          ? 'bg-[rgba(0,88,188,0.05)] border border-[rgb(0,88,188)]'
                          : 'bg-[rgba(255,255,255,0.45)] border border-[rgba(193,198,215,0.3)] hover:bg-[rgba(255,255,255,0.7)]'
                      }`}
                    >
                      <div className="text-[12.5px] font-semibold text-[rgb(24,28,35)] leading-tight">{a.name}</div>
                      <span className={`w-fit ${badgeCls}`}>{t(`onboardingView.status.${a.status}`)}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            {/* Right: details */}
            <section className="flex-1 min-w-0">
              {/* Top: applicant + 2 primary buttons */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="text-[15px] font-bold text-[rgb(24,28,35)]">{current.applicant.name}</div>
                  <div className="mt-[3px] text-[12px] text-[rgb(113,119,134)]">
                    {t(`onboardingView.applicantType.${current.applicant.typeKey}`)} · {current.applicant.state} · {current.applicant.email}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="inline-flex items-center gap-2 rounded-[8px] bg-[rgb(30,128,51)] px-[14px] py-[13px] text-[12.5px] font-bold text-white transition-opacity hover:opacity-90">
                    <Check size={14} strokeWidth={3} />
                    {t('onboardingView.docReview.approve')}
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 rounded-[8px] border border-[rgba(255,59,48,0.25)] bg-[rgba(255,59,48,0.1)] px-[14px] py-[13px] text-[12.5px] font-bold text-[rgb(192,57,43)] transition-opacity hover:opacity-90">
                    <AlertTriangle size={14} />
                    {t('onboardingView.docReview.requestSupplement')}
                  </button>
                </div>
              </div>

              {/* Document cards (prototype width 342 → container-adaptive while keeping r14 + px16py14 + transparent skeleton) */}
              <div className="space-y-4">
                {current.documents.map((doc) => {
                  const isProblem = doc.status !== 'passed'
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-[14px] px-[16px] py-[14px] ${
                        isProblem
                          ? 'border border-[rgba(255,59,48,0.3)]'
                          : 'border border-[rgba(193,198,215,0.3)]'
                      }`}
                    >
                      {/* Top: file name + type tag + status badge + icon buttons */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <FileIcon size={15} className="shrink-0 text-[rgb(113,119,134)]" />
                            <span className="text-[13.5px] font-bold text-[rgb(24,28,35)] truncate">{doc.title}</span>
                            {doc.titleSuffix && (
                              <span className="text-[11px] font-bold text-[rgb(192,57,43)] ml-[-2px]">{doc.titleSuffix}</span>
                            )}
                            <span className="inline-flex items-center rounded-[6px] bg-[rgba(0,88,188,0.08)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(74,106,156)]">
                              {isEn ? doc.typeLabelEn : doc.typeLabel}
                            </span>
                          </div>
                          <div className="mt-[5px] text-[11px] text-[rgb(113,119,134)]">
                            {doc.date} · {doc.size}
                            {doc.validUntil && <> · {t('onboardingView.docReview.validUntil')} {doc.validUntil}</>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <DocStatusBadge status={doc.status} />
                          <div className="flex items-center gap-1 text-[rgb(113,119,134)]">
                            <button type="button" className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[6px] hover:bg-[rgba(0,0,0,0.04)]" title={t('onboardingView.docReview.preview')}>
                              <Eye size={14} />
                            </button>
                            <button type="button" className="inline-flex h-[28px] w-[28px] items-center justify-center rounded-[6px] hover:bg-[rgba(0,0,0,0.04)]" title={t('onboardingView.docReview.download')}>
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: expiry/error alert bar + supplement upload button */}
                      {isProblem && (
                        <div className="mt-[12px] flex items-center justify-between gap-3">
                          <div className="flex items-start gap-2 text-[11px] text-[rgb(192,57,43)]">
                            <AlertTriangle size={13} className="mt-[1px] shrink-0" />
                            <span>{isEn && doc.alertTextEn ? doc.alertTextEn : doc.alertText}</span>
                          </div>
                          <button type="button" onClick={() => supplementInputRef.current?.click()} className="inline-flex shrink-0 items-center gap-1 rounded-[7px] border border-[rgba(0,88,188,0.2)] bg-[rgba(0,88,188,0.1)] px-[10px] py-[5px] text-[11.5px] font-bold text-[rgb(0,88,188)]">
                            <Plus size={12} strokeWidth={3} />
                            {t('onboardingView.docReview.supplementUpload')}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <input ref={supplementInputRef} type="file" className="hidden" />
            </section>
          </div>
        )
      })()}

      {/* ===== Tab 3: compliance verification ===== */}
      {activeTab === 3 && (
        <div className="space-y-3 max-w-[571px]">
          {MOCK_COMPLIANCE.map((item) => (
            <div
              key={item.id}
              className={`rounded-[14px] px-[18px] py-[16px] ${
                item.status === 'passed' ? 'bg-[rgba(0,88,188,0.03)]' : 'bg-[rgba(0,0,0,0)]'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[rgb(24,28,35)]">{isEn ? item.nameEn : item.name}</div>
                  {item.checkedAt && <div className="mt-[3px] text-[11px] text-[rgb(113,119,134)]">{item.checkedAt}</div>}
                </div>
                <ComplianceStatusBadge status={item.status} />
              </div>
              {item.detail && (
                <div className="mt-[10px] text-[12px] leading-snug text-[rgb(113,119,134)]">{isEn && item.detailEn ? item.detailEn : item.detail}</div>
              )}
              <div className="mt-[8px] text-[11px] text-[rgb(0,88,188)]">{item.applicantName}</div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Tab 4: contract signing ===== */}
      {activeTab === 4 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {MOCK_CONTRACTS.map((c) => (
            <div key={c.id} className="rounded-[14px] px-[16px] py-[14px]">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold text-[rgb(24,28,35)] truncate">{isEn ? c.typeEn : c.type}</div>
                  <div className="mt-[3px] text-[11px] text-[rgb(113,119,134)]">{c.applicantName}</div>
                </div>
                <ContractStatusBadge status={c.status} />
              </div>
              <div className="text-[11px] text-[rgb(113,119,134)] space-y-[4px]">
                {c.sentAt && <div>{t('onboardingView.contract.sentAtLabel')} {c.sentAt}</div>}
                {c.signedAt && <div className="text-[rgb(30,128,51)]">{t('onboardingView.contract.signedAtLabel')} {c.signedAt}</div>}
                {c.status === 'draft' && <div className="text-[rgb(113,119,134)]">{t('onboardingView.contract.draftPending')}</div>}
                {c.status === 'expired' && <div className="text-[rgb(192,57,43)]">{t('onboardingView.contract.expiredResend')}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Tab 5: account & training ===== */}
      {activeTab === 5 && (
        <div className="space-y-5 max-w-[571px]">
          {MOCK_TRAINING_ACCOUNTS.map((acc) => (
            <div key={acc.id}>
              {/* Account status card */}
              <div className="rounded-[14px] px-[18px] py-[16px] mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13.5px] font-bold text-[rgb(24,28,35)]">{t('onboardingView.account.statusTitle')}</div>
                    <div className="mt-[3px] text-[11px] text-[rgb(113,119,134)]">{acc.applicantName}</div>
                  </div>
                  {acc.accountCreated ? (
                    <span className="inline-flex items-center gap-1 rounded-[6px] bg-[rgba(52,199,89,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(30,128,51)]">
                      <CircleCheck size={11} />
                      {t('onboardingView.account.enabled')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-[6px] bg-[rgba(255,159,10,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(176,96,0)]">
                      <Clock size={11} />
                      {t('onboardingView.account.provisioning')}
                    </span>
                  )}
                </div>
                {acc.createdAt && <div className="mt-[10px] text-[11px] text-[rgb(113,119,134)]">{t('onboardingView.account.createdAtLabel')} {acc.createdAt}</div>}
              </div>

              {/* Training progress */}
              <div className="rounded-[14px] px-[18px] py-[16px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[13.5px] font-bold text-[rgb(24,28,35)]">{t('onboardingView.training.title')}</div>
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('onboardingView.training.progressOf', { done: acc.trainingProgress, total: acc.courses.length })}</div>
                </div>
                <div className="space-y-2">
                  {acc.courses.map((course) => (
                    <div key={course.id} className={`flex items-center justify-between gap-3 rounded-[10px] px-[12px] py-[10px] ${course.completed ? 'bg-[rgba(52,199,89,0.06)]' : 'bg-[rgba(255,255,255,0.3)]'}`}>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-[rgb(24,28,35)] truncate">{isEn ? course.titleEn : course.title}</div>
                        <div className="mt-[2px] text-[11px] text-[rgb(113,119,134)]">{isEn ? course.categoryEn : course.category} · {isEn ? course.durationEn : course.duration}</div>
                      </div>
                      {course.completed ? (
                        <span className="inline-flex items-center rounded-[6px] bg-[rgba(52,199,89,0.12)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(30,128,51)] shrink-0">
                          {t('onboardingView.training.score', { score: course.score })}
                        </span>
                      ) : (
                        <button type="button" className="shrink-0 rounded-[6px] border border-[rgba(0,88,188,0.2)] bg-[rgba(0,88,188,0.1)] px-[10px] py-[3px] text-[11px] font-bold text-[rgb(0,88,188)]">
                          {t('onboardingView.training.start')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Tab 6: rejection & supplement ===== */}
      {activeTab === 6 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {MOCK_REJECTIONS.map((r) => (
            <div key={r.id} className="rounded-[14px] border border-[rgba(255,59,48,0.2)] px-[16px] py-[14px]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle size={13} className="text-[rgb(192,57,43)] shrink-0" />
                  <span className="text-[13px] font-bold text-[rgb(24,28,35)] truncate">{r.applicantName}</span>
                </div>
                <span className="inline-flex items-center rounded-[6px] bg-[rgba(255,59,48,0.1)] px-[7px] py-[2px] text-[11px] font-bold text-[rgb(192,57,43)] shrink-0">
                  {t('onboardingView.rejection.pendingBadge')}
                </span>
              </div>
              <div className="text-[12px] leading-snug text-[rgb(113,119,134)] mb-2">{isEn ? r.reasonEn : r.reason}</div>
              <div className="text-[11px] text-[rgb(113,119,134)] space-y-[3px]">
                <div>{t('onboardingView.rejection.rejectedAtLabel')} {r.rejectedAt}</div>
                <div>{t('onboardingView.rejection.supplementRequiredLabel')} {isEn ? r.supplementRequiredEn : r.supplementRequired}</div>
                <div className="text-[rgb(192,57,43)] font-semibold">{t('onboardingView.rejection.dueDateLabel')} {r.dueDate}</div>
              </div>
              <div className="mt-[10px] flex items-center gap-2">
                <button type="button" className="inline-flex items-center gap-1 rounded-[7px] bg-[rgb(0,88,188)] px-[10px] py-[4px] text-[11.5px] font-bold text-white">
                  <Plus size={11} strokeWidth={3} />
                  {t('onboardingView.rejection.supplementNow')}
                </button>
                <button type="button" className="inline-flex items-center rounded-[7px] border border-[rgba(193,198,215,0.5)] bg-white/60 px-[10px] py-[4px] text-[11.5px] font-semibold text-[rgb(113,119,134)] hover:bg-white">
                  {t('onboardingView.rejection.viewDetail')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
