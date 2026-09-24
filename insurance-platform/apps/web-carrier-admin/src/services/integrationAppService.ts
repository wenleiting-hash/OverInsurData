/**
 * 集成应用凭证管理 Service
 * 对接 /api/integration/apps 后端接口
 */
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/integration/apps',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth.access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface IntegrationApp {
  app_id: string;
  app_key: string;
  app_name: string;
  app_desc?: string;
  status: 'active' | 'disabled';
  ip_whitelist?: string;
  rate_limit: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  last_called_at?: string;
}

export interface AppWithSecret extends IntegrationApp {
  app_secret: string; // 仅创建/重置时返回一次
}

export interface CreateAppDto {
  appName: string;
  appDesc?: string;
  ipWhitelist?: string;
  rateLimit?: number;
}

export interface UpdateAppDto {
  appName?: string;
  appDesc?: string;
  ipWhitelist?: string;
  rateLimit?: number;
  status?: 'active' | 'disabled';
}

export const integrationAppService = {
  list: (page = 1, size = 20) =>
    apiClient.get('', { params: { page, size } }).then((r) => r.data),

  create: (dto: CreateAppDto) =>
    apiClient.post('', dto).then((r) => r.data),

  update: (id: string, dto: UpdateAppDto) =>
    apiClient.patch(`/${id}`, dto).then((r) => r.data),

  resetSecret: (id: string) =>
    apiClient.post(`/${id}/reset-secret`).then((r) => r.data),

  revealSecret: (id: string) =>
    apiClient.post(`/${id}/reveal-secret`).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/${id}`).then((r) => r.data),
};
