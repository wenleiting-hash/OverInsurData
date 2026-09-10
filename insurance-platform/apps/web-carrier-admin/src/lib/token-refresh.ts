/**
 * Shared Token Refresh Lock
 *
 * Prevents concurrent refresh token requests that cause "Refresh token revoked or expired"
 * warnings on the backend. The backend uses one-time-use refresh tokens (deleted after
 * verification), so concurrent refresh attempts with the same token will fail.
 *
 * This module provides a singleton promise lock: when multiple 401 errors occur
 * simultaneously, only the first triggers an actual /refresh call; subsequent callers
 * await the same promise and reuse the resulting access token.
 */

import { authApiClient } from './auth-api-client';

/** Currently in-flight refresh promise — null means no refresh is pending */
let refreshPromise: Promise<string> | null = null;

/**
 * Perform a token refresh with a shared lock.
 *
 * - If no refresh is in-flight, start one and store the promise.
 * - If a refresh is already in-flight, await the existing promise.
 * - On success, the new access token is saved to localStorage and returned.
 * - On failure, auth state is cleared and the user is redirected to /login.
 */
export function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<string> => {
    try {
      const refreshToken = localStorage.getItem('auth.refresh_token');

      if (!refreshToken) {
        clearAuthAndRedirect();
        throw new Error('No refresh token available');
      }

      const refreshResponse = await authApiClient.post('/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

      // Save new tokens
      localStorage.setItem('auth.access_token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('auth.refresh_token', newRefreshToken);
      }

      return accessToken;
    } catch (err) {
      clearAuthAndRedirect();
      throw err;
    } finally {
      // Always release the lock so future 401s can trigger a new refresh
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function clearAuthAndRedirect(): void {
  localStorage.removeItem('auth.access_token');
  localStorage.removeItem('auth.refresh_token');
  localStorage.removeItem('auth.user_info');
  // Avoid redirect loop: only redirect if not already on login page
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}
