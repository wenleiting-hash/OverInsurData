/**
 * User Management API Client
 *
 * Provides TypeScript-typed methods for interacting with user management backend APIs.
 * Aligned with unified auth Schema V5 (user_uuid as business key, name_zh/name_en).
 */

import axios from 'axios';
import { refreshAccessToken } from './token-refresh';

/**
 * Main user API client instance
 */
export const userApiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth tokens
userApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth.access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for 401 auto-refresh (uses shared refresh lock)
userApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use shared refresh lock to prevent concurrent refresh race conditions
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return userApiClient(originalRequest);
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// ─── Interfaces ──────────────────────────────────────────────────────

export interface UserAccount {
  id: string;            // user_uuid from backend
  username: string;
  name_zh?: string;
  name_en?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  dept_code?: string;
  dept_name_zh?: string;
  dept_name_en?: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked' | 'pending';
  auth_method: 'local' | 'sso' | 'ldap';
  mfa_enabled?: boolean;
  lastLoginAt?: string;
  loginCount?: number;
  failedLoginAttempts?: number;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  created_by?: string;
}

export interface CreateUserDto {
  username: string;
  password: string;
  name_zh?: string;
  name_en?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  deptCode?: string;
  roleKeys?: string[];
  authMethod?: 'local' | 'sso' | 'ldap';
  remark?: string;
}

export interface UpdateUserDto {
  name_zh?: string;
  name_en?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  deptCode?: string;
  roleKeys?: string[];
  status?: 'active' | 'inactive' | 'locked';
  remark?: string;
}

export interface RoleInfo {
  id: number;
  role_key: string;
  role_name_zh: string;
  role_name_en?: string;
  role_code: string;
  description?: string;
  permission_keys?: string[];
  is_system: boolean;
  sort_order: number;
  userCount: number;
  permissionCount: number;
  created_at: string;
  updated_at: string;
}

export interface DepartmentInfo {
  dept_id: number;
  dept_code: string;
  dept_name_zh: string;
  dept_name_en?: string;
  parent_dept_id?: number;
  dept_level: number;
  path?: string;
  color?: string;
  description?: string;
  manager_name?: string;
  manager_title?: string;
  manager_email?: string;
  manager_phone?: string;
  office_location?: string;
  sort_order?: number;
  status: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentTreeNode extends DepartmentInfo {
  member_count: number;
  sub_department_count: number;
  children?: DepartmentTreeNode[];
}

export interface CreateDepartmentDto {
  dept_name_zh: string;
  dept_name_en?: string;
  dept_code?: string;
  parent_dept_id?: number;
  color?: string;
  description?: string;
  manager_name?: string;
  manager_title?: string;
  manager_email?: string;
  manager_phone?: string;
  office_location?: string;
  sort_order?: number;
}

export interface UpdateDepartmentDto {
  dept_name_zh?: string;
  dept_name_en?: string;
  parent_dept_id?: number | null;
  color?: string;
  description?: string;
  manager_name?: string;
  manager_title?: string;
  manager_email?: string;
  manager_phone?: string;
  office_location?: string;
  status?: boolean;
  sort_order?: number;
}

export interface DepartmentDetail extends DepartmentInfo {
  member_count: number;
  sub_department_count: number;
  children: Array<{
    dept_id: number;
    dept_code: string;
    dept_name_zh: string;
    dept_name_en?: string;
    color?: string;
    member_count: number;
  }>;
  ancestor_path: Array<{ dept_id: number; dept_name_zh: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── API Methods ─────────────────────────────────────────────────────

export const userApi = {
  /** Get users with pagination and filters */
  async getUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    statusFilter?: string;
    roleFilter?: string;
    deptFilter?: string;
  }): Promise<PaginatedResponse<UserAccount>> {
    const response = await userApiClient.get('/users/list', { params });
    if (response.data && Array.isArray(response.data.data)) return response.data;
    throw new Error('Unexpected users payload');
  },

  /** Get single user by UUID */
  async getUserById(id: string): Promise<UserAccount> {
    const response = await userApiClient.get(`/users/${id}`);
    return response.data;
  },

  /** Create new user */
  async createUser(dto: CreateUserDto): Promise<UserAccount> {
    const response = await userApiClient.post('/users', dto);
    return response.data;
  },

  /** Update existing user */
  async updateUser(id: string, dto: UpdateUserDto): Promise<UserAccount> {
    const response = await userApiClient.put(`/users/${id}`, dto);
    return response.data;
  },

  /** Soft delete user */
  async deleteUser(id: string): Promise<void> {
    await userApiClient.delete(`/users/${id}`);
  },

  /** Reset user password */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await userApiClient.post(`/users/${id}/reset-password`, { newPassword });
  },

  /** Toggle user status (active/inactive/locked) */
  async toggleStatus(id: string, status: 'active' | 'inactive' | 'locked'): Promise<UserAccount> {
    const response = await userApiClient.post(`/users/${id}/toggle-status`, { status });
    return response.data;
  },

  /** Get all roles */
  async getRoles(): Promise<RoleInfo[]> {
    const response = await userApiClient.get('/roles');
    return response.data;
  },

  /** Get all departments */
  async getDepartments(): Promise<DepartmentInfo[]> {
    const response = await userApiClient.get('/users/departments');
    if (Array.isArray(response.data)) return response.data;
    throw new Error('Unexpected departments payload');
  },

  /** Create role */
  async createRole(dto: {
    roleKey: string;
    roleNameZh: string;
    roleNameEn?: string;
    roleCode: string;
    description?: string;
    isSystem?: boolean;
    sortOrder?: number;
    permissionKeys?: string[];
  }): Promise<RoleInfo> {
    const response = await userApiClient.post('/roles', dto);
    return response.data;
  },

  /** Update role */
  async updateRole(roleKey: string, dto: Partial<{
    roleNameZh: string;
    roleNameEn: string;
    roleCode: string;
    description: string;
    sortOrder: number;
    permissionKeys: string[];
  }>): Promise<RoleInfo> {
    const response = await userApiClient.put(`/roles/${roleKey}`, dto);
    return response.data;
  },

  /** Delete role (soft) */
  async deleteRole(roleKey: string): Promise<void> {
    await userApiClient.delete(`/roles/${roleKey}`);
  },
};

// ─── Department API Methods ───────────────────────────────────────

export const departmentApi = {
  /** Get department tree structure */
  async getTree(): Promise<DepartmentTreeNode[]> {
    const response = await userApiClient.get('/departments/tree');
    if (Array.isArray(response.data)) return response.data;
    throw new Error('Unexpected tree payload');
  },

  /** Get single department detail */
  async getById(id: number): Promise<DepartmentDetail> {
    const response = await userApiClient.get(`/departments/${id}`);
    return response.data;
  },

  /** Create new department */
  async create(dto: CreateDepartmentDto): Promise<DepartmentDetail> {
    const response = await userApiClient.post('/departments', dto);
    return response.data;
  },

  /** Update department */
  async update(id: number, dto: UpdateDepartmentDto): Promise<DepartmentDetail> {
    const response = await userApiClient.put(`/departments/${id}`, dto);
    return response.data;
  },

  /** Delete department (cascade soft-delete) */
  async delete(id: number): Promise<{ success: boolean; deletedCount: number }> {
    const response = await userApiClient.delete(`/departments/${id}`);
    return response.data;
  },

  /** Get department members (paginated) */
  async getMembers(id: number, params?: { page?: number; pageSize?: number }): Promise<PaginatedResponse<UserAccount>> {
    const response = await userApiClient.get(`/departments/${id}/members`, { params });
    return response.data;
  },
};

// ─── Insurer API Methods ──────────────────────────────────────────

/** 保险公司结算配置（持久化到 settlement_config JSONB 列）。 */
export interface InsurerSettlementConfig {
  billingFormat?: string;
  billCutoffDay?: number;
  paymentTermDays?: number;
  currency?: string;
  premiumCollection?: string;
}

/** 保险公司资质文件槽位元数据（文件本体通过 POST /uploads 上传）。 */
export interface InsurerDocument {
  key: string;        // businessLicense / mainAgreement / nda / dpa / amBestReport
  name: string;       // 原始文件名（utf8，可能含非 ASCII）
  size?: number;      // 字节
  url: string;        // /uploads/<storedName>
  mimetype?: string;
}

export interface InsurerRecord {
  id?: string;
  carrier_id?: string;
  documents?: InsurerDocument[];
  settlement_config?: InsurerSettlementConfig;
  naic_code: string;
  carrier_name: string;
  carrier_name_short?: string;
  short_name?: string;  // backward compat
  carrier_type?: string;
  type?: string;  // backward compat
  status: string;
  region: string;
  state?: string;
  loss_ratio?: number;
  renewal_rate?: number;
  revenue?: number;
  policy_count?: number;
  commission_income?: number;
  coop_status?: string;
  am_best_rating?: string;
  sp_rating?: string;
  moodys_rating?: string;
  fitch_rating?: string;
  settlement_cycle?: string;
  lines?: string[];
  founded_year?: number;
  founded?: number;  // backward compat
  website?: string;
  coop_type?: string;
  contract_expiry?: string;
  channel_count?: number;
  product_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted?: boolean;
}

export interface InsurerListParams {
  search?: string;
  type?: string;
  status?: string;
  region?: string;
  rating?: string;
  cooperation_status?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface CreateInsurerDto {
  naic_code: string;
  carrier_name: string;
  carrier_name_short?: string;
  carrier_type?: string;
  status?: string;
  region?: string;
  state?: string;
  am_best_rating?: string;
  sp_rating?: string;
  moodys_rating?: string;
  fitch_rating?: string;
  settlement_cycle?: string;
  settlement_config?: InsurerSettlementConfig;
  lines?: string[];
  documents?: InsurerDocument[];
  founded_year?: number;
  website?: string;
  coop_type?: string;
}

export interface UpdateInsurerDto {
  naic_code?: string;
  carrier_name?: string;
  carrier_name_short?: string;
  carrier_type?: string;
  status?: string;
  region?: string;
  state?: string;
  loss_ratio?: number;
  renewal_rate?: number;
  revenue?: number;
  policy_count?: number;
  commission_income?: number;
  coop_status?: string;
  am_best_rating?: string;
  sp_rating?: string;
  moodys_rating?: string;
  fitch_rating?: string;
  settlement_cycle?: string;
  settlement_config?: InsurerSettlementConfig;
  lines?: string[];
  documents?: InsurerDocument[];
  founded_year?: number;
  website?: string;
  coop_type?: string;
  contract_expiry?: string;
  channel_count?: number;
  product_count?: number;
}

/** Row-level failure returned by POST /insurers/batch-import */
export interface InsurerImportError {
  /** Spreadsheet row number (header is row 1, data starts at row 2) */
  row: number;
  field?: string;
  reason: string;
}

export interface InsurerBatchImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: InsurerImportError[];
}

export interface BatchImportInsurersPayload {
  rows: CreateInsurerDto[];
}

// ─── Insurer mock fallback ───────────────────────────────────────────
// Used only when carrier-service is unreachable/unauthorized (e.g. local dev
// without a valid JWT). Keeps batch import and the insurer list end-to-end usable.
let insurerMockStore: InsurerRecord[] | null = null;

function ensureInsurerMockStore(): InsurerRecord[] {
  if (insurerMockStore) return insurerMockStore;
  const now = '2026-08-01T09:00:00.000Z';
  insurerMockStore = [
    { carrier_id: 'c-mock-001', naic_code: '41001', carrier_name: 'Aurora National Insurance Co', carrier_name_short: 'Aurora National', carrier_type: 'Admitted', status: 'active', region: 'Northeast', state: 'NY', am_best_rating: 'A+', founded_year: 1921, revenue: 4820000000, policy_count: 3200000, loss_ratio: 62.4, renewal_rate: 88.2, settlement_cycle: 'Monthly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-002', naic_code: '41002', carrier_name: 'Blue River Casualty Group', carrier_name_short: 'Blue River', carrier_type: 'Admitted', status: 'active', region: 'Southeast', state: 'GA', am_best_rating: 'A', founded_year: 1954, revenue: 3170000000, policy_count: 2100000, loss_ratio: 67.1, renewal_rate: 84.6, settlement_cycle: 'Quarterly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-003', naic_code: '41003', carrier_name: 'Cedar Ridge Specialty Underwriters', carrier_name_short: 'Cedar Ridge', carrier_type: 'Non-Admitted', status: 'active', region: 'Midwest', state: 'IL', am_best_rating: 'A-', founded_year: 1998, revenue: 1260000000, policy_count: 460000, loss_ratio: 58.9, renewal_rate: 79.3, settlement_cycle: 'Monthly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-004', naic_code: '41004', carrier_name: 'Delta Atlantic Insurance Co', carrier_name_short: 'Delta Atlantic', carrier_type: 'Admitted', status: 'inactive', region: 'West', state: 'CA', am_best_rating: 'B++', founded_year: 1962, revenue: 2040000000, policy_count: 1350000, loss_ratio: 74.8, renewal_rate: 71.5, settlement_cycle: 'Quarterly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-005', naic_code: '41005', carrier_name: 'Evergreen Mutual Assurance', carrier_name_short: 'Evergreen Mutual', carrier_type: 'Admitted', status: 'active', region: 'West', state: 'WA', am_best_rating: 'A+', founded_year: 1925, revenue: 5520000000, policy_count: 4100000, loss_ratio: 60.2, renewal_rate: 90.1, settlement_cycle: 'Monthly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-006', naic_code: '41006', carrier_name: 'Fairhaven Excess & Surplus Lines', carrier_name_short: 'Fairhaven E&S', carrier_type: 'Non-Admitted', status: 'active', region: 'Northeast', state: 'CT', am_best_rating: 'A', founded_year: 2003, revenue: 890000000, policy_count: 210000, loss_ratio: 55.4, renewal_rate: 76.8, settlement_cycle: 'Monthly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-007', naic_code: '41007', carrier_name: 'Granite Peak Insurance Group', carrier_name_short: 'Granite Peak', carrier_type: 'Admitted', status: 'active', region: 'Midwest', state: 'MN', am_best_rating: 'A-', founded_year: 1978, revenue: 1780000000, policy_count: 980000, loss_ratio: 69.7, renewal_rate: 82.4, settlement_cycle: 'Quarterly', created_at: now, updated_at: now },
    { carrier_id: 'c-mock-008', naic_code: '41008', carrier_name: 'Harborline Indemnity Co', carrier_name_short: 'Harborline', carrier_type: 'Admitted', status: 'active', region: 'National', state: 'DE', am_best_rating: 'A++', founded_year: 1909, revenue: 8930000000, policy_count: 6700000, loss_ratio: 59.1, renewal_rate: 92.7, settlement_cycle: 'Monthly', created_at: now, updated_at: now },
  ];
  return insurerMockStore;
}

function queryMockInsurers(params?: InsurerListParams): PaginatedResponse<InsurerRecord> {
  let rows = [...ensureInsurerMockStore()];
  if (params?.search) {
    const q = params.search.toLowerCase();
    rows = rows.filter(r =>
      r.carrier_name.toLowerCase().includes(q) ||
      (r.carrier_name_short || '').toLowerCase().includes(q) ||
      r.naic_code.includes(q),
    );
  }
  if (params?.type && params.type !== 'all') rows = rows.filter(r => r.carrier_type === params.type);
  if (params?.status && params.status !== 'all') rows = rows.filter(r => r.status === params.status);
  if (params?.region && params.region !== 'all') rows = rows.filter(r => r.region === params.region);
  if (params?.rating && params.rating !== 'all') rows = rows.filter(r => r.am_best_rating === params.rating);
  if (params?.cooperation_status && params.cooperation_status !== 'all') rows = rows.filter(r => (r.coop_status ?? r.status) === params.cooperation_status);
  const sortKey = params?.sortKey;
  if (sortKey) {
    const dir = params?.sortDir === 'asc' ? 1 : -1;
    rows.sort((a: any, b: any) => {
      const av = a[sortKey] ?? 0; const bv = b[sortKey] ?? 0;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }
  const page = params?.page ?? 1;
  const size = params?.size ?? 20;
  const data = rows.slice((page - 1) * size, page * size);
  return { data, total: rows.length, page, pageSize: size, size } as PaginatedResponse<InsurerRecord> & { size: number };
}

function mockBatchImportInsurers(payload: BatchImportInsurersPayload): InsurerBatchImportResult {
  const store = ensureInsurerMockStore();
  const existing = new Set(store.map(r => r.naic_code));
  const seen = new Set<string>();
  const errors: InsurerImportError[] = [];
  let created = 0;

  payload.rows.forEach((dto, i) => {
    const row = i + 2; // header row 1, first data row 2
    const naic = dto.naic_code;
    if (seen.has(naic) || existing.has(naic)) {
      errors.push({ row, field: 'naic_code', reason: `NAIC Code "${naic}" already exists` });
      return;
    }
    const now = new Date().toISOString();
    store.push({
      carrier_id: 'c-mock-' + Date.now().toString(36) + '-' + i,
      naic_code: naic,
      carrier_name: dto.carrier_name,
      carrier_name_short: dto.carrier_name_short,
      carrier_type: dto.carrier_type,
      status: dto.status || 'active',
      region: dto.region ?? '',
      state: dto.state,
      am_best_rating: dto.am_best_rating,
      founded_year: dto.founded_year,
      settlement_cycle: dto.settlement_cycle,
      created_at: now,
      updated_at: now,
    });
    seen.add(naic);
    existing.add(naic);
    created++;
  });

  return { total: payload.rows.length, created, skipped: errors.length, errors };
}

export const insurerApi = {
  async getList(params?: InsurerListParams): Promise<PaginatedResponse<InsurerRecord>> {
    try {
      const response = await userApiClient.get('/insurers', { params });
      return response.data;
    } catch {
      // Dev fallback when carrier-service is unavailable/unauthorized
      return queryMockInsurers(params);
    }
  },

  async getById(id: string): Promise<InsurerRecord> {
    const response = await userApiClient.get(`/insurers/${id}`);
    return response.data;
  },

  async duplicateCheck(): Promise<any[]> {
    const response = await userApiClient.get('/insurers/duplicate-check');
    return response.data;
  },

  async checkNaic(code: string, excludeId?: string): Promise<{ valid: boolean; available: boolean; existingId?: string; message: string }> {
    const params = excludeId ? { excludeId } : {};
    const response = await userApiClient.get(`/insurers/check-naic/${code}`, { params });
    return response.data;
  },

  /** 上传资质文件到 POST /uploads，返回的元数据随后随保险公司 documents 字段一起落库。 */
  async uploadDocument(file: File): Promise<{ originalName: string; storedName: string; size: number; mimetype: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    const response = await userApiClient.post('/uploads', form, {
      // axios 实例默认带 Content-Type: application/json，
      // 显式置为 undefined 让 axios 检测到 FormData 并清除它，
      // 浏览器随后自动加上 multipart/form-data; boundary=...
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
    return response.data;
  },

  async create(dto: CreateInsurerDto): Promise<InsurerRecord> {
    const response = await userApiClient.post('/insurers', dto);
    return response.data;
  },

  async update(id: string, dto: UpdateInsurerDto): Promise<InsurerRecord> {
    const response = await userApiClient.put(`/insurers/${id}`, dto);
    return response.data;
  },

  async toggleStatus(id: string): Promise<InsurerRecord> {
    const response = await userApiClient.patch(`/insurers/${id}/toggle-status`);
    return response.data;
  },

  async batchToggleStatus(ids: string[], status: 'active' | 'inactive'): Promise<{ updated: number }> {
    const response = await userApiClient.patch('/insurers/batch-toggle', { ids, status });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await userApiClient.delete(`/insurers/${id}`);
  },

  async batchRemove(ids: string[]): Promise<{ deleted: number }> {
    const response = await userApiClient.delete('/insurers/batch', { data: { ids } });
    return response.data;
  },

  /** Batch import insurers. Invalid rows are returned per-row instead of failing the whole batch. */
  async batchImport(payload: BatchImportInsurersPayload): Promise<InsurerBatchImportResult> {
    try {
      const response = await userApiClient.post('/insurers/batch-import', payload);
      return response.data;
    } catch {
      // Dev fallback when carrier-service is unavailable/unauthorized
      return mockBatchImportInsurers(payload);
    }
  },
};

/** Payload for POST /products/:id/underwriting-rules — camelCase, mirrors CreateUnderwritingRuleDto.
 *  The enums are indexed off the view interface so an accepted value can never drift from what
 *  ProductDetail knows how to render (ruleCatLabels / RULE_ACTION_COLOR). */
export interface CreateUnderwritingRulePayload {
  name: string;
  nameEn?: string;
  category: ProductUnderwritingRule['category'];
  priority?: number;
  condition: string;
  conditionEn?: string;
  conditionDetail?: string;
  conditionDetailEn?: string;
  action: ProductUnderwritingRule['action'];
  actionValue?: string;
  actionValueEn?: string;
  status?: ProductUnderwritingRule['status'];
}

/** Payload for POST /products/:id/training-materials — camelCase, mirrors CreateTrainingMaterialDto.
 *  uploadDate / uploadedBy / downloads are server-assigned and intentionally absent. */
export interface CreateTrainingMaterialPayload {
  title: string;
  titleEn?: string;
  type: ProductTrainingMaterial['type'];
  fileName?: string;
  fileSize?: string;
  version?: string;
  requiredFor?: string[];
  expiryDate?: string;
  url?: string;
}

/** Payload for PATCH /products/:id/underwriting-rules — every field optional so the edit
 *  dialog can send only what changed; the backend writes just the keys present. */
export type UpdateUnderwritingRulePayload = Partial<CreateUnderwritingRulePayload>;

/** Payload for PATCH /products/:id/toggle-status — reason is required; states is required
 *  for scope='selected'; effectiveAt null/undefined = immediate, future ISO = scheduled. */
export interface ToggleProductStatusPayload {
  action?: 'list' | 'delist';
  reason: string;
  remark?: string;
  scope?: 'all' | 'selected';
  states?: string[];
  effectiveAt?: string | null;
}

/** Payload for PATCH /products/:id/training-materials/:materialId — metadata edit / file replace. */
export type UpdateTrainingMaterialPayload = Partial<Omit<CreateTrainingMaterialPayload, 'type'>> & {
  type?: ProductTrainingMaterial['type'];
};

/** Payload for POST /products/:id/rate-plans — camelCase, mirrors CreateRatePlanDto. */
export interface CreateRatePlanPayload {
  name: string;
  tier: ProductRatePlan['tier'];
  baseRate: number;
  minPremium?: number;
  maxPremium?: number;
  effectiveDate?: string;
  expiryDate?: string;
  status?: ProductRatePlan['status'];
  ratingFactors?: { factor: string; weight?: number; description?: string; descriptionEn?: string }[];
}

/** Payload for PATCH /products/:id/rate-plans/:planId — every field optional so the edit dialog can
 *  send only what changed; the backend writes just the keys present. */
export type UpdateRatePlanPayload = Partial<CreateRatePlanPayload>;

// ─── Product API Methods ──────────────────────────────────────────

/** A persisted product compliance/training document (metadata only; file bytes live on the server under /uploads). */
export interface ProductDocument {
  key: string;        // doc slot key: filing / rates / guide / uwManual / training
  name: string;       // original filename (utf8, may be non-ASCII)
  size: number;       // bytes
  url: string;        // public download url, e.g. /uploads/<storedName>
  mimetype?: string;
}

export interface ProductRecord {
  id: string;
  carrier_id: string;
  carrier_name?: string;
  product_name: string;
  short_name?: string;
  product_code: string;
  naic_form_number?: string;
  description?: string;
  description_en?: string;
  coverages?: string[];
  line_of_business: string;
  sub_line?: string;
  product_type?: string;
  rate_type?: string;
  base_rate?: number;
  min_premium?: number;
  max_premium?: number;
  rate_factors?: string[];
  underwriting_mode: string;
  authorized_channels?: string[];
  max_policy_limit?: number;
  mga_negotiation_authority?: boolean;
  renewal_type: string;
  policy_term_years: number;
  age_min?: number;
  age_max?: number;
  exclude_dui?: boolean;
  refer_high_value?: boolean;
  refer_threshold?: number;
  blacklist_conditions?: string[];
  documents?: ProductDocument[];
  available_states?: string[];
  effective_date: string;
  expiration_date?: string;
  status: string;
  is_active: boolean;
  premium_ytd?: number;
  policy_count?: number;
  avg_premium?: number;
  loss_ratio?: number;
  renewal_rate?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // ── V1.0.10 上下架审计/定时字段（snake_case，后端原样返回）──
  status_reason?: string | null;
  status_remark?: string | null;
  status_change_scope?: 'all' | 'selected' | null;
  status_change_states?: string[] | null;
  status_changed_at?: string | null;
  status_changed_by?: string | null;
  status_effective_at?: string | null;
  pending_change?: {
    action: 'list' | 'delist';
    scope: 'all' | 'selected';
    states: string[];
    reason: string;
    remark?: string | null;
  } | null;
}

export interface ProductListParams {
  search?: string;
  insurer?: string;
  line?: string;
  status?: string;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

// ─── Product detail sub-resource types (mirror views/data/productDetails.ts) ───

export type RatingFactorKey =
  | 'drivingRecord' | 'vehicleType' | 'drivingExperience' | 'creditScore' | 'territory' | 'usage'
  | 'homeRebuildCost' | 'securityFeatures' | 'naturalRisk' | 'lossHistory'
  | 'annualRevenue' | 'industryRisk' | 'securityPosture' | 'incidentHistory'
  | 'employeeCount' | 'supplyChain'

export interface ProductRatePlan {
  id: string;
  productId: string;
  name: string;
  tier: 'Standard' | 'Enhanced' | 'Premium' | 'Basic';
  baseRate: number;
  minPremium: number;
  maxPremium: number;
  effectiveDate: string;
  expiryDate: string;
  /** 本系统无审批流程，故没有 'pending'（待审批）态，也没有监管备案（filingStatus）字段。 */
  status: 'active' | 'draft' | 'expired';
  ratingFactors: { factor: RatingFactorKey; description: string; descriptionEn: string; weight: number }[];
}

export interface ProductStateDetail {
  code: string;
  name: string;
  enabled: boolean;
  effectiveDate?: string | null;
  /** 无审批流程：州只有 已开通 / 已暂停 / 未开通 三态，原 'pending'（审核中）已去除。 */
  status: 'active' | 'suspended' | 'not-available';
  channelCount?: number;
}

export interface ProductUnderwritingRule {
  id: string;
  productId: string;
  name: string;
  nameEn: string;
  category: 'eligibility' | 'rating' | 'exclusion' | 'referral';
  priority: number;
  condition: string;
  conditionEn: string;
  conditionDetail: string;
  conditionDetailEn: string;
  action: 'approve' | 'decline' | 'refer' | 'surcharge' | 'discount';
  actionValue?: string | null;
  actionValueEn?: string | null;
  status: 'active' | 'inactive' | 'testing';
  lastModified: string;
  modifiedBy: string;
}

export interface ProductTrainingMaterial {
  id: string;
  productId: string;
  title: string;
  titleEn: string;
  type: 'product-guide' | 'rate-manual' | 'underwriting-guide' | 'compliance' | 'training-deck' | 'faq' | 'video';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  uploadedBy: string;
  version: string;
  downloads: number;
  requiredFor: string[];
  expiryDate?: string | null;
  /** Public download path from POST /api/uploads; null for legacy seed rows that have no stored file. */
  fileUrl?: string | null;
  /** Availability flag: `inactive` materials stay listed (history) but lose their download action. */
  status?: 'active' | 'inactive';
}

export interface ProductPerformancePoint {
  month: string;
  premium: number;
  newBiz: number;
  renewal: number;
  policies: number;
  lossRatio: number;
  claimsCount: number;
}

export const productApi = {
  async getList(params?: ProductListParams): Promise<PaginatedResponse<ProductRecord>> {
    const response = await userApiClient.get('/products', { params });
    return response.data;
  },

  async getById(id: string): Promise<ProductRecord> {
    const response = await userApiClient.get(`/products/${id}`);
    return response.data;
  },

  async create(dto: any): Promise<ProductRecord> {
    const response = await userApiClient.post('/products', dto);
    return response.data;
  },

  async update(id: string, dto: any): Promise<ProductRecord> {
    const response = await userApiClient.put(`/products/${id}`, dto);
    return response.data;
  },

  async toggleStatus(id: string, payload?: ToggleProductStatusPayload): Promise<ProductRecord & { scheduled?: boolean }> {
    const response = await userApiClient.patch(`/products/${id}/toggle-status`, payload);
    return response.data;
  },

  /** Suspend / resume a single salable state from the states tab. */
  async setProductStateStatus(id: string, stateCode: string, status: 'active' | 'suspended'): Promise<ProductStateDetail> {
    const response = await userApiClient.patch(`/products/${id}/states/${encodeURIComponent(stateCode)}/status`, { status });
    return response.data;
  },

  async batchToggleStatus(ids: string[], status: string): Promise<{ updated: number }> {
    const response = await userApiClient.patch('/products/batch-toggle', { ids, status });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await userApiClient.delete(`/products/${id}`);
  },

  async batchRemove(ids: string[]): Promise<{ deleted: number }> {
    const response = await userApiClient.delete('/products/batch', { data: { ids } });
    return response.data;
  },

  // ── Read-only sub-resources for the 5 ProductDetail tabs ──
  async getRatePlans(id: string): Promise<ProductRatePlan[]> {
    const response = await userApiClient.get(`/products/${id}/rate-plans`);
    return response.data;
  },

  async getStates(id: string): Promise<ProductStateDetail[]> {
    const response = await userApiClient.get(`/products/${id}/states`);
    return response.data;
  },

  async getUnderwritingRules(id: string): Promise<ProductUnderwritingRule[]> {
    const response = await userApiClient.get(`/products/${id}/underwriting-rules`);
    return response.data;
  },

  async getTrainingMaterials(id: string): Promise<ProductTrainingMaterial[]> {
    const response = await userApiClient.get(`/products/${id}/training-materials`);
    return response.data;
  },

  async getPerformance(id: string): Promise<ProductPerformancePoint[]> {
    const response = await userApiClient.get(`/products/${id}/performance`);
    return response.data;
  },

  /**
   * Upload a product compliance/training file to the generic authenticated endpoint.
   * Returns server metadata (originalName / storedName / size / mimetype / url) to persist
   * into the product's `documents` jsonb column.
   */
  async uploadDocument(file: File): Promise<{ originalName: string; storedName: string; size: number; mimetype: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    const response = await userApiClient.post('/uploads', form, {
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
    return response.data;
  },

  // ── Write sub-resources for the ProductDetail tabs ──
  async createUnderwritingRule(id: string, dto: CreateUnderwritingRulePayload): Promise<ProductUnderwritingRule> {
    const response = await userApiClient.post(`/products/${id}/underwriting-rules`, dto);
    return response.data;
  },

  async createTrainingMaterial(id: string, dto: CreateTrainingMaterialPayload): Promise<ProductTrainingMaterial> {
    const response = await userApiClient.post(`/products/${id}/training-materials`, dto);
    return response.data;
  },

  /** Real-time product_code availability check (same pattern as insurerApi.checkNaic).
   *  excludeId is passed in edit mode so a product's own code doesn't count as a duplicate. */
  async checkCode(code: string, excludeId?: string): Promise<{ valid: boolean; available: boolean; existingId?: string | null; message: string }> {
    const params = excludeId ? { excludeId } : {};
    const response = await userApiClient.get(`/products/check-code/${encodeURIComponent(code)}`, { params });
    return response.data;
  },

  async updateUnderwritingRule(id: string, ruleId: string, dto: UpdateUnderwritingRulePayload): Promise<ProductUnderwritingRule> {
    const response = await userApiClient.patch(`/products/${id}/underwriting-rules/${ruleId}`, dto);
    return response.data;
  },

  async setRuleStatus(id: string, ruleId: string, status: ProductUnderwritingRule['status']): Promise<ProductUnderwritingRule> {
    const response = await userApiClient.patch(`/products/${id}/underwriting-rules/${ruleId}/status`, { status });
    return response.data;
  },

  async deleteUnderwritingRule(id: string, ruleId: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/products/${id}/underwriting-rules/${ruleId}`);
    return response.data;
  },

  async setMaterialStatus(id: string, materialId: string, status: 'active' | 'inactive'): Promise<ProductTrainingMaterial> {
    const response = await userApiClient.patch(`/products/${id}/training-materials/${materialId}/status`, { status });
    return response.data;
  },

  /** Edit training material metadata / replace its uploaded file. */
  async updateTrainingMaterial(id: string, materialId: string, dto: UpdateTrainingMaterialPayload): Promise<ProductTrainingMaterial> {
    const response = await userApiClient.patch(`/products/${id}/training-materials/${materialId}`, dto);
    return response.data;
  },

  async deleteTrainingMaterial(id: string, materialId: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/products/${id}/training-materials/${materialId}`);
    return response.data;
  },

  async createRatePlan(id: string, dto: CreateRatePlanPayload): Promise<ProductRatePlan> {
    const response = await userApiClient.post(`/products/${id}/rate-plans`, dto);
    return response.data;
  },

  async updateRatePlan(id: string, planId: string, dto: UpdateRatePlanPayload): Promise<ProductRatePlan> {
    const response = await userApiClient.patch(`/products/${id}/rate-plans/${planId}`, dto);
    return response.data;
  },

  async deleteRatePlan(id: string, planId: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/products/${id}/rate-plans/${planId}`);
    return response.data;
  },
};

// ─── Cooperation API Methods ────────────────────────────────────────

// ─── Cooperation domain — field names mirror the carrier_partnership / carrier_contract /
// carrier_contact / carrier_settlement_config tables 1:1 (snake_case from pg SELECT *) ─────

export interface CooperationRecord {
  partnership_id: string;
  carrier_id: string;
  insurer_short?: string | null;
  insurer_name?: string | null;
  naic_code?: string | null;
  carrier_type?: string | null;
  am_best_rating?: string | null;
  cooperation_type?: string;
  status: string;
  /** Read-time derived lifecycle status: Active → Expiring/Expired; otherwise equals status. */
  effective_status?: string;
  owner_name?: string | null;
  commission_tier?: string;
  notes?: string;
  notes_en?: string;
  settlement_method?: string;
  settlement_cycle_days?: number;
  premium_collection?: string;
  premium_settlement?: string;
  effective_date?: string;
  expiration_date?: string;
  product_scope?: { type?: string; lobTypes?: string[] } | Record<string, any> | null;
  state_scope?: string[];
  contract_file?: { fileName?: string; url?: string } | Record<string, any> | null;
  // V1.0.10 termination flow
  terminate_reason?: string | null;
  terminate_note?: string | null;
  terminate_effect_type?: 'immediate' | 'end-of-term' | 'scheduled' | null;
  terminate_effective_at?: string | null;
  terminated_at?: string | null;
  pending_change?: Record<string, any> | null;
  scheduled?: boolean; // present on terminate() responses only
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractRecord {
  contract_id: string;
  id: string; // same as contract_id (server decorates)
  partnership_id?: string | null;
  carrier_id: string;
  insurer_short?: string | null;
  title: string;
  title_en?: string;
  contract_type?: string;
  version?: string;
  effective_date?: string;
  expiry_date?: string;
  signatory_us?: string;
  signatory_them?: string;
  status: string;
  effective_status?: string; // server-computed from expiry_date (active/expiring/expired)
  auto_renew?: boolean;
  tags?: string[];
  tags_en?: string[];
  file_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRecord {
  contact_id: string;
  carrier_id: string;
  insurer_short?: string | null;
  partnership_id?: string | null;
  first_name?: string;
  last_name?: string;
  full_name: string;
  position?: string;
  department?: string;
  role?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  office_address?: string;
  is_active?: boolean;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettlementRecord {
  config_id: string;
  carrier_id: string;
  partnership_id: string;
  insurer_short?: string | null;
  cycle: string;
  bill_cutoff_day: number;
  payment_term_days: number;
  payment_method: string;
  billing_format: string;
  api_enabled: boolean;
  premium_collection: string;
  updated_by?: string | null;
  last_updated?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalRecord {
  renewal_id: string;
  partnership_id: string;
  carrier_id: string;
  insurer_short?: string | null;
  contract_id?: string | null;
  title: string;
  expiry_date: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  status: 'upcoming' | 'in-negotiation' | 'renewed' | 'expired';
  auto_renew: boolean;
  account_manager?: string | null;
  last_action?: string | null;
  last_action_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessRequestRecord {
  request_id: string;
  partnership_id?: string | null;
  carrier_id: string;
  insurer_short?: string | null;
  product_id?: string | null;
  product_name: string;
  product_code?: string | null;
  line_of_business?: string | null;
  target_states: string[];
  priority: 'high' | 'normal' | 'low';
  status: 'available' | 'requested' | 'in-review' | 'approved' | 'integrated' | 'rejected' | 'suspended';
  estimated_premium?: number | null;
  technical_reqs: string[];
  api_doc: boolean;
  test_completed: boolean;
  notes?: string | null;
  requested_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TerminateCooperationPayload {
  reason: string;
  note?: string;
  effectType?: 'immediate' | 'end-of-term' | 'scheduled';
  effectiveAt?: string; // ISO datetime when effectType=scheduled
}

export interface CooperationListParams {
  status?: string;
  carrier?: string;
  type?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CooperationListEnvelope {
  data: CooperationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CooperationOverview {
  activeCount: number;
  terminatedCount: number;
  coveredLineCount: number;
  renewalPendingCount: number;
  renewalUrgentCount: number;
}

export const cooperationApi = {
  // ── Cooperations ──
  async getList(params?: CooperationListParams): Promise<CooperationListEnvelope> {
    const response = await userApiClient.get('/cooperations', { params });
    return response.data;
  },

  async getOverview(): Promise<CooperationOverview> {
    const response = await userApiClient.get('/cooperations/overview');
    return response.data;
  },

  async getById(id: string): Promise<CooperationRecord> {
    const response = await userApiClient.get(`/cooperations/${id}`);
    return response.data;
  },

  async create(dto: any): Promise<CooperationRecord> {
    const response = await userApiClient.post('/cooperations', dto);
    return response.data;
  },

  async update(id: string, dto: any): Promise<CooperationRecord> {
    const response = await userApiClient.put(`/cooperations/${id}`, dto);
    return response.data;
  },

  async terminate(id: string, payload: TerminateCooperationPayload): Promise<CooperationRecord> {
    const response = await userApiClient.patch(`/cooperations/${id}/terminate`, payload);
    return response.data;
  },

  /** Soft delete; backend rejects statuses beyond Negotiating/PendingSign with 400. */
  async delete(id: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/cooperations/${id}`);
    return response.data;
  },

  /** Batch soft delete; non-deletable rows are skipped and counted. */
  async batchRemove(ids: string[]): Promise<{ deleted: number; skipped: number }> {
    const response = await userApiClient.delete('/cooperations/batch', { data: { ids } });
    return response.data;
  },

  // ── Contracts ──
  async getAllContracts(params?: { carrier?: string; status?: string; type?: string }): Promise<ContractRecord[]> {
    const response = await userApiClient.get('/contracts', { params });
    return response.data;
  },

  async getContracts(coopId: string): Promise<ContractRecord[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/contracts`);
    return response.data;
  },

  async addContract(coopId: string, dto: any): Promise<ContractRecord> {
    const response = await userApiClient.post(`/cooperations/${coopId}/contracts`, dto);
    return response.data;
  },

  async updateContract(coopId: string, contractId: string, dto: any): Promise<ContractRecord> {
    const response = await userApiClient.put(`/cooperations/${coopId}/contracts/${contractId}`, dto);
    return response.data;
  },

  async setContractStatus(coopId: string, contractId: string, status: string): Promise<ContractRecord> {
    const response = await userApiClient.patch(`/cooperations/${coopId}/contracts/${contractId}/status`, { status });
    return response.data;
  },

  async deleteContract(coopId: string, contractId: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/cooperations/${coopId}/contracts/${contractId}`);
    return response.data;
  },

  // ── Contacts ──
  async getAllContacts(params?: { carrier?: string }): Promise<ContactRecord[]> {
    const response = await userApiClient.get('/contacts', { params });
    return response.data;
  },

  async getContacts(coopId: string): Promise<ContactRecord[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/contacts`);
    return response.data;
  },

  async addContact(coopId: string, dto: any): Promise<ContactRecord> {
    const response = await userApiClient.post(`/cooperations/${coopId}/contacts`, dto);
    return response.data;
  },

  async updateContact(contactId: string, dto: any): Promise<ContactRecord> {
    const response = await userApiClient.put(`/contacts/${contactId}`, dto);
    return response.data;
  },

  async deleteContact(contactId: string): Promise<{ deleted: boolean }> {
    const response = await userApiClient.delete(`/contacts/${contactId}`);
    return response.data;
  },

  async setPrimaryContact(contactId: string): Promise<ContactRecord> {
    const response = await userApiClient.patch(`/contacts/${contactId}/primary`);
    return response.data;
  },

  // ── Settlement ──
  async getAllSettlementConfigs(): Promise<SettlementRecord[]> {
    const response = await userApiClient.get('/settlement-configs');
    return response.data;
  },

  async getSettlement(coopId: string): Promise<SettlementRecord | null> {
    const response = await userApiClient.get(`/cooperations/${coopId}/settlement`);
    return response.data;
  },

  async upsertSettlement(coopId: string, dto: any): Promise<SettlementRecord> {
    const response = await userApiClient.put(`/cooperations/${coopId}/settlement`, dto);
    return response.data;
  },

  // ── Renewals ──
  async getRenewals(params?: { status?: string }): Promise<RenewalRecord[]> {
    const response = await userApiClient.get('/renewals', { params });
    return response.data;
  },

  async createRenewal(coopId: string, dto: any): Promise<RenewalRecord> {
    const response = await userApiClient.post(`/cooperations/${coopId}/renewals`, dto);
    return response.data;
  },

  async updateRenewal(renewalId: string, dto: any): Promise<RenewalRecord> {
    const response = await userApiClient.patch(`/renewals/${renewalId}`, dto);
    return response.data;
  },

  async executeRenewal(renewalId: string, dto?: { new_expiry_date?: string }): Promise<RenewalRecord> {
    const response = await userApiClient.post(`/renewals/${renewalId}/execute`, dto ?? {});
    return response.data;
  },

  // ── Product access requests ──
  async getAccessRequests(params?: { status?: string; carrier?: string }): Promise<AccessRequestRecord[]> {
    const response = await userApiClient.get('/product-access-requests', { params });
    return response.data;
  },

  async createAccessRequest(dto: any): Promise<AccessRequestRecord> {
    const response = await userApiClient.post('/product-access-requests', dto);
    return response.data;
  },

  async updateAccessRequest(requestId: string, dto: { status?: string; notes?: string; api_doc?: boolean; test_completed?: boolean }): Promise<AccessRequestRecord> {
    const response = await userApiClient.patch(`/product-access-requests/${requestId}`, dto);
    return response.data;
  },

  // ── V1.0.15 续约直接登记（O6）──
  async getCoopRenewals(coopId: string): Promise<any[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/renewals`);
    return response.data;
  },
  async registerRenewal(coopId: string, dto: { new_expiry_date: string; new_contract_id?: string; note?: string }): Promise<any> {
    const response = await userApiClient.post(`/cooperations/${coopId}/renewals/register`, dto);
    return response.data;
  },

  // ── V1.0.15 合作-产品关联（C2）──
  async getProductLinks(coopId: string): Promise<any[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/products`);
    return response.data;
  },
  async addProductLinks(coopId: string, dto: { product_ids: string[]; effective_from?: string; remark?: string }): Promise<any> {
    const response = await userApiClient.post(`/cooperations/${coopId}/products`, dto);
    return response.data;
  },
  async removeProductLink(coopId: string, linkId: string): Promise<any> {
    const response = await userApiClient.delete(`/cooperations/${coopId}/products/${linkId}`);
    return response.data;
  },
  async updateProductLink(coopId: string, linkId: string, dto: { remark?: string; effective_from?: string }): Promise<any> {
    const response = await userApiClient.patch(`/cooperations/${coopId}/products/${linkId}`, dto);
    return response.data;
  },
};

// ─── Channel Product Authorization API (V1.0.11, doc ch.10) ─────────────

export interface ChannelOrg {
  channel_id: string;
  channel_name: string;
  channel_type: string | null;
  status: string;
  tier: string | null;
  parent_id: string | null;
  hq_state: string | null;
  licensed_states: string[];
  npn_code: string | null;
  manager_name: string | null;
}

export interface ChannelAuthorization {
  auth_id: string;
  channel_id: string;
  channel_name?: string;
  product_id: string;
  product_name?: string;
  product_code?: string;
  product_status?: string;
  carrier_id: string;
  carrier_name?: string;
  carrier_short?: string;
  line_of_business: string | null;
  authorized_states: string[];
  grant_type: 'permanent' | 'fixed' | 'trial';
  effective_date: string | null;
  expiration_date: string | null;
  status: 'active' | 'revoked';
  effective_status: 'active' | 'expiring' | 'expired' | 'revoked';
  revoked_at: string | null;
  revoke_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined issuance permission (doc 10.2), null until configured
  can_quote?: boolean | null;
  can_bind?: boolean | null;
  can_endorse?: boolean | null;
  can_renew?: boolean | null;
  can_surrender?: boolean | null;
  can_claim_report?: boolean | null;
  bind_mode?: 'direct' | 'underwrite' | 'forbidden' | null;
  limit_per_policy?: string | number | null;
  limit_monthly?: string | number | null;
  limit_quarterly?: string | number | null;
  over_limit_rule?: 'manual' | 'forbidden' | 'approval' | null;
}

export interface AuthorizationListParams {
  channelId?: string;
  carrierId?: string;
  productId?: string;
  status?: string;
  q?: string;
}

export interface CreateAuthorizationPayload {
  channel_id: string;
  product_id: string;
  authorized_states?: string[];
  grant_type?: 'permanent' | 'fixed' | 'trial';
  effective_date?: string;
  expiration_date?: string;
  permissions?: Record<string, unknown>;
}

export interface IssuancePermissionPayload {
  can_quote?: boolean;
  can_bind?: boolean;
  can_endorse?: boolean;
  can_renew?: boolean;
  can_surrender?: boolean;
  can_claim_report?: boolean;
  bind_mode?: 'direct' | 'underwrite' | 'forbidden';
  limit_per_policy?: number;
  limit_monthly?: number;
  limit_quarterly?: number;
  over_limit_rule?: 'manual' | 'forbidden' | 'approval';
}

export const channelAuthApi = {
  async getChannels(params?: { status?: string; q?: string }): Promise<ChannelOrg[]> {
    const res = await userApiClient.get('/channels', { params });
    return res.data;
  },

  async listAuthorizations(params?: AuthorizationListParams): Promise<ChannelAuthorization[]> {
    const res = await userApiClient.get('/channel-authorizations', { params });
    return res.data;
  },

  async getAuthorizationById(id: string): Promise<ChannelAuthorization> {
    const res = await userApiClient.get(`/channel-authorizations/${id}`);
    return res.data;
  },

  async createAuthorization(dto: CreateAuthorizationPayload): Promise<ChannelAuthorization> {
    const res = await userApiClient.post('/channel-authorizations', dto);
    return res.data;
  },

  async updateAuthorization(
    id: string,
    dto: Partial<Omit<CreateAuthorizationPayload, 'expiration_date'>> & { expiration_date?: string | null },
  ): Promise<ChannelAuthorization> {
    const res = await userApiClient.put(`/channel-authorizations/${id}`, dto);
    return res.data;
  },

  async setAuthorizationStatus(
    id: string, action: 'revoke' | 'renew',
    extra?: { reason?: string; expiration_date?: string },
  ): Promise<ChannelAuthorization> {
    const res = await userApiClient.patch(`/channel-authorizations/${id}/status`, { action, ...(extra ?? {}) });
    return res.data;
  },

  async upsertPermission(id: string, dto: IssuancePermissionPayload): Promise<ChannelAuthorization> {
    const res = await userApiClient.put(`/channel-authorizations/${id}/permissions`, dto);
    return res.data;
  },
};

// ─── Finance API ────────────────────────────────────────────────────────

export const financeApi = {
  // ── 总览统计 ──
  async getStats() {
    const res = await userApiClient.get('/finance/stats');
    return res.data;
  },

  // ── 原件归档（复用通用上传）──
  async uploadFile(file: File): Promise<{ originalName: string; storedName: string; size: number; mimetype: string; url: string }> {
    const form = new FormData();
    form.append('file', file);
    const res = await userApiClient.post('/uploads', form, {
      headers: { 'Content-Type': undefined },
      timeout: 60000,
    });
    return res.data;
  },

  // ── 上游账单（浏览器解析后 rows JSON 一次性提交）──
  async getBills(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/bills', { params });
    return res.data;
  },
  async importBill(dto: any) {
    const res = await userApiClient.post('/finance/bills/import', dto);
    return res.data;
  },
  /** V1.0.15 导入预检（不落库）：行分类 + 行内/库内重复识别。 */
  async precheckBill(dto: any) {
    const res = await userApiClient.post('/finance/bills/precheck', dto);
    return res.data;
  },
  /** V1.0.15 发起对账试算。 */
  async reconcileBill(id: string) {
    const res = await userApiClient.post(`/finance/bills/${id}/reconcile`, {});
    return res.data;
  },
  /** V1.0.15 封帐（无未关闭差异方可封帐）。 */
  async completeBill(id: string, dto?: { note?: string }) {
    const res = await userApiClient.post(`/finance/bills/${id}/complete`, dto ?? {});
    return res.data;
  },
  /** V1.0.15 主管解锁已封帐批次。 */
  async unlockBill(id: string) {
    const res = await userApiClient.post(`/finance/bills/${id}/unlock`, {});
    return res.data;
  },
  /** V1.0.15 作废批次（主管）。 */
  async voidBill(id: string) {
    const res = await userApiClient.post(`/finance/bills/${id}/void`, {});
    return res.data;
  },
  /** V1.0.16 批量作废批次（主管）。 */
  async batchVoidBills(ids: string[]) {
    const res = await userApiClient.post(`/finance/bills/void-batch`, { ids });
    return res.data;
  },
  async getBillDetail(id: string) {
    const res = await userApiClient.get(`/finance/bills/${id}`);
    return res.data;
  },
  async getBillLines(id: string, params?: Record<string, any>) {
    const res = await userApiClient.get(`/finance/bills/${id}/lines`, { params });
    return res.data;
  },
  async getBillErrors(id: string) {
    const res = await userApiClient.get(`/finance/bills/${id}/errors`);
    return res.data;
  },

  // ── 列映射模板 ──
  async getMappingTemplates(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/mapping-templates', { params });
    return res.data;
  },
  async saveMappingTemplate(dto: any) {
    const res = await userApiClient.post('/finance/mapping-templates', dto);
    return res.data;
  },
  async updateMappingTemplate(id: string, dto: any) {
    const res = await userApiClient.put(`/finance/mapping-templates/${id}`, dto);
    return res.data;
  },
  async deleteMappingTemplate(id: string) {
    const res = await userApiClient.delete(`/finance/mapping-templates/${id}`);
    return res.data;
  },

  // ── 我方对账单（导入 draft → 手工调整 → 确认）──
  async getStatements(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/statements', { params });
    return res.data;
  },
  async importStatement(dto: any) {
    const res = await userApiClient.post('/finance/statements/import', dto);
    return res.data;
  },
  async getStatementDetail(id: string) {
    const res = await userApiClient.get(`/finance/statements/${id}`);
    return res.data;
  },
  async getStatementLines(id: string, params?: Record<string, any>) {
    const res = await userApiClient.get(`/finance/statements/${id}/lines`, { params });
    return res.data;
  },
  async adjustStatementLine(id: string, lineId: string, dto: any) {
    const res = await userApiClient.put(`/finance/statements/${id}/lines/${lineId}`, dto);
    return res.data;
  },
  async confirmStatement(id: string) {
    const res = await userApiClient.post(`/finance/statements/${id}/confirm`, {});
    return res.data;
  },

  // ── 对账周期（run）──
  async startReconciliation(dto: any) {
    const res = await userApiClient.post('/finance/reconciliation/start', dto);
    return res.data;
  },
  async getRuns(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/reconciliation/runs', { params });
    return res.data;
  },
  async getRunDetail(id: string) {
    const res = await userApiClient.get(`/finance/reconciliation/runs/${id}`);
    return res.data;
  },

  // ── 差异轻量闭环 ──
  async getDiffs(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/diffs', { params });
    return res.data;
  },
  async getDiffStats(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/diffs/stats', { params });
    return res.data;
  },
  async diffAction(id: string, dto: any) {
    const res = await userApiClient.patch(`/finance/diffs/${id}/action`, dto);
    return res.data;
  },
  /** V1.0.15 差异单行重新试算（费率修正后自动关闭）。 */
  async recalcDiff(id: string) {
    const res = await userApiClient.patch(`/finance/diffs/${id}/recalc`, {});
    return res.data;
  },
  async addFollowUp(id: string, dto: any) {
    const res = await userApiClient.post(`/finance/diffs/${id}/follow-ups`, dto);
    return res.data;
  },

  // ── 保司结算主数据（只读）+ 财务 profile（可写）──
  async getInsurerConfigs() {
    const res = await userApiClient.get('/finance/insurer-configs');
    return res.data;
  },
  async upsertProfile(configId: string, dto: any) {
    const res = await userApiClient.put(`/finance/insurer-configs/${configId}`, dto);
    return res.data;
  },

  // ── 结算比例配置 ──
  async getCommissionRates(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/commission-rates', { params });
    return res.data;
  },
  async createCommissionRate(dto: any) {
    const res = await userApiClient.post('/finance/commission-rates', dto);
    return res.data;
  },
  async updateCommissionRate(id: string, dto: any) {
    const res = await userApiClient.put(`/finance/commission-rates/${id}`, dto);
    return res.data;
  },
  async deleteCommissionRate(id: string) {
    const res = await userApiClient.delete(`/finance/commission-rates/${id}`);
    return res.data;
  },
  /** V1.0.16 批量置失效佣金率。 */
  async batchDeleteCommissionRates(ids: string[]) {
    const res = await userApiClient.delete(`/finance/commission-rates/batch`, { data: { ids } });
    return res.data;
  },

  // ── V1.0.15 佣金率：批量导入 / 试算 / 版本 ──
  async precheckCommissionRates(dto: any) {
    const res = await userApiClient.post('/finance/commission-rates/import-precheck', dto);
    return res.data;
  },
  async importCommissionRates(dto: any) {
    const res = await userApiClient.post('/finance/commission-rates/import', dto);
    return res.data;
  },
  async trialCommissionRate(dto: any) {
    const res = await userApiClient.post('/finance/commission-rates/trial', dto);
    return res.data;
  },
  async getRateVersions(params: Record<string, any>) {
    const res = await userApiClient.get('/finance/commission-rates/versions', { params });
    return res.data;
  },
  async getRateVersionDiff(params: Record<string, any>) {
    const res = await userApiClient.get('/finance/commission-rates/version-diff', { params });
    return res.data;
  },
};

// ─── Analytics API ──────────────────────────────────────────────────────

export const analyticsApi = {
  async getOverview(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/overview', { params });
    return res.data;
  },

  async getProducts(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/products', { params });
    return res.data;
  },

  async getRegional(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/regional', { params });
    return res.data;
  },

  async getChannels(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/channels', { params });
    return res.data;
  },

  async getLossRatio(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/loss-ratio', { params });
    return res.data;
  },

  async getRenewal(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/renewal', { params });
    return res.data;
  },

  async exportReport(params?: Record<string, any>) {
    const res = await userApiClient.get('/analytics/export', { params });
    return res.data;
  },
};

