/**
 * V1.0.18 账单导入向导 — 按 V1.6 原型：680 宽 Modal（非整页）
 *
 * Step 1 保司与文件：一个保司 + 一个账单月份（垂直全宽）+ CSV/Excel 卡片单选 + 拖拽上传（≤50MB，浏览器解析）
 * Step 2 映射与预检：紫色重复警告 + 6 个已匹配字段卡 + 修改映射/保存模板 + 前 5 行预览
 * Step 3 导入结果：成功 / 失败 / 跳过 三计数 + 失败报告下载 + 进入批次详情
 */
import { useMemo, useRef, useState } from 'react';
import {
  Upload, Check, ChevronRight, ChevronLeft, Download, Loader2,
  AlertTriangle, FileCheck2, CheckCircle2, X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  usePrecheckBill, useImportBill, useMappingTemplates, useSaveMappingTemplate, financeApi,
} from '@/services/financeService';
import {
  Btn, Badge, inputCls, FIELD_DEFS, autoMatch, parseWorkbook,
  extOf, errMsg, rowsToXlsx, MAX_FILE_MB, MAX_ROWS,
} from './finance-ui';

type Step = 1 | 2 | 3;

const MONO = { fontFamily: "'JetBrains Mono', monospace" } as const;

/** FIELD_DEFS key → finance.json wizard 列名 key */
const FIELD_LABEL_KEY: Record<string, string> = {
  policy_number: 'colPolicy',
  insured_name: 'colInsured',
  premium: 'colPremium',
  commission_rate: 'colRate',
  commission_amount: 'colCommission',
  effective_date: 'colDate',
  npn: 'colNpn',
  product_code: 'colProductCode',
  channel_name: 'colChannel',
  state: 'colState',
  line_of_business: 'colLob',
};

/** 原型 Step2 的 6 个核心映射卡（顺序即展示顺序）。 */
const CHIP_FIELDS = ['policy_number', 'premium', 'commission_amount', 'state', 'line_of_business', 'effective_date'];

export default function BillImportWizard({
  insurers,
  initialCarrierId,
  onClose,
  onImported,
}: {
  insurers: any[];
  initialCarrierId?: string;
  onClose: () => void;
  /** 导入成功：跳到批次详情 */
  onImported: (bill: any) => void;
}) {
  const { t } = useTranslation('finance');
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);

  // step 1
  const [insurerId, setInsurerId] = useState(initialCarrierId ?? insurers[0]?.carrier_id ?? '');
  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [fmt, setFmt] = useState<'csv' | 'excel'>('csv');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseErr, setParseErr] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // step 2
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [mappingEdit, setMappingEdit] = useState(false);
  const [tplId, setTplId] = useState('');
  const [tplName, setTplName] = useState('');
  const [precheck, setPrecheck] = useState<any | null>(null);
  const [prechecking, setPrechecking] = useState(false);
  const [tplSaved, setTplSaved] = useState(false);

  // step 3
  const [imported, setImported] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  const templatesQ = useMappingTemplates(insurerId ? { insurer_id: insurerId, category: 'commission' } : undefined);
  const templates: any[] = templatesQ.data?.data ?? [];
  const precheckMut = usePrecheckBill();
  const importMut = useImportBill();
  const saveTplMut = useSaveMappingTemplate();

  const insurerName = insurers.find((c) => c.carrier_id === insurerId)?.carrier_name
    ?? insurers.find((c) => c.carrier_id === insurerId)?.insurer_short ?? '';

  async function pickFile(f: File) {
    setParseErr('');
    setFile(f);
    setHeaders([]); setRawRows([]); setMapping({}); setPrecheck(null);
    const ext = extOf(f.name);
    if (!['csv', 'xls', 'xlsx'].includes(ext)) {
      setParseErr(t('wizard.errExt'));
      setFile(null);
      return;
    }
    setFmt(ext === 'csv' ? 'csv' : 'excel');
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setParseErr(t('wizard.errSize', { mb: MAX_FILE_MB }));
      setFile(null);
      return;
    }
    try {
      const { headers: hs, rows } = await parseWorkbook(f);
      if (rows.length > MAX_ROWS) { setParseErr(t('wizard.errRows', { n: MAX_ROWS.toLocaleString() })); setFile(null); return; }
      if (!rows.length) { setParseErr(t('wizard.errEmpty')); setFile(null); return; }
      const auto: Record<string, string> = {};
      FIELD_DEFS.forEach((fdef) => {
        const hit = autoMatch(hs, fdef.key);
        if (hit) auto[fdef.key] = hit;
      });
      setHeaders(hs);
      setRawRows(rows);
      setMapping(auto);
    } catch (e) {
      setParseErr(errMsg(e));
      setFile(null);
    }
  }

  const mappedRows = useMemo(
    () => rawRows.map((r) => {
      const o: Record<string, any> = {};
      FIELD_DEFS.forEach((fdef) => { o[fdef.key] = mapping[fdef.key] ? r[mapping[fdef.key]] : ''; });
      return o;
    }),
    [rawRows, mapping],
  );

  const missingRequired = FIELD_DEFS.filter((f) => f.required && !mapping[f.key]).map((f) => f.key);
  const previewRows = mappedRows.slice(0, 5);

  /** precheck.preview 携带源文件行号（1 起）→ 分类。 */
  const classByRow = useMemo(() => {
    const m = new Map<number, string>();
    for (const p of precheck?.preview ?? []) m.set(p.row, p.classification);
    return m;
  }, [precheck]);

  function buildPayload() {
    return {
      insurer_id: insurerId,
      period_month: periodMonth,
      category: 'commission',
      file_name: file!.name,
      file_format: fmt === 'csv' ? 'csv' : (extOf(file!.name) === 'csv' ? 'csv' : 'xlsx'),
      file_size: `${(file!.size / 1024).toFixed(1)} KB`,
      mapping_template_id: tplId || null,
      rows: mappedRows,
    };
  }

  async function runPrecheck() {
    if (!file || !insurerId || !periodMonth || missingRequired.length) return;
    setPrechecking(true);
    setParseErr('');
    try {
      const res = await precheckMut.mutateAsync(buildPayload());
      setPrecheck(res);
    } catch (e) {
      setParseErr(errMsg(e));
    } finally {
      setPrechecking(false);
    }
  }

  async function goStep2() {
    if (!insurerId) { setParseErr(t('wizard.errInsurer')); return; }
    if (!periodMonth) { setParseErr(t('wizard.errPeriod')); return; }
    setParseErr('');
    setStep(2);
    if (!precheck) await runPrecheck();
  }

  function changeMapping(key: string, col: string) {
    setMapping((m0) => ({ ...m0, [key]: col }));
    setPrecheck(null);
  }

  async function saveTemplate() {
    if (!tplName.trim()) return;
    try {
      await saveTplMut.mutateAsync({
        insurer_id: insurerId,
        category: 'commission',
        template_name: tplName.trim(),
        mapping_json: { columns: mapping },
      });
      setTplName('');
      setTplSaved(true);
      setTimeout(() => setTplSaved(false), 2000);
    } catch (e) {
      setParseErr(errMsg(e));
    }
  }

  async function confirmImport() {
    setImporting(true);
    setParseErr('');
    try {
      // 原件归档（失败不阻塞导入）
      let data: any;
      try {
        const archived = await financeApi.uploadFile(file!);
        data = await importMut.mutateAsync({ ...buildPayload(), source_url: archived.url || null, source_stored_name: archived.storedName || file!.name });
      } catch {
        data = await importMut.mutateAsync(buildPayload());
      }
      setImported(data);
      setStep(3);
    } catch (e) {
      setParseErr(errMsg(e));
    } finally {
      setImporting(false);
    }
  }

  function downloadErrors() {
    const result = imported ?? precheck;
    const errs: Array<Record<string, any>> = [
      ...(result?.errors ?? []).map((e: any) => ({ type: 'failed', row: e.row, policy_number: '', reason: e.reason ?? '' })),
      ...(result?.duplicates ?? []).map((e: any) => ({ type: 'duplicate', row: e.row, policy_number: e.policy_number ?? '', reason: e.reason ?? '' })),
    ];
    rowsToXlsx(`import-report-${file?.name?.replace(/\.[^.]+$/, '') ?? 'bill'}.xlsx`, 'Report', errs);
  }

  const labelCls = 'mb-1 block text-[12.5px] font-medium text-[#555]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full"
        style={{ maxWidth: 680, maxHeight: '88vh', overflowY: 'auto', background: 'rgba(246,248,255,0.98)', borderRadius: 18, padding: '28px 32px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 + 关闭 */}
        <button className="btn-ghost absolute" style={{ top: 16, right: 16, padding: 6, color: '#717786' }} onClick={onClose}>
          <X size={18} />
        </button>
        <h1 style={{ fontSize: 16, fontWeight: 800, color: '#181C23', marginBottom: 20 }}>{t('wizard.title')}</h1>

        {/* 步骤条（圆 28） */}
        <div className="flex items-center" style={{ marginBottom: 32 }}>
          {[1, 2, 3].map((n) => {
            const label = n === 1 ? t('wizard.step1') : n === 2 ? t('wizard.step2') : t('wizard.step3');
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex items-center">
                <span className="flex shrink-0 items-center justify-center rounded-full"
                  style={{
                    width: 28, height: 28, fontSize: 12, fontWeight: 700, color: '#fff',
                    background: done ? '#34C759' : active ? '#0058BC' : 'rgba(193,198,215,0.3)',
                  }}
                >
                  {done ? <Check size={14} /> : n}
                </span>
                <span className="ml-1.5 whitespace-nowrap" style={{ fontSize: 13, fontWeight: active || done ? 600 : 400, color: active ? '#0058BC' : done ? '#1E8033' : '#A0A5B1' }}>
                  {label}
                </span>
                {n < 3 && <span style={{ width: 32, height: 1.5, margin: '0 8px', background: step > n ? '#34C759' : 'rgba(193,198,215,0.5)' }} />}
              </div>
            );
          })}
        </div>

        {parseErr && (
          <p className="mb-4 rounded-lg border border-[rgba(186,26,26,0.25)] bg-[rgba(186,26,26,0.06)] px-3 py-2 text-[12.5px] text-[#BA1A1A]">
            {parseErr}
          </p>
        )}

        {/* ── Step 1 保司与文件（垂直全宽） ── */}
        {step === 1 && (
          <div className="space-y-[18px]">
            <div>
              <label className={labelCls}>{t('wizard.insurer')} <span className="text-[#BA1A1A]">*</span></label>
              <select className={`${inputCls} w-full`} value={insurerId} onChange={(e) => setInsurerId(e.target.value)}>
                <option value="" disabled>{t('wizard.insurerPh')}</option>
                {insurers.map((c) => (
                  <option key={c.config_id ?? c.carrier_id} value={c.carrier_id}>{c.carrier_name || c.insurer_short}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('wizard.period')} <span className="text-[#BA1A1A]">*</span></label>
              <input type="month" className={`${inputCls} w-full`} value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>{t('wizard.format')}</label>
              <div className="flex gap-2">
                {(['csv', 'excel'] as const).map((f0) => (
                  <label
                    key={f0}
                    className="flex flex-1 cursor-pointer items-center gap-2 px-3.5"
                    style={{
                      paddingTop: 8, paddingBottom: 8, borderRadius: 9, fontSize: 13,
                      border: fmt === f0 ? '1.5px solid #0058BC' : '1px solid rgba(193,198,215,0.8)',
                      background: fmt === f0 ? 'rgba(0,88,188,0.05)' : 'rgba(255,255,255,0.7)',
                      color: fmt === f0 ? '#0058BC' : '#555', fontWeight: fmt === f0 ? 600 : 400,
                    }}
                  >
                    <input type="radio" name="bill-fmt" className="accent-[#0058BC]" checked={fmt === f0} onChange={() => setFmt(f0)} />
                    {t(`wizard.fmt${f0 === 'csv' ? 'Csv' : 'Excel'}`)}
                  </label>
                ))}
              </div>
            </div>

            <div
              className="flex flex-col items-center justify-center text-center"
              style={{
                padding: 28, borderRadius: 12,
                border: dragOver ? '2px dashed #0058BC' : file ? '2px dashed rgba(52,199,89,0.5)' : '2px dashed rgba(193,198,215,0.9)',
                background: dragOver ? 'rgba(0,88,188,0.05)' : file ? 'rgba(52,199,89,0.05)' : 'rgba(255,255,255,0.6)',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) pickFile(f);
              }}
            >
              <Upload size={28} color={file ? '#1E8033' : '#A0A5B1'} />
              <p className="mt-3" style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>
                {t('wizard.dropTitle')}{' '}
                <button type="button" className="font-semibold text-[#0058BC] hover:underline" onClick={() => fileRef.current?.click()}>
                  {t('wizard.dropAction')}
                </button>
              </p>
              <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
              <p className="mt-2" style={{ fontSize: 12, color: '#A0A5B1' }}>{t('wizard.dropHint', { mb: MAX_FILE_MB })}</p>
            </div>

            {file && !parseErr && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl px-4 py-3 text-[13px]" style={{ background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.3)' }}>
                <FileCheck2 size={16} color="#1E8033" />
                <span className="font-semibold text-[#181C23]">{t('wizard.fileUploaded', { name: file.name })}</span>
                <span className="text-[#717786]">·</span>
                <span className="text-[#717786]">{t('wizard.fileMeta', { kb: (file.size / 1024).toFixed(1), rows: rawRows.length, cols: headers.length })}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 映射与预检 ── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* 重复行提示（紫色） */}
            {precheck && precheck.duplicate_count > 0 && (
              <div
                className="flex items-start gap-2 rounded-xl px-4 py-3 text-[12.5px]"
                style={{ background: 'rgba(175,82,222,0.07)', border: '1px solid rgba(175,82,222,0.25)', color: '#6D3FD0' }}
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{t('wizard.dupWarn', { n: precheck.duplicate_count })}</span>
              </div>
            )}

            {/* 字段映射 */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span style={{ fontSize: 13, fontWeight: 700, color: '#181C23' }}>{t('wizard.mappingTitle')}</span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className={`${inputCls} !w-44 !py-1.5 text-xs`}
                  value={tplId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTplId(id);
                    if (!id) return;
                    const tpl = templates.find((x) => x.template_id === id);
                    const cols = tpl?.mapping_json?.columns ?? {};
                    const next: Record<string, string> = {};
                    FIELD_DEFS.forEach((f) => { if (cols[f.key] && headers.includes(cols[f.key])) next[f.key] = cols[f.key]; });
                    setMapping(next);
                    setPrecheck(null);
                  }}
                >
                  <option value="">{t('wizard.noTemplate')}</option>
                  {templates.map((tpl) => <option key={tpl.template_id} value={tpl.template_id}>{tpl.template_name}</option>)}
                </select>
                <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setMappingEdit((v) => !v)}>
                  {t('wizard.editMapping')}
                </button>
                {!mappingEdit && (
                  <button className="btn-ghost" style={{ fontSize: 12.5 }} onClick={() => setMappingEdit(true)}>{t('wizard.saveAsTpl')}</button>
                )}
                <button className="btn-ghost" style={{ fontSize: 12.5 }} disabled={prechecking} onClick={runPrecheck}>
                  {prechecking ? <Loader2 size={12} className="animate-spin" /> : null} {t('wizard.recheck')}
                </button>
              </div>
            </div>

            {/* 6 个已匹配字段卡（2 列） */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {CHIP_FIELDS.map((key) => {
                const col = mapping[key];
                return (
                  <div key={key} className="flex items-center gap-2"
                    style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(246,248,255,0.9)', border: '1px solid rgba(193,198,215,0.45)' }}
                  >
                    <span className="shrink-0" style={{ minWidth: 80, fontSize: 12.5, color: '#717786' }}>
                      {t(`wizard.${FIELD_LABEL_KEY[key]}`)}
                    </span>
                    {col ? (
                      <span className="min-w-0 flex-1 truncate font-semibold text-[#0058BC]" style={{ fontSize: 12.5, ...MONO }} title={col}>{col}</span>
                    ) : (
                      <span className="flex-1" style={{ fontSize: 12.5, color: '#B06000' }}>{t('wizard.unmapped')}</span>
                    )}
                    {col
                      ? <span className="badge badge-green shrink-0" style={{ fontSize: 10 }}>{t('wizard.matched')}</span>
                      : <AlertTriangle size={13} className="shrink-0" color="#B06000" />}
                  </div>
                );
              })}
            </div>

            {/* 修改映射：全字段下拉网格 + 保存模板 */}
            {mappingEdit && (
              <div className="space-y-3 rounded-xl pt-3" style={{ borderTop: '0.5px solid rgba(193,198,215,0.5)' }}>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FIELD_DEFS.map((fdef) => (
                    <label key={fdef.key} className="flex items-center gap-2 text-xs text-[#717786]">
                      <span className="w-20 shrink-0 text-right">
                        {t(`wizard.${FIELD_LABEL_KEY[fdef.key]}`)}{fdef.required ? <span className="text-[#BA1A1A]"> *</span> : null}
                      </span>
                      <select
                        className={`${inputCls} !py-1 text-xs`}
                        value={mapping[fdef.key] ?? ''}
                        onChange={(e) => changeMapping(fdef.key, e.target.value)}
                      >
                        <option value="">{t('wizard.unmapped')}</option>
                        {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                {missingRequired.length > 0 && (
                  <p className="text-xs text-[#B06000]">
                    {missingRequired.map((k) => t(`wizard.${FIELD_LABEL_KEY[k]}`)).join(t('wizard.listSep'))}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className={`${inputCls} !py-1.5 w-56 text-xs`}
                    placeholder={t('wizard.tplNamePh')}
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                  />
                  <Btn size="sm" loading={saveTplMut.isPending} disabled={!tplName.trim()} onClick={saveTemplate}>{t('wizard.saveTpl')}</Btn>
                  {tplSaved && <Badge cls="bg-[rgba(52,199,89,0.12)] text-[#1E8033]">{t('wizard.tplSaved')}</Badge>}
                </div>
              </div>
            )}

            {/* 预检计数 */}
            {precheck && (
              <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
                <Badge cls="bg-[rgba(52,199,89,0.12)] text-[#1E8033]">{t('rates.pcValid', { n: precheck.success_count })}</Badge>
                <Badge cls="bg-[rgba(175,82,222,0.1)] text-[#6D3FD0]">{t('rates.pcDup', { n: precheck.duplicate_count })}</Badge>
                <Badge cls="bg-[rgba(186,26,26,0.1)] text-[#BA1A1A]">{t('rates.pcError', { n: precheck.failed_count })}</Badge>
                <span className="text-[#A0A5B1]">· {t('wizard.rowCount', { n: rawRows.length })}</span>
              </div>
            )}

            {/* 数据预览（前 5 行） */}
            <div>
              <div className="mb-1.5 text-[12.5px] font-medium text-[#717786]">
                {t('wizard.previewTitle', { n: 5 })}
              </div>
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(193,198,215,0.5)' }}>
                <table className="w-full min-w-[640px] text-[12px]">
                  <thead>
                    <tr style={{ background: 'rgba(246,248,255,0.9)', color: '#717786' }}>
                      {['colHash', 'colPolicy', 'colInsured', 'colState', 'colPremium', 'colCommission', 'colStatus'].map((k) => (
                        <th key={k} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{t(`wizard.${k}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => {
                      const cls = classByRow.get(i + 1) ?? 'valid';
                      const isDup = cls === 'duplicate';
                      const isFail = cls === 'failed';
                      return (
                        <tr key={i}
                          style={{
                            borderTop: '0.5px solid rgba(193,198,215,0.25)',
                            background: isDup ? 'rgba(175,82,222,0.06)' : isFail ? 'rgba(255,59,48,0.05)' : undefined,
                          }}
                        >
                          <td className="px-3 py-2 text-[#A0A5B1]" style={MONO}>{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-[#181C23]">{String(r.policy_number || '—')}</td>
                          <td className="px-3 py-2 text-[#555]">{String(r.insured_name || '—')}</td>
                          <td className="px-3 py-2 text-[#555]" style={MONO}>{String(r.state || '—')}</td>
                          <td className="px-3 py-2 text-left text-[#181C23]" style={MONO}>
                            {r.premium === '' || r.premium == null ? '—' : Number(r.premium).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2 text-left text-[#181C23]" style={MONO}>
                            {r.commission_amount === '' || r.commission_amount == null ? '—' : Number(r.commission_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-3 py-2">
                            {isFail
                              ? <Badge cls="bg-[rgba(186,26,26,0.1)] text-[#BA1A1A]">{t('wizard.rowFail')}</Badge>
                              : isDup
                                ? <Badge cls="bg-[rgba(175,82,222,0.1)] text-[#6D3FD0]">{t('wizard.rowDup')}</Badge>
                                : <Badge cls="bg-[rgba(52,199,89,0.12)] text-[#1E8033]">{t('wizard.rowOk')}</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11.5px] text-[#A0A5B1]">{t('wizard.dupRuleNote')}</p>
            </div>
          </div>
        )}

        {/* ── Step 3 导入结果 ── */}
        {step === 3 && imported && (
          <div className="flex flex-col items-center">
            <CheckCircle2 size={52} color="#34C759" />
            <p className="mt-3" style={{ fontSize: 18, fontWeight: 700, color: '#181C23' }}>{t('wizard.done')}</p>
            <p className="mt-1 text-[13px] text-[#717786]">
              {t('wizard.batchCreated', { no: imported.batch_no })} · {insurerName} · {periodMonth}
            </p>

            <div className="mt-5 grid w-full grid-cols-3 gap-3">
              {[
                { n: imported.success_count, label: t('wizard.successCount'), bg: 'rgba(52,199,89,0.08)', color: '#1E8033' },
                { n: imported.failed_count, label: t('wizard.failedCount'), bg: 'rgba(255,59,48,0.06)', color: '#BA1A1A' },
                { n: imported.duplicate_count, label: t('wizard.skippedCount'), bg: 'rgba(175,82,222,0.08)', color: '#7B3FCA' },
              ].map((s) => (
                <div key={s.label} className="text-center" style={{ padding: 14, borderRadius: 12, background: s.bg }}>
                  <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: s.color, ...MONO }}>{s.n}</div>
                  <div className="mt-1" style={{ fontSize: 12, color: '#717786' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {(imported.errors?.length > 0 || imported.duplicates?.length > 0) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <AlertTriangle size={14} color="#B06000" />
                <Btn size="sm" icon={<Download size={12} />} onClick={downloadErrors}>{t('wizard.downloadFailReport')}</Btn>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {step < 3 && (
          <div className="flex items-center justify-between" style={{ marginTop: 28, paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.5)' }}>
            {step === 2 ? (
              <button className="btn-ghost" style={{ fontSize: 13 }} onClick={() => setStep(1)}>
                <ChevronLeft size={14} /> {t('wizard.prev')}
              </button>
            ) : <span />}
            {step === 1 && (
              <button
                className="btn-primary ml-auto"
                disabled={!file || !insurerId || !periodMonth || !headers.length}
                onClick={goStep2}
              >
                {t('wizard.next')} <ChevronRight size={14} />
              </button>
            )}
            {step === 2 && (
              <button
                className="btn-primary"
                disabled={missingRequired.length > 0 || !precheck || precheck.success_count === 0 || prechecking || importing}
                onClick={confirmImport}
              >
                {importing
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Check size={14} />}
                {importing ? t('wizard.importing') : t('wizard.confirmImport')}
              </button>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="mt-6 flex justify-center" style={{ paddingTop: 18, borderTop: '0.5px solid rgba(193,198,215,0.5)' }}>
            <button className="btn-primary" onClick={() => onImported(imported)}>
              {t('wizard.viewBatch')} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
