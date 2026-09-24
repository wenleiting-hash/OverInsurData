import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authApiClient from '../lib/auth-api-client';
import { userApiClient } from '../lib/user-api-client';
import { refreshAccessToken } from '../lib/token-refresh';

// TypeScript types
export interface User {
  userId: string;
  username: string;
  email?: string;
  roles: string[];
  authMethod?: string;
  /** @deprecated use roles array */
  role?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

// Create context with undefined (will be provided by provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUserLanguagePreference = async (userId: string) => {
    try {
      const res = await userApiClient.get('/users/preferences/current');
      const langCode = res.data?.data?.ovwr_language_code;
      if (langCode && ['en-US', 'zh-CN'].includes(langCode)) {
        // Dynamic import to avoid circular dependency with i18n config
        const i18nModule = await import('../i18n/config');
        const i18n = i18nModule.default as any;
        if (i18n?.language !== langCode) {
          await i18n.changeLanguage(langCode);
        }
        localStorage.setItem('user_language', langCode);
        localStorage.setItem(`user_language_${userId}`, langCode);
      }
    } catch (error) {
      console.warn('Failed to load user language preference:', error);
    }
  };

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const jwtToken = localStorage.getItem('auth.access_token');
      const userDataStr = localStorage.getItem('auth.user_info');

      if (jwtToken && userDataStr && userDataStr !== 'undefined' && userDataStr !== 'null') {
        const user: User = JSON.parse(userDataStr);
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
        loadUserLanguagePreference(user.userId);
      } else {
        // Clear stale/invalid tokens
        localStorage.removeItem('auth.access_token');
        localStorage.removeItem('auth.refresh_token');
        localStorage.removeItem('auth.user_info');
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      // Clear corrupted data
      localStorage.removeItem('auth.access_token');
      localStorage.removeItem('auth.refresh_token');
      localStorage.removeItem('auth.user_info');
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  // Login function - calls backend API and updates local state
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const response = await authApiClient.post('/login', credentials);
      
      const { accessToken, refreshToken, user: userData } = response.data.data;

      // Store tokens and user info
      localStorage.setItem('auth.access_token', accessToken);
      localStorage.setItem('auth.refresh_token', refreshToken);
      localStorage.setItem('auth.user_info', JSON.stringify(userData));

      // Update state
      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
      });

      // Load user's language preference from backend
      loadUserLanguagePreference(userData.userId);
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('用户名或密码错误');
      } else if (error.response?.status === 400) {
        throw new Error('请求参数无效，请检查输入');
      } else if (error.response?.status === 403) {
        const msg = error.response?.data?.message || '';
        if (msg.includes('locked')) {
          throw new Error('账户已锁定，请稍后再试');
        } else if (msg.includes('deactivated') || msg.includes('inactive')) {
          throw new Error('账户已停用，请联系管理员');
        } else if (msg.includes('pending')) {
          throw new Error('账户待激活，请验证邮箱');
        }
        throw new Error(msg || '访问被拒绝');
      } else {
        throw new Error('网络错误，请稍后再试');
      }
    }
  };

  // Logout function - invalidates refresh token and clears local state
  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('auth.refresh_token');
      if (refreshToken) {
        await authApiClient.post('/logout', {});
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Clear local storage and state regardless of API success/failure
      localStorage.removeItem('auth.access_token');
      localStorage.removeItem('auth.refresh_token');
      localStorage.removeItem('auth.user_info');
      
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Refresh access token function (uses shared lock to prevent concurrent refresh races)
  const refreshToken = async (): Promise<void> => {
    try {
      await refreshAccessToken();
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      if (error.response?.status === 401) {
        await logout();
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
