import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Plus, Download, Upload, Copy, Eye, Edit2, XCircle, CheckCircle,
  ChevronUp, ChevronDown, Trash2, Ban, AlertTriangle, X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { InsurerRecord, InsurerListParams } from '@/lib/user-api-client';
import { useGetInsurers, useToggleInsurerStatus, useDeleteInsurer, useBatchToggleInsurerStatus, useBatchDeleteInsurer } from '@/services/insurerService';
import type { ViewId } from '@/App';
import { useTranslation } from 'react-i18next';
import DisableModal from '@/components/DisableModal';
import BatchExportModal from '@/components/BatchExportModal';

interface Props {
  navigateTo: (view: ViewId, params?: any) => void;
}

type SortKey = 'name' | 'totalPremium' | 'naicCode';
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
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showExport, setShowExport] = useState(false);
  const [disableTarget, setDisableTarget] = useState<InsurerRecord | null>(null);
  const [menuTargetId, setMenuTargetId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [exportToast, setExportToast] = useState(false);
  const deleteInsurer = useDeleteInsurer();
  const batchToggle = useBatchToggleInsurerStatus();
  const batchDelete = useBatchDeleteInsurer();
  const [batchConfirm, setBatchConfirm] = useState<'enable' | 'disable' | 'delete' | null>(null);
  const [batchToast, setBatchToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // ── API-driven data fetching ──
  const SORT_KEY_MAP: Record<SortKey, string> = {
    name: 'carrier_name', totalPremium: 'revenue', naicCode: 'naic_code',
  };
  const queryParams: InsurerListParams = {
    search: search || undefined,
    type: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    region: filterRegion !== 'all' ? filterRegion : undefined,
    rating: filterRating !== 'all' ? filterRating : undefined,
    sortKey: SORT_KEY_MAP[sortKey],
    sortDir,
    page,
    size: pageSize,
  };
  const { data: apiResult, isLoading } = useGetInsurers(queryParams);
  const toggleStatus = useToggleInsurerStatus();

  // Close "更多" dropdown on outside click
  useEffect(() => {
    if (!menuTargetId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setMenuTargetId(null); setMenuPos(null); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuTargetId]);

  // Auto-dismiss export toast
  useEffect(() => {
    if (!exportToast) return;
    const timer = setTimeout(() => setExportToast(false), 3000);
    return () => clearTimeout(timer);
  }, [exportToast]);

  useEffect(() => {
    if (!batchToast) return;
    const timer = setTimeout(() => setBatchToast(null), 3000);
    return () => clearTimeout(timer);
  }, [batchToast]);

  const handleBatchAction = (action: 'enable' | 'disable' | 'delete') => {
    const ids = Array.from(selected);
    if (action === 'delete') {
      batchDelete.mutate(ids, {
        onSuccess: (data) => {
          setBatchConfirm(null);
          setBatchToast({ type: 'success', msg: t('toasts.batchDeleted', { n: data.deleted }) });
          setSelected(new Set());
        },
        onError: () => {
          setBatchConfirm(null);
          setBatchToast({ type: 'error', msg: t('toasts.deleteFailed') });
        },
      });
    } else {
      const targetStatus = action === 'enable' ? 'active' : 'inactive';
      batchToggle.mutate(
        { ids, status: targetStatus },
        {
          onSuccess: (data) => {
            setBatchConfirm(null);
            setBatchToast({ type: 'success', msg: action === 'enable' ? t('toasts.batchEnabled', { n: data.updated }) : t('toasts.batchDisabled', { n: data.updated }) });
            setSelected(new Set());
          },
          onError: () => {
            setBatchConfirm(null);
            setBatchToast({ type: 'error', msg: t('toasts.actionFailed') });
          },
        },
      );
    }
  };

  const apiData = apiResult?.data ?? [];
  const totalFromApi = apiResult?.total ?? 0;

  // Client-side sort fallback (when API already returns sorted data, this is a no-op)
  const sorted = useMemo(() => {
    return [...apiData].sort((a, b) => {
      const ak = SORT_KEY_MAP[sortKey];
      const av = (a as any)[ak];
      const bv = (b as any)[ak];
      const cmp = typeof av === 'number' ? (av as number) - (bv as number) : String(av ?? '').localeCompare(String(bv ?? ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [apiData, sortKey, sortDir]);

  const totalPages = Math.ceil((totalFromApi || 1) / pageSize);
  const pageData = sorted;
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
    else setSelected(new Set(pageData.map(i => (i.carrier_id || i.id || '') as string)));
  };

  const handleExport = () => {
    // Build CSV content
    const headers = [
      t('list.csvHeaders.naicCode'), t('list.csvHeaders.companyName'), t('list.csvHeaders.companyType'),
      t('list.csvHeaders.amBestRating'), t('list.csvHeaders.status'), t('list.csvHeaders.region'),
      t('list.csvHeaders.totalPremium'),
      t('list.csvHeaders.settlementCycle'),
    ];
    const csvData = sorted.map(ins => [
      ins.naic_code,
      `"${ins.carrier_name}"`,
      ins.carrier_type || ins.type,
      ins.am_best_rating,
      ins.status,
      ins.region,
      formatCurrency(ins.revenue ?? 0, true),
      ins.settlement_cycle,
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
  };

  // Cooperation status column (V1.3: 4-state display driven by coopStatus)
  const coopConfig: Record<string, { orb: string; label: string; color: string }> = {
    active: { orb: 'orb-green', label: 'detail.coop.active', color: '#1a7a2e' },
    expiring: { orb: 'orb-orange', label: 'detail.coop.expiring', color: '#a05800' },
    suspended: { orb: 'orb-gray', label: 'detail.coop.terminated', color: '#BA1A1A' },
    terminated: { orb: 'orb-gray', label: 'detail.coop.terminated', color: '#BA1A1A' },
  };

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23' }}>{t('listTitle')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
            {t('listSubtitle', { count: totalFromApi, filtered: totalFromApi })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-duplicate')}>
            <Copy size={14} /> {t('actions.duplicateCheck')}
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigateTo('insurer-import')}>
            <Upload size={14} /> {t('actions.batchImport')}
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => {
            if (selected.size === 0) { setExportToast(true); return; }
            setShowExport(true);
          }}>
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
          <option value="all">{t('filters.archiveStatus')}</option>
          <option value="active">{t('filters.archiveActive')}</option>
          <option value="inactive">{t('filters.archiveInactive')}</option>
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
          <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setBatchConfirm('enable')}><CheckCircle size={13} /> {t('bulkActions.batchEnable')}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setBatchConfirm('disable')}><XCircle size={13} /> {t('bulkActions.batchDisable')}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5, color: '#BA1A1A' }} onClick={() => setBatchConfirm('delete')}><Trash2 size={13} /> {t('bulkActions.batchDelete')}</button>
          <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setShowExport(true)}><Download size={13} /> {t('bulkActions.exportSelected')}</button>
          <button className="btn-ghost ml-auto" style={{ fontSize: 12.5 }} onClick={() => setSelected(new Set())}>{t('bulkActions.cancelSelection')}</button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: 'rgba(246,248,255,0.9)' }}>
                <th style={{ width: 40, position: 'sticky', left: 0, zIndex: 2, background: 'rgba(246,248,255,0.99)' }}>
                  <input
                    type="checkbox"
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', minWidth: 200, position: 'sticky', left: 40, zIndex: 2, background: 'rgba(246,248,255,0.99)', boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>
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
                <th>{t('table.settlementMethod')}</th>
                <th>{t('table.cooperationStatus')}</th>
                <th style={{ width: 100, position: 'sticky', right: 0, zIndex: 2, background: 'rgba(246,248,255,0.99)', boxShadow: '-3px 0 8px -2px rgba(0,22,80,0.08)' }}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((ins, idx) => {
                const sc = statusConfig[ins.status as 'active' | 'inactive'] || statusConfig.active;
                const insId = ins.carrier_id || ins.id || '';
                const insShortName = ins.carrier_name_short || ins.short_name || '';
                const insType = ins.carrier_type || ins.type || '';
                const rowBg = idx % 2 === 0 ? 'transparent' : 'rgba(246,248,255,0.55)';
                const stickyBg = idx % 2 === 0 ? 'rgba(255,255,255,0.99)' : 'rgba(246,248,255,0.99)';
                return (
                  <tr
                    key={insId}
                    style={{ cursor: 'pointer', background: rowBg }}
                    className="hover:bg-[rgba(246,248,255,0.55)]"
                    onClick={() => navigateTo('insurer-detail', { carrierId: insId })}
                  >
                    <td style={{ position: 'sticky', left: 0, zIndex: 2, background: stickyBg }} onClick={e => { e.stopPropagation(); toggleSelect(insId); }}>
                      <input type="checkbox" checked={selected.has(insId)} onChange={() => {}} style={{ cursor: 'pointer' }} />
                    </td>
                    <td style={{ position: 'sticky', left: 40, zIndex: 2, background: stickyBg, boxShadow: '3px 0 8px -2px rgba(0,22,80,0.08)' }}>
                      <div style={{ fontWeight: 600, color: '#181C23', fontSize: 13.5 }}>{insShortName}</div>
                      <div style={{ fontSize: 11.5, color: '#717786', marginTop: 1 }}>{ins.carrier_name.length > 28 ? ins.carrier_name.slice(0, 28) + '…' : ins.carrier_name}</div>
                    </td>
                    <td>
                      <span className="font-data" style={{ fontSize: 12.5, color: '#414755', letterSpacing: 0.3 }}>{ins.naic_code}</span>
                    </td>
                    <td>
                      <span className={`badge ${insType === 'Admitted' ? 'badge-blue' : 'badge-orange'}`} style={{ fontSize: 11.5 }}>
                        {insType === 'Admitted' ? t('filters.admitted') : t('filters.nonAdmitted')}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-data"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: ins.am_best_rating?.startsWith('A+') ? '#1a7a2e' : ins.am_best_rating?.startsWith('A') ? '#0058BC' : '#414755',
                        }}
                      >
                        {ins.am_best_rating || '-'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#414755' }}>{ins.region || '-'}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#181C23', fontWeight: 500 }}>
                      {formatCurrency(ins.revenue ?? 0, true)}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#414755' }}>
                      {(ins.policy_count ?? 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{ins.settlement_cycle === 'Monthly' ? t('table.monthly') : t('table.quarterly')}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          if (ins.status === 'inactive') {
                            return (<><span className="orb orb-gray" /><span style={{ fontSize: 12.5, color: '#414755' }}>{t('detail.status.inactive')}</span></>);
                          }
                          const cc = coopConfig[ins.coop_status ?? ins.status] ?? coopConfig.active;
                          return (<><span className={`orb ${cc.orb}`} /><span style={{ fontSize: 12.5, color: cc.color }}>{t(cc.label)}</span></>);
                        })()}
                      </div>
                    </td>
                    <td style={{ position: 'sticky', right: 0, zIndex: 2, background: stickyBg, boxShadow: '-3px 0 8px -2px rgba(0,22,80,0.08)' }} onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('table.viewDetails')}
                          onClick={() => navigateTo('insurer-detail', { carrierId: insId })}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('table.edit')}
                          onClick={() => navigateTo('insurer-edit', { carrierId: insId })}
                        >
                          <Edit2 size={14} />
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: '4px 10px', fontSize: 12.5, color: '#0058BC', fontWeight: 500 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (menuTargetId === insId) { setMenuTargetId(null); setMenuPos(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuPos({ x: rect.right, y: rect.bottom + 4 });
                              setMenuTargetId(insId);
                            }}
                          >
                            {t('table.more')}
                          </button>
                        </div>
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
              {t('pagination.totalCount', { count: totalFromApi, page: page, pages: totalPages })}
            </span>
            <select
              className="input-glass"
              style={{ fontSize: 12, padding: '4px 24px 4px 8px' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>{t('pagination.pageSize')}</option>
              <option value={20}>{t('pagination.pageSize20')}</option>
              <option value={50}>{t('pagination.pageSize50')}</option>
              <option value={100}>{t('pagination.pageSize100')}</option>
              <option value={200}>{t('pagination.pageSize200')}</option>
              <option value={500}>{t('pagination.pageSize500')}</option>
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

      {/* "更多" dropdown menu — fixed position to escape overflow clipping */}
      {menuTargetId && menuPos && (() => {
        const menuIns = pageData.find(i => (i.carrier_id || i.id) === menuTargetId);
        if (!menuIns) return null;
        const menuInsName = menuIns.carrier_name_short || menuIns.short_name || menuIns.carrier_name;
        return (
          <div
            ref={menuRef}
            style={{
              position: 'fixed', left: menuPos.x - 140, top: menuPos.y, zIndex: 100,
              background: '#fff', borderRadius: 10,
              boxShadow: '0 8px 24px rgba(0,22,80,0.13), 0 1px 3px rgba(0,22,80,0.08)',
              border: '0.5px solid rgba(193,198,215,0.4)',
              minWidth: 140, padding: '5px 0',
            }}
          >
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, color: '#414755',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,248,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => { setMenuTargetId(null); setMenuPos(null); setDisableTarget(menuIns); }}
            >
              <Ban size={14} style={{ color: '#a05800' }} />
              {menuIns.status === 'inactive' ? t('detail.actions.enable') : t('detail.actions.disable')}
            </button>
            <button
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, color: '#BA1A1A',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,240,240,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => { setMenuTargetId(null); setMenuPos(null); setDeleteTarget({ id: menuTargetId, name: menuInsName }); }}
            >
              <Trash2 size={14} />
              {t('detail.actions.delete')}
            </button>
          </div>
        );
      })()}

      {isLoading && (
        <div className="text-center py-12 text-[#717786]">{t('common:loading', 'Loading...')}</div>
      )}
      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 text-[#717786]">{t('emptyState')}</div>
      )}

      {showExport && (
        <BatchExportModal
          totalCount={totalFromApi}
          selectedCount={selected.size}
          filteredCount={totalFromApi}
          onClose={() => setShowExport(false)}
          onExport={handleExport}
        />
      )}

      {disableTarget && (
        <DisableModal
          insurer={disableTarget}
          onClose={() => setDisableTarget(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(24,28,35,0.40)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div className="glass-strong" style={{ width: 460, maxWidth: 'calc(100vw - 32px)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ padding: '22px 24px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(186,26,26,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} style={{ color: '#BA1A1A' }} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t('modals.deleteConfirm.title')}</div>
                  <div style={{ fontSize: 12.5, color: '#717786', marginTop: 2 }}>{t('modals.deleteConfirm.subtitle')}</div>
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setDeleteTarget(null)}><X size={16} /></button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px 24px' }}>
              <div style={{
                background: 'rgba(255,240,240,0.9)',
                border: '0.5px solid rgba(186,26,26,0.25)',
                borderRadius: 12, padding: '16px 18px',
                fontSize: 13.5, lineHeight: 1.7, color: '#414755',
              }}>
                {t('modals.deleteConfirm.warningPre')}
                <strong style={{ color: '#BA1A1A' }}>{deleteTarget.name}</strong>
                {t('modals.deleteConfirm.warningPost')}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 24px', borderTop: '0.5px solid rgba(193,198,215,0.4)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'rgba(241,243,254,0.5)' }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => setDeleteTarget(null)}>{t('common:common.cancel')}</button>
              <button
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 22px', background: '#BA1A1A', color: '#fff',
                  borderRadius: 9, fontSize: 13.5, fontWeight: 600,
                  cursor: 'pointer', border: 'none', opacity: deleteInsurer.isPending ? 0.6 : 1,
                }}
                disabled={deleteInsurer.isPending}
                onClick={() => {
                  deleteInsurer.mutate(deleteTarget.id, {
                    onSuccess: () => setDeleteTarget(null),
                  });
                }}
              >
                <Trash2 size={14} />
                {deleteInsurer.isPending
                  ? t('modals.deleteConfirm.deleting')
                  : t('modals.deleteConfirm.confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export toast */}
      {exportToast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #FFF3E0, #FFF8F0)',
          border: '1px solid rgba(255,149,0,0.35)',
          borderRadius: 10, padding: '10px 20px',
          boxShadow: '0 4px 16px rgba(255,149,0,0.15)',
          animation: 'slideDown 0.3s ease-out',
        }}>
          <AlertTriangle size={15} style={{ color: '#a05800', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, fontWeight: 500, color: '#7a5c00' }}>{t('actions.selectBeforeExport')}</span>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#a05800', marginLeft: 4 }}
            onClick={() => setExportToast(false)}
          >
            <X size={14} />
          </button>
          <style>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
              to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
          `}</style>
        </div>
      )}

      {/* Batch confirm dialog */}
      {batchConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(24,28,35,0.35)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) setBatchConfirm(null); }}
        >
          <div className="glass-strong" style={{ width: 420, borderRadius: 16, padding: '24px 28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: batchConfirm === 'enable' ? 'rgba(52,199,89,0.10)' : 'rgba(186,26,26,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {batchConfirm === 'enable' ? <CheckCircle size={18} style={{ color: '#34C759' }} /> : batchConfirm === 'delete' ? <Trash2 size={18} style={{ color: '#BA1A1A' }} /> : <Ban size={18} style={{ color: '#BA1A1A' }} />}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>
                  {batchConfirm === 'delete' ? t('modals.batchConfirm.titleDelete') : batchConfirm === 'disable' ? t('modals.batchConfirm.titleDisable') : t('modals.batchConfirm.titleEnable')}
                </div>
                <div style={{ fontSize: 12.5, color: '#717786' }}>{t('modals.batchConfirm.selectedCount', { count: selected.size })}</div>
              </div>
            </div>
            <div style={{
              background: batchConfirm === 'enable' ? 'rgba(52,199,89,0.06)' : 'rgba(186,26,26,0.06)',
              border: `0.5px solid ${batchConfirm === 'enable' ? 'rgba(52,199,89,0.2)' : 'rgba(186,26,26,0.2)'}`,
              borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#414755',
            }}>
              {batchConfirm === 'delete'
                ? t('modals.batchConfirm.bodyDelete')
                : batchConfirm === 'disable'
                  ? t('modals.batchConfirm.bodyDisable')
                  : t('modals.batchConfirm.bodyEnable')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => setBatchConfirm(null)}>{t('common:common.cancel')}</button>
              <button
                onClick={() => handleBatchAction(batchConfirm!)}
                disabled={batchToggle.isPending || batchDelete.isPending}
                style={{
                  padding: '9px 22px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: batchConfirm === 'enable' ? '#0058BC' : '#BA1A1A',
                  color: '#fff', opacity: (batchToggle.isPending || batchDelete.isPending) ? 0.6 : 1,
                }}
              >
                {(batchToggle.isPending || batchDelete.isPending)
                  ? t('modals.batchConfirm.processing')
                  : batchConfirm === 'delete'
                    ? t('modals.batchConfirm.confirmDelete')
                    : batchConfirm === 'disable'
                      ? t('modals.batchConfirm.confirmDisable')
                      : t('modals.batchConfirm.confirmEnable')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch toast */}
      {batchToast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: 8,
          background: batchToast.type === 'success' ? 'rgba(52,199,89,0.12)' : 'rgba(186,26,26,0.10)',
          border: `1px solid ${batchToast.type === 'success' ? 'rgba(52,199,89,0.35)' : 'rgba(186,26,26,0.25)'}`,
          borderRadius: 10, padding: '10px 20px',
          boxShadow: batchToast.type === 'success' ? '0 4px 16px rgba(52,199,89,0.15)' : '0 4px 16px rgba(186,26,26,0.15)',
        }}>
          {batchToast.type === 'success' ? <CheckCircle size={15} style={{ color: '#1a7a2e' }} /> : <AlertTriangle size={15} style={{ color: '#BA1A1A' }} />}
          <span style={{ fontSize: 13.5, fontWeight: 500, color: batchToast.type === 'success' ? '#1a7a2e' : '#BA1A1A' }}>{batchToast.msg}</span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: batchToast.type === 'success' ? '#1a7a2e' : '#BA1A1A', marginLeft: 4 }}
            onClick={() => setBatchToast(null)}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
