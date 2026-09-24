/**
 * 险种字典管理 Service（V1.0.18）
 * 对接 /api/dictionaries 后端接口
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/dictionaries',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth.access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── 类型 ────────────────────────────────────────────────────
export interface DictLine {
  id: number;
  code: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  status: 'active' | 'disabled';
  subLineCount?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictSubLine {
  id: number;
  lineCode: string;
  code: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  status: 'active' | 'disabled';
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type DictCoverage = Omit<DictSubLine, 'lineCode'>;

export interface DictTreeItem {
  code: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
}

export interface DictTreeLine extends DictTreeItem {
  subLines: DictTreeItem[];
  coverages: DictTreeItem[];
}

export interface DictTree {
  version: string;
  lines: DictTreeLine[];
  allCoverages: DictTreeItem[];
}

export interface DictUsage {
  productCount: number;
  subLineCount?: number;
  relCount?: number;
}

export interface DictUpsertDto {
  code?: string;
  nameZh?: string;
  nameEn?: string;
  sortOrder?: number;
}

// ── 接口 ────────────────────────────────────────────────────
export const dictionaryService = {
  // 联动树（登录态，建品表单/矩阵共用）
  tree: () => apiClient.get('/coverage-tree').then((r) => r.data) as Promise<{ success: boolean; data: DictTree }>,

  // 业务线
  listLines: (includeDisabled = true) =>
    apiClient.get('/lines', { params: { includeDisabled } }).then((r) => r.data) as Promise<{ success: boolean; data: DictLine[] }>,
  createLine: (dto: DictUpsertDto) => apiClient.post('/lines', dto).then((r) => r.data),
  updateLine: (code: string, dto: DictUpsertDto) => apiClient.put(`/lines/${encodeURIComponent(code)}`, dto).then((r) => r.data),
  setLineStatus: (code: string, status: 'active' | 'disabled') =>
    apiClient.put(`/lines/${encodeURIComponent(code)}/status`, { status }).then((r) => r.data),
  deleteLine: (code: string) => apiClient.delete(`/lines/${encodeURIComponent(code)}`).then((r) => r.data),

  // 子险种
  listSubLines: (lineCode: string, includeDisabled = true) =>
    apiClient.get(`/lines/${encodeURIComponent(lineCode)}/sub-lines`, { params: { includeDisabled } }).then((r) => r.data) as Promise<{ success: boolean; data: DictSubLine[] }>,
  createSubLine: (lineCode: string, dto: DictUpsertDto) =>
    apiClient.post(`/lines/${encodeURIComponent(lineCode)}/sub-lines`, dto).then((r) => r.data),
  updateSubLine: (id: number, dto: DictUpsertDto) => apiClient.put(`/sub-lines/${id}`, dto).then((r) => r.data),
  setSubLineStatus: (id: number, status: 'active' | 'disabled') =>
    apiClient.put(`/sub-lines/${id}/status`, { status }).then((r) => r.data),
  deleteSubLine: (id: number) => apiClient.delete(`/sub-lines/${id}`).then((r) => r.data),

  // 承保范围
  listCoverages: (includeDisabled = true) =>
    apiClient.get('/coverages', { params: { includeDisabled } }).then((r) => r.data) as Promise<{ success: boolean; data: DictCoverage[] }>,
  createCoverage: (dto: DictUpsertDto) => apiClient.post('/coverages', dto).then((r) => r.data),
  updateCoverage: (code: string, dto: DictUpsertDto) => apiClient.put(`/coverages/${encodeURIComponent(code)}`, dto).then((r) => r.data),
  setCoverageStatus: (code: string, status: 'active' | 'disabled') =>
    apiClient.put(`/coverages/${encodeURIComponent(code)}/status`, { status }).then((r) => r.data),
  deleteCoverage: (code: string) => apiClient.delete(`/coverages/${encodeURIComponent(code)}`).then((r) => r.data),

  // 业务线 × 承保范围 关联
  getLineCoverages: (lineCode: string) =>
    apiClient.get(`/lines/${encodeURIComponent(lineCode)}/coverages`).then((r) => r.data) as Promise<{ success: boolean; data: { lineCode: string; coverageCodes: string[] } }>,
  replaceLineCoverages: (lineCode: string, coverageCodes: string[]) =>
    apiClient.put(`/lines/${encodeURIComponent(lineCode)}/coverages`, { coverageCodes }).then((r) => r.data),

  // 引用统计
  usage: (type: 'line' | 'sub-line' | 'coverage', key: string, line?: string) =>
    apiClient.get(`/${type}/${encodeURIComponent(key)}/usage`, { params: line ? { line } : {} }).then((r) => r.data) as Promise<{ success: boolean; data: DictUsage }>,
};

/** DICT_* 错误码 → i18n 文案（配合 useTranslation('dict') 的 t 函数使用） */
export const dictErrorKey = (e: unknown): string => {
  const anyErr = e as any;
  const code: string | undefined = anyErr?.response?.data?.code ?? anyErr?.code;
  const known = [
    'DICT_CODE_EXISTS', 'DICT_CODE_IMMUTABLE', 'DICT_IN_USE', 'DICT_INVALID_CODE_FORMAT',
    'DICT_LINE_NOT_FOUND', 'DICT_SUB_LINE_NOT_FOUND', 'DICT_COVERAGE_NOT_FOUND',
    'DICT_FORBIDDEN', 'DICT_INVALID_PARAMS',
  ];
  return code && known.includes(code) ? `errors.${code}` : 'errors.network';
};
