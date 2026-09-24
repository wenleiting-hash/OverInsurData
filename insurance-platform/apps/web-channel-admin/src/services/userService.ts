/**
 * User Management Services (React Query Hooks)
 *
 * Provides reactive data fetching and mutations for user and role management.
 * Aligned with unified Auth Schema V5 backend.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userApi,
  type UserAccount,
  type CreateUserDto,
  type UpdateUserDto,
  type RoleInfo,
  type DepartmentInfo,
} from '@/lib/user-api-client';

// ─── User Hooks ───────────────────────────────────────────────────────

/** Hook: Get all users with pagination and filters */
export const useGetUsers = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: string;
  roleFilter?: string;
  deptFilter?: string;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getUsers({ page: 1, pageSize: 20, ...params }),
    staleTime: 30000,
  });
};

/** Hook: Get single user by UUID */
export const useGetUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUserById(userId),
    enabled: !!userId,
    staleTime: 60000,
  });
};

/** Hook: Create new user */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateUserDto) => userApi.createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/** Hook: Update existing user */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => userApi.updateUser(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

/** Hook: Delete user (soft) */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/** Hook: Reset user password */
export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      userApi.resetPassword(id, newPassword),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/** Hook: Toggle user status */
export const useToggleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' | 'locked' }) =>
      userApi.toggleStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

// ─── Role Hooks ───────────────────────────────────────────────────────

/** Hook: Get all roles */
export const useGetRoles = () => {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => userApi.getRoles(),
    staleTime: 60000,
  });
};

/** Hook: Create role */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof userApi.createRole>[0]) => userApi.createRole(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/** Hook: Update role */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleKey, dto }: { roleKey: string; dto: Parameters<typeof userApi.updateRole>[1] }) =>
      userApi.updateRole(roleKey, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/** Hook: Delete role */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleKey: string) => userApi.deleteRole(roleKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// ─── Department Hooks ─────────────────────────────────────────────────

/** Hook: Get all departments */
export const useGetDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: () => userApi.getDepartments(),
    staleTime: 120000, // Departments rarely change
  });
};
