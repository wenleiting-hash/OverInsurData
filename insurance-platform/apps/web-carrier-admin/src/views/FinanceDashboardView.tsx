import { useRef, useState } from 'react'
import type { ComponentType, CSSProperties, ReactNode } from 'react'
import {
  Upload,
  FileText,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Search,
  RefreshCw,
  FileSpreadsheet,
  File,
  Zap,
  Settings,
  Edit2,
  Plus,
  X,
  Check,
  ChevronDown,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ViewId } from '@/App'
import {
  useFinanceBills, useBillLines, useDiffs, useSettlementConfigs,
  useSettlementHistory, usePremiumRecords, usePremiumReconciliation,
} from '@/services/financeService'

// ── Inline types (migrated from financeData.ts) ──
type BillImportStatus = 'pending-parse' | 'parsed' | 'reconciled' | 'exception' | 'settled' | 'archived'
type MatchStatus = 'matched' | 'unmatched' | 'amount-diff' | 'rate-diff' | 'duplicate'
type DiffType = 'rate-mismatch' | 'amount-mismatch' | 'missing-policy' | 'duplicate' | 'missing-in-bill'
// 对账差异状态。本系统没有任何审批流程：'under-review' 是后端 finance.service 返回的契约值，
// 语义为「差异正在核查处理中」，UI 文案统一走 financeSettlement.diffTab.dsReview（处理中 / Processing）。
type DiffStatus = 'open' | 'under-review' | 'accepted' | 'disputed' | 'adjusted' | 'waived'
type CycleFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'custom'
type SettlementMethod = 'wire-transfer' | 'ach' | 'check' | 'offset'
type PremiumDiffType = 'missing-remittance' | 'over-remittance' | 'rate-error' | 'cancellation-adj' | 'endorsement-adj'
type PremiumRecStatus = 'matched' | 'exception' | 'adjusted' | 'pending'

interface SettlementCycleConfig {
  id: string; insurerId: string; insurerName: string; insurerShort: string;
  frequency: CycleFrequency; cutoffDay: number; paymentDueDays: number;
  method: SettlementMethod; currency: string; minSettleAmount: number;
  autoReconcile: boolean; autoSettle: boolean; notifyDaysBefore: number;
  bankAccount?: string; contactEmail: string; nextDueDate: string;
  nextDueAmount?: number; ytdSettled: number;
}

/**
 * 财务与结算管理视图（对齐 Figma 原型）
 * 佣金账单导入解析、对账差异处理、结算周期配置与保费核对
 */
interface Props {
  navigateTo: (view: ViewId) => void
}

type BillStatus = 'toParse' | 'parsed' | 'reconciled' | 'hasDiff' | 'settled'
type StatusFilter = 'all' | BillStatus

// 数据态（pending-parse / exception）→ 展示态（toParse / hasDiff）
const DISPLAY_STATUS: Record<string, BillStatus> = {
  'pending-parse': 'toParse',
  parsed: 'parsed',
  reconciled: 'reconciled',
  exception: 'hasDiff',
  settled: 'settled',
  archived: 'settled',
}

// 状态徽章样式（对齐 Figma 原型 ground truth：SOFT-FILL 淡透明底 + 无描边 + 圆角6px px-8 py-2）
// 颜色来源：getComputedStyle 原型 DOM 精确值（cell 68）
const STATUS_STYLE: Record<BillStatus, string> = {
  // 待解析：灰底 15% + 深灰字
  toParse:
    'bg-[rgba(180,180,180,0.15)] text-[rgb(113,119,134)]',
  // 已解析：琥珀 10% + 深琥珀字
  parsed:
    'bg-[rgba(255,159,10,0.1)] text-[rgb(176,96,0)]',
  // 已对账：蓝 10% + 深蓝字
  reconciled:
    'bg-[rgba(0,122,255,0.1)] text-[rgb(0,93,199)]',
  // 存在差异：红 10% + 深红字
  hasDiff:
    'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]',
  // 已结算：绿 10% + 深绿字
  settled:
    'bg-[rgba(52,199,89,0.1)] text-[rgb(30,128,51)]',
}

// 差异状态徽章（对齐原型 DIFF_STATUS_STYLE）
// 本系统没有任何审批流程，这些状态只是对账差异的处理进度，不是审批结论。
const DIFF_STATUS_CLS: Record<string, string> = {
  open: 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]',
  'under-review': 'bg-[rgba(0,122,255,0.1)] text-[rgb(0,93,199)]',
  accepted: 'bg-[rgba(52,199,89,0.1)] text-[rgb(30,128,51)]',
  disputed: 'bg-[rgba(255,159,10,0.1)] text-[rgb(176,96,0)]',
  adjusted: 'bg-[rgba(130,80,255,0.1)] text-[rgb(123,63,202)]',
  waived: 'bg-[rgba(180,180,180,0.15)] text-[rgb(102,102,102)]',
}

const DIFF_STATUS_LABEL: Record<string, string> = {
  open: 'financeSettlement.diffTab.dsOpen',
  'under-review': 'financeSettlement.diffTab.dsReview',
  accepted: 'financeSettlement.diffTab.dsAccepted',
  disputed: 'financeSettlement.diffTab.dsDisputed',
  adjusted: 'financeSettlement.diffTab.dsAdjusted',
  waived: 'financeSettlement.diffTab.dsWaived',
}

const DIFF_TYPE_LABEL: Record<string, string> = {
  'rate-mismatch': 'financeSettlement.parseTab.matchStatus.rateDiff',
  'amount-mismatch': 'financeSettlement.parseTab.matchStatus.amountDiff',
  'missing-policy': 'financeSettlement.diffTab.dtMissingPolicy',
  duplicate: 'financeSettlement.parseTab.matchStatus.duplicate',
  'missing-in-bill': 'financeSettlement.diffTab.dtMissingInBill',
}

// 解析行匹配状态徽章（对齐原型 matchStyle）
const MATCH_STATUS_CLS: Record<string, string> = {
  matched: 'bg-[rgba(52,199,89,0.1)] text-[rgb(30,128,51)]',
  unmatched: 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]',
  'rate-diff': 'bg-[rgba(255,159,10,0.1)] text-[rgb(176,96,0)]',
  'amount-diff': 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]',
  duplicate: 'bg-[rgba(130,80,255,0.1)] text-[rgb(123,63,202)]',
}

const MATCH_STATUS_LABEL: Record<string, string> = {
  matched: 'financeSettlement.parseTab.matchStatus.matched',
  unmatched: 'financeSettlement.parseTab.matchStatus.unmatched',
  'rate-diff': 'financeSettlement.parseTab.matchStatus.rateDiff',
  'amount-diff': 'financeSettlement.parseTab.matchStatus.amountDiff',
  duplicate: 'financeSettlement.parseTab.matchStatus.duplicate',
}

// 保费对账状态徽章
const PREMIUM_STATUS_CLS: Record<string, string> = {
  matched: 'bg-[rgba(52,199,89,0.1)] text-[rgb(30,128,51)]',
  exception: 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]',
  adjusted: 'bg-[rgba(130,80,255,0.1)] text-[rgb(123,63,202)]',
  pending: 'bg-[rgba(255,159,10,0.1)] text-[rgb(176,96,0)]',
}

const PREMIUM_STATUS_LABEL: Record<string, string> = {
  matched: 'financeSettlement.parseTab.matchStatus.matched',
  exception: 'financeSettlement.premiumTab.psException',
  adjusted: 'financeSettlement.diffTab.dsAdjusted',
  pending: 'financeSettlement.premiumTab.psPending',
}

const PREMIUM_DIFF_LABEL: Record<string, string> = {
  'missing-remittance': 'financeSettlement.premiumTab.pdtMissing',
  'over-remittance': 'financeSettlement.premiumTab.pdtOver',
  'rate-error': 'financeSettlement.premiumTab.pdtRateError',
  'cancellation-adj': 'financeSettlement.premiumTab.pdtCancellation',
  'endorsement-adj': 'financeSettlement.premiumTab.pdtEndorsement',
}

const FREQ_LABEL: Record<string, string> = {
  monthly: 'financeSettlement.cycleTab.freqMonthly',
  quarterly: 'financeSettlement.cycleTab.freqQuarterly',
  'semi-annual': 'financeSettlement.cycleTab.freqSemiAnnual',
  annual: 'financeSettlement.cycleTab.freqAnnual',
  custom: 'financeSettlement.cycleTab.freqCustom',
}

const METHOD_LABEL: Record<string, string> = {
  'wire-transfer': 'financeSettlement.cycleTab.methodWire',
  ach: 'financeSettlement.cycleTab.methodAch',
  check: 'financeSettlement.cycleTab.methodCheck',
  offset: 'financeSettlement.cycleTab.methodOffset',
}

// 新增结算配置草稿（编辑面板复用同一表单）
const NEW_CYCLE_DRAFT: SettlementCycleConfig = {
  id: 'new',
  insurerId: '',
  insurerName: '',
  insurerShort: '',
  frequency: 'monthly',
  cutoffDay: 15,
  paymentDueDays: 30,
  method: 'wire-transfer',
  currency: 'USD',
  minSettleAmount: 1000,
  autoReconcile: false,
  autoSettle: false,
  notifyDaysBefore: 5,
  contactEmail: '',
  nextDueDate: '',
  ytdSettled: 0,
}

function fmt(n: number | undefined | null) {
  return '$' + (n ?? 0).toLocaleString('en-US')
}

// SOFT-FILL 软底徽章（对齐原型 Badge）
function Badge({ cls, children }: { cls: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-[6px] px-2 py-[2px] text-[11.5px] font-semibold ${cls}`}>
      {children}
    </span>
  )
}

// 白底卡片容器（对齐原型 glass-card：bg=rgba(255,255,255,0.95) border=rgba(193,198,215,0.42) 无阴影 r=14px）
function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`rounded-[14px] border border-[rgba(193,198,215,0.42)] bg-[rgba(255,255,255,0.95)] ${className}`} style={style}>{children}</div>
}

// KPI 卡片色调常量（对齐原型 V2：8% 不透明度背景 + 13.3% 不透明度边框）
const TINT: Record<string, { bg: string; bd: string }> = {
  blue:   { bg: 'rgba(0,88,188,0.08)',   bd: '1px solid rgba(0,88,188,0.133)' },
  green:  { bg: 'rgba(52,199,89,0.08)',  bd: '1px solid rgba(30,128,51,0.133)' },
  red:    { bg: 'rgba(255,59,48,0.08)',  bd: '1px solid rgba(192,57,43,0.133)' },
  orange: { bg: 'rgba(255,159,10,0.08)', bd: '1px solid rgba(176,96,0,0.133)' },
  purple: { bg: 'rgba(123,63,202,0.08)', bd: '1px solid rgba(123,63,202,0.133)' },
}

// 裸 KPI（与页面顶部统计同款：标签 11px 灰 + 数值 22px 粗）
function Kpi({ label, value, valueCls = 'text-gray-900' }: { label: string; value: string; valueCls?: string }) {
  return (
    <div className="shrink-0">
      <div className="text-[11px] whitespace-nowrap text-[rgb(113,119,134)] font-normal">{label}</div>
      <div className={`mt-0 text-[22px] font-bold tabular-nums tracking-tight leading-none ${valueCls}`}>{value}</div>
    </div>
  )
}

const kpiValueCls: Record<string, string> = {
  gray: 'text-gray-900',
  red: 'text-red-500',
  blue: 'text-blue-600',
  green: 'text-green-600',
  amber: 'text-[rgb(176,96,0)]',
  purple: 'text-[rgb(123,63,202)]',
}

// 表格/表单通用类
const INPUT_CLS =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[rgb(0,88,188)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[rgb(0,76,162)] disabled:cursor-not-allowed disabled:opacity-50'
const BTN_SOFT_BLUE =
  'inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(0,88,188,0.2)] bg-[rgba(0,88,188,0.08)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(0,88,188)] transition-colors hover:bg-[rgba(0,88,188,0.14)]'

// 文件类型图标颜色（对齐原型蓝色文件夹图标）
function FileTypeIcon({ ext }: { ext: string }) {
  const e = ext.toLowerCase()
  if (e === 'csv') return <FileSpreadsheet size={18} className="shrink-0 text-blue-500" />
  if (e === 'xlsx' || e === 'xls') return <FileSpreadsheet size={18} className="shrink-0 text-green-600" />
  if (e === 'pdf') return <FileText size={18} className="shrink-0 text-red-500" />
  if (e === 'edi') return <File size={18} className="shrink-0 text-purple-500" />
  return <File size={18} className="shrink-0 text-blue-500" />
}

function extOf(name: string | undefined | null) {
  if (!name) return '';
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i + 1) : ''
}

// ── Tab 1 — 账单导入 ─────────────────────────────────────────────────────────

function BillImportTab({ onSelectBill }: { onSelectBill: (id: string) => void }) {
  const { t } = useTranslation('finance')
  const { data: billsRes } = useFinanceBills()
  const commissionBills: any[] = billsRes?.data ?? []
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const doUpload = () => {
    if (uploading) return
    setUploading(true)
    window.setTimeout(() => {
      setUploading(false)
      setUploadDone(true)
      window.setTimeout(() => setUploadDone(false), 3000)
    }, 2000)
  }

  const filterChips: Array<{ key: StatusFilter; labelKey: string }> = [
    { key: 'all', labelKey: 'financeSettlement.filters.all' },
    { key: 'toParse', labelKey: 'financeSettlement.filters.toParse' },
    { key: 'parsed', labelKey: 'financeSettlement.filters.parsed' },
    { key: 'reconciled', labelKey: 'financeSettlement.filters.reconciled' },
    { key: 'hasDiff', labelKey: 'financeSettlement.filters.hasDiff' },
    { key: 'settled', labelKey: 'financeSettlement.filters.settled' },
  ]

  const filteredBills = commissionBills.filter((b) => {
    const ds = DISPLAY_STATUS[b.status]
    const byStatus = statusFilter === 'all' || ds === statusFilter
    const q = searchQuery.trim().toLowerCase()
    const byQuery =
      !q ||
      b.fileName?.toLowerCase().includes(q) ||
      b.insurerShort?.toLowerCase().includes(q) ||
      b.period?.toLowerCase().includes(q)
    return byStatus && byQuery
  })

  return (
    <>
      {/* 拖拽上传区 — ground truth：dashed 2px + rgba(193,198,215,0.5) + r=14px + bg=rgba(255,255,255,0.4) + py=24 px=20 */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          doUpload()
        }}
        onClick={() => fileRef.current?.click()}
        className={`mb-8 rounded-[14px] border-[2px] border-dashed px-5 py-6 text-center transition-colors ${
          dragging
            ? 'cursor-pointer border-[rgb(0,88,188)] bg-[rgba(0,88,188,0.04)]'
            : 'cursor-pointer border-[rgba(193,198,215,0.5)] bg-white/40 hover:bg-white/60'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.edi"
          className="hidden"
          onChange={doUpload}
        />
        {uploading ? (
          <>
            <Loader2 size={32} className="mx-auto mb-4 animate-spin text-[rgb(0,88,188)]" />
            <p className="text-sm font-semibold text-[rgb(0,88,188)]">{t('financeSettlement.upload.uploading')}</p>
          </>
        ) : uploadDone ? (
          <>
            <CheckCircle2 size={32} className="mx-auto mb-4 text-green-600" />
            <p className="text-sm font-semibold text-green-600">{t('financeSettlement.upload.uploadDone')}</p>
          </>
        ) : (
          <>
            <Upload size={32} className="mx-auto mb-4 text-gray-400" />
            <p className="text-sm sm:text-base text-gray-700">
              {t('financeSettlement.upload.dragHere')}{' '}
              <span className="cursor-pointer font-medium text-blue-600 hover:underline">
                {t('financeSettlement.upload.chooseFile')}
              </span>
            </p>
            <p className="mt-2 text-xs sm:text-sm text-gray-400">{t('financeSettlement.upload.formats')}</p>
          </>
        )}
      </div>

      {/* 筛选 chips + 右侧搜索框 — ground truth：chips r=8px；激活=蓝10%底 + #0058BC 描边 + 蓝文字 fw600 shadow-none；非激活=白半透 + rgba(193,198,215,0.4)；统一 px=12 py=5 fs=12px */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => {
            const active = statusFilter === chip.key
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={`rounded-[8px] px-3 py-[5px] text-[12px] whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'border border-[rgb(0,88,188)] bg-[rgba(0,88,188,0.1)] text-[rgb(0,88,188)] font-semibold shadow-none'
                    : 'border border-[rgba(193,198,215,0.4)] bg-white/50 text-[rgb(113,119,134)] hover:bg-white hover:border-[rgba(193,198,215,0.7)]'
                }`}
              >
                {t(chip.labelKey)}
              </button>
            )
          })}
        </div>
        <div className="relative w-full sm:w-[260px] sm:max-w-[360px] shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('financeSettlement.searchPlaceholder')}
            className="w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* 账单表格 */}
      <div className="overflow-hidden rounded-[14px] border border-[rgba(193,198,215,0.42)] bg-[rgba(255,255,255,0.95)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(246,248,255,0.9)]">
              <tr>
                <th className="px-5 sm:px-6 py-3.5 text-left text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.fileName')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.carrier')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.period')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.status')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.policyCount')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] sm:text-xs font-semibold text-blue-600 whitespace-nowrap">
                  {t('financeSettlement.table.totalPremium')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] sm:text-xs font-semibold text-blue-600 whitespace-nowrap">
                  {t('financeSettlement.table.receivableCommission')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.diffs')}
                </th>
                <th className="px-4 sm:px-6 py-3.5 text-center text-[11px] sm:text-xs font-medium text-gray-500 whitespace-nowrap">
                  {t('financeSettlement.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.map((bill, idx) => {
                const ds = DISPLAY_STATUS[bill.status]
                const showReconcile = ds === 'hasDiff' || ds === 'parsed'
                return (
                  <tr
                    key={bill.id}
                    className="cursor-pointer transition-colors hover:bg-[rgba(246,248,255,0.55)]"
                    style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' }}
                    onClick={() => onSelectBill(bill.id)}
                  >
                    <td className="px-5 sm:px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FileTypeIcon ext={extOf(bill.fileName)} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{bill.fileName ?? '—'}</div>
                          <div className="mt-0.5 text-[11px] sm:text-xs text-gray-400 whitespace-nowrap">
                            {bill.fileFormat} · {bill.fileSize} · {(bill.importDate ?? '').slice(0, 10)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap shrink-0">
                      {bill.insurerShort}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 whitespace-nowrap shrink-0">
                      {bill.period}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap shrink-0">
                      <Badge cls={STATUS_STYLE[ds]}>{t(`financeSettlement.status.${ds}`)}</Badge>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm text-gray-900 tabular-nums whitespace-nowrap shrink-0">
                      {(bill.totalPolicies ?? 0).toLocaleString('en-US')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm text-gray-900 tabular-nums whitespace-nowrap shrink-0">
                      {fmt(bill.totalPremium)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-blue-600 tabular-nums whitespace-nowrap shrink-0">
                      {fmt(bill.totalCommission)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap shrink-0">
                      {bill.exceptionCount != null && bill.exceptionCount > 0 ? (
                        <span className="text-sm font-semibold text-red-600 whitespace-nowrap">
                          {t('financeSettlement.table.diffCount', { n: bill.exceptionCount })}
                        </span>
                      ) : ds === 'settled' || ds === 'reconciled' ? (
                        <span className="text-sm text-green-600 whitespace-nowrap">
                          {t('financeSettlement.table.noDiff')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 sm:px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                          title={t('financeSettlement.table.view')}
                        >
                          <Eye size={15} />
                        </button>
                        {ds === 'toParse' && (
                          <button
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                            title={t('financeSettlement.table.parseNow')}
                            onClick={() => onSelectBill(bill.id)}
                          >
                            <Zap size={15} />
                          </button>
                        )}
                        {showReconcile && (
                          <button
                            className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                            title={t('financeSettlement.table.reconcile')}
                          >
                            <RefreshCw size={15} />
                          </button>
                        )}
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                          title={t('financeSettlement.table.download')}
                        >
                          <Download size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredBills.length === 0 && (
                <>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <tr key={`e${i}`}>
                      <td colSpan={9} className="px-6 py-3 text-center text-sm text-gray-300">
                        {i === 4 ? t('comingSoon') : '\u00A0'}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Tab 2 — 账单解析 ─────────────────────────────────────────────────────────

function BillParseTab({ initialBillId }: { initialBillId: string }) {
  const { t } = useTranslation('finance')
  const { data: billsRes } = useFinanceBills()
  const commissionBills: any[] = billsRes?.data ?? []
  const [selectedBill, setSelectedBill] = useState(initialBillId)
  const { data: linesRes } = useBillLines(selectedBill)
  const billLineItems: any[] = linesRes?.data ?? []
  const parseTemplates: any[] = []
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const bill = commissionBills.find((b: any) => b.id === selectedBill) ?? commissionBills[0]
  const lines = billLineItems.filter((l: any) => l.billId === selectedBill)
  const template = parseTemplates.find((tp: any) => tp.insurerId === bill?.insurerId)

  const doParse = () => {
    if (parsing) return
    setParsing(true)
    window.setTimeout(() => {
      setParsing(false)
      setParsed(true)
    }, 2500)
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
      {/* 左 — 账单选择 + 模板信息 */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-[rgb(113,119,134)]">
            {t('financeSettlement.parseTab.selectBill')}
          </label>
          <select
            value={selectedBill}
            onChange={(e) => {
              setSelectedBill(e.target.value)
              setParsed(false)
            }}
            className={INPUT_CLS}
          >
            {commissionBills.map((b) => (
              <option key={b.id} value={b.id}>
                {b.insurerShort} · {b.period} ({b.fileFormat})
              </option>
            ))}
          </select>
        </div>

        <Card className="p-4">
          <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[rgb(113,119,134)]">
            {t('financeSettlement.parseTab.billInfo')}
          </div>
          {(
            [
              [t('financeSettlement.table.fileName'), (bill.fileName ?? '—').length > 24 ? (bill.fileName ?? '—').slice(0, 24) + '…' : (bill.fileName ?? '—')],
              [t('financeSettlement.parseTab.format'), bill.fileFormat],
              [t('financeSettlement.table.period'), bill.period],
              [t('financeSettlement.table.policyCount'), (bill.totalPolicies ?? 0).toLocaleString('en-US')],
              [t('financeSettlement.table.totalPremium'), fmt(bill.totalPremium)],
              [t('financeSettlement.table.receivableCommission'), fmt(bill.totalCommission)],
            ] as Array<[string, string]>
          ).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-gray-100 py-1.5 text-xs last:border-b-0">
              <span className="text-[rgb(113,119,134)]">{k}</span>
              <span className="font-semibold text-gray-900">{v}</span>
            </div>
          ))}
        </Card>

        {template && (
          <Card className="p-4">
            <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[rgb(113,119,134)]">
              {t('financeSettlement.parseTab.parseTemplate')}
            </div>
            <div className="mb-2 text-[13px] font-bold text-gray-900">{template.templateName}</div>
            {(
              [
                [t('financeSettlement.parseTab.colPolicy'), template.policyCol],
                [t('financeSettlement.parseTab.colPremium'), template.premiumCol],
                [t('financeSettlement.parseTab.colCommission'), template.commissionCol],
                [t('financeSettlement.parseTab.colDate'), template.dateCol],
                [t('financeSettlement.parseTab.headerRow'), t('financeSettlement.parseTab.headerRowVal', { n: template.headerRow + 1 })],
                [t('financeSettlement.parseTab.usageCount'), `${template.usageCount}`],
                [t('billParsing.successRate'), `${(template.successRate * 100).toFixed(1)}%`],
              ] as Array<[string, string]>
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-[5px] text-xs">
                <span className="text-[rgb(113,119,134)]">{k}</span>
                <span className="font-mono text-[11.5px] font-semibold text-[rgb(0,88,188)]">{v}</span>
              </div>
            ))}
            <button className={`${BTN_SOFT_BLUE} mt-2 w-full`} title={t('financeSettlement.parseTab.editTemplate')}>
              <Edit2 size={11} /> {t('financeSettlement.parseTab.editTemplate')}
            </button>
          </Card>
        )}

        <button onClick={doParse} disabled={parsing} className={BTN_PRIMARY}>
          {parsing ? (
            <>
              <Loader2 size={14} className="animate-spin" /> {t('financeSettlement.parseTab.parsing')}
            </>
          ) : (
            <>
              <Zap size={14} /> {t('financeSettlement.parseTab.startParse')}
            </>
          )}
        </button>
      </div>

      {/* 右 — 解析结果 */}
      <div>
        {!parsed && !parsing && lines.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-10 text-gray-400" style={{ minHeight: 300 }}>
            <FileText size={40} />
            <div className="text-sm font-semibold">{t('financeSettlement.parseTab.parseEmpty')}</div>
            <div className="text-xs">{t('financeSettlement.parseTab.parseEmptyHint')}</div>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {(parsed || lines.length > 0) && (
              <div className="mb-4 grid grid-cols-4 gap-3">
                <Card className="p-3.5" style={{ background: TINT.blue.bg, border: TINT.blue.bd }}>
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.parseTab.kpi.parsedLines')}</div>
                  <div className="mt-1 text-[20px] font-bold tabular-nums tracking-tight leading-none text-[#0058BC]">
                    {(bill.parsedPolicies ?? lines.length).toLocaleString('en-US')}
                  </div>
                </Card>
                <Card className="p-3.5" style={{ background: TINT.green.bg, border: TINT.green.bd }}>
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.parseTab.kpi.matched')}</div>
                  <div className="mt-1 text-[20px] font-bold tabular-nums tracking-tight leading-none text-[#1E8033]">
                    {(bill.matchedPolicies ?? lines.filter((l) => l.matchStatus === 'matched').length).toLocaleString('en-US')}
                  </div>
                </Card>
                <Card className="p-3.5" style={{ background: TINT.red.bg, border: TINT.red.bd }}>
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.filters.hasDiff')}</div>
                  <div className="mt-1 text-[20px] font-bold tabular-nums tracking-tight leading-none text-[#C0392B]">
                    {(bill.exceptionCount ?? lines.filter((l) => l.matchStatus !== 'matched').length).toLocaleString('en-US')}
                  </div>
                </Card>
                <Card className="p-3.5" style={{ background: TINT.purple.bg, border: TINT.purple.bd }}>
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.parseTab.kpi.matchRate')}</div>
                  <div className="mt-1 text-[20px] font-bold tabular-nums tracking-tight leading-none text-[#7B3FCA]">
                    {bill.matchedPolicies ? `${((bill.matchedPolicies / bill.totalPolicies) * 100).toFixed(1)}%` : '—'}
                  </div>
                </Card>
              </div>
            )}

            {lines.length > 0 && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[rgba(246,248,255,0.9)]">
                      <tr>
                        {[
                          t('financeSettlement.parseTab.th.line'),
                          t('financeSettlement.parseTab.th.policyNo'),
                          t('financeSettlement.parseTab.th.insured'),
                          t('financeSettlement.parseTab.th.state'),
                          t('financeSettlement.parseTab.th.prem'),
                          t('financeSettlement.parseTab.th.rate'),
                          t('financeSettlement.parseTab.th.commBill'),
                          t('financeSettlement.parseTab.th.commSystem'),
                          t('financeSettlement.parseTab.th.diffAmount'),
                          t('financeSettlement.table.status'),
                        ].map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-500 whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lines.map((l, idx) => (
                        <tr
                          key={l.id}
                          style={{
                            background: l.matchStatus !== 'matched'
                              ? 'rgba(255,159,10,0.04)'
                              : idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)',
                          }}
                        >
                          <td className="px-3 py-2 font-mono text-[11px] text-gray-400">{l.lineNumber}</td>
                          <td className="px-3 py-2 font-mono text-[11.5px] font-semibold text-[rgb(0,88,188)]">{l.policyNumber}</td>
                          <td className="px-3 py-2 text-xs font-medium text-gray-900">{l.insuredName}</td>
                          <td className="px-3 py-2 text-xs font-bold text-[rgb(0,88,188)]">{l.state}</td>
                          <td className="px-3 py-2 font-mono text-[11.5px] text-gray-600">{fmt(l.premium)}</td>
                          <td className="px-3 py-2 font-mono text-[11.5px] text-gray-600">
                            {(l.commissionRate * 100).toFixed(1)}%
                            {l.matchStatus === 'rate-diff' && l.ourCommissionRate != null && (
                              <span className="text-[rgb(0,88,188)]"> vs {(l.ourCommissionRate * 100).toFixed(1)}%</span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11.5px] font-bold text-gray-900">{fmt(l.commissionAmount)}</td>
                          <td
                            className={`px-3 py-2 font-mono text-[11.5px] ${
                              l.ourCommissionAmount != null ? 'text-gray-900' : 'text-gray-300'
                            }`}
                          >
                            {l.ourCommissionAmount != null ? fmt(l.ourCommissionAmount) : '—'}
                          </td>
                          <td
                            className={`px-3 py-2 font-mono text-[11.5px] font-bold ${
                              l.diffAmount
                                ? l.diffAmount > 0
                                  ? 'text-red-600'
                                  : 'text-[rgb(176,96,0)]'
                                : 'text-gray-300'
                            }`}
                          >
                            {l.diffAmount ? (l.diffAmount > 0 ? '+' : '') + fmt(l.diffAmount) : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <Badge cls={MATCH_STATUS_CLS[l.matchStatus]}>{t(MATCH_STATUS_LABEL[l.matchStatus])}</Badge>
                          </td>
                        </tr>
                      ))}
                      {lines.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                        <tr key={`e${i}`}>
                          <td colSpan={9} className="px-3 py-3 text-center text-[11px] text-gray-300">
                            {i === 4 ? t('comingSoon') : '\u00A0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 3 — 佣金对账 ─────────────────────────────────────────────────────────

function CommissionReconcileTab() {
  const { t } = useTranslation('finance')
  const { data: billsRes } = useFinanceBills()
  const commissionBills: any[] = billsRes?.data ?? []
  const [period, setPeriod] = useState('2026-08')
  const [insurer, setInsurer] = useState('all')

  const billsToRecon = commissionBills.filter((b) => b.status === 'reconciled' || b.status === 'exception')

  const totalBill = billsToRecon.reduce((s, b) => s + b.totalCommission, 0)
  const totalOur = billsToRecon.reduce((s, b) => s + (b.reconciledAmount ?? 0), 0)
  const totalDiff = billsToRecon.reduce((s, b) => s + (b.differenceAmount ?? 0), 0)
  const exceptionTotal = billsToRecon.reduce((s, b) => s + (b.exceptionCount ?? 0), 0)

  return (
    <div>
      {/* 工具栏 */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-[rgb(113,119,134)]">
            {t('financeSettlement.table.period')}
          </label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className={`${INPUT_CLS} sm:min-w-[140px]`}>
            {['2026-08', '2026-07', '2026-06', '2026-Q3', '2026-Q2'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11.5px] font-semibold text-[rgb(113,119,134)]">
            {t('financeSettlement.table.carrier')}
          </label>
          <select value={insurer} onChange={(e) => setInsurer(e.target.value)} className={`${INPUT_CLS} sm:min-w-[160px]`}>
            <option value="all">{t('financeSettlement.filters.all')}</option>
            {['Travelers', 'Liberty Mutual', 'Nationwide', 'Chubb', 'AIG', 'Zurich'].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button className={BTN_PRIMARY}>
          <RefreshCw size={13} /> {t('financeSettlement.reconcileTab.batchRecon')}
        </button>
        <button className={BTN_SOFT_BLUE}>
          <Download size={13} /> {t('financeSettlement.reconcileTab.exportReport')}
        </button>
      </div>

      {/* KPI */}
      <div className="mb-5 grid grid-cols-4 gap-3.5">
        <Card className="p-[18px_20px]" style={{ background: TINT.blue.bg, border: TINT.blue.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.reconcileTab.kpiBillCommission')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#0058BC]">{fmt(totalBill)}</div>
          <div className="mt-1 text-[11px] text-[rgb(160,165,177)]">{billsToRecon.length} {t('financeSettlement.reconcileTab.summaryTitle')}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.green.bg, border: TINT.green.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.reconcileTab.kpiVerified')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#1E8033]">{fmt(totalOur)}</div>
          <div className="mt-1 text-[11px] text-[rgb(160,165,177)]">{t('financeSettlement.reconcileTab.kpiVerified')}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: totalDiff > 0 ? TINT.red.bg : TINT.green.bg, border: totalDiff > 0 ? TINT.red.bd : TINT.green.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.reconcileTab.kpiDiffAmount')}</div>
          <div className={`mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none ${totalDiff > 0 ? 'text-[#C0392B]' : 'text-[#1E8033]'}`}>{fmt(totalDiff)}</div>
          <div className="mt-1 text-[11px] text-[rgb(160,165,177)]">{exceptionTotal} {t('financeSettlement.reconcileTab.thDiffCount')}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.purple.bg, border: TINT.purple.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.reconcileTab.kpiReconRate')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#7B3FCA]">
            {`${((billsToRecon.filter((b) => b.exceptionCount === 0 || b.status === 'reconciled').length / Math.max(billsToRecon.length, 1)) * 100).toFixed(0)}%`}
          </div>
          <div className="mt-1 text-[11px] text-[rgb(160,165,177)]">{t('financeSettlement.reconcileTab.kpiReconRate')}</div>
        </Card>
      </div>

      {/* 各保险公司对账汇总 */}
      <Card className="mb-5 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-3 text-[13px] font-bold text-gray-900">
          {t('financeSettlement.reconcileTab.summaryTitle')}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(246,248,255,0.9)]">
              <tr>
                {[
                  t('financeSettlement.table.carrier'),
                  t('financeSettlement.reconcileTab.thBillAmount'),
                  t('financeSettlement.reconcileTab.thSystemAmount'),
                  t('financeSettlement.reconcileTab.kpiDiffAmount'),
                  t('financeSettlement.reconcileTab.thDiffCount'),
                  t('financeSettlement.table.status'),
                  t('financeSettlement.table.actions'),
                ].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {billsToRecon.map((b, idx) => {
                const diff = b.differenceAmount ?? 0
                const ds = DISPLAY_STATUS[b.status]
                return (
                  <tr key={b.id} className="hover:bg-[rgba(246,248,255,0.55)]" style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' }}>
                    <td className="px-3.5 py-2.5">
                      <div className="text-[13px] font-bold text-gray-900">{b.insurerShort}</div>
                      <div className="text-[11px] text-gray-400">
                        {b.period} · {(b.fileName ?? '—').slice(0, 28)}…
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono text-[13px] font-bold text-[rgb(0,88,188)]">{fmt(b.totalCommission)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[13px] text-gray-600">
                      {b.reconciledAmount ? fmt(b.reconciledAmount) : '—'}
                    </td>
                    <td
                      className={`px-3.5 py-2.5 font-mono text-[13px] font-bold ${
                        diff > 0 ? 'text-red-600' : diff < 0 ? 'text-[rgb(176,96,0)]' : 'text-green-600'
                      }`}
                    >
                      {diff !== 0 ? (diff > 0 ? '+' : '') + fmt(diff) : <span className="text-green-600">±0</span>}
                    </td>
                    <td
                      className={`px-3.5 py-2.5 font-mono text-[13px] font-bold ${
                        (b.exceptionCount ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {b.exceptionCount ?? 0}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <Badge cls={STATUS_STYLE[ds]}>{t(`financeSettlement.status.${ds}`)}</Badge>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex gap-1">
                        <button className="p-1 rounded text-blue-600 hover:bg-blue-50" title={t('financeSettlement.table.view')}>
                          <Eye size={13} />
                        </button>
                        {(b.exceptionCount ?? 0) > 0 && (
                          <button
                            className="p-1 rounded text-red-500 hover:bg-red-50"
                            title={t('financeSettlement.filters.hasDiff')}
                          >
                            <AlertTriangle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {billsToRecon.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                <tr key={`e${i}`}>
                  <td colSpan={7} className="px-3.5 py-3 text-center text-sm text-gray-300">
                    {i === 4 ? t('comingSoon') : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* 瀑布分析 */}
      <Card className="p-4">
        <div className="mb-3.5 text-[13px] font-bold text-gray-900">{t('financeSettlement.reconcileTab.waterfallTitle')}</div>
        <div className="flex flex-col gap-3">
          {(
            [
              { label: t('financeSettlement.reconcileTab.wfTotal'), amount: totalBill, color: 'rgb(0,88,188)', width: 100 },
              {
                label: t('financeSettlement.reconcileTab.wfMatched'),
                amount: totalOur,
                color: 'rgb(30,128,51)',
                width: Math.round((totalOur / Math.max(totalBill, 1)) * 100),
              },
              {
                label: t('financeSettlement.reconcileTab.wfUnresolved'),
                amount: totalDiff,
                color: 'rgb(192,57,43)',
                width: Math.round((totalDiff / Math.max(totalBill, 1)) * 100),
              },
            ] as Array<{ label: string; amount: number; color: string; width: number }>
          ).map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <div className="w-[140px] shrink-0 text-xs text-[rgb(113,119,134)]">{row.label}</div>
              <div className="h-[18px] flex-1 overflow-hidden rounded bg-gray-200/60">
                <div className="h-full rounded opacity-80" style={{ width: `${row.width}%`, background: row.color }} />
              </div>
              <div
                className="w-[120px] shrink-0 text-right font-mono text-xs font-bold"
                style={{ color: row.color }}
              >
                {fmt(row.amount)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Tab 4 — 差异处理 ─────────────────────────────────────────────────────────

function DiffHandlingTab() {
  const { t, i18n } = useTranslation('finance')
  const { data: diffsRes } = useDiffs()
  const reconciliationDiffs: any[] = diffsRes?.data ?? []
  const isEn = i18n.language.startsWith('en')
  const [statusFilter, setStatusFilter] = useState<DiffStatus | 'all'>('all')
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  const filtered = reconciliationDiffs.filter((d) => statusFilter === 'all' || d.status === statusFilter)
  const counts: Partial<Record<DiffStatus | 'all', number>> = { all: reconciliationDiffs.length }
  ;(['open', 'under-review', 'disputed', 'accepted', 'adjusted', 'waived'] as DiffStatus[]).forEach((s) => {
    counts[s] = reconciliationDiffs.filter((d) => d.status === s).length
  })

  const doAction = (id: string, action: string) => {
    setProcessingAction(id + action)
    window.setTimeout(() => setProcessingAction(null), 1200)
  }

  const totalDiff = reconciliationDiffs
    .filter((d) => d.status === 'open' || d.status === 'under-review' || d.status === 'disputed')
    .reduce((s, d) => s + Math.abs(d.diffAmount), 0)

  return (
    <div>
      {/* KPI */}
      <div className="mb-4 grid grid-cols-4 gap-3.5">
        <Card className="p-[18px_20px]" style={{ background: TINT.red.bg, border: TINT.red.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.diffTab.kpiOpen')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#C0392B]">{counts['open'] ?? 0}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.orange.bg, border: TINT.orange.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.diffTab.kpiDisputed')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[rgb(176,96,0)]">{counts['disputed'] ?? 0}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.blue.bg, border: TINT.blue.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.diffTab.kpiInvolved')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#0058BC]">{fmt(totalDiff)}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.green.bg, border: TINT.green.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.diffTab.kpiClosed')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#1E8033]">{(counts['accepted'] ?? 0) + (counts['adjusted'] ?? 0) + (counts['waived'] ?? 0)}</div>
        </Card>
      </div>

      {/* 状态筛选 chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(['all', 'open', 'under-review', 'disputed', 'accepted', 'adjusted', 'waived'] as const).map((s) => {
          const active = statusFilter === s
          const label =
            s === 'all'
              ? `${t('financeSettlement.filters.all')} (${counts.all})`
              : `${t(DIFF_STATUS_LABEL[s])} (${counts[s] ?? 0})`
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-[8px] px-3 py-[5px] text-[12px] whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'border border-[rgb(0,88,188)] bg-[rgba(0,88,188,0.1)] text-[rgb(0,88,188)] font-semibold'
                  : 'border border-[rgba(193,198,215,0.4)] bg-white/50 text-[rgb(113,119,134)] hover:bg-white hover:border-[rgba(193,198,215,0.7)]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* 差异卡片列表 */}
      <div className="flex flex-col gap-3">
        {filtered.map((d) => {
          const isSelected = selectedDiff === d.id
          const isProcessing = processingAction?.startsWith(d.id)
          return (
            <div
              key={d.id}
              className={`overflow-hidden rounded-[14px] border transition-colors ${
                isSelected ? 'border-[rgb(0,88,188)] bg-[rgba(0,88,188,0.06)]' : 'border-gray-200 bg-[rgba(255,255,255,0.95)] hover:border-gray-300'
              }`}
            >
              <div
                className="flex cursor-pointer items-start justify-between gap-4 p-4"
                onClick={() => setSelectedDiff(isSelected ? null : d.id)}
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge cls={DIFF_STATUS_CLS[d.status]}>{t(DIFF_STATUS_LABEL[d.status])}</Badge>
                    <span className="rounded bg-gray-100 px-[7px] py-[2px] text-[11.5px] font-semibold text-gray-600">
                      {t(DIFF_TYPE_LABEL[d.diffType])}
                    </span>
                    <span className="font-mono text-xs font-bold text-[rgb(0,88,188)]">{d.policyNumber}</span>
                    <span className="text-[12.5px] text-gray-900">{d.insuredName}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 text-xs">
                    <span className="text-[rgb(113,119,134)]">
                      {d.insurerShort} · {(d.billName ?? '—').length > 30 ? (d.billName ?? '—').slice(0, 30) + '…' : (d.billName ?? '—')}
                    </span>
                    <span className="text-gray-400">
                      {t('financeSettlement.diffTab.created')}
                      <span className="font-mono">{d.createdDate}</span>
                    </span>
                    {d.resolvedDate && (
                      <span className="text-gray-400">
                        {t('financeSettlement.diffTab.resolved')}
                        <span className="font-mono">{d.resolvedDate}</span>
                      </span>
                    )}
                    {d.assignedTo && (
                      <span className="text-[rgb(0,88,188)]">
                        {t('financeSettlement.diffTab.assignee')}
                        {d.assignedTo}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.diffTab.billVsSystem')}</div>
                    <div
                      className={`font-mono text-[13.5px] font-bold ${
                        d.diffAmount > 0 ? 'text-red-600' : d.diffAmount < 0 ? 'text-[rgb(176,96,0)]' : 'text-green-600'
                      }`}
                    >
                      {d.diffAmount > 0 ? '+' : ''}
                      {fmt(d.diffAmount)}
                    </div>
                    <div className="font-mono text-[11px] text-gray-400">
                      {fmt(d.billAmount)} vs {fmt(d.ourAmount)}
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 transition-transform"
                    style={{ transform: isSelected ? 'rotate(180deg)' : 'none' }}
                  />
                </div>
              </div>

              {isSelected && (
                <div className="border-t border-gray-100 bg-[rgba(249,249,255,0.6)] p-4">
                  {d.note && (
                    <div className="mb-3 rounded-lg border border-[rgba(255,159,10,0.2)] bg-[rgba(255,159,10,0.08)] px-3 py-2 text-xs text-[rgb(122,80,0)]">
                      <span className="font-semibold">{t('financeSettlement.diffTab.currentNote')}</span>
                      {isEn ? d.noteEn ?? d.note : d.note}
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-semibold text-[rgb(113,119,134)]">
                      {t('financeSettlement.diffTab.addNote')}
                    </label>
                    <textarea rows={2} placeholder={t('financeSettlement.diffTab.notePlaceholder')} className={INPUT_CLS} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {d.status === 'open' && (
                      <>
                        <button onClick={() => doAction(d.id, 'review')} className={BTN_SOFT_BLUE}>
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                          {t('financeSettlement.diffTab.startReview')}
                        </button>
                        <button
                          onClick={() => doAction(d.id, 'dispute')}
                          className="rounded-[8px] border border-[rgba(255,159,10,0.2)] bg-[rgba(255,159,10,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(176,96,0)] transition-colors hover:bg-[rgba(255,159,10,0.16)]"
                        >
                          {t('financeSettlement.diffTab.markDispute')}
                        </button>
                        <button
                          onClick={() => doAction(d.id, 'waive')}
                          className="rounded-[8px] border border-gray-200 bg-gray-100 px-3 py-1.5 text-[12.5px] font-semibold text-gray-500 transition-colors hover:bg-gray-200"
                        >
                          {t('financeSettlement.diffTab.waive')}
                        </button>
                      </>
                    )}
                    {(d.status === 'under-review' || d.status === 'disputed') && (
                      <>
                        <button
                          onClick={() => doAction(d.id, 'accept')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(52,199,89,0.25)] bg-[rgba(52,199,89,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-green-700 transition-colors hover:bg-[rgba(52,199,89,0.16)]"
                        >
                          {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          {t('financeSettlement.diffTab.acceptBill')}
                        </button>
                        <button
                          onClick={() => doAction(d.id, 'adjust')}
                          className="rounded-[8px] border border-[rgba(123,63,202,0.2)] bg-[rgba(123,63,202,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(123,63,202)] transition-colors hover:bg-[rgba(123,63,202,0.16)]"
                        >
                          {t('financeSettlement.diffTab.adjustSystem')}
                        </button>
                        <button
                          onClick={() => doAction(d.id, 'reject')}
                          className="inline-flex items-center justify-center gap-1.5 rounded-[8px] border border-[rgba(255,59,48,0.2)] bg-[rgba(255,59,48,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-red-600 transition-colors hover:bg-[rgba(255,59,48,0.16)]"
                        >
                          <X size={12} /> {t('financeSettlement.diffTab.rejectItem')}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && Array.from({ length: 10 }).map((_, i) => (
          <div key={`e${i}`} className="rounded-[14px] border border-gray-100 bg-white/50 px-4 py-4 text-center text-sm text-gray-300">
            {i === 4 ? t('comingSoon') : '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab 5 — 结算周期配置 ─────────────────────────────────────────────────────

function SettlementCycleTab() {
  const { t } = useTranslation('finance')
  const { data: configRes } = useSettlementConfigs()
  const settlementCycles: any[] = configRes?.data ?? []
  const { data: histRes } = useSettlementHistory()
  const settlementHistory: any[] = histRes?.data ?? []
  const [editId, setEditId] = useState<string | null>(null)
  const isDraft = editId === 'new'
  const editCycle = isDraft ? NEW_CYCLE_DRAFT : settlementCycles.find((c: any) => c.id === editId)

  const totalNextDue = settlementCycles.reduce((s, c) => s + (c.nextDueAmount ?? 0), 0)
  const totalYtd = settlementCycles.reduce((s, c) => s + c.ytdSettled, 0)

  return (
    <div>
      {/* KPI */}
      <div className="mb-5 grid grid-cols-4 gap-3.5">
        <Card className="p-[18px_20px]" style={{ background: TINT.blue.bg, border: TINT.blue.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.kpiConfigs')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#0058BC]">{settlementCycles.length}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.orange.bg, border: TINT.orange.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.kpiDueMonth')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[rgb(176,96,0)]">{fmt(totalNextDue)}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.green.bg, border: TINT.green.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.kpiYtd')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#1E8033]">{fmt(totalYtd)}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.purple.bg, border: TINT.purple.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.kpiAutoEnabled')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#7B3FCA]">{settlementCycles.filter((c) => c.autoReconcile).length}</div>
        </Card>
      </div>

      <div className={`grid grid-cols-1 gap-5 ${editId && editCycle ? 'lg:grid-cols-[1fr_380px]' : ''}`}>
        {/* 结算配置卡片 */}
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {settlementCycles.map((c) => (
            <Card
              key={c.id}
              className={`p-4 ${editId === c.id ? 'border-[1.5px] border-[rgb(0,88,188)]' : ''}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="text-[15px] font-extrabold text-gray-900">{c.insurerShort}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge cls="bg-[rgba(0,88,188,0.1)] text-[rgb(0,88,188)]">{t(FREQ_LABEL[c.frequency])}</Badge>
                    <Badge cls="bg-[rgba(123,63,202,0.1)] text-[rgb(123,63,202)]">{t(METHOD_LABEL[c.method])}</Badge>
                  </div>
                </div>
                <button
                  className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  title={t('financeSettlement.cycleTab.editConfigTitle', { name: c.insurerShort })}
                  onClick={() => setEditId(editId === c.id ? null : c.id)}
                >
                  <Settings size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-2 text-[12.5px]">
                {(
                  [
                    [t('financeSettlement.cycleTab.rowCutoff'), t('financeSettlement.cycleTab.rowCutoffVal', { day: c.cutoffDay, d: c.paymentDueDays })],
                    [t('financeSettlement.cycleTab.rowNextDue'), c.nextDueDate],
                    [t('financeSettlement.cycleTab.rowDueAmount'), c.nextDueAmount ? fmt(c.nextDueAmount) : t('financeSettlement.cycleTab.tbd')],
                    [t('financeSettlement.cycleTab.rowYtd'), fmt(c.ytdSettled)],
                    [t('financeSettlement.cycleTab.rowBank'), c.bankAccount ?? t('financeSettlement.cycleTab.notConfigured')],
                  ] as Array<[string, string]>
                ).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-2">
                    <span className="shrink-0 text-[rgb(113,119,134)]">{k}</span>
                    <span className="truncate font-semibold text-gray-900">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`h-[7px] w-[7px] rounded-full ${c.autoReconcile ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.autoRecon')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`h-[7px] w-[7px] rounded-full ${c.autoSettle ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-[rgb(113,119,134)]">{t('financeSettlement.cycleTab.autoSettle')}</span>
                </div>
                <span className="ml-auto text-[11px] text-gray-400">
                  {t('financeSettlement.cycleTab.notifyBefore', { n: c.notifyDaysBefore })}
                </span>
              </div>
            </Card>
          ))}

          {/* 新增配置 */}
          <button
            onClick={() => setEditId('new')}
            className="flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-[rgba(193,198,215,0.6)] bg-white/40 p-6 text-gray-400 transition-colors hover:border-[rgba(0,88,188,0.4)] hover:text-[rgb(0,88,188)]"
            style={{ minHeight: 200 }}
          >
            <Plus size={22} />
            <span className="text-[13px] font-semibold">{t('financeSettlement.cycleTab.addConfig')}</span>
          </button>
        </div>

        {/* 编辑面板 */}
        {editId && editCycle && (
          <Card className="h-fit p-5 lg:sticky lg:top-0">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">
                {isDraft
                  ? t('financeSettlement.cycleTab.addConfig')
                  : t('financeSettlement.cycleTab.editConfigTitle', { name: editCycle.insurerShort })}
              </div>
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" onClick={() => setEditId(null)}>
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {(
                [
                  {
                    label: t('financeSettlement.cycleTab.fieldFrequency'),
                    type: 'select',
                    options: (Object.keys(FREQ_LABEL) as CycleFrequency[]).map((v) => ({ v, l: t(FREQ_LABEL[v]) })),
                    value: editCycle.frequency,
                  },
                  { label: t('financeSettlement.cycleTab.fieldCutoff'), type: 'number', value: editCycle.cutoffDay },
                  { label: t('financeSettlement.cycleTab.fieldGrace'), type: 'number', value: editCycle.paymentDueDays },
                  {
                    label: t('financeSettlement.cycleTab.fieldMethod'),
                    type: 'select',
                    options: (Object.keys(METHOD_LABEL) as SettlementMethod[]).map((v) => ({ v, l: t(METHOD_LABEL[v]) })),
                    value: editCycle.method,
                  },
                  { label: t('financeSettlement.cycleTab.fieldMinAmount'), type: 'number', value: editCycle.minSettleAmount },
                  { label: t('financeSettlement.cycleTab.fieldNotify'), type: 'number', value: editCycle.notifyDaysBefore },
                  { label: t('financeSettlement.cycleTab.fieldEmail'), type: 'text', value: editCycle.contactEmail },
                  { label: t('financeSettlement.cycleTab.fieldBank'), type: 'text', value: editCycle.bankAccount ?? '' },
                ] as Array<{ label: string; type: string; options?: Array<{ v: string; l: string }>; value: string | number }>
              ).map((f) => (
                <div key={f.label}>
                  <label className="mb-1 block text-xs font-semibold text-[rgb(113,119,134)]">{f.label}</label>
                  {f.type === 'select' ? (
                    <select defaultValue={f.value as string} className={INPUT_CLS}>
                      {(f.options ?? []).map((o) => (
                        <option key={o.v} value={o.v}>
                          {o.l}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input type={f.type} defaultValue={f.value as string | number} className={INPUT_CLS} />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-2">
                {(
                  [
                    ['autoReconcile', t('financeSettlement.cycleTab.chkAutoRecon'), editCycle.autoReconcile],
                    ['autoSettle', t('financeSettlement.cycleTab.chkAutoSettle'), editCycle.autoSettle],
                  ] as Array<[string, string, boolean]>
                ).map(([k, l, v]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-2 text-[13px] text-gray-900">
                    <input type="checkbox" defaultChecked={v} className="h-4 w-4 accent-[rgb(0,88,188)]" />
                    {l}
                  </label>
                ))}
              </div>
              <button className={BTN_PRIMARY} onClick={() => setEditId(null)}>
                {t('financeSettlement.cycleTab.saveConfig')}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* 结算历史 */}
      <div className="mt-5">
        <div className="mb-3 text-sm font-bold text-gray-900">{t('financeSettlement.cycleTab.historyTitle')}</div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgba(246,248,255,0.9)]">
                <tr>
                  {[
                    t('financeSettlement.table.carrier'),
                    t('financeSettlement.table.period'),
                    t('financeSettlement.cycleTab.thSettleDate'),
                    t('financeSettlement.cycleTab.thSettleAmount'),
                    t('financeSettlement.cycleTab.fieldMethod'),
                    t('financeSettlement.cycleTab.thRefNo'),
                    t('financeSettlement.table.status'),
                    t('financeSettlement.cycleTab.thConfirmedBy'),
                  ].map((h) => (
                    <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {settlementHistory.map((s, idx) => {
                  const st =
                    s.status === 'completed'
                      ? { cls: 'bg-[rgba(52,199,89,0.1)] text-[rgb(30,128,51)]', labelKey: 'financeSettlement.cycleTab.rsCompleted' }
                      : s.status === 'pending'
                        ? { cls: 'bg-[rgba(255,159,10,0.1)] text-[rgb(176,96,0)]', labelKey: 'financeSettlement.cycleTab.rsPending' }
                        : s.status === 'failed'
                          ? { cls: 'bg-[rgba(255,59,48,0.1)] text-[rgb(192,57,43)]', labelKey: 'financeSettlement.cycleTab.rsFailed' }
                          : { cls: 'bg-[rgba(180,180,180,0.15)] text-gray-500', labelKey: 'financeSettlement.cycleTab.rsReversed' }
                  return (
                    <tr key={s.id} className="hover:bg-[rgba(246,248,255,0.55)]" style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' }}>
                      <td className="px-3.5 py-2.5 text-[13px] font-bold text-gray-900">{s.insurerShort}</td>
                      <td className="px-3.5 py-2.5 font-mono text-xs text-gray-600">{s.period}</td>
                      <td className={`px-3.5 py-2.5 font-mono text-xs ${s.settledDate ? 'text-gray-600' : 'text-gray-300'}`}>
                        {s.settledDate || t('financeSettlement.cycleTab.pendingExec')}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[12.5px] font-bold text-[rgb(0,88,188)]">{fmt(s.amount)}</td>
                      <td className="px-3.5 py-2.5 text-xs text-gray-600">{t(METHOD_LABEL[s.method])}</td>
                      <td className={`px-3.5 py-2.5 font-mono text-[11px] ${s.referenceNumber ? 'text-gray-600' : 'text-gray-300'}`}>
                        {s.referenceNumber || '—'}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge cls={st.cls}>{t(st.labelKey)}</Badge>
                      </td>
                      <td className={`px-3.5 py-2.5 text-xs ${s.confirmedBy ? 'text-gray-600' : 'text-gray-300'}`}>
                        {s.confirmedBy || '—'}
                      </td>
                    </tr>
                  )
                })}
                {settlementHistory.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`e${i}`}>
                    <td colSpan={8} className="px-3.5 py-3 text-center text-sm text-gray-300">
                      {i === 4 ? t('comingSoon') : '\u00A0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Tab 6 — 保费对账 ─────────────────────────────────────────────────────────

function PremiumReconcileTab() {
  const { t, i18n } = useTranslation('finance')
  const { data: premRes } = usePremiumRecords()
  const premiumRecords: any[] = premRes?.data ?? []
  const { data: summRes } = usePremiumReconciliation()
  const premiumSummaries: any[] = summRes?.data ?? []
  const isEn = i18n.language.startsWith('en')
  const [selectedInsurer, setSelectedInsurer] = useState('all')

  const filtered = premiumRecords.filter((r) => selectedInsurer === 'all' || r.insurerShort === selectedInsurer)
  const summaries = selectedInsurer === 'all' ? premiumSummaries : premiumSummaries.filter((s) => s.insurerShort === selectedInsurer)

  const totalExpected = summaries.reduce((s, r) => s + r.totalExpected, 0)
  const totalRemitted = summaries.reduce((s, r) => s + r.totalRemitted, 0)
  const totalDiff = totalExpected - totalRemitted
  const exceptionCount = summaries.reduce((s, r) => s + r.exceptionCount, 0)

  return (
    <div>
      {/* KPI */}
      <div className="mb-5 grid grid-cols-4 gap-3.5">
        <Card className="p-[18px_20px]" style={{ background: TINT.blue.bg, border: TINT.blue.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.premiumTab.kpiExpected')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#0058BC]">{fmt(totalExpected)}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.green.bg, border: TINT.green.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.premiumTab.kpiReceived')}</div>
          <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none text-[#1E8033]">{fmt(totalRemitted)}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.red.bg, border: TINT.red.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.reconcileTab.kpiDiffAmount')}</div>
          <div className={`mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none ${totalDiff !== 0 ? 'text-[#C0392B]' : 'text-[#1E8033]'}`}>{fmt(Math.abs(totalDiff))}</div>
        </Card>
        <Card className="p-[18px_20px]" style={{ background: TINT.red.bg, border: TINT.red.bd }}>
          <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.premiumTab.kpiExceptions')}</div>
          <div className={`mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none ${exceptionCount > 0 ? 'text-[#C0392B]' : 'text-[#1E8033]'}`}>{exceptionCount}</div>
        </Card>
      </div>

      {/* 各保险公司保费对账汇总 */}
      <Card className="mb-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <span className="text-[13px] font-bold text-gray-900">{t('financeSettlement.premiumTab.premiumSummaryTitle')}</span>
          <select
            value={selectedInsurer}
            onChange={(e) => setSelectedInsurer(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">{t('financeSettlement.filters.all')}</option>
            {premiumSummaries.map((s) => (
              <option key={s.insurerId} value={s.insurerShort}>
                {s.insurerShort}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(246,248,255,0.9)]">
              <tr>
                {[
                  t('financeSettlement.table.carrier'),
                  t('financeSettlement.table.period'),
                  t('financeSettlement.table.policyCount'),
                  t('financeSettlement.premiumTab.kpiExpected'),
                  t('financeSettlement.premiumTab.thReceived'),
                  t('financeSettlement.parseTab.th.diffAmount'),
                  t('financeSettlement.premiumTab.thMatchRate'),
                  t('financeSettlement.premiumTab.thExceptionCount'),
                ].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map((s, idx) => {
                const diff = s.totalExpected - s.totalRemitted
                const matchPct = (s.matchRate * 100).toFixed(1)
                const barCls =
                  s.matchRate >= 0.99 ? 'bg-green-500' : s.matchRate >= 0.97 ? 'bg-[rgb(255,159,10)]' : 'bg-[rgb(255,59,48)]'
                const textCls =
                  s.matchRate >= 0.99 ? 'text-green-600' : s.matchRate >= 0.97 ? 'text-[rgb(176,96,0)]' : 'text-red-600'
                return (
                  <tr key={s.insurerId} className="hover:bg-[rgba(246,248,255,0.55)]" style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)' }}>
                    <td className="px-3.5 py-2.5 text-[13px] font-bold text-gray-900">{s.insurerShort}</td>
                    <td className="px-3.5 py-2.5 font-mono text-xs text-gray-600">{s.period}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[13px] text-gray-600">{(s.totalPolicies ?? 0).toLocaleString('en-US')}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[13px] font-bold text-[rgb(0,88,188)]">{fmt(s.totalExpected)}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[13px] text-gray-600">{fmt(s.totalRemitted)}</td>
                    <td
                      className={`px-3.5 py-2.5 font-mono text-[13px] font-bold ${
                        diff > 0 ? 'text-red-600' : diff < 0 ? 'text-[rgb(176,96,0)]' : 'text-green-600'
                      }`}
                    >
                      {diff !== 0 ? (diff > 0 ? '+' : '') + fmt(diff) : <span className="text-green-600">±0</span>}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-[5px] w-20 overflow-hidden rounded-full bg-gray-200/70">
                          <div className={`h-full rounded-full ${barCls}`} style={{ width: `${s.matchRate * 100}%` }} />
                        </div>
                        <span className={`font-mono text-xs font-bold ${textCls}`}>{matchPct}%</span>
                      </div>
                    </td>
                    <td
                      className={`px-3.5 py-2.5 font-mono text-[13px] font-bold ${
                        s.exceptionCount > 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {s.exceptionCount}
                    </td>
                  </tr>
                )
              })}
              {summaries.length === 0 && Array.from({ length: 10 }).map((_, i) => (
                <tr key={`e${i}`}>
                  <td colSpan={8} className="px-3.5 py-3 text-center text-sm text-gray-300">
                    {i === 4 ? t('comingSoon') : '\u00A0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 保费对账明细 */}
      <div className="mb-3 text-[13px] font-bold text-gray-900">{t('financeSettlement.premiumTab.detailTitle')}</div>
      <div className="flex flex-col gap-3">
        {filtered.map((r) => {
          const isException = r.status === 'exception'
          return (
            <Card
              key={r.id}
              className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                isException ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-transparent'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge cls={PREMIUM_STATUS_CLS[r.status]}>{t(PREMIUM_STATUS_LABEL[r.status])}</Badge>
                  {r.diffType && (
                    <span className="rounded bg-[rgba(255,59,48,0.08)] px-[7px] py-[2px] text-[11.5px] font-semibold text-red-600">
                      {t(PREMIUM_DIFF_LABEL[r.diffType])}
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-[rgb(0,88,188)]">{r.policyNumber}</span>
                  <span className="text-[13px] font-semibold text-gray-900">{r.insuredName}</span>
                </div>
                <div className="text-xs text-[rgb(113,119,134)]">
                  {r.channelName} · {r.insurerShort} · {r.state} ·{' '}
                  {t('financeSettlement.premiumTab.dueDate')}
                  <span className="font-semibold text-gray-900">{r.dueDate}</span>
                </div>
                {r.note && (
                  <div className="mt-1.5 rounded-lg bg-[rgba(255,159,10,0.08)] px-2.5 py-1.5 text-xs text-[rgb(176,96,0)]">
                    {isEn ? r.noteEn ?? r.note : r.note}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-6">
                <div className="text-right">
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.premiumTab.expected')}</div>
                  <div className="font-mono text-sm font-bold text-[rgb(0,88,188)]">{fmt(r.expectedPremium)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.premiumTab.received')}</div>
                  <div className={`font-mono text-sm font-bold ${r.remittedPremium === 0 ? 'text-gray-300' : 'text-gray-900'}`}>
                    {r.remittedPremium === 0 ? t('financeSettlement.premiumTab.notReceived') : fmt(r.remittedPremium)}
                  </div>
                </div>
                {r.diffAmount !== 0 && (
                  <div className="text-right">
                    <div className="text-[11px] text-[rgb(113,119,134)]">{t('financeSettlement.parseTab.th.diffAmount')}</div>
                    <div className={`font-mono text-sm font-bold ${r.diffAmount > 0 ? 'text-red-600' : 'text-[rgb(176,96,0)]'}`}>
                      {r.diffAmount > 0 ? '+' : ''}
                      {fmt(r.diffAmount)}
                    </div>
                  </div>
                )}
                {isException && (
                  <div className="flex gap-1.5">
                    <button
                      className="rounded-lg border border-[rgba(0,88,188,0.2)] bg-[rgba(0,88,188,0.08)] px-3 py-[5px] text-xs font-bold text-[rgb(0,88,188)] transition-colors hover:bg-[rgba(0,88,188,0.14)]"
                    >
                      {t('financeSettlement.premiumTab.urge')}
                    </button>
                    <button
                      className="rounded-lg border border-[rgba(123,63,202,0.2)] bg-[rgba(123,63,202,0.1)] px-3 py-[5px] text-xs font-bold text-[rgb(123,63,202)] transition-colors hover:bg-[rgba(123,63,202,0.16)]"
                    >
                      {t('financeSettlement.premiumTab.adjust')}
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && Array.from({ length: 10 }).map((_, i) => (
          <div key={`e${i}`} className="rounded-[14px] border border-gray-100 bg-white/50 px-4 py-4 text-center text-sm text-gray-300">
            {i === 4 ? t('comingSoon') : '\u00A0'}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 主组件 ───────────────────────────────────────────────────────────────────

type TabId = 'import' | 'parse' | 'reconcile' | 'diff' | 'cycle' | 'premium'

export default function FinanceDashboardView(_props: Props) {
  const { t } = useTranslation('finance')
  const [tab, setTab] = useState<TabId>('import')
  const [focusBillId, setFocusBillId] = useState<string | null>(null)

  // API hooks for main component stats & badges
  const { data: billsRes } = useFinanceBills()
  const { data: diffsRes } = useDiffs()
  const { data: premRes } = usePremiumRecords()
  const billsData: any[] = billsRes?.data ?? []
  const diffsData: any[] = diffsRes?.data ?? []
  const premiumData: any[] = premRes?.data ?? []

  const handleSelectBill = (id: string) => {
    setFocusBillId(id)
    setTab('parse')
  }

  const pendingCount = billsData.filter((b: any) => b.status === 'pending-parse').length
  const diffCount = diffsData.filter((d: any) => d.status === 'open').length
  const premiumExceptionCount = premiumData.filter((r: any) => r.status === 'exception').length

  const stepTabs: Array<{
    id: TabId
    icon: ComponentType<{ size?: number | string; className?: string }>
    labelKey: string
    badge?: number
  }> = [
    { id: 'import', icon: Upload, labelKey: 'financeSettlement.tabs.import', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'parse', icon: FileText, labelKey: 'financeSettlement.tabs.parsing' },
    { id: 'reconcile', icon: ArrowLeftRight, labelKey: 'financeSettlement.tabs.reconciliation' },
    { id: 'diff', icon: AlertTriangle, labelKey: 'financeSettlement.tabs.disputes', badge: diffCount > 0 ? diffCount : undefined },
    { id: 'cycle', icon: Calendar, labelKey: 'financeSettlement.tabs.settlement' },
    { id: 'premium', icon: DollarSign, labelKey: 'financeSettlement.tabs.premium', badge: premiumExceptionCount > 0 ? premiumExceptionCount : undefined },
  ]

  const stats = [
    { labelKey: 'financeSettlement.stats.totalBills', value: `${billsData.length}`, cls: 'gray' },
    {
      labelKey: 'financeSettlement.stats.pending',
      value: `${billsData.filter((b: any) => b.status === 'pending-parse' || b.status === 'exception').length}`,
      cls: 'red',
    },
    {
      labelKey: 'financeSettlement.stats.receivable',
      value: fmt(billsData.reduce((s: number, b: any) => s + (b.totalCommission || 0), 0)),
      cls: 'blue',
    },
    {
      labelKey: 'financeSettlement.stats.settled',
      value: fmt(
        billsData
          .filter((b: any) => b.status === 'settled')
          .reduce((s: number, b: any) => s + (b.reconciledAmount ?? b.totalCommission ?? 0), 0)
      ),
      cls: 'green',
    },
  ]

  return (
    <div>
      {/* 页头 — ground truth: H1 fs=22px fw=800 mb=0; Subtitle fs=13px #717786; TopBadges rounded=9px px=12 py=6 fs=12.5 */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#181C23] leading-tight mb-0">{t('financeSettlement.title')}</h1>
          <p className="mt-1 text-[13px] text-[rgb(113,119,134)] whitespace-nowrap">{t('financeSettlement.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* 顶徽章1（橙：账单待解析）：bg=rgba(255,159,10,0.1) bd=1px rgba(255,159,10,0.25) color=rgb(176,96,0) r=9px py=6 px=12 fs=12.5 fw=600 */}
          {pendingCount > 0 && (
            <span className="flex items-center gap-[6px] rounded-[9px] border border-[rgba(255,159,10,0.25)] bg-[rgba(255,159,10,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(176,96,0)] whitespace-nowrap">
              <FileText size={14} className="text-[rgb(176,96,0)]" />
              {t('financeSettlement.badges.billsToParse', { n: pendingCount })}
            </span>
          )}
          {/* 顶徽章2（红：差异待处理）：bg=rgba(255,59,48,0.1) bd=1px rgba(255,59,48,0.25) color=rgb(192,57,43) r=9px */}
          {diffCount > 0 && (
            <span className="flex items-center gap-[6px] rounded-[9px] border border-[rgba(255,59,48,0.25)] bg-[rgba(255,59,48,0.1)] px-3 py-1.5 text-[12.5px] font-semibold text-[rgb(192,57,43)] whitespace-nowrap">
              <AlertTriangle size={14} className="text-[rgb(192,57,43)]" />
              {t('financeSettlement.badges.diffsToHandle', { n: diffCount })}
            </span>
          )}
        </div>
      </div>

      {/* 步骤 Tab — ground truth：仅上圆角 10px 下方直角贴线；激活态 bg=蓝8% 无边框 蓝字 fw700；非激活态 bg=透明 灰字；step badge：激活=琥珀实心#FF9F0A / 非激活=红实心#FF3B30 h=16 r=8 fs=10 fw700 */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex flex-wrap items-end pb-0">
          {stepTabs.map((st) => {
            const Icon = st.icon
            const active = tab === st.id
            return (
              <button
                key={st.id}
                onClick={() => setTab(st.id)}
                className={`flex shrink-0 items-center gap-2 rounded-t-[10px] rounded-b-none px-4 py-2 text-left text-[13px] whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-[rgba(0,88,188,0.08)] text-[rgb(0,88,188)] font-bold border-b-2 border-[#0058BC]'
                    : 'bg-transparent text-[rgb(113,119,134)] font-normal hover:text-[rgb(24,28,35)] border-b-2 border-transparent'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex items-center gap-1.5">
                  {t(st.labelKey)}
                  {st.badge != null && (
                    <span
                      className={`inline-flex h-[16px] min-w-[16px] items-center justify-center rounded-[8px] px-[5px] py-[1px] text-[10px] font-bold leading-none text-white ${
                        active ? 'bg-[rgb(255,159,10)]' : 'bg-[rgb(255,59,48)]'
                      }`}
                    >
                      {st.badge}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 统计 KPI — 佣金对账和差异处理Tab不显示顶层KPI */}
      {tab !== 'reconcile' && tab !== 'diff' && (
      <div className="mb-5 grid grid-cols-4 gap-3.5">
        {stats.map((stat) => {
          const color = stat.cls === 'gray' ? '#181C23'
            : stat.cls === 'red' ? (stat.value === '0' ? '#1E8033' : '#C0392B')
            : stat.cls === 'blue' ? '#0058BC'
            : stat.cls === 'green' ? '#1E8033'
            : '#181C23'
          const tintKey = stat.cls === 'gray' ? 'blue' : stat.cls === 'red' ? (stat.value === '0' ? 'green' : 'red') : stat.cls
          return (
            <Card key={stat.labelKey} className="p-[18px_20px]" style={{ background: TINT[tintKey]?.bg, border: TINT[tintKey]?.bd }}>
              <div className="text-[11px] text-[rgb(113,119,134)]">{t(stat.labelKey)}</div>
              <div className="mt-1.5 text-[22px] font-bold tabular-nums tracking-tight leading-none" style={{ color }}>
                {stat.value}
              </div>
            </Card>
          )
        })}
      </div>
      )}

      {tab === 'import' && <BillImportTab onSelectBill={handleSelectBill} />}
      {tab === 'parse' && <BillParseTab initialBillId={focusBillId ?? billsData[0]?.id ?? ''} />}
      {tab === 'reconcile' && <CommissionReconcileTab />}
      {tab === 'diff' && <DiffHandlingTab />}
      {tab === 'cycle' && <SettlementCycleTab />}
      {tab === 'premium' && <PremiumReconcileTab />}
    </div>
  )
}
