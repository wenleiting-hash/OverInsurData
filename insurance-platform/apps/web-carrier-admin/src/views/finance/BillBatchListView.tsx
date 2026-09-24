/**
 * V1.0.18 账单批次列表（财务结算 Tab 1）— 按 V1.6 原型像素级还原
 *
 * - Summary bar：批次总数 / 账单金额合计 / 待对账 / 已完成 + 右侧操作按钮
 * - 筛选区：搜索框 flex:1 自适应 + 两个自适应宽度下拉（与 V1.6 原型一致）
 * - 表格：浅蓝表头底、斑马行、FileText 文件列、N ✓M ✗X ↷Y 行数统计
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Download, Search, Eye, FileText, MoreHorizontal, Ban } from 'lucide-react';
import { useFinanceBills, useVoidBill, useBatchVoidBills } from '@/services/financeService';
import { useAuth } from '@/contexts/AuthContext';
import { Pager, money, dt, rowsToXlsx, Btn, Modal, errMsg } from './finance-ui';
import Toast from '@/components/SuccessToast';

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;
const SUPERVISOR = new Set(['super_admin', 'ops_manager']);

export default function BillBatchListView({
  insurers,
  onImport,
  onOpenDetail,
}: {
  insurers: any[];
  onImport: () => void;
  onOpenDetail: (billId: string) => void;
  initialCarrierId?: string; // 保留签名兼容，未使用
}) {
  const { t } = useTranslation('finance');
  const { user } = useAuth();
  const isSupervisor = (user?.roles ?? []).some((r) => SUPERVISOR.has(r));
  const [insurerId, setInsurerId] = useState('');
  const [reconStatus, setReconStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [menuFor, setMenuFor] = useState<{ billId: string; x: number; y: number } | null>(null);
  const [voidTarget, setVoidTarget] = useState<any | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchVoidOpen, setBatchVoidOpen] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const voidMut = useVoidBill();
  const batchVoidMut = useBatchVoidBills();

  const params: Record<string, any> = { page, size };
  if (insurerId) params.insurer_id = insurerId;
  if (reconStatus) params.recon_status = reconStatus;
  if (search.trim()) params.search = search.trim();

  const q = useFinanceBills(params);
  const rows: any[] = q.data?.data ?? [];
  const total: number = q.data?.total ?? 0;
  const summary = q.data?.summary;

  function exportList() {
    const out = rows.map((b) => ({
      batch_no: b.batch_no,
      insurer: b.insurer_short || b.insurer_name,
      period_month: b.period_month || b.period,
      file_name: b.file_name,
      import_date: dt(b.import_date),
      imported_by: b.imported_by,
      recon_status: b.recon_status,
      total_commission: b.total_commission,
    }));
    rowsToXlsx(`bill-batches-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Batches', out);
  }

  async function doVoid() {
    if (!voidTarget) return;
    setActionErr('');
    try {
      await voidMut.mutateAsync(voidTarget.bill_id);
      setVoidTarget(null);
      setToast({ type: 'success', message: t('batch.voidSuccess', { no: voidTarget.batch_no }) });
      q.refetch();
    } catch (e) {
      setActionErr(errMsg(e));
    }
  }

  // 仅非 completed 状态的批次可作废（与单个作废条件一致）
  const voidableRows = rows.filter((b) => b.recon_status !== 'completed');
  const voidableIds = voidableRows.map((b) => b.bill_id);
  const allVoidableSelected = voidableIds.length > 0 && voidableIds.every((id) => selected.has(id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (allVoidableSelected) {
      setSelected((prev) => { const next = new Set(prev); voidableIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); voidableIds.forEach((id) => next.add(id)); return next; });
    }
  }
  function clearSelection() { setSelected(new Set()); }

  const selectedVoidableCount = voidableIds.filter((id) => selected.has(id)).length;

  async function doBatchVoid() {
    if (selectedVoidableCount === 0) return;
    setActionErr('');
    try {
      const res: any = await batchVoidMut.mutateAsync(Array.from(selected));
      setToast({
        type: 'success',
        message: t('batch.batchVoidResult', { voided: res?.voided ?? 0, skipped: res?.skipped ?? 0 }),
      });
      clearSelection();
      setBatchVoidOpen(false);
      q.refetch();
    } catch (e) {
      setActionErr(errMsg(e));
    }
  }

  const totalBatches = summary?.total_batches ?? 0;
  const billAmount = summary?.bill_amount ?? 0;
  const pendingCount = summary?.pending ?? 0;
  const completedCount = summary?.completed ?? 0;

  const STATUS: Record<string, { badge: string; orb: string; label: string }> = {
    pending: { badge: 'badge-yellow', orb: '#FFCC00', label: t('batch.statusPending') },
    running: { badge: 'badge-blue', orb: '#0058BC', label: t('batch.statusRunning') },
    completed: { badge: 'badge-green', orb: '#34C759', label: t('batch.statusCompleted') },
  };

  const fileMeta = (b: any) => {
    const fmt = (b.file_format || '').toString().toUpperCase();
    return [fmt, b.file_size].filter(Boolean).join(' · ');
  };

  return (
    <div>
      {/* Summary bar */}
      <div
        className="flex flex-wrap items-center gap-x-5 gap-y-2"
        style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '12px 18px', marginBottom: 16 }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 13, color: '#717786' }}>{t('batch.kpiTotal')}</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#0058BC', ...MONO }}>{totalBatches}</span>
        </div>
        <span style={{ width: 1, height: 20, background: 'rgba(193,198,215,0.4)' }} />
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 13, color: '#717786' }}>{t('batch.kpiAmount')}</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#181C23', ...MONO }}>${money(billAmount)}</span>
        </div>
        <span style={{ width: 1, height: 20, background: 'rgba(193,198,215,0.4)' }} />
        <div className="flex items-center gap-1.5">
          <span className="orb orb-yellow" />
          <span style={{ fontSize: 13, color: '#a05800' }}>
            {t('batch.pending')} <span style={{ fontWeight: 600, ...MONO }}>{pendingCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="orb orb-green" />
          <span style={{ fontSize: 13, color: '#1E8033' }}>
            {t('batch.completed')} <span style={{ fontWeight: 600, ...MONO }}>{completedCount}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportList}
            disabled={!rows.length}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontSize: 12.5 }}
          >
            <Download size={13} /> {t('batch.exportList')}
          </button>
          <button onClick={onImport} className="btn-primary" style={{ fontSize: 12.5 }}>
            <Plus size={13} /> {t('batch.importBill')}
          </button>
        </div>
      </div>

      {/* Filters：搜索 flex:1 + 自适应下拉 */}
      <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
        <div className="relative flex-1">
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            className="input-glass w-full"
            style={{ paddingLeft: 30, fontSize: 13 }}
            placeholder={t('batch.searchPh')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input-glass"
          style={{ fontSize: 13, maxWidth: 220 }}
          value={insurerId}
          onChange={(e) => { setInsurerId(e.target.value); setPage(1); }}
        >
          <option value="">{t('batch.allInsurers')}</option>
          {insurers.map((c) => (
            <option key={c.config_id ?? c.carrier_id} value={c.carrier_id}>{c.insurer_short || c.carrier_name}</option>
          ))}
        </select>
        <select
          className="input-glass"
          style={{ fontSize: 13 }}
          value={reconStatus}
          onChange={(e) => { setReconStatus(e.target.value); setPage(1); }}
        >
          <option value="">{t('batch.allStatus')}</option>
          <option value="pending">{t('batch.statusPending')}</option>
          <option value="running">{t('batch.statusRunning')}</option>
          <option value="completed">{t('batch.statusCompleted')}</option>
        </select>
      </div>

      {/* 批量操作条（仅主管且有选中时显示） */}
      {isSupervisor && selectedVoidableCount > 0 && (
        <div
          className="flex items-center gap-3"
          style={{ background: 'rgba(0,88,188,0.06)', border: '1px solid rgba(0,88,188,0.18)', borderRadius: 10, padding: '8px 14px', marginBottom: 12 }}
        >
          <Ban size={15} color="#0058BC" />
          <span style={{ fontSize: 13, color: '#181C23' }}>
            {t('batch.selectedCount', { count: selectedVoidableCount })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="btn-secondary"
              style={{ fontSize: 12.5 }}
              onClick={() => { setActionErr(''); setBatchVoidOpen(true); }}
              disabled={batchVoidMut.isPending}
            >
              <Ban size={13} /> {t('batch.batchVoid')}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={clearSelection}>
              {t('batch.cancelSelection')}
            </button>
          </div>
        </div>
      )}

      {/* 批次表（8 列：批次号/保险公司/账单月份/原始文件/导入时间 导入人/行数统计/对账状态/操作） */}
      <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 14, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'rgba(246,248,255,0.9)', borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
                {isSupervisor && (
                  <th style={{ padding: '10px 8px 10px 14px', textAlign: 'left', width: 40 }}>
                    <input
                      type="checkbox"
                      checked={allVoidableSelected}
                      disabled={voidableIds.length === 0}
                      onChange={toggleAll}
                      style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0058BC' }}
                    />
                  </th>
                )}
                {['colBatchNo', 'colInsurer', 'colPeriod', 'colFile', 'colImportedAt', 'colRows', 'colStatus', 'colActions'].map((k) => (
                  <th key={k} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#717786', whiteSpace: 'nowrap' }}>
                    {t(`batch.${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => {
                const st = STATUS[b.recon_status] ?? STATUS.pending;
                const success = b.success_count ?? 0;
                const rowTotal = b.total_rows ?? b.total_count ?? b.import_stats?.total ?? b.parsed_policies ?? success;
                const failed = b.failed_count ?? 0;
                const skipped = b.duplicate_count ?? b.skipped_count ?? 0;
                const matched = b.matched_policies ?? b.matched_count ?? 0;
                const shorts: string[] = Array.isArray(b.insurer_shorts) ? b.insurer_shorts : [];
                const name = b.insurer_short || b.insurer_name || '—';
                return (
                  <tr
                    key={b.bill_id}
                    onClick={() => onOpenDetail(b.bill_id)}
                    style={{
                      borderBottom: '0.5px solid rgba(193,198,215,0.25)',
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,88,188,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)'; }}
                  >
                    {/* 选择框（仅主管；已完成批次不可作废故不可选） */}
                    {isSupervisor && (
                      <td style={{ padding: '11px 8px 11px 14px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(b.bill_id)}
                          disabled={b.recon_status === 'completed'}
                          onChange={() => toggleRow(b.bill_id)}
                          style={{ width: 15, height: 15, cursor: b.recon_status === 'completed' ? 'not-allowed' : 'pointer', accentColor: '#0058BC' }}
                        />
                      </td>
                    )}
                    {/* 批次号 */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#0058BC', ...MONO }}>{b.batch_no}</span>
                    </td>
                    {/* 保险公司（多保司蓝色 chips / 单保司纯文字） */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      {shorts.length > 1 ? (
                        <div className="flex flex-wrap items-center gap-1">
                          {shorts.map((s) => (
                            <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,88,188,0.07)', color: '#0058BC' }}>{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, color: '#181C23' }}>{name}</span>
                      )}
                    </td>
                    {/* 账单月份 */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap', fontSize: 12.5, color: '#555', ...MONO }}>
                      {b.period_month || b.period || '—'}
                    </td>
                    {/* 原始文件 */}
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={13} color="#0058BC" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#181C23', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={b.file_name}>
                            {b.file_name || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: '#A0A5B1' }}>{fileMeta(b)}</div>
                        </div>
                      </div>
                    </td>
                    {/* 导入时间 / 导入人 */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12.5, color: '#414755' }}>{b.import_date ? String(b.import_date).replace('T', ' ').slice(0, 10) : '—'}</div>
                      <div style={{ fontSize: 11.5, color: '#717786' }}>{b.imported_by || '—'}</div>
                    </td>
                    {/* 行数统计：N ✓M ✗X ↷Y */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span className="inline-flex items-center gap-2" style={{ fontSize: 12, ...MONO }}>
                        <span style={{ color: '#181C23', fontWeight: 600 }}>{rowTotal.toLocaleString()}</span>
                        <span style={{ color: '#1E8033' }}>✓{matched}</span>
                        {failed > 0 && <span style={{ color: '#BA1A1A' }}>✗{failed}</span>}
                        {skipped > 0 && <span style={{ color: '#717786' }}>↷{skipped}</span>}
                      </span>
                    </td>
                    {/* 对账状态 */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="orb" style={{ background: st.orb }} />
                        <span className={`badge ${st.badge}`} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{st.label}</span>
                      </span>
                    </td>
                    {/* 操作 */}
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <span className="inline-flex items-center gap-0.5">
                        <button className="btn-ghost" style={{ padding: 5 }} title={t('batch.viewDetail')} onClick={() => onOpenDetail(b.bill_id)}>
                          <Eye size={14} />
                        </button>
                        {isSupervisor && b.recon_status !== 'completed' && (
                          <button
                            className="btn-ghost"
                            style={{ padding: 5 }}
                            title={t('batch.more')}
                            onClick={(e) => {
                              if (menuFor?.billId === b.bill_id) { setMenuFor(null); return; }
                              const rect = e.currentTarget.getBoundingClientRect();
                              setMenuFor({ billId: b.bill_id, x: rect.right, y: rect.bottom + 4 });
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr><td colSpan={isSupervisor ? 9 : 8} style={{ padding: 40, textAlign: 'center', color: '#A0A5B1', fontSize: 13 }}>
                  {q.isError ? t('batch.loadFailed') : t('batch.empty')}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pager page={page} size={size} total={total} onPage={setPage} onSize={(s) => { setSize(s); setPage(1); }} />

      {/* 行「更多」菜单 */}
      {menuFor && createPortal(
        <RowMenu x={menuFor.x} y={menuFor.y} onClose={() => setMenuFor(null)} align="right">
          <button
            className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-[7px] text-left text-[13px] text-[#BA1A1A] hover:bg-[rgba(186,26,26,0.06)]"
            onClick={() => {
              const target = rows.find((r) => r.bill_id === menuFor.billId) ?? null;
              setMenuFor(null);
              setActionErr('');
              setVoidTarget(target);
            }}
          >
            <Ban size={13} />{t('batch.void')}
          </button>
        </RowMenu>,
        document.body,
      )}

      {/* 作废确认 */}
      {voidTarget && (
        <Modal title={t('batch.voidTitle')} onClose={() => setVoidTarget(null)}>
          <p className="text-[13px] text-[#555]">{t('batch.voidConfirm', { no: voidTarget.batch_no })}</p>
          {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setVoidTarget(null)}>{t('batch.cancel')}</Btn>
            <Btn variant="danger" icon={<Ban size={14} />} loading={voidMut.isPending} onClick={doVoid}>{t('batch.void')}</Btn>
          </div>
        </Modal>
      )}

      {batchVoidOpen && (
        <Modal title={t('batch.batchVoidTitle')} onClose={() => setBatchVoidOpen(false)}>
          <p className="text-[13px] text-[#555]">{t('batch.batchVoidConfirm', { count: selectedVoidableCount })}</p>
          {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setBatchVoidOpen(false)}>{t('batch.cancel')}</Btn>
            <Btn variant="danger" icon={<Ban size={14} />} loading={batchVoidMut.isPending} onClick={doBatchVoid}>{t('batch.batchVoid')}</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

// ───────────────────────────────── 行更多菜单 ─────────────────────────────────

function RowMenu({ x, y, align = 'left', onClose, children }: {
  x: number; y: number; align?: 'left' | 'right'; onClose: () => void; children: React.ReactNode;
}) {
  useEffect(() => {
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => {
      window.addEventListener('click', close);
      window.addEventListener('scroll', close, true);
      window.addEventListener('resize', close);
      window.addEventListener('keydown', onKey);
    }, 0);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  // align=right 时菜单右边缘对齐 x（避免操作列在最右时向右溢出被裁剪）
  const style: React.CSSProperties = align === 'right'
    ? { right: window.innerWidth - x, top: y }
    : { left: x, top: y };
  return (
    <div
      className="fixed z-[60] min-w-[140px] rounded-lg border border-[rgba(193,198,215,0.6)] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}
