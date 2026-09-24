import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download, Upload, CheckCircle, XCircle, AlertTriangle, ArrowRight,
  FileText, RotateCcw, Eye, ChevronRight, X, Loader2,
} from 'lucide-react';
import type { ViewId } from '@/App';
import { useTranslation } from 'react-i18next';
import { useGetInsurers, useBatchImportInsurers } from '@/services/insurerService';
import type { CreateInsurerDto, InsurerBatchImportResult } from '@/lib/user-api-client';

interface Props {
  navigateTo: (view: ViewId, params?: any) => void;
}

type Step = 'template' | 'upload' | 'preview' | 'validate' | 'confirm' | 'result';
type FieldKey =
  | 'fullName' | 'shortName' | 'naicCode' | 'companyType'
  | 'state' | 'region' | 'amBestRating' | 'foundedYear';

const STEPS: { id: Step; label: string }[] = [
  { id: 'template', label: 'import.steps.template' },
  { id: 'upload', label: 'import.steps.upload' },
  { id: 'preview', label: 'import.steps.preview' },
  { id: 'validate', label: 'import.steps.validate' },
  { id: 'confirm', label: 'import.steps.confirm' },
  { id: 'result', label: 'import.steps.result' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_CAP = 100;
const CURRENT_YEAR = new Date().getFullYear();

const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'West', 'National'];
const RATINGS = ['A++', 'A+', 'A', 'A-', 'B++', 'B+', 'B', 'B-', 'C++', 'C+', 'C', 'C-', 'D', 'E', 'F'];

interface FieldDef {
  key: FieldKey;
  labelKey: string;
  required: boolean;
  /** Normalized header aliases (lower-case, separators stripped), zh + en */
  aliases: string[];
}

const FIELD_DEFS: FieldDef[] = [
  { key: 'fullName', labelKey: 'import.fieldMap.fullName', required: true, aliases: ['公司全称', '公司名称', '全称', 'fullcompanyname', 'companyname', 'companyfullname', 'carriername', 'name'] },
  { key: 'shortName', labelKey: 'import.fieldMap.shortName', required: true, aliases: ['公司简称', '简称', 'shortname', 'shortcompanyname', 'carriershortname'] },
  { key: 'naicCode', labelKey: 'import.fieldMap.naicCode', required: true, aliases: ['naic编码', 'naiccode', 'naic'] },
  { key: 'companyType', labelKey: 'import.fieldMap.companyType', required: true, aliases: ['公司类型', '类型', 'companytype', 'type'] },
  { key: 'state', labelKey: 'import.fieldMap.state', required: true, aliases: ['总部州', '总部所在州', '州', 'hqstate', 'headquarterstate', 'state'] },
  { key: 'region', labelKey: 'import.fieldMap.region', required: true, aliases: ['大区', '区域', 'region'] },
  { key: 'amBestRating', labelKey: 'import.fieldMap.amBestRating', required: false, aliases: ['ambest评级', '评级', 'ambestrating', 'bestrating', 'ambest', 'rating'] },
  { key: 'foundedYear', labelKey: 'import.fieldMap.foundedYear', required: false, aliases: ['成立年份', '成立年', 'foundedyear', 'establishedyear', 'founded', 'year'] },
];

const EMPTY_MAPPING: Record<FieldKey, number | null> = {
  fullName: null, shortName: null, naicCode: null, companyType: null,
  state: null, region: null, amBestRating: null, foundedYear: null,
};

/** Five all-valid sample rows shipped in the standard template */
const SAMPLE_ROWS: Record<FieldKey, string>[] = [
  { fullName: 'Markel Specialty Insurance', shortName: 'Markel Specialty', naicCode: '38971', companyType: 'Non-Admitted', state: 'VA', region: 'Southeast', amBestRating: 'A', foundedYear: '1930' },
  { fullName: 'Hanover Insurance Group', shortName: 'Hanover', naicCode: '22292', companyType: 'Admitted', state: 'MA', region: 'Northeast', amBestRating: 'A', foundedYear: '1852' },
  { fullName: 'RLI Corp', shortName: 'RLI', naicCode: '13056', companyType: 'Admitted', state: 'IL', region: 'Midwest', amBestRating: 'A+', foundedYear: '1965' },
  { fullName: 'Employers Holdings Inc', shortName: 'Employers', naicCode: '21458', companyType: 'Admitted', state: 'NV', region: 'West', amBestRating: 'A-', foundedYear: '2000' },
  { fullName: 'Grinnell Mutual Insurance', shortName: 'Grinnell Mutual', naicCode: '14230', companyType: 'Admitted', state: 'IA', region: 'Midwest', amBestRating: 'A', foundedYear: '1909' },
];

interface RowError {
  field: FieldKey | null;
  reasonKey: string;
  params?: Record<string, string | number>;
}

interface ParsedRow {
  /** Spreadsheet row number (header is row 1, first data row is 2) */
  row: number;
  raw: Record<FieldKey, string>;
  norm: Record<FieldKey, string>;
  errors: RowError[];
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9一-龥]/g, '').trim();
}

function autoMapHeaders(headers: string[]): Record<FieldKey, number | null> {
  const normalized = headers.map(normalizeHeader);
  const used = new Set<number>();
  const result = { ...EMPTY_MAPPING };
  FIELD_DEFS.forEach((field) => {
    const idx = normalized.findIndex((h, i) => !used.has(i) && field.aliases.includes(h));
    if (idx >= 0) {
      result[field.key] = idx;
      used.add(idx);
    }
  });
  return result;
}

function normalizeType(value: string): string | null {
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  if (v === 'admitted') return 'Admitted';
  if (v === 'non admitted') return 'Non-Admitted';
  return null;
}

function validateRows(
  dataRows: string[][],
  mapping: Record<FieldKey, number | null>,
  existingNaic: Set<string>,
): ParsedRow[] {
  const seenNaic = new Map<string, number>();

  return dataRows.map((cells, i) => {
    const row = i + 2;
    const raw = {} as Record<FieldKey, string>;
    const norm = {} as Record<FieldKey, string>;

    FIELD_DEFS.forEach((field) => {
      const idx = mapping[field.key];
      const v = idx != null && cells[idx] != null ? String(cells[idx]) : '';
      raw[field.key] = v.trim();
      norm[field.key] = v.trim();
    });

    const errors: RowError[] = [];

    if (!norm.fullName) errors.push({ field: 'fullName', reasonKey: 'import.errors.nameRequired' });
    else if (norm.fullName.length > 128) errors.push({ field: 'fullName', reasonKey: 'import.errors.nameTooLong', params: { n: 128 } });

    if (!norm.shortName) errors.push({ field: 'shortName', reasonKey: 'import.errors.shortNameRequired' });
    else if (norm.shortName.length > 64) errors.push({ field: 'shortName', reasonKey: 'import.errors.shortNameTooLong', params: { n: 64 } });

    let naic = norm.naicCode.replace(/\s+/g, '').replace(/\.0+$/, ''); // tolerate Excel numeric "38971.0"
    norm.naicCode = naic;
    if (!naic) {
      errors.push({ field: 'naicCode', reasonKey: 'import.errors.naicRequired' });
    } else if (!/^\d{5}$/.test(naic)) {
      errors.push({ field: 'naicCode', reasonKey: 'import.errors.naicFormat' });
    } else {
      const dupRow = seenNaic.get(naic);
      if (dupRow != null) {
        errors.push({ field: 'naicCode', reasonKey: 'import.errors.duplicateInFile', params: { row: dupRow } });
      } else if (existingNaic.has(naic)) {
        errors.push({ field: 'naicCode', reasonKey: 'import.errors.duplicateInDb', params: { code: naic } });
      } else {
        seenNaic.set(naic, row);
      }
    }

    const typeNorm = normalizeType(norm.companyType);
    if (!norm.companyType) errors.push({ field: 'companyType', reasonKey: 'import.errors.typeRequired' });
    else if (!typeNorm) errors.push({ field: 'companyType', reasonKey: 'import.errors.typeInvalid' });
    else norm.companyType = typeNorm;

    const stateUp = norm.state.toUpperCase();
    if (!norm.state) errors.push({ field: 'state', reasonKey: 'import.errors.stateRequired' });
    else if (!/^[A-Z]{2}$/.test(stateUp)) errors.push({ field: 'state', reasonKey: 'import.errors.stateInvalid' });
    else norm.state = stateUp;

    const regionNorm = REGIONS.find((r) => r.toLowerCase() === norm.region.trim().toLowerCase());
    if (!norm.region) errors.push({ field: 'region', reasonKey: 'import.errors.regionRequired' });
    else if (!regionNorm) errors.push({ field: 'region', reasonKey: 'import.errors.regionInvalid' });
    else norm.region = regionNorm;

    if (norm.amBestRating) {
      const rating = norm.amBestRating.toUpperCase().replace(/\s+/g, '');
      if (!RATINGS.includes(rating)) errors.push({ field: 'amBestRating', reasonKey: 'import.errors.ratingInvalid' });
      else norm.amBestRating = rating;
    }

    if (norm.foundedYear) {
      const y = norm.foundedYear.trim();
      if (!/^\d{4}$/.test(y) || Number(y) < 1800 || Number(y) > CURRENT_YEAR) {
        errors.push({ field: 'foundedYear', reasonKey: 'import.errors.yearInvalid', params: { min: 1800, max: CURRENT_YEAR } });
      } else {
        norm.foundedYear = y;
      }
    }

    return { row, raw, norm, errors };
  });
}

function toDto(r: ParsedRow): CreateInsurerDto {
  return {
    naic_code: r.norm.naicCode,
    carrier_name: r.norm.fullName,
    carrier_name_short: r.norm.shortName || undefined,
    carrier_type: r.norm.companyType || undefined,
    state: r.norm.state || undefined,
    region: r.norm.region || undefined,
    am_best_rating: r.norm.amBestRating || undefined,
    founded_year: r.norm.foundedYear ? Number(r.norm.foundedYear) : undefined,
    status: 'active',
  };
}

export default function InsurerImport({ navigateTo }: Props) {
  const { t, i18n } = useTranslation('insurer');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useBatchImportInsurers();

  // Existing carriers for server-side duplicate pre-check (best effort: list cache / mock fallback)
  const { data: existingData } = useGetInsurers({ page: 1, size: 1000 });

  const [step, setStep] = useState<Step>('template');
  const [maxStep, setMaxStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, number | null>>({ ...EMPTY_MAPPING });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<InsurerBatchImportResult | null>(null);

  const existingNaic = useMemo(
    () => new Set((existingData?.data ?? []).map((r) => r.naic_code)),
    [existingData],
  );

  const parsedRows = useMemo(
    () => validateRows(dataRows, mapping, existingNaic),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataRows, mapping, existingNaic, i18n.language],
  );

  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);
  const previewRows = parsedRows.slice(0, PREVIEW_CAP);

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  function gotoStep(next: Step) {
    const idx = STEPS.findIndex((s) => s.id === next);
    setStep(next);
    setMaxStep((prev) => Math.max(prev, idx));
  }

  function clearFile() {
    setFileMeta(null);
    setParseError(null);
    setHeaders([]);
    setDataRows([]);
    setMapping({ ...EMPTY_MAPPING });
    setResult(null);
    setSubmitError(null);
    setStep('upload');
    setMaxStep(1);
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return t('import.upload.sizeKb', { n: Math.max(1, Math.round(bytes / 1024)) });
    return t('import.upload.sizeMb', { n: (bytes / (1024 * 1024)).toFixed(1) });
  }

  async function processFile(file: File) {
    setParseError(null);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setParseError(t('import.upload.invalidType'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setParseError(t('import.upload.tooLarge'));
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error('empty workbook');
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], {
        header: 1, raw: false, defval: '',
      }) as unknown[][];

      const isEmptyRow = (r: unknown[]) => r.every((c) => String(c ?? '').trim() === '');
      const headerIdx = matrix.findIndex((r) => !isEmptyRow(r));
      if (headerIdx === -1) {
        setParseError(t('import.upload.emptyFile'));
        return;
      }

      const hdrs = matrix[headerIdx].map((c) => String(c ?? '').trim());
      const rows = matrix.slice(headerIdx + 1)
        .filter((r) => !isEmptyRow(r))
        .map((r) => hdrs.map((_, ci) => String(r[ci] ?? '').trim()));

      const nextMapping = autoMapHeaders(hdrs);
      if (nextMapping.fullName == null || nextMapping.naicCode == null) {
        setParseError(t('import.upload.missingColumns'));
        return;
      }
      if (rows.length === 0) {
        setParseError(t('import.upload.emptyFile'));
        return;
      }

      setHeaders(hdrs);
      setDataRows(rows);
      setMapping(nextMapping);
      setFileMeta({ name: file.name, size: file.size });
      setResult(null);
      setSubmitError(null);
      gotoStep('preview');
    } catch {
      setParseError(t('import.upload.parseFailed'));
    }
  }

  function downloadTemplate(withSamples: boolean) {
    const headerRow = FIELD_DEFS.map((f) => t(f.labelKey));
    const aoa: (string | number)[][] = [headerRow];
    if (withSamples) {
      SAMPLE_ROWS.forEach((sample) => aoa.push(FIELD_DEFS.map((f) => sample[f.key])));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = headerRow.map((h) => ({ wch: Math.max(18, h.length + 4) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Insurers');
    XLSX.writeFile(wb, withSamples ? 'insurer_import_template_standard.xlsx' : 'insurer_import_template_blank.xlsx');
  }

  function fieldLabelKey(field: FieldKey): string {
    return FIELD_DEFS.find((f) => f.key === field)?.labelKey ?? '';
  }

  function serverFieldLabel(code: string): string {
    if (code === 'naic_code') return t('import.fieldMap.naicCode');
    if (code === 'carrier_name') return t('import.fieldMap.fullName');
    if (code === 'carrier_name_short') return t('import.fieldMap.shortName');
    return code;
  }

  function downloadClientErrorReport() {
    const aoa: (string | number)[][] = [[
      t('import.preview.colRow'), t('import.fieldMap.fullName'), t('import.fieldMap.naicCode'),
      t('import.errorReport.field'), t('import.errorReport.reason'),
    ]];
    invalidRows.forEach((r) => {
      r.errors.forEach((e) => {
        aoa.push([
          r.row,
          r.raw.fullName,
          r.raw.naicCode,
          e.field ? t(fieldLabelKey(e.field)) : '',
          t(e.reasonKey, e.params),
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 48 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'insurer_import_errors.xlsx');
  }

  function downloadServerErrorReport() {
    if (!result || result.errors.length === 0) return;
    const aoa: (string | number)[][] = [[
      t('import.preview.colRow'), t('import.fieldMap.fullName'), t('import.fieldMap.naicCode'),
      t('import.errorReport.field'), t('import.errorReport.reason'),
    ]];
    result.errors.forEach((e) => {
      aoa.push([e.row, '', '', e.field ? serverFieldLabel(e.field) : '', e.reason]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 8 }, { wch: 32 }, { wch: 12 }, { wch: 18 }, { wch: 48 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Errors');
    XLSX.writeFile(wb, 'insurer_import_errors.xlsx');
  }

  function handleSubmit() {
    setSubmitError(null);
    const rows = validRows.map(toDto);
    importMutation.mutate({ rows }, {
      onSuccess: (res) => {
        setResult(res);
        gotoStep('result');
      },
      onError: () => setSubmitError(t('import.confirm.submitFailed')),
    });
  }

  const fieldDescriptions = [
    t('import.templateFields.fullName'), t('import.templateFields.naicCode'),
    t('import.templateFields.shortName'), t('import.templateFields.companyType'),
    t('import.templateFields.state'), t('import.templateFields.region'),
    t('import.templateFields.amBestRating'), t('import.templateFields.foundedYear'),
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#181C23' }}>{t('import.title')}</h1>
          <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>{t('import.subtitle')}</p>
        </div>
        <button className="btn-ghost" onClick={() => navigateTo('insurer-list')}>
          {t('import.cancel')}
        </button>
      </div>

      {/* Step indicator */}
      <div className="card flex items-center justify-between" style={{ padding: '16px 24px', marginBottom: 20 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: i <= maxStep ? 'pointer' : 'default' }}
              onClick={() => { if (i <= maxStep) setStep(s.id); }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < stepIdx ? '#34C759' : i === stepIdx ? '#0058BC' : 'rgba(193,198,215,0.3)',
                fontSize: 12, fontWeight: 700,
                color: i <= stepIdx ? '#fff' : '#717786',
              }}>
                {i < stepIdx ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span style={{ fontSize: 12.5, fontWeight: i === stepIdx ? 600 : 400, color: i === stepIdx ? '#0058BC' : i < stepIdx ? '#1a7a2e' : '#717786', whiteSpace: 'nowrap' }}>
                {t(s.label)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? '#34C759' : 'rgba(193,198,215,0.4)', margin: '0 12px' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="card" style={{ padding: '32px 36px', minHeight: 400 }}>

        {/* Step 1: Download template */}
        {step === 'template' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <FileText size={32} style={{ color: '#0058BC' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t('import.template.heading')}</h2>
            <p style={{ fontSize: 14, color: '#717786', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.7 }}>
              {t('import.template.desc')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 520, margin: '0 auto 32px' }}>
              {[
                { key: 'standard', title: t('import.template.standardTitle'), desc: t('import.template.standardDesc'), badge: t('import.template.standardBadge'), badgeCls: 'badge-blue', withSamples: true },
                { key: 'blank', title: t('import.template.blankTitle'), desc: t('import.template.blankDesc'), badge: t('import.template.blankBadge'), badgeCls: 'badge-gray', withSamples: false },
              ].map(tpl => (
                <div key={tpl.key} style={{ background: 'rgba(241,243,254,0.7)', border: '0.5px solid rgba(193,198,215,0.5)', borderRadius: 14, padding: '18px 20px', textAlign: 'left' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#181C23' }}>{tpl.title}</span>
                    <span className={`badge ${tpl.badgeCls}`} style={{ fontSize: 10 }}>{tpl.badge}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#717786', marginBottom: 12 }}>{tpl.desc}</p>
                  <button className="btn-secondary" style={{ fontSize: 12.5, width: '100%', justifyContent: 'center' }}
                    onClick={() => downloadTemplate(tpl.withSamples)}>
                    <Download size={13} />{t('import.template.downloadExcel')}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(0,88,188,0.05)', border: '0.5px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '14px 20px', maxWidth: 520, margin: '0 auto 28px', textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0058BC', marginBottom: 8 }}>{t('import.template.fieldsTitle')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {fieldDescriptions.map(f => (
                  <div key={f} style={{ fontSize: 12, color: '#414755', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: f.includes('*') ? '#BA1A1A' : '#C1C6D7' }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ fontSize: 14, padding: '11px 32px' }} onClick={() => gotoStep('upload')}>
              {t('import.template.continue')} <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === 'upload' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('import.upload.heading')}</h2>
            <p style={{ fontSize: 13.5, color: '#717786', marginBottom: 28 }}>{t('import.upload.desc')}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void processFile(f);
                e.target.value = '';
              }}
            />

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void processFile(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#0058BC' : 'rgba(0,88,188,0.25)'}`,
                borderRadius: 18,
                padding: '52px 24px',
                background: dragging ? 'rgba(0,88,188,0.05)' : 'rgba(241,243,254,0.5)',
                cursor: 'pointer',
                maxWidth: 500,
                margin: '0 auto 24px',
                transition: 'border-color 120ms, background 120ms',
              }}
            >
              <Upload size={36} style={{ color: dragging ? '#0058BC' : '#C1C6D7', marginBottom: 14 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#181C23', marginBottom: 6 }}>{t('import.upload.dragHint')}</div>
              <div style={{ fontSize: 12.5, color: '#717786' }}>{t('import.upload.formats')}</div>
            </div>

            {parseError && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(186,26,26,0.06)', border: '0.5px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, maxWidth: 500 }}>
                <AlertTriangle size={16} style={{ color: '#BA1A1A', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#BA1A1A', textAlign: 'left' }}>{parseError}</span>
              </div>
            )}

            {fileMeta && !parseError && (
              <div className="flex items-center justify-center gap-3 mb-5">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(52,199,89,0.08)', border: '0.5px solid rgba(52,199,89,0.3)', borderRadius: 10, padding: '10px 16px' }}>
                  <CheckCircle size={16} style={{ color: '#34C759' }} />
                  <span style={{ fontSize: 13.5, color: '#181C23', fontWeight: 500 }}>{fileMeta.name}</span>
                  <span style={{ fontSize: 12, color: '#717786' }}>{formatSize(fileMeta.size)}</span>
                  <button
                    onClick={clearFile}
                    title={t('import.upload.remove')}
                    style={{ display: 'inline-flex', alignItems: 'center', color: '#717786', padding: 2, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <button className="btn-secondary" style={{ fontSize: 12.5 }} onClick={() => fileInputRef.current?.click()}>
                  <RotateCcw size={13} />{t('import.upload.reselect')}
                </button>
              </div>
            )}

            {fileMeta && (
              <div>
                <button className="btn-primary" style={{ fontSize: 13.5, padding: '10px 26px' }} onClick={() => gotoStep('preview')}>
                  {t('import.upload.continue')} <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 'preview' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#181C23' }}>{t('import.preview.heading')}</h2>
                <p style={{ fontSize: 13, color: '#717786', marginTop: 2 }}>
                  {t('import.preview.parsed', { n: parsedRows.length })}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="badge badge-gray" style={{ fontSize: 12 }}>{t('import.preview.totalRows', { n: parsedRows.length })}</span>
              </div>
            </div>

            {/* Field mapping */}
            <div style={{ background: 'rgba(0,88,188,0.04)', border: '0.5px solid rgba(0,88,188,0.15)', borderRadius: 12, padding: '14px 18px', marginBottom: 18 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0058BC', marginBottom: 10 }}>{t('import.preview.mappingTitle')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {FIELD_DEFS.map((field) => {
                  const colIdx = mapping[field.key];
                  const matched = colIdx != null;
                  return (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '4px 0' }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: matched ? 'rgba(52,199,89,0.12)' : 'rgba(255,204,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {matched ? <CheckCircle size={10} style={{ color: '#34C759' }} /> : <AlertTriangle size={10} style={{ color: '#FFCC00' }} />}
                      </div>
                      <span style={{ color: '#181C23', fontWeight: 500, minWidth: 92 }}>{t(field.labelKey)}</span>
                      <ChevronRight size={10} style={{ color: '#C1C6D7', flexShrink: 0 }} />
                      <select
                        className="input-glass"
                        style={{ fontSize: 11, padding: '2px 6px', height: 24, flex: 1, maxWidth: 200 }}
                        value={matched ? String(colIdx) : ''}
                        onChange={(e) => setMapping((prev) => ({ ...prev, [field.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                      >
                        <option value="">{matched ? headers[colIdx!] : t('import.preview.ignore')}</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>{h || `${t('import.preview.colRow')} ${i + 1}`}</option>
                        ))}
                      </select>
                      {!matched && field.required && (
                        <span style={{ fontSize: 10.5, color: '#B97700' }}>{t('import.preview.unmapped')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data table preview */}
            <div style={{ overflowX: 'auto', borderRadius: 12, border: '0.5px solid rgba(193,198,215,0.4)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('import.preview.colRow')}</th>
                    <th>{t('import.preview.colName')}</th>
                    <th>{t('import.preview.colShortName')}</th>
                    <th>{t('import.preview.colNaic')}</th>
                    <th>{t('import.preview.colType')}</th>
                    <th>{t('import.preview.colState')}</th>
                    <th>{t('import.preview.colRating')}</th>
                    <th>{t('import.preview.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map(r => {
                    const firstError = r.errors[0];
                    return (
                      <tr key={r.row} style={{ background: r.errors.length > 0 ? 'rgba(186,26,26,0.04)' : undefined }}>
                        <td className="font-data" style={{ color: '#717786', fontSize: 12 }}>{r.row}</td>
                        <td style={{ fontWeight: 500 }}>{r.raw.fullName || '—'}</td>
                        <td>{r.raw.shortName || '—'}</td>
                        <td className="font-data" style={{ fontSize: 12, color: r.norm.naicCode ? '#181C23' : '#BA1A1A' }}>{r.raw.naicCode || '—'}</td>
                        <td>
                          {r.norm.companyType === 'Admitted'
                            ? <span className="badge badge-blue" style={{ fontSize: 11 }}>Admitted</span>
                            : r.norm.companyType === 'Non-Admitted'
                              ? <span className="badge badge-orange" style={{ fontSize: 11 }}>Non-Adm.</span>
                              : <span>—</span>}
                        </td>
                        <td className="font-data" style={{ fontSize: 12 }}>{r.raw.state || '—'}</td>
                        <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: r.norm.amBestRating ? '#0058BC' : '#717786' }}>{r.raw.amBestRating || '—'}</td>
                        <td>
                          {r.errors.length === 0
                            ? <span className="flex items-center gap-1"><span className="orb orb-green" /><span style={{ fontSize: 12, color: '#1a7a2e' }}>{t('import.preview.ok')}</span></span>
                            : (
                              <span className="flex items-center gap-1" title={r.errors.map(e => t(e.reasonKey, e.params)).join('; ')}>
                                <span className="orb orb-red" />
                                <span style={{ fontSize: 12, color: '#BA1A1A' }}>{t(firstError.reasonKey, firstError.params)}</span>
                              </span>
                            )
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {parsedRows.length > PREVIEW_CAP && (
              <p style={{ fontSize: 12, color: '#717786', marginTop: 8 }}>
                {t('import.preview.showingFirst', { n: PREVIEW_CAP, total: parsedRows.length })}
              </p>
            )}
            <div className="flex justify-end mt-6">
              <button className="btn-primary" onClick={() => gotoStep('validate')} style={{ fontSize: 13 }}>{t('import.preview.toValidate')} <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {/* Step 4: Validate */}
        {step === 'validate' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#181C23', marginBottom: 20 }}>{t('import.validate.heading')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: t('import.validate.passed'), value: validRows.length, color: '#1a7a2e', bg: 'rgba(52,199,89,0.08)', icon: <CheckCircle size={20} /> },
                { label: t('import.validate.failed'), value: invalidRows.length, color: '#BA1A1A', bg: 'rgba(186,26,26,0.08)', icon: <XCircle size={20} /> },
                { label: t('import.validate.total'), value: parsedRows.length, color: '#0058BC', bg: 'rgba(0,88,188,0.08)', icon: <FileText size={20} /> },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ color: k.color }}>{k.icon}</div>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                    <div style={{ fontSize: 13, color: k.color }}>{k.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {invalidRows.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#BA1A1A', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={14} />{t('import.validate.errorDetails')}
                </div>
                {invalidRows.map(r => (
                  <div key={r.row} style={{ padding: '10px 14px', background: 'rgba(186,26,26,0.05)', border: '0.5px solid rgba(186,26,26,0.15)', borderRadius: 10, marginBottom: 8 }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: r.errors.length > 1 ? 4 : 0 }}>
                      <span className="font-data" style={{ fontSize: 12, color: '#717786', flexShrink: 0 }}>{t('import.validate.row', { n: r.row })}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#181C23' }}>{r.raw.fullName || '—'}</span>
                    </div>
                    {r.errors.map((e, k) => (
                      <div key={k} className="flex items-start gap-8px" style={{ gap: 6, paddingLeft: 42 }}>
                        <XCircle size={13} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: 3 }} />
                        <span style={{ fontSize: 12.5, color: '#BA1A1A' }}>
                          {e.field ? `${t(fieldLabelKey(e.field))}: ` : ''}{t(e.reasonKey, e.params)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex gap-2 mt-3">
                  <button className="btn-secondary" style={{ fontSize: 13 }} onClick={downloadClientErrorReport}>
                    <Download size={14} />{t('import.validate.downloadReport')}
                  </button>
                </div>
              </div>
            )}

            {validRows.length === 0 && (
              <div style={{ background: 'rgba(186,26,26,0.05)', border: '0.5px solid rgba(186,26,26,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#BA1A1A' }}>
                {t('import.validate.noValidRows')}
              </div>
            )}

            <div className="flex justify-between">
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setStep('upload')}>
                <RotateCcw size={14} />{t('import.confirm.reupload')}
              </button>
              <button
                className="btn-primary"
                disabled={validRows.length === 0}
                onClick={() => gotoStep('confirm')}
                style={{ fontSize: 13, opacity: validRows.length === 0 ? 0.5 : 1, cursor: validRows.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                {invalidRows.length > 0 ? t('import.validate.skipErrors') : t('import.validate.continue')} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,88,188,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Upload size={28} style={{ color: '#0058BC' }} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#181C23', marginBottom: 10 }}>{t('import.confirm.heading')}</h2>
            <div style={{ maxWidth: 460, margin: '0 auto 28px' }}>
              <div style={{ background: 'rgba(241,243,254,0.8)', borderRadius: 14, padding: '18px 22px', textAlign: 'left' }}>
                {[
                  [t('import.confirm.file'), fileMeta?.name ?? '—'],
                  [t('import.confirm.successRows'), t('import.confirm.rowsUnit', { n: validRows.length })],
                  [t('import.confirm.skippedRows'), t('import.confirm.skippedValue', { n: invalidRows.length })],
                  [t('import.confirm.mode'), t('import.confirm.modeValue')],
                  [t('import.confirm.review'), t('import.confirm.reviewValue')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '0.5px solid rgba(193,198,215,0.3)', fontSize: 13.5 }}>
                    <span style={{ color: '#717786', flexShrink: 0 }}>{k}</span>
                    <span style={{ color: '#181C23', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <div style={{ background: 'rgba(186,26,26,0.06)', border: '0.5px solid rgba(186,26,26,0.25)', borderRadius: 10, padding: '10px 16px', margin: '0 auto 16px', maxWidth: 460, fontSize: 13, color: '#BA1A1A' }}>
                {submitError}
              </div>
            )}

            <div className="flex justify-center gap-3">
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={clearFile}>
                <RotateCcw size={14} />{t('import.confirm.reupload')}
              </button>
              <button
                className="btn-primary"
                style={{ fontSize: 13.5, padding: '10px 28px', opacity: importMutation.isPending ? 0.7 : 1 }}
                disabled={importMutation.isPending}
                onClick={handleSubmit}
              >
                {importMutation.isPending
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Upload size={14} />}
                {importMutation.isPending ? t('import.confirm.importing') : t('import.confirm.submit', { n: validRows.length })}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Result */}
        {step === 'result' && result && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={36} style={{ color: '#34C759' }} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#181C23', marginBottom: 8 }}>{t('import.result.heading')}</h2>
            <p style={{ fontSize: 14, color: '#717786', marginBottom: 28 }}>{t(result.created === 1 ? 'import.result.descOne' : 'import.result.desc', { ok: result.created, fail: result.skipped })}</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 480, margin: '0 auto 32px' }}>
              {[
                { label: t('import.result.success'), value: t('import.result.count', { n: result.created }), color: '#1a7a2e', bg: 'rgba(52,199,89,0.08)' },
                { label: t('import.result.skipped'), value: t('import.result.count', { n: result.skipped }), color: '#BA1A1A', bg: 'rgba(186,26,26,0.06)' },
                { label: t('import.result.total'), value: t('import.result.count', { n: result.total }), color: '#0058BC', bg: 'rgba(0,88,188,0.07)' },
              ].map(k => (
                <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: k.color, fontFamily: "'JetBrains Mono', monospace" }}>{k.value}</div>
                  <div style={{ fontSize: 12.5, color: k.color, marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {result.errors.length > 0 && (
                <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={downloadServerErrorReport}>
                  <Download size={14} />{t('import.validate.downloadReport')}
                </button>
              )}
              <button className="btn-secondary" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
                <Eye size={14} />{t('import.result.viewRecords')}
              </button>
              <button className="btn-primary" style={{ fontSize: 13.5 }} onClick={() => navigateTo('insurer-list')}>
                <ArrowRight size={14} />{t('import.result.backToList')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
