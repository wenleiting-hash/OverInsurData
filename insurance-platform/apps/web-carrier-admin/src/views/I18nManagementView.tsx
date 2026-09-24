import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search, Edit2, Check, X, Download, Upload, Plus, ChevronRight,
  AlertCircle, CheckCircle2, Info, AlertTriangle, MessageSquare,
  FileText, Globe, Layers, Bell, Shield, Filter, RotateCcw, Save,
  ChevronDown, Copy, Languages,
} from 'lucide-react'
import type { ViewId } from '@/App'
import { useGetTranslations, useUpdateTranslation } from '@/services/i18nService'
import type { TranslationEntry } from '@/services/i18nService'
import { INITIAL_ENTRIES, type CopyEntry } from './data/i18nCopyEntries'

interface Props {
  navigateTo: (view: ViewId) => void
}

// ─── Module config ────────────────────────────────────────────────────────────

const MODULES = [
  { id: 'all',        labelKey: 'i18nMgmt.modules.all',        icon: <Layers size={14} />,      color: '#4F46E5' },
  { id: 'common',     labelKey: 'i18nMgmt.modules.common',     icon: <Globe size={14} />,       color: '#0058BC' },
  { id: 'channel',    labelKey: 'i18nMgmt.modules.channel',    icon: <FileText size={14} />,    color: '#006687' },
  { id: 'carrier',    labelKey: 'i18nMgmt.modules.carrier',    icon: <Shield size={14} />,      color: '#7c3aed' },
  { id: 'commission', labelKey: 'i18nMgmt.modules.commission', icon: <FileText size={14} />,    color: '#059669' },
  { id: 'toast',      labelKey: 'i18nMgmt.modules.toast',      icon: <Bell size={14} />,        color: '#d97706' },
  { id: 'modal',      labelKey: 'i18nMgmt.modules.modal',      icon: <MessageSquare size={14} />, color: '#BA1A1A' },
  { id: 'validate',   labelKey: 'i18nMgmt.modules.validate',   icon: <AlertCircle size={14} />, color: '#9333ea' },
  { id: 'error-page', labelKey: 'i18nMgmt.modules.errorPage',  icon: <AlertTriangle size={14} />, color: '#c2410c' },
]

const TYPE_CONFIG: Record<string, { bg: string; color: string; labelKey: string }> = {
  label:       { bg: 'rgba(79,70,229,0.08)',   color: '#4F46E5',  labelKey: 'i18nMgmt.types.label' },
  button:      { bg: 'rgba(0,88,188,0.08)',    color: '#0058BC',  labelKey: 'i18nMgmt.types.button' },
  placeholder: { bg: 'rgba(113,119,134,0.12)', color: '#717786',  labelKey: 'i18nMgmt.types.placeholder' },
  toast:       { bg: 'rgba(217,119,6,0.10)',   color: '#d97706',  labelKey: 'i18nMgmt.types.toast' },
  confirm:     { bg: 'rgba(186,26,26,0.08)',   color: '#BA1A1A',  labelKey: 'i18nMgmt.types.confirm' },
  validate:    { bg: 'rgba(147,51,234,0.09)',  color: '#9333ea',  labelKey: 'i18nMgmt.types.validate' },
  'error-page':{ bg: 'rgba(194,65,12,0.08)',   color: '#c2410c',  labelKey: 'i18nMgmt.types.errorPage' },
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
  const { t } = useTranslation('common')
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
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{TOAST_ICON[entry.toastVariant]}{t(typeCfg.labelKey)}</span>
            : t(typeCfg.labelKey)
          }
        </span>
      </td>
      <td>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: '#717786' }}>
          {entry.key}
        </span>
        {entry.modified && (
          <span style={{ marginLeft: 6, fontSize: 10, color: '#059669', fontWeight: 600 }}>{t('i18nMgmt.modified')}</span>
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
            {entry.zh || <span style={{ color: '#C1C6D7', fontStyle: 'italic' }}>{t('i18nMgmt.notFilled')}</span>}
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
              <Check size={12} /> {t('i18nMgmt.save')}
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
  const { t } = useTranslation('common')
  const { data: apiData, isLoading, refetch } = useGetTranslations({ pageSize: 200 })
  const updateMutation = useUpdateTranslation()

  // Map API data to CopyEntry format, fallback to mock data
  const apiEntries: CopyEntry[] = (apiData?.data || []).map((te: TranslationEntry) => ({
    id: te.ovwr_translation_id,
    module: te.ovwr_module || te.ovwr_namespace,
    section: te.ovwr_section || te.ovwr_namespace,
    key: te.ovwr_key,
    en: te.ovwr_en_us || '',
    zh: te.ovwr_zh_cn || '',
    type: (te.ovwr_type as CopyEntry['type']) || 'label',
  }))
  const [entries, setEntries] = useState<CopyEntry[]>(apiEntries.length > 0 ? apiEntries : INITIAL_ENTRIES)

  // Sync API data when it arrives
  useEffect(() => {
    if (apiEntries.length > 0) {
      setEntries(apiEntries)
    }
  }, [apiData])

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

  const handleSave = async (id: string, en: string, zh: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        dto: { ovwrEnUS: en, ovwrZhCN: zh },
      })
      refetch()
    } catch (err) {
      console.error('Failed to save translation:', err)
    }
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
          <CheckCircle2 size={15} /> {t('i18nMgmt.publishedBanner')}
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
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#181C23' }}>{t('i18nMgmt.title')}</h1>
            <p style={{ fontSize: 12.5, color: '#717786', marginTop: 1 }}>
              {t('i18nMgmt.subtitle', { count: entries.length })}
              {modifiedCount > 0 && <span style={{ color: '#d97706', fontWeight: 600, marginLeft: 8 }}>{t('i18nMgmt.pendingCount', { count: modifiedCount })}</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={handleExport}><Download size={13} />{t('i18nMgmt.exportJson')}</button>
          <label className="btn-secondary" style={{ fontSize: 12.5, cursor: 'pointer' }}>
            <Upload size={13} /> {t('i18nMgmt.import')}
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          {modifiedCount > 0 && (
            <button className="btn-primary" style={{ fontSize: 12.5, background: '#059669' }} onClick={handlePublish}>
              <Save size={13} />{t('i18nMgmt.publish', { count: modifiedCount })}
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
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#181C23' : '#414755', flex: 1 }}>{t(m.labelKey)}</span>
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
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#414755' }}>{t('i18nMgmt.toastPreview')}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['en', 'zh'] as const).map(l => (
                    <button key={l} onClick={() => setPreviewLang(l)} style={{
                      padding: '2px 7px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                      background: previewLang === l ? '#4F46E5' : 'rgba(193,198,215,0.25)',
                      color: previewLang === l ? '#fff' : '#717786',
                    }}>{l === 'zh' ? t('i18nMgmt.previewZh') : t('i18nMgmt.previewEn')}</button>
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
                placeholder={t('i18nMgmt.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="input-glass" style={{ fontSize: 12.5 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">{t('i18nMgmt.filterAll')}</option>
              <option value="label">{t('i18nMgmt.types.label')}</option>
              <option value="button">{t('i18nMgmt.types.button')}</option>
              <option value="placeholder">{t('i18nMgmt.types.placeholder')}</option>
              <option value="toast">{t('i18nMgmt.types.toast')}</option>
              <option value="confirm">{t('i18nMgmt.types.confirm')}</option>
              <option value="validate">{t('i18nMgmt.types.validate')}</option>
              <option value="error-page">{t('i18nMgmt.types.errorPage')}</option>
            </select>
            {(search || filterType !== 'all') && (
              <button className="btn-ghost" style={{ fontSize: 12, color: '#BA1A1A' }}
                onClick={() => { setSearch(''); setFilterType('all') }}>
                <X size={12} /> {t('i18nMgmt.clear')}
              </button>
            )}
            <span style={{ fontSize: 12, color: '#A0A5B4', marginLeft: 'auto' }}>{t('i18nMgmt.resultCount', { count: filtered.length })}</span>
          </div>

          {/* Sections */}
          {Object.entries(sections).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#A0A5B4', fontSize: 13 }}>
              {t('i18nMgmt.noResults')}
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
                      {modCfg ? t(modCfg.labelKey) : ''}
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
                          <th style={{ width: 72, whiteSpace: 'nowrap' }}>{t('i18nMgmt.col.type')}</th>
                          <th style={{ width: 220 }}>{t('i18nMgmt.col.key')}</th>
                          <th>{t('i18nMgmt.col.en')}</th>
                          <th>{t('i18nMgmt.col.zh')}</th>
                          <th style={{ width: 90 }}>{t('i18nMgmt.col.actions')}</th>
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
