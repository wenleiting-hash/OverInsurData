/**
 * V1.0.18 批次详情 — 按 V1.6 原型像素级还原
 *
 * 渐变头部卡（内嵌五步条）→ 两栏汇总（6 统计 + 金额三联 / 试算取值分布）
 * → 明细表（胶囊筛选 + 200px 搜索 + 异常行高亮 + 内联异常处理面板）
 * → 封帐条 + 520 重算/封帐 Modal
 * 硬约束：存在未处理异常禁止封帐（前端阻断 + 后端 400 兜底）。
 * 工程能力保留：挂起/跟进/重新打开/作废/主管解锁/行内本地演算/分页。
 */
import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronDown, ChevronUp, Lock, LockOpen, Ban, RefreshCw,
  FileDown, Loader2, Check, AlertTriangle, Search, MessageSquarePlus,
  History, CheckCircle2, Zap, X, Play, Edit2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useBillDetail, useBillLines,
  useReconcileBill, useCompleteBill, useUnlockBill, useVoidBill,
  useDiffAction, useRecalcDiff, useAddFollowUp,
} from '@/services/financeService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Btn, Badge, Pager, Empty, Modal, inputCls,
  money, moneySigned, day, dt, errMsg, rowsToXlsx, RESOLUTION_RESULTS,
} from './finance-ui';
import Toast from '@/components/SuccessToast';

const SUPERVISOR = new Set(['super_admin', 'ops_manager']);
const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;

const FILTERS = [
  { key: 'all', labelKey: 'filterAll' },
  { key: 'exception', labelKey: 'filterException', danger: true },
  { key: 'duplicate', labelKey: 'filterDuplicate' },
  { key: 'failed', labelKey: 'filterFailed' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

interface Override { premium: string; billAmount: string }

export default function BillBatchDetailView({ billId, onBack }: { billId: string; onBack: () => void }) {
  const { t } = useTranslation('finance');
  const { user } = useAuth();
  const isSupervisor = (user?.roles ?? []).some((r) => SUPERVISOR.has(r));

  const detailQ = useBillDetail(billId);
  const b = detailQ.data;

  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [expanded, setExpanded] = useState<string | null>(null);

  // 行内本地演算（不回写原件）
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Override>({ premium: '', billAmount: '' });

  const [note, setNote] = useState('');
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmRecalc, setConfirmRecalc] = useState(false);
  const [confirmUnlock, setConfirmUnlock] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 搜索防抖
  useEffect(() => {
    const h = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  const params: Record<string, any> = { tab: filter, page, size };
  if (search) params.search = search;
  const linesQ = useBillLines(billId, params);
  const lines: any[] = linesQ.data?.data ?? [];
  const total: number = linesQ.data?.total ?? 0;

  const reconcileMut = useReconcileBill();
  const completeMut = useCompleteBill();
  const unlockMut = useUnlockBill();
  const voidMut = useVoidBill();
  const diffActionMut = useDiffAction();
  const recalcMut = useRecalcDiff();
  const followMut = useAddFollowUp();

  const reconStatus: string = b?.recon_status ?? 'pending';
  const locked = reconStatus === 'completed';
  const openDiffs = b?.diff_summary?.open?.count ?? 0;
  const suspendedDiffs = b?.diff_summary?.suspended?.count ?? 0;
  const unresolved = openDiffs + suspendedDiffs;

  const lc = b?.line_counts ?? { imported: 0, duplicate: 0, failed: 0 };
  const ist: { total?: number; imported?: number; duplicate?: number; failed?: number } = b?.import_stats ?? {};
  const totalLines = ist.total ?? b?.parsed_policies ?? b?.total_policies ?? (lc.imported + lc.duplicate + lc.failed);
  const importedLines = b?.success_count ?? ist.imported ?? lc.imported;
  const failedLines = b?.failed_count ?? ist.failed ?? lc.failed;
  const duplicateLines = b?.duplicate_count ?? ist.duplicate ?? lc.duplicate;
  const mc = b?.match_counts ?? {};
  const exceptionTotal = (mc.rate_diff ?? 0) + (mc.amount_diff ?? 0);
  const matchedCount = b?.matched_policies ?? mc.matched ?? 0;

  // 五步流程条当前步（展示式）
  const flowStep = useMemo(() => {
    if (locked) return 5;
    if (reconStatus === 'running') return unresolved > 0 ? 4 : 5;
    return 1;
  }, [locked, reconStatus, unresolved]);

  const filterCounts: Record<FilterKey, number> = {
    all: totalLines,
    exception: exceptionTotal,
    duplicate: duplicateLines,
    failed: failedLines,
  };

  async function runReconcile() {
    setActionErr('');
    try {
      await reconcileMut.mutateAsync(billId);
      setConfirmRecalc(false);
    } catch (e) { setActionErr(errMsg(e)); }
  }

  async function doComplete() {
    setActionErr('');
    try {
      await completeMut.mutateAsync({ id: billId, dto: { note: note || undefined } });
      setConfirmComplete(false);
      setNote('');
    } catch (e) { setActionErr(errMsg(e)); }
  }

  async function doUnlock() {
    setActionErr('');
    try {
      await unlockMut.mutateAsync(billId);
      setConfirmUnlock(false);
    } catch (e) { setActionErr(errMsg(e)); }
  }

  async function doVoid() {
    setActionErr('');
    try {
      await voidMut.mutateAsync(billId);
      setConfirmVoid(false);
      onBack();
    } catch (e) { setActionErr(errMsg(e)); }
  }

  function exportLines() {
    const out = lines.map((l) => ({
      row: l.line_number,
      policy_number: l.policy_number,
      insured_name: l.insured_name,
      state: l.state,
      product_code: l.product_code,
      line_of_business: l.line_of_business,
      premium: l.premium,
      bill_commission_rate: l.commission_rate,
      bill_commission_amount: l.commission_amount,
      our_commission_rate: l.our_commission_rate,
      our_commission_amount: l.our_commission_amount,
      diff_amount: l.diff_amount,
      match_status: l.match_status,
      line_status: l.line_status,
      trial_level: l.trial_level,
      diff_resolution: l.diff_resolution ?? '',
      resolution_result: l.resolution_result ?? '',
    }));
    rowsToXlsx(`${b?.batch_no ?? billId}-lines.xlsx`, 'Lines', out);
  }

  function startEdit(l: any) {
    const ov = overrides[l.line_id];
    setEditDraft({
      premium: ov?.premium ?? String(l.premium ?? ''),
      billAmount: ov?.billAmount ?? String(l.commission_amount ?? ''),
    });
    setEditingId(l.line_id);
  }
  function saveEdit(lineId: string) {
    setOverrides((m) => ({ ...m, [lineId]: { ...editDraft } }));
    setEditingId(null);
  }

  /** 行展示值：行内演算覆盖优先。 */
  function lineVals(l: any) {
    const ov = overrides[l.line_id];
    const premium = ov ? Number(ov.premium) : Number(l.premium);
    const billAmt = ov ? Number(ov.billAmount) : Number(l.commission_amount);
    const ourAmt = l.our_commission_amount == null ? null : Number(l.our_commission_amount);
    const diff = ourAmt == null ? null : Math.round((billAmt - ourAmt) * 100) / 100;
    return { premium, billAmt, ourAmt, diff, edited: !!ov };
  }

  if (detailQ.isLoading) {
    return (
      <div className="flex items-center gap-2 py-16 text-[13px] text-[#717786]">
        <Loader2 size={16} className="animate-spin" /> {t('detail.loading')}
      </div>
    );
  }
  if (!b) {
    return (
      <div className="space-y-3">
        <Btn size="sm" icon={<ChevronLeft size={13} />} onClick={onBack}>{t('detail.back')}</Btn>
        <Empty text={detailQ.isError ? errMsg(detailQ.error) : t('detail.notFound')} />
      </div>
    );
  }

  const batchInsurers: string[] = Array.isArray(b.insurer_shorts) ? b.insurer_shorts : [];
  const multiInsurer = batchInsurers.length > 1;
  const colCount = multiInsurer ? 12 : 11;

  const HEADER_BADGE: Record<string, { badge: string; orb: string; label: string }> = {
    pending: { badge: 'badge-yellow', orb: '#FFCC00', label: t('batch.statusPending') },
    running: { badge: 'badge-blue', orb: '#0058BC', label: t('batch.statusRunning') },
    completed: { badge: 'badge-green', orb: '#34C759', label: t('detail.lockedTag') },
  };
  const hb = HEADER_BADGE[reconStatus] ?? HEADER_BADGE.pending;

  const dist = b.trial_distribution ?? {};
  const DIST_LEVELS: Array<[string, string, string]> = [
    ['product_state', 'levelProductState', '#0058BC'],
    ['product_all', 'levelProductAll', '#34C759'],
    ['lob_state', 'levelLobState', '#FF9500'],
    ['lob_all', 'levelLobAll', '#AF52DE'],
    ['bill_original', 'levelBillOriginal', '#717786'],
  ];
  const distDenom = Math.max(totalLines, 1);

  const statChips = [
    { n: totalLines, label: t('detail.statTotal') },
    { n: importedLines, label: t('detail.statImported') },
    { n: failedLines, label: t('detail.statFailed'), warn: failedLines > 0 },
    { n: duplicateLines, label: t('detail.statDuplicate'), purple: true },
    { n: matchedCount, label: t('detail.statMatched') },
    { n: exceptionTotal, label: t('detail.statException'), warn: unresolved > 0 },
  ];

  const diffNum = Number(b.difference_amount ?? 0);
  const perInsurer: any[] = Array.isArray(b.insurer_breakdown) ? b.insurer_breakdown
    : Array.isArray(b.per_insurer) ? b.per_insurer : [];

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {actionErr && <p className="mb-3 rounded-lg border border-[rgba(186,26,26,0.25)] bg-[rgba(186,26,26,0.06)] px-3 py-2 text-[12.5px] text-[#BA1A1A]">{actionErr}</p>}

      {/* 返回 */}
      <button className="btn-ghost mb-4" style={{ padding: '6px 10px', fontSize: 13 }} onClick={onBack}>
        <ChevronLeft size={14} /> {t('detail.back')}
      </button>

      {/* ═══ Section 1：渐变头部卡（批次信息 + 五步条） ═══ */}
      <div
        style={{
          padding: '18px 22px', marginBottom: 14, borderRadius: 14,
          background: 'linear-gradient(135deg,#e8effe 0%,#f0f4ff 40%,#e4f0fb 100%)',
          border: '1px solid rgba(0,88,188,0.14)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0058BC', ...MONO }}>{b.batch_no}</h1>
              <span className="inline-flex items-center gap-1.5">
                <span className="orb" style={{ background: hb.orb }} />
                <span className={`badge ${hb.badge}`} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{hb.label}</span>
              </span>
              {locked && <Lock size={13} color="#1E8033" />}
              {b.locked_by && <span className="text-[11.5px] text-[#A0A5B1]">{t('detail.lockedBy', { by: b.locked_by, at: dt(b.locked_at) })}</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 12.5, color: '#717786' }}>
              <span>{t('detail.metaInsurer')}<b className="font-medium text-[#181C23]">{b.insurer_name || b.insurer_short}</b></span>
              <span>{t('detail.metaPeriod')}<b className="font-medium text-[#181C23]" style={MONO}>{b.period_month || b.period}</b></span>
              <span>{t('detail.metaImporter')}<b className="font-medium text-[#181C23]">{b.imported_by || '—'}</b></span>
              <span>{t('detail.metaImportedAt')}<b className="font-medium text-[#181C23]">{dt(b.import_date)}</b></span>
              <span>{t('detail.metaFile')}<b className="font-medium text-[#181C23]">{b.file_name}</b></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {locked && b.locked_at && (
              <span style={{ fontSize: 12, color: '#717786' }}>{t('detail.sealedAt', { date: day(b.locked_at) })}</span>
            )}
            <button onClick={exportLines} disabled={!lines.length}
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40" style={{ fontSize: 12.5 }}>
              <FileDown size={13} /> {t('detail.export')}
            </button>
            <button className="btn-ghost" style={{ padding: 6 }} title={t('detail.refresh')}
              disabled={detailQ.isFetching} onClick={() => detailQ.refetch()}>
              {detailQ.isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={13} />}
            </button>
            {isSupervisor && !locked && (
              <button className="btn-ghost" style={{ padding: 6, color: '#BA1A1A' }} title={t('detail.void')}
                onClick={() => { setActionErr(''); setConfirmVoid(true); }}>
                <Ban size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 五步流程条（展示式） */}
        <div className="mt-5 flex items-start justify-center">
          {[t('detail.step1'), t('detail.step2'), t('detail.step3'), t('detail.step4'), t('detail.step5')].map((label, i) => {
            const n = i + 1;
            const active = flowStep === n;
            const done = flowStep > n;
            return (
              <Fragment key={label}>
                <div className="flex flex-col items-center" style={{ gap: 6 }}>
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 26, height: 26, fontSize: 11, fontWeight: 700, color: '#fff',
                      background: done ? '#34C759' : active ? '#0058BC' : 'rgba(193,198,215,0.3)',
                    }}
                  >
                    {done ? <Check size={12} /> : n}
                  </span>
                  <span className="whitespace-nowrap" style={{ fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? '#0058BC' : done ? '#1E8033' : '#A0A5B1' }}>
                    {label}
                    {n === 4 && unresolved > 0 && (
                      <span className="ml-1 rounded-full px-1.5 py-px text-[10px] font-bold text-white" style={{ background: '#BA1A1A' }}>{unresolved}</span>
                    )}
                  </span>
                </div>
                {n < 5 && (
                  <span style={{ width: 32, height: 2, marginBottom: 20, marginInline: 4, borderRadius: 2, background: flowStep > n ? '#34C759' : 'rgba(193,198,215,0.4)' }} />
                )}
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* ═══ Section 2：两栏汇总 ═══ */}
      <div
        className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_260px]"
        style={{
          marginBottom: 14, padding: 16, borderRadius: 14,
          background: 'linear-gradient(135deg,#f5f7ff,#eef3fb)',
          border: '1px solid rgba(0,88,188,0.10)',
        }}
      >
        {/* 左卡：统计 + 金额 + 多保司表 */}
        <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(193,198,215,0.35)', borderRadius: 12, padding: '16px 18px' }}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
            {statChips.map((s) => (
              <div key={s.label} style={{ padding: '9px 10px', background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.35)', borderRadius: 9 }}>
                <div style={{ fontSize: 10.5, color: '#717786' }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: s.warn ? '#BA1A1A' : s.purple ? '#7B3FCA' : '#181C23', ...MONO }}>{s.n}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { label: t('detail.billAmount'), value: `$${money(b.total_commission)}`, color: '#0058BC' },
              { label: t('detail.ourAmount'), value: `$${money(b.reconciled_amount)}`, color: '#181C23' },
              {
                label: t('detail.diffAmount'),
                value: diffNum === 0 ? `±${money(0)}` : moneySigned(b.difference_amount),
                color: diffNum === 0 ? '#1E8033' : '#BA1A1A',
                alert: diffNum !== 0,
              },
            ].map((x) => (
              <div key={x.label} style={{
                padding: '10px 14px', borderRadius: 10,
                background: x.alert ? 'rgba(186,26,26,0.05)' : 'rgba(246,248,255,0.9)',
                border: x.alert ? '1px solid rgba(186,26,26,0.3)' : '1px solid rgba(193,198,215,0.35)',
              }}>
                <div style={{ fontSize: 11, color: '#717786' }}>{x.label}</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2, color: x.color, ...MONO }}>{x.value}</div>
              </div>
            ))}
          </div>

          {/* 各保司明细（仅多保司批次） */}
          {perInsurer.length > 1 && (
            <div className="mt-3 overflow-hidden rounded-xl" style={{ border: '1px solid rgba(193,198,215,0.4)' }}>
              <div className="px-3.5 py-2 text-[12.5px] font-bold text-[#181C23]" style={{ background: 'rgba(246,248,255,0.9)' }}>{t('detail.perInsurerTitle')}</div>
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ color: '#717786' }}>
                    {['colCarrier', 'colLines', 'colLinesMatched', 'colException', 'colDuplicate', 'colBillAmount'].map((k) => (
                      <th key={k} className="whitespace-nowrap px-3.5 py-1.5 text-left text-[11px] font-semibold">{t(`detail.${k}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {perInsurer.map((pi, idx) => (
                    <tr key={pi.insurer_short ?? idx} style={{ borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
                      <td className="whitespace-nowrap px-3.5 py-2 font-medium text-[#181C23]">{pi.insurer_short || pi.insurer_name || '—'}</td>
                      <td className="px-3.5 py-2" style={MONO}>{pi.lines ?? pi.total ?? 0}</td>
                      <td className="px-3.5 py-2 text-[#1E8033]" style={MONO}>{pi.matched ?? 0}</td>
                      <td className="px-3.5 py-2" style={{ color: (pi.exceptions ?? 0) > 0 ? '#BA1A1A' : '#555', ...MONO }}>{pi.exceptions ?? 0}</td>
                      <td className="px-3.5 py-2 text-[#B06000]" style={MONO}>{pi.duplicates ?? 0}</td>
                      <td className="whitespace-nowrap px-3.5 py-2 font-semibold text-[#181C23]" style={MONO}>${money(pi.total_commission ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 右卡：试算取值分布 */}
        <div style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(193,198,215,0.35)', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t('detail.trialTitle')}</div>
          {DIST_LEVELS.map(([k, labelKey, color]) => {
            const n = Number(dist[k] ?? 0);
            const pct = Math.min(100, Math.round((n / distDenom) * 100));
            return (
              <div key={k} className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                <span className="shrink-0 truncate" style={{ width: 72, fontSize: 11.5, color: '#717786' }} title={t(`detail.${labelKey}`)}>{t(`detail.${labelKey}`)}</span>
                <span style={{ flex: 1, height: 10, borderRadius: 3, background: 'rgba(193,198,215,0.2)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                </span>
                <span className="shrink-0 text-right" style={{ width: 28, fontSize: 11, color, ...MONO }}>{n}</span>
              </div>
            );
          })}
          <p className="mt-1" style={{ fontSize: 11, lineHeight: 1.6, color: '#A0A5B1' }}>{t('detail.fallbackNote')}</p>
          {(dist._untrialed ?? 0) > 0 && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,159,10,0.06)' }}>
              <AlertTriangle size={11} className="mt-0.5 shrink-0" color="#B06000" />
              <span style={{ fontSize: 11, color: '#B06000', lineHeight: 1.5 }}>{t('detail.untrialedNote', { n: dist._untrialed })}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Section 3：明细表 ═══ */}
      <div style={{ background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(193,198,215,0.42)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        {/* 表头工具条 */}
        <div className="flex flex-wrap items-center gap-2" style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(193,198,215,0.5)', background: 'rgba(246,248,255,0.9)' }}>
          {FILTERS.map((f0) => {
            const active = filter === f0.key;
            const danger = 'danger' in f0 && f0.danger && !active;
            return (
              <button
                key={f0.key}
                onClick={() => { setFilter(f0.key); setPage(1); setExpanded(null); }}
                className="inline-flex items-center gap-1.5"
                style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? '#0058BC' : danger ? '#BA1A1A' : '#717786',
                  background: active ? 'rgba(0,88,188,0.1)' : 'rgba(255,255,255,0.6)',
                  border: active ? '1.5px solid #0058BC' : danger ? '1px solid rgba(186,26,26,0.4)' : '1px solid rgba(193,198,215,0.5)',
                }}
              >
                {'danger' in f0 && f0.danger && <AlertTriangle size={11} />}
                {t(`detail.${f0.labelKey}`)}
                <span style={{ ...MONO, fontWeight: 600, opacity: active ? 1 : 0.6 }}>{filterCounts[f0.key]}</span>
              </button>
            );
          })}
          {multiInsurer && (
            <span style={{ fontSize: 12, color: '#0058BC', background: 'rgba(0,88,188,0.07)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>
              {(b.insurer_short || b.insurer_name) ?? ''}
            </span>
          )}
          <div className="relative ml-auto">
            <Search size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
            <input
              className="input-glass"
              style={{ paddingLeft: 26, fontSize: 12, width: 200 }}
              placeholder={t('detail.searchPh')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: '#A0A5B1', ...MONO }}>{t('detail.lineCount', { n: total })}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: multiInsurer ? 1240 : 1140, fontSize: 12.5, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid rgba(193,198,215,0.5)' }}>
                {([
                  'colHash', 'colPolicy', 'colInsured', 'colState', 'colLob',
                  ...(multiInsurer ? ['colInsurer'] : []),
                  'colPremium', 'colBillValue', 'colOurValue', 'colDiff', 'colStatus', 'colActions',
                ] as string[]).map((k) => (
                    <th key={k} className="whitespace-nowrap" style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#717786' }}>
                      {t(`detail.${k}`)}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const hasDiff = !!l.diff_id;
                const isOpenPanel = expanded === l.line_id;
                const isEditing = editingId === l.line_id;
                const v = lineVals(l);
                const isDup = l.line_status === 'duplicate';
                const isFail = l.line_status === 'failed';
                const isRateDiff = l.match_status === 'rate_diff';
                const isAmountDiff = l.match_status === 'amount_diff' || l.match_status === 'unmatched';
                const anomaly = isFail || isAmountDiff;
                const rowStyle: React.CSSProperties = isDup
                  ? { background: 'rgba(123,63,202,0.05)', boxShadow: 'inset 3px 0 0 rgba(123,63,202,0.35)' }
                  : anomaly
                    ? { background: 'rgba(255,59,48,0.05)', boxShadow: 'inset 3px 0 0 #BA1A1A' }
                    : isRateDiff
                      ? { background: 'rgba(255,159,10,0.06)', boxShadow: 'inset 3px 0 0 rgba(255,149,0,0.55)' }
                      : { background: idx % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)' };
                return (
                  <Fragment key={l.line_id}>
                    <tr
                      style={{ borderBottom: '0.5px solid rgba(193,198,215,0.25)', ...rowStyle }}
                      onMouseEnter={(e) => { if (!isDup && !anomaly && !isRateDiff) e.currentTarget.style.background = 'rgba(0,88,188,0.04)'; }}
                      onMouseLeave={(e) => { if (!isDup && !anomaly && !isRateDiff) e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)'; }}
                    >
                      {/* 行# */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', fontSize: 11, color: '#A0A5B1', ...MONO }}>{l.line_number}</td>
                      {/* 保单号 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', fontSize: 11.5, fontWeight: 700, color: '#0058BC', ...MONO }}>{l.policy_number || '—'}</td>
                      {/* 被保人 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', fontSize: 12.5, color: '#181C23', fontWeight: 500 }}>{l.insured_name || '—'}</td>
                      {/* 州：纯文字蓝色加粗（非 badge） */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', fontWeight: 700, color: l.state ? '#0058BC' : '#A0A5B1' }}>{l.state || '—'}</td>
                      {/* 险种 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', fontSize: 12, color: '#717786' }}>{l.line_of_business || l.product_code || '—'}</td>
                      {/* 保险公司（仅多保司） */}
                      {multiInsurer && (
                        <td className="whitespace-nowrap" style={{ padding: '9px 12px' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,88,188,0.07)', color: '#0058BC' }}>
                            {l.insurer_short || '—'}
                          </span>
                        </td>
                      )}
                      {/* 保费（左对齐） */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11.5, color: '#555', ...MONO }}>
                        {isEditing ? (
                          <input type="number" step="0.01" className="input-glass" style={{ width: 80, fontSize: 12, padding: '4px 8px' }}
                            value={editDraft.premium} onChange={(e) => setEditDraft((d) => ({ ...d, premium: e.target.value }))} />
                        ) : `$${money(v.premium)}`}
                      </td>
                      {/* 保司账单值（左对齐） */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#181C23', ...MONO }}>
                        {isEditing ? (
                          <input type="number" step="0.01" className="input-glass" style={{ width: 80, fontSize: 12, padding: '4px 8px' }}
                            value={editDraft.billAmount} onChange={(e) => setEditDraft((d) => ({ ...d, billAmount: e.target.value }))} />
                        ) : (
                          <span>
                            ${money(v.billAmt)}
                            {v.edited && <span title={t('detail.localEditHint')} className="ml-1 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: '#FF9F0A' }} />}
                          </span>
                        )}
                      </td>
                      {/* 我方试算值 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#0058BC', ...MONO }}>
                        {v.ourAmt == null ? <span style={{ fontWeight: 400, color: '#A0A5B1' }}>—</span> : `$${money(v.ourAmt)}`}
                      </td>
                      {/* 差异额 */}
                      <td className="whitespace-nowrap" style={{
                        padding: '9px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                        color: v.diff == null ? '#A0A5B1' : v.diff > 0.005 ? '#BA1A1A' : v.diff < -0.005 ? '#B06000' : '#1E8033', ...MONO,
                      }}>
                        {v.diff == null ? '—' : v.diff === 0 ? `±${money(0)}` : moneySigned(v.diff)}
                      </td>
                      {/* 状态 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px' }}>
                        {l.line_status === 'imported' ? (
                          <div className="flex flex-col items-start gap-1">
                            <MatchBadge status={l.match_status} />
                            {l.diff_resolution && <ResolutionBadge resolution={l.diff_resolution} />}
                          </div>
                        ) : (
                          <Badge pill cls={isDup ? 'bg-[rgba(255,159,10,0.12)] text-[#B06000]' : 'bg-[rgba(186,26,26,0.1)] text-[#BA1A1A]'}
                            dot={isDup ? 'bg-[#FF9F0A]' : 'bg-[#BA1A1A]'}
                            title={l.error_reason || l.skip_reason}
                          >
                            {isDup ? t('detail.lineDup') : t('detail.lineFail')}
                          </Badge>
                        )}
                      </td>
                      {/* 操作 */}
                      <td className="whitespace-nowrap" style={{ padding: '9px 12px' }}>
                        {locked ? <span style={{ color: '#A0A5B1' }}>—</span>
                          : isEditing ? (
                            <span className="inline-flex items-center gap-2 text-xs">
                              <button className="font-semibold text-[#0058BC] hover:underline" onClick={() => saveEdit(l.line_id)}>{t('detail.actSave')}</button>
                              <button className="text-[#717786] hover:underline" onClick={() => setEditingId(null)}>{t('detail.actCancel')}</button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5">
                              {l.line_status === 'imported' && (
                                <>
                                  <button className="btn-ghost" style={{ padding: 5, color: '#717786' }} title={t('detail.actEdit')} onClick={() => startEdit(l)}>
                                    <Edit2 size={13} />
                                  </button>
                                  {hasDiff && (
                                    <button
                                      className="btn-ghost"
                                      style={{ padding: 5, color: '#717786' }}
                                      title={t('detail.actRecalc')}
                                      disabled={recalcMut.isPending}
                                      onClick={async () => {
                                        try { await recalcMut.mutateAsync(l.diff_id); }
                                        catch (e) { setActionErr(errMsg(e)); }
                                      }}
                                    >
                                      {recalcMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                    </button>
                                  )}
                                  {hasDiff && (
                                    <button
                                      className="btn-ghost"
                                      style={{ padding: 5, color: isOpenPanel ? '#0058BC' : '#717786' }}
                                      title={t('detail.actHandle')}
                                      onClick={() => setExpanded(isOpenPanel ? null : l.line_id)}
                                    >
                                      {isOpenPanel ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>
                                  )}
                                </>
                              )}
                            </span>
                          )}
                      </td>
                    </tr>
                    {isOpenPanel && hasDiff && (
                      <tr>
                        <td colSpan={colCount} style={{
                          padding: '14px 16px 14px 28px',
                          background: 'rgba(255,59,48,0.03)',
                          borderLeft: '3px solid #BA1A1A',
                          borderTop: '0.5px solid rgba(255,59,48,0.15)',
                        }}>
                          {/* 面板标题 + 金额对比 */}
                          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1.5" style={{ fontSize: 12.5, fontWeight: 700, color: '#BA1A1A' }}>
                              <AlertTriangle size={13} /> {matchLabelOf(l.match_status, t)} · {t('detail.exceptionPanel')}
                            </span>
                            <span style={{ fontSize: 12, color: '#717786' }}>
                              {t('detail.colBillValue')} <b style={MONO} className="font-semibold text-[#181C23]">${money(v.billAmt)}</b>
                              <span className="mx-1.5 text-[#C1C6D7]">|</span>
                              {t('detail.colOurValue')} <b style={MONO} className="font-semibold text-[#0058BC]">{v.ourAmt == null ? '—' : `$${money(v.ourAmt)}`}</b>
                              <span className="mx-1.5 text-[#C1C6D7]">|</span>
                              {t('detail.colDiff')} <b style={MONO} className="font-semibold text-[#BA1A1A]">{v.diff == null ? '—' : moneySigned(v.diff)}</b>
                            </span>
                          </div>
                          <DiffPanel
                            line={l}
                            busy={diffActionMut.isPending || followMut.isPending}
                            onAction={async (dto) => { await diffActionMut.mutateAsync({ id: l.diff_id, dto }); setExpanded(null); }}
                            onRecalc={async () => { await recalcMut.mutateAsync(l.diff_id); }}
                            onFollow={async (text) => { await followMut.mutateAsync({ id: l.diff_id, note: text }); }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {!lines.length && !linesQ.isLoading && (
                <tr><td colSpan={colCount}><Empty text={linesQ.isError ? errMsg(linesQ.error) : t('detail.emptyLines')} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pager
          page={page} size={size} total={total}
          onPage={setPage}
          onSize={(s) => { setSize(s); setPage(1); }}
        />
      </div>

      {Object.keys(overrides).length > 0 && !locked && (
        <p className="mb-3 flex items-center gap-1.5 text-[11.5px] text-[#B06000]">
          <AlertTriangle size={12} /> {t('detail.localEditHint')}
        </p>
      )}

      {/* ═══ Section 4：底部封帐条 ═══ */}
      {reconStatus === 'pending' && (
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
          <span style={{ fontSize: 13, color: '#717786' }}>{t('detail.pendingHint')}</span>
          <button onClick={runReconcile} disabled={reconcileMut.isPending} className="btn-primary" style={{ fontSize: 13 }}>
            {reconcileMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} {t('detail.startReconcile')}
          </button>
        </div>
      )}
      {reconStatus === 'running' && (
        <div
          className="flex flex-wrap items-center justify-between gap-3"
          style={{
            padding: '14px 18px', borderRadius: 14,
            background: unresolved > 0 ? 'rgba(255,255,255,0.95)' : 'rgba(52,199,89,0.07)',
            border: unresolved > 0 ? '1px solid rgba(193,198,215,0.42)' : '1px solid rgba(52,199,89,0.3)',
          }}
        >
          {unresolved > 0 ? (
            <span className="flex items-center gap-2.5">
              <AlertTriangle size={18} color="#BA1A1A" />
              <span>
                <span className="block" style={{ fontSize: 14, fontWeight: 700, color: '#BA1A1A' }}>{t('detail.bottomExceptionTitle')}</span>
                <span className="block" style={{ fontSize: 12.5, color: '#717786' }}>{t('detail.bottomException', { n: unresolved })}</span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-2.5">
              <CheckCircle2 size={18} color="#1E8033" />
              <span>
                <span className="block" style={{ fontSize: 14, fontWeight: 700, color: '#1E8033' }}>{t('detail.bottomCleanTitle')}</span>
                <span className="block" style={{ fontSize: 12.5, color: '#717786' }}>{t('detail.bottomClean')}</span>
              </span>
            </span>
          )}
          <div className="flex items-center gap-2">
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { setActionErr(''); setConfirmRecalc(true); }}>
              <RefreshCw size={13} /> {t('detail.recalc')}
            </button>
            <button
              onClick={() => { setActionErr(''); setNote(''); setConfirmComplete(true); }}
              className="inline-flex items-center gap-1.5"
              style={{
                padding: '8px 18px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                background: unresolved > 0 ? 'rgba(186,26,26,0.1)' : '#0058BC',
                color: unresolved > 0 ? '#BA1A1A' : '#fff',
                border: unresolved > 0 ? '1px solid rgba(186,26,26,0.35)' : 'none',
              }}
            >
              <Lock size={13} /> {t('detail.confirmReconcile')}
            </button>
          </div>
        </div>
      )}
      {locked && (
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.3)' }}>
          <span className="flex items-center gap-2.5">
            <CheckCircle2 size={18} color="#1E8033" />
            <span>
              <span className="block" style={{ fontSize: 14, fontWeight: 700, color: '#1E8033' }}>{t('detail.bottomLocked')}</span>
              <span className="block" style={{ fontSize: 12.5, color: '#717786' }}>{t('detail.lockedHint')}</span>
            </span>
          </span>
          {isSupervisor ? (
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { setActionErr(''); setConfirmUnlock(true); }}>
              <LockOpen size={13} /> {t('detail.supervisorUnlock')}
            </button>
          ) : (
            <button className="btn-ghost" style={{ fontSize: 13, opacity: 0.6 }} onClick={() => setToast({ type: 'success', message: t('detail.applyUnlockDone') })}>
              <LockOpen size={13} /> {t('detail.applyUnlock')}
            </button>
          )}
        </div>
      )}

      {/* ═══ 重算确认 Modal（520） ═══ */}
      {confirmRecalc && (
        <ConfirmShell width={520} onClose={() => setConfirmRecalc(false)}>
          <ModalHeader
            icon={<RefreshCw size={18} />}
            iconBg="rgba(0,88,188,0.1)" iconColor="#0058BC"
            title={t('detail.recalcModalTitle')} subtitle={t('detail.recalcModalSub')} subtitleWrap
            onClose={() => setConfirmRecalc(false)}
          />
          <div style={{ padding: '12px 24px', background: 'rgba(0,88,188,0.05)' }}>
            <div className="grid grid-cols-3 gap-3">
              <ModalStat label={t('detail.recalcImpactRows')} value={totalLines} />
              <ModalStat label={t('detail.recalcImpactUntrialed')} value={dist._untrialed ?? 0} valueColor={(dist._untrialed ?? 0) > 0 ? '#B06000' : '#181C23'} />
              <ModalStat label={t('detail.recalcImpactDiff')} value={moneySigned(b.difference_amount)} valueColor={diffNum !== 0 ? '#BA1A1A' : '#1E8033'} />
            </div>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>{t('detail.recalcModalBody')}</p>
            <p className="mt-1.5 flex items-start gap-1.5" style={{ fontSize: 12, color: '#7A4E00' }}>
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {t('detail.recalcModalHint')}
            </p>
          </div>
          <ModalFooter>
            <button className="btn-secondary" onClick={() => setConfirmRecalc(false)}>{t('detail.cancel')}</button>
            <button className="btn-primary" disabled={reconcileMut.isPending} onClick={runReconcile}>
              {reconcileMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {reconcileMut.isPending ? t('detail.calculating') : t('detail.recalcConfirm')}
            </button>
          </ModalFooter>
        </ConfirmShell>
      )}

      {/* ═══ 封帐确认 Modal（520） ═══ */}
      {confirmComplete && (
        <ConfirmShell width={520} onClose={() => setConfirmComplete(false)}>
          <ModalHeader
            icon={<Lock size={18} />}
            iconBg={unresolved > 0 ? 'rgba(186,26,26,0.1)' : 'rgba(52,199,89,0.12)'}
            iconColor={unresolved > 0 ? '#BA1A1A' : '#1E8033'}
            title={t('detail.confirmComplete')}
            subtitle={`${b.batch_no} · ${b.insurer_short || b.insurer_name || ''}`}
            onClose={() => setConfirmComplete(false)}
          />
          <div style={{ padding: '12px 24px', background: unresolved > 0 ? 'rgba(255,159,10,0.08)' : 'rgba(52,199,89,0.08)' }}>
            <div className="grid grid-cols-4 gap-3">
              <ModalStat label={t('detail.completeRows')} value={totalLines} />
              <ModalStat label={t('detail.completeMatched')} value={matchedCount} valueColor="#1E8033" />
              <ModalStat label={t('detail.completeEx')} value={unresolved} valueColor={unresolved > 0 ? '#BA1A1A' : '#1E8033'} />
              <ModalStat label={t('detail.completeDiff')} value={moneySigned(b.difference_amount)} valueColor={diffNum !== 0 ? '#BA1A1A' : '#1E8033'} />
            </div>
          </div>
          {unresolved > 0 ? (
            <div style={{ padding: '16px 24px' }}>
              <p className="flex items-start gap-1.5" style={{ fontSize: 12.5, color: '#BA1A1A', lineHeight: 1.7 }}>
                <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                <span>{t('detail.exceptionRemain', { n: unresolved })} {t('detail.completeBlocked')}</span>
              </p>
              {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
            </div>
          ) : (
            <div style={{ padding: '16px 24px' }}>
              <p className="flex items-start gap-1.5" style={{ fontSize: 12.5, color: '#555', lineHeight: 1.7 }}>
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[#1E8033]" /> {t('detail.completeLockNote')}
              </p>
              <div className="mt-3">
                <label className="mb-1 block text-[12.5px] font-medium text-[#555]">{t('detail.completeNoteLabel')}</label>
                <textarea className={`${inputCls} h-20 resize-none`} placeholder={t('detail.completeNotePh')} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
            </div>
          )}
          <ModalFooter>
            {unresolved > 0 ? (
              <button className="btn-primary" onClick={() => { setConfirmComplete(false); setFilter('exception'); setPage(1); }}>{t('detail.gotIt')}</button>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => setConfirmComplete(false)}>{t('detail.cancel')}</button>
                <button className="btn-primary" disabled={completeMut.isPending}
                  style={{ background: '#1E8033' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#176B2A'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1E8033'; }}
                  onClick={doComplete}>
                  {completeMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />} {t('detail.confirmComplete')}
                </button>
              </>
            )}
          </ModalFooter>
        </ConfirmShell>
      )}

      {/* 主管解锁 */}
      {confirmUnlock && (
        <Modal title={t('detail.unlockTitle')} onClose={() => setConfirmUnlock(false)}>
          <p className="text-[13px] text-[#555]">{t('detail.unlockConfirm')}</p>
          {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setConfirmUnlock(false)}>{t('detail.cancel')}</Btn>
            <Btn variant="primary" icon={<LockOpen size={14} />} loading={unlockMut.isPending} onClick={doUnlock}>{t('detail.supervisorUnlock')}</Btn>
          </div>
        </Modal>
      )}

      {/* 作废 */}
      {confirmVoid && (
        <Modal title={t('detail.voidTitle')} onClose={() => setConfirmVoid(false)}>
          <p className="text-[13px] text-[#555]">{t('detail.voidConfirm', { no: b.batch_no })}</p>
          {actionErr && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[#BA1A1A]">{actionErr}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setConfirmVoid(false)}>{t('detail.cancel')}</Btn>
            <Btn variant="danger" icon={<Ban size={14} />} loading={voidMut.isPending} onClick={doVoid}>{t('detail.void')}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ───────────────────────────────── 小组件 ─────────────────────────────────

function matchLabelOf(status: string, t: (k: string) => string) {
  if (status === 'rate_diff') return t('detail.matchRateDiff');
  if (status === 'amount_diff') return t('detail.matchAmountDiff');
  return t('detail.matchUntrialed');
}

function ConfirmShell({ width, onClose, children }: { width: number; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden bg-white"
        style={{ maxWidth: width, borderRadius: 18 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon, iconBg, iconColor, title, subtitle, subtitleWrap, onClose }: {
  icon: React.ReactNode; iconBg: string; iconColor: string; title: string; subtitle: string; subtitleWrap?: boolean; onClose: () => void;
}) {
  return (
    <div className={`relative flex gap-3 ${subtitleWrap ? 'items-start' : 'items-center'}`} style={{ padding: '20px 24px 16px' }}>
      <span className="flex shrink-0 items-center justify-center" style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <span className="min-w-0" style={{ paddingRight: 24 }}>
        <span className="block" style={{ fontSize: 15, fontWeight: 700, color: '#181C23' }}>{title}</span>
        <span className={subtitleWrap ? 'block' : 'block truncate'} style={{ fontSize: 12.5, color: '#717786', lineHeight: 1.5 }}>{subtitle}</span>
      </span>
      <button className="btn-ghost absolute" style={{ top: 12, right: 12, padding: 6, color: '#717786' }} onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}

function ModalStat({ label, value, valueColor }: { label: string; value: React.ReactNode; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: '#717786' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: valueColor ?? '#181C23', marginTop: 2, ...MONO }}>{value}</div>
    </div>
  );
}

function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end gap-2" style={{ padding: '14px 24px', background: 'rgba(246,248,255,0.7)', borderTop: '0.5px solid rgba(193,198,215,0.4)' }}>
      {children}
    </div>
  );
}

function MatchBadge({ status }: { status: string }) {
  const { t } = useTranslation('finance');
  const map: Record<string, { cls: string; dot: string; key: string }> = {
    matched: { cls: 'bg-[rgba(52,199,89,0.12)] text-[#1E8033]', dot: 'bg-[#34C759]', key: 'matchMatched' },
    rate_diff: { cls: 'bg-[rgba(125,90,240,0.12)] text-[#6D3FD0]', dot: 'bg-[#7D5AF0]', key: 'matchRateDiff' },
    amount_diff: { cls: 'bg-[rgba(186,26,26,0.1)] text-[#BA1A1A]', dot: 'bg-[#BA1A1A]', key: 'matchAmountDiff' },
  };
  const s = map[status] ?? { cls: 'bg-[rgba(160,165,177,0.16)] text-[#8A8F99]', dot: 'bg-[#A0A5B1]', key: 'matchUntrialed' };
  return <Badge pill cls={s.cls} dot={s.dot}>{t(`detail.${s.key}`)}</Badge>;
}

function ResolutionBadge({ resolution }: { resolution: string }) {
  const { t } = useTranslation('finance');
  const key = resolution === 'open' ? 'resOpen' : resolution === 'suspended' ? 'resSuspended' : 'resResolved';
  const cls = resolution === 'open'
    ? 'bg-[rgba(186,26,26,0.08)] text-[#BA1A1A]'
    : resolution === 'suspended'
      ? 'bg-[rgba(255,159,10,0.12)] text-[#B06000]'
      : 'bg-[rgba(52,199,89,0.1)] text-[#1E8033]';
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>{t(`detail.${key}`)}</span>;
}

// ───────────────────────────────── 异常内联处理面板 ─────────────────────────────────

function DiffPanel({
  line, busy, onAction, onRecalc, onFollow,
}: {
  line: any;
  busy: boolean;
  onAction: (dto: any) => Promise<void>;
  onRecalc: () => Promise<void>;
  onFollow: (text: string) => Promise<void>;
}) {
  const { t } = useTranslation('finance');
  const [result, setResult] = useState(line.resolution_result ?? 'data_confirmed');
  const [noteText, setNoteText] = useState(line.diff_note ?? '');
  const [suspendReason, setSuspendReason] = useState(line.suspend_reason ?? '');
  const [followText, setFollowText] = useState('');
  const [err, setErr] = useState('');

  const followUps: any[] = Array.isArray(line.follow_ups) ? line.follow_ups : [];
  const resolution: string = line.diff_resolution;
  const LEVEL_KEY: Record<string, string> = {
    product_state: 'levelProductState', product_all: 'levelProductAll',
    lob_state: 'levelLobState', lob_all: 'levelLobAll', bill_original: 'levelBillOriginal',
  };

  async function guard(fn: () => Promise<void>) {
    setErr('');
    try { await fn(); setFollowText(''); } catch (e) { setErr(errMsg(e)); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <ResolutionBadge resolution={resolution} />
        {line.resolution_result && (
          <span className="rounded bg-[rgba(125,90,240,0.1)] px-2 py-0.5 text-[#6D3FD0]">
            {t(`detail.result_${line.resolution_result}`)}
          </span>
        )}
        {line.trial_level && <span className="text-[#A0A5B1]">{t('detail.trialLevelLabel')}{t(`detail.${LEVEL_KEY[line.trial_level] ?? 'matchUntrialed'}`)}</span>}
        {line.suspend_reason && <span className="text-[#B06000]">{line.suspend_reason}</span>}
        {line.diff_note && <span className="text-[#717786]">{line.diff_note}</span>}
      </div>

      <div className="space-y-2 rounded-xl p-3" style={{ background: 'rgba(246,248,255,0.6)', border: '1px solid rgba(193,198,215,0.35)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#717786]">{t('detail.resResult')}</span>
          <select className={`${inputCls} !w-44 !py-1 text-xs`} style={{ minWidth: 180 }} value={result} onChange={(e) => setResult(e.target.value)}>
            {RESOLUTION_RESULTS.map((r) => <option key={r.value} value={r.value}>{t(`detail.result_${r.value}`)}</option>)}
          </select>
          <input
            className={`${inputCls} flex-1 !py-1 text-xs`}
            style={{ minWidth: 240 }}
            placeholder={t('detail.resNotePh')}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
          />
          <Btn
            size="sm" variant="primary" disabled={busy || resolution === 'resolved'}
            onClick={() => guard(async () => {
              if (!noteText.trim()) throw new Error(t('detail.noteRequired'));
              await onAction({ action: 'resolve', resolution_result: result, note: noteText.trim() });
            })}
          >
            {t('detail.markResolved')}
          </Btn>
          <Btn size="sm" loading={busy} icon={<RefreshCw size={12} />} onClick={() => guard(onRecalc)}>
            {t('detail.actRecalc')}
          </Btn>
          {(resolution === 'resolved' || resolution === 'suspended') && (
            <Btn size="sm" disabled={busy} onClick={() => guard(() => onAction({ action: 'reopen' }))}>{t('detail.reopen')}</Btn>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={`${inputCls} flex-1 !py-1 text-xs`}
            style={{ minWidth: 240 }}
            placeholder={t('detail.suspendReasonPh')}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
          />
          <Btn
            size="sm" disabled={busy || resolution === 'suspended'}
            onClick={() => guard(async () => {
              if (!suspendReason.trim()) throw new Error(t('detail.suspendRequired'));
              await onAction({ action: 'suspend', note: suspendReason.trim() });
            })}
          >
            {t('detail.suspend')}
          </Btn>
          <span className="text-[11px] text-[#A0A5B1]">{t('detail.recalcHint')}</span>
        </div>
      </div>

      {err && <p className="rounded-lg border border-[rgba(186,26,26,0.25)] bg-[rgba(186,26,26,0.06)] px-3 py-2 text-xs text-[#BA1A1A]">{err}</p>}

      {/* 跟进时间线 */}
      <div>
        <div className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-[#555]">
          <History size={12} /> {t('detail.followTitle', { n: followUps.length })}
        </div>
        <div className="space-y-1">
          {[...followUps].reverse().map((f, i) => (
            <div key={i} className="rounded-lg border border-[rgba(193,198,215,0.4)] bg-white/70 px-3 py-1.5 text-xs">
              <span className="text-[#A0A5B1]">{dt(f.at)}</span>
              <span className="mx-2 text-[#717786]">{f.by || '—'}</span>
              <span className="text-[#181C23]">{f.note}</span>
            </div>
          ))}
          {!followUps.length && <p className="text-[11.5px] text-[#A0A5B1]">{t('detail.noFollow')}</p>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            className={`${inputCls} !py-1 text-xs`}
            placeholder={t('detail.followPh')}
            value={followText}
            onChange={(e) => setFollowText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && followText.trim()) guard(() => onFollow(followText.trim()));
            }}
          />
          <Btn size="sm" icon={<MessageSquarePlus size={12} />} disabled={busy || !followText.trim()}
            onClick={() => guard(() => onFollow(followText.trim()))}>
            {t('detail.addFollow')}
          </Btn>
        </div>
      </div>

      {resolution === 'resolved' && line.resolved_date && (
        <p className="text-[11.5px] text-[#A0A5B1]">{t('detail.resolvedLine', { date: day(line.resolved_date), by: line.resolved_by || '—' })}</p>
      )}
    </div>
  );
}
