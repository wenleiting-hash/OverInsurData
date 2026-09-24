import { useState } from 'react';
import { X, Download, FileText, Table, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** 导出字段选项（label 需由调用方完成翻译） */
export interface ExportFieldOption {
  key: string;
  label: string;
  selected: boolean;
}

/** 导出关联数据选项 */
export interface ExportRelatedOption {
  key: string;
  label: string;
}

/** 用户在弹窗中确认的导出选项（字段/关联均为已勾选的 key 列表） */
export interface BatchExportOptions {
  scope: 'filtered' | 'selected' | 'all';
  format: 'xlsx' | 'csv';
  fields: string[];
  related: string[];
}

interface Props {
  totalCount: number;
  selectedCount: number;
  filteredCount: number;
  onClose: () => void;
  onExport: (opts: BatchExportOptions) => void;
  /** 可选：自定义导出字段（如产品模块）；缺省使用保险公司字段 */
  customFields?: ExportFieldOption[];
  /** 可选：自定义关联数据项；传空数组则隐藏该区域；缺省使用保险公司关联项 */
  customRelated?: ExportRelatedOption[];
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
];

const RELATED_DATA = [
  { key: 'products' },
  { key: 'channels' },
  { key: 'performance' },
  { key: 'contacts' },
];

export default function BatchExportModal({ totalCount, selectedCount, filteredCount, onClose, onExport, customFields, customRelated }: Props) {
  const { t } = useTranslation(['insurer', 'common']);
  const fieldLabel: Record<string, string> = {
    name: t('modals.batchExport.fName'),
    shortName: t('modals.batchExport.fShortName'),
    naicCode: t('modals.batchExport.fNaic'),
    type: t('modals.batchExport.fType'),
    amBestRating: t('modals.batchExport.fAmBest'),
    spRating: t('modals.batchExport.fSp'),
    headquarters: t('modals.batchExport.fHq'),
    region: t('modals.batchExport.fRegion'),
    founded: t('modals.batchExport.fFounded'),
    website: t('modals.batchExport.fWebsite'),
    totalPremium: t('modals.batchExport.fPremium'),
    policyCount: t('modals.batchExport.fPolicies'),
    lossRatio: t('modals.batchExport.fLossRatio'),
    renewalRate: t('modals.batchExport.fRenewal'),
    channelCount: t('modals.batchExport.fChannels'),
    productCount: t('modals.batchExport.fProducts'),
    settlementCycle: t('modals.batchExport.fSettlement'),
    coopStatus: t('modals.batchExport.fCoop'),
    contractExpiry: t('modals.batchExport.fContractExpiry'),
    commissionIncome: t('modals.batchExport.fCommission'),
  };
  const relatedLabel: Record<string, string> = {
    products: t('modals.batchExport.relProducts'),
    channels: t('modals.batchExport.relChannels'),
    performance: t('modals.batchExport.relPerformance'),
    contacts: t('modals.batchExport.relContacts'),
  };
  // 字段 / 关联项：调用方可传入自定义列表（如产品模块），缺省用保险公司字段
  const activeFields: ExportFieldOption[] = customFields ?? FIELDS.map(f => ({ key: f.key, label: fieldLabel[f.key], selected: f.selected }));
  const activeRelated: ExportRelatedOption[] = customRelated ?? RELATED_DATA.map(r => ({ key: r.key, label: relatedLabel[r.key] }));
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [scope, setScope] = useState<'filtered' | 'selected' | 'all'>('filtered');
  const [fields, setFields] = useState<Record<string, boolean>>(() => Object.fromEntries(activeFields.map(f => [f.key, f.selected])));
  const [related, setRelated] = useState<Record<string, boolean>>(() => Object.fromEntries(activeRelated.map(r => [r.key, false])));
  const [exporting, setExporting] = useState(false);

  const selectedFieldCount = Object.values(fields).filter(Boolean).length;

  const handleExport = () => {
    // 真正的取数/生成在父视图异步完成；弹窗只负责把勾选结果原样传出
    onExport({
      scope,
      format,
      fields: activeFields.filter(f => fields[f.key]).map(f => f.key),
      related: activeRelated.filter(r => related[r.key]).map(r => r.key),
    });
    setExporting(false);
    onClose();
  };

  const scopeOptions = [
    { val: 'filtered' as const, label: t('modals.batchExport.scopeFiltered'), desc: t('modals.batchExport.scopeFilteredDesc', { count: filteredCount }) },
    { val: 'selected' as const, label: t('modals.batchExport.scopeSelected'), desc: t('modals.batchExport.scopeSelectedDesc', { count: selectedCount }), disabled: selectedCount === 0 },
    { val: 'all' as const, label: t('modals.batchExport.scopeAll'), desc: t('modals.batchExport.scopeAllDesc', { count: totalCount }) },
  ];

  const scopeCount = scope === 'filtered' ? filteredCount : scope === 'selected' ? selectedCount : totalCount;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-strong" style={{ width: 620, maxWidth: 'calc(100vw - 32px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.14)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={16} style={{ color: '#0058BC' }} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{t('modals.batchExport.title')}</div>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ padding: '22px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Scope */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t('modals.batchExport.scopeTitle')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {scopeOptions.map(opt => (
                <label key={opt.val} style={{
                  display: 'flex', gap: 12, padding: '10px 16px', borderRadius: 10, cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  background: scope === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${scope === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                  opacity: opt.disabled ? 0.45 : 1,
                }}>
                  <input type="radio" name="scope" checked={scope === opt.val} onChange={() => !opt.disabled && setScope(opt.val)} disabled={opt.disabled} style={{ display: 'none' }} />
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${scope === opt.val ? '#0058BC' : '#C1C6D7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    {scope === opt.val && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0058BC' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#717786' }}>{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Format */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t('modals.batchExport.formatTitle')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: 'xlsx', label: 'Excel (.xlsx)', icon: <Table size={16} />, desc: t('modals.batchExport.fmtXlsxDesc') },
                { val: 'csv', label: 'CSV (.csv)', icon: <FileText size={16} />, desc: t('modals.batchExport.fmtCsvDesc') },
              ].map(opt => (
                <label key={opt.val} style={{ flex: 1, display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                  background: format === opt.val ? 'rgba(0,88,188,0.08)' : 'rgba(255,255,255,0.6)',
                  border: `0.5px solid ${format === opt.val ? '#0058BC' : 'rgba(193,198,215,0.5)'}`,
                }}>
                  <input type="radio" name="format" checked={format === opt.val} onChange={() => setFormat(opt.val as 'xlsx' | 'csv')} style={{ display: 'none' }} />
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
              <div style={{ fontSize: 13, fontWeight: 600, color: '#414755' }}>
                {t('modals.batchExport.fieldsTitle')} <span style={{ color: '#717786', fontWeight: 400 }}>{t('modals.batchExport.fieldsSelected', { count: selectedFieldCount, total: activeFields.length })}</span>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(activeFields.map(f => [f.key, true])))}>{t('modals.batchExport.selectAll')}</button>
                <button className="btn-ghost" style={{ fontSize: 11.5, padding: '3px 8px' }} onClick={() => setFields(Object.fromEntries(activeFields.map(f => [f.key, false])))}>{t('modals.batchExport.clearAll')}</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, background: 'rgba(241,243,254,0.6)', borderRadius: 12, padding: '12px 14px' }}>
              {activeFields.map(f => (
                <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '4px 0' }}>
                  <input type="checkbox" checked={fields[f.key]} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.checked }))} style={{ accentColor: '#0058BC', width: 13, height: 13 }} />
                  <span style={{ fontSize: 12.5, color: '#181C23' }}>{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Related data */}
          {activeRelated.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#414755', marginBottom: 10 }}>{t('modals.batchExport.relatedTitle')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {activeRelated.map(r => (
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
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(241,243,254,0.5)' }}>
          <div style={{ fontSize: 12.5, color: '#717786' }}>
            {t('modals.batchExport.footerPrefix')}<strong style={{ color: '#181C23' }}>{t('modals.batchExport.footerRecords', { count: scopeCount })}</strong> · <strong style={{ color: '#181C23' }}>{t('modals.batchExport.footerFields', { count: selectedFieldCount })}</strong>
            {Object.values(related).some(Boolean) && <span>{t('modals.batchExport.footerRelated')}</span>}
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={onClose}>{t('common:common.cancel')}</button>
            <button
              className="btn-primary"
              style={{ fontSize: 13 }}
              onClick={handleExport}
              disabled={exporting || selectedFieldCount === 0}
            >
              {exporting
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{t('modals.batchExport.exporting')}</>
                : <><Download size={14} />{t('modals.batchExport.exportBtn', { format: format.toUpperCase() })}</>}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
