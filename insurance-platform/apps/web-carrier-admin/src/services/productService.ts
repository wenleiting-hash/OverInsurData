/**
 * Product React Query Hooks
 *
 * Provides typed hooks for product CRUD operations with automatic cache invalidation.
 * Follows the same pattern as departmentService.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productApi,
  type ProductRecord,
  type ProductListParams,
  type PaginatedResponse,
  type ProductRatePlan,
  type ProductStateDetail,
  type ProductUnderwritingRule,
  type ProductTrainingMaterial,
  type ProductPerformancePoint,
  type CreateUnderwritingRulePayload,
  type CreateTrainingMaterialPayload,
  type UpdateUnderwritingRulePayload,
  type UpdateTrainingMaterialPayload,
  type ToggleProductStatusPayload,
  type CreateRatePlanPayload,
  type UpdateRatePlanPayload,
} from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const productKeys = {
  all: ['products'] as const,
  list: (params?: ProductListParams) => ['products', 'list', params] as const,
  detail: (id: string) => ['products', id] as const,
  ratePlans: (id: string) => ['products', id, 'rate-plans'] as const,
  states: (id: string) => ['products', id, 'states'] as const,
  underwritingRules: (id: string) => ['products', id, 'underwriting-rules'] as const,
  trainingMaterials: (id: string) => ['products', id, 'training-materials'] as const,
  performance: (id: string) => ['products', id, 'performance'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────

/** Hook: Get paginated product list with filters */
export function useGetProducts(params?: ProductListParams) {
  return useQuery<PaginatedResponse<ProductRecord>>({
    queryKey: productKeys.list(params),
    queryFn: () => productApi.getList(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

/** Hook: Get single product detail */
export function useGetProduct(id: string | null) {
  return useQuery<ProductRecord>({
    queryKey: productKeys.detail(id!),
    queryFn: () => productApi.getById(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

// ─── Product Detail Sub-resource Hooks (5 tabs) ──────────────────────

/** Hook: Get rate plans for a product (rate plans tab) */
export function useGetRatePlans(id: string | null) {
  return useQuery<ProductRatePlan[]>({
    queryKey: productKeys.ratePlans(id!),
    queryFn: () => productApi.getRatePlans(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Hook: Get salable states for a product (states tab) */
export function useGetProductStates(id: string | null) {
  return useQuery<ProductStateDetail[]>({
    queryKey: productKeys.states(id!),
    queryFn: () => productApi.getStates(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Hook: Get underwriting rules for a product (underwriting tab) */
export function useGetUnderwritingRules(id: string | null) {
  return useQuery<ProductUnderwritingRule[]>({
    queryKey: productKeys.underwritingRules(id!),
    queryFn: () => productApi.getUnderwritingRules(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Hook: Get training materials for a product (training tab) */
export function useGetTrainingMaterials(id: string | null) {
  return useQuery<ProductTrainingMaterial[]>({
    queryKey: productKeys.trainingMaterials(id!),
    queryFn: () => productApi.getTrainingMaterials(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

/** Hook: Get monthly performance series for a product (performance tab) */
export function useGetProductPerformance(id: string | null) {
  return useQuery<ProductPerformancePoint[]>({
    queryKey: productKeys.performance(id!),
    queryFn: () => productApi.getPerformance(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

/** Hook: Create new product */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => productApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Hook: Update existing product */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => productApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/** Hook: Toggle product status with full delist/list payload (reason, scope, states, scheduled time). */
export function useToggleProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ToggleProductStatusPayload }) =>
      productApi.toggleStatus(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.states(variables.id) });
    },
  });
}

/** Hook: Suspend / resume a single salable state from the states tab. */
export function useSetProductStateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stateCode, status }: { id: string; stateCode: string; status: 'active' | 'suspended' }) =>
      productApi.setProductStateStatus(id, stateCode, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.states(variables.id) });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
    },
  });
}

/** Hook: Batch toggle product status (set multiple to Active/Paused/Inactive) */
export function useBatchToggleProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      productApi.batchToggleStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Hook: Soft-delete product */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

/** Hook: Batch soft-delete products */
export function useBatchDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => productApi.batchRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
}

// ─── Product Detail Sub-resource Mutations ───────────────────────

/** Hook: Create an underwriting rule (underwriting tab “add rule”). Invalidates only that
 *  product's rule list, so the other four tabs keep their cached data. */
export function useCreateUnderwritingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateUnderwritingRulePayload }) =>
      productApi.createUnderwritingRule(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.underwritingRules(variables.id) });
    },
  });
}

/** Hook: Create a training material (training tab “upload material”). */
export function useCreateTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateTrainingMaterialPayload }) =>
      productApi.createTrainingMaterial(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.trainingMaterials(variables.id) });
    },
  });
}

/** Hook: Edit an underwriting rule (pencil icon on the rule card). */
export function useUpdateUnderwritingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ruleId, dto }: { id: string; ruleId: string; dto: UpdateUnderwritingRulePayload }) =>
      productApi.updateUnderwritingRule(id, ruleId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.underwritingRules(variables.id) });
    },
  });
}

/** Hook: Set a rule active/inactive from the "更多" menu (生效 / 失效). */
export function useSetRuleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ruleId, status }: { id: string; ruleId: string; status: 'active' | 'inactive' | 'testing' }) =>
      productApi.setRuleStatus(id, ruleId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.underwritingRules(variables.id) });
    },
  });
}

/** Hook: Delete an underwriting rule (hard delete — the table has no soft-delete column). */
export function useDeleteUnderwritingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ruleId }: { id: string; ruleId: string }) =>
      productApi.deleteUnderwritingRule(id, ruleId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.underwritingRules(variables.id) });
    },
  });
}

/** Hook: Set a training material active/inactive from the "更多" menu (置为有效 / 置为无效). */
export function useSetMaterialStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, materialId, status }: { id: string; materialId: string; status: 'active' | 'inactive' }) =>
      productApi.setMaterialStatus(id, materialId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.trainingMaterials(variables.id) });
    },
  });
}

/** Hook: Edit training material metadata / replace its file (editing mode of upload modal). */
export function useUpdateTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, materialId, dto }: { id: string; materialId: string; dto: UpdateTrainingMaterialPayload }) =>
      productApi.updateTrainingMaterial(id, materialId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.trainingMaterials(variables.id) });
    },
  });
}

/** Hook: Delete a training material (also removes its stored file server-side). */
export function useDeleteTrainingMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, materialId }: { id: string; materialId: string }) =>
      productApi.deleteTrainingMaterial(id, materialId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.trainingMaterials(variables.id) });
    },
  });
}

/** Hook: Add a rate plan (rate-plans tab "新增费率方案"). */
export function useCreateRatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: CreateRatePlanPayload }) =>
      productApi.createRatePlan(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.ratePlans(variables.id) });
    },
  });
}

/** Hook: Edit a rate plan (rate-plans tab 编辑). */
export function useUpdateRatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planId, dto }: { id: string; planId: string; dto: UpdateRatePlanPayload }) =>
      productApi.updateRatePlan(id, planId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.ratePlans(variables.id) });
    },
  });
}

/** Hook: Delete a rate plan. */
export function useDeleteRatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) =>
      productApi.deleteRatePlan(id, planId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.ratePlans(variables.id) });
    },
  });
}
