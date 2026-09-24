/**
 * Channel Product Authorization React Query Hooks — V1.0.11 (doc ch.10)
 *
 * Channel master + product authorizations + issuance permissions/limits.
 * Keys live under a standalone 'channel-authorizations' root (independent of
 * the upstream-insurer cooperation domain, per the 2026-09-12 scope decision).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  channelAuthApi,
  type ChannelOrg,
  type ChannelAuthorization,
  type AuthorizationListParams,
  type CreateAuthorizationPayload,
  type IssuancePermissionPayload,
} from '@/lib/user-api-client';

export const channelAuthKeys = {
  all: ['channel-authorizations'] as const,
  channels: (params?: { status?: string; q?: string }) =>
    ['channel-authorizations', 'channels', params] as const,
  list: (params?: AuthorizationListParams) =>
    ['channel-authorizations', 'list', params] as const,
  detail: (id: string) => ['channel-authorizations', 'detail', id] as const,
};

// ─── Channels ────────────────────────────────────────────────────────

export function useChannels(params?: { status?: string; q?: string }) {
  return useQuery<ChannelOrg[]>({
    queryKey: channelAuthKeys.channels(params),
    queryFn: () => channelAuthApi.getChannels(params),
    staleTime: 60_000,
  });
}

// ─── Authorizations ──────────────────────────────────────────────────

export function useAuthorizations(params?: AuthorizationListParams) {
  return useQuery<ChannelAuthorization[]>({
    queryKey: channelAuthKeys.list(params),
    queryFn: () => channelAuthApi.listAuthorizations(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useCreateAuthorization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAuthorizationPayload) => channelAuthApi.createAuthorization(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.all });
    },
  });
}

export function useUpdateAuthorization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: {
      id: string
      dto: Partial<Omit<CreateAuthorizationPayload, 'expiration_date'>> & { expiration_date?: string | null }
    }) => channelAuthApi.updateAuthorization(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.all });
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.detail(variables.id) });
    },
  });
}

export function useSetAuthorizationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      id: string; action: 'revoke' | 'renew';
      reason?: string; expiration_date?: string;
    }) => channelAuthApi.setAuthorizationStatus(vars.id, vars.action, {
      reason: vars.reason, expiration_date: vars.expiration_date,
    }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.all });
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.detail(variables.id) });
    },
  });
}

// ─── Issuance permissions & limits ───────────────────────────────────

export function useUpsertPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: IssuancePermissionPayload }) =>
      channelAuthApi.upsertPermission(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.all });
      queryClient.invalidateQueries({ queryKey: channelAuthKeys.detail(variables.id) });
    },
  });
}
