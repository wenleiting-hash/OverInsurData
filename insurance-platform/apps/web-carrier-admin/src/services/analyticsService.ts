/**
 * Analytics React Query Hooks
 *
 * Provides typed hooks for data analytics operations.
 * Pure API driven — no mock fallback.
 */

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const analyticsKeys = {
  all: ['analytics'] as const,
  overview: (params?: any) => ['analytics', 'overview', params] as const,
  products: (params?: any) => ['analytics', 'products', params] as const,
  regional: (params?: any) => ['analytics', 'regional', params] as const,
  channels: (params?: any) => ['analytics', 'channels', params] as const,
  lossRatio: (params?: any) => ['analytics', 'loss-ratio', params] as const,
  renewal: (params?: any) => ['analytics', 'renewal', params] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────

export function useAnalyticsOverview(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.overview(params),
    queryFn: () => analyticsApi.getOverview(params),
    staleTime: 60_000,
  });
}

export function useAnalyticsProducts(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.products(params),
    queryFn: () => analyticsApi.getProducts(params),
    staleTime: 60_000,
  });
}

export function useAnalyticsRegional(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.regional(params),
    queryFn: () => analyticsApi.getRegional(params),
    staleTime: 60_000,
  });
}

export function useAnalyticsChannels(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.channels(params),
    queryFn: () => analyticsApi.getChannels(params),
    staleTime: 60_000,
  });
}

export function useAnalyticsLossRatio(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.lossRatio(params),
    queryFn: () => analyticsApi.getLossRatio(params),
    staleTime: 60_000,
  });
}

export function useAnalyticsRenewal(params?: any) {
  return useQuery({
    queryKey: analyticsKeys.renewal(params),
    queryFn: () => analyticsApi.getRenewal(params),
    staleTime: 60_000,
  });
}
