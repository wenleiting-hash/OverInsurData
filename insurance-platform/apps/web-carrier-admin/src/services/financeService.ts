/**
 * Finance React Query Hooks
 *
 * Provides typed hooks for finance/settlement management operations.
 * Pure API driven — no mock fallback.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const financeKeys = {
  all: ['finance'] as const,
  stats: () => ['finance', 'stats'] as const,
  bills: (params?: any) => ['finance', 'bills', params] as const,
  billDetail: (id: string) => ['finance', 'bills', id] as const,
  billLines: (id: string, params?: any) => ['finance', 'bills', id, 'lines', params] as const,
  reconciliation: (params?: any) => ['finance', 'reconciliation', params] as const,
  diffs: (params?: any) => ['finance', 'diffs', params] as const,
  settlementConfigs: (params?: any) => ['finance', 'settlement-configs', params] as const,
  settlementHistory: (params?: any) => ['finance', 'settlement-history', params] as const,
  premiumReconciliation: (params?: any) => ['finance', 'premium-reconciliation', params] as const,
  premiumRecords: (params?: any) => ['finance', 'premium-records', params] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────

export function useFinanceStats() {
  return useQuery({
    queryKey: financeKeys.stats(),
    queryFn: () => financeApi.getStats(),
    staleTime: 30_000,
  });
}

export function useFinanceBills(params?: any) {
  return useQuery({
    queryKey: financeKeys.bills(params),
    queryFn: () => financeApi.getBills(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useBillDetail(id: string | null) {
  return useQuery({
    queryKey: financeKeys.billDetail(id!),
    queryFn: () => financeApi.getBillDetail(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useBillLines(id: string | null, params?: any) {
  return useQuery({
    queryKey: financeKeys.billLines(id!, params),
    queryFn: () => financeApi.getBillLines(id!, params),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useReconciliation(params?: any) {
  return useQuery({
    queryKey: financeKeys.reconciliation(params),
    queryFn: () => financeApi.getReconciliation(params),
    staleTime: 30_000,
  });
}

export function useDiffs(params?: any) {
  return useQuery({
    queryKey: financeKeys.diffs(params),
    queryFn: () => financeApi.getDiffs(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useSettlementConfigs(params?: any) {
  return useQuery({
    queryKey: financeKeys.settlementConfigs(params),
    queryFn: () => financeApi.getSettlementConfigs(params),
    staleTime: 30_000,
  });
}

export function useSettlementHistory(params?: any) {
  return useQuery({
    queryKey: financeKeys.settlementHistory(params),
    queryFn: () => financeApi.getSettlementHistory(params),
    staleTime: 30_000,
  });
}

export function usePremiumReconciliation(params?: any) {
  return useQuery({
    queryKey: financeKeys.premiumReconciliation(params),
    queryFn: () => financeApi.getPremiumReconciliation(params),
    staleTime: 30_000,
  });
}

export function usePremiumRecords(params?: any) {
  return useQuery({
    queryKey: financeKeys.premiumRecords(params),
    queryFn: () => financeApi.getPremiumRecords(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

export function useUploadBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.uploadBill(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'bills'] }); },
  });
}

export function useParseBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.parseBill(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'bills'] }); },
  });
}

export function useBatchReconcile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.batchReconcile(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
      qc.invalidateQueries({ queryKey: ['finance', 'reconciliation'] });
    },
  });
}

export function useUpdateDiff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financeApi.updateDiff(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'diffs'] }); },
  });
}

export function useDiffAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financeApi.handleDiffAction(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'diffs'] }); },
  });
}

export function useCreateSettlementConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.createSettlementConfig(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'settlement-configs'] }); },
  });
}

export function useUpdateSettlementConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financeApi.updateSettlementConfig(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'settlement-configs'] }); },
  });
}

export function useDeleteSettlementConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.deleteSettlementConfig(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance', 'settlement-configs'] }); },
  });
}
