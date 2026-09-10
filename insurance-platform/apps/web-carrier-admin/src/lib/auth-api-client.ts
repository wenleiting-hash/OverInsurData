/**
 * Authentication API Client
 * 
 * Provides TypeScript-typed methods for interacting with authentication backend APIs
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Main auth API client instance
 */
export const authApiClient = axios.create({
  baseURL: '/api/auth', // Proxy to http://localhost:8080 via Vite config
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
authApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth.access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared refresh lock — dynamic import to avoid circular dependency
let _refreshMod: typeof import('./token-refresh') | null = null;
let _refreshLoadP: Promise<typeof import('./token-refresh')> | null = null;
function getRefreshModule(): Promise<typeof import('./token-refresh')> {
  if (_refreshMod) return Promise.resolve(_refreshMod);
  if (!_refreshLoadP) {
    _refreshLoadP = import('./token-refresh').then(m => { _refreshMod = m; return m; });
  }
  return _refreshLoadP;
}

// Response interceptor for error handling and auto-refresh token
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // The /refresh endpoint must NEVER trigger auto-refresh again: doing so would await the
    // in-flight refresh lock from inside the refresh request itself → deadlock (submit stuck).
    const isRefreshRequest = (originalRequest?.url || '').includes('/refresh');

    // If 401 Unauthorized and not already retrying and not the refresh call itself
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true; // Prevent infinite loop

      try {
        // Use shared refresh lock to prevent concurrent refresh race conditions
        const mod = await getRefreshModule();
        const newAccessToken = await mod.refreshAccessToken();

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authApiClient(originalRequest);

      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authApiClient;
