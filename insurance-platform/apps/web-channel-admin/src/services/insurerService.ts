/**
 * Insurer React Query Hooks
 *
 * Provides typed hooks for insurer CRUD operations with automatic cache invalidation.
 * Follows the same pattern as departmentService.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  insurerApi,
  type InsurerRecord,
  type InsurerListParams,
  type CreateInsurerDto,
  type UpdateInsurerDto,
  type InsurerBatchImportResult,
  type BatchImportInsurersPayload,
  type PaginatedResponse,
} from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const insurerKeys = {
  all: ['insurers'] as const,
  list: (params?: InsurerListParams) => ['insurers', 'list', params] as const,
  detail: (id: string) => ['insurers', id] as const,
  duplicates: () => ['insurers', 'duplicates'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────

/** Hook: Get paginated insurer list with filters */
export function useGetInsurers(params?: InsurerListParams) {
  return useQuery<PaginatedResponse<InsurerRecord>>({
    queryKey: insurerKeys.list(params),
    queryFn: () => insurerApi.getList(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep previous data while refetching
  });
}

/** Hook: Get single insurer detail */
export function useGetInsurer(id: string | null) {
  return useQuery<InsurerRecord>({
    queryKey: insurerKeys.detail(id!),
    queryFn: () => insurerApi.getById(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Hook: Run duplicate check across insurers */
export function useInsurerDuplicateCheck() {
  return useQuery<any[]>({
    queryKey: insurerKeys.duplicates(),
    queryFn: () => insurerApi.duplicateCheck(),
    staleTime: 60_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

/** Hook: Create new insurer */
export function useCreateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateInsurerDto) => insurerApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}

/** Hook: Update existing insurer */
export function useUpdateInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateInsurerDto }) => insurerApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
      queryClient.invalidateQueries({ queryKey: insurerKeys.detail(variables.id) });
    },
  });
}

/** Hook: Toggle insurer status (active ↔ inactive) */
export function useToggleInsurerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insurerApi.toggleStatus(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
      queryClient.invalidateQueries({ queryKey: insurerKeys.detail(id) });
    },
  });
}

/** Hook: Batch toggle insurer status (set multiple to active or inactive) */
export function useBatchToggleInsurerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: 'active' | 'inactive' }) =>
      insurerApi.batchToggleStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}

/** Hook: Soft-delete insurer */
export function useDeleteInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insurerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}

/** Hook: Batch delete insurers */
export function useBatchDeleteInsurer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => insurerApi.batchRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}

/** Hook: Batch import insurers from an uploaded spreadsheet (valid rows only) */
export function useBatchImportInsurers() {
  const queryClient = useQueryClient();
  return useMutation<InsurerBatchImportResult, Error, BatchImportInsurersPayload>({
    mutationFn: (payload: BatchImportInsurersPayload) => insurerApi.batchImport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insurerKeys.all });
    },
  });
}
