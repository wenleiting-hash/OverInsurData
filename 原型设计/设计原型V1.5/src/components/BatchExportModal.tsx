import { useState } from 'react'
import { X, Download, FileText, Table, CheckCircle } from 'lucide-react'

interface Props {
  totalCount: number
  selectedCount: number
  filteredCount: number
  onClose: () => void
  onExport: () => void
}

const FIELDS = [
  { key: 'name', label: '公司全称', selected: true },
  { key: 'shortName', label: '公司简称', selected: true },
  { key: 'naicCode', label: 'NAIC 编码', selected: true },
  { key: 'type', label: '公司类型', selected: true },
  { key: 'amBestRating', label: 'AM Best 评级', selected: true },
  { key: 'spRating', label: 'S&P 评级', selected: false },
  { key: 'headquarters', label: '总部信息', selected: true },
  { key: 'region', label: '大区', selected: true },
  { key: 'founded', label: '成立年份', selected: false },
  { key: 'website', label: '官方网站', selected: false },
  { key: 'totalPremium', label: '总保费', selected: true },
  { key: 'policyCount', label: '保单数', selected: true },
  { key: 'lossRatio', label: '赔付率', selected: true },
  { key: 'renewalRate', label: '续保率', selected: true },
  { key: 'channelCount', label: '合作渠道数', selected: false },
  { key: 'productCount', label: '产品数', selected: false },
  { key: 'settlementCycle', label: '结算周期', selected: true },
  { key: 'coopStatus', label: '合作状态', selected: true },
  { key: 'contractExpiry', label: '合同到期日', selected: true },
  { key: 'commissionIncome', label: '佣金收入', selected: false },
]

const RELATED_DATA = [
  { key: 'products', label: '关联产品列表' },
  { key: 'channels', label: '合作渠道列表' },
  { key: 'performance', label: '业绩数据摘要' },
  { key: 'contacts', label: '对接人信息' },
]

export default function BatchExportModal({ totalCount, selectedCount, filteredCount, onClose, onExport }: Props) {
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>批量导出</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Scope */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>导出范围</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { val: 'filtered', label: '当前筛选结果', count: filteredCount },
                { val: 'selected', label: '已勾选记录', count: selectedCount, disabled: selectedCount === 0 },
                { val: 'all', label: '全部数据', count: totalCount },
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
                  <span className="badge badge-blue" style={{ fontSize: 11 }}>{opt.count} 条</span>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>导出格式</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'xlsx', label: 'Excel (.xlsx)', icon: <Table size={16} />, desc: '推荐，支持格式化' },
                { val: 'csv', label: 'CSV (.csv)', icon: <FileText size={16} />, desc: '通用，纯文本' },
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
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755' }}>导出字段 <span style={{ color: '#717786', fontWeight: 400 }}>（已选 {selectedFieldCount} / {FIELDS.length} 个）</span></div>
              <div className="flex gap-2">
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(FIELDS.map(f => [f.key, true])))}>全选</button>
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(FIELDS.map(f => [f.key, false])))}>清空</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: 'rgba(241,243,254,0.6)', borderRadius: 12, padding: '12px 14px' }}>
              {FIELDS.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 0' }}>
                  <input type="checkbox" checked={fields[f.key]} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.checked }))} style={{ accentColor: '#0058BC', width: 13, height: 13 }} />
                  <span style={{ fontSize: 12.5, color: '#181C23' }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related data */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>关联数据</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {RELATED_DATA.map(r => (
                <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 9, cursor: 'pointer',
                  background: related[r.key] ? 'rgba(0,88,188,0.07)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${related[r.key] ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                }}>
                  <input type="checkbox" checked={related[r.key]} onChange={e => setRelated(p => ({ ...p, [r.key]: e.target.checked }))} style={{ accentColor: '#0058BC' }} />
                  <span style={{ fontSize: 13, color: '#181C23' }}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(241,243,254,0.5)' }}>
          <div style={{ fontSize: 12.5, color: '#717786' }}>
            将导出 <strong style={{ color: '#181C23' }}>{scopeCount} 条</strong> · <strong style={{ color: '#181C23' }}>{selectedFieldCount} 个字段</strong>
            {Object.values(related).some(Boolean) && <span> + 关联数据</span>}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>取消</button>
            <button
              className="btn-primary"
              style={{ fontSize: 13 }}
              onClick={handleExport}
              disabled={exporting || selectedFieldCount === 0}
            >
              {exporting
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />导出中…</>
                : <><Download size={14} />导出 {format.toUpperCase()}</>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
