/**
 * V1.0.16 结算参数配置（财务结算 Tab 2）— 按 Figma 原型还原
 *
 * - 顶部：标题 + 批量导入 / 导出 / 新增佣金率
 * - 四级回退说明条（P1 产品+州 → P2 产品全域 → P3 险种+州 → P4 险种全域）
 * - 跨保司费率表：保司 / 维度 / 险种·产品 / 佣金率 / 生效·截止 / 版本 / 状态 / 更新人 / 操作
 * - 版本历史、费率详情均为右侧抽屉（420px）
 * - 登记式维护：新版本自动衔接收敛旧版本；操作仅「置失效」（软删除）
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Upload, Download, Eye, Edit2, MoreHorizontal, Search, X,
  FileSpreadsheet, CheckCircle2, CheckCircle, AlertTriangle, PauseCircle,
  TrendingUp, Calendar, History, Building2, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useCommissionRates, useCreateCommissionRate, useUpdateCommissionRate,
  useDeleteCommissionRate, useBatchDeleteCommissionRates,
  usePrecheckCommissionRates, useImportCommissionRates,
} from '@/services/financeService';
import {
  Btn, Badge, Modal, Drawer, Pager, Empty, inputCls,
  day, errMsg, rowsToXlsx, parseWorkbook, extOf,
} from './finance-ui';
import Toast from '@/components/SuccessToast';

const LOB_OPTIONS = ['Auto', 'Home', 'Commercial', 'Cyber', 'Life', 'Travel', 'Professional', 'D&O', 'Specialty'];

// 保司头像（原型：28×28 圆角 8px 蓝底 + 前 3 字符）
function avatarAbbr(name: string): string {
  const first = (name || '?').trim().split(/\s+/)[0] ?? name;
  return first.slice(0, 3).toUpperCase();
}

/** 0.125 → "12.5 %"；0.11 → "11 %"；0.1525 → "15.25 %"。 */
function rateLabel(v: any): string {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return '—';
  const pct = (n * 100).toFixed(2).replace(/\.?0+$/, '');
  return `${pct} %`;
}

interface RateRow {
  rate_id: string;
  carrier_id: string;
  carrier_name: string;
  dimension: 'lob' | 'product';
  line_of_business: string | null;
  product_id: string | null;
  product_name: string | null;
  product_code: string | null;
  state: string | null;
  rate: number;
  effective_from: string;
  effective_to: string | null;
  status: 'active' | 'pending' | 'expired';
  version: number;
  created_by: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface RateGroup {
  key: string;
  current: RateRow;
  versions: RateRow[];
}

function rateKey(r: RateRow): string {
  return `${r.carrier_id}|${r.dimension}|${r.dimension === 'product' ? r.product_id ?? '' : r.line_of_business ?? ''}|${r.state ?? ''}`;
}

function rateStatusMeta(s: string): { cls: string; dot: string } {
  if (s === 'active') return { cls: 'bg-[rgba(52,199,89,0.12)] text-[#1E8033]', dot: 'bg-[#34C759]' };
  if (s === 'pending') return { cls: 'bg-[rgba(0,88,188,0.1)] text-[#0058BC]', dot: 'bg-[#0058BC]' };
  return { cls: 'bg-[rgba(160,165,177,0.16)] text-[#8A8F99]', dot: 'bg-[#A0A5B1]' };
}

function rateStatusKey(s: string): string {
  return `rates.st${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

const MONO = "'JetBrains Mono', monospace";

export default function RateConfigView({ insurers, initialCarrierId }: { insurers: any[]; initialCarrierId?: string }) {
  const { t } = useTranslation('finance');

  const [carrierFilter, setCarrierFilter] = useState(initialCarrierId ?? '');
  const [lobFilter, setLobFilter] = useState('');
  const [dimFilter, setDimFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RateRow | null>(null);
  const [confirmOff, setConfirmOff] = useState<RateRow | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [versionsOf, setVersionsOf] = useState<RateGroup | null>(null);
  const [detailOf, setDetailOf] = useState<RateGroup | null>(null);
  const [menuFor, setMenuFor] = useState<{ x: number; y: number; row: RateRow } | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchOffOpen, setBatchOffOpen] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const ratesQ = useCommissionRates({});
  const allRates: RateRow[] = (ratesQ.data?.data ?? []) as RateRow[];
  const offMut = useDeleteCommissionRate();
  const batchOffMut = useBatchDeleteCommissionRates();

  // 同费率键折叠：仅最新版本进表，历史版本进版本抽屉
  const groups: RateGroup[] = useMemo(() => {
    const map = new Map<string, RateRow[]>();
    for (const r of allRates) {
      const k = rateKey(r);
      const arr = map.get(k);
      if (arr) arr.push(r); else map.set(k, [r]);
    }
    return [...map.entries()].map(([key, rows]) => {
      const versions = [...rows].sort((a, b) => b.version - a.version);
      return { key, current: versions[0], versions };
    });
  }, [allRates]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return groups.filter((g) => {
      const r = g.current;
      if (carrierFilter && r.carrier_id !== carrierFilter) return false;
      if (lobFilter && r.line_of_business !== lobFilter) return false;
      if (dimFilter && r.dimension !== dimFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (kw) {
        const hay = `${r.carrier_name} ${r.line_of_business ?? ''} ${r.product_name ?? ''} ${r.product_code ?? ''} ${r.product_id ?? ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    }).sort((a, b) => a.current.carrier_name.localeCompare(b.current.carrier_name));
  }, [groups, carrierFilter, lobFilter, dimFilter, statusFilter, search]);

  const total = filtered.length;
  const pageRows = filtered.slice((page - 1) * size, page * size);

  // 统计（基于折叠后的当前版本）
  const stats = useMemo(() => {
    const s = { active: 0, pending: 0, expired: 0, carriers: new Set<string>() };
    for (const g of groups) {
      s[g.current.status] += 1;
      s.carriers.add(g.current.carrier_id);
    }
    return { ...s, carriers: s.carriers.size };
  }, [groups]);

  function exportRates() {
    const out = filtered.map((g) => {
      const r = g.current;
      return {
        carrier: r.carrier_name,
        dimension: r.dimension,
        target: r.dimension === 'lob' ? r.line_of_business : (r.product_name || r.product_code || r.product_id),
        state: r.state ?? '',
        rate_pct: parseFloat((r.rate * 100).toFixed(2)),
        effective_from: day(r.effective_from),
        effective_to: r.effective_to ? day(r.effective_to) : '',
        version: r.version,
        versions: g.versions.length,
        status: r.status,
        updated_by: r.created_by ?? '',
      };
    });
    rowsToXlsx(`commission-rates-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Rates', out);
  }

  async function doDeactivate() {
    if (!confirmOff) return;
    try {
      await offMut.mutateAsync(confirmOff.rate_id);
      setConfirmOff(null);
      setToast({ type: 'success', message: t('rates.deactivateBtn') });
      ratesQ.refetch();
    } catch (e) {
      setToast({ type: 'error', message: errMsg(e) });
    }
  }

  // 仅 active / pending 状态可置失效（与单个置失效条件一致）
  const deactivatableGroups = pageRows.filter((g) => g.current.status !== 'expired');
  const deactivatableIds = deactivatableGroups.map((g) => g.current.rate_id);
  const allDeactSelected = deactivatableIds.length > 0 && deactivatableIds.every((id) => selected.has(id));

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (allDeactSelected) {
      setSelected((prev) => { const next = new Set(prev); deactivatableIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); deactivatableIds.forEach((id) => next.add(id)); return next; });
    }
  }
  function clearSelection() { setSelected(new Set()); }

  const selectedDeactCount = deactivatableIds.filter((id) => selected.has(id)).length;

  async function doBatchDeactivate() {
    if (selectedDeactCount === 0) return;
    try {
      const res: any = await batchOffMut.mutateAsync(Array.from(selected));
      setToast({
        type: 'success',
        message: t('rates.batchDeactivateResult', { deactivated: res?.deactivated ?? 0, skipped: res?.skipped ?? 0 }),
      });
      clearSelection();
      setBatchOffOpen(false);
      ratesQ.refetch();
    } catch (e) {
      setToast({ type: 'error', message: errMsg(e) });
    }
  }

  function openMenu(e: React.MouseEvent, row: RateRow) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.min(Math.max(8, rect.right - 150), window.innerWidth - 152);
    const y = Math.min(rect.bottom + 4, window.innerHeight - 60);
    setMenuFor({ x, y, row });
  }

  function targetText(r: RateRow): string {
    return r.dimension === 'lob'
      ? (r.line_of_business ?? '—')
      : (r.product_name || r.product_code || r.product_id || '—');
  }

  // 原型表格展示保司简称（shortName），避免长全称换行；无简称时回退全称
  const shortOf = (cid: string): string =>
    insurers.find((c) => c.carrier_id === cid || c.config_id === cid)?.insurer_short || '';

  return (
    <div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* 标题行（embedded：14/700 + 右侧三按钮） */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[14px] font-bold text-[#181C23]">{t('rates.title')}</h1>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setImportOpen(true)}>
            <Upload size={13} /> {t('rates.btnImport')}
          </button>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={exportRates} disabled={!filtered.length}>
            <Download size={13} /> {t('rates.btnExport')}
          </button>
          <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={13} /> {t('rates.btnAdd')}
          </button>
        </div>
      </div>

      {/* 四级回退说明条（圆形① + 标题 + 统一蓝 chips + 尾注） */}
      <div
        className="flex items-start gap-3"
        style={{
          background: 'rgba(0,88,188,0.05)', border: '1px solid rgba(0,88,188,0.2)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20,
        }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{ width: 28, height: 28, background: 'rgba(0,88,188,0.12)', color: '#0058BC', fontSize: 13, fontWeight: 800 }}
        >
          ①
        </span>
        <div className="min-w-0">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0058BC', marginBottom: 5 }}>{t('rates.fallbackTitle')}</div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(['p1', 'p2', 'p3', 'p4'] as const).map((k, i) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span
                  className="inline-flex items-center"
                  style={{
                    padding: '4px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                    background: 'rgba(0,88,188,0.09)', border: '0.5px solid rgba(0,88,188,0.22)', color: '#0058BC',
                  }}
                >
                  {t(`rates.${k}`)}
                </span>
                {i < 3 && <span style={{ color: '#C1C6D7', fontSize: 14 }}>→</span>}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#717786', marginTop: 6 }}>{t('rates.fallbackTail')}</div>
        </div>
      </div>

      {/* 4 个 KPI（左右布局：数字+标签 / 右图标） */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4" style={{ marginBottom: 20 }}>
        {[
          { n: stats.active, label: t('rates.statActive'), color: '#1E8033', bg: 'rgba(52,199,89,0.08)', border: 'rgba(52,199,89,0.22)', Icon: TrendingUp },
          { n: stats.pending, label: t('rates.statPending'), color: '#0058BC', bg: 'rgba(0,88,188,0.08)', border: 'rgba(0,88,188,0.22)', Icon: Calendar },
          { n: stats.expired, label: t('rates.statExpired'), color: '#717786', bg: 'rgba(193,198,215,0.12)', border: 'rgba(193,198,215,0.3)', Icon: History },
          { n: stats.carriers, label: t('rates.statCarriers'), color: '#AF52DE', bg: 'rgba(175,82,222,0.08)', border: 'rgba(175,82,222,0.22)', Icon: Building2 },
        ].map(({ n, label, color, bg, border: bd, Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between"
            style={{
              padding: '16px 20px', borderRadius: 14,
              background: bg, border: `1px solid ${bd}`,
            }}
          >
            <span>
              <span className="block" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color, fontFamily: "'JetBrains Mono', monospace" }}>{n}</span>
              <span className="block" style={{ fontSize: 13, color: '#414755', marginTop: 4 }}>{label}</span>
            </span>
            <Icon size={22} style={{ color, opacity: 0.3 }} />
          </div>
        ))}
      </div>

      {/* 筛选条：搜索 flex:1 + 四个自适应下拉 */}
      <div className="flex items-center gap-2.5" style={{ marginBottom: 14 }}>
        <div className="relative flex-1">
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#717786' }} />
          <input
            className="input-glass w-full"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder={t('rates.searchPh')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="input-glass" style={{ fontSize: 13, maxWidth: 200 }} value={carrierFilter} onChange={(e) => { setCarrierFilter(e.target.value); setPage(1); }}>
          <option value="">{t('rates.allCarriers')}</option>
          {insurers.map((c) => (
            <option key={c.config_id ?? c.carrier_id} value={c.carrier_id}>{c.insurer_short || c.carrier_name}</option>
          ))}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={lobFilter} onChange={(e) => { setLobFilter(e.target.value); setPage(1); }}>
          <option value="">{t('rates.allLobs')}</option>
          {LOB_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={dimFilter} onChange={(e) => { setDimFilter(e.target.value); setPage(1); }}>
          <option value="">{t('rates.allDimensions')}</option>
          <option value="lob">{t('rates.dimLob')}</option>
          <option value="product">{t('rates.dimProduct')}</option>
        </select>
        <select className="input-glass" style={{ fontSize: 13 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('rates.allStatus')}</option>
          <option value="active">{t('rates.stActive')}</option>
          <option value="pending">{t('rates.stPending')}</option>
          <option value="expired">{t('rates.stExpired')}</option>
        </select>
      </div>

      {/* 批量操作条（有选中时显示） */}
      {selectedDeactCount > 0 && (
        <div
          className="flex items-center gap-3"
          style={{ background: 'rgba(0,88,188,0.06)', border: '1px solid rgba(0,88,188,0.18)', borderRadius: 10, padding: '8px 14px', marginBottom: 12 }}
        >
          <PauseCircle size={15} color="#0058BC" />
          <span style={{ fontSize: 13, color: '#181C23' }}>
            {t('rates.selectedCount', { count: selectedDeactCount })}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="btn-secondary"
              style={{ fontSize: 12.5 }}
              onClick={() => setBatchOffOpen(true)}
              disabled={batchOffMut.isPending}
            >
              <PauseCircle size={13} /> {t('rates.batchDeactivate')}
            </button>
            <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={clearSelection}>
              {t('rates.cancelSelection')}
            </button>
          </div>
        </div>
      )}

      {/* 费率表 */}
      <div className="glass overflow-hidden rounded-[14px]" style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(193,198,215,0.42)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-[13px]">
            <thead>
              <tr style={{ background: 'rgba(246,248,255,0.9)' }}>
                <th style={{ padding: '11px 8px 11px 14px', textAlign: 'left', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allDeactSelected}
                    disabled={deactivatableIds.length === 0}
                    onChange={toggleAll}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#0058BC' }}
                  />
                </th>
                {['colCarrier', 'colDimension', 'colTarget', 'colRate', 'colEffective', 'colExpiry', 'colVersion', 'colStatus', 'colUpdatedBy', 'colActions'].map((k) => (
                  <th key={k} className="whitespace-nowrap text-left text-[11.5px] font-semibold text-[#717786]" style={{ padding: '11px 14px' }}>
                    {t(`rates.${k}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((g, i) => {
                const r = g.current;
                const sp = rateStatusMeta(r.status);
                const isProduct = r.dimension === 'product';
                return (
                  <tr
                    key={r.rate_id}
                    style={{
                      borderTop: '0.5px solid rgba(193,198,215,0.25)',
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(246,248,255,0.55)',
                    }}
                  >
                    {/* 选择框（已 expired 不可置失效故不可选） */}
                    <td style={{ padding: '11px 8px 11px 14px' }}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.rate_id)}
                        disabled={r.status === 'expired'}
                        onChange={() => toggleRow(r.rate_id)}
                        style={{ width: 15, height: 15, cursor: r.status === 'expired' ? 'not-allowed' : 'pointer', accentColor: '#0058BC' }}
                      />
                    </td>
                    {/* 保险公司（28×28 蓝色圆角块 + 前 3 字符） */}
                    <td style={{ padding: '11px 14px' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="flex shrink-0 items-center justify-center"
                          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,88,188,0.10)', color: '#0058BC', fontSize: 9, fontWeight: 700 }}
                        >
                          {avatarAbbr(r.carrier_name)}
                        </span>
                        <span className="whitespace-nowrap" style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{shortOf(r.carrier_id) || r.carrier_name}</span>
                      </div>
                    </td>
                    {/* 维度 */}
                    <td style={{ padding: '11px 14px' }}>
                      <span
                        className="inline-block whitespace-nowrap"
                        style={{
                          fontSize: 11.5, padding: '3px 8px', borderRadius: 6,
                          background: isProduct ? 'rgba(175,82,222,0.09)' : 'rgba(0,88,188,0.07)',
                          color: isProduct ? '#AF52DE' : '#0058BC',
                          border: `0.5px solid ${isProduct ? 'rgba(175,82,222,0.22)' : 'rgba(0,88,188,0.15)'}`,
                        }}
                      >
                        {isProduct ? t('rates.dimProduct') : t('rates.dimLob')}
                      </span>
                    </td>
                    {/* 险种 / 产品 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px' }}>
                      <span style={{ color: '#181C23', fontWeight: 500 }}>{targetText(r)}</span>
                      {r.state && (
                        <span className="ml-1.5 rounded bg-[rgba(0,88,188,0.08)] px-1.5 py-0.5 text-[10.5px] font-semibold text-[#0058BC]">
                          {r.state}
                        </span>
                      )}
                    </td>
                    {/* 佣金率 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: r.status === 'active' ? '#0058BC' : '#A0A5B1', fontFamily: MONO }}>
                        {rateLabel(r.rate)}
                      </span>
                    </td>
                    {/* 生效日期 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px', fontSize: 12.5, color: '#414755', fontFamily: MONO }}>
                      {day(r.effective_from)}
                    </td>
                    {/* 截止日期 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px', fontSize: 12.5, color: r.effective_to ? '#414755' : '#A0A5B1', fontFamily: MONO }}>
                      {r.effective_to ? day(r.effective_to) : t('rates.longTerm')}
                    </td>
                    {/* 版本 */}
                    <td style={{ padding: '11px 14px' }}>
                      <button
                        className="btn-ghost inline-flex items-center whitespace-nowrap"
                        style={{ padding: '3px 8px', fontSize: 12, gap: 4 }}
                        title={t('rates.versionTitle')}
                        onClick={() => { setVersionsOf(g); setDetailOf(null); }}
                      >
                        <History size={12} />
                        <span style={{ fontFamily: MONO }}>v{r.version}</span>
                        {g.versions.length > 1 && <span style={{ fontSize: 10, color: '#717786' }}>({g.versions.length})</span>}
                      </button>
                    </td>
                    {/* 状态 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px' }}>
                      <Badge pill cls={sp.cls} dot={sp.dot}>{t(rateStatusKey(r.status))}</Badge>
                    </td>
                    {/* 更新人 */}
                    <td className="whitespace-nowrap" style={{ padding: '11px 14px', fontSize: 12, color: '#717786' }}>
                      {r.created_by || '—'}
                    </td>
                    {/* 操作（Eye 查看 / Edit2 编辑 / MoreHorizontal 更多） */}
                    <td style={{ padding: '11px 14px' }}>
                      <div className="flex items-center gap-0.5">
                        <button className="btn-ghost" style={{ padding: 5 }} title={t('rates.view')} onClick={() => { setDetailOf(g); setVersionsOf(null); }}>
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ padding: 5 }}
                          title={t('rates.edit')}
                          onClick={() => { setEditing(g.current); setDetailOf(null); setVersionsOf(null); setFormOpen(true); }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-ghost" style={{ padding: 5 }} title={t('rates.more')} onClick={(e) => openMenu(e, g.current)}>
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!pageRows.length && (
                <tr><td colSpan={11} style={{ padding: '40px 16px' }}><Empty text={ratesQ.isError ? t('rates.loadFailed') : t('rates.empty')} /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pager page={page} size={size} total={total} onPage={setPage} onSize={(s) => { setSize(s); setPage(1); }} />

      {/* 新增 / 编辑弹窗 */}
      {formOpen && (
        <RateFormModal
          insurers={insurers}
          initialCarrierId={carrierFilter || initialCarrierId}
          editing={editing}
          onClose={() => setFormOpen(false)}
          onDone={(row, mode) => {
            setFormOpen(false)
            // 自动定位刚保存的记录：切到对应保司、清空搜索与其它筛选并回到第 1 页，
            // 否则按保司排序 + 前端分页会让新记录落在其它页，看起来像"没存上"
            if (row?.carrier_id) setCarrierFilter(row.carrier_id)
            setLobFilter(''); setDimFilter(''); setStatusFilter(''); setSearch('')
            setPage(1)
            ratesQ.refetch()
            setToast({ type: 'success', message: mode === 'created' ? t('rates.createSuccess') : t('rates.updateSuccess') })
          }}
          notify={(type, message) => setToast({ type, message })}
        />
      )}

      {/* 置失效确认（420 原型样式） */}
      {confirmOff && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmOff(null)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, background: 'rgba(255,149,0,0.1)', color: '#a05800' }}
              >
                <PauseCircle size={18} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t('rates.deactivateTitle')}</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6 }}>
              {t('rates.deactivateConfirm', { target: targetText(confirmOff), rate: rateLabel(confirmOff.rate) })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setConfirmOff(null)}>{t('rates.cancel')}</button>
              <button
                className="inline-flex items-center gap-1.5 disabled:opacity-60"
                style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9, background: '#a05800', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                disabled={offMut.isPending}
                onClick={doDeactivate}
              >
                {offMut.isPending ? <AlertTriangle size={13} /> : <PauseCircle size={13} />}
                {t('rates.deactivateBtn')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 批量置失效确认 */}
      {batchOffOpen && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setBatchOffOpen(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', width: 420, boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <span
                className="flex items-center justify-center rounded-full"
                style={{ width: 40, height: 40, background: 'rgba(255,149,0,0.1)', color: '#a05800' }}
              >
                <PauseCircle size={18} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t('rates.batchDeactivateTitle')}</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#414755', lineHeight: 1.6 }}>
              {t('rates.batchDeactivateConfirm', { count: selectedDeactCount })}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setBatchOffOpen(false)}>{t('rates.cancel')}</button>
              <button
                className="inline-flex items-center gap-1.5 disabled:opacity-60"
                style={{ fontSize: 13, padding: '8px 20px', borderRadius: 9, background: '#a05800', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                disabled={batchOffMut.isPending}
                onClick={doBatchDeactivate}
              >
                {batchOffMut.isPending ? <Loader2 size={13} className="animate-spin" /> : <PauseCircle size={13} />}
                {t('rates.batchDeactivate')}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 版本历史抽屉 */}
      {versionsOf && (
        <Drawer
          title={`${t('rates.versionTitle')} · ${versionsOf.current.carrier_name} · ${targetText(versionsOf.current)}${versionsOf.current.state ? ` · ${versionsOf.current.state}` : ''}`}
          onClose={() => setVersionsOf(null)}
        >
          <div className="flex flex-col gap-2.5">
            {versionsOf.versions.map((v, i) => {
              const sp = rateStatusMeta(v.status);
              const isActive = v.status === 'active';
              return (
                <div
                  key={v.rate_id}
                  style={{
                    padding: '14px 16px', borderRadius: 11,
                    background: isActive ? 'rgba(0,88,188,0.05)' : 'rgba(246,248,255,0.8)',
                    border: `1px solid ${isActive ? 'rgba(0,88,188,0.22)' : 'rgba(193,198,215,0.4)'}`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12.5px] font-bold text-[#0058BC]" style={{ fontFamily: MONO }}>v{v.version}</span>
                      {i === 0 && isActive && (
                        <span className="badge badge-blue" style={{ fontSize: 10 }}>
                          {t('rates.currentVersion')}
                        </span>
                      )}
                      <Badge pill cls={sp.cls} dot={sp.dot}>{t(rateStatusKey(v.status))}</Badge>
                    </div>
                    <span className="text-[22px] font-bold" style={{ color: isActive ? '#0058BC' : '#A0A5B1', fontFamily: MONO }}>
                      {rateLabel(v.rate)}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#717786]">
                    {day(v.effective_from)} ～ {v.effective_to ? day(v.effective_to) : t('rates.longTerm')}
                  </div>
                  {v.remark && <div className="mt-1 text-[12px] italic text-[#414755]">{v.remark}</div>}
                  <div className="mt-[5px] text-[11px] text-[#A0A5B1]">
                    {t('rates.byLine', { by: v.created_by || '—', date: day(v.created_at) })}
                  </div>
                </div>
              );
            })}
          </div>
        </Drawer>
      )}

      {/* 费率详情抽屉 */}
      {detailOf && (
        <Drawer
          title={`${t('rates.detailTitle')} · ${detailOf.current.carrier_name} · ${targetText(detailOf.current)}`}
          onClose={() => setDetailOf(null)}
        >
          <RateDetail group={detailOf} targetText={targetText} onEdit={() => { setEditing(detailOf.current); setDetailOf(null); setFormOpen(true); }} />
        </Drawer>
      )}

      {/* 批量导入 */}
      {importOpen && (
        <RateImportModal
          insurers={insurers}
          initialCarrierId={initialCarrierId}
          onClose={() => setImportOpen(false)}
          onDone={(cid) => {
            setImportOpen(false)
            if (cid) setCarrierFilter(cid)
            setLobFilter(''); setDimFilter(''); setStatusFilter(''); setSearch('')
            setPage(1)
            ratesQ.refetch()
          }}
          notify={(type, message) => setToast({ type, message })}
        />
      )}

      {/* 行「更多」菜单（portal 到 body，外部点击关闭） */}
      {menuFor && createPortal(
        <RowMenu x={menuFor.x} y={menuFor.y} onClose={() => setMenuFor(null)}>
          <button
            className="flex w-full items-center gap-2 whitespace-nowrap rounded-md px-2.5 py-[7px] text-left text-[13px] text-[#a05800] hover:bg-[rgba(255,149,0,0.08)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            disabled={menuFor.row.status === 'expired'}
            onClick={() => { setConfirmOff(menuFor.row); setMenuFor(null); }}
          >
            <PauseCircle size={13} />{t('rates.deactivate')}
          </button>
        </RowMenu>,
        document.body,
      )}
    </div>
  );
}

// ───────────────────────────────── 行更多菜单 ─────────────────────────────────

function RowMenu({ x, y, onClose, children }: { x: number; y: number; onClose: () => void; children: React.ReactNode }) {
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
  return (
    <div
      className="fixed z-[60] min-w-[140px] rounded-lg border border-[rgba(193,198,215,0.6)] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

// ───────────────────────────────── 费率详情抽屉内容 ─────────────────────────────────

function RateDetail({ group, targetText, onEdit }: { group: RateGroup; targetText: (r: RateRow) => string; onEdit: () => void }) {
  const { t } = useTranslation('finance');
  const r = group.current;
  const active = r.status === 'active';
  const sp = rateStatusMeta(r.status);

  function row(label: string, value: React.ReactNode) {
    return (
      <div className="flex items-center justify-between gap-4" style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '0.5px solid rgba(193,198,215,0.25)' }}>
        <span className="shrink-0 text-[13px] text-[#717786]">{label}</span>
        <span className="text-right text-[13px] font-semibold text-[#181C23]" style={{ maxWidth: 240, wordBreak: 'break-word' }}>{value}</span>
      </div>
    );
  }

  return (
    <div>
      {/* Rate hero */}
      <div
        className="text-center"
        style={{
          padding: '20px 24px', borderRadius: 14, marginBottom: 20,
          background: active ? 'rgba(0,88,188,0.07)' : 'rgba(193,198,215,0.12)',
          border: `1px solid ${active ? 'rgba(0,88,188,0.22)' : 'rgba(193,198,215,0.35)'}`,
        }}
      >
        <div style={{ fontSize: 13, color: '#717786', marginBottom: 6 }}>{t('rates.detailRate')}</div>
        <div style={{ fontSize: 48, fontWeight: 800, lineHeight: 1, color: active ? '#0058BC' : '#A0A5B1', fontFamily: MONO }}>
          {rateLabel(r.rate).replace(/\s+/g, '')}
        </div>
        <div className="flex items-center justify-center" style={{ marginTop: 10, gap: 8 }}>
          <Badge pill cls={sp.cls} dot={sp.dot}>{t(rateStatusKey(r.status))}</Badge>
          <span style={{ fontSize: 12.5, color: '#717786', fontFamily: MONO }}>v{r.version}</span>
        </div>
      </div>

      {/* Detail fields */}
      <div>
        {row(t('rates.detailCarrier'), r.carrier_name)}
        {row(t('rates.detailDimension'), r.dimension === 'lob' ? t('rates.dimLob') : t('rates.dimProduct'))}
        {r.dimension === 'lob'
          ? row(t('rates.detailLob'), r.line_of_business || '—')
          : row(t('rates.detailProduct'), targetText(r))}
        {r.state && row(t('rates.detailState'), r.state)}
        {row(t('rates.detailEffective'), day(r.effective_from))}
        {row(t('rates.detailExpiry'), r.effective_to ? day(r.effective_to) : t('rates.longTerm'))}
        {row(t('rates.detailCreatedBy'), r.created_by || '—')}
        {row(t('rates.detailUpdatedAt'), r.updated_at ? day(r.updated_at) : '—')}
      </div>

      {r.remark && (
        <div style={{ marginTop: 4, padding: '12px 16px', borderRadius: 10, background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.15)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#717786', marginBottom: 5 }}>{t('rates.detailRemark')}</div>
          <div style={{ fontSize: 13, color: '#414755', lineHeight: 1.55 }}>{r.remark}</div>
        </div>
      )}

      <button className="btn-secondary mt-5 w-full justify-center" style={{ fontSize: 13 }} onClick={onEdit}>
        <Edit2 size={13} /> {t('rates.edit')}
      </button>
    </div>
  );
}

// ───────────────────────────────── 新增/编辑弹窗 ─────────────────────────────────

interface RateForm {
  carrier_id: string;
  dimension: 'lob' | 'product';
  line_of_business: string;
  product_name: string;
  ratePct: string;
  effective_from: string;
  effective_to: string;
  remark: string;
}

function RateFormModal({
  insurers, initialCarrierId, editing, onClose, onDone, notify,
}: {
  insurers: any[];
  initialCarrierId?: string;
  editing: RateRow | null;
  onClose: () => void;
  /** 保存成功后回调：返回落库行（含 carrier_id）及模式，供父级定位记录 */
  onDone: (row: { carrier_id?: string } | undefined, mode: 'created' | 'updated') => void;
  notify: (type: 'success' | 'error', message: string) => void;
}) {
  const { t } = useTranslation('finance');
  const createMut = useCreateCommissionRate();
  const updateMut = useUpdateCommissionRate();

  const [form, setForm] = useState<RateForm>(() => editing
    ? {
        carrier_id: editing.carrier_id,
        dimension: editing.dimension,
        line_of_business: editing.line_of_business ?? '',
        product_name: editing.product_name || editing.product_code || editing.product_id || '',
        ratePct: String(parseFloat((editing.rate * 100).toFixed(2))),
        effective_from: editing.effective_from ? String(editing.effective_from).slice(0, 10) : '',
        effective_to: editing.effective_to ? String(editing.effective_to).slice(0, 10) : '',
        remark: editing.remark ?? '',
      }
    : {
        // 默认保司跟随当前筛选（从某保司详情跳入时为该保司），而不是永远取列表第一个
        carrier_id: initialCarrierId || insurers[0]?.carrier_id || '',
        dimension: 'lob',
        line_of_business: '',
        product_name: '',
        ratePct: '',
        effective_from: new Date().toISOString().slice(0, 10),
        effective_to: '',
        remark: '',
      });
  const [err, setErr] = useState('');
  const set = (k: keyof RateForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.carrier_id) { setErr(t('rates.errCarrier')); return; }
    const pct = Number(form.ratePct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) { setErr(t('rates.errRate')); return; }
    if (!form.line_of_business) { setErr(t('rates.errLob')); return; }
    if (form.dimension === 'product' && !form.product_name.trim()) { setErr(t('rates.errProduct')); return; }
    if (!form.effective_from) { setErr(t('rates.errEffective')); return; }
    if (form.effective_to && form.effective_to < form.effective_from) { setErr(t('rates.errExpiry')); return; }

    const dto: any = {
      carrier_id: form.carrier_id,
      dimension: form.dimension,
      rate: Math.round(pct * 10000) / 10000 / 100,
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      remark: form.remark.trim() || null,
    };
    dto.line_of_business = form.line_of_business;
    if (form.dimension === 'product') dto.product_id = form.product_name.trim();
    // 编辑时保留原有州档（单行表单不暴露州字段）
    if (editing?.state) dto.state = editing.state;

    setErr('');
    try {
      const saved: any = editing
        ? await updateMut.mutateAsync({ id: editing.rate_id, dto })
        : await createMut.mutateAsync(dto);
      onDone(
        saved?.carrier_id ? saved : { carrier_id: dto.carrier_id },
        editing ? 'updated' : 'created',
      );
    } catch (e) {
      setErr(errMsg(e));
      notify('error', errMsg(e));
    }
  }

  const labelCls2 = 'block text-[#414755]';
  const labelStyle = { fontSize: 12.5, fontWeight: 600, marginBottom: 5 } as const;
  const inputStyle = { fontSize: 13 } as const;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: 18, padding: '28px 32px',
          width: 520, maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid rgba(193,198,215,0.5)',
        }}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <span style={{ fontSize: 17, fontWeight: 700, color: '#181C23' }}>
            {editing ? t('rates.editTitle') : t('rates.addTitle')}
          </span>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={onClose}><X size={16} /></button>
        </div>

        {err && (
          <div
            className="mb-4 flex items-center gap-1.5"
            style={{ padding: '9px 12px', borderRadius: 9, background: 'rgba(186,26,26,0.08)', border: '0.5px solid rgba(186,26,26,0.2)', fontSize: 12.5, color: '#BA1A1A' }}
          >
            <AlertTriangle size={13} />{err}
          </div>
        )}

        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          {/* 保险公司（全宽） */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className={labelCls2} style={labelStyle}>{t('rates.formCarrier')} <span className="text-[#C0392B]">*</span></label>
            <select
              className="input-glass w-full"
              style={inputStyle}
              value={form.carrier_id}
              disabled={!!editing}
              onChange={(e) => set('carrier_id', e.target.value)}
            >
              <option value="" disabled>{t('rates.formCarrierPh')}</option>
              {insurers.map((c) => (
                <option key={c.config_id ?? c.carrier_id} value={c.carrier_id}>{c.carrier_name || c.insurer_short}</option>
              ))}
            </select>
          </div>

          {/* 配置维度（分段 radio） */}
          <div>
            <label className={labelCls2} style={labelStyle}>{t('rates.formDimension')}</label>
            <div className="flex gap-2">
              {(['lob', 'product'] as const).map((d) => (
                <label
                  key={d}
                  className="flex-1 cursor-pointer text-center"
                  style={{
                    padding: '8px 12px', borderRadius: 9, fontSize: 13,
                    fontWeight: form.dimension === d ? 700 : 400,
                    background: form.dimension === d ? 'rgba(0,88,188,0.10)' : 'rgba(246,248,255,0.7)',
                    color: form.dimension === d ? '#0058BC' : '#414755',
                    border: `0.5px solid ${form.dimension === d ? '#0058BC' : 'rgba(193,198,215,0.4)'}`,
                  }}
                >
                  <input type="radio" name="rate-dimension" className="hidden" checked={form.dimension === d} onChange={() => set('dimension', d)} />
                  {d === 'lob' ? t('rates.dimLob') : t('rates.dimProduct')}
                </label>
              ))}
            </div>
          </div>

          {/* 险种 */}
          <div>
            <label className={labelCls2} style={labelStyle}>{t('rates.formLob')} <span className="text-[#C0392B]">*</span></label>
            <select className="input-glass w-full" style={inputStyle} value={form.line_of_business} onChange={(e) => set('line_of_business', e.target.value)}>
              <option value="" disabled>{t('rates.formLobPh')}</option>
              {LOB_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* 产品名称（产品维度时全宽） */}
          {form.dimension === 'product' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className={labelCls2} style={labelStyle}>{t('rates.formProduct')} <span className="text-[#C0392B]">*</span></label>
              <input className="input-glass w-full" style={inputStyle} maxLength={32} value={form.product_name} placeholder={t('rates.formProductPh')} onChange={(e) => set('product_name', e.target.value)} />
            </div>
          )}

          {/* 佣金率 */}
          <div>
            <label className={labelCls2} style={labelStyle}>{t('rates.formRate')} <span className="text-[#C0392B]">*</span></label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                className="input-glass w-full"
                style={{ ...inputStyle, paddingRight: 28, fontFamily: MONO }}
                placeholder="0.00"
                value={form.ratePct}
                onChange={(e) => set('ratePct', e.target.value)}
              />
              <span className="pointer-events-none absolute" style={{ right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#717786' }}>%</span>
            </div>
          </div>

          {/* 生效日期 */}
          <div>
            <label className={labelCls2} style={labelStyle}>{t('rates.formEffective')} <span className="text-[#C0392B]">*</span></label>
            <input type="date" className="input-glass w-full" style={inputStyle} value={form.effective_from} onChange={(e) => set('effective_from', e.target.value)} />
          </div>

          {/* 截止日期 */}
          <div>
            <label className={labelCls2} style={labelStyle}>{t('rates.formExpiry')}</label>
            <input type="date" className="input-glass w-full" style={inputStyle} title={t('rates.formExpiryPh')} value={form.effective_to} onChange={(e) => set('effective_to', e.target.value)} />
          </div>

          {/* 备注（全宽） */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className={labelCls2} style={labelStyle}>{t('rates.formRemark')}</label>
            <textarea
              className="input-glass w-full"
              style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              maxLength={512}
              placeholder={t('rates.formRemarkPh')}
              value={form.remark}
              onChange={(e) => set('remark', e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between" style={{ marginTop: 24, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.3)' }}>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>{t('rates.cancel')}</button>
          <button
            className="btn-primary inline-flex items-center gap-1.5 disabled:opacity-60"
            style={{ fontSize: 13 }}
            disabled={createMut.isPending || updateMut.isPending}
            onClick={submit}
          >
            {createMut.isPending || updateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {t('rates.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ───────────────────────────────── 批量导入 ─────────────────────────────────

function RateImportModal({
  insurers, initialCarrierId, onClose, onDone, notify,
}: {
  insurers: any[];
  initialCarrierId?: string;
  onClose: () => void;
  /** 导入成功后回调，携带本次导入使用的保司 id，供父级定位记录 */
  onDone: (carrierId?: string) => void;
  notify: (type: 'success' | 'error', message: string) => void;
}) {
  const { t } = useTranslation('finance');
  const fileRef = useRef<HTMLInputElement>(null);
  const [carrierId, setCarrierId] = useState(initialCarrierId ?? insurers[0]?.carrier_id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [precheck, setPrecheck] = useState<any | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const preMut = usePrecheckCommissionRates();
  const impMut = useImportCommissionRates();

  function downloadTemplate() {
    rowsToXlsx('commission-rate-template.xlsx', 'Rates', [{
      dimension: 'lob', line_of_business: 'Auto', product_id: '', state: '',
      rate: 0.15, effective_from: '2026-01-01', effective_to: '', remark: 'Sample row (delete before import)',
    }]);
  }

  async function pick(f: File) {
    setErr(''); setFile(f); setPrecheck(null); setResult(null);
    if (!['csv', 'xls', 'xlsx'].includes(extOf(f.name))) { setErr(t('rates.errFileExt')); setFile(null); return; }
    if (!carrierId) { setErr(t('rates.errCarrier')); setFile(null); return; }
    try {
      const { rows: raw } = await parseWorkbook(f);
      const mapped = raw.slice(0, 5000).map((r) => {
        const get = (...names: string[]) => {
          for (const n of names) {
            const hit = Object.keys(r).find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === n.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (hit !== undefined && r[hit] !== '') return r[hit];
          }
          return '';
        };
        return {
          dimension: String(get('dimension', 'dim') ?? '').trim().toLowerCase(),
          line_of_business: String(get('lineofbusiness', 'lob') ?? '').trim(),
          product_id: String(get('productid', 'product', 'productname') ?? '').trim(),
          state: String(get('state') ?? '').trim().toUpperCase(),
          rate: get('rate', 'commissionrate') === '' ? '' : Number(get('rate', 'commissionrate')),
          effective_from: String(get('effectivefrom', 'from') ?? '').slice(0, 10),
          effective_to: String(get('effectiveto', 'to') ?? '').slice(0, 10),
          remark: String(get('remark', 'note') ?? '').trim(),
        };
      }).filter((r) => r.dimension || r.line_of_business || r.product_id);
      if (!mapped.length) { setErr(t('rates.errNoRows')); setFile(null); return; }
      setRows(mapped);
      const res = await preMut.mutateAsync({ carrier_id: carrierId, rows: mapped });
      setPrecheck(res);
    } catch (e) { setErr(errMsg(e)); setFile(null); }
  }

  async function doImport() {
    setBusy(true); setErr('');
    try {
      const res = await impMut.mutateAsync({ carrier_id: carrierId, rows });
      setResult(res);
      if (res.failed_count === 0) setTimeout(() => onDone(carrierId), 1200);
    } catch (e) { setErr(errMsg(e)); notify('error', errMsg(e)); }
    finally { setBusy(false); }
  }

  function downloadReport() {
    const out = [
      ...(precheck?.errors ?? []).map((e: any) => ({ type: 'error', row: e.row, field: e.field ?? '', reason: e.message })),
      ...(precheck?.duplicates ?? []).map((e: any) => ({ type: 'duplicate', row: e.row, field: '', reason: e.reason })),
      ...(result?.failed ?? []).map((e: any) => ({ type: 'import_failed', row: e.row, field: '', reason: e.message })),
    ];
    rowsToXlsx('commission-rate-import-report.xlsx', 'Report', out);
  }

  return (
    <Modal wide title={t('rates.importTitle')} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <select className={inputCls} style={{ width: 260 }} value={carrierId} onChange={(e) => { setCarrierId(e.target.value); setFile(null); setPrecheck(null); }}>
            <option value="" disabled>{t('rates.formCarrierPh')}</option>
            {insurers.map((c) => (
              <option key={c.config_id ?? c.carrier_id} value={c.carrier_id}>{c.carrier_name || c.insurer_short}</option>
            ))}
          </select>
          <Btn size="sm" icon={<Download size={12} />} onClick={downloadTemplate}>{t('rates.downloadTpl')}</Btn>
          <span className="text-[11px] text-[#A0A5B1]">{t('rates.tplColsHint')}</span>
        </div>

        <div
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(193,198,215,0.9)] bg-[rgba(255,255,255,0.7)] p-6 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) pick(f); }}
        >
          <FileSpreadsheet size={22} className="text-[#A0A5B1]" />
          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
          <Btn size="sm" className="mt-2" disabled={!carrierId} onClick={() => fileRef.current?.click()}>
            {file ? file.name : t('rates.chooseFile')}
          </Btn>
        </div>

        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-[#C0392B]">{err}</p>}

        {precheck && (
          <div className="space-y-2 rounded-xl border border-[rgba(193,198,215,0.5)] bg-[rgba(255,255,255,0.7)] p-3 text-[12.5px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#181C23]">{t('rates.precheckTitle')}</span>
              <Badge cls="bg-[rgba(52,199,89,0.12)] text-[#1E8033]">{t('rates.pcValid', { n: precheck.valid_count })}</Badge>
              <Badge cls="bg-red-100 text-red-700">{t('rates.pcError', { n: precheck.error_count })}</Badge>
              <Badge cls="bg-amber-100 text-amber-700">{t('rates.pcDup', { n: precheck.duplicate_count })}</Badge>
              <Badge cls="bg-slate-100 text-slate-500">{t('rates.pcTotal', { n: precheck.total })}</Badge>
            </div>
            {(precheck.errors?.length > 0 || precheck.duplicates?.length > 0) && (
              <div className="max-h-44 overflow-auto rounded-lg border border-[rgba(193,198,215,0.5)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-500">
                    <tr><th className="px-2 py-1 text-left">{t('wizard.colHash')}</th><th className="px-2 py-1 text-left">{t('rates.colField')}</th><th className="px-2 py-1 text-left">{t('rates.colStatus')}</th></tr>
                  </thead>
                  <tbody>
                    {precheck.errors.slice(0, 200).map((e: any, i: number) => (
                      <tr key={`e${i}`} className="border-t border-slate-100">
                        <td className="px-2 py-1 text-slate-400">{e.row}</td>
                        <td className="px-2 py-1 text-slate-600">{e.field}</td>
                        <td className="px-2 py-1 text-red-600">{e.message}</td>
                      </tr>
                    ))}
                    {precheck.duplicates.slice(0, 200).map((e: any, i: number) => (
                      <tr key={`d${i}`} className="border-t border-slate-100">
                        <td className="px-2 py-1 text-slate-400">{e.row}</td><td className="px-2 py-1">—</td>
                        <td className="px-2 py-1 text-amber-600">{e.reason === 'already-exists' ? t('rates.dupExists') : t('rates.dupInFile')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {(precheck.error_count > 0 || precheck.duplicate_count > 0) && (
                <Btn size="sm" icon={<Download size={12} />} onClick={downloadReport}>{t('rates.downloadReport')}</Btn>
              )}
              <Btn size="sm" variant="primary" disabled={precheck.valid_count === 0 || busy} loading={busy} onClick={doImport}>
                {t('rates.confirmImportN', { n: precheck.valid_count })}
              </Btn>
            </div>
          </div>
        )}

        {result && (
          <div className={`flex items-center gap-2 rounded-xl p-4 text-[13px] ${result.failed_count === 0 ? 'bg-[rgba(52,199,89,0.1)] text-[#1E8033]' : 'bg-amber-50 text-amber-700'}`}>
            {result.failed_count === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {t('rates.importDone', { ok: result.inserted, fail: result.failed_count, n: result.total })}
            {result.failed_count > 0 && <Btn size="sm" icon={<Download size={12} />} onClick={downloadReport}>{t('rates.downloadReport')}</Btn>}
          </div>
        )}
      </div>
    </Modal>
  );
}
