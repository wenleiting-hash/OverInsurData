/**
 * I18n Translation Services (React Query Hooks)
 *
 * Provides hooks for fetching and mutating i18n translations.
 * Connects to /api/ovwr/i18n/translations endpoint.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const i18nApiClient = axios.create({
  baseURL: '/api/ovwr/i18n/translations',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor for auth tokens
i18nApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth.access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Types ───────────────────────────────────────────────────

export interface TranslationEntry {
  ovwr_translation_id: string;
  ovwr_namespace: string;
  ovwr_key: string;
  ovwr_en_us: string | null;
  ovwr_zh_cn: string | null;
  ovwr_type: string;
  ovwr_module: string | null;
  ovwr_section: string | null;
  ovwr_status: string;
  ovwr_metadata: any;
  ovwr_created_at: string;
  ovwr_updated_at: string;
}

export interface TranslationListResponse {
  success: boolean;
  data: {
    total: number;
    pages: number;
    page: number;
    pageSize: number;
    data: TranslationEntry[];
  };
}

// ─── API Methods ─────────────────────────────────────────────

export const i18nApi = {
  async getTranslations(params?: {
    namespace?: string;
    module?: string;
    search?: string;
    type?: string;
    page?: number;
    pageSize?: number;
  }): Promise<TranslationListResponse['data']> {
    const response = await i18nApiClient.get('/', { params });
    return response.data.data;
  },

  async getTranslation(id: string): Promise<TranslationEntry> {
    const response = await i18nApiClient.get(`/${id}`);
    return response.data.data;
  },

  async createTranslation(dto: {
    ovwrNamespace: string;
    ovwrKey: string;
    ovwrEnUS: string;
    ovwrZhCN?: string;
    ovwrType?: string;
    ovwrModule?: string;
    ovwrSection?: string;
  }): Promise<TranslationEntry> {
    const response = await i18nApiClient.post('/', dto);
    return response.data.data;
  },

  async updateTranslation(id: string, dto: {
    ovwrEnUS?: string;
    ovwrZhCN?: string;
    ovwrType?: string;
    ovwrModule?: string;
    ovwrSection?: string;
  }): Promise<TranslationEntry> {
    const response = await i18nApiClient.patch(`/${id}`, dto);
    return response.data.data;
  },

  async deleteTranslation(id: string): Promise<void> {
    await i18nApiClient.delete(`/${id}`);
  },
};

// ─── React Query Hooks ──────────────────────────────────────

export const useGetTranslations = (params?: {
  namespace?: string;
  module?: string;
  search?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['i18n-translations', params],
    queryFn: () => i18nApi.getTranslations(params),
    staleTime: 30000,
  });
};

export const useUpdateTranslation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Parameters<typeof i18nApi.updateTranslation>[1] }) =>
      i18nApi.updateTranslation(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['i18n-translations'] });
    },
  });
};

export const useCreateTranslation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: Parameters<typeof i18nApi.createTranslation>[0]) =>
      i18nApi.createTranslation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['i18n-translations'] });
    },
  });
};

export const useDeleteTranslation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => i18nApi.deleteTranslation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['i18n-translations'] });
    },
  });
};
