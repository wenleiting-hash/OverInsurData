/**
 * Cooperation React Query Hooks
 *
 * Provides typed hooks for cooperation CRUD + sub-resources (contracts, contacts, settlement)
 * with automatic cache invalidation. Follows the same pattern as departmentService.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cooperationApi,
  type CooperationRecord,
  type ContractRecord,
  type ContactRecord,
  type SettlementRecord,
} from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const cooperationKeys = {
  all: ['cooperations'] as const,
  list: (params?: { status?: string; carrier?: string }) => ['cooperations', 'list', params] as const,
  detail: (id: string) => ['cooperations', id] as const,
  contracts: (coopId: string) => ['cooperations', coopId, 'contracts'] as const,
  contacts: (coopId: string) => ['cooperations', coopId, 'contacts'] as const,
  settlement: (coopId: string) => ['cooperations', coopId, 'settlement'] as const,
};

// ─── Cooperation Query Hooks ─────────────────────────────────────────

/** Hook: Get cooperation list */
export function useGetCooperations(params?: { status?: string; carrier?: string }) {
  return useQuery<CooperationRecord[]>({
    queryKey: cooperationKeys.list(params),
    queryFn: () => cooperationApi.getList(params),
    staleTime: 30_000,
  });
}

/** Hook: Get single cooperation detail */
export function useGetCooperation(id: string | null) {
  return useQuery<CooperationRecord>({
    queryKey: cooperationKeys.detail(id!),
    queryFn: () => cooperationApi.getById(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

// ─── Cooperation Mutation Hooks ──────────────────────────────────────

/** Hook: Create new cooperation */
export function useCreateCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => cooperationApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
    },
  });
}

/** Hook: Update existing cooperation */
export function useUpdateCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => cooperationApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.detail(variables.id) });
    },
  });
}

/** Hook: Terminate cooperation */
export function useTerminateCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cooperationApi.terminate(id, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.detail(variables.id) });
    },
  });
}

// ─── Contracts Sub-resource Hooks ────────────────────────────────────

/** Hook: Get contracts for a cooperation */
export function useGetContracts(coopId: string | null) {
  return useQuery<ContractRecord[]>({
    queryKey: cooperationKeys.contracts(coopId!),
    queryFn: () => cooperationApi.getContracts(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

/** Hook: Add contract to cooperation */
export function useAddContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) => cooperationApi.addContract(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contracts(variables.coopId) });
    },
  });
}

// ─── Contacts Sub-resource Hooks ─────────────────────────────────────

/** Hook: Get contacts for a cooperation */
export function useGetContacts(coopId: string | null) {
  return useQuery<ContactRecord[]>({
    queryKey: cooperationKeys.contacts(coopId!),
    queryFn: () => cooperationApi.getContacts(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

/** Hook: Add contact to cooperation */
export function useAddContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) => cooperationApi.addContact(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contacts(variables.coopId) });
    },
  });
}

// ─── Settlement Sub-resource Hooks ───────────────────────────────────

/** Hook: Get settlement config for a cooperation */
export function useGetSettlement(coopId: string | null) {
  return useQuery<SettlementRecord | null>({
    queryKey: cooperationKeys.settlement(coopId!),
    queryFn: () => cooperationApi.getSettlement(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

/** Hook: Update settlement config */
export function useUpdateSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) => cooperationApi.updateSettlement(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.settlement(variables.coopId) });
    },
  });
}
