import { useState } from 'react'
import { X, Download, FileText, Table, CheckCircle } from 'lucide-react'
import { useLang } from '../i18n'

interface Props {
  totalCount: number
  selectedCount: number
  filteredCount: number
  onClose: () => void
  onExport: () => void
}

const FIELDS = [
  { key: 'name', selected: true },
  { key: 'shortName', selected: true },
  { key: 'naicCode', selected: true },
  { key: 'type', selected: true },
  { key: 'amBestRating', selected: true },
  { key: 'spRating', selected: false },
  { key: 'headquarters', selected: true },
  { key: 'region', selected: true },
  { key: 'founded', selected: false },
  { key: 'website', selected: false },
  { key: 'totalPremium', selected: true },
  { key: 'policyCount', selected: true },
  { key: 'lossRatio', selected: true },
  { key: 'renewalRate', selected: true },
  { key: 'channelCount', selected: false },
  { key: 'productCount', selected: false },
  { key: 'settlementCycle', selected: true },
  { key: 'coopStatus', selected: true },
  { key: 'contractExpiry', selected: true },
  { key: 'commissionIncome', selected: false },
]

const RELATED_DATA = [
  { key: 'products' },
  { key: 'channels' },
  { key: 'performance' },
  { key: 'contacts' },
]

export default function BatchExportModal({ totalCount, selectedCount, filteredCount, onClose, onExport }: Props) {
  const { t } = useLang()
  const fieldLabel: Record<string, string> = {
    name: t.bemFName,
    shortName: t.bemFShortName,
    naicCode: t.bemFNaic,
    type: t.bemFType,
    amBestRating: t.bemFAmBest,
    spRating: t.bemFSp,
    headquarters: t.bemFHq,
    region: t.bemFRegion,
    founded: t.bemFFounded,
    website: t.bemFWebsite,
    totalPremium: t.bemFPremium,
    policyCount: t.bemFPolicies,
    lossRatio: t.bemFLossRatio,
    renewalRate: t.bemFRenewal,
    channelCount: t.bemFChannels,
    productCount: t.bemFProducts,
    settlementCycle: t.bemFSettlement,
    coopStatus: t.bemFCoop,
    contractExpiry: t.bemFContractExpiry,
    commissionIncome: t.bemFCommission,
  }
  const relatedLabel: Record<string, string> = {
    products: t.bemRelProducts,
    channels: t.bemRelChannels,
    performance: t.bemRelPerformance,
    contacts: t.bemRelContacts,
  }
  const [scope, setScope] = useState<'filtered' | 'selected' | 'all'>('filtered')
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [fields, setFields] = useState(() => Object.fromEntries(FIELDS.map(f => [f.key, f.selected])))
  const [related, setRelated] = useState(() => Object.fromEntries(RELATED_DATA.map(r => [r.key, false])))
  const [exporting, setExporting] = useState(false)

  const selectedFieldCount = Object.values(fields).filter(Boolean).length

  const scopeCount = scope === 'all' ? totalCount : scope === 'selected' ? selectedCount : filteredCount

  const handleExport = () => {
    setExporting(true)
    setTimeout(() => { setExporting(false); onExport(); onClose() }, 1400)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="glass-strong" style={{ width: 620, borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={16} style={{ color: '#0058BC' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{t.bemTitle}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Scope */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t.bemScopeTitle}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { val: 'filtered', label: t.bemScopeFiltered, count: filteredCount },
                { val: 'selected', label: t.bemScopeSelected, count: selectedCount, disabled: selectedCount === 0 },
                { val: 'all', label: t.bemScopeAll, count: totalCount },
              ].map(opt => (
                <label
                  key={opt.val}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 9, cursor: opt.disabled ? 'not-allowed' : 'pointer', opacity: opt.disabled ? 0.4 : 1,
                    background: scope === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                    border: `0.5px solid ${scope === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  }}
                >
                  <input type="radio" name="scope" checked={scope === opt.val} disabled={opt.disabled} onChange={() => !opt.disabled && setScope(opt.val as any)} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13.5, flex: 1 }}>{opt.label}</span>
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>{t.bemCount(opt.count)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t.bemFormatTitle}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'xlsx', label: 'Excel (.xlsx)', icon: <Table size={16} />, desc: t.bemFmtXlsxDesc },
                { val: 'csv', label: 'CSV (.csv)', icon: <FileText size={16} />, desc: t.bemFmtCsvDesc },
              ].map(opt => (
                <label key={opt.val} style={{ flex: 1, display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  background: format === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${format === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                }}>
                  <input type="radio" name="format" checked={format === opt.val} onChange={() => setFormat(opt.val as any)} style={{ display: 'none' }} />
                  <div style={{ color: format === opt.val ? '#0058BC' : '#717786' }}>{opt.icon}</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#717786' }}>{opt.desc}</div>
                  </div>
                  {format === opt.val && <CheckCircle size={14} style={{ color: '#0058BC', marginLeft: 'auto' }} />}
                </label>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div style={{ marginBottom: 18 }}>
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755' }}>{t.bemFieldsTitle} <span style={{ color: '#717786', fontWeight: 400 }}>{t.bemFieldsSelected(selectedFieldCount, FIELDS.length)}</span></div>
              <div className="flex gap-2">
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(FIELDS.map(f => [f.key, true])))}>{t.bemSelectAll}</button>
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(FIELDS.map(f => [f.key, false])))}>{t.bemClearAll}</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: 'rgba(241,243,254,0.6)', borderRadius: 12, padding: '12px 14px' }}>
              {FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 0' }}>
                  <input type="checkbox" checked={fields[f.key]} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.checked }))} style={{ accentColor: '#0058BC', width: 13, height: 13 }} />
                  <span style={{ fontSize: 12.5, color: '#181C23' }}>{fieldLabel[f.key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related data */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t.bemRelatedTitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {RELATED_DATA.map(r => (
                <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                  background: related[r.key] ? 'rgba(0,88,188,0.07)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${related[r.key] ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="checkbox" checked={related[r.key]} onChange={e => setRelated(p => ({ ...p, [r.key]: e.target.checked }))} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13, color: '#181C23' }}>{relatedLabel[r.key]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(241,243,254,0.5)' }}>
          <div style={{ fontSize: 12.5, color: '#717786' }}>
            {t.bemFooterPrefix}<strong style={{ color: '#181C23' }}>{t.bemFooterRecords(scopeCount)}</strong> · <strong style={{ color: '#181C23' }}>{t.bemFooterFields(selectedFieldCount)}</strong>
            {Object.values(related).some(Boolean) && <span>{t.bemFooterRelated}</span>}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t.insCancel}</button>
            <button
              className="btn-primary"
              style={{ fontSize: 13 }}
              onClick={handleExport}
              disabled={exporting || selectedFieldCount === 0}
            >
              {exporting
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{t.bemExporting}</>
                : <><Download size={14} />{t.bemExportBtn(format.toUpperCase())}</>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
