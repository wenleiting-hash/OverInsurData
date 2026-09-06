/**
 * User Management API Client
 * 
 * Provides TypeScript-typed methods for interacting with user management backend APIs
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Main user API client instance
 */
export const userApiClient = axios.create({
  baseURL: `${API_BASE_URL}/users`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
userApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth.access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * User account interface
 */
export interface UserAccount {
  id: string;
  username: string;
  name: string;
  nameEn?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dept: string;
  roles: string[];
  status: 'active' | 'inactive' | 'locked' | 'pending';
  authMethod: 'local' | 'sso' | 'ldap';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  remark?: string;
  remarkEn?: string;
}

/**
 * Create user DTO
 */
export interface CreateUserDto {
  username: string;
  password: string;
  name: string;
  nameEn?: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  dept: string;
  roles: string[];
  authMethod?: 'local' | 'sso' | 'ldap';
  status?: 'active' | 'inactive' | 'locked' | 'pending';
}

/**
 * Update user DTO (partial)
 */
export interface UpdateUserDto {
  name?: string;
  nameEn?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  dept?: string;
  roles?: string[];
  status?: 'active' | 'inactive' | 'locked' | 'pending';
  authMethod?: 'local' | 'sso' | 'ldap';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * User CRUD operations
 */
export const userApi = {
  /**
   * Get users with pagination and filters
   */
  async getUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
    statusFilter?: string;
    roleFilter?: string;
    deptFilter?: string;
  }): Promise<PaginatedResponse<UserAccount>> {
    const response = await userApiClient.get('/list', { params });
    return response.data;
  },

  /**
   * Get single user by ID
   */
  async getUserById(id: string): Promise<UserAccount> {
    const response = await userApiClient.get(`/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  async createUser(dto: CreateUserDto): Promise<UserAccount> {
    const response = await userApiClient.post('/', dto);
    return response.data;
  },

  /**
   * Update existing user
   */
  async updateUser(id: string, dto: UpdateUserDto): Promise<UserAccount> {
    const response = await userApiClient.put(`/${id}`, dto);
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    await userApiClient.delete(`/${id}`);
  },

  /**
   * Reset user password
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await userApiClient.post(`/${id}/reset-password`, { newPassword });
  },

  /**
   * Bulk import from CSV/Excel
   */
  async bulkImport(file: File): Promise<{ success: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await userApiClient.post('/bulk-import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Export users to CSV
   */
  async exportUsers(filters: any): Promise<Blob> {
    const response = await userApiClient.get('/export', { params: filters, responseType: 'blob' });
    return response.data;
  },
};
