/**
 * Shared display maps for the cooperation module.
 * Cooperation statuses stay PascalCase (DB values); contract/renewal/access
 * statuses stay lowercase / kebab-case. Labels are i18n keys under namespace
 * `cooperation` (prefix `view.*`).
 */
import {
  GitMerge, XCircle, FileText, Settings, Users, RefreshCw, Package,
  Shield, AlertTriangle, TrendingUp, Zap, ArrowUpRight, Building2, Percent,
} from 'lucide-react'

/** @deprecated V1.0.10 prototype alignment replaced the 7 module tabs with list + detail. */
export const TABS = [
  { id: 'establish', label: 'view.tabs.establish', icon: GitMerge },
  { id: 'terminate', label: 'view.tabs.terminate', icon: XCircle },
  { id: 'contracts', label: 'view.tabs.contracts', icon: FileText },
  { id: 'settlement', label: 'view.tabs.settlement', icon: Settings },
  { id: 'contacts', label: 'view.tabs.contacts', icon: Users },
  { id: 'renewal', label: 'view.tabs.renewal', icon: RefreshCw },
  { id: 'integration', label: 'view.tabs.integration', icon: Package },
] as const

export type TabId = typeof TABS[number]['id']

/** V1.0.10 ch.10: single-cooperation detail context tabs. V1.0.15: 佣金率只读 Tab 插入结算之后。 */
export const DETAIL_TABS = [
  { id: 'contracts', label: 'view.detail.tabs.contracts', icon: FileText },
  { id: 'settlement', label: 'view.detail.tabs.settlement', icon: Settings },
  { id: 'rates', label: 'view.detail.tabs.rates', icon: Percent },
  { id: 'contacts', label: 'view.detail.tabs.contacts', icon: Users },
  { id: 'renewal', label: 'view.detail.tabs.renewal', icon: RefreshCw },
  { id: 'access', label: 'view.detail.tabs.access', icon: Package },
] as const

export type DetailTabId = typeof DETAIL_TABS[number]['id']

/** Cooperation type filter / wizard options (DB enum: cooperation_type). */
export const COOP_TYPES = ['Full-Service', 'Preferred', 'Specialty', 'Surplus Lines'] as const

/** DB enum → i18n label key (namespace cooperation, prefix view.*). */
export const COOP_TYPE_LABEL: Record<string, string> = {
  'Full-Service': 'view.wizard.step1.coopTypes.fullService',
  Preferred: 'view.wizard.step1.coopTypes.preferred',
  Specialty: 'view.wizard.step1.coopTypes.specialty',
  'Surplus Lines': 'view.wizard.step1.coopTypes.surplusLines',
  // Tolerate legacy / user-entered code variants from API records
  'full-service': 'view.wizard.step1.coopTypes.fullService',
  full_service: 'view.wizard.step1.coopTypes.fullService',
  fullservice: 'view.wizard.step1.coopTypes.fullService',
  preferred: 'view.wizard.step1.coopTypes.preferred',
  preferred_partner: 'view.wizard.step1.coopTypes.preferred',
  specialty: 'view.wizard.step1.coopTypes.specialty',
  'surplus lines': 'view.wizard.step1.coopTypes.surplusLines',
  surplus_lines: 'view.wizard.step1.coopTypes.surplusLines',
  'surplus-lines': 'view.wizard.step1.coopTypes.surplusLines',
}

/** product_scope.lobTypes are stored as uppercase codes; humanize for chips. */
const LOB_LABELS: Record<string, string> = {
  AUTO: 'Auto', HOME: 'Home', COMMERCIAL: 'Commercial', CYBER: 'Cyber', LIFE: 'Life',
  TRAVEL: 'Travel', PROFESSIONAL: 'Professional', D_O: 'D&O', E_O: 'E&O', SPECIALTY: 'Specialty',
}
export function lobLabel(code?: string | null): string {
  if (!code) return '—'
  return LOB_LABELS[code.toUpperCase()] ?? code.replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase())
}

/** Prototype term format: YYYY-MM ～ YYYY-MM; missing start renders as "～ YYYY-MM". */
export function formatMonthRange(start?: string | null, end?: string | null, permanentLabel = '—'): string {
  const s = start?.slice(0, 7) || ''
  const e = end?.slice(0, 7) || ''
  if (!s && !e) return '—'
  if (!s) return `～ ${e}`
  return `${s} ～ ${e || permanentLabel}`
}

/**
 * Cooperation lifecycle (doc 3.6, V1.0.12 — no approval pipeline).
 * Stored values: Negotiating/PendingSign/Signed/Active/Terminated.
 * Expiring/Expired are derived at read time (see CooperationRecord.effective_status)
 * but still appear as list filters and badges.
 */
export const COOP_STATUS: Record<string, { label: string; cls: string; orb: string }> = {
  Negotiating: { label: 'view.coopStatus.negotiating', cls: 'badge-purple', orb: 'orb-purple' },
  PendingSign: { label: 'view.coopStatus.pendingSign', cls: 'badge-yellow', orb: 'orb-yellow' },
  Signed: { label: 'view.coopStatus.signed', cls: 'badge-blue', orb: 'orb-blue' },
  Active: { label: 'view.coopStatus.active', cls: 'badge-green', orb: 'orb-green' },
  Expiring: { label: 'view.coopStatus.expiring', cls: 'badge-orange', orb: 'orb-orange' },
  Expired: { label: 'view.coopStatus.expired', cls: 'badge-red', orb: 'orb-red' },
  Terminated: { label: 'view.coopStatus.terminated', cls: 'badge-gray', orb: 'orb-gray' },
}

/** Status filter order for the list page (includes derived Expiring/Expired). */
export const COOP_STATUS_FILTERS = [
  'Negotiating', 'PendingSign', 'Signed', 'Active', 'Expiring', 'Expired', 'Terminated',
] as const

/** Mirrors backend COOP_TRANSITIONS (PUT /cooperations/:id). Termination uses /terminate. */
export const COOP_TRANSITIONS: Record<string, string[]> = {
  Negotiating: ['PendingSign'],
  PendingSign: ['Negotiating', 'Signed'],
  Signed: ['PendingSign', 'Active'],
  Active: [],
  Terminated: [],
}

/** Only these statuses expose the delete action (V1.0.12 rule). */
export const COOP_DELETABLE = ['Negotiating', 'PendingSign']

/**
 * Only pre-fulfilment cooperations can be edited (V1.0.12 rule):
 * 履约中(Active, incl. read-derived Expiring/Expired) 与已终态编辑置灰；
 * 合同/对接人/结算等子资源有各自的端点，不受此开关限制。
 */
export const COOP_EDITABLE = ['Negotiating', 'PendingSign', 'Signed']

/**
 * "更多" menu action labels per legal (from → to) transition.
 * Keys are i18n labels under view.menu.*; Active's only action is terminate,
 * which lives outside this map (handled by the list view directly).
 */
export const COOP_MENU_ACTIONS: Record<string, Array<{ to: string; label: string }>> = {
  Negotiating: [
    { to: 'PendingSign', label: 'view.menu.toPendingSign' },
  ],
  PendingSign: [
    { to: 'Negotiating', label: 'view.menu.backToNegotiating' },
    { to: 'Signed', label: 'view.menu.toSigned' },
  ],
  Signed: [
    { to: 'PendingSign', label: 'view.menu.backToPendingSign' },
    { to: 'Active', label: 'view.menu.toActive' },
  ],
}

export const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'view.contractStatus.draft', cls: 'badge-gray' },
  negotiating: { label: 'view.contractStatus.negotiating', cls: 'badge-purple' },
  'pending-sign': { label: 'view.contractStatus.pendingSign', cls: 'badge-yellow' },
  active: { label: 'view.contractStatus.active', cls: 'badge-green' },
  expiring: { label: 'view.contractStatus.expiring', cls: 'badge-orange' },
  expired: { label: 'view.contractStatus.expired', cls: 'badge-red' },
  terminated: { label: 'view.contractStatus.terminated', cls: 'badge-gray' },
}

/** @deprecated V1.0.15 五步申请流已下线，合作产品改为直接关联（cooperation_product）。 */
export const INTEGRATION_STATUS: Record<string, { label: string; cls: string; step: number }> = {
  available: { label: 'view.integrationStatus.available', cls: 'badge-gray', step: 0 },
  requested: { label: 'view.integrationStatus.requested', cls: 'badge-blue', step: 1 },
  'in-review': { label: 'view.integrationStatus.inReview', cls: 'badge-yellow', step: 2 },
  approved: { label: 'view.integrationStatus.approved', cls: 'badge-purple', step: 3 },
  integrated: { label: 'view.integrationStatus.integrated', cls: 'badge-green', step: 4 },
  rejected: { label: 'view.integrationStatus.rejected', cls: 'badge-red', step: -1 },
  suspended: { label: 'view.integrationStatus.suspended', cls: 'badge-gray', step: -1 },
}

export const RENEWAL_PRIORITY: Record<string, { color: string; label: string }> = {
  critical: { color: '#BA1A1A', label: 'view.renewalPriority.critical' },
  high: { color: '#a05800', label: 'view.renewalPriority.high' },
  normal: { color: '#0058BC', label: 'view.renewalPriority.normal' },
  low: { color: '#717786', label: 'view.renewalPriority.low' },
}

/** V1.0.15 O6：无谈判中间态；仅展示到期提醒行与已登记续约记录。 */
export const RENEWAL_STATUS: Record<string, { label: string; cls: string }> = {
  upcoming: { label: 'view.renewalStatus.upcoming', cls: 'badge-blue' },
  renewed: { label: 'view.renewalStatus.renewed', cls: 'badge-green' },
  expired: { label: 'view.renewalStatus.expired', cls: 'badge-gray' },
  'auto-renew': { label: 'view.renewalStatus.autoRenew', cls: 'badge-blue' },
}

export const ROLE_ICON: Record<string, any> = {
  Underwriting: Shield, Claims: AlertTriangle, Billing: TrendingUp,
  'IT/API': Zap, Legal: FileText, Marketing: ArrowUpRight, 'Senior Management': Building2,
}
export const ROLE_COLOR: Record<string, string> = {
  Underwriting: '#0058BC', Claims: '#FF9500', Billing: '#34C759',
  'IT/API': '#AF52DE', Legal: '#717786', Marketing: '#FF3B30', 'Senior Management': '#181C23',
}

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

/** Whole-day difference to today; negative when the date is in the past. */
export function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  const t = new Date(dateStr).getTime()
  if (Number.isNaN(t)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const that = new Date(dateStr)
  that.setHours(0, 0, 0, 0)
  return Math.round((t - today.getTime()) / 86400000)
}

export type Notify = (type: 'success' | 'error', message: string) => void
