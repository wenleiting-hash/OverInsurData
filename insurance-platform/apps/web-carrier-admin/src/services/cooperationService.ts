/**
 * Cooperation React Query Hooks — V1.0.10
 *
 * Cooperations + contracts + contacts + settlement configs + renewal tasks +
 * product access requests. All write hooks invalidate both the cross-cutting
 * list view and the owning cooperation's scoped view.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cooperationApi,
  type CooperationRecord,
  type CooperationListParams,
  type CooperationListEnvelope,
  type CooperationOverview,
  type ContractRecord,
  type ContactRecord,
  type SettlementRecord,
  type RenewalRecord,
  type AccessRequestRecord,
  type TerminateCooperationPayload,
} from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const cooperationKeys = {
  all: ['cooperations'] as const,
  list: (params?: CooperationListParams) => ['cooperations', 'list', params] as const,
  overview: ['cooperations', 'overview'] as const,
  detail: (id: string) => ['cooperations', id] as const,
  contractsAll: (params?: { carrier?: string; status?: string; type?: string }) =>
    ['cooperations', 'contracts', params] as const,
  contracts: (coopId: string) => ['cooperations', coopId, 'contracts'] as const,
  contactsAll: (params?: { carrier?: string }) => ['cooperations', 'contacts', params] as const,
  contacts: (coopId: string) => ['cooperations', coopId, 'contacts'] as const,
  settlementAll: ['cooperations', 'settlement-configs'] as const,
  settlement: (coopId: string) => ['cooperations', coopId, 'settlement'] as const,
  renewals: (params?: { status?: string }) => ['cooperations', 'renewals', params] as const,
  accessRequests: (params?: { status?: string; carrier?: string }) =>
    ['cooperations', 'access-requests', params] as const,
};

// ─── Cooperations ────────────────────────────────────────────────────

export function useGetCooperations(params?: CooperationListParams) {
  return useQuery<CooperationListEnvelope>({
    queryKey: cooperationKeys.list(params),
    queryFn: () => cooperationApi.getList(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev, // keep page/filter UX smooth while refetching
  });
}

export function useGetCooperationOverview() {
  return useQuery<CooperationOverview>({
    queryKey: cooperationKeys.overview,
    queryFn: () => cooperationApi.getOverview(),
    staleTime: 30_000,
  });
}

export function useGetCooperation(id: string | null) {
  return useQuery<CooperationRecord>({
    queryKey: cooperationKeys.detail(id!),
    queryFn: () => cooperationApi.getById(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useCreateCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => cooperationApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
    },
  });
}

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

export function useTerminateCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TerminateCooperationPayload }) =>
      cooperationApi.terminate(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.detail(variables.id) });
    },
  });
}

/** V1.0.12: soft delete, Negotiating/PendingSign only (backend enforces). */
export function useDeleteCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => cooperationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
    },
  });
}

/** V1.0.12: batch soft delete; backend skips rows beyond Negotiating/PendingSign. */
export function useBatchDeleteCooperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => cooperationApi.batchRemove(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
    },
  });
}

// ─── Contracts ───────────────────────────────────────────────────────

export function useGetAllContracts(params?: { carrier?: string; status?: string; type?: string }) {
  return useQuery<ContractRecord[]>({
    queryKey: cooperationKeys.contractsAll(params),
    queryFn: () => cooperationApi.getAllContracts(params),
    staleTime: 30_000,
  });
}

export function useGetContracts(coopId: string | null) {
  return useQuery<ContractRecord[]>({
    queryKey: cooperationKeys.contracts(coopId!),
    queryFn: () => cooperationApi.getContracts(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

export function useAddContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) => cooperationApi.addContract(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contracts(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, contractId, dto }: { coopId: string; contractId: string; dto: any }) =>
      cooperationApi.updateContract(coopId, contractId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contracts(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
    },
  });
}

export function useSetContractStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, contractId, status }: { coopId: string; contractId: string; status: string }) =>
      cooperationApi.setContractStatus(coopId, contractId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contracts(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contracts'] });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, contractId }: { coopId: string; contractId: string }) =>
      cooperationApi.deleteContract(coopId, contractId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contracts(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contracts'] });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
    },
  });
}

// ─── Contacts ────────────────────────────────────────────────────────

export function useGetAllContacts(params?: { carrier?: string }) {
  return useQuery<ContactRecord[]>({
    queryKey: cooperationKeys.contactsAll(params),
    queryFn: () => cooperationApi.getAllContacts(params),
    staleTime: 30_000,
  });
}

export function useGetContacts(coopId: string | null) {
  return useQuery<ContactRecord[]>({
    queryKey: cooperationKeys.contacts(coopId!),
    queryFn: () => cooperationApi.getContacts(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

export function useAddContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) => cooperationApi.addContact(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.contacts(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contacts'] });
    },
  });
}

/**
 * Contact edit/set-primary/delete carry only contactId, so invalidate every
 * cooperation-scoped contacts query via predicate (key shape ['cooperations', coopId, 'contacts'])
 * in addition to the flat /contacts list — otherwise the detail panel stays stale.
 */
function invalidateScopedContacts(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    predicate: q => {
      const k = q.queryKey as unknown[];
      return k?.[0] === 'cooperations' && k[2] === 'contacts';
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, dto }: { contactId: string; dto: any }) =>
      cooperationApi.updateContact(contactId, dto),
    onSuccess: () => {
      invalidateScopedContacts(queryClient);
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contacts'] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId }: { contactId: string }) => cooperationApi.deleteContact(contactId),
    onSuccess: () => {
      invalidateScopedContacts(queryClient);
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contacts'] });
    },
  });
}

export function useSetPrimaryContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId }: { contactId: string }) => cooperationApi.setPrimaryContact(contactId),
    onSuccess: () => {
      invalidateScopedContacts(queryClient);
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contacts'] });
    },
  });
}

// ─── Settlement ──────────────────────────────────────────────────────

export function useGetAllSettlementConfigs() {
  return useQuery<SettlementRecord[]>({
    queryKey: cooperationKeys.settlementAll,
    queryFn: () => cooperationApi.getAllSettlementConfigs(),
    staleTime: 30_000,
  });
}

export function useGetSettlement(coopId: string | null) {
  return useQuery<SettlementRecord | null>({
    queryKey: cooperationKeys.settlement(coopId!),
    queryFn: () => cooperationApi.getSettlement(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

export function useUpsertSettlement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) =>
      cooperationApi.upsertSettlement(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: cooperationKeys.settlement(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.settlementAll });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.detail(variables.coopId) });
    },
  });
}

// ─── Renewals ────────────────────────────────────────────────────────

export function useGetRenewals(params?: { status?: string }) {
  return useQuery<RenewalRecord[]>({
    queryKey: cooperationKeys.renewals(params),
    queryFn: () => cooperationApi.getRenewals(params),
    staleTime: 30_000,
  });
}

export function useCreateRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: { coopId: string; dto: any }) =>
      cooperationApi.createRenewal(coopId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
    },
  });
}

export function useUpdateRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ renewalId, dto }: { renewalId: string; dto: any }) =>
      cooperationApi.updateRenewal(renewalId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
    },
  });
}

export function useExecuteRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ renewalId, dto }: { renewalId: string; dto?: { new_expiry_date?: string } }) =>
      cooperationApi.executeRenewal(renewalId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'renewals'] });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'contracts'] });
    },
  });
}

// ─── Product access requests ─────────────────────────────────────────

export function useGetAccessRequests(params?: { status?: string; carrier?: string }) {
  return useQuery<AccessRequestRecord[]>({
    queryKey: cooperationKeys.accessRequests(params),
    queryFn: () => cooperationApi.getAccessRequests(params),
    staleTime: 30_000,
  });
}

export function useCreateAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => cooperationApi.createAccessRequest(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'access-requests'] });
    },
  });
}

export function useUpdateAccessRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, dto }: {
      requestId: string;
      dto: { status?: string; notes?: string; api_doc?: boolean; test_completed?: boolean };
    }) => cooperationApi.updateAccessRequest(requestId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', 'access-requests'] });
    },
  });
}

// ─── V1.0.15 续约直接登记（O6）───────────────────────────────────────

export function useGetCoopRenewals(coopId: string | null) {
  return useQuery<any[]>({
    queryKey: ['cooperations', coopId, 'renewal-records'],
    queryFn: () => cooperationApi.getCoopRenewals(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

export function useRegisterRenewal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: {
      coopId: string;
      dto: { new_expiry_date: string; new_contract_id?: string; note?: string };
    }) => cooperationApi.registerRenewal(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', variables.coopId, 'renewal-records'] });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.detail(variables.coopId) });
      queryClient.invalidateQueries({ queryKey: ['cooperations', variables.coopId, 'contracts'] });
      queryClient.invalidateQueries({ queryKey: cooperationKeys.all });
    },
  });
}

// ─── V1.0.15 合作-产品关联（C2）──────────────────────────────────────

export function useGetProductLinks(coopId: string | null) {
  return useQuery<any[]>({
    queryKey: ['cooperations', coopId, 'product-links'],
    queryFn: () => cooperationApi.getProductLinks(coopId!),
    enabled: !!coopId,
    staleTime: 30_000,
  });
}

export function useAddProductLinks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, dto }: {
      coopId: string;
      dto: { product_ids: string[]; effective_from?: string; remark?: string };
    }) => cooperationApi.addProductLinks(coopId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', variables.coopId, 'product-links'] });
    },
  });
}

export function useRemoveProductLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, linkId }: { coopId: string; linkId: string }) =>
      cooperationApi.removeProductLink(coopId, linkId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', variables.coopId, 'product-links'] });
    },
  });
}

export function useUpdateProductLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ coopId, linkId, dto }: {
      coopId: string;
      linkId: string;
      dto: { remark?: string; effective_from?: string };
    }) => cooperationApi.updateProductLink(coopId, linkId, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cooperations', variables.coopId, 'product-links'] });
    },
  });
}
