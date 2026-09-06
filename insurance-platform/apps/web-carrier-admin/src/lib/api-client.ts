/**
 * I18n API Client
 * 
 * Provides TypeScript-typed methods for interacting with i18n backend APIs
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Main i18n API client instance
 */
export const i18nApi = axios.create({
  baseURL: `${API_BASE_URL}/ovwr/i18n`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
i18nApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
i18nApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Fetch all translations with pagination and filters
 */
export interface GetTranslationsParams {
  namespace?: string;
  key?: string;
  language?: string;
  type?: string;
  module?: string;
  section?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface TranslationEntry {
  ovwrTranslationId: string;
  ovwrNamespace: string;
  ovwrKey: string;
  ovwrLanguageCode: string;
  ovwrTranslation: string;
  ovwrType: string;
  ovwrModule: string;
  ovwrSection: string;
  ovwrStatus: string;
  ovwrVersion: number;
  ovwrCreatedAt: Date;
  ovwrUpdatedAt: Date;
}

export interface TranslationsResponse {
  data: TranslationEntry[];
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}

// Type aliases for hooks
export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

export type TranslationFilter = {
  namespace?: string;
  key?: string;
  language?: string;
  type?: string;
  module?: string;
  section?: string;
  status?: string;
};

export async function getTranslations(params: GetTranslationsParams): Promise<TranslationsResponse> {
  const response = await i18nApi.get('/translations', { params });
  return response.data;
}

/**
 * Fetch a single translation by ID
 */
export async function getTranslationById(id: string): Promise<TranslationEntry> {
  const response = await i18nApi.get(`/translations/${id}`);
  return response.data;
}

/**
 * Create a new translation entry
 */
export interface CreateTranslationDTO {
  ovwrNamespace: string;
  ovwrKey: string;
  ovwrLanguageCode: string;
  ovwrTranslation: string;
  ovwrType: string;
  ovwrModule: string;
  ovwrSection: string;
}

export async function createTranslation(data: CreateTranslationDTO): Promise<TranslationEntry> {
  const response = await i18nApi.post('/translations', data);
  return response.data;
}

/**
 * Update an existing translation entry
 */
export interface UpdateTranslationDTO extends Partial<CreateTranslationDTO> {
  ovwrVersion: number;
}

export async function updateTranslation(
  id: string,
  data: UpdateTranslationDTO
): Promise<TranslationEntry> {
  const response = await i18nApi.put(`/translations/${id}`, data);
  return response.data;
}

/**
 * Delete a translation entry (soft delete)
 */
export async function deleteTranslation(id: string): Promise<void> {
  await i18nApi.delete(`/translations/${id}`);
}

/**
 * Export translations to file
 */
export type ExportFormat = 'json' | 'yaml' | 'csv';

export async function exportTranslations(namespace: string, format: ExportFormat): Promise<Blob> {
  const response = await i18nApi.get('/translations/export', {
    params: { namespace, format },
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Import translations from file
 */
export interface ImportResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ line: number; message: string }>;
}

export async function importTranslations(file: File, namespace: string): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('namespace', namespace);

  const response = await i18nApi.post('/translations/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// =====================================================
// Version Management APIs
// =====================================================

/**
 * Interface for I18n version
 */
export interface I18nVersion {
  ovwrVersionId: string;
  ovwrVersionNumber: string;
  ovwrDescription: string;
  ovwrCreatedBy: string;
  ovwrCreatedAt: Date;
  ovwrIsPublished: boolean;
  ovwrTranslationCount: number;
}

/**
 * Fetch all versions with pagination
 */
export interface GetVersionsParams {
  page?: number;
  pageSize?: number;
}

export async function getVersions(params?: GetVersionsParams): Promise<{ 
  data: I18nVersion[];
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}> {
  const response = await i18nApi.get('/versions', { params });
  return response.data;
}

/**
 * Create a new version (publish operation)
 */
export interface CreateVersionDTO {
  ovwrVersionNumber: string;
  ovwrDescription?: string;
}

export async function createVersion(data: CreateVersionDTO): Promise<I18nVersion> {
  const response = await i18nApi.post('/versions', data);
  return response.data;
}

/**
 * Rollback to a specific version
 */
export interface RollbackRequest {
  targetVersionId: string;
  reason: string;
}

export async function rollbackVersion(request: RollbackRequest): Promise<I18nVersion> {
  const response = await i18nApi.post('/versions/rollback', request);
  return response.data;
}

/**
 * Get version diff statistics
 */
export interface VersionDiffStats {
  addedCount: number;
  modifiedCount: number;
  deletedCount: number;
  details: Array<{
    key: string;
    action: 'added' | 'modified' | 'deleted';
    oldValue?: string;
    newValue?: string;
  }>;
}

// =====================================================
// Permission Template Management APIs
// =====================================================

/**
 * Interface for permission template
 */
export interface PermissionTemplate {
  ovwrTemplateId: string;
  ovwrTemplateName: string;
  ovwrTemplateCode: string;
  ovwrDescription?: string;
  ovwrVersionNumber: string;
  ovwrFormat: 'json' | 'yaml';
  ovwrContent: string; // JSON/YAML string
  ovwrRoleCount: number;
  ovwrCreatedBy: string;
  ovwrCreatedAt: Date;
  ovwrUpdatedAt: Date;
}

/**
 * Fetch all templates with pagination
 */
export interface GetTemplatesParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  format?: 'json' | 'yaml';
  status?: 'active' | 'inactive';
}

export async function getTemplates(params?: GetTemplatesParams): Promise<{ 
  data: PermissionTemplate[];
  total: number;
  pages: number;
  page: number;
  pageSize: number;
}> {
  const response = await i18nApi.get('/permission-templates', { params });
  return response.data;
}

/**
 * Create a new template
 */
export interface CreateTemplateDTO {
  ovwrTemplateName: string;
  ovwrTemplateCode: string;
  ovwrDescription?: string;
  ovwrFormat: 'json' | 'yaml';
  ovwrContent: string;
}

export async function createTemplate(data: CreateTemplateDTO): Promise<PermissionTemplate> {
  const response = await i18nApi.post('/permission-templates', data);
  return response.data;
}

/**
 * Update an existing template
 */
export interface UpdateTemplateDTO extends Partial<CreateTemplateDTO> {
  ovwrVersionNumber: number;
}

export async function updateTemplate(
  id: string,
  data: UpdateTemplateDTO
): Promise<PermissionTemplate> {
  const response = await i18nApi.put(`/permission-templates/${id}`, data);
  return response.data;
}

/**
 * Download template file (JSON/YAML)
 */
export async function downloadTemplate(id: string): Promise<Blob> {
  const response = await i18nApi.get(`/permission-templates/${id}/download`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Import template from file
 */
export interface ImportTemplateResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ line: number; message: string }>;
}

export async function importTemplate(file: File, namespace?: string): Promise<ImportTemplateResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (namespace) {
    formData.append('namespace', namespace);
  }

  const response = await i18nApi.post('/permission-templates/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

/**
 * Apply template to roles
 */
export interface ApplyTemplateRequest {
  templateId: string;
  roleIds: string[];
}

export async function applyTemplate(request: ApplyTemplateRequest): Promise<{ success: boolean; appliedTo: number }> {
  const response = await i18nApi.post('/permission-templates/apply', request);
  return response.data;
}

/**
 * Duplicate/Copy template
 */
export async function duplicateTemplate(id: string, newName?: string): Promise<PermissionTemplate> {
  const response = await i18nApi.post(`/permission-templates/${id}/duplicate`, { newName });
  return response.data;
}

/**
 * Delete template
 */
export async function deleteTemplate(id: string): Promise<void> {
  await i18nApi.delete(`/permission-templates/${id}`);
}

/**
 * Get template usage statistics
 */
export interface TemplateUsageStats {
  totalCount: number;
  activeRoles: number;
  recentImports: Array<{
    templateName: string;
    importDate: Date;
    user: string;
  }>;
}
