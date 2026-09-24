/**
 * Finance React Query Hooks — V1.0.13 财务结算
 *
 * 范围：我方平台 ↔ 上游保司。账单/对账单均为文件在浏览器解析后 rows JSON 提交，
 * 后端仅做原件归档 + 逐行校验入库 + 对账比对 + 差异闭环。
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
  billErrors: (id: string) => ['finance', 'bills', id, 'errors'] as const,
  templates: (params?: any) => ['finance', 'mapping-templates', params] as const,
  statements: (params?: any) => ['finance', 'statements', params] as const,
  statementDetail: (id: string) => ['finance', 'statements', id] as const,
  statementLines: (id: string, params?: any) => ['finance', 'statements', id, 'lines', params] as const,
  runs: (params?: any) => ['finance', 'runs', params] as const,
  runDetail: (id: string) => ['finance', 'runs', id] as const,
  diffs: (params?: any) => ['finance', 'diffs', params] as const,
  diffStats: (params?: any) => ['finance', 'diff-stats', params] as const,
  insurerConfigs: () => ['finance', 'insurer-configs'] as const,
  commissionRates: (params?: any) => ['finance', 'commission-rates', params] as const,
  rateVersions: (params?: any) => ['finance', 'rate-versions', params] as const,
};

const STALE = 30_000;

// ─── Query Hooks ─────────────────────────────────────────────────────

export function useFinanceStats() {
  return useQuery({ queryKey: financeKeys.stats(), queryFn: () => financeApi.getStats(), staleTime: STALE });
}

export function useFinanceBills(params?: any) {
  return useQuery({
    queryKey: financeKeys.bills(params),
    queryFn: () => financeApi.getBills(params),
    staleTime: STALE,
    placeholderData: (prev: any) => prev,
  });
}

export function useBillDetail(id: string | null) {
  return useQuery({
    queryKey: financeKeys.billDetail(id!),
    queryFn: () => financeApi.getBillDetail(id!),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useBillLines(id: string | null, params?: any) {
  return useQuery({
    queryKey: financeKeys.billLines(id!, params),
    queryFn: () => financeApi.getBillLines(id!, params),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useBillErrors(id: string | null) {
  return useQuery({
    queryKey: financeKeys.billErrors(id!),
    queryFn: () => financeApi.getBillErrors(id!),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useMappingTemplates(params?: any) {
  return useQuery({
    queryKey: financeKeys.templates(params),
    queryFn: () => financeApi.getMappingTemplates(params),
    staleTime: STALE,
  });
}

export function useStatements(params?: any) {
  return useQuery({
    queryKey: financeKeys.statements(params),
    queryFn: () => financeApi.getStatements(params),
    staleTime: STALE,
    placeholderData: (prev: any) => prev,
  });
}

export function useStatementDetail(id: string | null) {
  return useQuery({
    queryKey: financeKeys.statementDetail(id!),
    queryFn: () => financeApi.getStatementDetail(id!),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useStatementLines(id: string | null, params?: any) {
  return useQuery({
    queryKey: financeKeys.statementLines(id!, params),
    queryFn: () => financeApi.getStatementLines(id!, params),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useReconciliationRuns(params?: any) {
  return useQuery({
    queryKey: financeKeys.runs(params),
    queryFn: () => financeApi.getRuns(params),
    staleTime: STALE,
    placeholderData: (prev: any) => prev,
  });
}

export function useRunDetail(id: string | null) {
  return useQuery({
    queryKey: financeKeys.runDetail(id!),
    queryFn: () => financeApi.getRunDetail(id!),
    enabled: !!id,
    staleTime: STALE,
  });
}

export function useDiffs(params?: any) {
  return useQuery({
    queryKey: financeKeys.diffs(params),
    queryFn: () => financeApi.getDiffs(params),
    staleTime: STALE,
    placeholderData: (prev: any) => prev,
  });
}

export function useDiffStats(params?: any) {
  return useQuery({
    queryKey: financeKeys.diffStats(params),
    queryFn: () => financeApi.getDiffStats(params),
    staleTime: STALE,
  });
}

export function useInsurerConfigs() {
  return useQuery({
    queryKey: financeKeys.insurerConfigs(),
    queryFn: () => financeApi.getInsurerConfigs(),
    staleTime: 60_000,
  });
}

export function useCommissionRates(params?: any) {
  return useQuery({
    queryKey: financeKeys.commissionRates(params),
    queryFn: () => financeApi.getCommissionRates(params),
    staleTime: STALE,
    placeholderData: (prev: any) => prev,
  });
}

export function useRateVersions(params?: any) {
  return useQuery({
    queryKey: financeKeys.rateVersions(params),
    queryFn: () => financeApi.getRateVersions(params),
    enabled: !!(params?.carrier_id),
    staleTime: STALE,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

export function useImportBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.importBill(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'bills'] }),
  });
}

export function useSaveMappingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) =>
      dto.template_id ? financeApi.updateMappingTemplate(dto.template_id, dto) : financeApi.saveMappingTemplate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'mapping-templates'] }),
  });
}

export function useDeleteMappingTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.deleteMappingTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'mapping-templates'] }),
  });
}

export function useImportStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.importStatement(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'statements'] }),
  });
}

export function useAdjustStatementLine(statementId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lineId, dto }: { lineId: string; dto: any }) =>
      financeApi.adjustStatementLine(statementId, lineId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'statements', statementId] });
      qc.invalidateQueries({ queryKey: ['finance', 'statements'] });
    },
  });
}

export function useConfirmStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.confirmStatement(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['finance', 'statements'] });
      qc.invalidateQueries({ queryKey: ['finance', 'statements', id] });
    },
  });
}

export function useStartReconciliation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.startReconciliation(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'runs'] });
      qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
      qc.invalidateQueries({ queryKey: ['finance', 'diffs'] });
      qc.invalidateQueries({ queryKey: ['finance', 'diff-stats'] });
      qc.invalidateQueries({ queryKey: financeKeys.stats() });
    },
  });
}

export function useDiffAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financeApi.diffAction(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'diffs'] });
      qc.invalidateQueries({ queryKey: ['finance', 'diff-stats'] });
      qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
      qc.invalidateQueries({ queryKey: ['finance', 'runs'] });
    },
  });
}

export function useRecalcDiff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.recalcDiff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'diffs'] });
      qc.invalidateQueries({ queryKey: ['finance', 'diff-stats'] });
      qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
    },
  });
}

export function useAddFollowUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => financeApi.addFollowUp(id, { note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'diffs'] });
      qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
      qc.invalidateQueries({ queryKey: ['finance', 'runs'] });
    },
  });
}

export function useUpsertProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ configId, dto }: { configId: string; dto: any }) => financeApi.upsertProfile(configId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: financeKeys.insurerConfigs() }),
  });
}

export function useCreateCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.createCommissionRate(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'commission-rates'] }),
  });
}

export function useUpdateCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financeApi.updateCommissionRate(id, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'commission-rates'] }),
  });
}

export function useDeleteCommissionRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.deleteCommissionRate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'commission-rates'] }),
  });
}

/** V1.0.16 批量置失效佣金率。 */
export function useBatchDeleteCommissionRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => financeApi.batchDeleteCommissionRates(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'commission-rates'] }),
  });
}

// ─── V1.0.15 批次生命周期 ────────────────────────────────────────────

export function usePrecheckBill() {
  return useMutation({ mutationFn: (dto: any) => financeApi.precheckBill(dto) });
}

function invalidateBillTree(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: ['finance', 'bills'] });
  if (id) qc.invalidateQueries({ queryKey: ['finance', 'bills', id] });
}

export function useReconcileBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.reconcileBill(id),
    onSuccess: (_d, id) => invalidateBillTree(qc, id),
  });
}

export function useCompleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto?: { note?: string } }) => financeApi.completeBill(id, dto),
    onSuccess: (_d, v) => invalidateBillTree(qc, v.id),
  });
}

export function useUnlockBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.unlockBill(id),
    onSuccess: (_d, id) => invalidateBillTree(qc, id),
  });
}

export function useVoidBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeApi.voidBill(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'bills'] }),
  });
}

/** V1.0.16 批量作废批次。 */
export function useBatchVoidBills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => financeApi.batchVoidBills(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'bills'] }),
  });
}

// ─── V1.0.15 佣金率批量导入 / 试算 ───────────────────────────────────

export function usePrecheckCommissionRates() {
  return useMutation({ mutationFn: (dto: any) => financeApi.precheckCommissionRates(dto) });
}

export function useImportCommissionRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: any) => financeApi.importCommissionRates(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['finance', 'commission-rates'] }),
  });
}

export function useTrialCommissionRate() {
  return useMutation({ mutationFn: (dto: any) => financeApi.trialCommissionRate(dto) });
}

export { financeApi };
