/**
 * Department React Query Hooks
 *
 * Provides typed hooks for department CRUD operations with automatic cache invalidation.
 * Follows the same pattern as userService.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  departmentApi,
  type DepartmentTreeNode,
  type DepartmentDetail,
  type CreateDepartmentDto,
  type UpdateDepartmentDto,
  type PaginatedResponse,
  type UserAccount,
} from '@/lib/user-api-client';

// ─── Query Hooks ─────────────────────────────────────────────────────

/** Hook: Get department tree structure */
export function useGetDepartmentTree() {
  return useQuery<DepartmentTreeNode[]>({
    queryKey: ['department-tree'],
    queryFn: () => departmentApi.getTree(),
    staleTime: 30_000,
  });
}

/** Hook: Get single department detail */
export function useGetDepartmentDetail(deptId: number | null) {
  return useQuery<DepartmentDetail>({
    queryKey: ['department', deptId],
    queryFn: () => departmentApi.getById(deptId!),
    enabled: !!deptId,
    staleTime: 15_000,
  });
}

/** Hook: Get department members (paginated) */
export function useGetDepartmentMembers(deptId: number | null, params?: { page?: number; pageSize?: number }) {
  return useQuery<PaginatedResponse<UserAccount>>({
    queryKey: ['department-members', deptId, params],
    queryFn: () => departmentApi.getMembers(deptId!, params),
    enabled: !!deptId,
    staleTime: 15_000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────

/** Hook: Create department */
export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDepartmentDto) => departmentApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-tree'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

/** Hook: Update department */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateDepartmentDto }) => departmentApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['department-tree'] });
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}

/** Hook: Delete department */
export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-tree'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
