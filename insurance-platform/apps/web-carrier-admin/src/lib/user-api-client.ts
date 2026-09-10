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

export interface InsurerRecord {
  id?: string;
  carrier_id?: string;
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
  lines?: string[];
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
  lines?: string[];
  founded_year?: number;
  website?: string;
  coop_type?: string;
  contract_expiry?: string;
  channel_count?: number;
  product_count?: number;
}

export const insurerApi = {
  async getList(params?: InsurerListParams): Promise<PaginatedResponse<InsurerRecord>> {
    const response = await userApiClient.get('/insurers', { params });
    return response.data;
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

/** Payload for PATCH /products/:id/underwriting-rules/:ruleId — every field optional so the edit
 *  dialog can send only what changed; the backend writes just the keys present. */
export type UpdateUnderwritingRulePayload = Partial<CreateUnderwritingRulePayload>;

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

  async toggleStatus(id: string): Promise<ProductRecord> {
    const response = await userApiClient.patch(`/products/${id}/toggle-status`);
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
      headers: { 'Content-Type': 'multipart/form-data' },
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

export interface CooperationRecord {
  id: string;
  carrier_id: string;
  carrier_name?: string;
  cooperation_type: string;
  status: string;
  commission_tier?: string;
  notes?: string;
  notes_en?: string;
  settlement_method: string;
  settlement_cycle: number;
  premium_collection_method: string;
  premium_settlement_cycle: string;
  effective_date: string;
  expiration_date?: string;
  product_scope?: any;
  state_scope?: string[];
  contract_file?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ContractRecord {
  id: string;
  cooperation_id: string;
  contract_name: string;
  contract_number: string;
  contract_type: string;
  sign_date?: string;
  effective_date: string;
  expiration_date: string;
  duration_years?: number;
  status: string;
  workflow_stage?: string;
  reminder_thresholds?: any;
  file_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ContactRecord {
  id: string;
  carrier_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  position: string;
  department: string;
  role: string;
  email: string;
  phone: string;
  mobile_phone?: string;
  office_address?: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettlementRecord {
  id: string;
  carrier_id: string;
  commission_settlement_cycle: string;
  bill_cut_off_day: number;
  reconciliation_deadline: number;
  payment_term_days: number;
  premium_collection_method: string;
  premium_settlement_cycle: string;
  settlement_currency: string;
  reconciliation_method: string;
  bill_format: string;
  commission_tax_rate?: number;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export const cooperationApi = {
  async getList(params?: { status?: string; carrier?: string }): Promise<CooperationRecord[]> {
    const response = await userApiClient.get('/cooperations', { params });
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

  async terminate(id: string, reason: string): Promise<CooperationRecord> {
    const response = await userApiClient.patch(`/cooperations/${id}/terminate`, { reason });
    return response.data;
  },

  // ── Contracts sub-resource ──
  async getContracts(coopId: string): Promise<ContractRecord[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/contracts`);
    return response.data;
  },

  async addContract(coopId: string, dto: any): Promise<ContractRecord> {
    const response = await userApiClient.post(`/cooperations/${coopId}/contracts`, dto);
    return response.data;
  },

  // ── Contacts sub-resource ──
  async getContacts(coopId: string): Promise<ContactRecord[]> {
    const response = await userApiClient.get(`/cooperations/${coopId}/contacts`);
    return response.data;
  },

  async addContact(coopId: string, dto: any): Promise<ContactRecord> {
    const response = await userApiClient.post(`/cooperations/${coopId}/contacts`, dto);
    return response.data;
  },

  // ── Settlement sub-resource ──
  async getSettlement(coopId: string): Promise<SettlementRecord | null> {
    const response = await userApiClient.get(`/cooperations/${coopId}/settlement`);
    return response.data;
  },

  async updateSettlement(coopId: string, dto: any): Promise<SettlementRecord> {
    const response = await userApiClient.put(`/cooperations/${coopId}/settlement`, dto);
    return response.data;
  },
};

// ─── Compliance API ─────────────────────────────────────────────────────

export const complianceApi = {
  async getDashboard() {
    const res = await userApiClient.get('/compliance/dashboard');
    return res.data;
  },

  async getRules(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/rules', { params });
    return res.data;
  },

  async createRule(dto: any) {
    const res = await userApiClient.post('/compliance/rules', dto);
    return res.data;
  },

  async updateRule(id: string, dto: any) {
    const res = await userApiClient.put(`/compliance/rules/${id}`, dto);
    return res.data;
  },

  async deleteRule(id: string) {
    const res = await userApiClient.delete(`/compliance/rules/${id}`);
    return res.data;
  },

  async toggleRule(id: string) {
    const res = await userApiClient.patch(`/compliance/rules/${id}/toggle`);
    return res.data;
  },

  async getOFACList(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/ofac', { params });
    return res.data;
  },

  async screenOFAC(dto: any) {
    const res = await userApiClient.post('/compliance/ofac/screen', dto);
    return res.data;
  },

  async reviewOFAC(id: string, dto: any) {
    const res = await userApiClient.put(`/compliance/ofac/${id}/review`, dto);
    return res.data;
  },

  async getInterceptions(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/interceptions', { params });
    return res.data;
  },

  async resolveInterception(id: string, dto: any) {
    const res = await userApiClient.put(`/compliance/interceptions/${id}/resolve`, dto);
    return res.data;
  },

  async getLicenses(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/licenses', { params });
    return res.data;
  },

  async verifyLicenses(dto: any) {
    const res = await userApiClient.post('/compliance/licenses/verify', dto);
    return res.data;
  },

  async getLicenseReminders(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/license-reminders', { params });
    return res.data;
  },

  async getReports(params?: Record<string, any>) {
    const res = await userApiClient.get('/compliance/reports', { params });
    return res.data;
  },

  async generateReport(dto: any) {
    const res = await userApiClient.post('/compliance/reports/generate', dto);
    return res.data;
  },
};

// ─── Finance API ────────────────────────────────────────────────────────

export const financeApi = {
  async getStats() {
    const res = await userApiClient.get('/finance/stats');
    return res.data;
  },

  async getBills(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/bills', { params });
    return res.data;
  },

  async uploadBill(dto: any) {
    const res = await userApiClient.post('/finance/bills/upload', dto);
    return res.data;
  },

  async getBillDetail(id: string) {
    const res = await userApiClient.get(`/finance/bills/${id}`);
    return res.data;
  },

  async parseBill(id: string) {
    const res = await userApiClient.post(`/finance/bills/${id}/parse`);
    return res.data;
  },

  async getBillLines(id: string, params?: Record<string, any>) {
    const res = await userApiClient.get(`/finance/bills/${id}/lines`, { params });
    return res.data;
  },

  async getReconciliation(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/reconciliation', { params });
    return res.data;
  },

  async batchReconcile(dto: any) {
    const res = await userApiClient.post('/finance/reconciliation/batch', dto);
    return res.data;
  },

  async getDiffs(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/diffs', { params });
    return res.data;
  },

  async updateDiff(id: string, dto: any) {
    const res = await userApiClient.put(`/finance/diffs/${id}`, dto);
    return res.data;
  },

  async handleDiffAction(id: string, dto: any) {
    const res = await userApiClient.patch(`/finance/diffs/${id}/action`, dto);
    return res.data;
  },

  async getSettlementConfigs(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/settlement-configs', { params });
    return res.data;
  },

  async createSettlementConfig(dto: any) {
    const res = await userApiClient.post('/finance/settlement-configs', dto);
    return res.data;
  },

  async updateSettlementConfig(id: string, dto: any) {
    const res = await userApiClient.put(`/finance/settlement-configs/${id}`, dto);
    return res.data;
  },

  async deleteSettlementConfig(id: string) {
    const res = await userApiClient.delete(`/finance/settlement-configs/${id}`);
    return res.data;
  },

  async getSettlementHistory(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/settlement-history', { params });
    return res.data;
  },

  async getPremiumReconciliation(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/premium-reconciliation', { params });
    return res.data;
  },

  async getPremiumRecords(params?: Record<string, any>) {
    const res = await userApiClient.get('/finance/premium-records', { params });
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

