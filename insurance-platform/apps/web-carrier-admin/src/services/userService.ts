/**
 * User Management Services (React Query Hooks)
 * 
 * Provides reactive data fetching and mutations for user management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, type UserAccount, type CreateUserDto, type UpdateUserDto } from '@/lib/user-api-client';

/**
 * Hook: Get all users with pagination and filters
 */
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
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook: Get single user by ID
 */
export const useGetUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userApi.getUserById(userId),
    enabled: !!userId,
    staleTime: 60000,
  });
};

/**
 * Hook: Create new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: CreateUserDto) => userApi.createUser(dto),
    onSuccess: () => {
      // Invalidate and refetch user list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook: Update existing user
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUserDto }) => userApi.updateUser(id, dto),
    onSuccess: (_, { id }) => {
      // Invalidate both list and specific user
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

/**
 * Hook: Delete user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook: Reset user password
 */
export const useResetPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) => 
      userApi.resetPassword(id, newPassword),
    onSuccess: (_, { id }) => {
      // Invalidate user details
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
};

/**
 * Hook: Bulk import users
 */
export const useBulkImportUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (file: File) => userApi.bulkImport(file),
    onSuccess: () => {
      // Invalidate user list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook: Export users
 */
export const useExportUsers = () => {
  return useMutation({
    mutationFn: (filters: any) => userApi.exportUsers(filters),
    // No invalidation needed - export is read-only
  });
};
