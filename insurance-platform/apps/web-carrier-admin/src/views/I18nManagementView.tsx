import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Search, Edit2, Check, X, Download, Upload, Plus, ChevronRight,
  AlertCircle, CheckCircle2, Info, AlertTriangle, MessageSquare,
  FileText, Globe, Layers, Bell, Shield, Filter, RotateCcw, Save,
  ChevronDown, Copy, Languages,
} from 'lucide-react'
import type { ViewId } from '@/App'

interface Props {
  navigateTo: (view: ViewId) => void
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface CopyEntry {
  id: string
  module: string
  section: string
  key: string
  en: string
  zh: string
  type: 'label' | 'button' | 'placeholder' | 'toast' | 'confirm' | 'validate' | 'error-page'
  toastVariant?: 'success' | 'error' | 'warning' | 'info'
  modified?: boolean
}

const INITIAL_ENTRIES: CopyEntry[] = [
  // ── 通用操作 ──────────────────────────────────────────────────────────────
  { id: 'c01', module: 'common', section: '操作按钮', key: 'actions.save',       en: 'Save',            zh: '保存',         type: 'button' },
  { id: 'c02', module: 'common', section: '操作按钮', key: 'actions.cancel',     en: 'Cancel',          zh: '取消',         type: 'button' },
  { id: 'c03', module: 'common', section: '操作按钮', key: 'actions.confirm',    en: 'Confirm',         zh: '确认',         type: 'button' },
  { id: 'c04', module: 'common', section: '操作按钮', key: 'actions.delete',     en: 'Delete',          zh: '删除',         type: 'button' },
  { id: 'c05', module: 'common', section: '操作按钮', key: 'actions.export',     en: 'Export',          zh: '导出',         type: 'button' },
  { id: 'c06', module: 'common', section: '操作按钮', key: 'actions.import',     en: 'Import',          zh: '导入',         type: 'button' },
  { id: 'c07', module: 'common', section: '操作按钮', key: 'actions.edit',       en: 'Edit',            zh: '编辑',         type: 'button' },
  { id: 'c08', module: 'common', section: '操作按钮', key: 'actions.reset',      en: 'Reset',           zh: '重置',         type: 'button' },
  { id: 'c09', module: 'common', section: '状态标签', key: 'status.active',      en: 'Active',          zh: '活跃',         type: 'label' },
  { id: 'c10', module: 'common', section: '状态标签', key: 'status.inactive',    en: 'Inactive',        zh: '停用',         type: 'label' },
  { id: 'c11', module: 'common', section: '状态标签', key: 'status.pending',     en: 'Pending',         zh: '待处理',        type: 'label' },
  { id: 'c12', module: 'common', section: '状态标签', key: 'status.suspended',   en: 'Suspended',       zh: '已暂停',        type: 'label' },
  { id: 'c13', module: 'common', section: '搜索输入', key: 'search.placeholder', en: 'Search…',         zh: '搜索…',         type: 'placeholder' },
  // ── 渠道模块 ──────────────────────────────────────────────────────────────
  { id: 'd01', module: 'channel', section: '页面标题', key: 'list.title',         en: 'Channel List',    zh: '渠道列表',       type: 'label' },
  { id: 'd02', module: 'channel', section: '页面标题', key: 'form.addTitle',      en: 'Add Channel',     zh: '新增渠道',       type: 'label' },
  { id: 'd03', module: 'channel', section: '渠道类型', key: 'types.independent',  en: 'Independent Agency', zh: '独立代理',    type: 'label' },
  { id: 'd04', module: 'channel', section: '渠道类型', key: 'types.broker',       en: 'Broker',          zh: '经纪商',         type: 'label' },
  { id: 'd05', module: 'channel', section: '渠道类型', key: 'types.mga',          en: 'MGA',             zh: 'MGA',           type: 'label' },
  { id: 'd06', module: 'channel', section: '渠道类型', key: 'types.wholesale',    en: 'Wholesale Broker', zh: '批发经纪',      type: 'label' },
  { id: 'd07', module: 'channel', section: '表单字段', key: 'form.npnCode',       en: 'NPN Code',        zh: '全国生产者编号',   type: 'label' },
  { id: 'd08', module: 'channel', section: '表单字段', key: 'form.manager',       en: 'Account Manager', zh: '负责人',         type: 'label' },
  { id: 'd09', module: 'channel', section: '表单字段', key: 'form.region',        en: 'Region',          zh: '所属大区',        type: 'label' },
  { id: 'd10', module: 'channel', section: '表单字段', key: 'form.tier',          en: 'Tier',            zh: '渠道等级',        type: 'label' },
  { id: 'd11', module: 'channel', section: '渠道等级', key: 'tier.platinum',      en: 'Platinum',        zh: '铂金',           type: 'label' },
  { id: 'd12', module: 'channel', section: '渠道等级', key: 'tier.gold',          en: 'Gold',            zh: '金级',           type: 'label' },
  { id: 'd13', module: 'channel', section: '渠道等级', key: 'tier.silver',        en: 'Silver',          zh: '银级',           type: 'label' },
  // ── 保险公司模块 ──────────────────────────────────────────────────────────
  { id: 'i01', module: 'carrier', section: '页面标题', key: 'list.title',         en: 'Insurer Management', zh: '保险公司管理',   type: 'label' },
  { id: 'i02', module: 'carrier', section: '页面标题', key: 'form.addTitle',      en: 'Add Insurer',     zh: '新增保险公司',     type: 'label' },
  { id: 'i03', module: 'carrier', section: '表单字段', key: 'form.naicCode',      en: 'NAIC Code',       zh: 'NAIC 编码',      type: 'label' },
  { id: 'i04', module: 'carrier', section: '表单字段', key: 'form.amBest',        en: 'AM Best Rating',  zh: 'AM Best 评级',   type: 'label' },
  { id: 'i05', module: 'carrier', section: '公司类型', key: 'types.admitted',     en: 'Admitted',        zh: '已获准',          type: 'label' },
  { id: 'i06', module: 'carrier', section: '公司类型', key: 'types.nonadmitted',  en: 'Non-Admitted',    zh: '非已获准',         type: 'label' },
  // ── 佣金模块 ──────────────────────────────────────────────────────────────
  { id: 'k01', module: 'commission', section: '页面标题', key: 'scheme.title',    en: 'Commission Scheme', zh: '佣金方案',       type: 'label' },
  { id: 'k02', module: 'commission', section: '页面标题', key: 'settlement.title',en: 'Settlement',      zh: '佣金结算',        type: 'label' },
  { id: 'k03', module: 'commission', section: '表单字段', key: 'form.rate',       en: 'Commission Rate', zh: '佣金率',          type: 'label' },
  { id: 'k04', module: 'commission', section: '表单字段', key: 'form.cycle',      en: 'Settlement Cycle', zh: '结算周期',       type: 'label' },
  // ── 提示消息 — 成功 ───────────────────────────────────────────────────────
  { id: 't01', module: 'toast', section: '成功提示', key: 'success.saved',        en: 'Saved successfully', zh: '保存成功',      type: 'toast', toastVariant: 'success' },
  { id: 't02', module: 'toast', section: '成功提示', key: 'success.submitted',    en: 'Submitted successfully', zh: '提交成功',  type: 'toast', toastVariant: 'success' },
  { id: 't03', module: 'toast', section: '成功提示', key: 'success.deleted',      en: 'Deleted successfully', zh: '删除成功',    type: 'toast', toastVariant: 'success' },
  { id: 't04', module: 'toast', section: '成功提示', key: 'success.exported',     en: 'Export complete',  zh: '导出完成',        type: 'toast', toastVariant: 'success' },
  { id: 't05', module: 'toast', section: '成功提示', key: 'success.imported',     en: '$count records imported', zh: '已导入 $count 条记录', type: 'toast', toastVariant: 'success' },
  // ── 提示消息 — 错误 ───────────────────────────────────────────────────────
  { id: 't06', module: 'toast', section: '错误提示', key: 'error.saveFailed',     en: 'Failed to save. Please try again.', zh: '保存失败，请重试',   type: 'toast', toastVariant: 'error' },
  { id: 't07', module: 'toast', section: '错误提示', key: 'error.loadFailed',     en: 'Failed to load data',  zh: '数据加载失败',          type: 'toast', toastVariant: 'error' },
  { id: 't08', module: 'toast', section: '错误提示', key: 'error.unauthorized',   en: "You don't have permission", zh: '您没有操作权限',    type: 'toast', toastVariant: 'error' },
  { id: 't09', module: 'toast', section: '错误提示', key: 'error.networkError',   en: 'Network error. Check your connection.', zh: '网络错误，请检查连接', type: 'toast', toastVariant: 'error' },
  // ── 提示消息 — 警告 ───────────────────────────────────────────────────────
  { id: 't10', module: 'toast', section: '警告提示', key: 'warning.unsaved',      en: 'You have unsaved changes', zh: '有未保存的修改',         type: 'toast', toastVariant: 'warning' },
  { id: 't11', module: 'toast', section: '警告提示', key: 'warning.expiringSoon', en: 'License expiring in $days days', zh: '执照将在 $days 天后到期', type: 'toast', toastVariant: 'warning' },
  // ── 提示消息 — 信息 ───────────────────────────────────────────────────────
  { id: 't12', module: 'toast', section: '信息提示', key: 'info.sessionExpiry',   en: 'Session expires in 15 min', zh: '会话将在 15 分钟后过期', type: 'toast', toastVariant: 'info' },
  { id: 't13', module: 'toast', section: '信息提示', key: 'info.processing',      en: 'Processing, please wait…', zh: '处理中，请稍候…',       type: 'toast', toastVariant: 'info' },
  // ── 确认弹窗 ──────────────────────────────────────────────────────────────
  { id: 'm01', module: 'modal', section: '确认弹窗', key: 'confirm.deleteChannel.title',  en: 'Delete Channel?',  zh: '确认删除渠道？', type: 'confirm' },
  { id: 'm02', module: 'modal', section: '确认弹窗', key: 'confirm.deleteChannel.body',   en: 'This will permanently delete "$name" and all sub-channels. This cannot be undone.', zh: '此操作将永久删除「$name」及其所有子渠道，无法撤销。', type: 'confirm' },
  { id: 'm03', module: 'modal', section: '确认弹窗', key: 'confirm.disableInsurer.title', en: 'Disable Insurer?', zh: '确认停用保险公司？', type: 'confirm' },
  { id: 'm04', module: 'modal', section: '确认弹窗', key: 'confirm.disableInsurer.body',  en: 'Disabling "$name" will suspend all active products and appointments.', zh: '停用「$name」将暂停其所有活跃产品和 Appointment。', type: 'confirm' },
  { id: 'm05', module: 'modal', section: '确认弹窗', key: 'confirm.logout.title',         en: 'Sign Out?',        zh: '确认退出登录？', type: 'confirm' },
  { id: 'm06', module: 'modal', section: '确认弹窗', key: 'confirm.logout.body',          en: 'Any unsaved changes will be lost.',  zh: '未保存的修改将会丢失。', type: 'confirm' },
  // ── 表单校验 ──────────────────────────────────────────────────────────────
  { id: 'v01', module: 'validate', section: '必填校验', key: 'required',           en: 'This field is required',        zh: '此字段为必填项',           type: 'validate' },
  { id: 'v02', module: 'validate', section: '必填校验', key: 'nameRequired',       en: 'Name is required',              zh: '名称不能为空',              type: 'validate' },
  { id: 'v03', module: 'validate', section: '格式校验', key: 'emailInvalid',       en: 'Please enter a valid email',    zh: '请输入有效的邮箱地址',        type: 'validate' },
  { id: 'v04', module: 'validate', section: '格式校验', key: 'npnFormat',          en: 'NPN must be 8–10 digits',       zh: 'NPN 编码须为 8–10 位数字',   type: 'validate' },
  { id: 'v05', module: 'validate', section: '格式校验', key: 'rateRange',          en: 'Rate must be between 0–100%',   zh: '费率须在 0–100% 范围内',      type: 'validate' },
  { id: 'v06', module: 'validate', section: '长度校验', key: 'maxLength',          en: 'Maximum $max characters',       zh: '最多 $max 个字符',            type: 'validate' },
  { id: 'v07', module: 'validate', section: '长度校验', key: 'minLength',          en: 'Minimum $min characters',       zh: '至少 $min 个字符',            type: 'validate' },
  // ── 错误页面 ──────────────────────────────────────────────────────────────
  { id: 'e01', module: 'error-page', section: '错误页面', key: 'notFound.title',   en: 'Page Not Found',  zh: '页面不存在',      type: 'error-page' },
  { id: 'e02', module: 'error-page', section: '错误页面', key: 'notFound.body',    en: "The page you're looking for doesn't exist or has been moved.", zh: '您访问的页面不存在或已被移动。', type: 'error-page' },
  { id: 'e03', module: 'error-page', section: '错误页面', key: 'serverError.title',en: 'Something went wrong', zh: '系统出现错误',  type: 'error-page' },
  { id: 'e04', module: 'error-page', section: '错误页面', key: 'serverError.body', en: 'Our team has been notified. Please try again in a moment.', zh: '技术团队已收到通知，请稍后重试。', type: 'error-page' },
  { id: 'e05', module: 'error-page', section: '错误页面', key: 'noPermission.title',en: 'Access Denied',   zh: '无访问权限',     type: 'error-page' },
]

// ─── Module config ────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'all',        label: '全部文案',     icon: <Layers size={14} />,      color: '#4F46E5' },
  { id: 'common',     label: '通用',         icon: <Globe size={14} />,       color: '#0058BC' },
  { id: 'channel',    label: '渠道',         icon: <FileText size={14} />,    color: '#006687' },
  { id: 'carrier',    label: '保险公司',      icon: <Shield size={14} />,      color: '#7c3aed' },
  { id: 'commission', label: '佣金',         icon: <FileText size={14} />,    color: '#059669' },
  { id: 'toast',      label: '提示消息',      icon: <Bell size={14} />,        color: '#d97706' },
  { id: 'modal',      label: '确认弹窗',      icon: <MessageSquare size={14} />, color: '#BA1A1A' },
  { id: 'validate',   label: '表单校验',      icon: <AlertCircle size={14} />, color: '#9333ea' },
  { id: 'error-page', label: '错误页面',      icon: <AlertTriangle size={14} />, color: '#c2410c' },
]

const TYPE_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  label:       { bg: 'rgba(79,70,229,0.08)',   color: '#4F46E5',  label: '标签' },
  button:      { bg: 'rgba(0,88,188,0.08)',    color: '#0058BC',  label: '按钮' },
  placeholder: { bg: 'rgba(113,119,134,0.12)', color: '#717786',  label: '提示文' },
  toast:       { bg: 'rgba(217,119,6,0.10)',   color: '#d97706',  label: '提示框' },
  confirm:     { bg: 'rgba(186,26,26,0.08)',   color: '#BA1A1A',  label: '弹窗' },
  validate:    { bg: 'rgba(147,51,234,0.09)',  color: '#9333ea',  label: '校验' },
  'error-page':{ bg: 'rgba(194,65,12,0.08)',   color: '#c2410c',  label: '错误页' },
}

const TOAST_ICON: Record<string, React.ReactNode> = {
  success: <CheckCircle2 size={13} style={{ color: '#059669' }} />,
  error:   <AlertCircle size={13}  style={{ color: '#BA1A1A' }} />,
  warning: <AlertTriangle size={13} style={{ color: '#d97706' }} />,
  info:    <Info size={13}          style={{ color: '#0058BC' }} />,
}

// ─── Inline editor row ────────────────────────────────────────────────────────

function EntryRow({
  entry, isEditing, onEdit, onSave, onCancel,
}: {
  entry: CopyEntry
  isEditing: boolean
  onEdit: () => void
  onSave: (en: string, zh: string) => void
  onCancel: () => void
}) {
  const [draftEn, setDraftEn] = useState(entry.en)
  const [draftZh, setDraftZh] = useState(entry.zh)
  const typeCfg = TYPE_CONFIG[entry.type]

  useEffect(() => {
    if (isEditing) { setDraftEn(entry.en); setDraftZh(entry.zh) }
  }, [isEditing, entry.en, entry.zh])

  return (
    <tr style={{ background: isEditing ? 'rgba(79,70,229,0.03)' : entry.modified ? 'rgba(5,150,105,0.03)' : undefined }}>
      <td style={{ width: 64, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 5,
          fontFamily: "'JetBrains Mono', monospace",
          background: typeCfg.bg, color: typeCfg.color,
        }}>
          {entry.toastVariant
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{TOAST_ICON[entry.toastVariant]}{typeCfg.label}</span>
            : typeCfg.label
          }
        </span>
      </td>
      <td>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#717786' }}>
          {entry.key}
        </span>
        {entry.modified && (
          <span style={{ marginLeft: 6, fontSize: 10, color: '#059669', fontWeight: 600 }}>● 已修改</span>
        )}
      </td>
      <td>
        {isEditing ? (
          <textarea
            autoFocus
            className="input-glass w-full"
            style={{ fontSize: 12.5, padding: '4px 8px', resize: 'none', minHeight: 36, lineHeight: 1.5 }}
            value={draftEn}
            onChange={e => setDraftEn(e.target.value)}
            rows={draftEn.length > 60 ? 2 : 1}
          />
        ) : (
          <span style={{ fontSize: 13, color: '#414755' }}>{entry.en}</span>
        )}
      </td>
      <td>
        {isEditing ? (
          <textarea
            className="input-glass w-full"
            style={{ fontSize: 12.5, padding: '4px 8px', resize: 'none', minHeight: 36, lineHeight: 1.5 }}
            value={draftZh}
            onChange={e => setDraftZh(e.target.value)}
            rows={draftZh.length > 40 ? 2 : 1}
          />
        ) : (
          <span style={{ fontSize: 13, color: '#181C23', fontWeight: entry.zh ? 400 : 300 }}>
            {entry.zh || <span style={{ color: '#C1C6D7', fontStyle: 'italic' }}>未填写</span>}
          </span>
        )}
      </td>
      <td>
        {isEditing ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12, color: '#059669', fontWeight: 600, border: '0.5px solid rgba(5,150,105,0.3)', borderRadius: 6 }}
              onClick={() => onSave(draftEn, draftZh)}
            >
              <Check size={12} /> 保存
            </button>
            <button className="btn-ghost" style={{ padding: 5 }} onClick={onCancel}>
              <X size={13} style={{ color: '#BA1A1A' }} />
            </button>
          </div>
        ) : (
          <button className="btn-ghost" style={{ padding: 5 }} onClick={onEdit}>
            <Edit2 size={13} />
          </button>
        )}
      </td>
    </tr>
  )
}

// ─── Toast preview ────────────────────────────────────────────────────────────

function ToastPreview({ entry, lang }: { entry: CopyEntry; lang: 'en' | 'zh' }) {
  const text = lang === 'zh' ? entry.zh : entry.en
  const variant = entry.toastVariant ?? 'info'
  const cfg = {
    success: { bg: 'rgba(5,150,105,0.08)',  border: 'rgba(5,150,105,0.25)',  color: '#065f46' },
    error:   { bg: 'rgba(186,26,26,0.08)',  border: 'rgba(186,26,26,0.25)',  color: '#7f1d1d' },
    warning: { bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.25)',  color: '#78350f' },
    info:    { bg: 'rgba(0,88,188,0.07)',   border: 'rgba(0,88,188,0.25)',   color: '#1e3a5f' },
  }[variant]
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 9,
      background: cfg.bg, border: `0.5px solid ${cfg.border}`, marginBottom: 6,
    }}>
      {TOAST_ICON[variant]}
      <span style={{ fontSize: 12.5, color: cfg.color, lineHeight: 1.4 }}>{text || '—'}</span>
    </div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function I18nManagementView({ navigateTo }: Props) {
  const [entries, setEntries] = useState<CopyEntry[]>(INITIAL_ENTRIES)
  const [activeModule, setActiveModule] = useState('all')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewLang, setPreviewLang] = useState<'en' | 'zh'>('zh')
  const [savedBanner, setSavedBanner] = useState(false)

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    const matchModule = activeModule === 'all' || e.module === activeModule
    const matchType = filterType === 'all' || e.type === filterType
    const matchQ = !q || e.key.includes(q) || e.en.toLowerCase().includes(q) || e.zh.includes(q)
    return matchModule && matchType && matchQ
  })

  // Group filtered entries by section
  const sections = filtered.reduce<Record<string, CopyEntry[]>>((acc, e) => {
    const key = `${e.module}__${e.section}`
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  const handleSave = (id: string, en: string, zh: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, en, zh, modified: true } : e))
    setEditingId(null)
  }

  const modifiedCount = entries.filter(e => e.modified).length
  const toastEntries = filtered.filter(e => e.type === 'toast')
  const isToastModule = activeModule === 'toast' || activeModule === 'all'

  const handlePublish = () => {
    setEntries(prev => prev.map(e => ({ ...e, modified: false })))
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2800)
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'i18n-entries.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          setEntries(imported)
        }
      } catch (err) {
        console.error('Import failed:', err)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>

      {/* Saved banner */}
      {savedBanner && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 500,
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10,
          background: 'rgba(5,150,105,0.95)', color: '#fff', fontSize: 13, fontWeight: 600,
          boxShadow: '0 6px 24px rgba(5,150,105,0.35)',
          animation: 'fadeSlideDown 0.2s ease',
        }}>
          <CheckCircle2 size={15} /> 文案已发布，页面文字实时更新
        </div>
      )}
      <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #4F46E5, #60CDFF)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Languages size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#181C23' }}>界面文案管理</h1>
            <p style={{ fontSize: 12.5, color: '#717786', marginTop: 1 }}>
              管理所有页面的中英文文案 · {entries.length} 个文案条目
              {modifiedCount > 0 && <span style={{ color: '#d97706', fontWeight: 600, marginLeft: 8 }}>● {modifiedCount} 项待发布</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={handleExport}><Download size={13} />导出 JSON</button>
          <label className="btn-secondary" style={{ fontSize: 12.5, cursor: 'pointer' }}>
            <Upload size={13} /> 导入
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          {modifiedCount > 0 && (
            <button className="btn-primary" style={{ fontSize: 12.5, background: '#059669' }} onClick={handlePublish}>
              <Save size={13} />发布修改（{modifiedCount}）
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr', gap: 14, alignItems: 'start' }}>

        {/* Left nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, position: 'sticky', top: 0 }}>
          {MODULES.map(m => {
            const count = m.id === 'all' ? entries.length : entries.filter(e => e.module === m.id).length
            const modCount = m.id === 'all' ? modifiedCount : entries.filter(e => e.module === m.id && e.modified).length
            const isActive = activeModule === m.id
            return (
              <button
                key={m.id}
                onClick={() => { setActiveModule(m.id); setEditingId(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isActive ? `${m.color}12` : 'transparent',
                  transition: 'all 0.13s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(193,198,215,0.2)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: isActive ? m.color : '#A0A5B4', flexShrink: 0 }}>{m.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#181C23' : '#414755', flex: 1 }}>{m.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {modCount > 0 && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 11, color: '#A0A5B4', fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
                </div>
              </button>
            )
          })}

          {/* Toast preview panel */}
          {activeModule === 'toast' && (
            <div style={{ marginTop: 56, padding: '24px 20px', background: 'rgba(255,255,255,0.6)', borderRadius: 10, border: '0.5px solid rgba(193,198,215,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#414755' }}>提示框预览</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['en', 'zh'] as const).map(l => (
                    <button key={l} onClick={() => setPreviewLang(l)} style={{
                      padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: previewLang === l ? '#4F46E5' : 'rgba(193,198,215,0.25)',
                      color: previewLang === l ? '#fff' : '#717786',
                    }}>{l === 'zh' ? '中' : 'EN'}</button>
                  ))}
                </div>
              </div>
              {entries.filter(e => e.type === 'toast').slice(0, 4).map(e => (
                <ToastPreview key={e.id} entry={e} lang={previewLang} />
              ))}
            </div>
          )}
        </div>

        {/* Main content */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#A0A5B4' }} />
              <input
                className="input-glass w-full"
                style={{ paddingLeft: 28, fontSize: 12.5 }}
                placeholder="搜索文案 Key、英文或中文…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="input-glass" style={{ fontSize: 12.5 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">所有类型</option>
              <option value="label">标签</option>
              <option value="button">按钮</option>
              <option value="placeholder">提示文</option>
              <option value="toast">提示框</option>
              <option value="confirm">确认弹窗</option>
              <option value="validate">表单校验</option>
              <option value="error-page">错误页面</option>
            </select>
            {(search || filterType !== 'all') && (
              <button className="btn-ghost" style={{ fontSize: 12, color: '#BA1A1A' }}
                onClick={() => { setSearch(''); setFilterType('all') }}>
                <X size={12} /> 清除
              </button>
            )}
            <span style={{ fontSize: 12, color: '#A0A5B4', marginLeft: 'auto' }}>{filtered.length} 条</span>
          </div>

          {/* Sections */}
          {Object.entries(sections).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A5B4', fontSize: 13 }}>
              未找到匹配的文案
            </div>
          ) : (
            Object.entries(sections).map(([sectionKey, sectionEntries]) => {
              const [mod, sectionLabel] = sectionKey.split('__')
              const modCfg = MODULES.find(m => m.id === mod)
              return (
                <div key={sectionKey} style={{ marginBottom: 20 }}>
                  {/* Section header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '0 2px' }}>
                    <span style={{ color: modCfg?.color ?? '#A0A5B4', flexShrink: 0 }}>{modCfg?.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#717786', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {modCfg?.label}
                    </span>
                    <ChevronRight size={11} style={{ color: '#C1C6D7' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#414755' }}>{sectionLabel}</span>
                    <span style={{ fontSize: 11, color: '#A0A5B4', fontFamily: "'JetBrains Mono', monospace" }}>({sectionEntries.length})</span>
                  </div>

                  {/* Table */}
                  <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 72, whiteSpace: 'nowrap' }}>类型</th>
                          <th style={{ width: 220 }}>Key</th>
                          <th>English (en-US)</th>
                          <th>中文 (zh-CN)</th>
                          <th style={{ width: 90 }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionEntries.map(entry => (
                          <EntryRow
                            key={entry.id}
                            entry={entry}
                            isEditing={editingId === entry.id}
                            onEdit={() => setEditingId(entry.id)}
                            onSave={(en, zh) => handleSave(entry.id, en, zh)}
                            onCancel={() => setEditingId(null)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
