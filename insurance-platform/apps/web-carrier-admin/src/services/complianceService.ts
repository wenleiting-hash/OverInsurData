/**
 * Compliance React Query Hooks
 *
 * Provides typed hooks for compliance management operations.
 * Pure API driven — no mock fallback.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi } from '@/lib/user-api-client';

// ─── Query Keys ──────────────────────────────────────────────────────

export const complianceKeys = {
  all: ['compliance'] as const,
  dashboard: () => ['compliance', 'dashboard'] as const,
  rules: (params?: any) => ['compliance', 'rules', params] as const,
  ofac: (params?: any) => ['compliance', 'ofac', params] as const,
  interceptions: (params?: any) => ['compliance', 'interceptions', params] as const,
  licenses: (params?: any) => ['compliance', 'licenses', params] as const,
  licenseReminders: (params?: any) => ['compliance', 'license-reminders', params] as const,
  reports: (params?: any) => ['compliance', 'reports', params] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────

export function useComplianceDashboard() {
  return useQuery({
    queryKey: complianceKeys.dashboard(),
    queryFn: () => complianceApi.getDashboard(),
    staleTime: 30_000,
  });
}

export function useComplianceRules(params?: any) {
  return useQuery({
    queryKey: complianceKeys.rules(params),
    queryFn: () => complianceApi.getRules(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useOFACList(params?: any) {
  return useQuery({
    queryKey: complianceKeys.ofac(params),
    queryFn: () => complianceApi.getOFACList(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useInterceptions(params?: any) {
  return useQuery({
    queryKey: complianceKeys.interceptions(params),
    queryFn: () => complianceApi.getInterceptions(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useLicenses(params?: any) {
  return useQuery({
    queryKey: complianceKeys.licenses(params),
    queryFn: () => complianceApi.getLicenses(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useLicenseReminders(params?: any) {
  return useQuery({
    queryKey: complianceKeys.licenseReminders(params),
    queryFn: () => complianceApi.getLicenseReminders(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

export function useReports(params?: any) {
  return useQuery({
    queryKey: complianceKeys.reports(params),
    queryFn: () => complianceApi.getReports(params),
    staleTime: 30_000,
    placeholderData: (prev: any) => prev,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => complianceApi.createRule(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'rules'] }); },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => complianceApi.updateRule(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'rules'] }); },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceApi.deleteRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'rules'] }); },
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => complianceApi.toggleRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'rules'] }); },
  });
}

export function useScreenOFAC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => complianceApi.screenOFAC(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'ofac'] }); },
  });
}

export function useReviewOFAC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => complianceApi.reviewOFAC(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'ofac'] }); },
  });
}

export function useResolveInterception() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => complianceApi.resolveInterception(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'interceptions'] }); },
  });
}

export function useVerifyLicenses() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => complianceApi.verifyLicenses(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'licenses'] }); },
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => complianceApi.generateReport(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance', 'reports'] }); },
  });
}
