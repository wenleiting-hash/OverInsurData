import { useState, useMemo } from 'react';
import {
  Search, Plus, Download, Upload, Copy, MoreHorizontal, Eye, Edit2, XCircle, CheckCircle,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import { insurers, formatCurrency, formatPercent } from './data/mockDashboardData';
import type { ViewId } from '@/App';
import { useTranslation } from 'react-i18next';
import DisableModal from '@/components/DisableModal';
import BatchExportModal from '@/components/BatchExportModal';

interface Props {
  navigateTo: (view: ViewId, params?: any) => void;
}

type SortKey = 'name' | 'totalPremium' | 'lossRatio' | 'renewalRate' | 'naicCode';
type SortDir = 'asc' | 'desc';

export default function InsurerList({ navigateTo }: Props) {
  const { t } = useTranslation(['insurer', 'common']);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('totalPremium');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [disableTarget, setDisableTarget] = useState<string | null>(null);
  
  const pageSize = 8;

  const filtered = useMemo(() => {
    return insurers.filter(ins => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        ins.shortName.toLowerCase().includes(q) ||
        ins.carrierName.toLowerCase().includes(q) ||
        ins.naicCode.toLowerCase().includes(q);
      const matchType = filterType === 'all' || ins.type === filterType;
      const matchStatus = filterStatus === 'all' || ins.status === filterStatus;
      const matchRegion = filterRegion === 'all' || ins.region === filterRegion;
      const matchRating = filterRating === 'all' || ins.amBestRating === filterRating;
      return matchSearch && matchType && matchStatus && matchRegion && matchRating;
    });
  }, [search, filterType, filterStatus, filterRegion, filterRating]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === pageData.length && pageData.length > 0) setSelected(new Set());
    else setSelected(new Set(pageData.map(i => i.carrierId)));
  };

  const handleExport = () => {
    // Build CSV content
    const headers = [
      t('list.csvHeaders.naicCode'), t('list.csvHeaders.companyName'), t('list.csvHeaders.companyType'),
      t('list.csvHeaders.amBestRating'), t('list.csvHeaders.status'), t('list.csvHeaders.region'),
      t('list.csvHeaders.totalPremium'), t('list.csvHeaders.lossRatio'), t('list.csvHeaders.renewalRate'),
      t('list.csvHeaders.settlementCycle'),
    ];
    const csvData = sorted.map(ins => [
      ins.naicCode,
      `"${ins.carrierName}"`,
      ins.type,
      ins.amBestRating,
      ins.status,
      ins.region,
      formatCurrency(ins.revenue ?? 0, true),
      formatPercent(ins.lossRatio ?? 0),
      formatPercent(ins.renewalRate ?? 0),
      ins.settlementCycle,
    ].join(','));
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `insurer-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} style={{ opacity: 0.3 }} />
  );

  const statusConfig = {
    active: { cls: 'badge-green', orb: 'orb-green', label: 'table.active', color: '#1a7a2e' },
    inactive: { cls: 'badge-gray', orb: 'orb-gray', label: 'table.inactive', color: '#414755' },
    pending: { cls: 'badge-yellow', orb: 'orb-yellow', label: 'table.pending', color: '#7a5c00' },
  };

  // Cooperation status column (V1.3: 4-state display driven by coopStatus)
  const coopConfig: Record<string, { orb: string; label: string; color: string }> = {
    active: { orb: 'orb-green', label: 'detail.coop.active', color: '#1a7a2e' },
    expiring: { orb: 'orb-orange', label: 'detail.coop.expiring', color: '#a05800' },
    negotiating: { orb: 'orb-purple', label: 'detail.coop.negotiating', color: '#0058BC' },
    pending: { orb: 'orb-purple', label: 'detail.coop.negotiating', color: '#0058BC' },
    suspended: { orb: 'orb-gray', label: 'detail.coop.terminated', color: '#BA1A1A' },
    terminated: { orb: 'orb-gray', label: 'detail.coop.terminated', color: '#BA1A1A' },
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#181C23' }}>{t('listTitle')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t('listSubtitle', { count: insurers.length, filtered: filtered.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-duplicate')}>
            <Copy size={14} /> {t('actions.duplicateCheck')}
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-import')}>
            <Upload size={14} /> {t('actions.batchImport')}
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setShowExport(true)}>
            <Download size={14} /> {t('actions.export')}
          </button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-new')}>
            <Plus size={14} /> {t('actions.addInsurer')}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card flex items-center gap-3 flex-wrap" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            type="text"
            placeholder={t('filters.searchPlaceholder')}
            className="input-glass w-full"
            style={{ paddingLeft: 30, fontSize: 13 }}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
          <option value="all">{t('filters.type')}</option>
          <option value="Admitted">{t('filters.admitted')}</option>
          <option value="Non-Admitted">{t('filters.nonAdmitted')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="all">{t('filters.status')}</option>
          <option value="active">{t('filters.active')}</option>
          <option value="pending">{t('filters.pending')}</option>
          <option value="inactive">{t('filters.inactive')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}>
          <option value="all">{t('filters.region')}</option>
          <option value="Northeast">{t('filters.northeast')}</option>
          <option value="Southeast">{t('filters.southeast')}</option>
          <option value="Midwest">{t('filters.midwest')}</option>
          <option value="West">{t('filters.west')}</option>
          <option value="National">{t('filters.national')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={filterRating} onChange={e => { setFilterRating(e.target.value); setPage(1); }}>
          <option value="all">{t('filters.rating')}</option>
          <option value="A++">{t('filters.A++')}</option>
          <option value="A+">{t('filters.A+')}</option>
          <option value="A">{t('filters.A')}</option>
          <option value="A-">{t('filters.A-')}</option>
          <option value="BBB+">{t('filters.BBB+')}</option>
        </select>
        {(search || filterType !== 'all' || filterStatus !== 'all' || filterRegion !== 'all' || filterRating !== 'all') && (
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => { setSearch(''); setFilterType('all'); setFilterStatus('all'); setFilterRegion('all'); setFilterRating('all'); setPage(1); }}>
            <XCircle size={13} /> {t('filters.reset')}
          </button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="glass-light flex items-center gap-3 px-4 py-2.5 mb-3" style={{ borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#0058BC', fontWeight: 500 }}>
            {t('bulkActions.selectedCount', { count: selected.size })}
          </span>
          <button className="btn-ghost" style={{ fontSize: 12.5 }}><CheckCircle size={13} /> {t('bulkActions.batchEnable')}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }}><XCircle size={13} /> {t('bulkActions.batchDisable')}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setShowExport(true)}><Download size={13} /> {t('bulkActions.exportSelected')}</button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>{t('bulkActions.cancelSelection')}</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <span className="flex items-center gap-1">{t('table.companyName')} <SortIcon k="name" /></span>
                </th>
                <th>{t('table.naicCode')}</th>
                <th>{t('table.companyType')}</th>
                <th>{t('table.amBestRating')}</th>
                <th>{t('table.region')}</th>
                <th onClick={() => handleSort('totalPremium')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('table.totalPremium')} <SortIcon k="totalPremium" /></span>
                </th>
                <th style={{ textAlign: 'right' }}>{t('table.policyCount')}</th>
                <th onClick={() => handleSort('lossRatio')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('table.lossRatio')} <SortIcon k="lossRatio" /></span>
                </th>
                <th onClick={() => handleSort('renewalRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                  <span className="flex items-center gap-1 justify-end">{t('table.renewalRate')} <SortIcon k="renewalRate" /></span>
                </th>
                <th>{t('table.settlementMethod')}</th>
                <th>{t('table.cooperationStatus')}</th>
                <th style={{ width: 80 }}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(ins => {
                const sc = statusConfig[ins.status as 'active' | 'inactive' | 'pending'] || statusConfig.active;
                return (
                  <tr
                    key={ins.carrierId}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigateTo('insurer-detail', { carrierId: ins.carrierId })}
                  >
                    <td onClick={e => { e.stopPropagation(); toggleSelect(ins.carrierId); }}>
                      <input type="checkbox" checked={selected.has(ins.carrierId)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{ins.shortName}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 1 }}>{ins.carrierName.length > 28 ? ins.carrierName.slice(0, 28) + '…' : ins.carrierName}</div>
                    </td>
                    <td>
                      <span className="font-data" style={{ fontSize: 12.5, color: '#414755', letterSpacing: 0.3 }}>{ins.naicCode}</span>
                    </td>
                    <td>
                      <span className={`badge ${ins.type === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11.5 }}>
                        {ins.type === 'Admitted' ? t('filters.admitted') : t('filters.nonAdmitted')}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-data"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: ins.amBestRating?.startsWith('A+') ? '#1a7a2e' : ins.amBestRating?.startsWith('A') ? '#0058BC' : '#414755',
                        }}
                      >
                        {ins.amBestRating || '-'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>{ins.region || '-'}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#181C23', fontWeight: 500 }}>
                      {formatCurrency(ins.revenue ?? 0, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#414755' }}>
                      {(ins.policyCount ?? 0).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className="font-data"
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: (ins.lossRatio ?? 0) > 0.65 ? '#BA1A1A' : (ins.lossRatio ?? 0) > 0.60 ? '#a05800' : '#1a7a2e',
                        }}
                      >
                        {formatPercent(ins.lossRatio ?? 0)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#414755' }}>
                      {formatPercent(ins.renewalRate ?? 0)}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{ins.settlementCycle === 'Monthly' ? t('table.monthly') : t('table.quarterly')}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const cc = coopConfig[ins.coopStatus ?? ins.status] ?? coopConfig.active;
                          return (
                            <>
                              <span className={`orb ${cc.orb}`} />
                              <span style={{ fontSize: 12.5, color: cc.color }}>{t(cc.label)}</span>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('table.viewDetails')}
                          onClick={() => navigateTo('insurer-detail', { carrierId: ins.carrierId })}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('table.edit')}
                          onClick={() => navigateTo('insurer-edit', { carrierId: ins.carrierId })}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={ins.status === 'inactive' ? t('detail.actions.enable') : t('detail.actions.disable')}
                          onClick={() => setDisableTarget(ins.carrierId)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between"
          style={{ padding: '12px 18px', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}
        >
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 12.5, color: '#717786' }}>
              {t('pagination.totalCount', { count: sorted.length, page: page, pages: totalPages })}
            </span>
            <select className="input-glass" style={{ fontSize: 12, padding: '4px 24px 4px 8px' }}>
              <option>{t('pagination.pageSize')}</option>
              <option>{t('pagination.pageSize20')}</option>
              <option>{t('pagination.pageSize50')}</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page <= 1} onClick={() => setPage(1)}>«</button>
            <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const n = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return n <= totalPages ? (
                <button
                  key={n}
                  className="btn-ghost"
                  style={{ fontSize: 12.5, padding: '5px 10px', background: n === page ? 'rgba(0,88,188,0.10)' : undefined, color: n === page ? '#0058BC' : undefined, fontWeight: n === page ? 600 : undefined }}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ) : null;
            })}
            <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            <button className="btn-ghost" style={{ fontSize: 12.5, padding: '5px 10px' }} disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
          </div>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12 text-[#717786]">{t('emptyState')}</div>
      )}

      {showExport && (
        <BatchExportModal
          totalCount={insurers.length}
          selectedCount={selected.size}
          filteredCount={filtered.length}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
        />
      )}

      {disableTarget && (
        <DisableModal
          carrierId={disableTarget}
          onClose={() => setDisableTarget(null)}
          onConfirm={() => setDisableTarget(null)}
        />
      )}
    </div>
  );
}
