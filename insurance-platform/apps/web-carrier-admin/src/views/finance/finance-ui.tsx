/**
 * V1.0.15 财务结算（批次化）共享 UI 与工具
 *
 * 账单批次列表 / 三步导入向导 / 批次详情 / 结算比例配置 共用：
 * - 浏览器内 xlsx 解析（≤50MB、≤5 万行）
 * - 浅色主题基础组件 Btn/Card/Modal/Badge/Pager/Stat（与原型 glass-card 一致）
 */
import * as XLSX from 'xlsx';
import { Loader2, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// ───────────────────────────────── 常量 ─────────────────────────────────

export const MAX_FILE_MB = 50;
export const MAX_ROWS = 50000;

export const FIELD_DEFS: Array<{ key: string; required?: boolean }> = [
  { key: 'policy_number', required: true },
  { key: 'insured_name' },
  { key: 'premium', required: true },
  { key: 'commission_rate' },
  { key: 'commission_amount', required: true },
  { key: 'effective_date' },
  { key: 'npn' },
  { key: 'product_code' },
  { key: 'channel_name' },
  { key: 'state' },
  { key: 'line_of_business' },
];

export const FIELD_SYNONYMS: Record<string, string[]> = {
  policy_number: ['policy', 'policyno', 'policynumber', 'policynumber#', 'policyid', '保单号', '保单编号', '保单号码'],
  insured_name: ['insured', 'insuredname', 'customer', 'customername', 'policyholder', '被保险人', '客户名称', '投保人'],
  premium: ['premium', 'premiumamount', 'writtenpremium', 'premiumamt', '保费', '保费金额'],
  commission_rate: ['rate', 'commissionrate', 'ratepct', 'commrate', '佣金率', '佣金比例'],
  commission_amount: ['commission', 'commissionamount', 'commissionamt', 'payable', 'commissiondue', '佣金', '佣金金额'],
  effective_date: ['effectivedate', 'effdate', 'effective', 'inceptiondate', '生效日期', '起保日期'],
  npn: ['npn', 'agentnpn', 'producernpn'],
  product_code: ['product', 'productcode', 'plancode', '产品代码', '产品编码'],
  channel_name: ['channel', 'channelname', 'agency', 'agencyname', 'agentname', 'producer', '渠道', '渠道名称'],
  state: ['state', 'statecode', '州'],
  line_of_business: ['lob', 'lineofbusiness', 'productline', '险种', '业务线'],
};

/** 美国 50 州 + DC（V1.0.15 O5：佣金率一行一州）。 */
export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME',
  'MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA',
  'RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

export const DIMENSION_LABEL: Record<string, string> = {
  lob: 'Line of Business',
  product: 'Product',
};

/** 差异处理结果（5 类）。 */
export const RESOLUTION_RESULTS: Array<{ value: string; color: string }> = [
  { value: 'carrier_bill_error', color: 'bg-red-100 text-red-700' },
  { value: 'our_calc_error', color: 'bg-orange-100 text-orange-700' },
  { value: 'rate_corrected', color: 'bg-violet-100 text-violet-700' },
  { value: 'mutual_agreed', color: 'bg-sky-100 text-sky-700' },
  { value: 'data_confirmed', color: 'bg-emerald-100 text-emerald-700' },
];

export const RECON_STATUS_CLS: Record<string, string> = {
  pending: 'bg-slate-200 text-slate-600',
  running: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export const DIFF_RES_CLS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  suspended: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  adjusted: 'bg-violet-100 text-violet-700',
  disputed: 'bg-orange-100 text-orange-700',
  closed: 'bg-slate-200 text-slate-600',
};

export const MATCH_CLS: Record<string, string> = {
  matched: 'bg-emerald-100 text-emerald-700',
  rate_diff: 'bg-violet-100 text-violet-700',
  amount_diff: 'bg-red-100 text-red-700',
  unmatched: 'bg-slate-200 text-slate-500',
};

export const LINE_STATUS_CLS: Record<string, string> = {
  imported: 'bg-sky-100 text-sky-700',
  duplicate: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

// ───────────────────────────────── 工具 ─────────────────────────────────

/** 原型 .input-glass 样式（浅玻璃底 + 灰蓝边）。 */
export const inputCls =
  'w-full rounded-lg border border-[rgba(193,198,215,0.8)] bg-[rgba(255,255,255,0.7)] px-3 py-2 text-[13px] text-[#181C23] placeholder:text-[#A0A5B1] outline-none focus:border-[#0058BC]/60 disabled:opacity-50 transition';

export const glassInputCls = inputCls;

export function normHeader(s: string) {
  return String(s ?? '').toLowerCase().replace(/[^a-z0-9一-鿿]/g, '');
}

export function autoMatch(headers: string[], field: string) {
  const syns = FIELD_SYNONYMS[field] ?? [field];
  const normed = headers.map(normHeader);
  for (const syn of syns) {
    const idx = normed.indexOf(normHeader(syn));
    if (idx >= 0) return headers[idx];
  }
  for (const syn of syns) {
    const idx = normed.findIndex((h) => h && h.includes(normHeader(syn)));
    if (idx >= 0) return headers[idx];
  }
  return '';
}

export async function parseWorkbook(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('empty workbook');
  const arr = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true, defval: '' });
  const headerIdx = arr.findIndex((r) => Array.isArray(r) && r.some((c) => String(c).trim() !== ''));
  if (headerIdx < 0) throw new Error('no header row');
  const rawHeaders = arr[headerIdx].map((h, i) => {
    const v = String(h ?? '').trim();
    return v || `col_${i + 1}`;
  });
  // 去重重名表头
  const headers = rawHeaders.map((h, i) => {
    const dup = rawHeaders.slice(0, i).filter((x) => x === h).length;
    return dup ? `${h}__${dup + 1}` : h;
  });
  const rows = arr.slice(headerIdx + 1).map((r) => {
    const o: Record<string, any> = {};
    headers.forEach((h, i) => {
      let v = Array.isArray(r) ? r[i] : '';
      if (v instanceof Date) v = v.toISOString().slice(0, 10);
      o[h] = v === null || v === undefined ? '' : v;
    });
    return o;
  });
  return { headers, rows };
}

export function downloadText(filename: string, text: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([`﻿${text}`], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function rowsToXlsx(filename: string, sheetName: string, rows: Record<string, any>[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 28) || 'Sheet1');
  XLSX.writeFile(wb, filename);
}

export function money(v: any) {
  const n = parseFloat(v);
  return Number.isFinite(n)
    ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

export function ratePct(v: any) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? `${(n * 100).toFixed(2)}%` : '—';
}

/** 带符号金额（差异额用）：+$2,876 / -$213 / $0。 */
export function moneySigned(v: any) {
  const n = parseFloat(v);
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n > 0) return `+$${abs}`;
  if (n < 0) return `-$${abs}`;
  return '$0.00';
}

export function errMsg(e: any): string {
  const data = e?.response?.data;
  if (Array.isArray(data?.message)) return data.message.join('; ');
  return data?.message || e?.message || 'Error';
}

export function extOf(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : '';
}

export function day(v: any) {
  return v ? String(v).slice(0, 10) : '—';
}

export function dt(v: any) {
  if (!v) return '—';
  const s = String(v).replace('T', ' ');
  return s.slice(0, 16);
}

// ───────────────────────────────── 组件 ─────────────────────────────────

export function Badge({
  cls, children, title, pill, dot,
}: { cls?: string; children: ReactNode; title?: string; pill?: boolean; dot?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 font-medium ${pill ? 'rounded-full px-2.5 py-[3px] text-[11px]' : 'rounded-md px-2 py-0.5 text-xs'} ${cls ?? 'bg-slate-100 text-slate-600'}`}
    >
      {dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

export function Card({ title, extra, children, className = '' }: { title?: ReactNode; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-xl p-4 ${className}`}>
      {(title || extra) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          {extra}
        </header>
      )}
      {children}
    </section>
  );
}

export function Btn({
  children, onClick, variant = 'default', size = 'md', disabled, loading, icon, type = 'button', title, className = '',
}: {
  children?: ReactNode; onClick?: () => void; variant?: 'primary' | 'default' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md'; disabled?: boolean; loading?: boolean; icon?: ReactNode; type?: 'button' | 'submit'; title?: string; className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-[#0058BC] hover:bg-[#0070EB] text-white shadow-sm',
    default: 'bg-white/80 hover:bg-white text-[#181C23] border border-[rgba(193,198,215,0.9)]',
    ghost: 'hover:bg-[rgba(0,88,188,0.08)] text-[#717786] hover:text-[#0058BC]',
    danger: 'bg-[#BA1A1A] hover:bg-[#D32F2F] text-white',
    success: 'bg-[#0058BC] hover:bg-[#0070EB] text-white',
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-40
        ${size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-[13px]'} ${styles[variant]} ${className}`}
    >
      {loading ? <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide }: { title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(24,28,35,0.35)] p-6" onClick={onClose}>
      <div
        className={`my-8 w-full ${wide ? 'max-w-5xl' : 'max-w-xl'} rounded-2xl border border-[rgba(193,198,215,0.42)] bg-[rgba(255,255,255,0.98)] shadow-[0_24px_64px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-[rgba(193,198,215,0.4)] px-5 py-3.5">
          <h2 className="text-[15px] font-bold text-[#181C23]">{title}</h2>
          <button className="rounded-md p-1 text-[#717786] hover:bg-slate-100 hover:text-[#181C23]" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** 原型右侧抽屉（版本历史 / 费率详情，宽 420px）。 */
export function Drawer({ title, onClose, children, width = 420 }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-[rgba(24,28,35,0.3)]" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 h-full overflow-y-auto bg-[rgba(255,255,255,0.98)] shadow-[-4px_0_24px_rgba(0,0,0,0.12)]"
        style={{ width, padding: '28px 24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-[17px] font-bold leading-snug text-[#181C23]">{title}</h2>
          <button className="shrink-0 rounded-md p-1 text-[#717786] hover:bg-slate-100 hover:text-[#181C23]" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export const PAGE_SIZES = [10, 20, 50, 100, 200, 500];

/**
 * 数据列表标准分页：« ‹ 页码（5 页窗）› » + 每页条数（10/20/50/100/200/500）+ 跳页。
 */
export function Pager({ page, size, total, onPage, onSize }: { page: number; size: number; total: number; onPage: (p: number) => void; onSize: (s: number) => void }) {
  const { t } = useTranslation('finance');
  const pages = Math.max(1, Math.ceil(total / size));
  const [jump, setJump] = useState('');
  // 5 页窗口
  let start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  start = Math.max(1, end - 4);
  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  const navBtn = (p: number, icon: ReactNode, disabled: boolean, label: string) => (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={() => onPage(p)}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[rgba(193,198,215,0.9)] bg-white/80 text-[#717786] transition hover:border-[#0058BC] hover:text-[#0058BC] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-[rgba(193,198,215,0.9)] disabled:hover:text-[#717786]"
    >
      {icon}
    </button>
  );

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-[#717786]">
      <div className="flex items-center gap-2">
        <span>{t('pager.total', { n: total })}</span>
        <select
          className="h-8 rounded-md border border-[rgba(193,198,215,0.9)] bg-white/80 px-2 text-[12.5px] text-[#181C23] outline-none"
          value={size}
          onChange={(e) => onSize(Number(e.target.value))}
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s} {t('pager.perPage')}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-1.5">
        {navBtn(1, <ChevronsLeft size={13} />, page <= 1, t('pager.first'))}
        {navBtn(page - 1, <ChevronLeft size={13} />, page <= 1, t('pager.prev'))}
        {nums.map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`h-7 min-w-7 rounded-md px-1.5 text-[12.5px] transition ${
              n === page
                ? 'bg-[#0058BC] font-semibold text-white'
                : 'border border-[rgba(193,198,215,0.9)] bg-white/80 text-[#555] hover:border-[#0058BC] hover:text-[#0058BC]'
            }`}
          >
            {n}
          </button>
        ))}
        {navBtn(page + 1, <ChevronRight size={13} />, page >= pages, t('pager.next'))}
        {navBtn(pages, <ChevronsRight size={13} />, page >= pages, t('pager.last'))}
        <span className="ml-1 flex items-center gap-1">
          {t('pager.goto')}
          <input
            className="h-7 w-12 rounded-md border border-[rgba(193,198,215,0.9)] bg-white/80 px-1.5 text-center text-xs text-[#181C23] outline-none focus:border-[#0058BC]"
            value={jump}
            onChange={(e) => setJump(e.target.value.replace(/[^0-9]/g, ''))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const n = Math.min(pages, Math.max(1, Number(jump)));
                if (jump) onPage(n);
                setJump('');
              }
            }}
          />
          {t('pager.pageUnit')}
        </span>
      </div>
    </div>
  );
}

export function Stat({ icon, label, value, sub, accent }: { icon?: ReactNode; label: ReactNode; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl glass p-4">
      {icon && <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 ${accent ?? ''}`}>{icon}</div>}
      <div className="min-w-0">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="truncate text-base font-semibold text-slate-800">{value}</div>
        {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="px-3 py-10 text-center text-xs text-slate-400">{text}</div>;
}
