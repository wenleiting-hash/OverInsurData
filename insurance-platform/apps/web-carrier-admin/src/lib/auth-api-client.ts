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

// Response interceptor for error handling and auto-refresh token
authApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loop

      try {
        // Attempt to refresh token using refresh token stored in localStorage
        const refreshToken = localStorage.getItem('auth.refresh_token');
        
        if (!refreshToken) {
          // No refresh token available - force logout
          console.error('No refresh token available, forcing logout');
          localStorage.removeItem('auth.access_token');
          localStorage.removeItem('auth.refresh_token');
          localStorage.removeItem('auth.user_info');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Call refresh endpoint
        const refreshResponse = await authApiClient.post('/refresh', {
          refreshToken,
        });

        const { accessToken } = refreshResponse.data.data;

        // Save new access token
        localStorage.setItem('auth.access_token', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return authApiClient(originalRequest);

      } catch (refreshError: any) {
        // Refresh failed → force logout
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('auth.access_token');
        localStorage.removeItem('auth.refresh_token');
        localStorage.removeItem('auth.user_info');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default authApiClient;
