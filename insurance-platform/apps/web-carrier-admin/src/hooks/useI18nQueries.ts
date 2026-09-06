/**
 * I18n & Permission React Query Hooks
 * 
 * Centralized query hooks for I18n translations, versions, and permission templates management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTranslations,
  getTranslationById,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  exportTranslations,
  getVersions,
  createVersion,
  rollbackVersion,
  getTemplates,
  createTemplate,
  updateTemplate,
  downloadTemplate,
  importTemplate,
  applyTemplate,
  duplicateTemplate,
  deleteTemplate,
} from '../lib/api-client';
import type { 
  TranslationEntry, 
  PaginationParams, 
  TranslationFilter, 
  CreateTranslationDTO, 
  UpdateTranslationDTO,
  I18nVersion,
  GetVersionsParams,
  CreateVersionDTO,
  RollbackRequest,
  VersionDiffStats,
  PermissionTemplate,
  GetTemplatesParams,
  CreateTemplateDTO,
  UpdateTemplateDTO,
  ImportTemplateResult,
  ApplyTemplateRequest,
  TemplateUsageStats
} from '../lib/api-client';

// =====================================================
// Queries - Query Keys
// =====================================================

/**
 * Query key factory for translations cache
 */
export const TRANSLATION_KEYS = {
  all: ['translations'] as const,
  list: (params?: PaginationParams & TranslationFilter) => [...TRANSLATION_KEYS.all, 'list', params] as const,
  details: (id: string) => [...TRANSLATION_KEYS.all, 'details', id] as const,
};

/**
 * Query key factory for versions cache
 */
export const VERSION_KEYS = {
  all: ['versions'] as const,
  list: (params?: GetVersionsParams) => [...VERSION_KEYS.all, 'list', params] as const,
  details: (id: string) => [...VERSION_KEYS.all, 'details', id] as const,
};

/**
 * Query key factory for permission templates cache
 */
export const TEMPLATE_KEYS = {
  all: ['templates'] as const,
  list: (params?: GetTemplatesParams) => [...TEMPLATE_KEYS.all, 'list', params] as const,
  details: (id: string) => [...TEMPLATE_KEYS.all, 'details', id] as const,
};

// =====================================================
// Queries - Fetch Functions
// =====================================================

/**
 * Hook to fetch paginated translations with filters
 */
export function usePaginatedTranslations(params: PaginationParams & TranslationFilter) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;

  return useQuery({
    queryKey: TRANSLATION_KEYS.list(params),
    queryFn: async () => {
      const result = await getTranslations({ ...params, page, pageSize });
      return {
        data: result.data,
        total: result.total,
        pages: result.pages,
        currentPage: result.page,
        pageSize: result.pageSize,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch single translation by ID
 */
export function useTranslationById(id: string) {
  return useQuery({
    queryKey: TRANSLATION_KEYS.details(id),
    queryFn: async () => getTranslationById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all versions
 */
export function useVersions(params?: GetVersionsParams) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;

  return useQuery({
    queryKey: VERSION_KEYS.list(params),
    queryFn: async () => {
      const result = await getVersions({ ...params, page, pageSize });
      return {
        data: result.data,
        total: result.total,
        pages: result.pages,
        currentPage: result.page,
        pageSize: result.pageSize,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get the latest published version
 */
export function useLatestPublishedVersion() {
  return useQuery({
    queryKey: VERSION_KEYS.all,
    queryFn: async () => {
      const { data } = await getVersions({ page: 1, pageSize: 100 });
      return data.find(v => v.ovwrIsPublished) || null;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to fetch all permission templates
 */
export function useTemplates(params?: GetTemplatesParams) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;

  return useQuery({
    queryKey: TEMPLATE_KEYS.list(params),
    queryFn: async () => {
      const result = await getTemplates({ ...params, page, pageSize });
      return {
        data: result.data,
        total: result.total,
        pages: result.pages,
        currentPage: result.page,
        pageSize: result.pageSize,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch single template by ID
 */
export function useTemplateById(id: string) {
  return useQuery({
    queryKey: TEMPLATE_KEYS.details(id),
    queryFn: async () => {
      const { data } = await getTemplates({ page: 1, pageSize: 100 });
      return data.find(t => t.ovwrTemplateId === id) || null;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// =====================================================
// Mutations - Translations
// =====================================================

/**
 * Hook for creating new translation
 */
export function useCreateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTranslationDTO) => createTranslation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.all });
    },
  });
}

/**
 * Hook for updating existing translation
 */
export function useUpdateTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTranslationDTO }) =>
      updateTranslation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.details(variables.id) });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.all });
    },
  });
}

/**
 * Hook for deleting translation
 */
export function useDeleteTranslation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deleteTranslation(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: TRANSLATION_KEYS.details(id) });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.all });
    },
  });
}

/**
 * Hook for exporting translations
 */
export function useExportTranslations() {
  return useMutation({
    mutationFn: async ({ namespace, format }: { namespace: string; format: 'json' | 'yaml' | 'csv' }): Promise<Blob> => {
      return exportTranslations(namespace, format);
    },
    onSuccess: (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      link.download = `i18n-export-${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

// =====================================================
// Mutations - Versions
// =====================================================

/**
 * Hook for creating a new version (publish)
 */
export function useCreateVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVersionDTO) => createVersion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERSION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.all });
    },
  });
}

/**
 * Hook for rollback to specific version
 */
export function useRollbackVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RollbackRequest) => rollbackVersion(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VERSION_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSLATION_KEYS.all });
    },
  });
}

// =====================================================
// Mutations - Templates
// =====================================================

/**
 * Hook for creating template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateDTO) => createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
}

/**
 * Hook for updating template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTemplateDTO }) =>
      updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.details(variables.id) });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
}

/**
 * Hook for downloading template file
 */
export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (id: string) => downloadTemplate(id),
    onSuccess: (blob: Blob, templateId: string) => {
      // Download handled in view layer
    },
  });
}

/**
 * Hook for importing templates
 */
export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => importTemplate(file),
    onSuccess: (result: ImportTemplateResult) => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
      return result;
    },
  });
}

/**
 * Hook for applying template to roles
 */
export function useApplyTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ApplyTemplateRequest) => applyTemplate(request),
    onSuccess: (result) => {
      console.log(`Template applied to ${result.appliedTo} roles`);
    },
  });
}

/**
 * Hook for duplicating template
 */
export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName?: string }) =>
      duplicateTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
}

/**
 * Hook for deleting template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => deleteTemplate(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: TEMPLATE_KEYS.details(id) });
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
}
